// controllers/browserController.js
const {
  executeCode,
  googleSearch,
  visitUrl,
  scrapeProduct
} = require('../helpers/browserHelper'); // moved core logic to helpers
const { logErrorToDB } = require('../utils/errorLogger');
// POST /browser/execute
exports.execute = async (req, res) => {
  try {
    const result = await executeCode(req.body.code || '');
    res.json({ result });
  } catch (err) {
    console.error('[BrowserController] Execute error:', err);
    logErrorToDB({ type: 'EXECUTE_FAILED', message: err.message, stack: err.stack, route: '/browser/execute', input: req.body });
    res.status(500).json({ error: 'EXECUTE_FAILED', message: err.message });
  }
};

// GET /browser/search?q=...
exports.search = async (req, res) => {
  try {
    const results = await googleSearch(req.query.q || '');
    res.json({ results });
  } catch (err) {
    console.error('[BrowserController] Search error:', err);
    logErrorToDB({ type: 'SEARCH_FAILED', message: err.message, stack: err.stack, route: '/browser/search', input: req.query });
    res.status(500).json({ error: 'SEARCH_FAILED', message: err.message });
  }
};

// GET /browser/visit?url=...
exports.visit = async (req, res) => {
  try {
    const html = await visitUrl(req.query.url || '');
    res.json({ html });
  } catch (err) {
    console.error('[BrowserController] Visit error:', err);
    logErrorToDB({ type: 'VISIT_FAILED', message: err.message, stack: err.stack, route: '/browser/visit', input: req.query });
    res.status(500).json({ error: 'VISIT_FAILED', message: err.message });
  }
};

// GET /browser/scrape?url=...&vendor=...
exports.scrape = async (req, res) => {
  try {
    const { url, vendor } = req.query;
    const data = await scrapeProduct(url, vendor);
    res.json(data);
  } catch (err) {
    console.error('[BrowserController] Scrape error:', err);
    logErrorToDB({ type: 'SCRAPE_FAILED', message: err.message, stack: err.stack, route: '/browser/scrape', input: req.query });
    res.status(500).json({ error: 'SCRAPE_FAILED', message: err.message });
  }
};
