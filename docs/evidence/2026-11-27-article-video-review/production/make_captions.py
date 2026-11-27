#!/usr/bin/env python3
"""Caption the measured Achird take; add two one-second UI reading pauses."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'assets/article-narration-achird_transcription_20261127_213703.json'
PAUSES = [(8.86, 1.0), (10.55, 1.0)]

def shifted(t):
    return t + sum(length for at, length in PAUSES if t >= at)

def clock(t, srt=False):
    n = round(t * (1000 if srt else 100))
    base = 1000 if srt else 100
    h, rem = divmod(n, 3600 * base)
    m, rem = divmod(rem, 60 * base)
    s, fraction = divmod(rem, base)
    return f'{h:02}:{m:02}:{s:02},{fraction:03}' if srt else f'{h}:{m:02}:{s:02}.{fraction:02}'

# Group by actual measured word indices, not interpolated timestamps.
words = json.loads(DATA.read_text())['words']
phrases = [
    (0, 2, 'Training hard?'),
    (2, 6, 'Your meals matter too.'),
    (6, 10, "A Women's Health article"),
    (10, 14, 'highlights nutrition\nalongside workouts.'),
    (14, 19, 'In YFIT, check your'),
    (19, 23, 'calorie and macro progress,'),
    (23, 29, "then review the meals\nyou've logged."),
    (29, 34, 'Daily Tracker lets you review'),
    (34, 41, 'your daily entries,\nincluding steps and water.'),
    (41, 44, 'Want to look around?'),
    (44, 48, 'Use the profile link'),
    (48, 54, 'and choose\nExplore the app first.'),
    (54, 58, 'These are sample records.'),
    (58, len(words), 'Saving your own needs an account.'),
]
# Assert phrase boundaries against the measured transcript before creating files.
expected_first = ['Training', 'Your', 'A', 'highlights', 'In', 'calorie', 'then',
                  'Daily', 'your', 'Wanna', 'Use', 'and', 'These', 'Saving']
for (first, last, _), expected in zip(phrases, expected_first):
    assert words[first]['text'] == expected, (first, words[first]['text'], expected)
    assert last > first

header = '''[Script Info]
Title: YFIT article-led actual-app review
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,DejaVu Sans,50,&H003D3E12,&H003D3E12,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,1,0,0,5,64,64,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
ass = [header]
srt = []
manifest = []
for i, (first, last, text) in enumerate(phrases):
    start = shifted(words[first]['start'])
    # End near the final spoken word; slight reading tail never crosses next cue.
    end = shifted(words[last - 1]['end']) + 0.13
    if i + 1 < len(phrases):
        next_start = shifted(words[phrases[i + 1][0]]['start'])
        end = min(end, next_start - 0.04)
    ass_text = text.replace('\n', '\\N')
    ass.append(f'Dialogue: 10,{clock(start)},{clock(end)},Caption,,0,0,0,,{{\\pos(540,1778)}}{ass_text}\n')
    srt.append(f'{i+1}\n{clock(start, True)} --> {clock(end, True)}\n{text}\n\n')
    manifest.append({'start': start, 'end': end, 'text': text, 'source_word_range': [first, last]})
(ROOT / 'production/captions.ass').write_text(''.join(ass))
(ROOT / 'production/captions.srt').write_text(''.join(srt))
(ROOT / 'production/caption-cues.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{len(manifest)} cues written from measured word timings.')
