/**
 * YFIT Guest / Demo Mode
 * ─────────────────────
 * Allows unauthenticated visitors (arriving from social media via /go?mode=guest)
 * to browse a fully pre-populated demo version of the app before signing up.
 *
 * Design principles:
 *  - Zero backend calls in guest mode — all data comes from demoData.js
 *  - Guest state lives in sessionStorage (cleared when tab closes)
 *  - A persistent "GUEST MODE" banner reminds visitors they are in demo mode
 *  - Contextual sign-up prompts fire when a visitor tries to take a real action
 *  - The free plan + 1-month Premium offer is surfaced on every prompt
 */

const GUEST_KEY = 'yfit_guest_session'
const GUEST_TRIGGER_KEY = 'yfit_guest_trigger'

// ─── Session management ───────────────────────────────────────────────────────

/**
 * Start a guest session. Called when ?mode=guest is detected in the URL.
 * Stores a lightweight session object in sessionStorage.
 */
export function initGuestSession() {
  const session = {
    startedAt: Date.now(),
    // Synthetic "user" object that mirrors the shape pages expect
    user: {
      id: 'guest',
      email: 'guest@demo.yfitai.com',
      user_metadata: {
        full_name: 'Alex (Demo)',
        avatar_url: null,
      },
    },
  }
  sessionStorage.setItem(GUEST_KEY, JSON.stringify(session))
}

/**
 * Returns true if the visitor is currently in guest/demo mode.
 */
export function isGuestSession() {
  return sessionStorage.getItem(GUEST_KEY) !== null
}

/**
 * Returns the synthetic guest user object, or null if not in guest mode.
 */
export function getGuestUser() {
  const raw = sessionStorage.getItem(GUEST_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).user
  } catch {
    return null
  }
}

/**
 * Ends the guest session (called when the visitor signs up / logs in).
 */
export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_KEY)
  sessionStorage.removeItem(GUEST_TRIGGER_KEY)
}

// ─── Trigger tracking ─────────────────────────────────────────────────────────

/**
 * Records what action the guest was attempting when the sign-up modal fired.
 * Used to personalise the modal copy ("Save your workout → create a free account").
 *
 * @param {string} trigger  e.g. 'log_meal', 'save_workout', 'track_medication'
 * @param {string} [label]  Human-readable label for the modal headline
 */
export function setGuestTrigger(trigger, label = '') {
  sessionStorage.setItem(GUEST_TRIGGER_KEY, JSON.stringify({ trigger, label }))
}

/**
 * Returns the last recorded guest trigger, or null.
 */
export function getGuestTrigger() {
  const raw = sessionStorage.getItem(GUEST_TRIGGER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ─── Contextual trigger messages ─────────────────────────────────────────────

/**
 * Maps action triggers to personalised sign-up modal headlines and sub-copy.
 * Import this map in GuestSignUpModal to render contextual messaging.
 */
export const GUEST_TRIGGER_MESSAGES = {
  log_meal: {
    headline: 'Log your real meals',
    sub: 'Create a free account to start tracking your nutrition and hit your calorie goals.',
  },
  save_workout: {
    headline: 'Save your workout',
    sub: 'Create a free account to track your sets, reps, and progressive overload over time.',
  },
  track_medication: {
    headline: 'Track your medications',
    sub: 'Create a free account to log your prescriptions and get personalised safety alerts.',
  },
  log_water: {
    headline: 'Track your daily habits',
    sub: 'Create a free account to log water, sleep, mood, and steps — and build real streaks.',
  },
  save_progress: {
    headline: 'Save your progress photos',
    sub: 'Create a free account to store before/after photos and watch your transformation.',
  },
  set_goal: {
    headline: 'Set your fitness goal',
    sub: 'Create a free account to get a personalised calorie target and body analysis.',
  },
  ask_ai: {
    headline: 'Chat with your AI coach',
    sub: 'Create a free account to ask your AI coach anything — it knows your goals and history.',
  },
  view_predictions: {
    headline: 'See your future progress',
    sub: 'Create a free account to unlock AI predictions for your weight and strength milestones.',
  },
  default: {
    headline: 'You\'re exploring in demo mode',
    sub: 'Create a free account to save your data and start your real fitness journey.',
  },
}
