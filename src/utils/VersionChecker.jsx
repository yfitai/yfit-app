import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Test update banner - 2026-01-16 23:44

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds (reduced from 30s)
const CURRENT_VERSION_KEY = 'app_version_timestamp';

export const VersionChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);


  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    // One-time migration: clear old buildNumber-based storage
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

    // Check immediately on mount
    checkVersion();

    // Check periodically (web + native)
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // On native: also check when app resumes from background
    let appStateListener;
    if (isNative) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkVersion();
      }).then(listener => {
        appStateListener = listener;
      });
    } else {
      // On web: check when tab becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') checkVersion();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      clearInterval(interval);
      if (appStateListener) appStateListener.remove();
    };
  }, []);

  const handleUpdate = () => {
    if (newVersion) {
      // Store new timestamp
      localStorage.setItem(CURRENT_VERSION_KEY, newVersion.timestamp);
      
      // Force reload
      window.location.reload(true);
    }
  };



  // Render update banner if update is available
  if (updateAvailable) {
    return (
      <div 
        onClick={handleUpdate}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 16px',
          textAlign: 'center',
          zIndex: 10000,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontWeight: 600,
          fontSize: '14px'
        }}
      >
        🎉 New version available! Tap to update
      </div>
    );
  }

  return null;
};

export default VersionChecker;
