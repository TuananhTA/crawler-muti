const { tiktokSearch, shopeeSearch , etsySearch } = require('../service/product');

class Crawler{

    constructor( key ) {

        this.page = null;
        this.key  = key
        this.search = null;
    }

    async initialize( browserContext, url ) {
        this.page = await browserContext.getPage(this.key, url);
    }

    async crawl( keyword ) {
        console.log(this.search)
        return this.search( keyword, this);
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
    shopeeCrawler  
}