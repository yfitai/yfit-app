#!/usr/bin/env python3
"""Capture genuine YFIT app UI locally. No upload, live auth, model call or post.
All displayed account/data rows are fictional browser-intercepted fixtures.
"""
import base64
import hashlib
import json
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
BUILD = Path('/home/ubuntu/.manus/yfit-go-nov26/web-build')
PROJECT = 'mxggxpoxgqubojvumjlt'
USER_ID = '00000000-0000-4000-8000-000000000001'
USER = {'id': USER_ID, 'aud': 'authenticated', 'role': 'authenticated',
        'email': 'screenshot-demo@example.invalid',
        'app_metadata': {'provider': 'email', 'providers': ['email']},
        'user_metadata': {'full_name': 'Demo User', 'first_name': 'Demo', 'last_name': 'User'},
        'created_at': '2026-11-26T00:00:00Z'}
PROFILE = {'id': USER_ID, 'user_id': USER_ID, 'first_name': 'Demo', 'last_name': 'User',
           'full_name': 'Demo User', 'onboarding_completed': True, 'install_guide_shown': True,
           'age': 45, 'gender': 'male', 'height_cm': 175, 'weight_kg': 80,
           'target_calories': 2200, 'activity_level': 'moderately_active'}
CONV = {'id': '00000000-0000-4000-8000-000000000002', 'user_id': USER_ID,
        'title': 'Screenshot preview', 'status': 'active', 'last_message_at': '2026-11-26T12:00:00Z'}
MED = {'id': '00000000-0000-4000-8000-000000000003', 'user_id': USER_ID,
       'medication_id': '00000000-0000-4000-8000-000000000004',
       'dosage': 'Sample prescribed strength', 'frequency': 'Once weekly',
       'scheduled_weekdays': [1], 'route': 'Oral', 'is_active': True,
       'is_supplement': False, 'combination_ingredients': [],
       'notes': 'Fictional example for screenshot preparation. Not a medical recommendation.',
       'created_at': '2026-11-26T00:00:00Z',
       'medication': {'id': '00000000-0000-4000-8000-000000000004',
                      'name': 'Demo medication', 'brand_name': 'Demo medication',
                      'generic_name': 'Fictional example', 'category': 'Sample'}}
EXERCISES = [
    {'id': 'demo-squat', 'name': 'Bodyweight Squat', 'category': 'Legs', 'target': 'quadriceps',
     'body_parts': ['quadriceps'], 'target_muscles': ['quadriceps'], 'equipment': ['bodyweight'], 'difficulty': 'beginner',
     'instructions': ['Stand with feet shoulder-width apart.', 'Lower with control.', 'Return to standing.'],
     'gif_url': None, 'image_url': None},
    {'id': 'demo-pushup', 'name': 'Push-Up', 'category': 'Push', 'target': 'pectorals',
     'body_parts': ['chest'], 'target_muscles': ['chest'], 'equipment': ['bodyweight'], 'difficulty': 'beginner',
     'instructions': ['Start in a plank position.', 'Lower with control.', 'Press back up.'],
     'gif_url': None, 'image_url': None},
    {'id': 'demo-plank', 'name': 'Plank', 'category': 'Core', 'target': 'abdominals',
     'body_parts': ['abdominals'], 'target_muscles': ['abdominals'], 'equipment': ['bodyweight'], 'difficulty': 'beginner',
     'instructions': ['Keep a straight body line.', 'Hold a comfortable position.'],
     'gif_url': None, 'image_url': None}
]
SCREENS = [
    ('dashboard', '/dashboard', 'screen_01_dashboard.png', 'Dashboard'),
    ('fitness', '/fitness', 'screen_05_fitness.png', 'Fitness'),
    ('aiCoach', '/ai-coach-faq', 'screen_10_aiCoach.png', 'AI Coach'),
    ('medications', '/medications', 'screen_06_medications.png', 'Medications'),
]

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def do_GET(self):
        target = urlsplit(self.path).path
        if target.startswith('/api/'):
            self.send_error(404)
            return
        if target in [s[1] for s in SCREENS] or target == '/':
            self.path = '/index.html'
        super().do_GET()


def b64(value):
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')


def fixture_rows(table, query):
    if table == 'user_profiles': return [PROFILE]
    if table == 'subscriptions': return [{'id': 'demo-subscription', 'user_id': USER_ID,
        'plan_type': 'pro_monthly', 'status': 'active', 'trial_end': None}]
    if table == 'user_preferences': return [{'user_id': USER_ID, 'unit_system': 'metric',
        'preferred_unit_system': 'metric', 'preferred_distance_unit': 'metric',
        'weight_unit': 'kg', 'height_unit': 'cm', 'distance_unit': 'km'}]
    if table == 'user_goals': return [{'user_id': USER_ID, 'steps_goal': 10000,
        'target_weight': 75, 'current_weight': 80, 'fitness_goal': 'general_fitness'}]
    if table == 'calculated_metrics': return [{'user_id': USER_ID, 'adjusted_calories': 2200,
        'target_calories': 2200, 'bmr': 1700, 'tdee': 2400}]
    if table == 'daily_logs': return [{'id': 'demo-daily', 'user_id': USER_ID,
        'steps': 6400, 'water_intake': 1.8, 'logged_at': '2026-11-26T12:00:00Z',
        'date': '2026-11-26'}]
    if table == 'meals': return [{'id': 'demo-meal', 'user_id': USER_ID, 'calories': 1450,
        'protein': 90, 'carbs': 150, 'fat': 45, 'meal_name': 'Sample meals'}]
    if table == 'ai_conversations': return [CONV]
    if table == 'ai_messages': return [{'id': 'demo-message', 'conversation_id': CONV['id'],
        'role': 'assistant', 'content': 'Welcome to YFIT AI Coach. This screenshot preview uses fictional sample data; no live AI conversation has been started.',
        'created_at': '2026-11-26T12:00:00Z'}]
    if table == 'user_medications':
        return [] if query.get('is_supplement', [''])[0] == 'eq.true' else [MED]
    if table == 'exercises': return EXERCISES
    return []


