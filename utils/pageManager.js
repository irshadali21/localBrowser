const db = require('./db');
const { getConfiguredPage, getBrowser } = require('./pageFactory');

const pages = new Map(); 

function updateStatusIfClosed(id) {
  const page = pages.get(id);
  if (!page || page.isClosed()) {
    db.prepare('UPDATE active_pages SET status = \'closed\' WHERE id = ?').run(id);
    pages.delete(id);
    return true;
  }
  return false;
}


async function requestPage(type) {
  // Ensure browser instance is still valid
  const browser = await getBrowser();
  if (!browser || browser.process()?.exitCode !== null) {
    console.warn('[PageManager] Browser not running. Resetting state.');
    pages.clear();
    return createPage(type);
  }

  // Try to reuse existing page
  const row = db.prepare(`
    SELECT id FROM active_pages WHERE type = ? AND status = \'active\' ORDER BY last_used DESC LIMIT 1
  `).get(type);

  if (row) {
    const page = pages.get(row.id);
    const stillValid = page && !page.isClosed();

    if (stillValid) {
      db.prepare('UPDATE active_pages SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
      return { id: row.id, page };
    }

    // Clean up invalid page
    db.prepare('UPDATE active_pages SET status = \'closed\' WHERE id = ?').run(row.id);
    pages.delete(row.id);
  }

  // Create a fresh one
  return createPage(type);
}



async function createPage(type) {
  const page = await getConfiguredPage();
  const info = db
    .prepare('INSERT INTO active_pages (type, status, last_used) VALUES (?, \'active\', CURRENT_TIMESTAMP)')
    .run(type);
  const id = info.lastInsertRowid;
  pages.set(id, page);
  page.on('close', () => {
    db.prepare('UPDATE active_pages SET status = \'closed\' WHERE id = ?').run(id);
    pages.delete(id);
  });
  if (type === 'chat') await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle2' });
  return { id, page };
}



function listPages() {
  db.prepare('DELETE FROM active_pages WHERE status = \'closed\'').run();
  return db.prepare('SELECT * FROM active_pages ORDER BY id').all();
}




async function closeChat() {
  if (chatPageId) {
    closePage(chatPageId);
    chatPageId = null;
    chatPage = null;
  }
}
function closePage(id) {
  const page = pages.get(id);
  if (page && !page.isClosed()) page.close();
  db.prepare('UPDATE active_pages SET status = \'closed\' WHERE id = ?').run(id);
  pages.delete(id);
}

module.exports = {
  requestPage,
  listPages,
  closePage,
  updateStatusIfClosed,
  closeChat
};
