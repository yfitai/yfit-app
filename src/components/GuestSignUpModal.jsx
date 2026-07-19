/**
 * GuestSignUpModal
 * ────────────────
 * Contextual sign-up prompt that fires when a guest visitor tries to
 * take a real action (log a meal, save a workout, etc.).
 *
 * Includes Google sign-in via Supabase OAuth as the primary CTA.
 */
import { useEffect } from 'react'
import { GUEST_TRIGGER_MESSAGES } from '../lib/guestSession'
import { supabase } from '../lib/supabase'

export default function GuestSignUpModal({ isOpen, onClose, onSignUp, onLogin, trigger }) {
  const msg = GUEST_TRIGGER_MESSAGES[trigger] || GUEST_TRIGGER_MESSAGES.default

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
        console.error('Google sign-in error:', error)
        onSignUp()
      }
    } catch (err) {
      console.error('Google sign-in failed:', err)
      onSignUp()
    }
  }

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
        <p style={{ fontSize: '15px', color: '#555', margin: '0 0 16px', lineHeight: 1.5 }}>
          {msg.sub}
        </p>

        {/* Offer badge */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#166534',
            fontWeight: 600,
          }}
        >
          🎁 Free plan + <strong>1 month Premium free</strong> — no credit card needed
        </div>

        {/* Google Sign-In — primary CTA */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            background: '#fff',
            color: '#3c4043',
            border: '1.5px solid #dadce0',
            borderRadius: '10px',
            padding: '13px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
        >
          {/* Google G logo SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        {/* Email sign-up */}
        <button
          onClick={onSignUp}
          style={{
            display: 'block',
            width: '100%',
            background: 'linear-gradient(135deg, #1a7f4b, #0d5c35)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '13px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          Sign up with Email →
        </button>

        {/* Already have account */}
        <button
          onClick={onLogin}
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            color: '#1a7f4b',
            border: '1.5px solid #1a7f4b',
            borderRadius: '10px',
            padding: '11px',
            fontSize: '14px',
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
