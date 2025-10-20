import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, X, ChevronRight, Dumbbell, Target, Zap } from 'lucide-react';

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [exercises, selectedCategory, selectedMuscle, selectedEquipment, selectedDifficulty, searchQuery]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('display_order');
      setCategories(categoriesData || []);

      // Fetch muscle groups
      const { data: musclesData } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('name');
      setMuscleGroups(musclesData || []);

      // Fetch equipment types
      const { data: equipmentData } = await supabase
        .from('equipment_types')
        .select('*')
        .order('is_common DESC, name');
      setEquipmentTypes(equipmentData || []);

      // Fetch exercises with related data
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
      setFilteredExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => ex.category?.name === selectedCategory);
    }

    // Muscle group filter
    if (selectedMuscle !== 'all') {
      filtered = filtered.filter(ex => ex.primary_muscle?.name === selectedMuscle);
    }

    // Equipment filter
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => ex.primary_equipment?.name === selectedEquipment);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty_level === selectedDifficulty);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query)
      );
    }

    setFilteredExercises(filtered);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedMuscle('all');
    setSelectedEquipment('all');
    setSelectedDifficulty('all');
    setSearchQuery('');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExerciseTypeIcon = (type) => {
    switch (type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />;
      case 'cardio': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Exercise Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h1>
          <p className="text-gray-600">
            Browse {exercises.length} exercises to build your perfect workout
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              {(selectedCategory !== 'all' || selectedMuscle !== 'all' || selectedEquipment !== 'all' || selectedDifficulty !== 'all') && (
                <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {[selectedCategory, selectedMuscle, selectedEquipment, selectedDifficulty].filter(f => f !== 'all').length}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(selectedCategory !== 'all' || selectedMuscle !== 'all' || selectedEquipment !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Muscle Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Muscle Group</label>
                <select
                  value={selectedMuscle}
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Muscles</option>
                  {muscleGroups.map(muscle => (
                    <option key={muscle.id} value={muscle.name}>{muscle.name}</option>
                  ))}
                </select>
              </div>

              {/* Equipment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Equipment</option>
                  {equipmentTypes.map(eq => (
                    <option key={eq.id} value={eq.name}>{eq.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredExercises.length}</span> exercise{filteredExercises.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map(exercise => (
            <div
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Exercise Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {exercise.image_url ? (
                  <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <Dumbbell className="w-16 h-16 text-white opacity-50" />
                )}
              </div>

              {/* Exercise Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{exercise.name}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {exercise.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty_level)}`}>
                    {exercise.difficulty_level}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                    {getExerciseTypeIcon(exercise.exercise_type)}
                    {exercise.exercise_type}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-sm">
                  {exercise.primary_muscle && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{exercise.primary_muscle.name}</span>
                    </div>
                  )}
                  {exercise.primary_equipment && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Dumbbell className="w-4 h-4" />
                      <span>{exercise.primary_equipment.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

// Exercise Detail Modal Component
const ExerciseDetailModal = ({ exercise, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{exercise.name}</h2>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                exercise.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                exercise.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {exercise.difficulty_level}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {exercise.exercise_type}
              </span>
              {exercise.is_compound && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Compound
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video/Image */}
          {exercise.video_url || exercise.image_url ? (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {exercise.video_url ? (
                <video src={exercise.video_url} controls className="w-full h-full" />
              ) : (
                <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-24 h-24 text-white opacity-50" />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{exercise.description}</p>
          </div>

          {/* Target Muscles & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Target Muscles
              </h4>
              <p className="text-gray-700">{exercise.primary_muscle?.name || 'Not specified'}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                Equipment Needed
              </h4>
              <p className="text-gray-700">{exercise.primary_equipment?.name || 'Not specified'}</p>
            </div>
          </div>

          {/* Instructions */}
          {exercise.instructions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{exercise.instructions}</p>
              </div>
            </div>
          )}

          {/* Form Cues */}
          {exercise.form_cues && exercise.form_cues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Cues</h3>
              <ul className="space-y-2">
                {exercise.form_cues.map((cue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Common Mistakes</h3>
              <ul className="space-y-2">
                {exercise.common_mistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span className="text-gray-700">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Tips */}
          {exercise.safety_tips && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety Tips</h3>
              <p className="text-gray-700">{exercise.safety_tips}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add to Workout
            </button>
            <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              Start Form Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;
