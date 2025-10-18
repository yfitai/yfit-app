import { useState } from 'react'
import DayColumn from './DayColumn'

export default function WeeklyGrid({ weekStart, mealPlanItems, onAddMeal, onRemoveMeal, onUpdateMeal, onSaveAsTemplate, user }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

  // Get meals for a specific day and meal type
  function getMealsForSlot(dayOfWeek, mealType) {
    return mealPlanItems.filter(
      item => item.day_of_week === dayOfWeek && item.meal_type === mealType
    )
  }

  // Calculate total calories for a day
  function getDayTotalCalories(dayOfWeek) {
    return mealPlanItems
      .filter(item => item.day_of_week === dayOfWeek)
      .reduce((sum, item) => sum + (item.calories || 0), 0)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((day, index) => {
          const date = new Date(weekStart)
          date.setDate(date.getDate() + index)
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={day}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className={`text-xs ${isToday ? 'text-blue-500' : 'text-gray-500'}`}>
                {date.getMonth() + 1}/{date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, dayIndex) => (
          <DayColumn
            key={day}
            dayOfWeek={dayIndex}
            dayName={day}
            date={new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)}
            mealTypes={mealTypes}
            getMealsForSlot={getMealsForSlot}
            totalCalories={getDayTotalCalories(dayIndex)}
            onAddMeal={onAddMeal}
            onRemoveMeal={onRemoveMeal}
            onUpdateMeal={onUpdateMeal}
            onSaveAsTemplate={onSaveAsTemplate}
            user={user}
          />
        ))}
      </div>
    </div>
  )
}
