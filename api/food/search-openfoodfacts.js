/**
 * Vercel Serverless Function - Open Food Facts Search Proxy
 * 
 * This endpoint proxies requests to Open Food Facts API to avoid CORS issues
 * when the app is loaded remotely from Vercel.
 * Applies server-side English-only filtering before returning results.
 * 
 * Endpoint: /api/food/search-openfoodfacts?query=chicken&pageSize=50
 * Method: GET
 * Returns: English-only food search results from Open Food Facts
 */

// Known non-English brand names to block
const BLOCKED_BRANDS = [
  'sidi ali', 'sidi-ali', 'jaouda', 'oulmes', 'centrale danone', 'perly',
  'vittel', 'evian', 'perrier', 'volvic', 'buldak', 'samyang',
  'milky food professional', 'la brea'
];

// Foreign words that indicate non-English products
const FOREIGN_WORDS = [
  // French
  'fromage', 'lait', 'beurre', 'farine', 'sucre', 'poulet', 'boeuf',
  'porc', 'poisson', 'legumes', 'jus',
  // Spanish
  'leche', 'queso', 'mantequilla', 'harina', 'azucar', 'pollo', 'cerdo',
  // German
  'milch', 'kase', 'mehl', 'zucker', 'huhnchen', 'fleisch', 'nudeln',
  // Italian
  'formaggio', 'burro', 'zucchero',
  // Portuguese
  'leite', 'queijo', 'manteiga', 'farinha', 'frango',
];

function isEnglishProduct(product) {
  const name = (product.product_name || '').toLowerCase();
  const brand = (product.brands || '').toLowerCase();

  // Must have a product name
  if (!name || name.trim().length === 0) return false;

  // Block non-Latin characters (Chinese, Japanese, Korean, Arabic, Cyrillic)
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(name)) return false;

  // Block accented/special characters
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿœ]/i.test(name)) return false;

  // Language code validation - must have English
  const langCodes = product.languages_codes || {};
  const hasEnglish = Object.keys(langCodes).some(code => code.startsWith('en'));
  if (!hasEnglish) return false;

  // Block known non-English brands
  if (BLOCKED_BRANDS.some(b => brand.includes(b) || name.includes(b))) return false;

  // Block foreign words in product name
  const hasForeignWord = FOREIGN_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(name);
  });
  if (hasForeignWord) return false;

  return true;
}

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

    // Request more results than needed since we'll filter many out
    const fetchSize = Math.min(parseInt(pageSize) * 4, 200);

    // Build query parameters - use us.openfoodfacts.org for US-focused results
    const params = new URLSearchParams({
      search_terms: query,
      page_size: fetchSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes,categories_tags',
      tagtype_0: 'languages',
      tag_contains_0: 'contains',
      tag_0: 'en',  // Pre-filter for English at API level
      json: 1
    });

    // Use US subdomain for English-focused results
    const openFoodFactsUrl = `https://us.openfoodfacts.org/cgi/search.pl?${params}`;
    
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
    const rawProducts = data.products || [];
    
    // Apply server-side English-only filtering
    const englishProducts = rawProducts.filter(isEnglishProduct);
    
    console.log(`[API] Open Food Facts: ${rawProducts.length} raw → ${englishProducts.length} English-only results`);

    // Return filtered results
    return res.status(200).json({ products: englishProducts });

  } catch (error) {
    console.error('[API] Error in Open Food Facts search:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
