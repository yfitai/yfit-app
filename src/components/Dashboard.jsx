import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Activity, Apple, Dumbbell, Heart, Pill, TrendingUp, LogOut, Sparkles, Target, Calendar, BarChart3, Brain, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase, signOut, getUserProfile } from '../lib/supabase'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
// Logo is loaded from public/assets/yfit-logo.png

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [motivationalQuote, setMotivationalQuote] = useState('')
  
  // Dashboard stats
  const [stepsToday, setStepsToday] = useState(0)
  const [stepsGoal, setStepsGoal] = useState(10000)
  const [caloriesToday, setCaloriesToday] = useState(0)
  const [caloriesGoal, setCaloriesGoal] = useState(2000)
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0)
  const [healthScore, setHealthScore] = useState(null)
  
  // Change Password modal state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Motivational quotes database
  const morningQuotes = [
    "Every morning is a new opportunity to become stronger!",
    "Today is your day to shine and make healthy choices!",
    "Rise and shine! Your body will thank you for the effort!",
    "Start your day with intention and watch your health transform!",
    "Good morning! Small steps today lead to big changes tomorrow!"
  ]

  const eveningQuotes = [
    "Great job today! Every healthy choice counts!",
    "You're making progress! Keep up the amazing work!",
    "End your day knowing you're one step closer to your goals!",
    "Reflect on today's wins and prepare for tomorrow's success!",
    "You showed up today, and that's what matters most!"
  ]

  const didYouKnowFacts = [
    "Did you know? Drinking water before meals can help with weight management!",
    "Did you know? Just 30 minutes of daily exercise can significantly improve your mood!",
    "Did you know? Getting 7-9 hours of sleep is crucial for muscle recovery!",
    "Did you know? Protein helps build and repair muscles after workouts!",
    "Did you know? Consistency is more important than perfection in fitness!"
  ]

  useEffect(() => {
    loadUserProfile()
    loadDashboardStats()
    setGreetingAndQuote()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    const profileData = await getUserProfile(user.id)
    setProfile(profileData)
    setLoading(false)
  }

  const loadDashboardStats = async () => {
    if (!user) return
    
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's steps from daily_logs
    const { data: trackerData, error: trackerError } = await supabase
      .from('daily_logs')
      .select('steps')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single()
    
    if (trackerData?.steps) {
      setStepsToday(trackerData.steps)
    }
    
    // Get today's calories from meals
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .select('calories')
      .eq('user_id', user.id)
      .eq('meal_date', today)
    
    if (mealsData) {
      const totalCalories = mealsData.reduce((sum, meal) => sum + (meal.calories || 0), 0)
      setCaloriesToday(Math.round(totalCalories))
    }
    
    // Get this week's workouts count
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
    
    const { data: workoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${startOfWeekStr}T00:00:00`)
    
    if (workoutsData) {
      setWorkoutsThisWeek(workoutsData.length)
    }
    
    // Get goals for steps and calories targets
    const { data: goalsData } = await supabase
      .from('user_profiles')
      .select('steps_goal, adjusted_calories')
      .eq('user_id', user.id)
      .single()
    
    if (goalsData) {
      if (goalsData.steps_goal) setStepsGoal(goalsData.steps_goal)
      if (goalsData.adjusted_calories) setCaloriesGoal(Math.round(goalsData.adjusted_calories))
    }
    
    // Calculate health score (0-100)
    calculateHealthScore(trackerData, mealsData, workoutsData, goalsData)
  }

  const calculateHealthScore = (trackerData, mealsData, workoutsData, goalsData) => {
    let score = 0
    let maxScore = 0
    
    // Steps contribution (25 points)
    if (trackerData?.steps && goalsData?.steps_goal) {
      const stepsPercent = Math.min(trackerData.steps / goalsData.steps_goal, 1)
      score += stepsPercent * 25
    }
    maxScore += 25
    
    // Calories contribution (25 points)
    if (mealsData && mealsData.length > 0 && goalsData?.adjusted_calories) {
      const totalCalories = mealsData.reduce((sum, meal) => sum + (meal.calories || 0), 0)
      const caloriesPercent = Math.min(totalCalories / goalsData.adjusted_calories, 1)
      score += caloriesPercent * 25
    }
    maxScore += 25
    
    // Workouts contribution (25 points) - 3+ workouts per week = full points
    if (workoutsData) {
      const workoutScore = Math.min(workoutsData.length / 3, 1) * 25
      score += workoutScore
    }
    maxScore += 25
    
    // Profile completion (25 points)
    if (goalsData) {
      let profileScore = 0
      if (goalsData.steps_goal) profileScore += 12.5
      if (goalsData.adjusted_calories) profileScore += 12.5
      score += profileScore
    }
    maxScore += 25
    
    // Only show score if user has some data
    if (maxScore > 0) {
      setHealthScore(Math.round((score / maxScore) * 100))
    }
  }

  const setGreetingAndQuote = () => {
    const hour = new Date().getHours()
    const isEvening = hour >= 17
    
    // Set greeting
    if (hour < 12) {
      setGreeting('Good Morning')
    } else if (hour < 17) {
      setGreeting('Good Afternoon')
    } else {
      setGreeting('Good Evening')
    }

    // Set motivational quote
    const quotes = isEvening ? eveningQuotes : morningQuotes
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setMotivationalQuote(randomQuote)
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    
    // Validation
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    setIsChangingPassword(true)
    
    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })
    
    if (signInError) {
      setPasswordError('Current password is incorrect')
      setIsChangingPassword(false)
      return
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (updateError) {
      setPasswordError(updateError.message || 'Failed to change password')
      setIsChangingPassword(false)
      return
    }
    
    setPasswordSuccess('Password changed successfully!')
    setIsChangingPassword(false)
    
    // Clear form and close modal after 2 seconds
    setTimeout(() => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordSuccess('')
      setShowChangePassword(false)
    }, 2000)
  }

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="./assets/yfit-logo.png" alt="YFIT AI" className="h-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                YFIT AI
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowChangePassword(true)}
                className="flex items-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Change Password</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TEST: Auto-update working! */}
        <div className="mb-4 p-3 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-sm font-semibold text-green-900">✅ AUTO-UPDATE WORKING! Purple banner test successful! 🎉</p>
        </div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {greeting}, {firstName}! 👋
          </h2>
          <div className="flex items-start space-x-2 bg-gradient-to-r from-blue-100 to-green-100 p-4 rounded-lg border border-blue-200">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 font-medium">{motivationalQuote}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Steps Today</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stepsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Goal: {stepsGoal.toLocaleString()} steps</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
              <Apple className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caloriesToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">of {caloriesGoal.toLocaleString()} kcal goal</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workoutsThisWeek}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthScore !== null ? `${healthScore}/100` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {healthScore !== null 
                  ? healthScore >= 75 ? 'Excellent!' : healthScore >= 50 ? 'Good progress' : 'Keep going!'
                  : 'Complete profile to see'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Did You Know */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Daily Health Tip</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {didYouKnowFacts[Math.floor(Math.random() * didYouKnowFacts.length)]}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your health journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Button 
                onClick={() => navigate('/goals')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs sm:text-sm"
              >
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Goals</span>
              </Button>

              <Button 
                onClick={() => navigate('/nutrition')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-xs sm:text-sm"
              >
                <Apple className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Nutrition</span>
              </Button>

              <Button 
                onClick={() => navigate('/fitness')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-xs sm:text-sm"
              >
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Fitness</span>
              </Button>

              <Button 
                onClick={() => navigate('/daily-tracker')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-xs sm:text-sm"
              >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Daily Tracker</span>
              </Button>

              <Button 
                onClick={() => navigate('/medications')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-xs sm:text-sm"
              >
                <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Medications</span>
              </Button>

              <Button 
                onClick={() => navigate('/progress')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-xs sm:text-sm"
              >
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Progress</span>
              </Button>

              <Button 
                onClick={() => navigate('/predictions')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-xs sm:text-sm"
              >
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Predictions</span>
              </Button>

              <Button 
                onClick={() => navigate('/ai-coach')}
                className="h-auto py-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-xs sm:text-sm"
              >
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>AI Coach</span>
              </Button>
            </div>
          </CardContent>
        </Card>


      </main>
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Change Password</span>
              </CardTitle>
              <CardDescription>
                Enter your current password and choose a new one
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                {passwordError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700 text-sm">
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {passwordSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-700 text-sm">
                      {passwordSuccess}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        setPasswordError('')
                      }}
                      required
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setPasswordError('')
                      }}
                      required
                      disabled={isChangingPassword}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value)
                        setPasswordError('')
                      }}
                      required
                      disabled={isChangingPassword}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </CardContent>
              
              <div className="flex space-x-2 px-6 pb-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowChangePassword(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmNewPassword('')
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
