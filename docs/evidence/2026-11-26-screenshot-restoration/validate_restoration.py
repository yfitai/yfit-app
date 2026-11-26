#!/usr/bin/env python3
"""Validate the prepared four-image package. This script has no network/upload mode."""
import copy
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    'dashboard': 'assets/app-screens/screen_01_dashboard.png',
    'fitness': 'assets/app-screens/screen_05_fitness.png',
    'aiCoach': 'assets/app-screens/screen_10_aiCoach.png',
    'medications': 'assets/app-screens/screen_06_medications.png',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(manifest, root=ROOT):
    require(manifest['project_ref'] == 'mxggxpoxgqubojvumjlt', 'Wrong Supabase project')
    require(manifest['bucket'] == 'yfit-videos', 'Wrong storage bucket')
    require(manifest['state'] == 'prepared_not_uploaded', 'Unexpected preparation state')
    require(manifest['upload_authorized'] is False, 'This validator does not authorize upload')
    require(manifest['owner_visual_approval'] is False, 'Preparation must not claim owner approval')
    assets = manifest['assets']
    require(len(assets) == len(EXPECTED), 'Exactly four approved paths required')
    require({a['key'] for a in assets} == set(EXPECTED), 'Unexpected or missing screen keys')
    for a in assets:
        require(a['object_path'] == EXPECTED[a['key']], 'Wrong or unsafe object path')
        expected_file = 'candidates/' + Path(a['object_path']).name
        require(a['local_file'] == expected_file, 'Wrong or unsafe local file path')
        local = (root / a['local_file']).resolve()
        require(local.parent == (root / 'candidates').resolve(), 'Local path escaped candidate directory')
        require(local.is_file() and local.stat().st_size > 5000, 'Image missing or too small for video service')
        require(a['fictional_data'] is True and a['original_recovered'] is False, 'Provenance incorrectly described')
        require(hashlib.sha256(local.read_bytes()).hexdigest() == a['sha256'], 'Image hash mismatch')
        require(local.stat().st_size == a['bytes'], 'Image byte-size mismatch')
        with Image.open(local) as image:
            require(image.format == 'PNG' and image.size == (1080, 1920), 'Wrong image format or dimensions')
            image.verify()
        with Image.open(local) as image:
            image.load()
    return True


def self_test(manifest):
    validate(manifest)
    checks = 1
    cases = [
        lambda m: m.update(project_ref='wrong-project'),
        lambda m: m.update(bucket='wrong-bucket'),
        lambda m: m.update(upload_authorized=True),
        lambda m: m.update(owner_visual_approval=True),
        lambda m: m['assets'][0].update(object_path='app-screens/screen_01_dashboard.png'),
        lambda m: m['assets'][0].update(local_file='../outside.png'),
        lambda m: m['assets'][0].update(sha256='0' * 64),
        lambda m: m['assets'].pop(),
        lambda m: m['assets'].append(copy.deepcopy(m['assets'][0])),
    ]
    for mutate in cases:
        invalid = copy.deepcopy(manifest)
        mutate(invalid)
        try:
            validate(invalid)
        except ValueError:
            checks += 1
        else:
            raise AssertionError('Invalid manifest unexpectedly accepted')
    return checks


if __name__ == '__main__':
    m = json.loads((ROOT / 'restoration_manifest.json').read_text())
    checks = self_test(m)
    result = {'state': 'prepared_not_uploaded', 'assets_validated': len(m['assets']),
              'offline_checks_passed': checks, 'network_requests': 0, 'uploads': 0,
              'generator_or_assembly_calls': 0, 'posts': 0}
    (ROOT / 'evidence' / 'validation.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
