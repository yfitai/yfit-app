import React, { useState, useEffect, useRef } from 'react';
import { Upload, Video, Camera, Play, Pause, Check, X, AlertCircle, TrendingUp, Award, Eye } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';

const VideoFormAnalysis = ({ exerciseId, exerciseName, onAnalysisComplete }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user && exerciseId) {
      loadRecentVideos();
    }
  }, [user, exerciseId]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadRecentVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('user_form_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .limit(5);

      if (error) throw error;
      setRecentVideos(data || []);
    } catch (error) {
      console.error('Error loading recent videos:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        alert('File size must be less than 100MB');
        return;
      }
      
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }

      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `form-check-${Date.now()}.webm`, { type: 'video/webm' });
        setSelectedFile(file);
        setVideoPreview(URL.createObjectURL(blob));
        setRecordedChunks(chunks);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${exerciseId}/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('form-analysis-videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('form-analysis-videos')
        .getPublicUrl(fileName);

      // Create database record
      const { data: videoRecord, error: dbError } = await supabase
        .from('form_analysis_videos')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          video_url: publicUrl,
          duration_seconds: videoRef.current?.duration || 0,
          file_size_bytes: selectedFile.size,
          video_format: selectedFile.type.split('/')[1],
          analysis_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Start AI analysis
      await analyzeVideo(videoRecord.id);
      
      // Clear selection
      setSelectedFile(null);
      setVideoPreview(null);
      
      // Reload recent videos
      await loadRecentVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const analyzeVideo = async (videoId) => {
    setAnalyzing(true);
    try {
      // Update status to processing
      await supabase
        .from('form_analysis_videos')
        .update({ 
          analysis_status: 'processing',
          analysis_started_at: new Date().toISOString()
        })
        .eq('id', videoId);

      // Simulate AI analysis (in production, this would call an Edge Function or external API)
      // For now, we'll create mock results
      await simulateAIAnalysis(videoId);

      // Calculate final score
      const { data: score } = await supabase
        .rpc('calculate_form_score', { p_video_id: videoId });

      // Load results
      const { data: results } = await supabase
        .from('user_form_analysis_history')
        .select('*')
        .eq('id', videoId)
        .single();

      setAnalysisResults(results);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (error) {
      console.error('Error analyzing video:', error);
      await supabase
        .from('form_analysis_videos')
        .update({ analysis_status: 'failed' })
        .eq('id', videoId);
    } finally {
      setAnalyzing(false);
    }
  };

  const simulateAIAnalysis = async (videoId) => {
    // This is a placeholder for actual AI analysis
    // In production, you would:
    // 1. Call a Supabase Edge Function
    // 2. Use MediaPipe, TensorFlow.js, or external API (like Pose Detection API)
    // 3. Process video frames and detect pose keypoints
    // 4. Calculate angles, ROM, tempo, etc.
    
    // For now, generate realistic mock data
    const mockScores = {
      depth_score: 75 + Math.random() * 20,
      range_of_motion_score: 80 + Math.random() * 15,
      tempo_score: 70 + Math.random() * 25,
      stability_score: 85 + Math.random() * 10,
      alignment_score: 78 + Math.random() * 18
    };

    // Insert analysis results
    await supabase
      .from('form_analysis_results')
      .insert({
        video_id: videoId,
        keypoints_detected: 17, // Standard pose detection keypoints
        confidence_score: 0.92,
        ...mockScores,
        knee_angle_min: 85,
        knee_angle_max: 175,
        reps_detected: 8,
        rep_consistency_score: 88,
        eccentric_time_avg: 2.5,
        concentric_time_avg: 1.8
      });

    // Insert feedback
    const feedbackItems = [];
    
    if (mockScores.depth_score < 80) {
      feedbackItems.push({
        video_id: videoId,
        category: 'warning',
        severity: 'moderate',
        title: 'Depth Could Be Improved',
        description: 'Try to go slightly deeper to maximize muscle engagement',
        timestamp_seconds: 5.2,
        body_part: 'legs',
        issue_type: 'depth',
        recommendation: 'Aim for parallel or slightly below parallel',
        priority: 2
      });
    }

    if (mockScores.tempo_score < 75) {
      feedbackItems.push({
        video_id: videoId,
        category: 'tip',
        severity: 'minor',
        title: 'Control Your Tempo',
        description: 'Slow down the eccentric (lowering) phase for better muscle activation',
        timestamp_seconds: 8.5,
        body_part: 'general',
        issue_type: 'tempo',
        recommendation: 'Use a 3-second lowering phase',
        priority: 1
      });
    }

    if (mockScores.alignment_score > 85) {
      feedbackItems.push({
        video_id: videoId,
        category: 'praise',
        severity: null,
        title: 'Excellent Form!',
        description: 'Your body alignment is excellent throughout the movement',
        timestamp_seconds: 3.0,
        body_part: 'general',
        issue_type: 'alignment',
        recommendation: 'Keep maintaining this form!',
        priority: 3
      });
    }

    if (feedbackItems.length > 0) {
      await supabase
        .from('form_analysis_feedback')
        .insert(feedbackItems);
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload/Record Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Video size={20} className="text-blue-600" />
          Upload or Record Form Check Video
        </h3>

        {!videoPreview ? (
          <div className="space-y-4">
            {/* Camera Preview */}
            {isRecording && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full max-w-2xl mx-auto rounded-lg bg-black"
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecording}
                    className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Record Video
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Upload size={20} />
                    Upload Video
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Pause size={20} />
                  Stop Recording
                </button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-gray-900 mb-1">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Record from the side for squats, deadlifts</li>
                    <li>Record from the front for bench press, overhead press</li>
                    <li>Ensure good lighting and full body is visible</li>
                    <li>Perform 3-8 reps for accurate analysis</li>
                    <li>Maximum file size: 100MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              className="w-full max-w-2xl mx-auto rounded-lg bg-black"
            />

            {/* Upload Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={uploadVideo}
                disabled={uploading || analyzing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Uploading...
                  </>
                ) : analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Analyze Form
                  </>
                )}
              </button>
              
              <button
                onClick={cancelUpload}
                disabled={uploading || analyzing}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <FormAnalysisResultsDisplay results={analysisResults} />
      )}

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye size={20} className="text-purple-600" />
            Recent Form Checks for {exerciseName}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors cursor-pointer">
                <div className="aspect-video bg-gray-100 relative">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="Video thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={40} className="text-gray-400" />
                    </div>
                  )}
                  {video.overall_score && (
                    <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm font-bold">
                      {video.overall_score.toFixed(0)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      video.form_grade === 'Excellent' ? 'bg-green-100 text-green-700' :
                      video.form_grade === 'Good' ? 'bg-blue-100 text-blue-700' :
                      video.form_grade === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {video.form_grade || 'Analyzing...'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {video.reps_detected && (
                    <div className="text-sm text-gray-600">
                      {video.reps_detected} reps detected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Results Display Component
const FormAnalysisResultsDisplay = ({ results }) => {
  if (!results) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
      <div className="flex items-center gap-3 mb-6">
        <Award className="text-green-600" size={28} />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Analysis Complete!</h3>
          <p className="text-sm text-gray-600">Your form has been analyzed</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="text-center mb-4">
          <div className={`text-6xl font-bold ${getScoreColor(results.overall_score)}`}>
            {results.overall_score?.toFixed(0)}
          </div>
          <div className="text-lg font-semibold text-gray-700 mt-2">{results.form_grade}</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getScoreBarColor(results.overall_score)}`}
            style={{ width: `${results.overall_score}%` }}
          />
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Depth', score: results.depth_score },
          { label: 'Range of Motion', score: results.range_of_motion_score },
          { label: 'Tempo', score: results.tempo_score },
          { label: 'Stability', score: results.stability_score },
          { label: 'Alignment', score: results.alignment_score }
        ].map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
              {metric.score?.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Feedback Summary */}
      {(results.error_count > 0 || results.warning_count > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="font-semibold text-gray-900">Areas for Improvement</span>
          </div>
          <div className="text-sm text-gray-700">
            {results.error_count > 0 && <div>• {results.error_count} form errors detected</div>}
            {results.warning_count > 0 && <div>• {results.warning_count} warnings</div>}
            <div className="mt-2 text-xs text-gray-600">
              View detailed feedback below to improve your form
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFormAnalysis;

