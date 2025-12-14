// Unit Conversion Utilities for YFIT

// ============================================
// HEIGHT CONVERSIONS
// ============================================

export function cmToFeetInches(cm) {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

export function feetInchesToCm(feet, inches) {
  const totalInches = (feet * 12) + inches
  return Math.round(totalInches * 2.54 * 100) / 100 // round to 2 decimals
}

export function formatHeight(cm, unitSystem) {
  if (unitSystem === 'metric') {
    return `${cm} cm`
  } else {
    const { feet, inches } = cmToFeetInches(cm)
    return `${feet}'${inches}"`
  }
}

// ============================================
// WEIGHT CONVERSIONS
// ============================================

export function kgToLbs(kg) {
  return Math.round(kg * 2.20462 * 10) / 10 // round to 1 decimal
}

export function lbsToKg(lbs) {
  return Math.round(lbs / 2.20462 * 100) / 100 // round to 2 decimals
}

export function formatWeight(kg, unitSystem) {
  if (unitSystem === 'metric') {
    return `${kg} kg`
  } else {
    return `${kgToLbs(kg)} lbs`
  }
}

// ============================================
// BODY MEASUREMENT CONVERSIONS
// ============================================

export function cmToInches(cm) {
  return Math.round(cm / 2.54 * 10) / 10 // round to 1 decimal
}

export function inchesToCm(inches) {
  return Math.round(inches * 2.54 * 100) / 100 // round to 2 decimals
}

export function formatMeasurement(cm, unitSystem) {
  if (unitSystem === 'metric') {
    return `${cm} cm`
  } else {
    return `${cmToInches(cm)} in`
  }
}

// ============================================
// INPUT HELPERS
// ============================================

// Convert user input to cm (always store in cm)
export function convertInputToCm(value, unitSystem) {
  if (unitSystem === 'metric') {
    return parseFloat(value)
  } else {
    return inchesToCm(parseFloat(value))
  }
}

// Convert cm to display value based on unit system
export function convertCmToDisplay(cm, unitSystem) {
  if (!cm) return ''
  if (unitSystem === 'metric') {
    return cm.toString()
  } else {
    return cmToInches(cm).toString()
  }
}

// Convert user weight input to kg (always store in kg)
export function convertWeightInputToKg(value, unitSystem) {
  if (unitSystem === 'metric') {
    return parseFloat(value)
  } else {
    return lbsToKg(parseFloat(value))
  }
}

// Convert kg to display value based on unit system
export function convertKgToDisplay(kg, unitSystem) {
  if (!kg) return ''
  if (unitSystem === 'metric') {
    return kg.toString()
  } else {
    return kgToLbs(kg).toString()
  }
}

// ============================================
// UNIT LABELS
// ============================================

export function getHeightUnit(unitSystem) {
  return unitSystem === 'metric' ? 'cm' : 'ft/in'
}

export function getWeightUnit(unitSystem) {
  return unitSystem === 'metric' ? 'kg' : 'lbs'
}

export function getMeasurementUnit(unitSystem) {
  return unitSystem === 'metric' ? 'cm' : 'in'
}

// ============================================
// VALIDATION
// ============================================

export function isValidHeight(value, unitSystem) {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) return false
  
  if (unitSystem === 'metric') {
    // Valid range: 50cm - 300cm
    return num >= 50 && num <= 300
  } else {
    // Valid range: 20in - 120in (approx 1'8" - 10')
    return num >= 20 && num <= 120
  }
}

export function isValidWeight(value, unitSystem) {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) return false
  
  if (unitSystem === 'metric') {
    // Valid range: 20kg - 300kg
    return num >= 20 && num <= 300
  } else {
    // Valid range: 44lbs - 660lbs
    return num >= 44 && num <= 660
  }
}

export function isValidMeasurement(value, unitSystem) {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) return false
  
  if (unitSystem === 'metric') {
    // Valid range: 5cm - 200cm
    return num >= 5 && num <= 200
  } else {
    // Valid range: 2in - 80in
    return num >= 2 && num <= 80
  }
}



// ============================================
// WATER VOLUME CONVERSIONS
// ============================================

export function mlToOz(ml) {
  return Math.round(ml / 29.5735 * 10) / 10 // round to 1 decimal
}

export function ozToMl(oz) {
  return Math.round(oz * 29.5735)
}

export function formatWaterVolume(ml, unitSystem) {
  if (unitSystem === 'metric') {
    return `${ml} ml`
  } else {
    return `${mlToOz(ml)} oz`
  }
}
