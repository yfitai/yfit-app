import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUnitPreference } from '../contexts/UnitPreferenceContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingDown, TrendingUp, Minus, Target, Activity, ChevronDown, ChevronUp } from 'lucide-react'

// Measurements that should DECREASE toward goal (fat loss areas)
const REDUCING_MEASUREMENTS = ['waist', 'hips']
// Measurements that should INCREASE toward goal (muscle gain areas)
const INCREASING_MEASUREMENTS = ['shoulders', 'chest', 'neck', 'biceps', 'forearms', 'thighs', 'calves']

const MEASUREMENT_LABELS = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  chest: 'Chest',
  waist: 'Waist',
  hips: 'Hips',
  biceps: 'Biceps',
  forearms: 'Forearms',
  thighs: 'Thighs',
  calves: 'Calves'
}

const MEASUREMENT_GROUPS = {
  'Fat Loss': ['waist', 'hips'],
  'Muscle Gain': ['neck', 'biceps', 'forearms', 'thighs', 'calves'],
  'Overall Build': ['shoulders', 'chest']
}

function convertCm(valueCm, unitSystem) {
  if (!valueCm) return null
  if (unitSystem === 'imperial') return parseFloat((valueCm / 2.54).toFixed(1))
  return parseFloat(valueCm.toFixed(1))
}

function unitLabel(unitSystem) {
  return unitSystem === 'imperial' ? 'in' : 'cm'
}

