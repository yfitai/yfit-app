import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './components/Auth'
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
import { supabase, getCurrentUser } from './lib/supabase'
import Footer from './components/Footer'
import { UnitPreferenceProvider } from './contexts/UnitPreferenceContext'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser)
  }

  const handleDemoMode = () => {
    // Create a demo user for testing dashboard UI
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@yfit.ai',
      user_metadata: {
        first_name: 'Alex',
        last_name: 'Demo'
      },
      created_at: new Date().toISOString()
    }
    // Set demo mode in localStorage so getCurrentUser() can detect it
    localStorage.setItem('demoMode', 'true')
    setUser(demoUser)
    setDemoMode(true)
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
    return <Auth onAuthSuccess={handleAuthSuccess} onDemoMode={handleDemoMode} />
  }

  return (
    <UnitPreferenceProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
          <Navigation user={user} />
          
          {/* Demo mode indicator */}
          {demoMode && (
            <div className="fixed top-20 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm shadow-lg z-50">
              🧪 Demo Mode Active
            </div>
          )}
                 <Routes>
            {/* Public Routes - No login required */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
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
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>

        <Footer />

       
        </div>
      </BrowserRouter>
    </UnitPreferenceProvider>
  )
}

export default App
