import { useState, useEffect, useRef } from 'react'
import { searchFoods, getRecentFoods, getFavoriteFoods, addCustomFood, addFavoriteFood, removeFavoriteFood } from '../lib/foodDatabase'
import CustomFoodModal from './CustomFoodModal'

export default function FoodSearch({ user, onSelectFood, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [recentFoods, setRecentFoods] = useState([])
  const [favoriteFoods, setFavoriteFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'branded', 'whole', 'custom'
  const [showQuickAdd, setShowQuickAdd] = useState(true)
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false)
  const searchTimeout = useRef(null)

  // Load recent and favorite foods on mount
  useEffect(() => {
    loadQuickAccessFoods()
  }, [user])

  const loadQuickAccessFoods = async () => {
    if (!user) return

    // Load from database
    const recent = await getRecentFoods(user.id, 5)
    const favorites = await getFavoriteFoods(user.id)
    
    setRecentFoods(recent)
    setFavoriteFoods(favorites.slice(0, 5))
  }

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value
    setQuery(value)

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Hide quick add when typing
    setShowQuickAdd(value.length === 0)

    // Don't search if query is too short
    if (value.length < 2) {
      setResults([])
      return
    }

    // Debounce search by 300ms
  searchTimeout.current = setTimeout(() => {
  performSearch(value, filter)  // Pass current filter
}, 300)
  }

 const performSearch = async (searchQuery, searchFilter) => {
  setLoading(true)
  try {
    const searchResults = await searchFoods(searchQuery, {
      limit: 40,
      source: searchFilter || filter  // Use passed filter or current filter
    })


      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFood = (food) => {
    onSelectFood(food)
  }

const handleFilterChange = (newFilter) => {
  setFilter(newFilter)
  setResults([])
  setLoading(true)
  if (query.length >= 2) {
    performSearch(query, newFilter)  // Pass the new filter directly
  } else {
    setLoading(false)
  }
}

const handleSaveCustomFood = async (customFood) => {
  const result = await addCustomFood(user.id, customFood)
  
  if (result.success) {
    // Auto-save custom food to My Foods (favorite_foods)
    const customFoodWithSource = {
      ...result.data,
      source: 'custom',
      id: `custom-${result.data.id}`
    }
    await addFavoriteFood(user.id, customFoodWithSource)
    
    setShowCustomFoodModal(false)
    
    // Reload My Foods to show the new custom food
    await loadQuickAccessFoods()
    
    // Refresh search if on custom filter
    if (filter === 'custom' && query.length >= 2) {
      performSearch(query, 'custom')
    }
    
    // Show success message
    alert('✏️ Custom food saved to My Foods!')
  } else {
    alert('Error saving custom food: ' + result.error)
  }
}

const handleToggleFavorite = async (food, isFavorited) => {
  if (isFavorited) {
    // Remove from favorites
    const success = await removeFavoriteFood(user.id, food.id)
    if (success) {
      // Reload favorites list
      await loadQuickAccessFoods()
      // Refresh search if on custom filter
      if (filter === 'custom' && query.length >= 2) {
        performSearch(query, 'custom')
      }
    }
  } else {
    // Add to favorites
    const success = await addFavoriteFood(user.id, food)
    if (success) {
      // Reload favorites list
      await loadQuickAccessFoods()
    }
  }
}


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Search Foods</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search for food..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {['all',  'custom'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => handleFilterChange(filterOption)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                 {filterOption === 'all' && '🔍 All Foods'}
                {filterOption === 'custom' && '⭐ My Foods'}

              </button>
            ))}
            
            {/* Create Custom Food Button */}
            <button
              onClick={() => setShowCustomFoodModal(true)}
              className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1"
            >
              <span>➕</span>
              <span>Create Custom Food</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* My Foods Section - Only show when custom filter is active */}
          {filter === 'custom' && favoriteFoods.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                My Foods (⭐ Saved | ✏️ Custom)
              </h3>
              <div className="space-y-2">
                {favoriteFoods.map((food, index) => (
                  <FoodResultItem
                    key={`favorite-${food.id || index}`}
                    food={food}
                    onSelect={handleSelectFood}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteFoods={favoriteFoods}
                    showDelete={true}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state for My Foods tab */}
          {filter === 'custom' && favoriteFoods.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">⭐ No saved foods yet</p>
              <p className="text-gray-500 text-sm">
                Save foods from search or create custom foods to see them here
              </p>
            </div>
          )}
          
          {/* Empty state for All Foods tab */}
          {filter === 'all' && query.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">🔍 Start searching</p>
              <p className="text-gray-500 text-sm">
                Type at least 2 characters to search for foods
              </p>
            </div>
          )}

          {/* Search Results */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 mt-2">Searching...</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No foods found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-2">
                Try a different search term or add a custom food
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Search Results ({results.length})
              </h3>
              <div className="space-y-2">
                {results.map((food, index) => (
                  <FoodResultItem
                    key={`result-${food.id || food.external_id || index}`}
                    food={food}
                    onSelect={handleSelectFood}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteFoods={favoriteFoods}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Old empty state removed - now handled by filter-specific empty states above */}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
      
      {/* Custom Food Modal */}
      {showCustomFoodModal && (
        <CustomFoodModal
          user={user}
          onSave={handleSaveCustomFood}
          onClose={() => setShowCustomFoodModal(false)}
        />
      )}
    </div>
  )
}

// Food Result Item Component
function FoodResultItem({ food, onSelect, onToggleFavorite, favoriteFoods, showDelete }) {
  // Check if this food is favorited
  const isFavorited = favoriteFoods?.some(fav => fav.id === food.id) || false
  const displayCalories = food.calories ? Math.round(food.calories) : '—'
  const displayProtein = food.protein ? Math.round(food.protein) : '—'
  const displayCarbs = food.carbs ? Math.round(food.carbs) : '—'
  const displayFat = food.fat ? Math.round(food.fat) : '—'

  const handleStarClick = (e) => {
    e.stopPropagation() // Prevent food selection when clicking star
    if (onToggleFavorite) {
      onToggleFavorite(food, isFavorited)
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation() // Prevent food selection when clicking delete
    if (onToggleFavorite && window.confirm(`Remove "${food.name}" from My Foods?`)) {
      onToggleFavorite(food, true) // true = remove from favorites
    }
  }

  return (
    <div className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all relative">
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => onSelect(food)}>
        {/* Food Image or Icon */}
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl">
            🍽️
          </div>
        )}

        {/* Food Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {showDelete && food.source === 'custom' && '✏️ '}
            {showDelete && food.source !== 'custom' && '⭐ '}
            {food.name}
          </h4>
          {food.brand && (
            <p className="text-sm text-gray-600 truncate">{food.brand}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="font-medium">{displayCalories} cal</span>
            <span>P: {displayProtein}g</span>
            <span>C: {displayCarbs}g</span>
            <span>F: {displayFat}g</span>
          </div>
          {food.serving_size && (
            <p className="text-xs text-gray-500 mt-1">
              Per {food.serving_size}
            </p>
          )}
        </div>

        {/* Source Badge */}
        <div className="flex-shrink-0">
          {food.source === 'openfoodfacts' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Branded
            </span>
          )}
          {food.source === 'usda' && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              USDA
            </span>
          )}
          {food.source === 'custom' && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              ✏️ Custom
            </span>
          )}
        </div>
      </div>
      
      {/* Delete button for My Foods section */}
      {showDelete && onToggleFavorite && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
          title="Remove from My Foods"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
