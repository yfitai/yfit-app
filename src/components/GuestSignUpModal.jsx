/**
 * GuestSignUpModal
 * ────────────────
 * Contextual sign-up prompt that fires when a guest visitor tries to
 * take a real action (log a meal, save a workout, etc.).
 *
 * The headline and sub-copy are personalised based on the action trigger
 * so the modal feels relevant rather than generic.
 *
 * Props:
 *   isOpen      — boolean
 *   onClose     — callback to close the modal
 *   onSignUp    — callback to navigate to /signup
 *   onLogin     — callback to navigate to /login
 *   trigger     — string key from GUEST_TRIGGER_MESSAGES (optional)
 */
import { useEffect } from 'react'
import { GUEST_TRIGGER_MESSAGES } from '../lib/guestSession'

export default function GuestSignUpModal({ isOpen, onClose, onSignUp, onLogin, trigger }) {
  const msg = GUEST_TRIGGER_MESSAGES[trigger] || GUEST_TRIGGER_MESSAGES.default

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9998,
        }}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: '#fff',
          borderRadius: '16px',
          padding: '32px 28px 28px',
          maxWidth: '420px',
          width: 'calc(100% - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#999',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>

        {/* Headline */}
        <h2
          id="guest-modal-title"
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#111',
            margin: '0 0 10px',
            lineHeight: 1.3,
          }}
        >
          {msg.headline}
        </h2>

        {/* Sub-copy */}
        <p style={{ fontSize: '15px', color: '#555', margin: '0 0 20px', lineHeight: 1.5 }}>
          {msg.sub}
        </p>

        {/* Offer badge */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#166534',
            fontWeight: 600,
          }}
        >
          🎁 Free plan + <strong>1 month Premium free</strong> — no credit card needed
        </div>

        {/* Primary CTA */}
        <button
          onClick={onSignUp}
          style={{
            display: 'block',
            width: '100%',
            background: 'linear-gradient(135deg, #1a7f4b, #0d5c35)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          Create Free Account →
        </button>

        {/* Secondary: already have an account */}
        <button
          onClick={onLogin}
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            color: '#1a7f4b',
            border: '1.5px solid #1a7f4b',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '14px',
          }}
        >
          I already have an account
        </button>

        {/* Keep exploring link */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Continue exploring demo
        </button>
      </div>
    </>
  )
}
