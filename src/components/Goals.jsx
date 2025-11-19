import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnitPreference } from '../contexts/UnitPreferenceContext'
import { supabase, getCurrentUser } from '../lib/supabase'
import UnitToggle from './UnitToggle'
import { 
  convertWeightInputToKg, 
  convertKgToDisplay,
  convertInputToCm,
  convertCmToDisplay,
  getWeightUnit,
  getMeasurementUnit,
  feetInchesToCm,
  cmToFeetInches
} from '../lib/unitConversions'
import { Activity, Target, TrendingUp, User } from 'lucide-react'
import { calculateAllMetrics } from '../lib/calculations'
import GoalsResults from './GoalsResults'
import GoalsEnhancement from './GoalsEnhancement'
import { getUserProfile } from '../lib/supabase'

export default function Goals({ user: propUser }) {
  const navigate = useNavigate()
  const { unitSystem, isMetric } = useUnitPreference()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(propUser || null)
  const [userProfile, setUserProfile] = useState(null)
  const [calculatedMetrics, setCalculatedMetrics] = useState(null)
  
  // Basic Information
  const [age, setAge] = useState('')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('male')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [goalType, setGoalType] = useState('lose_weight')
  const [weightChangeRate, setWeightChangeRate] = useState('1') // lbs per week
  
  // Goals Enhancement - Starting Point & Targets
  const [enhancedGoals, setEnhancedGoals] = useState({
    starting_weight_kg: null,
    target_weight_kg: null,
    starting_body_fat_percentage: null,
    target_body_fat_percentage: null,
    target_date: null,
    weekly_goal_kg: 0.5,
    fiber_goal_g: 25,
    sugar_goal_g: 50,
    sodium_goal_mg: 2300,
    water_goal_ml: 2000,
    steps_goal: 10000,
    sleep_hours_goal: 8
  })
  
  // Manual Override Options
  const [useManualBodyFat, setUseManualBodyFat] = useState(false)
  const [manualBodyFat, setManualBodyFat] = useState('')
  const [useManualTDEE, setUseManualTDEE] = useState(false)
  const [manualTDEE, setManualTDEE] = useState('')
  
  // Body Measurements (all in cm in database)
  const [measurements, setMeasurements] = useState({
    neck: '',
    shoulders: '',
    chest: '',
    waist: '',
    hips: '',
    thighLeft: '',
    thighRight: '',
    calfLeft: '',
    calfRight: '',
    bicepLeft: '',
    bicepRight: '',
    forearmLeft: '',
    forearmRight: '',
    ankleLeft: '',
    ankleRight: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Use prop user if provided (for demo mode), otherwise fetch from Supabase
      const currentUser = propUser || await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        
        // Only fetch profile and goals if not in demo mode
        if (!currentUser.id.startsWith('demo')) {
          const profile = await getUserProfile(currentUser.id)
          setUserProfile(profile)
          await loadExistingGoals(currentUser.id)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExistingGoals = async (userId) => {
    // Load existing goals if any
    const { data: goalsData } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (goalsData) {
      setAge(goalsData.age.toString())
      setWeight(convertKgToDisplay(goalsData.weight_kg, unitSystem))
      
      // Handle height
      if (isMetric) {
        setHeightCm(goalsData.height_cm.toString())
      } else {
        const { feet, inches } = cmToFeetInches(goalsData.height_cm)
        setHeightFeet(feet.toString())
        setHeightInches(inches.toString())
      }
      
      setGender(goalsData.gender)
      setActivityLevel(goalsData.activity_level)
      setGoalType(goalsData.goal_type)
      
      // Load enhanced goals
      setEnhancedGoals({
        starting_weight_kg: goalsData.starting_weight_kg,
        target_weight_kg: goalsData.target_weight_kg,
        starting_body_fat_percentage: goalsData.starting_body_fat_percentage,
        target_body_fat_percentage: goalsData.target_body_fat_percentage,
        target_date: goalsData.target_date,
        weekly_goal_kg: goalsData.weekly_goal_kg || 0.5,
        fiber_goal_g: goalsData.fiber_goal_g || 25,
        sugar_goal_g: goalsData.sugar_goal_g || 50,
        sodium_goal_mg: goalsData.sodium_goal_mg || 2300,
        water_goal_ml: goalsData.water_goal_ml || 2000,
        steps_goal: goalsData.steps_goal || 10000,
        sleep_hours_goal: goalsData.sleep_hours_goal || 8
      })
    }

    // Load existing measurements if any
    const { data: measurementsData } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single()

    if (measurementsData) {
      setMeasurements({
        neck: convertCmToDisplay(measurementsData.neck_cm, unitSystem),
        shoulders: convertCmToDisplay(measurementsData.shoulders_cm, unitSystem),
        chest: convertCmToDisplay(measurementsData.chest_cm, unitSystem),
        waist: convertCmToDisplay(measurementsData.waist_cm, unitSystem),
        hips: convertCmToDisplay(measurementsData.hips_cm, unitSystem),
        thighLeft: convertCmToDisplay(measurementsData.thigh_left_cm, unitSystem),
        thighRight: convertCmToDisplay(measurementsData.thigh_right_cm, unitSystem),
        calfLeft: convertCmToDisplay(measurementsData.calf_left_cm, unitSystem),
        calfRight: convertCmToDisplay(measurementsData.calf_right_cm, unitSystem),
        bicepLeft: convertCmToDisplay(measurementsData.bicep_left_cm, unitSystem),
        bicepRight: convertCmToDisplay(measurementsData.bicep_right_cm, unitSystem),
        forearmLeft: convertCmToDisplay(measurementsData.forearm_left_cm, unitSystem),
        forearmRight: convertCmToDisplay(measurementsData.forearm_right_cm, unitSystem),
        ankleLeft: convertCmToDisplay(measurementsData.ankle_left_cm, unitSystem),
        ankleRight: convertCmToDisplay(measurementsData.ankle_right_cm, unitSystem)
      })
    }
  }

  // Update display values when unit system changes
  useEffect(() => {
    // Convert height
    if (isMetric) {
      // Switching to metric - convert from feet/inches to cm
      if (heightFeet && heightInches) {
        const totalCm = feetInchesToCm(parseInt(heightFeet), parseInt(heightInches))
        setHeightCm(totalCm.toString())
        setHeightFeet('')
        setHeightInches('')
      }
    } else {
      // Switching to imperial - convert from cm to feet/inches
      if (heightCm) {
        const { feet, inches } = cmToFeetInches(parseFloat(heightCm))
        setHeightFeet(feet.toString())
        setHeightInches(inches.toString())
        setHeightCm('')
      }
    }

    // Convert weight
    if (weight) {
      const currentKg = convertWeightInputToKg(weight, isMetric ? 'imperial' : 'metric')
      setWeight(convertKgToDisplay(currentKg, unitSystem))
    }
    
    // Convert all measurements
    Object.keys(measurements).forEach(key => {
      if (measurements[key]) {
        const currentCm = convertInputToCm(measurements[key], isMetric ? 'imperial' : 'metric')
        setMeasurements(prev => ({
          ...prev,
          [key]: convertCmToDisplay(currentCm, unitSystem)
        }))
      }
    })
  }, [unitSystem])

  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGoalsChange = (goals) => {
    setEnhancedGoals(goals)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validate required fields
      if (!age || !weight) {
        alert('Please fill in age and weight')
        setSaving(false)
        return
      }

      // Calculate height in cm
      let heightInCm
      if (isMetric) {
        if (!heightCm) {
          alert('Please fill in height')
          setSaving(false)
          return
        }
        heightInCm = parseFloat(heightCm)
      } else {
        if (!heightFeet || !heightInches) {
          alert('Please fill in height')
          setSaving(false)
          return
        }
        heightInCm = feetInchesToCm(parseInt(heightFeet), parseInt(heightInches))
      }

      // Convert weight to kg
      const weightInKg = convertWeightInputToKg(parseFloat(weight), unitSystem)

      // Prepare measurements in cm (without user_id for now)
      const measurementsInCm = {
        measurement_date: new Date().toISOString().split('T')[0],
        neck_cm: convertInputToCm(parseFloat(measurements.neck || 0), unitSystem),
        shoulders_cm: convertInputToCm(parseFloat(measurements.shoulders || 0), unitSystem),
        chest_cm: convertInputToCm(parseFloat(measurements.chest || 0), unitSystem),
        waist_cm: convertInputToCm(parseFloat(measurements.waist || 0), unitSystem),
        hips_cm: convertInputToCm(parseFloat(measurements.hips || 0), unitSystem),
        thigh_left_cm: convertInputToCm(parseFloat(measurements.thighLeft || 0), unitSystem),
        thigh_right_cm: convertInputToCm(parseFloat(measurements.thighRight || 0), unitSystem),
        calf_left_cm: convertInputToCm(parseFloat(measurements.calfLeft || 0), unitSystem),
        calf_right_cm: convertInputToCm(parseFloat(measurements.calfRight || 0), unitSystem),
        bicep_left_cm: convertInputToCm(parseFloat(measurements.bicepLeft || 0), unitSystem),
        bicep_right_cm: convertInputToCm(parseFloat(measurements.bicepRight || 0), unitSystem),
        forearm_left_cm: convertInputToCm(parseFloat(measurements.forearmLeft || 0), unitSystem),
        forearm_right_cm: convertInputToCm(parseFloat(measurements.forearmRight || 0), unitSystem),
        ankle_left_cm: convertInputToCm(parseFloat(measurements.ankleLeft || 0), unitSystem),
        ankle_right_cm: convertInputToCm(parseFloat(measurements.ankleRight || 0), unitSystem)
      }

      // Calculate all metrics
      const userData = {
        age: parseInt(age),
        height_cm: heightInCm,
        weight_kg: weightInKg,
        gender,
        activity_level: activityLevel,
        goal_type: goalType
      }

      // Calculate metrics (with manual overrides if enabled)
      let metrics = calculateAllMetrics(userData, measurementsInCm)
      
      // Apply weight change rate to adjust calories
      // 1 lb of fat = ~3500 calories, so 1 lb/week = 500 cal/day
      const calorieAdjustment = parseFloat(weightChangeRate) * 500
      if (goalType === 'lose_weight') {
        metrics.adjustedCalories = Math.round(metrics.tdee - calorieAdjustment)
      } else if (goalType === 'gain_weight' || goalType === 'build_strength') {
        metrics.adjustedCalories = Math.round(metrics.tdee + calorieAdjustment)
      } else {
        // maintain weight
        metrics.adjustedCalories = metrics.tdee
      }
      
      // Apply manual overrides if enabled
      if (useManualBodyFat && manualBodyFat) {
        const bodyFatValue = parseFloat(manualBodyFat)
        metrics.bodyFatPercentage = bodyFatValue
        metrics.bodyFatCategory = {
          category: 'Manual Entry',
          color: 'text-blue-600'
        }
        // Recalculate lean body mass with manual body fat
        metrics.leanBodyMass = weightInKg * (1 - bodyFatValue / 100)
        // Recalculate BMR with new lean body mass
        metrics.bmr = Math.round(370 + (21.6 * metrics.leanBodyMass))
        // Recalculate TDEE
        const multipliers = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9
        }
        metrics.tdee = Math.round(metrics.bmr * (multipliers[activityLevel] || 1.2))
        // Recalculate adjusted calories
        const adjustments = {
          lose_weight: -500,
          maintain: 0,
          gain_weight: 300,
          build_strength: 200
        }
        metrics.adjustedCalories = Math.round(metrics.tdee + (adjustments[goalType] || 0))
      }
      
      if (useManualTDEE && manualTDEE) {
        const tdeeValue = parseInt(manualTDEE)
        metrics.tdee = tdeeValue
        // Recalculate adjusted calories with manual TDEE
        const adjustments = {
          lose_weight: -500,
          maintain: 0,
          gain_weight: 300,
          build_strength: 200
        }
        metrics.adjustedCalories = Math.round(tdeeValue + (adjustments[goalType] || 0))
      }
      
      setCalculatedMetrics(metrics)

      // Check if demo mode (no user or user id starts with 'demo')
      const isDemoMode = !user || user.id.startsWith('demo')

      if (isDemoMode) {
        // In demo mode, save to localStorage
        localStorage.setItem('yfit_demo_goals', JSON.stringify(userData))
        localStorage.setItem('yfit_demo_measurements', JSON.stringify(measurementsInCm))
        localStorage.setItem('yfit_demo_metrics', JSON.stringify(metrics))
        
        alert('✅ Goals calculated successfully! (Demo Mode - data saved locally)')
        
        // Scroll to results
        setTimeout(() => {
          const resultsElement = document.getElementById('goals-results')
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        // In real mode, save to database
        measurementsInCm.user_id = user.id

        const { error: goalsError } = await supabase
          .from('user_goals')
          .upsert({
            user_id: user.id,
            age: parseInt(age),
            height_cm: heightInCm,
            weight_kg: weightInKg,
            gender,
            activity_level: activityLevel,
            goal_type: goalType,
            // Enhanced Goals fields
            starting_weight_kg: enhancedGoals.starting_weight_kg,
            target_weight_kg: enhancedGoals.target_weight_kg,
            starting_body_fat_percentage: enhancedGoals.starting_body_fat_percentage,
            target_body_fat_percentage: enhancedGoals.target_body_fat_percentage,
            target_date: enhancedGoals.target_date,
            weekly_goal_kg: enhancedGoals.weekly_goal_kg,
            fiber_goal_g: enhancedGoals.fiber_goal_g,
            sugar_goal_g: enhancedGoals.sugar_goal_g,
            sodium_goal_mg: enhancedGoals.sodium_goal_mg,
            water_goal_ml: enhancedGoals.water_goal_ml,
            steps_goal: enhancedGoals.steps_goal,
            sleep_hours_goal: enhancedGoals.sleep_hours_goal,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (goalsError) throw goalsError

        const { data: measurementData, error: measurementsError } = await supabase
          .from('body_measurements')
          .insert(measurementsInCm)
          .select()
          .single()

        if (measurementsError) throw measurementsError

        // Save calculated metrics to database
        const { error: metricsError } = await supabase
          .from('calculated_metrics')
          .insert({
            user_id: user.id,
            measurement_id: measurementData.id,
            bmi: metrics.bmi,
            body_fat_percentage: metrics.bodyFatPercentage,
            lean_body_mass_kg: metrics.leanBodyMass,
            bmr: metrics.bmr,
            tdee: metrics.tdee,
            adjusted_calories: metrics.adjustedCalories
          })

        if (metricsError) throw metricsError

        // Update user_goals with body type
        const { error: bodyTypeError } = await supabase
          .from('user_goals')
          .update({
            body_type: metrics.bodyType,
            body_type_confidence: metrics.bodyTypeConfidence,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (bodyTypeError) throw bodyTypeError

        alert('✅ Goals saved successfully!')
      }

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
    } catch (error) {
      console.error('Error saving goals:', error)
      alert('Error saving goals: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Your Goals
            </h1>
            <p className="text-gray-600 mt-1">Set your health and fitness targets</p>
          </div>
          <UnitToggle />
        </div>

        {/* Body Type Education Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Understanding Your Body Type
          </h2>
          <p className="text-gray-600 mb-6">
            Everyone has a unique body type that influences how they gain muscle, lose fat, and respond to training. 
            Understanding your body type helps set realistic goals and choose the right approach.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Ectomorph */}
            <div className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Ectomorph</h3>
              <p className="text-sm text-gray-600 mb-3">Lean & Long</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Naturally thin build</li>
                <li>• Fast metabolism</li>
                <li>• Difficulty gaining weight</li>
                <li>• Long limbs, lean muscle</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3 font-medium">
                Focus: Heavy strength training, higher calories
              </p>
            </div>

            {/* Mesomorph */}
            <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Mesomorph</h3>
              <p className="text-sm text-gray-600 mb-3">Athletic & Muscular</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Naturally athletic</li>
                <li>• Gains muscle easily</li>
                <li>• Moderate metabolism</li>
                <li>• V-shaped physique</li>
              </ul>
              <p className="text-xs text-green-600 mt-3 font-medium">
                Focus: Balanced strength & cardio
              </p>
            </div>

            {/* Endomorph */}
            <div className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Endomorph</h3>
              <p className="text-sm text-gray-600 mb-3">Solid & Strong</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Larger bone structure</li>
                <li>• Gains weight easily</li>
                <li>• Slower metabolism</li>
                <li>• Strong and powerful</li>
              </ul>
              <p className="text-xs text-purple-600 mt-3 font-medium">
                Focus: Higher cardio, careful calories
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Most people are a combination of two body types. After you enter your measurements, 
              we'll identify your primary body type and provide personalized recommendations.
            </p>
          </div>
        </div>

        {/* Basic Information Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your age"
                min="13"
                max="120"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Height */}
            {isMetric ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 175"
                  step="0.1"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Feet"
                    min="1"
                    max="8"
                  />
                  <input
                    type="number"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Inches"
                    min="0"
                    max="11"
                  />
                </div>
              </div>
            )}

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight ({getWeightUnit(unitSystem)}) *
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isMetric ? "e.g., 70" : "e.g., 154"}
                step="0.1"
              />
            </div>

            {/* Activity Level */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level *
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                <option value="active">Active (exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (intense exercise daily)</option>
              </select>
            </div>

            {/* Goal Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Goal *
              </label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lose_weight">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain_weight">Gain Weight</option>
                <option value="build_strength">Build Strength</option>
              </select>
            </div>

            {/* Weight Change Rate - Only show for lose/gain goals */}
            {(goalType === 'lose_weight' || goalType === 'gain_weight' || goalType === 'build_strength') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {goalType === 'lose_weight' ? 'Weight Loss Rate *' : 'Weight Gain Rate *'}
                </label>
                <select
                  value={weightChangeRate}
                  onChange={(e) => setWeightChangeRate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="0.5">0.5 lbs/week ({goalType === 'lose_weight' ? '-250' : '+250'} cal/day)</option>
                  <option value="1">1 lb/week ({goalType === 'lose_weight' ? '-500' : '+500'} cal/day) - Recommended</option>
                  <option value="1.5">1.5 lbs/week ({goalType === 'lose_weight' ? '-750' : '+750'} cal/day)</option>
                  <option value="2">2 lbs/week ({goalType === 'lose_weight' ? '-1000' : '+1000'} cal/day)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {goalType === 'lose_weight' 
                    ? 'Faster weight loss may result in muscle loss. 1-1.5 lbs/week is optimal for most people.'
                    : 'Slower weight gain minimizes fat gain. 0.5-1 lb/week is optimal for lean muscle growth.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Body Measurements Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Body Measurements</h2>
          <p className="text-gray-600 mb-6">
            Enter all 10 measurements for accurate body composition analysis. Measure at the widest/narrowest point of each area.
          </p>

          <div className="space-y-8">
            {/* Upper Body */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
                Upper Body
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neck ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.neck}
                    onChange={(e) => handleMeasurementChange('neck', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Narrowest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shoulders ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.shoulders}
                    onChange={(e) => handleMeasurementChange('shoulders', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Across shoulder blades"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chest ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.chest}
                    onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Fullest point"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Core */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-green-200">
                Core
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waist ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="At navel"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hips ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.hips}
                    onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Arms */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-purple-200">
                Arms
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left Bicep ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.bicepLeft}
                    onChange={(e) => handleMeasurementChange('bicepLeft', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Largest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right Bicep ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.bicepRight}
                    onChange={(e) => handleMeasurementChange('bicepRight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Largest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left Forearm ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.forearmLeft}
                    onChange={(e) => handleMeasurementChange('forearmLeft', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right Forearm ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.forearmRight}
                    onChange={(e) => handleMeasurementChange('forearmRight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Legs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-orange-200">
                Legs
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left Thigh ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.thighLeft}
                    onChange={(e) => handleMeasurementChange('thighLeft', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right Thigh ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.thighRight}
                    onChange={(e) => handleMeasurementChange('thighRight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left Calf ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.calfLeft}
                    onChange={(e) => handleMeasurementChange('calfLeft', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right Calf ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.calfRight}
                    onChange={(e) => handleMeasurementChange('calfRight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Widest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left Ankle ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.ankleLeft}
                    onChange={(e) => handleMeasurementChange('ankleLeft', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Narrowest point"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right Ankle ({getMeasurementUnit(unitSystem)})
                  </label>
                  <input
                    type="number"
                    value={measurements.ankleRight}
                    onChange={(e) => handleMeasurementChange('ankleRight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Narrowest point"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Override Options */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Advanced Options (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            If you know your body fat percentage from a DEXA scan or your TDEE from metabolic testing, you can enter them manually here.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Manual Body Fat Override */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="useManualBodyFat"
                  checked={useManualBodyFat}
                  onChange={(e) => setUseManualBodyFat(e.target.checked)}
                  className="w-5 h-5 text-purple-600"
                />
                <label htmlFor="useManualBodyFat" className="font-semibold text-gray-800 cursor-pointer">
                  I know my Body Fat %
                </label>
              </div>
              {useManualBodyFat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Fat Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={manualBodyFat}
                    onChange={(e) => setManualBodyFat(e.target.value)}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 18.5"
                    step="0.1"
                    min="3"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From DEXA scan, calipers, or other accurate method
                  </p>
                </div>
              )}
            </div>

            {/* Manual TDEE Override */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="useManualTDEE"
                  checked={useManualTDEE}
                  onChange={(e) => setUseManualTDEE(e.target.checked)}
                  className="w-5 h-5 text-purple-600"
                />
                <label htmlFor="useManualTDEE" className="font-semibold text-gray-800 cursor-pointer">
                  I know my TDEE
                </label>
              </div>
              {useManualTDEE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TDEE (calories/day)
                  </label>
                  <input
                    type="number"
                    value={manualTDEE}
                    onChange={(e) => setManualTDEE(e.target.value)}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 2400"
                    step="50"
                    min="1000"
                    max="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From metabolic testing or fitness tracker
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals Enhancement - Starting Point & Targets */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <GoalsEnhancement
            currentWeight={weight}
            currentBodyFat={calculatedMetrics?.bodyFatPercentage}
            goalType={goalType}
            onGoalsChange={handleGoalsChange}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Goals & Calculate Metrics'}
          </button>
        </div>

        {/* Results Section */}
        {calculatedMetrics && (
          <div id="results-section">
            <GoalsResults 
              metrics={calculatedMetrics} 
              firstName={userProfile?.first_name || 'there'}
            />
            
            {/* Proceed to Nutrition Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate('/nutrition')}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Save & Proceed to Nutrition →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
