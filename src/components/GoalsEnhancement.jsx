import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  
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
  const [bpSystolicGoal, setBpSystolicGoal] = useState('120')
  const [bpDiastolicGoal, setBpDiastolicGoal] = useState('80')
  const [glucoseGoal, setGlucoseGoal] = useState('100')
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
        // Convert kg to display units (lbs or kg) and snap to nearest valid dropdown option
        const weeklyInDisplay = isMetric ? initialData.weekly_goal_kg : initialData.weekly_goal_kg * 2.20462
        const validOptions = ['0.5', '1', '1.5', '2']
        const closest = validOptions.reduce((prev, curr) =>
          Math.abs(parseFloat(curr) - weeklyInDisplay) < Math.abs(parseFloat(prev) - weeklyInDisplay) ? curr : prev
        )
        setWeeklyGoal(closest)
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
      if (initialData.bp_systolic_goal) setBpSystolicGoal(initialData.bp_systolic_goal.toString())
      if (initialData.bp_diastolic_goal) setBpDiastolicGoal(initialData.bp_diastolic_goal.toString())
      if (initialData.glucose_goal) setGlucoseGoal(initialData.glucose_goal.toString())
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
  
  // Auto-sync weekly goal with Basic Info weight change rate
  // Only sync if weeklyGoal is empty (no loaded data from DB) and user hasn't manually changed it
  useEffect(() => {
    if (weightChangeRate && !manuallyEditedGoal && !weeklyGoal) {
      setWeeklyGoal(weightChangeRate)
    }
  }, [weightChangeRate, weeklyGoal])
  
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
      sleep_hours_goal: sleepGoal ? parseFloat(sleepGoal) : 8,
      bp_systolic_goal: bpSystolicGoal ? parseInt(bpSystolicGoal) : 120,
      bp_diastolic_goal: bpDiastolicGoal ? parseInt(bpDiastolicGoal) : 80,
      glucose_goal: glucoseGoal ? parseInt(glucoseGoal) : 100
    }
    
    if (onGoalsChange) {
      onGoalsChange(goals)
    }
  }, [
    startingWeight, targetWeight, startingBodyFat, targetBodyFat,
    targetDate, weeklyGoal, fiberGoal, sugarGoal, sodiumGoal,
    waterGoal, stepsGoal, sleepGoal, bpSystolicGoal, bpDiastolicGoal, glucoseGoal, unitSystem
  ])
  
  const estimatedDate = calculateEstimatedDate()
  const weightUnit = getWeightUnit(unitSystem)
  
  return (
    <div className="space-y-6">
      {/* Starting Point Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('goals.startingPoint')}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('goals.recordCurrentMeasurements')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.startingWeight')} ({weightUnit})
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
              placeholder={`${t('goals.startingWeight')} (${weightUnit})`}
            />
            {!manuallyEditedWeight && (
              <p className="text-xs text-gray-500 mt-1">
                {t('goals.autoSyncedFromBasicInfo')}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.startingBodyFat')} (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={startingBodyFat}
              onChange={(e) => setStartingBodyFat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('goals.enterBodyFat')}
            />
          </div>
        </div>
      </div>
      
      {/* Target Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('goals.yourTargets')}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('goals.setGoalTargetsAndTimeline')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.targetWeight')} ({weightUnit})
            </label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={`${t('goals.targetWeight')} (${weightUnit})`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.targetBodyFat')} (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={targetBodyFat}
              onChange={(e) => setTargetBodyFat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('goals.enterTargetBodyFat')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.weeklyGoal')} ({weightUnit}/week)
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
              <option value="">{t('goals.selectRate')}...</option>
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
              {t('goals.targetDate')}
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
          <div className="mt-4 p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-md border border-teal-100">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-green-600" />
              <div className="text-gray-700">
                <div>
                  <strong>{t('goals.timeline')}:</strong> {estimatedDate.days} days ({Math.ceil(estimatedDate.days / 7)} weeks)
                </div>
                <div className="mt-1">
                  <strong>{t('goals.targetDate')}:</strong> {new Date(estimatedDate.date).toLocaleDateString()}
                  {targetDate && targetDate !== estimatedDate.date && (
                    <span className="ml-2 text-orange-600">
                      ({t('goals.manualOverride')}: {new Date(targetDate).toLocaleDateString()})
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
          <h3 className="text-lg font-semibold text-gray-900">{t('goals.dailyGoals')}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('goals.setDailyNutritionActivityTargets')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.fiberGoal')} (g/day)
            </label>
            <input
              type="number"
              value={fiberGoal}
              onChange={(e) => setFiberGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder={t('goals.fiberRecommended')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.fiberRecommended')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.sugarLimit')} (g/day)
            </label>
            <input
              type="number"
              value={sugarGoal}
              onChange={(e) => setSugarGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder={t('goals.sugarRecommended')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.sugarRecommended')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.sodiumLimit')} (mg/day)
            </label>
            <input
              type="number"
              value={sodiumGoal}
              onChange={(e) => setSodiumGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder={t('goals.sodiumRecommended')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.sodiumRecommended')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.weeklyGoal')} ({isMetric ? 'ml' : 'oz'}/day)
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
              placeholder="10000"
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.stepsRecommended')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.sleepRecommended')}
            </label>
            <input
              type="number"
              step="0.5"
              value={sleepGoal}
              onChange={(e) => setSleepGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="8"
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.sleepHoursRecommended')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.bloodPressureGoal')} (systolic mmHg)
            </label>
            <input
              type="number"
              value={bpSystolicGoal}
              onChange={(e) => setBpSystolicGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="120"
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.bpSystolicNormal')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.bloodPressureGoal')} (diastolic mmHg)
            </label>
            <input
              type="number"
              value={bpDiastolicGoal}
              onChange={(e) => setBpDiastolicGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="80"
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.bpDiastolicNormal')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals.fastingGlucoseGoal')} (mg/dL)
            </label>
            <input
              type="number"
              value={glucoseGoal}
              onChange={(e) => setGlucoseGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">{t('goals.glucoseNormal')}</p>
          </div>
        </div>
      </div>
      
      {/* Progress Summary (if targets are set) */}
      {startingWeight && targetWeight && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('goals.goalSummary')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-md border border-teal-100">
              <p className="text-sm text-gray-600 mb-1">{t('goals.weightChange')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.abs(parseFloat(targetWeight) - parseFloat(startingWeight)).toFixed(1)} {weightUnit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {parseFloat(targetWeight) < parseFloat(startingWeight) ? t('goals.toLose') : t('goals.toGain')}
              </p>
            </div>
            
            {startingBodyFat && targetBodyFat && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-md border border-teal-100">
                <p className="text-sm text-gray-600 mb-1">{t('goals.bodyFatChange')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.abs(parseFloat(targetBodyFat) - parseFloat(startingBodyFat)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {parseFloat(targetBodyFat) < parseFloat(startingBodyFat) ? t('goals.toReduce') : t('goals.toGain')}
                </p>
              </div>
            )}
            
            {estimatedDate && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-md border border-teal-100">
                <p className="text-sm text-gray-600 mb-1">{t('goals.timeline')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estimatedDate.days} days
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('goals.estimatedDuration')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
