/**
 * Pure, local-calendar medication scheduling helpers. Stored frequency strings
 * are never changed. Sunday is 0 and Saturday is 6.
 *
 * Weekly selections describe the CURRENT schedule, not schedule history. Use
 * these helpers prospectively for today's scheduling; never apply a current
 * selection to historical adherence expectations. No effective-date/version
 * history can be inferred from scheduled_weekdays or existing dose logs.
 */

function frequencyText(frequency) {
  return typeof frequency === 'string' ? frequency.trim().toLowerCase() : ''
}

function isWeeklyFrequency(frequency) {
  const text = frequencyText(frequency)
  // Unsupported weekly wording must not fall through to daily number parsing.
  return text.includes('weekly') || /\bweek\b/.test(text)
}

/** Recognize supported once/twice weekly wording without changing stored text. */
export function getWeeklyDoseCount(frequency) {
  const text = frequencyText(frequency)
  if (/\btwice\s+(?:weekly|(?:a|per)\s+week)\b/.test(text)) return 2
  if (/\bonce\s+(?:weekly|(?:a|per)\s+week)\b/.test(text)) return 1
  return 0
}

/** Weekly arrays must contain the exact number of distinct integer weekdays. */
export function validateScheduledWeekdays(frequency, days) {
  if (!isWeeklyFrequency(frequency)) {
    return days == null || (Array.isArray(days) && days.length === 0)
  }

  const count = getWeeklyDoseCount(frequency)
  if (!count || !Array.isArray(days) || days.length !== count) return false
  // Array.from exposes holes as undefined rather than silently skipping them.
  const values = Array.from(days)
  return values.every(day => Number.isInteger(day) && day >= 0 && day <= 6)
    && new Set(values).size === count
}

/** Return a new Sunday-based sorted array; do not coerce invalid weekly input. */
export function normalizeScheduledWeekdays(frequency, days) {
  if (!isWeeklyFrequency(frequency)) return null
  if (!validateScheduledWeekdays(frequency, days)) {
    throw new TypeError('Weekly schedules require exactly one or two distinct integer weekdays (0–6), matching the frequency.')
  }
  return [...days].sort((a, b) => a - b)
}

/** True for missing, malformed, or unsupported weekly schedules needing setup. */
export function isWeeklyScheduleUnspecified(med) {
  return Boolean(med && isWeeklyFrequency(med.frequency)
    && !validateScheduledWeekdays(med.frequency, med.scheduled_weekdays))
}

/**
 * Exact legacy daily-count parsing, including once/twice weekly => 1.
 * Retained for legacy consumers/history; this is NOT weekly eligibility logic.
 */
export function getLegacyDailyDoseCount(frequency) {
  const text = frequencyText(frequency)
  if (text.includes('twice weekly') || text.includes('twice a week')) return 1
  if (text.includes('once weekly') || text.includes('every other day') || text.includes('as needed')) return 1
  if (text.includes('twice') || text.includes('2')) return 2
  if (text.includes('three') || text.includes('3')) return 3
  if (text.includes('four') || text.includes('4')) return 4
  return 1
}

function parseLocalDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const result = new Date(0)
  result.setHours(0, 0, 0, 0)
  // setFullYear avoids Date's special interpretation of years 00–99.
  result.setFullYear(year, month - 1, day)
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null
  return result
}

function localCalendarDate(value) {
  let result
  if (value instanceof Date) {
    result = new Date(value.getTime())
  } else if (typeof value === 'string') {
    result = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? parseLocalDateOnly(value)
      : new Date(value)
  } else if (typeof value === 'number') {
    result = new Date(value)
  } else {
    return null
  }
  if (!result || !Number.isFinite(result.getTime())) return null
  result.setHours(0, 0, 0, 0)
  return result
}

/** Count doses eligible on a local calendar day; never guess a weekly weekday. */
export function getScheduledDoseCount(med, date = new Date()) {
  if (!med || med.is_active === false) return 0
  const day = localCalendarDate(date)
  if (!day) return 0
  // Only a valid date-only start_date is a calendar-date eligibility boundary.
  // Missing/malformed legacy values do not acquire a guessed start date.
  const start = parseLocalDateOnly(med.start_date)
  if (start && day.getTime() < start.getTime()) return 0

  if (isWeeklyFrequency(med.frequency)) {
    if (!validateScheduledWeekdays(med.frequency, med.scheduled_weekdays)) return 0
    return med.scheduled_weekdays.includes(day.getDay()) ? 1 : 0
  }
  return getLegacyDailyDoseCount(med.frequency)
}