export default function BodyRecomp({ user }) {
  const { t } = useTranslation()
  const { unitSystem } = useUnitPreference()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [startMeasurements, setStartMeasurements] = useState({})
  const [goalMeasurements, setGoalMeasurements] = useState({})
  const [history, setHistory] = useState([]) // Array of { measured_at, measurement_type, measurement_value }
  const [expandedChart, setExpandedChart] = useState(null)
  const [timeRange, setTimeRange] = useState(90) // days

  // Re-fetch when user, timeRange, or the route location changes (catches navigation back to this page)
  useEffect(() => {
    if (user?.id) loadData(user.id)
  }, [user, timeRange, location.key])

  // Also re-fetch when the tab/app regains visibility (covers Android app switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        loadData(user.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, timeRange])

  const loadData = async (userId) => {
    setLoading(true)
    try {
      // Load starting + goal measurements from body_measurements (set in Goals page)
      const { data: bm } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Journey start date = when the current body_measurements record was created
      let journeyStartDate = null
      if (bm) {
        const start = {}
        const goal = {}
        Object.keys(MEASUREMENT_LABELS).forEach(key => {
          if (bm[`${key}_cm`]) start[key] = bm[`${key}_cm`]
          if (bm[`${key}_goal_cm`]) goal[key] = bm[`${key}_goal_cm`]
        })
        setStartMeasurements(start)
        setGoalMeasurements(goal)
        journeyStartDate = bm.created_at
      }

      // Load measurement history from progress_measurements (saved by DailyTracker)
      // Only include entries from the current journey (on or after journey start date)
      // This prevents pre-restart measurements from showing as the current "Now" value
      const timeRangeSince = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString()
      // Use the later of: journey start date OR time range window
      const since = journeyStartDate && journeyStartDate > timeRangeSince
        ? journeyStartDate
        : timeRangeSince
      const { data: hist, error: histError } = await supabase
        .from('progress_measurements')
        .select('measurement_type, measurement_value, unit, measured_at')
        .eq('user_id', userId)
        .gte('measured_at', since)
        .order('measured_at', { ascending: true })

      console.log('[BodyRecomp] History query - since:', since, 'rows:', hist?.length, 'error:', histError)
      console.log('[BodyRecomp] History data:', hist)
      console.log('[BodyRecomp] Start measurements:', Object.keys(bm || {}).filter(k => k.endsWith('_cm') && !k.includes('goal')).map(k => `${k}=${bm[k]}`).join(', '))
      setHistory(hist || [])
    } catch (err) {
      console.error('Error loading body recomp data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get latest tracked value for a measurement type
  const getLatest = (type) => {
    const entries = history.filter(h => h.measurement_type === type)
    if (!entries.length) return null
    const last = entries[entries.length - 1]
    // Convert to cm if stored in inches
    return last.unit === 'in' ? last.measurement_value * 2.54 : last.measurement_value
  }

  // Build chart data for a single measurement type
  const getChartData = (type) => {
    return history
      .filter(h => h.measurement_type === type)
      .map(h => {
        const valueCm = h.unit === 'in' ? h.measurement_value * 2.54 : h.measurement_value
        return {
          date: new Date(h.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: convertCm(valueCm, unitSystem)
        }
      })
  }

  // Calculate progress percentage toward goal (direction-aware)
  const getProgress = (type) => {
    const startCm = startMeasurements[type]
    const goalCm = goalMeasurements[type]
    const currentCm = getLatest(type) || startCm

    if (!startCm || !goalCm || !currentCm) return null

    const isReducing = REDUCING_MEASUREMENTS.includes(type)
    const totalChange = Math.abs(goalCm - startCm)
    if (totalChange === 0) return 0  // start equals goal — no meaningful progress yet

    const actualChange = isReducing
      ? startCm - currentCm   // positive = progress for reducing
      : currentCm - startCm   // positive = progress for increasing

    const pct = Math.round((actualChange / Math.abs(goalCm - startCm)) * 100)
    return Math.max(0, Math.min(100, pct))
  }

  const getChangeLabel = (type) => {
    const startCm = startMeasurements[type]
    const currentCm = getLatest(type)
    if (!startCm || !currentCm) return null

    const diff = convertCm(currentCm - startCm, unitSystem)
    const unit = unitLabel(unitSystem)
    const isReducing = REDUCING_MEASUREMENTS.includes(type)

    if (Math.abs(diff) < 0.1) return { text: t('bodyRecomp.noChange'), color: 'text-gray-500', icon: <Minus className="w-4 h-4" /> }
    if (isReducing && diff < 0) return { text: `${Math.abs(diff)}${unit} ${t('bodyRecomp.lost')}`, color: 'text-green-600', icon: <TrendingDown className="w-4 h-4" /> }
    if (isReducing && diff > 0) return { text: `+${diff}${unit} ${t('bodyRecomp.gained')}`, color: 'text-red-500', icon: <TrendingUp className="w-4 h-4" /> }
    if (!isReducing && diff > 0) return { text: `+${diff}${unit} ${t('bodyRecomp.gained')}`, color: 'text-green-600', icon: <TrendingUp className="w-4 h-4" /> }
    return { text: `${diff}${unit} ${t('bodyRecomp.lost')}`, color: 'text-red-500', icon: <TrendingDown className="w-4 h-4" /> }
  }

  // Overall recomp score: average of all measurements with goals
  const getOverallScore = () => {
    const types = Object.keys(MEASUREMENT_LABELS)
    const scores = types.map(t => getProgress(t)).filter(p => p !== null)
    if (!scores.length) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const overallScore = getOverallScore()
  const unit = unitLabel(unitSystem)
  const hasGoals = Object.keys(goalMeasurements).length > 0
  const hasHistory = history.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bodyRecomp.title', 'Body Recomp')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('bodyRecomp.subtitle', 'Track your body measurement progress toward goals')}</p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => loadData(user.id)}
          className="text-sm px-3 py-2 bg-teal-100 text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-200 transition-colors"
          title="Refresh measurements"
        >
          ↻ {t('common.refresh')}
        </button>
        <select
          value={timeRange}
          onChange={e => setTimeRange(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value={30}>{t('bodyRecomp.last30Days', 'Last 30 days')}</option>
          <option value={90}>{t('bodyRecomp.last90Days', 'Last 90 days')}</option>
          <option value={180}>{t('bodyRecomp.last6Months', 'Last 6 months')}</option>
          <option value={365}>{t('bodyRecomp.lastYear', 'Last year')}</option>
        </select>
        </div>
      </div>

      {/* Setup prompt if no goals set */}
      {!hasGoals && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-center">
          <Target className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="font-semibold text-amber-800 mb-1">{t('bodyRecomp.setGoalsPrompt', 'Set your body measurement goals')}</h3>
          <p className="text-sm text-amber-700 mb-3">
            {t('bodyRecomp.goToGoalsMessage')}
          </p>
          <a href="/goals" className="inline-block bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
            Go to Goals →
          </a>
        </div>
      )}

      {/* No history prompt */}
      {hasGoals && !hasHistory && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-center">
          <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-800 mb-1">{t('bodyRecomp.startLogging', 'Start logging measurements')}</h3>
          <p className="text-sm text-blue-700 mb-3">
            {t('bodyRecomp.useWeeklyMeasurementsMessage')}
          </p>
          <a href="/tracker" className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
            Go to Tracker →
          </a>
        </div>
      )}

      {/* Overall Score */}
      {overallScore !== null && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">{t('bodyRecomp.overallProgress', 'Overall Recomp Progress')}</p>
              <div className="text-5xl font-bold">{overallScore}%</div>
              <p className="text-green-100 text-sm mt-1">
                {overallScore >= 80 ? `🔥 ${t('bodyRecomp.outstandingProgress')}` :
                 overallScore >= 50 ? `💪 ${t('bodyRecomp.greatWork')}` :
                 overallScore >= 20 ? `📈 ${t('bodyRecomp.buildingMomentum')}` :
                 `🌱 ${t('bodyRecomp.justStarted')}`}
              </p>
            </div>
            <div className="w-24 h-24 relative">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="white" strokeWidth="3"
                  strokeDasharray={`${overallScore} ${100 - overallScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{overallScore}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Groups */}
      {Object.entries(MEASUREMENT_GROUPS).map(([groupName, types]) => {
        const groupTypes = types.filter(t => startMeasurements[t] || goalMeasurements[t] || getLatest(t))
        if (!groupTypes.length) return null

        return (
          <div key={groupName} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {groupName === 'Fat Loss' && <TrendingDown className="w-5 h-5 text-orange-500" />}
              {groupName === 'Muscle Gain' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {groupName === 'Overall Build' && <Activity className="w-5 h-5 text-blue-500" />}
              {t(`bodyRecomp.group_${groupName.replace(' ', '_').toLowerCase()}`, groupName)}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupTypes.map(type => {
                const startCm = startMeasurements[type]
                const goalCm = goalMeasurements[type]
                const currentCm = getLatest(type)
                const progress = getProgress(type)
                const change = getChangeLabel(type)
                const chartData = getChartData(type)
                const isReducing = REDUCING_MEASUREMENTS.includes(type)
                const isExpanded = expandedChart === type

                const startDisplay = convertCm(startCm, unitSystem)
                const goalDisplay = convertCm(goalCm, unitSystem)
                const currentDisplay = convertCm(currentCm || startCm, unitSystem)

                return (
                  <div key={type} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">{t(`bodyRecomp.${type}`)}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isReducing ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isReducing ? `↓ ${t('bodyRecomp.reduce')}` : `↑ ${t('bodyRecomp.build')}`}
                        </span>
                      </div>

                      {/* Current / Start / Goal */}
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div>
                          <p className="text-xs text-gray-500">{t('bodyRecomp.start', 'Start')}</p>
                          <p className="font-semibold text-gray-700 text-sm">{startDisplay ? `${startDisplay}${unit}` : '—'}</p>
                        </div>
                        <div className="border-x border-gray-100">
                          <p className="text-xs text-gray-500">{t('bodyRecomp.now', 'Now')}</p>
                          <p className={`font-bold text-base ${currentCm ? 'text-gray-900' : 'text-gray-400'}`}>
                            {currentDisplay ? `${currentDisplay}${unit}` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('bodyRecomp.goal', 'Goal')}</p>
                          <p className="font-semibold text-green-600 text-sm">{goalDisplay ? `${goalDisplay}${unit}` : '—'}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {progress !== null && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{t('bodyRecomp.progress', 'Progress')}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isReducing ? 'bg-orange-400' : 'bg-green-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Change label */}
                      {change && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${change.color}`}>
                          {change.icon}
                          <span>{change.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Chart */}
                    {chartData.length > 1 && (
                      <>
                        <button
                          onClick={() => setExpandedChart(isExpanded ? null : type)}
                          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? t('bodyRecomp.hideChart') : `${t('bodyRecomp.viewTrend')} (${chartData.length} ${t('common.entries')})`}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis
                                  tick={{ fontSize: 10 }}
                                  domain={['auto', 'auto']}
                                  tickFormatter={v => `${v}${unit}`}
                                />
                                <Tooltip
                                  formatter={(v) => [`${v}${unit}`, MEASUREMENT_LABELS[type]]}
                                />
                                {goalDisplay && (
                                  <ReferenceLine
                                    y={goalDisplay}
                                    stroke="#10b981"
                                    strokeDasharray="4 4"
                                    label={{ value: t('bodyRecomp.goal', 'Goal'), position: 'right', fontSize: 10, fill: '#10b981' }}
                                  />
                                )}
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={isReducing ? '#f97316' : '#22c55e'}
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    )}

                    {/* No history yet */}
                    {chartData.length === 0 && (startCm || goalCm) && (
                      <div className="px-4 pb-3 text-xs text-gray-400 text-center border-t border-gray-100 pt-2">
                        {t('bodyRecomp.logToSeeTrend')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {!hasGoals && !hasHistory && (
        <div className="text-center py-16 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('common.noData')}</p>
          <p className="text-sm mt-1">{t('bodyRecomp.emptyStateDesc', 'Set goals in the Goals page and log measurements in the Daily Tracker')}</p>
        </div>
      )}

      {/* Upgrade CTA — gentle nudge */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-500 to-teal-600 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">{t('bodyRecomp.aiCta', 'Get AI-Powered Recomp Recommendations')}</p>
          <p className="text-white/80 text-sm mt-0.5">{t('bodyRecomp.aiCtaDesc', 'Pro unlocks personalised cutting, bulking, and maintenance plans based on your actual data.')}</p>
        </div>
        <a
          href="/subscription"
          className="flex-shrink-0 bg-white text-green-700 font-bold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm whitespace-nowrap"
        >
          {t('common.viewPlans')} →
        </a>
      </div>
    </div>
  )
}
