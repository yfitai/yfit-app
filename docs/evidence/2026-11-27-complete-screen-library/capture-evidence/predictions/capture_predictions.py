#!/usr/bin/env python3
"""Capture the real PredictionsUnified empty overview; no live calls or UI mutation."""
import json
import sys
from pathlib import Path

ROOT = Path('/home/ubuntu/yfit-screen-library-2026-11-27')
WORK = ROOT / 'work/predictions'
FINAL = ROOT / 'pages/screen_08_predictions.png'
sys.path.insert(0, str(ROOT / 'work'))
from offline_capture_base import OfflineCapture

# Empty fictional history prevents invented computed/model forecasts.
# Profile, preferences and active pro_monthly subscription are helper-local fixtures.
FIXTURES = {
    'daily_logs': [],
    'meals': [],
    'workout_sessions': [],
    'medication_logs': [],
    'calculated_metrics': [],
    'progress_measurements': [],
}

with OfflineCapture(WORK, fixtures=FIXTURES) as capture:
    capture.goto('/predictions')
    page = capture.page
    heading = page.get_by_role('heading', name='🔮 AI Predictions', exact=True)
    heading.wait_for(state='visible')
    body = page.locator('body').inner_text()
    assert 'Log weight on 2+ different days to see predictions' in body
    assert 'Log 7+ days of weight and nutrition to calculate TDEE' in body
    assert 'Your TDEE' not in body
    assert not capture.audit['page_errors'], capture.audit['page_errors']
    print(body, flush=True)
    box = heading.bounding_box()
    print('HEADING_BOX', json.dumps(box), flush=True)
    # Use actual scrolling only, preserving header/navigation where possible.
    y = max(0, box['y'] + page.evaluate('window.scrollY') - 180)
    page.evaluate('(y) => window.scrollTo(0, y)', y)
    page.wait_for_timeout(300)
    capture.audit['ui_actions'] = [{'action': 'navigate', 'route': '/predictions'},
                                  {'action': 'scroll', 'scroll_y': page.evaluate('window.scrollY')}]
    capture.audit['actual_component'] = 'src/components/PredictionsUnified.jsx'
    capture.audit['fixture_intent'] = 'Empty historical tables: authentic insufficient-data overview, no fictional calculated or model outputs.'
    capture.audit['canonical_modified'] = False
    capture.audit['build_reused_unchanged'] = True
    capture.audit['model_calls_allowed'] = 0
    capture.audit['uploads_allowed'] = 0
    temporary = capture.save('screen_08_predictions.png', 'Actual PredictionsUnified empty overview with original green/blue/cyan gradient and teal insufficient-data cards; fictional offline active Pro session, no forecast results.')

FINAL.parent.mkdir(parents=True, exist_ok=True)
temporary.replace(FINAL)
audit_file = WORK / 'safe-audit.json'
audit = json.loads(audit_file.read_text())
audit['screens'][0]['path'] = str(FINAL)
audit['screens'][0]['width'] = 1080
audit['screens'][0]['height'] = 1920
audit['body_text_path'] = str(WORK / 'screen_08_predictions-body.txt')
audit_file.write_text(json.dumps(audit, indent=2) + '\n')
print('Saved one screenshot and stopped private browser/server.', flush=True)