def main():
    assert (BUILD / 'index.html').is_file(), 'Existing nonrelease web build is required.'
    (ROOT / 'candidates').mkdir(exist_ok=True)
    (ROOT / 'evidence').mkdir(exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(BUILD)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f'http://127.0.0.1:{server.server_port}'
    audit = {'capture_type': 'actual app UI with fictional offline fixtures',
             'build_directory': str(BUILD), 'app_revision': '0724d1962147075bd9211a8351c50b3758b2ac1a',
             'live_network_requests_allowed': 0, 'uploads': 0, 'model_calls': 0,
             'external_interceptions': [], 'blocked_write_attempts': [], 'page_errors': [], 'screens': []}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/usr/bin/chromium',
                                        args=['--no-sandbox', '--disable-background-networking'])
            context = browser.new_context(viewport={'width': 540, 'height': 960},
                device_scale_factor=2, locale='en-CA', timezone_id='Etc/GMT+5',
                service_workers='block')
            context.route_web_socket('**/*', lambda ws: ws.close())
            def intercept(route):
                req = route.request
                u = urlsplit(req.url)
                if req.method != 'GET':
                    audit['blocked_write_attempts'].append({'host': u.hostname, 'path': u.path, 'method': req.method})
                    route.abort()
                    return
                if req.url.startswith(origin + '/'):
                    route.continue_()
                    return
                audit['external_interceptions'].append({'host': u.hostname, 'path': u.path, 'method': req.method})
                if u.hostname == PROJECT + '.supabase.co' and u.path == '/auth/v1/user':
                    route.fulfill(status=200, content_type='application/json', body=json.dumps(USER))
                    return
                if u.hostname == PROJECT + '.supabase.co' and u.path.startswith('/rest/v1/'):
                    rows = fixture_rows(u.path.rsplit('/', 1)[-1], parse_qs(u.query))
                    wants_object = 'vnd.pgrst.object' in req.headers.get('accept', '')
                    body = rows[0] if wants_object and rows else (None if wants_object else rows)
                    route.fulfill(status=200, content_type='application/json', body=json.dumps(body),
                        headers={'Content-Range': f'0-{max(0, len(rows)-1)}/{len(rows)}'})
                    return
                route.abort()
            context.route('**/*', intercept)
            now = int(time.time())
            fake_access = b64({'alg': 'none', 'typ': 'JWT'}) + '.' + b64({'sub': USER_ID, 'exp': now + 3600}) + '.offline-only'
            session = {'access_token': fake_access, 'token_type': 'bearer', 'expires_in': 3600,
                       'expires_at': now + 3600, 'refresh_token': 'offline-fictional-refresh', 'user': USER}
            context.add_init_script('''localStorage.clear(); sessionStorage.clear();
                localStorage.setItem('sb-''' + PROJECT + '''-auth-token', ''' + json.dumps(json.dumps(session)) + ''');
                localStorage.setItem('i18nextLng','en');
                localStorage.setItem('yfit_language','en');
                localStorage.setItem('yfit_analytics_excluded','true');
                localStorage.setItem('umami.disabled','1');
                localStorage.setItem('yfit_insight_dismissed_date',new Date().toDateString());
            ''')
            page = context.new_page()
            page.on('pageerror', lambda e: audit['page_errors'].append(str(e)[:300]))
            for key, path, filename, heading in SCREENS:
                print('Capturing actual page:', key, flush=True)
                page.goto(origin + path, wait_until='networkidle', timeout=30000)
                page.wait_for_timeout(6500)
                page.evaluate('document.fonts.ready')
                text = page.locator('body').inner_text()
                (ROOT / 'evidence' / f'{key}-body.txt').write_text(text + '\n')
                if 'Sign in to your account' in text or 'App Preview' in text or 'GUEST MODE' in text:
                    raise RuntimeError(f'{key}: reached auth/guest/mockup page instead of actual UI')
                if heading.lower() not in text.lower():
                    page.screenshot(path=str(ROOT / 'evidence' / f'{key}-failure.png'))
                    print('Local page text:', repr(text[:700]), flush=True)
                    raise RuntimeError(f'{key}: expected heading not found')
                out = ROOT / 'candidates' / filename
                page.screenshot(path=str(out), full_page=False, animations='disabled')
                digest = hashlib.sha256(out.read_bytes()).hexdigest()
                audit['screens'].append({'key': key, 'route': path, 'filename': filename,
                    'width': 1080, 'height': 1920, 'sha256': digest, 'bytes': out.stat().st_size,
                    'contains_fictional_data': True, 'source': 'actual authenticated-page component, offline preview'})
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        (ROOT / 'evidence' / 'offline-capture.json').write_text(json.dumps(audit, indent=2) + '\n')
    assert len(audit['screens']) == 4
    assert not audit['page_errors'], 'App runtime errors must be resolved before candidate review.'
    print('Four actual-page candidate PNGs captured. No external request, upload or model call allowed.')

if __name__ == '__main__':
    main()
