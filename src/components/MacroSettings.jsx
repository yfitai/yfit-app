import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  calculateMacrosFromLBM,
  calculateMacrosFromPercentages,
  validateMacroPercentages,
  getRecommendedFatPercentage
} from '../lib/macroCalculations'

export default function MacroSettings({ user, leanBodyMassLbs, adjustedCalories, goalType, onMacrosUpdated }) {
  const [useCustomMacros, setUseCustomMacros] = useState(false)
  const [proteinPercent, setProteinPercent] = useState(30)
  const [carbPercent, setCarbPercent] = useState(40)
  const [fatPercent, setFatPercent] = useState(30)
  const [macros, setMacros] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMacroSettings()
  }, [user, leanBodyMassLbs, adjustedCalories])

  const loadMacroSettings = async () => {
    if (!user || !adjustedCalories) return

    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      // Load from localStorage
      const stored = localStorage.getItem('yfit_demo_macro_settings')
      if (stored) {
        const settings = JSON.parse(stored)
        setUseCustomMacros(settings.useCustom)
        if (settings.useCustom) {
          setProteinPercent(settings.protein)
          setCarbPercent(settings.carbs)
          setFatPercent(settings.fat)
          calculateAndSetMacros(true, settings.protein, settings.carbs, settings.fat)
        } else {
          calculateAndSetMacros(false)
        }
      } else {
        calculateAndSetMacros(false)
      }
    } else {
      // Load from database
      const { data } = await supabase
        .from('user_preferences')
        .select('use_custom_macros, protein_percent, carb_percent, fat_percent')
        .eq('user_id', user.id)
        .single()

      if (data && data.use_custom_macros) {
        setUseCustomMacros(true)
        setProteinPercent(data.protein_percent)
        setCarbPercent(data.carb_percent)
        setFatPercent(data.fat_percent)
        calculateAndSetMacros(true, data.protein_percent, data.carb_percent, data.fat_percent)
      } else {
        calculateAndSetMacros(false)
      }
    }
  }

  const calculateAndSetMacros = (custom = false, p = null, c = null, f = null) => {
    let calculatedMacros

    if (custom && p !== null && c !== null && f !== null) {
      // Use custom percentages
      try {
        calculatedMacros = calculateMacrosFromPercentages(adjustedCalories, p, c, f)
        setError(null)
      } catch (err) {
        setError(err.message)
        return
      }
    } else {
      // Use LBM-based calculation if available, otherwise use default percentages
      if (leanBodyMassLbs) {
        const recommendedFatPercent = getRecommendedFatPercentage(goalType)
        calculatedMacros = calculateMacrosFromLBM(leanBodyMassLbs, adjustedCalories, recommendedFatPercent)
        
        // Update the percentage sliders to match calculated values
        setProteinPercent(calculatedMacros.protein.percentage)
        setCarbPercent(calculatedMacros.carbs.percentage)
        setFatPercent(calculatedMacros.fat.percentage)
      } else {
        // Fallback to standard 30/40/30 split when LBM not available
        calculatedMacros = calculateMacrosFromPercentages(adjustedCalories, 30, 40, 30)
        setProteinPercent(30)
        setCarbPercent(40)
        setFatPercent(30)
      }
    }

    setMacros(calculatedMacros)
    
    // Notify parent component
    if (onMacrosUpdated) {
      onMacrosUpdated(calculatedMacros)
    }
  }

  const handleToggleCustomMacros = async (enabled) => {
    setUseCustomMacros(enabled)
    
    if (!enabled) {
      // Recalculate using LBM-based method
      calculateAndSetMacros(false)
    } else {
      // Use current slider values
      calculateAndSetMacros(true, proteinPercent, carbPercent, fatPercent)
    }

    await saveMacroSettings(enabled, proteinPercent, carbPercent, fatPercent)
  }

  const handlePercentageChange = (type, value) => {
    const newValue = parseInt(value) || 0

    let newProtein = proteinPercent
    let newCarbs = carbPercent
    let newFat = fatPercent

    if (type === 'protein') {
      // When protein changes, auto-adjust fat to 25% and carbs to fill remaining
      newProtein = Math.min(Math.max(newValue, 10), 60) // Clamp between 10-60%
      const remaining = 100 - newProtein
      newFat = Math.round(remaining * 0.25) // 25% of remaining
      newCarbs = 100 - newProtein - newFat // Fill the rest
    } else if (type === 'carbs') {
      // When carbs change, keep protein fixed and adjust fat only
      newCarbs = newValue
      newFat = 100 - newProtein - newCarbs
      // Ensure fat stays within valid range
      if (newFat < 15) {
        newFat = 15
        newCarbs = 100 - newProtein - newFat
      } else if (newFat > 50) {
        newFat = 50
        newCarbs = 100 - newProtein - newFat
      }
    } else if (type === 'fat') {
      // When fat changes, keep protein fixed and adjust carbs only
      newFat = newValue
      newCarbs = 100 - newProtein - newFat
      // Ensure carbs stays within valid range
      if (newCarbs < 10) {
        newCarbs = 10
        newFat = 100 - newProtein - newCarbs
      } else if (newCarbs > 70) {
        newCarbs = 70
        newFat = 100 - newProtein - newCarbs
      }
    }

    setProteinPercent(newProtein)
    setCarbPercent(newCarbs)
    setFatPercent(newFat)

    // Validate
    const validation = validateMacroPercentages(newProtein, newCarbs, newFat)
    if (!validation.isValid) {
      setError(validation.error)
    } else {
      setError(null)
      calculateAndSetMacros(true, newProtein, newCarbs, newFat)
      saveMacroSettings(true, newProtein, newCarbs, newFat)
    }
  }

  const saveMacroSettings = async (useCustom, p, c, f) => {
    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      localStorage.setItem('yfit_demo_macro_settings', JSON.stringify({
        useCustom,
        protein: p,
        carbs: c,
        fat: f
      }))
    } else {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          use_custom_macros: useCustom,
          protein_percent: p,
          carb_percent: c,
          fat_percent: f
        }, {
          onConflict: 'user_id'
        })
    }
  }

  if (!macros) {
    return <div className="text-center py-4">Calculating macros...</div>
  }

  const total = proteinPercent + carbPercent + fatPercent

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🎯 Macro Targets
      </h3>

      {/* Toggle Custom Macros */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-800">Custom Macro Percentages</p>
          <p className="text-sm text-gray-600">
            {useCustomMacros 
              ? 'Using custom percentages' 
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

      {/* Macro Summary */}
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

      {/* Custom Percentage Sliders */}
      {useCustomMacros && (
        <div className="space-y-4 mb-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Protein</label>
              <span className="text-sm text-blue-600 font-medium">{proteinPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={proteinPercent}
              onChange={(e) => handlePercentageChange('protein', e.target.value)}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Carbs</label>
              <span className="text-sm text-orange-600 font-medium">{carbPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              value={carbPercent}
              onChange={(e) => handlePercentageChange('carbs', e.target.value)}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Fat</label>
              <span className="text-sm text-purple-600 font-medium">{fatPercent}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={fatPercent}
              onChange={(e) => handlePercentageChange('fat', e.target.value)}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* Total Percentage Display */}
          <div className={`p-3 rounded-lg ${total === 100 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-medium ${total === 100 ? 'text-green-800' : 'text-red-800'}`}>
              Total: {total}% {total === 100 ? '✓' : '(must equal 100%)'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {!useCustomMacros && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>LBM-Based Calculation:</strong><br />
            • Protein: 1g per lb of lean body mass ({Math.round(leanBodyMassLbs)} lbs = {macros.protein.grams}g)<br />
            • Fat: {macros.fat.percentage}% for hormone health<br />
            • Carbs: Remaining calories for energy
          </p>
        </div>
      )}
    </div>
  )
}
