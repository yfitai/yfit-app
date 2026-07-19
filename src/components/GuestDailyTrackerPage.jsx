/**
 * GuestDailyTrackerPage.jsx
 * Interactive demo daily tracker for guest/demo mode.
 * Shows water, sleep, steps, mood, energy, stress tracking with demo data.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { demoDailyTracker } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

function RingProgress({ value, max, color, size = 80, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  )
}

function EmojiRater({ label, value, emoji, onRate }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs font-bold text-gray-600 mb-2">{label}</p>
      <div className="flex gap-1.5 justify-between">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={onRate}
            className={`flex-1 py-1.5 rounded-lg text-sm transition-all ${
              n <= value ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white shadow' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GuestDailyTrackerPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('today')
  const { today, weekHistory, streaks } = demoDailyTracker

  const waterPct = Math.round((today.water_ml / today.water_target_ml) * 100)
  const stepsPct = Math.round((today.steps / today.steps_target) * 100)

  const handleTrack = () => {
    setGuestTrigger('track_daily', 'Track your daily wellness')
    onSignUp('track_daily')
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Tracker</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-amber-700">{streaks.overall} day streak</span>
        </div>
      </div>

      {/* Rings overview */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Water */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <RingProgress value={today.water_ml} max={today.water_target_ml} color="rgba(255,255,255,0.9)" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">💧</span>
              </div>
            </div>
            <p className="text-xs font-bold">{(today.water_ml / 1000).toFixed(1)}L</p>
            <p className="text-[10px] opacity-70">of {(today.water_target_ml / 1000).toFixed(1)}L</p>
          </div>

          {/* Steps */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <RingProgress value={today.steps} max={today.steps_target} color="rgba(255,255,255,0.9)" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">👟</span>
              </div>
            </div>
            <p className="text-xs font-bold">{today.steps.toLocaleString()}</p>
            <p className="text-[10px] opacity-70">of {today.steps_target.toLocaleString()}</p>
          </div>

          {/* Sleep */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <RingProgress value={today.sleep_hours} max={9} color="rgba(255,255,255,0.9)" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">😴</span>
              </div>
            </div>
            <p className="text-xs font-bold">{today.sleep_hours}h</p>
            <p className="text-[10px] opacity-70">of 8h goal</p>
          </div>
        </div>
      </div>

      {/* Streak badges */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Water', streak: streaks.water, emoji: '💧' },
          { label: 'Sleep', streak: streaks.sleep, emoji: '😴' },
          { label: 'Steps', streak: streaks.steps, emoji: '👟' },
          { label: 'Overall', streak: streaks.overall, emoji: '🔥' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
            <p className="text-base">{s.emoji}</p>
            <p className="text-sm font-extrabold text-gray-900">{s.streak}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['today', 'week', 'log'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'Log Entry'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'today' && (
        <div className="space-y-3">
          {/* Water tracker */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💧</span>
                <div>
                  <p className="text-sm font-bold text-blue-800">Water Intake</p>
                  <p className="text-xs text-blue-600">{(today.water_ml / 1000).toFixed(1)}L of {(today.water_target_ml / 1000).toFixed(1)}L</p>
                </div>
              </div>
              <span className="text-sm font-bold text-blue-700">{waterPct}%</span>
            </div>
            <div className="h-3 bg-blue-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${waterPct}%` }} />
            </div>
            <div className="flex gap-2">
              {[250, 500].map(ml => (
                <button key={ml} onClick={handleTrack} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">
                  + {ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👟</span>
                <div>
                  <p className="text-sm font-bold text-green-800">Steps</p>
                  <p className="text-xs text-green-600">{today.steps.toLocaleString()} of {today.steps_target.toLocaleString()}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-700">{stepsPct}%</span>
            </div>
            <div className="h-3 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stepsPct}%` }} />
            </div>
          </div>

          {/* Mood & Energy */}
          <EmojiRater label="Mood" value={today.mood} emoji="😊" onRate={handleTrack} />
          <EmojiRater label="Energy Level" value={today.energy} emoji="⚡" onRate={handleTrack} />
          <EmojiRater label="Stress Level" value={today.stress} emoji="😤" onRate={handleTrack} />

          {/* Sleep */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">😴</span>
                <div>
                  <p className="text-sm font-bold text-indigo-800">Last Night's Sleep</p>
                  <p className="text-xs text-indigo-600">{today.sleep_hours} hours · Quality: {today.sleep_quality}/5</p>
                </div>
              </div>
              <button onClick={handleTrack} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all">
                Log sleep
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'week' && (
        <div className="space-y-4">
          {/* Weekly table */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-500 font-semibold">Day</th>
                    <th className="text-center p-3 text-blue-500 font-semibold">💧</th>
                    <th className="text-center p-3 text-indigo-500 font-semibold">😴</th>
                    <th className="text-center p-3 text-green-500 font-semibold">👟</th>
                    <th className="text-center p-3 text-amber-500 font-semibold">😊</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {weekHistory.map((day, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-700">{DAYS[i]}</td>
                      <td className="p-3 text-center text-gray-600">{(day.water_ml / 1000).toFixed(1)}L</td>
                      <td className="p-3 text-center text-gray-600">{day.sleep_hours}h</td>
                      <td className="p-3 text-center text-gray-600">{(day.steps / 1000).toFixed(1)}k</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className={`w-2 h-2 rounded-full ${n <= day.mood ? 'bg-amber-400' : 'bg-gray-100'}`} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly averages */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Water', val: `${(weekHistory.reduce((a, d) => a + d.water_ml, 0) / weekHistory.length / 1000).toFixed(1)}L`, color: 'text-blue-600' },
              { label: 'Avg Sleep', val: `${(weekHistory.reduce((a, d) => a + d.sleep_hours, 0) / weekHistory.length).toFixed(1)}h`, color: 'text-indigo-600' },
              { label: 'Avg Steps', val: `${Math.round(weekHistory.reduce((a, d) => a + d.steps, 0) / weekHistory.length / 1000)}k`, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className={`text-lg font-extrabold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">Log Today's Metrics</p>
            {[
              { label: 'Water (ml)', placeholder: '2500', icon: '💧' },
              { label: 'Sleep (hours)', placeholder: '8.0', icon: '😴' },
              { label: 'Steps', placeholder: '10000', icon: '👟' },
              { label: 'Weight (kg)', placeholder: '84.0', icon: '⚖️' },
            ].map(field => (
              <div key={field.label} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{field.icon}</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium">{field.label}</label>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    onFocus={handleTrack}
                    className="w-full mt-0.5 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            ))}
            <button onClick={handleTrack} className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm hover:opacity-90 transition-all">
              Save Today's Log
            </button>
          </div>
        </div>
      )}

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-900 to-cyan-900 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">Build healthy daily habits</p>
        <p className="text-sm text-teal-200 mb-4">Track water, sleep, steps, mood, and more — YFIT shows you how your habits affect your results.</p>
        <button
          onClick={handleTrack}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
