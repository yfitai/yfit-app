#!/usr/bin/env python3
"""Actual YFIT authenticated-component offline capture; fictional fixtures only.
All work/output is confined to this directory. No live auth, API writes or uploads.
Adapted from canonical docs/evidence/2026-11-26-screenshot-restoration/capture_candidates.py.
"""
import base64, hashlib, json, subprocess, threading, time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
BUILD=ROOT/'offline-web'
ARCHIVE=Path('/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source')
CANONICAL='/home/ubuntu/yfit-app-full'
REV='20cae3de9b8d9160618299a1f81fa2b79021258a'
PROJECT='mxggxpoxgqubojvumjlt'
UID='00000000-0000-4000-8000-000000000001'
DAY='2026-11-27'
USER={'id':UID,'aud':'authenticated','role':'authenticated','email':'article-demo@example.invalid','app_metadata':{'provider':'email','providers':['email']},'user_metadata':{'full_name':'Demo User','first_name':'Demo','last_name':'User'},'created_at':DAY+'T00:00:00Z'}
PROFILE={'id':UID,'user_id':UID,'first_name':'Demo','last_name':'User','full_name':'Demo User','onboarding_completed':True,'install_guide_shown':True,'age':35,'gender':'male','height_cm':175,'weight_kg':80,'target_calories':2200,'activity_level':'moderately_active'}
PREF={'user_id':UID,'preferred_unit_system':'metric','preferred_distance_unit':'metric','use_custom_macros':True,'protein_grams':150,'carb_grams':265,'fat_grams':60,'protein_percent':27,'carb_percent':48,'fat_percent':25}
GOALS={'user_id':UID,'steps_goal':10000,'water_goal_ml':2000,'sleep_hours_goal':8,'goal_type':'maintain','fiber_goal_g':25,'sugar_goal_g':50,'sodium_goal_mg':2300,'target_weight':80,'current_weight':80,'fitness_goal':'general_fitness','created_at':DAY+'T00:00:00Z'}
MEALS=[]
for i,(typ,name,kcal,p,c,f,fiber,sugar,sodium) in enumerate([
 ('breakfast','Greek yogurt, oats & berries',450,25,55,14,7,16,160),
 ('lunch','Chicken, quinoa & vegetables',600,40,65,20,9,7,650),
 ('dinner','Salmon, rice & broccoli',400,25,40,16,6,4,520)]):
 MEALS.append({'id':f'fictional-meal-{i+1}','user_id':UID,'meal_date':DAY,'meal_type':typ,'food_name':name,'calories':kcal,'protein_g':p,'carbs_g':c,'fat_g':f,'fiber':fiber,'sugar':sugar,'sodium':sodium,'serving_quantity':1,'serving_unit':'serving','created_at':DAY+f'T{8+i*5:02d}:00:00Z'})
LOG={'id':'fictional-daily-log','user_id':UID,'logged_at':DAY+'T17:00:00Z','date':DAY,'sleep_hours':7.5,'sleep_quality':'good','water_ml':1800,'steps':6400,'bp_systolic':118,'bp_diastolic':76,'glucose_mg_dl':92,'weight_kg':80,'body_fat_percent':20,'notes':''}
FIXTURES={'user_profiles':[PROFILE],'user_preferences':[PREF],'user_goals':[GOALS],
 'calculated_metrics':[{'user_id':UID,'adjusted_calories':2200,'tdee':2400,'lean_body_mass_kg':64,'calculated_at':DAY+'T00:00:00Z'}],
 'meals':MEALS,'daily_logs':[LOG],
 'subscriptions':[{'id':'fictional-subscription','user_id':UID,'plan_type':'pro_monthly','status':'active','trial_end':None}],
 'progress_measurements':[]}
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
 def do_GET(self):
  path=urlsplit(self.path).path
  if path.startswith('/api/'): self.send_error(403);return
  if path in ['/nutrition','/daily-tracker','/']: self.path='/index.html'
  super().do_GET()
