/**
 * YFIT Food Database API Integration
 * Handles food search, barcode lookup, and caching
 * Integrates with Open Food Facts and USDA FoodData Central
 */

import { supabase } from './supabase'

// API Configuration
const OPEN_FOOD_FACTS_API = 'https://us.openfoodfacts.org/api/v2' // Use US subdomain for English products
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
    
    // Use backend proxy to avoid CORS issues with remote loading
    const response = await fetch(
      `/api/food/search?query=${encodeURIComponent(query)}&pageSize=${limit * 2}`
    )

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
    const queryWords = queryLower.split(' ')
    
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
        const matchedWords = queryWords.filter(word => nameLower.includes(word)).length
        relevanceScore += (matchedWords / queryWords.length) * 30
        
        // Penalize overly processed or irrelevant items
        const irrelevantKeywords = [
          'spread', 'dip', 'sauce', 'dressing', 'mix', 'prepared',
          'frozen meal', 'tv dinner', 'baby food', 'infant formula',
          'dietary supplement', 'protein powder', 'shake mix'
        ]
        
        const hasIrrelevantKeyword = irrelevantKeywords.some(keyword => 
          nameLower.includes(keyword) && !queryLower.includes(keyword)
        )
        
        if (hasIrrelevantKeyword) relevanceScore -= 60 // Increased penalty from 40 to 60
        
        // Boost simple, whole foods
        const isSimpleFood = nameLower.split(',').length === 1 && nameLower.split(' ').length <= 3
        if (isSimpleFood) relevanceScore += 10
        
        // Penalize foods with too many descriptors (likely not what user wants)
        const wordCount = nameLower.split(' ').length
        if (wordCount > 6) relevanceScore -= 15
        
        return {
          food,
          relevanceScore
        }
      })
      .filter(item => item.relevanceScore > 5) // Lowered from 10 to 5 for better coverage
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
    // Debug: log all nutrient names to help identify sugar fields
    const nutrientNames = usdaFood.foodNutrients.map(n => n.nutrientName)
    if (usdaFood.description?.toLowerCase().includes('sugar') || usdaFood.description?.toLowerCase().includes('cookie')) {
      console.log('🍬 Food with sugar in name:', usdaFood.description)
      console.log('🍬 Available nutrients:', nutrientNames)
    }
    
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase()
      const exactName = nutrient.nutrientName // Keep original case for exact matching
      const value = nutrient.value || 0
      
      if (name?.includes('protein')) nutrients.protein = value
      else if (name?.includes('carbohydrate')) nutrients.carbs = value
      else if (name?.includes('total lipid') || name?.includes('fat, total')) nutrients.fat = value
      else if (name?.includes('energy') && nutrient.unitName === 'KCAL') nutrients.calories = value
      else if (name?.includes('fiber')) nutrients.fiber = value
      else if (exactName === 'Total Sugars' || name?.includes('sugars, total') || name?.includes('sugars, added') || name?.includes('sugar, total') || name?.includes('total sugars')) nutrients.sugar = value
      else if (name?.includes('sodium')) nutrients.sodium = value
    })
  }

  console.log('🥗 Extracted nutrients:', nutrients)

  // Detect if food is liquid
  const nameLower = usdaFood.description.toLowerCase()
  const isLiquid = (
    nameLower.includes('juice') ||
    nameLower.includes('drink') ||
    nameLower.includes('beverage') ||
    (nameLower.includes('milk') && !nameLower.includes('cheese') && !nameLower.includes('powder')) ||
    nameLower.includes('water') ||
    nameLower.includes('soda') ||
    nameLower.includes('soup') ||
    nameLower.includes('broth') ||
    nameLower.includes('honey') ||
    nameLower.includes('cream') ||
    nameLower.includes('sauce') ||
    nameLower.includes('syrup')
  )

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
    servingUnit: isLiquid ? 'ml' : 'g',
    serving_size: isLiquid ? '100ml' : '100g', // For display in search results
    foodType: isLiquid ? 'liquid' : 'solid'
  }
}

/**
 * Search Open Food Facts API
 */
