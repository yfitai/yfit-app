import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '../lib/supabase'
import { ChartNoAxesCombined } from 'lucide-react'


/**
 * NutritionProgressCharts Component
 * Displays a COMBINED chart for Fiber, Sugar, and Sodium intake (like Protein/Carbs/Fat)
 */
export default function NutritionProgressCharts({ user, timeRange = '30' }) {
  const [nutritionData, setNutritionData] = useState([])
  const [goals, setGoals] = useState({
    fiber: 25,
    sugar: 50,
    sodium: 2300
  })
  const [loading, setLoading] = useState(true)
  const [chartStartDate, setChartStartDate] = useState(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, timeRange, chartStartDate])

  const loadData = async () => {
    const goalsData = await loadGoals()
    const startDate = goalsData?.chart_start_date || null
    await loadNutritionData(startDate)
  }

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('fiber_goal_g, sugar_goal_g, sodium_goal_mg, chart_start_date')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setGoals({
          fiber: data.fiber_goal_g || 25,
          sugar: data.sugar_goal_g || 50,
          sodium: data.sodium_goal_mg || 2300
        })
        
        // Set chart start date if available
        if (data.chart_start_date) {
          console.log('📅 Nutrition - Chart start date loaded from DB:', data.chart_start_date);
          setChartStartDate(data.chart_start_date)
        } else {
          console.log('📅 Nutrition - No chart start date set');
        }
      }
      
      return data
    } catch (error) {
      console.error('Error loading goals:', error)
      return null
    }
  }

  const loadNutritionData = async (chartStartDateParam = chartStartDate) => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Apply chart_start_date filter if set
      console.log('📊 Nutrition - chartStartDate param:', chartStartDateParam);
      console.log('📊 Nutrition - calculated startDate:', startDate.toISOString());
      
      const effectiveStartDate = chartStartDateParam && new Date(chartStartDateParam) > startDate 
        ? new Date(chartStartDateParam) 
        : startDate;
      
      console.log('📊 Nutrition - effectiveStartDate:', effectiveStartDate.toISOString())

      // Load meals grouped by date
      const { data, error } = await supabase
        .from('meals')
        .select('meal_date, fiber, sugar, sodium')
        .eq('user_id', user.id)
        .gte('meal_date', effectiveStartDate.toISOString().split('T')[0])
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
      const formattedData = Object.values(groupedData).map(item => {
        // Parse date as UTC to prevent timezone shifts
        const date = new Date(item.date + 'T00:00:00Z');
        return {
          ...item,
          dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
          // Round to 1 decimal place
          fiber: parseFloat(item.fiber.toFixed(1)),
          sugar: parseFloat(item.sugar.toFixed(1)),
          sodium: parseFloat(item.sodium.toFixed(1))
        };
      })

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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Micronutrients</h3>
        <div className="text-center py-12">
          <ChartNoAxesCombined className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No nutrition data yet</p>
          <p className="text-sm text-gray-500 mt-2">Start logging meals to see your progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Combined Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Daily Micronutrients</h3>
          <p className="text-sm text-gray-600">Fiber, Sugar & Sodium Tracking</p>
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


    </div>
  )
}

