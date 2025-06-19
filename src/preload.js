const { contextBridge, ipcRenderer } = require("electron");


console.log("✅ Preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {

  sendConnectData: async (data) => await ipcRenderer.invoke("connect-data", data),
  getCache:async  () => await ipcRenderer.invoke("load-data-cache"), 
  search: async ( keyword ) => await ipcRenderer.invoke("search-products", keyword),
  loadMore: async () => await ipcRenderer.invoke("load-more"),

  onNewProduct: (callback) => {
    ipcRenderer.on('new-product', (event, data) => {

      console.log("📦 New product received in preload:", data);

      callback(data);

    });
  }

});