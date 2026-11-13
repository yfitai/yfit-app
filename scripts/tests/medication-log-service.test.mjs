import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  loadMedicationDayLogs, medicationDayBounds, medicationLocalDateKey,
  getActionableMedicationLogs, canToggleMedicationLog, calculateMedicationAdherence
} from '../../src/lib/medicationLogService.js'

const monday = new Date(2026, 10, 16, 12)
const daily = { id: 'daily-fixture', user_id: 'fixture-user', frequency: 'Once daily', custom_name: 'Fictional daily item', is_supplement: false }
const weekly = { id: 'weekly-fixture', user_id: 'fixture-user', frequency: 'Once weekly', scheduled_weekdays: [2], custom_name: 'Fictional weekly item', is_supplement: false }
const log = (med, status = 'skipped', date = monday, id = med.id) => ({
  id, user_id: 'fixture-user', user_medication_id: med.id,
  scheduled_time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8).toISOString(),
  status, actual_time: status === 'taken' ? date.toISOString() : null, user_medication: { ...med }
})

function clientFixture(initial, failRead = false, failInsert = false) {
  const state = { rows: structuredClone(initial), calls: [] }
  const client = {
    from(table) {
      assert.equal(table, 'medication_logs')
      const query = {
        op: 'read', filters: [],
        select() { return this },
        eq(...args) { this.filters.push(['eq', ...args]); return this },
        gte(...args) { this.filters.push(['gte', ...args]); return this },
        lt(...args) { this.filters.push(['lt', ...args]); return this },
        order() { return this },
        insert(payload) { this.op = 'insert'; this.payload = payload; return this },
        then(resolve, reject) {
          state.calls.push({ op: this.op, filters: this.filters, payload: this.payload })
          if (this.op === 'insert') {
            if (failInsert) return Promise.resolve({ error: new Error('fixture insert failure') }).then(resolve, reject)
            state.rows.push(...this.payload.map((row, i) => ({ ...row, id: `fixture-insert-${i}` })))
          }
          return Promise.resolve({ data: structuredClone(state.rows), error: failRead ? new Error('fixture read failure') : null }).then(resolve, reject)
        }
      }
      return query
    }
  }
  return { client, state }
}

test('one missing daily log is inserted without deleting an existing taken or off-day record', async () => {
  const oldTaken = log(weekly, 'taken')
  const { client, state } = clientFixture([oldTaken])
  const result = await loadMedicationDayLogs(client, [daily, weekly], 'fixture-user', monday)
  assert.deepEqual(result[0], oldTaken)
  assert.equal(result.length, 2)
  assert.equal(state.calls.filter(call => call.op === 'insert').length, 1)
  assert.equal(state.calls.find(call => call.op === 'insert').payload[0].user_medication_id, daily.id)
  const reads = state.calls.filter(call => call.op === 'read')
  assert.ok(reads.every(call => call.filters.some(filter => filter[0] === 'eq' && filter[1] === 'user_id' && filter[2] === 'fixture-user')))
  await loadMedicationDayLogs(client, [daily, weekly], 'fixture-user', monday)
  assert.equal(state.rows.length, 2)
})

test('zero scheduled doses is a valid read-only state and preserves legacy rows', async () => {
  const legacy = log(weekly, 'taken')
  const { client, state } = clientFixture([legacy])
  assert.deepEqual(await loadMedicationDayLogs(client, [weekly], 'fixture-user', monday), [legacy])
  assert.equal(state.calls.length, 1)
})

test('read errors are propagated rather than generating records from an empty fallback', async () => {
  const { client, state } = clientFixture([], true)
  await assert.rejects(loadMedicationDayLogs(client, [daily], 'fixture-user', monday), /read failure/)
  assert.equal(state.calls.length, 1)
  assert.equal(state.rows.length, 0)
})

test('insert errors are propagated and cannot replace existing taken records', async () => {
  const saved = log(weekly, 'taken')
  const { client, state } = clientFixture([saved], false, true)
  await assert.rejects(loadMedicationDayLogs(client, [daily], 'fixture-user', monday), /insert failure/)
  assert.deepEqual(state.rows, [saved])
})

