import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DayColumn from './DayColumn'

export default function WeeklyGrid({ weekStart, mealPlanItems, onAddMeal, onRemoveMeal, onUpdateMeal, onSaveAsTemplate, user }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  
  // Mobile day selector state
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()) // Start with today

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

  // Navigate days on mobile
  const goToPrevDay = () => {
    setSelectedDayIndex(prev => (prev === 0 ? 6 : prev - 1))
  }

  const goToNextDay = () => {
    setSelectedDayIndex(prev => (prev === 6 ? 0 : prev + 1))
  }

  const getDateForDay = (dayIndex) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + dayIndex)
    return date
  }

  const selectedDate = getDateForDay(selectedDayIndex)
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Mobile Day Selector - Only visible on small screens */}
      <div className="md:hidden border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {days[selectedDayIndex]}
            </div>
            <div className={`text-sm ${isToday ? 'text-blue-500' : 'text-gray-500'}`}>
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {isToday && (
              <div className="text-xs text-blue-600 font-medium mt-1">Today</div>
            )}
          </div>
          
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day selector dots */}
        <div className="flex justify-center gap-2">
          {days.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedDayIndex
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to ${days[index]}`}
            />
          ))}
        </div>

        {/* Total calories for selected day */}
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-600">Total: </span>
          <span className="text-lg font-semibold text-gray-900">
            {getDayTotalCalories(selectedDayIndex)} cal
          </span>
        </div>
      </div>

      {/* Desktop Days Header - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-7 border-b border-gray-200">
        {days.map((day, index) => {
          const date = getDateForDay(index)
          const isDayToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={day}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isDayToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-sm font-semibold ${isDayToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className={`text-xs ${isDayToday ? 'text-blue-500' : 'text-gray-500'}`}>
                {date.getMonth() + 1}/{date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Days Grid */}
      {/* Mobile: Show only selected day */}
      {/* Desktop: Show all 7 days */}
      <div className="md:grid md:grid-cols-7">
        {/* Mobile view - single day */}
        <div className="md:hidden">
          <DayColumn
            key={days[selectedDayIndex]}
            dayOfWeek={selectedDayIndex}
            dayName={days[selectedDayIndex]}
            date={selectedDate}
            mealTypes={mealTypes}
            getMealsForSlot={getMealsForSlot}
            totalCalories={getDayTotalCalories(selectedDayIndex)}
            onAddMeal={onAddMeal}
            onRemoveMeal={onRemoveMeal}
            onUpdateMeal={onUpdateMeal}
            onSaveAsTemplate={onSaveAsTemplate}
            user={user}
          />
        </div>

        {/* Desktop view - all days */}
        <div className="hidden md:contents">
          {days.map((day, dayIndex) => (
            <DayColumn
              key={day}
              dayOfWeek={dayIndex}
              dayName={day}
              date={getDateForDay(dayIndex)}
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
    </div>
  )
}
