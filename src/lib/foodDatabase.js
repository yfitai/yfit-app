/**
 * YFIT Food Database API Integration
 * Handles food search, barcode lookup, and caching
 *
 * Architecture (May 2026):
 *   PRIMARY:  USDA FoodData Central — all 4 data types, English only, consistent nutrition data
 *   FALLBACK: Open Food Facts — only used when userLanguage !== 'en', filtered to that language
 *   CUSTOM:   Supabase custom_foods + favorite_foods (My Foods tab)
 *
 * This structure is intentional:
 *   - USDA covers ~250K whole foods + major US brands in clean English
 *   - OFF's world database is valuable for non-English users (Spanish, French, etc.)
 *   - When multilingual support is added, pass userLanguage to searchFoods()
 */

import { supabase } from './supabase'
import { CapacitorHttp } from '@capacitor/core'

// API Configuration
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Get USDA API key from environment variable
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'K0bD3QgyBqLrG7hXy4RgKkFFvNAmHnCXdWBet22m'

/**
 * Search for foods across databases
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Max results (default 40)
 * @param {string} options.source - 'all' | 'custom'
 * @param {string} options.userLanguage - ISO 639-1 language code (default 'en')
 *   When 'en': USDA only (clean, consistent English results)
 *   When other: USDA + Open Food Facts filtered to that language
 * @returns {Promise<Array>} - Array of food results
 */
export async function searchFoods(query, options = {}) {
  const { limit = 40, source = 'all', userLanguage = 'en' } = options

  try {
    const results = []

    if (source === 'all') {
      // Always search USDA — primary source for all languages
      try {
        const usdaResults = await searchUSDA(query, limit)
        results.push(...usdaResults)
      } catch (error) {
        console.warn('USDA search failed:', error.message)
      }

      // Open Food Facts fallback — only for non-English users
      // When multilingual support is added, this activates automatically
      if (userLanguage !== 'en') {
        try {
          const offResults = await searchOpenFoodFacts(query, limit, userLanguage)
          results.push(...offResults)
        } catch (error) {
          console.warn('Open Food Facts search failed:', error.message)
        }
      }
    }

    // Search custom foods (user-created)
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

    // Sort: whole/foundation foods first, then branded, then survey items
    const dataTypePriority = { 'Foundation': 0, 'SR Legacy': 1, 'Survey (FNDDS)': 2, 'Branded': 3 }
    uniqueResults.sort((a, b) => {
      const pa = dataTypePriority[a._dataType] ?? 4
      const pb = dataTypePriority[b._dataType] ?? 4
      if (pa !== pb) return pa - pb
      return (b._relevanceScore || 0) - (a._relevanceScore || 0)
    })

    return uniqueResults.slice(0, limit)
  } catch (error) {
    console.error('Error searching foods:', error)
    return []
  }
}


/**
 * Search USDA FoodData Central API
 * Uses the Vercel proxy to avoid CORS issues on Android WebView
 */
async function searchUSDA(query, limit) {
  try {
    // Use CapacitorHttp to bypass Android WebView CORS restrictions
    // (same pattern as getFoodByBarcode — fetch() is blocked on native)
    const apiUrl = `https://yfit-deploy.vercel.app/api/food/search?query=${encodeURIComponent(query)}&pageSize=${limit * 2}`

    const response = await CapacitorHttp.get({
      url: apiUrl,
      headers: { 'Accept': 'application/json' },
      connectTimeout: 12000,
      readTimeout: 12000
    })

    if (response.status !== 200) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = response.data

    if (!data.foods || data.foods.length === 0) {
      return []
    }

    // Score and rank results by relevance
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)

    const scored = data.foods
      .map(food => {
        const nameLower = (food.description || '').toLowerCase()
        let score = 0

        // Exact match
        if (nameLower === queryLower) score += 100
        // Starts with query
        if (nameLower.startsWith(queryLower)) score += 50
        // Contains full query phrase
        if (nameLower.includes(queryLower)) score += 40
        // All query words present
        const matchedWords = queryWords.filter(w => nameLower.includes(w)).length
        if (queryWords.length > 0) score += (matchedWords / queryWords.length) * 30

        // Boost simple whole foods (short names, no brand clutter)
        const wordCount = nameLower.split(/\s+/).length
        if (wordCount <= 3) score += 15
        if (wordCount > 8) score -= 10

        // Penalize irrelevant categories when not explicitly searched
        const irrelevant = ['baby food', 'infant formula', 'dietary supplement']
        if (irrelevant.some(k => nameLower.includes(k) && !queryLower.includes(k))) score -= 30

        return { food, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => transformUSDAFood(item.food, item.score))

    return scored
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('USDA search timed out after 12s')
    } else {
      console.error('Error searching USDA:', error)
    }
    return []
  }
}


