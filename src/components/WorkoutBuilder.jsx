import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { Plus, X, Save, Search, GripVertical, Trash2, Edit2 } from 'lucide-react';

const WorkoutBuilder = () => {
  const [user, setUser] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const initializeUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('display_order');
      setCategories(categoriesData || []);

      // Fetch exercises
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select(`
          *,
          category:exercise_categories(name),
          primary_muscle:muscle_groups!exercises_primary_muscle_group_id_fkey(name),
          primary_equipment:equipment_types!exercises_primary_equipment_id_fkey(name)
        `)
        .order('name');
      setExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addExercise = (exercise) => {
    if (selectedExercises.find(e => e.exercise.id === exercise.id)) {
      alert('Exercise already added to workout');
      return;
    }

    setSelectedExercises([
      ...selectedExercises,
      {
        exercise,
        exercise_order: selectedExercises.length + 1,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        target_weight: null,
        rest_seconds: 60,
        notes: ''
      }
    ]);
    setShowExerciseSelector(false);
  };

  const removeExercise = (index) => {
    const updated = selectedExercises.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((ex, i) => {
      ex.exercise_order = i + 1;
    });
    setSelectedExercises(updated);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index][field] = value;
    setSelectedExercises(updated);
  };

  const moveExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExercises.length - 1)
    ) {
      return;
    }

    const updated = [...selectedExercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order numbers
    updated.forEach((ex, i) => {
      ex.exercise_order = i + 1;
    });
    
    setSelectedExercises(updated);
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    try {
      setSaving(true);

      // Calculate estimated duration (rough estimate: 3 min per set + rest time)
      const estimatedDuration = selectedExercises.reduce((total, ex) => {
        const setsTime = ex.target_sets * 3; // 3 min per set (including exercise time)
        const restTime = (ex.target_sets - 1) * (ex.rest_seconds / 60); // Rest between sets
        return total + setsTime + restTime;
      }, 0);

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: workoutName,
          description: workoutDescription,
          category_id: selectedCategory || null,
          estimated_duration_minutes: Math.round(estimatedDuration),
          is_template: false
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create workout exercises
      const workoutExercises = selectedExercises.map(ex => ({
        workout_id: workout.id,
        exercise_id: ex.exercise.id,
        exercise_order: ex.exercise_order,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_weight: ex.target_weight,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);

      if (exercisesError) throw exercisesError;

      alert('Workout saved successfully! 🎉');
      resetForm();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setWorkoutName('');
    setWorkoutDescription('');
    setSelectedCategory('');
    setSelectedExercises([]);
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="text-gray-600">Please sign in to create workouts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Workout</h1>

        {/* Workout Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workout Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout Name *
              </label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Push Day, Leg Day, Full Body"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category (optional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Exercises */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Exercises ({selectedExercises.length})
            </h2>
            <button
              onClick={() => setShowExerciseSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No exercises added yet</p>
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedExercises.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-1 pt-2">
                      <button
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <button
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === selectedExercises.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.exercise.name}</h3>
                          <p className="text-sm text-gray-600">{item.exercise.primary_muscle?.name}</p>
                        </div>
                        <button
                          onClick={() => removeExercise(index)}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>

                      {/* Exercise Parameters */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Sets</label>
                          <input
                            type="number"
                            value={item.target_sets}
                            onChange={(e) => updateExercise(index, 'target_sets', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min Reps</label>
                          <input
                            type="number"
                            value={item.target_reps_min}
                            onChange={(e) => updateExercise(index, 'target_reps_min', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Reps</label>
                          <input
                            type="number"
                            value={item.target_reps_max}
                            onChange={(e) => updateExercise(index, 'target_reps_max', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                          <input
                            type="number"
                            value={item.rest_seconds}
                            onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                            min="0"
                            step="15"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-3">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Notes (optional)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={saveWorkout}
            disabled={saving || !workoutName || selectedExercises.length === 0}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Select Exercise</h2>
                <button
                  onClick={() => setShowExerciseSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exercise.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {exercise.primary_muscle?.name}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {exercise.difficulty_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredExercises.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No exercises found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutBuilder;
