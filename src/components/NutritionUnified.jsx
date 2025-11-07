import { useState } from 'react'
import { Calendar, Apple, BookOpen } from 'lucide-react'
import NutritionEnhanced from './NutritionEnhanced'
import MealPlanner from './MealPlanner'
import MealTemplates from './MealPlanner/MealTemplates'
import { supabase } from '../lib/supabase'


 function NutritionUnified({ user }) {
  const [activeTab, setActiveTab] = useState('daily') // daily, weekly, templates
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0)


  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Nutrition & Meal Planning</h1>
            
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Apple className="w-5 h-5" />
                Daily Tracker
              </button>
              
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Weekly Planner
              </button>
              
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'templates'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'daily' && (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Log your meals throughout the day. Use templates from the Templates tab for quick entry, or switch to Weekly Planner to plan ahead!
              </p>
            </div>
            <NutritionEnhanced user={user} />
          </div>
        )}
        
        {activeTab === 'weekly' && (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>💡 Tip:</strong> Plan your meals for the week ahead. Create templates from your favorite meals, then generate a grocery list with one click!
              </p>
            </div>
            <MealPlanner user={user} />
          </div>
        )}
        
   
       {activeTab === 'templates' && (
  <div>
    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
      <p className="text-sm text-purple-800">
        <strong>💡 Tip:</strong> Templates save time! Create templates from your favorite meals, then quickly add them to Daily Tracker or Weekly Planner.
      </p>
    </div>
<MealTemplates 
  key={templateRefreshKey}  // ← Make sure this is here
  user={user}
  onSelectTemplate={async (template) => {
    console.log('Selected template:', template)
    alert('Template selected! (Adding to daily tracker coming soon)')
  }}
  onSaveTemplate={async (templateData) => {
    console.log('Saving template:', templateData)
    
    try {
      // Demo mode - save to localStorage
      if (user.id === 'demo-user-id') {
        const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
        
        const newTemplate = {
          id: `template_${Date.now()}`,
          user_id: user.id,
          ...templateData,
          use_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        demoTemplates.push(newTemplate)
        localStorage.setItem('yfit_demo_meal_templates', JSON.stringify(demoTemplates))
        
        console.log('Template saved to localStorage:', newTemplate)
        alert('Template saved successfully!')
        
        // Force refresh
        setTemplateRefreshKey(prev => prev + 1)  // ← ADD THIS
        return
      }
      
      // Real user - save to Supabase
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
          is_favorite: templateData.is_favorite,
          use_count: 0
        })
        .select()
        .single()
      
      if (templateError) throw templateError
      
      // Save template items
      const items = templateData.meals.map(meal => ({
        template_id: template.id,
        food_id: meal.food_id,
        food_name: meal.food_name,
        brand: meal.brand,
        serving_quantity: meal.serving_quantity,
        serving_unit: meal.serving_unit,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      }))
      
      const { error: itemsError } = await supabase
        .from('meal_template_items')
        .insert(items)
      
      if (itemsError) throw itemsError
      
      console.log('Template saved to Supabase:', template)
      alert('Template saved successfully!')
      
      // Force refresh
      setTemplateRefreshKey(prev => prev + 1)  // ← ADD THIS
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template: ' + error.message)
    }
  }}
/>


  </div>
)}

      </div>
    </div>
  )
}

export default NutritionUnified


