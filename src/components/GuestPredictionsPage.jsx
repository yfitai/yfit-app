/**
 * GuestPredictionsPage.jsx
 * Interactive demo predictions page for guest/demo mode.
 * Shows weight prediction chart, strength milestones, and AI-generated insights.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { demoPredictions, demoProfile } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

function PredictionChart({ data }) {
  if (!data || data.length === 0) return null
  const weights = data.map(d => d.predicted_kg)
  const lowers = data.map(d => d.lower_bound)
  const uppers = data.map(d => d.upper_bound)
  const allVals = [...weights, ...lowers, ...uppers]
  const min = Math.min(...allVals) - 0.5
  const max = Math.max(...allVals) + 0.5
  const range = max - min
  const W = 300
  const H = 100

  const toX = (i) => (i / (data.length - 1)) * W
  const toY = (v) => H - ((v - min) / range) * H

  const mainPts = data.map((d, i) => `${toX(i)},${toY(d.predicted_kg)}`).join(' ')
  const upperPts = data.map((d, i) => `${toX(i)},${toY(d.upper_bound)}`).join(' ')
  const lowerPts = data.map((d, i) => `${toX(i)},${toY(d.lower_bound)}`).join(' ')
  const bandPath = `M ${upperPts.split(' ').join(' L ')} L ${lowerPts.split(' ').reverse().join(' L ')} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
      <path d={bandPath} fill="#10b981" fillOpacity="0.15" />
      <polyline points={mainPts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Goal line */}
      <line x1="0" y1={toY(demoProfile.target_weight_kg)} x2={W} y2={toY(demoProfile.target_weight_kg)} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" />
    </svg>
  )
}

export default function GuestPredictionsPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('weight')
  const { goalDate, weightPrediction, strengthMilestones, insights } = demoPredictions
  const { target_weight_kg, weight_kg } = demoProfile

  const weeksToGoal = weightPrediction.findIndex(w => w.predicted_kg <= target_weight_kg) + 1

  const handleUnlock = () => {
    setGuestTrigger('view_predictions', 'See your personalised predictions')
    onSignUp('view_predictions')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Predictions</h1>
          <p className="text-sm text-gray-500">Powered by your data</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">✨ Pro Feature</span>
      </div>

      {/* Goal achievement card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-base font-extrabold">Goal Weight: {target_weight_kg}kg</p>
            <p className="text-sm opacity-90 mt-0.5">Predicted achievement: <strong>{goalDate}</strong></p>
            <p className="text-xs opacity-75 mt-1">~{weeksToGoal} weeks at your current rate</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['weight', 'strength', 'insights'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'weight' ? 'Weight' : tab === 'strength' ? 'Strength' : 'Insights'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'weight' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">16-Week Weight Forecast</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Predicted</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 border-dashed inline-block" /> Goal</span>
              </div>
            </div>
            <PredictionChart data={weightPrediction} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Now ({weight_kg}kg)</span>
              <span>Week 16 ({target_weight_kg}kg)</span>
            </div>
          </div>

          {/* Weekly breakdown */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">Weekly Forecast</p>
            <div className="space-y-2">
              {weightPrediction.slice(0, 8).map((week, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">Week {week.week}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{week.lower_bound.toFixed(1)} – {week.upper_bound.toFixed(1)} kg</span>
                    <span className="text-sm font-bold text-gray-900">{week.predicted_kg.toFixed(1)} kg</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleUnlock} className="w-full mt-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 font-semibold hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all">
              See full 16-week forecast →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'strength' && (
        <div className="space-y-4">
          {strengthMilestones.map((m, i) => {
            const pct = Math.round((m.current / m.milestone) * 100)
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500']
            return (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">{m.exercise}</p>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    {Math.round(m.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Current: <strong className="text-gray-900">{m.current}kg</strong></span>
                  <span>Milestone: <strong className="text-gray-900">{m.milestone}kg</strong></span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{pct}% to milestone</span>
                  <span className="text-gray-600 font-semibold">~{m.eta_weeks} weeks</span>
                </div>
              </div>
            )
          })}

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-800">🏋️ Strength Milestone Predictions</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Based on your progressive overload history and recovery patterns. Predictions update automatically as you log workouts.
            </p>
            <button onClick={handleUnlock} className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
              Track my real lifts →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">
                {i === 0 ? '⚖️' : i === 1 ? '💪' : i === 2 ? '😴' : '💊'}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-800">🔒 5 more insights available</p>
            <p className="text-xs text-amber-700 mt-1">Sign up to unlock all AI insights including sleep impact analysis, nutrition compliance score, and injury risk assessment.</p>
            <button onClick={handleUnlock} className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all">
              Unlock all insights →
            </button>
          </div>
        </div>
      )}

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-indigo-900 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">See your personalised predictions</p>
        <p className="text-sm text-violet-200 mb-4">YFIT analyses your workouts, nutrition, sleep, and medications to predict your results with 80%+ accuracy.</p>
        <button
          onClick={handleUnlock}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
