import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ProgressiveOverloadTracker = ({ userId, exerciseId, exerciseName, onSuggestionApplied }) => {
  const [progression, setProgression] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (userId && exerciseId) {
      loadProgressionData();
    }
  }, [userId, exerciseId]);

  const loadProgressionData = async () => {
    setLoading(true);
    try {
      // Load current progression
      const { data: progressData, error: progressError } = await supabase
        .from('exercise_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progression:', progressError);
      }

      setProgression(progressData || null);

      // Get AI suggestion
      const { data: suggestionData, error: suggestionError } = await supabase
        .rpc('calculate_progression_suggestion', {
          p_user_id: userId,
          p_exercise_id: exerciseId
        });

      if (suggestionError) {
        console.error('Error getting suggestion:', suggestionError);
      }

      if (suggestionData && suggestionData.length > 0) {
        setSuggestion(suggestionData[0]);
      }
    } catch (error) {
      console.error('Error loading progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion && onSuggestionApplied) {
      onSuggestionApplied({
        weight: suggestion.suggested_weight,
        reps: suggestion.suggested_reps,
        sets: suggestion.suggested_sets
      });
    }
  };

  const getStrategyText = (strategy) => {
    const strategies = {
      'start_light': 'Starting with a light weight to establish baseline',
      'weight_progression': 'Time to increase weight! You\'ve mastered the current weight.',
      'rep_progression': 'Add one more rep to build strength at this weight',
      'maintain_form': 'Focus on perfecting form at current weight'
    };
    return strategies[strategy] || 'Keep up the great work!';
  };

  const getStrategyIcon = (strategy) => {
    switch (strategy) {
      case 'weight_progression':
        return <TrendingUp className="text-green-600" size={20} />;
      case 'rep_progression':
        return <Zap className="text-blue-600" size={20} />;
      case 'maintain_form':
        return <Target className="text-yellow-600" size={20} />;
      default:
        return <CheckCircle className="text-gray-600" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Stats */}
      {progression && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award className="text-blue-600" size={20} />
              Your Current Stats
            </h3>
            {progression.needs_deload && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                <AlertCircle size={12} />
                Deload Recommended
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {progression.current_weight || '—'}
              </div>
              <div className="text-xs text-gray-600">Weight (lbs)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {progression.current_reps || '—'}
              </div>
              <div className="text-xs text-gray-600">Reps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {progression.current_sets || '—'}
              </div>
              <div className="text-xs text-gray-600">Sets</div>
            </div>
          </div>

          {/* Personal Records */}
          {(progression.max_weight || progression.max_reps) && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-xs text-gray-600 mb-2 font-medium">Personal Records</div>
              <div className="flex gap-4 text-sm">
                {progression.max_weight && (
                  <div className="flex items-center gap-1">
                    <Award className="text-yellow-500" size={14} />
                    <span className="font-semibold">{progression.max_weight} lbs</span>
                    <span className="text-gray-600">max weight</span>
                  </div>
                )}
                {progression.max_reps && (
                  <div className="flex items-center gap-1">
                    <Award className="text-yellow-500" size={14} />
                    <span className="font-semibold">{progression.max_reps}</span>
                    <span className="text-gray-600">max reps</span>
                  </div>
                )}
              </div>
              {progression.pr_date && (
                <div className="text-xs text-gray-500 mt-1">
                  Last PR: {new Date(progression.pr_date).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Workout History */}
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-medium">{progression.total_workouts || 0}</span> workouts completed
            {progression.last_workout_date && (
              <span className="ml-2">
                • Last: {new Date(progression.last_workout_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {suggestion && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            {getStrategyIcon(suggestion.strategy)}
            <h3 className="font-semibold text-gray-900">Progressive Overload Suggestion</h3>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            {getStrategyText(suggestion.strategy)}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-white rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {suggestion.suggested_weight}
              </div>
              <div className="text-xs text-gray-600">Weight (lbs)</div>
              {progression && suggestion.suggested_weight > progression.current_weight && (
                <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp size={12} />
                  +{(suggestion.suggested_weight - progression.current_weight).toFixed(1)}
                </div>
              )}
            </div>
            <div className="text-center bg-white rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {suggestion.suggested_reps}
              </div>
              <div className="text-xs text-gray-600">Reps</div>
              {progression && suggestion.suggested_reps > progression.current_reps && (
                <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp size={12} />
                  +{suggestion.suggested_reps - progression.current_reps}
                </div>
              )}
            </div>
            <div className="text-center bg-white rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {suggestion.suggested_sets}
              </div>
              <div className="text-xs text-gray-600">Sets</div>
            </div>
          </div>

          <button
            onClick={applySuggestion}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Apply This Suggestion
          </button>
        </div>
      )}

      {/* First Time Message */}
      {!progression && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-900">First Time Training {exerciseName}?</h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Start with a weight that allows you to complete all reps with good form. We'll track your progress and suggest improvements!
          </p>
          {suggestion && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-sm text-gray-700 mb-2">Recommended starting point:</div>
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-blue-600">{suggestion.suggested_weight}</div>
                  <div className="text-xs text-gray-600">lbs</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{suggestion.suggested_reps}</div>
                  <div className="text-xs text-gray-600">reps</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{suggestion.suggested_sets}</div>
                  <div className="text-xs text-gray-600">sets</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deload Warning */}
      {progression && progression.needs_deload && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <h3 className="font-semibold text-gray-900">Time for a Deload Week</h3>
          </div>
          <p className="text-sm text-gray-700">
            You've been training hard for {progression.weeks_since_deload} weeks. Consider reducing weight by 40-50% this week to allow for recovery and prevent burnout.
          </p>
        </div>
      )}

      {/* PR Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-scaleIn">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Personal Record!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You just set a new PR on {exerciseName}!
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Awesome! 💪
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveOverloadTracker;

