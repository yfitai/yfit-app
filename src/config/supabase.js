import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
export const getCurrentUser = async () => {
  // Check if we're in demo mode
  const isDemoMode = localStorage.getItem('demoMode') === 'true'
  
  if (isDemoMode) {
    // Return a demo user object
    return {
      id: 'demo-user-id',
      email: 'demo@yfit.app',
      user_metadata: {
        first_name: 'Demo',
        last_name: 'User'
      }
    }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

