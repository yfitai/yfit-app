import { useState } from 'react'
import { X, Save } from 'lucide-react'

export default function SaveNutritionTemplateModal({ mealType, meals, onSave, onClose }) {
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)

  // Calculate totals
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_g || meal.protein || 0), 0)
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs_g || meal.carbs || 0), 0)
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat_g || meal.fat || 0), 0)

  async function handleSave() {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    setSaving(true)
    try {
      await onSave(templateName.trim())
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Save as Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              {mealTypeLabels[mealType]} · {meals.length} items
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Protein Breakfast"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Nutrition Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nutrition Summary</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{Math.round(totalCalories)}</div>
                <div className="text-xs text-gray-600">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{Math.round(totalProtein)}g</div>
                <div className="text-xs text-gray-600">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{Math.round(totalCarbs)}g</div>
                <div className="text-xs text-gray-600">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{Math.round(totalFat)}g</div>
                <div className="text-xs text-gray-600">Fat</div>
              </div>
            </div>
          </div>

          {/* Foods List */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Foods in Template</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {meals.map((meal, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{meal.food_name}</p>
                  <p className="text-xs text-gray-600">
                    {meal.serving_quantity} {meal.serving_unit} · {Math.round(meal.calories)} cal
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !templateName.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
