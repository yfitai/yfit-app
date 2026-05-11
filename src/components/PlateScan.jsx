/**
 * PlateScan.jsx
 *
 * Hybrid Plate Scan — AI identifies foods, user sets serving sizes.
 *
 * Flow:
 *   1. User opens modal from a meal card (Breakfast / Lunch / Dinner / Snack)
 *   2. User takes a photo or picks one from their library
 *   3. Image is sent to /api/food/plate-scan → GPT-4o Vision identifies foods
 *   4. Each identified food is shown as a card with a serving size selector
 *   5. User adjusts serving sizes → live calorie preview updates
 *   6. User taps "Log All" to add all items to the meal, or "Save as Template"
 *
 * Props:
 *   mealType       — 'breakfast' | 'lunch' | 'dinner' | 'snack'
 *   user           — Supabase user object
 *   selectedDate   — YYYY-MM-DD string
 *   onFoodsLogged  — callback(loggedMeals[]) called after successful log
 *   onClose        — callback to close the modal
 */

import { useState, useRef, useCallback } from 'react'
import { Camera, ImagePlus, X, ChevronDown, Loader2, CheckCircle2, AlertCircle, Trash2, UtensilsCrossed } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── Serving unit definitions (mirrors NutritionEnhanced.jsx ServingSizeSelector) ──
const SERVING_UNITS = [
  { value: 'piece',   label: '1 Piece / Whole',       toGrams: 100 },
  { value: 'serving', label: 'Serving',                toGrams: 100 },
  { value: 'g',       label: 'Grams (g)',              toGrams: 1 },
  { value: 'oz',      label: 'Ounces (oz)',            toGrams: 28.35 },
  { value: 'lb',      label: 'Pounds (lb)',            toGrams: 453.59 },
  { value: 'ml',      label: 'Milliliters (ml)',       toGrams: 1 },
  { value: 'fl_oz',   label: 'Fluid Ounces (fl oz)',   toGrams: 29.57 },
  { value: 'cup',     label: 'Cups',                   toGrams: 240 },
  { value: 'tbsp',    label: 'Tablespoons (tbsp)',     toGrams: 15 },
  { value: 'tsp',     label: 'Teaspoons (tsp)',        toGrams: 5 },
]

function calcNutrition(food, qty, unit) {
  const unitDef = SERVING_UNITS.find(u => u.value === unit) || { toGrams: 1 }
  const totalGrams = (parseFloat(qty) || 0) * unitDef.toGrams
  const m = totalGrams / 100
  return {
    calories: Math.round((food.calories || 0) * m),
    protein:  Math.round((food.protein  || 0) * m),
    carbs:    Math.round((food.carbs    || 0) * m),
    fat:      Math.round((food.fat      || 0) * m),
  }
}

