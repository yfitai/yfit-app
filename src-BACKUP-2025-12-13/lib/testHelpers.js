// Test helpers for development
// These functions help with testing authentication flows

import { supabase } from './supabase'

/**
 * For development testing: Get or create a test user with confirmed email
 * This bypasses email confirmation for testing purposes
 */
export const getTestUser = async () => {
  // Try to sign in with test credentials
  const testEmail = 'test.user@yfit.dev'
  const testPassword = 'testpass123'
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (!signInError && signInData.user) {
    return { user: signInData.user, error: null }
  }
  
  // If sign in failed, user might not exist or email not confirmed
  return { user: null, error: signInError }
}

/**
 * Create a mock user session for testing dashboard without email confirmation
 * Note: This is for UI testing only and won't create a real authenticated session
 */
export const createMockUserSession = () => {
  return {
    id: 'mock-user-id',
    email: 'test@yfit.dev',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    },
    created_at: new Date().toISOString()
  }
}

/**
 * Check if user's email is confirmed
 */
export const isEmailConfirmed = (user) => {
  return user?.email_confirmed_at !== null
}

/**
 * Development note:
 * To properly test the full flow, you need to either:
 * 1. Confirm the email through the link sent to the email address
 * 2. Manually confirm in Supabase dashboard (Authentication > Users > Click user > Confirm email)
 * 3. Disable email confirmation in Supabase (Authentication > Settings > Disable "Enable email confirmations")
 */
