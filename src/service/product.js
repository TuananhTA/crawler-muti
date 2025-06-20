const productQueueInstance = require('../hepler/ProductQueue');

// Store the current page for each platform
const pageTracker = {
    shopee: 1,
    etsy: 1,
    tiktok: 1
};



// tiktok search
const tiktokSearch = async (keyword, crawler, tiktokCount = 0) => {

  console.log("tiktokCount", tiktokCount);

  const page = crawler.page;
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt <= maxAttempts) {
    try {
      if (!page) {
        throw new Error("Page not initialized");
      }
      
      const url = `https://www.tiktok.com/shop/s/${encodeURIComponent(keyword)}?_svg=3&utm_source=copy&enter_method=search&enter_from=ecommerce_searchresult`;
      
      const isCorrectPage = page.url().startsWith(url);

      if (!isCorrectPage) {
        await page.goto(url, {
          timeout: crawler.timeout || 30000,
          waitUntil: "domcontentloaded",
        });
      }
      
      
      console.log(`Tiktok: Loading page (attempt ${attempt + 1}/${maxAttempts + 1})`);
      
      if (tiktokCount !== 0) {

        console.log(`Tiktok: Loading page with tiktokCount ${tiktokCount}`);

        let s = "#root > div > div > div > div.px-20.flex-grow.flex.justify-center.mb-80 > div > div:nth-child(3) > div.w-full > div.flex.justify-center.mt-16 > button"

        const viewMoreBtn = await page.waitForSelector(s, { timeout: 30000 });
        if (viewMoreBtn) {
          console.log(`Tikok: Clciking "View More" button`);
          await viewMoreBtn.click();
        }

      }
      
      // Wait for content to load
      await page.waitForTimeout(1000);
      
      const selector = '#root > div > div > div > div.px-20.flex-grow.flex.justify-center.mb-80 > div > div:nth-child(3) > div.w-full > div.grid.lg\\:grid-cols-5.md\\:grid-cols-3.grid-cols-2.gap-16';
      const element = await page.waitForSelector(selector, { timeout: crawler.timeout || 30000 });
      if (!element) {
        throw new Error("Product grid not found");
      }

      
      
      // Scroll để load lazy content
      await scrollToLoadMore(page);
      // Wait for lazy loading
      await page.waitForTimeout(1000);



      
      const allProductElements = await element.$$("div.w-full.cursor-pointer");
      console.log(`Tiktok: Found Prev ${allProductElements.length} products`);

      const productElements = allProductElements.slice(tiktokCount);
      console.log(`Tiktok: Found ${productElements.length} products`);

      for (const element of productElements) {
        try {
          const product = await getProductTiktok(element);
          if (product && product.title) {
                productQueueInstance.push(product);
          }
        } catch (err) {
          console.warn("Tiktok: Error processing product:", err.message);
          continue;
        }
      }
      
      return true
      
    } catch (err) {

      attempt++;
      console.warn(`Tiktok: Error on attempt ${attempt}/${maxAttempts + 1}:`, err.message);
      
      if (attempt > maxAttempts) {
        console.error("Tiktok: Max retries reached, giving up");
        return false
      }
      await randomDelay(500, 1000);
    }
  }
};