async function searchOpenFoodFacts(query, limit) {
  try {
    // Use backend proxy to avoid CORS issues with remote loading
    const response = await fetch(
      `/api/food/search-openfoodfacts?query=${encodeURIComponent(query)}&pageSize=${limit * 5}`
    )

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.products || data.products.length === 0) {
      return []
    }

    // Filter and score products by relevance to search query
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(' ').filter(w => w.length > 2)
    
    const scoredProducts = data.products
      .map(product => {
        if (!product.product_name || !product.nutriments) return null
        
        const name = product.product_name || ''
        const nameLower = name.toLowerCase()
        const brand = (product.brands || '').toLowerCase()
        const nutriments = product.nutriments
        
        // Filter out products with Chinese/Japanese/Korean/Arabic/Cyrillic characters
        const hasNonLatinChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(name)
        if (hasNonLatinChars) return null
        
        // Filter out specific non-English brands
        const nonEnglishBrands = ['sidi ali', 'sidi-ali']
        if (nonEnglishBrands.some(b => brand.includes(b))) return null
        
        // Filter out products without nutrition data
        const hasNutrition = (nutriments.proteins_100g !== undefined) ||
                            (nutriments.carbohydrates_100g !== undefined) ||
                            (nutriments.fat_100g !== undefined) ||
                            (nutriments['energy-kcal_100g'] !== undefined) ||
                            (nutriments.energy_100g !== undefined)
        if (!hasNutrition) return null
        
        // Calculate relevance score
        let relevanceScore = 0
        
        // Exact match gets highest score
        if (nameLower === queryLower) relevanceScore += 100
        
        // Starts with query gets high score
        if (nameLower.startsWith(queryLower)) relevanceScore += 50
        
        // Contains all query words
        const matchedWords = queryWords.filter(word => nameLower.includes(word)).length
        if (queryWords.length > 0) {
          relevanceScore += (matchedWords / queryWords.length) * 40
        }
        
        // Boost if query appears anywhere in name (for simple searches like "milk" or "soup")
        if (nameLower.includes(queryLower)) {
          relevanceScore += 30
        }
        
        // Boost if brand matches query
        if (brand && queryWords.some(word => brand.includes(word))) {
          relevanceScore += 20
        }
        
        // Penalize very long product names (likely not what user wants)
        const wordCount = nameLower.split(' ').length
        if (wordCount > 8) relevanceScore -= 10
        
        return {
          product,
          relevanceScore
        }
      })
      .filter(item => item !== null && item.relevanceScore > 5) // Filter out low relevance (lowered from 15 to 5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .map(item => transformOpenFoodFactsProduct(item.product))
    
    console.log(`📦 Open Food Facts: ${data.products.length} results → ${scoredProducts.length} after filtering`)
    return scoredProducts
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
  const categories = (product.categories_tags || []).join(' ').toLowerCase()
  const productName = (product.product_name || '').toLowerCase()
  const isLiquid = (
    categories.includes('en:beverages') || 
    categories.includes('en:drinks') || 
    categories.includes('en:juices') || 
    categories.includes('en:milks') || 
    categories.includes('en:waters') || 
    categories.includes('en:sodas') || 
    categories.includes('en:honeys') ||
    productName.includes('juice') || 
    productName.includes('drink') || 
    productName.includes('beverage') || 
    (productName.includes('milk') && !productName.includes('cheese')) || 
    productName.includes('water') || 
    productName.includes('soda') || 
    productName.includes('soup') || 
    productName.includes('broth') || 
    productName.includes('canneberge') || 
    productName.includes('cranberry') ||
    productName.includes('honey') ||
    productName.includes('miel') ||
    productName.includes('cream') ||
    productName.includes('crème') ||
    productName.includes('ketchup') ||
    productName.includes(' 2l') ||
    productName.includes(' 1l') ||
    productName.includes(' ml') ||
    (product.serving_size && (product.serving_size.includes('ml') || product.serving_size.includes('mL') || product.serving_size.includes('fl oz')))
  ) || false

    console.log('Food:', product.product_name, 'Categories:', categories, 'ProductName:', productName, 'isLiquid:', isLiquid, 'serving_size:', product.serving_size)
  console.log('🥜 API DATA:', {
    product_name: product.product_name,
    'energy-kcal_100g': nutriments['energy-kcal_100g'],
    'energy_100g': nutriments.energy_100g,
    'proteins_100g': nutriments.proteins_100g,
    'carbohydrates_100g': nutriments.carbohydrates_100g,
    'fat_100g': nutriments.fat_100g
  })

   // Validate data - check if values are suspiciously high (likely data entry error)
  const totalMacros = (nutriments.proteins_100g || 0) + (nutriments.carbohydrates_100g || 0) + (nutriments.fat_100g || 0)
  const dataIsCorrupted = totalMacros > 110 // Macros can't exceed 100g per 100g (allow 10% margin)
  const correctionFactor = dataIsCorrupted ? 10 : 1 // Divide by 10 if corrupted
  
  if (dataIsCorrupted) {
    console.warn('⚠️ Corrupted data detected for', product.product_name, '- applying 10x correction')
  }

  return {
    id: `off-${product.code}`,
    name: product.product_name,
    brand: product.brands || 'Unknown',
    source: 'openfoodfacts',
    calories: Math.round((nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0) / correctionFactor),
    protein: Math.round((nutriments.proteins_100g || 0) / correctionFactor),
    carbs: Math.round((nutriments.carbohydrates_100g || 0) / correctionFactor),
    fat: Math.round((nutriments.fat_100g || 0) / correctionFactor),
    fiber: Math.round((nutriments.fiber_100g || 0) / correctionFactor),
    sugar: Math.round((nutriments.sugars_100g || 0) / correctionFactor),
    sodium: Math.round(nutriments.sodium_100g * 1000 / correctionFactor || 0),
    servingSize: parseFloat(product.serving_size) || 100,
    servingUnit: product.serving_size?.match(/[a-z]+/i)?.[0] || 'g',
    servingGrams: parseFloat(product.serving_size) || 100,
    serving_size: product.serving_size || '100g', // For display in search results
    foodType: isLiquid ? 'liquid' : 'solid'
  }
}


 

