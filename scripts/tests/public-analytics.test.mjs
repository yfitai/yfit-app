import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createPublicAnalytics, publicPage, campaignParams, buildPublicLink, safeReferrer, COOKIE_KEY, EXCLUDE_KEY } from '../../src/lib/publicAnalytics.js'

// No real browser, network, Supabase, auth, emails or analytics events in this suite.
globalThis.fetch = () => { throw new Error('Network prohibited in offline public analytics tests') }
function fixture(url = 'https://app.yfitai.com/go?utm_source=pinterest&utm_medium=social&utm_campaign=organic', choice) {
  const values = new Map(choice ? [[COOKIE_KEY, choice]] : [])
  let at = 1000, n = 0
  const timers = new Map(), scripts = [], sent = []
  const win = { location: new URL(url), navigator: { language: 'en-CA' }, screen: { width: 390, height: 844 }, localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
  const doc = {
    referrer: 'https://www.pinterest.com/pin/123?email=private@example.test',
    getElementById: id => scripts.find(s => s.id === id && !s.removed) || null,
    createElement: () => ({ attrs: {}, setAttribute(key, value) { this.attrs[key] = value }, remove() { this.removed = true } }),
    head: { appendChild: s => scripts.push(s) },
  }
  const controller = createPublicAnalytics({ win, doc, now: () => at, schedule: (fn, ms) => { timers.set(++n, { fn, ms }); return n }, cancel: id => timers.delete(id) })
  function load() { win.umami = { track: p => { sent.push(p); return Promise.resolve() } }; scripts.at(-1)?.onload?.() }
  return { win, doc, values, timers, scripts, sent, controller, load, tick(ms) { at += ms }, timeout() { for (const t of [...timers.values()]) t.fn() } }
}

test('fresh direct Go visitor has no script or events until acceptance', () => {
  const f = fixture(); f.controller.beginPage('one'); f.controller.event('go_header_cta')
  assert.equal(f.controller.consent(), null); assert.equal(f.scripts.length, 0); assert.equal(f.sent.length, 0)
  f.controller.setConsent('accepted'); assert.equal(f.scripts.length, 1); f.load()
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].url, '/go?utm_source=pinterest&utm_medium=social&utm_campaign=organic'); assert.equal(f.sent[0].name, undefined)
})
test('accepting later records current page once, never pre-consent clicks or earlier pages', () => {
  const f = fixture(); const release = f.controller.beginPage('old'); f.controller.event('go_header_cta'); release()
  f.win.location = new URL('https://app.yfitai.com/signup?email=secret@example.test'); f.controller.beginPage('new'); f.controller.setConsent('accepted'); f.load()
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].url, '/signup'); assert.equal(f.sent[0].name, undefined)
})
test('decline permits public usage but loads no tracker and records no events', () => {
  const f = fixture(); f.controller.beginPage('one'); f.controller.setConsent('declined'); f.controller.event('go_header_cta')
  assert.equal(f.values.get(COOKIE_KEY), 'declined'); assert.equal(f.scripts.length, 0); assert.equal(f.sent.length, 0)
})
test('previous accepted consent queues current visit while script loads', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.controller.event('go_header_cta'); assert.equal(f.sent.length, 0); f.load()
  assert.equal(f.sent.length, 2); assert.equal(f.sent[0].name, undefined); assert.equal(f.sent[1].name, 'go_header_cta')
})
test('tracker disables all auto tracking, uses exact hosts and does not identify people', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); const script = f.scripts[0]
  assert.equal(script.attrs['data-auto-track'], 'false'); assert.equal(script.attrs['data-domains'], 'app.yfitai.com,www.yfitai.com,yfitai.com')
  assert.equal(script.attrs['data-distinct-id'], undefined); assert.equal(script.attrs['data-performance'], undefined); assert.equal(script.attrs['data-errors'], undefined)
})
test('StrictMode queued cleanup/remount does not lose or duplicate the pageview', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('same')(); f.controller.beginPage('same'); f.load()
  assert.equal(f.scripts.length, 1); assert.equal(f.sent.length, 1)
})
test('StrictMode remount after send does not count a second pageview', () => {
  const f = fixture(undefined, 'accepted'); const release = f.controller.beginPage('same'); f.load(); release(); f.controller.beginPage('same')
  assert.equal(f.sent.length, 1)
})
test('new route entry counts once but legacy custom visit is never added', () => {
  const f = fixture(undefined, 'accepted'); const release = f.controller.beginPage('one'); f.load(); f.controller.event('go_page_view_v2'); release(); f.controller.beginPage('two')
  assert.equal(f.sent.length, 2); assert.ok(f.sent.every(p => !p.name))
})
test('route change cancels queued old page and events', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('old')(); f.win.location = new URL('https://app.yfitai.com/login'); f.controller.beginPage('new'); f.load()
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].url, '/login')
})
test('leaving Go before acceptance does not retroactively count it', () => {
  const f = fixture(); f.controller.beginPage('old')(); f.win.location = new URL('https://app.yfitai.com/dashboard'); f.controller.setConsent('accepted')
  assert.equal(f.scripts.length, 0); assert.equal(f.sent.length, 0)
})
test('withdrawal cancels queued data, removes script and prevents future collection', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); const oldLoad = f.scripts[0].onload; f.controller.setConsent('declined'); oldLoad()
  assert.equal(f.sent.length, 0); assert.equal(f.scripts[0].removed, true); f.controller.event('go_header_cta'); assert.equal(f.sent.length, 0)
})
test('withdrawal after ready prevents all new calls', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.load(); f.controller.setConsent('declined'); f.controller.event('go_header_cta'); assert.equal(f.sent.length, 1)
})
test('storage consent changes in another tab are honored', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.values.set(COOKIE_KEY, 'declined'); f.controller.syncConsent(); f.load(); assert.equal(f.sent.length, 0)
})
test('blocked consent storage fails closed initially and supports same-tab choice', () => {
  const f = fixture(); f.win.localStorage = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') } }
  f.controller.beginPage('one'); assert.equal(f.scripts.length, 0); f.controller.setConsent('accepted'); f.load(); assert.equal(f.sent.length, 1)
})
test('loading timeout clears pending events with no automatic retry', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.timeout(); f.load(); f.controller.event('go_header_cta')
  assert.equal(f.sent.length, 0); assert.equal(f.scripts.length, 1); assert.equal(f.scripts[0].removed, true)
})
test('script failure fails safely without fallback or retry', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.scripts[0].onerror(); f.controller.event('go_header_cta')
  assert.equal(f.sent.length, 0); assert.equal(f.scripts.length, 1)
})
test('missing track API cannot be called a successful measurement', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.scripts[0].onload(); f.controller.event('go_header_cta'); assert.equal(f.sent.length, 0)
})
test('pre-existing automatic tracker is not reused', () => {
  const f = fixture(undefined, 'accepted'); f.scripts.push({ id: 'umami-analytics', attrs: {} }); f.win.umami = { track: p => f.sent.push(p) }; f.controller.beginPage('one')
  assert.equal(f.scripts.length, 1); assert.equal(f.sent.length, 0)
})
test('blocked and expired script events are never replayed', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.tick(11000); f.load(); assert.equal(f.sent.length, 0)
})
test('post-consent queue is bounded to one visit and nineteen events', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); for (let i = 0; i < 100; i++) f.controller.event('go_header_cta'); f.load(); assert.equal(f.sent.length, 20)
})
test('health/auth/email/query/hash values never enter payload or referrer', () => {
  const f = fixture('https://app.yfitai.com/go?utm_source=facebook&utm_content=private%40example.test&tdee=2200&goal=loss&email=private%40example.test#access_token=secret', 'accepted'); f.controller.beginPage('one'); f.load(); f.controller.event('go_header_cta', { email: 'private@example.test', tdee: '2200', section: 'health-secret' })
  const data = JSON.stringify(f.sent); assert.ok(!/private|2200|secret|access_token|tdee|goal/.test(data)); assert.equal(f.sent[0].referrer, 'https://pinterest.com'); assert.equal(f.sent[1].data.source, 'facebook')
})
test('untagged or unknown-tagged arrivals are unknown, not fabricated direct', () => {
  for (const query of ['', '?utm_source=private@example.test', '?utm_source=rogadrone']) {
    const f = fixture('https://app.yfitai.com/go' + query, 'accepted'); f.controller.beginPage('one'); f.load(); f.controller.event('go_header_cta'); assert.equal(f.sent[1].data.source, 'unknown'); assert.equal(f.sent[0].url, '/go')
  }
})
test('explicit direct tag is distinct from absent attribution', () => {
  assert.equal(campaignParams('?utm_source=direct').get('utm_source'), 'direct')
})
test('six known source tags normalize consistently without arbitrary text', () => {
  for (const source of ['facebook', 'instagram', 'pinterest', 'linkedin', 'youtube', 'tiktok']) assert.equal(campaignParams(`?utm_source=${source.toUpperCase()}`).get('utm_source'), source)
})
test('only agreed fixed campaign classifications are retained', () => {
  assert.equal(campaignParams('?utm_source=facebook&utm_medium=social&utm_campaign=organic&utm_term=secret&utm_content=name').toString(), 'utm_source=facebook&utm_medium=social&utm_campaign=organic')
  assert.equal(campaignParams('?utm_campaign=private@example.test&utm_medium=private').toString(), '')
})
test('safe public onward links preserve source without leaking health queries', () => {
  const url = new URL(buildPublicLink('https://yfitai.com/?email=private@example.test#access_token=secret', '?utm_source=pinterest&tdee=2200'))
  assert.equal(url.search, '?utm_source=pinterest'); assert.equal(url.hash, '')
})
test('demo destination behavior is preserved but cannot masquerade as Go traffic', () => {
  const result = buildPublicLink('https://app.yfitai.com/go?mode=guest', '?utm_source=facebook'); assert.equal(new URL(result).searchParams.get('mode'), 'guest'); assert.equal(publicPage(new URL(result)), null)
})
test('links cannot attach campaign fields to outside or private destinations', () => {
  for (const url of ['https://example.test/', 'https://app.yfitai.com/dashboard', 'https://owner:password@app.yfitai.com/go']) assert.equal(buildPublicLink(url, '?utm_source=facebook'), url)
})
test('referrer sanitization removes private paths and entirely omits unknown domains', () => {
  assert.equal(safeReferrer('https://l.facebook.com/l.php?secret=1'), 'https://facebook.com'); assert.equal(safeReferrer('https://private.example.test/name'), ''); assert.equal(safeReferrer('bad'), '')
})
for (const url of ['https://admin.yfitai.com/go', 'https://app.yfitai.com/dashboard', 'https://app.yfitai.com/nutrition?weight=100', 'https://app.yfitai.com/auth/callback#access_token=secret', 'capacitor://localhost/go', 'http://localhost:5173/go', 'https://preview.example.test/go', 'https://app.yfitai.com/go?mode=guest']) {
  test(`excluded host/route/protocol never injects or tracks: ${url}`, () => { const f = fixture(url, 'accepted'); f.controller.beginPage('one'); assert.equal(f.scripts.length, 0); assert.equal(f.sent.length, 0) })
}
for (const url of ['https://app.yfitai.com/go', 'https://www.yfitai.com/go', 'https://yfitai.com/go', 'https://yfitai.com/', 'https://app.yfitai.com/signup', 'https://app.yfitai.com/login']) {
  test(`eligible consented public entry: ${url}`, () => { const f = fixture(url, 'accepted'); f.controller.beginPage('one'); f.load(); assert.equal(f.sent.length, 1); assert.equal(f.sent[0].hostname, new URL(url).hostname) })
}
test('root-domain consent never grants app-subdomain consent automatically', () => {
  const root = fixture('https://yfitai.com/', 'accepted'), app = fixture('https://app.yfitai.com/go'); root.controller.beginPage('root'); root.load(); app.controller.beginPage('app'); assert.equal(root.sent.length, 1); assert.equal(app.sent.length, 0); assert.equal(app.scripts.length, 0)
})
for (const setting of ['test', 'umami', 'dnt', 'gpc']) {
  test(`privacy/test exclusion honored: ${setting}`, () => { const f = fixture(undefined, 'accepted'); if (setting === 'test') f.values.set(EXCLUDE_KEY, 'true'); if (setting === 'umami') f.values.set('umami.disabled', '1'); if (setting === 'dnt') f.win.navigator.doNotTrack = '1'; if (setting === 'gpc') f.win.navigator.globalPrivacyControl = true; f.controller.beginPage('one'); assert.equal(f.scripts.length, 0) })
}
test('private route changes before queued event flush fail closed', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.win.location = new URL('https://app.yfitai.com/medications'); f.load(); assert.equal(f.sent.length, 0)
})
test('event names and dynamic properties are bounded and allowlisted', () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.load(); f.controller.event('login'); f.controller.event('go_preview_explore_private'); f.controller.event('go_preview_explore_dashboard'); assert.equal(f.sent.length, 2); assert.deepEqual(f.sent[1].data, { source: 'pinterest' })
})
test('throwing collection and rejected promises do not break the public page or retry', async () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); f.load(); f.win.umami.track = () => { throw Error('blocked') }; assert.doesNotThrow(() => f.controller.event('go_header_cta')); f.win.umami.track = () => Promise.reject(Error('blocked')); f.controller.event('go_header_cta'); await Promise.resolve(); assert.equal(f.sent.length, 1)
})
test('integration has shared public consent and no global or custom visit double count', () => {
  const root = new URL('../../', import.meta.url)
  const app = fs.readFileSync(new URL('src/App.jsx', root), 'utf8'), go = fs.readFileSync(new URL('src/pages/GoPage.tsx', root), 'utf8'), landing = fs.readFileSync(new URL('src/pages/LandingPage.tsx', root), 'utf8'), consent = fs.readFileSync(new URL('src/components/CookieConsent.tsx', root), 'utf8')
  assert.match(app, /<PublicAnalyticsBoundary active=/); assert.doesNotMatch(app, /initAnalyticsFromConsent\(\)/); assert.doesNotMatch(landing, /<CookieConsent/); assert.doesNotMatch(go, /track\("go_page_view_v2"\)/); assert.match(consent, /Analytics privacy/); assert.match(consent, /choose\("declined"\)/); assert.match(go, /href=\{publicLink\(DEMO_URL\)\}/); assert.match(go, /href=\{publicLink\(MARKETING_URL\)\}/)
})

