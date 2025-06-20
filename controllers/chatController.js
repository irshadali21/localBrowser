// controllers/chatController.js
const { prepareChat, sendChat } = require('../helpers/chatManager');
const { logErrorToDB } = require('../utils/errorLogger');

// Prepare Gemini chat session
exports.prepare = async (req, res, next) => {
  try {
    const result = await prepareChat();
    res.json(result);
  } catch (err) {
    console.error('[ChatController] Prepare error:', err);
    logErrorToDB({
      type: 'CHAT_PREPARE_FAILED',
      message: err.message,
      stack: err.stack,
      route: '/chat/prepare',
      input: req.body
    });
    next(err);
  }
};

// Send a message to Gemini
exports.message = async (req, res, next) => {
  try {
    const reply = await sendChat(req.body.prompt);
    res.json({ reply });
  } catch (err) {
    console.error('[ChatController] Message error:', err);
    logErrorToDB({
      type: 'CHAT_SEND_FAILED',
      message: err.message,
      stack: err.stack,
      route: '/chat/message',
      input: req.body
    });
    next(err);
  }
};

