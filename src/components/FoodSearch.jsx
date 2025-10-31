import { useState, useEffect, useRef } from 'react'
import { searchFoods, getRecentFoods, getFavoriteFoods } from '../lib/foodDatabase'

export default function FoodSearch({ user, onSelectFood, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [recentFoods, setRecentFoods] = useState([])
  const [favoriteFoods, setFavoriteFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'branded', 'whole', 'custom'
  const [showQuickAdd, setShowQuickAdd] = useState(true)
  const searchTimeout = useRef(null)

  // Load recent and favorite foods on mount
  useEffect(() => {
    loadQuickAccessFoods()
  }, [user])

  const loadQuickAccessFoods = async () => {
    if (!user) return

    const isDemoMode = !user || user.id?.startsWith('demo')
    
    if (isDemoMode) {
      // Load from localStorage for demo mode
      const recentStr = localStorage.getItem('yfit_recent_foods')
      const favoritesStr = localStorage.getItem('yfit_favorite_foods')
      
      if (recentStr) setRecentFoods(JSON.parse(recentStr).slice(0, 5))
      if (favoritesStr) setFavoriteFoods(JSON.parse(favoritesStr).slice(0, 5))
    } else {
      // Load from database for authenticated users
      const recent = await getRecentFoods(user.id, 5)
      const favorites = await getFavoriteFoods(user.id)
      
      setRecentFoods(recent)
      setFavoriteFoods(favorites.slice(0, 5))
    }
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
      performSearch(value)
    }, 300)
  }

  const performSearch = async (searchQuery) => {
    setLoading(true)
    try {
      const searchResults = await searchFoods(searchQuery, {
        limit: 20,
        source: filter 
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
    if (query.length >= 2) {
      performSearch(query)
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
          <div className="flex gap-2 mt-3 flex-wrap">
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Quick Add Section */}
          {showQuickAdd && (recentFoods.length > 0 || favoriteFoods.length > 0) && (
            <div className="mb-6">
              {/* Recent Foods */}
              {recentFoods.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    🕐 Recent Foods
                  </h3>
                  <div className="space-y-2">
                    {recentFoods.map((food, index) => (
                      <FoodResultItem
                        key={`recent-${food.id || index}`}
                        food={food}
                        onSelect={handleSelectFood}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Foods */}
              {favoriteFoods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    ⭐ Favorites
                  </h3>
                  <div className="space-y-2">
                    {favoriteFoods.map((food, index) => (
                      <FoodResultItem
                        key={`favorite-${food.id || index}`}
                        food={food}
                        onSelect={handleSelectFood}
                      />
                    ))}
                  </div>
                </div>
              )}
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && query.length === 0 && recentFoods.length === 0 && favoriteFoods.length === 0 && (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="text-gray-600 mt-4">Start typing to search for foods</p>
              <p className="text-sm text-gray-500 mt-1">
                Search our database of millions of foods
              </p>
            </div>
          )}
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
    </div>
  )
}

// Food Result Item Component
function FoodResultItem({ food, onSelect }) {
  const displayCalories = food.calories ? Math.round(food.calories) : '—'
  const displayProtein = food.protein ? Math.round(food.protein) : '—'
  const displayCarbs = food.carbs ? Math.round(food.carbs) : '—'
  const displayFat = food.fat ? Math.round(food.fat) : '—'

  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-start gap-3">
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
          <h4 className="font-medium text-gray-900 truncate">{food.name}</h4>
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
              Custom
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
