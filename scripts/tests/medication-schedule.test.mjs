import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import * as schedule from '../../src/lib/medicationSchedule.js'

const {
  getWeeklyDoseCount,
  validateScheduledWeekdays,
  normalizeScheduledWeekdays,
  getScheduledDoseCount,
  getLegacyDailyDoseCount,
  getScheduledDoseTimes,
  getMissingMedicationLogs,
  isWeeklyScheduleUnspecified,
  getWeekdayLabels,
  formatScheduledWeekdays
} = schedule

// Only synthetic objects. No app initialization, network, services, or DB access.
const USER = 'synthetic-user-a'
const OTHER_USER = 'synthetic-user-b'
const sunday = new Date(2026, 6, 5, 12, 34, 56, 789)
const monday = new Date(2026, 6, 6, 12)
const medication = (id, frequency = 'Once daily', extra = {}) => ({
  id, user_id: USER, frequency, is_active: true, ...extra
})
const isoAt = (date, hour = 8) => {
  const result = new Date(date)
  result.setHours(hour, 0, 0, 0)
  return result.toISOString()
}
const log = (id, medId, status = 'skipped', extra = {}) => ({
  id,
  user_id: USER,
  user_medication_id: medId,
  scheduled_time: isoAt(sunday),
  status,
  actual_time: status === 'taken' ? isoAt(sunday, 9) : null,
  ...extra
})
const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function assertLocalTimes(times, date, hours) {
  assert.deepEqual(times.map(time => time.getHours()), hours)
  for (const time of times) {
    assert.ok(time instanceof Date)
    assert.equal(time.getFullYear(), date.getFullYear())
    assert.equal(time.getMonth(), date.getMonth())
    assert.equal(time.getDate(), date.getDate())
    assert.equal(time.getMinutes(), 0)
    assert.equal(time.getSeconds(), 0)
    assert.equal(time.getMilliseconds(), 0)
  }
}

test('exports exactly the agreed public helper contract', () => {
  assert.deepEqual(Object.keys(schedule).sort(), [
    'getWeeklyDoseCount', 'validateScheduledWeekdays', 'normalizeScheduledWeekdays',
    'getScheduledDoseCount', 'getLegacyDailyDoseCount', 'getScheduledDoseTimes',
    'getMissingMedicationLogs', 'isWeeklyScheduleUnspecified', 'getWeekdayLabels',
    'formatScheduledWeekdays'
  ].sort())
})

test('weekly recognition is case-insensitive and keeps the stored frequency intact', () => {
  for (const frequency of ['Once weekly', ' once WEEKLY ', 'Once a week', 'Once per week']) {
    assert.equal(getWeeklyDoseCount(frequency), 1)
  }
  for (const frequency of ['Twice weekly', 'TWICE A WEEK', 'twice per week']) {
    assert.equal(getWeeklyDoseCount(frequency), 2)
  }
  for (const frequency of ['Once daily', 'Three times weekly', 'weekly', '', null, undefined, 2]) {
    assert.equal(getWeeklyDoseCount(frequency), 0)
  }
  const med = deepFreeze(medication('once', 'Once weekly', { scheduled_weekdays: [0] }))
  getScheduledDoseCount(med, sunday)
  normalizeScheduledWeekdays(med.frequency, med.scheduled_weekdays)
  assert.equal(med.frequency, 'Once weekly')
})

test('Sunday zero and all seven valid one-day weekly schedules', () => {
  assert.equal(sunday.getDay(), 0)
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const med = medication(`once-${weekday}`, 'Once weekly', { scheduled_weekdays: [weekday] })
    assert.equal(validateScheduledWeekdays(med.frequency, med.scheduled_weekdays), true)
    assert.equal(getScheduledDoseCount(med, new Date(2026, 6, 5 + weekday, 12)), 1)
    assert.equal(getScheduledDoseCount(med, new Date(2026, 6, 5 + ((weekday + 1) % 7), 12)), 0)
  }
})