/**
 * Transform USDA food data to our standard format
 */
function transformUSDAFood(usdaFood, relevanceScore = 0) {
  const nutrients = {}

  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase() || ''
      const exactName = nutrient.nutrientName || ''
      const value = nutrient.value || 0

      if (name.includes('protein')) nutrients.protein = value
      else if (name.includes('carbohydrate')) nutrients.carbs = value
      else if (name.includes('total lipid') || name.includes('fat, total')) nutrients.fat = value
      else if (name.includes('energy') && nutrient.unitName === 'KCAL') nutrients.calories = value
      else if (name.includes('fiber')) nutrients.fiber = value
      else if (
        exactName === 'Total Sugars' ||
        name.includes('sugars, total') ||
        name.includes('sugars, added') ||
        name.includes('sugar, total') ||
        name.includes('total sugars')
      ) nutrients.sugar = value
      else if (name.includes('sodium')) nutrients.sodium = value
    })
  }

  // Detect liquid foods
  const nameLower = (usdaFood.description || '').toLowerCase()
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

  // Use real brand name from USDA; fall back to 'Whole Food' for unbranded items
  const brandName = usdaFood.brandName || usdaFood.brandOwner || null
  const displayBrand = brandName
    ? brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase()
    : 'Whole Food'

  // Use USDA's actual serving size if available (branded foods have this)
  const labelServingGrams = usdaFood.servingSize || null
  const labelServingText = usdaFood.householdServingFullText || null

  return {
    id: `usda-${usdaFood.fdcId}`,
    name: usdaFood.description,
    brand: displayBrand,
    source: 'usda',
    calories: Math.round(nutrients.calories || 0),
    protein: Math.round(nutrients.protein || 0),
    carbs: Math.round(nutrients.carbs || 0),
    fat: Math.round(nutrients.fat || 0),
    fiber: Math.round(nutrients.fiber || 0),
    sugar: Math.round(nutrients.sugar || 0),
    sodium: Math.round(nutrients.sodium || 0),
    // Serving size: use USDA label serving if available, else 100g default
    servingSize: labelServingGrams || 100,
    servingUnit: isLiquid ? 'ml' : 'g',
    servingGrams: labelServingGrams || 100,
    // Human-readable label for the serving dropdown (e.g. "1 CHICKEN BREAST (284g)")
    serving_size_label: labelServingGrams && labelServingText
      ? `${labelServingText} (${Math.round(labelServingGrams)}g)`
      : labelServingGrams
        ? `${Math.round(labelServingGrams)}${isLiquid ? 'ml' : 'g'}`
        : (isLiquid ? '100ml' : '100g'),
    serving_size: labelServingGrams
      ? `${Math.round(labelServingGrams)}${isLiquid ? 'ml' : 'g'}`
      : (isLiquid ? '100ml' : '100g'),
    serving_unit: isLiquid ? 'ml' : 'g',
    foodType: isLiquid ? 'liquid' : 'solid',
    _dataType: usdaFood.dataType || 'Branded',
    _relevanceScore: relevanceScore
  }
}


/**
 * Search Open Food Facts API
 * Only used for non-English users — filtered to the user's language
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @param {string} language - ISO 639-1 language code (e.g. 'es', 'fr', 'pt')
 */
