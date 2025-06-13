// puppeteerConfig.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const BlockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')();
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua')();
const UserPreferencesPlugin = require('puppeteer-extra-plugin-user-preferences')();

const path = require('path');
require('dotenv').config();

// Use Puppeteer Extra plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin);
puppeteer.use(BlockResourcesPlugin);
puppeteer.use(UserPreferencesPlugin);

// Optional proxy support
const proxy = process.env.PROXY || ''; // format: http://username:password@host:port

async function configBrowser() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--disable-dev-shm-usage'
  ];

  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  return await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    userDataDir: path.resolve(__dirname, '../profile-data'),
    args
  });
}

module.exports = configBrowser;
