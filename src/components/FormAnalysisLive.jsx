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
  const [feedbackHistory, setFeedbackHistory] = useState([]); // Persistent feedback list
  const feedbackEndRef = useRef(null); // For auto-scroll


// Exercise options (10 total exercises)
const exercises = [
  { 
    id: 'squat', 
    name: 'Bodyweight Squat', 
    description: 'Stand with feet shoulder-width apart',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'pushup', 
    name: 'Push-Up', 
    description: 'Start in plank position',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'plank', 
    name: 'Plank Hold', 
    description: 'Hold plank position with proper form',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'situp', 
    name: 'Sit-Up', 
    description: 'Lie on your back with knees bent',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'deadlift', 
    name: 'Deadlift', 
    description: 'Stand with feet hip-width apart, barbell over mid-foot',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'benchpress', 
    name: 'Bench Press', 
    description: 'Lie on bench with feet flat on floor',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'lateralraise', 
    name: 'Lateral Raise', 
    description: 'Stand with dumbbells at sides',
    cameraAngle: '📸 Front view recommended'
  },
  { 
    id: 'preachercurl', 
    name: 'Preacher Curl', 
    description: 'Sit at preacher bench with arms extended',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'bicepcurl', 
    name: 'Bicep Curl', 
    description: 'Stand with dumbbells at sides, palms forward',
    cameraAngle: '📸 Side view recommended'
  },
  { 
    id: 'bentoverrow', 
    name: 'Dumbbell Bent Over Row', 
    description: 'Bend at hips with back straight, dumbbells hanging',
    cameraAngle: '📸 Side view recommended'
  }
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
      case 'situp':
        feedback.push(...analyzeSitup(landmarks));
        break;
      case 'deadlift':
        feedback.push(...analyzeDeadlift(landmarks));
        break;
      case 'benchpress':
        feedback.push(...analyzeBenchPress(landmarks));
        break;
      case 'lateralraise':
        feedback.push(...analyzeLateralRaise(landmarks));
        break;
      case 'preachercurl':
        feedback.push(...analyzePreacherCurl(landmarks));
        break;
      case 'bicepcurl':
        feedback.push(...analyzeBicepCurl(landmarks));
        break;
      case 'bentoverrow':
        feedback.push(...analyzeBentOverRow(landmarks));
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
  const analyzeSitup = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];

    // Calculate torso angle
    const torsoAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Up position (torso angle < 100)
    if (torsoAngle < 100 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Down position (torso angle > 140)
    else if (torsoAngle > 140 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Form feedback
    if (torsoAngle < 100) {
      feedback.push({
        type: 'success',
        message: 'Good range of motion!'
      });
    }

    return feedback;
  };

  const analyzeDeadlift = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    // Calculate hip angle
    const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Standing position (hip angle > 160)
    if (hipAngle > 160 && repStateRef.current === 'down' && timeSinceLastRep > 800) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Bent position (hip angle < 120)
    else if (hipAngle < 120 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Check back alignment
    const backAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    if (backAngle < 160) {
      feedback.push({
        type: 'warning',
        message: 'Keep your back straight - engage your core'
      });
    } else {
      feedback.push({
        type: 'success',
        message: 'Good back position!'
      });
    }

    return feedback;
  };

  const analyzeBenchPress = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];

    // Calculate elbow angle
    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Extended position (elbow angle > 160)
    if (elbowAngle > 160 && repStateRef.current === 'down' && timeSinceLastRep > 600) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Lowered position (elbow angle < 100)
    else if (elbowAngle < 100 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Form feedback
    if (elbowAngle < 100) {
      feedback.push({
        type: 'success',
        message: 'Good depth - bar to chest!'
      });
    } else if (elbowAngle > 120 && elbowAngle < 160) {
      feedback.push({
        type: 'info',
        message: 'Lower the bar closer to your chest'
      });
    }

    return feedback;
  };

  const analyzeLateralRaise = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const leftHip = landmarks[23];

    // Calculate arm angle relative to body
    const armAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Raised position (arm angle > 70)
    if (armAngle > 70 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Lowered position (arm angle < 40)
    else if (armAngle < 40 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Form feedback
    if (armAngle > 90) {
      feedback.push({
        type: 'warning',
        message: 'Don\'t raise too high - shoulder level is enough'
      });
    } else if (armAngle > 70) {
      feedback.push({
        type: 'success',
        message: 'Perfect height!'
      });
    }

    return feedback;
  };

  const analyzePreacherCurl = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];

    // Calculate elbow angle
    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Curled position (elbow angle < 60)
    if (elbowAngle < 60 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Extended position (elbow angle > 140)
    else if (elbowAngle > 140 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Form feedback
    if (elbowAngle < 60) {
      feedback.push({
        type: 'success',
        message: 'Full contraction!'
      });
    } else if (elbowAngle > 140) {
      feedback.push({
        type: 'success',
        message: 'Full extension!'
      });
    }

    return feedback;
  };

const analyzeBicepCurl = (landmarks) => {
  const feedback = [];
  
  // Get landmarks for BOTH arms
  const leftShoulder = landmarks[11];
  const leftElbow = landmarks[13];
  const leftWrist = landmarks[15];
  const rightShoulder = landmarks[12];
  const rightElbow = landmarks[14];
  const rightWrist = landmarks[16];

  // Calculate angles for both arms
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  
  // Use the arm with the smaller angle (the one that's curling)
  const elbowAngle = Math.min(leftElbowAngle, rightElbowAngle);
  const armSide = leftElbowAngle < rightElbowAngle ? 'Left' : 'Right';
  
  console.log(`Bicep Curl - ${armSide} Elbow angle:`, elbowAngle.toFixed(1), '| State:', repStateRef.current);
  
  // Rep counting logic
  const currentTime = Date.now();
  const timeSinceLastRep = currentTime - lastRepTimeRef.current;
  
  // Extended position (elbow angle > 150) - ready to curl
  if (elbowAngle > 150 && repStateRef.current === 'up') {
    repStateRef.current = 'down';
    console.log('Bicep curl extended - ready for next rep');
  }
  // Curled position (elbow angle < 50) - COUNT THE REP!
  else if (elbowAngle < 50 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
    const newRepCount = repCount + 1;
    setRepCount(newRepCount);
    repStateRef.current = 'up';
    lastRepTimeRef.current = currentTime;
    console.log('✅ Bicep curl rep counted! Total:', newRepCount);
    
    // Capture feedback for this specific rep
    const repFeedbackItem = {
      type: 'success',
      message: elbowAngle < 40 ? 'Excellent curl - full contraction!' : 'Good curl!',
      timestamp: new Date().toLocaleTimeString(),
      repNumber: newRepCount,
      id: Date.now() + Math.random()
    };
    
    // Add feedback to history
    setFeedbackHistory(prev => [repFeedbackItem, ...prev].slice(0, 50));
  }

  // Real-time form feedback (not saved to history)
  if (elbowAngle < 50) {
    feedback.push({
      type: 'success',
      message: 'Full curl - squeeze at the top!'
    });
  } else if (elbowAngle > 90 && elbowAngle < 150) {
    feedback.push({
      type: 'info',
      message: 'Curl higher for full range of motion'
    });
  }

  return feedback;
};



  const analyzeBentOverRow = (landmarks) => {
    const feedback = [];
    
    // Get key landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const leftHip = landmarks[23];

    // Calculate elbow angle
    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    // Rep counting logic
    const currentTime = Date.now();
    const timeSinceLastRep = currentTime - lastRepTimeRef.current;
    
    // Pulled position (elbow angle < 70)
    if (elbowAngle < 70 && repStateRef.current === 'down' && timeSinceLastRep > 500) {
      setRepCount(prev => prev + 1);
      repStateRef.current = 'up';
      lastRepTimeRef.current = currentTime;
    }
    // Extended position (elbow angle > 140)
    else if (elbowAngle > 140 && repStateRef.current === 'up') {
      repStateRef.current = 'down';
    }

    // Check torso angle (should be bent forward)
    const torsoAngle = calculateAngle(leftShoulder, leftHip, landmarks[25]);
    if (torsoAngle > 120) {
      feedback.push({
        type: 'warning',
        message: 'Bend forward more - torso should be near parallel'
      });
    } else {
      feedback.push({
        type: 'success',
        message: 'Good torso position!'
      });
    }

    return feedback;
  };

 function calculateAngle(a, b, c) {
  // Calculate angle between three points
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}


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

  const clearFeedback = () => {
    setFeedbackHistory([]);
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
            
            {/* Camera Angle Instruction */}
            {selectedExercise && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {selectedExercise.cameraAngle}
                </p>
              </div>
            )}
            
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
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
  {exercises.map(exercise => (
    <button
      key={exercise.id}
      onClick={() => {
        setSelectedExercise(exercise);
        setRepCount(0);
        setFeedbackHistory([]);
      }}
      disabled={isAnalyzing}
      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
        selectedExercise?.id === exercise.id
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="font-semibold text-gray-900">{exercise.name}</div>
      <div className="text-sm text-gray-600 mt-1">{exercise.description}</div>
    </button>
  ))}
</div>
               </div>


          {/* Rep Counter - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rep Count</h2>
            <div className="text-center">
              <div className={`text-6xl font-bold ${isAnalyzing ? 'text-blue-600' : 'text-gray-300'}`}>
                {repCount}
              </div>
              <div className="text-gray-600 mt-2">
                {isAnalyzing ? 'Reps Completed' : 'Start analysis to begin'}
              </div>
            </div>
          </div>

          {/* Persistent Form Feedback */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Form Feedback</h2>
              {feedbackHistory.length > 0 && (
                 <button
                     onClick={clearFeedback}
                     className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300 transition-colors"
                >
                     🗑️ Clear All
               </button>
  )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feedbackHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No feedback yet</p>
                  <p className="text-xs mt-1">Start exercising to see form tips</p>
                </div>
              ) : (
                feedbackHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      item.type === 'success'
                        ? 'bg-green-50 border-green-500 text-green-900'
                        : item.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                        : item.type === 'correction'
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-blue-50 border-blue-500 text-blue-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          {item.repNumber && <span className="text-xs font-bold text-gray-500">#{item.repNumber}</span>}
                          <p className="text-sm font-medium flex-1">{item.message}</p>
                        </div>
                        <p className="text-xs opacity-75 mt-1">{item.timestamp}</p>
                      </div>
                      {item.type === 'success' && (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      {(item.type === 'warning' || item.type === 'correction') && (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default FormAnalysisLive;