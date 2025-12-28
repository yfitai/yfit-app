import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase'
import { updateRecentFood, addFavoriteFood, removeFavoriteFood } from '../lib/foodDatabase'
import UnitToggle from './UnitToggle'
import FoodSearch from './FoodSearch'
import BarcodeScanner from './BarcodeScanner'
import MacroSettings from './MacroSettings'
import NutritionTemplateModal from './Nutrition/NutritionTemplateModal'
import SaveNutritionTemplateModal from './Nutrition/SaveNutritionTemplateModal'
import { Target, Plus, Scan, Utensils, TrendingUp, Coffee, Sun, Moon, Cookie, Star, Trash2, Settings, BookmarkPlus } from 'lucide-react'
import NutrientProgressCard from './NutrientProgressCard'

export default function NutritionEnhanced({ user: propUser }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(propUser || null)
  const [userProfile, setUserProfile] = useState(null)
  const [tdee, setTdee] = useState(null)
  const [adjustedCalories, setAdjustedCalories] = useState(null)
  const [leanBodyMass, setLeanBodyMass] = useState(null)
  const [goalType, setGoalType] = useState(null)
  const [todaysMeals, setTodaysMeals] = useState([])
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [totalFat, setTotalFat] = useState(0)
  const [totalFiber, setTotalFiber] = useState(0)
  const [totalSugar, setTotalSugar] = useState(0)
  const [totalSodium, setTotalSodium] = useState(0)
  
  // Macro targets from MacroSettings
  const [proteinTarget, setProteinTarget] = useState(null)
  const [carbsTarget, setCarbsTarget] = useState(null)
  const [fatTarget, setFatTarget] = useState(null)
  
  // Nutrition goals from user_goals
  const [fiberGoal, setFiberGoal] = useState(25) // default 25g
  const [sugarGoal, setSugarGoal] = useState(50) // default 50g
  const [sodiumGoal, setSodiumGoal] = useState(2300) // default 2300mg
  
  // UI state
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showServingSelector, setShowServingSelector] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  
  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateMealType, setTemplateMealType] = useState('breakfast')
  
  // Serving size state
  const [servingQuantity, setServingQuantity] = useState(1)
  const [servingUnit, setServingUnit] = useState('serving')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentUser = propUser || await getCurrentUser()
      if (!currentUser) {
        window.location.href = '/'
        return
      }

      setUser(currentUser)
      
      const isDemoMode = currentUser.id.startsWith('demo')

      if (!isDemoMode) {
        const profile = await getUserProfile(currentUser.id)
        setUserProfile(profile)
      }

      if (isDemoMode) {
        // Load from localStorage
        const demoMetrics = localStorage.getItem('yfit_demo_metrics')
        if (demoMetrics) {
          const metrics = JSON.parse(demoMetrics)
          setTdee(metrics.tdee)
          setAdjustedCalories(metrics.adjustedCalories)
          setLeanBodyMass(metrics.leanBodyMass) // Load lean body mass for MacroSettings
          console.log('Loaded demo metrics:', metrics)
        } else {
          // Provide default demo values if Goals page not completed
          console.log('No demo metrics found - using defaults')
          setTdee(2000)
          setAdjustedCalories(2000)
          setLeanBodyMass(60) // ~132 lbs
        }

        const demoMeals = localStorage.getItem('yfit_demo_meals')
        if (demoMeals) {
          const meals = JSON.parse(demoMeals)
          setTodaysMeals(meals)
          calculateTotals(meals)
        }
      } else {
        // Load TDEE and lean body mass from calculated_metrics
        const { data: metricsData } = await supabase
          .from('calculated_metrics')
          .select('tdee, adjusted_calories, lean_body_mass_kg')
          .eq('user_id', currentUser.id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single()

        if (metricsData) {
          console.log('Loaded metrics:', metricsData)
          setTdee(metricsData.tdee)
          setAdjustedCalories(metricsData.adjusted_calories)
          setLeanBodyMass(metricsData.lean_body_mass_kg)
        } else {
          console.log('No metrics data found - user needs to complete Goals page')
        }

        // Load goal type and nutrition goals from user_goals
        const { data: goalsData } = await supabase
          .from('user_goals')
          .select('goal_type, fiber_goal_g, sugar_goal_g, sodium_goal_mg')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (goalsData) {
          setGoalType(goalsData.goal_type)
          setFiberGoal(goalsData.fiber_goal_g || 25)
          setSugarGoal(goalsData.sugar_goal_g || 50)
          setSodiumGoal(goalsData.sodium_goal_mg || 2300)
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
      calculateTotals(data)
    }
  }

  const calculateTotals = (meals) => {
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
       protein: acc.protein + (meal.protein_g || meal.protein || 0),
      carbs: acc.carbs + (meal.carbs_g || meal.carbs || 0),
      fat: acc.fat + (meal.fat_g || meal.fat || 0),
      fiber: acc.fiber + (meal.fiber || 0),
      sugar: acc.sugar + (meal.sugar || 0),
      sodium: acc.sodium + (meal.sodium || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })

    setTotalCalories(totals.calories)
    setTotalProtein(totals.protein)
    setTotalCarbs(totals.carbs)
    setTotalFat(totals.fat)
    setTotalFiber(totals.fiber)
    setTotalSugar(totals.sugar)
    setTotalSodium(totals.sodium)
  }

  const handleOpenFoodSearch = (mealType) => {
    setSelectedMealType(mealType)
    setShowFoodSearch(true)
  }

  const handleOpenBarcodeScanner = (mealType) => {
    setSelectedMealType(mealType)
    setShowBarcodeScanner(true)
  }

  const handleFoodSelected = (food) => {
    setSelectedFood(food)
    setServingQuantity(1)
    setServingUnit(food.serving_unit || 'serving')
    setShowFoodSearch(false)
    setShowBarcodeScanner(false)
    setShowServingSelector(true)
  }

  const handleLogFood = async () => {
    if (!selectedFood) return

    const isDemoMode = user.id.startsWith('demo')

    // Calculate nutrition based on serving quantity and unit
    // Get the unit conversion (same logic as ServingSizeSelector)
    const isLiquid = selectedFood.foodType === 'liquid'
    const units = isLiquid ? [
      { value: 'ml', label: 'Milliliters (ml)', toGrams: 1 },
      { value: 'fl_oz', label: 'Fluid Ounces (fl oz)', toGrams: 29.57 },
      { value: 'cup', label: 'Cups', toGrams: 240 },
      { value: 'tbsp', label: 'Tablespoons (tbsp)', toGrams: 15 },
      { value: 'tsp', label: 'Teaspoons (tsp)', toGrams: 5 },
      { value: 'serving', label: 'Serving', toGrams: selectedFood.servingGrams || 100 }
    ] : [
      { value: 'g', label: 'Grams (g)', toGrams: 1 },
      { value: 'oz', label: 'Ounces (oz)', toGrams: 28.35 },
      { value: 'lb', label: 'Pounds (lb)', toGrams: 453.59 },
      { value: 'serving', label: 'Serving', toGrams: selectedFood.servingGrams || 100 }
    ]
    
    const selectedUnit = units.find(u => u.value === servingUnit) || units[0]
    const totalGrams = (servingQuantity || 0) * selectedUnit.toGrams
    const multiplier = totalGrams / 100 // All nutrition is per 100g
    
    const mealData = {
      user_id: user.id,
      meal_type: selectedMealType,
      meal_date: new Date().toISOString().split('T')[0],
      food_name: selectedFood.name,
      calories: Math.round((selectedFood.calories || 0) * multiplier),
      protein_g: Math.round((selectedFood.protein || 0) * multiplier),
      carbs_g: Math.round((selectedFood.carbs || 0) * multiplier),
      fat_g: Math.round((selectedFood.fat || 0) * multiplier),
      fiber: Math.round((selectedFood.fiber || 0) * multiplier),
      sugar: Math.round((selectedFood.sugar || 0) * multiplier),
      sodium: Math.round((selectedFood.sodium || 0) * multiplier),
      food_id: selectedFood.id,
      serving_quantity: servingQuantity,
      serving_unit: servingUnit,
      created_at: new Date().toISOString()
    }


    if (isDemoMode) {
      // Save to localStorage
      const demoMeals = localStorage.getItem('yfit_demo_meals')
      const meals = demoMeals ? JSON.parse(demoMeals) : []
      meals.push({ ...mealData, id: Date.now().toString() })
      localStorage.setItem('yfit_demo_meals', JSON.stringify(meals))
      setTodaysMeals(meals)
      calculateTotals(meals)

      // Update recent foods in localStorage
      const recentFoods = localStorage.getItem('yfit_recent_foods')
      const recent = recentFoods ? JSON.parse(recentFoods) : []
      const existingIndex = recent.findIndex(f => f.id === selectedFood.id)
      if (existingIndex >= 0) {
        recent.splice(existingIndex, 1)
      }
      recent.unshift(selectedFood)
      localStorage.setItem('yfit_recent_foods', JSON.stringify(recent.slice(0, 50)))
    } else {
      // Save to database
      const { error } = await supabase
        .from('meals')
        .insert(mealData)

      if (error) {
     console.error('Error logging food:', JSON.stringify(error, null, 2))
     console.error('Error message:', error.message)
     console.error('Error details:', error.details)
     console.error('Error hint:', error.hint)
        alert('Error logging food. Please try again.')
        return
      }

      // Update recent foods
      if (selectedFood.id) {
        await updateRecentFood(user.id, selectedFood.id)
      }

      // Reload meals
      await loadTodaysMeals(user.id)
    }

    // Close serving selector
    setShowServingSelector(false)
    setSelectedFood(null)
  }

  const handleDeleteMeal = async (mealId) => {
    const isDemoMode = user.id.startsWith('demo')

    if (isDemoMode) {
      const demoMeals = localStorage.getItem('yfit_demo_meals')
      const meals = demoMeals ? JSON.parse(demoMeals) : []
      const updated = meals.filter(m => m.id !== mealId)
      localStorage.setItem('yfit_demo_meals', JSON.stringify(updated))
      setTodaysMeals(updated)
      calculateTotals(updated)
    } else {
      const { error} = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)

      if (error) {
        console.error('Error deleting meal:', error)
        return
      }

      await loadTodaysMeals(user.id)
    }
  }

  // Handle template quick-add
  const handleUseTemplate = (mealType) => {
    setTemplateMealType(mealType)
    setShowTemplateModal(true)
  }

  const handleSelectTemplate = async (template) => {
    console.log('[Nutrition] Applying template:', template)
    
    // Add each meal from the template
    if (template.meals && template.meals.length > 0) {
      for (const meal of template.meals) {
        await addMealFromTemplate(meal, templateMealType)
      }
    }
  }

  const addMealFromTemplate = async (templateMeal, mealType) => {
    const isDemoMode = user.id.startsWith('demo')
    
    const mealData = {
      id: isDemoMode ? `demo-meal-${Date.now()}-${Math.random()}` : undefined,
      user_id: user.id,
      meal_type: mealType,
      food_name: templateMeal.food_name,
      brand: templateMeal.brand,
      calories: templateMeal.calories,
      protein: templateMeal.protein,
      carbs: templateMeal.carbs,
      fat: templateMeal.fat,
      fiber: templateMeal.fiber || 0,
      sugar: templateMeal.sugar || 0,
      sodium: templateMeal.sodium || 0,
      serving_quantity: templateMeal.serving_quantity,
      serving_unit: templateMeal.serving_unit,
      logged_at: new Date().toISOString()
    }

    if (isDemoMode) {
      const demoMeals = localStorage.getItem('yfit_demo_meals')
      const meals = demoMeals ? JSON.parse(demoMeals) : []
      meals.push(mealData)
      localStorage.setItem('yfit_demo_meals', JSON.stringify(meals))
      setTodaysMeals(meals)
      calculateTotals(meals)
    } else {
      const { error } = await supabase
        .from('meals')
        .insert([mealData])

      if (error) {
        console.error('Error adding meal from template:', error)
        return
      }

      await loadTodaysMeals(user.id)
    }
  }

  // Handle save as template
  const handleSaveAsTemplate = (mealType) => {
    setTemplateMealType(mealType)
    setShowSaveTemplateModal(true)
  }

  const handleSaveTemplate = async (templateName) => {
    // Get meals for this meal type
    const mealsForType = todaysMeals.filter(m => m.meal_type === templateMealType)
    
    if (mealsForType.length === 0) {
      alert('No meals to save as template')
      return
    }

    // Convert nutrition meal type to planner meal type
    const mealTypeMap = {
      breakfast: 'breakfast',
      lunch: 'lunch',
      dinner: 'dinner',
      snacks: 'snack'
    }
    const plannerMealType = mealTypeMap[templateMealType] || templateMealType

    // Calculate totals
    const totalCalories = mealsForType.reduce((sum, m) => sum + (m.calories || 0), 0)
    const totalProtein = mealsForType.reduce((sum, m) => sum + (m.protein || 0), 0)
    const totalCarbs = mealsForType.reduce((sum, m) => sum + (m.carbs || 0), 0)
    const totalFat = mealsForType.reduce((sum, m) => sum + (m.fat || 0), 0)

    const template = {
      id: `template-${Date.now()}-${Math.random()}`,
      name: templateName,
      meal_type: plannerMealType,
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      meals: mealsForType.map(m => ({
        food_name: m.food_name,
        brand: m.brand,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        fiber: m.fiber,
        sugar: m.sugar,
        sodium: m.sodium,
        serving_quantity: m.serving_quantity,
        serving_unit: m.serving_unit
      })),
      use_count: 0,
      created_at: new Date().toISOString()
    }

    const isDemoMode = user.id.startsWith('demo')
    
    if (isDemoMode) {
      const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
      demoTemplates.push(template)
      localStorage.setItem('yfit_demo_meal_templates', JSON.stringify(demoTemplates))
      console.log('[Nutrition] Saved template to localStorage:', template)
    } else {
      // TODO: Save to Supabase
      console.log('[Nutrition] Would save template to Supabase:', template)
    }

    alert(`Template "${templateName}" saved successfully!`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading nutrition data...</p>
        </div>
      </div>
    )
  }

  const targetCalories = adjustedCalories || tdee || 2000
  const remainingCalories = targetCalories - totalCalories
  const calorieProgress = Math.min((totalCalories / targetCalories) * 100, 100)

  // Use macro targets from MacroSettings if available, otherwise use default 30/40/30 split
  const proteinGoal = proteinTarget || ((targetCalories * 0.30) / 4) // 4 cal per gram
  const carbsGoal = carbsTarget || ((targetCalories * 0.40) / 4)
  const fatGoal = fatTarget || ((targetCalories * 0.30) / 9) // 9 cal per gram

  const proteinProgress = Math.min((totalProtein / proteinGoal) * 100, 100)
  const carbsProgress = Math.min((totalCarbs / carbsGoal) * 100, 100)
  const fatProgress = Math.min((totalFat / fatGoal) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-2 sm:px-4 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Nutrition Tracking
            </h1>
            <p className="text-gray-600 mt-1">
              Track your meals and macros
            </p>
          </div>
          <UnitToggle />
        </div>

        {/* Daily Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Today's Summary</h2>
            <Target className="w-6 h-6 text-blue-500" />
          </div>

          {/* Calorie Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Daily Calorie Goal</span>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(totalCalories)} / {Math.round(targetCalories)} kcal
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  calorieProgress >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
                }`}
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-600">Consumed: {Math.round(totalCalories)} kcal</span>
              <span className={remainingCalories >= 0 ? 'text-green-600' : 'text-red-600'}>
                {remainingCalories >= 0 ? 'Remaining' : 'Over'}: {Math.abs(Math.round(remainingCalories))} kcal
              </span>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="space-y-3">
            {/* Protein */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Protein</span>
                <span className="text-sm font-semibold text-blue-600">
                  {Math.round(totalProtein)}g / {Math.round(proteinGoal)}g ({Math.round(proteinProgress)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Carbs</span>
                <span className="text-sm font-semibold text-orange-600">
                  {Math.round(totalCarbs)}g / {Math.round(carbsGoal)}g ({Math.round(carbsProgress)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${carbsProgress}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Fat</span>
                <span className="text-sm font-semibold text-purple-600">
                  {Math.round(totalFat)}g / {Math.round(fatGoal)}g ({Math.round(fatProgress)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${fatProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Micronutrients with Progress Tracking */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Nutrition Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fiber */}
              <NutrientProgressCard
                name="Fiber"
                current={totalFiber}
                goal={fiberGoal}
                unit="g"
                type="target"
                color="green"
              />

              {/* Sugar */}
              <NutrientProgressCard
                name="Sugar"
                current={totalSugar}
                goal={sugarGoal}
                unit="g"
                type="limit"
                color="yellow"
              />

              {/* Sodium */}
              <NutrientProgressCard
                name="Sodium"
                current={totalSodium}
                goal={sodiumGoal}
                unit="mg"
                type="limit"
                color="red"
              />
            </div>
          </div>
        </div>

        {/* Macro Settings */}
        {adjustedCalories ? (
          <div className="mb-6">
            <MacroSettings
              user={user}
              leanBodyMassLbs={leanBodyMass ? Math.round(leanBodyMass * 2.20462) : null} // Convert kg to lbs
              adjustedCalories={adjustedCalories}
              goalType={goalType}
              onMacrosUpdated={(macros) => {
                // Update macro targets in real-time
                console.log('Macros updated:', macros)
                setProteinTarget(macros.protein.grams)
                setCarbsTarget(macros.carbs.grams)
                setFatTarget(macros.fat.grams)
              }}
            />
            {!leanBodyMass && (
              <p className="text-xs text-yellow-700 mt-2 italic">
                💡 Tip: Add body measurements (neck, waist, hips) on the Goals page for personalized protein recommendations based on lean body mass.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Complete your Goals page to see personalized macro recommendations.
            </p>
          </div>
        )}

        {/* Meals by Type */}
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => (
          <MealTypeSection
            key={mealType}
            mealType={mealType}
            meals={todaysMeals.filter(m => m.meal_type === mealType)}
            onAddFood={() => handleOpenFoodSearch(mealType)}
            onScanBarcode={() => handleOpenBarcodeScanner(mealType)}
            onDeleteMeal={handleDeleteMeal}
            onUseTemplate={() => handleUseTemplate(mealType)}
            onSaveAsTemplate={() => handleSaveAsTemplate(mealType)}
          />
        ))}

        {/* Modals */}
        {showFoodSearch && (
          <FoodSearch
            user={user}
            onSelectFood={handleFoodSelected}
            onClose={() => setShowFoodSearch(false)}
          />
        )}

        {showBarcodeScanner && (
          <BarcodeScanner
            onScanSuccess={handleFoodSelected}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}

        {showServingSelector && selectedFood && (
          <ServingSizeSelector
            food={selectedFood}
            servingQuantity={servingQuantity}
            setServingQuantity={setServingQuantity}
            servingUnit={servingUnit}
            setServingUnit={setServingUnit}
            onConfirm={handleLogFood}
            onCancel={() => {
              setShowServingSelector(false)
              setSelectedFood(null)
            }}
          />
        )}

        {/* Template Modals */}
        {showTemplateModal && (
          <NutritionTemplateModal
            mealType={templateMealType}
            onSelectTemplate={handleSelectTemplate}
            onClose={() => setShowTemplateModal(false)}
            user={user}
          />
        )}

        {showSaveTemplateModal && (
          <SaveNutritionTemplateModal
            mealType={templateMealType}
            meals={todaysMeals.filter(m => m.meal_type === templateMealType)}
            onSave={handleSaveTemplate}
            onClose={() => setShowSaveTemplateModal(false)}
          />
        )}
      </div>
    </div>
  )
}

// Meal Type Section Component
function MealTypeSection({ mealType, meals, onAddFood, onScanBarcode, onDeleteMeal, onUseTemplate, onSaveAsTemplate }) {
  const [expanded, setExpanded] = useState(true)

  const mealTypeIcons = {
    breakfast: <Coffee className="w-5 h-5" />,
    lunch: <Sun className="w-5 h-5" />,
    dinner: <Moon className="w-5 h-5" />,
    snacks: <Cookie className="w-5 h-5" />
  }

  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks'
  }

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-blue-600">{mealTypeIcons[mealType]}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {mealTypeLabels[mealType]}
            </h3>
            <p className="text-sm text-gray-600">
              {meals.length} {meals.length === 1 ? 'item' : 'items'} · {Math.round(totalCalories)} kcal
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {/* Meal Items */}
          {meals.length > 0 && (
            <div className="space-y-2 mb-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{meal.food_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span>{Math.round(meal.calories || 0)} cal</span>
                      <span>P: {Math.round(meal.protein || 0)}g</span>
                      <span>C: {Math.round(meal.carbs || 0)}g</span>
                      <span>F: {Math.round(meal.fat || 0)}g</span>
                    </div>
                    {meal.serving_quantity && (
                      <p className="text-xs text-gray-500 mt-1">
                        {meal.serving_quantity} {meal.serving_unit}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Food Buttons */}
          <div className="space-y-2">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={onAddFood}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Search</span>
                <span className="xs:hidden">🔍</span>
              </button>
              <button
                onClick={onScanBarcode}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-medium text-xs sm:text-sm"
              >
                <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Scan</span>
              </button>
              <button
                onClick={onUseTemplate}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 sm:px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium text-xs sm:text-sm"
                title="Use Template"
              >
                <Utensils className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Template</span>
              </button>
            </div>
            
            {/* Save as Template Button (only show if there are meals) */}
            {meals.length > 0 && (
              <button
                onClick={onSaveAsTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-medium text-sm"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save as Template
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Serving Size Selector Component
function ServingSizeSelector({ food, servingQuantity, setServingQuantity, servingUnit, setServingUnit, onConfirm, onCancel }) {

  // Available units - show different options based on food type
  const isLiquid = food.foodType === 'liquid'
  
  const units = isLiquid ? [
    // Liquid foods: volume units + serving
    { value: 'ml', label: 'Milliliters (ml)', toGrams: 1 },
    { value: 'fl_oz', label: 'Fluid Ounces (fl oz)', toGrams: 29.57 },
    { value: 'cup', label: 'Cups', toGrams: 240 },
    { value: 'tbsp', label: 'Tablespoons (tbsp)', toGrams: 15 },
    { value: 'tsp', label: 'Teaspoons (tsp)', toGrams: 5 },
    { value: 'serving', label: 'Serving', toGrams: food.servingGrams || 100 }
  ] : [
    // Solid foods: weight units + serving
    { value: 'g', label: 'Grams (g)', toGrams: 1 },
    { value: 'oz', label: 'Ounces (oz)', toGrams: 28.35 },
    { value: 'lb', label: 'Pounds (lb)', toGrams: 453.59 },
    { value: 'serving', label: 'Serving', toGrams: food.servingGrams || 100 }
  ]


  // Calculate multiplier based on quantity and unit
  const selectedUnit = units.find(u => u.value === servingUnit) || units[0]
  const totalGrams = (servingQuantity || 0) * selectedUnit.toGrams
  const multiplier = totalGrams / 100 // All nutrition is per 100g
  const displayCalories = Math.round((food.calories || 0) * multiplier)
  const displayProtein = Math.round((food.protein || 0) * multiplier)
  const displayCarbs = Math.round((food.carbs || 0) * multiplier)
  const displayFat = Math.round((food.fat || 0) * multiplier)

  console.log('🥜 DEBUG:', {
    servingQuantity,
    servingUnit,
    'selectedUnit.toGrams': selectedUnit.toGrams,
    totalGrams,
    multiplier,
    'food.calories': food.calories,
    displayCalories
  })





  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Confirm Serving Size</h2>
          <p className="text-sm text-gray-600 mt-1">{food.name}</p>
          {food.brand && (
            <p className="text-xs text-gray-500">{food.brand}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Quantity and Unit */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity & Unit
            </label>
            <div className="flex gap-2">
              {/* Quantity Input */}
            
 <input
  type="number"
  value={servingQuantity}
  onChange={(e) => {
    const value = e.target.value
    if (value === '' || value === '0') {
      setServingQuantity('')
    } else {
      setServingQuantity(parseFloat(value) || 1)
    }
  }}
  onFocus={() => {
    setServingQuantity('')
  }}
  min="0.1"
  step="0.1"
  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>

        
   {/* Unit Dropdown */}
<select
  value={servingUnit}
  onChange={(e) => setServingUnit(e.target.value)}
  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
>
  {units.map(unit => (
    <option key={unit.value} value={unit.value}>
      {unit.label}
    </option>
  ))}
</select>
           
           
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ≈ {totalGrams.toFixed(1)}g total
            </p>
       
          </div>

          {/* Nutrition Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Nutrition Facts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Calories:</span>
                <span className="font-semibold text-gray-900 ml-2">{displayCalories} kcal</span>
              </div>
              <div>
                <span className="text-gray-600">Protein:</span>
                <span className="font-semibold text-blue-600 ml-2">{displayProtein}g</span>
              </div>
              <div>
                <span className="text-gray-600">Carbs:</span>
                <span className="font-semibold text-orange-600 ml-2">{displayCarbs}g</span>
              </div>
              <div>
                <span className="text-gray-600">Fat:</span>
                <span className="font-semibold text-purple-600 ml-2">{displayFat}g</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium"
            >
              Log Food
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
