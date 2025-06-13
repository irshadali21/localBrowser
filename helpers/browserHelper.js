// helpers/browserHelper.js
const { getConfiguredPage } = require('../utils/pageFactory');

// Remote code execution via browser context
async function executeCode(userCode) {
    const page = await getConfiguredPage();
    try {
        await page.setDefaultNavigationTimeout(60000);
        const fn = new Function('page', userCode);
        return await fn(page);
    } finally {
        await page.close();
    }
}

// Google Search (title, link, snippet)
async function googleSearch(query) {
    const page = await getConfiguredPage();
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
        await page.close();
    }
}

// Visit a URL and return stripped HTML content
async function visitUrl(url) {
    const page = await getConfiguredPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            document.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());
        });
        return await page.content();
    } finally {
        await page.close();
    }
}

// Vendor scraper dispatcher
async function scrapeProduct(url, vendor) {
    const page = await getConfiguredPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const strategy = scraperStrategies[vendor.toLowerCase()];
        if (!strategy) throw new Error(`No scraper available for vendor: ${vendor}`);

        return await strategy(page);
    } finally {
        await page.close();
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
    scrapeProduct
};
