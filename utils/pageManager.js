const db = require('./db');
const { getConfiguredPage } = require('./pageFactory');

const pages = new Map(); // id -> Puppeteer Page
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

function updateStatusIfClosed(id) {
  const page = pages.get(id);
  if (!page || page.isClosed()) {
    db.prepare('UPDATE active_pages SET status = "closed" WHERE id = ?').run(id);
    pages.delete(id);
    return true;
  }
  return false;
}

function startCleanupLoop() {
  setInterval(() => {
    const threshold = new Date(Date.now() - IDLE_TIMEOUT_MS).toISOString();
    const stale = db
      .prepare('SELECT id FROM active_pages WHERE status = "active" AND last_used < ?')
      .all(threshold);
    for (const { id } of stale) {
      const page = pages.get(id);
      if (page && !page.isClosed()) page.close();
      db.prepare('UPDATE active_pages SET status = "closed" WHERE id = ?').run(id);
      pages.delete(id);
    }
  }, 60 * 1000);
}

startCleanupLoop();

async function createPage(type) {
  const page = await getConfiguredPage();
  const info = db
    .prepare('INSERT INTO active_pages (type, status, last_used) VALUES (?, "active", CURRENT_TIMESTAMP)')
    .run(type);
  const id = info.lastInsertRowid;
  pages.set(id, page);
  page.on('close', () => {
    db.prepare('UPDATE active_pages SET status = "closed" WHERE id = ?').run(id);
    pages.delete(id);
  });
  return { id, page };
}

async function requestPage(type) {
  const row = db
    .prepare('SELECT id FROM active_pages WHERE type = ? AND status = "active" ORDER BY last_used DESC LIMIT 1')
    .get(type);
  if (row) {
    if (!updateStatusIfClosed(row.id)) {
      db.prepare('UPDATE active_pages SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
      return { id: row.id, page: pages.get(row.id) };
    }
  }
  return createPage(type);
}

function listPages() {
  return db.prepare('SELECT * FROM active_pages ORDER BY id').all();
}

function closePage(id) {
  const page = pages.get(id);
  if (page && !page.isClosed()) page.close();
  db.prepare('UPDATE active_pages SET status = "closed" WHERE id = ?').run(id);
  pages.delete(id);
}

module.exports = {
  requestPage,
  listPages,
  closePage,
  updateStatusIfClosed
};
