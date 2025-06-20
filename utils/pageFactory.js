// utils/pageFactory.js
const configBrowser = require('../puppeteerConfig');
let browser = null;

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

async function getBrowser() {
  if (!browser || browser.process()?.exitCode !== null) {
    browser = null;
  }
  return browser = browser || await configBrowser();
}

async function getConfiguredPage() {
  browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  return page;
}


// creating a new page is handled by the page manager

module.exports = {
  getConfiguredPage,
  getBrowser
};
