/** Public marketing/Go measurement only. No account IDs, health values or automatic tracking. */
export const COOKIE_KEY = 'yfit_cookie_consent'
export const EXCLUDE_KEY = 'yfit_analytics_excluded'
export const PUBLIC_HOSTS = ['app.yfitai.com', 'www.yfitai.com', 'yfitai.com']
export const SOCIAL_SOURCES = ['facebook', 'instagram', 'pinterest', 'linkedin', 'youtube', 'tiktok']
const WEBSITE_ID = '9d198333-8322-4848-9258-0476c99e5df5'
const SCRIPT_ID = 'umami-analytics'
const TRACKER_URL = 'https://manus-analytics.com/script.js'
const TITLES = { '/': 'YFIT marketing', '/go': 'YFIT Go', '/signup': 'YFIT signup', '/login': 'YFIT login' }
const LOAD_TIMEOUT = 10000
const MAX_EVENTS = 20
const EVENTS = /^(?:go_page_view_v2|go_header_cta|go_preview_explore_(?:dashboard|nutrition|workout|medications|progress)|go_cta_(?:demo|signup|marketing)_(?:top|bottom))$/

/** Only agreed campaign classifications enter third-party URLs; arbitrary queries never do. */
export function campaignParams(search = '') {
  const input = new URLSearchParams(search)
  const result = new URLSearchParams()
  const source = (input.get('utm_source') || '').toLowerCase()
  if ([...SOCIAL_SOURCES, 'direct'].includes(source)) result.set('utm_source', source)
  const medium = (input.get('utm_medium') || '').toLowerCase()
  if (['social', 'organic', 'referral'].includes(medium)) result.set('utm_medium', medium)
  const campaign = (input.get('utm_campaign') || '').toLowerCase()
  if (['organic', 'organic_social', 'profile', 'bio'].includes(campaign)) result.set('utm_campaign', campaign)
  return result
}

export function publicPage(location) {
  if (!location || location.protocol !== 'https:' || !PUBLIC_HOSTS.includes(location.hostname)) return null
  const path = location.pathname
  if (!Object.hasOwn(TITLES, path)) return null
  const query = new URLSearchParams(location.search)
  // These routes can instead display a demo shell. Never label that shell a public Go view.
  if (query.get('mode') === 'guest') return null
  const campaign = campaignParams(location.search)
  return { path, hostname: location.hostname, title: TITLES[path], url: path + (campaign.size ? `?${campaign}` : ''), source: campaign.get('utm_source') || 'unknown' }
}

export function safeReferrer(referrer = '') {
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (PUBLIC_HOSTS.includes(host)) return `https://${host}`
    for (const domain of ['facebook.com', 'instagram.com', 'pinterest.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'youtu.be', 'pin.it']) {
      if (host === domain || host.endsWith(`.${domain}`)) return `https://${domain}`
    }
  } catch { /* Missing or malformed referrers stay unknown. */ }
  return ''
}

/** Forward only safe campaign classifications through public YFIT links; never auth/health queries. */
export function buildPublicLink(destination, search = '') {
  try {
    const url = new URL(destination, 'https://app.yfitai.com')
    if (url.protocol !== 'https:' || !PUBLIC_HOSTS.includes(url.hostname) || url.username || url.password || !Object.hasOwn(TITLES, url.pathname)) return destination
    const guest = url.searchParams.get('mode') === 'guest'
    url.search = ''
    url.hash = ''
    if (guest && url.pathname === '/go') url.searchParams.set('mode', 'guest')
    for (const [key, value] of campaignParams(search)) url.searchParams.set(key, value)
    return url.toString()
  } catch { return destination }
}

