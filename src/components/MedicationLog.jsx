import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Check, Clock, TrendingUp, Pill } from 'lucide-react'
import { getScheduledDoseCount, isWeeklyScheduleUnspecified, formatScheduledWeekdays } from '../lib/medicationSchedule'
import {
  loadMedicationDayLogs, medicationLocalDateKey, medicationDayBounds,
  getActionableMedicationLogs, canToggleMedicationLog, calculateMedicationAdherence
} from '../lib/medicationLogService'

const emptyStats = {
  todayMedTaken: 0, todayMedTotal: 0, todayMedRate: 0,
  todaySuppTaken: 0, todaySuppTotal: 0, todaySuppRate: 0,
  overallMedRate: 0, overallSuppRate: 0, daysTracked: 0
}

export default function MedicationLog({ user }) {
  const { t, i18n } = useTranslation()
  const [medications, setMedications] = useState([])
  const [supplements, setSupplements] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [stats, setStats] = useState(emptyStats)
  const [dailyBreakdown, setDailyBreakdown] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [dayKey, setDayKey] = useState(() => medicationLocalDateKey(new Date()))
  const [busyIds, setBusyIds] = useState(new Set())
  const togglingIds = useRef(new Set())
  const requestId = useRef(0)
  const locale = i18n.resolvedLanguage || i18n.language || 'en'

  useEffect(() => {
    const refreshDay = () => setDayKey(medicationLocalDateKey(new Date()))
    const timer = setInterval(refreshDay, 60000)
    document.addEventListener('visibilitychange', refreshDay)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshDay)
    }
  }, [])

  useEffect(() => {
    setHasLoaded(false)
    setMedications([])
    setSupplements([])
    setTodayLogs([])
    setStats(emptyStats)
    setDailyBreakdown([])
    loadData()
    return () => { requestId.current += 1 }
  }, [user.id, dayKey])

  const loadData = async () => {
    const run = ++requestId.current
    setLoading(true)
    setErrorMessage('')
    try {
      const { data, error } = await supabase.from('user_medications')
        .select('*, medication:medications(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      if (run !== requestId.current) return
      const items = data || []
      const date = new Date()
      const logs = await loadMedicationDayLogs(supabase, items, user.id, date)
      const { end } = medicationDayBounds(date)
      const oldest = new Date(date)
      oldest.setHours(0, 0, 0, 0)
      oldest.setDate(oldest.getDate() - 30)
      const { data: history, error: historyError } = await supabase.from('medication_logs')
        .select('*, user_medication:user_medications(medication_id, is_supplement, frequency, custom_name, medication:medications(name))')
        .eq('user_id', user.id)
        .gte('scheduled_time', oldest.toISOString())
        .lt('scheduled_time', end.toISOString())
      if (historyError) throw historyError
      if (run !== requestId.current) return
      const result = calculateMedicationAdherence(items, history || [], date)
      setMedications(items.filter(item => !item.is_supplement))
      setSupplements(items.filter(item => item.is_supplement))
      setTodayLogs(logs)
      setStats(result.stats)
      setDailyBreakdown(result.breakdown)
      setHasLoaded(true)
    } catch {
      if (run === requestId.current) setErrorMessage(t('medications.logLoadFailed'))
    } finally {
      if (run === requestId.current) setLoading(false)
    }
  }

  const handleToggleLog = async (log) => {
    const med = [...medications, ...supplements].find(item => item.id === log.user_medication_id)
    if (!canToggleMedicationLog(log, med, new Date()) || togglingIds.current.has(log.id)) return
    togglingIds.current.add(log.id)
    setBusyIds(new Set(togglingIds.current))
    setErrorMessage('')
    try {
      const newStatus = log.status === 'taken' ? 'skipped' : 'taken'
      const { error } = await supabase.from('medication_logs')
        .update({ status: newStatus, actual_time: newStatus === 'taken' ? new Date().toISOString() : null })
        .eq('id', log.id)
        .eq('user_id', user.id)
      if (error) throw error
      await loadData()
    } catch {
      setErrorMessage(t('medications.logSaveFailed'))
    } finally {
      togglingIds.current.delete(log.id)
      setBusyIds(new Set(togglingIds.current))
    }
  }

  const renderDoseGroup = (items, isSupplement) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {isSupplement ? <TrendingUp className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        {t(isSupplement ? 'medications.todaysSupplements' : 'medications.todaysMedications')}
      </h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{t(isSupplement ? 'medications.noSuppsToday' : 'medications.noMedsToday')}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const logs = getActionableMedicationLogs(item, todayLogs, new Date())
            const name = item.custom_name || item.medication?.name || ''
            const unspecified = isWeeklyScheduleUnspecified(item)
            const due = getScheduledDoseCount(item, new Date()) > 0
            return (
              <div key={item.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {logs.map(log => (
                  <button
                    key={log.id}
                    type="button"
                    role="checkbox"
                    aria-checked={log.status === 'taken'}
                    aria-label={`${name} — ${new Date(log.scheduled_time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`}
                    disabled={busyIds.has(log.id)}
                    onClick={() => handleToggleLog(log)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
                      log.status === 'taken'
                        ? isSupplement ? 'bg-green-600 border-green-600' : 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {log.status === 'taken' && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{name}</p>
                  {formatScheduledWeekdays(item, locale) && (
                    <p className="text-xs text-gray-600">{formatScheduledWeekdays(item, locale)}</p>
                  )}
                  {!due && (
                    <p className={`text-sm ${unspecified ? 'text-amber-700' : 'text-gray-500'}`}>
                      {t(unspecified ? 'medications.scheduleNeeded' : 'medications.noDoseToday')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  if (!hasLoaded && errorMessage) return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      {errorMessage}
      <button type="button" onClick={loadData} className="ml-3 underline">{t('common.retry', 'Retry')}</button>
    </div>
  )

  const actionableIds = new Set([...medications, ...supplements]
    .flatMap(item => getActionableMedicationLogs(item, todayLogs, new Date())).map(log => log.id))
  const otherRecordedDoses = todayLogs.filter(log => !actionableIds.has(log.id) && log.status === 'taken')
  const cards = [
    { title: 'medications.todaysMedications', rate: stats.todayMedRate, taken: stats.todayMedTaken, total: stats.todayMedTotal, color: 'blue', today: true },
    { title: 'medications.overallMedications', rate: stats.overallMedRate, color: 'blue' },
    { title: 'medications.todaysSupplements', rate: stats.todaySuppRate, taken: stats.todaySuppTaken, total: stats.todaySuppTotal, color: 'green', today: true },
    { title: 'medications.overallSupplements', rate: stats.overallSuppRate, color: 'green' }
  ]
  return (
    <div className="space-y-6">
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {errorMessage}
          <button type="button" onClick={loadData} className="ml-3 underline">{t('common.retry', 'Retry')}</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title} className={`border rounded-lg p-4 ${card.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">{t(card.title)}</h3>
              {card.today ? <Pill className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{card.today && card.total === 0 ? '—' : `${card.rate}%`}</span>
              <span className="text-sm">{t(card.today ? 'medications.adherence' : 'medications.average')}</span>
            </div>
            <p className="text-sm mt-1">{card.today
              ? `${card.taken} ${t('common.of')} ${card.total} ${t('medications.dosesTakenToday')}`
              : `${t('medications.across')} ${stats.daysTracked} ${t('medications.daysTracked')}`}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600">{t('medications.historyUsesRecordedDoses')}</p>
      {renderDoseGroup(medications, false)}
      {renderDoseGroup(supplements, true)}
      {otherRecordedDoses.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold">{t('medications.otherRecordedDoses')}</h3>
          <p className="mb-2 text-sm text-gray-600">{t('medications.otherRecordedDosesHelp')}</p>
          {otherRecordedDoses.map(log => (
            <p key={log.id} className="text-sm text-gray-700">
              {log.user_medication?.custom_name || log.user_medication?.medication?.name || ''} — {t('medications.taken')}
            </p>
          ))}
        </div>
      )}
      {dailyBreakdown.some(day => day.medTotal || day.suppTotal) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('medications.dailyBreakdown')}</h3>
          <div className="space-y-4">
            {dailyBreakdown.filter(day => day.medTotal || day.suppTotal).map(day => (
              <div key={medicationLocalDateKey(day.date)} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{day.date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                {[['med', false], ['supp', true]].map(([prefix, supplement]) => day[`${prefix}Total`] > 0 && (
                  <div key={prefix} className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t(supplement ? 'medications.supplementsVitamins' : 'medications.medications')}</span>
                      <span className="text-sm font-semibold">{day[`${prefix}Rate`]}% ({day[`${prefix}Taken`]}/{day[`${prefix}Total`]})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day[`${prefix}Logs`].filter(log => log.status === 'taken').map(log => (
                        <div key={log.id} className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          {log.user_medication?.custom_name || log.user_medication?.medication?.name || ''} — {t('medications.taken')}
                        </div>
                      ))}
                      {day[supplement ? 'missedSupps' : 'missedMeds'].map((missed, index) => (
                        <div key={`${missed.user_medication_id}-${index}`} className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                          {missed.medication_name} — {t('medications.missed')}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
