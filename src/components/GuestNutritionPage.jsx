/**
 * GuestNutritionPage.jsx
 * Interactive demo nutrition page for guest/demo mode.
 * Shows real UI with pre-populated demo data — no Supabase calls.
 * Contextual sign-up prompts fire when guests try to log food.
 */

import { useState } from 'react'
import { demoNutrition, demoProfile } from '../data/demoData'
import { setGuestTrigger } from '../lib/guestSession'

const MEAL_COLORS = {
  breakfast: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', emoji: '🌅' },
  lunch:     { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  emoji: '☀️' },
  snack:     { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', emoji: '🍎' },
  dinner:    { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   emoji: '🌙' },
}

function MacroBar({ label, current, target, color }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span>{current}g / {target}g</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function MealCard({ meal, onLogFood }) {
  const style = MEAL_COLORS[meal.meal_type] || MEAL_COLORS.snack
  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{style.emoji}</span>
          <div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge} capitalize`}>
              {meal.meal_type}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">{meal.time}</p>
          </div>
        </div>
        <span className="text-sm font-bold text-gray-700">{meal.calories} kcal</span>
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-2">{meal.name}</p>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Protein', val: meal.protein, unit: 'g', color: 'text-blue-600' },
          { label: 'Carbs',   val: meal.carbs,   unit: 'g', color: 'text-amber-600' },
          { label: 'Fat',     val: meal.fat,     unit: 'g', color: 'text-rose-500' },
        ].map(m => (
          <div key={m.label} className="bg-white/70 rounded-xl py-1.5">
            <p className={`text-sm font-bold ${m.color}`}>{m.val}{m.unit}</p>
            <p className="text-[10px] text-gray-400">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GuestNutritionPage({ onSignUp }) {
  const [activeTab, setActiveTab] = useState('daily')
  const [searchQuery, setSearchQuery] = useState('')
  const { todayMeals, recentFoods } = demoNutrition
  const { target_calories, target_protein_g, target_carbs_g, target_fat_g } = demoProfile

  const todayTotals = todayMeals.reduce(
    (acc, m) => ({ cal: acc.cal + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const calPct = Math.min(100, Math.round((todayTotals.cal / target_calories) * 100))
  const calRemaining = target_calories - todayTotals.cal

  const handleLogFood = () => {
    setGuestTrigger('log_meal', 'Log your real meals')
    onSignUp('log_meal')
  }

  const handleBarcode = () => {
    setGuestTrigger('log_meal', 'Scan food with your camera')
    onSignUp('log_meal')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nutrition</h1>
          <p className="text-sm text-gray-500">Today's food diary</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBarcode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-all"
          >
            📷 Scan
          </button>
          <button
            onClick={handleLogFood}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-bold shadow hover:opacity-90 transition-all"
          >
            + Log Food
          </button>
        </div>
      </div>

      {/* Calorie ring + summary */}
      <div className="rounded-2xl bg-gradient-to-br from-green-600 to-teal-600 text-white p-5">
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - calPct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold leading-none">{calPct}%</span>
              <span className="text-[9px] opacity-80">of goal</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-2xl font-extrabold">{todayTotals.cal.toLocaleString()} <span className="text-sm font-normal opacity-80">kcal</span></p>
            <p className="text-sm opacity-80 mb-3">
              {calRemaining > 0 ? `${calRemaining} kcal remaining` : 'Goal reached!'}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Protein', val: todayTotals.protein, color: 'text-blue-200' },
                { label: 'Carbs',   val: todayTotals.carbs,   color: 'text-amber-200' },
                { label: 'Fat',     val: todayTotals.fat,     color: 'text-rose-200' },
              ].map(m => (
                <div key={m.label} className="bg-white/10 rounded-xl py-1.5">
                  <p className={`text-sm font-bold ${m.color}`}>{m.val}g</p>
                  <p className="text-[10px] opacity-70">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Macro progress bars */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700 mb-1">Daily Macro Targets</h3>
        <MacroBar label="Protein" current={todayTotals.protein} target={target_protein_g} color="bg-blue-500" />
        <MacroBar label="Carbs"   current={todayTotals.carbs}   target={target_carbs_g}   color="bg-amber-400" />
        <MacroBar label="Fat"     current={todayTotals.fat}     target={target_fat_g}     color="bg-rose-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {['daily', 'search', 'recent'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'daily' ? "Today's Meals" : tab === 'search' ? 'Food Search' : 'Recent Foods'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {todayMeals.map(meal => (
            <MealCard key={meal.id} meal={meal} onLogFood={handleLogFood} />
          ))}
          <button
            onClick={handleLogFood}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-teal-400 hover:text-teal-600 transition-all"
          >
            + Add another meal
          </button>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={handleLogFood}
              placeholder="Search 2M+ foods or scan barcode..."
              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-2xl mb-2">📷</p>
            <p className="text-sm font-bold text-amber-800">AI Food Recognition</p>
            <p className="text-xs text-amber-700 mt-1">Point your camera at any meal — YFIT identifies ingredients and calculates macros instantly.</p>
            <button onClick={handleBarcode} className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all">
              Try Food Scanner →
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">Sign up to search our database of 2 million+ foods</p>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-2">
          {recentFoods.map((food, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-all">
              <div>
                <p className="text-sm font-semibold text-gray-900">{food.name}</p>
                <p className="text-xs text-gray-500">{food.protein}g protein · {food.carbs}g carbs · {food.fat}g fat</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{food.calories} kcal</span>
                <button
                  onClick={handleLogFood}
                  className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-lg font-bold flex items-center justify-center hover:bg-teal-200 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleLogFood} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-teal-400 hover:text-teal-600 transition-all">
            + Add custom food
          </button>
        </div>
      )}

      {/* TDEE info card */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-bold text-teal-800">Your TDEE: {demoProfile.tdee.toLocaleString()} kcal/day</p>
            <p className="text-xs text-teal-700 mt-0.5">
              Your daily calorie target is {demoProfile.target_calories} kcal — a 500 kcal deficit to reach your goal weight of {demoProfile.target_weight_kg} kg.
            </p>
          </div>
        </div>
      </div>

      {/* Sign-up CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 text-center">
        <p className="text-base font-bold mb-1">Start tracking your real nutrition</p>
        <p className="text-sm text-gray-300 mb-4">Log meals, scan barcodes, and hit your macro targets every day.</p>
        <button
          onClick={handleLogFood}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          🎁 Start Free — 1 Month Premium Included
        </button>
      </div>
    </div>
  )
}
