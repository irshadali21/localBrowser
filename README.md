#**🧠 localBrowser**

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

or

node index.js

API will run at: http://localhost:5000

**For my personal use**  (I  forget too many times) VPS instructions

🔐  Create .env File

nano .env

add the required data 


Use pm2 for stability:

npm install -g pm2

pm2 start index.js --name localBrowser

pm2 save

pm2 startup


Stop and delete the old process:

pm2 stop localBrowser

pm2 delete localBrowser

**Logs**

pm2 logs localBrowser


if you're running as administrator, use:

sudo chown -R administrator:administrator /var/www/localBrowser/logs

Then restart the app:

pm2 restart localBrowser



**🧠 Available APIs**


| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/chat/prepare` | Open chat session, reuse if exists |
| `POST` | `/chat/message` | Send message and get latest Gemini reply |
| `POST` | `/chat/close` | Gracefully close the active chat tab |

