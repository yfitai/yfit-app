import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import WeeklyGrid from './MealPlanner/WeeklyGrid'
import MealTemplates from './MealPlanner/MealTemplates'
import ApplyTemplateModal from './MealPlanner/ApplyTemplateModal'
import GroceryListModal from './MealPlanner/GroceryListModal'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'

export default function MealPlanner({ user }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [mealPlan, setMealPlan] = useState(null)
  const [mealPlanItems, setMealPlanItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)

  // Get the start of the week (Sunday)
  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  // Format date for display
  function formatWeekRange(weekStart) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const options = { month: 'short', day: 'numeric' }
    const start = weekStart.toLocaleDateString('en-US', options)
    const end = weekEnd.toLocaleDateString('en-US', options)
    const year = weekStart.getFullYear()
    
    return `${start} - ${end}, ${year}`
  }

  // Load or create meal plan for current week
  useEffect(() => {
    loadMealPlan()
  }, [currentWeekStart, user])

  async function loadMealPlan() {
    if (!user) return
    
    setLoading(true)
    try {
      const weekStartStr = currentWeekStart.toISOString().split('T')[0]
      
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        console.log('[MealPlanner] Demo mode - using localStorage')
        
        // Load demo meal plans from localStorage
        const demoPlans = JSON.parse(localStorage.getItem('yfit_demo_meal_plans') || '{}')
        const demoItems = JSON.parse(localStorage.getItem('yfit_demo_meal_items') || '[]')
        
        // Get or create plan for this week
        let plan = demoPlans[weekStartStr]
        if (!plan) {
          plan = {
            id: `demo-plan-${weekStartStr}`,
            user_id: user.id,
            week_start_date: weekStartStr,
            plan_name: `Week of ${formatWeekRange(currentWeekStart)}`,
            is_active: true,
            created_at: new Date().toISOString()
          }
          demoPlans[weekStartStr] = plan
          localStorage.setItem('yfit_demo_meal_plans', JSON.stringify(demoPlans))
        }
        
        setMealPlan(plan)
        
        // Load items for this plan
        const items = demoItems.filter(item => item.meal_plan_id === plan.id)
        setMealPlanItems(items)
        
        setLoading(false)
        return
      }
      
      // Real user - use Supabase
      // Check if meal plan exists for this week
      const { data: existingPlan, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartStr)
        .single()
      
      if (planError && planError.code !== 'PGRST116') {
        throw planError
      }
      
      let plan = existingPlan
      
      // Create new meal plan if doesn't exist
      if (!existingPlan) {
        const { data: newPlan, error: createError } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            week_start_date: weekStartStr,
            plan_name: `Week of ${formatWeekRange(currentWeekStart)}`
          })
          .select()
          .single()
        
        if (createError) throw createError
        plan = newPlan
      }
      
      setMealPlan(plan)
      
      // Load meal plan items
      const { data: items, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select('*')
        .eq('meal_plan_id', plan.id)
        .order('day_of_week', { ascending: true })
        .order('meal_type', { ascending: true })
      
      if (itemsError) throw itemsError
      
      setMealPlanItems(items || [])
    } catch (error) {
      console.error('Error loading meal plan:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigate to previous week
  function previousWeek() {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() - 7)
    setCurrentWeekStart(newWeekStart)
  }

  // Navigate to next week
  function nextWeek() {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + 7)
    setCurrentWeekStart(newWeekStart)
  }

  // Navigate to current week
  function goToCurrentWeek() {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Add meal to plan
  async function addMealToPlan(dayOfWeek, mealType, mealData) {
    console.log('[MealPlanner] Adding meal:', { dayOfWeek, mealType, mealData, mealPlanId: mealPlan?.id })
    
    if (!mealPlan) {
      console.error('[MealPlanner] No meal plan found!')
      return
    }
    
    try {
      const newItem = {
        id: `demo-item-${Date.now()}-${Math.random()}`,
        meal_plan_id: mealPlan.id,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...mealData
      }
      
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        console.log('[MealPlanner] Demo mode - saving to localStorage')
        const demoItems = JSON.parse(localStorage.getItem('yfit_demo_meal_items') || '[]')
        demoItems.push(newItem)
        localStorage.setItem('yfit_demo_meal_items', JSON.stringify(demoItems))
        
        console.log('[MealPlanner] Successfully added to localStorage:', newItem)
        // Use functional update to avoid race condition when adding multiple items quickly
        setMealPlanItems(prevItems => [...prevItems, newItem])
        return
      }
      
      // Real user - use Supabase
      console.log('[MealPlanner] Inserting to Supabase:', newItem)
      
      const { data, error } = await supabase
        .from('meal_plan_items')
        .insert(newItem)
        .select()
        .single()
      
      if (error) {
        console.error('[MealPlanner] Insert error:', error)
        throw error
      }
      
      console.log('[MealPlanner] Successfully added to Supabase:', data)
      // Use functional update to avoid race condition when adding multiple items quickly
      setMealPlanItems(prevItems => [...prevItems, data])
    } catch (error) {
      console.error('[MealPlanner] Error adding meal:', error)
      alert('Failed to add meal. Please try again.')
    }
  }

  // Remove meal from plan
  async function removeMealFromPlan(mealId) {
    try {
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        const demoItems = JSON.parse(localStorage.getItem('yfit_demo_meal_items') || '[]')
        const filtered = demoItems.filter(item => item.id !== mealId)
        localStorage.setItem('yfit_demo_meal_items', JSON.stringify(filtered))
        setMealPlanItems(mealPlanItems.filter(item => item.id !== mealId))
        return
      }
      
      // Real user - use Supabase
      const { error } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('id', mealId)
      
      if (error) throw error
      
      setMealPlanItems(mealPlanItems.filter(item => item.id !== mealId))
    } catch (error) {
      console.error('Error removing meal:', error)
    }
  }

  // Update meal in plan
  async function updateMealInPlan(mealId, updates) {
    try {
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        const demoItems = JSON.parse(localStorage.getItem('yfit_demo_meal_items') || '[]')
        const updated = demoItems.map(item => 
          item.id === mealId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
        )
        localStorage.setItem('yfit_demo_meal_items', JSON.stringify(updated))
        setMealPlanItems(mealPlanItems.map(item => 
          item.id === mealId ? { ...item, ...updates } : item
        ))
        return
      }
      
      // Real user - use Supabase
      const { data, error } = await supabase
        .from('meal_plan_items')
        .update(updates)
        .eq('id', mealId)
        .select()
        .single()
      
      if (error) throw error
      
      setMealPlanItems(mealPlanItems.map(item => 
        item.id === mealId ? data : item
      ))
    } catch (error) {
      console.error('Error updating meal:', error)
    }
  }

  // Save meals as template
  async function saveAsTemplate(templateData) {
    try {
      const newTemplate = {
        id: `template-${Date.now()}`,
        user_id: user.id,
        ...templateData,
        use_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Demo mode - use localStorage
      if (user.id === 'demo-user-id') {
        console.log('[MealPlanner] Saving template to localStorage:', newTemplate)
        const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
        demoTemplates.push(newTemplate)
        localStorage.setItem('yfit_demo_meal_templates', JSON.stringify(demoTemplates))
        alert(`Template "${templateData.template_name}" saved successfully!`)
        
        // Trigger reload by dispatching custom event
        window.dispatchEvent(new Event('yfit-templates-updated'))
        return
      }

      // Real user - use Supabase
      // First create the template
      const { data: template, error: templateError } = await supabase
        .from('meal_templates')
        .insert({
          user_id: user.id,
          template_name: templateData.template_name,
          meal_type: templateData.meal_type,
          description: templateData.description,
          total_calories: templateData.total_calories,
          total_protein: templateData.total_protein,
          total_carbs: templateData.total_carbs,
          total_fat: templateData.total_fat,
          is_favorite: templateData.is_favorite
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Then create template items
      const templateItems = templateData.meals.map(meal => ({
        template_id: template.id,
        ...meal
      }))

      const { error: itemsError } = await supabase
        .from('meal_template_items')
        .insert(templateItems)

      if (itemsError) throw itemsError

      alert(`Template "${templateData.template_name}" saved successfully!`)
      
      // Trigger reload
      window.dispatchEvent(new Event('yfit-templates-updated'))
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  // Apply template to a specific day and meal type
  async function applyTemplate(dayOfWeek, mealType, template) {
    console.log('[MealPlanner] Applying template:', { dayOfWeek, mealType, template })
    
    try {
      // Get the template items (meals)
      let templateMeals = []
      
      // Demo mode - template.meals contains the items
      if (user.id === 'demo-user-id') {
        templateMeals = template.meals || []
      } else {
        // Real user - template.meal_template_items contains the items
        templateMeals = template.meal_template_items || []
      }
      
      console.log('[MealPlanner] Template meals:', templateMeals)
      
      // Add each meal from the template to the selected day/meal type
      for (const meal of templateMeals) {
        await addMealToPlan(dayOfWeek, mealType, {
          food_id: meal.food_id,
          food_name: meal.food_name,
          brand: meal.brand,
          serving_quantity: meal.serving_quantity,
          serving_unit: meal.serving_unit,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          notes: meal.notes || `From template: ${template.template_name}`
        })
      }
      
      // Update template use count
      if (user.id === 'demo-user-id') {
        const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
        const updated = demoTemplates.map(t => 
          t.id === template.id ? { ...t, use_count: (t.use_count || 0) + 1 } : t
        )
        localStorage.setItem('yfit_demo_meal_templates', JSON.stringify(updated))
      } else {
        await supabase
          .from('meal_templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', template.id)
      }
      
      alert(`Template "${template.template_name}" applied successfully!`)
    } catch (error) {
      console.error('[MealPlanner] Error applying template:', error)
      alert('Failed to apply template. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planner</h1>
        <p className="text-gray-600">Plan your meals for the week ahead</p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {formatWeekRange(currentWeekStart)}
            </h2>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              This Week
            </button>
          </div>
          
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showTemplates ? 'Hide Templates' : 'Show Templates'}
        </button>
        
        <button
          onClick={() => setShowGroceryList(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate Grocery List
        </button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Weekly Grid */}
        <div className={`${showTemplates ? 'w-2/3' : 'w-full'} transition-all`}>
          <WeeklyGrid
            weekStart={currentWeekStart}
            mealPlanItems={mealPlanItems}
            onAddMeal={addMealToPlan}
            onRemoveMeal={removeMealFromPlan}
            onUpdateMeal={updateMealInPlan}
            onSaveAsTemplate={saveAsTemplate}
            user={user}
          />
        </div>

        {/* Meal Templates Sidebar */}
        {showTemplates && (
          <div className="w-1/3">
            <MealTemplates
              user={user}
              onSelectTemplate={(template) => {
                console.log('[MealPlanner] Template selected:', template)
                setSelectedTemplate(template)
                setShowApplyModal(true)
              }}
              onSaveTemplate={saveAsTemplate}
            />
          </div>
        )}
      </div>

      {/* Apply Template Modal */}
      {showApplyModal && selectedTemplate && (
        <ApplyTemplateModal
          template={selectedTemplate}
          onApply={applyTemplate}
          onClose={() => {
            setShowApplyModal(false)
            setSelectedTemplate(null)
          }}
        />
      )}
      
      {/* Grocery List Modal */}
      {showGroceryList && (
        <GroceryListModal
          mealPlanItems={mealPlanItems}
          weekStart={currentWeekStart}
          onClose={() => setShowGroceryList(false)}
        />
      )}
    </div>
  )
}
