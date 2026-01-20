import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { TrendingUp, TrendingDown, Target, Activity, Heart, Droplet, Moon, Apple, Dumbbell, Calendar, Award, Zap } from 'lucide-react'
import { supabase, getCurrentUser } from '../lib/supabase'
import ProgressPhotos from './Progress/ProgressPhotos'
import WorkoutAnalyticsDashboard from './WorkoutAnalyticsDashboard'
import FormAnalysisHistory from './FormAnalysisHistory'
import NutritionProgressCharts from './NutritionProgressCharts'
import ChartSettings from './ChartSettings'

export default function Progress({ user: propUser }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(propUser || null)
  const [timeRange, setTimeRange] = useState('30') // 7, 30, 90, 365 days
  const [measurementCategory, setMeasurementCategory] = useState('torso') // torso, arms, core, lower
  
  // Progress data
  const [weightData, setWeightData] = useState([])
  const [bodyFatData, setBodyFatData] = useState([])
  const [measurementsData, setMeasurementsData] = useState([])
  const [healthMetricsData, setHealthMetricsData] = useState([])
  const [nutritionComplianceData, setNutritionComplianceData] = useState([])
  const [fitnessData, setFitnessData] = useState([])
  
  // Current vs Goal
  const [currentMetrics, setCurrentMetrics] = useState(null)
  const [goalMetrics, setGoalMetrics] = useState(null)
  
  // Predictive analytics
  const [predictions, setPredictions] = useState(null)

  useEffect(() => {
    loadProgressData()
  }, [timeRange])

  const loadProgressData = async () => {
    setLoading(true)
    try {
      const currentUser = propUser || await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        
        // Try to load real data, fall back to empty arrays
        await Promise.all([
          loadWeightProgress(currentUser.id),
          loadBodyCompositionProgress(currentUser.id),
          loadMeasurementsProgress(currentUser.id),
          loadHealthMetrics(currentUser.id),
          loadNutritionCompliance(currentUser.id),
          loadFitnessProgress(currentUser.id),
          loadGoals(currentUser.id)
        ])
        
        // Calculate predictions if we have data
        if (weightData.length > 0) {
          calculatePredictions()
        }
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWeightProgress = async (userId) => {
    try {
      // Load from Supabase
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: true })

      if (error) {
        console.log('Weight logs table not available')
        setWeightData([])
        return
      }

      if (data && data.length > 0) {
        setWeightData(data.map(d => ({
          date: new Date(d.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: d.weight_kg * 2.20462,
          timestamp: d.logged_at
        })))
      } else {
        setWeightData([])
      }
    } catch (error) {
      console.log('Error loading weight data')
      setWeightData([])
    }
  }

  const loadBodyCompositionProgress = async (userId) => {
    const { data } = await supabase
      .from('body_composition_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: true })

    if (data) {
      setBodyFatData(data.map(d => ({
        date: new Date(d.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bodyFat: d.body_fat_percentage,
        bmi: d.bmi,
        timestamp: d.logged_at
      })))
    }
  }

  const loadMeasurementsProgress = async (userId) => {
    const { data } = await supabase
      .from('body_measurements_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: true })

    if (data) {
      setMeasurementsData(data)
    }
  }

  const loadHealthMetrics = async (userId) => {
    const { data } = await supabase
      .from('health_metrics_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: true })

    if (data) {
      setHealthMetricsData(data.map(d => ({
        date: new Date(d.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        systolic: d.blood_pressure_systolic,
        diastolic: d.blood_pressure_diastolic,
        glucose: d.glucose_mg_dl,
        sleep: d.sleep_hours,
        timestamp: d.logged_at
      })))
    }
  }

  const loadNutritionCompliance = async (userId) => {
    // Calculate compliance from meal logs
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())

    if (data) {
      // Group by date and calculate compliance
      const complianceByDate = {}
      data.forEach(meal => {
        const date = new Date(meal.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!complianceByDate[date]) {
          complianceByDate[date] = { date, protein: 0, carbs: 0, fat: 0, calories: 0 }
        }
        complianceByDate[date].protein += meal.protein || 0
        complianceByDate[date].carbs += meal.carbs || 0
        complianceByDate[date].fat += meal.fat || 0
        complianceByDate[date].calories += meal.calories || 0
      })
      
      setNutritionComplianceData(Object.values(complianceByDate))
    }
  }

  const loadFitnessProgress = async (userId) => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('start_time', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: true })

    if (data) {
      setFitnessData(data.map(d => ({
        date: new Date(d.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: 1,
        duration: Math.round((new Date(d.end_time) - new Date(d.start_time)) / 60000) || 0,
        calories_burned: Math.round((d.total_volume || 0) * 0.05) || 0 // Rough estimate
      })))
    }
  }

const loadGoals = async (userId) => {
  console.log('📊 Loading goals and latest measurements for user:', userId)
  const { data: goalsData } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (goalsData) {
    // Get latest weight and body fat from daily_logs
    const { data: measurementData, error: measurementError } = await supabase
      .from('daily_logs')
      .select('weight_kg, body_fat_percent, logged_at')
      .eq('user_id', userId)
      .not('weight_kg', 'is', null)
      .order('logged_at', { ascending: false })
      .limit(1)
    
    const latestMeasurement = measurementData && measurementData.length > 0 ? {
      weight_kg: measurementData[0].weight_kg,
      body_fat_percentage: measurementData[0].body_fat_percent,
      measurement_date: measurementData[0].logged_at
    } : null
    
    console.log('Latest measurement query result:', { latestMeasurement, measurementError })
    console.log('Goals data:', { weight: goalsData.weight_kg, bf: goalsData.starting_body_fat_percentage })
    
    // Use latest measurement if available, otherwise fall back to starting values
    const currentWeight = latestMeasurement?.weight_kg || goalsData.weight_kg
    const currentBodyFat = latestMeasurement?.body_fat_percentage || goalsData.starting_body_fat_percentage
    
    console.log('Final current values:', { currentWeight, currentBodyFat })
    
    // Calculate current BMI from height and current weight
    const currentBMI = goalsData.height_cm && currentWeight
      ? (currentWeight / Math.pow(goalsData.height_cm / 100, 2))
      : null
    
    // Calculate goal BMI from height and target weight
    const goalBMI = goalsData.height_cm && goalsData.target_weight_kg
      ? (goalsData.target_weight_kg / Math.pow(goalsData.height_cm / 100, 2))
      : null

    setCurrentMetrics({
      weight: currentWeight ? currentWeight * 2.20462 : null,
      bodyFat: currentBodyFat || null,
      bmi: currentBMI
    })
      setGoalMetrics({
      weight: goalsData.target_weight_kg ? goalsData.target_weight_kg * 2.20462 : null,
      bodyFat: goalsData.target_body_fat_percentage || null,
      bmi: goalBMI
    })
    
    console.log('Current metrics set:', {
      weight: goalsData.weight_kg ? goalsData.weight_kg * 2.20462 : null,
      bodyFat: goalsData.starting_body_fat_percentage || null,
      bmi: currentBMI
    })
    console.log('Goal metrics set:', {
      weight: goalsData.target_weight_kg ? goalsData.target_weight_kg * 2.20462 : null,
      bodyFat: goalsData.target_body_fat_percentage || null,
      bmi: goalBMI
    })
    console.log('Goals data from database:', goalsData)
  }
}

const calculatePredictions = () => {

    if (weightData.length < 2) return

    // Calculate trend
    const recentWeights = weightData.slice(-7) // Last 7 data points
    const weightChange = recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight
    const daysSpan = 7
    const weeklyRate = (weightChange / daysSpan) * 7

    // Project to goal
    if (goalMetrics && currentMetrics) {
      const weightToLose = currentMetrics.weight - goalMetrics.weight
      const weeksToGoal = Math.abs(weightToLose / weeklyRate)
      const projectedDate = new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000)

      setPredictions({
        weeklyRate: weeklyRate.toFixed(2),
        weeksToGoal: Math.ceil(weeksToGoal),
        projectedDate: projectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        onTrack: Math.abs(weeklyRate) >= 0.5 && Math.abs(weeklyRate) <= 2
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8 overflow-x-hidden w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your journey and see how far you've come</p>
        
        {/* Time Range Selector & Settings */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="grid grid-cols-2 sm:flex gap-2 flex-1">
            {['7', '30', '90', '365'].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  timeRange === days
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days === '7' ? '1 Week' : days === '30' ? '1 Month' : days === '90' ? '3 Months' : '1 Year'}
              </button>
            ))}
          </div>
          <ChartSettings userId={user?.id} onUpdate={loadProgressData} />
        </div>
      </div>

      {/* Overview Cards */}
      {currentMetrics && goalMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <OverviewCard
            title="Weight"
            current={currentMetrics.weight}
            goal={goalMetrics.weight}
            unit="lbs"
            icon={<TrendingDown className="w-6 h-6" />}
            color="blue"
          />
          <OverviewCard
            title="Body Fat"
            current={currentMetrics.bodyFat}
            goal={goalMetrics.bodyFat}
            unit="%"
            icon={<Target className="w-6 h-6" />}
            color="green"
          />
          <OverviewCard
            title="BMI"
            current={currentMetrics.bmi}
            goal={goalMetrics.bmi}
            unit=""
            icon={<Activity className="w-6 h-6" />}
            color="purple"
          />
        </div>
      )}

      {/* Predictive Analytics Banner */}
      {predictions && (
        <div className={`mb-8 p-6 rounded-xl ${predictions.onTrack ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
          <div className="flex items-start gap-4">
            <Zap className={`w-8 h-8 ${predictions.onTrack ? 'text-green-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {predictions.onTrack ? '🎯 You\'re On Track!' : '⚠️ Adjust Your Pace'}
              </h3>
              <p className="text-gray-700 mb-2">
                At your current pace of <strong>{Math.abs(parseFloat(predictions.weeklyRate))} lbs/week</strong>, 
                you'll reach your goal weight in approximately <strong>{predictions.weeksToGoal} weeks</strong> 
                (by <strong>{predictions.projectedDate}</strong>).
              </p>
              {!predictions.onTrack && (
                <p className="text-sm text-gray-600">
                  Tip: Aim for 0.5-2 lbs per week for sustainable, healthy weight loss.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weight Progress Chart */}
      {weightData.length > 0 && (
        <ChartCard title="Weight Progress" icon={<TrendingDown className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} name="Weight (lbs)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Body Composition Chart */}
      {bodyFatData.length > 0 && (
        <ChartCard title="Body Composition" icon={<Target className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bodyFat" stroke="#10b981" strokeWidth={2} name="Body Fat %" />
              <Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#8b5cf6" strokeWidth={2} name="BMI" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Body Measurements */}
      {measurementsData.length > 0 && (() => {
        const categories = {
          torso: { label: 'Torso', measurements: ['Neck', 'Shoulders', 'Chest'] },
          arms: { label: 'Arms', measurements: ['Biceps', 'Forearms'] },
          core: { label: 'Core', measurements: ['Waist', 'Hips'] },
          lower: { label: 'Lower Body', measurements: ['Thighs', 'Calves', 'Ankles'] }
        }
        
        const filteredData = measurementsData.filter(m => 
          categories[measurementCategory].measurements.includes(m.name)
        )
        
        return (
          <ChartCard title="Body Measurements" icon={<Activity className="w-5 h-5" />}>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {Object.entries(categories).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setMeasurementCategory(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    measurementCategory === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* Chart */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={filteredData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={0}
                  textAnchor="middle"
                  interval={0}
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="start" fill="#94a3b8" name="Starting" />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="goal" fill="#10b981" name="Goal" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      })()}

      {/* Health Metrics Grid */}
      {healthMetricsData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Blood Pressure */}
          <ChartCard title="Blood Pressure" icon={<Heart className="w-5 h-5 text-red-500" />}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={healthMetricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Glucose */}
          <ChartCard title="Blood Glucose" icon={<Droplet className="w-5 h-5 text-blue-500" />}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={healthMetricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="glucose" stroke="#3b82f6" fill="#93c5fd" name="Glucose (mg/dL)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sleep */}
          <ChartCard title="Sleep Quality" icon={<Moon className="w-5 h-5 text-indigo-500" />}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={healthMetricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sleep" fill="#6366f1" name="Hours of Sleep" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Nutrition Compliance */}
          {nutritionComplianceData.length > 0 && (
            <ChartCard title="Nutrition Compliance" icon={<Apple className="w-5 h-5 text-green-500" />}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={nutritionComplianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2} name="Protein (g)" />
                  <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} name="Carbs (g)" />
                  <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2} name="Fat (g)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Fitness Progress */}
      {fitnessData.length > 0 && (
        <ChartCard title="Fitness Activity" icon={<Dumbbell className="w-5 h-5 text-orange-500" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fitnessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="duration" fill="#f97316" name="Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Workout Analytics Dashboard */}
      {user && <WorkoutAnalyticsDashboard userId={user.id} />}

      {/* Form Analysis History */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {user && <FormAnalysisHistory user={user} />}
      </div>
      
      {/* Nutrition Progress Charts */}
      <div className="mt-8">
        {user && <NutritionProgressCharts user={user} />}
      </div>
      
      {/* Progress Photos */}
      {user && <ProgressPhotos userId={user.id} />}
    </div>
  )
}

// Overview Card Component
function OverviewCard({ title, current, goal, unit, icon, color }) {
  const progress = ((current - goal) / current) * 100
  const remaining = Math.abs(current - goal)
  const isImproving = current > goal // Assuming lower is better (weight, BF, BMI)

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  return (
    <div className={`p-6 rounded-xl border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
        {isImproving ? (
          <TrendingDown className="w-5 h-5 text-green-600" />
        ) : (
          <TrendingUp className="w-5 h-5 text-red-600" />
        )}
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {current != null ? current.toFixed(1) : '--'}<span className="text-lg text-gray-600">{unit}</span>
          </div>
          <div className="text-sm text-gray-600">
            Goal: {goal != null ? goal.toFixed(1) : '--'}{unit}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${progress != null ? Math.min(Math.abs(progress), 100) : 0}%` }}
          ></div>
        </div>
        
        <div className="text-sm font-medium text-gray-700">
          {remaining != null ? remaining.toFixed(1) : '--'}{unit} to go
        </div>
      </div>
    </div>
  )
}

// Chart Card Component
function ChartCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}
