import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareReview } from './planner.mjs';

// Synthetic local test inputs only: no fetched article, testimony, claimed outcome,
// real screenshot hash, or dependency on parent fixture/route file timing.
const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'pinterest', 'facebook'];
const ACCOUNT = 'Saving your own data needs an account.';
const DESTINATION = 'https://app.yfitai.com/go';
const SCREEN_FILENAMES = [
  'screen_01_dashboard.png', 'screen_02_goals.png', 'screen_03_nutrition.png',
  'screen_04_dailyTracker.png', 'screen_05_fitness.png', 'screen_06_medications.png',
  'screen_07_progress.png', 'screen_08_predictions.png', 'screen_09_recomp.png',
  'screen_10_aiCoach.png', 'screen_11_language.png',
];

function makeFixture() {
  return {
    input_kind: 'local-reviewed-fixture',
    production_workflow_adapter_verified: false,
    claim_reviewed: true,
    article: {
      title: 'Synthetic nutrition article fixture',
      url: 'https://www.yfitai.com/articles/nutrition-logging',
      summary: 'Test-only summary about nutrition logging, not a clinical finding.',
    },
    feature_key: 'nutrition',
    body_narration: 'This local article fixture discusses nutrition logging. Review the Nutrition and Daily Tracker screens.',
    account_line: ACCOUNT,
    scene_plan: [
      { kind: 'app-screen', filename: 'screen_03_nutrition.png', label: 'Nutrition', timing: 'measure-after-narration' },
      { kind: 'app-screen', filename: 'screen_04_dailyTracker.png', label: 'Daily Tracker', timing: 'measure-after-narration' },
    ],
    voice: { name: 'Achird', style: 'friendly male', provider: 'candidate-only-not-wired' },
  };
}

function makeRoutes() {
  const spoken = {
    tiktok: 'Open this address in your browser to explore YFIT.',
    instagram: 'Tap the link in our profile to explore YFIT.',
    youtube: 'Tap our channel name, then the Go link in our profile.',
    linkedin: 'Tap the YFIT link in this post to explore.',
    pinterest: 'Tap Visit site on this Pin to explore YFIT.',
    facebook: 'Tap the YFIT link in the first comment to explore.',
  };
  return {
    platforms: PLATFORMS.map((platform) => ({
      platform,
      spoken_cta: spoken[platform],
      screen_cta: platform === 'tiktok' ? 'app.yfitai.com/go\nType this address in your browser' : spoken[platform],
      caption_instruction: platform === 'tiktok'
        ? 'Type app.yfitai.com/go in your browser. No clickable website/bio link is currently verified.'
        : `Local review candidate for ${platform}. ${ACCOUNT}`,
      route_surface: platform === 'tiktok' ? 'manual-browser-address-not-clickable' : `${platform}-review-surface`,
      route_state: platform === 'instagram' ? 'hold-unverified-go-profile'
        : platform === 'tiktok' ? 'manual-address-fallback' : 'owner-verified-dated',
      destination: DESTINATION,
      evidence_date: '2026-11-26',
      release_note: 'Synthetic local test route; human review required before any release.',
    })),
  };
}

function rejectsFixture(change, message = /Review planner rejected input:/) {
  const fixture = makeFixture();
  change(fixture);
  assert.throws(() => prepareReview(fixture, makeRoutes()), message);
}

