/**
 * USDA FoodData Central API Integration
 * Official API documentation: https://fdc.nal.usda.gov/api-guide.html
 * Get your API key: https://fdc.nal.usda.gov/api-key-signup.html
 */

// USDA API Configuration
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Get API key from environment variable or use DEMO_KEY as fallback
// Note: DEMO_KEY has strict rate limits (1000 requests/hour)
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'

/**
 * Search USDA FoodData Central database
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of food items
 */
export async function searchUSDAFoods(query, options = {}) {
  const {
    limit = 20,
    dataType = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'], // Focus on whole foods
    pageSize = 25,
    pageNumber = 1
  } = options

  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        dataType: dataType,
        pageSize: pageSize,
        pageNumber: pageNumber,
        sortBy: 'dataType.keyword',
        sortOrder: 'asc'
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('USDA API: Invalid or missing API key. Using DEMO_KEY with rate limits.')
      } else if (response.status === 429) {
        console.warn('USDA API: Rate limit exceeded. Please wait before making more requests.')
      }
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.foods || data.foods.length === 0) {
      return []
    }

    // Transform USDA data to our standard format
    return data.foods.slice(0, limit).map(food => transformUSDAFood(food))
  } catch (error) {
    console.error('Error searching USDA foods:', error)
    return []
  }
}

/**
 * Get detailed information about a specific USDA food item
 * @param {string} fdcId - FDC ID of the food
 * @returns {Promise<Object>} - Detailed food information
 */
export async function getUSDAFoodDetails(fdcId) {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    return transformUSDAFood(data)
  } catch (error) {
    console.error('Error fetching USDA food details:', error)
    return null
  }
}

/**
 * Transform USDA food data to our standard format
 * @param {Object} usdaFood - Raw USDA food data
 * @returns {Object} - Standardized food object
 */
function transformUSDAFood(usdaFood) {
  // Extract nutrients from foodNutrients array
  const nutrients = {}
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase() || ''
      const value = nutrient.value || 0
      
      // Map USDA nutrient names to our standard names
      if (name.includes('energy') && name.includes('kcal')) {
        nutrients.calories = Math.round(value)
      } else if (name.includes('protein')) {
        nutrients.protein = parseFloat(value.toFixed(1))
      } else if (name.includes('carbohydrate')) {
        nutrients.carbs = parseFloat(value.toFixed(1))
      } else if (name.includes('total lipid') || name.includes('fat, total')) {
        nutrients.fat = parseFloat(value.toFixed(1))
      } else if (name.includes('fiber')) {
        nutrients.fiber = parseFloat(value.toFixed(1))
      } else if (name.includes('sugars, total')) {
        nutrients.sugar = parseFloat(value.toFixed(1))
      } else if (name.includes('sodium')) {
        nutrients.sodium = Math.round(value)
      } else if (name.includes('cholesterol')) {
        nutrients.cholesterol = Math.round(value)
      } else if (name.includes('fatty acids, total saturated')) {
        nutrients.saturatedFat = parseFloat(value.toFixed(1))
      }
    })
  }

  // Determine serving size
  let servingSize = '100g'
  let servingGrams = 100
  
  if (usdaFood.servingSize && usdaFood.servingSizeUnit) {
    servingSize = `${usdaFood.servingSize}${usdaFood.servingSizeUnit}`
    if (usdaFood.servingSizeUnit === 'g') {
      servingGrams = usdaFood.servingSize
    }
  }

  return {
    id: `usda_${usdaFood.fdcId}`,
    fdcId: usdaFood.fdcId,
    name: usdaFood.description || 'Unknown Food',
    brand: usdaFood.brandOwner || 'USDA',
    source: 'usda',
    dataType: usdaFood.dataType,
    servingSize: servingSize,
    servingGrams: servingGrams,
    calories: nutrients.calories || 0,
    protein: nutrients.protein || 0,
    carbs: nutrients.carbs || 0,
    fat: nutrients.fat || 0,
    fiber: nutrients.fiber || 0,
    sugar: nutrients.sugar || 0,
    sodium: nutrients.sodium || 0,
    cholesterol: nutrients.cholesterol || 0,
    saturatedFat: nutrients.saturatedFat || 0,
    // Additional metadata
    ingredients: usdaFood.ingredients || '',
    category: usdaFood.foodCategory || '',
    publicationDate: usdaFood.publicationDate || null
  }
}

/**
 * Search for foods by nutrient content
 * @param {Object} nutrientCriteria - Nutrient search criteria
 * @returns {Promise<Array>} - Array of matching foods
 */
export async function searchByNutrients(nutrientCriteria) {
  // Example: { protein: { min: 20, max: 30 }, calories: { max: 200 } }
  try {
    const response = await fetch(
      `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '',
          dataType: ['Foundation', 'SR Legacy'],
          pageSize: 50,
          nutrients: nutrientCriteria
        })
      }
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    return data.foods?.map(food => transformUSDAFood(food)) || []
  } catch (error) {
    console.error('Error searching by nutrients:', error)
    return []
  }
}

/**
 * Get list of available food categories
 * @returns {Promise<Array>} - Array of food categories
 */
export async function getFoodCategories() {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/foods/list?api_key=${USDA_API_KEY}&pageSize=1`
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    // Extract unique categories from the response
    return data.foodCategory || []
  } catch (error) {
    console.error('Error fetching food categories:', error)
    return []
  }
}

/**
 * Check if USDA API is available and properly configured
 * @returns {Promise<boolean>} - True if API is accessible
 */
export async function checkUSDAConnection() {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'apple',
          pageSize: 1
        })
      }
    )

    return response.ok
  } catch (error) {
    console.error('USDA API connection check failed:', error)
    return false
  }
}

export default {
  searchUSDAFoods,
  getUSDAFoodDetails,
  searchByNutrients,
  getFoodCategories,
  checkUSDAConnection
}

