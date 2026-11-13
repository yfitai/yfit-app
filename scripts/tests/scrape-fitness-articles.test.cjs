'use strict';

// Offline handler tests: no imports from remote URLs, credentials, network,
// provider calls, RSS scraping, or real database operations. Database conflict
// semantics are modeled here; this is not a PostgreSQL integration test.
// Run: node --test scripts/tests/scrape-fitness-articles.test.cjs
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const vm = require('node:vm');

const sourcePath = resolve(__dirname, '../../supabase/functions/scrape-fitness-articles/index.ts');
const source = readFileSync(sourcePath, 'utf8');
const importLine = 'import { createClient } from "https://esm.sh/@supabase/supabase-js@2";';
assert.ok(source.includes(importLine), 'Expected import must be intercepted before evaluation');
const javascript = stripTypeScriptTypes(source.replace(importLine, ''), { mode: 'strip' });

function article(url, title = 'Fitness training article', score = 0.9) {
  return {
    source_id: 'fixture-source', source_name: 'Synthetic source',
    source_url: 'https://example.invalid', url, title, summary: 'Synthetic fitness summary',
    published_at: '2026-11-13T00:00:00Z', category: 'fitness', relevance_score: score,
  };
}

async function execute({ candidates = [], existing = [], recentTitles = [], dbError = null, handlerJavascript = javascript } = {}) {
  const state = {
    rows: structuredClone(existing), logs: [], writes: [], selections: [], syntheticFetches: 0,
  };
  const supabase = {
    from(table) {
      let action = 'read';
      let payload;
      let options;
      let selection;
      const builder = {
        insert(value) { action = 'insert'; payload = value; return this; },
        upsert(value, opts) { action = 'upsert'; payload = value; options = opts; return this; },
        update(value) { action = 'update'; payload = value; return this; },
        select(value) { selection = value; return this; },
        single() { return this; },
        eq() { return this; },
        gte() { return this; },
        then(fulfilled, rejected) {
          return Promise.resolve().then(() => {
            if (table === 'automation_logs') {
              if (action === 'insert') {
                const log = { id: `fixture-log-${state.logs.length}`, ...payload };
                state.logs.push(log);
                return { data: log, error: null };
              }
              if (action === 'update') {
                Object.assign(state.logs.at(-1), payload);
                return { data: null, error: null };
              }
            }
            if (table === 'rss_sources') {
              if (action === 'read') return {
                data: [{ id: 'fixture-source', name: 'Synthetic source', rss_url: 'https://example.invalid/rss', category: 'fitness' }],
                error: null,
              };
              if (action === 'update') return { data: null, error: null };
            }
            if (table === 'scraped_articles') {
              if (action === 'read') {
                assert.equal(selection, 'title');
                return { data: recentTitles.map(title => ({ title })), error: null };
              }
              if (action === 'insert') {
                const seen = new Set(state.rows.map(row => row.url));
                for (const row of payload) {
                  if (seen.has(row.url)) return {
                    data: null,
                    error: { message: 'duplicate key value violates unique constraint "scraped_articles_url_key"' },
                  };
                  seen.add(row.url);
                }
                state.rows.push(...structuredClone(payload));
                return { data: payload.map(row => ({ url: row.url })), error: null };
              }
              if (action === 'upsert') {
                assert.equal(options.onConflict, 'url');
                assert.equal(options.ignoreDuplicates, true, 'Duplicates must never merge/overwrite');
                assert.equal(selection, 'url', 'Only actual inserted rows should be counted');
                state.writes.push(structuredClone(payload));
                state.selections.push(selection);
                if (dbError) return { data: null, error: { message: dbError } };
                // Model a single atomic conflict-ignore insertion and RETURNING url.
                const returned = [];
                for (const row of payload) {
                  if (!state.rows.some(existingRow => existingRow.url === row.url)) {
                    state.rows.push(structuredClone(row));
                    returned.push({ url: row.url });
                  }
                }
                return { data: returned, error: null };
              }
            }
            throw new Error(`Unexpected mocked DB operation: ${table}/${action}`);
          }).then(fulfilled, rejected);
        },
      };
      return builder;
    },
  };

  let handler;
  const context = vm.createContext({
    createClient: () => supabase,
    Deno: { env: { get: () => 'synthetic-only-not-a-credential' }, serve: fn => { handler = fn; } },
    Response, AbortSignal,
    console: { log() {}, warn() {}, error() {} },
    // Never delegate to global fetch. Only return an in-memory fixture.
    fetch: async url => {
      assert.equal(url, 'https://example.invalid/rss', 'Provider or unexpected network target is forbidden');
      state.syntheticFetches += 1;
      return new Response('<item></item>', { status: 200 });
    },
    __candidates: structuredClone(candidates),
  });
  vm.runInContext(handlerJavascript + '\n' +
    'parseRssFeed = () => __candidates;\n' +
    'scoreArticleRelevance = async articles => articles;\n', context, { timeout: 1000 });
  assert.equal(typeof handler, 'function');
  const response = await handler({ method: 'POST' });
  return { state, response, body: await response.json() };
}

function success(result, count) {
  assert.equal(result.response.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.articles_saved, count);
  assert.equal(result.state.logs.at(-1).status, 'completed');
  assert.equal(result.state.logs.at(-1).articles_processed, count);
}