async function searchOpenFoodFacts(query, limit, language = 'en') {
  try {
    // Use CapacitorHttp to bypass Android WebView CORS restrictions
    const apiUrl = `https://yfit-deploy.vercel.app/api/food/search-openfoodfacts?query=${encodeURIComponent(query)}&pageSize=${limit * 5}&language=${encodeURIComponent(language)}`

    const response = await CapacitorHttp.get({
      url: apiUrl,
      headers: { 'Accept': 'application/json' },
      connectTimeout: 30000,
      readTimeout: 30000
    })

    if (response.status !== 200) {
      throw new Error(`Open Food Facts API error: ${response.status}`)
    }

    const data = response.data

    if (!data.products || data.products.length === 0) {
      return []
    }

    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

    // Build stem variants for plural/singular matching
    const stemVariants = queryWords.flatMap(word => {
      const variants = [word]
      if (word.endsWith('ies')) variants.push(word.slice(0, -3) + 'y')
      if (word.endsWith('es') && word.length > 4) variants.push(word.slice(0, -2))
      if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) variants.push(word.slice(0, -1))
      if (!word.endsWith('s')) variants.push(word + 's')
      return variants
    })

    const scored = data.products
      .map(product => {
        if (!product.product_name || !product.nutriments) return null

        const name = product.product_name || ''
        const nameLower = name.toLowerCase()
        const brand = (product.brands || '').toLowerCase()
        const nutriments = product.nutriments

        // Filter: must have the target language code
        const langCodes = Object.keys(product.languages_codes || {})
        if (!langCodes.includes(language)) return null

        // Filter: must have nutrition data
        const hasNutrition = (
          nutriments.proteins_100g !== undefined ||
          nutriments.carbohydrates_100g !== undefined ||
          nutriments.fat_100g !== undefined ||
          nutriments['energy-kcal_100g'] !== undefined ||
          nutriments.energy_100g !== undefined
        )
        if (!hasNutrition) return null

        // For English, apply strict non-Latin / accented character filters
        if (language === 'en') {
          const hasNonLatinChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(name)
          if (hasNonLatinChars) return null
          const ACCENTED = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]/
          if (ACCENTED.test(name)) return null
          if (ACCENTED.test(product.brands || '')) return null
        }

        // Relevance scoring
        let score = 0
        if (nameLower === queryLower) score += 100
        if (nameLower.startsWith(queryLower)) score += 50
        if (nameLower.includes(queryLower)) score += 30
        const matchedWords = queryWords.filter(w => nameLower.includes(w)).length
        if (queryWords.length > 0) score += (matchedWords / queryWords.length) * 40
        const stemMatched = stemVariants.filter(s => nameLower.includes(s)).length
        if (stemMatched > 0) score += 25
        if (brand && queryWords.some(w => brand.includes(w))) score += 20
        const wordCount = nameLower.split(/\s+/).length
        if (wordCount > 8) score -= 10

        return { product, score }
      })
      .filter(item => item !== null && item.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => transformOpenFoodFactsProduct(item.product, item.score))

    return scored
  } catch (error) {
    console.error('Error searching Open Food Facts:', error)
    return []
  }
}


/**
 * Transform Open Food Facts product to our standard format
 */
