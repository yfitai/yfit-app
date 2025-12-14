import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExercises, transformExerciseToYFITFormat, cacheExercises, getCachedExercises } from '../services/exerciseDBService';
import { Search, Filter, X, ChevronRight, Dumbbell, Target, Zap, ExternalLink } from 'lucide-react';

const ExerciseLibrary = () => {
  const navigate = useNavigate();
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

      // Try to get cached exercises first
      const cached = getCachedExercises();
      if (cached && cached.length > 0) {
        console.log('Using cached exercises:', cached.length);
        setExercises(cached);
        setFilteredExercises(cached);
        setLoading(false);
        return;
      }

      // Fetch from ExerciseDB API
      console.log('Fetching exercises from ExerciseDB API...');
      const data = await getAllExercises(1500); // Get up to 1500 exercises
      
      // Transform to YFIT format
      const transformedExercises = data.map(transformExerciseToYFITFormat);
      
      console.log('Loaded exercises from API:', transformedExercises.length);
      setExercises(transformedExercises);
      setFilteredExercises(transformedExercises);
      
      // Cache for future use
      cacheExercises(transformedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Body part filter
    if (selectedBodyPart !== 'all') {
      filtered = filtered.filter(ex => 
        ex.bodyParts?.some(bp => bp.toLowerCase() === selectedBodyPart.toLowerCase())
      );
    }

    // Equipment filter
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => 
        ex.equipment?.toLowerCase() === selectedEquipment.toLowerCase()
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query) ||
        ex.targetMuscles?.some(m => m.toLowerCase().includes(query))
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

  const activeFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedBodyPart !== 'all') count++;
    if (selectedEquipment !== 'all') count++;
    if (selectedDifficulty !== 'all') count++;
    return count;
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleViewFormAnalysis = (exercise) => {
    navigate(exercise.formAnalysisUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exercises from ExerciseDB...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exercise Library</h2>
          <p className="text-muted-foreground mt-1">
            {filteredExercises.length} exercises available
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount() > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {activeFiltersCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filter Exercises</h3>
            {activeFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Body Part Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Body Part</label>
              <select
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {bodyParts.map(bp => (
                  <option key={bp.value} value={bp.value}>{bp.name}</option>
                ))}
              </select>
            </div>

            {/* Equipment Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Equipment</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {equipmentOptions.map(eq => (
                  <option key={eq.value} value={eq.value}>{eq.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {difficultyLevels.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={clearFilters}
            className="text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleExerciseClick(exercise)}
            >
              {/* Exercise GIF */}
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {exercise.gifUrl ? (
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Dumbbell className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Exercise Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 capitalize line-clamp-2">
                  {exercise.name}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {exercise.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {exercise.category}
                    </span>
                  )}
                  {exercise.equipment && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                      {exercise.equipment}
                    </span>
                  )}
                </div>

                {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="capitalize">
                      {exercise.targetMuscles.join(', ')}
                    </span>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewFormAnalysis(exercise);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Form Analysis
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold capitalize">{selectedExercise.name}</h2>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Exercise GIF */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {selectedExercise.gifUrl ? (
                  <img
                    src={selectedExercise.gifUrl}
                    alt={selectedExercise.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Dumbbell className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Exercise Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Target Muscles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.targetMuscles?.map((muscle, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Secondary Muscles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.secondaryMuscles.map((muscle, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm capitalize"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleViewFormAnalysis(selectedExercise)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Form Analysis
                  </button>
                  <button
                    onClick={() => setSelectedExercise(null)}
                    className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;

