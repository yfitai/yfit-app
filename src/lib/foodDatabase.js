/**
 * YFIT Food Database API Integration
 * Handles food search, barcode lookup, and caching
 * Integrates with Open Food Facts and USDA FoodData Central
 */

import { supabase } from './supabase'
import { CapacitorHttp } from '@capacitor/core'


// API Configuration
const OPEN_FOOD_FACTS_API = 'https://us.openfoodfacts.org/api/v2' // Use US subdomain for English products
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Get USDA API key from environment variable
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'K0bD3QgyBqLrG7hXy4RgKkFFvNAmHnCXdWBet22m'
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


  try {
    const results = []

    // Search both APIs in PARALLEL for faster results
    if (source === 'all') {
      console.log('🔍 Searching USDA + Open Food Facts in parallel...')
      const [offResults, usdaResults] = await Promise.all([
        searchOpenFoodFacts(query, limit).catch(err => {
          console.warn('Open Food Facts search failed:', err.message)
          return []
        }),
        searchUSDA(query, limit).catch(err => {
          console.warn('USDA search failed:', err.message)
          return []
        })
      ])
      console.log(`🔍 Results: ${offResults.length} branded + ${usdaResults.length} USDA`)
      results.push(...offResults)
      results.push(...usdaResults)
    }

    // Search Custom Foods (user-created)
    if (source === 'custom') {
      try {
        const customResults = await searchCustomFoods(query, limit)
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
    // Use absolute URL because Android WebView doesn't have proper window.location.origin
    // 10 second timeout to avoid hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    let response
    try {
      response = await fetch(
        `https://yfit-deploy.vercel.app/api/food/search?query=${encodeURIComponent(query)}&pageSize=${Math.min(limit, 40)}`,
        { signal: controller.signal }
      )
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        console.warn('⏱️ USDA timed out after 10s')
        return []
      }
      throw fetchErr
    }
    clearTimeout(timeoutId)

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
        
        // Penalize only truly irrelevant items (not common foods)
        const irrelevantKeywords = [
          'frozen meal', 'tv dinner', 'baby food', 'infant formula',
          'dietary supplement', 'protein powder', 'shake mix'
        ]
        
        const hasIrrelevantKeyword = irrelevantKeywords.some(keyword => 
          nameLower.includes(keyword) && !queryLower.includes(keyword)
        )
        
        if (hasIrrelevantKeyword) relevanceScore -= 30
        
        // Boost simple, whole foods
        const isSimpleFood = nameLower.split(',').length === 1 && nameLower.split(' ').length <= 3
        if (isSimpleFood) relevanceScore += 10
        
        // Penalize foods with too many descriptors (likely not what user wants)
        const wordCount = nameLower.split(' ').length
        if (wordCount > 8) relevanceScore -= 10
        
        return {
          food,
          relevanceScore
        }
      })
      .filter(item => item.relevanceScore > 0) // Accept anything with any relevance
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

  // Use actual brand name for branded foods, 'Whole Food' for generic USDA items
  const brandName = usdaFood.brandOwner || usdaFood.brandName || 
    (usdaFood.dataType === 'Branded' ? 'Branded' : 'Whole Food')

  return {
    id: `usda-${usdaFood.fdcId}`,
    name: usdaFood.description,
    brand: brandName,
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
 * Score and transform Open Food Facts products by relevance
 * Used by both native (direct) and web (proxy) paths
 */
function scoreAndTransformOFF(products, query, limit) {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(' ').filter(w => w.length > 2)

  const FOREIGN_WORDS = [
    'fromage', 'lait', 'blanc', 'frais', 'beurre', 'crème', 'farine', 'sucre', 'sel',
    'poulet', 'boeuf', 'porc', 'poisson', 'légumes', 'fruits', 'jus', 'eau',
    'leche', 'queso', 'mantequilla', 'harina', 'azúcar', 'pollo', 'carne', 'cerdo',
    'milch', 'käse', 'mehl', 'zucker', 'hühnchen', 'fleisch', 'nudeln',
    'formaggio', 'burro', 'farina', 'zucchero',
    'leite', 'queijo', 'manteiga', 'farinha', 'açúcar', 'frango',
  ]
  const NON_ENGLISH_BRANDS = [
    'sidi ali', 'sidi-ali', 'jaouda', 'oulmès', 'centrale danone', 'perly',
    'vittel', 'evian', 'perrier', 'volvic', 'buldak', 'samyang',
    'milky food professional', 'la brea'
  ]

  return products
    .map(product => {
      if (!product.product_name || !product.nutriments) return null
      const name = product.product_name || ''
      const nameLower = name.toLowerCase()
      const brand = (product.brands || '').toLowerCase()
      const nutriments = product.nutriments

      if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(name)) return null
      if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿœ]/i.test(name)) return null

      const langCodes = product.languages_codes || {}
      const langKeys = Object.keys(langCodes)
      if (langKeys.length > 0 && !langKeys.some(c => c.startsWith('en'))) return null

      if (FOREIGN_WORDS.some(w => new RegExp(`\\b${w}\\b`, 'i').test(nameLower))) return null
      if (NON_ENGLISH_BRANDS.some(b => brand.includes(b) || nameLower.includes(b))) return null

      const hasNutrition = nutriments.proteins_100g !== undefined ||
        nutriments.carbohydrates_100g !== undefined ||
        nutriments.fat_100g !== undefined ||
        nutriments['energy-kcal_100g'] !== undefined ||
        nutriments.energy_100g !== undefined
      if (!hasNutrition) return null

      let relevanceScore = 0
      if (nameLower === queryLower) relevanceScore += 100
      if (nameLower.startsWith(queryLower)) relevanceScore += 50
      if (nameLower.includes(queryLower)) relevanceScore += 30
      const matchedWords = queryWords.filter(w => nameLower.includes(w)).length
      if (queryWords.length > 0) relevanceScore += (matchedWords / queryWords.length) * 40
      if (brand && queryWords.some(w => brand.includes(w))) relevanceScore += 20
      if (nameLower.split(' ').length > 8) relevanceScore -= 10

      return { product, relevanceScore }
    })
    .filter(item => item !== null && item.relevanceScore > 5)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(item => transformOpenFoodFactsProduct(item.product))
}

