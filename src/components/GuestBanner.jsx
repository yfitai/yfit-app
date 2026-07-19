/**
 * GuestBanner
 * ───────────
 * Sticky banner shown at the top of every page when the visitor is in
 * guest/demo mode. Reminds them they are exploring demo data and offers
 * a clear path to sign up with the free + 1-month Premium offer.
 *
 * Props:
 *   onSignUp  — callback to open the sign-up modal / navigate to /signup
 */
import { useState } from 'react'

export default function GuestBanner({ onSignUp }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(90deg, #1a7f4b 0%, #0d5c35 100%)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: label + message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          DEMO MODE
        </span>
        <span style={{ opacity: 0.92 }}>
          You&apos;re exploring with sample data.{' '}
          <strong>Free plan + 1 month Premium free</strong> when you sign up today.
        </span>
      </div>

      {/* Right: CTA + dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onSignUp}
          style={{
            background: '#fff',
            color: '#1a7f4b',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Start Free →
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '18px',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
