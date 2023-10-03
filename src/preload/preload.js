// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  analyse: (url) => ipcRenderer.invoke('analyse', url),
  downloadYt: (url) => ipcRenderer.invoke('downloadYt', url),
  process: (url) => ipcRenderer.invoke('process', url),
  getFileBlobData: (filePath) => ipcRenderer.invoke('getFileBlobData', filePath),
  killProcesses: (filePath) => ipcRenderer.invoke('killProcesses', filePath),
  setCacheEnabled: (bool) => ipcRenderer.invoke('setCacheEnabled', bool),
  isCacheEnabled: () => ipcRenderer.invoke('isCacheEnabled'),
  deleteCache: () => ipcRenderer.invoke('deleteCache'),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
  onCacheEnabled: (callback) => ipcRenderer.on('cache-enabled', callback),
})