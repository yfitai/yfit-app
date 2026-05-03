import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Target, Calendar, Sparkles, AlertCircle } from 'lucide-react'

export default function PredictionsDashboard({ user }) {
  const [predictions, setPredictions] = useState([])
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()
    fetchInsights()
  }, [user.id])

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPredictions(data || [])
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .gte('expires_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(5)

      if (error) throw error
      setInsights(data || [])
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const getPredictionIcon = (type) => {
    switch (type) {
      case 'weight_loss':
        return <TrendingUp className="w-6 h-6" />
      case 'strength_gain':
        return <Target className="w-6 h-6" />
      default:
        return <Sparkles className="w-6 h-6" />
    }
  }

  const getPredictionTitle = (type) => {
    switch (type) {
      case 'weight_loss':
        return 'Weight Loss Prediction'
      case 'strength_gain':
        return 'Strength Gain Prediction'
      case 'goal_achievement':
        return 'Goal Achievement'
      default:
        return 'Prediction'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" />
          Your Predictions
        </h1>
        <p className="mt-2 text-gray-600">
          AI-powered insights into your fitness journey
        </p>
      </div>

      {/* Predictions Grid */}
      {predictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 hover:border-blue-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    {getPredictionIcon(prediction.prediction_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {getPredictionTitle(prediction.prediction_type)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {prediction.algorithm_used?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(
                    prediction.confidence_score
                  )}`}
                >
                  {prediction.confidence_score}% confident
                </span>
              </div>

              {/* Current vs Predicted */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prediction.current_value}
                    {prediction.prediction_type === 'weight_loss' ? ' kg' : ' kg'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Predicted</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {prediction.predicted_value}
                    {prediction.prediction_type === 'weight_loss' ? ' kg' : ' kg'}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Predicted by: <strong>{formatDate(prediction.predicted_date)}</strong>
                </span>
              </div>

              {/* Progress Bar */}
              {prediction.target_date && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress to goal</span>
                    <span>
                      {Math.round(
                        ((prediction.current_value - prediction.predicted_value) /
                          (prediction.current_value - prediction.predicted_value)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          Math.round(
                            ((prediction.current_value - prediction.predicted_value) /
                              (prediction.current_value - prediction.predicted_value)) *
                              100
                          ),
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Predictions Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start tracking your progress to get AI-powered predictions!
          </p>
          <p className="text-sm text-gray-500">
            Set goals, log workouts, and track your weight to see personalized forecasts.
          </p>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            AI Insights & Recommendations
          </h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getPriorityColor(
                  insight.priority
                )}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{insight.icon || '💡'}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    {insight.action_items && insight.action_items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Action Items:
                        </p>
                        <ul className="space-y-1">
                          {insight.action_items.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      insight.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : insight.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {insight.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
