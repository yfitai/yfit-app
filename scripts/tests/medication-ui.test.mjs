import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import React, { useState } from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import resources from '../../src/lib/i18nResources.js'

// Transient test runtime stays outside the app dependency manifest and lockfile.
const runtime = process.env.YFIT_TEST_DEPS || '/home/ubuntu/.manus/yfit-medication/test-deps'
const require = createRequire(path.join(runtime, 'package.json'))
const { JSDOM } = require('jsdom')
const rootPath = path.resolve(new URL('../..', import.meta.url).pathname)
const tempPath = path.join(rootPath, 'node_modules/.cache/yfit-medication-tests')
await fs.mkdir(tempPath, { recursive: true })
await build({
  stdin: { contents: `export { default as Picker } from './src/components/MedicationWeekdayPicker.jsx'; export { default as MedicationLog } from './src/components/MedicationLog.jsx'; export { default as InteractionChecker } from './src/components/InteractionChecker.jsx';`, resolveDir: rootPath },
  bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external',
  outfile: path.join(tempPath, 'ui-fixture.mjs'),
  plugins: [{ name: 'fictional-supabase-only', setup(builder) {
    builder.onResolve({ filter: /(?:lib\/supabase)$/ }, () => ({ path: 'fictional-supabase', namespace: 'fixture' }))
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const supabase = { from: (...args) => globalThis.__medicationFixture.from(...args) };', loader: 'js' }))
  }}]
})
const { Picker, MedicationLog, InteractionChecker } = await import(pathToFileURL(path.join(tempPath, 'ui-fixture.mjs')))
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://fictional-test.invalid/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.fetch = () => { throw new Error('Network disabled for medication fixtures') }
await i18next.init({ lng: 'en', fallbackLng: 'en', resources, interpolation: { escapeValue: false } })
const user = { id: 'fictional-ui-user' }
const render = (component) => React.createElement(I18nextProvider, { i18n: i18next }, component)
let root
const mount = async component => {
  root = createRoot(document.getElementById('root'))
  await act(async () => { root.render(render(component)); await new Promise(resolve => setTimeout(resolve, 25)) })
}
const unmount = async () => { await act(async () => root.unmount()) }
const click = async element => { await act(async () => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))) }
function PickerHarness({ frequency, initial = [] }) {
  const [days, setDays] = useState(initial)
  return React.createElement('div', null, React.createElement(Picker, { frequency, days, onChange: setDays }), React.createElement('output', null, JSON.stringify(days)))
}

test('daily frequencies show no weekday picker', async () => {
  await mount(React.createElement(PickerHarness, { frequency: 'Twice daily' }))
  assert.equal(document.querySelectorAll('input').length, 0)
  await unmount()
})

test('once weekly exposes seven labeled radios and replaces rather than adds a selected day', async () => {
  await mount(React.createElement(PickerHarness, { frequency: 'Once weekly' }))
  assert.equal(document.querySelectorAll('input[type=radio]').length, 7)
  await click(document.querySelector('input[value="1"]'))
  assert.equal(document.querySelector('output').textContent, '[1]')
  await click(document.querySelector('input[value="0"]'))
  assert.equal(document.querySelector('output').textContent, '[0]')
  assert.equal(document.querySelectorAll('input:checked').length, 1)
  assert.match(document.body.textContent, /Sunday/)
  await unmount()
})

test('twice weekly permits exactly two different days and lets the user change them', async () => {
  await mount(React.createElement(PickerHarness, { frequency: 'Twice weekly' }))
  await click(document.querySelector('input[value="1"]'))
  await click(document.querySelector('input[value="4"]'))
  assert.equal(document.querySelector('output').textContent, '[1,4]')
  assert.equal(document.querySelector('input[value="3"]').disabled, true)
  await click(document.querySelector('input[value="1"]'))
  assert.equal(document.querySelector('input[value="3"]').disabled, false)
  await click(document.querySelector('input[value="3"]'))
  assert.equal(document.querySelector('output').textContent, '[3,4]')
  await unmount()
})

function logClient({ fail = false } = {}) {
  const date = new Date()
  const atEight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8).toISOString()
  const daily = { id: 'fictional-daily', user_id: user.id, is_active: true, is_supplement: false, custom_name: 'Fictional daily product', frequency: 'Twice daily' }
  const offDay = { id: 'fictional-offday', user_id: user.id, is_active: true, is_supplement: false, custom_name: 'Fictional off-day product', frequency: 'Once weekly', scheduled_weekdays: [(date.getDay() + 1) % 7] }
  const unset = { id: 'fictional-unset', user_id: user.id, is_active: true, is_supplement: false, custom_name: 'Fictional unset product', frequency: 'Once weekly', scheduled_weekdays: null }
  const meds = [daily, offDay, unset]
  const makeLog = (med, id, status) => ({ id, user_id: user.id, user_medication_id: med.id, scheduled_time: atEight, status, actual_time: status === 'taken' ? atEight : null, user_medication: med })
  const state = { rows: [makeLog(daily, 'fictional-dose-1', 'taken'), makeLog(daily, 'fictional-dose-2', 'skipped'), makeLog(offDay, 'fictional-old-offday-dose', 'taken')], writes: [] }
  globalThis.__medicationFixture = { from(table) {
    return {
      operation: 'read', filters: [],
      select() { return this }, eq(...args) { this.filters.push(args); return this },
      gte() { return this }, lt() { return this }, order() { return this },
      insert(payload) { this.operation = 'insert'; this.payload = payload; return this },
      update(payload) { this.operation = 'update'; this.payload = payload; return this },
      then(resolve, reject) {
        if (fail) return Promise.resolve({ error: new Error('fictional service unavailable') }).then(resolve, reject)
        if (this.operation === 'insert') { state.writes.push(this); state.rows.push(...this.payload) }
        if (this.operation === 'update') {
          state.writes.push({ operation: this.operation, filters: this.filters, payload: this.payload })
          const id = this.filters.find(([key]) => key === 'id')?.[1]
          const row = state.rows.find(row => row.id === id)
          if (row) Object.assign(row, this.payload)
        }
        return Promise.resolve({ data: table === 'user_medications' ? meds : state.rows, error: null }).then(resolve, reject)
      }
    }
  }}
  return state
}

