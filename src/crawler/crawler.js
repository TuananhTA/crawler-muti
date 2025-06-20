const { tiktokSearch, shopeeSearch , etsySearch } = require('../service/product');
const { getDetailEtsy, getDetailTiktok , getDetailShopee } = require('../service/getDetails');

const crawlerMap = new Map();

class Crawler{
    
    constructor( key ) {
        
        this.page = null;
        this.key  = key
        this.search = null;
        crawlerMap.set(key, this);
        this.details = null;
        this.context = null;
        
    }
    
    async initialize( browserContext , url ) {
        this.page = await browserContext.getPage(this.key, url);
        this.context = browserContext.browsers?.get(this.key)?.contexts()[0]
    }
    
    async crawl( keyword, pageNumber = 0) {
        return this.search( keyword, this, pageNumber);
    }
    async getDetails (url) {
        return this.details(url, this)
    }
    
    setSearch( searchFunction ) {
        this.search = searchFunction;
    }
    setDetals (detailsFunction){
        this.details = detailsFunction;
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
tiktokCrawler.setDetals(getDetailTiktok)

const etsyCrawler = new Crawler('key/etsy');
etsyCrawler.setSearch(etsySearch);
etsyCrawler.setDetals(getDetailEtsy)

const shopeeCrawler = new Crawler('key/shopee');
shopeeCrawler.setSearch(shopeeSearch);
shopeeCrawler.setDetals(getDetailShopee)



module.exports = {
    tiktokCrawler,
    etsyCrawler,
    shopeeCrawler,
    crawlerMap
}