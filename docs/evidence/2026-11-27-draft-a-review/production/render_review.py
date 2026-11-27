#!/usr/bin/env python3
"""Render review-only Draft A from genuine sample UI, measured narration, and captions.
No production, n8n, API, upload or account operation is performed.
"""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROD = ROOT / 'production'
ASSETS = ROOT / 'assets-capture'
FPS = 25
BACKGROUND = '0x0d1620'
NARRATION = ROOT / 'assets/narration-achird.wav'
OUTPUT = ROOT / 'YFIT_Draft_A_Friendly_Male_Review.mp4'

def run(cmd):
    subprocess.run(cmd, check=True, cwd=ROOT)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],text=True))

audio_duration = float(probe(NARRATION)['format']['duration'])
final_duration = audio_duration + 2.4
segments = [
    {'id':'01-result-hook', 'start':0, 'end':4.6, 'file':ASSETS/'png/03-history-expanded-clean.png',
     'filter':f'crop=1080:822:0:275,scale=980:-2,pad=1080:1920:(ow-iw)/2:370:color={BACKGROUND}',
     'description':'Real expanded sample workout; immediate result-first opening, banner cropped but persistent video SAMPLE DATA label retained.'},
    {'id':'02-navigation', 'start':4.6, 'end':6.72, 'file':ASSETS/'png/01-history-context-clean.png',
     'filter':f'crop=1080:1052:0:276,scale=980:-2,pad=1080:1920:(ow-iw)/2:310:color={BACKGROUND}',
     'description':'Real Fitness navigation and selected History tab; no fabricated navigation or clinical claims.'},
    {'id':'03-real-click', 'start':6.72, 'end':7.84, 'file':ASSETS/'video/history-click-clean.mp4',
     'filter':f'crop=540:84:0:138,scale=980:-2,pad=1080:1920:(ow-iw)/2:530:color={BACKGROUND}',
     'description':'Genuine workout-header click; native chevron changes at output approximately7.16sec; no fabricated cursor movement.'},
    {'id':'04-expanded-details', 'start':7.84, 'end':11.65, 'file':ASSETS/'png/03-history-expanded-clean.png',
     'filter':f'crop=1080:822:0:275,scale=980:-2,pad=1080:1920:(ow-iw)/2:370:color={BACKGROUND}',
     'description':'Explanatory edit to actual exercise/weight/repetition rows after the real click, excluding phone mockup and log button.'},
    {'id':'05-explore-invitation', 'start':11.65, 'end':final_duration, 'file':ASSETS/'png/04-go-current-explore-cta.png',
     'filter':f'scale=980:-2,pad=1080:1920:(ow-iw)/2:770:color={BACKGROUND}',
     'description':'Actual current Go Explore CTA crop; clearly presented as closing invitation, not a private-account editor.'},
]

for seg in segments:
    out = PROD / (seg['id']+'.mp4')
    cmd = ['ffmpeg','-y','-hide_banner','-loglevel','warning','-threads','2']
    if seg['file'].suffix=='.png': cmd += ['-loop','1']
    cmd += ['-i',str(seg['file']),'-t',str(seg['end']-seg['start']),'-vf',seg['filter'],
            '-an','-r',str(FPS),'-c:v','libx264','-preset','fast','-crf','19',
            '-pix_fmt','yuv420p','-threads','2',str(out)]
    print('Rendering',seg['id'],flush=True)
    run(cmd)
    seg['rendered_file']=str(out)

(PROD/'concat.txt').write_text(''.join(f"file '{s['rendered_file']}'\n" for s in segments))
run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','concat','-safe','0','-i',str(PROD/'concat.txt'),
     '-c','copy',str(PROD/'picture.mp4')])
# Add closing guidance to the caption track, separate from the genuine Go CTA artwork.
ass_path = PROD/'captions-and-titles.ass'
ass = ass_path.read_text()
# Align header and support text to generous social-video safe areas.
ass += 'Dialogue: 1,0:00:11.65,0:00:21.12,Heading,,0,0,0,,{\\an8\\pos(540,430)\\fs52}Take a look around.\n'
ass += 'Dialogue: 1,0:00:11.65,0:00:21.12,Footer,,0,0,0,,{\\an8\\pos(540,1000)\\fs42}app.yfitai.com/go\n'
ass += 'Dialogue: 1,0:00:18.72,0:00:21.12,Caption,,0,0,0,,Sample app first.\\NYour own records need an account.\n'
(PROD/'final-titles.ass').write_text(ass)
run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-i',str(PROD/'picture.mp4'),'-i',str(NARRATION),
     '-vf',f'ass={PROD}/final-titles.ass',
     '-af','loudnorm=I=-16:TP=-1.5:LRA=11,apad',
     '-map','0:v:0','-map','1:a:0','-t',str(final_duration),'-r',str(FPS),
     '-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','2',
     '-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(OUTPUT)])

result = probe(OUTPUT)
assert any(s.get('codec_type')=='audio' for s in result['streams'])
v = next(s for s in result['streams'] if s.get('codec_type')=='video')
assert (v['width'],v['height'])==(1080,1920)
assert abs(float(result['format']['duration'])-final_duration)<0.1

manifest = {
 'purpose':'Owner-requested offline finished Draft A sample for review only; not approved for public posting',
 'source_revision':'20cae3de9b8d9160618299a1f81fa2b79021258a',
 'voice':{'name':'Achird','gender':'male','language_code':'en-US','style':'casual, friendly','narration_duration_seconds':audio_duration,
          'spoken_brand':'Why Fit','display_brand':'YFIT'},
 'format':{'width':1080,'height':1920,'fps':FPS,'duration_seconds':float(result['format']['duration']),'audio_codec':'aac','video_codec':'h264'},
 'segments':[{k:str(val) if isinstance(val,Path) else val for k,val in s.items()} for s in segments],
 'authenticity':'Real current guest/sample app source and its fictional demo data. Native click footage plus explanatory crops/holds, not continuous private-account footage. No invented UI, moving-tap AI simulation or clinical results.',
 'external_calls':'One authorized speech generation and one speech transcription. App capture allowed zero external requests; no n8n/generator/assembler/live app call.',
 'unchanged':['production app','Go page','analytics tracker/property','pricing/offers','auth/accounts/records','Build109','n8n workflow/schedule','platform posting/report connections'],
 'published':False,'uploaded_to_supabase':False,
 'output':str(OUTPUT),'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'bytes':OUTPUT.stat().st_size,
 'captions':str(ROOT/'YFIT_Draft_A_Captions.srt'),
 'notes':'No background music in this first review take so the owner can judge the male voice and app clarity. Closing instruction targets profile-link platforms; CTA would be adapted for other approved platform destinations.'
}
(PROD/'production-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
(PROD/'final-probe.json').write_text(json.dumps(result,indent=2)+'\n')
print('Finished review video:',OUTPUT,flush=True)
print('Duration seconds:',result['format']['duration'],'Bytes:',OUTPUT.stat().st_size,flush=True)
