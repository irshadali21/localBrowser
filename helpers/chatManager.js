require('dotenv').config();

const configBrowser = require('../puppeteerConfig');
let browser = null;
let chatPage = null;
let idleTimer = null;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

async function prepareChat() {
  if (chatPage && !chatPage.isClosed()) return { status: 'ready' };
  browser = browser || await configBrowser();
  chatPage = await browser.newPage();

  chatPage.on('console', msg => {
    console.log('[Browser]', msg.text());
  });
  await chatPage.goto('https://gemini.google.com/app', { waitUntil: 'networkidle2' });
  await dismissGeminiPopup(chatPage);


  const isLoggedOut = await chatPage.evaluate(() => {
    const loginBlock = Array.from(document.querySelectorAll('div')).find(div =>
      div.innerText?.includes('Sign in to start saving your chats')
    );
    return !!loginBlock;
  });



  if (isLoggedOut) {
    // Navigate to Google login
    await chatPage.goto('https://accounts.google.com/');

    // Fill login form (update selectors if they change)
    await chatPage.type('input[type="email"]', process.env.GOOGLE_EMAIL, { delay: 100 });
    await chatPage.keyboard.press('Enter');

    await chatPage.waitForNavigation({ waitUntil: 'networkidle2' });

    await chatPage.waitForSelector('input[type="password"]', { visible: true });

    await chatPage.type('input[type="password"]', process.env.GOOGLE_PASSWORD, { delay: 100 });
    await chatPage.keyboard.press('Enter');

    await chatPage.waitForNavigation({ waitUntil: 'networkidle2' });

    await chatPage.goto('https://gemini.google.com/app', { waitUntil: 'networkidle2' });

    const stillLoggedOut = await chatPage.evaluate(() => {
      return !!document.querySelector('a[href*="accounts.google.com"]');
    });

    if (stillLoggedOut) {
      return { status: 'login_failed' };
    }
  }

  resetIdleTimer();
  return { status: 'ready' };
}

async function sendChat(message) {
  if (!chatPage || chatPage.isClosed()) {
    await prepareChat();
  }


  await chatPage.setRequestInterception(true);

  let streamDone = false;
  chatPage.on('requestfinished', (req) => {
    const url = req.url();
    if (url.includes('StreamGenerate')) {
      console.log('[Gemini] StreamGenerate completed');
      streamDone = true;
    }
  });


  await chatPage.type('rich-textarea', message);
  await chatPage.keyboard.press('Enter');

  // Wait for StreamGenerate to finish
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('Timeout waiting for Gemini response'), 15000);
    const check = () => {
      if (streamDone) {
        clearTimeout(timeout);
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  // Extract the last response from .message-content
  const response = await chatPage.evaluate(() => {
    const responses = Array.from(document.querySelectorAll('message-content'));
    console.log('response:', responses);
    console.log('[Gemini] Last response:', responses[responses.length - 1]);
    const lastResponse = responses[responses.length - 1];
    return lastResponse?.innerText?.trim() || 'No response found.';
  });

  resetIdleTimer();
  return response;
}

async function closeChat() {
  if (chatPage && !chatPage.isClosed()) await chatPage.close();
  chatPage = null;
  clearTimeout(idleTimer);
}

async function dismissGeminiPopup(page) {
  console.log('[Popup] Checking for Gemini onboarding popup');
  try {
    await page.waitForSelector('div[role="dialog"] button', { timeout: 3000 });
    const buttons = await page.$$('div[role="dialog"] button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.innerText, button);
      if (text.toLowerCase().includes('no thanks') || text.toLowerCase().includes('dismiss')) {
        await button.click();
        console.log('[Popup] Dismissed Gemini onboarding popup');
        break;
      }
    }
  } catch {
    // No popup appeared — continue silently
  }
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (chatPage && !chatPage.isClosed()) chatPage.close();
    chatPage = null;
  }, IDLE_TIMEOUT_MS);
}

module.exports = {
  prepareChat,
  sendChat,
  closeChat
};
