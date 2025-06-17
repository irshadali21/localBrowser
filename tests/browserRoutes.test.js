const request = require('supertest');
const express = require('express');

jest.mock('../helpers/browserHelper', () => ({
  googleSearch: jest.fn(),
  visitUrl: jest.fn(),
  scrapeProduct: jest.fn()
}));

const { googleSearch, visitUrl, scrapeProduct } = require('../helpers/browserHelper');
const browserRoutes = require('../routes/browserRoutes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/browser', browserRoutes);
app.use(errorHandler);

describe('Browser routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /browser/search without q returns 400', async () => {
    const res = await request(app).get('/browser/search');
    expect(res.status).toBe(400);
  });

  test('GET /browser/search returns results', async () => {
    googleSearch.mockResolvedValueOnce(['a']);
    const res = await request(app).get('/browser/search').query({ q: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: ['a'] });
  });

  test('GET /browser/visit without url returns 400', async () => {
    const res = await request(app).get('/browser/visit');
    expect(res.status).toBe(400);
  });

  test('GET /browser/visit with invalid url returns 400', async () => {
    const res = await request(app).get('/browser/visit').query({ url: 'ftp://x' });
    expect(res.status).toBe(400);
  });

  test('GET /browser/visit returns html', async () => {
    visitUrl.mockResolvedValueOnce('<html></html>');
    const res = await request(app).get('/browser/visit').query({ url: 'http://x.com' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ html: '<html></html>' });
  });

  test('GET /browser/scrape with missing params returns 400', async () => {
    const res = await request(app).get('/browser/scrape').query({ url: 'http://x.com' });
    expect(res.status).toBe(400);
  });

  test('GET /browser/scrape returns data', async () => {
    scrapeProduct.mockResolvedValueOnce({ price: 1 });
    const res = await request(app).get('/browser/scrape').query({ url: 'http://x.com', vendor: 'v' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ price: 1 });
  });

  test('Errors are handled by middleware', async () => {
    googleSearch.mockRejectedValueOnce(new Error('boom'));
    const res = await request(app).get('/browser/search').query({ q: 'hi' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
