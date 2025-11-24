import { Home, Target, Utensils, Calendar, Dumbbell, Pill, TrendingUp, Sparkles, MessageCircle, LogOut } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { NavLink } from 'react-router-dom'
export default function Navigation({ user }) {
  const handleSignOut = async () => {
    await signOut()
    localStorage.removeItem('demoMode')
    window.location.href = '/'
  }

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/nutrition', label: 'Nutrition', icon: Utensils },
    { path: '/daily-tracker', label: 'Tracker', icon: Calendar },
    { path: '/fitness', label: 'Fitness', icon: Dumbbell },
    { path: '/medications', label: 'Meds', icon: Pill },
    { path: '/progress', label: 'Progress', icon: TrendingUp },
    { path: '/predictions', label: 'Predict', icon: Sparkles },
    { path: '/ai-coach-faq', label: 'AI Coach', icon: MessageCircle },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src="/assets/yfit-logo.png" alt="YFIT" className="h-8 sm:h-10" />
          </div>

          {/* Navigation Links - Scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 mx-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all whitespace-nowrap flex-shrink-0 min-w-[60px] ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs mt-0.5">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-all flex-shrink-0 min-w-[60px]"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs mt-0.5">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
