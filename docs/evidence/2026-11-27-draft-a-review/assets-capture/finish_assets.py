#!/usr/bin/env python3
"""Faithful crops only. No invented UI, added labels or content changes."""
import json, subprocess, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
raw=ROOT/'video/history-click-raw.webm'
# Reviewed source frames: 3.00s collapsed; 3.04s first expanded at 25fps.
# These bounds refer to the delivered recording. For a new capture, re-review
# click-adjacent frames from that capture's monotonic audit before final trimming.
start,end=2.60,3.70
for name,crop in [('history-click-clean.mp4','crop=540:222:0:0'),('history-click-active-ui.mp4','crop=540:960:0:0')]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(start),'-i',str(raw),'-t',str(end-start),'-vf',crop,'-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'video'/name)],check=True)
audit=json.loads((ROOT/'audit/offline-capture-audit.json').read_text())
def probe(p):
    result=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,avg_frame_rate,codec_name','-of','json',str(p)],text=True)
    return json.loads(result)
manifest={
 'purpose':'Draft A review-only vertical edit source assets; not published/uploaded',
 'source_revision':audit['revision'],
 'source_type':'actual current guest/sample app components, untouched archived app source; built-in fictional demoData.js values; not private-account UI',
 'clean_stills':[s for s in audit['screens'] if 'clean' in Path(s['path']).name or 'explore-cta' in Path(s['path']).name],
 'evidence_only_stills':[s['path'] for s in audit['screens'] if s not in [s for s in audit['screens'] if 'clean' in Path(s['path']).name or 'explore-cta' in Path(s['path']).name]],
 'raw_video':{'path':str(raw),'media':probe(raw),'silent':True,'native_ui_region':{'x':0,'y':0,'width':540,'height':960},'limitations':'1080x1920 recorder canvas has 540x960 native UI in upper-left and grey padding. Setup contains marketing previews and may briefly contain My Plan text; use only documented cropped click strip for final edit.'},
 'click_segment':{'path':str(ROOT/'video/history-click-clean.mp4'),'source_range_seconds':[start,end],'duration_seconds':1.12,'crop_raw_pixels':{'x':0,'y':0,'width':540,'height':222},'media':probe(ROOT/'video/history-click-clean.mp4'),'content':'Built-in demo label and actual Push Day A heading; real click rotates chevron, no phone mockup or medical text. Exercise rows require explanatory cut to clean expanded still.'},
 'active_ui_segment_evidence':{'path':str(ROOT/'video/history-click-active-ui.mp4'),'source_range_seconds':[start,end],'crop_raw_pixels':{'x':0,'y':0,'width':540,'height':960},'warning':'Includes marketing phone mockup below heading before click; evidence only.'},
 'action_timing':{'clock':'Python time.monotonic; relative to new_page() returned; recorder first-frame origin differs by approximately 0.1 sec','monotonic_events':audit['actions'],'video_observed_transition':{'last_collapsed_frame_seconds':3.00,'first_expanded_frame_seconds':3.04,'fps':25,'uncertainty_seconds':0.04}},
 'authenticity':{'genuine':'History tab, clickable Push Day A heading, chevron state and actual mapped exercise rows/sets from GuestFitnessPage.jsx','mockup':'FitnessMockup embedded above every History card is static marketing App Preview; excluded from recommended clean assets','data':'Fictional sample source values, not invented offline records and no real personal data. Built-in DEMO MODE / exploring with sample data label retained in Fitness assets.'},
 'safety':{'external_requests_allowed':0,'non_get_allowed':0,'uploads':0,'analytics_consent':'declined in fresh isolated browser; no umami loaded','blocked_requests':audit['blocked_requests'],'websocket_policy':'route_web_socket closes every attempted socket; final static capture attempted none','service_workers':'blocked','page_errors':audit['page_errors'],'server_stopped':audit['server_stopped'],'production_modified':False,'canonical_source_modified':False,'canonical_git_modified':False,'accounts_or_records_modified':False},
 'limitations':['Uncropped viewport images contain marketing phone previews or Go hero marketing/health/AI claims: evidence only.','Go logo is external and was blocked; recommended CTA crop excludes the failed logo and hero claims.','Direct /fitness?mode=guest has an existing logged-out redirect race; genuine /go?mode=guest entry then real Fitness navigation was used.','Clean assets are honest source-region crops, not 9:16 full-frame UI; parent may frame them without distorting.','Recorder pointer is not burned in. Chevron changes and revealed rows verify click action.'],
 'reproduction':{'capture_script':str(ROOT/'capture_assets.py'),'server_launcher':str(ROOT/'local-vite.mjs'),'crop_script':str(ROOT/'finish_assets.py'),'command':'python3 capture_assets.py && python3 finish_assets.py','no_cloud_browser':True,'local_compilation':'Direct Vite API, no npm build/prebuild, archived app source unchanged, output offline-web in this workspace only, symlink read-only dependencies and local cacheDir.'}
}
(ROOT/'safe-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(ROOT/'safe-manifest.json')
