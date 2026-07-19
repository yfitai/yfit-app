/**
 * useGuestAction
 * ──────────────
 * Hook used inside page components to intercept actions that require a
 * real account. When the visitor is in guest mode, calling `requireAccount`
 * fires the sign-up modal instead of executing the action.
 *
 * Usage:
 *   const { requireAccount } = useGuestAction()
 *
 *   // In a button handler:
 *   const handleLogMeal = () => {
 *     requireAccount('log_meal', () => {
 *       // This only runs for real users
 *       saveMealToSupabase(meal)
 *     })
 *   }
 */
import { useCallback } from 'react'
import { isGuestSession, setGuestTrigger } from '../lib/guestSession'

/**
 * @param {Function} openModal  — function to open the GuestSignUpModal,
 *                                provided by the parent App or context
 */
export function useGuestAction(openModal) {
  /**
   * @param {string}   trigger   — key from GUEST_TRIGGER_MESSAGES
   * @param {Function} [action]  — the real action to run for authenticated users
   */
  const requireAccount = useCallback(
    (trigger, action) => {
      if (isGuestSession()) {
        setGuestTrigger(trigger)
        if (typeof openModal === 'function') openModal(trigger)
        return // block the action
      }
      if (typeof action === 'function') action()
    },
    [openModal]
  )

  return { requireAccount, isGuest: isGuestSession() }
}
