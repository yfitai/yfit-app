import { Home, Target, Utensils, Calendar, Dumbbell, Pill, TrendingUp, Sparkles, MessageCircle, LogOut, Ruler } from 'lucide-react'
import { signOut } from '../lib/supabase'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navigation({ user }) {
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: Home },
    { path: '/goals', label: t('nav.goals'), icon: Target },
    { path: '/nutrition', label: t('nav.nutrition'), icon: Utensils },
    { path: '/daily-tracker', label: t('nav.dailyTracker'), icon: Calendar },
    { path: '/fitness', label: t('nav.fitness'), icon: Dumbbell },
    { path: '/medications', label: t('nav.medications'), icon: Pill },
    { path: '/progress', label: t('nav.progress'), icon: TrendingUp },
    { path: '/predictions', label: t('nav.predictions'), icon: Sparkles },
    { path: '/body-recomp', label: 'Recomp', icon: Ruler },
    { path: '/ai-coach-faq', label: t('nav.aiCoach'), icon: MessageCircle },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="w-full px-2 sm:px-4">
        {/* Top bar: Logo + Language switcher + Sign out (always visible) */}
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src="./assets/yfit-logo.png" alt="YFIT AI" className="h-8 sm:h-10" />
          </div>

          {/* Desktop nav links (hidden on mobile) */}
          <div className="hidden sm:flex sm:flex-row gap-1 flex-1 mx-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-1 py-1 sm:px-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs mt-0.5">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side: Language switcher + Sign out (always visible) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <LanguageSwitcher compact={true} className="text-gray-700" />
            {user && (
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center px-1 py-1 sm:px-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                title={t('nav.signOut')}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs mt-0.5 hidden sm:block">{t('nav.signOut')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav links (2 rows of 5, shown below top bar on mobile only) */}
        <div className="grid grid-cols-5 gap-1 pb-2 sm:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-1 py-1 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
