import { Capacitor } from '@capacitor/core';

// LiveUpdate plugin loaded lazily - only on native
let LiveUpdate = null;

const UPDATE_URL = 'https://yfit-deploy.vercel.app/updates/bundle.zip';
const BUNDLE_ID = 'production';

export class LiveUpdateService {
  static async initialize() {
    // Never run on web - no plugin available
    if (!Capacitor.isNativePlatform()) {
      console.log('LiveUpdate: Skipping - running in browser');
      return;
    }

    // Lazily import plugin so web bundle doesn't fail
    try {
      const mod = await import('@capawesome/capacitor-live-update');
      LiveUpdate = mod.LiveUpdate;
    } catch (err) {
      console.log('LiveUpdate: Plugin not available:', err.message);
      return;
    }

    // Wrap entire init in a 5-second timeout so a failed/slow
    // update check NEVER blocks app startup (no more spinning disk)
    await Promise.race([
      this._doInitialize(),
      new Promise((resolve) =>
        setTimeout(() => {
          console.warn('LiveUpdate: Timed out after 5s - continuing without update');
          resolve();
        }, 5000)
      ),
    ]).catch((err) => {
      console.error('LiveUpdate: Init error (non-blocking):', err.message);
    });
  }

  static async _doInitialize() {
    if (!LiveUpdate) return;

    // Mark app as ready first (rollback protection) - must run even if update fails
    try {
      await LiveUpdate.ready();
      console.log('LiveUpdate: App marked as ready');
    } catch (e) {
      console.log('LiveUpdate: ready() skipped:', e.message);
    }

    // Run update check in background - does NOT block app startup
    this._checkForUpdatesBackground();
  }

  static async _checkForUpdatesBackground() {
    if (!LiveUpdate) return;
    try {
      const currentBundle = await LiveUpdate.getCurrentBundle();
      console.log('LiveUpdate: Current bundle:', currentBundle);

      // Quick HEAD check before attempting full download
      // Avoids long hang when bundle.zip doesn't exist yet
      const headCheck = await fetch(UPDATE_URL, { method: 'HEAD' }).catch(() => null);
      if (!headCheck || !headCheck.ok) {
        console.log('LiveUpdate: No bundle available at update URL - skipping download');
        return;
      }

      const result = await LiveUpdate.downloadBundle({
        url: UPDATE_URL,
        bundleId: BUNDLE_ID,
      });

      if (result.bundleId) {
        await LiveUpdate.setNextBundle({ bundleId: result.bundleId });
        console.log('LiveUpdate: Update downloaded - will apply on next restart');
      }
    } catch (error) {
      console.log('LiveUpdate: Background check failed (non-blocking):', error.message);
    }
  }

  static async reload() {
    if (!LiveUpdate) return;
    try {
      await LiveUpdate.reload();
    } catch (error) {
      console.error('LiveUpdate: Reload error:', error);
    }
  }

  static async getCurrentVersion() {
    if (!LiveUpdate) return null;
    try {
      return await LiveUpdate.getCurrentBundle();
    } catch (error) {
      console.error('LiveUpdate: Get version error:', error);
      return null;
    }
  }
}
