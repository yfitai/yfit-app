#!/usr/bin/env python3
"""Local-only package checks. Never print secret values or contact any service."""
from pathlib import Path
import hashlib, importlib.util, json, re, sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('export_sanitizer', ROOT / 'prototype/inspect-current-export.py')
sanitizer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sanitizer)


def check(condition, label):
    if not condition:
        raise SystemExit('Package check failed: ' + label)


def main():
    original_path = Path(sys.argv[1])
    original = sanitizer.parse(original_path.read_text())
    safe_path = ROOT / 'current-workflow-redacted.json'
    safe = json.loads(safe_path.read_text())
    receipt = json.loads((ROOT / 'current-export-receipt.json').read_text())
    check(hashlib.sha256(original_path.read_bytes()).hexdigest() == receipt['original_attachment_sha256'], 'original attachment hash')
    check(hashlib.sha256(safe_path.read_bytes()).hexdigest() == receipt['redacted_export_sha256'], 'redacted snapshot hash')
    check(safe['id'] == original['id'] == 'h7bRds9UOUfmP36F', 'workflow identity')
    check(safe['active'] is False and original['active'] is False, 'inactive owner export')
    check(len(safe['nodes']) == len(original['nodes']) == 25, '25 nodes retained')
    check([(n['id'], n['name'], n['type']) for n in safe['nodes']] == [(n['id'], n['name'], n['type']) for n in original['nodes']], 'node identity retention')
    check(safe['connections'] == original['connections'], 'exact connection topology')
    check(safe['settings'] == original['settings'], 'settings retention')
    secrets = set()

    def discover(obj):
        if isinstance(obj, dict):
            value = obj.get('value')
            if isinstance(obj.get('name'), str) and sanitizer.SECRET_NAME.search(obj['name']) and isinstance(value, str):
                if not (value.startswith('=') and ('$env.' in value or '$credentials.' in value)):
                    secrets.add(value)
                    match = re.search(r'Bearer\s+([^\s]+)', value, re.I)
                    if match:
                        secrets.add(match.group(1))
            for key, value in obj.items():
                if sanitizer.SECRET_NAME.fullmatch(key) and isinstance(value, str):
                    if not (value.startswith('=') and ('$env.' in value or '$credentials.' in value)):
                        secrets.add(value)
                discover(value)
        elif isinstance(obj, list):
            for value in obj:
                discover(value)

    discover(original)
    raw_text = original_path.read_text()
    secrets.update(sanitizer.JWT.findall(raw_text))
    secrets.update(sanitizer.TOKEN.findall(raw_text))
    files = sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix not in ('.zip', '.pyc'))
    for p in files:
        check(p.resolve() != original_path.resolve(), 'raw attachment excluded')
        content = p.read_text()
        check(not sanitizer.JWT.search(content) and not sanitizer.TOKEN.search(content), 'recognizable token excluded in ' + p.name)
        check(all(secret not in content for secret in secrets if len(secret) > 5), 'known raw secret excluded in ' + p.name)
        if p.suffix == '.json':
            json.loads(content)

    draft = json.loads((ROOT / 'prototype/n8n-unpublished-review-planner.json').read_text())
    check(draft['active'] is False and 'id' not in draft, 'separate inactive draft')
    check(len(draft['nodes']) == 2, 'draft node count')
    check([n['type'] for n in draft['nodes']] == ['n8n-nodes-base.manualTrigger', 'n8n-nodes-base.code'], 'manual/pure-code node allowlist')
    check(all('credentials' not in n for n in draft['nodes']), 'no draft credential binding')
    code = draft['nodes'][1]['parameters']['jsCode']
    check(not re.search(r'\b(?:fetch\s*\(|require\s*\(|import\s|https?\.request\s*\(|httpRequest\s*\()', code), 'no network/import implementation in draft code')
    plans = json.loads((ROOT / 'prototype/six-platform-review-plans.json').read_text())
    check(len(plans) == 6 and len({p['json']['platform'] for p in plans}) == 6, 'six unique platforms')
    check(len({p['json']['media_variant_key'] for p in plans}) == 6, 'six unique media variant keys')
    for p in plans:
        item = p['json']
        check(item['review_only'] is True and item['needs_human_review'] is True, 'review flags')
        for flag in ('publishing_allowed', 'model_calls_allowed', 'render_calls_allowed', 'database_writes_allowed', 'production_ready', 'production_workflow_adapter_verified'):
            check(item[flag] is False, 'blocked permission ' + flag)
        check(item['voiceover_script'].endswith(item['account_line'] + '\n\n' + item['spoken_cta']), 'account explanation before final CTA')
    qa = json.loads((ROOT / 'prototype/embedded-code-qa.json').read_text())
    check(qa['embedded_code_matches_module'] is True, 'embedded code equivalence')
    result = {
        'scope': 'local source/package inspection; no live API, generation, upload, execution or publishing',
        'original_and_redacted_hash_checks': True, 'exact_node_identity_and_topology_checks': True,
        'settings_unchanged': True, 'known_original_secret_values_excluded': True,
        'recognizable_token_scan_passed': True, 'text_files_checked': len(files),
        'draft_manual_code_allowlist_passed': True, 'six_unique_review_media_keys': True,
        'all_permissions_remain_blocked': True, 'embedded_code_matches_module': True,
        'production_integration_verified': False, 'new_media_generated': False
    }
    (ROOT / 'package-validation.json').write_text(json.dumps(result, indent=2) + '\n')
    print('Package checks passed: hashes, 25 original node identities, exact topology/settings, secret exclusion, two-node isolation, six blocked plans.')


if __name__ == '__main__':
    main()
