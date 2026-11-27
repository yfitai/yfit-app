#!/usr/bin/env python3
"""Reusable local actual-app capture fixture. No live auth or writes allowed."""
import importlib.util, json, time, threading, hashlib
from pathlib import Path
from functools import partial
from urllib.parse import urlsplit, parse_qs
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

BASE = Path('/home/ubuntu/yfit-article-demo-2026-11-27')
spec = importlib.util.spec_from_file_location('verified_article_capture', BASE / 'capture_actual_ui.py')
prior = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)
BUILD = BASE / 'offline-web'

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_GET(self):
        path = urlsplit(self.path).path
        if path.startswith('/api/'):
            self.send_error(403); return
        if not '.' in path.rsplit('/',1)[-1] and not path.startswith('/assets/'):
            self.path = '/index.html'
        super().do_GET()

class OfflineCapture:
    def __init__(self, outdir, fixtures=None):
        self.outdir = Path(outdir); self.outdir.mkdir(parents=True, exist_ok=True)
        self.fixtures = dict(prior.FIXTURES)
        if fixtures: self.fixtures.update(fixtures)
        self.audit = {'source_revision': prior.REV, 'actual_components': True, 'fictional_data': True,
                      'source_audit_reused': str(BASE / 'safe-audit-provenance.json'),
                      'external_sent': 0, 'non_get_sent': 0, 'blocked_writes': [], 'blocked_external_gets': [],
                      'page_errors': [], 'screens': [], 'server_stopped': False}
    def __enter__(self):
        assert (BUILD / 'index.html').is_file()
        checked=json.loads((BASE / 'safe-audit-provenance.json').read_text())
        assert all(x['matches_declared_revision'] for x in checked['source_checks'])
        self.server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BUILD)))
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.origin=f'http://127.0.0.1:{self.server.server_port}'
        self.p=sync_playwright().start()
        self.browser=self.p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'])
        self.context=self.browser.new_context(viewport={'width':540,'height':960},device_scale_factor=2,locale='en-CA',timezone_id='America/Toronto',service_workers='block')
        self.context.route_web_socket('**/*',lambda socket:socket.close())
        def intercept(route):
            req=route.request;u=urlsplit(req.url);entry={'method':req.method,'host':u.hostname,'path':u.path}
            if req.method!='GET':self.audit['blocked_writes'].append(entry);route.abort();return
            if f'{u.scheme}://{u.netloc}'==self.origin and not u.path.startswith('/api/'):
                route.continue_();return
            if u.hostname==prior.PROJECT+'.supabase.co' and u.path=='/auth/v1/user':
                route.fulfill(status=200,content_type='application/json',body=json.dumps(prior.USER));return
            if u.hostname==prior.PROJECT+'.supabase.co' and u.path.startswith('/rest/v1/'):
                table=u.path.rsplit('/',1)[-1];rows=self.fixtures.get(table,[])
                wants='vnd.pgrst.object' in req.headers.get('accept','')
                body=rows[0] if wants and rows else (None if wants else rows)
                route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers={'Content-Range':f'0-{max(0,len(rows)-1)}/{len(rows)}'});return
            self.audit['blocked_external_gets'].append(entry);route.abort()
        self.context.route('**/*',intercept)
        now=int(time.time());token=prior.b64({'alg':'none','typ':'JWT'})+'.'+prior.b64({'sub':prior.UID,'exp':now+3600})+'.offline-only'
        session={'access_token':token,'token_type':'bearer','expires_in':3600,'expires_at':now+3600,'refresh_token':'offline-fictional-refresh','user':prior.USER}
        self.context.add_init_script('localStorage.clear();sessionStorage.clear();localStorage.setItem('+json.dumps('sb-'+prior.PROJECT+'-auth-token')+','+json.dumps(json.dumps(session))+');'+"localStorage.setItem('i18nextLng','en');localStorage.setItem('yfit_language','en');localStorage.setItem('yfit_cookie_consent','declined');localStorage.setItem('yfit_analytics_excluded','true');localStorage.setItem('umami.disabled','1');localStorage.setItem('yfit_water_unit','ml');localStorage.setItem('yfit_insight_dismissed_date',new Date().toDateString());")
        self.page=self.context.new_page();self.page.set_default_timeout(15000)
        self.page.on('pageerror',lambda e:self.audit['page_errors'].append(str(e)))
        return self
    def goto(self, route):
        self.page.goto(self.origin+route,wait_until='networkidle');self.page.wait_for_timeout(2500)
        self.page.evaluate('document.fonts.ready')
    def save(self, name, description):
        from PIL import Image
        body=self.page.locator('body').inner_text()
        assert not any(x in body for x in ['Sign in to your account','GUEST MODE','DEMO MODE','App Preview','NaN']), 'Wrong or invalid UI'
        dest=self.outdir/name;self.page.screenshot(path=str(dest),animations='disabled')
        assert Image.open(dest).size==(1080,1920)
        self.audit['screens'].append({'path':str(dest),'description':description,'route':urlsplit(self.page.url).path,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
        (self.outdir/(name.replace('.png','-body.txt'))).write_text(body+'\n')
        return dest
    def __exit__(self, typ, value, trace):
        self.context.close();self.browser.close();self.p.stop()
        self.server.shutdown();self.server.server_close();self.thread.join(timeout=3)
        self.audit['server_stopped']=True
        (self.outdir/'safe-audit.json').write_text(json.dumps(self.audit,indent=2)+'\n')
        (self.outdir/'fictional-fixtures.json').write_text(json.dumps(self.fixtures,indent=2)+'\n')