function rejectsRoutes(change, message = /Review planner rejected input:/) {
  const routes = makeRoutes();
  change(routes);
  assert.throws(() => prepareReview(makeFixture(), routes), message);
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('six exact lower-case outputs share body and account line with platform-specific endings', () => {
  const fixture = makeFixture();
  const routes = makeRoutes();
  const results = prepareReview(fixture, routes);
  assert.deepEqual(results.map(({ json }) => json.platform), PLATFORMS);
  assert.equal(new Set(results.map(({ json }) => json.spoken_cta)).size, 6);
  for (const { json } of results) {
    const route = routes.platforms.find((item) => item.platform === json.platform);
    assert.deepEqual(json.article, fixture.article);
    assert.equal(json.feature_key, fixture.feature_key);
    assert.equal(json.shared_body_narration, fixture.body_narration);
    assert.equal(json.account_line, ACCOUNT);
    assert.equal(json.spoken_cta, route.spoken_cta);
    assert.equal(json.voiceover_script, `${fixture.body_narration}\n\n${ACCOUNT}\n\n${route.spoken_cta}`);
    assert.equal(json.screen_cta, route.screen_cta);
    assert.equal(json.caption_instruction, route.caption_instruction);
    assert.equal(json.route_surface, route.route_surface);
    assert.equal(json.destination, DESTINATION);
    assert.deepEqual(json.scene_plan, fixture.scene_plan);
  }
});

test('all permissions are blocked and human review/separate variants are required', () => {
  for (const { json } of prepareReview(makeFixture(), makeRoutes())) {
    for (const key of ['publishing_allowed', 'model_calls_allowed', 'render_calls_allowed',
      'database_writes_allowed', 'production_workflow_adapter_verified', 'production_ready']) {
      assert.equal(json[key], false, key);
    }
    for (const key of ['review_only', 'needs_human_review', 'requires_separate_platform_video']) {
      assert.equal(json[key], true, key);
    }
  }
});

test('forced publish:true and permission overrides cannot unlock review output', () => {
  const fixture = makeFixture();
  const routes = makeRoutes();
  const overrides = { publish: true, publishing_allowed: true, model_calls_allowed: true,
    render_calls_allowed: true, database_writes_allowed: true, production_ready: true,
    review_only: false, needs_human_review: false, requires_separate_platform_video: false };
  Object.assign(fixture, overrides);
  Object.assign(routes, overrides);
  routes.platforms.forEach((route) => Object.assign(route, overrides));
  for (const { json } of prepareReview(fixture, routes)) {
    assert.equal(json.publishing_allowed, false);
    assert.equal(json.model_calls_allowed, false);
    assert.equal(json.render_calls_allowed, false);
    assert.equal(json.database_writes_allowed, false);
    assert.equal(json.production_ready, false);
    assert.equal(json.production_workflow_adapter_verified, false);
    assert.equal(json.review_only, true);
    assert.equal(json.needs_human_review, true);
    assert.equal(json.requires_separate_platform_video, true);
    assert.equal(Object.hasOwn(json, 'publish'), false);
  }
});

test('Instagram hold and candidate wording are preserved without internal metadata in speech', () => {
  const result = prepareReview(makeFixture(), makeRoutes()).find(({ json }) => json.platform === 'instagram').json;
  assert.equal(result.cta_route_state, 'hold-unverified-go-profile');
  assert.equal(result.spoken_cta, 'Tap the link in our profile to explore YFIT.');
  assert.doesNotMatch(result.voiceover_script, /hold-unverified|route_state|release_note/u);
  assert.equal(result.publishing_allowed, false);
});

test('TikTok manual address route keeps truthful no-bio-link disclaimer', () => {
  const result = prepareReview(makeFixture(), makeRoutes())[0].json;
  assert.equal(result.cta_route_state, 'manual-address-fallback');
  assert.equal(result.spoken_cta, 'Open this address in your browser to explore YFIT.');
  assert.match(result.screen_cta, /app\.yfitai\.com\/go/u);
  assert.match(result.caption_instruction, /No clickable website\/bio link/u);
});

for (const state of ['manual-address-fallback', 'hold-unverified-go-profile']) {
  test(`TikTok ${state} cannot promise link in bio`, () => {
    rejectsRoutes((routes) => {
      routes.platforms[0].route_state = state;
      routes.platforms[0].spoken_cta = 'Tap the link in bio to explore YFIT.';
    }, /unverified route cannot promise/u);
  });
}

for (const field of ['screen_cta', 'caption_instruction']) {
  test(`TikTok unverified ${field} cannot promise link in bio`, () => {
    rejectsRoutes((routes) => { routes.platforms[0][field] = 'Tap the link in our bio.'; });
  });
}

test('variant keys are unique, platform-specific and deterministic regardless of route order', () => {
  const fixture = makeFixture();
  const routes = makeRoutes();
  const first = prepareReview(fixture, routes);
  const keys = first.map(({ json }) => json.media_variant_key);
  assert.equal(new Set(keys).size, 6);
  first.forEach(({ json }) => assert.ok(json.media_variant_key.endsWith(`:${json.platform}`)));
  routes.platforms.reverse();
  assert.deepEqual(prepareReview(fixture, routes), first);
});

test('does not mutate inputs or alias nested output references between platforms', () => {
  const fixture = deepFreeze(makeFixture());
  const routes = deepFreeze(makeRoutes());
  const snapshot = JSON.stringify({ fixture, routes });
  const results = prepareReview(fixture, routes);
  results[0].json.article.title = 'Changed only in one output';
  results[0].json.scene_plan[0].label = 'Changed only in one output';
  assert.equal(JSON.stringify({ fixture, routes }), snapshot);
  assert.equal(results[1].json.article.title, fixture.article.title);
  assert.equal(results[1].json.scene_plan[0].label, fixture.scene_plan[0].label);
});

for (const [name, value] of [['undefined', undefined], ['null', null], ['empty object', {}], ['array', []], ['empty string', '']]) {
  test(`rejects ${name} fixture`, () => assert.throws(() => prepareReview(value, makeRoutes()), /rejected input/u));
}

test('rejects missing article', () => rejectsFixture((fixture) => { delete fixture.article; }));
for (const key of ['title', 'summary', 'url']) {
  test(`rejects empty article ${key}`, () => rejectsFixture((fixture) => { fixture.article[key] = ' '; }));
}

test('rejects empty body narration', () => rejectsFixture((fixture) => { fixture.body_narration = '\n '; }));
for (const line of ['Saving data needs an account.', `${ACCOUNT} `, '', null]) {
  test(`rejects bad account line ${JSON.stringify(line)}`, () => rejectsFixture((fixture) => { fixture.account_line = line; }));
}
for (const reviewed of [false, 'true', 1, undefined]) {
  test(`rejects non-reviewed article flag ${String(reviewed)}`, () => rejectsFixture((fixture) => { fixture.claim_reviewed = reviewed; }));
}

test('manual review flag is not output as automatic clinical/factual verification', () => {
  const result = prepareReview(makeFixture(), makeRoutes())[0].json;
  for (const field of ['clinical_verified', 'fact_verified', 'automated_claim_review', 'claim_reviewed']) {
    assert.equal(Object.hasOwn(result, field), false);
  }
  assert.equal(result.needs_human_review, true);
});

test('rejects unknown feature', () => rejectsFixture((fixture) => { fixture.feature_key = 'diagnosis'; }));
for (const feature of ['nutrition', 'daily_tracker', 'fitness', 'goals', 'medications', 'progress', 'predictions', 'recomp', 'ai_coach', 'language']) {
  test(`accepts allowlisted feature ${feature} without adding claims`, () => {
    const fixture = makeFixture();
    fixture.feature_key = feature;
    assert.equal(prepareReview(fixture, makeRoutes())[0].json.shared_body_narration, fixture.body_narration);
  });
}

test('rejects nonlocal input kind', () => rejectsFixture((fixture) => { fixture.input_kind = 'live-api'; }));
test('rejects claimed production export verification', () => rejectsFixture((fixture) => { fixture.production_workflow_adapter_verified = true; }));
test('rejects missing production export verification status', () => rejectsFixture((fixture) => { delete fixture.production_workflow_adapter_verified; }));
test('rejects wired voice provider', () => rejectsFixture((fixture) => { fixture.voice.provider = 'live-provider'; }));
test('rejects wrong voice name', () => rejectsFixture((fixture) => { fixture.voice.name = 'Other'; }));
test('rejects wrong voice style', () => rejectsFixture((fixture) => { fixture.voice.style = 'other style'; }));

for (const url of [
  'http://www.yfitai.com/article', 'ftp://www.yfitai.com/article',
  'javascript:alert(1)', 'data:text/plain,article', '//www.yfitai.com/article',
  'https://owner:password@www.yfitai.com/article', 'https://www.yfitai.com:8443/article',
  'https://localhost/article', 'https://127.0.0.1/article',
  'https://www.yfitai.com/article?patient_id=123', 'https://www.yfitai.com/article#health_id=123',
  'https://www.yfitai.com/patients/123', 'https://www.yfitai.com/health_id/123',
  'https://www.yfitai.com/records/123456789', 'https://www.yfitai.com/%70atient/123',
  'https://www.yfitai.com/%', 'https://www.yfitai.com/a%40person.com',
  'https://www.yfitai.com/\narticle', 'https://www.yfitai.com\\article',
]) {
  test(`rejects unsafe article URL ${JSON.stringify(url)}`, () => rejectsFixture((fixture) => { fixture.article.url = url; }));
}

for (const [name, value] of [['missing', undefined], ['empty', {}], ['null', null]]) {
  test(`rejects ${name} routes`, () => assert.throws(() => prepareReview(makeFixture(), value), /rejected input/u));
}
test('rejects missing platform', () => rejectsRoutes((routes) => { routes.platforms.pop(); }));
test('rejects unknown platform', () => rejectsRoutes((routes) => { routes.platforms[5].platform = 'snapchat'; }));
test('rejects duplicate platform', () => rejectsRoutes((routes) => { routes.platforms[5].platform = 'tiktok'; }));
test('rejects uppercase platform', () => rejectsRoutes((routes) => { routes.platforms[0].platform = 'TikTok'; }));
test('rejects extra seventh platform', () => rejectsRoutes((routes) => { routes.platforms.push({ ...routes.platforms[0] }); }));
for (const field of ['spoken_cta', 'screen_cta', 'caption_instruction', 'route_surface', 'release_note']) {
  test(`rejects empty route ${field}`, () => rejectsRoutes((routes) => { routes.platforms[0][field] = ' '; }));
}
test('rejects unknown route state', () => rejectsRoutes((routes) => { routes.platforms[0].route_state = 'published'; }));
test('rejects missing dated evidence', () => rejectsRoutes((routes) => { delete routes.platforms[0].evidence_date; }));
test('rejects wrong evidence date', () => rejectsRoutes((routes) => { routes.platforms[0].evidence_date = '2026-11-27'; }));
for (const destination of [
  'http://app.yfitai.com/go', 'https://app.yfitai.com/', 'https://app.yfitai.com/go/',
  'https://app.yfitai.com/go?patient_id=123', 'https://app.yfitai.com/go#health_id=123',
  'https://other.yfitai.com/go', 'https://app.yfitai.com/go?utm_source=tiktok',
  'https://app.yfitai.com:443/go', 'https://app.yfitai.com/%67o',
]) {
  test(`rejects noncanonical destination ${destination}`, () => rejectsRoutes((routes) => { routes.platforms[0].destination = destination; }));
}

for (const filename of SCREEN_FILENAMES) {
  test(`accepts exact genuine screen reference ${filename}`, () => {
    const fixture = makeFixture();
    fixture.scene_plan = [{ kind: 'app-screen', filename, genuine: true }];
    assert.equal(prepareReview(fixture, makeRoutes())[0].json.scene_plan[0].filename, filename);
  });
}
for (const filename of ['made_up.png', 'screen_04_dailytracker.png', '../screen_03_nutrition.png',
  'https://app.yfitai.com/screen_03_nutrition.png']) {
  test(`rejects unknown screen ${filename}`, () => rejectsFixture((fixture) => { fixture.scene_plan[0].filename = filename; }));
}
test('rejects empty scene plan', () => rejectsFixture((fixture) => { fixture.scene_plan = []; }));
test('rejects missing explicit filename', () => rejectsFixture((fixture) => {
  fixture.scene_plan = [{ kind: 'app-screen', screenshot: 'screen_03_nutrition.png' }];
}));
test('rejects stock scene disguised as app screenshot', () => rejectsFixture((fixture) => { fixture.scene_plan[0].kind = 'stock'; }));
test('rejects screenshot marked nongenuine', () => rejectsFixture((fixture) => { fixture.scene_plan[0].genuine = false; }));
test('rejects cyclic scene metadata', () => rejectsFixture((fixture) => { fixture.scene_plan[0].cycle = fixture.scene_plan; }));
test('keeps optional visual notes outside the static scene plan/output', () => {
  const fixture = makeFixture();
  fixture.visual_notes = { optional: 'Topic imagery and Go controls are not screenshot scenes.' };
  const result = prepareReview(fixture, makeRoutes())[0].json;
  assert.deepEqual(result.scene_plan, fixture.scene_plan);
  assert.equal(Object.hasOwn(result, 'visual_notes'), false);
});

test('planner has no runtime imports, network modules, or runtime execution calls', () => {
  const source = readFileSync(new URL('./planner.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s|\bimport\s*\(|\brequire\s*\(/mu);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|eval|Function)\s*\(/u);
  assert.doesNotMatch(source, /node:(?:http|https|net|tls|dns|child_process)|process\.env|supabase|axios|undici/iu);
  assert.doesNotMatch(source, /\b(?:writeFile|spawn|exec|upload|render|invokeLLM)\s*\(/u);
});

// A public publisher content ID is not a private health-record identifier.
test('accepts the reviewed public publisher article URL with its numeric content ID', () => {
  const fixture = makeFixture();
  fixture.article.url = 'https://www.womenshealthmag.com/fitness/a74478646/body-recomp-nutrition/';
  assert.equal(prepareReview(fixture, makeRoutes()).length, 6);
});
