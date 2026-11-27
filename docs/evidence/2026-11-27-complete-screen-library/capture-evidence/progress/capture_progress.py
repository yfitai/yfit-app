#!/usr/bin/env python3
"""One actual Progress screenshot; isolated browser, fictional GET fixtures only."""
import json
import shutil
import sys
from pathlib import Path
sys.path.insert(0, '/home/ubuntu/yfit-screen-library-2026-11-27/work')
from offline_capture_base import OfflineCapture, prior

WORK = Path('/home/ubuntu/yfit-screen-library-2026-11-27/work/progress')
FINAL = Path('/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_07_progress.png')
# Progress.jsx loadGoals reads these exact keys. Current equals starting: no
# fabricated change, achieved goal, chart trend, model output or saved UI action.
goals = dict(prior.GOALS, id='fictional-progress-goal', goal_type='lose_weight',
             weight_kg=80, starting_weight_kg=80, height_cm=175,
             target_weight_kg=76, starting_body_fat_percentage=20,
             target_body_fat_percentage=18, target_weight=76,
             updated_at='2026-11-27T00:00:00Z')
fixtures = {
    'user_goals': [goals],
    'daily_logs': [dict(prior.LOG)],
    'calculated_metrics': [],
    'weight_logs': [], 'body_composition_logs': [],
    'body_measurements_logs': [], 'meal_logs': [], 'meals': [],
    'workout_sessions': [], 'form_analysis_sessions': [], 'progress_photos': [],
}
with OfflineCapture(WORK, fixtures) as cap:
    cap.goto('/progress')
    cap.page.wait_for_timeout(2000)
    body = cap.page.locator('body').inner_text()
    (WORK / 'initial-body.txt').write_text(body + '\n')
    for heading in cap.page.get_by_role('heading').all():
        print(json.dumps({'heading': heading.inner_text(), 'box': heading.bounding_box()}), flush=True)
    assert 'My Progress' in body, body
    assert '176.4' in body and '20.0' in body and '26.1' in body, body
    assert not any(s in body for s in ["You're On Track!", 'Adjust Your Pace', 'NaN', 'Failed to', 'Something went wrong'])
    cap.audit.update({
        'route': '/progress',
        'actual_component': 'src/components/Progress.jsx (OverviewCard)',
        'production_modified': False, 'canonical_source_modified': False,
        'canonical_git_modified': False, 'model_calls': 0, 'uploads': 0,
        'analytics_allowed': False, 'ui_actions': [],
        'overview_inputs': {'starting_weight_kg':80, 'current_weight_kg':80,
                            'target_weight_kg':76, 'height_cm':175,
                            'starting_body_fat_percentage':20,
                            'current_body_fat_percentage':20,
                            'target_body_fat_percentage':18},
        'display_calculations': 'Actual component computes kg*2.20462 and BMI=kg/(height_cm/100)^2, then toFixed(1); no precomputed fixture results.',
    })
    image = cap.save('screen_07_progress.png', 'Actual authenticated Progress overview at initial starting measurements; fictional GET records, no trend/prediction/model output, no saves; original unmodified app colors.')
    FINAL.parent.mkdir(parents=True, exist_ok=True)
    assert not FINAL.exists(), 'Refusing to overwrite an existing shared page asset'
    shutil.copyfile(image, FINAL)
    cap.audit['final_png_path'] = str(FINAL)
    print('CAPTURED', FINAL, flush=True)
assert not cap.audit['page_errors'], cap.audit['page_errors']
assert cap.audit['external_sent'] == 0 and cap.audit['non_get_sent'] == 0
print('COMPLETE; isolated browser and loopback server stopped.', flush=True)
