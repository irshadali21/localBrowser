// puppeteerConfig.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const BlockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')();
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua')();
const UserPreferencesPlugin = require('puppeteer-extra-plugin-user-preferences')();

const path = require('path');

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin);
puppeteer.use(BlockResourcesPlugin);
puppeteer.use(UserPreferencesPlugin);

async function configBrowser() {
  return await puppeteer.launch({
    headless: true,
    userDataDir: path.resolve(__dirname, 'profile-data'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--disable-dev-shm-usage'
    ]
  });
}

module.exports = configBrowser;