test('twice weekly means one dose on each of exactly two chosen days', () => {
  const med = medication('twice', 'Twice weekly', { scheduled_weekdays: [3, 0] })
  assert.equal(getScheduledDoseCount(med, sunday), 1)
  assert.equal(getScheduledDoseCount(med, new Date(2026, 6, 8, 20)), 1)
  assert.equal(getScheduledDoseCount(med, monday), 0)
  assertLocalTimes(getScheduledDoseTimes(med, sunday), sunday, [8])
  assert.deepEqual(getScheduledDoseTimes(med, monday), [])
})

test('invalid weekday types, holes, duplicates, ranges, nesting, and cardinalities fail closed', () => {
  const invalidOnce = [null, undefined, [], [0, 1], [0, 0], ['0'], [false], [NaN],
    [Infinity], [-1], [7], [1.5], [null], [undefined], [[0]], new Array(1),
    '0', 0, { 0: 0, length: 1 }, new Uint8Array([0])]
  const invalidTwice = [null, undefined, [], [0], [0, 0], [0, 1, 2], [0, '1'],
    [0, -1], [0, 7], [0, 1.5], [null, 1], [[0], 1], new Array(2), [0, NaN]]
  for (const [frequency, invalid] of [['Once weekly', invalidOnce], ['Twice weekly', invalidTwice]]) {
    for (const days of invalid) {
      assert.equal(validateScheduledWeekdays(frequency, days), false)
      assert.throws(() => normalizeScheduledWeekdays(frequency, days), TypeError)
      const med = medication('invalid', frequency, { scheduled_weekdays: days })
      assert.equal(getScheduledDoseCount(med, sunday), 0)
      assert.deepEqual(getScheduledDoseTimes(med, sunday), [])
      assert.equal(isWeeklyScheduleUnspecified(med), true)
      assert.equal(formatScheduledWeekdays(med), '')
    }
  }
})

test('normalization sorts a new array without mutating the source', () => {
  const days = Object.freeze([6, 0])
  const sorted = normalizeScheduledWeekdays('Twice weekly', days)
  assert.deepEqual(sorted, [0, 6])
  assert.notEqual(sorted, days)
  assert.deepEqual(days, [6, 0])
  assert.deepEqual(normalizeScheduledWeekdays('Once weekly', [0]), [0])
})

test('nonweekly validation accepts only null/undefined/empty arrays; normalization returns null', () => {
  for (const frequency of ['Once daily', 'Every other day', 'As needed', '', null]) {
    for (const days of [null, undefined, []]) {
      assert.equal(validateScheduledWeekdays(frequency, days), true)
      assert.equal(normalizeScheduledWeekdays(frequency, days), null)
    }
    for (const days of [[0], 'Monday', false]) {
      assert.equal(validateScheduledWeekdays(frequency, days), false)
      assert.equal(normalizeScheduledWeekdays(frequency, days), null)
    }
    assert.equal(isWeeklyScheduleUnspecified({ frequency, scheduled_weekdays: [0] }), false)
    assert.equal(formatScheduledWeekdays({ frequency, scheduled_weekdays: [0] }), '')
  }
})

test('legacy NULL/missing weekly schedules never guess days from start_date or old logs', () => {
  for (const frequency of ['Once weekly', 'Twice weekly']) {
    for (const extra of [{}, { scheduled_weekdays: null }, { scheduled_weekdays: [] }]) {
      const med = medication('legacy', frequency, { start_date: '2026-07-05', ...extra })
      assert.equal(getScheduledDoseCount(med, sunday), 0)
      assert.equal(isWeeklyScheduleUnspecified(med), true)
      const priorLogs = deepFreeze([log('existing', med.id, 'taken')])
      assert.deepEqual(getMissingMedicationLogs([med], priorLogs, USER, sunday), [])
    }
  }
  assert.equal(isWeeklyScheduleUnspecified(null), false)
  assert.equal(isWeeklyScheduleUnspecified(medication('valid', 'Once weekly', { scheduled_weekdays: [0] })), false)
})