// shopee search
const shopeeSearch = async (keyword, crawler, pageNumber = null) => {
    const page = crawler.page;
    let attempt = 0;
    const maxAttempts = 3;

    // If pageNumber is not provided, use and increment the tracked page
    if (pageNumber === null) {
        pageNumber = pageTracker.shopee;
        pageTracker.shopee++;
    }

    console.log(`🔍 Searching Shopee page ${pageNumber} for: ${keyword}`);

    while (attempt <= maxAttempts) {
        try {
            if (!page) {
                throw new Error("Page not initialized");
            }

            const url = `https://shopee.vn/search?keyword=${encodeURIComponent(keyword)}&page=${pageNumber}`; // Shopee uses 0-based page index
            console.log(`Shopee: Loading page ${pageNumber} (attempt ${attempt + 1}/${maxAttempts + 1})`);

            await page.goto(url, {
                timeout: crawler.timeout || 30000,
                waitUntil: "domcontentloaded",
            });

            const selector = "ul.shopee-search-item-result__items";
            const element = await page.waitForSelector(selector, {
                timeout: crawler.timeout || 30000,
            });

            if (!element) {
                throw new Error("Product list not found");
            }

            await page.waitForTimeout(800);
            await scrollToLoadMore(page);

            const productElements = await element.$$("li.shopee-search-item-result__item");
            console.log(`Shopee: Found ${productElements.length} products on page ${pageNumber}`);

            // Check if we have products
            if (productElements.length === 0) {
                console.log(`Shopee: No more products found on page ${pageNumber}`);
                return false; // Indicate no more products
            }

            for (const element of productElements) {
                try {
                    const product = await getProductShopee(element);
                    if (product && product.title && product.price > 0) {
                        product.page = pageNumber; // Add page number to product data
                        productQueueInstance.push(product);
                    }
                } catch (err) {
                    console.warn("Shopee: Error processing product:", err.message);
                    continue;
                }
            }

            return true; // Indicate successful fetch with products

        } catch (err) {
            attempt++;
            console.warn(`Shopee: Error on attempt ${attempt}/${maxAttempts + 1}:`, err.message);

            if (attempt > maxAttempts) {
                console.error("Shopee: Max retries reached, giving up");
                return false;
            }
            await randomDelay(500, 1000);
        }
    }
};

// etsy search
const etsySearch = async (keyword, crawler, pageNumber = null) => {
    const page = crawler.page;
    let attempt = 0;
    const maxAttempts = 3;

    // If pageNumber is not provided, use and increment the tracked page
    if (pageNumber === null) {
        pageNumber = pageTracker.etsy;
        pageTracker.etsy++;
    }

    console.log(`🔍 Searching Etsy page ${pageNumber} for: ${keyword}`);

    while (attempt <= maxAttempts) {
        try {
            if (!page) {
                throw new Error("Page not initialized");
            }

            const url = `https://www.etsy.com/search?q=${encodeURIComponent(keyword)}&ref=pagination&page=${pageNumber}`;
            console.log(`Etsy: Loading page ${pageNumber} (attempt ${attempt + 1}/${maxAttempts + 1})`);

            await page.goto(url, {
                timeout: crawler.timeout || 30000,
                waitUntil: "domcontentloaded",
            });

            await page.waitForTimeout(2000);

            const element = await page.waitForSelector("ul[data-results-grid-container]", {
                timeout: crawler.timeout || 30000,
            });

            if (!element) {
                throw new Error("Product list not found");
            }

            await scrollToLoadMore(page);
            await page.waitForTimeout(500);

            const productElements = await element.$$("li");
            console.log(`Etsy: Found ${productElements.length} products on page ${pageNumber}`);

            // Check if we have products
            if (productElements.length === 0) {
                console.log(`Etsy: No more products found on page ${pageNumber}`);
                return false; // Indicate no more products
            }

            for (const element of productElements) {
                try {
                    const product = await getProductEtsy(element);
                    if (product && product.title && product.price > 0) {
                        product.page = pageNumber; // Add page number to product data
                        productQueueInstance.push(product);
                    }
                } catch (err) {
                    console.warn("Etsy: Error processing product:", err.message);
                    continue;
                }
            }

            return true; // Indicate successful fetch with products

        } catch (error) {
            attempt++;
            console.warn(`Etsy: Error on attempt ${attempt}/${maxAttempts + 1}:`, error.message);

            if (attempt > maxAttempts) {
                console.error("Etsy: Max retries reached, giving up");
                return false;
            }
            await randomDelay(500, 1000);
        }
    }
};

// Reset page trackers
const resetPageTrackers = () => {
    pageTracker.shopee = 1;
    pageTracker.etsy = 1;
    pageTracker.tiktok = 1;
};

//hepler

