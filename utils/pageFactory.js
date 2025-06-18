// utils/pageFactory.js
const configBrowser = require('../puppeteerConfig');
const { logErrorToDB } = require('../utils/errorLogger');

let browser = null;
let chatPage = null;

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

async function getBrowser() {
  return browser = browser || await configBrowser();;
}

async function getConfiguredPage() {
  browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  return page;
}


async function getOrCreateChatPage() {
  if (chatPage && !chatPage.isClosed()) return chatPage;

  browser = await getBrowser();
  chatPage = await browser.newPage();
  await chatPage.setUserAgent(userAgent);
  chatPage.goto('https://gemini.google.com');
  // await logErrorToDB('chat_status', { open: true, last_used: new Date().toISOString() });
  return chatPage;
}

module.exports = {
  getConfiguredPage,
  getOrCreateChatPage,
  getBrowser
};
