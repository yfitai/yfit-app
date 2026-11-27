#!/usr/bin/env python3
"""Capture one actual Goals manual-entry form; no live data, writes, or results."""
import hashlib
import json
import sys
from pathlib import Path

WORK = Path('/home/ubuntu/yfit-screen-library-2026-11-27/work/goals')
FINAL = Path('/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_02_goals.png')
SOURCE = Path('/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source')
sys.path.insert(0, str(WORK.parent))
from offline_capture_base import OfflineCapture, prior

UID = prior.UID
fixtures = {
    'user_goals': [{
        'user_id': UID, 'age': 35, 'gender': 'male',
        'height_cm': 175, 'weight_kg': 80,
        'activity_level': 'light', 'goal_type': 'maintain',
        'weight_change_rate': 1,
        'starting_weight_kg': 80, 'target_weight_kg': None,
        'starting_body_fat_percentage': None,
        'target_body_fat_percentage': None, 'target_date': None,
        'weekly_goal_kg': 0.5, 'fiber_goal_g': 25,
        'sugar_goal_g': 50, 'sodium_goal_mg': 2300,
        'water_goal_ml': 2000, 'steps_goal': 10000, 'sleep_hours_goal': 8,
        'created_at': '2026-11-27T00:00:00Z'
    }],
    'user_profiles': [{**prior.PROFILE, 'activity_level': 'light'}],
    'user_preferences': [{'user_id': UID, 'preferred_unit_system': 'imperial',
                          'preferred_distance_unit': 'imperial'}],
    'body_measurements': [], 'calculated_metrics': [],
    'meals': [], 'daily_logs': [], 'progress_measurements': [],
    'subscriptions': []
}

def main():
    FINAL.parent.mkdir(parents=True, exist_ok=True)
    with OfflineCapture(WORK, fixtures=fixtures) as capture:
        capture.audit.update({
            'id': 'goals', 'route': '/goals',
            'actual_component': 'src/components/Goals.jsx',
            'source_files_inspected': ['src/App.jsx', 'src/components/Goals.jsx',
                                       'src/components/GoalsEnhancement.jsx',
                                       'src/components/Navigation.jsx'],
            'component_source_sha256': hashlib.sha256((SOURCE / 'src/components/Goals.jsx').read_bytes()).hexdigest(),
            'compile_reused_unchanged': True,
            'css_or_dom_content_modified': False,
            'model_results_supplied': False,
            'save_or_calculate_clicked': False,
            'live_auth_used': False,
            'production_modified': False,
            'viewport_css_pixels': [540, 960], 'device_scale_factor': 2,
            'ui_actions': []
        })
        capture.goto('/goals')
        page = capture.page
        page.wait_for_function("Array.from(document.querySelectorAll('input')).some(el => el.value === '35')")
        page.wait_for_timeout(1000)
        assert page.url.endswith('/goals')
        inputs = page.locator('input').evaluate_all('(elements) => elements.map(el => ({value: el.value, placeholder: el.placeholder}))')
        assert any(x['value'] == '5' and x['placeholder'] == 'Feet' for x in inputs), inputs
        assert any(x['value'] == '9' and x['placeholder'] == 'Inches' for x in inputs), inputs
        assert any(x['value'] == '176.4' for x in inputs), inputs
        card = page.get_by_placeholder('Enter your age', exact=True).locator('../../..')
        start = card.get_by_role('heading', level=2)
        assert start.count() == 1
        nav_height = page.locator('nav').bounding_box()['height']
        card_box = card.bounding_box()
        scroll_y = max(0, card_box['y'] + page.evaluate('window.scrollY') - nav_height - 16)
        page.evaluate('(y) => window.scrollTo(0, y)', scroll_y)
        page.wait_for_timeout(400)
        body = page.locator('body').inner_text()
        assert 'NaN' not in body and 'Error saving' not in body
        assert not page.locator('#results-section').count()
        capture.audit['ui_actions'].append({'action': 'scroll', 'target': 'actual Starting Point card',
                                             'scroll_y': page.evaluate('window.scrollY')})
        capture.audit['input_values'] = inputs
        capture.audit['form_card_bbox'] = card.bounding_box()
        capture.audit['navigation_height'] = nav_height
        print(json.dumps({'navigation_height': nav_height, 'form_card_bbox': card.bounding_box(),
                          'body_text': body[:3000]}, indent=2), flush=True)
        capture.save(str(FINAL), 'Actual authenticated Goals.jsx Starting Point manual-entry form, fictional age 35 / height 175 cm displayed as 5 ft 9 in / weight 80 kg displayed as 176.4 lbs / light activity / maintain goal. No calculated or AI results, no save action; original app colors unchanged.')
        body_file = FINAL.with_name(FINAL.name.replace('.png', '-body.txt'))
        body_file.replace(WORK / 'screen_02_goals-body.txt')
        assert not capture.audit['page_errors'], capture.audit['page_errors']
        assert all(x['path'] == '/rest/v1/feature_analytics' for x in capture.audit['blocked_writes']), capture.audit['blocked_writes']
    print(f'Saved one 1080x1920 actual-app screenshot: {FINAL}', flush=True)

if __name__ == '__main__':
    main()
