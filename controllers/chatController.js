// controllers/chatController.js
const { prepareChat, sendChat, closeChat } = require('../helpers/chatManager');

// Prepare Gemini chat session
exports.prepare = async (req, res) => {
  try {
    const result = await prepareChat();
    res.json(result);
  } catch (err) {
    console.error('[ChatController] Prepare error:', err);
    res.status(500).json({ error: 'CHAT_PREPARE_FAILED', message: err.message });
  }
};

// Send a message to Gemini
exports.message = async (req, res) => {
  try {
    const reply = await sendChat(req.body.prompt);
    res.json({ reply });
  } catch (err) {
    console.error('[ChatController] Message error:', err);
    res.status(500).json({ error: 'CHAT_SEND_FAILED', message: err.message });
  }
};

// Close Gemini chat tab
exports.close = async (req, res) => {
  try {
    await closeChat();
    res.json({ status: 'chat_closed' });
  } catch (err) {
    console.error('[ChatController] Close error:', err);
    res.status(500).json({ error: 'CHAT_CLOSE_FAILED', message: err.message });
  }
};
