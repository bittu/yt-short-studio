const { app, BrowserWindow, session, ipcMain, autoUpdater } = require('electron');
const path = require('path');
const log = require('electron-log')
const IPC = require('./ipc')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const server = 'https://hazel-pink-six.vercel.app'
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })

setInterval(() => {
  autoUpdater.checkForUpdates()
}, 60000)

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', (message) => {
  log.error('There was a problem updating the application')
  log.error(message)
})

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
    details.responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];
    // details.responseHeaders['Content-Security-Policy'] = ["default-src 'self'; media-src 'self'"];
    callback({ responseHeaders: details.responseHeaders });
  });

  const ipc = new IPC(mainWindow);

  ipcMain.handle('analyse', ipc.getYtBasicInfo)
  ipcMain.handle('process', ipc.process)
  ipcMain.handle('getFileBlobData', ipc.getFileBlobData)
  ipcMain.handle('killProcesses', ipc.killProcesses)

  log.info('Main Window created')
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  log.info('main::', MAIN_WINDOW_WEBPACK_ENTRY)

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
