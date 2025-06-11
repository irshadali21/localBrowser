**🧠 localBrowser**
A Puppeteer-powered local automation server with persistent sessions, chat APIs, and support for platforms like Gemini and Google.

**🚀 Features**
Persistent login via local storage & cookies
Chat interface automation (Gemini, Google Search, etc.)
DOM-based login detection
Idle timeout handling
n8n-compatible API endpoints

**⚙️ Prerequisites**
Node.js (v20+ recommended)
Chrome installed (or bundled Chromium via Puppeteer)
Git
Puppeteer Extra Plugins

**📦 Installation**
git clone https://github.com/irshadali21/localBrowser.git
cd localBrowser
npm install

**🔐 Environment Setup**
Create a .env file:
API_KEY=add-your-own-key
PORT=5000
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_PASSWORD=your-password

⚠️ Only use .env for secure local testing. Never commit real credentials.

**🧪 Run the Project**
npm run dev
# or
node index.js
API will run at: http://localhost:5000

**🧠 Available APIs**
Endpoint	Description
POST /prepare-chat	Open chat session, reuse if exists
POST /chat	Send message, returns latest Gemini reply
POST /close-chat	Gracefully close the active tab
GET /open-login-page	Opens a tab for manual login
