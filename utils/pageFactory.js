// utils/pageFactory.js
const configBrowser = require('../puppeteerConfig');

let browser = null;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

async function getConfiguredPage() {
  browser = browser || await configBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  return page;
}

module.exports = {
  getConfiguredPage
};
