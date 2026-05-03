import { useState, useEffect } from 'react'
import { X, Search, Star } from 'lucide-react'
import { searchFoods } from '../../lib/foodDatabase'

export default function AddMealModal({ dayOfWeek, mealType, onAdd, onClose, user }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [servingQuantity, setServingQuantity] = useState(1)
  const [servingUnit, setServingUnit] = useState('serving')
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(true)
  
  // Available serving units
  const servingUnits = [
    { value: 'serving', label: 'Serving', gramsPerUnit: null }, // Will use food's default
    { value: 'container', label: 'Container', gramsPerUnit: null }, // Will use food's default
    { value: 'gram', label: 'Gram (g)', gramsPerUnit: 1 },
    { value: 'ounce', label: 'Ounce (oz)', gramsPerUnit: 28.35 },
    { value: 'milliliter', label: 'Milliliter (ml)', gramsPerUnit: 1 }, // Assuming water density
    { value: 'cup', label: 'Cup', gramsPerUnit: 240 },
    { value: 'teaspoon', label: 'Teaspoon (tsp)', gramsPerUnit: 5 },
    { value: 'tablespoon', label: 'Tablespoon (tbsp)', gramsPerUnit: 15 }
  ]

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [user])

  async function loadTemplates() {
    if (!user) {
      console.log('[AddMeal] No user, skipping template load')
      return
    }

    try {
      // Real user - use Supabase (TODO)
      setTemplates([])
    } catch (error) {
      console.error('[AddMeal] Error loading templates:', error)
    }
  }

  // Search for foods
  async function handleSearch(query) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchFoods(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching foods:', error)
    } finally {
      setSearching(false)
    }
  }

  // Select a food from search results
  function selectFood(food) {
    setSelectedFood(food)
    setServingQuantity(1)
    setServingUnit(food.serving_unit || 'serving')
  }
  
  // Calculate nutrition based on quantity and unit
  function calculateNutrition() {
    if (!selectedFood) return null
    
    // Handle empty or invalid quantity
    const quantity = parseFloat(servingQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      }
    }
    
    // Get the multiplier based on selected unit
    let multiplier = quantity
    
    // If using a unit other than the food's default serving
    if (servingUnit !== (selectedFood.serving_unit || 'serving')) {
      const unitInfo = servingUnits.find(u => u.value === servingUnit)
      
      if (unitInfo && unitInfo.gramsPerUnit) {
        // Convert to grams
        const totalGrams = quantity * unitInfo.gramsPerUnit
        
        // Assume food nutrition is per 100g (standard)
        // If food has serving_size_g, use that as the base
        const baseGrams = selectedFood.serving_size_g || 100
        multiplier = totalGrams / baseGrams
      }
    }
    
    return {
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      fiber: selectedFood.fiber ? Math.round(selectedFood.fiber * multiplier * 10) / 10 : 0,
      sugar: selectedFood.sugar ? Math.round(selectedFood.sugar * multiplier * 10) / 10 : 0,
      sodium: selectedFood.sodium ? Math.round(selectedFood.sodium * multiplier * 10) / 10 : 0
    }
  }

  // Add meal to plan
  function handleAdd() {
    if (!selectedFood) return

    const nutrition = calculateNutrition()
    
    const mealData = {
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      brand: selectedFood.brand,
      serving_quantity: servingQuantity,
      serving_unit: servingUnit,
      ...nutrition
    }

    onAdd(mealData)
    
    // Reset for adding another food
    setSelectedFood(null)
    setSearchQuery('')
    setSearchResults([])
    setServingQuantity(1)
    setServingUnit('serving')
  }
  
  // Add and close modal
  function handleAddAndClose() {
    handleAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Templates Section */}
          {templates.length > 0 && showTemplates && !selectedFood && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Quick Add from Templates</h4>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={async () => {
                      console.log('[AddMeal] ===== STARTING TEMPLATE APPLICATION =====')
                      console.log('[AddMeal] Template:', template.template_name)
                      console.log('[AddMeal] Number of meals in template:', template.meals?.length)
                      console.log('[AddMeal] Template meals array:', template.meals)
                      
                      if (!template.meals || template.meals.length === 0) {
                        console.error('[AddMeal] No meals in template!')
                        alert('This template has no meals!')
                        return
                      }
                      
                      // Add all foods from template - wait for each to complete
                      for (let i = 0; i < template.meals.length; i++) {
                        const meal = template.meals[i]
                        console.log(`[AddMeal] Adding meal ${i + 1}/${template.meals.length}:`, meal.food_name)
                        try {
                          await onAdd(meal)
                          console.log(`[AddMeal] Successfully added meal ${i + 1}`)
                        } catch (error) {
                          console.error(`[AddMeal] Error adding meal ${i + 1}:`, error)
                        }
                      }
                      
                      console.log('[AddMeal] ===== FINISHED TEMPLATE APPLICATION =====')
                      onClose()
                    }}
                    className="p-3 border-2 border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-1">
                          {template.template_name}
                          {template.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {template.description && (
                          <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                        )}
                        <div className="flex gap-3 text-xs text-gray-600 mt-1">
                          <span>{template.total_calories} cal</span>
                          <span>P: {template.total_protein}g</span>
                          <span>C: {template.total_carbs}g</span>
                          <span>F: {template.total_fat}g</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.meals?.length || 0} items
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 mb-3">
                <p className="text-xs text-gray-500 text-center">Or search for individual foods below</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                placeholder="Search for foods..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Search Results */}
          {searching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {!searching && searchResults.length > 0 && !selectedFood && (
            <div className="space-y-2">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => selectFood(food)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{food.name}</div>
                  {food.brand && (
                    <div className="text-sm text-gray-500">{food.brand}</div>
                  )}
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>{food.calories} cal</span>
                    <span>P: {food.protein}g</span>
                    <span>C: {food.carbs}g</span>
                    <span>F: {food.fat}g</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Food */}
          {selectedFood && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{selectedFood.name}</div>
                  {selectedFood.brand && (
                    <div className="text-sm text-gray-600">{selectedFood.brand}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </div>

              {/* Serving Size Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serving Size
                </label>
                <div className="flex gap-2">
                  {/* Quantity Input */}
                  <div className="flex-1">
                    <input
                      type="number"
                      value={servingQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow empty string for editing
                        if (value === '') {
                          setServingQuantity('')
                          return
                        }
                        // Parse and validate
                        const parsed = parseFloat(value)
                        if (!isNaN(parsed) && parsed >= 0) {
                          setServingQuantity(parsed)
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, ensure we have a valid number
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value < 0.1) {
                          setServingQuantity(1)
                        }
                      }}
                      step="0.1"
                      min="0.1"
                      placeholder="Quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Unit Dropdown */}
                  <div className="flex-1">
                    <select
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {servingUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {servingQuantity} {servingUnits.find(u => u.value === servingUnit)?.label.toLowerCase()}
                </div>
              </div>

              {/* Nutrition Preview */}
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Nutrition</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {calculateNutrition()?.calories || 0}
                    </div>
                    <div className="text-xs text-gray-600">Calories</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {calculateNutrition()?.protein || 0}g
                    </div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {calculateNutrition()?.carbs || 0}g
                    </div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {calculateNutrition()?.fat || 0}g
                    </div>
                    <div className="text-xs text-gray-600">Fat</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedFood}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Another
          </button>
          <button
            onClick={handleAddAndClose}
            disabled={!selectedFood}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add & Done
          </button>
        </div>
      </div>
    </div>
  )
}
