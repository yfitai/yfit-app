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
    console.log('✅ Final results:', uniqueResults.length)

    return uniqueResults.slice(0, limit)
  } catch (error) {
    console.error('Error searching foods:', error)
    return []
  }
}


/**
 * Search local USDA food database (food_items table)
 */
async function searchUSDA(query, limit) {
  try {
    console.log('🥗 Searching USDA for:', query)
    
    // Search by name
    const { data: nameResults, error: nameError } = await supabase
      .from('food_items')
      .select('*')
      .eq('data_source', 'usda')
      .ilike('name', `%${query}%`)
      .limit(limit)
    
    // Search by description
    const { data: descResults, error: descError } = await supabase
      .from('food_items')
      .select('*')
      .eq('data_source', 'usda')
      .ilike('description', `%${query}%`)
      .limit(limit)
    
    console.log('🥗 Name search:', nameResults?.length || 0, 'results')
    console.log('🥗 Description search:', descResults?.length || 0, 'results')
    
    if (nameError) console.error('🥗 Name search error:', nameError)
    if (descError) console.error('🥗 Description search error:', descError)
    
    // Combine and deduplicate results
    const allResults = [...(nameResults || []), ...(descResults || [])]
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values())
    
    console.log('🥗 Total unique USDA results:', uniqueResults.length)
    
    return uniqueResults.slice(0, limit).map(food => ({
      id: `usda_${food.fdc_id || food.id}`,
      fdcId: food.fdc_id,
      name: food.name,
      brand: 'USDA',
      source: 'usda',
      servingSize: food.default_serving_description || '100g',
      servingGrams: food.default_serving_size || 100,
      calories: food.calories_per_100g || 0,
      protein: food.protein_per_100g || 0,
      carbs: food.carbs_per_100g || 0,
      fat: food.fat_per_100g || 0,
      fiber: food.fiber_per_100g || 0,
      sugar: food.sugar_per_100g || 0,
      sodium: food.sodium_per_100g || 0
    }))
  } catch (error) {
    console.error('Error searching USDA:', error)
    return []
  }
}


/**
 * Transform USDA food data to our standard format
 */
function transformUSDAFood(usdaFood) {
  const nutrients = {}
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase() || ''
      const value = nutrient.value || 0
      
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
      }
    })
  }

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
    brand: 'USDA',
    source: 'usda',
    servingSize: servingSize,
    servingGrams: servingGrams,
    calories: nutrients.calories || 0,
    protein: nutrients.protein || 0,
    carbs: nutrients.carbs || 0,
    fat: nutrients.fat || 0,
    fiber: nutrients.fiber || 0,
    sugar: nutrients.sugar || 0,
    sodium: nutrients.sodium || 0
  }
}

/**
 * Search Open Food Facts API
 */
