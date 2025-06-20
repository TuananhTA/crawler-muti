const cacheContext = require('../service/readCache');
const browserApi = require('../service/browserApi');
const browserContext = require('../crawler/browser');
const { tiktokCrawler, etsyCrawler, shopeeCrawler, crawlerMap } = require('../crawler/crawler');
const delay = require('../hepler/delay');
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const { dialog, BrowserWindow } = require('electron');
const Jimp = require('jimp');

function setupConnectHandler(ipcMain) {

    ipcMain.handle('connect-data', handleConnect);
    ipcMain.handle("load-data-cache", handleLoadCache);
    ipcMain.handle("search-products", handleSearch);
    ipcMain.handle("load-more", handleLoadMore);
    ipcMain.handle("get-details", handleDetails);
    ipcMain.handle("download-image-as-jpg", handleDownloadImageAsJpg);
    ipcMain.handle("download-multi-images-as-jpg", handleDownloadMultiImagesAsJpg);
    ipcMain.handle("load-platforms", handleLoadPlatforms);
}

async function handleLoadPlatforms() {
    return Array.from(crawlerMap.keys());
}

async function handleDetails(event, data) {
    const crawler = crawlerMap.get(data.key);
    return await crawler.getDetails(data.link);
}

async function handleConnect(event, data) {
    try {
        console.log("renderer:", data);
        const profiles = await initializeProfiles(data);
        await initializeCrawlers(profiles);

        return {
            tiktok: !!profiles.tiktok?.ws,
            etsy: !!profiles.etsy?.ws,
            shopee: !!profiles.shopee?.ws,
            status: !!profiles.tiktok?.ws || !!profiles.etsy?.ws || !!profiles.shopee?.ws
        };
    } catch (error) {
        console.error("❌ Error in connect handler:", error);
        return {
            tiktok: false,
            etsy: false,
            shopee: false,
            status: false,
            error: error.message
        };
    }
}

async function initializeProfiles(data) {
    // Open profiles with delays between them
    const tiktokResponse = await browserApi.openProfile(data.tiktok, data.url);
    await delay(1000);
    
    const etsyResponse = await browserApi.openProfile(data.etsy, data.url);
    await delay(3000);
    
    const shopeeResponse = await browserApi.openProfile(data.shopee, data.url);

    return {
        tiktok: tiktokResponse,
        etsy: etsyResponse,
        shopee: shopeeResponse
    };
}

async function initializeCrawlers(profiles) {
    // Initialize browser contexts
    await Promise.all([
        browserContext.initialize(profiles.tiktok?.ws, tiktokCrawler.key),
        browserContext.initialize(profiles.etsy?.ws, etsyCrawler.key),
        browserContext.initialize(profiles.shopee?.ws, shopeeCrawler.key)
    ]);

    // Initialize crawlers
    await Promise.all([
        tiktokCrawler.initialize(browserContext,'https://www.tiktok.com/shop/s/shirt?source=encodedPageName&enter_method=search&enter_from=ecommerce_searchresult' ),
        shopeeCrawler.initialize(browserContext, 'https://shopee.vn/search?keyword=shirt'),
        etsyCrawler.initialize(browserContext, 'https://www.etsy.com/uk/search?q=shirt&ref=search_bar')
    ]);
}

async function handleLoadCache() {
    try {
        const cache = cacheContext.cache;
        return cache?.connect || getDefaultCacheData();
    } catch (error) {
        console.error("❌ Error reading cache:", error);
        return getDefaultCacheData();
    }
}

function getDefaultCacheData() {
    return {
        url: "",
        tiktok: "",
        etsy: "",
        shopee: ""
    };
}



async function handleSearch(event, data) {
    try {
        console.log("🔍 Searching for:", data);

        const tasks = data.platforms
                .map(key => crawlerMap.get(key))    // lấy crawler theo key
                .filter(Boolean)                    // bỏ undefined nếu key không tồn tại
                .map(crawler => crawler.crawl(data.keyword));

        // Run all crawlers in parallel and wait for all to finish
        await Promise.all(tasks);
        return true;
    } catch (error) {
        console.error("❌ Search error:", error);
        return false;
    }
}

async function handleLoadMore(event, data) {

     try {
        console.log("🔍 Searching for:", data.keyword);

        const tasks = data.platforms
                .map(key => crawlerMap.get(key))    // lấy crawler theo key
                .filter(Boolean)                    // bỏ undefined nếu key không tồn tại
                .map(crawler => {
                    if( crawler.key === 'key/tiktok' ) {
                        return crawler.crawl(data.keyword, data.tiktokCount);
                    }else {
                        return crawler.crawl(data.keyword, data.pageNumber);
                    }
                });

        // Run all crawlers in parallel and wait for all to finish
        await Promise.all(tasks);
        return true;
    } catch (error) {
        console.error("❌ Search error:", error);
        return false;
    }

}

async function handleDownloadImageAsJpg(event, { url, fileName }) {
    try {
        const win = BrowserWindow.getFocusedWindow();
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            title: 'Chọn nơi lưu ảnh',
            defaultPath: fileName || 'image.jpg',
            filters: [{ name: 'JPG Image', extensions: ['jpg', 'jpeg'] }]
        });
        if (canceled || !filePath) return { success: false, error: 'cancelled' };
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const image = await Jimp.read(response.data);
        await image.quality(90).writeAsync(filePath);
        return { success: true, path: filePath };
    } catch (err) {
        console.error('Lỗi tải/chuyển ảnh:', err);
        return { success: false, error: err.message };
    }
}

async function handleDownloadMultiImagesAsJpg(event, { images }) {
    try {
        const win = BrowserWindow.getFocusedWindow();
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            title: 'Chọn thư mục lưu ảnh',
            properties: ['openDirectory']
        });
        if (canceled || !filePaths || !filePaths[0]) return { success: false, error: 'cancelled' };
        const folder = filePaths[0];
        const savedFiles = [];
        for (let i = 0; i < images.length; ++i) {
            const { url, fileName } = images[i];
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const image = await Jimp.read(response.data);
                const savePath = path.join(folder, fileName || `image_${i+1}.jpg`);
                await image.quality(90).writeAsync(savePath);
                savedFiles.push(savePath);
            } catch (e) {
                // Bỏ qua ảnh lỗi
            }
        }
        return { success: true, files: savedFiles };
    } catch (err) {
        console.error('Lỗi tải nhiều ảnh:', err);
        return { success: false, error: err.message };
    }
}

module.exports = { setupConnectHandler };
