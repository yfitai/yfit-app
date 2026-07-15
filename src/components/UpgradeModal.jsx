/**
 * UpgradeModal
 * 
 * Soft paywall shown when a free user tries to access a Pro feature.
 * Shows what they are missing, the pricing options, and a CTA to upgrade.
 * 
 * Usage:
 *   <UpgradeModal
 *     isOpen={showUpgrade}
 *     onClose={() => setShowUpgrade(false)}
 *     feature="barcode_scanner"
 *     featureLabel="Barcode Scanner"
 *     featureDescription="Instantly log any food by scanning its barcode with your camera."
 *   />
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Zap, Check, Star, Crown, ArrowRight, Lock } from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'

// Stripe Checkout URLs (fallback only — dynamic sessions used when possible)
const STRIPE_LINKS = {
  pro_monthly:  'https://buy.stripe.com/cNi6oGbHBgYD2S5bOZ3sI00',
  pro_yearly:   'https://buy.stripe.com/6oU5kCaDxbEj3W98CN3sI01',
  pro_lifetime: 'https://buy.stripe.com/aFadR8bHB9wbfERdX73sI02',
}

// Map UpgradeModal plan IDs to checkout session plan keys
const PLAN_KEY_MAP = {
  pro_monthly:  'proMonthly',
  pro_yearly:   'proYearly',
  pro_lifetime: 'proLifetime',
}

const PLANS = [
  {
    id:          'pro_monthly',
    label:       'Pro Monthly',
    price:       '$12.99',
    period:      '/month',
    badge:       null,
    badgeColor:  null,
    promo:       '+ 1 Month FREE',
    highlight:   false,
    icon:        Zap,
    iconColor:   'text-blue-500',
    bgColor:     'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id:          'pro_yearly',
    label:       'Pro Yearly',
    price:       '$99.99',
    period:      '/year',
    badge:       'BEST VALUE',
    badgeColor:  'bg-green-500',
    promo:       'Save 35% — $8.33/mo',
    highlight:   true,
    icon:        Star,
    iconColor:   'text-green-500',
    bgColor:     'bg-green-50',
    borderColor: 'border-green-400',
  },
  {
    id:          'pro_lifetime',
    label:       'Pro Lifetime',
    price:       '$249.99',
    period:      ' once',
    badge:       'MOST POPULAR',
    badgeColor:  'bg-purple-600',
    promo:       'Pay once, own forever',
    highlight:   false,
    icon:        Crown,
    iconColor:   'text-purple-600',
    bgColor:     'bg-purple-50',
    borderColor: 'border-purple-200',
  },
]

const PRO_HIGHLIGHTS = [
  'Barcode Scanner — instant food logging',
  'Medication Tracking & Provider Reports',
  'Unlimited Form Analysis (AI coaching)',
  'Advanced Analytics & AI Predictions',
  'Meal Planning & Grocery Lists',
  'Micronutrient Tracking (fiber, sugar, sodium)',
  'Unlimited Saved Routines',
  'Priority Support',
]

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  featureLabel,
  featureDescription,
  usageInfo = null,  // { used, limit } for rate-limited features
}) {
  const { t } = useTranslation()
  const [selectedPlan, setSelectedPlan] = useState('pro_yearly')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // Get the logged-in user's email for prefill
      const user = await getCurrentUser()
      const userEmail = user?.email || null

      // Try dynamic checkout session first (supports email prefill + Canada billing)
      const planKey = PLAN_KEY_MAP[selectedPlan]
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          customerEmail: userEmail,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/#pricing`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
          return
        }
      }
    } catch (err) {
      console.warn('[UpgradeModal] Dynamic checkout failed, falling back to static link:', err)
    } finally {
      setIsLoading(false)
    }

    // Fallback to static Stripe Payment Link
    const url = STRIPE_LINKS[selectedPlan]
    if (url) {
      window.open(url, '_blank')
    } else {
      window.open('https://www.yfitai.com/#pricing', '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-t-2xl p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-white/80 font-medium">{t('subscription.proFeature')}</p>
              <h2 className="text-xl font-bold">{featureLabel || t('subscription.upgradeToPro')}</h2>
            </div>
          </div>

          {featureDescription && (
            <p className="text-white/90 text-sm leading-relaxed">{featureDescription}</p>
          )}

          {/* Usage indicator for rate-limited features */}
          {usageInfo && usageInfo.limit && (
            <div className="mt-3 bg-white/10 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{t('subscription.thisMonth')}</span>
                <span className="font-bold">{usageInfo.used} / {usageInfo.limit} {t('subscription.sessionsUsed')}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(100, (usageInfo.used / usageInfo.limit) * 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-1">{t('subscription.upgradeForUnlimited')}</p>
            </div>
          )}
        </div>

        {/* Pro highlights */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('subscription.everythingInPro')}:</p>
          <div className="grid grid-cols-1 gap-1.5">
            {PRO_HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('subscription.chooseYourPlan')}:</p>
          <div className="space-y-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? `${plan.borderColor} ${plan.bgColor} shadow-sm`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? plan.bgColor : 'bg-gray-100'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? plan.iconColor : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{plan.label}</span>
                          {plan.badge && (
                            <span className={`text-xs text-white px-2 py-0.5 rounded-full font-bold ${plan.badgeColor}`}>
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{plan.promo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{plan.price}</span>
                      <span className="text-xs text-gray-500">{plan.period}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Preparing checkout...
              </>
            ) : (
              <>
                {t('subscription.upgradeToPro')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            {t('subscription.securePaymentStripe')}
          </p>
          <button
            onClick={onClose}
            className="w-full mt-2 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('subscription.continueWithFree')}
          </button>
        </div>
      </div>
    </div>
  )
}