test('existing URL with changed title is skipped and existing content/processed state preserved', async () => {
  const original = { url: 'https://example.invalid/a', title: 'Original title', summary: 'Original summary', is_processed: true };
  const result = await execute({ existing: [original], candidates: [article(original.url, 'Changed fitness title')] });
  success(result, 0);
  assert.deepEqual(result.state.rows, [original]);
  assert.equal(result.state.writes.length, 1);
});

test('reverting the article write to deployed plain-insert semantics reproduces the reported duplicate error', async () => {
  // A controlled source mutation models the insertion block supplied by the owner.
  const plainInsert = javascript
    .replace('.upsert(', '.insert(')
    .replace(/\}\)\),\s*\{ onConflict: 'url', ignoreDuplicates: true \}/, '}))');
  assert.ok(!plainInsert.includes('.upsert('));
  const original = { url: 'https://example.invalid/a', title: 'Old title', is_processed: true };
  const result = await execute({
    existing: [original], candidates: [article(original.url, 'Changed fitness title')],
    handlerJavascript: plainInsert,
  });
  assert.equal(result.response.status, 500);
  assert.equal(result.body.success, false);
  assert.equal(result.body.error, 'Failed to insert articles: duplicate key value violates unique constraint "scraped_articles_url_key"');
  assert.deepEqual(result.state.rows, [original]);
});

test('duplicate URLs within one batch keep highest-scored candidate and insert once', async () => {
  const url = 'https://example.invalid/a';
  const result = await execute({ candidates: [article(url, 'Lower ranked fitness title', 0.6), article(url, 'Highest ranked fitness title', 0.95)] });
  success(result, 1);
  assert.equal(result.state.writes[0].length, 1);
  assert.equal(result.state.rows[0].title, 'Highest ranked fitness title');
});

test('all URL duplicates return success with zero actual insertions', async () => {
  const originals = [
    { url: 'https://example.invalid/a', title: 'Original A', is_processed: true },
    { url: 'https://example.invalid/b', title: 'Original B', is_processed: false },
  ];
  const result = await execute({ existing: originals, candidates: originals.map(row => article(row.url, 'Changed ' + row.title)) });
  success(result, 0);
  assert.deepEqual(result.state.rows, originals);
});

test('successful new URLs return actual inserted count and preserve response contract', async () => {
  const result = await execute({ candidates: [article('https://example.invalid/a'), article('https://example.invalid/b')] });
  success(result, 2);
  assert.deepEqual(result.body, { success: true, articles_saved: 2 });
  assert.equal(result.state.rows.length, 2);
  assert.ok(result.state.rows.every(row => row.is_processed === false));
  assert.equal(result.response.headers.get('content-type'), 'application/json');
});

test('mixed existing/new URLs count only new insertions; replay inserts nothing', async () => {
  const original = { url: 'https://example.invalid/a', title: 'Original', is_processed: true };
  const candidates = [article(original.url, 'Changed original'), article('https://example.invalid/b')];
  const first = await execute({ existing: [original], candidates });
  success(first, 1);
  assert.deepEqual(first.state.rows[0], original);
  const replay = await execute({ existing: first.state.rows, candidates });
  success(replay, 0);
  assert.deepEqual(replay.state.rows, first.state.rows);
});

test('genuine non-URL database failure is still fatal and leaves article rows unchanged', async () => {
  const original = { url: 'https://example.invalid/a', title: 'Original', is_processed: true };
  const dbError = 'new row violates check constraint "synthetic_category_check"';
  const result = await execute({ existing: [original], candidates: [article('https://example.invalid/b')], dbError });
  assert.equal(result.response.status, 500);
  assert.deepEqual(result.body, { success: false, error: `Failed to insert articles: ${dbError}` });
  assert.deepEqual(result.state.rows, [original]);
  assert.equal(result.state.logs.at(-1).status, 'failed');
  assert.equal(result.state.logs.at(-1).error_message, result.body.error);
});

test('exact URL equality only: query, fragment, and trailing slash variations remain distinct', async () => {
  const urls = ['https://example.invalid/a', 'https://example.invalid/a?utm_source=x', 'https://example.invalid/a#section', 'https://example.invalid/a/'];
  const result = await execute({ candidates: urls.map(url => article(url)) });
  success(result, 4);
  assert.deepEqual(result.state.rows.map(row => row.url), urls);
});

test('existing recent-title filter still skips without writing articles', async () => {
  const result = await execute({ candidates: [article('https://example.invalid/a', 'Fitness duplicate title')], recentTitles: ['fitness duplicate title'] });
  success(result, 0);
  assert.equal(result.state.writes.length, 0);
});

test('empty synthetic candidates still return zero without article writes', async () => {
  const result = await execute();
  success(result, 0);
  assert.equal(result.state.writes.length, 0);
});

test('exact-URL dedup happens before ten-article cap so repeated URLs do not consume slots', async () => {
  const candidates = Array.from({ length: 12 }, (_, i) => article(`https://example.invalid/${i}`, `Fitness title ${i}`, 1 - i / 100));
  candidates.push(article('https://example.invalid/0', 'Lower duplicate title', 0.99));
  const result = await execute({ candidates });
  success(result, 10);
  assert.equal(result.state.writes[0].length, 10);
  assert.equal(new Set(result.state.rows.map(row => row.url)).size, 10);
});
