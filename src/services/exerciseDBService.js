/**
 * ExerciseDB API Service
 * Free exercise database with 1,500+ exercises
 * API Documentation: https://www.exercisedb.dev/docs
 */

const EXERCISEDB_BASE_URL = 'https://www.exercisedb.dev/api/v1';

/**
 * Fetch all exercises from ExerciseDB
 * @param {number} limit - Maximum number of exercises to return (default: 1500)
 * @param {number} offset - Number of exercises to skip (default: 0)
 * @returns {Promise<Array>} Array of exercise objects
 */
export async function getAllExercises(limit = 1500, offset = 0) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises?limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching exercises from ExerciseDB:', error);
    throw error;
  }
}

/**
 * Search exercises with fuzzy matching
 * @param {string} query - Search query
 * @param {number} limit - Maximum results (default: 50)
 * @returns {Promise<Array>} Array of matching exercises
 */
export async function searchExercises(query, limit = 50) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching exercises:', error);
    throw error;
  }
}

/**
 * Filter exercises by multiple criteria
 * @param {Object} filters - Filter criteria
 * @param {string} filters.equipment - Equipment type
 * @param {string} filters.bodyPart - Body part
 * @param {string} filters.targetMuscle - Target muscle
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of filtered exercises
 */
export async function filterExercises(filters = {}, limit = 100) {
  try {
    const params = new URLSearchParams();
    
    if (filters.equipment) params.append('equipment', filters.equipment);
    if (filters.bodyPart) params.append('bodyPart', filters.bodyPart);
    if (filters.targetMuscle) params.append('targetMuscle', filters.targetMuscle);
    params.append('limit', limit);
    
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises/filter?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error filtering exercises:', error);
    throw error;
  }
}

/**
 * Get exercise by ID
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<Object>} Exercise object
 */
export async function getExerciseById(exerciseId) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises/${exerciseId}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching exercise by ID:', error);
    throw error;
  }
}

/**
 * Get exercises by body part
 * @param {string} bodyPart - Body part name (e.g., 'chest', 'back', 'legs')
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of exercises
 */
export async function getExercisesByBodyPart(bodyPart, limit = 100) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/bodyparts/${bodyPart}/exercises?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching exercises by body part:', error);
    throw error;
  }
}

/**
 * Get exercises by equipment
 * @param {string} equipment - Equipment name (e.g., 'barbell', 'dumbbell')
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of exercises
 */
export async function getExercisesByEquipment(equipment, limit = 100) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/equipments/${equipment}/exercises?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching exercises by equipment:', error);
    throw error;
  }
}

/**
 * Get exercises by target muscle
 * @param {string} muscle - Muscle name (e.g., 'pectorals', 'biceps')
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of exercises
 */
export async function getExercisesByMuscle(muscle, limit = 100) {
  try {
    const response = await fetch(
      `${EXERCISEDB_BASE_URL}/muscles/${muscle}/exercises?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching exercises by muscle:', error);
    throw error;
  }
}

/**
 * Get all available body parts
 * @returns {Promise<Array>} Array of body part names
 */
export async function getAllBodyParts() {
  try {
    const response = await fetch(`${EXERCISEDB_BASE_URL}/bodyparts`);
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching body parts:', error);
    throw error;
  }
}

/**
 * Get all available equipment types
 * @returns {Promise<Array>} Array of equipment names
 */
export async function getAllEquipments() {
  try {
    const response = await fetch(`${EXERCISEDB_BASE_URL}/equipments`);
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching equipments:', error);
    throw error;
  }
}

/**
 * Get all available target muscles
 * @returns {Promise<Array>} Array of muscle names
 */
export async function getAllMuscles() {
  try {
    const response = await fetch(`${EXERCISEDB_BASE_URL}/muscles`);
    
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching muscles:', error);
    throw error;
  }
}

/**
 * Transform ExerciseDB exercise to YFIT format
 * @param {Object} exercise - ExerciseDB exercise object
 * @returns {Object} YFIT-formatted exercise
 */
export function transformExerciseToYFITFormat(exercise) {
  return {
    id: exercise.exerciseId,
    name: exercise.name,
    description: `Target: ${exercise.targetMuscles?.join(', ') || 'N/A'}`,
    gifUrl: exercise.gifUrl,
    imageUrl: exercise.gifUrl, // Use GIF as image
    targetMuscles: exercise.targetMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    bodyParts: exercise.bodyParts || [],
    equipment: exercise.equipments?.[0] || 'bodyweight',
    category: mapBodyPartToCategory(exercise.bodyParts?.[0]),
    difficulty: 'intermediate', // ExerciseDB doesn't provide difficulty
    formAnalysisUrl: generateFormAnalysisUrl(exercise.name, exercise.exerciseId)
  };
}

/**
 * Map ExerciseDB body part to YFIT category
 * @param {string} bodyPart - ExerciseDB body part
 * @returns {string} YFIT category
 */
function mapBodyPartToCategory(bodyPart) {
  const mapping = {
    'chest': 'Push',
    'shoulders': 'Push',
    'back': 'Pull',
    'upper arms': 'Pull',
    'lower arms': 'Pull',
    'upper legs': 'Legs',
    'lower legs': 'Legs',
    'waist': 'Core',
    'cardio': 'Cardio'
  };
  
  return mapping[bodyPart?.toLowerCase()] || 'Full Body';
}

/**
 * Generate form analysis URL for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {string} exerciseId - Exercise ID
 * @returns {string} Form analysis page URL
 */
function generateFormAnalysisUrl(exerciseName, exerciseId) {
  // Create a URL-friendly slug from exercise name
  const slug = exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `/fitness/form-analysis/${slug}?id=${exerciseId}`;
}

/**
 * Cache exercises in localStorage for offline access
 * @param {Array} exercises - Array of exercises to cache
 */
export function cacheExercises(exercises) {
  try {
    localStorage.setItem('exercisedb_cache', JSON.stringify({
      exercises,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to cache exercises:', error);
  }
}

/**
 * Get cached exercises from localStorage
 * @param {number} maxAge - Maximum cache age in milliseconds (default: 24 hours)
 * @returns {Array|null} Cached exercises or null if expired/not found
 */
export function getCachedExercises(maxAge = 24 * 60 * 60 * 1000) {
  try {
    const cached = localStorage.getItem('exercisedb_cache');
    if (!cached) return null;
    
    const { exercises, timestamp } = JSON.parse(cached);
    
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem('exercisedb_cache');
      return null;
    }
    
    return exercises;
  } catch (error) {
    console.warn('Failed to get cached exercises:', error);
    return null;
  }
}

export default {
  getAllExercises,
  searchExercises,
  filterExercises,
  getExerciseById,
  getExercisesByBodyPart,
  getExercisesByEquipment,
  getExercisesByMuscle,
  getAllBodyParts,
  getAllEquipments,
  getAllMuscles,
  transformExerciseToYFITFormat,
  cacheExercises,
  getCachedExercises
};

