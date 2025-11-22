import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxggxpoxgqubojvumjlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4';

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