test('real log component renders daily checkboxes but no off-day/unset weekly checkbox and retains taken history', async () => {
  const state = logClient()
  const snapshot = JSON.stringify(state.rows)
  await mount(React.createElement(MedicationLog, { user }))
  assert.equal(document.querySelectorAll('button[role=checkbox]').length, 2)
  assert.match(document.body.textContent, /No dose scheduled today/)
  assert.match(document.body.textContent, /Choose dosing days in My Medications/)
  assert.match(document.body.textContent, /Other doses recorded today/)
  assert.match(document.body.textContent, /Fictional off-day product/)
  assert.equal(state.writes.length, 0)
  assert.equal(JSON.stringify(state.rows), snapshot)
  await click(document.querySelector('button[role=checkbox][aria-checked=false]'))
  assert.equal(state.writes.length, 1)
  assert.equal(state.writes[0].operation, 'update')
  assert.ok(state.writes[0].filters.some(([key, value]) => key === 'user_id' && value === user.id))
  assert.equal(state.rows[2].status, 'taken')
  assert.equal(document.querySelectorAll('button[role=checkbox][aria-checked=true]').length, 2)
  await unmount()
})

test('failed first load renders an error, not false zero adherence or new checkboxes', async () => {
  logClient({ fail: true })
  await mount(React.createElement(MedicationLog, { user }))
  assert.match(document.querySelector('[role=alert]').textContent, /Unable to load dose records/)
  assert.equal(document.querySelectorAll('button[role=checkbox]').length, 0)
  assert.doesNotMatch(document.body.textContent, /0%/)
  await unmount()
})

test('all eight medication locales provide scheduling keys without raw translation identifiers', () => {
  for (const [locale, value] of Object.entries(resources)) {
    for (const key of ['dosingDays', 'chooseOneDay', 'chooseTwoDays', 'scheduleNeeded', 'noDoseToday', 'logLoadFailed', 'historyUsesRecordedDoses']) {
      assert.equal(typeof value.translation.medications[key], 'string', `${locale}.${key}`)
    }
  }
})

test('current comparison table exposes a compound ingredient conflict and proposed form without any record write', async () => {
  const ids = [1, 2, 3, 4, 5].map(value => `00000000-0000-0000-0000-${String(value).padStart(12, '0')}`)
  const ingredients = ids.slice(0, 4).map((id, index) => ({ medication_id: id, name: `Fictional ingredient ${index + 1}`, dosage: `Fictional label strength ${index + 1}` }))
  const meds = [
    { id: 'fictional-compound', user_id: user.id, is_active: true, custom_name: 'Fictional compound', dosage: 'Fictional parent directions', frequency: 'Once weekly', combination_ingredients: ingredients },
    { id: 'fictional-other', user_id: user.id, is_active: true, custom_name: 'Fictional other product', dosage: 'Fictional other strength', frequency: 'Once daily', medication_id: ids[4] }
  ]
  globalThis.__medicationFixture = { from(table) {
    return {
      ids: [], select() { return this }, eq() { return this }, order() { return this },
      in(key, values) { this.ids = values; return this }, or() { return this },
      then(resolve, reject) {
        const data = table === 'user_medications' ? meds : table === 'safety_alerts' ? [] : table === 'medications'
          ? this.ids.map(id => ({ id, name: `Fictional catalog ${ids.indexOf(id) + 1}` }))
          : [{ drug_a_id: ids[0], drug_b_id: ids[4], severity: 'major', description: 'Fictional catalog conflict description', management: 'Fictional catalog management text' }]
        return Promise.resolve({ data, error: null }).then(resolve, reject)
      }
    }
  }}
  await mount(React.createElement(InteractionChecker, { user }))
  const table = document.querySelector('table')
  assert.ok(table)
  assert.match(table.textContent, /Ingredient check status/)
  assert.match(table.textContent, /Fictional ingredient 4/)
  assert.match(table.textContent, /Catalog conflicts found/)
  assert.match(document.body.textContent, /Fictional catalog conflict description/)
  assert.match(document.body.textContent, /Compare a proposed medication/)
  assert.match(document.body.textContent, /Compare without saving/)
  assert.doesNotMatch(document.body.textContent, /safe to take|no active safety alerts/i)
  await unmount()
})
