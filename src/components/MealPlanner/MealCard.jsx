import { Trash2, Edit2 } from 'lucide-react'

export default function MealCard({ meal, onRemove, onUpdate }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
      {/* Food Name */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 line-clamp-1">
            {meal.food_name}
          </div>
          {meal.brand && (
            <div className="text-xs text-gray-500 line-clamp-1">{meal.brand}</div>
          )}
        </div>
      </div>

      {/* Serving Size */}
      <div className="text-xs text-gray-600 mb-2">
        {meal.serving_quantity} {meal.serving_unit}
      </div>

      {/* Macros */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-900">
          {meal.calories} cal
        </div>
        <div className="flex gap-2 text-xs text-gray-600">
          <span>P: {meal.protein}g</span>
          <span>C: {meal.carbs}g</span>
          <span>F: {meal.fat}g</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onRemove}
          className="flex-1 py-1 px-2 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
      </div>
    </div>
  )
}
