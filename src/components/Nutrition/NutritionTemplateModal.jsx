import { useState, useEffect } from 'react'
import { X, Utensils } from 'lucide-react'

export default function NutritionTemplateModal({ mealType, onSelectTemplate, onClose, user }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [mealType, user])

  async function loadTemplates() {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Demo mode - use localStorage
      if (user.id === 'demo-user-id' || user.id.startsWith('demo')) {
        const demoTemplates = JSON.parse(localStorage.getItem('yfit_demo_meal_templates') || '[]')
        console.log('[NutritionTemplate] Loaded demo templates:', demoTemplates)
        
        // Filter by meal type (convert nutrition meal types to planner meal types)
        const mealTypeMap = {
          breakfast: 'breakfast',
          lunch: 'lunch',
          dinner: 'dinner',
          snacks: 'snack'
        }
        
        const plannerMealType = mealTypeMap[mealType] || mealType
        const filtered = demoTemplates.filter(t => t.meal_type === plannerMealType)
        console.log('[NutritionTemplate] Filtered templates for', mealType, ':', filtered)
        setTemplates(filtered)
      } else {
        // Real user - use Supabase (TODO)
        setTemplates([])
      }
    } catch (error) {
      console.error('[NutritionTemplate] Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectTemplate(template) {
    console.log('[NutritionTemplate] Selected template:', template)
    onSelectTemplate(template)
    onClose()
  }

  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mealTypeLabels[mealType]} Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Quick-add your favorite meals
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No {mealTypeLabels[mealType]} Templates Yet
              </h3>
              <p className="text-gray-600">
                Create templates in the Meal Planner or save your current meal as a template
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 text-lg">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{template.total_calories} cal</span>
                        <span>P: {template.total_protein}g</span>
                        <span>C: {template.total_carbs}g</span>
                        <span>F: {template.total_fat}g</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {template.meals?.length || 0} items
                      </p>
                    </div>
                    <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
