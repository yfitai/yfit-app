import { getMissingMedicationLogs, getScheduledDoseCount } from './medicationSchedule.js'

export const medicationLocalDateKey = (date) => {
  const value = new Date(date)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function medicationDayBounds(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function loadMedicationDayLogs(client, medications, userId, date = new Date()) {
  const { start, end } = medicationDayBounds(date)
  const read = async () => {
    const { data, error } = await client.from('medication_logs')
      .select('*, user_medication:user_medications(*, medication:medications(name))')
      .eq('user_id', userId)
      .gte('scheduled_time', start.toISOString())
      .lt('scheduled_time', end.toISOString())
      .order('scheduled_time')
    if (error) throw error
    return data || []
  }
  const existing = await read()
  const missing = getMissingMedicationLogs(medications, existing, userId, date)
  if (!missing.length) return existing
  // Never delete/rebuild a user's dose records to make the count match.
  const { error } = await client.from('medication_logs').insert(missing)
  if (error) throw error
  return read()
}

export function getActionableMedicationLogs(medication, logs, date = new Date()) {
  const count = getScheduledDoseCount(medication, date)
  if (!count) return []
  const day = medicationLocalDateKey(date)
  return logs.filter(log => log.user_medication_id === medication.id && medicationLocalDateKey(log.scheduled_time) === day)
    .sort((a, b) => Number(b.status === 'taken') - Number(a.status === 'taken') || new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, count)
}

export function canToggleMedicationLog(log, medication, date = new Date()) {
  return Boolean(log && medication && log.user_medication_id === medication.id &&
    medicationLocalDateKey(log.scheduled_time) === medicationLocalDateKey(date) && getScheduledDoseCount(medication, date) > 0)
}

// Historical totals use the persisted dose records. The current selected weekdays
// must not be used to invent, erase or relabel a past medication schedule.
export function calculateMedicationAdherence(medications, logs, today = new Date()) {
  const todayKey = medicationLocalDateKey(today)
  const { end } = medicationDayBounds(today)
  const oldest = new Date(today)
  oldest.setHours(0, 0, 0, 0)
  oldest.setDate(oldest.getDate() - 30)
  const byDate = new Map()
  for (const log of logs) {
    const time = new Date(log.scheduled_time)
    if (Number.isNaN(time.getTime()) || time < oldest || time >= end) continue
    const key = medicationLocalDateKey(time)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(log)
  }
  if (!byDate.has(todayKey)) byDate.set(todayKey, [])

  const breakdown = [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([key, recordedLogs]) => {
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const expected = key === todayKey
      ? medications.flatMap(med => Array.from({ length: getScheduledDoseCount(med, today) }, () => ({
          user_medication_id: med.id,
          medication_name: med.custom_name || med.medication?.name || '',
          is_supplement: Boolean(med.is_supplement)
        })))
      : recordedLogs.map(log => ({
          user_medication_id: log.user_medication_id,
          medication_name: log.user_medication?.custom_name || log.user_medication?.medication?.name || '',
          is_supplement: Boolean(log.user_medication?.is_supplement)
        }))
    const includedLogs = key === todayKey
      ? medications.flatMap(med => getActionableMedicationLogs(med, recordedLogs, today))
      : recordedLogs
    const result = { date }
    for (const [prefix, isSupplement] of [['med', false], ['supp', true]]) {
      const expectedDoses = expected.filter(dose => dose.is_supplement === isSupplement)
      const typeLogs = includedLogs.filter(log => Boolean(log.user_medication?.is_supplement) === isSupplement)
      const takenById = new Map()
      for (const log of typeLogs.filter(value => value.status === 'taken')) {
        takenById.set(log.user_medication_id, (takenById.get(log.user_medication_id) || 0) + 1)
      }
      const missed = []
      let taken = 0
      for (const dose of expectedDoses) {
        const remaining = takenById.get(dose.user_medication_id) || 0
        if (remaining > 0) {
          taken += 1
          takenById.set(dose.user_medication_id, remaining - 1)
        } else {
          missed.push(dose)
        }
      }
      result[`${prefix}Logs`] = typeLogs
      result[`${prefix}Taken`] = taken
      result[`${prefix}Total`] = expectedDoses.length
      result[`${prefix}Missed`] = missed.length
      result[`${prefix}Rate`] = expectedDoses.length ? Math.round(taken / expectedDoses.length * 100) : 0
      result[isSupplement ? 'missedSupps' : 'missedMeds'] = missed
    }
    return result
  })
  const current = breakdown.find(day => medicationLocalDateKey(day.date) === todayKey)
  const average = (prefix) => {
    const days = breakdown.filter(day => day[`${prefix}Total`] > 0)
    return days.length ? Math.round(days.reduce((sum, day) => sum + day[`${prefix}Rate`], 0) / days.length) : 0
  }
  return {
    breakdown,
    stats: {
      todayMedTaken: current.medTaken, todayMedTotal: current.medTotal, todayMedRate: current.medRate,
      todaySuppTaken: current.suppTaken, todaySuppTotal: current.suppTotal, todaySuppRate: current.suppRate,
      overallMedRate: average('med'), overallSuppRate: average('supp'),
      daysTracked: breakdown.filter(day => day.medTotal || day.suppTotal).length
    }
  }
}
