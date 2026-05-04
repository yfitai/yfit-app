import { readFileSync } from 'fs';

// Load i18nResources and extract all English keys
const content = readFileSync('src/lib/i18nResources.js', 'utf8');
const match = content.match(/const resources = ({[\s\S]*});/);
const resources = JSON.parse(match[1]);
const enKeys = new Set();

function extractKeys(obj, prefix) {
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object') extractKeys(v, fullKey);
    else enKeys.add(fullKey);
  }
}
extractKeys(resources.en.translation, '');

// Check each component
const components = ['Dashboard', 'Goals', 'DailyTracker', 'Navigation', 'LanguageSwitcher'];
let totalMissing = 0;

for (const comp of components) {
  const src = readFileSync('src/components/' + comp + '.jsx', 'utf8');
  const tCalls = [...src.matchAll(/\bt\(['"]([^'"]+)['"]\s*[\),]/g)].map(m => m[1]);
  const missing = [...new Set(tCalls.filter(k => k.includes('.') && !enKeys.has(k)))];
  if (missing.length) {
    console.log(`\n${comp} MISSING KEYS (${missing.length}):`);
    missing.forEach(k => console.log('  MISSING: ' + k));
    totalMissing += missing.length;
  } else {
    console.log(`${comp}: all keys valid ✓`);
  }
}

if (totalMissing > 0) {
  console.log(`\nTotal missing keys: ${totalMissing}`);
  process.exit(1);
} else {
  console.log('\nAll keys valid!');
}