async function searchOpenFoodFacts(query, limit) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit * 4}&fields=code,product_name,product_name_en,brands,serving_size,nutriments,image_url,languages_codes`,
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

    const accentedChars = ['à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ', 'ÿ', 'ß']
    
    const nonEnglishWords = [
      ' de ', ' du ', ' des ', ' le ', ' la ', ' les ', ' au ', ' aux ',
      'fromage', 'lait', 'blanc', 'frais', 'yaourt',
      ' el ', ' los ', ' las ', ' del ', ' con ',
      ' der ', ' die ', ' das ', ' mit ', ' und '
    ]
    
    const nonEnglishBrands = [
      'sidi ali', 'jaouda', 'oulmès', 'vittel', 'evian', 'perrier'
    ]

    return (data.products || [])
      .filter(product => {
        const name = product.product_name_en || product.product_name || ''
        if (!name || name === 'Unknown Product' || name.length < 2) return false
        
        const nameLower = name.toLowerCase()
        const brand = (product.brands || '').toLowerCase()
        const queryLower = query.toLowerCase()
        
        if (!nameLower.includes(queryLower) && !brand.includes(queryLower)) {
          return false
        }
        
        if (nonEnglishBrands.some(b => brand.includes(b) || nameLower.includes(b))) return false
        if (accentedChars.some(char => nameLower.includes(char) || brand.includes(char))) return false
        
        const languages = product.languages_codes || []
        if (languages.length > 0 && !languages.includes('en')) return false
        
        const latinChars = name.match(/[a-zA-Z]/g) || []
        const totalChars = name.replace(/\s/g, '').length
        if (totalChars === 0) return false
        if (latinChars.length / totalChars < 0.9) return false
        
        return true
      })
      .slice(0, limit)
      .map(product => ({
        id: product.code,
        barcode: product.code,
        name: product.product_name_en || product.product_name,
        brand: product.brands || 'Unknown',
        source: 'openfoodfacts',
        servingSize: product.serving_size || '100g',
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
       protein: parseFloat((Number(product.nutriments?.proteins_100g) || 0).toFixed(1)),
      carbs: parseFloat((Number(product.nutriments?.carbohydrates_100g) || 0).toFixed(1)),
      fat: parseFloat((Number(product.nutriments?.fat_100g) || 0).toFixed(1)),
      fiber: parseFloat((Number(product.nutriments?.fiber_100g) || 0).toFixed(1)),
      sugar: parseFloat((Number(product.nutriments?.sugars_100g) || 0).toFixed(1)),
      sodium: Math.round(product.nutriments?.sodium_100g || 0),
      imageUrl: product.image_url
      }))
  } catch (error) {
    console.error('Error searching Open Food Facts:', error)
    return []
  }
}

/**
 * Lookup food by barcode
 */
export async function lookupBarcode(barcode) {
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Barcode lookup error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 0 || !data.product) {
      return null
    }

    const product = data.product

    return {
      id: product.code,
      barcode: product.code,
      name: product.product_name_en || product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown',
      source: 'openfoodfacts',
      servingSize: product.serving_size || '100g',
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
      protein: parseFloat((Number(product.nutriments?.proteins_100g) || 0).toFixed(1)),
     carbs: parseFloat((Number(product.nutriments?.carbohydrates_100g) || 0).toFixed(1)),
     fat: parseFloat((Number(product.nutriments?.fat_100g) || 0).toFixed(1)),
     fiber: parseFloat((Number(product.nutriments?.fiber_100g) || 0).toFixed(1)),
     sugar: parseFloat((Number(product.nutriments?.sugars_100g) || 0).toFixed(1)),
     sodium: Math.round(product.nutriments?.sodium_100g || 0),
     imageUrl: product.image_url
    }
  } catch (error) {
    console.error('Error looking up barcode:', error)
    return null
  }
}

/**
 * Save food to user's recent foods
 */
export async function saveRecentFood(userId, food) {
  try {
    const { error } = await supabase
      .from('recent_foods')
      .upsert({
        user_id: userId,
        food_id: food.id,
        food_data: food,
        last_used: new Date().toISOString()
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving recent food:', error)
    return false
  }
}

/**
 * Get user's recent foods
 */
export async function getRecentFoods(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('recent_foods')
      .select('*')
      .eq('user_id', userId)
      .order('last_used', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data?.map(item => item.food_data) || []
  } catch (error) {
    console.error('Error fetching recent foods:', error)
    return []
  }
}

/**
 * Get user's favorite foods
 */
export async function getFavoriteFoods(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('favorite_foods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data?.map(item => item.food_data) || []
  } catch (error) {
    console.error('Error fetching favorite foods:', error)
    return []
  }
}

/**
 * Get food by barcode (alias for lookupBarcode)
 */
export async function getFoodByBarcode(barcode) {
  return await lookupBarcode(barcode)
}

/**
 * Update recent food timestamp
 */
export async function updateRecentFood(userId, foodId) {
  try {
    const { error } = await supabase
      .from('recent_foods')
      .update({ last_used: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('food_id', foodId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating recent food:', error)
    return false
  }
}

/**
 * Add food to favorites
 */
export async function addFavoriteFood(userId, food) {
  try {
    const { error } = await supabase
      .from('favorite_foods')
      .insert({
        user_id: userId,
        food_id: food.id,
        food_data: food,
        created_at: new Date().toISOString()
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
      .eq('food_id', foodId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing favorite food:', error)
    return false
  }
}


/**
 * Remove duplicate foods from results
 */
function deduplicateFoods(foods) {
  const seen = new Set()
  return foods.filter(food => {
    // Include source in the key to prevent removing USDA foods that have same name as branded
    const key = `${food.name.toLowerCase()}_${(food.brand || '').toLowerCase()}_${food.source || ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}


/**
 * Get detailed food information by ID
 */
export async function getFoodDetails(foodId) {
  try {
    if (foodId.startsWith('usda_')) {
      const fdcId = foodId.replace('usda_', '')
      const response = await fetch(
        `${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`
      )
      if (!response.ok) throw new Error(`USDA API error: ${response.status}`)
      const data = await response.json()
      return transformUSDAFood(data)
    }
    
    return await lookupBarcode(foodId)
  } catch (error) {
    console.error('Error fetching food details:', error)
    return null
  }
}

export default {
  searchFoods,
  lookupBarcode,
  getFoodByBarcode,
  saveRecentFood,
  getRecentFoods,
  getFavoriteFoods,
  updateRecentFood,
  addFavoriteFood,
  removeFavoriteFood,
  getFoodDetails
}
/**
 * Search custom/user-created foods
 */
/**
 * Search custom/user-created foods
 */
async function searchCustomFoods(query, limit) {
  try {
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .ilike('product_name', `%${query}%`)
      .limit(limit)
    
    if (error) throw error
    
    return (data || []).map(food => ({
      id: `custom_${food.id}`,
      name: food.product_name,
      brand: food.brand || 'Custom',
      source: 'custom',
      servingSize: food.serving_size || '100g',
      calories: food.calories_per_100g || 0,
      protein: food.protein_per_100g || 0,
      carbs: food.carbs_per_100g || 0,
      fat: food.fat_per_100g || 0,
      fiber: food.fiber_per_100g || 0,
      sugar: food.sugar_per_100g || 0,
      sodium: food.sodium_per_100g || 0
    }))
  } catch (error) {
    console.error('Error searching custom foods:', error)
    return []
  }
}