async function scrollToLoadMore(page) {
  let lastHeight = await page.evaluate(() => document.body.scrollHeight);
  let unchangedScrolls = 0;
  const maxUnchangedScrolls = 5;
  const scrollStep = 0.6; // Tỷ lệ chiều cao màn hình mỗi lần cuộn
  const scrollDelay = [300, 1000]; // Delay giữa các lần scroll

  while (unchangedScrolls < maxUnchangedScrolls) {
    // Cuộn xuống một bước
    await page.evaluate((step) => {
      window.scrollBy(0, window.innerHeight * step);
    }, scrollStep);

    await randomDelay(scrollDelay[0], scrollDelay[1]);

    const newHeight = await page.evaluate(() => document.body.scrollHeight);

    if (newHeight === lastHeight) {
      unchangedScrolls++;
    } else {
      lastHeight = newHeight;
      unchangedScrolls = 0;
    }
  }
  // Scroll xuống tận đáy lần cuối
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await randomDelay(500, 1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await randomDelay(800, 1000);
}

async function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function getProductEtsy(productElement) {
  return await productElement.evaluate((el) => {
    try {
      const img = el.querySelector("img.wt-image")?.getAttribute("src") || "";
      const title =
        el.querySelector("h3.wt-text-title-small")?.getAttribute("title") || "";
      const link =
        el.querySelector("a.listing-link")?.getAttribute("href") || "";
      const soldText =
        el.querySelector("p.wt-text-body-smaller.wt-text-black")?.textContent ||
        "0";
      const sold = parseInt(soldText.replace(/\D/g, "")) || 0;
      const priceText =
        el.querySelector("p.wt-text-title-01.lc-price span.currency-value")
          ?.textContent || "0";
      const price = parseFloat(priceText) || 0;

      return {
        img,
        title,
        link,
        sold,
        price,
        origin: "ETSY",
      };
    } catch (error) {
      return null;
    }
  });
}

async function getProductShopee(productElement) {
  return await productElement.evaluate((el) => {
    try {
      const img = el.querySelector("img[alt]")?.getAttribute("src") || "";
      const title =
        el.querySelector("div.line-clamp-2")?.textContent?.trim() || "";
      let link = el.querySelector("a.contents")?.getAttribute("href") || "";
      link = link ? "https://shopee.vn" + link : "";

      const soldText =
        el.querySelector("div.truncate.text-shopee-black87.text-xs")
          ?.textContent || "0";
      const soldMatch = soldText.match(/[\d,.]+k/)?.[0] || "0";
      const sold = parseFloat(soldMatch.replace(/[k,]/g, "")) * 1000 || 0;

      const priceText =
        el
          .querySelector("span.font-medium.text-base\\/5")
          ?.textContent?.replace(/[.,]/g, "") || "0";
      const price = parseFloat(priceText) || 0;

      return {
        img,
        title,
        link,
        sold,
        price,
        origin: "SHOPEE",
      };
    } catch (error) {
      return null;
    }
  });
}

async function getProductTiktok(productElement) {
  return await productElement.evaluate((el) => {
    try {
      const img = el.querySelector('img')?.getAttribute('src') || '';
      const title = el.querySelector('h3')?.getAttribute('title') || '';
      const link = el.querySelector('a')?.getAttribute('href') || '';
      const soldText = el.querySelector('span.P3-Regular')?.textContent || '0';
      const sold = parseInt(soldText.replace(/\D/g, '')) || 0;
      
      const priceInt = el.querySelector('span.H2-Semibold')?.textContent || '0';
      const priceDec = el.querySelector('span.H2-Semibold')?.nextSibling?.textContent?.replace('.', '') || '00';
      const price = parseFloat(`${priceInt}.${priceDec}`);
      
      return {
        img,
        title,
        link,
        sold,
        price,
        origin: "TIKTOK"
      };
    } catch (error) {
      return null;
    }
  });
}

module.exports = {
  tiktokSearch,
  etsySearch,
  shopeeSearch,
  resetPageTrackers
};
