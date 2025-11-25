import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, X, ChevronLeft, ChevronRight, Timer, Award, TrendingUp } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';
import ProgressiveOverloadTracker from './ProgressiveOverloadTracker';

const WorkoutSessionTracker = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setData, setSetData] = useState({ reps: '', weight: '', rpe: '7' });
  const [completedSets, setCompletedSets] = useState([]);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkoutPlans();
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const loadWorkoutPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_plan_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error('Error loading workout plans:', error);
    }
  };

  const startWorkout = async (plan) => {
    try {
      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: plan.id,
          name: plan.name,
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create session exercises
      const sessionExercises = plan.workout_plan_exercises.map((pe, index) => ({
        session_id: session.id,
        exercise_id: pe.exercise.id,
        order_index: index,
        notes: pe.notes
      }));

      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_session_exercises')
        .insert(sessionExercises)
        .select('*, exercises(*)');

      if (exercisesError) throw exercisesError;

      setActiveSession({
        ...session,
        exercises: exercises,
        plan: plan
      });
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setCompletedSets([]);
      setSessionStartTime(Date.now());
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error starting workout:', error);
      alert('Failed to start workout');
    }
  };

  const logSet = async () => {
    if (!setData.reps || !setData.weight) {
      alert('Please enter reps and weight');
      return;
    }

    try {
      const currentExercise = activeSession.exercises[currentExerciseIndex];
      
      const { error } = await supabase
        .from('workout_sets')
        .insert({
          session_exercise_id: currentExercise.id,
          set_number: currentSet,
          reps: parseInt(setData.reps),
          weight: parseFloat(setData.weight),
          rpe: parseFloat(setData.rpe),
          completed: true
        });

      if (error) throw error;

      // Add to completed sets
      const newSet = {
        set_number: currentSet,
        reps: parseInt(setData.reps),
        weight: parseFloat(setData.weight),
        rpe: parseFloat(setData.rpe),
        exercise_id: currentExercise.exercise_id
      };
      setCompletedSets([...completedSets, newSet]);

      // Start rest timer
      const targetSets = activeSession.plan.workout_plan_exercises[currentExerciseIndex].target_sets;
      if (currentSet < targetSets) {
        const restSeconds = activeSession.plan.workout_plan_exercises[currentExerciseIndex].rest_seconds || 90;
        setRestTimer(restSeconds);
        setIsResting(true);
        setCurrentSet(currentSet + 1);
      } else {
        // Move to next exercise
        if (currentExerciseIndex < activeSession.exercises.length - 1) {
          setCurrentExerciseIndex(currentExerciseIndex + 1);
          setCurrentSet(1);
        }
      }

      // Reset form
      setSetData({ reps: '', weight: '', rpe: '7' });
    } catch (error) {
      console.error('Error logging set:', error);
      alert('Failed to log set');
    }
  };

  const skipRestTimer = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const completeWorkout = async () => {
    if (!activeSession) return;

    try {
      const duration = Math.round((Date.now() - sessionStartTime) / 60000);
      const totalVolume = completedSets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
      const totalSets = completedSets.length;
      const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: new Date().toISOString(),
          status: 'completed',
          duration_minutes: duration,
          total_volume: totalVolume,
          total_sets: totalSets,
          total_reps: totalReps
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      alert(`🎉 Workout Complete!\n\nDuration: ${duration} min\nTotal Volume: ${totalVolume.toLocaleString()} lbs\nSets: ${totalSets} | Reps: ${totalReps}`);
      
      setActiveSession(null);
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setCompletedSets([]);
      setSessionStartTime(null);
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to complete workout');
    }
  };

  const cancelWorkout = async () => {
    if (!confirm('Are you sure you want to cancel this workout?')) return;

    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ status: 'abandoned' })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(null);
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setCompletedSets([]);
      setSessionStartTime(null);
    } catch (error) {
      console.error('Error canceling workout:', error);
    }
  };

  const applySuggestion = (suggestion) => {
    setSetData({
      reps: suggestion.reps.toString(),
      weight: suggestion.weight.toString(),
      rpe: '7'
    });
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
          <p className="text-gray-600">Please sign in to track workouts</p>
        </div>
      </div>
    );
  }

  // Active workout view
  if (activeSession) {
    const currentExercise = activeSession.exercises[currentExerciseIndex];
    const planExercise = activeSession.plan.workout_plan_exercises[currentExerciseIndex];
    const exerciseSets = completedSets.filter(s => s.exercise_id === currentExercise.exercise_id);
    const sessionDuration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activeSession.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Timer size={16} />
                    {sessionDuration} min
                  </span>
                  <span>Exercise {currentExerciseIndex + 1}/{activeSession.exercises.length}</span>
                  <span>{completedSets.length} sets completed</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelWorkout}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={completeWorkout}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check size={16} />
                  Complete
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentExerciseIndex + 1) / activeSession.exercises.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Rest Timer */}
          {isResting && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6 text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600 mb-4">Rest Time Remaining</div>
              <button
                onClick={skipRestTimer}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Skip Rest
              </button>
            </div>
          )}

          {/* Current Exercise */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{currentExercise.exercise.name}</h2>
              <div className="text-sm text-gray-600">
                Set {currentSet} of {planExercise.target_sets}
              </div>
            </div>

            {/* Exercise Images */}
            {currentExercise.exercise.gif_url && currentExercise.exercise.image_url_2 ? (
              <div className="max-w-2xl mx-auto mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1 text-center">Start</p>
                    <img
                      src={currentExercise.exercise.gif_url}
                      alt={`${currentExercise.exercise.name} - start`}
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1 text-center">Extended</p>
                    <img
                      src={currentExercise.exercise.image_url_2}
                      alt={`${currentExercise.exercise.name} - end`}
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ) : currentExercise.exercise.gif_url ? (
              <img
                src={currentExercise.exercise.gif_url}
                alt={currentExercise.exercise.name}
                className="w-full max-w-md mx-auto rounded-lg mb-6"
              />
            ) : null}

            {/* Target */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Target</div>
              <div className="flex gap-4">
                <div>
                  <span className="font-semibold">{planExercise.target_sets}</span> sets
                </div>
                <div>
                  <span className="font-semibold">{planExercise.target_reps_min}-{planExercise.target_reps_max}</span> reps
                </div>
                <div>
                  <span className="font-semibold">{planExercise.rest_seconds}s</span> rest
                </div>
              </div>
            </div>

            {/* Progressive Overload Tracker */}
            <ProgressiveOverloadTracker
              userId={user.id}
              exerciseId={currentExercise.exercise_id}
              exerciseName={currentExercise.exercise.name}
              onSuggestionApplied={applySuggestion}
            />

            {/* Set Logging Form */}
            <div className="bg-gray-50 rounded-lg p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Log Set {currentSet}</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reps *
                  </label>
                  <input
                    type="number"
                    value={setData.reps}
                    onChange={(e) => setSetData({ ...setData, reps: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (lbs) *
                  </label>
                  <input
                    type="number"
                    value={setData.weight}
                    onChange={(e) => setSetData({ ...setData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="135"
                    step="5"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RPE (1-10)
                  </label>
                  <input
                    type="number"
                    value={setData.rpe}
                    onChange={(e) => setSetData({ ...setData, rpe: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    step="0.5"
                  />
                </div>
              </div>
              <button
                onClick={logSet}
                disabled={!setData.reps || !setData.weight}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Log Set
              </button>
            </div>

            {/* Completed Sets */}
            {exerciseSets.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Completed Sets</h3>
                <div className="space-y-2">
                  {exerciseSets.map((set, index) => (
                    <div key={index} className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="font-medium text-gray-900">Set {set.set_number}</span>
                      <span className="text-gray-700">{set.reps} reps × {set.weight} lbs</span>
                      <span className="text-sm text-gray-600">RPE: {set.rpe}</span>
                      <Award className="text-green-600" size={16} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
                setCurrentSet(1);
              }}
              disabled={currentExerciseIndex === 0}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} />
              Previous Exercise
            </button>
            <button
              onClick={() => {
                setCurrentExerciseIndex(Math.min(activeSession.exercises.length - 1, currentExerciseIndex + 1));
                setCurrentSet(1);
              }}
              disabled={currentExerciseIndex === activeSession.exercises.length - 1}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next Exercise
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workout selection view
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Start Workout</h1>

        {workoutPlans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No workout plans found</p>
            <p className="text-sm text-gray-500">Create a workout plan first using the Workout Builder</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workoutPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{plan.workout_plan_exercises.length} exercises</span>
                  <span>~{plan.estimated_duration_minutes} min</span>
                </div>
                <button
                  onClick={() => startWorkout(plan)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Start Workout
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutSessionTracker;

