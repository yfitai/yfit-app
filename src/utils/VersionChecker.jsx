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
    // Only run on mobile (Capacitor)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // One-time migration: clear old buildNumber-based storage
    const oldKey = 'app_version';
    if (localStorage.getItem(oldKey)) {
      console.log('Migrating from buildNumber to timestamp-based versioning');
      localStorage.removeItem(oldKey);
      // This will force the app to detect the next update
    }

    const checkVersion = async () => {
      try {
        // Fetch version from server with cache-busting timestamp
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          console.log('Version check failed:', response.status);
          return;
        }

        const serverVersion = await response.json();
        const storedVersion = localStorage.getItem(CURRENT_VERSION_KEY);

        console.log('Version check:', {
          server: serverVersion.timestamp,
          stored: storedVersion
        });

        // If version changed, show update banner instead of auto-reloading
        if (storedVersion && storedVersion !== serverVersion.timestamp) {
          console.log('New version detected!', {
            old: storedVersion,
            new: serverVersion.timestamp
          });
          setUpdateAvailable(true);
          setNewVersion(serverVersion);
        } else if (!storedVersion) {
          // First time, just store the timestamp
          localStorage.setItem(CURRENT_VERSION_KEY, serverVersion.timestamp);
        }
      } catch (error) {
        console.error('Version check error:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Check periodically
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // Listen for app state changes (when user returns to app)
    let appStateListener;
    
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App resumed - checking for updates...');
        checkVersion();
      }
    }).then(listener => {
      appStateListener = listener;
    });

    return () => {
      clearInterval(interval);
      if (appStateListener) {
        appStateListener.remove();
      }
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
