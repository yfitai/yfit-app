import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera as CameraIcon, StopCircle, Play, CheckCircle, AlertCircle } from 'lucide-react';

const FormAnalysisLive = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [formFeedback, setFormFeedback] = useState([]);
  const [repCount, setRepCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const selectedExerciseRef = useRef(null);
  const repStateRef = useRef('up'); // Track rep state: 'up', 'down', 'transition'
  const lastRepTimeRef = useRef(0); // Prevent double counting

  // Exercise options (starting with MVP 3)
  const exercises = [
    { id: 'squat', name: 'Bodyweight Squat', description: 'Stand with feet shoulder-width apart' },
    { id: 'pushup', name: 'Push-Up', description: 'Start in plank position' },
    { id: 'plank', name: 'Plank Hold', description: 'Hold plank position with proper form' }
  ];

  useEffect(() => {
    // Initialize MediaPipe Pose
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const onResults = (results) => {
    if (!canvasRef.current || !results.poseLandmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the pose skeleton
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00FF00',
      lineWidth: 4
    });
    
    drawLandmarks(ctx, results.poseLandmarks, {
      color: '#FF0000',
      lineWidth: 2,
      radius: 6
    });

    ctx.restore();

    // Analyze form based on selected exercise (using refs to get current values)
    if (isAnalyzingRef.current && selectedExerciseRef.current) {
      console.log('Analyzing form for:', selectedExerciseRef.current.id);
      analyzeForm(results.poseLandmarks, selectedExerciseRef.current.id);
    }
  };

  const analyzeForm = (landmarks, exerciseId) => {
    const feedback = [];

    switch (exerciseId) {
      case 'squat':
        feedback.push(...analyzeSquat(landmarks));
        break;
      case 'pushup':
        feedback.push(...analyzePushup(landmarks));
        break;
      case 'plank':
        feedback.push(...analyzePlank(landmarks));
        break;
    }

    setFormFeedback(feedback);
  };

  const analyzeSquat = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];
    const leftShoulder = landmarks[11];

    // Calculate knee angle
    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    console.log('Knee angle:', kneeAngle.toFixed(1), '| State:', repStateRef.current);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Standing position (knee angle > 160)
    if (kneeAngle > 160 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      // Coming up from squat - count rep!
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
      console.log('Rep counted! Total:', repCount + 1);
    }
    // Squatting position (knee angle < 100)
    else if (kneeAngle < 100 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
      console.log('Squat down detected');
    }
    
    // Check squat depth (knee angle should be < 90 degrees for proper depth)
    if (kneeAngle > 90 && kneeAngle < 160) {
      feedback.push({
        type: 'warning',
        message: 'Go deeper - aim for thighs parallel to ground'
      });
    } else if (kneeAngle <= 90) {
      feedback.push({
        type: 'success',
        message: 'Good depth!'
      });
    }

    // Check knee tracking (knee should not go too far forward)
    if (leftKnee.x > leftAnkle.x + 0.1) {
      feedback.push({
        type: 'warning',
        message: 'Knees too far forward - push hips back'
      });
    }

    return feedback;
  };

  const analyzePushup = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];

    // Check elbow angle for depth
    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Up position (elbow angle > 160)
    if (elbowAngle > 160 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      // Coming up from push-up - count rep!
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
      console.log('Push-up rep counted! Total:', repCount + 1);
    }
    // Down position (elbow angle < 100)
    else if (elbowAngle < 100 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
      console.log('Push-up down detected');
    }

    // Check body alignment (plank position)
    const bodyAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    
    if (Math.abs(bodyAngle - 180) > 15) {
      feedback.push({
        type: 'warning',
        message: 'Keep body straight - engage your core'
      });
    } else {
      feedback.push({
        type: 'success',
        message: 'Good body alignment!'
      });
    }
    
    if (elbowAngle < 100) {
      feedback.push({
        type: 'success',
        message: 'Good depth!'
      });
    } else if (elbowAngle > 140 && elbowAngle < 160) {
      feedback.push({
        type: 'info',
        message: 'Lower your chest closer to the ground'
      });
    }

    return feedback;
  };

  const analyzePlank = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftHip = landmarks[23];
    const leftAnkle = landmarks[27];

    // Check body alignment
    const bodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    
    if (Math.abs(bodyAngle - 180) < 10) {
      feedback.push({
        type: 'success',
        message: 'Perfect alignment!'
      });
    } else if (bodyAngle < 170) {
      feedback.push({
        type: 'warning',
        message: 'Hips too high - lower them'
      });
    } else {
      feedback.push({
        type: 'warning',
        message: 'Hips sagging - engage your core'
      });
    }

    return feedback;
  };

  const calculateAngle = (a, b, c) => {
    // Calculate angle between three points
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  };

  const startAnalysis = async () => {
    if (!selectedExercise) {
      alert('Please select an exercise first');
      return;
    }

    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    selectedExerciseRef.current = selectedExercise;
    setFormFeedback([]);
    setRepCount(0);
    repStateRef.current = 'up';
    lastRepTimeRef.current = 0;
    console.log('Started analysis for:', selectedExercise.name);

    // Start camera
    if (webcamRef.current && webcamRef.current.video && poseRef.current) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (poseRef.current && webcamRef.current && webcamRef.current.video) {
            await poseRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480
      });
      
      camera.start();
      cameraRef.current = camera;
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
    selectedExerciseRef.current = null;
    setFormFeedback([]);
    console.log('Stopped analysis');
    
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Form Analysis</h1>
          <p className="text-gray-600">Real-time AI-powered exercise form checking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Feed</h2>
              
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                  }}
                  onUserMedia={() => {
                    setCameraReady(true);
                    setCameraError(null);
                  }}
                  onUserMediaError={(error) => {
                    console.error('Camera error:', error);
                    setCameraError('Camera access denied or not available. Please allow camera access and refresh.');
                  }}
                  className="w-full h-full object-cover"
                />
                
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="absolute top-0 left-0 w-full h-full"
                />

                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white">
                      <CameraIcon className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                      <p>Requesting camera access...</p>
                      <p className="text-sm mt-2 opacity-75">Please allow camera permissions</p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white max-w-md px-4">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                      <p className="mb-4">{cameraError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex gap-4">
                {!isAnalyzing ? (
                  <button
                    onClick={startAnalysis}
                    disabled={!cameraReady || !selectedExercise}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Start Analysis
                  </button>
                ) : (
                  <button
                    onClick={stopAnalysis}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Analysis
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Exercise Selection & Feedback */}
          <div className="space-y-6">
            {/* Exercise Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Exercise</h2>
              
              <div className="space-y-3">
                {exercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedExercise?.id === exercise.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{exercise.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rep Counter */}
            {isAnalyzing && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rep Count</h2>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">{repCount}</div>
                  <div className="text-gray-600 mt-2">Reps Completed</div>
                </div>
              </div>
            )}

            {/* Form Feedback */}
            {isAnalyzing && formFeedback.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Feedback</h2>
                
                <div className="space-y-3">
                  {formFeedback.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        item.type === 'success'
                          ? 'bg-green-50 text-green-800'
                          : item.type === 'warning'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {item.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-sm font-medium">{item.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormAnalysisLive;