/**
 * Search custom foods created by user
 * Note: Favorited foods are NOT included in search results - they only appear in "My Foods" section
 */
async function searchCustomFoods(query, limit) {
  try {
    // Get user ID from current session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const results = []

    // Search custom foods only (favorites are shown separately in My Foods section)
    const { data: customData, error: customError } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (!customError && customData) {
      results.push(...customData.map(food => ({
        ...food,
        source: 'custom',
        id: `custom-${food.id}`
      })))
    }

    return results
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
    console.log('🔍 getFoodByBarcode called for:', barcode)
    // Use backend proxy to avoid CORS issues with remote loading
    const response = await fetch(
      `/api/food/barcode/${barcode}`
    )

    console.log('📡 API response status:', response.status, response.ok)
    alert(`DEBUG: API Response\nStatus: ${response.status}\nOK: ${response.ok}`)
    
    if (!response.ok) {
      console.log('❌ API response not OK')
      alert(`DEBUG: API response not OK!\nStatus: ${response.status}`)
      return null
    }

    console.log('📥 About to parse JSON...')
    alert('DEBUG: About to parse JSON response')
    
    let data
    try {
      data = await response.json()
      alert('DEBUG: JSON parsed successfully!')
    } catch (jsonError) {
      alert(`DEBUG: JSON parse failed!\nError: ${jsonError.message}`)
      throw jsonError
    }
    console.log('📦 API data:', { status: data.status, hasProduct: !!data.product, productName: data.product?.product_name })
    alert(`DEBUG: API Data\nStatus: ${data.status}\nHas Product: ${!!data.product}\nName: ${data.product?.product_name || 'N/A'}`)
    
    if (data.status === 1 && data.product) {
      const transformed = transformOpenFoodFactsProduct(data.product)
      console.log('✅ Transformed product:', transformed)
      alert(`DEBUG: Transformed product:\nName: ${transformed.name}\nCalories: ${transformed.calories}\nProtein: ${transformed.protein}g`)
      return transformed
    }

    console.log('❌ No product found (status !== 1 or no product)')
    alert(`DEBUG: No product found!\nStatus was: ${data.status}\nHad product: ${!!data.product}`)
    return null
  } catch (error) {
    console.error('❌ EXCEPTION in getFoodByBarcode:', error)
    alert(`DEBUG: Exception occurred!\nError: ${error.message}\nStack: ${error.stack?.substring(0, 100)}`)
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
    // Silently ignore if table doesn't exist yet
    if (error.code === 'PGRST205') {
      return []
    }
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
    // First, get all favorites for this user
    const { data: favorites, error: fetchError } = await supabase
      .from('favorite_foods')
      .select('id, food_data')
      .eq('user_id', userId)
    
    if (fetchError) throw fetchError
    
    // Find the favorite with matching food ID
    const favoriteToDelete = favorites?.find(fav => fav.food_data?.id === foodId)
    
    if (!favoriteToDelete) {
      console.warn('Favorite food not found:', foodId)
      return false
    }
    
    // Delete by the favorite_foods table ID (not the food ID)
    const { error } = await supabase
      .from('favorite_foods')
      .delete()
      .eq('id', favoriteToDelete.id)

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
 * Add custom food created by user
 */
export async function addCustomFood(userId, foodData) {
  try {
    const { data, error } = await supabase
      .from('custom_foods')
      .insert({
        user_id: userId,
        name: foodData.name,
        brand: foodData.brand || null,
        calories: foodData.calories || 0,
        protein: foodData.protein || 0,
        carbs: foodData.carbs || 0,
        fat: foodData.fat || 0,
        fiber: foodData.fiber || 0,
        sugar: foodData.sugar || 0,
        sodium: foodData.sodium || 0,
        serving_size: foodData.serving_size || 100,
        serving_unit: foodData.serving_unit || 'g'
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error adding custom food:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update recent food (for backward compatibility)
 */
export async function updateRecentFood(userId, foodData) {
  // This function is kept for backward compatibility
  // Recent foods are now tracked automatically via food_log
  return true
}
