# 🧠 localBrowser

A small automation server built with Puppeteer. It keeps your login sessions persistent and exposes simple APIs for tasks like chatting with Gemini or running Google searches.

## 🚀 Features

- Persistent login via local storage and cookies
- Chat interface automation (Gemini, Google Search, etc.)
- DOM-based login detection
- Idle timeout handling
- n8n‑compatible API endpoints

## ⚙️ Prerequisites

- Node.js (v20 or newer recommended)
- Chrome installed (or use the bundled Chromium from Puppeteer)
- Git
- Puppeteer extra plugins

## 📦 Installation

```bash
git clone https://github.com/irshadali21/localBrowser.git
cd localBrowser
npm install
```

## 🔐 Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```
cp .env.example .env
```

Edit `.env` to provide your own API key and credentials.
Only use `.env` for local testing—never commit real credentials.

## 🧪 Run the Project

```bash
npm run dev
# or
node index.js
```

The API will be available at `http://localhost:5000`.

### Manual Gemini Login

To use the chat endpoints you must sign in to Gemini manually. Run `POST /chat/prepare` once while the server is started (with `HEADLESS=false` in your `.env`). A browser window will open—log in and close the tab. The session is stored and reused for future requests.

## VPS Setup (personal reference)

1. Create the `.env` file and add the required values.
2. Install and use pm2 for stability:

   ```bash
   npm install -g pm2
   pm2 start index.js --name localBrowser
   pm2 save
   pm2 startup
   ```
3. To stop or delete the existing process:

   ```bash
   pm2 stop localBrowser
   pm2 delete localBrowser
   ```
4. View logs:

   ```bash
   pm2 logs localBrowser
   ```
5. If running as the `administrator` user:

   ```bash
   sudo chown -R administrator:administrator /var/www/localBrowser/logs
   pm2 restart localBrowser
   ```

## 🧠 Available APIs

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/chat/prepare` | Open chat session or reuse an existing one |
| `POST` | `/chat/message` | Send a message and get the latest Gemini reply |
| `POST` | `/chat/close` | Gracefully close the active chat tab |
| `POST` | `/browser/execute` | Execute JavaScript in a new browser page |
| `GET`  | `/browser/search` | Search the web using Google |
| `GET`  | `/browser/visit`  | Visit the specified URL and return HTML |
| `GET`  | `/browser/scrape` | Scrape a product page using a vendor |
| `GET`  | `/pages/list` | List tracked browser pages |
| `POST` | `/pages/request` | Get or create a page of a given type |
| `POST` | `/error/report`   | Report an error to the server |

A Postman collection for these endpoints is available in `postman/LocalBrowser.postman_collection.json`. Import it into Postman and set `baseUrl` and `API_KEY` variables to match your environment.