/** Dependency-injected for fully offline consent/loading/route tests. */
export function createPublicAnalytics({ win, doc, now = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  let memoryConsent = null
  let current = null
  let timer = null
  let script = null
  let ready = false
  let failed = false
  let generation = 0
  let queue = []
  let lastVisit = null
  const listeners = new Set()
  function stored(key) { try { return win.localStorage.getItem(key) } catch { return null } }
  function consent() { return memoryConsent || stored(COOKIE_KEY) }
  function excluded() {
    return stored(EXCLUDE_KEY) === 'true' || stored('umami.disabled') === '1' || stored('umami.disabled') === 'true' ||
      win.navigator?.globalPrivacyControl === true || win.navigator?.doNotTrack === '1'
  }
  function allowed() { return consent() === 'accepted' && !excluded() && current && publicPage(win.location) !== null && current.page.path === win.location.pathname }
  function notify() { for (const listener of listeners) listener() }
  function stop() {
    generation++
    if (timer !== null) cancel(timer)
    timer = null
    queue = []
    ready = false
    if (script) { script.onload = null; script.onerror = null; script.remove(); script = null }
  }
  function payload(page, name, data) {
    return {
      website: WEBSITE_ID, hostname: page.hostname, url: page.url, title: page.title,
      language: String(win.navigator?.language || '').slice(0, 20),
      screen: `${Number(win.screen?.width) || 0}x${Number(win.screen?.height) || 0}`,
      referrer: safeReferrer(doc.referrer),
      ...(name ? { name, data } : {}),
    }
  }
  function send(item) {
    if (!allowed() || !ready || typeof win.umami?.track !== 'function' || item.token !== current.token || now() - item.at > LOAD_TIMEOUT) return
    try {
      if (item.visitKey) lastVisit = item.visitKey
      const result = win.umami.track(item.payload)
      // Do not retry an unknown collection outcome; prevent unhandled promise rejections.
      if (result?.catch) result.catch(() => {})
    } catch { /* A failed tracker must not break the page or become a false report success. */ }
  }
  function flush() {
    if (!allowed()) { queue = []; return }
    const pending = queue
    queue = []
    pending.forEach(send)
  }
  function ensureReady() {
    if (!allowed() || ready || script || failed) return
    // Do not reuse a tracker loaded by older automatic tracking code in the same page.
    if (doc.getElementById(SCRIPT_ID)) { failed = true; queue = []; return }
    const thisGeneration = generation
    script = doc.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = TRACKER_URL
    script.setAttribute('data-website-id', WEBSITE_ID)
    script.setAttribute('data-auto-track', 'false')
    script.setAttribute('data-domains', PUBLIC_HOSTS.join(','))
    // No automatic events, URL changes, performance, errors, replays or user identification.
    script.onload = () => {
      if (generation !== thisGeneration || !allowed()) return
      if (timer !== null) cancel(timer)
      timer = null
      ready = typeof win.umami?.track === 'function'
      if (!ready) { failed = true; queue = [] }
      else flush()
    }
    script.onerror = () => { if (generation === thisGeneration) { failed = true; stop() } }
    timer = schedule(() => { if (generation === thisGeneration) { failed = true; stop() } }, LOAD_TIMEOUT)
    doc.head.appendChild(script)
  }
  function enqueue(item) {
    if (!allowed() || failed) return
    if (ready) send(item)
    else { if (queue.length < MAX_EVENTS) queue.push(item); ensureReady() }
  }
  function visit() {
    if (!allowed()) return
    // React StrictMode remounts must not turn one route entry into two pageviews.
    const visitKey = current.visitKey
    if (lastVisit === visitKey) return
    if (queue.some(item => item.visitKey === visitKey)) return
    enqueue({ token: current.token, visitKey, at: now(), payload: payload(current.page) })
  }
  return {
    consent,
    excluded,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    setConsent(value) {
      if (!['accepted', 'declined'].includes(value)) return
      memoryConsent = value
      try { win.localStorage.setItem(COOKIE_KEY, value) } catch { /* Same-tab choice still works if storage is blocked. */ }
      if (value === 'declined') { stop(); lastVisit = null }
      else if (current) {
        // This counts the page currently displayed AFTER acceptance, not pre-consent history.
        current.page = publicPage(win.location)
        failed = false
        if (current.page) visit()
      }
      notify()
    },
    syncConsent() {
      memoryConsent = null
      if (consent() !== 'accepted' || excluded()) { stop(); lastVisit = null }
      else { failed = false; visit() }
      notify()
    },
    beginPage(visitKey) {
      const page = publicPage(win.location)
      const token = {}
      queue = []
      current = page ? { page, token, visitKey } : null
      if (!page || excluded()) { stop(); current = null; return () => {} }
      visit()
      return () => { if (current?.token === token) { current = null; queue = [] } }
    },
    event(name, extra = {}) {
      // Legacy custom "visit" is deliberately suppressed: the one manual pageview is authoritative.
      if (name === 'go_page_view_v2' || !EVENTS.test(name) || !allowed() || current.page.path !== '/go') return
      const data = { source: current.page.source }
      // Feature identifiers only, not calculator values, arbitrary strings or account details.
      if (['preview', 'features'].includes(extra.section)) data.section = extra.section
      enqueue({ token: current.token, at: now(), payload: payload(current.page, name, data) })
    },
    dispose() { stop(); current = null; listeners.clear() },
  }
}

let instance
export function getPublicAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  if (!instance) instance = createPublicAnalytics({ win: window, doc: document })
  return instance
}
export function trackPublicGoEvent(name, extra) { getPublicAnalytics()?.event(name, extra) }
