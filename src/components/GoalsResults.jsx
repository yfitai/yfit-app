import { Activity, Target, TrendingUp, Zap, Flame, Scale, Heart } from 'lucide-react'

/**
 * GoalsResults — display-only component.
 * Receives calculated metrics from Goals.jsx and renders them.
 * Does NOT load or save any data.
 */
export default function GoalsResults({ metrics, firstName }) {
  if (!metrics) return null

  const {
    bmi,
    bmiCategory,
    bodyFatPercentage,
    bodyFatCategory,
    leanBodyMass,
    bmr,
    tdee,
    adjustedCalories,
    goalDescription,
    bodyType,
    bodyTypeConfidence,
    bodyTypeInfo
  } = metrics

  // Macro split based on adjusted calories (40/30/30 protein/carbs/fat)
  const proteinCals = Math.round((adjustedCalories || tdee) * 0.30)
  const carbCals    = Math.round((adjustedCalories || tdee) * 0.40)
  const fatCals     = Math.round((adjustedCalories || tdee) * 0.30)
  const proteinG    = Math.round(proteinCals / 4)
  const carbsG      = Math.round(carbCals / 4)
  const fatG        = Math.round(fatCals / 9)

  const bodyTypeEmoji = {
    ectomorph: '🏃',
    mesomorph: '💪',
    endomorph: '🏋️'
  }[bodyType] || '🏃'

  const bodyTypeColor = {
    ectomorph: 'text-blue-600 bg-blue-50 border-blue-200',
    mesomorph: 'text-green-600 bg-green-50 border-green-200',
    endomorph: 'text-purple-600 bg-purple-50 border-purple-200'
  }[bodyType] || 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <div className="space-y-6 mt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-1">
          {firstName ? `Great work, ${firstName}!` : 'Your Results'}
        </h2>
        <p className="text-blue-100 text-sm">Here are your personalised health metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* BMR */}
        <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{Math.round(bmr)}</div>
          <div className="text-xs text-gray-500 mt-1">BMR (cal/day)</div>
          <div className="text-xs text-gray-400">Resting burn</div>
        </div>

        {/* TDEE */}
        <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
          <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{Math.round(tdee)}</div>
          <div className="text-xs text-gray-500 mt-1">TDEE (cal/day)</div>
          <div className="text-xs text-gray-400">Total daily burn</div>
        </div>

        {/* Target Calories */}
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow p-4 text-center border border-blue-200">
          <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">{Math.round(adjustedCalories || tdee)}</div>
          <div className="text-xs text-blue-600 mt-1 font-medium">Target (cal/day)</div>
          <div className="text-xs text-gray-400 truncate">{goalDescription}</div>
        </div>

        {/* BMI */}
        <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
          <Scale className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{bmi?.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">BMI</div>
          <div className={`text-xs font-medium mt-1 ${bmiCategory?.color || 'text-gray-500'}`}>
            {bmiCategory?.category}
          </div>
        </div>
      </div>

      {/* Body Composition */}
      <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Body Composition
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-600">
              {bodyFatPercentage != null ? `${bodyFatPercentage.toFixed(1)}%` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Body Fat</div>
            {bodyFatCategory && (
              <div className={`text-xs font-medium mt-1 ${bodyFatCategory.color}`}>
                {bodyFatCategory.category}
              </div>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">
              {leanBodyMass != null ? `${leanBodyMass.toFixed(1)} kg` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Lean Mass</div>
            <div className="text-xs text-gray-400 mt-1">Muscle + bone + water</div>
          </div>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Daily Macro Targets
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{proteinG}g</div>
            <div className="text-xs text-gray-500 mt-1">Protein</div>
            <div className="text-xs text-blue-400">{proteinCals} cal · 30%</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-amber-600">{carbsG}g</div>
            <div className="text-xs text-gray-500 mt-1">Carbs</div>
            <div className="text-xs text-amber-400">{carbCals} cal · 40%</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-pink-600">{fatG}g</div>
            <div className="text-xs text-gray-500 mt-1">Fat</div>
            <div className="text-xs text-pink-400">{fatCals} cal · 30%</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Based on a balanced 30/40/30 protein/carb/fat split. Adjust in Nutrition settings.
        </p>
      </div>

      {/* Body Type */}
      {bodyType && (
        <div className={`rounded-xl shadow p-5 border ${bodyTypeColor}`}>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Body Type: <span className="capitalize">{bodyType}</span> {bodyTypeEmoji}
            {bodyTypeConfidence != null && (
              <span className="text-xs font-normal opacity-70 ml-1">
                ({Math.round(bodyTypeConfidence * 100)}% match)
              </span>
            )}
          </h3>
          {bodyTypeInfo && (
            <div className="space-y-2 text-sm">
              {bodyTypeInfo.description && (
                <p className="opacity-80">{bodyTypeInfo.description}</p>
              )}
              {bodyTypeInfo.strengths?.length > 0 && (
                <div>
                  <span className="font-medium">Strengths: </span>
                  <span className="opacity-70">{bodyTypeInfo.strengths.join(', ')}</span>
                </div>
              )}
              {bodyTypeInfo.recommendations?.length > 0 && (
                <div>
                  <span className="font-medium">Recommendations: </span>
                  <span className="opacity-70">{bodyTypeInfo.recommendations.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
