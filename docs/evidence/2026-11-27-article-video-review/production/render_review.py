#!/usr/bin/env python3
"""Local-only review assembly. No URL requests, uploads, workflow calls or app edits."""
import json
import math
import shutil
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROD = ROOT / 'production'
ASSETS = ROOT / 'assets'
TMP = PROD / 'render-work'
TMP.mkdir(exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FPS = 25
OUTPUT = ROOT / 'YFIT_Article_Nutrition_DailyTracker_Review.mp4'
VOICE = ASSETS / 'article-narration-achird.wav'
STOCK = ASSETS / 'meal-topic-ron-lach-8455765.mp4'
CTA = ASSETS / 'go-explore-current-control.png'


def run(args):
    with (PROD / 'render.log').open('a') as log:
        subprocess.run(args, cwd=ROOT, check=True, stdout=log, stderr=log)


def textfile(name, content):
    p = TMP / f'{name}.txt'
    p.write_text(content + '\n')
    return p


def text(name, content, x, y, size, color='0x123e3d', bold=False, extra=''):
    p = textfile(name, content)
    return (f"drawtext=fontfile={BOLD if bold else FONT}:textfile='{p}':"
            f'fontsize={size}:fontcolor={color}:x={x}:y={y}' + extra)


def bar(label):
    return ','.join([
        'drawbox=x=0:y=0:w=1080:h=96:color=white:t=fill',
        'drawbox=x=0:y=0:w=1080:h=8:color=0x00b7a7:t=fill',
        text('header-' + str(len(label)), label, 30, 32, 31, bold=True),
        'drawbox=x=0:y=1660:w=1080:h=260:color=white:t=fill',
        'drawbox=x=0:y=1660:w=1080:h=5:color=0x00b7a7:t=fill',
        text('footer', 'Review only  |  Actual app screens with fictional sample data', '(w-tw)/2', 1871, 26),
    ])


def encode_scene(index, label, source, start, end, stock=False):
    frames = round((end - start) * FPS)
    dest = TMP / f'{index:02}.mp4'
    print(f'Rendering scene {index}: {label} ({frames} frames)', flush=True)
    common = ['-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'fast',
              '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-threads', '2', str(dest)]
    if stock:
        vf = ','.join([
            'scale=1080:1920:force_original_aspect_ratio=increase',
            'crop=1080:1920', 'setsar=1', 'fps=25',
            bar('YFIT  |  Article-led review example'),
            text('hook-1', 'Training hard?', 66, 310, 80, 'white', True, ':shadowcolor=black@0.55:shadowx=3:shadowy=3'),
            text('hook-2', 'Your meals matter too.', 66, 418, 67, 'white', True, ':shadowcolor=black@0.55:shadowx=3:shadowy=3'),
            text('source', "Topic source: Women's Health", 66, 564, 33, 'white', False, ':shadowcolor=black@0.55:shadowx=2:shadowy=2'),
        ])
        run(['ffmpeg', '-y', '-ss', '0', '-i', str(source), '-vf', vf] + common)
    else:
        if index == 4:
            filters = '[1:v]scale=1020:-2[ui];[0:v][ui]overlay=30:118'
        else:
            filters = '[1:v]scale=1020:-2[ui];[0:v][ui]overlay=30:96'
        filters += ',' + bar(label) + '[picture]'
        run(['ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=0xf5fffd:s=1080x1920:r=25',
             '-loop', '1', '-framerate', '25', '-i', str(source),
             '-filter_complex_threads', '1', '-filter_complex', filters, '-map', '[picture]'] + common)
    return dest


def encode_cta(start, end):
    frames = round((end - start) * FPS)
    dest = TMP / '05.mp4'
    print(f'Rendering genuine Go CTA ({frames} frames)', flush=True)
    filters = '[1:v]scale=1000:160[cta];[0:v][cta]overlay=40:744,' + ','.join([
        bar('YFIT  |  Explore before creating an account'),
        text('cta-brand', 'YFIT', '(w-tw)/2', 246, 112, bold=True),
        text('cta-title', 'Want to look around?', '(w-tw)/2', 442, 66, bold=True),
        text('cta-instruction', 'Use the profile link, then choose:', '(w-tw)/2', 612, 43),
        text('cta-destination', 'app.yfitai.com/go', '(w-tw)/2', 1025, 61, bold=True),
        text('cta-demo', 'Explore uses sample records.', '(w-tw)/2', 1194, 42),
        text('cta-account', 'Saving your own needs an account.', '(w-tw)/2', 1260, 42),
    ]) + '[picture]'
    run(['ffmpeg', '-y', '-f', 'lavfi', '-i', 'color=c=0xeffcf8:s=1080x1920:r=25',
         '-loop', '1', '-framerate', '25', '-i', str(CTA),
         '-filter_complex_threads', '1', '-filter_complex', filters, '-map', '[picture]',
         '-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
         '-pix_fmt', 'yuv420p', '-r', '25', '-threads', '2', str(dest)])
    return dest


if __name__ == '__main__':
    assert shutil.which('ffmpeg') and shutil.which('ffprobe')
    for p in [VOICE, STOCK, CTA, ROOT / 'png/01-nutrition-overview.png',
              ROOT / 'png/02-nutrition-logged-meals.png', ROOT / 'png/05-tracker-water-steps.png']:
        assert p.is_file(), p
    run(['python3', str(PROD / 'make_captions.py')])
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                     'format=duration', '-of', 'default=nw=1:nk=1', str(VOICE)], text=True).strip())
    total = math.ceil((duration + 2 + 2.4) * FPS) / FPS
    segments = [
        encode_scene(1, 'Topic clip', STOCK, 0, 5.84, True),
        encode_scene(2, 'YFIT  |  Nutrition: calorie and macro progress', ROOT / 'png/01-nutrition-overview.png', 5.84, 9.88),
        encode_scene(3, 'YFIT  |  Nutrition: your logged meals', ROOT / 'png/02-nutrition-logged-meals.png', 9.88, 12.72),
        encode_scene(4, 'YFIT  |  Daily Tracker: water and steps', ROOT / 'png/05-tracker-water-steps.png', 12.72, 17.8),
        encode_cta(17.8, total),
    ]
    concat = TMP / 'concat.txt'
    concat.write_text(''.join(f"file '{p}'\n" for p in segments))
    silent = TMP / 'picture.mp4'
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(concat), '-c', 'copy', str(silent)])
    # Preserve the same narration take and all words; insert silence only in measured gaps.
    audio = ('[1:a]asplit=3[a][b][c];'
             '[a]atrim=start=0:end=8.86,asetpts=PTS-STARTPTS[a1];'
             '[b]atrim=start=8.86:end=10.55,asetpts=PTS-STARTPTS[a2];'
             '[c]atrim=start=10.55,asetpts=PTS-STARTPTS[a3];'
             'anullsrc=r=24000:cl=mono,atrim=duration=1[s1];'
             'anullsrc=r=24000:cl=mono,atrim=duration=1[s2];'
             '[a1][s1][a2][s2][a3]concat=n=5:v=0:a=1,apad=pad_dur=2.4[voice]')
    run(['ffmpeg', '-y', '-i', str(silent), '-i', str(VOICE),
         '-filter_complex_threads', '1', '-filter_complex', audio, '-map', '0:v:0', '-map', '[voice]',
         '-vf', f"ass='{PROD / 'captions.ass'}'", '-t', str(total),
         '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '2', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', str(OUTPUT)])
    manifest = {
        'output': OUTPUT.name, 'duration_seconds': total, 'size': [1080, 1920], 'fps': FPS,
        'voice': {'name': 'Achird', 'gender': 'male', 'locale': 'en-US', 'style': 'casual, friendly',
                  'source_duration_seconds': duration, 'time_stretch': False,
                  'inserted_silence': [{'source_time': 8.86, 'length': 1}, {'source_time': 10.55, 'length': 1}]},
        'scenes': [
            {'start': 0, 'end': 5.84, 'source': STOCK.name, 'source_range': [0, 5.84]},
            {'start': 5.84, 'end': 9.88, 'source': '01-nutrition-overview.png', 'actual_ui': True},
            {'start': 9.88, 'end': 12.72, 'source': '02-nutrition-logged-meals.png', 'actual_ui': True},
            {'start': 12.72, 'end': 17.8, 'source': '05-tracker-water-steps.png', 'actual_ui': True},
            {'start': 17.8, 'end': total, 'source': CTA.name, 'actual_go_control': True},
        ],
        'review_only': True, 'public_post': False, 'live_workflow_changed': False,
        'all_app_records_fictional': True, 'screen_recording_or_saved_action_claim': False,
        'app_color_changes': False, 'music': None,
    }
    (PROD / 'production-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Complete: {OUTPUT} ({total:.2f}s)', flush=True)