test('unsupported weekly frequencies never become daily through old number parsing', () => {
  for (const frequency of ['Three times weekly', 'Four times weekly', '2 weekly', 'weekly',
    'biweekly', 'twice-weekly', 'Three times a week', 'Every week', 'once weeklyish']) {
    const med = medication('unsupported', frequency, { scheduled_weekdays: [0, 3] })
    assert.equal(getWeeklyDoseCount(frequency), 0)
    assert.equal(getScheduledDoseCount(med, sunday), 0)
    assert.equal(validateScheduledWeekdays(frequency, null), false)
    assert.equal(isWeeklyScheduleUnspecified(med), true)
    assert.deepEqual(getMissingMedicationLogs([med], [], USER, sunday), [])
  }
})

test('exact legacy parser remains available for historical consumers', () => {
  const cases = [
    ['Once daily', 1], ['Twice daily', 2], ['Three times daily', 3], ['Four times daily', 4],
    ['Once weekly', 1], ['Twice weekly', 1], ['twice a week', 1],
    ['Every other day', 1], ['As needed', 1], ['', 1], [null, 1], [undefined, 1],
    ['2 times daily', 2], ['3 times daily', 3], ['4 times daily', 4],
    ['twice in the morning', 2], ['Three times weekly', 3], ['Four times weekly', 4]
  ]
  for (const [frequency, expected] of cases) assert.equal(getLegacyDailyDoseCount(frequency), expected)
})

test('daily counts and local legacy time patterns are unchanged', () => {
  for (const [frequency, hours] of [
    ['Once daily', [8]], ['Twice daily', [8, 20]], ['Three times daily', [8, 14, 20]],
    ['Four times daily', [8, 8, 8, 8]], ['Every other day', [8]], ['As needed', [8]],
    ['2 doses daily', [8, 20]], ['unknown', [8]]
  ]) {
    const med = medication('daily', frequency, { scheduled_weekdays: [6] })
    assert.equal(getScheduledDoseCount(med, sunday), hours.length)
    assertLocalTimes(getScheduledDoseTimes(med, sunday), sunday, hours)
  }
  const four = getScheduledDoseTimes(medication('four', 'Four times daily'), sunday)
  assert.equal(four.length, 4)
  assert.equal(new Set(four.map(time => time.getTime())).size, 1)
  assert.notEqual(four[0], four[1])
})

test('valid date-only start_date is an inclusive local-day boundary for all frequencies', () => {
  for (const frequency of ['Once daily', 'Twice daily', 'Once weekly', 'Twice weekly']) {
    const med = medication('start', frequency, {
      start_date: '2026-07-06',
      scheduled_weekdays: frequency === 'Once weekly' ? [1] : [0, 1]
    })
    assert.equal(getScheduledDoseCount(med, sunday), 0)
    assert.equal(getScheduledDoseCount(med, monday), frequency === 'Twice daily' ? 2 : 1)
  }
  for (const invalidStart of [undefined, null, '', 'bad', '2026-02-30', '2026-13-01',
    '2026-00-01', '2026-07-00', '2026-07-06T00:00:00Z']) {
    assert.equal(getScheduledDoseCount(medication('start', 'Once daily', { start_date: invalidStart }), sunday), 1)
  }
  assert.equal(getScheduledDoseCount(medication('leap', 'Once daily', { start_date: '2028-02-29' }), '2028-02-28'), 0)
  assert.equal(getScheduledDoseCount(medication('leap', 'Once daily', { start_date: '2028-02-29' }), '2028-02-29'), 1)
})

test('date-only input is local; Date inputs and med fixtures are not mutated', () => {
  const med = deepFreeze(medication('once', 'Once weekly', { scheduled_weekdays: [0], start_date: '2026-07-05' }))
  const original = sunday.getTime()
  assert.equal(getScheduledDoseCount(med, '2026-07-05'), 1)
  assertLocalTimes(getScheduledDoseTimes(med, '2026-07-05'), sunday, [8])
  getScheduledDoseTimes(med, sunday)
  getMissingMedicationLogs([med], [], USER, sunday)
  assert.equal(sunday.getTime(), original)
  assert.equal(getScheduledDoseCount(med, sunday.getTime()), 1)
})

