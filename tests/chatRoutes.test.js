const request = require('supertest');
const express = require('express');
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
});
