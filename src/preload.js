const { contextBridge, ipcRenderer } = require("electron");


console.log("✅ Preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {

  sendConnectData: async (data) => await ipcRenderer.invoke("connect-data", data),
  getCache:async  () => await ipcRenderer.invoke("load-data-cache"), 

});