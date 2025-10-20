import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Activity, Apple, Dumbbell, Heart, Pill, TrendingUp, LogOut, Sparkles } from 'lucide-react'
import { supabase, signOut, getUserProfile } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [motivationalQuote, setMotivationalQuote] = useState('')

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
    setGreetingAndQuote()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    const profileData = await getUserProfile(user.id)
    setProfile(profileData)
    setLoading(false)
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
              <img src={logo} alt="YFIT AI" className="h-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                YFIT AI
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Goal: 10,000 steps</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
              <Apple className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">of 2000 kcal goal</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Complete profile to see</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/nutrition')}
                className="h-auto py-6 flex flex-col items-center space-y-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Apple className="h-6 w-6" />
                <span>Log Meal</span>
              </Button>

              <Button 
                onClick={() => navigate('/fitness')}
                className="h-auto py-6 flex flex-col items-center space-y-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Dumbbell className="h-6 w-6" />
                <span>Start Workout</span>
              </Button>

              <Button 
                onClick={() => navigate('/medications')}
                className="h-auto py-6 flex flex-col items-center space-y-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Pill className="h-6 w-6" />
                <span>Track Medication</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            <strong>Phase 1 Foundation Complete!</strong> 🎉
          </p>
          <p className="text-sm text-gray-500 mt-2">
            More features coming soon: Goals, Nutrition, Fitness, Medications, and more!
          </p>
        </div>
      </main>
    </div>
  )
}
