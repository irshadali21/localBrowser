// controllers/chatController.js
const { prepareChat, sendChat, closeChat } = require('../helpers/chatManager');
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

// Close Gemini chat tab
exports.close = async (req, res, next) => {
  try {
    await closeChat();
    res.json({ status: 'chat_closed' });
  } catch (err) {
    console.error('[ChatController] Close error:', err);
    next(err);
  }
};
