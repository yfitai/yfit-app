// Health Calculations for YFIT
// All calculations use metric units (cm, kg)

// ============================================
// BMI CALCULATION
// ============================================

export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10 // round to 1 decimal
}

export function getBMICategory(bmi) {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' }
  if (bmi < 25) return { category: 'Normal', color: 'text-green-600' }
  if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' }
  return { category: 'Obese', color: 'text-red-600' }
}

// ============================================
// BODY FAT CALCULATION (Navy Method)
// ============================================

// Standard Navy Method - proven accurate formula
// Requires height, which is critical for accuracy
export function calculateBodyFat(measurements, gender, age, heightCm) {
  const {
    neck_cm,
    waist_cm,
    hips_cm
  } = measurements

  let bodyFat

  if (gender === 'male') {
    // Navy Method for males
    // Formula: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    
    const waistMinusNeck = waist_cm - neck_cm
    const log10WaistNeck = Math.log10(waistMinusNeck)
    const log10Height = Math.log10(heightCm)
    
    bodyFat = 495 / (1.0324 - 0.19077 * log10WaistNeck + 0.15456 * log10Height) - 450
    
  } else if (gender === 'female') {
    // Navy Method for females
    // Formula: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    
    const waistPlusHipMinusNeck = waist_cm + hips_cm - neck_cm
    const log10WHN = Math.log10(waistPlusHipMinusNeck)
    const log10Height = Math.log10(heightCm)
    
    bodyFat = 495 / (1.29579 - 0.35004 * log10WHN + 0.22100 * log10Height) - 450
    
  } else {
    // For 'other' gender, use average of both formulas
    const maleResult = calculateBodyFat(measurements, 'male', age, heightCm)
    const femaleResult = calculateBodyFat(measurements, 'female', age, heightCm)
    bodyFat = (maleResult + femaleResult) / 2
  }

  // Ensure reasonable bounds (3-50%)
  bodyFat = Math.max(3, Math.min(50, bodyFat))
  
  return Math.round(bodyFat * 10) / 10 // round to 1 decimal
}

export function getBodyFatCategory(bodyFat, gender) {
  if (gender === 'male') {
    if (bodyFat < 6) return { category: 'Essential Fat', color: 'text-red-600' }
    if (bodyFat < 14) return { category: 'Athletic', color: 'text-green-600' }
    if (bodyFat < 18) return { category: 'Fitness', color: 'text-blue-600' }
    if (bodyFat < 25) return { category: 'Average', color: 'text-yellow-600' }
    return { category: 'Obese', color: 'text-red-600' }
  } else {
    if (bodyFat < 14) return { category: 'Essential Fat', color: 'text-red-600' }
    if (bodyFat < 21) return { category: 'Athletic', color: 'text-green-600' }
    if (bodyFat < 25) return { category: 'Fitness', color: 'text-blue-600' }
    if (bodyFat < 32) return { category: 'Average', color: 'text-yellow-600' }
    return { category: 'Obese', color: 'text-red-600' }
  }
}

// ============================================
// LEAN BODY MASS CALCULATION
// ============================================

export function calculateLeanBodyMass(weightKg, bodyFatPercentage) {
  const fatMass = weightKg * (bodyFatPercentage / 100)
  const leanMass = weightKg - fatMass
  return Math.round(leanMass * 100) / 100 // round to 2 decimals
}

// ============================================
// BMR CALCULATION (Katch-McArdle Formula)
// ============================================

// Katch-McArdle is more accurate as it uses lean body mass
export function calculateBMR(leanBodyMassKg) {
  const bmr = 370 + (21.6 * leanBodyMassKg)
  return Math.round(bmr)
}

// ============================================
// TDEE CALCULATION
// ============================================

export function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Exercise 1-3 days/week
    moderate: 1.55,      // Exercise 3-5 days/week
    active: 1.725,       // Exercise 6-7 days/week
    very_active: 1.9     // Intense exercise daily
  }
  
  const multiplier = multipliers[activityLevel] || 1.2
  const tdee = bmr * multiplier
  return Math.round(tdee)
}

// ============================================
// ADJUSTED CALORIES BASED ON GOAL
// ============================================

export function calculateAdjustedCalories(tdee, goalType) {
  const adjustments = {
    lose_weight: -500,    // 1 lb per week deficit
    maintain: 0,          // Maintenance
    gain_weight: 300,     // Slow bulk
    build_strength: 200   // Slight surplus for muscle
  }
  
  const adjustment = adjustments[goalType] || 0
  const adjusted = tdee + adjustment
  return Math.round(adjusted)
}

export function getGoalDescription(goalType) {
  const descriptions = {
    lose_weight: 'Calorie deficit for fat loss (1 lb/week)',
    maintain: 'Maintenance calories to maintain current weight',
    gain_weight: 'Calorie surplus for weight gain',
    build_strength: 'Slight surplus optimized for muscle growth'
  }
  return descriptions[goalType] || 'Maintenance calories'
}

// ============================================
// BODY TYPE IDENTIFICATION
// ============================================

