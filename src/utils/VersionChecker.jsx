import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const VERSION_CHECK_INTERVAL = 30000; // Check every 30 seconds
const CURRENT_VERSION_KEY = 'app_version';

export const VersionChecker = () => {
  useEffect(() => {
    // Only run on mobile (Capacitor)
    if (!Capacitor.isNativePlatform()) {
      return;
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
          server: serverVersion.buildNumber,
          stored: storedVersion
        });

        // If version changed, force reload
        if (storedVersion && storedVersion !== String(serverVersion.buildNumber)) {
          console.log('New version detected! Forcing reload...');
          
          // Store new version
          localStorage.setItem(CURRENT_VERSION_KEY, String(serverVersion.buildNumber));
          
          // Show brief notification (optional)
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
            animation: slideDown 0.3s ease-out;
          `;
          notification.textContent = '🎉 Updating to latest version...';
          document.body.appendChild(notification);

          // Wait a moment for user to see notification
          setTimeout(() => {
            // Force hard reload
            window.location.reload(true);
          }, 1000);
        } else if (!storedVersion) {
          // First time, just store the version
          localStorage.setItem(CURRENT_VERSION_KEY, String(serverVersion.buildNumber));
        }
      } catch (error) {
        console.error('Version check error:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Check periodically
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};

export default VersionChecker;