test('invalid dates, missing medications, and inactive medications have no eligible doses', () => {
  for (const date of [new Date(NaN), 'bad', '2026-02-30', null, {}, Infinity]) {
    assert.equal(getScheduledDoseCount(medication('bad'), date), 0)
    assert.deepEqual(getScheduledDoseTimes(medication('bad'), date), [])
    assert.deepEqual(getMissingMedicationLogs([medication('bad')], [], USER, date), [])
  }
  for (const med of [null, undefined, medication('inactive', 'Twice daily', { is_active: false })]) {
    assert.equal(getScheduledDoseCount(med, sunday), 0)
    assert.deepEqual(getScheduledDoseTimes(med, sunday), [])
  }
})

test('planner emits only plain missing insert payloads in the existing schema shape', () => {
  const inserts = getMissingMedicationLogs([medication('new', 'Twice daily')], [], USER, sunday)
  assert.equal(inserts.length, 2)
  assert.deepEqual(inserts, [8, 20].map(hour => ({
    user_id: USER, user_medication_id: 'new', scheduled_time: isoAt(sunday, hour),
    status: 'skipped', actual_time: null
  })))
  for (const payload of inserts) {
    assert.equal(Object.getPrototypeOf(payload), Object.prototype)
    assert.deepEqual(Object.keys(payload).sort(), ['actual_time', 'scheduled_time', 'status', 'user_id', 'user_medication_id'])
    assert.equal('id' in payload, false)
    assert.equal('dose_number' in payload, false)
  }
})

test('taken, late, skipped, and missed logs each fulfill slots without updates', () => {
  for (const status of ['taken', 'late', 'skipped', 'missed']) {
    const existing = deepFreeze([log('preserved-id', 'twice', status)])
    const before = JSON.stringify(existing)
    const inserts = getMissingMedicationLogs([medication('twice', 'Twice daily')], existing, USER, sunday)
    assert.deepEqual(inserts.map(payload => payload.scheduled_time), [isoAt(sunday, 20)])
    assert.equal(JSON.stringify(existing), before)
    assert.equal(existing[0].id, 'preserved-id')
    assert.equal(existing[0].status, status)
  }
})

test('timestamp matching fills the absent slot even when the later dose was already logged', () => {
  const existing = [log('evening', 'twice', 'taken', { scheduled_time: isoAt(sunday, 20) })]
  const inserts = getMissingMedicationLogs([medication('twice', 'Twice daily')], existing, USER, sunday)
  assert.deepEqual(inserts.map(payload => payload.scheduled_time), [isoAt(sunday, 8)])
})

test('old/off-pattern slot times fulfill doses by count and excess logs never trigger deletion', () => {
  const med = medication('three', 'Three times daily')
  const existing = deepFreeze([
    log('old-time', med.id, 'late', { scheduled_time: isoAt(sunday, 11) }),
    log('exact-evening', med.id, 'taken', { scheduled_time: isoAt(sunday, 20) })
  ])
  assert.deepEqual(getMissingMedicationLogs([med], existing, USER, sunday).map(payload => payload.scheduled_time), [isoAt(sunday, 14)])
  const excess = deepFreeze([...existing, log('extra-1', med.id), log('extra-2', med.id)])
  assert.deepEqual(getMissingMedicationLogs([med], excess, USER, sunday), [])
  assert.equal(excess.length, 4)
})

test('four identical 08:00 slots are preserved by count, not timestamp uniqueness', () => {
  const med = medication('four', 'Four times daily')
  const generated = getMissingMedicationLogs([med], [], USER, sunday)
  assert.equal(generated.length, 4)
  assert.equal(new Set(generated.map(payload => payload.scheduled_time)).size, 1)
  const existing = deepFreeze([log('first', med.id, 'taken'), log('second', med.id, 'late')])
  const missing = getMissingMedicationLogs([med], existing, USER, sunday)
  assert.equal(missing.length, 2)
  assert.ok(missing.every(payload => payload.scheduled_time === isoAt(sunday)))
  const refreshed = [...existing, ...missing.map((payload, index) => ({ ...payload, id: `inserted-${index}` }))]
  assert.deepEqual(getMissingMedicationLogs([med], refreshed, USER, sunday), [])
})