export function identifyBodyType(measurements, gender) {
  const {
    neck_cm,
    shoulders_cm,
    chest_cm,
    waist_cm,
    hips_cm,
    thigh_left_cm,
    thigh_right_cm,
    calf_left_cm,
    calf_right_cm,
    bicep_left_cm,
    bicep_right_cm,
    forearm_left_cm,
    forearm_right_cm,
    ankle_left_cm,
    ankle_right_cm
  } = measurements

  // Average bilateral measurements
  const thigh = (thigh_left_cm + thigh_right_cm) / 2
  const calf = (calf_left_cm + calf_right_cm) / 2
  const bicep = (bicep_left_cm + bicep_right_cm) / 2
  const forearm = (forearm_left_cm + forearm_right_cm) / 2
  const ankle = (ankle_left_cm + ankle_right_cm) / 2

  // Calculate key ratios
  const shoulderWaistRatio = shoulders_cm / waist_cm
  const waistHipRatio = waist_cm / hips_cm
  const chestWaistRatio = chest_cm / waist_cm
  const thighAnkleRatio = thigh / ankle
  const bicepForearmRatio = bicep / forearm

  // Calculate bone structure indicators
  const boneStructure = (ankle + forearm) / 2
  const muscleStructure = (bicep + thigh + calf + chest_cm) / 4

  // Scoring system for each body type
  let ectomorphScore = 0
  let mesomorphScore = 0
  let endomorphScore = 0

  // Ectomorph indicators (lean, narrow frame)
  if (shoulderWaistRatio < 1.3) ectomorphScore += 2
  if (waistHipRatio > 0.85 && gender === 'male') ectomorphScore += 1
  if (waistHipRatio > 0.75 && gender === 'female') ectomorphScore += 1
  if (boneStructure < 20) ectomorphScore += 2
  if (thighAnkleRatio < 2.0) ectomorphScore += 1

  // Mesomorph indicators (athletic, V-shape)
  if (shoulderWaistRatio >= 1.3 && shoulderWaistRatio <= 1.5) mesomorphScore += 3
  if (chestWaistRatio >= 1.2 && chestWaistRatio <= 1.4) mesomorphScore += 2
  if (waistHipRatio >= 0.85 && waistHipRatio <= 0.95 && gender === 'male') mesomorphScore += 2
  if (waistHipRatio >= 0.7 && waistHipRatio <= 0.8 && gender === 'female') mesomorphScore += 2
  if (muscleStructure / boneStructure > 2.5) mesomorphScore += 2

  // Endomorph indicators (larger frame, stores fat easily)
  if (shoulderWaistRatio > 1.5) endomorphScore += 1
  if (waistHipRatio < 0.85 && gender === 'male') endomorphScore += 2
  if (waistHipRatio < 0.7 && gender === 'female') endomorphScore += 2
  if (boneStructure > 25) endomorphScore += 2
  if (thighAnkleRatio > 2.5) endomorphScore += 1
  if (hips_cm > waist_cm * 1.1) endomorphScore += 2

  // Determine primary body type
  const scores = {
    ectomorph: ectomorphScore,
    mesomorph: mesomorphScore,
    endomorph: endomorphScore
  }

  const maxScore = Math.max(ectomorphScore, mesomorphScore, endomorphScore)
  const totalScore = ectomorphScore + mesomorphScore + endomorphScore
  
  let bodyType
  if (mesomorphScore === maxScore) {
    bodyType = 'mesomorph'
  } else if (ectomorphScore === maxScore) {
    bodyType = 'ectomorph'
  } else {
    bodyType = 'endomorph'
  }

  // Calculate confidence (how dominant is the primary type)
  const confidence = totalScore > 0 ? (maxScore / totalScore) * 100 : 50
  
  return {
    bodyType,
    confidence: Math.round(confidence),
    scores
  }
}

export function getBodyTypeDescription(bodyType) {
  const descriptions = {
    ectomorph: {
      title: 'Ectomorph - Lean & Long',
      traits: 'Naturally thin, fast metabolism, difficulty gaining weight',
      focus: 'Focus on heavy strength training with compound movements and higher calorie intake',
      icon: '📏'
    },
    mesomorph: {
      title: 'Mesomorph - Athletic & Muscular',
      traits: 'Naturally athletic, gains muscle easily, moderate metabolism',
      focus: 'Focus on balanced strength and cardio training with moderate calorie intake',
      icon: '💪'
    },
    endomorph: {
      title: 'Endomorph - Solid & Strong',
      traits: 'Larger bone structure, gains weight easily, slower metabolism',
      focus: 'Focus on higher cardio volume and careful calorie management',
      icon: '🏋️'
    }
  }
  return descriptions[bodyType] || descriptions.mesomorph
}

// ============================================
// COMPLETE METRICS CALCULATION
// ============================================

export function calculateAllMetrics(userData, measurements) {
  const { age, height_cm, weight_kg, gender, activity_level, goal_type } = userData

  // 1. Calculate BMI
  const bmi = calculateBMI(weight_kg, height_cm)
  const bmiCategory = getBMICategory(bmi)

  // 2. Calculate Body Fat (Navy Method requires height)
  const bodyFatPercentage = calculateBodyFat(measurements, gender, age, height_cm)
  const bodyFatCategory = getBodyFatCategory(bodyFatPercentage, gender)

  // 3. Calculate Lean Body Mass
  const leanBodyMass = calculateLeanBodyMass(weight_kg, bodyFatPercentage)

  // 4. Calculate BMR (using Katch-McArdle)
  const bmr = calculateBMR(leanBodyMass)

  // 5. Calculate TDEE
  const tdee = calculateTDEE(bmr, activity_level)

  // 6. Calculate Adjusted Calories based on goal
  const adjustedCalories = calculateAdjustedCalories(tdee, goal_type)

  // 7. Identify Body Type
  const bodyTypeResult = identifyBodyType(measurements, gender)
  const bodyTypeInfo = getBodyTypeDescription(bodyTypeResult.bodyType)

  return {
    bmi,
    bmiCategory,
    bodyFatPercentage,
    bodyFatCategory,
    leanBodyMass,
    bmr,
    tdee,
    adjustedCalories,
    goalDescription: getGoalDescription(goal_type),
    bodyType: bodyTypeResult.bodyType,
    bodyTypeConfidence: bodyTypeResult.confidence,
    bodyTypeInfo
  }
}
