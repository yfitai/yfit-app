import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const CUTOFF_DATE = '2026-01-18'; // Delete everything before this date

async function cleanupDemoData() {
  console.log(`🗑️  Cleaning up demo data before ${CUTOFF_DATE}...`);
  
  try {
    // Delete workout sessions
    console.log('\n📋 Deleting workout sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .delete()
      .lt('start_time', CUTOFF_DATE);
    
    if (sessionsError) {
      console.error('❌ Error deleting workout sessions:', sessionsError);
    } else {
      console.log('✅ Workout sessions deleted');
    }

    // Delete meals
    console.log('\n🍽️  Deleting meals...');
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .delete()
      .lt('meal_date', CUTOFF_DATE);
    
    if (mealsError) {
      console.error('❌ Error deleting meals:', mealsError);
    } else {
      console.log('✅ Meals deleted');
    }

    // Delete daily logs
    console.log('\n📊 Deleting daily logs...');
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .delete()
      .lt('log_date', CUTOFF_DATE);
    
    if (logsError) {
      console.error('❌ Error deleting daily logs:', logsError);
    } else {
      console.log('✅ Daily logs deleted');
    }

    // Delete medication logs (if table exists)
    console.log('\n💊 Deleting medication logs...');
    const { data: medLogs, error: medLogsError } = await supabase
      .from('medication_logs')
      .delete()
      .lt('log_date', CUTOFF_DATE);
    
    if (medLogsError) {
      if (medLogsError.code === '42P01') {
        console.log('⚠️  medication_logs table does not exist, skipping');
      } else {
        console.error('❌ Error deleting medication logs:', medLogsError);
      }
    } else {
      console.log('✅ Medication logs deleted');
    }

    console.log(`\n✨ Cleanup complete! All data before ${CUTOFF_DATE} has been removed.`);
    console.log('✅ Kept: Workout templates, medications list, goals, user profile');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDemoData();
