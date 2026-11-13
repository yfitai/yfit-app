export const RELEASE_MANIFEST_URL = 'https://yfit-deploy.vercel.app/updates/bundle.json';
export const RELEASE_ARCHIVE_URL = 'https://yfit-deploy.vercel.app/updates/bundle.zip';

export function validateReleaseManifest(value) {
  if (!value || !Number.isSafeInteger(value.buildNumber) || value.buildNumber < 1 ||
      value.version !== value.buildNumber || value.bundleId !== `build-${value.buildNumber}` ||
      value.url !== RELEASE_ARCHIVE_URL || !/^[a-f0-9]{64}$/.test(value.sha256 || '')) {
    throw new Error('Invalid live-update release metadata.');
  }
  return { ...value };
}

export async function readReleaseManifest(fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchImpl(`${RELEASE_MANIFEST_URL}?t=${Date.now()}`, {
      cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error('Live-update release metadata is unavailable.');
    return validateReleaseManifest(await response.json());
  } finally {
    clearTimeout(timer);
  }
}

export async function stageNativeRelease(plugin, release, { platform = 'android', loadedBuildNumber = null } = {}) {
  release = validateReleaseManifest(release);
  const current = await plugin.getCurrentBundle();
  const currentBuild = /^build-(\d+)$/.exec(current?.bundleId || '');
  if ((Number.isSafeInteger(loadedBuildNumber) && loadedBuildNumber > release.buildNumber) ||
      (currentBuild && Number(currentBuild[1]) > release.buildNumber)) {
    return { status: 'outdated-manifest', buildNumber: release.buildNumber, bundleId: release.bundleId };
  }
  if (current?.bundleId === release.bundleId) {
    return { status: 'current', buildNumber: release.buildNumber, bundleId: release.bundleId };
  }
  const saved = await plugin.getBundles();
  if (!Array.isArray(saved?.bundleIds)) throw new Error('Cannot verify saved native update bundles.');
  if (!saved.bundleIds.includes(release.bundleId)) {
    const options = {
      url: `${release.url}?build=${release.buildNumber}`,
      bundleId: release.bundleId,
    };
    // Installed Android LiveUpdate 7.4.0 compares its SHA-256 checksum as HEX.
    // Its implementation was inspected; the generated manifest uses that format.
    // Do not change iOS checksum handling under this Android release scope.
    if (platform === 'android') options.checksum = release.sha256;
    await plugin.downloadBundle(options); // API returns void, not a bundleId.
  }
  await plugin.setNextBundle({ bundleId: release.bundleId });
  return { status: 'staged', buildNumber: release.buildNumber, bundleId: release.bundleId };
}
