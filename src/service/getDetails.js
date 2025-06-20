
async function getDetailTiktok (url, crawler) {
  const page = await crawler.context.newPage();
  let newUrl = `${url}/?source=ecommerce_searchresult&enter_from=ecommerce_searchresult&enter_method=feed_list_frequently_bought_together`;
  await page.goto( newUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  
  try {
      const  selector = "#root > div > div > div > div.px-20.flex-grow.flex.justify-center.mb-80 > div > div.grid.grid-cols-2.\\32 xl\\:px-60.lg\\:px-32.px-20.align-items-start.overflow-visible.relative > div.h-full.overflow-visible.pr-16 > div:nth-child(1) > div.w-full.relative.flex.items-center.mt-16";
      const  elements = await page.waitForSelector(selector);
      if(!elements) throw new Error("Could not find element");
      
      const images = await page.$$('img.object-cover.max-w-full.max-h-full.aspect-square.rounded-4.cursor-pointer');
    
      const imageUrls = [];
    
      for (const image of images) {
        const src = await image.getAttribute('src');
        if (src) imageUrls.push(src);
      }
      await page.close();
      return imageUrls;
  }catch(err) {
    console.log(err);
    return null;
    
  }
  
}

async function getDetailEtsy(url, crawler) {
  
  const page = await crawler.context.newPage(); // Tạo page mới
  await page.goto(url, { waitUntil: 'domcontentloaded' }); // Mở URL
  
}

async function getDetailShopee (url, crawler) {
  
  const page = await crawler.context.newPage(); // Tạo page mới
  await page.goto(url, { waitUntil: 'domcontentloaded' }); // Mở URL
  
}

module.exports = {
  getDetailEtsy,
  getDetailShopee,
  getDetailTiktok
  
}