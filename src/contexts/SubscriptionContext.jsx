/**
 * SubscriptionContext
 * 
 * Single source of truth for the user's plan level and feature access.
 * All components should read from this context instead of checking
 * plan status directly.
 * 
 * Usage:
 *   const { isPro, canUse, checkUsage, incrementUsage } = useSubscription()
 *   if (!canUse('barcode_scanner')) { showUpgradeModal() }
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Plan definitions ────────────────────────────────────────────────────────

export const PLANS = {
  FREE:          'free',
  PRO_MONTHLY:   'pro_monthly',
  PRO_YEARLY:    'pro_yearly',
  PRO_LIFETIME:  'pro_lifetime',
}

export const PLAN_LABELS = {
  free:          'Starter (Free)',
  pro_monthly:   'Pro Monthly',
  pro_yearly:    'Pro Yearly',
  pro_lifetime:  'Pro Lifetime',
}

export const PLAN_PRICES = {
  free:          '$0',
  pro_monthly:   '$12.99/mo',
  pro_yearly:    '$99.99/yr',
  pro_lifetime:  '$249.99 once',
}

// ─── Feature definitions ─────────────────────────────────────────────────────
// true  = available on free plan
// false = Pro only (shows upgrade prompt)
// number = monthly usage limit on free plan (unlimited for Pro)

export const FEATURE_ACCESS = {
  // Tracking
  basic_workout_tracking:   true,
  manual_meal_logging:      true,
  weight_body_metrics:      true,
  barcode_scanner:          5,       // 5 scans/month on free
  micronutrient_tracking:   false,   // Pro only (fiber, sugar, sodium, glucose)

  // AI Features
  form_analysis:            3,       // 3 sessions/month on free
  ai_coach:                 10,      // 10 queries/month on free
  ai_predictions:           false,   // Pro only

  // Planning
  saved_routines:           3,       // 3 max on free
  meal_planning:            false,   // Pro only
  grocery_lists:            false,   // Pro only
  provider_reports:         false,   // Pro only

  // Medications
  medication_tracking:      false,   // Pro only

  // Analytics
  basic_progress_tracking:  true,
  advanced_analytics:       false,   // Pro only
  predictions_forecasts:    false,   // Pro only

  // Support & Perks (informational, not enforced in UI gates)
  priority_support:         false,
  exclusive_workshops:      false,   // Yearly & Lifetime only
  early_access:             false,   // Yearly & Lifetime only
  founders_badge:           false,   // Lifetime only
  direct_dev_access:        false,   // Lifetime only
}

// Features that are Yearly/Lifetime only (not just any Pro)
export const YEARLY_LIFETIME_FEATURES = ['exclusive_workshops', 'early_access']
export const LIFETIME_ONLY_FEATURES   = ['founders_badge', 'direct_dev_access']

// ─── Context ─────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription]   = useState(null)
  const [usage, setUsage]                 = useState({})  // { feature: count }
  const [loading, setLoading]             = useState(true)
  const [userId, setUserId]               = useState(null)

  // ── Derived plan flags ──────────────────────────────────────────────────────
  const planType  = subscription?.plan_type ?? 'free'
  const status    = subscription?.status    ?? 'active'

  // Trial detection: status='trialing' AND trial_end is in the future
  const isTrialing = (
    status === 'trialing' &&
    subscription?.trial_end &&
    new Date(subscription.trial_end) > new Date()
  )

  // Days remaining in trial (null if not trialing)
  const trialDaysRemaining = isTrialing
    ? Math.max(0, Math.ceil(
        (new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24)
      ))
    : null

  // A user is "Pro" if they have an active/trialing/grace_period pro plan
  // OR if they are within their 30-day free trial window
  const isPro = (
    isTrialing ||
    (
      ['pro_monthly', 'pro_yearly', 'pro_lifetime'].includes(planType) &&
      ['active', 'trialing', 'grace_period'].includes(status)
    )
  )

  const isYearlyOrLifetime = (
    ['pro_yearly', 'pro_lifetime'].includes(planType) &&
    ['active', 'trialing', 'grace_period'].includes(status)
  )

  const isLifetime = planType === 'pro_lifetime' && status === 'active'

  // ── Load subscription from Supabase ────────────────────────────────────────
  const loadSubscription = useCallback(async (uid) => {
    if (!uid) { setLoading(false); return }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', uid)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Subscription] Error loading:', error)
    }

    if (data) {
      setSubscription(data)
    } else {
      // No row yet — treat as free (row will be created by DB trigger on next login)
      setSubscription({ user_id: uid, plan_type: 'free', status: 'active' })
    }
    setLoading(false)
  }, [])

  // ── Load monthly usage counts ───────────────────────────────────────────────
  const loadUsage = useCallback(async (uid) => {
    if (!uid) return
    const monthYear = new Date().toISOString().slice(0, 7)  // 'YYYY-MM'

    const { data, error } = await supabase
      .from('feature_usage')
      .select('feature, usage_count')
      .eq('user_id', uid)
      .eq('month_year', monthYear)

    if (error) {
      console.error('[Subscription] Error loading usage:', error)
      return
    }

    const usageMap = {}
    ;(data || []).forEach(row => { usageMap[row.feature] = row.usage_count })
    setUsage(usageMap)
  }, [])

  // ── Auth state listener ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadSubscription(user.id)
        loadUsage(user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        loadSubscription(uid)
        loadUsage(uid)
      } else {
        setSubscription(null)
        setUsage({})
        setLoading(false)
      }
    })

    return () => authSub.unsubscribe()
  }, [loadSubscription, loadUsage])

  // ── canUse: check if a feature is accessible ───────────────────────────────
  // Returns: { allowed: bool, reason: string, limit: number|null, used: number }
  const canUse = useCallback((feature) => {
    const access = FEATURE_ACCESS[feature]

    // Unknown feature — allow by default
    if (access === undefined) return { allowed: true, reason: 'unknown_feature', limit: null, used: 0 }

    // Always available
    if (access === true) return { allowed: true, reason: 'free_feature', limit: null, used: 0 }

    // Pro-only boolean gate
    if (access === false) {
      if (YEARLY_LIFETIME_FEATURES.includes(feature)) {
        return { allowed: isYearlyOrLifetime, reason: isYearlyOrLifetime ? 'ok' : 'requires_yearly_or_lifetime', limit: null, used: 0 }
      }
      if (LIFETIME_ONLY_FEATURES.includes(feature)) {
        return { allowed: isLifetime, reason: isLifetime ? 'ok' : 'requires_lifetime', limit: null, used: 0 }
      }
      return { allowed: isPro, reason: isPro ? 'ok' : 'requires_pro', limit: null, used: 0 }
    }

    // Usage-limited feature (number = free monthly limit)
    if (typeof access === 'number') {
      if (isPro) return { allowed: true, reason: 'pro_unlimited', limit: null, used: usage[feature] ?? 0 }
      const used  = usage[feature] ?? 0
      const limit = access
      return {
        allowed: used < limit,
        reason:  used < limit ? 'within_limit' : 'limit_reached',
        limit,
        used,
      }
    }

    return { allowed: true, reason: 'unknown', limit: null, used: 0 }
  }, [isPro, isYearlyOrLifetime, isLifetime, usage])

  // ── checkUsage: get current usage for a feature ────────────────────────────
  const checkUsage = useCallback((feature) => {
    const access = FEATURE_ACCESS[feature]
    const used   = usage[feature] ?? 0
    const limit  = typeof access === 'number' ? access : null
    return { used, limit, remaining: limit !== null ? Math.max(0, limit - used) : null }
  }, [usage])

  // ── incrementUsage: record a feature use ───────────────────────────────────
  const incrementUsage = useCallback(async (feature) => {
    if (!userId) return
    const monthYear = new Date().toISOString().slice(0, 7)

    const { data, error } = await supabase.rpc('increment_feature_usage', {
      p_user_id: userId,
      p_feature: feature,
    })

    if (error) {
      console.error('[Subscription] Error incrementing usage:', error)
      // Fallback: update local state optimistically
      setUsage(prev => ({ ...prev, [feature]: (prev[feature] ?? 0) + 1 }))
      return
    }

    setUsage(prev => ({ ...prev, [feature]: data }))
  }, [userId])

  // ── refreshSubscription: call after Stripe checkout completes ──────────────
  const refreshSubscription = useCallback(() => {
    if (userId) {
      loadSubscription(userId)
      loadUsage(userId)
    }
  }, [userId, loadSubscription, loadUsage])

  const value = {
    // Plan state
    subscription,
    planType,
    status,
    loading,

    // Convenience flags
    isPro,
    isTrialing,
    trialDaysRemaining,
    isYearlyOrLifetime,
    isLifetime,
    isFree: !isPro,

    // Feature access
    canUse,
    checkUsage,
    incrementUsage,
    refreshSubscription,

    // Usage data
    usage,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

export default SubscriptionContext
