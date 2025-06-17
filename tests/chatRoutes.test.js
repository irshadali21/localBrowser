const request = require('supertest');
const express = require('express');

jest.mock('../helpers/chatManager', () => ({
  sendChat: jest.fn()
}));

const { sendChat } = require('../helpers/chatManager');
const chatRoutes = require('../routes/chatRoutes');

const app = express();
app.use(express.json());
app.use('/chat', chatRoutes);

describe('POST /chat/message', () => {
  test('returns 400 when prompt is empty', async () => {
    const res = await request(app)
      .post('/chat/message')
      .send({ prompt: '' });
    expect(res.status).toBe(400);
  });

  test('returns reply when prompt is valid', async () => {
    sendChat.mockResolvedValueOnce('Hello there');
    const res = await request(app)
      .post('/chat/message')
      .send({ prompt: 'Hi' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: 'Hello there' });
  });
});
