import { useState, useEffect, useRef } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { 
  Camera, Video, Square, Play, AlertTriangle, CheckCircle, 
  TrendingUp, Award, BarChart3, X, Info
} from 'lucide-react';

const FormAnalysis = () => {
  const [user, setUser] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [currentFormScore, setCurrentFormScore] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [repData, setRepData] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const sessionStartTime = useRef(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchExercises();
      fetchSessionHistory();
    }
  }, [user]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const fetchExercises = async () => {
    try {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      // Skip in demo mode - form analysis requires camera
      if (user.id.startsWith('demo')) {
        setSessionHistory([]);
        return;
      }

      const { data } = await supabase
        .from('form_analysis_sessions')
        .select(`
          *,
          exercises(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setSessionHistory(data || []);
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission(true);
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera permission denied. Please allow camera access to use form analysis.');
      return null;
    }
  };

  const startAnalysis = async () => {
    if (!selectedExercise) {
      alert('Please select an exercise first');
      return;
    }

    // Block demo mode from using form analysis
    if (user.id.startsWith('demo')) {
      alert('Form Analysis requires camera access and is not available in demo mode. Please sign up for a free account to use this feature!');
      return;
    }

    const stream = await requestCameraPermission();
    if (!stream) return;

    try {
      // Create form analysis session
      const { data: session, error } = await supabase
        .from('form_analysis_sessions')
        .insert({
          user_id: user.id,
          exercise_id: selectedExercise.id,
          start_time: new Date().toISOString(),
          analysis_status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      setSessionData(session);
      sessionStartTime.current = Date.now();
      setIsRecording(true);
      setRepCount(0);
      setRepData([]);
      setFeedback([]);

      // Start MediaRecorder for video
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadVideo(blob, session.id);
      };

      mediaRecorderRef.current.start();

      // Start pose detection simulation (in production, use MediaPipe)
      startPoseDetection();
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Error starting analysis. Please try again.');
    }
  };

  const startPoseDetection = () => {
    // Simulated pose detection - in production, integrate MediaPipe
    const interval = setInterval(() => {
      if (!isRecording) {
        clearInterval(interval);
        return;
      }

      // Simulate form score (in production, calculate from joint angles)
      const score = 70 + Math.random() * 25; // 70-95 range
      setCurrentFormScore(Math.round(score));

      // Simulate rep detection (in production, use pose landmarks)
      if (Math.random() > 0.95) {
        detectRep(score);
      }
    }, 100);
  };

  const detectRep = async (formScore) => {
    const newRepCount = repCount + 1;
    setRepCount(newRepCount);

    const timestamp = Date.now() - sessionStartTime.current;

    // Create rep data
    const repInfo = {
      rep_number: newRepCount,
      form_score: formScore,
      timestamp_ms: timestamp,
      joint_angles: generateSimulatedJointAngles(),
      warning_type: formScore < 75 ? 'caution' : formScore < 85 ? 'good' : 'excellent'
    };

    setRepData(prev => [...prev, repInfo]);

    // Generate feedback
    const feedbackMessage = generateFeedback(formScore, newRepCount);
    setFeedback(prev => [...prev, feedbackMessage]);

    // Save to database
    try {
      await supabase.from('form_reps').insert({
        form_session_id: sessionData.id,
        user_id: user.id,
        rep_number: newRepCount,
        timestamp_start: timestamp,
        timestamp_end: timestamp + 2000,
        duration_ms: 2000,
        form_score: formScore,
        joint_angles_data: repInfo.joint_angles,
        warning_type: repInfo.warning_type,
        feedback_summary: feedbackMessage.message
      });

      await supabase.from('form_feedback').insert({
        form_session_id: sessionData.id,
        user_id: user.id,
        feedback_type: feedbackMessage.type,
        message: feedbackMessage.message,
        severity: feedbackMessage.severity,
        timestamp_ms: timestamp
      });
    } catch (error) {
      console.error('Error saving rep data:', error);
    }
  };

  const generateSimulatedJointAngles = () => {
    return {
      knee_angle: 90 + Math.random() * 20,
      hip_angle: 85 + Math.random() * 15,
      back_angle: 170 + Math.random() * 10,
      shoulder_angle: 160 + Math.random() * 20
    };
  };

  const generateFeedback = (score, repNum) => {
    const feedbackOptions = {
      excellent: [
        { type: 'positive', message: 'Perfect form! Keep it up!', severity: 'info' },
        { type: 'positive', message: 'Excellent depth and control!', severity: 'info' },
        { type: 'positive', message: 'Great range of motion!', severity: 'info' }
      ],
      good: [
        { type: 'tip', message: 'Good! Try to go a bit deeper.', severity: 'info' },
        { type: 'tip', message: 'Nice! Keep your back straight.', severity: 'warning' },
        { type: 'tip', message: 'Good form! Control the descent.', severity: 'info' }
      ],
      caution: [
        { type: 'correction', message: 'Watch your knee alignment!', severity: 'warning' },
        { type: 'correction', message: 'Keep your back neutral!', severity: 'warning' },
        { type: 'correction', message: 'Slow down the movement!', severity: 'critical' }
      ]
    };

    const category = score >= 85 ? 'excellent' : score >= 75 ? 'good' : 'caution';
    const options = feedbackOptions[category];
    return options[Math.floor(Math.random() * options.length)];
  };

  const stopAnalysis = async () => {
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    // Calculate session stats
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    const avgScore = repData.reduce((sum, rep) => sum + rep.form_score, 0) / repData.length || 0;
    const maxScore = Math.max(...repData.map(rep => rep.form_score), 0);
    const minScore = Math.min(...repData.map(rep => rep.form_score), 100);

    // Update session
    try {
      await supabase
        .from('form_analysis_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_seconds: duration,
          total_reps: repCount,
          average_form_score: avgScore,
          max_form_score: maxScore,
          min_form_score: minScore,
          analysis_status: 'completed'
        })
        .eq('id', sessionData.id);

      setShowResults(true);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const uploadVideo = async (blob, sessionId) => {
    try {
      const fileName = `${user.id}/${sessionId}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('form-analysis-videos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('form-analysis-videos')
        .getPublicUrl(fileName);

      await supabase
        .from('form_analysis_sessions')
        .update({ video_url: publicUrl })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  const resetAnalysis = () => {
    setSelectedExercise(null);
    setSessionData(null);
    setRepCount(0);
    setRepData([]);
    setFeedback([]);
    setShowResults(false);
    setCameraPermission(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to use form analysis</p>
        </div>
      </div>
    );
  }

  // Results View
  if (showResults) {
    const avgScore = repData.reduce((sum, rep) => sum + rep.form_score, 0) / repData.length || 0;
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>
              <button
                onClick={resetAnalysis}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{repCount}</div>
                <div className="text-sm text-gray-600">Total Reps</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(avgScore)}</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.max(...repData.map(r => r.form_score), 0).toFixed(0)}</div>
                <div className="text-sm text-gray-600">Best Score</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">{duration}s</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
            </div>

            {/* Rep-by-Rep Breakdown */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rep-by-Rep Analysis</h2>
              <div className="space-y-2">
                {repData.map((rep, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-700 w-16">Rep {rep.rep_number}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rep.form_score >= 85 ? 'bg-green-500' :
                              rep.form_score >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${rep.form_score}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-12">{Math.round(rep.form_score)}</span>
                      </div>
                    </div>
                    {rep.warning_type === 'excellent' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : rep.warning_type === 'caution' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Info className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
              <div className="space-y-2">
                {feedback.slice(-5).map((fb, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      fb.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                      fb.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <p className="text-sm text-gray-700">{fb.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetAnalysis}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Analyze Another Exercise
              </button>
              <button
                onClick={() => {/* View detailed history */}}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Analysis View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Form Analysis</h1>

        {!selectedExercise ? (
          // Exercise Selection
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Exercise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{exercise.name}</h3>
                  <p className="text-sm text-gray-600">{exercise.primary_muscle?.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !isRecording ? (
          // Start Analysis Screen
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedExercise.name}</h2>
            <p className="text-gray-600 mb-6">Position yourself in front of the camera and start when ready</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSelectedExercise(null)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Change Exercise
              </button>
              <button
                onClick={startAnalysis}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Analysis
              </button>
            </div>
          </div>
        ) : (
          // Active Analysis Screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                
                {/* Overlay Stats */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                    <div className="text-3xl font-bold">{repCount}</div>
                    <div className="text-xs">Reps</div>
                  </div>
                  <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                    <div className="text-3xl font-bold">{Math.round(currentFormScore)}</div>
                    <div className="text-xs">Form Score</div>
                  </div>
                </div>

                {/* Stop Button */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={stopAnalysis}
                    className="bg-red-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-6 h-6" />
                    Stop Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Live Feedback */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Feedback</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedback.slice().reverse().map((fb, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      fb.type === 'positive' ? 'bg-green-50 text-green-800' :
                      fb.type === 'correction' ? 'bg-red-50 text-red-800' :
                      'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {fb.message}
                  </div>
                ))}
                {feedback.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Start performing reps to see feedback
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default FormAnalysis;
