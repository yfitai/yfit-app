import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import LandingPage from './pages/LandingPage'
import Legal from './pages/Legal'
import Dashboard from './components/Dashboard'
import Goals from './components/Goals'
import NutritionUnified from './components/NutritionUnified'
import DailyTracker from './components/DailyTracker'
import Progress from './components/Progress'
import Fitness from './components/Fitness'
import Medications from './components/Medications'
import FormAnalysis from './pages/FormAnalysis'
import WorkoutSessionTracker from './components/WorkoutSessionTracker'
import AICoachFAQ from './components/AICoachFAQ'
import PredictionsUnified from './components/PredictionsUnified'
import Navigation from './components/Navigation'
import ManualCleanup from './pages/ManualCleanup'
import { supabase, getCurrentUser } from './lib/supabase'
import Footer from './components/Footer'
import { UnitPreferenceProvider } from './contexts/UnitPreferenceContext'
import VersionChecker from './utils/VersionChecker'
import { LiveUpdateService } from './services/liveUpdate'
import ErrorBoundary, { setupGlobalErrorHandlers } from './components/ErrorBoundary'
import OnboardingWizard from './components/OnboardingWizard'
import FeedbackButton from './components/FeedbackButton'
import { setAnalyticsUser, Analytics } from './lib/analytics'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    // Initialize LiveUpdate service for OTA updates
    LiveUpdateService.initialize().catch(err => {
      console.error('Failed to initialize LiveUpdate:', err)
    })

    // Check for existing session
    // Hard 8-second safety timeout - guarantees spinner NEVER gets stuck
    const startupTimeout = setTimeout(() => {
      console.warn('App startup timed out after 8s - forcing load')
      setLoading(false)
    }, 8000)

    getCurrentUser().then(async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setAnalyticsUser(currentUser.id)
        setupGlobalErrorHandlers(currentUser.id)
        // Onboarding check has its own 3-second timeout so it can't block startup
        await Promise.race([
          checkOnboardingStatus(currentUser.id),
          new Promise(resolve => setTimeout(resolve, 3000))
        ])
      }
      clearTimeout(startupTimeout)
      setLoading(false)
    }).catch(() => {
      clearTimeout(startupTimeout)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        setAnalyticsUser(currentUser.id)
        setupGlobalErrorHandlers(currentUser.id)
        await checkOnboardingStatus(currentUser.id)
        if (_event === 'SIGNED_IN') {
          Analytics.login()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkOnboardingStatus = async (userId) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle()
      
      // Show onboarding if profile doesn't exist or onboarding not completed
      if (!data || !data.onboarding_completed) {
        setNeedsOnboarding(true)
      }
    } catch {
      // If table doesn't exist yet, skip onboarding gracefully
      setNeedsOnboarding(false)
    }
  }

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false)
  }

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </ErrorBoundary>
    )
  }

  // Show onboarding wizard for new users
  if (needsOnboarding) {
    return (
      <ErrorBoundary userId={user.id}>
        <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary userId={user.id}>
      <UnitPreferenceProvider>
        <VersionChecker />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <Navigation user={user} />

            <Routes>
              {/* Public Routes - No login required */}
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
              <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/signup" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/legal" element={<Legal />} />

              {/* Protected Routes - Login required */}
              {user ? (
                <>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/goals" element={<Goals user={user} />} />
                  <Route path="/nutrition" element={<NutritionUnified user={user} />} />
                  <Route path="/daily-tracker" element={<DailyTracker user={user} />} />
                  <Route path="/fitness" element={<Fitness user={user} />} />
                  <Route path="/fitness/form-analysis/:slug" element={<FormAnalysis user={user} />} />
                  <Route path="/fitness/workout" element={<WorkoutSessionTracker user={user} />} />
                  <Route path="/medications" element={<Medications user={user} />} />
                  <Route path="/progress" element={<Progress user={user} />} />
                  <Route path="/ai-coach-faq" element={<AICoachFAQ userId={user.id} />} />
                  <Route path="/predictions" element={<PredictionsUnified user={user} />} />
                  <Route path="/manual-cleanup" element={<ManualCleanup />} />
                </>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>

            <Footer />

            {/* Floating feedback button - visible on all authenticated pages */}
            <FeedbackButton user={user} />
          </div>
        </BrowserRouter>
      </UnitPreferenceProvider>
    </ErrorBoundary>
  )
}

export default App
// Force rebuild for camera fix Tue Feb 24 14:38:13 EST 2026
