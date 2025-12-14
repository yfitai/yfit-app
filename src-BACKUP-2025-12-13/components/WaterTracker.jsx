import { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'
import { useUnitPreference } from '../contexts/UnitPreferenceContext'
import { mlToOz, ozToMl } from '../lib/unitConversions'

export default function WaterTracker({ user }) {
  const { unitSystem } = useUnitPreference()
  const [waterIntake, setWaterIntake] = useState(0) // in ml
  const [goal, setGoal] = useState(2000) // default 2000ml (64oz)
  const [loading, setLoading] = useState(true)
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [goalInputValue, setGoalInputValue] = useState('') // Local input state

  useEffect(() => {
    loadWaterData()
  }, [user])

  useEffect(() => {
    // Initialize input value when edit mode opens
    if (showGoalEdit) {
      const displayValue = unitSystem === 'imperial' ? Math.round(mlToOz(goal)) : goal
      setGoalInputValue(displayValue.toString())
    }
  }, [showGoalEdit, goal, unitSystem])

  const loadWaterData = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      // Load from localStorage
      const stored = localStorage.getItem('yfit_demo_water')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.date === today) {
          setWaterIntake(data.amount_ml)
        }
      }
      const storedGoal = localStorage.getItem('yfit_demo_water_goal')
      if (storedGoal) {
        setGoal(parseInt(storedGoal))
      }
    } else {
      // Load from database
      const { data, error } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (data && !error) {
        setWaterIntake(data.amount_ml)
      }

      // Load goal from user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('water_goal_ml')
        .eq('user_id', user.id)
        .single()

      if (prefs?.water_goal_ml) {
        setGoal(prefs.water_goal_ml)
      }
    }

    setLoading(false)
  }

  const addWater = async (amountMl) => {
    const newAmount = waterIntake + amountMl
    setWaterIntake(newAmount)

    const today = new Date().toISOString().split('T')[0]
    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      // Save to localStorage
      localStorage.setItem('yfit_demo_water', JSON.stringify({
        date: today,
        amount_ml: newAmount
      }))
    } else {
      // Save to database
      await supabase
        .from('water_intake')
        .upsert({
          user_id: user.id,
          date: today,
          amount_ml: newAmount
        }, {
          onConflict: 'user_id,date'
        })
    }
  }

  const updateGoal = async (newGoalMl) => {
    setGoal(newGoalMl)
    setShowGoalEdit(false)

    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      localStorage.setItem('yfit_demo_water_goal', newGoalMl.toString())
    } else {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          water_goal_ml: newGoalMl
        }, {
          onConflict: 'user_id'
        })
    }
  }

  const resetWater = async () => {
    setWaterIntake(0)

    const today = new Date().toISOString().split('T')[0]
    const isDemoMode = !user || user.id.startsWith('demo')

    if (isDemoMode) {
      localStorage.setItem('yfit_demo_water', JSON.stringify({
        date: today,
        amount_ml: 0
      }))
    } else {
      await supabase
        .from('water_intake')
        .upsert({
          user_id: user.id,
          date: today,
          amount_ml: 0
        }, {
          onConflict: 'user_id,date'
        })
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading water tracker...</div>
  }

  const progress = Math.min((waterIntake / goal) * 100, 100)
  const glassesCount = Math.floor(waterIntake / 250) // 250ml per glass

  // Quick add buttons
  const quickAddButtons = unitSystem === 'imperial'
    ? [
        { label: '8 oz', ml: ozToMl(8) },
        { label: '16 oz', ml: ozToMl(16) },
        { label: '32 oz', ml: ozToMl(32) }
      ]
    : [
        { label: '250 ml', ml: 250 },
        { label: '500 ml', ml: 500 },
        { label: '1 L', ml: 1000 }
      ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          💧 Water Intake
        </h3>
        <button
          onClick={() => setShowGoalEdit(!showGoalEdit)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showGoalEdit ? 'Cancel' : 'Edit Goal'}
        </button>
      </div>

      {showGoalEdit ? (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Water Goal
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={goalInputValue}
              onChange={(e) => {
                setGoalInputValue(e.target.value)
              }}
              onBlur={() => {
                if (goalInputValue && goalInputValue.trim() !== '') {
                  const value = parseInt(goalInputValue)
                  if (!isNaN(value) && value > 0) {
                    const mlValue = unitSystem === 'imperial' ? ozToMl(value) : value
                    updateGoal(mlValue)
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (goalInputValue && goalInputValue.trim() !== '') {
                    const value = parseInt(goalInputValue)
                    if (!isNaN(value) && value > 0) {
                      const mlValue = unitSystem === 'imperial' ? ozToMl(value) : value
                      updateGoal(mlValue)
                    }
                  }
                  e.target.blur()
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              autoFocus
            />
            <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
              {unitSystem === 'imperial' ? 'oz' : 'ml'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Recommended: 64 oz (2000 ml) per day
          </p>
        </div>
      ) : null}

      {/* Progress Display */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {unitSystem === 'imperial' 
              ? `${Math.round(mlToOz(waterIntake))} oz`
              : `${waterIntake} ml`
            }
          </span>
          <span>
            Goal: {unitSystem === 'imperial' 
              ? `${Math.round(mlToOz(goal))} oz`
              : `${goal} ml`
            }
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          {Math.round(progress)}% of daily goal
        </p>
      </div>

      {/* Visual Glasses */}
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`text-2xl ${i < glassesCount ? 'opacity-100' : 'opacity-20'}`}
          >
            🥤
          </div>
        ))}
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {quickAddButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => addWater(btn.ml)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            + {btn.label}
          </button>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={resetWater}
        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Reset Today
      </button>

      {/* Achievement */}
      {progress >= 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800 font-medium">🎉 Daily goal achieved!</p>
          <p className="text-sm text-green-600">Great hydration!</p>
        </div>
      )}
    </div>
  )
}
