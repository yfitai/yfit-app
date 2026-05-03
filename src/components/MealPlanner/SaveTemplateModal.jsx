import { useState } from 'react'
import { X, Star } from 'lucide-react'

export default function SaveTemplateModal({ mealType, meals, onSave, onClose }) {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  // Calculate totals
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0)

  function handleSave() {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    const templateData = {
      template_name: templateName.trim(),
      meal_type: mealType,
      description: description.trim(),
      total_calories: totalCalories,
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      is_favorite: isFavorite,
      meals: meals.map(meal => ({
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
    }

    onSave(templateData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={`My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this meal..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Mark as Favorite</span>
            </button>
          </div>

          {/* Meals Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {meals.length} items in this template:
            </div>
            <div className="space-y-1">
              {meals.map((meal, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {meal.food_name} ({meal.serving_quantity} {meal.serving_unit})
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Total Nutrition</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{totalCalories}</div>
                <div className="text-xs text-gray-600">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(totalProtein * 10) / 10}g
                </div>
                <div className="text-xs text-gray-600">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(totalCarbs * 10) / 10}g
                </div>
                <div className="text-xs text-gray-600">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(totalFat * 10) / 10}g
                </div>
                <div className="text-xs text-gray-600">Fat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}
