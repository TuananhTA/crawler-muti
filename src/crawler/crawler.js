const { tiktokSearch, shopeeSearch , etsySearch } = require('../service/product');

const crawlerMap = new Map();
 
class Crawler{

    constructor( key ) {

        this.page = null;
        this.key  = key
        this.search = null;
        crawlerMap.set(key, this);
    }

    async initialize( browserContext, url ) {
        this.page = await browserContext.getPage(this.key, url);
    }

    async crawl( keyword, pageNumber = 0) {
        return this.search( keyword, this, pageNumber);
    }

    setSearch( searchFunction ) {
        this.search = searchFunction;
    }

    async test( url) {
        if(!this.page) {
            throw new Error(`Page not initialized for key: ${this.key}`);
        }
        try {
            await this.page.goto(url, { waitUntil: 'networkidle' });
            return true;
        } catch (error) {
            console.error(`Error navigating to ${url} in ${this.key}:`, error);
            return false;
        }
    }

}

const tiktokCrawler = new Crawler('key/tiktok');
tiktokCrawler.setSearch(tiktokSearch);

const etsyCrawler = new Crawler('key/etsy');
etsyCrawler.setSearch(etsySearch);

const shopeeCrawler = new Crawler('key/shopee');
shopeeCrawler.setSearch(shopeeSearch);



module.exports = {
    tiktokCrawler,
    etsyCrawler,
    shopeeCrawler,
    crawlerMap  
}