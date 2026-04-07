import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormAnalysisShowcase from '../components/FormAnalysisShowcase';
import MedicationShowcase from '../components/MedicationShowcase';
import {
  Check, ArrowRight, Activity, Zap, Smartphone, BarChart3,
  Pill, Eye, Target, Dumbbell, Heart, TrendingUp, Apple,
  Calendar, Brain, ChevronDown, ChevronUp, Monitor
} from 'lucide-react';

// Stripe buy links (live production)
const STRIPE_LINKS = {
  pro_monthly:  'https://buy.stripe.com/cNi6oGbHBgYD2S5bOZ3sI00',
  pro_yearly:   'https://buy.stripe.com/6oU5kCaDxbEj3W98CN3sI01',
  pro_lifetime: 'https://buy.stripe.com/aFadR8bHB9wbfERdX73sI02',
};

const quickActions = [
  { icon: Target,     title: 'Goals',         description: 'Set and track personalized fitness goals tailored to your unique journey',                   iconBg: 'bg-blue-500/20',   iconColor: 'text-blue-600' },
  { icon: Apple,      title: 'Nutrition',      description: 'Scan barcodes, log meals, and track macros with AI-powered nutrition insights',             iconBg: 'bg-green-500/20',  iconColor: 'text-green-600' },
  { icon: Dumbbell,   title: 'Fitness',        description: 'Access personalized workout plans with real-time form analysis and coaching',                iconBg: 'bg-purple-500/20', iconColor: 'text-purple-600' },
  { icon: Calendar,   title: 'Daily Tracker',  description: 'Log your daily activities, meals, workouts, and medications in one place',                  iconBg: 'bg-orange-500/20', iconColor: 'text-orange-600' },
  { icon: Activity,   title: 'Tracker',        description: 'Monitor your fitness metrics, steps, calories burned, and workout history',                 iconBg: 'bg-red-500/20',    iconColor: 'text-red-600' },
  { icon: TrendingUp, title: 'Progress',       description: 'Visualize your transformation with detailed charts and milestone celebrations',             iconBg: 'bg-teal-500/20',   iconColor: 'text-teal-600' },
  { icon: Brain,      title: 'AI Coach',       description: 'Chat with your personal AI health coach for guidance, motivation, and personalized plans',  iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-600' },
  { icon: Heart,      title: 'Recomp',         description: 'Optimize body recomposition with AI-driven nutrition and training adjustments',             iconBg: 'bg-pink-500/20',   iconColor: 'text-pink-600' },
];

const faqItems = [
  {
    id: 'what-is',
    q: 'What is YFIT AI and how does it work?',
    a: 'YFIT AI is a web-based fitness and nutrition app you access directly from your browser at yfitai.com — no app store download needed. Create a free account, set your goals, and start tracking workouts, meals, medications, and progress right away.',
  },
  {
    id: 'no-app-store',
    q: 'Is YFIT AI on the Google Play Store or Apple App Store?',
    a: 'YFIT AI is a Progressive Web App (PWA) — you use it through your browser, not the Play Store or App Store. The good news: you can add it to your home screen so it opens and feels exactly like a native app. See the install instructions below.',
  },
  {
    id: 'android-install',
    q: 'How do I add YFIT AI to my Android home screen?',
    a: null,
    jsx: (
      <div>
        <div className="flex items-center gap-2 mb-3 font-medium" style={{ color: '#059669' }}>
          <Smartphone className="w-4 h-4" />
          <span>Android — Google Chrome browser</span>
        </div>
        <ol className="list-decimal ml-5 space-y-2 text-gray-700">
          <li>Make sure you are using <strong>Google Chrome</strong> (not Samsung Internet or another browser)</li>
          <li>Go to <strong>yfitai.com</strong> and wait for it to <strong>fully load</strong> — you should see your dashboard or the welcome screen</li>
          <li>Tap the <strong>three-dot menu (⋮)</strong> in the top-right corner of Chrome</li>
          <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
          <li>Tap <strong>"Add"</strong> to confirm — the icon appears on your home screen immediately</li>
        </ol>
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong>Samsung device?</strong> The icon may appear square — this is normal. Samsung's launcher applies square shapes to all app icons, including apps from the Play Store. It does not affect how the app works.
        </p>
      </div>
    ),
  },
  {
    id: 'iphone-install',
    q: 'How do I add YFIT AI to my iPhone or iPad home screen?',
    a: null,
    jsx: (
      <div>
        <div className="flex items-center gap-2 mb-3 font-medium" style={{ color: '#059669' }}>
          <Smartphone className="w-4 h-4" />
          <span>iPhone / iPad — must use Safari</span>
        </div>
        <ol className="list-decimal ml-5 space-y-2 text-gray-700">
          <li>Open <strong>Safari</strong> and go to <strong>yfitai.com</strong> — this only works in Safari, not Chrome on iPhone</li>
          <li>Wait for the page to <strong>fully load</strong></li>
          <li>Tap the <strong>Share button</strong> at the bottom of the screen (box with an arrow pointing up ↑)</li>
          <li>Scroll down in the share sheet and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> in the top-right corner — the icon appears on your home screen</li>
        </ol>
        <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <strong>Using Chrome on iPhone?</strong> Copy the URL from Chrome, open Safari, paste it in the address bar, then follow the steps above.
        </p>
      </div>
    ),
  },
  {
    id: 'desktop-install',
    q: 'Can I install YFIT AI on my computer?',
    a: null,
    jsx: (
      <div>
        <div className="flex items-center gap-2 mb-3 font-medium" style={{ color: '#059669' }}>
          <Monitor className="w-4 h-4" />
          <span>Desktop — Chrome or Edge</span>
        </div>
        <ol className="list-decimal ml-5 space-y-2 text-gray-700">
          <li>Open <strong>Chrome</strong> or <strong>Edge</strong> and go to <strong>yfitai.com</strong></li>
          <li>Look for a small <strong>install icon (⊕)</strong> in the address bar on the right side</li>
          <li>Click it and then click <strong>"Install"</strong> in the popup</li>
          <li>YFIT AI opens in its own window and is pinned to your taskbar or Start menu</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'login-help',
    q: 'I cannot log in — what should I do?',
    a: 'Make sure you are visiting yfitai.com and using the email you signed up with. If you forgot your password, tap "Forgot Password" on the sign-in page and check your email (including spam). If you still have trouble, contact support@yfitai.com.',
  },
  {
    id: 'already-logged-in',
    q: 'I typed yfitai.com and it went straight to my account — is that normal?',
    a: 'Yes, completely normal. Your browser remembers your login session, so if you were previously signed in, it takes you straight to your dashboard. To sign out: tap your profile icon inside the app → "Sign Out". After signing out, yfitai.com will show the landing page instead.',
  },
  {
    id: 'uninstall-still-logged-in',
    q: 'I removed the app from my home screen but it still opened my account. Why?',
    a: 'Removing the home screen shortcut only removes the icon — it does not log you out. Your login session is stored in the browser separately. To fully sign out: open the app → tap your profile icon → tap "Sign Out". Then you can re-add the icon to your home screen if you wish.',
  },
  {
    id: 'blank-icon',
    q: 'My YFIT AI icon shows a blank screen or spinning disk when I tap it.',
    a: 'This usually happens when the icon was added before the page fully loaded. To fix it:\n\n1. Long-press the YFIT AI icon → tap Remove (or drag to bin)\n2. Open Chrome and go to yfitai.com\n3. Wait until your dashboard is fully visible\n4. Tap Chrome menu (⋮) → "Add to Home screen" → "Add"\n\nThe new icon will work correctly.',
  },
  {
    id: 'square-icon',
    q: 'Why does the YFIT AI icon look square on my Samsung phone?',
    a: 'The shape of app icons on Android is controlled by your phone\'s launcher, not by YFIT AI. On Samsung devices with One UI, all icons appear square by default — this includes native apps from the Play Store as well. There is no icon shape setting in Samsung\'s home screen options. If you want rounded icons, install Nova Launcher from the Play Store and choose your preferred icon shape in its settings.',
  },
  {
    id: 'multi-device',
    q: 'Can I use YFIT AI on multiple devices?',
    a: 'Yes. Your account syncs across all your devices. Sign in at yfitai.com on any phone, tablet, or computer and all your data — workouts, nutrition logs, goals, medications — will be there.',
  },
  {
    id: 'free-plan',
    q: 'What is included in the free plan?',
    a: 'The free Starter plan includes: basic workout tracking, manual meal logging, 5 barcode scans per month, 3 form analyses per month, 10 AI Coach queries per month, 3 saved routines, and a predictions preview. Upgrade to Pro for unlimited access to all features.',
  },
];

const TESTIMONIALS = [
  { quote: 'Finally an app that lets me track my blood pressure meds alongside my workouts. My doctor loves the reports it generates.', name: 'Sarah M.', role: 'Beta Tester · Vancouver, BC', avatar: 'S', color: 'bg-green-500' },
  { quote: 'The AI form analysis caught my squat form issue that was causing knee pain. Three weeks in and the pain is gone.', name: 'James R.', role: 'Beta Tester · Toronto, ON', avatar: 'J', color: 'bg-blue-500' },
  { quote: "I've tried MyFitnessPal, Noom, and five others. YFIT is the first one that actually connects everything — nutrition, meds, and workouts in one place.", name: 'Maria T.', role: 'Beta Tester · Calgary, AB', avatar: 'M', color: 'bg-violet-500' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const goToSignup = () => navigate('/signup');
  const goToLogin  = () => navigate('/login');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #e8f5f0 0%, #f0f9ff 50%, #e8f0ff 100%)', backgroundAttachment: 'fixed' }}>

      {/* ── Limited-time banner ── */}
      <div className="w-full py-3 text-center font-semibold text-sm text-white" style={{ background: 'linear-gradient(90deg, #059669, #0ea5e9)' }}>
        🎉 LIMITED TIME OFFER: Get 1 Month FREE on All Pro Plans! 🎉
      </div>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 w-full z-50 border-b" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(5,150,105,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="YFIT AI" className="h-10 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('goals')}    className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">Features</button>
            <button onClick={() => scrollTo('unique')}   className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">What's Different</button>
            <button onClick={() => scrollTo('pricing')}  className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">Pricing</button>
            <button onClick={() => scrollTo('faq')}      className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">Help &amp; FAQ</button>
            <button onClick={goToLogin}  className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Sign In</button>
            <button onClick={goToSignup} className="px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>
              Get Started Free
            </button>
          </div>
          <div className="flex md:hidden gap-3">
            <button onClick={goToLogin}  className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-medium">Sign In</button>
            <button onClick={goToSignup} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)', color: '#059669' }}>
                <Zap className="w-4 h-4" />
                <span>AI-Powered Personalized Fitness</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-gray-900">
                Your Body,<br />
                <span style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Reimagined.
                </span>
              </h1>
              <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
                Experience truly personalized fitness with YFIT. Advanced AI coaching, barcode nutrition scanning, medication tracking with provider reports, and real-time form analysis — all tailored to your unique goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={goToSignup} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)', boxShadow: '0 4px 20px rgba(5,150,105,0.35)' }}>
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => scrollTo('goals')} className="px-8 py-4 rounded-xl text-lg font-semibold border-2 text-emerald-700 hover:bg-emerald-50 transition-colors" style={{ borderColor: 'rgba(5,150,105,0.3)' }}>
                  Explore Features
                </button>
              </div>
              <p className="text-sm text-gray-400">
                📱 No app store needed — works on Android, iPhone &amp; desktop. After signing up, we'll show you how to add it to your home screen in seconds.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.2), rgba(14,165,233,0.2))' }}>
                      {i}K
                    </div>
                  ))}
                </div>
                <p>Join 10,000+ users transforming their lives</p>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 opacity-40 blur-3xl rounded-full" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.3), rgba(14,165,233,0.3))' }} />
              <div className="relative rounded-2xl shadow-2xl border border-white/50 p-8 text-center" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
                <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">YFIT AI Dashboard</h3>
                <p className="text-gray-500 mb-6">Your complete fitness command centre</p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {['Goals', 'Nutrition', 'Fitness', 'AI Coach', 'Progress', 'Medications', 'Tracker', 'Predictions'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Actions / Features ── */}
      <section id="goals" className="py-20" style={{ background: 'linear-gradient(180deg, transparent, rgba(5,150,105,0.05))' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">8 Powerful Tools</h2>
            <p className="text-lg text-gray-500">Everything you need to achieve your fitness goals, powered by AI and built around your unique needs.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <div key={i} className="rounded-2xl p-6 border group hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className={`w-16 h-16 rounded-2xl ${action.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${action.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{action.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What Makes YFIT Different ── */}
      <section id="unique" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">What Makes YFIT Different</h2>
            <p className="text-lg text-gray-500">While other apps focus on basic tracking, YFIT offers features you won't find anywhere else.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="rounded-2xl p-8 border group hover:shadow-xl transition-all" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(14,165,233,0.25)', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="w-16 h-16 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Pill className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Medication Tracking</h3>
              <p className="text-gray-500 mb-4">Integrated health management with provider reports</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Track all medications with dosage schedules</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Automated reminders so you never miss a dose</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Generate PDF reports to share with your doctor</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Monitor how medications affect your fitness goals</span></li>
              </ul>
            </div>
            <div className="rounded-2xl p-8 border group hover:shadow-xl transition-all" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.25)', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Eye className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Form Analysis</h3>
              <p className="text-gray-500 mb-4">AI-powered movement coaching to prevent injury</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Camera-based exercise form detection</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Live posture correction during exercises</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Audio cues for immediate adjustments</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Detailed form reports after each workout</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, rgba(5,150,105,0.05), transparent)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">Complete Fitness Ecosystem</h2>
            <p className="text-lg text-gray-500">Powered by cutting-edge AI to deliver the most personalized fitness experience ever created.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-600', title: 'Barcode Scanner', sub: 'Instant nutrition tracking', desc: 'Simply scan any food barcode with your camera. Our database instantly logs nutritional information and calculates your daily macros.' },
              { icon: Activity,   iconBg: 'bg-blue-500/20',    iconColor: 'text-blue-600',    title: 'Smart AI Coaching', sub: 'Personalized guidance', desc: 'Your personal AI coach adapts to your progress, providing tailored workout plans, nutrition advice, and motivation when you need it most.' },
              { icon: BarChart3,  iconBg: 'bg-purple-500/20',  iconColor: 'text-purple-600',  title: 'Deep Analytics', sub: 'Data-driven progress tracking', desc: 'Visualize your progress with professional-grade analytics. Track muscle recovery, sleep quality, strength trends, and more.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-2xl p-6 border group hover:shadow-xl transition-all" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className={`w-12 h-12 rounded-lg ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{f.sub}</p>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Form Analysis Demo ── */}
      <FormAnalysisShowcase />

      {/* ── Medication Showcase ── */}
      <MedicationShowcase />

      {/* ── Testimonials ── */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, rgba(5,150,105,0.04), transparent)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">What Beta Testers Are Saying</h2>
            <p className="text-lg text-gray-500">Real feedback from the first users to try YFIT AI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="flex gap-1">{[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-sm">★</span>)}</div>
                <p className="text-sm text-gray-500 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">Choose Your Power</h2>
            <p className="text-lg text-gray-500">Unlock your full potential with our flexible pricing plans. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">

            {/* Free */}
            <div className="rounded-2xl p-6 border flex flex-col" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">$0<span className="text-sm font-normal text-gray-400">/mo</span></div>
              <p className="text-sm text-gray-400 mb-4">Essential tracking tools</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                {['Basic Workout Tracking','Manual Meal Logging','3 Saved Routines','5 Barcode Scans/mo','3 Form Analyses/mo','10 AI Coach queries/mo','Predictions preview'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <button onClick={goToSignup} className="w-full py-2.5 rounded-lg border-2 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors" style={{ borderColor: 'rgba(5,150,105,0.4)' }}>
                Get Started
              </button>
            </div>

            {/* 1 Month Free Promo */}
            <div className="rounded-2xl p-6 border flex flex-col relative" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(14,165,233,0.08))', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.4)', boxShadow: '0 4px 20px rgba(5,150,105,0.15)' }}>
              <div className="absolute -top-3 left-0 right-0 text-center">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>🔥 LIMITED OFFER</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 mt-2">1 Month Free</h3>
              <div className="text-3xl font-bold text-emerald-600 mt-2">FREE<span className="text-sm font-normal text-gray-400"> first month</span></div>
              <p className="text-sm text-gray-400 mb-4">Full Pro features, no charge</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                {['All Pro features unlocked','No credit card required','Cancel anytime','Then $12.99/mo after'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <button onClick={goToSignup} className="w-full py-2.5 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                Claim Free Month
              </button>
            </div>

            {/* Pro Monthly */}
            <div className="rounded-2xl p-6 border flex flex-col" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.25)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-xl font-bold text-emerald-600 mb-1">Pro Monthly</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">$12.99<span className="text-sm font-normal text-gray-400">/mo</span></div>
              <p className="text-sm text-gray-400 mb-4">Full AI access</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                {['Unlimited Barcode Scanner','Medication Tracking','Unlimited Form Analysis','Unlimited AI Coaching','Full AI Predictions','Advanced Analytics'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <a href={STRIPE_LINKS.pro_monthly} className="w-full py-2.5 rounded-lg text-white font-semibold text-center hover:opacity-90 transition-opacity block" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>
                Start Free Trial
              </a>
            </div>

            {/* Pro Yearly — BEST VALUE */}
            <div className="rounded-2xl p-6 border flex flex-col relative lg:scale-105 lg:z-10" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(14,165,233,0.5)', boxShadow: '0 8px 32px rgba(14,165,233,0.2)' }}>
              <div className="absolute -top-3 left-0 right-0 text-center">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #0ea5e9, #059669)' }}>BEST VALUE</span>
              </div>
              <h3 className="text-xl font-bold mt-2" style={{ color: '#0ea5e9' }}>Pro Yearly</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">$99.99<span className="text-sm font-normal text-gray-400">/yr</span></div>
              <p className="text-sm text-gray-400 mb-4">Save 35% + 1 month FREE</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                {['All Pro Features','Exclusive Workshops','Early Access Features','Priority Support'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0" style={{ color: '#0ea5e9' }} /> {f}</li>
                ))}
              </ul>
              <a href={STRIPE_LINKS.pro_yearly} className="w-full py-2.5 rounded-lg text-white font-semibold text-center hover:opacity-90 transition-opacity block" style={{ background: 'linear-gradient(135deg, #0ea5e9, #059669)' }}>
                Subscribe Yearly
              </a>
            </div>

            {/* Lifetime */}
            <div className="rounded-2xl p-6 border flex flex-col relative" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.4)', boxShadow: '0 4px 20px rgba(5,150,105,0.12)' }}>
              <div className="absolute -top-3 left-0 right-0 text-center">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>MOST POPULAR</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-600 mb-1 mt-2">Lifetime</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">$249.99<span className="text-sm font-normal text-gray-400">/once</span></div>
              <p className="text-sm text-gray-400 mb-4">Pay once, own forever</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                {['Lifetime Pro Access',"Founder's Badge",'Direct Dev Access','All Future Updates'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <a href={STRIPE_LINKS.pro_lifetime} className="w-full py-2.5 rounded-lg text-white font-semibold text-center hover:opacity-90 transition-opacity block" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)' }}>
                Get Lifetime
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20" style={{ background: 'linear-gradient(180deg, transparent, rgba(5,150,105,0.04))' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">Help &amp; FAQ</h2>
            <p className="text-lg text-gray-500">Everything you need to get started with YFIT AI.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={item.id} className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', borderColor: 'rgba(5,150,105,0.15)' }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:text-emerald-700 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-4" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t" style={{ borderColor: 'rgba(5,150,105,0.1)' }}>
                    {item.jsx ? item.jsx : <p className="whitespace-pre-line pt-3">{item.a}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-gray-900">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl text-gray-500 mb-8">Join thousands of users who are already achieving their health goals with YFIT AI.</p>
          <button onClick={goToSignup} className="px-10 py-4 rounded-xl text-white text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #059669, #0ea5e9)', boxShadow: '0 4px 24px rgba(5,150,105,0.35)' }}>
            Start Your Free Trial Today
          </button>
          <p className="text-sm text-gray-400 mt-4">📱 No download needed · Works on all devices · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t" style={{ borderColor: 'rgba(5,150,105,0.15)', background: 'linear-gradient(180deg, transparent, rgba(5,150,105,0.04))' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <img src="/logo.png" alt="YFIT AI" className="h-8 w-auto" />
            </div>
            <div className="text-sm text-gray-400">© 2025 YFIT AI. All rights reserved.</div>
            <div className="flex gap-6 text-sm">
              <Link to="/legal" className="text-gray-400 hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link to="/legal" className="text-gray-400 hover:text-emerald-600 transition-colors">Terms of Service</Link>
              <a href="mailto:support@yfitai.com" className="text-gray-400 hover:text-emerald-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
