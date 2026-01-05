import { useState, useEffect, useRef } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useUnitPreference } from '../contexts/UnitPreferenceContext';
import { 
  Play, Pause, Square, Plus, Minus, Check, X, Clock, 
  Dumbbell, TrendingUp, Award, ChevronRight, Timer, Save, Trash2
} from 'lucide-react';

const WorkoutLogger = ({ onNavigateToBuilder }) => {
  const { distanceUnit, toggleDistanceUnit, isDistanceMetric, isDistanceImperial } = useUnitPreference();
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setData, setSetData] = useState({ weight: '', reps: '', rpe: 5 });
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    totalDistance: 0,
    duration: 0
  });
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Cardio tracking state
  const [cardioData, setCardioData] = useState({ duration: '', pace: '', distance: 0 });
  
  // Stretching tracking state
  const [stretchingData, setStretchingData] = useState({ duration: '' });

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  // Rest timer countdown
  useEffect(() => {
    let interval;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            playTimerSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // Reset set counter when exercise changes
  useEffect(() => {
    setCurrentSet(1);
  }, [currentExerciseIndex]);

  // Session duration tracker
  useEffect(() => {
    let interval;
    if (activeSession && !activeSession.end_time) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000);
        setSessionStats(prev => ({ ...prev, duration }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const fetchWorkouts = async () => {
    try {
      console.log('🔍 Fetching workouts for user:', user?.id);
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch workouts error:', error);
        throw error;
      }
      console.log('✅ Fetched workouts:', data?.length || 0, 'workouts');
      console.log('Workout data:', data);
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const startWorkoutSession = async (workout) => {
    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_id: workout?.id || null,
          session_name: workout?.name || 'Quick Workout',
          start_time: new Date().toISOString(),
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;

      // Create session exercises
      if (workout?.workout_exercises) {
        const sessionExercises = workout.workout_exercises.map(we => ({
          session_id: session.id,
          exercise_id: we.exercise_id,
          exercise_order: we.exercise_order,
          target_sets: we.target_sets,
          completed_sets: 0
        }));

        await supabase.from('session_exercises').insert(sessionExercises);
      }

      setActiveSession(session);
      setSelectedWorkout(workout);
      setShowWorkoutSelector(false);
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
    } catch (error) {
      console.error('Error starting workout session:', error);
    }
  };

  const logSet = async () => {
    const currentExercise = selectedWorkout.workout_exercises[currentExerciseIndex];
    const type = getExerciseType(currentExercise);

    // Validate based on exercise type
    if (type === 'strength' && (!setData.weight || !setData.reps)) {
      alert('Please enter weight and reps');
      return;
    }
    if (type === 'cardio' && (!cardioData.duration || !cardioData.pace)) {
      alert('Please enter duration and pace');
      return;
    }
    if (type === 'stretching' && !stretchingData.duration) {
      alert('Please enter duration');
      return;
    }

    try {
      // Get session exercise
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('exercise_id', currentExercise.exercise_id)
        .single();

      // Insert set based on exercise type
      if (type === 'strength') {
        await supabase.from('exercise_sets').insert({
          session_exercise_id: sessionExercises.id,
          set_number: currentSet,
          weight: parseFloat(setData.weight),
          reps: parseInt(setData.reps),
          rpe: setData.rpe,
          rest_seconds: currentExercise.rest_seconds || 60
        });

        // Update stats for strength
        const volume = parseFloat(setData.weight) * parseInt(setData.reps);
        setSessionStats(prev => ({
          ...prev,
          totalSets: prev.totalSets + 1,
          totalReps: prev.totalReps + parseInt(setData.reps),
          totalVolume: prev.totalVolume + volume
        }));

        // Start rest timer
        setRestTimer(currentExercise.rest_seconds || 60);
        setIsResting(true);
      } else if (type === 'cardio') {
        await supabase.from('exercise_sets').insert({
          session_exercise_id: sessionExercises.id,
          set_number: 1,
          duration_minutes: parseFloat(cardioData.duration),
          pace: parseFloat(cardioData.pace),
          distance: parseFloat(cardioData.distance),
          rpe: 5
        });

        // Update stats for cardio
        setSessionStats(prev => ({
          ...prev,
          totalSets: prev.totalSets + 1,
          totalReps: prev.totalReps + 1,
          totalVolume: prev.totalVolume,
          totalDistance: prev.totalDistance + parseFloat(cardioData.distance)
        }));
      } else if (type === 'stretching') {
        await supabase.from('exercise_sets').insert({
          session_exercise_id: sessionExercises.id,
          set_number: 1,
          duration_minutes: parseFloat(stretchingData.duration),
          rpe: 5
        });

        // Update stats for stretching
        setSessionStats(prev => ({
          ...prev,
          totalSets: prev.totalSets + 1,
          totalReps: prev.totalReps + 1,
          totalVolume: prev.totalVolume
        }));
      }

      // Update session exercise completed sets
      await supabase
        .from('session_exercises')
        .update({ completed_sets: type === 'strength' ? currentSet : 1 })
        .eq('id', sessionExercises.id);

      // Move to next set or exercise
      if (type === 'strength' && currentSet < currentExercise.target_sets) {
        setCurrentSet(prev => prev + 1);
      } else {
        // Move to next exercise or complete workout
        if (currentExerciseIndex < selectedWorkout.workout_exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSet(1);
        } else {
          // Workout complete
          completeWorkout();
        }
      }

      // Reset data based on type
      if (type === 'strength') {
        setSetData({ weight: '', reps: '', rpe: 5 });
      } else if (type === 'cardio') {
        setCardioData({ duration: '', pace: '', distance: 0 });
      } else if (type === 'stretching') {
        setStretchingData({ duration: '' });
      }
    } catch (error) {
      console.error('Error logging set:', error);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const completeWorkout = async () => {
    try {
      await supabase
        .from('workout_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_seconds: sessionStats.duration,
          total_exercises: selectedWorkout?.workout_exercises?.length || 0,
          total_sets: sessionStats.totalSets,
          total_reps: sessionStats.totalReps,
          total_volume: sessionStats.totalVolume,
          total_distance: sessionStats.totalDistance,
          is_completed: true
        })
        .eq('id', activeSession.id);

      alert('Workout completed! Great job! 💪');
      resetSession();
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Error completing workout. Please try again.');
    }
  };

  const cancelWorkout = async () => {
    if (confirm('Are you sure you want to cancel this workout?')) {
      try {
        await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', activeSession.id);

        resetSession();
      } catch (error) {
        console.error('Error canceling workout:', error);
      }
    }
  };

  const resetSession = () => {
    setActiveSession(null);
    setSelectedWorkout(null);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setSetData({ weight: '', reps: '', rpe: 5 });
    setRestTimer(0);
    setIsResting(false);
    setSessionStats({ totalSets: 0, totalReps: 0, totalVolume: 0, totalDistance: 0, duration: 0 });
    setShowWorkoutSelector(true);
  };

  const deleteWorkout = async (workoutId, e) => {
    // Prevent triggering the card click event
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      return;
    }
    
    try {
      // Delete workout exercises first (foreign key constraint)
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);
      
      if (exercisesError) throw exercisesError;
      
      // Delete the workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
      
      if (workoutError) throw workoutError;
      
      // Refresh the workouts list
      await fetchWorkouts();
      
      alert('Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Error deleting workout. Please try again.');
    }
  };

  const playTimerSound = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <p className="text-gray-600">Please sign in to log workouts</p>
        </div>
      </div>
    );
  }

  // Workout Selector View
  if (showWorkoutSelector) {
    return (
      <div className="min-h-screen p-6" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Start Workout</h1>

          {/* Saved Workouts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Workouts</h2>
            {workouts.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No saved workouts yet</p>
                <button 
                  onClick={onNavigateToBuilder}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Workout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.map(workout => (
                  <div
                    key={workout.id}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                    onClick={() => startWorkoutSession(workout)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{workout.name}</h3>
                        <p className="text-sm text-gray-600">{workout.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => deleteWorkout(workout.id, e)}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete workout"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{workout.workout_exercises?.length || 0} exercises</span>
                      <span>•</span>
                      <span>{workout.estimated_duration_minutes || 45} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Workout View
  const currentExercise = selectedWorkout?.workout_exercises?.[currentExerciseIndex];
  
  // Helper function to determine exercise type
  const getExerciseType = (exercise) => {
    if (!exercise?.exercises) return 'strength';
    
    let category = exercise.exercises.category;
    
    // Handle JSON array format: '["cardio"]' -> 'cardio'
    if (typeof category === 'string' && category.startsWith('[')) {
      try {
        const parsed = JSON.parse(category);
        category = Array.isArray(parsed) ? parsed[0] : category;
      } catch (e) {
        // If parsing fails, use as-is
      }
    }
    
    const categoryLower = (category || '').toLowerCase();
    if (categoryLower === 'cardio') return 'cardio';
    if (categoryLower === 'stretching' || categoryLower === 'flexibility') return 'stretching';
    return 'strength';
  };
  
  const exerciseType = getExerciseType(currentExercise);

  // If empty workout (no exercises), show add exercise UI
  if (!currentExercise && activeSession) {
    return (
      <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quick Workout</h1>
                <p className="text-sm text-gray-600">Freestyle session</p>
              </div>
              <button
                onClick={cancelWorkout}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Session Stats */}
            <div className={`grid ${exerciseType === 'strength' ? 'grid-cols-4' : 'grid-cols-1'} gap-4`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStats.duration)}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              {exerciseType === 'strength' && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{sessionStats.totalSets}</div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{sessionStats.totalReps}</div>
                    <div className="text-xs text-gray-600">Reps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(sessionStats.totalVolume)}</div>
                    <div className="text-xs text-gray-600">Volume (lbs)</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Empty Workout</h2>
            <p className="text-gray-600 mb-6">Add exercises as you go or complete this freestyle session</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={completeWorkout}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Complete Workout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
      {/* Header with Stats */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedWorkout?.name || 'Quick Workout'}</h1>
              <p className="text-sm text-gray-600">
                {currentExercise ? (
                  <>{currentExercise.exercises.name} ({currentExerciseIndex + 1} of {selectedWorkout?.workout_exercises?.length || 0})</>
                ) : (
                  <>Exercise {currentExerciseIndex + 1} of {selectedWorkout?.workout_exercises?.length || 0}</>
                )}
              </p>
            </div>
            <button
              onClick={cancelWorkout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Session Stats */}
          <div className={`grid ${exerciseType === 'strength' ? 'grid-cols-4' : 'grid-cols-1'} gap-4`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStats.duration)}</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
            {exerciseType === 'strength' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sessionStats.totalSets}</div>
                  <div className="text-xs text-gray-600">Sets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{sessionStats.totalReps}</div>
                  <div className="text-xs text-gray-600">Reps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(sessionStats.totalVolume)}</div>
                  <div className="text-xs text-gray-600">Volume (lbs)</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="bg-blue-600 text-white p-6 text-center">
          <Timer className="w-12 h-12 mx-auto mb-2 animate-pulse" />
          <div className="text-4xl font-bold mb-2">{formatTime(restTimer)}</div>
          <div className="text-sm opacity-90 mb-4">Rest Time Remaining</div>
          <button
            onClick={skipRest}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Skip Rest
          </button>
        </div>
      )}

      {/* Current Exercise */}
      <div className="max-w-4xl mx-auto p-6">
        {currentExercise && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentExercise.exercises.name}
              </h2>
              <div className="text-sm font-semibold text-gray-600">
                {currentExercise.exercises.name} ({currentExerciseIndex + 1} of {selectedWorkout.workout_exercises.length})
                {currentExerciseIndex === selectedWorkout.workout_exercises.length - 1 && (
                  <span className="ml-2 text-blue-600">🎯 Final Exercise!</span>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4">{currentExercise.exercises.description}</p>

            {/* Target Sets/Reps - Only show for strength exercises */}
            {exerciseType === 'strength' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Target Sets</div>
                    <div className="text-2xl font-bold text-gray-900">{currentExercise.target_sets}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Target Reps</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {currentExercise.target_reps_min}-{currentExercise.target_reps_max}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Set */}
            <div className="mb-6">
              {exerciseType === 'strength' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Set {currentSet} of {currentExercise.target_sets}
                  </h3>

                  {/* Weight Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSetData(prev => ({ ...prev, weight: Math.max(0, (parseFloat(prev.weight) || 0) - 5).toString() }))}
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        value={setData.weight}
                        onChange={(e) => setSetData(prev => ({ ...prev, weight: e.target.value }))}
                        className="flex-1 text-center text-2xl font-bold p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                        placeholder="0"
                      />
                      <button
                        onClick={() => setSetData(prev => ({ ...prev, weight: ((parseFloat(prev.weight) || 0) + 5).toString() }))}
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Reps Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSetData(prev => ({ ...prev, reps: Math.max(0, (parseInt(prev.reps) || 0) - 1).toString() }))}
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        value={setData.reps}
                        onChange={(e) => setSetData(prev => ({ ...prev, reps: e.target.value }))}
                        className="flex-1 text-center text-2xl font-bold p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                        placeholder="0"
                      />
                      <button
                        onClick={() => setSetData(prev => ({ ...prev, reps: ((parseInt(prev.reps) || 0) + 1).toString() }))}
                        className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* RPE Slider */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RPE (Rate of Perceived Exertion): {setData.rpe}/10
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Please select today's effort level</p>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={setData.rpe}
                      onChange={(e) => setSetData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Easy</span>
                      <span>Moderate</span>
                      <span>Max Effort</span>
                    </div>
                  </div>

                  {/* Log Set Button */}
                  <button
                    onClick={logSet}
                    disabled={!setData.weight || !setData.reps}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6" />
                    Complete Set
                  </button>
                </>
              )}

              {exerciseType === 'cardio' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cardio Session
                    </h3>
                    
                    {/* Distance Unit Toggle */}
                    <button
                      onClick={toggleDistanceUnit}
                      className="flex items-center gap-2 bg-gray-100 rounded-full p-1 transition-all duration-200 hover:bg-gray-150"
                      aria-label={`Switch to ${isDistanceMetric ? 'imperial' : 'metric'} distance units`}
                    >
                      <div className={`px-3 py-1 rounded-full transition-all duration-200 text-xs font-medium ${
                        isDistanceImperial
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                          : 'text-gray-600'
                      }`}>
                        mph
                      </div>
                      <div className={`px-3 py-1 rounded-full transition-all duration-200 text-xs font-medium ${
                        isDistanceMetric
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                          : 'text-gray-600'
                      }`}>
                        km/h
                      </div>
                    </button>
                  </div>

                  {/* Duration Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      placeholder="Enter duration in minutes"
                      value={cardioData.duration}
                      onChange={(e) => {
                        const duration = e.target.value;
                        setCardioData(prev => ({
                          ...prev,
                          duration,
                          distance: duration && prev.pace ? ((parseFloat(duration) / 60) * parseFloat(prev.pace)).toFixed(2) : 0
                        }));
                      }}
                      className="w-full text-center text-2xl font-bold p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                    />
                  </div>

                  {/* Pace Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pace ({isDistanceMetric ? 'km/h' : 'mph'})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={isDistanceMetric ? 'e.g., 6 for walking, 10 for jogging' : 'e.g., 4 for walking, 6 for jogging'}
                      value={cardioData.pace}
                      onChange={(e) => {
                        const pace = e.target.value;
                        setCardioData(prev => ({
                          ...prev,
                          pace,
                          distance: prev.duration && pace ? ((parseFloat(prev.duration) / 60) * parseFloat(pace)).toFixed(2) : 0
                        }));
                      }}
                      className="w-full text-center text-2xl font-bold p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                    />
                  </div>

                  {/* Distance Display (Auto-calculated) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance ({isDistanceMetric ? 'km' : 'miles'})
                    </label>
                    <div className="w-full text-center text-3xl font-bold p-4 bg-green-50 border-2 border-green-300 rounded-lg text-green-700">
                      {cardioData.distance || '0.00'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">Auto-calculated from duration × pace</p>
                  </div>

                  {/* Log Cardio Button */}
                  <button
                    onClick={logSet}
                    disabled={!cardioData.duration || !cardioData.pace}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6" />
                    Complete Cardio
                  </button>
                </>
              )}

              {exerciseType === 'stretching' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Stretching Session
                  </h3>

                  {/* Duration Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      placeholder="Enter duration in minutes"
                      value={stretchingData.duration}
                      onChange={(e) => setStretchingData({ duration: e.target.value })}
                      className="w-full text-center text-2xl font-bold p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                    />
                  </div>

                  {/* Log Stretching Button */}
                  <button
                    onClick={logSet}
                    disabled={!stretchingData.duration}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6" />
                    Complete Stretching
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Exercise Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log('Previous clicked, current index:', currentExerciseIndex);
              setCurrentExerciseIndex(prev => {
                const next = Math.max(0, prev - 1);
                console.log('Moving to index:', next);
                return next;
              });
            }}
            disabled={currentExerciseIndex === 0}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Exercise
          </button>
          <button
            onClick={() => {
              console.log('Next clicked, current index:', currentExerciseIndex);
              console.log('Total exercises:', selectedWorkout.workout_exercises.length);
              setCurrentExerciseIndex(prev => {
                const next = prev + 1;
                console.log('Moving to index:', next);
                return next;
              });
            }}
            disabled={currentExerciseIndex >= selectedWorkout.workout_exercises.length - 1}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Exercise
          </button>
        </div>

        {/* Finish Workout Button */}
        <button
          onClick={completeWorkout}
          className="w-full mt-4 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-6 h-6" />
          Finish Workout
        </button>
      </div>
    </div>
  );
};

export default WorkoutLogger;
