
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Brain, TrendingUp, Heart, Dumbbell, Apple, Calendar, Sparkles, ChevronDown, ChevronUp, HelpCircle, Smartphone, Monitor } from 'lucide-react'

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

      {/* FAQ Section */}
      <FAQSection />

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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">YFIT AI</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="mailto:support@yfitai.com" className="hover:text-white transition-colors">support@yfitai.com</a>
          </div>
          <p className="text-sm">© 2025 YFIT AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FAQSection() {
  const [openItem, setOpenItem] = useState(null)
  const toggle = (id) => setOpenItem(openItem === id ? null : id)

  const faqs = [
    {
      id: 'what-is',
      q: 'What is YFIT AI and how does it work?',
      a: 'YFIT AI is a web-based fitness and nutrition app you access directly from your browser at yfitai.com — no app store download needed. Create a free account, set your goals, and start tracking workouts, meals, medications, and progress right away.'
    },
    {
      id: 'no-app-store',
      q: 'Is YFIT AI on the Google Play Store or Apple App Store?',
      a: 'YFIT AI is a Progressive Web App (PWA) — you use it through your browser, not the Play Store or App Store. The good news: you can add it to your home screen so it opens and feels exactly like a native app. See the install instructions below.'
    },
    {
      id: 'android-install',
      q: 'How do I add YFIT AI to my Android home screen?',
      a: (
        <div>
          <div className="flex items-center gap-2 mb-3 text-blue-600 font-medium">
            <Smartphone className="w-4 h-4" />
            <span>Android — Chrome browser</span>
          </div>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
            <li>Open <strong>Chrome</strong> and go to <strong>yfitai.com</strong></li>
            <li>Tap the <strong>three-dot menu (⋮)</strong> in the top-right corner</li>
            <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
            <li>The YFIT AI icon appears on your home screen — tap it anytime to open!</li>
          </ol>
        </div>
      )
    },
    {
      id: 'iphone-install',
      q: 'How do I add YFIT AI to my iPhone home screen?',
      a: (
        <div>
          <div className="flex items-center gap-2 mb-3 text-blue-600 font-medium">
            <Smartphone className="w-4 h-4" />
            <span>iPhone — must use Safari (not Chrome)</span>
          </div>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
            <li>Open <strong>Safari</strong> and go to <strong>yfitai.com</strong></li>
            <li>Tap the <strong>Share button</strong> at the bottom (box with arrow pointing up)</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> in the top-right corner</li>
            <li>The YFIT AI icon appears on your home screen — tap it anytime to open!</li>
          </ol>
        </div>
      )
    },
    {
      id: 'desktop-install',
      q: 'Can I install YFIT AI on my computer?',
      a: (
        <div>
          <div className="flex items-center gap-2 mb-3 text-blue-600 font-medium">
            <Monitor className="w-4 h-4" />
            <span>Desktop — Chrome or Edge</span>
          </div>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
            <li>Open Chrome or Edge and go to <strong>yfitai.com</strong></li>
            <li>Look for the <strong>install icon</strong> (computer with down arrow) in the address bar</li>
            <li>Click it and select <strong>"Install"</strong></li>
            <li>YFIT AI opens in its own window and appears in your taskbar or apps list</li>
          </ol>
        </div>
      )
    },
    {
      id: 'login-help',
      q: 'I cannot log in — what should I do?',
      a: 'Make sure you are visiting yfitai.com and using the email you signed up with. If you forgot your password, tap "Forgot Password" on the sign-in screen and check your email (including spam). If you still cannot get in, email us at support@yfitai.com and we will help you within 24 hours.'
    },
    {
      id: 'multi-device',
      q: 'Can I use YFIT AI on multiple devices?',
      a: 'Yes — because YFIT AI is web-based, you can log in from any phone, tablet, or computer using the same email and password. Your data syncs automatically across all devices.'
    },
    {
      id: 'free-plan',
      q: 'Is there a free version?',
      a: 'Yes! The free Starter plan includes basic workout tracking, manual meal logging, and 3 saved routines. Upgrade to Pro anytime to unlock AI coaching, nutrition scanning, advanced analytics, and more.'
    },
    {
      id: 'icon-blank',
      q: 'I added it to my home screen but the icon looks like a blank page.',
      a: 'This happens when the page was not fully loaded before you added it. Remove the icon, open yfitai.com again in your browser, wait for it to fully load, then follow the install steps again. On iPhone use Safari; on Android use Chrome.'
    },
    {
      id: 'icon-square',
      q: 'Why does the YFIT AI icon look square on my phone when other app icons are rounded?',
      a: (
        <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
          <p>
            The shape of your home screen icons — round, square, or squircle — is controlled by your
            phone's launcher, not by YFIT AI. Every app on your phone gets the same shape treatment,
            including apps from the Play Store.
          </p>
          <p>
            <strong>Samsung phones (Galaxy S, A, Z series):</strong> Samsung's One UI launcher uses
            square icons by default. This is normal — all your apps will look square on Samsung unless
            you change the launcher. There is no icon shape setting in Samsung's home screen options.
            If you want rounded icons, you can install a third-party launcher from the Play Store
            (such as Nova Launcher) and set the icon shape to rounded square or circle.
          </p>
          <p>
            <strong>Google Pixel and stock Android phones:</strong> These phones apply a squircle
            (rounded square) shape automatically, so YFIT AI will appear rounded on these devices.
          </p>
          <p>
            <strong>In short:</strong> A square icon on Samsung is expected and normal — it does not
            affect how the app works. YFIT AI is fully functional regardless of icon shape.
          </p>
        </div>
      )
    },
    {
      id: 'already-logged-in',
      q: 'I uninstalled the app and typed yfitai.com but it went straight to my account — is that normal?',
      a: 'Yes, this is normal and expected. Uninstalling the home screen shortcut only removes the icon — it does not log you out. Your browser remembers your login session, so visiting yfitai.com again takes you straight to your dashboard. To fully log out, open the app and tap your profile icon, then select Sign Out. To re-add the icon to your home screen, just follow the install steps above while you are already logged in — it works the same way.'
    },
  ]

  return (
    <div className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Got Questions? We Have Answers.</h2>
          <p className="text-lg text-gray-600">Everything you need to know about getting started with YFIT AI.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-800 pr-4 text-base">{item.q}</span>
                {openItem === item.id
                  ? <ChevronUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>
              {openItem === item.id && (
                <div className="px-6 pb-5 pt-2 bg-blue-50 text-gray-700 text-sm leading-relaxed border-t border-blue-100">
                  {typeof item.a === 'string' ? <p>{item.a}</p> : item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-100 text-center">
          <p className="text-gray-700">
            Still need help?{' '}
            <a href="mailto:support@yfitai.com" className="text-blue-600 font-semibold underline hover:text-blue-800">
              Email support@yfitai.com
            </a>
            {' '}— we respond within 24 hours.
          </p>
        </div>
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