test('new medication planning preserves prior taken, off-day, historical, inactive, and missing-medication logs', () => {
  const existing = deepFreeze([
    log('prior-taken', 'existing-daily', 'taken'),
    log('weekly-offday-taken', 'offday', 'taken'),
    log('history', 'new-med', 'late', { scheduled_time: isoAt(monday) }),
    log('inactive-history', 'inactive', 'taken'),
    log('missing-med-history', 'removed-med', 'taken')
  ])
  const before = JSON.stringify(existing)
  const meds = deepFreeze([
    medication('existing-daily'), medication('new-med'),
    medication('offday', 'Once weekly', { scheduled_weekdays: [1] }),
    medication('inactive', 'Twice daily', { is_active: false }),
    medication('unset', 'Once weekly', { scheduled_weekdays: null })
  ])
  const inserts = getMissingMedicationLogs(meds, existing, USER, sunday)
  assert.deepEqual(inserts.map(payload => payload.user_medication_id), ['new-med'])
  assert.equal(JSON.stringify(existing), before)
  assert.equal(existing.length, 5)
  assert.deepEqual(getMissingMedicationLogs([], existing, USER, sunday), [])
})

test('planner filters by same user, medication ID, and local scheduled day only', () => {
  const med = medication('scope')
  const existing = deepFreeze([
    log('wrong-user', med.id, 'taken', { user_id: OTHER_USER }),
    log('no-user', med.id, 'taken', { user_id: undefined }),
    log('wrong-med', 'different'),
    log('previous-day', med.id, 'taken', { scheduled_time: isoAt(new Date(2026, 6, 4, 12)) }),
    log('next-midnight', med.id, 'taken', { scheduled_time: new Date(2026, 6, 6).toISOString() }),
    log('bad-time', med.id, 'taken', { scheduled_time: 'invalid' }),
    log('null-time', med.id, 'taken', { scheduled_time: null }),
    log('actual-time-today', med.id, 'taken', { scheduled_time: isoAt(monday), actual_time: isoAt(sunday) })
  ])
  assert.equal(getMissingMedicationLogs([med], existing, USER, sunday).length, 1)
  const midnight = log('midnight', med.id, 'taken', { scheduled_time: new Date(2026, 6, 5).toISOString() })
  assert.deepEqual(getMissingMedicationLogs([med], [...existing, midnight], USER, sunday), [])
  assert.deepEqual(getMissingMedicationLogs([medication('foreign', 'Once daily', { user_id: OTHER_USER })], [], USER, sunday), [])
  assert.deepEqual(getMissingMedicationLogs([med], [], null, sunday), [])
})

test('empty/no-dose inputs are normal and duplicate medication inputs do not duplicate inserts', () => {
  assert.deepEqual(getMissingMedicationLogs(null, null, USER, sunday), [])
  assert.deepEqual(getMissingMedicationLogs([], [], USER, sunday), [])
  assert.deepEqual(getMissingMedicationLogs([null, {}, { id: '' }], [], USER, sunday), [])
  const offday = medication('offday', 'Twice weekly', { scheduled_weekdays: [1, 3] })
  const future = medication('future', 'Once daily', { start_date: '2026-07-06' })
  assert.deepEqual(getMissingMedicationLogs([offday, future], [], USER, sunday), [])
  const med = medication('duplicate', 'Twice daily')
  assert.equal(getMissingMedicationLogs([med, med], [], USER, sunday).length, 2)
})

test('repeat planning is idempotent after missing rows are inserted and receive IDs', () => {
  const meds = deepFreeze([
    medication('daily', 'Twice daily'),
    medication('weekly', 'Twice weekly', { scheduled_weekdays: [0, 4] }),
    medication('four', 'Four times daily')
  ])
  const existing = deepFreeze([log('prior-taken', 'daily', 'taken')])
  const inserts = getMissingMedicationLogs(meds, existing, USER, sunday)
  assert.equal(inserts.length, 6)
  const refreshed = deepFreeze([...existing, ...inserts.map((payload, index) => ({ ...payload, id: `synthetic-insert-${index}` }))])
  assert.deepEqual(getMissingMedicationLogs(meds, refreshed, USER, sunday), [])
  assert.equal(refreshed[0], existing[0])
  assert.equal(refreshed[0].actual_time, isoAt(sunday, 9))
})

