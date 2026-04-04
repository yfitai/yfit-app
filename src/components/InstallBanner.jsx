import { useState, useEffect } from 'react';

/**
 * InstallBanner - PWA install prompt for iOS and Android
 *
 * iOS: Shows a "Add to Home Screen" instruction banner (Safari doesn't allow
 *      automatic install prompts, so we guide users manually)
 *
 * Android: Catches the browser's `beforeinstallprompt` event and shows a
 *          native-style install button that triggers the real install dialog
 *
 * Dismissal is remembered in localStorage so the banner doesn't re-appear
 * on every visit. It reappears after 30 days to catch users who dismissed it.
 */

const DISMISS_KEY = 'yfit_install_banner_dismissed';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function recordDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export default function InstallBanner() {
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isInStandaloneMode()) return;

    // Don't show if recently dismissed
    if (wasDismissedRecently()) return;

    // iOS detection — show manual instruction banner
    if (isIOS()) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShowIOSBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome — listen for the install prompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault(); // Prevent the mini-infobar from appearing
      setDeferredPrompt(e);
      setShowAndroidBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowIOSBanner(false);
    setShowAndroidBanner(false);
    recordDismissal();
  };

  // ── iOS Banner ──────────────────────────────────────────────────────────────
  if (showIOSBanner) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderTop: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '16px 20px 24px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <img
            src="/icon-76x76.png"
            alt="YFIT AI"
            style={{ width: '44px', height: '44px', borderRadius: '10px' }}
          />
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '15px' }}>
              Install YFIT AI
            </div>
            <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '500' }}>
              Add to your Home Screen for the best experience
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Step number="1" text="Tap the Share button" icon="⬆️" detail="at the bottom of your Safari browser" />
          <Step number="2" text="Scroll down and tap" icon="➕" detail='"Add to Home Screen"' />
          <Step number="3" text="Tap" icon="✅" detail='"Add" — YFIT AI will appear on your home screen!' />
        </div>

        {/* Arrow pointing down to Safari toolbar */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '10px',
            color: '#64748b',
            fontSize: '12px',
          }}
        >
          ↓ Look for the Share icon in your Safari toolbar below
        </div>
      </div>
    );
  }

  // ── Android Banner ──────────────────────────────────────────────────────────
  if (showAndroidBanner) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <img
          src="/icon-76x76.png"
          alt="YFIT AI"
          style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '15px' }}>
            Install YFIT AI
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
            Add to home screen for quick access
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Later
          </button>
          <button
            onClick={handleAndroidInstall}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
            }}
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Helper component for iOS step instructions
function Step({ number, text, icon, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div
        style={{
          background: '#10b981',
          color: '#fff',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {number}
      </div>
      <div>
        <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>
          {text}{' '}
        </span>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginTop: '1px' }}>
          {detail}
        </span>
      </div>
    </div>
  );
}
