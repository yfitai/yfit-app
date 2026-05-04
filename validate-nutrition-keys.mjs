import { readFileSync } from 'fs';

const content = readFileSync('/home/ubuntu/yfit-app/src/lib/i18nResources.js', 'utf8');

// Extract the resources object
const match = null; // force alternate path
if (!match) {
  // Try alternate extraction
  const startIdx = content.indexOf('const resources = {');
  const endIdx = content.lastIndexOf('};') + 2;
  const objStr = content.slice(startIdx + 'const resources = '.length, endIdx);
  try {
    const resources = eval('(' + objStr + ')');
    const en = resources.en.translation;
    
    const keys = [
      'nutrition.breakfast','nutrition.lunch','nutrition.dinner','nutrition.snacks',
      'nutrition.scanBarcode','nutrition.mealPlan','nutrition.saveTemplate',
      'nutrition.confirmServingSize','nutrition.quantityAndUnit','nutrition.nutritionFacts',
      'nutrition.calories','nutrition.protein','nutrition.carbs','nutrition.fat',
      'nutrition.logFood','nutrition.saveToMyFoods','nutrition.logAndSave',
      'nutrition.serving','nutrition.quantityUnit','nutrition.title',
      'nutrition.nutritionSummary','nutrition.dailyGoal','nutrition.consumed',
      'nutrition.remaining','nutrition.macroBreakdown','nutrition.fiber',
      'nutrition.sugar','nutrition.sodium',
      'common.over','common.cancel','common.save'
    ];
    
    let allOk = true;
    keys.forEach(k => {
      const parts = k.split('.');
      const val = en[parts[0]] && en[parts[0]][parts[1]];
      if (!val) {
        console.log('MISSING:', k);
        allOk = false;
      }
    });
    if (allOk) console.log('All nutrition keys valid!');
  } catch(e) {
    console.error('Parse error:', e.message);
  }
}
