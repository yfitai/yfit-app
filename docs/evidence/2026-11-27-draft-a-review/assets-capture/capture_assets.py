#!/usr/bin/env python3
"""Review-only YFIT genuine guest UI capture. No live requests/auth/data/uploads.
Run: python3 capture_assets.py
Source is an untouched git archive of the declared revision. All output stays here.
The raw setup recording is evidence only; use trimmed/cropped click segment in edits.
"""
import hashlib, json, os, signal, subprocess, time, urllib.request
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
REV='20cae3de9b8d9160618299a1f81fa2b79021258a'
ORIGIN='http://127.0.0.1:5277'
runtime=ROOT/'playwright-runtime'
ffmpeg=runtime/'ffmpeg-1013/ffmpeg-linux'
ffmpeg.parent.mkdir(parents=True,exist_ok=True)
if not ffmpeg.exists(): ffmpeg.symlink_to('/usr/bin/ffmpeg')
os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(runtime)
for d in ['png','video','audit']: (ROOT/d).mkdir(exist_ok=True)
audit={'revision':REV,'network_policy':'only GET to exact loopback origin; all other requests aborted; all websockets closed; service workers blocked; external DNS disabled','allowed_external_requests':0,'allowed_non_get_requests':0,'uploads':0,'auth_sessions':0,'live_records':0,'model_calls':0,'blocked_requests':[],'websockets_closed':[],'page_errors':[],'local_get_count':0,'screens':[],'actions':[]}
INIT="""localStorage.clear();sessionStorage.clear();localStorage.setItem('i18nextLng','en');localStorage.setItem('yfit_language','en');localStorage.setItem('yfit_cookie_consent','declined');localStorage.setItem('yfit_analytics_excluded','true');localStorage.setItem('umami.disabled','1');"""
def secure_context(browser,record=False):
    options=dict(viewport={'width':540,'height':960},device_scale_factor=2,locale='en-CA',timezone_id='America/Toronto',service_workers='block')
    if record: options.update(record_video_dir=str(ROOT/'video/raw'),record_video_size={'width':1080,'height':1920})
    c=browser.new_context(**options)
    def intercept(r):
        req=r.request;u=urlsplit(req.url)
        if req.method=='GET' and f'{u.scheme}://{u.netloc}'==ORIGIN and not u.path.startswith('/api/'):
            audit['local_get_count']+=1;r.continue_()
        else:
            audit['blocked_requests'].append({'method':req.method,'host':u.hostname,'path':u.path});r.abort()
    c.route('**/*',intercept)
    def ws(sock): audit['websockets_closed'].append(urlsplit(sock.url).netloc);sock.close()
    c.route_web_socket('**/*',ws);c.add_init_script(INIT)
    return c

def enter_history(page):
    page.set_default_timeout(15000)
    page.on('pageerror',lambda e:audit['page_errors'].append(str(e)))
    # Genuine guest entry activates its session before in-app navigation.
    # Direct /fitness?mode=guest initially races the logged-out route redirect.
    page.goto(ORIGIN+'/go?mode=guest',wait_until='domcontentloaded',timeout=20000)
    page.locator('nav a[href="/fitness"]:visible').wait_for()
    page.wait_for_timeout(400)
    page.locator('nav a[href="/fitness"]:visible').click()
    page.get_by_role('button',name='History',exact=True).click()
    page.wait_for_timeout(350)
    assert page.url.endswith('/fitness')
    assert 'Metformin' not in page.locator('body').inner_text()
    return page.get_by_text('Push Day A',exact=True)

