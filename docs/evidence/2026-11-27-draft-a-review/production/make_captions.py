#!/usr/bin/env python3
"""Create readable captions from measured speech timing; no model or network calls."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = ROOT / 'assets/narration-achird_transcription_20261127_204524.json'
data = json.loads(TRANSCRIPT.read_text())
words = data['words']
# Inclusive indexes into actual word timestamps, not interpolated timing.
cues = [
    (0, 7, 'Still hunting through notes\nfor your last workout?'),
    (8, 14, 'Here’s a sample workout\nin YFIT.'),
    (15, 18, 'Open Fitness,\nchoose History.'),
    (19, 26, 'Tap the workout\nto see its exercises,'),
    (27, 29, 'weights and reps.'),
    (30, 33, 'Want to look around first?'),
    (34, 37, 'Use the profile link'),
    (38, 43, 'and choose\nExplore the app first.'),
    (44, 46, 'These are examples.'),
    (47, 53, 'Your own saved workouts\nneed an account.'),
]

def timestamp(t, ass=False):
    unit = 100 if ass else 1000
    val = round(t * unit)
    h, val = divmod(val, 3600 * unit)
    m, val = divmod(val, 60 * unit)
    s, frac = divmod(val, unit)
    return f'{h}:{m:02d}:{s:02d}.{frac:02d}' if ass else f'{h:02d}:{m:02d}:{s:02d},{frac:03d}'

records = []
for i, (start, end, text) in enumerate(cues):
    t0 = words[start]['start']
    t1 = min(words[end]['end'] + 0.16, words[cues[i+1][0]]['start'] - 0.03) if i + 1 < len(cues) else data['duration']
    assert t1 > t0
    records.append({'start': t0, 'end': t1, 'text': text})

srt = '\n\n'.join(f'{i+1}\n{timestamp(c["start"])} --> {timestamp(c["end"])}\n{c["text"]}' for i, c in enumerate(records)) + '\n'
(ROOT / 'YFIT_Draft_A_Captions.srt').write_text(srt)

ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,DejaVu Sans,54,&H00FFFFFF,&H00FFFFFF,&H0020160D,&H0020160D,-1,0,0,0,100,100,0,0,1,2,0,2,70,70,260,1
Style: Heading,DejaVu Sans,58,&H00FFFFFF,&H00FFFFFF,&H0020160D,&H0020160D,-1,0,0,0,100,100,0,0,1,0,0,8,70,70,145,1
Style: Small,DejaVu Sans,30,&H00BFD5ED,&H00BFD5ED,&H0020160D,&H0020160D,0,0,0,0,100,100,1,0,1,0,0,8,70,70,75,1
Style: Footer,DejaVu Sans,32,&H00BFD5ED,&H00BFD5ED,&H0020160D,&H0020160D,0,0,0,0,100,100,0,0,1,0,0,2,70,70,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
for c in records:
    text = c['text'].replace('\n', r'\N')
    ass += f'Dialogue: 2,{timestamp(c["start"],True)},{timestamp(c["end"],True)},Caption,,0,0,0,,{text}\n'
DURATION = data['duration'] + 2.4
headings = [(0,4.6,'Where are my workout notes?'),(4.6,7.2,'Fitness → History'),(7.2,11.65,'Exercises. Weights. Reps.'),(11.65,DURATION,'Explore before signing up')]
for start,end,text in headings:
    ass += f'Dialogue: 1,{timestamp(start,True)},{timestamp(end,True)},Heading,,0,0,0,,{text}\n'
ass += f'Dialogue: 1,0:00:00.00,{timestamp(DURATION,True)},Small,,0,0,0,,YFIT AI  /  SAMPLE DATA\n'
ass += f'Dialogue: 1,0:00:00.00,0:00:11.65,Footer,,0,0,0,,Sample workout · fictional records\n'
ass += f'Dialogue: 1,0:00:11.65,{timestamp(DURATION,True)},Footer,,0,0,0,,Profile link → Explore the app first\n'
(ROOT / 'production/captions-and-titles.ass').write_text(ass)
(ROOT / 'production/caption-cues.json').write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n')
print('Caption files created; target assembly duration',DURATION,'seconds.')
