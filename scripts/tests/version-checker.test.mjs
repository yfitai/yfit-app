import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'

// No app initialization, native plugins, accounts, or network. JSdom is transient.
const runtime = process.env.YFIT_TEST_DEPS || '/home/ubuntu/.manus/yfit-medication/test-deps'
const require = createRequire(path.join(runtime, 'package.json'))
const { JSDOM } = require('jsdom')
const rootPath = path.resolve(new URL('../..', import.meta.url).pathname)
const tempPath = path.join(rootPath, 'node_modules/.cache/yfit-version-checker-tests')
await fs.mkdir(tempPath, { recursive: true })
await build({
  stdin: { contents: "export { default as VersionChecker } from './src/utils/VersionChecker.jsx';", resolveDir: rootPath },
  bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external',
  outfile: path.join(tempPath, 'ui-fixture.mjs'),
  plugins: [{ name: 'version-checker-fakes-only', setup(builder) {
    // Virtual paths also work before the parent creates the real core module.
    builder.onResolve({ filter: /^@capacitor\/(core|app)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    builder.onResolve({ filter: /services\/liveUpdate(?:Core)?(?:\.js)?$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
      const contents = args.path === '@capacitor/core'
        ? 'export const Capacitor = { isNativePlatform: () => globalThis.__versionFixture.native };'
        : args.path === '@capacitor/app'
          ? 'export const App = { addListener: (...args) => globalThis.__versionFixture.addListener(...args) };'
          : /liveUpdateCore/.test(args.path)
            ? 'export const readReleaseManifest = (...args) => globalThis.__versionFixture.readManifest(...args);'
            : 'export const LiveUpdateService = { applyUpdate: (...args) => globalThis.__versionFixture.applyUpdate(...args), getCurrentVersion: () => { throw new Error("Must not infer HTML build from native bundle ID") }, initialize: () => { throw new Error("Actual app initialization is forbidden") } };'
      return { contents, loader: 'js' }
    })
  }}]
})
const { VersionChecker } = await import(pathToFileURL(path.join(tempPath, 'ui-fixture.mjs')))
const originals = Object.fromEntries(['window', 'document', 'navigator', 'localStorage', 'fetch', 'setInterval', 'clearInterval', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
const originalError = console.error
const originalLog = console.log
let root, dom, state
const flush = async callback => { await act(async () => { await callback?.(); await Promise.resolve() }) }
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const makeManifest = buildNumber => ({
  version: '2099-01-01T00:00:00.000Z', buildNumber,
  bundleId: `yfit-build-${buildNumber}`, url: 'https://fictional-test.invalid/bundle.zip', sha256: 'a'.repeat(64)
})
function setup({ native = true, buildNumber = '108', manifestBuild = 109, timestamp = 'browser-new', registration, metadata } = {}) {
  const meta = buildNumber === null ? '' : `<meta name="yfit-build-number" content="${buildNumber}">`
  dom = new JSDOM(`<!doctype html><html><head>${meta}</head><body><div id="root"></div></body></html>`, { url: 'https://fictional-test.invalid/' })
  state = {
    native, manifest: makeManifest(manifestBuild), timestamp,
    manifestCalls: [], applyCalls: 0, reloadCalls: [], browserRequests: [], listenerCalls: [], removeCalls: 0,
    intervals: new Map(), cleared: [], storage: new Map(), storageOps: [], errors: [],
    listener: null, apply: async () => true,
    addListener(name, callback) {
      this.listenerCalls.push(name)
      this.listener = callback
      return registration?.promise || Promise.resolve({ remove: () => { state.removeCalls += 1 } })
    },
    async readManifest(...args) {
      this.manifestCalls.push(args)
      return metadata ? await metadata.promise : this.manifest
    },
    async applyUpdate() { this.applyCalls += 1; return await this.apply() }
  }
  globalThis.__versionFixture = state
  // JSdom's Location is nonconfigurable: isolate reload in this fake window proxy.
  globalThis.window = new Proxy(dom.window, { get(target, key) {
    if (key === 'location') return { reload: (...args) => state.reloadCalls.push(args) }
    return Reflect.get(target, key)
  } })
  globalThis.document = dom.window.document
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
  globalThis.localStorage = {
    getItem(key) { state.storageOps.push(['get', key]); return state.storage.get(key) ?? null },
    setItem(key, value) { state.storageOps.push(['set', key, String(value)]); state.storage.set(key, String(value)) },
    removeItem(key) { state.storageOps.push(['remove', key]); state.storage.delete(key) },
    clear() { throw new Error('Storage clearing is forbidden') }
  }
  globalThis.fetch = async (url, options) => {
    assert.equal(state.native, false, 'Native must not fetch browser version.json or any archive')
    assert.match(url, /^\/version\.json\?t=\d+$/)
    state.browserRequests.push({ url, options })
    return { ok: true, json: async () => ({ timestamp: state.timestamp }) }
  }
  globalThis.setInterval = (callback, delay) => {
    const id = state.intervals.size + 1
    state.intervals.set(id, { callback, delay })
    return id
  }
  globalThis.clearInterval = id => { state.cleared.push(id); state.intervals.delete(id) }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  console.error = (...args) => state.errors.push(args)
  console.log = () => {}
}
const mount = async () => {
  root = createRoot(document.getElementById('root'))
  await flush(() => root.render(React.createElement(VersionChecker)))
}
const unmount = async () => {
  if (root) { await flush(() => root.unmount()); root = null }
}
const click = async element => { assert.ok(element); await flush(() => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))) }
const badge = () => document.querySelector('span[title="Build from the currently loaded HTML"]')
const resume = async isActive => { await flush(() => state.listener({ isActive })) }
const poll = async () => { await flush(() => [...state.intervals.values()][0].callback()) }
afterEach(async () => {
  await unmount()
  dom?.window.close()
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
  delete globalThis.__versionFixture
  console.error = originalError
  console.log = originalLog
})

test('native newer build checks metadata only and badges executing HTML rather than release timestamp or native ID', async () => {
  setup()
  state.storage.set('app_version_timestamp', 'fake-installed-timestamp')
  state.storage.set('app_version', 'legacy-value-to-preserve')
  await mount()
  assert.equal(state.manifestCalls.length, 1)
  assert.deepEqual(state.manifestCalls[0], [])
  assert.equal(state.applyCalls, 0)
  assert.equal(state.browserRequests.length, 0)
  assert.equal(badge().textContent.trim(), 'Build 108')
  assert.equal(badge().style.pointerEvents, 'none')
  assert.equal(badge().getAttribute('tabindex'), null)
  assert.match(document.querySelector('button').textContent, /Build 109 available! Tap to update/)
  assert.deepEqual(state.storageOps, [])
  assert.equal(state.reloadCalls.length, 0)
})

test('executing Build 109 equals manifest 109: badge 109 with no false update banner', async () => {
  setup({ buildNumber: '109', manifestBuild: 109 })
  await mount()
  assert.equal(badge().textContent.trim(), 'Build 109')
  assert.equal(document.querySelector('button'), null)
  state.manifest = makeManifest(108)
  await poll()
  assert.equal(document.querySelector('button'), null)
  assert.deepEqual(state.storageOps, [])
})

test('missing executing meta remains unknown and never manufactures an installed build', async () => {
  setup({ buildNumber: null })
  await mount()
  assert.equal(badge().textContent.trim(), 'Build unknown')
  assert.equal(state.manifestCalls.length, 1)
  assert.equal(document.querySelector('button'), null)
  assert.deepEqual(state.storageOps, [])
  assert.equal(state.applyCalls, 0)
})

test('malformed meta remains unknown rather than partially parsing a fake build', async () => {
  setup({ buildNumber: '109-invalid' })
  await mount()
  assert.equal(badge().textContent.trim(), 'Build unknown')
  assert.equal(document.querySelector('button'), null)
})

test('native metadata failure is nonblocking and does not announce a release or write installed state', async () => {
  const metadata = deferred()
  setup({ buildNumber: '109', metadata })
  await mount()
  await flush(() => metadata.reject(new Error('Fictional invalid manifest')))
  assert.equal(badge().textContent.trim(), 'Build 109')
  assert.equal(document.querySelector('button'), null)
  assert.deepEqual(state.storageOps, [])
  assert.equal(state.applyCalls, 0)
  assert.equal(state.errors.length, 1)
})

test('native apply waits for success, prevents double tap, and leaves HTML evidence/storage unchanged', async () => {
  setup()
  const applying = deferred()
  state.apply = () => applying.promise
  state.storage.set('fictional-prescription', 'unchanged')
  const snapshot = [...state.storage]
  await mount()
  await click(document.querySelector('button'))
  assert.equal(state.applyCalls, 1)
  assert.equal(document.querySelector('button').disabled, true)
  assert.match(document.querySelector('button').textContent, /Updating/)
  await click(document.querySelector('button'))
  assert.equal(state.applyCalls, 1)
  assert.equal(state.reloadCalls.length, 0)
  assert.equal(badge().textContent.trim(), 'Build 108')
  assert.deepEqual([...state.storage], snapshot)
  await flush(() => applying.resolve(true))
  assert.equal(document.querySelector('button').disabled, false)
  assert.equal(document.querySelector('[role=alert]'), null)
  assert.equal(state.reloadCalls.length, 0, 'Service owns the successful native reload')
  assert.equal(badge().textContent.trim(), 'Build 108', 'Only executing new HTML may change the badge')
  assert.deepEqual(state.storageOps, [])
  assert.deepEqual([...state.storage], snapshot)
})

for (const failure of ['throw', 'false']) {
  test(`native apply ${failure} preserves banner and data and offers a controlled retry`, async () => {
    setup()
    state.storage.set('app_version_timestamp', 'unchanged')
    state.storage.set('fictional-prescription', 'unchanged')
    const snapshot = [...state.storage]
    state.apply = async () => {
      if (failure === 'throw') throw new Error('Sensitive internal download error must not reach UI')
      return false
    }
    await mount()
    await click(document.querySelector('button'))
    assert.match(document.querySelector('[role=alert]').textContent, /Unable to apply update\. Please try again\./)
    assert.doesNotMatch(document.body.textContent, /Sensitive internal/)
    assert.match(document.querySelector('button').textContent, /Build 109 available/)
    assert.equal(document.querySelector('button').disabled, false)
    assert.equal(badge().textContent.trim(), 'Build 108')
    assert.equal(state.reloadCalls.length, 0)
    assert.deepEqual(state.storageOps, [])
    assert.deepEqual([...state.storage], snapshot)
    state.apply = async () => true
    await click(document.querySelector('button'))
    assert.equal(state.applyCalls, 2)
    assert.equal(document.querySelector('[role=alert]'), null)
    assert.deepEqual([...state.storage], snapshot)
  })
}

test('native periodic/resume metadata checks remove the listener and interval on unmount', async () => {
  setup({ buildNumber: '109' })
  await mount()
  assert.deepEqual(state.listenerCalls, ['appStateChange'])
  assert.equal([...state.intervals.values()][0].delay, 60000)
  await resume(false)
  assert.equal(state.manifestCalls.length, 1)
  state.manifest = makeManifest(110)
  await resume(true)
  assert.equal(state.manifestCalls.length, 2)
  assert.match(document.querySelector('button').textContent, /Build 110 available/)
  await poll()
  assert.equal(state.manifestCalls.length, 3)
  await unmount()
  assert.equal(state.removeCalls, 1)
  assert.equal(state.intervals.size, 0)
  await resume(true)
  assert.equal(state.manifestCalls.length, 3)
})

test('late native listener registration and late manifest result are safe after unmount', async () => {
  const registration = deferred()
  const metadata = deferred()
  setup({ registration, metadata })
  await mount()
  await unmount()
  await flush(() => {
    registration.resolve({ remove: () => { state.removeCalls += 1 } })
    metadata.resolve(makeManifest(109))
  })
  assert.equal(state.removeCalls, 1)
  assert.equal(state.intervals.size, 0)
  assert.equal(document.getElementById('root').textContent, '')
  assert.equal(state.errors.length, 0)
})

test('browser first mount preserves timestamp initialization and legacy migration without native APIs or badge', async () => {
  setup({ native: false, buildNumber: '109' })
  state.storage.set('app_version', 'old-browser-build')
  await mount()
  assert.equal(state.storage.has('app_version'), false)
  assert.equal(state.storage.get('app_version_timestamp'), 'browser-new')
  assert.equal(document.getElementById('root').textContent, '')
  assert.equal(badge(), null)
  assert.equal(state.browserRequests.length, 1)
  assert.equal(state.browserRequests[0].options.cache, 'no-store')
  assert.equal(state.browserRequests[0].options.headers.Pragma, 'no-cache')
  assert.equal(state.manifestCalls.length, 0)
  assert.equal(state.listenerCalls.length, 0)
  assert.equal(state.applyCalls, 0)
})

test('browser update preserves existing timestamp write and page reload, with polling/visibility cleanup', async () => {
  setup({ native: false })
  state.storage.set('app_version_timestamp', 'browser-old')
  await mount()
  assert.equal(state.storage.get('app_version_timestamp'), 'browser-old')
  assert.match(document.getElementById('root').textContent, /New version available! Tap to update/)
  assert.equal(badge(), null)
  await click(document.getElementById('root').firstElementChild)
  assert.equal(state.storage.get('app_version_timestamp'), 'browser-new')
  assert.deepEqual(state.reloadCalls, [[true]])
  await poll()
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  await flush(() => document.dispatchEvent(new dom.window.Event('visibilitychange')))
  assert.equal(state.browserRequests.length, 2)
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  await flush(() => document.dispatchEvent(new dom.window.Event('visibilitychange')))
  assert.equal(state.browserRequests.length, 3)
  await unmount()
  assert.equal(state.intervals.size, 0)
  await flush(() => document.dispatchEvent(new dom.window.Event('visibilitychange')))
  assert.equal(state.browserRequests.length, 3)
  assert.equal(state.manifestCalls.length, 0)
  assert.equal(state.listenerCalls.length, 0)
  assert.equal(state.applyCalls, 0)
})