def png(page,name,description,crop=None):
    out=ROOT/'png'/name
    if crop:
        page.screenshot(path=str(out),clip=crop,animations='disabled')
    else: page.screenshot(path=str(out),animations='disabled')
    im=Image.open(out)
    audit['screens'].append({'path':str(out),'width':im.width,'height':im.height,'description':description,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
    print('PNG',out,flush=True)

log=open(ROOT/'audit/vite-final.log','w')
server=subprocess.Popen(['node',str(ROOT/'local-vite.mjs')],cwd=ROOT,stdout=log,stderr=log,start_new_session=True)
try:
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for _ in range(120):
        if server.poll() is not None: raise RuntimeError('Local server failed; see audit/vite-final.log')
        try: opener.open(ORIGIN,timeout=.5).close();break
        except Exception: time.sleep(.5)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'])
        c=secure_context(browser);page=c.new_page();heading=enter_history(page)
        png(page,'01-history-context.png','Actual guest Fitness with History selected; demo label retained; bottom includes embedded marketing phone preview, crop before it for editing.')
        png(page,'01-history-context-clean.png','Actual guest Fitness title, selected History tab, navigation and sample label; phone preview excluded by faithful crop.',{'x':0,'y':0,'width':540,'height':664})
        box=heading.bounding_box();page.mouse.wheel(0,box['y']-168);page.wait_for_timeout(400)
        png(page,'02-history-collapsed-full.png','Actual collapsed Push Day A heading below demo label. Next card phone mockup dominates lower viewport: evidence only.')
        png(page,'02-history-collapsed-clean.png','Faithful crop retaining sample-data label and actual collapsed Push Day A heading only.',{'x':0,'y':0,'width':540,'height':222})
        heading.click();page.wait_for_timeout(350)
        png(page,'03-history-expanded-full.png','Actual expanded Push Day A exercise rows and weights/reps. Next card marketing preview at bottom: evidence only.')
        png(page,'03-history-expanded-clean.png','Actual interactive guest card expanded: Bench Press, Incline Dumbbell Press, Lateral Raises, Tricep Pushdowns, all twelve weights/reps, sample banner, log button; no phone mockup.',{'x':0,'y':0,'width':540,'height':602})
        # Go landing page in a fresh guest-free tab; only top CTA is required.
        cg=secure_context(browser);gp=cg.new_page()
        gp.goto(ORIGIN+'/go',wait_until='networkidle');gp.wait_for_timeout(300)
        png(gp,'04-go-current-full.png','Current Go top-screen page; external logo blocked; unverified hero claims present. Evidence only, use CTA crop.')
        cta=gp.get_by_text('Explore the app first',exact=True).first.locator('xpath=ancestor::a')
        ctabox=cta.bounding_box()
        png(gp,'04-go-current-explore-cta.png','Genuine current Go top CTA: Explore the app first / No sign-up needed — browse all features now. Cropped to the actual CTA only, excluding hero claims and blocked external logo.',ctabox)
        (ROOT/'audit/go-current-body.txt').write_text(gp.locator('body').inner_text()+'\n')
        cg.close();c.close()
        # A distinct recording captures one genuine click/expansion. Raw includes
        # preparatory guest entry and scrolling; derived segment excludes setup.
        cr=secure_context(browser,record=True)
        creation_before=time.monotonic();rp=cr.new_page();creation_after=time.monotonic()
        audit['recording_page_creation_monotonic']=[creation_before,creation_after]
        h=enter_history(rp)
        b=h.bounding_box();rp.mouse.wheel(0,b['y']-168);rp.wait_for_timeout(400)
        video=rp.video
        audit['actions'].append({'event':'collapsed_ready','monotonic':time.monotonic(),'relative_page_creation':time.monotonic()-creation_after})
        rp.wait_for_timeout(1400)
        audit['actions'].append({'event':'click_begin','monotonic':time.monotonic(),'relative_page_creation':time.monotonic()-creation_after})
        h.click()
        audit['actions'].append({'event':'click_returned','monotonic':time.monotonic(),'relative_page_creation':time.monotonic()-creation_after})
        rp.get_by_role('button',name='Log a similar workout').wait_for(state='visible')
        audit['actions'].append({'event':'expanded_confirmed','monotonic':time.monotonic(),'relative_page_creation':time.monotonic()-creation_after})
        rp.wait_for_timeout(2300)
        audit['actions'].append({'event':'end_hold','monotonic':time.monotonic(),'relative_page_creation':time.monotonic()-creation_after})
        cr.close();video.save_as(str(ROOT/'video/history-click-raw.webm'));browser.close()
        print('VIDEO',ROOT/'video/history-click-raw.webm',flush=True)
finally:
    if server.poll() is None: os.killpg(server.pid,signal.SIGTERM)
    server.wait(timeout=15);log.close()
    audit['server_stopped']=True
    (ROOT/'audit/offline-capture-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
