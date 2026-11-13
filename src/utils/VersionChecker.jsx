import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LiveUpdateService } from '../services/liveUpdate';
import { readReleaseManifest } from '../services/liveUpdateCore';

const VERSION_CHECK_INTERVAL = 60000;
const CURRENT_VERSION_KEY = 'app_version_timestamp';
const bannerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '12px 16px',
  textAlign: 'center',
  zIndex: 10000,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  fontWeight: 600,
  fontSize: '14px'
};

// This identifies the executing HTML, not a downloaded ZIP or native directory ID.
const readExecutingBuild = () => {
  const value = document.querySelector('meta[name="yfit-build-number"]')?.content;
  if (!value || !/^\d+$/.test(value)) return null;
  const build = Number(value);
  return Number.isSafeInteger(build) && build > 0 ? build : null;
};

const NativeVersionChecker = () => {
  const [executingBuild] = useState(readExecutingBuild);
  const [release, setRelease] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const applying = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    let appStateListener;
    const checkVersion = async () => {
      try {
        // Metadata only: fetching/staging the archive belongs to LiveUpdateService.
        const manifest = await readReleaseManifest();
        if (!disposed) setRelease(manifest);
      } catch (error) {
        console.error('Native version check error:', error);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && !disposed) checkVersion();
    }).then(listener => {
      // The registration promise can resolve after the component has unmounted.
      if (disposed) listener.remove();
      else appStateListener = listener;
    }).catch(error => {
      console.error('Native version listener error:', error);
    });

    return () => {
      disposed = true;
      mounted.current = false;
      clearInterval(interval);
      if (appStateListener) appStateListener.remove();
    };
  }, []);

  const updateAvailable = executingBuild !== null && release?.buildNumber > executingBuild;
  const handleUpdate = async () => {
    if (!updateAvailable || applying.current) return;
    applying.current = true;
    setUpdating(true);
    setUpdateError(null);
    try {
      const applied = await LiveUpdateService.applyUpdate();
      if (applied !== true) throw new Error('Native update was not applied');
      // The service reloads only after successful staging. Never advance this
      // page's build badge or installed-version storage before new HTML executes.
    } catch {
      if (mounted.current) setUpdateError('Unable to apply update. Please try again.');
    } finally {
      applying.current = false;
      if (mounted.current) setUpdating(false);
    }
  };

  return (
    <>
      <span
        aria-label={`Loaded app build ${executingBuild ?? 'unknown'}`}
        title="Build from the currently loaded HTML"
        style={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          zIndex: 9999,
          background: 'rgba(17,24,39,0.75)',
          color: 'white',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: '10px',
          pointerEvents: 'none'
        }}
      >
        Build {executingBuild ?? 'unknown'}
      </span>
      {updateAvailable && (
        <div style={bannerStyle}>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            style={{
              background: 'transparent',
              border: 0,
              color: 'inherit',
              font: 'inherit',
              cursor: updating ? 'wait' : 'pointer',
              width: '100%'
            }}
          >
            {updating ? 'Updating…' : `Build ${release.buildNumber} available! Tap to update`}
          </button>
          {updateError && <p role="alert" style={{ margin: '6px 0 0', fontSize: '12px' }}>{updateError}</p>}
        </div>
      )}
    </>
  );
};

const BrowserVersionChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);

  useEffect(() => {
    // Preserve the browser's one-time buildNumber storage migration.
    const oldKey = 'app_version';
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey);
    }

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) return;

        const serverVersion = await response.json();
        const storedVersion = localStorage.getItem(CURRENT_VERSION_KEY);
        if (storedVersion && storedVersion !== serverVersion.timestamp) {
          console.log('New version detected:', serverVersion.timestamp);
          setUpdateAvailable(true);
          setNewVersion(serverVersion);
        } else if (!storedVersion) {
          localStorage.setItem(CURRENT_VERSION_KEY, serverVersion.timestamp);
        }
      } catch (error) {
        console.error('Version check error:', error);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdate = () => {
    if (newVersion) {
      localStorage.setItem(CURRENT_VERSION_KEY, newVersion.timestamp);
      window.location.reload(true);
    }
  };

  if (updateAvailable) {
    return (
      <div onClick={handleUpdate} style={{ ...bannerStyle, cursor: 'pointer' }}>
        🎉 New version available! Tap to update
      </div>
    );
  }
  return null;
};

export const VersionChecker = () => (
  Capacitor.isNativePlatform() ? <NativeVersionChecker /> : <BrowserVersionChecker />
);

export default VersionChecker;
