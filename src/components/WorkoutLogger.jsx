import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { 
  Play, Pause, Square, Plus, Minus, Check, X, Clock, 
  Dumbbell, TrendingUp, Award, ChevronRight, Timer, Save, Search, Heart
} from 'lucide-react';

const WorkoutLogger = ({ onNavigateToBuilder }) => {
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setData, setSetData] = useState({ weight: '', reps: '', rpe: 5 });
  const [cardioData, setCardioData] = useState({ duration: '', distance: '', pace: '' });
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
  
  // New states for exercise selection
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sessionExercises, setSessionExercises] = useState([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
      fetchAvailableExercises();
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
    setSetData({ weight: '', reps: '', rpe: 5 });
    setCardioData({ duration: '', distance: '', pace: '' });
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

  // Calculate pace when duration or distance changes
  useEffect(() => {
    if (cardioData.duration && cardioData.distance) {
      const durationMinutes = parseFloat(cardioData.duration);
      const distance = parseFloat(cardioData.distance);
      if (durationMinutes > 0 && distance > 0) {
        const pace = (durationMinutes / distance).toFixed(2);
        const paceStr = pace + ' min/km';
        // Only update if pace changed to avoid infinite loop
        if (cardioData.pace !== paceStr) {
          setCardioData(prev => ({ ...prev, pace: paceStr }));
        }
      }
    }
  }, [cardioData.duration, cardioData.distance, cardioData.pace]);

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
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const fetchAvailableExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
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
          completed_sets: 0,
          exercise: we.exercises
        }));

        const { data: insertedExercises } = await supabase
          .from('session_exercises')
          .insert(sessionExercises)
          .select('*, exercises(*)');
        
        setSessionExercises(insertedExercises || sessionExercises);
      } else {
        setSessionExercises([]);
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

  const addExerciseToSession = async (exercise) => {
    try {
      const newExercise = {
        session_id: activeSession.id,
        exercise_id: exercise.id,
        exercise_order: sessionExercises.length,
        target_sets: isCardioExercise(exercise) ? 1 : 3,
        completed_sets: 0
      };

      console.log('Adding exercise to session:', exercise.id, exercise.name);
      
      const { data, error } = await supabase
        .from('session_exercises')
        .insert(newExercise)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Inserted session exercise:', data);

      // Add the exercise object manually since we already have it
      const exerciseWithData = { 
        ...data, 
        exercise: exercise,
        exercise_id: exercise.id // Ensure exercise_id is set correctly
      };
      
      console.log('Adding to sessionExercises:', exerciseWithData);
      setSessionExercises(prev => {
        const updated = [...prev, exerciseWithData];
        // Jump to the newly added exercise
        setCurrentExerciseIndex(updated.length - 1);
        return updated;
      });
      setShowExerciseSelector(false);
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise');
    }
  };

  const isCardioExercise = (exercise) => {
    return exercise.category?.toLowerCase() === 'cardio' || 
           exercise.name?.toLowerCase().includes('running') ||
           exercise.name?.toLowerCase().includes('walking') ||
           exercise.name?.toLowerCase().includes('biking') ||
           exercise.name?.toLowerCase().includes('cycling') ||
           exercise.name?.toLowerCase().includes('rowing') ||
           exercise.name?.toLowerCase().includes('swimming');
  };

  const logSet = async () => {
    const currentExercise = sessionExercises[currentExerciseIndex];
    
    if (!currentExercise) {
      alert('No exercise selected');
      return;
    }

    // Validate inputs based on exercise type
    if (isCardioExercise(currentExercise.exercise)) {
      if (!cardioData.duration || !cardioData.distance) {
        alert('Please enter duration and distance');
        return;
      }
      await logCardioSet(currentExercise);
    } else {
      if (!setData.weight || !setData.reps) {
        alert('Please enter weight and reps');
        return;
      }
      await logStrengthSet(currentExercise);
    }
  };

  const logStrengthSet = async (currentExercise) => {
    try {
      // Get session exercise - use the ID from currentExercise if available
      const exerciseId = currentExercise.exercise?.id || currentExercise.exercise_id;
      
      const { data: sessionExercise, error: fetchError } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('exercise_id', exerciseId)
        .single();
      
      if (fetchError || !sessionExercise) {
        console.error('Failed to find session exercise:', fetchError);
        throw new Error('Could not find exercise in session');
      }

      // Insert set
      await supabase.from('exercise_sets').insert({
        session_exercise_id: sessionExercise.id,
        set_number: currentSet,
        weight: parseFloat(setData.weight),
        reps: parseInt(setData.reps),
        rpe: setData.rpe,
        rest_seconds: 60
      });

      // Update session exercise completed sets
      await supabase
        .from('session_exercises')
        .update({ completed_sets: currentSet })
        .eq('id', sessionExercise.id);

      // Update stats
      const volume = parseFloat(setData.weight) * parseInt(setData.reps);
      setSessionStats(prev => ({
        ...prev,
        totalSets: prev.totalSets + 1,
        totalReps: prev.totalReps + parseInt(setData.reps),
        totalVolume: prev.totalVolume + volume
      }));

      // Start rest timer
      setRestTimer(60);
      setIsResting(true);

      // Move to next set or exercise
      if (currentSet >= (currentExercise.target_sets || 3)) {
        // Move to next exercise
        if (currentExerciseIndex < sessionExercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSet(1);
        }
      } else {
        setCurrentSet(prev => prev + 1);
      }

      // Reset set data
      setSetData({ weight: '', reps: '', rpe: 5 });
    } catch (error) {
      console.error('Error logging set:', error);
      alert('Failed to log set');
    }
  };

  const logCardioSet = async (currentExercise) => {
    try {
      // Get session exercise
      const { data: sessionExercise } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('exercise_id', currentExercise.exercise_id)
        .single();

      // Insert cardio set
      await supabase.from('exercise_sets').insert({
        session_exercise_id: sessionExercise.id,
        set_number: 1,
        duration_minutes: parseFloat(cardioData.duration),
        distance_km: parseFloat(cardioData.distance),
        pace: cardioData.pace,
        rpe: setData.rpe
      });

      // Update session exercise completed sets
      await supabase
        .from('session_exercises')
        .update({ completed_sets: 1 })
        .eq('id', sessionExercise.id);

      // Move to next exercise
      if (currentExerciseIndex < sessionExercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
      }

      // Reset cardio data
      setCardioData({ duration: '', distance: '', pace: '' });
      setSetData({ weight: '', reps: '', rpe: 5 });
    } catch (error) {
      console.error('Error logging cardio:', error);
      alert('Failed to log cardio exercise');
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
          total_exercises: sessionExercises.length,
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
    setSessionExercises([]);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setSetData({ weight: '', reps: '', rpe: 5 });
    setCardioData({ duration: '', distance: '', pace: '' });
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

  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { name: 'All', value: 'all' },
    { name: 'Push', value: 'Push' },
    { name: 'Pull', value: 'Pull' },
    { name: 'Legs', value: 'Legs' },
    { name: 'Core', value: 'Core' },
    { name: 'Cardio', value: 'Cardio' },
    { name: 'Stretching', value: 'Stretching' }
  ];

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

  // Exercise Selector Modal
  const ExerciseSelectorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Exercise</h2>
            <button
              onClick={() => setShowExerciseSelector(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="overflow-y-auto max-h-96 p-4">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exercises found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => addExerciseToSession(exercise)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {exercise.category}
                        </span>
                        {isCardioExercise(exercise) && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Cardio
                          </span>
                        )}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Workout Selector View
  if (showWorkoutSelector) {
    return (
      <div className="min-h-screen p-6" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
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
  const currentExercise = sessionExercises[currentExerciseIndex];

  // If empty workout (no exercises), show add exercise UI
  if (!currentExercise && activeSession) {
    return (
      <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
        {showExerciseSelector && <ExerciseSelectorModal />}
        
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
            <p className="text-gray-600 mb-6">Add exercises to start tracking your workout</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
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

  // Active exercise tracking
  const isCardio = currentExercise && isCardioExercise(currentExercise.exercise);

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #f0fdf4, #dbeafe, #cffafe)'}}>
      {showExerciseSelector && <ExerciseSelectorModal />}
      
      {/* Header with Stats */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedWorkout?.name || 'Quick Workout'}</h1>
              <p className="text-sm text-gray-600">
                {currentExercise ? (
                  <>{currentExercise.exercise.name} ({currentExerciseIndex + 1} of {sessionExercises.length})</>
                ) : (
                  <>Exercise {currentExerciseIndex + 1} of {sessionExercises.length}</>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentExercise.exercise.name}
              </h2>
              {isCardio && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  Cardio
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{currentExercise.exercise.description}</p>

            {/* Cardio Tracking */}
            {isCardio ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cardio Session</h3>

                {/* Duration Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardioData.duration}
                    onChange={(e) => setCardioData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full text-center text-2xl font-bold p-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                    placeholder="30"
                  />
                </div>

                {/* Distance Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardioData.distance}
                    onChange={(e) => setCardioData(prev => ({ ...prev, distance: e.target.value }))}
                    className="w-full text-center text-2xl font-bold p-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                    placeholder="5.0"
                  />
                </div>

                {/* Pace Display */}
                {cardioData.pace && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Average Pace</div>
                    <div className="text-2xl font-bold text-blue-600">{cardioData.pace}</div>
                  </div>
                )}

                {/* RPE Slider */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RPE (Rate of Perceived Exertion): {setData.rpe}/10
                  </label>
                  <p className="text-xs text-gray-500 mb-2">How hard did this feel?</p>
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

                {/* Log Cardio Button */}
                <button
                  onClick={logSet}
                  disabled={!cardioData.duration || !cardioData.distance}
                  className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  Complete Cardio Session
                </button>
              </div>
            ) : (
              /* Strength Training */
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Set {currentSet} of {currentExercise.target_sets || 3}
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
              </div>
            )}
          </div>
        )}

        {/* Add More Exercises Button */}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full mb-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Exercise
        </button>

        {/* Exercise Navigation */}
        {sessionExercises.length > 1 && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentExerciseIndex === 0}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Exercise
            </button>
            <button
              onClick={() => setCurrentExerciseIndex(prev => Math.min(sessionExercises.length - 1, prev + 1))}
              disabled={currentExerciseIndex >= sessionExercises.length - 1}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Exercise
            </button>
          </div>
        )}

        {/* Finish Workout Button */}
        <button
          onClick={completeWorkout}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-6 h-6" />
          Finish Workout
        </button>
      </div>
    </div>
  );
};

export default WorkoutLogger;
