// chatManager.js
require('dotenv').config();
const { requestPage, closePage } = require('../utils/pageManager');

let chatPageId = null;
let chatPage = null;

async function prepareChat() {
  const { page, id } = await requestPage('chat');
  chatPage = page;
  chatPageId = id;

  await dismissGeminiPopup(chatPage);

  const isLoggedOut = await chatPage.evaluate(() =>
    Array.from(document.querySelectorAll('div')).some(div =>
      div.innerText?.includes('Sign in to start saving your chats')
    )
  );

  if (isLoggedOut) {
    console.log('[Gemini] Not logged in. Please complete the login manually.');
    return { status: 'login_failed' };
  }

  return { status: 'ready', pageId: chatPageId };
}

async function sendChat(message) {
  if (!chatPage || chatPage.isClosed()) {
    const { page, id } = await requestPage('chat');
    chatPage = page;
    chatPageId = id;
  }

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

  return response;
}

async function closeChat() {
  if (chatPageId) {
    closePage(chatPageId);
    chatPageId = null;
    chatPage = null;
  }
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

module.exports = {
  prepareChat,
  sendChat,
  closeChat
};
