const express = require('express');
const router = express.Router();
const { prepareChat, sendChat, closeChat } = require('../helpers/chatManager');



router.post('/prepare-chat', async (req, res) => {
  try {
    const result = await prepareChat();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error preparing chat', details: e.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const reply = await sendChat(prompt);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'Error sending message', details: e.message });
  }
});

router.post('/close-chat', async (req, res) => {
  try {
    await closeChat();
    res.json({ status: 'chat closed' });
  } catch (e) {
    res.status(500).json({ error: 'Error closing chat', details: e.message });
  }
});

module.exports = router;
