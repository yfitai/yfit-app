import { Capacitor } from '@capacitor/core';
import { readReleaseManifest, stageNativeRelease } from './liveUpdateCore.js';

let pluginPromise = null;
let checkPromise = null;
let initializationPromise = null;

async function loadPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!pluginPromise) {
    pluginPromise = import('@capawesome/capacitor-live-update')
      .then(mod => mod.LiveUpdate)
      .catch(error => { pluginPromise = null; throw error; });
  }
  return pluginPromise;
}

function getLoadedBuildNumber() {
  const value = Number(globalThis.document?.querySelector('meta[name="yfit-build-number"]')?.content);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export class LiveUpdateService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) return;
    if (!initializationPromise) {
      initializationPromise = this._doInitialize().catch(error => {
        initializationPromise = null;
        console.warn('LiveUpdate: Initialization skipped:', error.message);
      });
    }
    let timer;
    try {
      await Promise.race([
        initializationPromise,
        new Promise(resolve => { timer = setTimeout(resolve, 5000); }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  static async _doInitialize() {
    const plugin = await loadPlugin();
    if (!plugin) return;
    // Retain ready()/rollback acknowledgement. No bundle or app data is deleted.
    await plugin.ready();
    this._checkForUpdatesBackground();
  }

  static async _checkForUpdatesBackground() {
    try {
      const result = await this.checkForUpdates();
      if (result.status === 'staged') {
        console.log(`LiveUpdate: Build ${result.buildNumber} staged for next restart.`);
      }
    } catch (error) {
      console.warn('LiveUpdate: Background check skipped:', error.message);
    }
  }

  static async checkForUpdates() {
    if (!Capacitor.isNativePlatform()) return { status: 'web' };
    if (!checkPromise) {
      checkPromise = (async () => {
        const plugin = await loadPlugin();
        if (!plugin) return { status: 'web' };
        const release = await readReleaseManifest();
        return stageNativeRelease(plugin, release, {
          platform: Capacitor.getPlatform(),
          loadedBuildNumber: getLoadedBuildNumber(),
        });
      })().finally(() => { checkPromise = null; });
    }
    return checkPromise;
  }

  static async applyUpdate() {
    const result = await this.checkForUpdates();
    if (result.status !== 'staged') return false;
    const plugin = await loadPlugin();
    await plugin.reload();
    return true;
  }

  static async reload() {
    return this.applyUpdate();
  }

  static async getCurrentVersion() {
    const plugin = await loadPlugin();
    return plugin ? plugin.getCurrentBundle() : null;
  }
}
