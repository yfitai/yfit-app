import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const source = await fs.readFile('scripts/create-update-bundle.sh', 'utf8');
async function fixture({ failBuild = false, wrongBase = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'yfit-package-test-'));
  for (const dir of ['scripts', 'public/updates', 'bin']) await fs.mkdir(path.join(root, dir), { recursive: true });
  await fs.writeFile(path.join(root, 'scripts/create-update-bundle.sh'), source);
  await fs.writeFile(path.join(root, 'public/version.json'), JSON.stringify({ version: '1.0.108', buildNumber: 108, timestamp: 'old' }));
  execFileSync('python3', ['-c', "import zipfile; z=zipfile.ZipFile('public/updates/bundle.zip','w'); z.writestr('stale-private-name.js','old fictional content'); z.close()"], { cwd: root });
  const npm = failBuild ? '#!/bin/bash\nexit 1\n' : `#!/bin/bash
python3 - <<'PY'
import json
from pathlib import Path
p=Path('public/version.json'); d=json.loads(p.read_text()); d['buildNumber']+=1; d['timestamp']='new'; p.write_text(json.dumps(d))
Path('dist/assets').mkdir(parents=True)
Path('dist/updates').mkdir()
Path('dist/index.html').write_text('<script type="module" src="${wrongBase ? '/' : './'}assets/index-new.js"></script>')
Path('dist/version.json').write_text(json.dumps(d))
Path('dist/assets/index-new.js').write_text('fictional current runtime')
Path('dist/assets/index-new.js.map').write_text('fictional map')
Path('dist/updates/bundle.zip').write_bytes(Path('public/updates/bundle.zip').read_bytes())
PY
`;
  await fs.writeFile(path.join(root, 'bin/npm'), npm, { mode: 0o755 });
  return root;
}
function run(root) {
  return spawnSync('bash', ['scripts/create-update-bundle.sh'], { cwd: root, env: { ...process.env, PATH: path.join(root, 'bin') + ':' + process.env.PATH }, encoding: 'utf8' });
}

test('native release is a fresh archive without nested ZIPs, stale files or sourcemaps', async () => {
  const root = await fixture();
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const names = JSON.parse(execFileSync('python3', ['-c', "import json,zipfile; print(json.dumps(zipfile.ZipFile('public/updates/bundle.zip').namelist()))"], { cwd: root, encoding: 'utf8' }));
    assert(names.includes('index.html'));
    assert(names.includes('version.json'));
    assert(names.includes('assets/index-new.js'));
    assert(!names.some(n => n.endsWith('.zip') || n.endsWith('.map') || n.includes('stale-private-name')));
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/updates/bundle.json')));
    assert.equal(manifest.buildNumber, 109);
    assert.equal(manifest.bundleId, 'build-109');
    assert.equal(manifest.sha256, createHash('sha256').update(await fs.readFile(path.join(root, 'public/updates/bundle.zip'))).digest('hex'));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

for (const options of [{ failBuild: true }, { wrongBase: true }]) {
  test('failed or wrong-target build preserves the previous release archive', async () => {
    const root = await fixture(options);
    try {
      const before = await fs.readFile(path.join(root, 'public/updates/bundle.zip'));
      assert.notEqual(run(root).status, 0);
      assert.deepEqual(await fs.readFile(path.join(root, 'public/updates/bundle.zip')), before);
      await assert.rejects(fs.access(path.join(root, 'public/updates/bundle.json')));
    } finally { await fs.rm(root, { recursive: true, force: true }); }
  });
}
