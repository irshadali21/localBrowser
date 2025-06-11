// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const browserController = require('./controllers/browserController');
const { logger } = require('./utils/logger');
const chatRoutes = require('./controllers/chatController');

const configBrowser = require('./puppeteerConfig.js');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;

let isBrowserBusy = false;

// Middleware
app.use(bodyParser.json());

// API Key protection
app.use((req, res, next) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Routes
app.get('/', (_, res) => {
  res.json({ message: 'Welcome to the Browser API' });
})

app.post('/execute', async (req, res) => {
  if (isBrowserBusy) {
    return res.status(429).json({ error: 'Browser is currently busy' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing code in body' });
  }

  try {
    isBrowserBusy = true;
    const result = await browserController.executeCode(code);
    logger('Request executed successfully');
    res.json({ success: true, result });
  } catch (err) {
    logger('Error in /execute: ' + err.message);
    res.status(500).json({ error: err.message });
  } finally {
    isBrowserBusy = false;
  }
});

// GET /search?q=your+query
app.get('/search', async (req, res) => {
  if (isBrowserBusy) return res.status(429).json({ error: 'Browser is busy' });

  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  try {
    isBrowserBusy = true;
    const result = await browserController.googleSearch(query);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    isBrowserBusy = false;
  }
});

// GET /visit?url=https://example.com
app.get('/visit', async (req, res) => {
  if (isBrowserBusy) return res.status(429).json({ error: 'Browser is busy' });

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    isBrowserBusy = true;
    const html = await browserController.visitUrl(url);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    isBrowserBusy = false;
  }
});

// GET /search?q=your+query
app.get('/scrape-product', async (req, res) => {
  if (isBrowserBusy) return res.status(429).json({ error: 'Browser is busy' });

  const { url, vendor } = req.query;

  if (!url || !vendor) {
    return res.status(400).json({ error: 'Missing "url" or "vendor" query parameter.' });
  }
  if (vendor !== 'beddermattress' && vendor !== 'helixsleep') {
    // Handle unsupported vendors
    return res.status(400).json({
      success: false,
      error: 'Unsupported vendor. Please use "beddermattress" or "helixsleep".'
    });
  }

  try {
    isBrowserBusy = true;
    const result = await browserController.scrapeProduct(url, vendor);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    isBrowserBusy = false;
  }
});



app.use(chatRoutes);


// Health check
app.get('/status', (_, res) => {
  res.json({ browserBusy: isBrowserBusy });
});




let page;
let sessionInterval;

app.get('/open-login-page', async (req, res) => {
  const browser = await configBrowser();
  page = await browser.newPage();
  
  const context = browser.defaultBrowserContext();

  await page.goto('https://gemini.google.com/app');
  res.json({ status: 'Page opened. Please login and close it.' });

  // Poll every 2 seconds to check for close
  // 🔁 Start periodic session save
  sessionInterval = setInterval(async () => {
    try {
      const cookies = await context.cookies();
      const localStorageData = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      });

      const sessionDir = path.resolve(__dirname, 'sessions');
      if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

      fs.writeFileSync(`${sessionDir}/cookies.json`, JSON.stringify(cookies, null, 2));
      fs.writeFileSync(`${sessionDir}/localStorage.json`, JSON.stringify(localStorageData, null, 2));

      console.log('✅ Session updated');
    } catch (err) {
      console.warn('⚠️ Session save failed:', err.message);
    }
  }, 5000); // Save every 5 seconds

  // 🛑 Optional: cleanup when page closes
  page.on('close', () => {
    clearInterval(sessionInterval);
    console.log('🛑 Page closed. Stopped session capture.');
  });

  res.json({ status: 'login page opened, session capture running' });
});



// Start server
app.listen(PORT, () => {
  console.log(`Browser API running on http://localhost:${PORT}`);
});
