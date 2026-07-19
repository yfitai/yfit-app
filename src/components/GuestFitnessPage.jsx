/**
 * GuestFitnessPage.jsx
 * Interactive demo fitness page for guest/demo mode.
 * Shows PPL workout plan, recent workout log, strength progress charts.
 * No Supabase calls — all data from demoData.js.
 */

import { useState } from 'react'
import { demoFitness, demoProfile } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

const DAY_COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-gray-100 text-gray-500', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-gray-100 text-gray-500']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WorkoutCard({ workout, onLog }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
            🏋️
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{workout.name}</p>
            <p className="text-xs text-gray-500">{workout.date} · {workout.duration_min} min · {workout.calories_burned} kcal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{(workout.volume_kg / 1000).toFixed(1)}t vol</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {workout.exercises.map((ex, i) => (
            <div key={i}>
              <p className="text-xs font-bold text-gray-700 mb-1.5">{ex.name}</p>
              <div className="flex gap-2 flex-wrap">
                {ex.sets.map((set, j) => (
                  <div key={j} className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
                    <p className="text-xs font-bold text-gray-900">{set.weight}kg</p>
                    <p className="text-[10px] text-gray-500">{set.reps} reps</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={onLog}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all"
          >
            Log a similar workout →
          </button>
        </div>
      )}
    </div>
  )
}

function StrengthBar({ exercise, current, milestone, color }) {
  const pct = Math.round((current / milestone) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-semibold">{exercise}</span>
        <span>{current} kg <span className="text-gray-400">/ {milestone} kg goal</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% to milestone</p>
    </div>
  )
}

export default function GuestFitnessPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('plan')
  const { currentPlan, weeklySchedule, recentWorkouts, strengthProgress } = demoFitness

  const handleLogWorkout = () => {
    setGuestTrigger('save_workout', 'Save your workout')
    onSignUp('save_workout')
  }

  const handleStartWorkout = () => {
    setGuestTrigger('save_workout', 'Start a workout session')
    onSignUp('save_workout')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fitness</h1>
          <p className="text-sm text-gray-500">{currentPlan}</p>
        </div>
        <button
          onClick={handleStartWorkout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow hover:opacity-90 transition-all"
        >
          ▶ Start Workout
        </button>
      </div>

      {/* Weekly schedule strip */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">This Week</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">{day}</p>
              <div className={`rounded-lg py-1.5 px-0.5 text-[10px] font-bold ${DAY_COLORS[i]}`}>
                {weeklySchedule[i].replace(' A', '').replace(' B', '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Workouts this week', val: '3', icon: '🏋️' },
          { label: 'Total volume', val: '9.9t', icon: '📊' },
          { label: 'Avg duration', val: '55 min', icon: '⏱️' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-lg font-extrabold text-gray-900">{s.val}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['plan', 'history', 'strength'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'plan' ? 'My Plan' : tab === 'history' ? 'History' : 'Strength'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'plan' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-bold text-blue-800">AI-Generated Plan: {currentPlan}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your plan has been personalised for your goal (lose weight) and adjusted for your Metformin prescription — cardio sessions are kept at moderate intensity.
                </p>
              </div>
            </div>
          </div>

          {weeklySchedule.filter(d => d !== 'Rest').map((day, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${DAY_COLORS[i]}`}>
                  {DAYS[i]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{day}</p>
                  <p className="text-xs text-gray-500">4 exercises · ~55 min</p>
                </div>
              </div>
              <button onClick={handleStartWorkout} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">
                Start
              </button>
            </div>
          ))}

          <button onClick={handleLogWorkout} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all">
            + Create custom workout
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {recentWorkouts.map(workout => (
            <WorkoutCard key={workout.id} workout={workout} onLog={handleLogWorkout} />
          ))}
          <button onClick={handleLogWorkout} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all">
            + Log a past workout
          </button>
        </div>
      )}

      {activeTab === 'strength' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">Strength Milestones</h3>
            <StrengthBar exercise="Bench Press" current={strengthProgress.benchPress.at(-1)} milestone={100} color="bg-blue-500" />
            <StrengthBar exercise="Squat"       current={strengthProgress.squat.at(-1)}      milestone={140} color="bg-purple-500" />
            <StrengthBar exercise="Deadlift"    current={strengthProgress.deadlift.at(-1)}   milestone={160} color="bg-green-500" />
          </div>

          {/* Mini sparkline table */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">6-Week Progression</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left pb-2">Exercise</th>
                    {strengthProgress.dates.slice(-4).map((d, i) => (
                      <th key={i} className="text-right pb-2">{new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { name: 'Bench Press', data: strengthProgress.benchPress },
                    { name: 'Squat',       data: strengthProgress.squat },
                    { name: 'Deadlift',    data: strengthProgress.deadlift },
                  ].map(ex => (
                    <tr key={ex.name}>
                      <td className="py-2 font-semibold text-gray-700">{ex.name}</td>
                      {ex.data.slice(-4).map((v, i) => (
                        <td key={i} className="py-2 text-right text-gray-600">{v} kg</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-bold text-green-800">📈 Progressive Overload Tracker</p>
            <p className="text-xs text-green-700 mt-1">YFIT automatically suggests weight increases when you hit your rep targets — sign up to enable this for your real workouts.</p>
            <button onClick={handleLogWorkout} className="mt-3 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all">
              Start tracking my lifts →
            </button>
          </div>
        </div>
      )}

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">Build your personalised workout plan</p>
        <p className="text-sm text-blue-200 mb-4">AI generates a plan based on your goals, schedule, and medication interactions.</p>
        <button
          onClick={handleStartWorkout}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
