// chatManager.js
require('dotenv').config();
const { getOrCreateChatPage } = require('../utils/pageFactory');


let chatPage = null;
let idleTimer = null;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

async function prepareChat() {
  chatPage = await getOrCreateChatPage();

  await dismissGeminiPopup(chatPage);

  const isLoggedOut = await chatPage.evaluate(() =>
    Array.from(document.querySelectorAll('div')).some(div =>
      div.innerText?.includes('Sign in to start saving your chats')
    )
  );

  if (isLoggedOut) {
   return { status: 'login_failed' };
  }

  resetIdleTimer();
  return { status: 'ready' };
}

async function sendChat(message) {
  if (!chatPage || chatPage.isClosed()) await prepareChat();

  await chatPage.setRequestInterception(true);
  let streamDone = false;

  const onRequestFinished = req => {
    if (req.url().includes('StreamGenerate')) {
      console.log('[Gemini] StreamGenerate completed');
      streamDone = true;
      chatPage.off('requestfinished', onRequestFinished);
    }
  };
  chatPage.on('requestfinished', onRequestFinished);

  await chatPage.type('rich-textarea', message);
  await chatPage.keyboard.press('Enter');

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('Timeout waiting for Gemini response'), 15000);
    const poll = () => streamDone ? (clearTimeout(timeout), resolve()) : setTimeout(poll, 100);
    poll();
  });

  const response = await chatPage.evaluate(() => {
    const responses = Array.from(document.querySelectorAll('message-content'));
    return responses.at(-1)?.innerText?.trim() || 'No response found.';
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
      if (/no thanks|dismiss/i.test(text)) {
        await button.click();
        console.log('[Popup] Dismissed Gemini onboarding popup');
        break;
      }
    }
  } catch {
    // Silent fail if popup not found
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
