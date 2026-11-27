#!/usr/bin/env python3
"""One original actual-app language dropdown capture; offline, no live writes."""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

WORK = Path('/home/ubuntu/yfit-screen-library-2026-11-27/work/language')
FINAL = Path('/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_11_language.png')
ARCHIVE = Path('/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source')
REV = '20cae3de9b8d9160618299a1f81fa2b79021258a'
sys.path.insert(0, '/home/ubuntu/yfit-screen-library-2026-11-27/work')
from offline_capture_base import OfflineCapture, prior

checks = []
for name in ['src/App.jsx', 'src/components/Navigation.jsx', 'src/components/LanguageSwitcher.jsx', 'src/lib/i18n.js', 'src/components/DailyTracker.jsx', 'src/contexts/UnitPreferenceContext.jsx']:
    raw = (ARCHIVE / name).read_bytes()
    expected = subprocess.check_output(['git', '-C', '/home/ubuntu/yfit-app-full', 'show', REV + ':' + name])
    assert raw == expected, name
    checks.append({'path': name, 'sha256': hashlib.sha256(raw).hexdigest(), 'matches_declared_revision': True})

# Only source-declared onboarding flags and display-unit fields; no computed metrics.
fixtures = {
    'user_profiles': [{'id': prior.UID, 'user_id': prior.UID, 'onboarding_completed': True, 'install_guide_shown': True}],
    'user_preferences': [{'user_id': prior.UID, 'preferred_unit_system': 'metric', 'preferred_distance_unit': 'metric'}],
    'user_goals': [],
    'calculated_metrics': [],
    'meals': [],
    'daily_logs': [],
    'subscriptions': [],
    'progress_measurements': [],
}
with OfflineCapture(WORK, fixtures=fixtures) as capture:
    capture.audit.update({
        'id': 'language',
        'route': '/daily-tracker',
        'actual_component': 'LanguageSwitcher.jsx in Navigation.jsx, opened over DailyTracker.jsx',
        'component_source_checks': checks,
        'compiled_build_reused_unchanged': True,
        'dom_or_css_modified': False,
        'canonical_source_modified': False,
        'production_write': False,
        'language_selection_or_save': False,
        'ui_actions': [],
    })
    capture.goto('/daily-tracker')
    capture.page.get_by_role('heading', name='📊 Daily Tracker', exact=True).wait_for()
    capture.page.get_by_role('button', name='Change language', exact=True).click()
    capture.audit['ui_actions'].append({'action': 'click', 'target': 'Change language', 'purpose': 'Open actual language listbox only'})
    menu = capture.page.get_by_role('listbox', name='Select language', exact=True)
    menu.wait_for(state='visible')
    options = menu.get_by_role('option')
    assert options.count() == 8
    assert options.all_text_contents() == ['🇺🇸English✓', '🇫🇷Français', '🇪🇸Español', '🇧🇷Português', '🇨🇳中文', '🇮🇳हिन्दी', '🇩🇪Deutsch', '🇯🇵日本語']
    assert options.first.get_attribute('aria-selected') == 'true'
    rect = menu.bounding_box()
    assert rect and rect['x'] >= 0 and rect['y'] >= 0 and rect['x'] + rect['width'] <= 540 and rect['y'] + rect['height'] <= 960
    capture.page.mouse.move(10, 900)
    capture.page.wait_for_timeout(300)
    body = capture.page.locator('body').inner_text()
    assert not any(term in body.lower() for term in ['error loading', 'failed to', 'something went wrong'])
    assert not capture.audit['page_errors'], capture.audit['page_errors']
    capture.audit['menu_bounding_box_css_px'] = rect
    capture.audit['supported_languages'] = ['en', 'fr', 'es', 'pt', 'zh', 'hi', 'de', 'ja']
    capture.audit['empty_records'] = ['daily_logs', 'progress_measurements', 'meals', 'calculated_metrics', 'user_goals', 'subscriptions']
    local = capture.save('screen_11_language.png', 'Genuine eight-language header dropdown, English selected, over real Daily Tracker empty state; original compiled styles unchanged.')
    shutil.copyfile(local, FINAL)
    capture.audit['screens'][-1]['local_capture_path'] = str(local)
    capture.audit['screens'][-1]['path'] = str(FINAL)
    capture.audit['screens'][-1]['width'] = 1080
    capture.audit['screens'][-1]['height'] = 1920
    print(json.dumps({'png_path': str(FINAL), 'menu': rect, 'page_errors': capture.audit['page_errors'], 'blocked_writes': capture.audit['blocked_writes']}, indent=2), flush=True)
print('DONE: one screenshot; own browser/context/server closed.', flush=True)