/** Preserve legacy local times, including FOUR distinct entries all at 08:00. */
export function getScheduledDoseTimes(med, date = new Date()) {
  const day = localCalendarDate(date)
  if (!day) return []
  const count = getScheduledDoseCount(med, day)
  const hours = count === 2 ? [8, 20] : count === 3 ? [8, 14, 20] : Array(count).fill(8)
  return hours.map(hour => {
    const time = new Date(day.getTime())
    time.setHours(hour, 0, 0, 0)
    return time
  })
}

function hasIdentifier(value) {
  return (typeof value === 'string' && value.trim() !== '')
    || (typeof value === 'number' && Number.isFinite(value))
}

/**
 * Plan insert payloads only for missing doses on the requested local day.
 * The caller must pass its current, user-scoped medication rows (rows explicitly
 * belonging to another user are ignored). Use prospectively, not to fill or
 * recalculate historical expectations with today's schedule.
 *
 * Every existing same-user/med/day row occupies a dose regardless of status or
 * actual_time. Match timestamps when possible, then consume unmatched rows by
 * count. This preserves taken/late/skipped records, off-pattern times, and four
 * identical 08:00 slots. All supplied logs remain untouched, including off-day,
 * historical, excess, inactive, and unknown-medication rows.
 *
 * This is idempotent against a refreshed list containing the inserted rows;
 * it is not a database concurrency/uniqueness guarantee across devices.
 */
export function getMissingMedicationLogs(meds, existingLogs, userId, date = new Date()) {
  const day = localCalendarDate(date)
  if (!day || !hasIdentifier(userId)) return []
  const tomorrow = new Date(day.getTime())
  tomorrow.setDate(tomorrow.getDate() + 1)

  const occupiedByMedication = new Map()
  for (const log of Array.isArray(existingLogs) ? existingLogs : []) {
    if (!log || log.user_id !== userId || !hasIdentifier(log.user_medication_id)) continue
    if (!(log.scheduled_time instanceof Date) && typeof log.scheduled_time !== 'string'
      && typeof log.scheduled_time !== 'number') continue
    // Dose timestamps represent instants. Calendar comparison is LOCAL, not an
    // ISO date-prefix comparison (which would incorrectly use the UTC day).
    const time = new Date(log.scheduled_time).getTime()
    if (!Number.isFinite(time) || time < day.getTime() || time >= tomorrow.getTime()) continue
    const occupied = occupiedByMedication.get(log.user_medication_id) || []
    occupied.push(time)
    occupiedByMedication.set(log.user_medication_id, occupied)
  }

  const inserts = []
  const seen = new Set()
  for (const med of Array.isArray(meds) ? meds : []) {
    if (!med || !hasIdentifier(med.id) || med.is_active === false || seen.has(med.id)) continue
    if (med.user_id != null && med.user_id !== userId) continue
    seen.add(med.id)
    const remaining = getScheduledDoseTimes(med, day)
    let unmatched = 0
    for (const time of occupiedByMedication.get(med.id) || []) {
      const index = remaining.findIndex(slot => slot.getTime() === time)
      if (index === -1) unmatched += 1
      else remaining.splice(index, 1)
    }
    // Unknown/old schedule times still fulfill slots by count, never by status.
    for (const scheduledTime of remaining.slice(unmatched)) {
      inserts.push({
        user_id: userId,
        user_medication_id: med.id,
        scheduled_time: scheduledTime.toISOString(),
        status: 'skipped',
        actual_time: null
      })
    }
  }
  return inserts
}

/** Monday-first localized labels with stable, Sunday-based reference dates. */
export function getWeekdayLabels(locale = 'en', style = 'long') {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' })
  // 2024-01-07 is Sunday. Explicit UTC references prevent timezone label drift.
  return [1, 2, 3, 4, 5, 6, 0].map(value => ({
    value,
    label: formatter.format(new Date(Date.UTC(2024, 0, 7 + value, 12)))
  }))
}

/** Join valid selected labels in the same Monday-first order as the picker. */
export function formatScheduledWeekdays(med, locale = 'en') {
  if (!med || !isWeeklyFrequency(med.frequency)
    || !validateScheduledWeekdays(med.frequency, med.scheduled_weekdays)) return ''
  return getWeekdayLabels(locale)
    .filter(({ value }) => med.scheduled_weekdays.includes(value))
    .map(({ label }) => label)
    .join(', ')
}
