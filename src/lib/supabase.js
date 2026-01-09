import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://mxggxpoxgqubojvumjlt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Helper function to get user profile with first name
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }
  return data
}

// Helper function to sign up
export const signUp = async (email, password, firstName, lastName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      },
      // Set email redirect URL for confirmation
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('Error signing up:', error)
    return { data: null, error, needsEmailConfirmation: false }
  }
  
  // Check if email confirmation is required
  const needsEmailConfirmation = data.user && !data.session
  
  // Create user profile only if user was created
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't fail signup if profile creation fails - can be retried
    }

    // 🎉 Send welcome email via Resend
    try {
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: email,
          firstName: firstName,
          lastName: lastName
        }
      })
      
      if (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail signup if email fails - it's not critical
      } else {
        console.log('✅ Welcome email sent to', email)
      }
    } catch (emailError) {
      console.error('Error invoking welcome email function:', emailError)
      // Continue with signup even if email fails
    }
  }
  
  return { data, error: null, needsEmailConfirmation }
}

// Helper function to request password reset
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) {
    console.error('Error sending password reset email:', error)
    return { data: null, error }
  }
  
  return { data, error: null }
}

// Helper function to sign in
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Error signing in:', error)
    return { data: null, error }
  }
  
  // Check if user profile exists, create if missing (non-blocking)
  if (data.user) {
    try {
      const profile = await getUserProfile(data.user.id)
      if (!profile) {
        console.log('User profile not found - this is normal for new accounts')
        // Don't try to create profile if table doesn't exist
        // Profile will be created when user completes Goals page
      }
    } catch (profileError) {
      console.log('Profile check skipped:', profileError.message)
      // Continue with login even if profile operations fail
    }
  }
  
  return { data, error: null }
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  return { error }
}

// Helper function to resend confirmation email
export const resendConfirmationEmail = async (email) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  })
  
  if (error) {
    console.error('Error resending confirmation:', error)
    return { error }
  }
  
  return { error: null }
}
