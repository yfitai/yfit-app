/**
 * Vercel Serverless Function - Open Food Facts Search Proxy
 * 
 * Optimized for speed:
 * - Fetches only 50 items (not 200) to reduce API response time
 * - 8 second timeout to avoid hanging
 * - Server-side English-only filtering
 * 
 * Endpoint: /api/food/search-openfoodfacts?query=chicken&pageSize=20
 * Method: GET
 */

// Known non-English brand names to block
const BLOCKED_BRANDS = [
  'sidi ali', 'sidi-ali', 'jaouda', 'oulmes', 'centrale danone', 'perly',
  'vittel', 'evian', 'perrier', 'volvic', 'buldak', 'samyang',
  'milky food professional', 'la brea'
];

// Foreign words that indicate non-English products
// Only include words that are NEVER used in English product names
const FOREIGN_WORDS = [
  // French (specific food words not used in English)
  'fromage', 'lait', 'beurre', 'farine', 'sucre', 'poulet', 'boeuf',
  'porc', 'poisson', 'legumes', 'jus',
  // Spanish
  'leche', 'queso', 'mantequilla', 'harina', 'azucar', 'pollo', 'cerdo',
  // German (NOT 'butter' - same in English)
  'milch', 'kase', 'mehl', 'zucker', 'huhnchen', 'fleisch', 'nudeln',
  // Italian (NOT 'latte' - used in English for coffee drinks)
  'formaggio', 'burro', 'zucchero',
  // Portuguese
  'leite', 'queijo', 'manteiga', 'farinha', 'frango',
];

function isEnglishProduct(product) {
  const name = (product.product_name || '').toLowerCase().trim();
  const brand = (product.brands || '').toLowerCase();

  // Must have a product name
  if (!name) return false;

  // Block non-Latin characters
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/.test(name)) return false;

  // Block accented/special characters
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿœ]/i.test(name)) return false;

  // Language code validation - prefer English, but allow products with no language code
  // (many US products on Open Food Facts don't have language codes set)
  const langCodes = product.languages_codes || {};
  const langKeys = Object.keys(langCodes);
  if (langKeys.length > 0) {
    const hasEnglish = langKeys.some(code => code.startsWith('en'));
    if (!hasEnglish) return false;
  }

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, pageSize = 20 } = req.query;

    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    console.log(`[OFF] Searching for: ${query}`);

    // Fetch only 50 items (was 200) - much faster response
    // The English filter is pre-applied at API level with tag_0: 'en'
    const fetchSize = Math.min(parseInt(pageSize) * 3, 60);

    const params = new URLSearchParams({
      search_terms: query,
      page_size: fetchSize,
      fields: 'product_name,brands,nutriments,serving_size,code,languages_codes',
      tagtype_0: 'languages',
      tag_contains_0: 'contains',
      tag_0: 'en',  // Pre-filter for English at API level
      json: 1
    });

    // Use US subdomain for English-focused results
    const openFoodFactsUrl = `https://us.openfoodfacts.org/cgi/search.pl?${params}`;
    
    // 8 second timeout - don't let slow OFF responses block the user
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(openFoodFactsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'YFIT-App/1.0 (https://yfit-deploy.vercel.app)',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[OFF] Request timed out after 8s - returning empty results');
        return res.status(200).json({ products: [], timedOut: true });
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[OFF] API error: ${response.status}`);
      return res.status(200).json({ products: [] }); // Return empty instead of error
    }

    const data = await response.json();
    const rawProducts = data.products || [];
    
    // Apply server-side English-only filtering
    const englishProducts = rawProducts.filter(isEnglishProduct);
    
    console.log(`[OFF] ${rawProducts.length} raw → ${englishProducts.length} English results`);

    return res.status(200).json({ products: englishProducts });

  } catch (error) {
    console.error('[OFF] Error:', error);
    return res.status(200).json({ products: [] }); // Return empty instead of 500
  }
}
