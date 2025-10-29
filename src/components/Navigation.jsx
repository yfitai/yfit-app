import { Home, Target, Utensils, Dumbbell, Pill, TrendingUp, Sparkles, MessageCircle, LogOut } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { NavLink } from 'react-router-dom'
export default function Navigation({ user }) {
  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/nutrition', label: 'Nutrition', icon: Utensils },
    { path: '/fitness', label: 'Fitness', icon: Dumbbell },
    { path: '/medications', label: 'Medications', icon: Pill },
       { path: '/progress', label: 'Progress', icon: TrendingUp },
    { path: '/predictions', label: 'Predictions', icon: Sparkles },
    { path: '/ai-coach-faq', label: 'AI Coach', icon: MessageCircle },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              Y
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              YFIT AI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all ml-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
