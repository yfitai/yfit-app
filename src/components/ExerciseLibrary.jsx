import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Search, Filter, X, ChevronRight, Dumbbell, Target, Zap, ExternalLink } from 'lucide-react';

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  
  // List of exercises with implemented form analysis
  const implementedFormAnalysis = [
    'squat',
    'push-up', 
    'plank',
    'sit-up',
    'deadlift',
    'bench press',
    'lateral raise',
    'preacher curl',
    'bicep curl',
    'bent over row'
  ];
  
  const hasFormAnalysis = (exerciseName) => {
    return implementedFormAnalysis.some(impl => 
      exerciseName.toLowerCase().includes(impl)
    );
  };
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  // Categories based on YFIT structure
  const categories = [
    { name: 'All Categories', value: 'all' },
    { name: 'Push', value: 'Push' },
    { name: 'Pull', value: 'Pull' },
    { name: 'Legs', value: 'Legs' },
    { name: 'Core', value: 'Core' },
    { name: 'Cardio', value: 'Cardio' },
    { name: 'Full Body', value: 'Full Body' }
  ];

  // Body parts from ExerciseDB
  const bodyParts = [
    { name: 'All Body Parts', value: 'all' },
    { name: 'Back', value: 'back' },
    { name: 'Cardio', value: 'cardio' },
    { name: 'Chest', value: 'chest' },
    { name: 'Lower Arms', value: 'lower arms' },
    { name: 'Lower Legs', value: 'lower legs' },
    { name: 'Neck', value: 'neck' },
    { name: 'Shoulders', value: 'shoulders' },
    { name: 'Upper Arms', value: 'upper arms' },
    { name: 'Upper Legs', value: 'upper legs' },
    { name: 'Waist', value: 'waist' }
  ];

  // Equipment types from ExerciseDB
  const equipmentOptions = [
    { name: 'All Equipment', value: 'all' },
    { name: 'Assisted', value: 'assisted' },
    { name: 'Band', value: 'band' },
    { name: 'Barbell', value: 'barbell' },
    { name: 'Body Weight', value: 'body weight' },
    { name: 'Bosu Ball', value: 'bosu ball' },
    { name: 'Cable', value: 'cable' },
    { name: 'Dumbbell', value: 'dumbbell' },
    { name: 'Elliptical Machine', value: 'elliptical machine' },
    { name: 'EZ Barbell', value: 'ez barbell' },
    { name: 'Hammer', value: 'hammer' },
    { name: 'Kettlebell', value: 'kettlebell' },
    { name: 'Leverage Machine', value: 'leverage machine' },
    { name: 'Medicine Ball', value: 'medicine ball' },
    { name: 'Olympic Barbell', value: 'olympic barbell' },
    { name: 'Resistance Band', value: 'resistance band' },
    { name: 'Roller', value: 'roller' },
    { name: 'Rope', value: 'rope' },
    { name: 'Skierg Machine', value: 'skierg machine' },
    { name: 'Sled Machine', value: 'sled machine' },
    { name: 'Smith Machine', value: 'smith machine' },
    { name: 'Stability Ball', value: 'stability ball' },
    { name: 'Stationary Bike', value: 'stationary bike' },
    { name: 'Stepmill Machine', value: 'stepmill machine' },
    { name: 'Tire', value: 'tire' },
    { name: 'Trap Bar', value: 'trap bar' },
    { name: 'Upper Body Ergometer', value: 'upper body ergometer' },
    { name: 'Weighted', value: 'weighted' },
    { name: 'Wheel Roller', value: 'wheel roller' }
  ];

  const difficultyLevels = [
    { name: 'All Levels', value: 'all' },
    { name: 'Beginner', value: 'beginner' },
    { name: 'Intermediate', value: 'intermediate' },
    { name: 'Advanced', value: 'advanced' }
  ];

  // Fetch exercises on component mount
  useEffect(() => {
    fetchExercises();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [exercises, selectedCategory, selectedBodyPart, selectedEquipment, selectedDifficulty, searchQuery]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      console.log('Fetching exercises from Supabase...');

      // Fetch all exercises from Supabase
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching exercises from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} exercises from Supabase`);
      setExercises(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Apply body part filter
    if (selectedBodyPart !== 'all') {
      filtered = filtered.filter(ex => 
        ex.body_parts && ex.body_parts.some(bp => bp.toLowerCase() === selectedBodyPart.toLowerCase())
      );
    }

    // Apply equipment filter
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => 
        ex.equipment && ex.equipment.some(eq => eq.toLowerCase() === selectedEquipment.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query) ||
        ex.target_muscles?.some(m => m.toLowerCase().includes(query)) ||
        ex.equipment?.some(e => e.toLowerCase().includes(query))
      );
    }

    setFilteredExercises(filtered);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBodyPart('all');
    setSelectedEquipment('all');
    setSelectedDifficulty('all');
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return selectedCategory !== 'all' ||
           selectedBodyPart !== 'all' ||
           selectedEquipment !== 'all' ||
           selectedDifficulty !== 'all' ||
           searchQuery.trim() !== '';
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleViewFormAnalysis = (exercise) => {
    navigate(exercise.form_analysis_url || `/fitness/form-analysis/${exercise.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercise Library</h2>
          <p className="text-gray-600 mt-1">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || hasActiveFilters()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters() && !showFilters && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Body Part Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Part
                </label>
                <select
                  value={selectedBodyPart}
                  onChange={(e) => setSelectedBodyPart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {bodyParts.map(bp => (
                    <option key={bp.value} value={bp.value}>{bp.name}</option>
                  ))}
                </select>
              </div>

              {/* Equipment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {equipmentOptions.map(eq => (
                    <option key={eq.value} value={eq.value}>{eq.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => handleExerciseClick(exercise)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={exercise.gif_url}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                    {exercise.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 capitalize">
                  {exercise.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="capitalize">
                    {exercise.target_muscles?.slice(0, 2).join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Dumbbell className="w-4 h-4" />
                  <span className="capitalize">
                    {exercise.equipment?.[0] || 'N/A'}
                  </span>
                </div>
                {hasFormAnalysis(exercise.name) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewFormAnalysis(exercise);
                    }}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    View Form Analysis
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-center text-sm">
                    Form Analysis Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {selectedExercise.name}
                </h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="aspect-video bg-gray-100 rounded-lg mb-4">
                <img
                  src={selectedExercise.gif_url}
                  alt={selectedExercise.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Target Muscles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.target_muscles?.map((muscle, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Secondary Muscles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.secondary_muscles.map((muscle, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-600" />
                    Equipment
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.equipment?.map((eq, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Difficulty
                  </h4>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm capitalize">
                    {selectedExercise.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => handleViewFormAnalysis(selectedExercise)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Detailed Form Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;

