import { useState } from 'react'
import { X, Plus, Trash2, Star, Search } from 'lucide-react'
import { searchFoods } from '../../lib/foodDatabase'

export default function CreateTemplateModal({ onSave, onClose }) {
  const [templateName, setTemplateName] = useState('')
  const [mealType, setMealType] = useState('breakfast')
  const [description, setDescription] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [foods, setFoods] = useState([])
  
  // Food search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [servingQuantity, setServingQuantity] = useState(1)

  // Search for foods
  async function handleSearch(query) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchFoods(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  // Select a food from search results
  function selectFood(food) {
    console.log('[CreateTemplate] Selecting food:', food)
    setSelectedFood(food)
    setServingQuantity(1)
    console.log('[CreateTemplate] Food selected, selectedFood state should update')
  }

  // Add food to template
  function addFoodToTemplate() {
    console.log('[CreateTemplate] Adding food, selectedFood:', selectedFood)
    console.log('[CreateTemplate] Current foods:', foods)
    
    if (!selectedFood) {
      console.log('[CreateTemplate] No food selected!')
      return
    }

    const foodData = {
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      brand: selectedFood.brand,
      serving_quantity: servingQuantity,
      serving_unit: selectedFood.serving_unit || 'serving',
      calories: Math.round(selectedFood.calories * servingQuantity),
      protein: Math.round(selectedFood.protein * servingQuantity * 10) / 10,
      carbs: Math.round(selectedFood.carbs * servingQuantity * 10) / 10,
      fat: Math.round(selectedFood.fat * servingQuantity * 10) / 10
    }

    console.log('[CreateTemplate] Food data to add:', foodData)
    const newFoods = [...foods, foodData]
    console.log('[CreateTemplate] New foods array:', newFoods)
    setFoods(newFoods)
    
    // Reset search
    setSelectedFood(null)
    setSearchQuery('')
    setSearchResults([])
    setServingQuantity(1)
  }

  // Remove food from template
  function removeFood(index) {
    setFoods(foods.filter((_, i) => i !== index))
  }

  // Calculate totals
  const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0)
  const totalProtein = foods.reduce((sum, food) => sum + (food.protein || 0), 0)
  const totalCarbs = foods.reduce((sum, food) => sum + (food.carbs || 0), 0)
  const totalFat = foods.reduce((sum, food) => sum + (food.fat || 0), 0)

  // Save template
  function handleSave() {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    if (foods.length === 0) {
      alert('Please add at least one food to the template')
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
      meals: foods
    }

    onSave(templateData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create Meal Template</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Left Column - Template Info & Foods */}
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., My Breakfast"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Meal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        mealType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
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
              <div>
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

              {/* Foods List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Foods in Template ({foods.length})
                  </label>
                </div>
                
                {foods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm">No foods added yet</p>
                    <p className="text-xs mt-1">Search and add foods on the right →</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {foods.map((food, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{food.food_name}</div>
                          {food.brand && (
                            <div className="text-xs text-gray-500">{food.brand}</div>
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            {food.serving_quantity} {food.serving_unit} • {food.calories} cal
                          </div>
                        </div>
                        <button
                          onClick={() => removeFood(index)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nutrition Summary */}
              {foods.length > 0 && (
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
              )}
            </div>

            {/* Right Column - Food Search */}
            <div className="space-y-4 overflow-y-auto pl-2 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Foods
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for foods..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="border border-gray-200 rounded-lg flex-1 overflow-y-auto min-h-[200px]">
                  {searching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No foods found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {searchResults.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => selectFood(food)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedFood?.id === food.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900">{food.name}</div>
                          {food.brand && (
                            <div className="text-xs text-gray-500">{food.brand}</div>
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            {food.calories} cal • P: {food.protein}g C: {food.carbs}g F: {food.fat}g
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Food - Serving Size */}
              {selectedFood && (
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 shadow-lg sticky bottom-0">
                  {console.log('[CreateTemplate] Rendering selected food box for:', selectedFood)}
                  <div className="font-medium text-sm text-gray-900 mb-2">
                    {selectedFood.name}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-gray-700">Servings:</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={servingQuantity}
                      onChange={(e) => setServingQuantity(parseFloat(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedFood.serving_unit || 'serving'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    {Math.round(selectedFood.calories * servingQuantity)} cal •
                    P: {Math.round(selectedFood.protein * servingQuantity * 10) / 10}g •
                    C: {Math.round(selectedFood.carbs * servingQuantity * 10) / 10}g •
                    F: {Math.round(selectedFood.fat * servingQuantity * 10) / 10}g
                  </div>

                  <button
                    onClick={addFoodToTemplate}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Template
                  </button>
                </div>
              )}
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
            disabled={!templateName.trim() || foods.length === 0}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}
