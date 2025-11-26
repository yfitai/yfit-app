/**
 * YFIT Food Database API Integration
 * Handles food search, barcode lookup, and caching
 * Integrates with Open Food Facts and USDA FoodData Central
 */

import { supabase } from './supabase'

// API Configuration
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.net/api/v2'
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Get USDA API key from environment variable
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'
console.log('🔑 USDA API Key loaded:', USDA_API_KEY ? (USDA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY' : 'Custom key (length: ' + USDA_API_KEY.length + ' )') : 'NOT SET')

// User-Agent for Open Food Facts (required)
const USER_AGENT = 'YFIT/1.0 (contact@yfit.app)'

/**
 * Search for foods across multiple databases
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, filters)
 * @returns {Promise<Array>} - Array of food results
 */
export async function searchFoods(query, options = {}) {
  const { limit = 20, source = 'all' } = options

  console.log('🔍 searchFoods called:', { query, source, limit })

  try {
    const results = []

    // Search Open Food Facts (branded foods)
    if (source === 'all') {
      console.log('📦 Searching Open Food Facts...')
      const offResults = await searchOpenFoodFacts(query, limit)
      console.log('📦 Open Food Facts found:', offResults.length, 'results')
      results.push(...offResults)
    }

    // Search USDA (whole foods) - NOW ENABLED
    if (source === 'all') {
      console.log('🥗 Searching USDA...')
      try {
        const usdaResults = await searchUSDA(query, limit)
        console.log('🥗 USDA found:', usdaResults.length, 'results')
        results.push(...usdaResults)
      } catch (error) {
        console.warn('USDA search failed:', error.message)
      }
    }

    // Search Custom Foods (user-created)
    if (source === 'custom') {
      console.log('✏️ Searching Custom Foods...')
      try {
        const customResults = await searchCustomFoods(query, limit)
        console.log('✏️ Custom Foods found:', customResults.length, 'results')
        results.push(...customResults)
      } catch (error) {
        console.warn('Custom foods search failed:', error.message)
      }
    }

        // Remove duplicates (by name and brand)
    const uniqueResults = deduplicateFoods(results)

    // Interleave results by source for better variety
    const branded = uniqueResults.filter(f => f.source === 'openfoodfacts')
    const usda = uniqueResults.filter(f => f.source === 'usda')
    const custom = uniqueResults.filter(f => f.source === 'custom')

    // Alternate between sources so USDA results appear throughout
    const interleaved = []
    const maxLength = Math.max(branded.length, usda.length, custom.length)
    for (let i = 0; i < maxLength; i++) {
      if (branded[i]) interleaved.push(branded[i])
      if (usda[i]) interleaved.push(usda[i])
      if (custom[i]) interleaved.push(custom[i])
    }

        console.log('✅ Final results:', interleaved.length, '(Branded:', branded.length, 'USDA:', usda.length, 'Custom:', custom.length, ')')

    return interleaved.slice(0, limit)
  } catch (error) {
    console.error('Error searching foods:', error)
    return []
  }
}


/**
 * Search USDA FoodData Central API
 */
async function searchUSDA(query, limit) {
  try {
    console.log('🥗 Searching USDA API for:', query)
    
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],  // Exclude branded foods from USDA
        pageSize: limit * 2,
        pageNumber: 1,
        sortBy: 'score',
        sortOrder: 'desc'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        console.error('❌ USDA API: Invalid or missing API key')
        console.error('Response:', errorText)
      } else if (response.status === 429) {
        console.error('❌ USDA API: Rate limit exceeded')
      } else {
        console.error(`❌ USDA API error ${response.status}:`, errorText)
      }
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.foods || data.foods.length === 0) {
      console.log('🥗 USDA API returned 0 results')
      return []
    }

    // Filter and rank results by relevance
    const queryLower = query.toLowerCase()
    const results = data.foods
      .map(food => {
        const nameLower = (food.description || '').toLowerCase()
        
        // Calculate relevance score
        let relevanceScore = 0
        
        // Exact match gets highest score
        if (nameLower === queryLower) relevanceScore += 100
        
        // Starts with query gets high score
        if (nameLower.startsWith(queryLower)) relevanceScore += 50
        
        // Contains all query words
        const queryWords = queryLower.split(' ')
        const matchedWords = queryWords.filter(word => nameLower.includes(word)).length
        relevanceScore += (matchedWords / queryWords.length) * 30
        
        return {
          food,
          relevanceScore
        }
      })
      .filter(item => item.relevanceScore > 10)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .map(item => transformUSDAFood(item.food))
    
    console.log('🥗 USDA API found:', results.length, 'results')
    return results
  } catch (error) {
    console.error('Error searching USDA API:', error)
    return []
  }
}



/**
 * Transform USDA food data to our standard format
 */
