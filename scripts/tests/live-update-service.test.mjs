import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'yfit-update-service-'));
let serial = 0;
const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
async function fixture({ native = true, failDownload = false } = {}) {
  const calls = [];
  const saved = [];
  const plugin = {
    async ready() { calls.push('ready'); },
    async getCurrentBundle() { return { bundleId: 'production' }; },
    async getBundles() { return { bundleIds: [...saved] }; },
    async downloadBundle(options) { calls.push('download'); if (failDownload) throw new Error('offline'); saved.push(options.bundleId); },
    async setNextBundle() { calls.push('stage'); },
    async reload() { calls.push('reload'); },
  };
  globalThis.__updateNative = native;
  globalThis.__updatePlugin = plugin;
  globalThis.document = { querySelector: () => ({ content: '108' }) };
  let manifestReads = 0;
  globalThis.fetch = async () => { manifestReads++; return { ok: true, json: async () => ({ version: 109, buildNumber: 109, bundleId: 'build-109', url: 'https://yfit-deploy.vercel.app/updates/bundle.zip', sha256: 'b'.repeat(64) }) }; };
  const file = path.join(directory, `service-${++serial}.mjs`);
  await build({
    entryPoints: [path.resolve('src/services/liveUpdate.js')], outfile: file,
    bundle: true, format: 'esm', platform: 'node', plugins: [{
      name: 'native-test-stubs', setup(builder) {
        builder.onResolve({ filter: /^@capacitor\/core$/ }, () => ({ path: 'capacitor', namespace: 'stub' }));
        builder.onResolve({ filter: /^@capawesome\/capacitor-live-update$/ }, () => ({ path: 'plugin', namespace: 'stub' }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: args.path === 'capacitor'
          ? 'export const Capacitor={isNativePlatform:()=>globalThis.__updateNative,getPlatform:()=>"android"};'
          : 'export const LiveUpdate=globalThis.__updatePlugin;', loader: 'js' }));
      },
    }],
  });
  const { LiveUpdateService } = await import(pathToFileURL(file).href);
  return { service: LiveUpdateService, calls, manifestReads: () => manifestReads, plugin };
}

test('concurrent checks share one native download and one manifest request', async () => {
  const { service, calls, manifestReads } = await fixture();
  const results = await Promise.all([service.checkForUpdates(), service.checkForUpdates()]);
  assert.equal(results[0].status, 'staged');
  assert.equal(manifestReads(), 1);
  assert.equal(calls.filter(x => x === 'download').length, 1);
  assert.equal(calls.filter(x => x === 'stage').length, 1);
});

test('explicit apply stages before native reload and does not use page reload', async () => {
  const { service, calls } = await fixture();
  assert.equal(await service.applyUpdate(), true);
  assert.deepEqual(calls, ['download', 'stage', 'reload']);
});

test('offline download never stages or reloads and remains retryable', async () => {
  const { service, calls, plugin } = await fixture({ failDownload: true });
  await assert.rejects(service.applyUpdate(), /offline/);
  assert.deepEqual(calls, ['download']);
  plugin.downloadBundle = async () => { calls.push('retry-download'); };
  assert.equal(await service.applyUpdate(), true);
  assert.deepEqual(calls.slice(1), ['retry-download', 'stage', 'reload']);
});

test('browser calls neither plugin nor network and cannot report native install', async () => {
  const { service, calls, manifestReads } = await fixture({ native: false });
  await service.initialize();
  assert.deepEqual(await service.checkForUpdates(), { status: 'web' });
  assert.equal(await service.applyUpdate(), false);
  assert.equal(manifestReads(), 0);
  assert.equal(calls.length, 0);
});

test('initialization is deduplicated and preserves rollback-ready acknowledgement', async () => {
  const { service, calls } = await fixture();
  await Promise.all([service.initialize(), service.initialize()]);
  await service.checkForUpdates();
  assert.equal(calls.filter(x => x === 'ready').length, 1);
  assert.equal(calls.filter(x => x === 'download').length, 1);
});

test.after(async () => {
  globalThis.fetch = originalFetch;
  if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  delete globalThis.__updateNative;
  delete globalThis.__updatePlugin;
  await fs.rm(directory, { recursive: true, force: true });
});
