import { useState } from 'react'
import { TrendingUp, Activity, Target, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProgressSimple({ user }) {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your journey and see how far you've come</p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Start Tracking Your Progress
            </h2>
            <p className="text-gray-600 mb-8">
              Begin logging your data to see your progress over time. Track weight, body measurements, 
              workouts, nutrition, and health metrics all in one place.
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => navigate('/goals')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all text-left"
            >
              <Target className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Set Goals</h3>
              <p className="text-sm text-gray-600">Define your fitness targets</p>
            </button>

            <button
              onClick={() => navigate('/nutrition')}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all text-left"
            >
              <Activity className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Log Meals</h3>
              <p className="text-sm text-gray-600">Track your nutrition</p>
            </button>

            <button
              onClick={() => navigate('/fitness')}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-all text-left"
            >
              <Plus className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Log Workouts</h3>
              <p className="text-sm text-gray-600">Record your exercises</p>
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">📊 What you'll see here:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Weight and body composition trends</li>
              <li>• Body measurements over time</li>
              <li>• Workout frequency and performance</li>
              <li>• Nutrition compliance and macros</li>
              <li>• Health metrics (blood pressure, sleep, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

