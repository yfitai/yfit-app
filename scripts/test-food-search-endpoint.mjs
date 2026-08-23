import assert from 'node:assert/strict';
import handler from '../api/food/search.js';

function createResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

const originalFetch = global.fetch;
const originalKey = process.env.USDA_API_KEY;

try {
  process.env.USDA_API_KEY = 'test-key';
  let receivedUrl;
  let receivedOptions;
  global.fetch = async (url, options) => {
    receivedUrl = url;
    receivedOptions = options;
    return {
      ok: true,
      json: async () => ({ foods: [{ description: 'Apple' }] }),
    };
  };

  const response = createResponse();
  await handler({ method: 'GET', query: { query: 'apple', pageSize: '20' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { foods: [{ description: 'Apple' }] });
  assert.match(receivedUrl, /api_key=test-key/);
  assert.equal(receivedOptions.method, 'POST');
  assert.equal(receivedOptions.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(receivedOptions.body), {
    query: 'apple',
    pageSize: 20,
    pageNumber: 1,
    sortBy: 'score',
    sortOrder: 'desc',
    dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
  });

  const unavailableResponse = createResponse();
  delete process.env.USDA_API_KEY;
  await handler({ method: 'GET', query: { query: 'apple' } }, unavailableResponse);
  assert.equal(unavailableResponse.statusCode, 503);
  assert.equal(unavailableResponse.body.error, 'Food search is temporarily unavailable');

  console.log('Food search endpoint test passed.');
} finally {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.USDA_API_KEY;
  else process.env.USDA_API_KEY = originalKey;
}
