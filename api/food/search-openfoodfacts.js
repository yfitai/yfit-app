/**
 * Vercel Serverless Function - Open Food Facts Search Proxy
 * 
 * This endpoint proxies requests to Open Food Facts API to avoid CORS issues
 * when the app is loaded remotely from Vercel.
 * 
 * Endpoint: /api/food/search-openfoodfacts?query=chicken&pageSize=50
 * Method: GET
 * Returns: Food search results from Open Food Facts
 */

export default async function handler(req, res) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, pageSize = 50 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[API] Searching Open Food Facts for: ${query}`);

    // Build query parameters
    const params = new URLSearchParams({
      search_terms: query,
      page_size: pageSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes',
      tagtype_0: 'languages',
      tag_contains_0: 'contains',
      tag_0: 'en', // Filter for products with English language tag
      json: 1
    });

    // Fetch from Open Food Facts API
    const openFoodFactsUrl = `https://us.openfoodfacts.org/api/v2/search?${params}`;
    
    const response = await fetch(openFoodFactsUrl, {
      headers: {
        'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)',
      },
    });

    if (!response.ok) {
      console.error(`[API] Open Food Facts API error: ${response.status}`);
      return res.status(response.status).json({ 
        error: 'Failed to fetch from Open Food Facts',
        status: response.status 
      });
    }

    const data = await response.json();

    console.log(`[API] Open Food Facts search success, found ${data.products?.length || 0} results`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[API] Error in Open Food Facts search:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
