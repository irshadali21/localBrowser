// helpers/browserHelper.js
const { requestPage, closePage } = require('../utils/pageManager');

let browserPageId = null;
let browserPage = null;

async function getBrowserPage() {
    const { page, id } = await requestPage('browser');
    browserPage = page;
    browserPageId = id;
    return browserPage;
}

async function closeBrowser() {
    if (browserPageId) {
        closePage(browserPageId);
        browserPageId = null;
        browserPage = null;
    }
}

// Remote code execution via browser context
async function executeCode(userCode) {
    const page = await getBrowserPage();
    await page.setDefaultNavigationTimeout(60000);
    const fn = new Function('page', userCode);
    return await fn(page);
}

// Google Search (title, link, snippet)
async function googleSearch(query) {
    const page = await getBrowserPage();
    try {
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
        // Type the query
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.type('textarea[name="q"]', query, { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('a:has(h3)').forEach(anchor => {
                const title = anchor.querySelector('h3')?.innerText.trim();
                const link = anchor.href;
                const parent = anchor.closest('div[data-hveid]') || anchor.closest('div')?.parentElement;

                let snippet = '';
                if (parent) {
                    const el = parent.querySelector('div[style*="line-clamp"] span, div[data-snh-s="0"] span, div[role="text"] span');
                    snippet = el?.innerText.trim() || '';
                }

                if (title && link.startsWith('http')) items.push({ title, link, snippet });
            });
            return items;
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        return results;
    } finally {
        // keep page open for reuse
    }
}

// Visit a URL and return stripped HTML content
async function visitUrl(url) {
    const page = await getBrowserPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            document.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());
        });
        return await page.content();
    } finally {
        // keep page open for reuse
    }
}

// Vendor scraper dispatcher
async function scrapeProduct(url, vendor) {
    const page = await getBrowserPage();
    try {
        await gotoWithRetry(page, url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const strategy = scraperStrategies[vendor.toLowerCase()];
        if (!strategy) throw new Error(`No scraper available for vendor: ${vendor}`);

        return await strategy(page);
    } finally {
        // keep page open for reuse
    }
}

async function gotoWithRetry(page, url, options, retries = 1) {
  try {
    return await page.goto(url, options);
  } catch (err) {
    if (err.message.includes('Navigation timeout') && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
      return gotoWithRetry(page, url, options, retries - 1);
    }
    throw err;
  }
}



// Vendor-specific scraping logic
const scraperStrategies = {
    beddermattress: async (page) => {
        return await page.evaluate(() => {
            const parse = txt => parseFloat(txt?.replace(/[^0-9.]/g, '')) || 0;
            const sale = document.querySelector('.price__sale .price-item--sale')?.innerText;
            const regular = document.querySelector('.price__sale s.price-item--regular')?.innerText;
            const standalone = document.querySelector('.price-item--regular')?.innerText;

            return {
                vendorPrice: sale ? parse(sale) : parse(standalone),
                vendorBeforeDiscount: regular ? parse(regular) : parse(standalone),
            };
        });
    },

    helixsleep: async (page) => {
        const html = await page.content();
        const matchDiscounted = html.match(/data-area="discounted-price"[^>]*>(.*?)<\/div>/);
        const matchVariant = html.match(/data-area="variant-price"[^>]*>(.*?)<\/div>/);

        const parse = match => parseFloat((match?.[1] || '').replace(/[^0-9.]/g, '')) || 0;

        return {
            vendorPrice: parse(matchDiscounted),
            vendorBeforeDiscount: parse(matchVariant),
        };
    }
};

module.exports = {
    executeCode,
    googleSearch,
    visitUrl,
    scrapeProduct,
    closeBrowser
};
