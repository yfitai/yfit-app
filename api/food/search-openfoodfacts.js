/**
 * Vercel Serverless Function - Open Food Facts Search Proxy
 *
 * ARCHITECTURE NOTE (May 2026):
 * This endpoint is NOT used for English searches — USDA FoodData Central is the primary
 * source for English. This endpoint is reserved for non-English users (Spanish, French,
 * Portuguese, Hindi, Mandarin) when multilingual support is added.
 *
 * Pass ?language=es for Spanish, ?language=fr for French, etc.
 * The client-side (foodDatabase.js) filters results to the requested language.
 *
 * Endpoint: /api/food/search-openfoodfacts?query=pollo&pageSize=200&language=es
 * Method: GET
 * Returns: Raw food search results from Open Food Facts (world subdomain)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query, pageSize = 200, language = 'en' } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' })
    }

    console.log(`[OFF] Searching for: ${query}, pageSize: ${pageSize}, language: ${language}`)

    // Use world.openfoodfacts.org — DO NOT change to us.openfoodfacts.org (causes timeouts)
    // No server-side language filter — client-side filtering handles language selection
    // because the tag_0=en filter at API level is too restrictive and returns almost nothing
    const params = new URLSearchParams({
      search_terms: query,
      page_size: pageSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes,categories_tags',
      json: 1
    })

    const openFoodFactsUrl = `https://world.openfoodfacts.org/cgi/search.pl?${params}`

    const response = await fetch(openFoodFactsUrl, {
      headers: {
        'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)',
      },
    })

    if (!response.ok) {
      console.error(`[OFF] API error: ${response.status}`)
      return res.status(200).json({ products: [] })
    }

    const data = await response.json()
    const products = data.products || []

    console.log(`[OFF] Found ${products.length} raw results for: ${query} (language: ${language})`)

    return res.status(200).json({ products })

  } catch (error) {
    console.error('[OFF] Error:', error)
    return res.status(200).json({ products: [] })
  }
}
