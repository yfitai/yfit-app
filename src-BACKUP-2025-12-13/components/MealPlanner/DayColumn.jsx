import MealSlot from './MealSlot'

export default function DayColumn({
  dayOfWeek,
  dayName,
  date,
  mealTypes,
  getMealsForSlot,
  totalCalories,
  onAddMeal,
  onRemoveMeal,
  onUpdateMeal,
  onSaveAsTemplate,
  user
}) {
  const isToday = date.toDateString() === new Date().toDateString()

  // Get emoji for meal type
  function getMealEmoji(mealType) {
    const emojis = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍪'
    }
    return emojis[mealType] || '🍽️'
  }

  // Get label for meal type
  function getMealLabel(mealType) {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1)
  }

  return (
    <div className={`border-r border-gray-200 last:border-r-0 min-h-[600px] ${
      isToday ? 'bg-blue-50/30' : ''
    }`}>
      {/* Meal Slots */}
      {mealTypes.map((mealType) => (
        <MealSlot
          key={`${dayOfWeek}-${mealType}`}
          dayOfWeek={dayOfWeek}
          mealType={mealType}
          emoji={getMealEmoji(mealType)}
          label={getMealLabel(mealType)}
          meals={getMealsForSlot(dayOfWeek, mealType)}
          onAddMeal={onAddMeal}
          onRemoveMeal={onRemoveMeal}
          onUpdateMeal={onUpdateMeal}
          onSaveAsTemplate={onSaveAsTemplate}
          user={user}
        />
      ))}

      {/* Day Total */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 mb-1">Total</div>
        <div className="text-lg font-bold text-gray-900">
          {totalCalories} cal
        </div>
        {totalCalories > 0 && (
          <div className="mt-1">
            {totalCalories >= 1400 && totalCalories <= 1600 ? (
              <span className="text-xs text-green-600">✅ On target</span>
            ) : (
              <span className="text-xs text-orange-600">⚠️ {totalCalories < 1400 ? 'Under' : 'Over'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
