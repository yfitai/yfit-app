/**
 * Macro Calculations Based on Lean Body Mass
 * 
 * Calculates optimal macro distribution:
 * - Protein: 1g per lb of lean body mass
 * - Fat: 25-30% of total calories (essential for hormones)
 * - Carbs: Remaining calories
 */

/**
 * Calculate macro targets based on lean body mass and total calories
 * @param {number} leanBodyMassLbs - Lean body mass in pounds
 * @param {number} totalCalories - Target daily calories
 * @param {number} fatPercentage - Percentage of calories from fat (default 25%)
 * @returns {object} Macro targets in grams and percentages
 */
export function calculateMacrosFromLBM(leanBodyMassLbs, totalCalories, fatPercentage = 25) {
  // Protein: 1g per lb of lean body mass
  const proteinGrams = Math.round(leanBodyMassLbs)
  const proteinCalories = proteinGrams * 4 // 4 cal/g
  
  // Fat: User-specified percentage (default 25%)
  const fatCalories = Math.round((totalCalories * fatPercentage) / 100)
  const fatGrams = Math.round(fatCalories / 9) // 9 cal/g
  
  // Carbs: Fill the rest
  const carbCalories = totalCalories - proteinCalories - fatCalories
  const carbGrams = Math.round(carbCalories / 4) // 4 cal/g
  
  // Calculate percentages
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100)
  const fatPercentageActual = Math.round((fatCalories / totalCalories) * 100)
  const carbPercentage = 100 - proteinPercentage - fatPercentageActual
  
  return {
    protein: {
      grams: proteinGrams,
      calories: proteinCalories,
      percentage: proteinPercentage
    },
    carbs: {
      grams: carbGrams,
      calories: carbCalories,
      percentage: carbPercentage
    },
    fat: {
      grams: fatGrams,
      calories: fatCalories,
      percentage: fatPercentageActual
    },
    total: {
      calories: totalCalories,
      protein_percentage: proteinPercentage,
      carb_percentage: carbPercentage,
      fat_percentage: fatPercentageActual
    }
  }
}

/**
 * Calculate macros from manual percentages
 * @param {number} totalCalories - Target daily calories
 * @param {number} proteinPercentage - Percentage of calories from protein
 * @param {number} carbPercentage - Percentage of calories from carbs
 * @param {number} fatPercentage - Percentage of calories from fat
 * @returns {object} Macro targets in grams
 */
export function calculateMacrosFromPercentages(totalCalories, proteinPercentage, carbPercentage, fatPercentage) {
  // Validate percentages add up to 100
  const total = proteinPercentage + carbPercentage + fatPercentage
  if (Math.abs(total - 100) > 1) {
    throw new Error('Macro percentages must add up to 100%')
  }
  
  const proteinCalories = Math.round((totalCalories * proteinPercentage) / 100)
  const carbCalories = Math.round((totalCalories * carbPercentage) / 100)
  const fatCalories = Math.round((totalCalories * fatPercentage) / 100)
  
  return {
    protein: {
      grams: Math.round(proteinCalories / 4),
      calories: proteinCalories,
      percentage: proteinPercentage
    },
    carbs: {
      grams: Math.round(carbCalories / 4),
      calories: carbCalories,
      percentage: carbPercentage
    },
    fat: {
      grams: Math.round(fatCalories / 9),
      calories: fatCalories,
      percentage: fatPercentage
    },
    total: {
      calories: totalCalories,
      protein_percentage: proteinPercentage,
      carb_percentage: carbPercentage,
      fat_percentage: fatPercentage
    }
  }
}

/**
 * Get recommended fat percentage based on goal
 * @param {string} goal - User's goal (lose_weight, maintain, gain_weight, build_strength)
 * @returns {number} Recommended fat percentage
 */
export function getRecommendedFatPercentage(goal) {
  switch (goal) {
    case 'lose_weight':
      return 25 // Lower fat for weight loss
    case 'maintain':
      return 27 // Balanced
    case 'gain_weight':
    case 'build_strength':
      return 30 // Higher fat for muscle building
    default:
      return 25
  }
}

/**
 * Validate macro percentages
 * @param {number} protein - Protein percentage
 * @param {number} carbs - Carbs percentage
 * @param {number} fat - Fat percentage
 * @returns {object} Validation result with isValid and error message
 */
export function validateMacroPercentages(protein, carbs, fat) {
  const total = protein + carbs + fat
  
  if (Math.abs(total - 100) > 1) {
    return {
      isValid: false,
      error: `Percentages must add up to 100% (currently ${total}%)`
    }
  }
  
  if (protein < 10 || protein > 50) {
    return {
      isValid: false,
      error: 'Protein should be between 10% and 50%'
    }
  }
  
  if (carbs < 10 || carbs > 70) {
    return {
      isValid: false,
      error: 'Carbs should be between 10% and 70%'
    }
  }
  
  if (fat < 15 || fat > 50) {
    return {
      isValid: false,
      error: 'Fat should be between 15% and 50% (essential for hormones)'
    }
  }
  
  return {
    isValid: true,
    error: null
  }
}
