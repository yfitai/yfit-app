import React from 'react'
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * NutrientProgressCard Component
 * Displays nutrient intake with visual progress bar and goal tracking
 */
export default function NutrientProgressCard({ 
  name,
  current,
  goal,
  unit,
  type = 'target', // 'target' (reach goal) or 'limit' (stay under goal)
  color = 'blue'
}) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const isOverLimit = type === 'limit' && current > goal
  const isUnderTarget = type === 'target' && current < goal
  const isOnTrack = type === 'target' ? current >= goal : current <= goal
  
  // Color schemes
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      progress: 'bg-blue-500',
      progressBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      progress: 'bg-green-500',
      progressBg: 'bg-green-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      progress: 'bg-yellow-500',
      progressBg: 'bg-yellow-100'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      progress: 'bg-red-500',
      progressBg: 'bg-red-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      progress: 'bg-purple-500',
      progressBg: 'bg-purple-100'
    }
  }
  
  const colorScheme = colors[color] || colors.blue
  
  // Status indicator
  const getStatusIcon = () => {
    if (isOnTrack) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (isOverLimit) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    } else if (isUnderTarget) {
      return <TrendingUp className="w-5 h-5 text-orange-500" />
    }
    return null
  }
  
  const getStatusText = () => {
    if (isOnTrack) {
      return type === 'target' ? 'Goal Met!' : 'Within Limit'
    } else if (isOverLimit) {
      return `${Math.round(current - goal)}${unit} over limit`
    } else if (isUnderTarget) {
      return `${Math.round(goal - current)}${unit} to go`
    }
    return ''
  }
  
  return (
    <div className={`${colorScheme.bg} border ${colorScheme.border} rounded-lg p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${colorScheme.text}`}>{name}</h3>
        {getStatusIcon()}
      </div>
      
      {/* Values */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${colorScheme.text}`}>
          {Math.round(current)}
        </span>
        <span className="text-sm text-gray-600">
          / {Math.round(goal)} {unit}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className={`w-full ${colorScheme.progressBg} rounded-full h-2 mb-2`}>
        <div
          className={`${colorScheme.progress} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Status Text */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{Math.round(percentage)}%</span>
        <span className={`text-xs font-medium ${
          isOnTrack ? 'text-green-600' : 
          isOverLimit ? 'text-red-600' : 
          'text-orange-600'
        }`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  )
}

