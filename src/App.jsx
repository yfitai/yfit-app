import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, getCurrentUser } from './lib/supabase'
import { UnitPreferenceProvider } from './contexts/UnitPreferenceContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { LiveUpdateService } from './services/liveUpdate'
import { setAnalyticsUser, Analytics } from './lib/analytics'
import './App.css'

// Always-needed components loaded eagerly (small, needed immediately)
import Navigation from './components/Navigation'
import InstallBanner from './components/InstallBanner'
import DailyInsight from './components/DailyInsight'
import Footer from './components/Footer'
import ErrorBoundary, { setupGlobalErrorHandlers } from './components/ErrorBoundary'
import VersionChecker from './utils/VersionChecker'
import FeedbackButton from './components/FeedbackButton'
import ProRoute from './components/ProRoute'

// Auth & onboarding loaded eagerly (needed before dashboard)
import Auth from './components/Auth'
import OnboardingWizard from './components/OnboardingWizard'

// All page-level components lazy loaded — only downloaded when user navigates to that page
const Dashboard = lazy(() => import('./components/Dashboard'))
const Goals = lazy(() => import('./components/Goals'))
const NutritionUnified = lazy(() => import('./components/NutritionUnified'))
const DailyTracker = lazy(() => import('./components/DailyTracker'))
const Progress = lazy(() => import('./components/Progress'))
const Fitness = lazy(() => import('./components/Fitness'))
const Medications = lazy(() => import('./components/Medications'))
const FormAnalysis = lazy(() => import('./pages/FormAnalysis'))
const WorkoutSessionTracker = lazy(() => import('./components/WorkoutSessionTracker'))
const AICoachFAQ = lazy(() => import('./components/AICoachFAQ'))
const PredictionsUnified = lazy(() => import('./components/PredictionsUnified'))
const BodyRecomp = lazy(() => import('./components/BodyRecomp'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Legal = lazy(() => import('./pages/Legal'))
const ResetPassword = lazy(() => import('./components/ResetPassword'))
const ManualCleanup = lazy(() => import('./pages/ManualCleanup'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))

// Minimal page-level loading spinner shown while lazy chunks download
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    // Initialize LiveUpdate service for OTA updates (non-blocking)
    LiveUpdateService.initialize().catch(err => {
      console.error('Failed to initialize LiveUpdate:', err)
    })

    // OPTIMISTIC AUTH: read cached session from localStorage instantly (no network needed)
    // This makes the app appear immediately on repeat opens
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const cachedUser = session?.user ?? null
      if (cachedUser) {
        // Show app immediately with cached user - no spinner needed
        setUser(cachedUser)
        setAnalyticsUser(cachedUser.id)
        setupGlobalErrorHandlers(cachedUser.id)
        setLoading(false)
        // Check onboarding in background (non-blocking)
        checkOnboardingStatus(cachedUser.id).catch(() => {})
      } else {
        // No cached session - need to show login, clear spinner
        setLoading(false)
      }
    }).catch(() => {
      // If localStorage read fails, fall back to network check
      getCurrentUser().then(async (currentUser) => {
        setUser(currentUser)
        if (currentUser) {
          setAnalyticsUser(currentUser.id)
          setupGlobalErrorHandlers(currentUser.id)
          await Promise.race([
            checkOnboardingStatus(currentUser.id),
            new Promise(resolve => setTimeout(resolve, 3000))
          ])
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      // Only run heavy checks on actual sign-in events, NOT on TOKEN_REFRESHED
      // TOKEN_REFRESHED fires every hour and was causing repeated Supabase queries
      if (currentUser && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION')) {
        setAnalyticsUser(currentUser.id)
        setupGlobalErrorHandlers(currentUser.id)
        await Promise.race([
          checkOnboardingStatus(currentUser.id),
          new Promise(resolve => setTimeout(resolve, 3000))
        ])
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

  // All routing lives inside BrowserRouter so public pages (/, /legal, /signup)
  // are accessible without being logged in. Protected routes redirect to /login.
  return (
    <ErrorBoundary userId={user?.id}>
      <BrowserRouter>
        {needsOnboarding && user ? (
          // New user onboarding — full-screen wizard, no nav
          <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />
        ) : !user ? (
          // Logged-out: show public routes only
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/signup" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/legal" element={<Legal />} />
              {/* Any other path redirects to landing page for logged-out users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        ) : (
          // Logged-in: full app with navigation
          <SubscriptionProvider>
            <UnitPreferenceProvider>
              <VersionChecker />
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
                <Navigation user={user} />
                {/* Daily Insight strip — visible on all authenticated pages, dismissible per day */}
                <DailyInsight variant="strip" />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Redirect / to dashboard when logged in */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/legal" element={<Legal />} />

                    {/* Free + Pro routes */}
                    <Route path="/dashboard" element={<Dashboard user={user} />} />
                    <Route path="/goals" element={<Goals user={user} />} />
                    <Route path="/nutrition" element={<NutritionUnified user={user} />} />
                    <Route path="/daily-tracker" element={<DailyTracker user={user} />} />
                    <Route path="/fitness" element={<Fitness user={user} />} />
                    <Route path="/fitness/workout" element={<WorkoutSessionTracker user={user} />} />
                    <Route path="/progress" element={<Progress user={user} />} />
                    <Route path="/body-recomp" element={<BodyRecomp user={user} />} />
                    <Route path="/manual-cleanup" element={<ManualCleanup />} />
                    <Route path="/subscription" element={<SubscriptionPage user={user} />} />

                    {/* Pro-only routes — gated with ProRoute */}
                    <Route path="/medications" element={
                      <ProRoute feature="medication_tracking" featureLabel="Medication Tracking">
                        <Medications user={user} />
                      </ProRoute>
                    } />
                    {/* Predictions: free users see blurred preview (handled inside PredictionsUnified) */}
                    <Route path="/predictions" element={<PredictionsUnified user={user} />} />
                    {/* Usage-limited routes: free users get 3/month form analysis, 10/month AI coach */}
                    <Route path="/fitness/form-analysis/:slug" element={
                      <ProRoute feature="form_analysis" featureLabel="AI Form Analysis">
                        <FormAnalysis user={user} />
                      </ProRoute>
                    } />
                    <Route path="/ai-coach-faq" element={
                      <ProRoute feature="ai_coach" featureLabel="AI Coach">
                        <AICoachFAQ userId={user.id} />
                      </ProRoute>
                    } />

                    {/* Fallback: redirect unknown paths to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>

                <Footer />
                {/* Floating feedback button - visible on all authenticated pages */}
                <FeedbackButton user={user} />
                {/* PWA install prompt for iOS and Android */}
                <InstallBanner />
              </div>
            </UnitPreferenceProvider>
          </SubscriptionProvider>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
