import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import { getFoodByBarcode } from '../lib/foodDatabase'

export default function BarcodeScannerSelfContained({ onFoodConfirmed, onClose, mealType, user }) {
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [food, setFood] = useState(null)
  const [error, setError] = useState(null)
  const [html5Scanner, setHtml5Scanner] = useState(null)
  
  // Serving state
  const [servingQuantity, setServingQuantity] = useState(1)
  const [servingUnit, setServingUnit] = useState('serving')

  useEffect(() => {
    startScan()
    return () => {
      if (html5Scanner) {
        html5Scanner.stop().catch(() => {})
      }
    }
  }, [])

  const startScan = async () => {
    try {
      // FORCE HTML5 scanner to avoid native plugin crash
      const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode
      
      // Check camera permission first
      const permission = await Camera.checkPermissions()
      if (permission.camera === 'denied') {
        const requestResult = await Camera.requestPermissions({ permissions: ['camera'] })
        if (requestResult.camera !== 'granted') {
          setError('Camera permission denied')
          return
        }
      }

      const scanner = new Html5Qrcode('barcode-reader-mobile')
      setHtml5Scanner(scanner)

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          // Got barcode! Stop scanner and lookup food
          await scanner.stop()
          setScanning(false)
          setLoading(true)
          
          const foodData = await getFoodByBarcode(decodedText)
          
          if (foodData) {
            setFood(foodData)
            // Map common unit names to our unit values
            const unitMap = {
              'grams': 'g',
              'gram': 'g',
              'ounces': 'oz',
              'ounce': 'oz',
              'pounds': 'lb',
              'pound': 'lb',
              'milliliters': 'ml',
              'milliliter': 'ml'
            }
            const mappedUnit = unitMap[foodData.serving_unit?.toLowerCase()] || foodData.serving_unit || 'serving'
            setServingUnit(mappedUnit)
          } else {
            setError(`Product not found for barcode: ${decodedText}`)
          }
          setLoading(false)
        },
        (errorMessage) => {
          // Ignore scanning errors (fires continuously)
        }
      )
    } catch (err) {
      console.error('Scan error:', err)
      setError('Scanner error: ' + err.message)
      setScanning(false)
    }
  }

  const handleSaveToFavorites = async (alsoLog) => {
    if (!food || !user) return
    
    try {
      // Import the favorite foods functions
      const { addFavoriteFood } = await import('../lib/foodDatabase')
      
      // Save to favorite_foods
      const success = await addFavoriteFood(user.id, food)
      
      if (success) {
        alert('⭐ Saved to My Foods!')
        
        if (alsoLog) {
          // Also log the food
          handleConfirm()
        } else {
          // Just close the scanner
          onClose()
        }
      } else {
        alert('Error saving to My Foods. Please try again.')
      }
    } catch (err) {
      console.error('Error saving to favorites:', err)
      alert('Error saving to My Foods. Please try again.')
    }
  }

  const handleConfirm = () => {
    if (!food) return
    
    // Calculate nutrition
    const isLiquid = food.foodType === 'liquid'
    const units = isLiquid ? [
      { value: 'ml', label: 'Milliliters (ml)', toGrams: 1 },
      { value: 'fl_oz', label: 'Fluid Ounces (fl oz)', toGrams: 29.57 },
      { value: 'cup', label: 'Cups', toGrams: 240 },
      { value: 'tbsp', label: 'Tablespoons (tbsp)', toGrams: 15 },
      { value: 'tsp', label: 'Teaspoons (tsp)', toGrams: 5 },
      { value: 'serving', label: 'Serving', toGrams: food.servingGrams || 100 }
    ] : [
      { value: 'g', label: 'Grams (g)', toGrams: 1 },
      { value: 'oz', label: 'Ounces (oz)', toGrams: 28.35 },
      { value: 'lb', label: 'Pounds (lb)', toGrams: 453.59 },
      { value: 'serving', label: 'Serving', toGrams: food.servingGrams || 100 }
    ]
    
    const selectedUnit = units.find(u => u.value === servingUnit) || units[0]
    const totalGrams = servingQuantity * selectedUnit.toGrams
    const multiplier = totalGrams / 100
    
    const mealData = {
      meal_type: mealType,
      food_name: food.name,
      calories: Math.round((food.calories || 0) * multiplier),
      protein_g: Math.round((food.protein || 0) * multiplier),
      carbs_g: Math.round((food.carbs || 0) * multiplier),
      fat_g: Math.round((food.fat || 0) * multiplier),
      fiber: Math.round((food.fiber || 0) * multiplier),
      sugar: Math.round((food.sugar || 0) * multiplier),
      sodium: Math.round((food.sodium || 0) * multiplier),
      serving_quantity: servingQuantity,
      serving_unit: servingUnit,
      brand: food.brand || '',
      food_id: food.id || null
    }
    
    onFoodConfirmed(mealData)
  }

  // Render scanning overlay
  if (scanning) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div id="barcode-reader-mobile" className="w-full max-w-md"></div>
        <div className="absolute top-8 left-0 right-0 text-center">
          <p className="text-white text-lg font-medium bg-black bg-opacity-75 px-6 py-3 rounded-full inline-block">
            Point camera at barcode
          </p>
        </div>
        <div className="absolute bottom-8">
          <button
            onClick={async () => {
              if (html5Scanner) {
                await html5Scanner.stop().catch(() => {})
              }
              onClose()
            }}
            className="px-6 py-3 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors font-medium shadow-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Render loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-lg font-medium text-gray-800">Looking up product...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">⚠️</div>
            <p className="text-lg font-medium text-gray-800">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setError(null)
                setScanning(true)
                startScan()
              }}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render serving selector
  if (food) {
    const isLiquid = food.foodType === 'liquid'
    console.log('🍽️ Serving selector - food.foodType:', food.foodType, 'isLiquid:', isLiquid)
    
    const units = isLiquid ? [
      { value: 'ml', label: 'Milliliters (ml)' },
      { value: 'fl_oz', label: 'Fluid Ounces (fl oz)' },
      { value: 'cup', label: 'Cups' },
      { value: 'tbsp', label: 'Tablespoons (tbsp)' },
      { value: 'tsp', label: 'Teaspoons (tsp)' },
      { value: 'g', label: 'Grams (g)' },
      { value: 'serving', label: 'Serving' }
    ] : [
      { value: 'g', label: 'Grams (g)' },
      { value: 'oz', label: 'Ounces (oz)' },
      { value: 'lb', label: 'Pounds (lb)' },
      { value: 'serving', label: 'Serving' }
    ]
    
    console.log('🍽️ Available units:', units.map(u => u.value))
    console.log('🍽️ Current servingUnit:', servingUnit)
    
    // Calculate nutrition based on current serving size
    const unitsWithGrams = isLiquid ? [
      { value: 'ml', toGrams: 1 },
      { value: 'fl_oz', toGrams: 29.57 },
      { value: 'cup', toGrams: 240 },
      { value: 'tbsp', toGrams: 15 },
      { value: 'tsp', toGrams: 5 },
      { value: 'g', toGrams: 1 },
      { value: 'serving', toGrams: food.servingGrams || 100 }
    ] : [
      { value: 'g', toGrams: 1 },
      { value: 'oz', toGrams: 28.35 },
      { value: 'lb', toGrams: 453.59 },
      { value: 'serving', toGrams: food.servingGrams || 100 }
    ]
    
    const currentUnit = unitsWithGrams.find(u => u.value === servingUnit) || unitsWithGrams[0]
    const totalGrams = servingQuantity * currentUnit.toGrams
    const multiplier = totalGrams / 100
    
    const displayCalories = Math.round((food.calories || 0) * multiplier)
    const displayProtein = Math.round((food.protein || 0) * multiplier)
    const displayCarbs = Math.round((food.carbs || 0) * multiplier)
    const displayFat = Math.round((food.fat || 0) * multiplier)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Confirm Serving Size</h2>
            <p className="text-sm text-gray-600 mt-1">{food.name}</p>
            {food.brand && (
              <p className="text-xs text-gray-500">{food.brand}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Quantity and Unit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity & Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={servingQuantity}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || value === '0') {
                      setServingQuantity('')
                    } else {
                      setServingQuantity(parseFloat(value) || 1)
                    }
                  }}
                  onFocus={() => setServingQuantity('')}
                  min="0.1"
                  step="0.1"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ≈ {totalGrams.toFixed(1)}g total
              </p>
            </div>

            {/* Nutrition Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Nutrition Facts</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Calories:</span>
                  <span className="font-semibold text-gray-900 ml-2">{displayCalories} kcal</span>
                </div>
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <span className="font-semibold text-blue-600 ml-2">{displayProtein}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <span className="font-semibold text-orange-600 ml-2">{displayCarbs}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <span className="font-semibold text-purple-600 ml-2">{displayFat}g</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Primary Actions Row */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium"
                >
                  Log Food
                </button>
              </div>

              {/* Save to My Foods Row */}
              {food.source !== 'custom' && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // Save to favorites without logging
                      await handleSaveToFavorites(false)
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm"
                  >
                    ⭐ Save to My Foods
                  </button>
                  <button
                    onClick={async () => {
                      // Save to favorites AND log
                      await handleSaveToFavorites(true)
                    }}
                    className="flex-1 px-4 py-2 bg-purple-100 text-purple-800 border border-purple-300 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
                  >
                    ⭐ Log & Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
