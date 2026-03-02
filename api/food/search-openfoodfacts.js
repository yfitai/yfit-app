/**
 * Vercel Serverless Function - Open Food Facts Search Proxy
 * 
 * This endpoint proxies requests to Open Food Facts API to avoid CORS issues
 * when the app is loaded remotely from Vercel.
 * 
 * IMPORTANT: Returns raw results WITHOUT server-side filtering.
 * Client-side (foodDatabase.js) handles English-only filtering.
 * This is intentional - the tag_0=en filter at API level is too restrictive
 * and returns almost no results for common foods.
 * 
 * Endpoint: /api/food/search-openfoodfacts?query=chicken&pageSize=200
 * Method: GET
 * Returns: Raw food search results from Open Food Facts (world subdomain)
 */
export default async function handler(req, res) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, pageSize = 200 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[OFF] Searching for: ${query}, pageSize: ${pageSize}`);

    // Build query parameters - use world.openfoodfacts.org for maximum coverage
    // NO language tag filter - it's too restrictive and returns almost nothing
    // Client-side filtering handles English-only results
    const params = new URLSearchParams({
      search_terms: query,
      page_size: pageSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes,categories_tags',
      json: 1
    });

    const openFoodFactsUrl = `https://world.openfoodfacts.org/cgi/search.pl?${params}`;

    const response = await fetch(openFoodFactsUrl, {
      headers: {
        'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)',
      },
    });

    if (!response.ok) {
      console.error(`[OFF] API error: ${response.status}`);
      return res.status(200).json({ products: [] });
    }

    const data = await response.json();
    const products = data.products || [];

    console.log(`[OFF] Found ${products.length} raw results for: ${query}`);

    return res.status(200).json({ products });

  } catch (error) {
    console.error('[OFF] Error:', error);
    return res.status(200).json({ products: [] });
  }
}
