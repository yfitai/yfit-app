import test from 'node:test';
import assert from 'node:assert/strict';
import { readReleaseManifest, validateReleaseManifest, stageNativeRelease, RELEASE_ARCHIVE_URL } from '../../src/services/liveUpdateCore.js';

const release = () => ({ version: 109, buildNumber: 109, bundleId: 'build-109', url: RELEASE_ARCHIVE_URL, sha256: 'a'.repeat(64) });
function mockPlugin({ current = 'production', saved = [], downloadResult = undefined, failDownload = false, failStage = false } = {}) {
  const calls = [];
  return { calls,
    async getCurrentBundle() { return { bundleId: current }; },
    async getBundles() { return { bundleIds: saved }; },
    async downloadBundle(options) { calls.push(['download', options]); if (failDownload) throw new Error('Download failed'); return downloadResult; },
    async setNextBundle(options) { calls.push(['stage', options]); if (failStage) throw new Error('Stage failed'); },
  };
}

test('successful void download explicitly stages the requested unique ID', async () => {
  const plugin = mockPlugin();
  const result = await stageNativeRelease(plugin, release(), { loadedBuildNumber: 108 });
  assert.equal(result.status, 'staged');
  assert.deepEqual(plugin.calls[1], ['stage', { bundleId: 'build-109' }]);
  assert.equal(plugin.calls[0][1].checksum, 'a'.repeat(64));
  assert.equal(plugin.calls[0][1].url, RELEASE_ARCHIVE_URL + '?build=109');
});

test('empty-object download response is also supported; no returned ID is required', async () => {
  const plugin = mockPlugin({ downloadResult: {} });
  await stageNativeRelease(plugin, release());
  assert.equal(plugin.calls.filter(([kind]) => kind === 'stage').length, 1);
});

test('already-saved desired bundle is selected without duplicate-ID download', async () => {
  const plugin = mockPlugin({ saved: ['production', 'build-109'] });
  await stageNativeRelease(plugin, release());
  assert.deepEqual(plugin.calls, [['stage', { bundleId: 'build-109' }]]);
});

test('currently active desired ID does not download or stage again', async () => {
  const plugin = mockPlugin({ current: 'build-109' });
  assert.equal((await stageNativeRelease(plugin, release())).status, 'current');
  assert.equal(plugin.calls.length, 0);
});

test('older manifest cannot downgrade a newer loaded HTML build', async () => {
  const plugin = mockPlugin();
  assert.equal((await stageNativeRelease(plugin, release(), { loadedBuildNumber: 110 })).status, 'outdated-manifest');
  assert.equal(plugin.calls.length, 0);
});

test('older manifest cannot downgrade a newer current bundle ID', async () => {
  const plugin = mockPlugin({ current: 'build-110' });
  assert.equal((await stageNativeRelease(plugin, release())).status, 'outdated-manifest');
  assert.equal(plugin.calls.length, 0);
});

test('download failure never stages or reports success', async () => {
  const plugin = mockPlugin({ failDownload: true });
  await assert.rejects(stageNativeRelease(plugin, release()), /Download failed/);
  assert.equal(plugin.calls.filter(([kind]) => kind === 'stage').length, 0);
});

test('stage failure propagates rather than reporting a completed update', async () => {
  const plugin = mockPlugin({ failStage: true });
  await assert.rejects(stageNativeRelease(plugin, release()), /Stage failed/);
});

test('unverifiable saved-ID list fails closed', async () => {
  const plugin = mockPlugin();
  plugin.getBundles = async () => ({});
  await assert.rejects(stageNativeRelease(plugin, release()), /Cannot verify/);
  assert.equal(plugin.calls.length, 0);
});

test('non-Android checksum behavior is not silently changed by this Android release', async () => {
  const plugin = mockPlugin();
  await stageNativeRelease(plugin, release(), { platform: 'ios' });
  assert.equal('checksum' in plugin.calls[0][1], false);
});

for (const [name, change] of [
  ['zero build', { version: 0, buildNumber: 0 }],
  ['noninteger build', { version: 109.5, buildNumber: 109.5 }],
  ['mismatched version', { version: 108 }],
  ['fixed production ID', { bundleId: 'production' }],
  ['foreign URL', { url: 'https://example.com/other.zip' }],
  ['malformed checksum', { sha256: 'bad' }],
]) {
  test('reject invalid manifest: ' + name, () => assert.throws(() => validateReleaseManifest({ ...release(), ...change }), /Invalid/));
}

test('manifest request is read-only, no-store, timeout-bounded and validated', async () => {
  let requested;
  const result = await readReleaseManifest(async (url, options) => { requested = { url, options }; return { ok: true, json: async () => release() }; });
  assert.equal(result.buildNumber, 109);
  assert.match(requested.url, /^https:\/\/yfit-deploy\.vercel\.app\/updates\/bundle\.json\?t=/);
  assert.equal(requested.options.cache, 'no-store');
  assert.equal(requested.options.signal.aborted, false);
});

test('failed metadata is not treated as no update', async () => {
  await assert.rejects(readReleaseManifest(async () => ({ ok: false })), /unavailable/);
});
