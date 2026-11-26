#!/usr/bin/env node
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import Module from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
let checks = 0
function check(name, fn) { fn(); checks++; console.log(`PASS: ${name}`) }
let mode = 'prompt', stateCalls = 0
const mockReact = { ...React, useEffect: () => {}, useMemo: fn => fn(), useState: initial => { stateCalls++; return [stateCalls === 1 ? mode === 'prompt' : mode === 'privacy' ? true : initial, () => {}] } }
async function load(entry) {
  const result = await build({ entryPoints: [entry], absWorkingDir: root, bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-router-dom'], plugins: [{ name: 'offline-public-analytics-stub', setup(b) { b.onLoad({ filter: /src\/lib\/publicAnalytics\.js$/ }, () => ({ contents: `export const COOKIE_KEY='yfit_cookie_consent'; export function getPublicAnalytics(){throw new Error('Effects/providers prohibited in SSR test')}; export function publicPage(l){return l.protocol==='https:'&&['app.yfitai.com','www.yfitai.com','yfitai.com'].includes(l.hostname)&&['/','/go','/signup','/login'].includes(l.pathname)&&new URLSearchParams(l.search).get('mode')!=='guest' ? {} : null}` })) } }] })
  const mod = new Module(path.join(root, '.offline-public-ui.cjs'))
  mod.filename = path.join(root, '.offline-public-ui.cjs'); mod.paths = Module._nodeModulePaths(root)
  mod.require = name => name === 'react' ? mockReact : name === 'react-router-dom' ? { useLocation: () => ({ key: 'offline', pathname: globalThis.window.location.pathname, search: globalThis.window.location.search }) } : require(name)
  mod._compile(result.outputFiles[0].text, mod.filename)
  return mod.exports.default
}
const Consent = await load('src/components/CookieConsent.tsx'), Boundary = await load('src/components/PublicAnalyticsBoundary.jsx')
function render(Component, props = {}) { stateCalls = 0; return renderToStaticMarkup(React.createElement(Component, props)) }
mode = 'prompt'
const prompt = render(Consent)
check('actual prompt offers analytics accept and decline', () => { assert.match(prompt, />Accept</); assert.match(prompt, />Decline</); assert.match(prompt, /role="dialog"/); assert.match(prompt, /aria-label="Analytics consent"/) })
check('actual prompt does not require signup or claim individual identification', () => { assert.match(prompt, /decline and still use all public features/); assert.doesNotMatch(prompt, /email|password|identify you/) })
check('privacy link uses the existing legal route', () => assert.match(prompt, /href="\/legal"/))
mode = 'privacy'
check('actual accepted/declined view offers a persistent change-choice button', () => assert.match(render(Consent), /Change analytics privacy choice/))
mode = 'prompt'
for (const url of ['https://app.yfitai.com/go', 'https://yfitai.com/', 'https://app.yfitai.com/signup', 'https://app.yfitai.com/login']) {
  globalThis.window = { location: new URL(url) }
  check(`actual public boundary renders consent: ${url}`, () => assert.match(render(Boundary, { active: true }), /Analytics consent/))
}
for (const url of ['https://admin.yfitai.com/go', 'https://app.yfitai.com/nutrition', 'https://app.yfitai.com/go?mode=guest', 'capacitor://localhost/go']) {
  globalThis.window = { location: new URL(url) }
  check(`actual boundary excludes private/demo/native route: ${url}`, () => assert.equal(render(Boundary, { active: true }), ''))
}
globalThis.window = { location: new URL('https://app.yfitai.com/') }
check('authenticated root redirect/install/guest exclusion can disable the boundary', () => assert.equal(render(Boundary, { active: false }), ''))
delete globalThis.window
console.log(`All ${checks} rendered public consent checks passed. No browser, provider, database, account or analytics requests occurred.`)
