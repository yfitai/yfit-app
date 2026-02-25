import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Award, Calendar, Clock, Filter } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';

const FormAnalysisHistory = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser || null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filterExercise, setFilterExercise] = useState('all');
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      initializeUser();
    }
  }, [propUser]);

  useEffect(() => {
    if (user) {
      loadFormAnalysisSessions();
      loadStats();
    }
  }, [user, filterExercise]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadFormAnalysisSessions = async () => {
    console.log('📊 Loading Form Analysis Sessions for user:', user?.id);
    setLoading(true);
    try {
      let query = supabase
        .from('form_analysis_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filterExercise !== 'all') {
        query = query.eq('exercise_name', filterExercise);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('✅ Form Analysis Sessions loaded:', data?.length || 0, 'sessions');
      setSessions(data || []);

      // Get unique exercises for filter
      const uniqueExercises = [...new Set(data.map(s => s.exercise_name))].filter(Boolean);
      setExercises(uniqueExercises);
    } catch (error) {
      console.error('❌ Error loading form analysis sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('form_analysis_sessions')
        .select('average_form_score, total_reps, created_at')
        .eq('user_id', user.id)
        .not('average_form_score', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const avgScore = data.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / data.length;
        const totalReps = data.reduce((sum, s) => sum + (s.total_reps || 0), 0);
        const recentScores = data.slice(0, 5).map(s => s.average_form_score);
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const improvement = recentAvg - avgScore;

        setStats({
          totalSessions: data.length,
          avgScore: avgScore.toFixed(0),
          recentAvg: recentAvg.toFixed(0),
          improvement: improvement.toFixed(1),
          totalReps
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-purple-600" size={28} />
            Form Analysis History
          </h2>
          <p className="text-gray-600 mt-1">
            Track your form improvement over time with live analysis sessions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalSessions}</span>
            </div>
            <div className="text-sm text-gray-700 font-medium">Total Sessions</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Award size={20} className="text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{stats.avgScore}</span>
            </div>
            <div className="text-sm text-gray-700 font-medium">Average Score</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className="text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.recentAvg}</span>
            </div>
            <div className="text-sm text-gray-700 font-medium">Recent Average</div>
          </div>

          <div className={`bg-gradient-to-br rounded-lg p-4 border ${
            parseFloat(stats.improvement) >= 0 
              ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className={parseFloat(stats.improvement) >= 0 ? 'text-emerald-600' : 'text-orange-600'} />
              <span className={`text-2xl font-bold ${parseFloat(stats.improvement) >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {parseFloat(stats.improvement) >= 0 ? '+' : ''}{stats.improvement}
              </span>
            </div>
            <div className="text-sm text-gray-700 font-medium">Improvement</div>
          </div>
        </div>
      )}

      {/* Filter */}
      {exercises.length > 1 && (
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={filterExercise}
            onChange={(e) => setFilterExercise(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Exercises</option>
            {exercises.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
          <Activity size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Form Analyses Yet</h3>
          <p className="text-gray-600 mb-4">
            Start a live form analysis session to get real-time feedback and track your progress!
          </p>
          <a
            href="/fitness"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Fitness Tab
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Session Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                <h3 className="font-semibold text-lg mb-1">
                  {session.exercise_name || 'Unknown Exercise'}
                </h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Calendar size={14} />
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Session Stats */}
              <div className="p-4 space-y-3">
                {/* Form Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Form Score</span>
                  <span className={`px-3 py-1 rounded-full text-lg font-bold border ${
                    getScoreColor(session.average_form_score || 0)
                  }`}>
                    {session.average_form_score?.toFixed ? session.average_form_score.toFixed(0) : session.average_form_score || 'N/A'}
                  </span>
                </div>

                {/* Reps */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Total Reps</span>
                  <span className="text-lg font-bold text-gray-900">
                    {session.total_reps || 0}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <Clock size={14} />
                    Duration
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDuration(session.duration_seconds)}
                  </span>
                </div>

                {/* Score Range */}
                {session.min_form_score !== null && session.max_form_score !== null && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Score Range</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-600 font-medium">
                        Min: {session.min_form_score.toFixed ? session.min_form_score.toFixed(0) : session.min_form_score}
                      </span>
                      <span className="text-green-600 font-medium">
                        Max: {session.max_form_score.toFixed ? session.max_form_score.toFixed(0) : session.max_form_score}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormAnalysisHistory;
