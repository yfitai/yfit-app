import React, { useState, useEffect } from 'react'
import { Target, TrendingUp, Calendar, Award } from 'lucide-react'
import { useUnitPreference } from '../contexts/UnitPreferenceContext'
import {
  convertWeightInputToKg,
  convertKgToDisplay,
  getWeightUnit,
  mlToOz,
  ozToMl
} from '../lib/unitConversions'


/**
 * GoalsEnhancement Component
 * Adds starting point, target tracking, and nutrition goals to the Goals page
 * Integrates with existing Goals component
 */
export default function GoalsEnhancement({ 
  currentWeight,
  currentBodyFat,
  goalType,
  weightChangeRate,
  initialData,
  onGoalsChange 
}) {
  const { unitSystem, isMetric } = useUnitPreference()
  
  // Starting Point (auto-filled from current values)
  const [startingWeight, setStartingWeight] = useState('')
  const [startingBodyFat, setStartingBodyFat] = useState('')
  
  // Targets
  const [targetWeight, setTargetWeight] = useState('')
  const [targetBodyFat, setTargetBodyFat] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [weeklyGoal, setWeeklyGoal] = useState('') // User selects from dropdown
  
  // Nutrition Goals (will be auto-calculated but can be overridden)
  const [fiberGoal, setFiberGoal] = useState('25')
  const [sugarGoal, setSugarGoal] = useState('50')
  const [sodiumGoal, setSodiumGoal] = useState('2300')
  const [waterGoal, setWaterGoal] = useState('')
  const [stepsGoal, setStepsGoal] = useState('10000')
  const [sleepGoal, setSleepGoal] = useState('8')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [manuallyEditedWeight, setManuallyEditedWeight] = useState(false)
  const [manuallyEditedGoal, setManuallyEditedGoal] = useState(false)
  
  // Load initial data from database (only once)
  useEffect(() => {
    if (initialData && !dataLoaded) {
      if (initialData.starting_weight_kg) {
        setStartingWeight(convertKgToDisplay(initialData.starting_weight_kg, unitSystem))
      }
      if (initialData.target_weight_kg && initialData.target_weight_kg > 20) {
        // Only load if it's a reasonable weight (> 20kg / 44lbs)
        // This filters out old invalid data from previous auto-calculation bug
        setTargetWeight(convertKgToDisplay(initialData.target_weight_kg, unitSystem))
      }
      if (initialData.starting_body_fat_percentage) {
        setStartingBodyFat(initialData.starting_body_fat_percentage.toString())
      }
      if (initialData.target_body_fat_percentage) {
        setTargetBodyFat(initialData.target_body_fat_percentage.toString())
      }
      if (initialData.target_date) {
        setTargetDate(initialData.target_date)
      }
      if (initialData.weekly_goal_kg) {
        // Convert kg to display units (lbs or kg)
        const weeklyInDisplay = isMetric ? initialData.weekly_goal_kg : initialData.weekly_goal_kg * 2.20462
        setWeeklyGoal(weeklyInDisplay.toFixed(1))
      }
      if (initialData.fiber_goal_g) setFiberGoal(initialData.fiber_goal_g.toString())
      if (initialData.sugar_goal_g) setSugarGoal(initialData.sugar_goal_g.toString())
      if (initialData.sodium_goal_mg) setSodiumGoal(initialData.sodium_goal_mg.toString())
      if (initialData.water_goal_ml) {
        // Convert ml to oz for imperial display
        const waterValue = isMetric ? initialData.water_goal_ml : mlToOz(initialData.water_goal_ml)
        setWaterGoal(Math.round(waterValue).toString())
      }
      if (initialData.steps_goal) setStepsGoal(initialData.steps_goal.toString())
      if (initialData.sleep_hours_goal) setSleepGoal(initialData.sleep_hours_goal.toString())
      setDataLoaded(true)
    }
  }, [initialData])
  
  // Auto-sync starting weight with Basic Info weight (unless manually edited)
  useEffect(() => {
    if (currentWeight && !manuallyEditedWeight) {
      setStartingWeight(currentWeight)
    }
    if (currentBodyFat && !startingBodyFat) {
      setStartingBodyFat(currentBodyFat)
    }
  }, [currentWeight, currentBodyFat, manuallyEditedWeight])
  
  // Auto-sync weekly goal with Basic Info weight change rate (unless manually edited)
  useEffect(() => {
    if (weightChangeRate && !manuallyEditedGoal) {
      setWeeklyGoal(weightChangeRate)
    }
  }, [weightChangeRate, manuallyEditedGoal])
  
  // Convert water goal when unit system changes
  useEffect(() => {
    if (waterGoal && dataLoaded) {
      const currentValue = parseInt(waterGoal)
      if (!isNaN(currentValue) && currentValue > 0) {
        // Convert between ml and oz based on unit system
        // Detect which unit the current value is in by checking if it's a typical ml or oz range
        const isCurrentlyMl = currentValue > 500 // Assume >500 is ml, <500 is oz
        
        if (isMetric && !isCurrentlyMl) {
          // Switching to metric, convert oz → ml
          setWaterGoal(Math.round(ozToMl(currentValue)).toString())
        } else if (!isMetric && isCurrentlyMl) {
          // Switching to imperial, convert ml → oz
          setWaterGoal(Math.round(mlToOz(currentValue)).toString())
        }
      }
    }
  }, [unitSystem])
  
  // Target weight and body fat are manually entered by user
  // No auto-calculation to allow full control
  
  // Calculate estimated completion date and days
  const calculateEstimatedDate = () => {
    if (!startingWeight || !targetWeight || !weeklyGoal) return null
    
    const start = parseFloat(startingWeight)
    const target = parseFloat(targetWeight)
    const weekly = parseFloat(weeklyGoal)
    
    // Validate all values are valid numbers
    if (isNaN(start) || isNaN(target) || isNaN(weekly)) return null
    
    console.log('Calculate Date - Start:', start, 'Target:', target, 'Weekly:', weekly)
    
    if (weekly === 0) return null
    
    const totalChange = Math.abs(target - start)
    const weeksNeeded = totalChange / weekly
    const daysNeeded = Math.ceil(weeksNeeded * 7)
    
    // Validate the calculation result
    if (isNaN(daysNeeded) || !isFinite(daysNeeded)) return null
    
    console.log('Total Change:', totalChange, 'Weeks:', weeksNeeded, 'Days:', daysNeeded)
    
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded)
    
    return {
      date: estimatedDate.toISOString().split('T')[0],
      days: daysNeeded
    }
  }
  
  // Auto-calculate and set target date when inputs change
  useEffect(() => {
    if (startingWeight && targetWeight && weeklyGoal) {
      const calculation = calculateEstimatedDate()
      if (calculation) {
        setTargetDate(calculation.date)
      }
    }
  }, [startingWeight, targetWeight, weeklyGoal])
  
  // Notify parent component of changes
  useEffect(() => {
    const goals = {
      starting_weight_kg: startingWeight ? convertWeightInputToKg(parseFloat(startingWeight), unitSystem) : null,
      target_weight_kg: targetWeight ? convertWeightInputToKg(parseFloat(targetWeight), unitSystem) : null,
      starting_body_fat_percentage: startingBodyFat ? parseFloat(startingBodyFat) : null,
      target_body_fat_percentage: targetBodyFat ? parseFloat(targetBodyFat) : null,
      target_date: targetDate || null,
      weekly_goal_kg: weeklyGoal ? (isMetric ? parseFloat(weeklyGoal) : parseFloat(weeklyGoal) / 2.20462) : 0.5,
      fiber_goal_g: fiberGoal ? parseFloat(fiberGoal) : 25,
      sugar_goal_g: sugarGoal ? parseFloat(sugarGoal) : 50,
      sodium_goal_mg: sodiumGoal ? parseFloat(sodiumGoal) : 2300,
      water_goal_ml: waterGoal ? (isMetric ? parseInt(waterGoal) : ozToMl(parseInt(waterGoal))) : 2000,
      steps_goal: stepsGoal ? parseInt(stepsGoal) : 10000,
      sleep_hours_goal: sleepGoal ? parseFloat(sleepGoal) : 8
    }
    
    if (onGoalsChange) {
      onGoalsChange(goals)
    }
  }, [
    startingWeight, targetWeight, startingBodyFat, targetBodyFat,
    targetDate, weeklyGoal, fiberGoal, sugarGoal, sodiumGoal,
    waterGoal, stepsGoal, sleepGoal, unitSystem
  ])
  
  const estimatedDate = calculateEstimatedDate()
  const weightUnit = getWeightUnit(unitSystem)
  
  return (
    <div className="space-y-6">
      {/* Starting Point Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Starting Point</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Record your current measurements as your starting point
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Weight ({weightUnit})
            </label>
            <input
              type="number"
              step="0.1"
              value={startingWeight}
              onChange={(e) => {
                setStartingWeight(e.target.value)
                setManuallyEditedWeight(true)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter weight in ${weightUnit}`}
            />
            {!manuallyEditedWeight && (
              <p className="text-xs text-gray-500 mt-1">
                Auto-synced from Basic Info
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Body Fat (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={startingBodyFat}
              onChange={(e) => setStartingBodyFat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter body fat %"
            />
          </div>
        </div>
      </div>
      
      {/* Target Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Targets</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set your goal targets and timeline
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Weight ({weightUnit})
            </label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={`Enter target weight in ${weightUnit}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Body Fat (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={targetBodyFat}
              onChange={(e) => setTargetBodyFat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter target body fat %"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Goal ({weightUnit}/week)
            </label>
            <select
              value={weeklyGoal}
              onChange={(e) => {
                console.log('Weekly Goal selected:', e.target.value)
                setWeeklyGoal(e.target.value)
                setManuallyEditedGoal(true)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select rate...</option>
              <option value="0.5">0.5 {weightUnit}/week</option>
              <option value="1">1 {weightUnit}/week</option>
              <option value="1.5">1.5 {weightUnit}/week</option>
              <option value="2">2 {weightUnit}/week</option>
            </select>
            {!manuallyEditedGoal && (
              <p className="text-xs text-gray-500 mt-1">
                Auto-synced from Basic Info
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        {/* Estimated Completion */}
        {estimatedDate && (
          <div className="mt-4 p-3 bg-white rounded-md border border-green-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-green-600" />
              <div className="text-gray-700">
                <div>
                  <strong>Timeline:</strong> {estimatedDate.days} days ({Math.ceil(estimatedDate.days / 7)} weeks)
                </div>
                <div className="mt-1">
                  <strong>Target Date:</strong> {new Date(estimatedDate.date).toLocaleDateString()}
                  {targetDate && targetDate !== estimatedDate.date && (
                    <span className="ml-2 text-orange-600">
                      (Manual override: {new Date(targetDate).toLocaleDateString()})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Daily Goals Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Goals</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set your daily nutrition and activity targets
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiber Goal (g/day)
            </label>
            <input
              type="number"
              value={fiberGoal}
              onChange={(e) => setFiberGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="25-30g recommended"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 25-30g</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sugar Limit (g/day)
            </label>
            <input
              type="number"
              value={sugarGoal}
              onChange={(e) => setSugarGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="<50g recommended"
            />
            <p className="text-xs text-gray-500 mt-1">WHO recommends &lt;50g</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sodium Limit (mg/day)
            </label>
            <input
              type="number"
              value={sodiumGoal}
              onChange={(e) => setSodiumGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="<2300mg recommended"
            />
            <p className="text-xs text-gray-500 mt-1">FDA recommends &lt;2300mg</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Water Goal ({isMetric ? 'ml' : 'oz'}/day)
            </label>
            <input
              type="number"
              value={waterGoal}
              onChange={(e) => setWaterGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
           placeholder={isMetric ? "2000ml recommended" : "68oz recommended"}

            />
     <p className="text-xs text-gray-500 mt-1">{isMetric ? '~8 glasses (2L)' : '~8 glasses (68oz)'}</p>

          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps Goal (steps/day)
            </label>
            <input
              type="number"
              value={stepsGoal}
              onChange={(e) => setStepsGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="10000 recommended"
            />
            <p className="text-xs text-gray-500 mt-1">10,000 steps recommended</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sleep Goal (hours/night)
            </label>
            <input
              type="number"
              step="0.5"
              value={sleepGoal}
              onChange={(e) => setSleepGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="8 hours recommended"
            />
            <p className="text-xs text-gray-500 mt-1">7-9 hours recommended</p>
          </div>
        </div>
      </div>
      
      {/* Progress Summary (if targets are set) */}
      {startingWeight && targetWeight && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Weight Change</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.abs(parseFloat(targetWeight) - parseFloat(startingWeight)).toFixed(1)} {weightUnit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {parseFloat(targetWeight) < parseFloat(startingWeight) ? 'To Lose' : 'To Gain'}
              </p>
            </div>
            
            {startingBodyFat && targetBodyFat && (
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Body Fat Change</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.abs(parseFloat(targetBodyFat) - parseFloat(startingBodyFat)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {parseFloat(targetBodyFat) < parseFloat(startingBodyFat) ? 'To Reduce' : 'To Gain'}
                </p>
              </div>
            )}
            
            {estimatedDate && (
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Timeline</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estimatedDate.days} days
                </p>
                <p className="text-xs text-gray-500 mt-1">Estimated duration</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
