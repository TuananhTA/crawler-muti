const cacheContext = require('../service/readCache');
const browserApi = require('../service/browserApi');
const delay = require('../hepler/delay')

function setupConnectHandler(ipcMain) {
    // Nhận dữ liệu kết nối từ renderer
    ipcMain.handle('connect-data', async (event, data) => {
        console.log("renderer:", data);

        const tiktokResponse = await browserApi.openProfile(data.tiktok, data.url)
        await delay(1000)
        const etsyResponse = await browserApi.openProfile(data.etsy, data.url)
        await delay(3000)
        const shopeeResponse = await browserApi.openProfile(data.shopee, data.url)

        console.log({
            tiktokResponse,
            etsyResponse,
            shopeeResponse,
        })

        const tiktokOk = !!tiktokResponse?.ws;
        const etsyOk = !!etsyResponse?.ws;
        const shopeeOk = !!shopeeResponse?.ws;

        return {
            tiktok: tiktokOk,
            etsy: etsyOk,
            shopee: shopeeOk,
            status: tiktokOk || etsyOk || shopeeOk
        };
    });

    // Gửi dữ liệu cache về renderer
    ipcMain.handle("load-data-cache", async () => {
        try {
            console.log(cacheContext);
            const cache = cacheContext.cache;
            return cache?.connect || {
                url: "",
                tiktok: "",
                etsy: "",
                shopee: ""
            };
        } catch (e) {
            console.error("❌ error read cache:", e);
            return {
                url: "",
                tiktok: "",
                etsy: "",
                shopee: ""
            };
        }
    });
}

module.exports = { setupConnectHandler };
