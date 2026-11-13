#!/bin/bash
# Build and package a self-hosted Capawesome update in the canonical app.
# npm's existing prebuild bumps public/version.json exactly once.
# A guarded --rebuild-current NUMBER refreshes a release without another bump.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BEFORE_BUILD="$(node --input-type=module -e "import fs from 'node:fs'; console.log(JSON.parse(fs.readFileSync('public/version.json')).buildNumber)")"
if [ "${1:-}" = "--rebuild-current" ]; then
  [ "${2:-}" = "$BEFORE_BUILD" ] || { echo 'Explicit rebuild number does not match current metadata.' >&2; exit 1; }
  EXPECTED_BUILD="$BEFORE_BUILD"
  echo "Rebuilding native-target assets for existing Build $BEFORE_BUILD (no increment)..."
  npx vite build --mode capacitor
elif [ "$#" = 0 ]; then
  echo "Building native-target assets after Build $BEFORE_BUILD..."
  npm run build -- --mode capacitor
  EXPECTED_BUILD="$(node -e "console.log(Number(process.argv[1]) + 1)" "$BEFORE_BUILD")"
else
  echo 'Usage: create-update-bundle.sh [--rebuild-current NUMBER]' >&2
  exit 1
fi

# Do not announce success if the version bump or compilation silently failed.
node --input-type=module - "$EXPECTED_BUILD" <<'JS'
import fs from 'node:fs';
const expected = Number(process.argv[2]);
const source = JSON.parse(fs.readFileSync('public/version.json'));
const built = JSON.parse(fs.readFileSync('dist/version.json'));
if (!Number.isSafeInteger(expected) || source.buildNumber !== expected || built.buildNumber !== source.buildNumber) {
  throw new Error('Release metadata must match the explicitly expected build and compiled bundle.');
}
const html = fs.readFileSync('dist/index.html', 'utf8');
if (!html.includes('src="./assets/')) throw new Error('Native bundle must use relative asset paths.');
JS

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT
ARCHIVE="$TEMP_DIR/bundle.zip"
# ZIP a clean file, not an in-place update of the old release. Vite copies
# public/updates into dist: exclude it to avoid recursively embedding old ZIPs.
(cd dist && zip -q -r "$ARCHIVE" . -x 'updates/*' '*.zip' '*.map' '.DS_Store')

python3 - "$ARCHIVE" <<'PY'
import sys, zipfile
from pathlib import PurePosixPath
with zipfile.ZipFile(sys.argv[1]) as archive:
    names = archive.namelist()
    if archive.testzip() is not None:
        raise SystemExit('Archive CRC validation failed.')
    if not {'index.html', 'version.json'}.issubset(names):
        raise SystemExit('Native archive is missing its root HTML or version metadata.')
    if len(names) != len(set(names)):
        raise SystemExit('Duplicate archive entries are not allowed.')
    if any(n.endswith('.zip') or n.startswith('updates/') or '..' in PurePosixPath(n).parts or n.startswith('/') for n in names):
        raise SystemExit('Embedded releases or unsafe archive paths are not allowed.')
PY

mkdir -p public/updates
mv "$ARCHIVE" public/updates/bundle.zip
python3 - <<'PY'
import hashlib, json
from pathlib import Path
version = json.loads(Path('public/version.json').read_text())
archive = Path('public/updates/bundle.zip')
manifest = {
    'version': version['buildNumber'],
    'buildNumber': version['buildNumber'],
    'bundleId': 'build-' + str(version['buildNumber']),
    'url': 'https://yfit-deploy.vercel.app/updates/bundle.zip',
    'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
    'size': archive.stat().st_size,
    'timestamp': version['timestamp'],
}
Path('public/updates/bundle.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Validated native update archive: Build', manifest['buildNumber'], '—', manifest['size'], 'bytes')
print('Existing update URL:', manifest['url'])
PY