function transformOpenFoodFactsProduct(product, relevanceScore = 0) {
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
    productName.includes('juice') ||
    productName.includes('drink') ||
    productName.includes('beverage') ||
    (productName.includes('milk') && !productName.includes('cheese')) ||
    productName.includes('water') ||
    productName.includes('soda') ||
    productName.includes('soup') ||
    productName.includes('broth') ||
    productName.includes('honey') ||
    productName.includes('cream') ||
    productName.includes('ketchup') ||
    productName.includes(' 2l') ||
    productName.includes(' 1l') ||
    productName.includes(' ml') ||
    (product.serving_size && (
      product.serving_size.includes('ml') ||
      product.serving_size.includes('mL') ||
      product.serving_size.includes('fl oz')
    ))
  ) || false

  // Validate data — macros can't exceed 100g per 100g (allow 10% margin)
  const totalMacros = (nutriments.proteins_100g || 0) + (nutriments.carbohydrates_100g || 0) + (nutriments.fat_100g || 0)
  const dataIsCorrupted = totalMacros > 110
  const correctionFactor = dataIsCorrupted ? 10 : 1
  if (dataIsCorrupted) {
    console.warn('⚠️ Corrupted OFF data for', product.product_name, '- applying 10x correction')
  }

  // Parse serving grams from strings like "1 scoop (30g)", "3/4 cup (55g)", or "30g"
  const parseServingGrams = (raw) => {
    if (!raw) return 100
    const inParens = raw.match(/\((\d+(?:\.\d+)?)\s*g\)/i)
    if (inParens) return parseFloat(inParens[1])
    return parseFloat(raw) || 100
  }

  const servingGrams = parseServingGrams(product.serving_size)

  return {
    id: `off-${product.code}`,
    name: product.product_name,
    brand: product.brands || 'Unknown',
    source: 'openfoodfacts',
    calories: Math.round((nutriments['energy-kcal_100g'] || (nutriments.energy_100g || 0) / 4.184 || 0) / correctionFactor),
    protein: Math.round((nutriments.proteins_100g || 0) / correctionFactor),
    carbs: Math.round((nutriments.carbohydrates_100g || 0) / correctionFactor),
    fat: Math.round((nutriments.fat_100g || 0) / correctionFactor),
    fiber: Math.round((nutriments.fiber_100g || 0) / correctionFactor),
    sugar: Math.round((nutriments.sugars_100g || 0) / correctionFactor),
    sodium: Math.round((nutriments.sodium_100g || 0) * 1000 / correctionFactor),
    servingSize: servingGrams,
    servingUnit: isLiquid ? 'ml' : 'g',
    servingGrams,
    serving_size_label: product.serving_size || null,
    serving_size: product.serving_size || (isLiquid ? '100ml' : '100g'),
    serving_unit: product.serving_size?.match(/[a-z]+/i)?.[0] || (isLiquid ? 'ml' : 'g'),
    foodType: isLiquid ? 'liquid' : 'solid',
    _dataType: 'Branded',
    _relevanceScore: relevanceScore
  }
}


/**
 * Search custom foods created by user
 * Note: Favorited foods are NOT included in search results — they appear in "My Foods" section only
 */
async function searchCustomFoods(query, limit) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: customData, error: customError } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (!customError && customData) {
      return customData.map(food => ({
        ...food,
        source: 'custom',
        id: `custom-${food.id}`
      }))
    }

    return []
  } catch (error) {
    console.error('Error searching custom foods:', error)
    return []
  }
}


/**
 * Get food by barcode
 * Uses CapacitorHttp to bypass WebView CORS restrictions
 */
export async function getFoodByBarcode(barcode) {
  try {
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`

    const response = await CapacitorHttp.get({
      url: apiUrl,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YFIT/1.0 (contact@yfit.app)'
      }
    })

    if (response.status !== 200) return null

    const data = response.data
    if (data.status === 1 && data.product) {
      return transformOpenFoodFactsProduct(data.product)
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
      .limit(limit * 3)

    if (error) throw error

    const seen = new Set()
    const uniqueFoods = []

    for (const meal of data || []) {
      const key = `${meal.food_name}-${meal.brand || ''}`

      if (!seen.has(key)) {
        seen.add(key)
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
    if (error.code === 'PGRST205') return []
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
      .select('id, food_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(entry => ({ ...entry.food_data, _favoriteRowId: entry.id }))
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
      .insert({ user_id: userId, food_data: foodData })

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
export async function removeFavoriteFood(userId, foodId, favoriteRowId) {
  try {
    if (favoriteRowId) {
      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('id', favoriteRowId)
        .eq('user_id', userId)
      if (error) throw error
      return true
    }

    // Fallback: find by food_data.id (backwards compatibility)
    const { data: favorites, error: fetchError } = await supabase
      .from('favorite_foods')
      .select('id, food_data')
      .eq('user_id', userId)

    if (fetchError) throw fetchError

    const favoriteToDelete = favorites?.find(fav => fav.food_data?.id === foodId)
    if (!favoriteToDelete) {
      console.warn('Favorite food not found:', foodId)
      return false
    }

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
    const key = `${(food.name || '').toLowerCase()}-${(food.brand || '').toLowerCase()}`
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
 * Update recent food (kept for backward compatibility)
 */
export async function updateRecentFood(userId, foodData) {
  return true
}
