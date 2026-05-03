import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Award, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FormAnalysisResults = ({ videoId, exerciseName }) => {
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [results, setResults] = useState(null);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (videoId) {
      loadAnalysisData();
    }
  }, [videoId]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // Load video and results
      const { data: videoData, error: videoError } = await supabase
        .from('user_form_analysis_history')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError) throw videoError;
      setVideo(videoData);

      // Load detailed results
      const { data: resultsData, error: resultsError } = await supabase
        .from('form_analysis_results')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (resultsError) throw resultsError;
      setResults(resultsData);

      // Load feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('form_analysis_feedback')
        .select('*')
        .eq('video_id', videoId)
        .order('priority', { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!video || !results) {
    return (
      <div className="text-center p-8 text-gray-600">
        No analysis data available
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackIcon = (category) => {
    switch (category) {
      case 'error':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'warning':
        return <Info className="text-yellow-600" size={20} />;
      case 'praise':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const getFeedbackBgColor = (category) => {
    switch (category) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'praise':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Form Analysis Results</h2>
        <p className="text-blue-100">{exerciseName || video.exercise_name}</p>
        <p className="text-sm text-blue-100 mt-1">
          Analyzed on {new Date(video.created_at).toLocaleString()}
        </p>
      </div>

      {/* Overall Score Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Form Score</h3>
            <p className="text-sm text-gray-600">Based on 5 key metrics</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${getScoreColor(video.overall_score)}`}>
              {video.overall_score?.toFixed(0)}
            </div>
            <div className="text-lg font-semibold text-gray-700 mt-1">{video.form_grade}</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Depth', score: results.depth_score, icon: Target },
            { label: 'Range of Motion', score: results.range_of_motion_score, icon: TrendingUp },
            { label: 'Tempo', score: results.tempo_score, icon: Clock },
            { label: 'Stability', score: results.stability_score, icon: Zap },
            { label: 'Alignment', score: results.alignment_score, icon: Award }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} className="text-gray-600" />
                  <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score?.toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-medium">{metric.label}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.score >= 90 ? 'bg-green-500' :
                      metric.score >= 75 ? 'bg-blue-500' :
                      metric.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rep Analysis */}
      {results.reps_detected && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rep Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{results.reps_detected}</div>
              <div className="text-sm text-gray-600">Reps Detected</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{results.rep_consistency_score?.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{results.eccentric_time_avg?.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg Lowering</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{results.concentric_time_avg?.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg Lifting</div>
            </div>
          </div>
        </div>
      )}

      {/* Joint Angles */}
      {(results.knee_angle_min || results.hip_angle_min || results.elbow_angle_min) && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Joint Angles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.knee_angle_min && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Knee Angle</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{results.knee_angle_min?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">min</span>
                  <span className="text-gray-400">-</span>
                  <span className="text-2xl font-bold text-gray-900">{results.knee_angle_max?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">max</span>
                </div>
              </div>
            )}
            {results.hip_angle_min && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Hip Angle</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{results.hip_angle_min?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">min</span>
                  <span className="text-gray-400">-</span>
                  <span className="text-2xl font-bold text-gray-900">{results.hip_angle_max?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">max</span>
                </div>
              </div>
            )}
            {results.elbow_angle_min && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Elbow Angle</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{results.elbow_angle_min?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">min</span>
                  <span className="text-gray-400">-</span>
                  <span className="text-2xl font-bold text-gray-900">{results.elbow_angle_max?.toFixed(0)}°</span>
                  <span className="text-sm text-gray-600">max</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Feedback */}
      {feedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
          <div className="space-y-4">
            {feedback.map((item, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getFeedbackBgColor(item.category)}`}
              >
                <div className="flex items-start gap-3">
                  {getFeedbackIcon(item.category)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      {item.timestamp_seconds && (
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          @ {item.timestamp_seconds.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    {item.recommendation && (
                      <div className="bg-white bg-opacity-50 rounded p-3 mt-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">💡 Recommendation:</div>
                        <div className="text-sm text-gray-800">{item.recommendation}</div>
                      </div>
                    )}
                    {item.body_part && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                          {item.body_part}
                        </span>
                        {item.severity && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.severity}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Confidence */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">AI Confidence:</span> {(results.confidence_score * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Keypoints Detected:</span> {results.keypoints_detected}/17
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormAnalysisResults;