// Static snapshot GET of the existing public tracker, NOT a live analytics execution.
// SHA256: 7eba89b02651cb67beefeb8aed5d39402f7994b226114c2c639ae354dc1a94f2.
import vm from 'node:vm'
function actualTrackerFixture(f) {
  const calls = []
  const source = fs.readFileSync(new URL('./fixtures/umami-managed-2026-11-26.js', import.meta.url), 'utf8')
  const script = f.scripts.at(-1)
  script.getAttribute = key => script.attrs[key] ?? null
  f.doc.currentScript = script; f.doc.title = 'private user-entered text must not be sent'; f.doc.readyState = 'complete'
  f.doc.addEventListener = () => { throw Error('Automatic tracker initialization is prohibited') }
  f.win.document = f.doc; f.win.history = {}; f.win.top = f.win
  vm.runInNewContext(source, { window: f.win, URL, setTimeout: () => { throw Error('Automatic route tracking is prohibited') }, fetch: async (url, options) => { calls.push({ url, options }); return { json: async () => ({}) } } })
  script.onload()
  return calls
}
test('actual managed tracker sends only one safe manual Go pageview and no automatic initialization', async () => {
  const f = fixture('https://app.yfitai.com/go?utm_source=instagram&calories=2200&email=private@example.test#access_token=secret', 'accepted'); f.controller.beginPage('one'); const calls = actualTrackerFixture(f); await Promise.resolve()
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://manus-analytics.com/api/send')
  const body = JSON.parse(calls[0].options.body); assert.equal(body.type, 'event'); assert.equal(body.payload.url, '/go?utm_source=instagram'); assert.equal(body.payload.name, undefined)
  assert.ok(!/private|2200|secret|calories|access_token|identify/.test(calls[0].options.body)); assert.equal(calls[0].options.credentials, 'omit')
  f.controller.event('go_page_view_v2'); assert.equal(calls.length, 1)
})
test('actual managed tracker manual Go click also excludes raw URL, title and dynamic health fields', async () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); const calls = actualTrackerFixture(f); f.controller.event('go_cta_signup_top', { email: 'private@example.test', goal: 'health' }); await Promise.resolve()
  assert.equal(calls.length, 2); const body = JSON.parse(calls[1].options.body); assert.equal(body.payload.name, 'go_cta_signup_top'); assert.deepEqual(body.payload.data, { source: 'pinterest' }); assert.ok(!/private|health/.test(calls[1].options.body))
})
test('actual managed tracker withdrawal stops calls even though its public API object remains', async () => {
  const f = fixture(undefined, 'accepted'); f.controller.beginPage('one'); const calls = actualTrackerFixture(f); f.controller.setConsent('declined'); f.controller.event('go_header_cta'); await Promise.resolve(); assert.equal(calls.length, 1)
})

test('real Go remount/back navigation counts a new view even when router restores the same key', () => {
  const f = fixture(undefined, 'accepted'); const release = f.controller.beginPage({ route: 'restored-key' }); f.load(); release(); f.controller.beginPage({ route: 'restored-key' }); assert.equal(f.sent.length, 2)
})
