/**
 * GuestMedicationsPage.jsx
 * Interactive demo medications page for guest/demo mode.
 * Shows medication list, interaction warnings, dose log, and provider report preview.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { MedicationsMockup } from './AppTourMockups'
import { demoMedications } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

const SEVERITY_STYLES = {
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️', badge: 'bg-amber-100 text-amber-700' },
  info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  icon: 'ℹ️', badge: 'bg-blue-100 text-blue-700' },
  danger:  { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   icon: '🚨', badge: 'bg-red-100 text-red-700' },
}

function MedCard({ med, onAdd }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Phone mockup — matches marketing site */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px', background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)' }}>
        <div style={{ maxWidth: '220px', width: '100%' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📱 App Preview</p>
          <MedicationsMockup />
        </div>
      </div>

      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xl">
            💊
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{med.name} <span className="text-gray-400 font-normal">{med.dosage}</span></p>
            <p className="text-xs text-gray-500">{med.frequency} · {med.purpose}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {med.interactions.some(i => i.severity === 'warning') && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ Alert</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fitness Interactions</p>
          {med.interactions.map((interaction, i) => {
            const style = SEVERITY_STYLES[interaction.severity] || SEVERITY_STYLES.info
            return (
              <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-3 flex gap-2`}>
                <span className="text-base flex-shrink-0">{style.icon}</span>
                <p className={`text-xs ${style.text} leading-relaxed`}>{interaction.text}</p>
              </div>
            )
          })}
          {med.calorie_adjustment !== 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
              <p className="text-xs font-bold text-purple-800">
                Calorie Adjustment: {med.calorie_adjustment > 0 ? '+' : ''}{med.calorie_adjustment} kcal/day
              </p>
              <p className="text-xs text-purple-700 mt-0.5">Your daily calorie target has been automatically adjusted for this medication.</p>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Next dose: <strong className="text-gray-700">{med.next_dose}</strong></span>
            <button onClick={onAdd} className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-all">
              Log dose
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GuestMedicationsPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('medications')
  const [checkInput, setCheckInput] = useState('')
  const { medications, todayLog, providerReportPreview } = demoMedications

  const handleAddMed = () => {
    setGuestTrigger('track_medication', 'Track your medications')
    onSignUp('track_medication')
  }

  const handleLogDose = () => {
    setGuestTrigger('track_medication', 'Log your medication dose')
    onSignUp('track_medication')
  }

  const handleReport = () => {
    setGuestTrigger('track_medication', 'Generate your provider report')
    onSignUp('track_medication')
  }

  const takenToday = todayLog.filter(l => l.status === 'taken').length
  const pendingToday = todayLog.filter(l => l.status === 'pending').length

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Medications</h1>
          <p className="text-sm text-gray-500">{medications.length} tracked · {takenToday} taken today</p>
        </div>
        <button
          onClick={handleAddMed}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold shadow hover:opacity-90 transition-all"
        >
          + Add Med
        </button>
      </div>

      {/* Today's dose status */}
      <div className="rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 text-white p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl py-2.5">
            <p className="text-2xl font-extrabold">{takenToday}</p>
            <p className="text-xs opacity-80">Taken today</p>
          </div>
          <div className="bg-white/10 rounded-xl py-2.5">
            <p className="text-2xl font-extrabold">{pendingToday}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
          <div className="bg-white/10 rounded-xl py-2.5">
            <p className="text-2xl font-extrabold">{medications.reduce((a, m) => a + m.interactions.length, 0)}</p>
            <p className="text-xs opacity-80">Interactions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['medications', 'log', 'checker', 'report'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'medications' ? 'My Meds' : tab === 'log' ? 'Dose Log' : tab === 'checker' ? 'Checker' : 'Report'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'medications' && (
        <div className="space-y-3">
          {medications.map(med => (
            <MedCard key={med.id} med={med} onAdd={handleLogDose} />
          ))}
          <button onClick={handleAddMed} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-pink-400 hover:text-pink-600 transition-all">
            + Add medication or supplement
          </button>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Dose Log</p>
          {todayLog.map((log, i) => {
            const med = medications.find(m => m.id === log.medication_id)
            return (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${log.status === 'taken' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{log.status === 'taken' ? '✅' : '⏰'}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{med?.name} — {log.dose}</p>
                    <p className="text-xs text-gray-500">{log.taken_at} · {log.status === 'taken' ? 'Taken' : 'Pending'}</p>
                  </div>
                </div>
                {log.status === 'pending' && (
                  <button onClick={handleLogDose} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all">
                    Mark taken
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'checker' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-gray-800 mb-2">Check a New Medication</p>
            <p className="text-xs text-gray-500 mb-3">Enter a medication name to check for interactions with your current prescriptions.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={checkInput}
                onChange={e => setCheckInput(e.target.value)}
                onFocus={handleAddMed}
                placeholder="e.g. Ibuprofen, Creatine..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <button onClick={handleAddMed} className="px-4 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-all">
                Check
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-800 mb-2">⚠️ Current Interaction: Metformin + High-Intensity Cardio</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              High-intensity exercise (HIIT, intense cardio over 45 min) can cause hypoglycaemia when combined with Metformin. YFIT has automatically adjusted your workout plan to keep cardio sessions at moderate intensity.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-800">ℹ️ Supplement Compatibility</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Your current supplements (Vitamin D3, Omega-3) are fully compatible with Metformin. Omega-3 may actually improve insulin sensitivity — a positive interaction for your goal.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Provider Health Report</p>
                <p className="text-xs text-gray-500">Last generated: {providerReportPreview.generated}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Ready to print</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Medications', val: providerReportPreview.medications_count },
                { label: 'Interactions', val: providerReportPreview.interactions_flagged },
                { label: 'Pages', val: 2 },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl py-2 text-center">
                  <p className="text-lg font-extrabold text-gray-900">{s.val}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 mb-4">
              <p className="text-xs text-gray-600 italic leading-relaxed">"{providerReportPreview.summary}"</p>
            </div>

            <button onClick={handleReport} className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm hover:opacity-90 transition-all">
              🖨️ Generate & Print Report
            </button>
          </div>

          <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-center">
            <p className="text-2xl mb-2">🏥</p>
            <p className="text-sm font-bold text-pink-800">Share with your doctor</p>
            <p className="text-xs text-pink-700 mt-1">Sign up to generate a full PDF report including medication history, interaction alerts, and fitness adjustments — formatted for healthcare providers.</p>
            <button onClick={handleReport} className="mt-3 px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-all">
              Create my report →
            </button>
          </div>
        </div>
      )}

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">The only fitness app that knows your medications</p>
        <p className="text-sm text-gray-300 mb-4">Track prescriptions, get interaction warnings, and share reports with your doctor.</p>
        <button
          onClick={handleAddMed}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
