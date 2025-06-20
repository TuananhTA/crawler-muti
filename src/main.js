
const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { setupConnectHandler } = require("./ipc/connectHandler");
const browserApi = require("./service/browserApi");

const productQueueInstance = require('./hepler/ProductQueue');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.on("close", async (e) => {
    const choice = require("electron").dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Huỷ", "Thoát"],
      defaultId: 1,
      title: "Xác nhận",
      message: "Bạn có chắc muốn thoát ứng dụng?",
    });

    if (choice === 0) {
      e.preventDefault(); // Ngăn không cho đóng nếu chọn "Huỷ"
    }
    try {
      e.preventDefault()
      await browserApi.closeAll();
      win.destroy();
    } catch (error) {
      console.error("Lỗi khi đóng profiles:", error);
      win.destroy(); // Vẫn đóng window trong trường hợp có lỗi
    }
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  return win;
};

app.whenReady().then(() => {
  try {
    const win = createWindow();
    setupConnectHandler(ipcMain);

    productQueueInstance.onPush((product) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('new-product', product);
        }
    });
    console.log("✅ Listening for events...");
  } catch (err) {
    console.error("❌ Lỗi khi khởi tạo app:", err);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
