import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '../lib/supabase'
import { Apple, Candy, Droplet } from 'lucide-react'

/**
 * NutritionProgressCharts Component
 * Displays historical charts for Fiber, Sugar, and Sodium intake
 */
export default function NutritionProgressCharts({ user }) {
  const [nutritionData, setNutritionData] = useState([])
  const [goals, setGoals] = useState({
    fiber: 25,
    sugar: 50,
    sodium: 2300
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    if (user && !user.id.startsWith('demo')) {
      loadNutritionData()
      loadGoals()
    } else if (user && user.id.startsWith('demo')) {
      loadDemoData()
    }
  }, [user, timeRange])

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('fiber_goal_g, sugar_goal_g, sodium_goal_mg')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setGoals({
          fiber: data.fiber_goal_g || 25,
          sugar: data.sugar_goal_g || 50,
          sodium: data.sodium_goal_mg || 2300
        })
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    }
  }

  const loadNutritionData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Load nutrition entries grouped by date
      const { data, error } = await supabase
        .from('nutrition_entries')
        .select('entry_date, fiber, sugar, sodium')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: true })

      if (error) throw error

      // Group by date and sum nutrients
      const groupedData = {}
      data.forEach(entry => {
        const date = entry.entry_date
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            fiber: 0,
            sugar: 0,
            sodium: 0
          }
        }
        groupedData[date].fiber += entry.fiber || 0
        groupedData[date].sugar += entry.sugar || 0
        groupedData[date].sodium += entry.sodium || 0
      })

      // Convert to array and format dates
      const formattedData = Object.values(groupedData).map(item => ({
        ...item,
        dateLabel: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      setNutritionData(formattedData)
    } catch (error) {
      console.error('Error loading nutrition data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    // Generate demo data for the last 30 days
    const demoData = []
    const today = new Date()
    
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      demoData.push({
        date: date.toISOString().split('T')[0],
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fiber: Math.round(15 + Math.random() * 20), // 15-35g
        sugar: Math.round(30 + Math.random() * 40), // 30-70g
        sodium: Math.round(1500 + Math.random() * 1500) // 1500-3000mg
      })
    }
    
    setNutritionData(demoData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (nutritionData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrition Progress</h3>
        <div className="text-center py-12">
          <Apple className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No nutrition data yet</p>
          <p className="text-sm text-gray-500 mt-2">Start logging meals to see your progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Nutrition Progress</h3>
          <div className="flex gap-2">
            {['7', '14', '30', '90'].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days === '7' ? '1 Week' : days === '14' ? '2 Weeks' : days === '30' ? '1 Month' : '3 Months'}
              </button>
            ))}
          </div>
        </div>

        {/* Fiber Chart */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-5 h-5 text-green-600" />
            <h4 className="text-md font-semibold text-gray-800">Fiber Intake</h4>
            <span className="text-sm text-gray-600">(Goal: {goals.fiber}g)</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={nutritionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={goals.fiber} stroke="#10b981" strokeDasharray="3 3" label="Goal" />
              <Line type="monotone" dataKey="fiber" stroke="#10b981" strokeWidth={2} name="Fiber (g)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sugar Chart */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Candy className="w-5 h-5 text-yellow-600" />
            <h4 className="text-md font-semibold text-gray-800">Sugar Intake</h4>
            <span className="text-sm text-gray-600">(Limit: {goals.sugar}g)</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={nutritionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={goals.sugar} stroke="#f59e0b" strokeDasharray="3 3" label="Limit" />
              <Line type="monotone" dataKey="sugar" stroke="#f59e0b" strokeWidth={2} name="Sugar (g)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sodium Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-5 h-5 text-red-600" />
            <h4 className="text-md font-semibold text-gray-800">Sodium Intake</h4>
            <span className="text-sm text-gray-600">(Limit: {goals.sodium}mg)</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={nutritionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={goals.sodium} stroke="#ef4444" strokeDasharray="3 3" label="Limit" />
              <Line type="monotone" dataKey="sodium" stroke="#ef4444" strokeWidth={2} name="Sodium (mg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Average Daily Intake ({timeRange} days)</h4>
        <div className="grid grid-cols-3 gap-4">
          {/* Fiber Average */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Apple className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {Math.round(nutritionData.reduce((sum, d) => sum + d.fiber, 0) / nutritionData.length)}g
            </p>
            <p className="text-xs text-gray-600 mt-1">Avg Fiber</p>
            <p className="text-xs text-gray-500">Goal: {goals.fiber}g</p>
          </div>

          {/* Sugar Average */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Candy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">
              {Math.round(nutritionData.reduce((sum, d) => sum + d.sugar, 0) / nutritionData.length)}g
            </p>
            <p className="text-xs text-gray-600 mt-1">Avg Sugar</p>
            <p className="text-xs text-gray-500">Limit: {goals.sugar}g</p>
          </div>

          {/* Sodium Average */}
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <Droplet className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {Math.round(nutritionData.reduce((sum, d) => sum + d.sodium, 0) / nutritionData.length)}mg
            </p>
            <p className="text-xs text-gray-600 mt-1">Avg Sodium</p>
            <p className="text-xs text-gray-500">Limit: {goals.sodium}mg</p>
          </div>
        </div>
      </div>
    </div>
  )
}