function transformUSDAFood(usdaFood) {
  console.log('🥗 Transforming USDA food:', usdaFood.description)
  console.log('🥗 Raw nutrients:', usdaFood.foodNutrients)
  
  const nutrients = {}
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase()
      const value = nutrient.value || 0
      
      if (name?.includes('protein')) nutrients.protein = value
      else if (name?.includes('carbohydrate')) nutrients.carbs = value
      else if (name?.includes('total lipid') || name?.includes('fat, total')) nutrients.fat = value
      else if (name?.includes('energy') && nutrient.unitName === 'KCAL') nutrients.calories = value
      else if (name?.includes('fiber')) nutrients.fiber = value
      else if (name?.includes('sugars, total')) nutrients.sugar = value
      else if (name?.includes('sodium')) nutrients.sodium = value
    })
  }

  console.log('🥗 Extracted nutrients:', nutrients)

  return {
    id: `usda-${usdaFood.fdcId}`,
    name: usdaFood.description,
    brand: 'USDA',
    source: 'usda',
    calories: Math.round(nutrients.calories || 0),
    protein: Math.round(nutrients.protein || 0),
    carbs: Math.round(nutrients.carbs || 0),
    fat: Math.round(nutrients.fat || 0),
    fiber: Math.round(nutrients.fiber || 0),
    sugar: Math.round(nutrients.sugar || 0),
    sodium: Math.round(nutrients.sodium || 0),
    servingSize: 100,
    servingUnit: 'g'
  }
}

/**
 * Search Open Food Facts API
 */
async function searchOpenFoodFacts(query, limit) {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&fields=product_name,brands,nutriments,serving_size,code`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.products || data.products.length === 0) {
      return []
    }

    return data.products
      .filter(product => product.product_name && product.nutriments)
      .map(product => transformOpenFoodFactsProduct(product))
  } catch (error) {
    console.error('Error searching Open Food Facts:', error)
    return []
  }
}

/**
 * Transform Open Food Facts product to our standard format
 */
function transformOpenFoodFactsProduct(product) {
  const nutriments = product.nutriments || {}
  
  return {
    id: `off-${product.code}`,
    name: product.product_name,
    brand: product.brands || 'Unknown',
    source: 'openfoodfacts',
    calories: Math.round(nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0),
    protein: Math.round(nutriments.proteins_100g || 0),
    carbs: Math.round(nutriments.carbohydrates_100g || 0),
    fat: Math.round(nutriments.fat_100g || 0),
    fiber: Math.round(nutriments.fiber_100g || 0),
    sugar: Math.round(nutriments.sugars_100g || 0),
    sodium: Math.round(nutriments.sodium_100g * 1000 || 0), // Convert g to mg
    servingSize: parseFloat(product.serving_size) || 100,
    servingUnit: product.serving_size?.match(/[a-z]+/i)?.[0] || 'g'
  }
}

/**
 * Search custom foods created by user
 */
async function searchCustomFoods(query, limit) {
  try {
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (error) throw error

    return (data || []).map(food => ({
      ...food,
      source: 'custom',
      id: `custom-${food.id}`
    }))
  } catch (error) {
    console.error('Error searching custom foods:', error)
    return []
  }
}

/**
 * Get food by barcode
 */
export async function getFoodByBarcode(barcode) {
  try {
    // Try Open Food Facts first
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/product/${barcode}`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.status === 1 && data.product) {
      return transformOpenFoodFactsProduct(data.product)
    }

    return null
  } catch (error) {
    console.error('Error looking up barcode:', error)
    return null
  }
}

/**
 * Get recent foods for a user
 */
export async function getRecentFoods(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('food_log')
      .select('food_data')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit * 2) // Get more to account for duplicates

    if (error) throw error

    // Extract unique foods
    const seen = new Set()
    const uniqueFoods = []

    for (const entry of data || []) {
      const food = entry.food_data
      if (food && !seen.has(food.id)) {
        seen.add(food.id)
        uniqueFoods.push(food)
        if (uniqueFoods.length >= limit) break
      }
    }

    return uniqueFoods
  } catch (error) {
    console.error('Error getting recent foods:', error)
    return []
  }
}

/**
 * Get favorite foods for a user
 */
export async function getFavoriteFoods(userId) {
  try {
    const { data, error } = await supabase
      .from('favorite_foods')
      .select('food_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(entry => entry.food_data)
  } catch (error) {
    console.error('Error getting favorite foods:', error)
    return []
  }
}

/**
 * Add food to favorites
 */
export async function addFavoriteFood(userId, foodData) {
  try {
    const { error } = await supabase
      .from('favorite_foods')
      .insert({
        user_id: userId,
        food_data: foodData
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding favorite food:', error)
    return false
  }
}

/**
 * Remove food from favorites
 */
export async function removeFavoriteFood(userId, foodId) {
  try {
    const { error } = await supabase
      .from('favorite_foods')
      .delete()
      .eq('user_id', userId)
      .eq('food_data->id', foodId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing favorite food:', error)
    return false
  }
}

/**
 * Deduplicate foods by name and brand
 */
function deduplicateFoods(foods) {
  const seen = new Map()
  const unique = []

  for (const food of foods) {
    const key = `${food.name.toLowerCase()}-${food.brand?.toLowerCase() || ''}`
    if (!seen.has(key)) {
      seen.set(key, true)
      unique.push(food)
    }
  }

  return unique
}
/**
 * Update recent food (for backward compatibility)
 */
export async function updateRecentFood(userId, foodData) {
  // This function is kept for backward compatibility
  // Recent foods are now tracked automatically via food_log
  return true
}
