import assert from 'node:assert/strict';
import handler from '../api/food/search.js';

if (!process.env.USDA_API_KEY) {
  throw new Error('USDA_API_KEY must be supplied through the environment for this live integration test.');
}

const response = {
  statusCode: null,
  body: null,
  setHeader() {},
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

await handler({ method: 'GET', query: { query: 'apple', pageSize: '5' } }, response);

assert.equal(response.statusCode, 200, `Expected USDA proxy success, received ${response.statusCode}: ${JSON.stringify(response.body)}`);
assert.ok(Array.isArray(response.body?.foods), 'Expected the USDA proxy to return a foods array.');
assert.ok(response.body.foods.length > 0, 'Expected the USDA proxy to return at least one food result.');

console.log(`Live USDA proxy test passed with ${response.body.foods.length} results.`);