def b64(v):return base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 assert BUILD.joinpath('index.html').is_file()
 audit={'capture_type':'real authenticated components, synthetic offline session and fictional GET fixtures','declared_source_revision':REV,'canonical_head_observed':subprocess.check_output(['git','-C',CANONICAL,'rev-parse','HEAD'],text=True).strip(),'build_directory':str(BUILD),'original_compiled_build':'/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/offline-web','compile_reused':True,'source_checks':[],'allowed_external_requests':0,'live_auth_calls':0,'model_calls':0,'uploads':0,'allowed_non_get_requests':0,'external_interceptions':[],'blocked_write_attempts':[],'blocked_external_gets':[],'websockets_closed':[],'service_workers':'blocked','page_errors':[],'screens':[],'ui_actions':[],'server_stopped':False,'production_modified':False,'canonical_source_modified':False,'canonical_git_modified':False,'real_records_modified':False,'analytics_allowed':False}
 # Verify every actual source module in the existing archive against the declared commit.
 tree=subprocess.check_output(['git','-C',CANONICAL,'ls-tree','-r','--name-only',REV,'src'],text=True).splitlines()
 for f in tree:
  p=ARCHIVE/f
  expected=subprocess.check_output(['git','-C',CANONICAL,'show',REV+':'+f])
  assert p.read_bytes()==expected, 'Archive source altered: '+f
  audit['source_checks'].append({'path':f,'sha256':sha(p),'matches_declared_revision':True})
 audit['source_modules_verified']=len(tree)
 audit['build_files']=[{'path':str(p.relative_to(BUILD)),'sha256':sha(p)} for p in sorted(BUILD.rglob('*')) if p.is_file()]
 (ROOT/'evidence/fictional-fixtures.json').write_text(json.dumps(FIXTURES,indent=2)+'\n')
 assert sum(m['calories'] for m in MEALS)==1450
 assert sum(m['protein_g'] for m in MEALS)==90
 assert PREF['protein_grams']*4+PREF['carb_grams']*4+PREF['fat_grams']*9==2200
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BUILD)))
 thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 origin=f'http://127.0.0.1:{server.server_port}'
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'])
   context=browser.new_context(viewport={'width':540,'height':960},device_scale_factor=2,locale='en-CA',timezone_id='America/Toronto',service_workers='block')
   def ws(sock):audit['websockets_closed'].append(urlsplit(sock.url).netloc);sock.close()
   context.route_web_socket('**/*',ws)
   def intercept(route):
    req=route.request;u=urlsplit(req.url);entry={'method':req.method,'host':u.hostname,'path':u.path}
    if req.method!='GET':audit['blocked_write_attempts'].append(entry);route.abort();return
    if f'{u.scheme}://{u.netloc}'==origin and not u.path.startswith('/api/'):
     route.continue_();return
    audit['external_interceptions'].append(entry)
    if u.hostname==PROJECT+'.supabase.co' and u.path=='/auth/v1/user':
     route.fulfill(status=200,content_type='application/json',body=json.dumps(USER));return
    if u.hostname==PROJECT+'.supabase.co' and u.path.startswith('/rest/v1/'):
     table=u.path.rsplit('/',1)[-1];rows=FIXTURES.get(table,[])
     entry['table']=table;entry['query_fields']=parse_qs(u.query);entry['fixture_rows']=len(rows)
     wants='vnd.pgrst.object' in req.headers.get('accept','')
     body=rows[0] if wants and rows else (None if wants else rows)
     route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers={'Content-Range':f'0-{max(0,len(rows)-1)}/{len(rows)}'});return
    audit['blocked_external_gets'].append(entry);route.abort()
   context.route('**/*',intercept)
   now=int(time.time());token=b64({'alg':'none','typ':'JWT'})+'.'+b64({'sub':UID,'exp':now+3600})+'.offline-only'
   session={'access_token':token,'token_type':'bearer','expires_in':3600,'expires_at':now+3600,'refresh_token':'offline-fictional-refresh','user':USER}
   context.add_init_script('localStorage.clear();sessionStorage.clear();localStorage.setItem('+json.dumps('sb-'+PROJECT+'-auth-token')+','+json.dumps(json.dumps(session))+');'+"localStorage.setItem('i18nextLng','en');localStorage.setItem('yfit_language','en');localStorage.setItem('yfit_cookie_consent','declined');localStorage.setItem('yfit_analytics_excluded','true');localStorage.setItem('umami.disabled','1');localStorage.setItem('yfit_water_unit','ml');localStorage.setItem('yfit_insight_dismissed_date',new Date().toDateString());")
   page=context.new_page();page.set_default_timeout(15000)
   page.on('pageerror',lambda e:audit['page_errors'].append(str(e)))
   def capture(name,description):
    text=page.locator('body').inner_text()
    assert not any(s in text for s in ['Sign in to your account','App Preview','GUEST MODE','DEMO MODE']), 'Wrong auth/guest/mockup UI'
    assert 'NaN' not in text
    (ROOT/'evidence'/name.replace('.png','-body.txt')).write_text(text+'\n')
    out=ROOT/'png'/name;page.screenshot(path=str(out),animations='disabled')
    im=Image.open(out);assert im.size==(1080,1920)
    audit['screens'].append({'path':str(out),'width':im.width,'height':im.height,'description':description,'sha256':sha(out),'route':urlsplit(page.url).path,'scroll_y':page.evaluate('window.scrollY'),'actual_component':True,'fictional_data':True})
    print('CAPTURED',out,flush=True)
   page.goto(origin+'/nutrition',wait_until='networkidle');page.wait_for_timeout(6500);page.evaluate('document.fonts.ready')
   (ROOT/'evidence/nutrition-initial-body.txt').write_text(page.locator('body').inner_text()+'\n')
   page.screenshot(path=str(ROOT/'evidence/nutrition-initial.png'))
   assert '1450 / 2200' in page.locator('body').inner_text()
   assert '90g / 150g' in page.locator('body').inner_text()
   # Scroll actual page to its real Nutrition heading; no DOM/CSS changes.
   head=page.get_by_role('heading',name='Nutrition Tracking',exact=True)
   if head.count()==0:head=page.get_by_role('heading',name='Nutrition',exact=True)
   if head.count():page.evaluate('(y)=>window.scrollTo(0,y)',head.first.bounding_box()['y']+page.evaluate('window.scrollY')-260)
   page.wait_for_timeout(350)
   capture('01-nutrition-overview.png','Actual NutritionUnified/NutritionEnhanced daily summary: 1450/2200 kcal, 750 remaining, protein 90/150 g, carbs 160/265 g and fat 50/60 g; original teal/light app colors.')
   breakfast=page.get_by_role('heading',name='Breakfast',exact=True)
   box=breakfast.bounding_box();page.evaluate('(y)=>window.scrollTo(0,y)',box['y']+page.evaluate('window.scrollY')-170);page.wait_for_timeout(300)
   audit['ui_actions'].append({'action':'scroll','view':'real expanded meal groups; no separate meals tab in source'})
   capture('02-nutrition-logged-meals.png','Actual already-expanded breakfast/lunch/dinner meal sections with fictional balanced meal names and macros; no fabricated meals tab.')
   page.goto(origin+'/daily-tracker',wait_until='networkidle');page.wait_for_timeout(6500);page.evaluate('document.fonts.ready')
   (ROOT/'evidence/tracker-initial-body.txt').write_text(page.locator('body').inner_text()+'\n')
   assert '6400' in page.locator('body').inner_text() and '1800 ml' in page.locator('body').inner_text()
   capture('03-daily-tracker-overview.png','Actual DailyTracker progress overview: sleep 7.5h/8h, water 1800ml/2000ml (1.8L), steps 6400/10000; fictional rows only, no save/add actions.')
   context.close();browser.close()
 finally:
  server.shutdown();server.server_close();thread.join(timeout=3);audit['server_stopped']=True
  audit['fixture_field_names']={k:sorted({key for row in rows for key in row}) for k,rows in FIXTURES.items()}
  audit['nutrition_totals']={key:sum(m[key] for m in MEALS) for key in ['calories','protein_g','carbs_g','fat_g','fiber','sugar','sodium']}
  audit['limitations']=['Synthetic authenticated session, never a live sign-in. Data fictional, not account data or recommendations.','Nutrition has Daily Tracker, Weekly Planner, Templates; meals are sections, not a separate tab.','Canonical checkout HEAD differs from requested main commit; exact requested archive modules were all verified byte-for-byte.','Already-compiled static build was reused unchanged; no canonical npm build, prebuild or git changes.','No recording created; clean accurate PNGs prioritized.']
  (ROOT/'safe-audit-provenance.json').write_text(json.dumps(audit,indent=2)+'\n')
 assert len(audit['screens'])==3
 assert not audit['page_errors'], audit['page_errors']
 print('DONE: three actual UI PNGs; external requests allowed 0; server stopped.',flush=True)
if __name__=='__main__':main()
