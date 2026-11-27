/**
 * Local review-only prototype. Not a workflow export, clone, or deployed pipeline.
 * No imports, I/O, model calls, rendering, uploads, or publishing.
 * claim_reviewed is an explicit manual input, NOT clinical/factual verification.
 * Screenshot allowlisting checks references, NOT actual image provenance/content.
 *
 * routes.platforms must be an array of exactly six platform records.
 * scene_plan must be a nonempty array of app-screen JSON records referencing exact
 * allowlisted filenames through the explicit filename field.
 * A supplied genuine flag must be true; no provenance flag is invented by this module.
 * Article URLs require public-shaped HTTPS hosts, no credentials/port/query/fragment,
 * and no recognizable personal-record identifiers. This is syntactic validation,
 * not proof that an external article is safe or factual. No URL is ever fetched.
 */

const PLATFORMS = Object.freeze([
  'tiktok', 'instagram', 'youtube', 'linkedin', 'pinterest', 'facebook',
]);
const FEATURES = new Set([
  'nutrition', 'daily_tracker', 'fitness', 'goals', 'medications',
  'progress', 'predictions', 'recomp', 'ai_coach', 'language',
]);
const SCREENS = new Set([
  'screen_01_dashboard.png',
  'screen_02_goals.png',
  'screen_03_nutrition.png',
  'screen_04_dailyTracker.png',
  'screen_05_fitness.png',
  'screen_06_medications.png',
  'screen_07_progress.png',
  'screen_08_predictions.png',
  'screen_09_recomp.png',
  'screen_10_aiCoach.png',
  'screen_11_language.png',
]);
const ROUTE_STATES = new Set([
  'owner-verified-dated', 'hold-unverified-go-profile', 'manual-address-fallback',
]);
const ACCOUNT_LINE = 'Saving your own data needs an account.';
const DESTINATION = 'https://app.yfitai.com/go';
const EVIDENCE_DATE = '2026-11-26';

function reject(message) {
  throw new TypeError(`Review planner rejected input: ${message}`);
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    reject(`${label} must be a plain object`);
  }
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    reject(`${label} must be nonempty text`);
  }
}

function validateArticleUrl(value) {
  requireText(value, 'article.url');
  if (value !== value.trim() || /[\\\s\u0000-\u001f\u007f]/u.test(value)) {
    reject('article.url must be an unambiguous HTTPS URL');
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    reject('article.url must be a valid HTTPS URL');
  }
  if (!value.startsWith('https://') || parsed.protocol !== 'https:'
      || parsed.username || parsed.password || parsed.port
      || value.includes('?') || value.includes('#')) {
    reject('article.url must use HTTPS without credentials, port, query, or fragment');
  }
  const host = parsed.hostname;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/u.test(host)
      || /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/u.test(host)) {
    reject('article.url must have a public-shaped DNS hostname');
  }
  let path;
  try {
    path = decodeURIComponent(parsed.pathname);
  } catch {
    reject('article.url has invalid path encoding');
  }
  const knownPublisherArticleId = host === 'www.womenshealthmag.com'
    && /^\/fitness\/a\d{8}\/[a-z0-9-]+\/?$/iu.test(path);
  if (!/^[a-z0-9/._~-]*$/iu.test(path)
      || /(?:^|[/._~-])(?:patients?|users?|accounts?|members?|clients?|health[_-]?id|patient[_-]?id|user[_-]?id|medical[_-]?records?|ehr|mrn|email)(?:$|[/._~-])/iu.test(path)
      || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu.test(path)
      || (/\d{8,}/u.test(path) && !knownPublisherArticleId)) {
    reject('article.url must not contain personal/health-record identifiers');
  }
}

function copyJson(value, label, active = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || active.has(value)) {
    reject(`${label} must contain only acyclic JSON values`);
  }
  if (!Array.isArray(value)) requireObject(value, label);
  active.add(value);
  const copy = Array.isArray(value)
    ? value.map((entry) => copyJson(entry, label, active))
    : Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key, copyJson(entry, label, active),
    ]));
  active.delete(value);
  return copy;
}

function validateScenePlan(plan) {
  if (!Array.isArray(plan) || plan.length === 0) {
    reject('scene_plan must contain at least one allowlisted screenshot record');
  }
  plan.forEach((scene, index) => {
    requireObject(scene, `scene_plan[${index}]`);
    if (scene.kind !== 'app-screen' || !SCREENS.has(scene.filename)) {
      reject(`scene_plan[${index}] must reference one exact allowlisted screen filename`);
    }
    if (Object.hasOwn(scene, 'genuine') && scene.genuine !== true) {
      reject(`scene_plan[${index}].genuine must be true when supplied`);
    }
  });
  return copyJson(plan, 'scene_plan');
}

