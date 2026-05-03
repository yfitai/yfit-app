import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * InstallGuide — shown once to new users after signup.
 * Detects Android / iPhone / desktop and shows the correct
 * "Add to Home Screen" steps for that device.
 * Ends with a clear call-to-action to go back and sign in.
 *
 * Props:
 *   user       — Supabase user object
 *   onComplete — callback to call when user dismisses the guide
 */

function detectDevice() {
  const ua = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  // Check if already running as installed PWA
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  return { isIOS, isAndroid, isStandalone }
}

const STEPS = {
  android: [
    {
      icon: '1️⃣',
      title: 'Open Chrome',
      detail: 'Make sure you are using Google Chrome (not Samsung Internet or another browser).',
    },
    {
      icon: '2️⃣',
      title: 'Tap the menu',
      detail: 'Tap the three-dot menu (⋮) in the top-right corner of Chrome.',
    },
    {
      icon: '3️⃣',
      title: 'Add to Home screen',
      detail: 'Tap "Add to Home screen" and then tap "Add" to confirm.',
    },
    {
      icon: '4️⃣',
      title: 'Open from your home screen',
      detail: 'Find the YFIT AI icon on your home screen and tap it. The app opens full-screen, just like a native app.',
    },
    {
      icon: '5️⃣',
      title: 'Sign in to get started',
      detail: 'Once the app opens, tap "Sign In", enter your email and password, and you\'re in!',
    },
  ],
  ios: [
    {
      icon: '1️⃣',
      title: 'Open Safari',
      detail: 'Make sure you are using Safari — Chrome on iPhone cannot add apps to the home screen.',
    },
    {
      icon: '2️⃣',
      title: 'Tap the Share button',
      detail: 'Tap the Share icon (a box with an arrow pointing up) at the bottom of the screen.',
    },
    {
      icon: '3️⃣',
      title: 'Add to Home Screen',
      detail: 'Scroll down in the share sheet and tap "Add to Home Screen", then tap "Add".',
    },
    {
      icon: '4️⃣',
      title: 'Open from your home screen',
      detail: 'Find the YFIT AI icon on your home screen and tap it. The app opens full-screen without the Safari browser bar.',
    },
    {
      icon: '5️⃣',
      title: 'Sign in to get started',
      detail: 'Once the app opens, tap "Sign In", enter your email and password, and you\'re in!',
    },
  ],
  desktop: [
    {
      icon: '1️⃣',
      title: 'Look for the install icon',
      detail: 'In Chrome or Edge, look for a small install icon (⊕) in the address bar on the right side.',
    },
    {
      icon: '2️⃣',
      title: 'Click Install',
      detail: 'Click the icon and then click "Install" in the popup. YFIT AI will open in its own window.',
    },
    {
      icon: '3️⃣',
      title: 'Find it in your taskbar',
      detail: 'The app is now pinned to your taskbar or Start menu. Open it any time without a browser.',
    },
    {
      icon: '4️⃣',
      title: 'Sign in to get started',
      detail: 'When the app opens, click "Sign In", enter your email and password, and you\'re all set!',
    },
  ],
}

export default function InstallGuide({ user, onComplete }) {
  const { isIOS, isAndroid, isStandalone } = detectDevice()
  const [dismissed, setDismissed] = useState(false)
  const [saving, setSaving] = useState(false)

  // If already running as installed PWA, skip the guide immediately
  useEffect(() => {
    if (isStandalone) {
      markShownAndComplete()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markShownAndComplete = async () => {
    if (saving) return
    setSaving(true)
    try {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        install_guide_shown: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } catch {
      // Non-critical — if this fails the guide will show again next login, which is fine
    }
    setSaving(false)
    setDismissed(true)
    onComplete()
  }

  if (dismissed) return null

  const deviceType = isAndroid ? 'android' : isIOS ? 'ios' : 'desktop'
  const steps = STEPS[deviceType]

  const deviceLabel = isAndroid
    ? 'Android'
    : isIOS
    ? 'iPhone / iPad'
    : 'Desktop'

  const deviceEmoji = isAndroid ? '🤖' : isIOS ? '🍎' : '💻'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-md">
            <img src="/icon-192x192.png" alt="YFIT AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add YFIT AI to your home screen</h1>
          <p className="mt-2 text-gray-500 text-sm">
            YFIT AI is a web app — no app store needed. Add it to your home screen for the best experience.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <span>{deviceEmoji}</span>
            <span>Detected: {deviceLabel}</span>
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-4 mb-6">
          {steps.map((step, i) => (
            <li key={i} className={`flex gap-3 items-start ${i === steps.length - 1 ? 'bg-green-50 border border-green-200 rounded-xl p-3 -mx-1' : ''}`}>
              <span className="text-xl leading-none mt-0.5 flex-shrink-0">{step.icon}</span>
              <div>
                <p className={`font-semibold text-sm ${i === steps.length - 1 ? 'text-green-800' : 'text-gray-800'}`}>{step.title}</p>
                <p className={`text-sm mt-0.5 ${i === steps.length - 1 ? 'text-green-700' : 'text-gray-500'}`}>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Samsung note */}
        {isAndroid && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-800">
            <strong>Samsung device?</strong> The icon may appear square — this is normal on Samsung phones. All icons on Samsung use the same square shape set by the launcher.
          </div>
        )}

        {/* iOS Safari note */}
        {isIOS && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-xs text-blue-800">
            <strong>Important:</strong> This only works in <strong>Safari</strong>. If you are in Chrome on iPhone, copy the URL and open it in Safari first.
          </div>
        )}

        {/* CTA buttons */}
        <div className="space-y-3">
          <button
            onClick={markShownAndComplete}
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving...' : "Got it — take me to sign in ✓"}
          </button>
          <button
            onClick={markShownAndComplete}
            disabled={saving}
            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
