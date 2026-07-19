/**
 * GuestFormAnalysisPage.jsx
 * Interactive demo form analysis page for guest/demo mode.
 * Shows recent form analysis results and lets visitors explore the feature.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { FitnessMockup } from './AppTourMockups'
import { demoFormAnalysis } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

const FEEDBACK_STYLES = {
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️' },
  success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  icon: '✅' },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   icon: 'ℹ️' },
}

function ScoreRing({ score, size = 80 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Phone mockup — matches marketing site */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px', background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)' }}>
        <div style={{ maxWidth: '220px', width: '100%' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📱 App Preview</p>
          <FitnessMockup />
        </div>
      </div>

      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-gray-900" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400">/ 100</span>
      </div>
    </div>
  )
}

function AnalysisCard({ analysis, onAnalyse }) {
  const [expanded, setExpanded] = useState(false)
  const improvement = analysis.improvement_from_last
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <ScoreRing score={analysis.score} size={64} />
          <div>
            <p className="text-sm font-bold text-gray-900">{analysis.exercise}</p>
            <p className="text-xs text-gray-500">{analysis.date} · {analysis.reps_analysed} reps</p>
            {improvement !== 0 && (
              <span className={`text-xs font-bold ${improvement > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {improvement > 0 ? '↑' : '↓'} {Math.abs(improvement)} pts from last session
              </span>
            )}
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Feedback</p>
          {analysis.feedback.map((fb, i) => {
            const style = FEEDBACK_STYLES[fb.type] || FEEDBACK_STYLES.info
            return (
              <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-3 flex gap-2`}>
                <span className="text-sm flex-shrink-0">{style.icon}</span>
                <p className={`text-xs ${style.text} leading-relaxed`}>{fb.text}</p>
              </div>
            )
          })}
          <button
            onClick={onAnalyse}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold hover:opacity-90 transition-all"
          >
            Analyse my {analysis.exercise} →
          </button>
        </div>
      )}
    </div>
  )
}

export default function GuestFormAnalysisPage({ onSignUp }) {
  const [selectedExercise, setSelectedExercise] = useState('')
  const { recentAnalyses, availableExercises } = demoFormAnalysis

  const handleAnalyse = () => {
    setGuestTrigger('form_analysis', 'Analyse your exercise form')
    onSignUp('form_analysis')
  }

  const handleUpload = () => {
    setGuestTrigger('form_analysis', 'Upload a video for form analysis')
    onSignUp('form_analysis')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Form Analysis</h1>
          <p className="text-sm text-gray-500">AI-powered movement coaching</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">✨ Pro Feature</span>
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white p-5">
        <p className="text-sm font-bold mb-3">How it works</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { step: '1', icon: '📹', label: 'Record a set' },
            { step: '2', icon: '🤖', label: 'AI analyses form' },
            { step: '3', icon: '📊', label: 'Get feedback' },
          ].map(s => (
            <div key={s.step} className="bg-white/10 rounded-xl py-3">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xs font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analyse a new exercise */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">Analyse a New Exercise</p>
        <div className="flex gap-2 mb-3">
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            onFocus={handleAnalyse}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
          >
            <option value="">Select exercise...</option>
            {availableExercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {/* Upload area */}
        <button
          onClick={handleUpload}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 flex flex-col items-center gap-2 hover:bg-orange-100 hover:border-orange-400 transition-all"
        >
          <span className="text-3xl">📹</span>
          <p className="text-sm font-bold text-orange-700">Upload or record a video</p>
          <p className="text-xs text-orange-600">MP4, MOV · Max 60 seconds · Any angle</p>
        </button>
      </div>

      {/* Recent analyses */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Recent Analyses</p>
        <div className="space-y-3">
          {recentAnalyses.map(analysis => (
            <AnalysisCard key={analysis.id} analysis={analysis} onAnalyse={handleAnalyse} />
          ))}
        </div>
      </div>

      {/* Supported exercises */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold text-gray-700 mb-3">Supported Exercises ({availableExercises.length})</p>
        <div className="flex flex-wrap gap-2">
          {availableExercises.map(ex => (
            <button
              key={ex}
              onClick={handleAnalyse}
              className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">More exercises added regularly. Request an exercise via AI Coach.</p>
      </div>

      {/* Score legend */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold text-gray-700 mb-3">Score Guide</p>
        <div className="space-y-2">
          {[
            { range: '90–100', label: 'Elite form', color: 'bg-emerald-500', desc: 'Competition-ready technique' },
            { range: '75–89', label: 'Good form', color: 'bg-blue-500', desc: 'Minor improvements available' },
            { range: '60–74', label: 'Fair form', color: 'bg-amber-500', desc: 'Focus on key corrections' },
            { range: '0–59',  label: 'Needs work', color: 'bg-red-500', desc: 'Risk of injury — review technique' },
          ].map(s => (
            <div key={s.range} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.color}`} />
              <span className="text-xs font-bold text-gray-700 w-14">{s.range}</span>
              <span className="text-xs font-semibold text-gray-600">{s.label}</span>
              <span className="text-xs text-gray-400 ml-auto">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-900 to-red-900 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">Fix your form. Prevent injuries.</p>
        <p className="text-sm text-orange-200 mb-4">Upload any workout video and get instant AI feedback on your technique — like having a personal trainer in your pocket.</p>
        <button
          onClick={handleUpload}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
