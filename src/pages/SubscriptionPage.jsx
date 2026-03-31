/**
 * SubscriptionPage
 * 
 * Shows the user's current plan, trial status, monthly usage meters,
 * and upgrade options. Accessible from the app menu/profile.
 */

import { useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import UpgradeModal from '../components/UpgradeModal'
import {
  Crown, Zap, Star, Check, Lock, BarChart3, Dumbbell,
  Scan, Brain, Pill, FileText, ChevronRight, AlertCircle,
  Calendar, RefreshCw
} from 'lucide-react'

const STRIPE_LINKS = {
  pro_monthly:  'https://buy.stripe.com/cNi6oGbHBgYD2S5bOZ3sI00',
  pro_yearly:   'https://buy.stripe.com/6oU5kCaDxbEj3W98CN3sI01',
  pro_lifetime: 'https://buy.stripe.com/aFadR8bHB9wbfERdX73sI02',
}

const FEATURE_ROWS = [
  { label: 'Workout & Nutrition Logging',  free: 'Unlimited',  pro: 'Unlimited',   icon: Dumbbell },
  { label: 'Progress & Body Recomp',       free: 'Unlimited',  pro: 'Unlimited',   icon: BarChart3 },
  { label: 'Barcode Scanner',              free: '5 / month',  pro: 'Unlimited',   icon: Scan },
  { label: 'AI Form Analysis',             free: '3 / month',  pro: 'Unlimited',   icon: Brain },
  { label: 'AI Coach',                     free: '10 / month', pro: 'Unlimited',   icon: Brain },
  { label: 'AI Predictions',              free: 'Preview only',pro: 'Full access', icon: BarChart3 },
  { label: 'Medication Tracking',          free: '—',          pro: 'Full access', icon: Pill },
  { label: 'Provider Reports (PDF)',       free: '—',          pro: 'Full access', icon: FileText },
  { label: 'Meal Planning',               free: '—',          pro: 'Full access', icon: Calendar },
  { label: 'Saved Routines',              free: '3 max',       pro: 'Unlimited',   icon: Dumbbell },
]

function UsageMeter({ label, used, limit, icon: Icon }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const isWarning = pct >= 80
  const isExhausted = pct >= 100

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isExhausted ? 'bg-red-100' : isWarning ? 'bg-orange-100' : 'bg-blue-50'
      }`}>
        <Icon className={`w-4 h-4 ${
          isExhausted ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
          <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${
            isExhausted ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-500'
          }`}>
            {used} / {limit}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isExhausted ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage({ user }) {
  const {
    isPro, isTrialing, trialDaysRemaining, loading,
    planLabel, checkUsage
  } = useSubscription()

  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro_yearly')

  const formUsage    = checkUsage('form_analysis')
  const aiUsage      = checkUsage('ai_coach')
  const barcodeUsage = checkUsage('barcode_scanner')

  const handleUpgrade = (planId) => {
    const url = STRIPE_LINKS[planId]
    if (url) window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

      {/* Current Plan Card */}
      <div className={`rounded-2xl p-5 mb-6 text-white shadow-lg ${
        isPro && !isTrialing
          ? 'bg-gradient-to-br from-blue-600 to-purple-700'
          : isTrialing
            ? 'bg-gradient-to-br from-green-500 to-teal-600'
            : 'bg-gradient-to-br from-gray-600 to-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {isPro && !isTrialing ? (
                <Crown className="w-5 h-5" />
              ) : isTrialing ? (
                <Star className="w-5 h-5" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Current Plan</p>
              <h2 className="text-xl font-bold">{planLabel}</h2>
            </div>
          </div>
          {(isPro || isTrialing) && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
              ACTIVE
            </div>
          )}
        </div>

        {isTrialing && (
          <div className="bg-white/15 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {trialDaysRemaining > 0
                  ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left in your free trial`
                  : 'Your free trial ends today'}
              </p>
              <p className="text-white/80 text-xs mt-0.5">
                Subscribe before it ends to keep full Pro access
              </p>
            </div>
          </div>
        )}

        {!isPro && !isTrialing && (
          <p className="text-white/80 text-sm">
            Upgrade to unlock unlimited access to all Pro features.
          </p>
        )}
      </div>

      {/* Usage Meters — only shown to free/trial users */}
      {(!isPro || isTrialing) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">This Month's Usage</h3>
          <p className="text-xs text-gray-500 mb-4">Resets on the 1st of each month</p>
          <UsageMeter
            label="AI Form Analysis"
            used={formUsage.used}
            limit={formUsage.limit}
            icon={Brain}
          />
          <UsageMeter
            label="AI Coach"
            used={aiUsage.used}
            limit={aiUsage.limit}
            icon={Brain}
          />
          <UsageMeter
            label="Barcode Scanner"
            used={barcodeUsage.used}
            limit={barcodeUsage.limit}
            icon={Scan}
          />
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-500 font-medium w-1/2">Feature</th>
                <th className="text-center pb-2 text-gray-500 font-medium w-1/4">Free</th>
                <th className="text-center pb-2 text-blue-600 font-bold w-1/4">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => {
                const Icon = row.icon
                return (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{row.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center text-gray-500 text-xs">{row.free}</td>
                    <td className="py-2.5 text-center">
                      <span className="text-blue-600 font-semibold text-xs">{row.pro}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Plans — only shown to non-Pro users */}
      {(!isPro || isTrialing) && (
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-800">Choose a Plan</h3>

          {/* Pro Monthly */}
          <button
            onClick={() => handleUpgrade('pro_monthly')}
            className="w-full text-left bg-white rounded-xl border-2 border-blue-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pro Monthly</p>
                  <p className="text-xs text-green-600 font-medium">+ 1 Month FREE trial</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-bold text-gray-900">$12.99</p>
                  <p className="text-xs text-gray-500">/month</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          {/* Pro Yearly — highlighted */}
          <button
            onClick={() => handleUpgrade('pro_yearly')}
            className="w-full text-left bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-400 p-4 hover:border-green-500 hover:shadow-sm transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              BEST VALUE
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pro Yearly</p>
                  <p className="text-xs text-green-700 font-medium">Save 35% — only $8.33/mo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-bold text-gray-900">$99.99</p>
                  <p className="text-xs text-gray-500">/year</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          {/* Pro Lifetime */}
          <button
            onClick={() => handleUpgrade('pro_lifetime')}
            className="w-full text-left bg-white rounded-xl border-2 border-purple-200 p-4 hover:border-purple-400 hover:shadow-sm transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              MOST POPULAR
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pro Lifetime</p>
                  <p className="text-xs text-purple-700 font-medium">Pay once, own forever</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-bold text-gray-900">$249.99</p>
                  <p className="text-xs text-gray-500">one-time</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            Secure payment via Stripe · Cancel anytime · 30-day money-back guarantee
          </p>
        </div>
      )}

      {/* Pro users — manage billing */}
      {isPro && !isTrialing && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Manage Subscription</h3>
          <a
            href="https://billing.stripe.com/p/login/test_00000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Manage billing &amp; invoices</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
          <p className="text-xs text-gray-400 mt-3 text-center">
            To cancel or change your plan, visit the Stripe billing portal above.
          </p>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="general"
        featureLabel="Upgrade to Pro"
      />
    </div>
  )
}
