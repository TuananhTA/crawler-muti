const axios = require('axios');
const cacheContext = require('./readCache');
const delay = require('../hepler/delay')

 const headers = {
   Authorization: "Bearer 3842895878470c759dff91f3a7887ad8", // Thêm header ở đây
   "Content-Type": "application/json", // Có thể thêm nếu cần
 };

class BrowserApi {

    constructor() {
        this.config = cacheContext.cache;
        this.profileContext = new Set();
        this.baseUrl = null;
    }
    async openProfile(profileId, baseUrl) {
        const api = this.config.apis.open
        if (!baseUrl) {
            throw new Error('You must set base url');
        }

        this.baseUrl = baseUrl;

        const result = await this.check(profileId, baseUrl);

        if (result?.data.status === 'Active') {
            const ws = result.data.ws.puppeteer;
            this.profileContext.add(profileId)
            return { ws }
        }

        const body = {
            profile_id: profileId, // ID của profile, sẽ được ưu tiên nếu có
            launch_args: [
                "--window-position=400,0",
                "--blink-settings=imagesEnabled=false",
                "--disable-notifications"
            ],
            headless: "0",              // 0: mở giao diện, 1: không giao diện
            last_opened_tabs: "0",      // 1: mở lại tab cũ
            proxy_detection: "0",       // 1: hiện trang kiểm tra proxy
            password_saving: "1",       // 0: không lưu mật khẩu
            cdp_mask: "1",              // 1: ẩn lộ trình CDP (chống detect headless)
            delete_cache: "0",          // 0: không xóa cache sau khi đóng
            device_scale: "1"
        }

        try {

            const apiMain = `${baseUrl}${api}`;
            const response = await axios.post(apiMain, body, { headers });
            this.profileContext.add(profileId)
            const ws = response?.data?.data?.ws?.puppeteer;
            return { ws };
        } catch (e) {
            console.error("❌ Error when opening profile:", e.message);
            return null;
        }
    }

    async close(profileId) {

        const baseUrl = this.baseUrl;
        
        console.log("clsoe " + profileId)

        const api = this.config.apis.close

        if (!baseUrl) {
            throw new Error('You must set base url');
        }

        const body = {
            profile_id: profileId
        }
        try {

            const apiMain = `${baseUrl}${api}`;
            await axios.post(apiMain, body, { headers });
            this.profileContext.delete(profileId)
            return true;

        } catch (e) {
            console.error("❌ Error when opening profile:", e.message);
            return false;
        }
    }
    async check(profile_id, baseUrl) {

        const api = this.config.apis.check

        if (!baseUrl) {
            throw new Error('You must set base url');
        }

        try {

            const apiMain = `${baseUrl}${api}?profile_id=${profile_id}`;
            const response = await axios.get(apiMain, { headers });
            return response.data;

        } catch (e) {
            console.error("❌ Error when opening profile:", e.message);
            return false;
        }
    }
    async closeAll() {
        const array = [...this.profileContext];
        console.log("🧹 Closing all profiles:", array);

        for (const profileId of array) {
            try {
                await this.close(profileId);
                console.log(`✅ Closed profile: ${profileId}`);
            } catch (error) {
                console.error(`❌ Error closing profile ${profileId}:`, error.message);
            }
            delay(1000); 
        }
        console.log(this.profileContext)
        this.profileContext.clear();
        console.log("✅ All profiles closed.");
    }
}

const browserApi = new BrowserApi();

module.exports = browserApi;