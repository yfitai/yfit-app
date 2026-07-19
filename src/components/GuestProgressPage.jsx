/**
 * GuestProgressPage.jsx
 * Interactive demo progress page for guest/demo mode.
 * Shows weight history chart, body measurements, and progress photos placeholder.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { ProgressMockup } from './AppTourMockups'
import { demoProgress, demoProfile } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

function MiniLineChart({ data, color = '#10b981', height = 60 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data) - 0.5
  const max = Math.max(...data) + 0.5
  const range = max - min
  const w = 280
  const h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`}
        fill="url(#chartGrad)"
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Start and end dots */}
      <circle cx={pts[0].split(',')[0]} cy={pts[0].split(',')[1]} r="4" fill={color} />
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="4" fill={color} />
    </svg>
  )
}

export default function GuestProgressPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('weight')
  const { weightHistory, measurements, totalLost, weeklyAvgLoss, progressPhotos } = demoProgress
  const { target_weight_kg } = demoProfile

  const weights = weightHistory.map(w => w.weight_kg)
  const startWeight = weights[0]
  const currentWeight = weights[weights.length - 1]
  const toGoal = (currentWeight - target_weight_kg).toFixed(1)
  const weeksToGoal = Math.ceil(toGoal / weeklyAvgLoss)

  const handleLog = () => {
    setGuestTrigger('log_progress', 'Log your progress')
    onSignUp('log_progress')
  }

  const handlePhoto = () => {
    setGuestTrigger('log_progress', 'Add a progress photo')
    onSignUp('log_progress')
  }

  const latestMeasurements = measurements[measurements.length - 1]
  const firstMeasurements = measurements[0]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Phone mockup — matches marketing site */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px', background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)' }}>
        <div style={{ maxWidth: '220px', width: '100%' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📱 App Preview</p>
          <ProgressMockup />
        </div>
      </div>


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Progress</h1>
          <p className="text-sm text-gray-500">12-week journey</p>
        </div>
        <button
          onClick={handleLog}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-bold shadow hover:opacity-90 transition-all"
        >
          + Log Weight
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Lost', val: `-${totalLost}kg`, color: 'text-emerald-600' },
          { label: 'Current', val: `${currentWeight}kg`, color: 'text-gray-900' },
          { label: 'Goal', val: `${target_weight_kg}kg`, color: 'text-blue-600' },
          { label: 'To go', val: `-${toGoal}kg`, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
            <p className={`text-sm font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['weight', 'measurements', 'photos'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'weight' ? 'Weight' : tab === 'measurements' ? 'Body' : 'Photos'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'weight' && (
        <div className="space-y-4">
          {/* Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">Weight History (12 weeks)</p>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">-{totalLost}kg total</span>
            </div>
            <MiniLineChart data={weights} color="#10b981" height={80} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{weightHistory[0].date}</span>
              <span>{weightHistory[weightHistory.length - 1].date}</span>
            </div>
          </div>

          {/* Prediction */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm font-bold text-blue-800">Goal Prediction</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  At your current rate of <strong>{weeklyAvgLoss}kg/week</strong>, you will reach your goal weight of <strong>{target_weight_kg}kg</strong> in approximately <strong>{weeksToGoal} weeks</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Recent entries */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">Recent Entries</p>
            <div className="space-y-2">
              {weightHistory.slice(-5).reverse().map((entry, i) => {
                const prev = weightHistory[weightHistory.length - 5 + (4 - i) - 1]
                const diff = prev ? (entry.weight_kg - prev.weight_kg).toFixed(1) : null
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{entry.date}</span>
                    <div className="flex items-center gap-2">
                      {diff !== null && (
                        <span className={`text-xs font-bold ${parseFloat(diff) < 0 ? 'text-emerald-600' : parseFloat(diff) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {parseFloat(diff) > 0 ? '+' : ''}{diff}kg
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-900">{entry.weight_kg}kg</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={handleLog} className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all">
              + Log today's weight
            </button>
          </div>
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="space-y-4">
          {/* Comparison table */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-semibold text-xs">Measurement</th>
                  <th className="text-center p-3 text-gray-500 font-semibold text-xs">Week 1</th>
                  <th className="text-center p-3 text-gray-500 font-semibold text-xs">Now</th>
                  <th className="text-center p-3 text-gray-500 font-semibold text-xs">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: 'Chest', key: 'chest_cm', unit: 'cm' },
                  { label: 'Waist', key: 'waist_cm', unit: 'cm' },
                  { label: 'Hips',  key: 'hips_cm',  unit: 'cm' },
                  { label: 'Arms',  key: 'arms_cm',  unit: 'cm' },
                  { label: 'Thighs', key: 'thighs_cm', unit: 'cm' },
                ].map(row => {
                  const start = firstMeasurements[row.key]
                  const current = latestMeasurements[row.key]
                  const diff = current - start
                  return (
                    <tr key={row.label} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-700">{row.label}</td>
                      <td className="p-3 text-center text-gray-500">{start}{row.unit}</td>
                      <td className="p-3 text-center font-bold text-gray-900">{current}{row.unit}</td>
                      <td className={`p-3 text-center text-xs font-bold ${diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}{row.unit}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button onClick={handleLog} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-emerald-400 hover:text-emerald-600 transition-all">
            + Log new measurements
          </button>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {progressPhotos.map((photo, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                  <span className="text-3xl mb-1">📸</span>
                  <p className="text-[10px] text-gray-400 text-center px-1">{photo.label}</p>
                </div>
                <div className="p-1.5 bg-white">
                  <p className="text-[10px] text-gray-500 text-center">{photo.date}</p>
                </div>
              </div>
            ))}
            <button
              onClick={handlePhoto}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            >
              <span className="text-2xl">📷</span>
              <p className="text-[10px] text-gray-500">Add photo</p>
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-bold text-emerald-800">📸 Progress Photos</p>
            <p className="text-xs text-emerald-700 mt-1">Sign up to upload and compare progress photos side-by-side. YFIT stores them securely and never shares them.</p>
            <button onClick={handlePhoto} className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all">
              Start my photo journey →
            </button>
          </div>
        </div>
      )}

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-green-900 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">See your real transformation</p>
        <p className="text-sm text-emerald-200 mb-4">Track weight, measurements, and photos — YFIT shows you exactly how far you've come.</p>
        <button
          onClick={handleLog}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
