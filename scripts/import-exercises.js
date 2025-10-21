/**
 * Import ExerciseDB exercises to Supabase
 * 
 * This script fetches all exercises from ExerciseDB API and imports them
 * into the Supabase database for offline access and better performance.
 * 
 * Usage: node scripts/import-exercises.js
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const EXERCISEDB_BASE_URL = 'https://exercisedb.dev/api/v1';
const BATCH_SIZE = 50; // Insert exercises in batches
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay to avoid rate limits

// Supabase configuration (from environment variables)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service key for admin access

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('\nPlease set these in your .env file or environment');
  process.exit(1);
}

// Create Supabase client with service key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetch all exercises from ExerciseDB API
 */
async function fetchAllExercises() {
  console.log('📥 Fetching exercises from ExerciseDB API...');
  
  try {
    // Fetch in pages to avoid timeout
    let allExercises = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${EXERCISEDB_BASE_URL}/exercises?limit=${limit}&offset=${offset}`;
      console.log(`   Fetching page ${Math.floor(offset / limit) + 1}... (offset: ${offset})`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const exercises = data.data || [];
      
      if (exercises.length === 0) {
        hasMore = false;
      } else {
        allExercises = allExercises.concat(exercises);
        offset += limit;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Fetched ${allExercises.length} exercises from ExerciseDB`);
    return allExercises;
  } catch (error) {
    console.error('❌ Error fetching exercises:', error.message);
    throw error;
  }
}

/**
 * Map ExerciseDB body part to YFIT category
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
    'cardio': 'Cardio',
    'neck': 'Full Body'
  };
  
  return mapping[bodyPart?.toLowerCase()] || 'Full Body';
}

/**
 * Generate form analysis URL for an exercise
 */
function generateFormAnalysisUrl(exerciseName, exerciseId) {
  const slug = exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `/fitness/form-analysis/${slug}?id=${exerciseId}`;
}

/**
 * Transform ExerciseDB exercise to YFIT format
 */
function transformExercise(exercise) {
  return {
    id: exercise.exerciseId,
    name: exercise.name,
    description: `Target: ${exercise.targetMuscles?.join(', ') || 'N/A'}`,
    gif_url: exercise.gifUrl,
    target_muscles: exercise.targetMuscles || [],
    secondary_muscles: exercise.secondaryMuscles || [],
    body_parts: exercise.bodyParts || [],
    equipment: exercise.equipments || [],
    category: mapBodyPartToCategory(exercise.bodyParts?.[0]),
    difficulty: 'intermediate', // Default difficulty
    form_analysis_url: generateFormAnalysisUrl(exercise.name, exercise.exerciseId),
    is_favorite: false
  };
}

/**
 * Clear existing exercises from database
 */
async function clearExistingExercises() {
  console.log('🗑️  Clearing existing exercises...');
  
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .neq('id', ''); // Delete all rows
    
    if (error) throw error;
    
    console.log('✅ Existing exercises cleared');
  } catch (error) {
    console.error('❌ Error clearing exercises:', error.message);
    throw error;
  }
}

/**
 * Insert exercises in batches
 */
async function insertExercises(exercises) {
  console.log(`📤 Inserting ${exercises.length} exercises in batches of ${BATCH_SIZE}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(exercises.length / BATCH_SIZE);
    
    console.log(`   Batch ${batchNumber}/${totalBatches} (${batch.length} exercises)...`);
    
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`   ❌ Error in batch ${batchNumber}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`   ✅ Batch ${batchNumber} inserted successfully`);
      }
      
      // Delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < exercises.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.error(`   ❌ Exception in batch ${batchNumber}:`, error.message);
      errorCount += batch.length;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Success: ${successCount} exercises`);
  console.log(`   ❌ Failed: ${errorCount} exercises`);
  
  return { successCount, errorCount };
}

/**
 * Verify import
 */
async function verifyImport() {
  console.log('\n🔍 Verifying import...');
  
  try {
    const { data, error, count } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log(`✅ Total exercises in database: ${count}`);
    
    // Get sample exercises
    const { data: samples } = await supabase
      .from('exercises')
      .select('id, name, category, equipment')
      .limit(5);
    
    if (samples && samples.length > 0) {
      console.log('\n📋 Sample exercises:');
      samples.forEach((ex, idx) => {
        console.log(`   ${idx + 1}. ${ex.name} (${ex.category}) - ${ex.equipment?.[0] || 'N/A'}`);
      });
    }
    
    return count;
  } catch (error) {
    console.error('❌ Error verifying import:', error.message);
    throw error;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting ExerciseDB import to Supabase\n');
  console.log('Configuration:');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`);
  
  try {
    // Step 1: Fetch exercises from ExerciseDB
    const rawExercises = await fetchAllExercises();
    
    // Step 2: Transform exercises to YFIT format
    console.log('\n🔄 Transforming exercises to YFIT format...');
    const transformedExercises = rawExercises.map(transformExercise);
    console.log(`✅ Transformed ${transformedExercises.length} exercises`);
    
    // Step 3: Clear existing exercises
    await clearExistingExercises();
    
    // Step 4: Insert exercises in batches
    const { successCount, errorCount } = await insertExercises(transformedExercises);
    
    // Step 5: Verify import
    const totalCount = await verifyImport();
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total exercises imported: ${totalCount}`);
    console.log(`Success rate: ${((successCount / transformedExercises.length) * 100).toFixed(1)}%`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} exercises failed to import`);
      console.log('   Check the error messages above for details');
    }
    
    console.log('\n🎉 Your YFIT app now has access to all exercises!');
    console.log('   Next step: Update ExerciseLibrary.jsx to fetch from Supabase\n');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
main();

