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

    // Build query parameters - use world.openfoodfacts.org for better coverage
    const params = new URLSearchParams({
      search_terms: query,
      page_size: pageSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes,categories_tags',
      json: 1
    });

    // Fetch from Open Food Facts API - use world subdomain for maximum coverage
    const openFoodFactsUrl = `https://world.openfoodfacts.org/cgi/search.pl?${params}`;
    
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

    // cgi/search.pl returns { products: [...] } same as v2/search
    const products = data.products || [];
    console.log(`[API] Open Food Facts search success, found ${products.length} results`);

    // Return in consistent format
    return res.status(200).json({ products });

  } catch (error) {
    console.error('[API] Error in Open Food Facts search:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
