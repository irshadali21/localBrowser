// index.js
const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const errorHandler = require('./middleware/errorHandler');

// Middleware
app.use(express.json());

// API Key Auth Middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }
  next();
});

// Routes
app.use('/chat', require('./routes/chatRoutes'));
app.use('/browser', require('./routes/browserRoutes'));
app.use('/error', require('./routes/errorRoutes'));


// Default route
app.get('/', (req, res) => {
  res.json({ status: 'LocalBrowser API is running' });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
