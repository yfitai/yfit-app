import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  calculateMacrosFromLBM,
  calculateMacrosFromPercentages,
  getRecommendedFatPercentage
} from '../lib/macroCalculations'

/**
 * MacroSettings
 *
 * Sliders work in grams with step=1.
 * When one macro slider is moved, the remaining calorie budget is
 * redistributed proportionally across the other two macros so the
 * total always stays equal to the user's calorie goal (adjustedCalories).
 */
export default function MacroSettings({ user, leanBodyMassLbs, adjustedCalories, goalType, onMacrosUpdated }) {
  const [useCustomMacros, setUseCustomMacros] = useState(false)
  const [proteinGrams, setProteinGrams] = useState(150)
  const [carbGrams, setCarbGrams]       = useState(200)
  const [fatGrams, setFatGrams]         = useState(60)
  const [macros, setMacros]             = useState(null)

  // Prevent DB reload from overwriting user's in-progress edits
  const userIsEditingRef     = useRef(false)
  const lastAdjustedCalories = useRef(null)

  // ─── helpers ────────────────────────────────────────────────────────────────

  const totalKcal = (p, c, f) => p * 4 + c * 4 + f * 9

  const buildMacros = (p, c, f) => {
    const total = Math.max(totalKcal(p, c, f), 1)
    return {
      protein: { grams: p, percentage: Math.round((p * 4 / total) * 100), calories: p * 4 },
      carbs:   { grams: c, percentage: Math.round((c * 4 / total) * 100), calories: c * 4 },
      fat:     { grams: f, percentage: Math.round((f * 9 / total) * 100), calories: f * 9 },
      totalCalories: total
    }
  }

  const applyMacros = (p, c, f) => {
    const m = buildMacros(p, c, f)
    setProteinGrams(p)
    setCarbGrams(c)
    setFatGrams(f)
    setMacros(m)
    if (onMacrosUpdated) onMacrosUpdated(m)
    return m
  }

  const gramsToPercents = (p, c, f) => {
    const total = Math.max(totalKcal(p, c, f), 1)
    return {
      p: Math.round((p * 4 / total) * 100),
      c: Math.round((c * 4 / total) * 100),
      f: Math.round((f * 9 / total) * 100)
    }
  }

  /**
   * Given a changed macro (type, newGrams), redistribute the remaining
   * calorie budget proportionally across the other two macros so the
   * total stays at adjustedCalories.
   */
  const redistributeToGoal = (changedType, newGrams, curProtein, curCarbs, curFat) => {
    const goal = Math.round(adjustedCalories)
    const calPerG = changedType === 'fat' ? 9 : 4
    const usedKcal = newGrams * calPerG
    const remaining = Math.max(goal - usedKcal, 0)

    let newP = curProtein
    let newC = curCarbs
    let newF = curFat

    if (changedType === 'protein') {
      newP = newGrams
      const oldCKcal = curCarbs * 4
      const oldFKcal = curFat   * 9
      const oldOther = Math.max(oldCKcal + oldFKcal, 1)
      const cKcal = Math.round((oldCKcal / oldOther) * remaining)
      const fKcal = remaining - cKcal
      newC = Math.max(Math.round(cKcal / 4), 20)
      newF = Math.max(Math.round(fKcal / 9), 20)
    } else if (changedType === 'carbs') {
      newC = newGrams
      const oldPKcal = curProtein * 4
      const oldFKcal = curFat     * 9
      const oldOther = Math.max(oldPKcal + oldFKcal, 1)
      const pKcal = Math.round((oldPKcal / oldOther) * remaining)
      const fKcal = remaining - pKcal
      newP = Math.max(Math.round(pKcal / 4), 50)
      newF = Math.max(Math.round(fKcal / 9), 20)
    } else {
      // fat changed
      newF = newGrams
      const oldPKcal = curProtein * 4
      const oldCKcal = curCarbs   * 4
      const oldOther = Math.max(oldPKcal + oldCKcal, 1)
      const pKcal = Math.round((oldPKcal / oldOther) * remaining)
      const cKcal = remaining - pKcal
      newP = Math.max(Math.round(pKcal / 4), 50)
      newC = Math.max(Math.round(cKcal / 4), 20)
    }

    return { p: newP, c: newC, f: newF }
  }

  // ─── load from DB ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (adjustedCalories !== lastAdjustedCalories.current) {
      lastAdjustedCalories.current = adjustedCalories
      if (!userIsEditingRef.current) {
        loadMacroSettings()
      }
    }
  }, [user, leanBodyMassLbs, adjustedCalories])

  const loadMacroSettings = async () => {
    if (!user || !adjustedCalories) return

    const { data } = await supabase
      .from('user_preferences')
      .select('use_custom_macros, protein_percent, carb_percent, fat_percent')
      .eq('user_id', user.id)
      .single()

    if (data && data.use_custom_macros) {
      setUseCustomMacros(true)
      const pGrams = Math.round((adjustedCalories * data.protein_percent / 100) / 4)
      const cGrams = Math.round((adjustedCalories * data.carb_percent    / 100) / 4)
      const fGrams = Math.round((adjustedCalories * data.fat_percent     / 100) / 9)
      applyMacros(pGrams, cGrams, fGrams)
    } else {
      setUseCustomMacros(false)
      applyLBMMacros()
    }
  }

  const applyLBMMacros = () => {
    let m
    if (leanBodyMassLbs) {
      const fatPct = getRecommendedFatPercentage(goalType)
      m = calculateMacrosFromLBM(leanBodyMassLbs, adjustedCalories, fatPct)
    } else {
      m = calculateMacrosFromPercentages(adjustedCalories, 30, 40, 30)
    }
    applyMacros(m.protein.grams, m.carbs.grams, m.fat.grams)
  }

  // ─── event handlers ─────────────────────────────────────────────────────────

  const handleToggleCustomMacros = async (enabled) => {
    setUseCustomMacros(enabled)
    userIsEditingRef.current = enabled

    if (!enabled) {
      applyLBMMacros()
      await saveMacroSettings(false, 30, 40, 30)
    } else {
      applyMacros(proteinGrams, carbGrams, fatGrams)
      const { p, c, f } = gramsToPercents(proteinGrams, carbGrams, fatGrams)
      await saveMacroSettings(true, p, c, f)
    }
  }

  const handleGramChange = async (type, rawValue) => {
    userIsEditingRef.current = true
    const newGrams = Math.max(0, parseInt(rawValue) || 0)

    // Redistribute remaining calories to the other two macros
    const { p, c, f } = redistributeToGoal(type, newGrams, proteinGrams, carbGrams, fatGrams)
    applyMacros(p, c, f)

    const percents = gramsToPercents(p, c, f)
    await saveMacroSettings(true, percents.p, percents.c, percents.f)
  }

  // ─── persistence ────────────────────────────────────────────────────────────

  const saveMacroSettings = async (useCustom, p, c, f) => {
    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, use_custom_macros: useCustom, protein_percent: p, carb_percent: c, fat_percent: f },
        { onConflict: 'user_id' }
      )
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  if (!macros) {
    return <div className="text-center py-4">Calculating macros...</div>
  }

  const goal    = Math.round(adjustedCalories || 0)
  const current = totalKcal(proteinGrams, carbGrams, fatGrams)
  const maxGrams = goal ? Math.round(goal / 4) : 400

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Macro Targets</h3>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-800">Custom Macro Targets</p>
          <p className="text-sm text-gray-600">
            {useCustomMacros
              ? 'Moving one slider auto-adjusts the others to stay at your calorie goal'
              : 'Using LBM-based calculation (1g protein per lb lean mass)'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useCustomMacros}
            onChange={(e) => handleToggleCustomMacros(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-600">{macros.protein.grams}g</p>
          <p className="text-sm text-gray-600">Protein</p>
          <p className="text-xs text-gray-500">{macros.protein.percentage}%</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-xl font-bold text-orange-600">{macros.carbs.grams}g</p>
          <p className="text-sm text-gray-600">Carbs</p>
          <p className="text-xs text-gray-500">{macros.carbs.percentage}%</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-xl font-bold text-purple-600">{macros.fat.grams}g</p>
          <p className="text-sm text-gray-600">Fat</p>
          <p className="text-xs text-gray-500">{macros.fat.percentage}%</p>
        </div>
      </div>

      {/* Sliders (custom mode only) */}
      {useCustomMacros && (
        <div className="space-y-5 mb-4">

          {/* Protein */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Protein</label>
              <span className="text-sm text-blue-600 font-medium">
                {proteinGrams}g &nbsp;
                <span className="text-gray-400">({macros.protein.percentage}%)</span>
              </span>
            </div>
            <input
              type="range"
              min="50"
              max={maxGrams}
              step="1"
              value={proteinGrams}
              onChange={(e) => handleGramChange('protein', e.target.value)}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50g</span><span>{maxGrams}g</span>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Carbs</label>
              <span className="text-sm text-orange-600 font-medium">
                {carbGrams}g &nbsp;
                <span className="text-gray-400">({macros.carbs.percentage}%)</span>
              </span>
            </div>
            <input
              type="range"
              min="20"
              max={maxGrams}
              step="1"
              value={carbGrams}
              onChange={(e) => handleGramChange('carbs', e.target.value)}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20g</span><span>{maxGrams}g</span>
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Fat</label>
              <span className="text-sm text-purple-600 font-medium">
                {fatGrams}g &nbsp;
                <span className="text-gray-400">({macros.fat.percentage}%)</span>
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="1"
              value={fatGrams}
              onChange={(e) => handleGramChange('fat', e.target.value)}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20g</span><span>200g</span>
            </div>
          </div>

          {/* Calorie total */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Total:{' '}
              <span className="font-bold text-gray-900">{current} kcal</span>
              {goal > 0 && (
                <span className={`ml-2 text-xs ${Math.abs(current - goal) <= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                  (goal: {goal} kcal
                  {Math.abs(current - goal) <= 20
                    ? ' ✓'
                    : ` — ${current > goal ? '+' : ''}${current - goal}`})
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* LBM explanation */}
      {!useCustomMacros && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>LBM-Based Calculation:</strong><br />
            • Protein: 1g per lb of lean body mass ({Math.round(leanBodyMassLbs || 0)} lbs = {macros.protein.grams}g)<br />
            • Fat: {macros.fat.percentage}% for hormone health<br />
            • Carbs: Remaining calories for energy
          </p>
        </div>
      )}
    </div>
  )
}
