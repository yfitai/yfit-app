/**
 * Vercel Serverless Function - Food Barcode Lookup Proxy
 * 
 * This endpoint proxies requests to Open Food Facts API to avoid CORS issues
 * when the app is loaded remotely from Vercel.
 * 
 * Endpoint: /api/food/barcode/:barcode
 * Method: GET
 * Returns: Food product data from Open Food Facts
 */

export default async function handler(req, res) {
  // Enable CORS for the frontend (extra permissive for Android WebView)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Additional headers for better compatibility
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barcode } = req.query;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode parameter is required' });
    }

    // Validate barcode format (should be numeric)
    if (!/^\d+$/.test(barcode)) {
      return res.status(400).json({ error: 'Invalid barcode format' });
    }

    console.log(`[API] Fetching barcode: ${barcode}`);

    // Fetch from Open Food Facts API
    const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    
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

    console.log(`[API] Success for barcode ${barcode}, status: ${data.status}`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[API] Error in barcode lookup:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
