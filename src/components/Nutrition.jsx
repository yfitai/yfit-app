import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase'
import UnitToggle from './UnitToggle'
import { Target, Plus, Utensils, TrendingUp, Coffee, Sun, Moon, Cookie } from 'lucide-react'

export default function Nutrition({ user: propUser }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(propUser || null)
  const [userProfile, setUserProfile] = useState(null)
  const [tdee, setTdee] = useState(null)
  const [adjustedCalories, setAdjustedCalories] = useState(null)
  const [todaysMeals, setTodaysMeals] = useState([])
  const [totalCalories, setTotalCalories] = useState(0)
  const [showAddMeal, setShowAddMeal] = useState(false)
  
  // Add meal form state
  const [mealType, setMealType] = useState('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Use prop user if provided (for demo mode), otherwise fetch from Supabase
      const currentUser = propUser || await getCurrentUser()
      if (!currentUser) {
        window.location.href = '/'
        return
      }

      setUser(currentUser)
      
      // Only fetch profile if not in demo mode
      if (!currentUser.id.startsWith('demo')) {
        const profile = await getUserProfile(currentUser.id)
        setUserProfile(profile)
      }

      // Check if demo mode
      const isDemoMode = currentUser.id.startsWith('demo')

      if (isDemoMode) {
        // Load from localStorage
        const demoMetrics = localStorage.getItem('yfit_demo_metrics')
        if (demoMetrics) {
          const metrics = JSON.parse(demoMetrics)
          setTdee(metrics.tdee)
          setAdjustedCalories(metrics.adjustedCalories)
        }

        // Load demo meals from localStorage
        const demoMeals = localStorage.getItem('yfit_demo_meals')
        if (demoMeals) {
          const meals = JSON.parse(demoMeals)
          setTodaysMeals(meals)
          const total = meals.reduce((sum, meal) => sum + meal.calories, 0)
          setTotalCalories(total)
        }
      } else {
        // Load TDEE from calculated_metrics
        const { data: metricsData } = await supabase
          .from('calculated_metrics')
          .select('tdee, adjusted_calories')
          .eq('user_id', currentUser.id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single()

        if (metricsData) {
          setTdee(metricsData.tdee)
          setAdjustedCalories(metricsData.adjusted_calories)
        }

        // Load today's meals
        await loadTodaysMeals(currentUser.id)
      }

    } catch (error) {
      console.error('Error loading nutrition data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTodaysMeals = async (userId) => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_date', today)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setTodaysMeals(data)
      const total = data.reduce((sum, meal) => sum + meal.calories, 0)
      setTotalCalories(total)
    }
  }

  const handleAddMeal = async () => {
    if (!user || !foodName || !calories) {
      alert('Please fill in at least food name and calories')
      return
    }

    try {
      const isDemoMode = user.id.startsWith('demo')
      
      const newMeal = {
        id: Date.now().toString(),
        user_id: user.id,
        meal_date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: foodName,
        calories: parseInt(calories),
        protein_g: protein ? parseFloat(protein) : null,
        carbs_g: carbs ? parseFloat(carbs) : null,
        fat_g: fat ? parseFloat(fat) : null,
        created_at: new Date().toISOString()
      }

      if (isDemoMode) {
        // Save to localStorage
        const existingMeals = JSON.parse(localStorage.getItem('yfit_demo_meals') || '[]')
        existingMeals.push(newMeal)
        localStorage.setItem('yfit_demo_meals', JSON.stringify(existingMeals))
        
        setTodaysMeals(existingMeals)
        setTotalCalories(existingMeals.reduce((sum, meal) => sum + meal.calories, 0))
      } else {
        // Save to database
        const { error } = await supabase
          .from('meals')
          .insert({
            user_id: user.id,
            meal_date: new Date().toISOString().split('T')[0],
            meal_type: mealType,
            food_name: foodName,
            calories: parseInt(calories),
            protein_g: protein ? parseFloat(protein) : null,
            carbs_g: carbs ? parseFloat(carbs) : null,
            fat_g: fat ? parseFloat(fat) : null
          })

        if (error) throw error

        await loadTodaysMeals(user.id)
      }

      // Reset form
      setFoodName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      setShowAddMeal(false)

    } catch (error) {
      console.error('Error adding meal:', error)
      alert('Error adding meal: ' + error.message)
    }
  }

  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return

    try {
      const isDemoMode = user.id.startsWith('demo')

      if (isDemoMode) {
        // Delete from localStorage
        const existingMeals = JSON.parse(localStorage.getItem('yfit_demo_meals') || '[]')
        const updatedMeals = existingMeals.filter(meal => meal.id !== mealId)
        localStorage.setItem('yfit_demo_meals', JSON.stringify(updatedMeals))
        
        setTodaysMeals(updatedMeals)
        setTotalCalories(updatedMeals.reduce((sum, meal) => sum + meal.calories, 0))
      } else {
        // Delete from database
        const { error } = await supabase
          .from('meals')
          .delete()
          .eq('id', mealId)

        if (error) throw error

        await loadTodaysMeals(user.id)
      }
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Error deleting meal')
    }
  }

  const getMealIcon = (type) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-5 h-5" />
      case 'lunch': return <Sun className="w-5 h-5" />
      case 'dinner': return <Moon className="w-5 h-5" />
      case 'snack': return <Cookie className="w-5 h-5" />
      default: return <Utensils className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nutrition data...</p>
        </div>
      </div>
    )
  }

  const remainingCalories = adjustedCalories ? adjustedCalories - totalCalories : 0
  const percentConsumed = adjustedCalories ? (totalCalories / adjustedCalories) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Nutrition Tracking
            </h1>
            <p className="text-gray-600 mt-1">Track your daily meals and calories</p>
          </div>
          <UnitToggle />
        </div>

        {/* TDEE / Daily Target Section */}
        {adjustedCalories ? (
          <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl shadow-lg p-6 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Your Daily Calorie Target</h2>
                <p className="text-blue-100 text-sm">
                  Hey {userProfile?.first_name || 'there'}, this is your personalized goal!
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-blue-100 mb-1">Target</div>
                <div className="text-3xl font-bold">{adjustedCalories}</div>
                <div className="text-sm text-blue-100">calories/day</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-blue-100 mb-1">Consumed</div>
                <div className="text-3xl font-bold">{totalCalories}</div>
                <div className="text-sm text-blue-100">calories today</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-blue-100 mb-1">Remaining</div>
                <div className={`text-3xl font-bold ${remainingCalories < 0 ? 'text-red-200' : ''}`}>
                  {remainingCalories}
                </div>
                <div className="text-sm text-blue-100">calories left</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Progress</span>
                <span>{Math.round(percentConsumed)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    percentConsumed > 100 ? 'bg-red-400' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(percentConsumed, 100)}%` }}
                />
              </div>
            </div>

            {tdee && (
              <div className="mt-4 text-sm text-blue-100">
                <strong>TDEE/Maintenance:</strong> {tdee} calories/day
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Set Your Goals First</h3>
                <p className="text-yellow-700 mb-3">
                  To see your daily calorie target, please complete the Goals page first.
                </p>
                <button
                  onClick={() => window.location.href = '/goals'}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Go to Goals Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Meal Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Today's Meals</h2>
          <button
            onClick={() => setShowAddMeal(!showAddMeal)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Meal
          </button>
        </div>

        {/* Add Meal Form */}
        {showAddMeal && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Log a Meal</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Type *
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Name *
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chicken Breast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories *
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMeal}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Add Meal
              </button>
              <button
                onClick={() => setShowAddMeal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Meals List */}
        <div className="space-y-4">
          {todaysMeals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No meals logged yet today</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add Meal" to start tracking</p>
            </div>
          ) : (
            todaysMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      {getMealIcon(meal.meal_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{meal.food_name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                          {meal.meal_type}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">{meal.calories} cal</span>
                        {meal.protein_g && <span>Protein: {meal.protein_g}g</span>}
                        {meal.carbs_g && <span>Carbs: {meal.carbs_g}g</span>}
                        {meal.fat_g && <span>Fat: {meal.fat_g}g</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
