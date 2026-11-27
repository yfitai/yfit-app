#!/usr/bin/env python3
"""Offline-only correction: same review, with 'data' in the spoken/static/caption ending."""
import hashlib, json, math, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROD=ROOT/'production';ASSETS=ROOT/'assets';TMP=PROD/'render-work';TMP.mkdir(exist_ok=True)
FPS=25
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
OUTPUT=ROOT/'YFIT_Article_Nutrition_DailyTracker_Review_v2.mp4'
CUT=20.20;READING_PAUSES=2;HOLD=2.4
LINE='Saving your own data needs an account.'

def run(args):
    with (PROD/'render.log').open('a') as f:subprocess.run(args,check=True,stdout=f,stderr=f)

def duration(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)],text=True))

def text(name,content,x,y,size,color='0x123e3d',bold=False):
    p=TMP/(name+'.txt');p.write_text(content+'\n')
    return f"drawtext=fontfile={BOLD if bold else FONT}:textfile='{p}':fontsize={size}:fontcolor={color}:x={x}:y={y}"

def ass_time(t):
    cs=round(t*100);h,rem=divmod(cs,360000);m,rem=divmod(rem,6000);s,cs=divmod(rem,100)
    return f'{h}:{m:02}:{s:02}.{cs:02}'

def srt_time(t):
    ms=round(t*1000);h,rem=divmod(ms,3600000);m,rem=divmod(rem,60000);s,ms=divmod(rem,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

def main():
    pickup=ASSETS/'corrected-final-line.wav';original=ASSETS/'original-narration.wav'
    for p in (pickup,original,ASSETS/'go-explore-current-control.png'):assert p.is_file()
    speech_duration=CUT+READING_PAUSES+duration(pickup)
    total=math.ceil((speech_duration+HOLD)*FPS)/FPS
    words=json.loads((ASSETS/'corrected-final-line_transcription_20261127_220843.json').read_text())
    final_start=CUT+READING_PAUSES+words['words'][0]['start']
    final_end=CUT+READING_PAUSES+words['words'][-1]['end']+0.13
    original_ass=(PROD/'original-captions.ass').read_text().splitlines()
    assert 'Saving your own needs an account.' in original_ass[-1]
    original_ass[-1]=f'Dialogue: 10,{ass_time(final_start)},{ass_time(final_end)},Caption,,0,0,0,,{{\\pos(540,1778)}}Saving your own data\\Nneeds an account.'
    (PROD/'captions.ass').write_text('\n'.join(original_ass)+'\n')
    cues=(PROD/'original-captions.srt').read_text().strip().split('\n\n')
    assert len(cues)==14
    cues[-1]=f'14\n{srt_time(final_start)} --> {srt_time(final_end)}\nSaving your own data\nneeds an account.'
    (PROD/'captions.srt').write_text('\n\n'.join(cues)+'\n\n')
    segments=[]
    for i in range(1,5):
        p=ASSETS/'preserved-scenes'/f'{i:02}.mp4';assert p.is_file();segments.append(p)
    footer=','.join([
        'drawbox=x=0:y=0:w=1080:h=96:color=white:t=fill',
        'drawbox=x=0:y=0:w=1080:h=8:color=0x00b7a7:t=fill',
        text('header','YFIT  |  Explore before creating an account',30,32,31,bold=True),
        'drawbox=x=0:y=1660:w=1080:h=260:color=white:t=fill',
        'drawbox=x=0:y=1660:w=1080:h=5:color=0x00b7a7:t=fill',
        text('footer','Review only  |  Actual app screens with fictional sample data','(w-tw)/2',1871,26)])
    filters='[1:v]scale=1000:160[cta];[0:v][cta]overlay=40:744,'+','.join([
        footer,text('brand','YFIT','(w-tw)/2',246,112,bold=True),
        text('title','Want to look around?','(w-tw)/2',442,66,bold=True),
        text('instruction','Use the profile link, then choose:','(w-tw)/2',612,43),
        text('destination','app.yfitai.com/go','(w-tw)/2',1025,61,bold=True),
        text('demo','Explore uses sample records.','(w-tw)/2',1194,42),
        text('account',LINE,'(w-tw)/2',1260,42)])+'[picture]'
    cta=TMP/'05.mp4'
    print('Rendering corrected CTA; opening and app scenes unchanged.',flush=True)
    run(['ffmpeg','-y','-f','lavfi','-i','color=c=0xeffcf8:s=1080x1920:r=25','-loop','1','-framerate','25','-i',str(ASSETS/'go-explore-current-control.png'),'-filter_complex_threads','1','-filter_complex',filters,'-map','[picture]','-frames:v',str(round((total-17.8)*FPS)),'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-r','25','-threads','2',str(cta)])
    segments.append(cta);concat=TMP/'concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in segments))
    picture=TMP/'picture.mp4'
    run(['ffmpeg','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(picture)])
    audio=('[1:a]asplit=3[a][b][c];[a]atrim=start=0:end=8.86,asetpts=PTS-STARTPTS[a1];'
           '[b]atrim=start=8.86:end=10.55,asetpts=PTS-STARTPTS[a2];'
           '[c]atrim=start=10.55:end=20.20,asetpts=PTS-STARTPTS[a3];'
           'anullsrc=r=24000:cl=mono,atrim=duration=1[s1];'
           'anullsrc=r=24000:cl=mono,atrim=duration=1[s2];'
           '[2:a]asetpts=PTS-STARTPTS[pickup];'
           '[a1][s1][a2][s2][a3][pickup]concat=n=6:v=0:a=1,apad=pad_dur=2.4[voice]')
    print('Assembling 27-second review with the corrected spoken ending.',flush=True)
    run(['ffmpeg','-y','-i',str(picture),'-i',str(original),'-i',str(pickup),'-filter_complex_threads','1','-filter_complex',audio,'-map','0:v:0','-map','[voice]','-vf',f"ass='{PROD/'captions.ass'}'",'-t',str(total),'-c:v','libx264','-preset','fast','-crf','19','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(OUTPUT)])
    manifest={'output':OUTPUT.name,'duration_seconds':total,'size':[1080,1920],'fps':FPS,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'bytes':OUTPUT.stat().st_size,'last_line':LINE,'original_retained_audio_source_seconds':[0,CUT],'pickup_voice':'Achird / en-US / casual-friendly male','pickup_duration_seconds':duration(pickup),'possible_separate_take_timbre_variation':True,'reading_pauses':[{'original_source_time':8.86,'duration':1},{'original_source_time':10.55,'duration':1}],'caption_last_cue':[final_start,final_end],'opening_replaced':False,'first_four_scenes_reused_unchanged':True,'time_stretch':False,'review_only':True,'public_post':False,'n8n_or_app_changed':False,'old_review_and_owner_notes_preserved':True}
    (PROD/'production-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Complete:',OUTPUT,total,'seconds',flush=True)

if __name__=='__main__':main()
