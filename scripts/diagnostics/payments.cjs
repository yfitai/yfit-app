#!/usr/bin/env node
/** Read-only actual-source diagnostics. No network, real environment, provider or DB access.
 * Run: env -i PATH="$PATH" HOME=/tmp node scripts/diagnostics/payments.cjs
 * REPRODUCED means the current source exhibits a defect, NOT a readiness pass.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const ROOT = path.resolve(__dirname, '../..');
const quiet = { log() {}, warn() {}, error() {} };
const env = {
  STRIPE_SECRET_KEY: 'synthetic-placeholder',
  STRIPE_WEBHOOK_SECRET: 'synthetic-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-placeholder',
  STRIPE_PRICE_PRO_MONTHLY: 'fixture-month', STRIPE_PRICE_PRO_YEARLY: 'fixture-year',
  STRIPE_PRICE_PRO_LIFETIME: 'fixture-life',
  STRIPE_PRICE_MONTHLY: 'fixture-month', STRIPE_PRICE_YEARLY: 'fixture-year',
  STRIPE_PRICE_LIFETIME: 'fixture-life'
};
function source(name) { return fs.readFileSync(path.join(ROOT, name), 'utf8'); }
function handler(name, stripe, db, overrides = {}) {
  // Evaluate the original JS logic with ONLY imports/exports replaced by fixture bindings.
  const code = source(name).replace(/^import .*;\s*$/mg, '')
    .replace('export default async function handler', 'async function handler')
    .replace('export const config', 'const config') + '\n;globalThis.actualHandler = handler;';
  function Stripe() { return stripe; }
  const ctx = vm.createContext({ Stripe, createClient: () => db,
    process: { env: { ...env, ...overrides } }, console: quiet, Date, Buffer });
  vm.runInContext(code, ctx, { filename: name, timeout: 1000 });
  return ctx.actualHandler;
}
function database({ absentProfile = false, lookupError = false, noRows = false,
  updateError = false, currentPlan = 'pro_yearly', currentSub = 'fixture-new-sub' } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      let action = 'select', payload, filters = [];
      const chain = {
        select() { return chain; },
        eq(key, value) { filters.push([key, value]); return chain; },
        maybeSingle: async () => ({ data: absentProfile ? null : {
          user_id: '00000000-0000-0000-0000-000000000001',
          plan_type: currentPlan, stripe_subscription_id: currentSub
        }, error: lookupError ? { code: 'fixture-transient-error' } : null }),
        update(data) { action = 'update'; payload = data; return chain; },
        upsert(data) { action = 'upsert'; payload = data; return chain; },
        then(resolve, reject) {
          calls.push({ table, action, payload, filters });
          return Promise.resolve({ data: noRows ? [] : [payload], count: noRows ? 0 : 1,
            error: updateError ? { code: 'fixture-write-error' } : null }).then(resolve, reject);
        }
      };
      return chain;
    }
  };
}
function stripeFixture(event, status = 'active') {
  return {
    webhooks: { constructEvent: () => event }, // signature verification is NOT tested here
    subscriptions: { retrieve: async () => ({ id: 'fixture-new-sub', status,
      customer: 'fixture-customer', items: { data: [{ price: { id: 'fixture-year' } }] },
      current_period_start: 100, current_period_end: 200, cancel_at_period_end: false }) },
    checkout: { sessions: { listLineItems: async () => ({ data: [{ price: { id: 'fixture-life' } }] }) } }
  };
}
async function invoke(fn, body = {}) {
  const req = new EventEmitter(); req.method = 'POST'; req.headers = {}; req.body = body;
  const res = { statusCode: 200, status(n) { this.statusCode = n; return this; },
    json(x) { this.result = x; return this; } };
  const pending = fn(req, res);
  setImmediate(() => { req.emit('data', Buffer.from('{}')); req.emit('end'); });
  await pending;
  return res;
}
function event(type, object) { return { id: 'fixture-event', type, data: { object } }; }
function flags(row) {
  const text = source('src/contexts/SubscriptionContext.jsx');
  const start = text.search(/const planType\s*=/);
  const end = text.search(/const loadSubscription\s*=/);
  assert(start >= 0 && end > start, 'Source derived-flags boundaries changed');
  return vm.runInNewContext(text.slice(start, end) + '\n;({isPro, isTrialing, isYearlyOrLifetime,isLifetime})',
    { subscription: row, Date, Math }, { timeout: 1000 });
}
const results = [];
async function reproduce(name, fn) {
  try { await fn(); results.push({ name, result: 'REPRODUCED' }); }
  catch { results.push({ name, result: 'NOT_REPRODUCED_OR_SOURCE_CHANGED' }); process.exitCode = 1; }
}
(async () => {
  await reproduce('Aligned price configuration still grants active lifetime for unpaid known lifetime price', async () => {
    const db = database(); const e = event('checkout.session.completed', {
      id: 'fixture-checkout', customer: 'fixture-customer', mode: 'payment',
      customer_email: 'synthetic@example.invalid', payment_status: 'unpaid'
    });
    const res = await invoke(handler('api/stripe/webhook.js', stripeFixture(e), db));
    assert.equal(res.statusCode, 200); assert.equal(db.calls[0].payload.plan_type, 'pro_lifetime');
    assert.equal(db.calls[0].payload.status, 'active');
  });
  for (const state of ['trialing', 'incomplete', 'past_due']) {
    await reproduce('Recurring Checkout overwrites retrieved '+state+' with active under aligned prices', async () => {
      const db = database(); const e = event('checkout.session.completed', {
        id: 'fixture-checkout', customer: 'fixture-customer', mode: 'subscription',
        subscription: 'fixture-new-sub', customer_email: 'synthetic@example.invalid', payment_status: 'unpaid'
      });
      await invoke(handler('api/stripe/webhook.js', stripeFixture(e, state), db));
      assert.equal(db.calls[0].payload.plan_type, 'pro_yearly');
      assert.equal(db.calls[0].payload.status, 'active');
    });
  }
  await reproduce('Transient profile lookup failure is acknowledged without durable purchase receipt', async () => {
    const db = database({ lookupError: true }); const e = event('checkout.session.completed', {
      id: 'fixture-checkout', customer: 'fixture-customer', mode: 'payment',
      customer_email: 'synthetic@example.invalid', payment_status: 'paid'
    });
    const res = await invoke(handler('api/stripe/webhook.js', stripeFixture(e), db));
    assert.equal(res.statusCode, 200); assert.equal(db.calls.length, 0);
  });
  await reproduce('Successful invoice with zero affected rows is acknowledged as fulfilled', async () => {
    const db = database({ noRows: true }); const e = event('invoice.payment_succeeded', {
      customer: 'fixture-customer', subscription: 'fixture-new-sub'
    });
    const res = await invoke(handler('api/stripe/webhook.js', stripeFixture(e), db));
    assert.equal(res.statusCode, 200); assert.equal(db.calls[0].action, 'update');
    assert.deepEqual(db.calls[0].filters.map(x => x[0]), ['user_id']);
  });
  await reproduce('Old subscription deletion downgrades a lifetime row without checking current subscription', async () => {
    const db = database({ currentPlan: 'pro_lifetime', currentSub: null });
    const e = event('customer.subscription.deleted', {
      id: 'fixture-old-sub', customer: 'fixture-customer', current_period_end: 200
    });
    await invoke(handler('api/stripe/webhook.js', stripeFixture(e), db));
    assert.equal(db.calls[0].payload.plan_type, 'free');
    assert.deepEqual(db.calls[0].filters.map(x => x[0]), ['user_id']);
  });
  await reproduce('Checkout caller can bind another synthetic email without a verified user identifier', async () => {
    let params;
    const stripe = { checkout: { sessions: { create: async x => { params = x; return { url: 'https://example.invalid/checkout' }; } } } };
    const fn = handler('api/stripe/create-checkout-session.js', stripe, null);
    const res = await invoke(fn, { plan: 'proYearly', customerEmail: 'different@example.invalid',
      successUrl: 'https://example.invalid/success', cancelUrl: 'https://example.invalid/cancel' });
    assert.equal(res.statusCode, 200); assert.equal(params.customer_email, 'different@example.invalid');
    assert.equal(params.metadata.user_id, undefined); assert.equal(params.client_reference_id, undefined);
    assert.equal(params.subscription_data.metadata.user_id, undefined);
  });
  await reproduce('Expired yearly grace retains yearly-only privileges and Pro despite explicit expiry', () => {
    const value = flags({ plan_type: 'pro_yearly', status: 'grace_period', grace_period_ends_at: '2000-01-01T00:00:00Z' });
    assert.equal(value.isPro, true); assert.equal(value.isYearlyOrLifetime, true);
  });
  await reproduce('Paid-plan expired trial is not trialing yet still bypasses Pro gate', () => {
    const value = flags({ plan_type: 'pro_monthly', status: 'trialing', trial_end: '2000-01-01T00:00:00Z' });
    assert.equal(value.isTrialing, false); assert.equal(value.isPro, true);
  });
  const names = ['api/stripe/webhook.js', 'api/stripe/create-checkout-session.js', 'src/contexts/SubscriptionContext.jsx'];
  const hashes = Object.fromEntries(names.map(n => [n, crypto.createHash('sha256').update(source(n)).digest('hex')]));
  console.log(JSON.stringify({ date: '2026-11-13', fixture_only: true, network_access: false,
    signature_verification_tested: false, source_hashes: hashes, results }, null, 2));
})().catch(() => { console.log('Diagnostic setup failure; raw exceptions intentionally suppressed.'); process.exitCode = 1; });
