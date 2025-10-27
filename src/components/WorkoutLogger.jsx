import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { 
  Play, Pause, Square, Plus, Minus, Check, X, Clock, 
  Dumbbell, TrendingUp, Award, ChevronRight, Timer, Save
} from 'lucide-react';

const WorkoutLogger = () => {
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
    duration: 0
  });
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(true);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercise:exercises (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
    if (!setData.weight || !setData.reps) {
      alert('Please enter weight and reps');
      return;
    }

    try {
      const currentExercise = selectedWorkout.workout_exercises[currentExerciseIndex];
      
      // Get session exercise
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('exercise_id', currentExercise.exercise_id)
        .single();

      // Insert set
      await supabase.from('exercise_sets').insert({
        session_exercise_id: sessionExercises.id,
        set_number: currentSet,
        weight: parseFloat(setData.weight),
        reps: parseInt(setData.reps),
        rpe: setData.rpe,
        rest_seconds: currentExercise.rest_seconds || 60
      });

      // Update session exercise completed sets
      await supabase
        .from('session_exercises')
        .update({ completed_sets: currentSet })
        .eq('id', sessionExercises.id);

      // Update stats
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

      // Move to next set or exercise
      if (currentSet >= currentExercise.target_sets) {
        // Move to next exercise
        if (currentExerciseIndex < selectedWorkout.workout_exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSet(1);
        } else {
          // Workout complete
          completeWorkout();
        }
      } else {
        setCurrentSet(prev => prev + 1);
      }

      // Reset set data
      setSetData({ weight: '', reps: '', rpe: 5 });
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
          total_exercises: selectedWorkout.workout_exercises.length,
          total_sets: sessionStats.totalSets,
          total_reps: sessionStats.totalReps,
          total_volume: sessionStats.totalVolume,
          is_completed: true
        })
        .eq('id', activeSession.id);

      alert('Workout completed! Great job! 💪');
      resetSession();
    } catch (error) {
      console.error('Error completing workout:', error);
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
    setSessionStats({ totalSets: 0, totalReps: 0, totalVolume: 0, duration: 0 });
    setShowWorkoutSelector(true);
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Start Workout</h1>

          {/* Quick Start */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
            <p className="mb-4 opacity-90">Start a freestyle workout without a template</p>
            <button
              onClick={() => startWorkoutSession(null)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Play className="inline w-5 h-5 mr-2" />
              Start Empty Workout
            </button>
          </div>

          {/* Saved Workouts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Workouts</h2>
            {workouts.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No saved workouts yet</p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Your First Workout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.map(workout => (
                  <div
                    key={workout.id}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => startWorkoutSession(workout)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{workout.name}</h3>
                        <p className="text-sm text-gray-600">{workout.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
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

  // If empty workout (no exercises), show add exercise UI
  if (!currentExercise && activeSession) {
    return (
      <div className="min-h-screen bg-gray-50">
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
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStats.duration)}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Stats */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedWorkout?.name || 'Quick Workout'}</h1>
              <p className="text-sm text-gray-600">
                Exercise {currentExerciseIndex + 1} of {selectedWorkout?.workout_exercises?.length || 0}
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
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStats.duration)}</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentExercise.exercise.name}
            </h2>
            <p className="text-gray-600 mb-4">{currentExercise.exercise.description}</p>

            {/* Target Sets/Reps */}
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

            {/* Current Set */}
            <div className="mb-6">
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
                    className="flex-1 text-center text-2xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 text-center text-2xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RPE (Rate of Perceived Exertion): {setData.rpe}/10
                </label>
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
            </div>
          </div>
        )}

        {/* Exercise Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
            disabled={currentExerciseIndex === 0}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Exercise
          </button>
          <button
            onClick={() => setCurrentExerciseIndex(prev => Math.min(selectedWorkout.workout_exercises.length - 1, prev + 1))}
            disabled={currentExerciseIndex === selectedWorkout.workout_exercises.length - 1}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