test('weekday edits preserve historical facts and off-day taken logs; only missing current eligible doses are planned', () => {
  const historical = deepFreeze([
    log('old-sunday-taken', 'edited', 'taken'),
    log('old-history', 'edited', 'late', { scheduled_time: isoAt(new Date(2026, 5, 28, 12)) })
  ])
  const before = JSON.stringify(historical)
  const edited = medication('edited', 'Once weekly', { scheduled_weekdays: [1] })
  assert.deepEqual(getMissingMedicationLogs([edited], historical, USER, sunday), [])
  assert.equal(getMissingMedicationLogs([edited], historical, USER, monday).length, 1)
  assert.equal(JSON.stringify(historical), before)
  assert.equal(getLegacyDailyDoseCount(edited.frequency), 1)
})

test('localized weekday labels are Monday-first while values remain Sunday-based', () => {
  const labels = getWeekdayLabels()
  assert.deepEqual(labels, [
    { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ])
  assert.equal(getWeekdayLabels('en', 'short')[6].label, 'Sun')
  assert.equal(getWeekdayLabels('fr')[0].label, 'lundi')
  assert.equal(getWeekdayLabels('es')[6].label, 'domingo')
  assert.equal(formatScheduledWeekdays({ frequency: 'Once weekly', scheduled_weekdays: [0] }), 'Sunday')
  assert.equal(formatScheduledWeekdays({ frequency: 'Twice weekly', scheduled_weekdays: [0, 1] }), 'Monday, Sunday')
  assert.equal(formatScheduledWeekdays({ frequency: 'Twice weekly', scheduled_weekdays: [0, 1] }, 'fr'), 'lundi, dimanche')
  assert.equal(formatScheduledWeekdays(null), '')
})

const helperUrl = new URL('../../src/lib/medicationSchedule.js', import.meta.url).href
for (const [tz, utcBoundaryWeekday, positiveBoundaryWeekday, julyOffset] of [
  ['America/Winnipeg', 0, 0, 300], // July UTC−5, not Winnipeg's winter UTC−6.
  ['Asia/Tokyo', 1, 1, -540],
  ['Pacific/Auckland', 1, 1, -720],
  ['UTC', 1, 0, 0]
]) {
  test(`subprocess TZ=${tz}: local weekday/UTC boundaries, start dates, logs, labels, daily times`, () => {
    const script = `
      import assert from 'node:assert/strict';
      import * as h from ${JSON.stringify(helperUrl)};
      const localSunday = new Date(2026, 6, 5, 12);
      assert.equal(localSunday.getTimezoneOffset(), ${julyOffset});
      const weekly = { id: 'weekly', user_id: 'u', frequency: 'Once weekly', scheduled_weekdays: [0] };
      const utcBoundary = new Date('2026-07-06T00:30:00Z');
      const positiveBoundary = new Date('2026-07-05T18:30:00Z');
      assert.equal(utcBoundary.getDay(), ${utcBoundaryWeekday});
      assert.equal(positiveBoundary.getDay(), ${positiveBoundaryWeekday});
      assert.equal(h.getScheduledDoseCount(weekly, utcBoundary), ${utcBoundaryWeekday === 0 ? 1 : 0});
      assert.equal(h.getScheduledDoseCount(weekly, positiveBoundary), ${positiveBoundaryWeekday === 0 ? 1 : 0});
      assert.equal(h.getScheduledDoseCount(weekly, '2026-07-05'), 1);
      assert.equal(h.getScheduledDoseCount({ ...weekly, start_date: '2026-07-05' }, '2026-07-05'), 1);
      assert.equal(h.getScheduledDoseCount({ ...weekly, start_date: '2026-07-06' }, localSunday), 0);
      const daily = { id: 'daily', user_id: 'u', frequency: 'Once daily', start_date: '2026-07-06' };
      assert.equal(h.getScheduledDoseCount(daily, utcBoundary), ${utcBoundaryWeekday === 1 ? 1 : 0});
      const boundaryLog = { id: 'taken', user_id: 'u', user_medication_id: 'daily', scheduled_time: utcBoundary.toISOString(), status: 'taken', actual_time: utcBoundary.toISOString() };
      const current = { ...daily, start_date: null };
      assert.equal(h.getMissingMedicationLogs([current], [boundaryLog], 'u', localSunday).length, ${utcBoundaryWeekday === 0 ? 0 : 1});
      const noonLog = { ...boundaryLog, scheduled_time: localSunday.toISOString() };
      assert.deepEqual(h.getMissingMedicationLogs([current], [noonLog], 'u', '2026-07-05'), []);
      const times = h.getScheduledDoseTimes({ ...current, frequency: 'Three times daily' }, localSunday);
      assert.deepEqual(times.map(d => d.getHours()), [8, 14, 20]);
      assert.ok(times.every(d => d.getDay() === 0 && d.getDate() === 5 && d.getMinutes() === 0));
      const payload = h.getMissingMedicationLogs([weekly], [], 'u', '2026-07-05')[0];
      assert.equal(new Date(payload.scheduled_time).getHours(), 8);
      assert.equal(new Date(payload.scheduled_time).getDay(), 0);
      assert.equal(h.getWeekdayLabels('en')[6].label, 'Sunday');
      assert.equal(h.getWeekdayLabels('fr')[0].label, 'lundi');
      assert.equal(h.formatScheduledWeekdays(weekly), 'Sunday');
      assert.equal(h.getScheduledDoseCount({ ...weekly, start_date: '2026-02-30' }, localSunday), 1);
      assert.equal(h.getScheduledDoseCount({ ...weekly, start_date: '0099-07-06' }, localSunday), 1);
      if (${JSON.stringify(tz)} === 'America/Winnipeg') {
        // Historical fixtures avoid assuming future timezone legislation.
        for (const [year, month, date, expectedHours] of [[2026, 2, 8, 23], [2025, 10, 2, 25]]) {
          const start = new Date(year, month, date);
          const next = new Date(year, month, date + 1);
          assert.equal((next - start) / 3600000, expectedHours);
          const late = new Date(start); late.setHours(23, 30, 0, 0);
          const existing = [{ ...boundaryLog, scheduled_time: late.toISOString() }];
          assert.deepEqual(h.getMissingMedicationLogs([current], existing, 'u', start), []);
          assert.equal(h.getMissingMedicationLogs([current], [{ ...boundaryLog, scheduled_time: next.toISOString() }], 'u', start).length, 1);
          assert.deepEqual(h.getScheduledDoseTimes({ ...current, frequency: 'Twice daily' }, start).map(d => d.getHours()), [8, 20]);
        }
      }
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: tz }, encoding: 'utf8', timeout: 10000
    })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  })
}

test('migration is additive/idempotent, nullable, type-guarded, structural-only, and does not touch logs', () => {
  const sql = readFileSync(new URL('../../database/add_medication_scheduled_weekdays.sql', import.meta.url), 'utf8')
  const executable = sql.replace(/--[^\n]*/g, '').replace(/'(?:''|[^'])*'/g, "''")
  assert.match(sql, /BEGIN;/)
  assert.match(sql, /ADD COLUMN IF NOT EXISTS scheduled_weekdays smallint\[\]/)
  assert.match(sql, /atttypid = 'smallint\[\]'::regtype/)
  assert.match(sql, /IF NOT EXISTS[\s\S]*pg_constraint/)
  assert.match(sql, /scheduled_weekdays IS NULL/)
  assert.match(sql, /array_ndims/)
  assert.match(sql, /cardinality\(scheduled_weekdays\) IN \(1, 2\)/)
  assert.match(sql, /array_position\(scheduled_weekdays, NULL::smallint\)/)
  assert.match(sql, /ARRAY\[0, 1, 2, 3, 4, 5, 6\]::smallint\[\]/)
  assert.match(sql, /array_lower[\s\S]*<>[\s\S]*array_upper/)
  assert.match(sql, /COMMENT ON COLUMN public\.user_medications\.scheduled_weekdays/)
  assert.match(sql, /NOTIFY pgrst, 'reload schema';/)
  assert.match(sql, /COMMIT;/)
  assert.doesNotMatch(executable, /\b(?:UPDATE|DELETE|INSERT|DEFAULT|frequency|medication_logs|POLICY|http)\b/i)
})
