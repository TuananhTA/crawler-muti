const cacheContext = require('../service/readCache');
const browserApi = require('../service/browserApi');
const browserContext = require('../crawler/browser');
const { tiktokCrawler, etsyCrawler, shopeeCrawler } = require('../crawler/crawler');
const delay = require('../hepler/delay');

function setupConnectHandler(ipcMain) {

    ipcMain.handle('connect-data', handleConnect);
    ipcMain.handle("load-data-cache", handleLoadCache);
    ipcMain.handle("search-products", handleSearch);
    ipcMain.handle("load-more", handleLoadMore);

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



async function handleSearch(event, keyword) {
    try {
        console.log("🔍 Searching for:", keyword);
        // Run all crawlers in parallel and wait for all to finish
        await Promise.all([
            tiktokCrawler.crawl(keyword),
            etsyCrawler.crawl(keyword),
            shopeeCrawler.crawl(keyword)
        ]);

        return true;
    } catch (error) {
        console.error("❌ Search error:", error);
        return false;
    }
}

async function handleLoadMore() {
    console.log("load-more")
}

module.exports = { setupConnectHandler };
