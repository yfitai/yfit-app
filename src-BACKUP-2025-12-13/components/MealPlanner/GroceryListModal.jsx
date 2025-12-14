import { useState } from 'react'
import { X, Printer, Copy, Check } from 'lucide-react'

export default function GroceryListModal({ mealPlanItems, weekStart, onClose }) {
  const [copied, setCopied] = useState(false)

  // Generate grocery list from meal plan items
  function generateGroceryList() {
    const itemsMap = new Map()
    
    // Aggregate items by food name
    mealPlanItems.forEach(item => {
      const key = `${item.food_name}-${item.brand || 'generic'}`
      
      if (itemsMap.has(key)) {
        const existing = itemsMap.get(key)
        existing.quantity += item.serving_quantity || 1
        existing.totalCalories += item.calories || 0
      } else {
        itemsMap.set(key, {
          foodName: item.food_name,
          brand: item.brand,
          quantity: item.serving_quantity || 1,
          unit: item.serving_unit || 'serving',
          totalCalories: item.calories || 0,
          category: categorizeFood(item.food_name)
        })
      }
    })
    
    // Convert to array and group by category
    const items = Array.from(itemsMap.values())
    const grouped = {}
    
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })
    
    // Sort categories
    const categoryOrder = ['Produce', 'Protein', 'Dairy', 'Grains', 'Beverages', 'Snacks', 'Other']
    const sorted = {}
    categoryOrder.forEach(cat => {
      if (grouped[cat]) {
        sorted[cat] = grouped[cat].sort((a, b) => a.foodName.localeCompare(b.foodName))
      }
    })
    
    return sorted
  }
  
  // Simple food categorization
  function categorizeFood(foodName) {
    const name = foodName.toLowerCase()
    
    if (name.includes('egg') || name.includes('chicken') || name.includes('beef') || 
        name.includes('fish') || name.includes('protein') || name.includes('meat') ||
        name.includes('turkey') || name.includes('pork')) {
      return 'Protein'
    }
    
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
        name.includes('butter') || name.includes('cream')) {
      return 'Dairy'
    }
    
    if (name.includes('bread') || name.includes('rice') || name.includes('pasta') || 
        name.includes('noodle') || name.includes('cereal') || name.includes('oat') ||
        name.includes('bun') || name.includes('toast')) {
      return 'Grains'
    }
    
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('berry') || name.includes('lettuce') || name.includes('tomato') ||
        name.includes('carrot') || name.includes('vegetable') || name.includes('fruit')) {
      return 'Produce'
    }
    
    if (name.includes('tea') || name.includes('coffee') || name.includes('juice') || 
        name.includes('water') || name.includes('soda') || name.includes('drink')) {
      return 'Beverages'
    }
    
    if (name.includes('chip') || name.includes('cookie') || name.includes('candy') || 
        name.includes('chocolate') || name.includes('snack') || name.includes('cake')) {
      return 'Snacks'
    }
    
    return 'Other'
  }
  
  const groceryList = generateGroceryList()
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0)
  
  // Format week date range
  function formatWeekRange() {
    const start = new Date(weekStart)
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    
    const options = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }
  
  // Copy to clipboard
  function copyToClipboard() {
    let text = `Grocery List for ${formatWeekRange()}\n\n`
    
    Object.entries(groceryList).forEach(([category, items]) => {
      text += `${category}:\n`
      items.forEach(item => {
        text += `  • ${item.foodName}`
        if (item.brand) text += ` (${item.brand})`
        text += ` - ${Math.round(item.quantity * 10) / 10} ${item.unit}`
        text += `\n`
      })
      text += `\n`
    })
    
    text += `Total Items: ${totalItems}`
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  
  // Print grocery list
  function printGroceryList() {
    window.print()
  }
  
  if (totalItems === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Grocery List</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-600">No meals planned for this week yet.</p>
            <p className="text-sm text-gray-500 mt-2">Add some meals to generate a grocery list!</p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:border-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grocery List</h3>
            <p className="text-sm text-gray-600">{formatWeekRange()}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={printGroceryList}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {Object.entries(groceryList).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 pl-2">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500 print:hidden"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.foodName}
                        {item.brand && (
                          <span className="text-sm text-gray-500 font-normal ml-2">({item.brand})</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round(item.quantity * 10) / 10} {item.unit}
                        <span className="text-gray-400 ml-2">• {item.totalCalories} cal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 print:hidden">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalItems}</span> items total
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
