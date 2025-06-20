const { contextBridge, ipcRenderer } = require("electron");


console.log("✅ Preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {

  sendConnectData: async (data) => await ipcRenderer.invoke("connect-data", data),
  getCache:async  () => await ipcRenderer.invoke("load-data-cache"), 
  search: async ( data ) => await ipcRenderer.invoke("search-products", data),
  loadMore: async (data) => await ipcRenderer.invoke("load-more", data),
  getDetails: async (data) => await ipcRenderer.invoke("get-details", data),
  getPlatforms: async () => await ipcRenderer.invoke("load-platforms"),

  downloadImageAsJpg: async (data) => await ipcRenderer.invoke("download-image-as-jpg", data),
  downloadMultiImagesAsJpg: async (data) => await ipcRenderer.invoke("download-multi-images-as-jpg", data),

  onNewProduct: (callback) => {
    ipcRenderer.on('new-product', (event, data) => {
      callback(data);

    });
  }

});