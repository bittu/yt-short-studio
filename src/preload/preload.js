// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  analyse: (url) => ipcRenderer.invoke('analyse', url),
  downloadYt: (url) => ipcRenderer.invoke('downloadYt', url),
  process: (url) => ipcRenderer.invoke('process', url),
  getFileBlobData: (filePath) => ipcRenderer.invoke('getFileBlobData', filePath),
  killProcesses: (filePath) => ipcRenderer.invoke('killProcesses', filePath),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback)
})