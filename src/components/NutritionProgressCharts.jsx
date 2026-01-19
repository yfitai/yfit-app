import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '../lib/supabase'
import { Apple, Candy, Droplet } from 'lucide-react'

/**
 * NutritionProgressCharts Component
 * Displays a COMBINED chart for Fiber, Sugar, and Sodium intake (like Protein/Carbs/Fat)
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
    if (user) {
      loadNutritionData()
      loadGoals()
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

      // Load meals grouped by date
      const { data, error } = await supabase
        .from('meals')
        .select('meal_date, fiber, sugar, sodium')
        .eq('user_id', user.id)
        .gte('meal_date', startDate.toISOString().split('T')[0])
        .lte('meal_date', endDate.toISOString().split('T')[0])
        .order('meal_date', { ascending: true })

      if (error) {
        console.error('Error loading nutrition data:', error)
        setNutritionData([])
        return
      }

      if (!data || data.length === 0) {
        setNutritionData([])
        return
      }

      // Group by date and sum nutrients
      const groupedData = {}
      data.forEach(meal => {
        const date = meal.meal_date
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            fiber: 0,
            sugar: 0,
            sodium: 0
          }
        }
        groupedData[date].fiber += meal.fiber || 0
        groupedData[date].sugar += meal.sugar || 0
        groupedData[date].sodium += meal.sodium || 0
      })

      // Convert to array and format dates
      const formattedData = Object.values(groupedData).map(item => ({
        ...item,
        dateLabel: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        // Round to 1 decimal place
        fiber: parseFloat(item.fiber.toFixed(1)),
        sugar: parseFloat(item.sugar.toFixed(1)),
        sodium: parseFloat(item.sodium.toFixed(1))
      }))

      setNutritionData(formattedData)
    } catch (error) {
      console.error('Error loading nutrition data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Custom tooltip to show all three nutrients with proper formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}{entry.name.includes('Sodium') ? 'mg' : 'g'}
            </p>
          ))}
        </div>
      )
    }
    return null
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

  // Calculate averages with 1 decimal place
  const avgFiber = (nutritionData.reduce((sum, d) => sum + d.fiber, 0) / nutritionData.length).toFixed(1)
  const avgSugar = (nutritionData.reduce((sum, d) => sum + d.sugar, 0) / nutritionData.length).toFixed(1)
  const avgSodium = (nutritionData.reduce((sum, d) => sum + d.sodium, 0) / nutritionData.length).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Combined Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Micronutrient Progress</h3>
            <p className="text-sm text-gray-600">Fiber, Sugar & Sodium Tracking</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            {['7', '14', '30', '90'].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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

        {/* Combined Chart - All Three Nutrients */}
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={nutritionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis yAxisId="left" label={{ value: 'Grams (g)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Sodium (mg)', angle: 90, position: 'insideRight' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Fiber Line (Green) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="fiber" 
              stroke="#10b981" 
              strokeWidth={2} 
              name="Fiber (g)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {/* Sugar Line (Yellow) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sugar" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              name="Sugar (g)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {/* Sodium Line (Red) - Uses right Y-axis */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="sodium" 
              stroke="#ef4444" 
              strokeWidth={2} 
              name="Sodium (mg)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Goals Reference */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Daily Goals:</p>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Fiber: {goals.fiber}g</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">Sugar Limit: {goals.sugar}g</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Sodium Limit: {goals.sodium}mg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Average Daily Intake ({timeRange} days)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fiber Average */}
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
            <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-green-600 break-words">{avgFiber}g</p>
            <p className="text-xs text-gray-600 mt-1">Avg Fiber</p>
            <p className="text-xs text-gray-500">Goal: {goals.fiber}g</p>
          </div>

          {/* Sugar Average */}
          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Candy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-yellow-600 break-words">{avgSugar}g</p>
            <p className="text-xs text-gray-600 mt-1">Avg Sugar</p>
            <p className="text-xs text-gray-500">Limit: {goals.sugar}g</p>
          </div>

          {/* Sodium Average */}
          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
            <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-red-600 break-words">{avgSodium}mg</p>
            <p className="text-xs text-gray-600 mt-1">Avg Sodium</p>
            <p className="text-xs text-gray-500">Limit: {goals.sodium}mg</p>
          </div>
        </div>
      </div>
    </div>
  )
}

