const { app, webContents } = require('electron')
const ytdl = require('ytdl-core')
const fs = require('fs/promises')
const path = require('path')
const log = require('electron-log')
const { createWriteStream, existsSync, mkdirSync, read } = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const fsExtra = require('fs-extra')
const nanoid = require('nanoid')
const Store = require('electron-store');
const os = require("os");

const store = new Store();

const userHomeDir = os.homedir();
const outputFolder = path.join(userHomeDir, 'Downloads', 'ytshortstudio');
const subclipDuration = 50;

class IPC {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;

    if (!existsSync(outputFolder)) {
      log.info('main::ipc::outputFolder created', outputFolder, this.isCacheEnabled())
      mkdirSync(outputFolder)
    } else {
      log.info('main::ipc::outputFolder exists', outputFolder, this.isCacheEnabled())
      if (!this.isCacheEnabled()) {
        fsExtra.emptyDirSync(outputFolder)
      }
    }
  }

  processes = {};

  isCacheEnabled = () => {
    return store.get('cacheEnabled', true);
  }

  setCacheEnabled = (event, bool) => {
    store.set('cacheEnabled', bool);
    this.mainWindow.webContents.send('cache-enabled', bool)
  }

  deleteCache = () => {
    fsExtra.emptyDirSync(outputFolder)
  }

  getYtBasicInfo = async (_event, url) => {
    log.info('main::ipc::getYtBasicInfo', url)
    try {
      return ytdl.getBasicInfo(url)
    } catch (e) {
      console.error(e)
    }
  }

  downloadFromYt = (url) => {
    return new Promise(async (resolve) => {
      const info = await ytdl.getInfo(url)
      const stream = createWriteStream(path.join(outputFolder, `${info.videoDetails.videoId}.mp4`));
      let format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
      log.info('main::ipc::downloadFromYt::format', format)
      ytdl(url, { format }).pipe(stream);
      stream.on('finish', () => resolve(stream.path))
    })
  }

  process = async (_event, url) => {
    const that = this
    if (!this.isCacheEnabled()) {
      fsExtra.emptyDirSync(outputFolder)
    }
    that.killProcesses()
    that.mainWindow.webContents.send('update-progress', {
      type: 'progress',
      log: 'download started'
    }, Date.now())
    const filePath = await that.downloadFromYt(url);
    log.info('main::ipc::process::filepath', filePath)
    that.mainWindow.webContents.send('update-progress', {
      type: 'progress',
      log: 'download done: ' + filePath,
      // main: filePath
    }, Date.now())

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log.error('Error getting video duration:', err);
        return;
      }
      const totalDuration = metadata.format.duration;
      log.info('renderer::Analyse::process::totalDuration', totalDuration)
      const n = Math.floor(totalDuration / subclipDuration);
      log.info('renderer::Analyse::process::n', n)

      for (let i = 0; i < n; i++) {
        const startTime = i * subclipDuration;
        // const endTime = startTime + subclipDuration;
        const outputFileName = `${path.basename(filePath, '.mp4')}_subclip_${i + 1}.mp4`;
        const outputPath = path.join(outputFolder, outputFileName);
        const pid = nanoid.nanoid();

        that.processes[pid] = ffmpeg(filePath)
          .seek(startTime)
          .duration(subclipDuration)
          .videoFilters(["crop=ih*(9/16):ih"])
          .output(outputPath)
          .on('start', function(commandLine) {
            log.info('Spawned Ffmpeg with command: ' + commandLine);
            that.mainWindow.webContents.send('update-progress', {
              type: 'progress',
              log: 'short generation started for ' + outputFileName,
              data: {
                name: outputFileName,
                status: 'started'
              }
            }, Date.now())
          })
          .on('progress', function({ frames, currentFps, currentKbps, targetSize, timemark, percent }) {
            log.info(`progress: ${outputFileName} frames: ${frames}, currentFps: ${currentFps}, currentKbps: ${currentKbps}, targetSize: ${targetSize}, timemark: ${timemark}, percent: ${percent}`);
            that.mainWindow.webContents.send('update-progress', {
              type: 'progress',
              log: 'short generation progress for ' + outputFileName,
              data: {
                name: outputFileName,
                percent,
                status: 'progress'
              }
            }, Date.now())
          })
          .on('end', () => {
            log.info(`Sub-clip ${i + 1} generated successfully: ${outputPath}`);
            that.mainWindow.webContents.send('update-progress', {
              type: 'progress',
              log: 'short generation end for ' + outputFileName,
              data: {
                name: outputFileName,
                status: 'end',
                outputPath
              }
            }, Date.now())
            delete that.processes[pid]
          })
          .on('error', (err) => {
            log.error(`Error generating sub-clip ${i + 1}:`, err);
            that.mainWindow.webContents.send('update-progress', {
              type: 'progress',
              log: 'short generation error for ' + outputFileName,
              data: {
                name: outputFileName,
                status: 'error'
              }
            }, Date.now())
            delete that.processes[pid]
          })
          .run();
      }
    });
  }

  killProcesses = () => {
    const that = this;
    Object.keys(that.processes).forEach(pid => {
      if (that.processes[pid]) {
        that.processes[pid].kill()
      }
      delete that.processes[pid]
    })
  }

  getFileBlobData = (_event, filePath) => {
    return fs.readFile(filePath)
  }
}

module.exports = IPC