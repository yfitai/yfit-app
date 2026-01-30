/**
 * Vercel Serverless Function - USDA Food Search Proxy
 * 
 * This endpoint proxies requests to USDA FoodData Central API to avoid CORS issues
 * when the app is loaded remotely from Vercel.
 * 
 * Endpoint: /api/food/search?query=chicken&pageSize=25
 * Method: GET
 * Returns: Food search results from USDA FoodData Central
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
    const { query, pageSize = 25 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[API] Searching USDA for: ${query}`);

    // USDA FoodData Central API
    // Note: Using demo key for now - should be replaced with actual API key in production
    const usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}`;
    
    const response = await fetch(usdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)',
      },
      body: JSON.stringify({
        query: query,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],  // Exclude branded foods from USDA
        pageSize: parseInt(pageSize),
        pageNumber: 1,
        sortBy: 'score',
        sortOrder: 'desc'
      })
    });

    if (!response.ok) {
      console.error(`[API] USDA API error: ${response.status}`);
      const errorText = await response.text();
      console.error('[API] USDA error response:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch from USDA FoodData Central',
        status: response.status 
      });
    }

    const data = await response.json();

    console.log(`[API] USDA search success, found ${data.foods?.length || 0} results`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[API] Error in USDA search:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
