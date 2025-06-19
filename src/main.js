require('module-alias/register');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { setupConnectHandler } = require('./ipc/connectHandler');
const browserApi = require('./service/browserApi');

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    watch: [
        path.join(__dirname, './renderer'),
        __dirname
    ]
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
           contextIsolation: true,
           preload: path.join(__dirname, 'preload.js')
        }
    });
     win.on('close', async (e) => {
        const choice = require('electron').dialog.showMessageBoxSync(win, {
            type: 'question',
            buttons: ['Huỷ', 'Thoát'],
            defaultId: 1,
            title: 'Xác nhận',
            message: 'Bạn có chắc muốn thoát ứng dụng?'
        });

        if (choice === 0) {
            e.preventDefault(); // Ngăn không cho đóng nếu chọn "Huỷ"
        }
        const array = [...browserApi.profileContext];
        await browserApi.close(array[0])
        await browserApi.close(array[1])
        await browserApi.close(array[2]);
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
};

app.whenReady().then(() => {
    try {
        createWindow();
        setupConnectHandler(ipcMain);
        console.log("✅ Listening for events...");
    } catch (err) {
        console.error("❌ Lỗi khi khởi tạo app:", err);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
