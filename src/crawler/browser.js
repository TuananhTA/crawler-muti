const { chromium } = require("playwright");

class Browser {
  constructor() {
    this.browsers = new Map();
    this.pages = new Map();
  }

  async initialize(ws, key, maxRetries = 2) {

    if (this.browsers.has(key)) return this.browsers.get(key);

    let retryCount = 0;
    let lastError = null;

    while (retryCount <= maxRetries) {
      try {

        const browser = await chromium.connectOverCDP(ws);
        this.browsers.set(key, browser);

        return browser;
      } catch (error) {

        lastError = error;
        retryCount++;

        if (retryCount <= maxRetries) {
          console.log(
            `Retry attempt ${retryCount}/${maxRetries} connecting to browser...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    throw new Error(
      `Failed to connect after ${maxRetries} retries: ${lastError.message}`
    );
  }

  async getPage(key, url) {

    let page ;

    if (this.pages.has(key)) return (page = this.pages.get(key))

    else {
      const context = this.browsers.get(key).contexts()[0];
      if (!context) {
        throw new Error(`No context found for profile: ${key}`);
      }
      this.pages.set(key, page);
      page = await context.newPage();
    }  
    
    page.goto(url, {
      waitUntil: 'networkidle', 
      timeout: 30000
    });

    return page;
  }
}

const browserContext = new Browser();
module.exports = browserContext;
