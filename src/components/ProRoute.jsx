/**
 * ProRoute
 * 
 * Route guard that handles two types of feature gating:
 * 
 * 1. Fully Pro-only (access === false in FEATURE_ACCESS):
 *    Free users see a soft paywall page with upgrade CTA.
 * 
 * 2. Usage-limited (access === number in FEATURE_ACCESS):
 *    Free users can access the feature but see a usage counter banner.
 *    When the monthly limit is reached, they see an upgrade prompt.
 * 
 * Usage in App.jsx:
 *   <Route path="/medications" element={
 *     <ProRoute feature="medication_tracking" featureLabel="Medication Tracking">
 *       <Medications user={user} />
 *     </ProRoute>
 *   } />
 */

import { useState } from 'react'
import { useSubscription, FEATURE_ACCESS } from '../contexts/SubscriptionContext'
import UpgradeModal from './UpgradeModal'
import { Lock, ArrowRight, Zap, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const FEATURE_DESCRIPTIONS = {
  medication_tracking:   'Track your medications, supplements, and dosages. Get conflict warnings and generate provider-ready PDF reports.',
  ai_predictions:        'Get AI-powered predictions for injury risk, performance trends, habit streaks, and goal achievement timelines based on your real data.',
  meal_planning:         'Plan your meals for the week, build grocery lists, and save nutrition templates for easy reuse.',
  provider_reports:      'Generate professional PDF health reports to share with your doctor, trainer, or nutritionist.',
  advanced_analytics:    'Deep-dive analytics for your workouts, nutrition, and body composition with trend charts and insights.',
  barcode_scanner:       'Instantly log any packaged food by scanning its barcode. Macros and serving sizes are pulled automatically from the label.',
  form_analysis:         'Upload a workout video and get AI-powered form feedback, rep counts, and injury risk analysis.',
  ai_coach:              'Chat with your personal AI fitness coach for workout plans, nutrition advice, and motivation.',
}

export default function ProRoute({ children, feature, featureLabel, featureDescription }) {
  const { isPro, loading, canUse, checkUsage } = useSubscription()
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Pro users always get full access
  if (isPro) return children

  const access = FEATURE_ACCESS[feature]
  const description = featureDescription || FEATURE_DESCRIPTIONS[feature] || `${featureLabel} is a Pro feature.`

  // ── Usage-limited feature ──────────────────────────────────────────────────
  // Free users can access but are shown a usage counter and blocked when limit reached
  if (typeof access === 'number') {
    const { allowed, used, limit } = canUse(feature)
    const { remaining } = checkUsage(feature)

    if (!allowed) {
      // Limit reached — show upgrade prompt
      return (
        <>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">{featureLabel} — Monthly Limit Reached</h1>
              <p className="text-gray-600 mb-2 leading-relaxed">
                You have used all <strong>{limit}</strong> of your free {featureLabel} sessions this month.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Your limit resets on the 1st of next month, or upgrade to Pro for unlimited access.
              </p>

              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-gray-800 text-sm">Upgrade for unlimited access</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    Unlimited {featureLabel}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    Unlimited Barcode Scanner & AI Coach
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    Medication Tracking & Provider Reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    AI Predictions & Advanced Analytics
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
              >
                Upgrade to Pro — $12.99/mo
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate(-1)}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Go back
              </button>

              <p className="text-xs text-gray-400 mt-2">
                Cancel anytime · 30-day money-back guarantee
              </p>
            </div>
          </div>

          <UpgradeModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            feature={feature}
            featureLabel={featureLabel}
            featureDescription={description}
          />
        </>
      )
    }

    // Within limit — show children with a usage counter banner at the top
    return (
      <>
        {/* Usage counter banner */}
        <div className={`px-4 py-2 text-sm font-medium text-center ${
          remaining <= 1
            ? 'bg-orange-100 text-orange-800 border-b border-orange-200'
            : 'bg-blue-50 text-blue-700 border-b border-blue-100'
        }`}>
          {remaining <= 1 ? '⚠️ ' : ''}
          <strong>{used}</strong> of <strong>{limit}</strong> free {featureLabel} sessions used this month
          {remaining <= 1 && (
            <button
              onClick={() => setShowModal(true)}
              className="ml-3 underline font-semibold hover:no-underline"
            >
              Upgrade for unlimited
            </button>
          )}
        </div>

        {children}

        <UpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          featureLabel={featureLabel}
          featureDescription={description}
        />
      </>
    )
  }

  // ── Fully Pro-only feature ─────────────────────────────────────────────────
  return (
    <>
      {/* Soft paywall page — shows what the feature looks like but locked */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Lock icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{featureLabel}</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

          {/* What you get */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-800 text-sm">Unlock with Pro</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                Unlimited Barcode Scanner — instant food logging
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                Medication Tracking &amp; Provider Reports
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                Unlimited Form Analysis &amp; AI Coaching
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                Advanced Analytics &amp; AI Predictions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                Meal Planning &amp; Grocery Lists
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            Upgrade to Pro
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Starting at $12.99/month · Cancel anytime · 30-day money-back guarantee
          </p>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        featureLabel={featureLabel}
        featureDescription={description}
      />
    </>
  )
}
