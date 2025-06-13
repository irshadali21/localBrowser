// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Middleware to validate prompt input
function validatePrompt(req, res, next) {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt must be a non-empty string' });
  }
  next();
}

// POST /chat/prepare
router.post('/prepare', chatController.prepare);

// POST /chat/message
router.post('/message', validatePrompt, chatController.message);

// POST /chat/close
router.post('/close', chatController.close);

module.exports = router;
