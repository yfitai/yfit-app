#!/usr/bin/env python3
"""Capture exactly one actual BodyRecomp empty/setup state, fully offline."""
import json
import shutil
import sys
from pathlib import Path

WORK = Path('/home/ubuntu/yfit-screen-library-2026-11-27/work/recomp')
FINAL = Path('/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_09_recomp.png')
sys.path.insert(0, '/home/ubuntu/yfit-screen-library-2026-11-27/work')
from offline_capture_base import OfflineCapture

# BodyRecomp.jsx reads body_measurements and progress_measurements. Both empty
# is the native setup state; do not supply goals, progress scores, or AI results.
FIXTURES = {
    'body_measurements': [],
    'progress_measurements': [],
    'calculated_metrics': [],
    'meals': [],
    'daily_logs': [],
}

def main():
    with OfflineCapture(WORK, fixtures=FIXTURES) as capture:
        capture.goto('/body-recomp')
        capture.page.get_by_role('heading', name='Body Recomp', exact=True).wait_for(timeout=45000)
        capture.page.get_by_role('heading', name='Set your body measurement goals', exact=True).wait_for(timeout=15000)
        body = capture.page.locator('body').inner_text()
        (WORK / 'initial-body.txt').write_text(body + '\n')
        print(body, flush=True)
        assert capture.page.url.endswith('/body-recomp')
        assert 'Body Recomp' in body
        assert 'Set your body measurement goals' in body
        assert 'No data' in body
        assert 'Overall Recomp Progress' not in body
        assert not capture.audit['page_errors'], capture.audit['page_errors']
        screenshot = capture.save(
            'screen_09_recomp.png',
            'Actual BodyRecomp setup and empty state: no body goals, no measurement history, no calculated score or AI output; original app controls and colors.'
        )
        capture.audit.update({
            'route': '/body-recomp',
            'actual_component': 'src/components/BodyRecomp.jsx',
            'state': 'native no-goals/no-history setup and empty state',
            'ui_actions': [{'action': 'navigate', 'route': '/body-recomp'}],
            'model_calls': 0,
            'uploads': 0,
            'live_auth_calls': 0,
            'canonical_source_modified': False,
            'compiled_build_modified': False,
            'css_or_dom_content_modified': False,
            'viewport_css_pixels': {'width': 540, 'height': 960},
            'device_scale_factor': 2,
        })
        print(body, flush=True)
    FINAL.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(screenshot), FINAL)
    audit_path = WORK / 'safe-audit.json'
    audit = json.loads(audit_path.read_text())
    audit['screens'][0]['path'] = str(FINAL)
    audit_path.write_text(json.dumps(audit, indent=2) + '\n')
    assert audit['external_sent'] == 0 and audit['non_get_sent'] == 0
    assert audit['server_stopped'] and not audit['page_errors']
    print('FINAL:', FINAL, flush=True)
    print('AUDIT:', audit_path, flush=True)

if __name__ == '__main__':
    main()
