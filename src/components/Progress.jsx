import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { TrendingUp, TrendingDown, Target, Activity, Heart, Droplet, Moon, Apple, Dumbbell, Calendar, Award, Zap } from 'lucide-react'
import { supabase, getCurrentUser } from '../lib/supabase'
import ProgressPhotos from './Progress/ProgressPhotos'
import WorkoutAnalyticsDashboard from './WorkoutAnalyticsDashboard'

export default function Progress({ user: propUser }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(propUser || null)
  const [timeRange, setTimeRange] = useState('30') // 7, 30, 90, 365 days
  
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
      // For demo mode, use localStorage
      if (userId.startsWith('demo')) {
        const demoData = generateDemoWeightData()
        setWeightData(demoData)
        return
      }

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
    if (userId.startsWith('demo')) {
      const demoData = generateDemoBodyFatData()
      setBodyFatData(demoData)
      return
    }

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
    if (userId.startsWith('demo')) {
      const demoData = generateDemoMeasurementsData()
      setMeasurementsData(demoData)
      return
    }

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
    if (userId.startsWith('demo')) {
      const demoData = generateDemoHealthMetrics()
      setHealthMetricsData(demoData)
      return
    }

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
    if (userId.startsWith('demo')) {
      const demoData = generateDemoNutritionCompliance()
      setNutritionComplianceData(demoData)
      return
    }

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
    if (userId.startsWith('demo')) {
      const demoData = generateDemoFitnessData()
      setFitnessData(demoData)
      return
    }

    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: true })

    if (data) {
      setFitnessData(data.map(d => ({
        date: new Date(d.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: 1,
        duration: d.duration_minutes || 0,
        calories_burned: d.calories_burned || 0
      })))
    }
  }

  const loadGoals = async (userId) => {
    if (userId.startsWith('demo')) {
      setCurrentMetrics({
        weight: 180,
        bodyFat: 22,
        bmi: 26.5
      })
      setGoalMetrics({
        weight: 165,
        bodyFat: 15,
        bmi: 23.0
      })
      return
    }

    const { data: goalsData } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (goalsData) {
      setCurrentMetrics({
        weight: goalsData.current_weight_kg * 2.20462,
        bodyFat: goalsData.current_body_fat,
        bmi: goalsData.current_bmi
      })
      setGoalMetrics({
        weight: goalsData.goal_weight_kg * 2.20462,
        bodyFat: goalsData.goal_body_fat,
        bmi: goalsData.goal_bmi
      })
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

  // Demo data generators
  const generateDemoWeightData = () => {
    const data = []
    const startWeight = 185
    const days = parseInt(timeRange)
    for (let i = 0; i < days; i += Math.ceil(days / 20)) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: startWeight - (i / days) * 15 + (Math.random() - 0.5) * 2
      })
    }
    return data
  }

  const generateDemoBodyFatData = () => {
    const data = []
    const startBF = 25
    const days = parseInt(timeRange)
    for (let i = 0; i < days; i += Math.ceil(days / 20)) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bodyFat: startBF - (i / days) * 5 + (Math.random() - 0.5) * 0.5,
        bmi: 28 - (i / days) * 3 + (Math.random() - 0.5) * 0.3
      })
    }
    return data
  }

  const generateDemoMeasurementsData = () => {
    return [
      { name: 'Chest', current: 42, start: 44, goal: 40 },
      { name: 'Waist', current: 34, start: 38, goal: 32 },
      { name: 'Hips', current: 40, start: 42, goal: 38 },
      { name: 'Thighs', current: 24, start: 26, goal: 22 },
      { name: 'Arms', current: 14, start: 15, goal: 13 }
    ]
  }

  const generateDemoHealthMetrics = () => {
    const data = []
    const days = parseInt(timeRange)
    for (let i = 0; i < days; i += Math.ceil(days / 15)) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        systolic: 125 + (Math.random() - 0.5) * 10,
        diastolic: 80 + (Math.random() - 0.5) * 8,
        glucose: 95 + (Math.random() - 0.5) * 15,
        sleep: 7 + (Math.random() - 0.5) * 2
      })
    }
    return data
  }

  const generateDemoNutritionCompliance = () => {
    const data = []
    const days = parseInt(timeRange)
    for (let i = 0; i < days; i += Math.ceil(days / 20)) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        protein: 140 + (Math.random() - 0.5) * 30,
        carbs: 180 + (Math.random() - 0.5) * 40,
        fat: 50 + (Math.random() - 0.5) * 15,
        proteinTarget: 150,
        carbsTarget: 180,
        fatTarget: 50
      })
    }
    return data
  }

  const generateDemoFitnessData = () => {
    const data = []
    const days = parseInt(timeRange)
    for (let i = 0; i < days; i += 3) {
      if (Math.random() > 0.3) { // 70% workout consistency
        data.push({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          workouts: 1,
          duration: 45 + Math.random() * 30,
          calories_burned: 300 + Math.random() * 200
        })
      }
    }
    return data
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your journey and see how far you've come</p>
        
        {/* Time Range Selector */}
        <div className="mt-4 flex gap-2">
          {['7', '30', '90', '365'].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days === '7' ? '1 Week' : days === '30' ? '1 Month' : days === '90' ? '3 Months' : '1 Year'}
            </button>
          ))}
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
      {measurementsData.length > 0 && (
        <ChartCard title="Body Measurements" icon={<Activity className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={measurementsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="start" fill="#94a3b8" name="Starting" />
              <Bar dataKey="current" fill="#3b82f6" name="Current" />
              <Bar dataKey="goal" fill="#10b981" name="Goal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

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
            {current.toFixed(1)}<span className="text-lg text-gray-600">{unit}</span>
          </div>
          <div className="text-sm text-gray-600">
            Goal: {goal.toFixed(1)}{unit}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${Math.min(Math.abs(progress), 100)}%` }}
          ></div>
        </div>
        
        <div className="text-sm font-medium text-gray-700">
          {remaining.toFixed(1)}{unit} to go
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