// ── Individual food item card ─────────────────────────────────────────────────
function FoodItemCard({ item, onUpdate, onRemove }) {
  const { food, qty, unit, included } = item
  const nutrition = calcNutrition(food, qty, unit)

  const confidenceColor = {
    high:   'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low:    'bg-red-100 text-red-700',
  }[food.confidence] || 'bg-gray-100 text-gray-600'

  return (
    <div className={`border rounded-xl p-4 transition-all ${included ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-800 text-sm leading-tight">{food.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
              {food.confidence} confidence
            </span>
          </div>
          {food.searchName && food.searchName !== food.name && (
            <p className="text-xs text-gray-400 mt-0.5">Searched as: {food.searchName}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Include/exclude toggle */}
          <button
            onClick={() => onUpdate({ included: !included })}
            className={`p-1.5 rounded-lg transition-colors ${included ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
            title={included ? 'Exclude from log' : 'Include in log'}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          {/* Remove entirely */}
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
            title="Remove this food"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Serving size row */}
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={qty}
          min="0.1"
          step="0.1"
          onChange={e => onUpdate({ qty: e.target.value })}
          className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
        />
        <select
          value={unit}
          onChange={e => onUpdate({ unit: e.target.value })}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
        >
          {SERVING_UNITS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Nutrition preview */}
      {included && (
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: 'Cal',  value: nutrition.calories, color: 'text-gray-800' },
            { label: 'Pro',  value: `${nutrition.protein}g`, color: 'text-blue-600' },
            { label: 'Carb', value: `${nutrition.carbs}g`,  color: 'text-orange-600' },
            { label: 'Fat',  value: `${nutrition.fat}g`,    color: 'text-purple-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg py-1 px-0.5">
              <div className={`font-semibold text-xs ${color}`}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main PlateScan modal ──────────────────────────────────────────────────────
export default function PlateScan({ mealType, user, selectedDate, onFoodsLogged, onClose }) {
  const [phase, setPhase] = useState('pick')   // 'pick' | 'scanning' | 'review' | 'logging' | 'done'
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMime, setImageMime] = useState('image/jpeg')
  const [foodItems, setFoodItems] = useState([])   // [{ food, qty, unit, included }]
  const [scanNote, setScanNote] = useState('')
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // ── Image handling ──────────────────────────────────────────────────────────
  const processImage = useCallback((file) => {
    if (!file) return
    const mime = file.type || 'image/jpeg'
    setImageMime(mime)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const reader = new FileReader()
    reader.onload = (e) => {
      // Strip the data:image/...;base64, prefix
      const base64 = e.target.result.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!imageBase64) return
    setPhase('scanning')
    setError('')

    try {
      const res = await fetch('/api/food/plate-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      if (data.foods.length === 0) {
        setScanNote(data.note || 'No foods could be identified. Please try a clearer photo.')
        setPhase('pick')
        return
      }

      // Build initial food items with default serving sizes
      const items = data.foods.map(food => ({
        food,
        qty: 1,
        unit: 'serving',
        included: true,
      }))

      setFoodItems(items)
      setScanNote(data.note || '')
      setPhase('review')
    } catch (err) {
      console.error('[PlateScan] Scan error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setPhase('pick')
    }
  }

  // ── Update a single food item ───────────────────────────────────────────────
  const updateItem = (idx, changes) => {
    setFoodItems(prev => prev.map((item, i) => i === idx ? { ...item, ...changes } : item))
  }

  const removeItem = (idx) => {
    setFoodItems(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totals = foodItems
    .filter(item => item.included)
    .reduce((acc, item) => {
      const n = calcNutrition(item.food, item.qty, item.unit)
      return {
        calories: acc.calories + n.calories,
        protein:  acc.protein  + n.protein,
        carbs:    acc.carbs    + n.carbs,
        fat:      acc.fat      + n.fat,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const includedCount = foodItems.filter(i => i.included).length

  // ── Log all included foods ──────────────────────────────────────────────────
  const handleLogAll = async () => {
    const toLog = foodItems.filter(i => i.included)
    if (toLog.length === 0) return

    setLogging(true)
    try {
      const rows = toLog.map(item => {
        const n = calcNutrition(item.food, item.qty, item.unit)
        const unitDef = SERVING_UNITS.find(u => u.value === item.unit) || { toGrams: 1 }
        return {
          user_id: user.id,
          meal_type: mealType,
          meal_date: selectedDate,
          food_name: item.food.name,
          calories: n.calories,
          protein_g: n.protein,
          carbs_g: n.carbs,
          fat_g: n.fat,
          fiber: Math.round((item.food.fiber || 0) * (parseFloat(item.qty) * unitDef.toGrams / 100)),
          sugar: Math.round((item.food.sugar || 0) * (parseFloat(item.qty) * unitDef.toGrams / 100)),
          sodium: Math.round((item.food.sodium || 0) * (parseFloat(item.qty) * unitDef.toGrams / 100)),
          food_id: item.food.id || null,
          serving_quantity: parseFloat(item.qty),
          serving_unit: item.unit,
          created_at: new Date().toISOString(),
        }
      })

      const { error: dbError } = await supabase.from('meals').insert(rows)
      if (dbError) throw dbError

      onFoodsLogged?.(rows)
      setPhase('done')
    } catch (err) {
      console.error('[PlateScan] Log error:', err)
      setError('Failed to log meals. Please try again.')
    } finally {
      setLogging(false)
    }
  }

  // ── Save as template ────────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    const toSave = foodItems.filter(i => i.included)
    if (toSave.length === 0) return

    setSavingTemplate(true)
    try {
      const meals = toSave.map(item => {
        const n = calcNutrition(item.food, item.qty, item.unit)
        return {
          food_name: item.food.name,
          calories: n.calories,
          protein: n.protein,
          carbs: n.carbs,
          fat: n.fat,
          fiber: Math.round((item.food.fiber || 0) * (parseFloat(item.qty) * (SERVING_UNITS.find(u => u.value === item.unit)?.toGrams || 1) / 100)),
          sugar: 0,
          sodium: 0,
          serving_quantity: parseFloat(item.qty),
          serving_unit: item.unit,
        }
      })

      const { error: dbError } = await supabase.from('meal_templates').insert([{
        user_id: user.id,
        template_name: templateName.trim(),
        meal_type: mealType,
        description: 'Created from Plate Scan',
        total_calories: totals.calories,
        total_protein: totals.protein.toString(),
        total_carbs: totals.carbs.toString(),
        total_fat: totals.fat.toString(),
        meals,
        is_favorite: false,
        use_count: 0,
      }])

      if (dbError) throw dbError
      setShowTemplatePrompt(false)
      alert(`Template "${templateName.trim()}" saved!`)
    } catch (err) {
      console.error('[PlateScan] Template save error:', err)
      alert('Failed to save template. Please try again.')
    } finally {
      setSavingTemplate(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base leading-tight">Plate Scan</h2>
              <p className="text-xs text-gray-500 capitalize">{mealType}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Phase: pick ── */}
          {(phase === 'pick' || phase === 'scanning') && (
            <div className="p-4 space-y-4">
              {/* How it works */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800">
                <p className="font-semibold mb-1">📸 How it works</p>
                <p>Take or upload a photo of your meal. AI identifies the foods, then you set the serving sizes before logging.</p>
              </div>

              {/* Image preview / pick area */}
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Meal preview"
                    className="w-full h-56 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => { setPreviewUrl(null); setImageBase64(null) }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-teal-300 rounded-xl hover:bg-teal-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-teal-500" />
                    <span className="text-sm font-medium text-teal-700">Take Photo</span>
                  </button>
                  {/* Library */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Choose Photo</span>
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Scan note (e.g. no foods found) */}
              {scanNote && !error && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {scanNote}
                </div>
              )}

              {/* Scan button */}
              {previewUrl && (
                <button
                  onClick={handleScan}
                  disabled={phase === 'scanning'}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {phase === 'scanning' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Identifying foods…
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Identify Foods
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Phase: review ── */}
          {phase === 'review' && (
            <div className="p-4 space-y-3">
              {/* Preview thumbnail */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Meal"
                  className="w-full h-32 object-cover rounded-xl border border-gray-200"
                />
              )}

              {/* Instruction */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                <p className="font-semibold mb-0.5">Set your serving sizes</p>
                <p>AI identified {foodItems.length} food{foodItems.length !== 1 ? 's' : ''}. Adjust the quantity and unit for each item, then tap <strong>Log All</strong>.</p>
              </div>

              {/* Food cards */}
              <div className="space-y-3">
                {foodItems.map((item, idx) => (
                  <FoodItemCard
                    key={idx}
                    item={item}
                    onUpdate={(changes) => updateItem(idx, changes)}
                    onRemove={() => removeItem(idx)}
                  />
                ))}
              </div>

              {/* Note from scan (e.g. partial failures) */}
              {scanNote && (
                <p className="text-xs text-gray-400 text-center">{scanNote}</p>
              )}

              {/* Totals bar */}
              {includedCount > 0 && (
                <div className="bg-gray-800 text-white rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{includedCount} item{includedCount !== 1 ? 's' : ''} selected — total</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Cal',  value: totals.calories,       color: 'text-white' },
                      { label: 'Pro',  value: `${totals.protein}g`,  color: 'text-blue-300' },
                      { label: 'Carb', value: `${totals.carbs}g`,    color: 'text-orange-300' },
                      { label: 'Fat',  value: `${totals.fat}g`,      color: 'text-purple-300' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className={`font-bold text-sm ${color}`}>{value}</div>
                        <div className="text-xs text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Template prompt */}
              {showTemplatePrompt && (
                <div className="border border-purple-200 bg-purple-50 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-semibold text-purple-800">Save as Template</p>
                  <input
                    type="text"
                    placeholder="Template name (e.g. My Chicken Bowl)"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTemplatePrompt(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      disabled={savingTemplate || !templateName.trim()}
                      className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Phase: done ── */}
          {phase === 'done' && (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Logged!</h3>
                <p className="text-gray-500 text-sm mt-1">{includedCount} food{includedCount !== 1 ? 's' : ''} added to your {mealType}.</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer actions (review phase only) */}
        {phase === 'review' && (
          <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
            {/* Rescan / Save template row */}
            <div className="flex gap-2">
              <button
                onClick={() => { setPhase('pick'); setPreviewUrl(null); setImageBase64(null); setFoodItems([]); setError(''); setScanNote('') }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Rescan
              </button>
              <button
                onClick={() => setShowTemplatePrompt(true)}
                className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                Save as Template
              </button>
            </div>
            {/* Log all */}
            <button
              onClick={handleLogAll}
              disabled={logging || includedCount === 0}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold text-base hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {logging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging…
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-5 h-5" />
                  Log {includedCount > 0 ? `${includedCount} Item${includedCount !== 1 ? 's' : ''}` : 'All'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