function validateFixture(fixture) {
  requireObject(fixture, 'fixture');
  if (fixture.input_kind !== 'local-reviewed-fixture') {
    reject('input_kind must be local-reviewed-fixture');
  }
  if (fixture.production_workflow_adapter_verified !== false) {
    reject('production_workflow_adapter_verified must be false; this review planner is not a verified production adapter');
  }
  if (fixture.claim_reviewed !== true) {
    reject('claim_reviewed must be explicit manual true');
  }
  requireObject(fixture.article, 'article');
  requireText(fixture.article.title, 'article.title');
  requireText(fixture.article.summary, 'article.summary');
  validateArticleUrl(fixture.article.url);
  if (!FEATURES.has(fixture.feature_key)) reject('feature_key is not allowlisted');
  requireText(fixture.body_narration, 'body_narration');
  if (fixture.account_line !== ACCOUNT_LINE) reject('account_line must match the required text exactly');
  requireObject(fixture.voice, 'voice');
  if (fixture.voice.name !== 'Achird' || fixture.voice.style !== 'friendly male'
      || fixture.voice.provider !== 'candidate-only-not-wired') {
    reject('voice must be Achird / friendly male / candidate-only-not-wired');
  }
  return validateScenePlan(fixture.scene_plan);
}

function validateRoutes(routes) {
  requireObject(routes, 'routes');
  if (!Array.isArray(routes.platforms) || routes.platforms.length !== PLATFORMS.length) {
    reject('routes.platforms must contain exactly six platform records');
  }
  const indexed = new Map();
  for (const route of routes.platforms) {
    requireObject(route, 'platform route');
    if (!PLATFORMS.includes(route.platform)) reject('unknown or non-lower-case platform');
    if (indexed.has(route.platform)) reject(`duplicate platform: ${route.platform}`);
    for (const key of ['spoken_cta', 'screen_cta', 'caption_instruction', 'route_surface', 'release_note']) {
      requireText(route[key], `${route.platform}.${key}`);
    }
    if (!ROUTE_STATES.has(route.route_state)) reject(`${route.platform}: unknown route_state`);
    if (route.destination !== DESTINATION) reject(`${route.platform}: destination must be the exact canonical /go URL`);
    if (route.evidence_date !== EVIDENCE_DATE) reject(`${route.platform}: evidence_date must be ${EVIDENCE_DATE}`);
    if (route.platform === 'tiktok' && route.route_state !== 'owner-verified-dated') {
      // Do not turn an unverified route into a spoken or on-screen link promise.
      const audienceCtas = [route.spoken_cta, route.screen_cta];
      const promisesLink = /\bbio\b|\bprofile[\s_-]+links?\b|\blinks?[\s_-]+(?:in[\s_-]+)?(?:(?:your|our|my|the)[\s_-]+)?profile\b/iu;
      const captionPromisesLink = /\blinks?[\s_-]+in[\s_-]+(?:(?:your|our|my|the)[\s_-]+)?(?:bio|profile)\b/iu;
      if (audienceCtas.some((text) => promisesLink.test(text))
          || captionPromisesLink.test(route.caption_instruction)) {
        reject('tiktok: unverified route cannot promise a link in bio/profile');
      }
    }
    indexed.set(route.platform, route);
  }
  for (const platform of PLATFORMS) {
    if (!indexed.has(platform)) reject(`missing platform: ${platform}`);
  }
  return indexed;
}

/**
 * Prepare six deterministic n8n-shaped records for human review only.
 * Unknown input flags (including publish:true) never grant any permissions.
 * All input validation finishes before any records are returned.
 */
export function prepareReview(fixture, routes) {
  const scenePlan = validateFixture(fixture);
  const indexedRoutes = validateRoutes(routes);
  return PLATFORMS.map((platform) => {
    const route = indexedRoutes.get(platform);
    return {
      json: {
        platform,
        review_only: true,
        publishing_allowed: false,
        model_calls_allowed: false,
        render_calls_allowed: false,
        database_writes_allowed: false,
        production_workflow_adapter_verified: false,
        article: {
          title: fixture.article.title,
          url: fixture.article.url,
          summary: fixture.article.summary,
        },
        feature_key: fixture.feature_key,
        shared_body_narration: fixture.body_narration,
        account_line: ACCOUNT_LINE,
        spoken_cta: route.spoken_cta,
        voiceover_script: [fixture.body_narration, ACCOUNT_LINE, route.spoken_cta].join('\n\n'),
        screen_cta: route.screen_cta,
        caption_instruction: route.caption_instruction,
        cta_route_state: route.route_state,
        route_surface: route.route_surface,
        destination: DESTINATION,
        scene_plan: copyJson(scenePlan, 'scene_plan'),
        media_variant_key: `review-only:${fixture.feature_key}:${platform}`,
        needs_human_review: true,
        requires_separate_platform_video: true,
        production_ready: false,
      },
    };
  });
}
