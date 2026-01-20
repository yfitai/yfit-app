import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Target, Activity, Award, Calendar, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const WorkoutAnalyticsDashboard = ({ userId, timeRange: parentTimeRange = '30' }) => {
  const [loading, setLoading] = useState(true);
  const timeRange = parentTimeRange; // Use parent's time range (7, 30, 90, 365 days)
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([]);
  const [exerciseProgress, setExerciseProgress] = useState([]);
  const [currentWeekStats, setCurrentWeekStats] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [goals, setGoals] = useState(null);
  const [chartStartDate, setChartStartDate] = useState(null);

  useEffect(() => {
    if (userId) {
      loadAnalyticsData();
    }
  }, [userId, parentTimeRange, chartStartDate]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load goals first to get chart_start_date
      const goalsData = await loadUserGoals();
      const startDate = goalsData?.chart_start_date || null;
      
      // Then load chart data with the start date
      await Promise.all([
        loadWeeklyAnalytics(startDate),
        loadExerciseProgress(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyAnalytics = async (chartStartDateParam = chartStartDate) => {
    try {
      // Calculate date range based on days (timeRange is now in days: 7, 30, 90, 365)
      const daysToLoad = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToLoad);

      // Apply chart_start_date filter if set
      console.log('📊 WorkoutAnalytics - chartStartDate param:', chartStartDateParam);
      console.log('📊 WorkoutAnalytics - calculated startDate:', startDate.toISOString());
      
      const effectiveStartDate = chartStartDateParam && new Date(chartStartDateParam) > startDate 
        ? new Date(chartStartDateParam) 
        : startDate;
      
      console.log('📊 WorkoutAnalytics - effectiveStartDate:', effectiveStartDate.toISOString());

      // Load all workout sessions in the time range
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('start_time', effectiveStartDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading workout sessions:', error);
        setWeeklyAnalytics([]);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setWeeklyAnalytics([]);
        return;
      }

      // Group sessions by day or week depending on time range
      const groupByDay = daysToLoad <= 30; // Daily for 7 and 30 days, weekly for 90+ days
      const weeklyData = {};
      sessions.forEach(session => {
        const sessionDate = new Date(session.start_time);
        
        let weekKey;
        if (groupByDay) {
          // Group by individual day
          const dayStart = new Date(sessionDate);
          dayStart.setHours(0, 0, 0, 0);
          weekKey = dayStart.toISOString().split('T')[0];
        } else {
          // Group by week (Sunday start)
          const weekStart = new Date(sessionDate);
          const day = weekStart.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          const daysToSubtract = day; // Sunday (0) stays same, others go back to Sunday
          weekStart.setDate(weekStart.getDate() - daysToSubtract);
          weekStart.setHours(0, 0, 0, 0);
          weekKey = weekStart.toISOString().split('T')[0];
        }

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week_start_date: weekKey,
            workouts_completed: 0,
            total_volume: 0,
            total_duration_minutes: 0,
            total_sets: 0,
            total_reps: 0
          };
        }

        weeklyData[weekKey].workouts_completed += 1;
        weeklyData[weekKey].total_volume += session.total_volume || 0;
        
        // Calculate duration
        if (session.end_time) {
          const duration = (new Date(session.end_time) - new Date(session.start_time)) / 60000;
          weeklyData[weekKey].total_duration_minutes += Math.round(duration);
        }
      });

      // Convert to array and sort by date
      const weeklyArray = Object.values(weeklyData).sort((a, b) => 
        new Date(a.week_start_date) - new Date(b.week_start_date)
      );
      
      console.log('📊 Weekly workout data:', weeklyArray.map(w => ({
        week_start: w.week_start_date,
        workouts: w.workouts_completed,
        volume: w.total_volume
      })));

      // Calculate strength and consistency scores
      weeklyArray.forEach((week, index) => {
        // Strength score: based on volume progression
        if (index > 0) {
          const prevVolume = weeklyArray[index - 1].total_volume;
          const volumeChange = prevVolume > 0 ? ((week.total_volume - prevVolume) / prevVolume) * 100 : 0;
          week.strength_score = Math.max(0, Math.min(100, 70 + volumeChange));
          week.volume_change_percent = volumeChange;
        } else {
          week.strength_score = 70;
          week.volume_change_percent = 0;
        }

        // Consistency score: based on workouts completed (assuming 4 workouts/week goal)
        const workoutGoal = goals?.workouts_per_week || 4;
        week.consistency_score = Math.min(100, (week.workouts_completed / workoutGoal) * 100);
        week.goal_status = week.workouts_completed >= workoutGoal ? 'goal_met' : 'close_to_goal';
      });

      setWeeklyAnalytics(weeklyArray);
      if (weeklyArray.length > 0) {
        setCurrentWeekStats(weeklyArray[weeklyArray.length - 1]);
        
        // Calculate predictions if we have enough data
        if (weeklyArray.length >= 4) {
          calculatePredictions(weeklyArray.slice(-4).reverse());
        }
      }
    } catch (error) {
      console.error('Error loading weekly analytics:', error);
      setWeeklyAnalytics([]);
    }
  };

  const loadExerciseProgress = async () => {
    try {
      // Note: exercise_progression table doesn't exist yet
      // This would require complex calculation from workout_sessions and session_exercises
      // For now, set empty array
      setExerciseProgress([]);
    } catch (error) {
      console.error('Error loading exercise progress:', error);
      setExerciseProgress([]);
    }
  };

  const loadUserGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setGoals(data);
      
      // Set chart start date if available
      if (data?.chart_start_date) {
        console.log('📅 Chart start date loaded from DB:', data.chart_start_date);
        setChartStartDate(data.chart_start_date);
      } else {
        console.log('📅 No chart start date set in user_goals');
      }
      
      // Return data so it can be used immediately
      return data;
    } catch (error) {
      console.error('Error loading goals:', error);
      return null;
    }
  };

  const calculatePredictions = (data) => {
    // Simple linear regression for volume prediction
    const recentWeeks = data.slice(0, 4);
    const avgVolumeChange = recentWeeks.reduce((sum, week) => 
      sum + (week.volume_change_percent || 0), 0) / recentWeeks.length;
    
    const currentVolume = data[0].total_volume || 0;
    const predictedVolume = Math.round(currentVolume * (1 + avgVolumeChange / 100));

    // Strength prediction
    const avgStrengthChange = recentWeeks.reduce((sum, week) => 
      sum + (week.strength_change_percent || 0), 0) / recentWeeks.length;

    setPredictions({
      nextWeekVolume: predictedVolume,
      volumeChange: avgVolumeChange,
      strengthChange: avgStrengthChange,
      confidence: recentWeeks.length >= 4 ? 'high' : 'medium'
    });
  };

  const generateDemoWeeklyData = () => {
    const weeks = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (12 * 7));

    for (let i = 0; i < 12; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(weekDate.getDate() + (i * 7));
      
      weeks.push({
        week_start_date: weekDate.toISOString().split('T')[0],
        workouts_completed: 3 + Math.floor(Math.random() * 2),
        total_volume: 15000 + (i * 1000) + Math.floor(Math.random() * 2000),
        total_duration_minutes: 180 + Math.floor(Math.random() * 60),
        strength_score: 65 + (i * 2) + Math.floor(Math.random() * 5),
        consistency_score: 75 + Math.floor(Math.random() * 20),
        goal_status: i % 3 === 0 ? 'goal_met' : 'close_to_goal'
      });
    }
    return weeks;
  };

  const formatChartData = () => {
    const groupByDay = parseInt(timeRange) <= 30;
    return weeklyAnalytics.map(week => {
      // Parse date as UTC to prevent timezone shifts
      const date = new Date(week.week_start_date + 'T00:00:00Z');
      const label = groupByDay 
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        : 'Week of ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return {
        week: label,
        volume: Math.round(week.total_volume), // Keep as actual lbs
        strength: week.strength_score,
        workouts: week.workouts_completed,
        consistency: week.consistency_score
      };
    });
  };

  const getGoalStatusColor = (status) => {
    switch (status) {
      case 'goal_met': return 'text-green-600 bg-green-50 border-green-200';
      case 'close_to_goal': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getGoalStatusText = (status) => {
    switch (status) {
      case 'goal_met': return 'Goal Met! 🎉';
      case 'close_to_goal': return 'Close to Goal';
      default: return 'Below Goal';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const chartData = formatChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Workout Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Showing {timeRange === '7' ? '1 week' : timeRange === '30' ? '1 month' : timeRange === '90' ? '3 months' : '1 year'} of data</p>
      </div>

      {/* Total Volume Card - Keep this one */}
      {currentWeekStats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Volume</div>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {currentWeekStats.total_volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600 mt-1">lbs lifted</div>
            {currentWeekStats.volume_change_percent !== undefined && currentWeekStats.volume_change_percent !== 0 ? (
              <div className={`mt-2 flex items-center gap-1 text-sm ${currentWeekStats.volume_change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentWeekStats.volume_change_percent > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(currentWeekStats.volume_change_percent).toFixed(1)}% vs last week
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">First week of tracking</div>
            )}
          </div>
        </div>
      )}

      {/* Predictions */}
      {predictions && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Predictive Insights</h3>
            <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {predictions.confidence} confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Next Week Volume</div>
              <div className="text-2xl font-bold text-blue-600">
                {(predictions.nextWeekVolume / 1000).toFixed(1)}k lbs
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Based on {predictions.volumeChange > 0 ? 'upward' : 'downward'} trend
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Projected Strength Gain</div>
              <div className="text-2xl font-bold text-green-600">
                +{predictions.strengthChange.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Per week average
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Goal Achievement</div>
              <div className="text-2xl font-bold text-purple-600">
                {currentWeekStats?.goal_progress_percent?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                On track to meet goals
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volume Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Progression</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '12px' }} 
              label={{ value: 'Volume (lbs)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              formatter={(value) => [value.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' lbs', 'Volume']}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#volumeGradient)" 
              name="Volume"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>



      {/* Exercise Progress Table */}
      {exerciseProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise Progress</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Exercise</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Max PR</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Workouts</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {exerciseProgress.slice(0, 10).map((exercise, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{exercise.exercise_name}</div>
                      <div className="text-xs text-gray-600">{exercise.primary_muscle}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {exercise.current_weight ? `${exercise.current_weight} lbs × ${exercise.current_reps}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-yellow-600">
                      {exercise.max_weight ? `${exercise.max_weight} lbs` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {exercise.total_workouts || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        exercise.status === 'active' ? 'bg-green-100 text-green-700' :
                        exercise.status === 'needs_deload' ? 'bg-yellow-100 text-yellow-700' :
                        exercise.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {exercise.status === 'active' ? 'Active' :
                         exercise.status === 'needs_deload' ? 'Deload' :
                         exercise.status === 'inactive' ? 'Inactive' :
                         'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutAnalyticsDashboard;

