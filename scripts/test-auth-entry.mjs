#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import Module from 'node:module'
import { build } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadConfigFromFile } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let checks = 0
function check(name, fn) {
  fn()
  checks += 1
  console.log(`PASS: ${name}`)
}

const configFile = path.join(root, 'vite.config.js')
const web = (await loadConfigFromFile({ mode: 'production', command: 'build' }, configFile)).config
const native = (await loadConfigFromFile({ mode: 'capacitor', command: 'build' }, configFile)).config
check('web nested routes resolve assets at the domain root', () => {
  assert.equal(web.base, '/')
  for (const route of ['/auth/callback', '/reset-password', '/signup']) {
    assert.equal(new URL(`${web.base}assets/test.js`, `https://example.test${route}`).pathname, '/assets/test.js')
  }
})
check('packaged Capacitor assets remain relative', () => assert.equal(native.base, './'))

const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8')
check('login and signup routes have distinct initial tabs and keys', () => {
  assert.match(app, /path="\/login" element=\{<Auth key="login" initialTab="login"/)
  assert.match(app, /path="\/signup" element=\{<Auth key="signup" initialTab="signup"/)
})

const result = await build({
  entryPoints: [path.join(root, 'src/components/Auth.jsx')],
  absWorkingDir: root,
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
  logLevel: 'silent',
  plugins: [{
    name: 'isolated-auth-fixtures',
    setup(builder) {
      builder.onLoad({ filter: /src\/lib\/supabase\.js$/ }, () => ({
        contents: `
          const notCalled = () => { throw new Error('Provider calls are prohibited in this test') }
          export const signIn = notCalled, signUp = notCalled,
            resendConfirmationEmail = notCalled, resetPassword = notCalled
          export const supabase = { auth: { signInWithOAuth: notCalled } }
        `,
        loader: 'js',
      }))
      builder.onResolve({ filter: /^react-i18next$/ }, () => ({ path: 'fixture-i18n', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: `export const useTranslation = () => ({ t: (key, fallback) => ({
          'auth.signIn': 'Sign In', 'auth.signUp': 'Sign Up'
        }[key] || fallback || key) })`,
        loader: 'js',
      }))
    },
  }],
})
const filename = path.join(root, 'scripts', '__isolated-auth-test.cjs')
const compiled = new Module(filename)
compiled.filename = filename
compiled.paths = createRequire(import.meta.url).resolve.paths('react')
compiled._compile(result.outputFiles[0].text, filename)
const Auth = compiled.exports.default

function activeTab(markup) {
  const buttons = markup.match(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g) || []
  const selected = buttons.find(button => /aria-selected="true"/.test(button))
  assert.ok(selected, 'Expected a selected auth tab')
  return selected.replace(/<[^>]+>/g, '')
}
check('actual signup component renders Sign Up selected', () => {
  const html = renderToStaticMarkup(React.createElement(Auth, { initialTab: 'signup', onAuthSuccess: () => {} }))
  assert.equal(activeTab(html), 'Sign Up')
  assert.match(html, /signup-email/)
  assert.ok(html.indexOf('Continue with Google') < html.indexOf('signup-email'))
})
check('actual login component renders Sign In selected', () => {
  const html = renderToStaticMarkup(React.createElement(Auth, { initialTab: 'login', onAuthSuccess: () => {} }))
  assert.equal(activeTab(html), 'Sign In')
  assert.match(html, /login-email/)
  assert.ok(html.indexOf('Continue with Google') < html.indexOf('login-email'))
})
check('default and unsupported tab values safely fall back to login', () => {
  for (const initialTab of [undefined, 'unsupported']) {
    const html = renderToStaticMarkup(React.createElement(Auth, { initialTab, onAuthSuccess: () => {} }))
    assert.equal(activeTab(html), 'Sign In')
  }
})

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
check('web deploy bypasses native metadata bump and retains serverless configuration', () => {
  assert.equal(vercel.buildCommand, 'CI=false npm run build:web')
  assert.equal(pkg.scripts['build:web'], 'vite build --mode production')
  assert.ok(!('outputDirectory' in vercel))
  assert.ok(!pkg.scripts['prebuild:web'])
})
check('existing native build entrypoints explicitly use the Capacitor target', () => {
  for (const relative of ['scripts/create-update-bundle.sh', '.github/workflows/android-build.yml', 'deploy-android.ps1', 'deploy.bat']) {
    assert.match(fs.readFileSync(path.join(root, relative), 'utf8'), /npm run build -- --mode capacitor/)
  }
  const deploymentMenu = fs.readFileSync(path.join(root, 'deploy.ps1'), 'utf8')
  assert.match(deploymentMenu, /Step 1: Building web assets[^]*?npm run build -- --mode capacitor/)
  const rebuild = fs.readFileSync(path.join(root, 'rebuild-android.ps1'), 'utf8')
  assert.ok(rebuild.indexOf('npx vite build --mode capacitor') >= 0)
  assert.ok(rebuild.indexOf('npx vite build --mode capacitor') < rebuild.indexOf('npx cap sync android'))
})

console.log(`All ${checks} auth-entry regression checks passed. No provider, database, email or browser calls occurred.`)
