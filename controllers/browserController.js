// controllers/browserController.js
const puppeteer = require('puppeteer-extra');
const configBrowser = require('../puppeteerConfig');
const fs = require('fs');
const path = require('path');

let browser; // Global browser instance

async function getBrowser() {
    if (!browser) {
        browser = await configBrowser();
    }
    return browser;
}

async function executeCode(userCode) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setDefaultNavigationTimeout(60000);

        const fn = new Function('page', userCode);
        const result = await fn(page);

        await page.close();
        return result;
    } catch (err) {
        await page.close();
        throw err;
    }
}

async function googleSearch(query) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        const page_url = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`;
        page.on('console', msg => {
            console.log('[Browser]', msg.text());
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

        await page.goto(page_url, {
            waitUntil: 'networkidle2'
        });
        console.log('page', page_url);

        const results = await page.evaluate(() => {
            const items = [];
            // Select all anchor tags that are likely to be part of a search result title.
            // Google search result links often contain an h3 tag for the title.
            // We'll target 'a' tags that contain an 'h3' as a robust starting point.
            const anchorsWithH3 = document.querySelectorAll('a:has(h3)');

            anchorsWithH3.forEach((anchor) => {
                const title = anchor.querySelector('h3')?.innerText.trim() || '';
                const link = anchor.href;

                // Traverse upwards from the anchor to find a common parent that
                // also contains the snippet. The 'div[data-hveid]' attribute is
                // often used by Google for result containers and tends to be stable.
                // Alternatively, look for a div that is an immediate parent of a div
                // that wraps the link and the snippet.
                let commonResultParent = anchor.closest('div[data-hveid]');

                // If data-hveid is not present, try another common parent structure.
                // This might be a div that is a direct parent to the div containing the link.
                if (!commonResultParent) {
                    // Find the immediate parent of the anchor's container div (e.g., VwiC3b in the image)
                    // and then go up one more level to find the overarching result block.
                    commonResultParent = anchor.closest('div')?.parentElement;
                }

                let snippet = '';
                if (commonResultParent) {
                    // Now, within this common parent, try to locate the snippet.
                    // Snippets are often in a div that contains a 'style' attribute with 'line-clamp'
                    // or other distinguishing features that are not class-dependent.
                    // Based on the image, the snippet text is typically within a <span> inside such a div.
                    const snippetElement = commonResultParent.querySelector('div[style*="line-clamp"] span') ||
                        commonResultParent.querySelector('div[data-snh-s="0"] span') ||
                        commonResultParent.querySelector('div[role="text"] span'); // Sometimes snippets have role="text"

                    snippet = snippetElement?.innerText.trim() || '';
                }

                // Ensure we have a title, a valid link, and a non-empty snippet before pushing
                if (title && link && link.startsWith('http')) {
                    items.push({ title, link, snippet });
                }
            });
            return items;
        });

        console.log('Found results:', results.length);

        await page.close();
        return results;
    } catch (err) {
        console.log('err:', err);

        await page.close();
        throw err;
    }
}

async function visitUrl(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Remove scripts and styles
        await page.evaluate(() => {
            document.querySelectorAll('script, style, link[rel="stylesheet"]').forEach((el) => el.remove());
        });

        const html = await page.content();
        await page.close();
        return html;
    } catch (err) {
        await page.close();
        throw err;
    }
}

async function scrapeProduct(url, vendor) {
    let productData = {
        vendorPrice: 0,
        vendorBeforeDiscount: 0
    };
    const browser = await getBrowser();
    const page = await browser.newPage();
    page.on('console', msg => {
        console.log('[Browser]', msg.text());
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

       

         // Conditional logic based on the 'vendor' parameter
        if (vendor.toLowerCase() === 'beddermattress') {
            console.log('Vendor is Bedder Mattress. Using CSS selectors to extract prices.');
            // Execute JavaScript code directly in the browser's page context
            productData = await page.evaluate(() => {
                // Helper function to clean and parse price strings
                const cleanAndParsePrice = (priceText) => {
                    if (!priceText) return null;
                    // Remove currency symbols, commas, and any non-numeric characters except the decimal point
                    const cleaned = priceText.replace(/[^0-9.]/g, '');
                    const parsed = parseFloat(cleaned);
                    return isNaN(parsed) ? null : parsed;
                };

                let salePrice = null;      // Represents the actual discounted price
                let regularPrice = null;   // Represents the original price, often struck out
                let standalonePrice = null; // Represents the price if no sale elements are present

                // 1. Try to find the sale price (e.g., .price__sale span.price-item--sale)
                const salePriceElement = document.querySelector('.price__sale span.price-item--sale');
                if (salePriceElement) {
                    salePrice = cleanAndParsePrice(salePriceElement.innerText);
                }

                // 2. Try to find the regular price (original price, often struck out)
                const regularPriceElement = document.querySelector('.price__sale s.price-item--regular');
                if (regularPriceElement) {
                    regularPrice = cleanAndParsePrice(regularPriceElement.innerText);
                }

                // 3. If no sale or regular price elements are found in a sale context,
                //    look for a general regular price (e.g., .price-item--regular)
                if (salePrice === null && regularPrice === null) {
                    const standalonePriceElement = document.querySelector('.price-item--regular');
                    if (standalonePriceElement) {
                        standalonePrice = cleanAndParsePrice(standalonePriceElement.innerText);
                    }
                }

                return {
                    // If a sale price is found, use it; otherwise, use the standalone regular price
                    vendorPrice: salePrice !== null ? salePrice : (standalonePrice !== null ? standalonePrice : 0),
                    // If a regular price (struck out) is found, use it; otherwise, use the standalone regular price
                    vendorBeforeDiscount: regularPrice !== null ? regularPrice : (standalonePrice !== null ? standalonePrice : 0)
                };
            });

        } else if (vendor.toLowerCase() === 'helixsleep') {
            console.log('Vendor is Helix Sleep. Using regex extraction from page content.');
            // Get the entire HTML content of the page as a string
            const htmlContent = await page.content();

            // Regex patterns provided from your n8n flow
            const discountedMatch = htmlContent.match(/<div[^>]+data-area="discounted-price"[^>]*>(.*?)<\/div>/);
            const variantMatch = htmlContent.match(/<div[^>]+data-area="variant-price"[^>]*>(.*?)<\/div>/);

            // Helper function to clean and parse price strings from regex matches
            const cleanAndParseRegexPrice = (match) => {
                if (!match || !match[1]) return 0; // Return 0 if no match or no capturing group
                // Extract the captured content and remove non-numeric characters, then parse as float
                return parseFloat(match[1].replace(/[^0-9.]/g, '')) || 0; // Ensure it's a number, default to 0
            };

            const vendorPrice = cleanAndParseRegexPrice(discountedMatch);
            const vendorBeforeDiscount = cleanAndParseRegexPrice(variantMatch);

            productData = {
                vendorPrice,
                vendorBeforeDiscount
            };

        } 

        
        await page.close();
        return productData;
    } catch (err) {
        await page.close();
        throw err;
    }
}



module.exports = {
    executeCode,
    googleSearch,
    scrapeProduct,
    visitUrl
};