/**
 * Search Open Food Facts API
 * Uses CapacitorHttp for direct device-side calls (bypasses CORS on Android/iOS)
 * Falls back to fetch for web browser
 */
async function searchOpenFoodFacts(query, limit) {
  try {
    // Fetch size: request more than needed since we'll filter some out
    const fetchSize = Math.min(limit * 2, 60)
    
    // Build the Open Food Facts URL - use world subdomain for global branded coverage
    // Pre-filter for English at API level with tag_0=en
    const params = new URLSearchParams({
      search_terms: query,
      page_size: fetchSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes',
      tagtype_0: 'languages',
      tag_contains_0: 'contains',
      tag_0: 'en',
      json: 1
    })
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?${params}`

    let rawData
    try {
      // Use CapacitorHttp on native (Android/iOS) to bypass CORS restrictions
      // On web browser, fall back to regular fetch
      const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
      if (isNative) {
        const result = await CapacitorHttp.get({
          url: offUrl,
          headers: { 'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)' },
          readTimeout: 8000,
          connectTimeout: 5000
        })
        rawData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      } else {
        // Web browser - use Vercel proxy to avoid CORS
        const proxyResponse = await fetch(
          `https://yfit-deploy.vercel.app/api/food/search-openfoodfacts?query=${encodeURIComponent(query)}&pageSize=${fetchSize}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!proxyResponse.ok) throw new Error(`Proxy error: ${proxyResponse.status}`)
        const proxyData = await proxyResponse.json()
        // Proxy already filters, so wrap in expected format
        return proxyData.products ? scoreAndTransformOFF(proxyData.products, query, limit) : []
      }
    } catch (fetchErr) {
      console.warn('Open Food Facts direct call failed:', fetchErr.message)
      return []
    }

    const data = rawData
    if (!data.products || data.products.length === 0) {
      return []
    }

    // Use shared scoring/filtering helper
    return scoreAndTransformOFF(data.products, query, limit)
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
  serving_size: product.serving_size || '100g',
  serving_unit: product.serving_size?.match(/[a-z]+/i)?.[0] || 'g',  
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
    // Call OpenFoodFacts API directly using CapacitorHttp (bypasses WebView restrictions)
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    
    const response = await CapacitorHttp.get({
      url: apiUrl,
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      }
    })
    
    if (response.status !== 200) {
      return null
    }
    
    const data = response.data
    
    if (data.status === 1 && data.product) {
      const transformed = transformOpenFoodFactsProduct(data.product)
      return transformed
    }

    return null
  } catch (error) {
    console.error('Error in getFoodByBarcode:', error)
    return null
  }
}

/**
 * Get recent foods for a user
 */
export async function getRecentFoods(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('food_id, food_name, brand, calories, protein_g, carbs_g, fat_g, fiber, sugar, sodium, serving_quantity, serving_unit')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit * 3) // Get more to account for duplicates

    if (error) throw error

    // Extract unique foods by food_name + brand
    const seen = new Set()
    const uniqueFoods = []

    for (const meal of data || []) {
      const key = `${meal.food_name}-${meal.brand || ''}`
      
      if (!seen.has(key)) {
        seen.add(key)
        
        // Reconstruct food object from meal data
        uniqueFoods.push({
          id: meal.food_id || `meal-${meal.food_name}`,
          name: meal.food_name,
          brand: meal.brand || '',
          source: 'recent',
          calories: meal.calories || 0,
          protein: meal.protein_g || 0,
          carbs: meal.carbs_g || 0,
          fat: meal.fat_g || 0,
          fiber: meal.fiber || 0,
          sugar: meal.sugar || 0,
          sodium: meal.sodium || 0,
          servingSize: 100,
          servingUnit: 'g',
          serving_size: '100g',
          foodType: 'solid'
        })
        
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
