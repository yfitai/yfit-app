
import { Link } from 'react-router-dom'
import { Activity, Brain, TrendingUp, Heart, Dumbbell, Apple, Calendar, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-full">
                <Activity className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">YFIT AI</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your personal AI-powered fitness companion. Track workouts, manage nutrition, 
              monitor medications, and achieve your health goals with intelligent insights.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Get Started Free
              </Link>
              
              <Link
                to="/login"
                className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Succeed
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Dumbbell className="w-8 h-8" />}
            title="Workout Tracking"
            description="Log exercises, track progress, and get AI-powered form analysis for perfect technique."
            color="from-blue-500 to-blue-600"
          />
          
          <FeatureCard
            icon={<Apple className="w-8 h-8" />}
            title="Nutrition Management"
            description="Track meals, calories, and macros with smart recommendations tailored to your goals."
            color="from-green-500 to-green-600"
          />
          
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Medication Reminders"
            description="Never miss a dose with intelligent scheduling and timely notifications."
            color="from-purple-500 to-purple-600"
          />
          
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="AI Predictions"
            description="Get personalized insights and predictions about your fitness journey powered by AI."
            color="from-pink-500 to-pink-600"
          />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-white text-center">
            <div>
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Track Progress</h3>
              <p className="text-blue-100">
                Visualize your journey with detailed charts and analytics
              </p>
            </div>
            
            <div>
              <Heart className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Stay Motivated</h3>
              <p className="text-blue-100">
                Get personalized encouragement and celebrate milestones
              </p>
            </div>
            
            <div>
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
              <p className="text-blue-100">
                Benefit from intelligent insights and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Fitness Journey?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of users achieving their health goals with YFIT AI
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 text-white px-10 py-5 rounded-lg font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          <Sparkles className="w-6 h-6" />
          Start Your Free Trial
        </Link>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow">
      <div className={`bg-gradient-to-r ${color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
