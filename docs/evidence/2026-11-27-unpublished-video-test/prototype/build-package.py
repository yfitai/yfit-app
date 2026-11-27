#!/usr/bin/env python3
"""Build/verify the local credential-free deliverable; no network or live execution."""
from pathlib import Path
import hashlib, json, zipfile

ROOT = Path(__file__).resolve().parents[1]
NAME = 'YFIT_Current_Workflow_Backup_and_Unpublished_Test_2026-11-27.zip'
EXCLUDED = {'PACKAGE_MANIFEST.json', 'package-archive-receipt.json'}
files = sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix not in ('.zip', '.pyc') and p.name not in EXCLUDED)
assert files and all(p.name != 'pasted_content.txt' for p in files)
manifest = {
    'scope': 'redacted current owner export and local unpublished review-only test, not an installed pipeline',
    'raw_owner_attachment_included': False, 'credential_values_included': False,
    'live_workflow_changed': False, 'production_integration_verified': False,
    'files': [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
}
manifest_path = ROOT / 'PACKAGE_MANIFEST.json'
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
archive = ROOT / NAME
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for p in files + [manifest_path]:
        z.write(p, 'YFIT_Unpublished_Video_Test/' + str(p.relative_to(ROOT)))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for p in files + [manifest_path]:
        assert z.read('YFIT_Unpublished_Video_Test/' + str(p.relative_to(ROOT))) == p.read_bytes()
receipt = {
    'archive': NAME, 'bytes': archive.stat().st_size, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
    'archived_files': len(files) + 1, 'every_archived_file_byte_verified': True,
    'raw_attachment_included': False, 'credentials_included': False,
    'network_calls': 0, 'rendered_media_created': False, 'installed_on_n8n': False
}
(ROOT / 'package-archive-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print('Verified local archive:', archive)
print('Files:', receipt['archived_files'], 'bytes:', receipt['bytes'], 'SHA256:', receipt['sha256'])
