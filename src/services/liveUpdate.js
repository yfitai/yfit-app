import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { Capacitor } from '@capacitor/core';

const UPDATE_URL = 'https://yfit-deploy.vercel.app/updates/bundle.zip';
const BUNDLE_ID = 'production';

export class LiveUpdateService {
  static async initialize() {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('LiveUpdate: Skipping - running in browser');
      return;
    }

    try {
      console.log('LiveUpdate: Initializing...');
      
      // Check for updates on app start
      await this.checkForUpdates();
      
      // Mark app as ready (important for rollback protection)
      await LiveUpdate.ready();
      
      console.log('LiveUpdate: Initialized successfully');
    } catch (error) {
      console.error('LiveUpdate: Initialization error:', error);
    }
  }

  static async checkForUpdates() {
    try {
      console.log('LiveUpdate: Checking for updates...');
      
      // Get current bundle info
      const currentBundle = await LiveUpdate.getCurrentBundle();
      console.log('LiveUpdate: Current bundle:', currentBundle);

      // Download the latest bundle from Vercel
      const result = await LiveUpdate.downloadBundle({
        url: UPDATE_URL,
        bundleId: BUNDLE_ID,
      });

      console.log('LiveUpdate: Download result:', result);

      if (result.bundleId) {
        // Set the downloaded bundle as next bundle
        await LiveUpdate.setNextBundle({
          bundleId: result.bundleId,
        });

        console.log('LiveUpdate: Update downloaded! Will apply on next app restart.');
        
        // Optionally reload immediately (or wait for next app launch)
        // await LiveUpdate.reload();
      }
    } catch (error) {
      // Update not available or download failed
      console.log('LiveUpdate: No update available or error:', error.message);
    }
  }

  static async reload() {
    try {
      await LiveUpdate.reload();
    } catch (error) {
      console.error('LiveUpdate: Reload error:', error);
    }
  }

  static async getCurrentVersion() {
    try {
      const bundle = await LiveUpdate.getCurrentBundle();
      return bundle;
    } catch (error) {
      console.error('LiveUpdate: Get version error:', error);
      return null;
    }
  }
}