test('weekly off-day and unspecified schedules have no actionable checkbox or toggle', () => {
  const saved = log(weekly, 'taken')
  assert.deepEqual(getActionableMedicationLogs(weekly, [saved], monday), [])
  assert.equal(canToggleMedicationLog(saved, weekly, monday), false)
  const unset = { ...weekly, scheduled_weekdays: null }
  assert.equal(canToggleMedicationLog(saved, unset, monday), false)
})

test('daily checkbox is available and stale-day or foreign-medication toggles are refused', () => {
  const saved = log(daily, 'taken')
  assert.equal(canToggleMedicationLog(saved, daily, monday), true)
  assert.equal(canToggleMedicationLog(saved, daily, new Date(2026, 10, 17)), false)
  assert.equal(canToggleMedicationLog(saved, weekly, monday), false)
})

test('an already taken dose is displayed first when legacy extra logs exist', () => {
  const pending = log(daily, 'skipped', monday, 'pending-fixture')
  const taken = log(daily, 'taken', monday, 'taken-fixture')
  const rows = [pending, taken]
  assert.equal(getActionableMedicationLogs(daily, rows, monday)[0].id, 'taken-fixture')
  assert.deepEqual(rows, [pending, taken])
})

test('current-day totals exclude off-day legacy weekly rows without hiding history', () => {
  const yesterday = new Date(2026, 10, 15, 12)
  const prior = log(weekly, 'taken', yesterday, 'historical-fixture')
  const result = calculateMedicationAdherence([daily, weekly], [log(daily, 'taken'), log(weekly, 'taken'), prior], monday)
  assert.equal(result.stats.todayMedTaken, 1)
  assert.equal(result.stats.todayMedTotal, 1)
  const historical = result.breakdown.find(day => medicationLocalDateKey(day.date) === medicationLocalDateKey(yesterday))
  assert.equal(historical.medTotal, 1)
  assert.equal(historical.medTaken, 1)
  assert.equal(historical.medLogs[0].id, prior.id)
})

test('new selected weekdays never rewrite a past day denominator', () => {
  const yesterday = new Date(2026, 10, 15, 12)
  const before = log(weekly, 'taken', yesterday)
  const first = calculateMedicationAdherence([weekly], [before], monday)
  const second = calculateMedicationAdherence([{ ...weekly, scheduled_weekdays: [4] }], [before], monday)
  assert.deepEqual(first, second)
})

test('an empty scheduled day has zero totals, finite rates and no invented tracking day', () => {
  const result = calculateMedicationAdherence([weekly], [], monday)
  assert.equal(result.stats.todayMedTotal, 0)
  assert.equal(result.stats.daysTracked, 0)
  assert.equal(result.stats.overallMedRate, 0)
})

test('daily multiple-dose and custom supplement totals are preserved', () => {
  const med = { ...daily, frequency: 'Four times daily' }
  const supplement = { ...daily, id: 'supplement-fixture', is_supplement: true, frequency: 'Twice daily' }
  const result = calculateMedicationAdherence([med, supplement], [log(med, 'taken'), log(supplement, 'taken')], monday)
  assert.equal(result.stats.todayMedTotal, 4)
  assert.equal(result.stats.todayMedTaken, 1)
  assert.equal(result.stats.todaySuppTotal, 2)
  assert.equal(result.stats.todaySuppTaken, 1)
})

test('future and malformed historical log timestamps cannot distort statistics', () => {
  const future = log(daily, 'taken', new Date(2026, 10, 20))
  const invalid = { ...log(daily), scheduled_time: 'not-a-date' }
  const result = calculateMedicationAdherence([daily], [future, invalid], monday)
  assert.equal(result.stats.todayMedTaken, 0)
  assert.equal(result.stats.daysTracked, 1)
})

test('day bounds use consecutive local midnights', () => {
  const { start, end } = medicationDayBounds(monday)
  assert.equal(start.getHours(), 0)
  assert.equal(end.getHours(), 0)
  assert.equal(medicationLocalDateKey(start), '2026-11-16')
  assert.equal(medicationLocalDateKey(end), '2026-11-17')
})

test('the active medication log component/service contain no delete-and-regenerate path', () => {
  for (const path of ['../../src/components/MedicationLog.jsx', '../../src/lib/medicationLogService.js']) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.equal(/\.delete\(\s*\)/.test(source), false, 'no Supabase delete operation; Set.delete(log.id) is local UI cleanup')
    assert.equal(source.includes('JSON.stringify'), false, 'must not debug-print health records')
  }
})
