/**
 * YFIT Feature Analytics
 * Lightweight event tracker that logs feature usage to Supabase.
 * Call trackEvent() anywhere in the app to record user interactions.
 */
import { supabase } from './supabase'

// Generate a session ID that persists for the browser session
const SESSION_ID = sessionStorage.getItem('yfit_session_id') || (() => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  sessionStorage.setItem('yfit_session_id', id)
  return id
})()

let currentUserId = null

export function setAnalyticsUser(userId) {
  currentUserId = userId
}

/**
 * Track a feature usage event
 * @param {string} eventName - e.g. 'page_view', 'log_meal', 'scan_food', 'log_workout'
 * @param {string} feature - e.g. 'nutrition', 'fitness', 'medications', 'predictions'
 * @param {object} properties - optional extra data
 */
export async function trackEvent(eventName, feature, properties = {}) {
  try {
    await supabase.from('feature_analytics').insert({
      user_id: currentUserId,
      event_name: eventName,
      feature: feature,
      page: window.location.pathname,
      properties: Object.keys(properties).length > 0 ? properties : null,
      session_id: SESSION_ID,
    })
  } catch {
    // Analytics should never break the app - silently fail
  }
}

/**
 * Track a page view
 * @param {string} pageName - e.g. 'nutrition', 'fitness', 'medications'
 */
export function trackPageView(pageName) {
  trackEvent('page_view', pageName, { path: window.location.pathname })
}

// Convenience event trackers for common actions
export const Analytics = {
  // Nutrition
  logMeal: (method) => trackEvent('log_meal', 'nutrition', { method }), // method: 'search', 'scan', 'manual'
  scanFood: () => trackEvent('scan_food', 'nutrition'),
  viewNutrition: () => trackPageView('nutrition'),

  // Fitness
  logWorkout: (exerciseCount) => trackEvent('log_workout', 'fitness', { exercise_count: exerciseCount }),
  viewFitness: () => trackPageView('fitness'),

  // Medications
  logMedication: () => trackEvent('log_medication', 'medications'),
  addMedication: () => trackEvent('add_medication', 'medications'),
  viewMedications: () => trackPageView('medications'),

  // Daily Tracker
  logWater: () => trackEvent('log_water', 'daily_tracker'),
  logSleep: () => trackEvent('log_sleep', 'daily_tracker'),
  logBP: () => trackEvent('log_blood_pressure', 'daily_tracker'),
  logGlucose: () => trackEvent('log_glucose', 'daily_tracker'),
  viewDailyTracker: () => trackPageView('daily_tracker'),

  // Predictions
  viewPredictions: () => trackPageView('predictions'),
  refreshPredictions: () => trackEvent('refresh_predictions', 'predictions'),

  // Goals
  saveGoals: () => trackEvent('save_goals', 'goals'),
  viewGoals: () => trackPageView('goals'),

  // AI Coach
  sendAIMessage: () => trackEvent('send_ai_message', 'ai_coach'),
  viewAICoach: () => trackPageView('ai_coach'),

  // General
  login: () => trackEvent('login', 'auth'),
  logout: () => trackEvent('logout', 'auth'),
  openFeedback: () => trackEvent('open_feedback', 'feedback'),
}
