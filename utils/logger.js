// utils/logger.js
const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `log-${new Date().toISOString().split('T')[0]}.txt`);

function logger(message) {
  const timestamp = new Date().toISOString();
  const fullMsg = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, fullMsg);
  console.log(fullMsg.trim());
}

module.exports = { logger };
