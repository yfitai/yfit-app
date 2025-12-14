import React, { useState, useEffect } from 'react';
import { Video, TrendingUp, Award, Calendar, Eye, Filter } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';
import FormAnalysisResults from './FormAnalysisResults';

const FormAnalysisHistory = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filterExercise, setFilterExercise] = useState('all');
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadFormAnalysisHistory();
      loadStats();
    }
  }, [user, filterExercise]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadFormAnalysisHistory = async () => {
    console.log('📊 Loading Form Analysis History for user:', user?.id);
    setLoading(true);
    try {
      let query = supabase
        .from('user_form_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filterExercise !== 'all') {
        query = query.eq('exercise_id', filterExercise);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('✅ Form Analysis History loaded:', data?.length || 0, 'videos');
      setVideos(data || []);

      // Get unique exercises for filter
      const uniqueExercises = [...new Set(data.map(v => ({ id: v.exercise_id, name: v.exercise_name })))];
      setExercises(uniqueExercises);
    } catch (error) {
      console.error('❌ Error loading form analysis history:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_form_analysis_history')
        .select('overall_score, form_grade, created_at')
        .eq('user_id', user.id)
        .not('overall_score', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const avgScore = data.reduce((sum, v) => sum + v.overall_score, 0) / data.length;
        const recentScores = data.slice(0, 5).map(v => v.overall_score);
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const improvement = recentAvg - avgScore;

        const gradeCounts = {
          'Excellent': data.filter(v => v.form_grade === 'Excellent').length,
          'Good': data.filter(v => v.form_grade === 'Good').length,
          'Fair': data.filter(v => v.form_grade === 'Fair').length,
          'Needs Improvement': data.filter(v => v.form_grade === 'Needs Improvement').length
        };

        setStats({
          totalVideos: data.length,
          avgScore: avgScore.toFixed(1),
          recentAvg: recentAvg.toFixed(1),
          improvement: improvement.toFixed(1),
          gradeCounts
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Good':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div>
        <button
          onClick={() => setSelectedVideo(null)}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          ← Back to History
        </button>
        <FormAnalysisResults 
          videoId={selectedVideo.id} 
          exerciseName={selectedVideo.exercise_name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="text-purple-600" size={28} />
            Form Analysis History
          </h2>
          <p className="text-gray-600 mt-1">Track your form improvement over time</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Video size={20} className="text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalVideos}</span>
            </div>
            <div className="text-sm text-gray-700 font-medium">Total Analyses</div>
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

      {/* Grade Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Grade Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.gradeCounts).map(([grade, count]) => (
              <div key={grade} className={`rounded-lg p-4 border ${getGradeColor(grade)}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-medium mt-1">{grade}</div>
              </div>
            ))}
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
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
          <Video size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Form Analyses Yet</h3>
          <p className="text-gray-600 mb-4">
            Start uploading videos to get AI-powered form feedback and track your progress!
          </p>
          <a
            href="/fitness"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Exercise Library
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Video Thumbnail */}
              <div className="aspect-video bg-gray-100 relative">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.exercise_name}
                    className="w-full h-full object-cover"
                  />
                ) : video.exercise_gif ? (
                  <img 
                    src={video.exercise_gif} 
                    alt={video.exercise_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={48} className="text-gray-400" />
                  </div>
                )}
                
                {/* Score Badge */}
                {video.overall_score && (
                  <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1.5 shadow-lg">
                    <span className="text-lg font-bold text-gray-900">
                      {video.overall_score.toFixed(0)}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                {video.analysis_status !== 'completed' && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {video.analysis_status}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {video.exercise_name}
                </h3>

                {/* Grade */}
                {video.form_grade && (
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getGradeColor(video.form_grade)}`}>
                      {video.form_grade}
                    </span>
                  </div>
                )}

                {/* Metrics */}
                {video.reps_detected && (
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="bg-gray-50 rounded px-2 py-1">
                      <span className="text-gray-600">Reps:</span>
                      <span className="font-semibold text-gray-900 ml-1">{video.reps_detected}</span>
                    </div>
                    {video.depth_score && (
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <span className="text-gray-600">Depth:</span>
                        <span className="font-semibold text-gray-900 ml-1">{video.depth_score.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Count */}
                {(video.error_count > 0 || video.warning_count > 0) && (
                  <div className="flex items-center gap-3 text-sm mb-3">
                    {video.error_count > 0 && (
                      <span className="text-red-600">
                        {video.error_count} error{video.error_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {video.warning_count > 0 && (
                      <span className="text-yellow-600">
                        {video.warning_count} warning{video.warning_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormAnalysisHistory;

