import { useState } from 'react'
import MealCard from './MealCard'
import AddMealModal from './AddMealModal'
import SaveTemplateModal from './SaveTemplateModal'
import { Plus, Save } from 'lucide-react'

export default function MealSlot({
  dayOfWeek,
  mealType,
  emoji,
  label,
  meals,
  onAddMeal,
  onRemoveMeal,
  onUpdateMeal,
  onSaveAsTemplate,
  user
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)

  // Calculate total calories for this slot
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)

  return (
    <div className="p-3 border-b border-gray-200 min-h-[120px]">
      {/* Meal Type Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        {totalCalories > 0 && (
          <span className="text-xs text-gray-500">{totalCalories} cal</span>
        )}
      </div>

      {/* Meals */}
      <div className="space-y-2">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onRemove={() => onRemoveMeal(meal.id)}
            onUpdate={(updates) => onUpdateMeal(meal.id, updates)}
          />
        ))}
      </div>

      {/* Save as Template Button (show if 2+ meals) */}
      {meals.length >= 2 && (
        <button
          onClick={() => setShowSaveTemplateModal(true)}
          className="mt-2 w-full py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Save className="w-3.5 h-3.5" />
          Save as Template
        </button>
      )}

      {/* Add Meal Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add meal</span>
      </button>

      {/* Add Meal Modal */}
      {showAddModal && (
        <AddMealModal
          dayOfWeek={dayOfWeek}
          mealType={mealType}
          user={user}
          onAdd={async (mealData) => {
            return await onAddMeal(dayOfWeek, mealType, mealData)
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          mealType={mealType}
          meals={meals}
          onSave={(templateData) => {
            onSaveAsTemplate(templateData)
            setShowSaveTemplateModal(false)
          }}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}
    </div>
  )
}
