#!/usr/bin/env python3
"""Package the already prepared PNGs; no network, app changes or generation."""
import hashlib,json,shutil,zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REV='20cae3de9b8d9160618299a1f81fa2b79021258a'
items=[
('screen_01_dashboard.png','Dashboard','/dashboard','Preserved approved original; actual dashboard with fictional sample records.'),
('screen_02_goals.png','Goals','/goals','Actual Starting Point manual-entry form; fictional imperial profile. Title and lower measurements are outside this viewport. No calculated/saved result.'),
('screen_03_nutrition.png','Nutrition','/nutrition','Actual calorie/macronutrient progress overview with fictional meal records; logged-meals detail remains in the prior review evidence.'),
('screen_04_dailyTracker.png','Daily Tracker','/daily-tracker','Actual daily-entry overview with fictional sample records; not a saved-action recording or verified health advice.'),
('screen_05_fitness.png','Fitness','/fitness','Preserved approved original; actual authenticated Fitness interface, not guest History layout.'),
('screen_06_medications.png','Medications','/medications','Preserved approved original; fictional medication records, not clinical recommendations.'),
('screen_07_progress.png','Progress','/progress','Actual overview with identical fictional starting/current weight and body fat; no invented improvement. Native 3 days/1 days period labels and pounds unit remain unchanged; lower BMI row/history is outside view.'),
('screen_08_predictions.png','Predictions','/predictions','Genuine insufficient-data overview; no generated forecast, model output or demonstrated injury prediction. Native AI/TDEE/injury-risk copy is not independently validated.'),
('screen_09_recomp.png','Recomp','/body-recomp','Genuine setup/no-history state; no invented recomposition results or recommendations. Native low-contrast empty text and promotional card are preserved.'),
('screen_10_aiCoach.png','AI Coach','/ai-coach-faq','Preserved approved original; genuine visual interface, not evidence of an AI response or health outcome.'),
('screen_11_language.png','Language menu','/daily-tracker','Actual eight-option header language menu over empty Daily Tracker; English selected. Not a standalone route or proof of complete/persistent translations; native Streak: 8h text is not an achieved streak.')]
PRESERVED={1,5,6,10}

def main():
    receipt=json.loads((ROOT/'notes/storage-restoration-receipt.json').read_text())
    prior=json.loads((ROOT/'notes/approved-four-original-manifest.json').read_text())
    after={i['filename']:i for i in receipt['after']}
    thumbs=ROOT/'thumbnails';thumbs.mkdir(exist_ok=True)
    entries=[];index=['# YFIT screen index — all 11 saved assets','',
        'Original 1080 × 1920 images use the real app colors and fictional demonstration data. Thumbnails below are reduced copies only; the full PNGs are unchanged. Four images are online; the seven others are prepared but still need owner-dashboard upload. See [the restoration guide](README.md).','']
    for slot,(filename,label,route,limitation) in enumerate(items,1):
        p=ROOT/'pages'/filename;image=Image.open(p);image.verify();image=Image.open(p)
        assert image.size==(1080,1920)
        sha=hashlib.sha256(p.read_bytes()).hexdigest()
        online=after[filename]['image_valid'] and after[filename].get('sha256')==sha
        if slot in PRESERVED:assert online, 'An approved original differs from its verified live copy'
        thumbnail=image.copy();thumbnail.thumbnail((270,480),Image.Resampling.LANCZOS);thumbnail.save(thumbs/filename)
        entries.append({'renderer_slot':slot,'label':label,'filename':filename,'local_path':'pages/'+filename,'sha256':sha,'bytes':p.stat().st_size,'dimensions':[1080,1920],'source_revision':prior['app_source_revision'] if slot in PRESERVED else REV,'route':route,'actual_authenticated_component':True,'fictional_data':True,'preserved_approved_original':slot in PRESERVED,'public_url':'https://mxggxpoxgqubojvumjlt.supabase.co/storage/v1/object/public/yfit-videos/assets/app-screens/'+filename,'online_hash_verified':online,'online_status':'valid-and-identical' if online else 'missing-upload-required','limitations':limitation})
        index.extend([f'## {slot:02}. {label}', '',f'[Open the full image](pages/{filename}) · **'+('Online and unchanged' if online else 'Prepared; upload required')+'**','',f'![{label} thumbnail](thumbnails/{filename})','',limitation,''])
    manifest={'date':'2026-11-27','public_check_time_utc':'2026-11-27T22:12:19Z','capture_revisions':sorted({e['source_revision'] for e in entries}),'bucket':'yfit-videos','prefix':'assets/app-screens/','asset_count':11,'dimensions':[1080,1920],'online_count':sum(e['online_hash_verified'] for e in entries),'locally_complete':True,'live_restoration_complete':False,'new_uploads_created':0,'upload_attempt_stopped_after_rejection':True,'no_overwrites_or_policy_changes':True,'actual_app_colors_unchanged':True,'no_public_post_or_workflow_change':True,'assets':entries}
    (ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (ROOT/'screen-index.md').write_text('\n'.join(index)+'\n')
    (ROOT/'SHA256SUMS.txt').write_text(''.join(e['sha256']+'  pages/'+e['filename']+'\n' for e in entries))
    allzip=ROOT/'YFIT_All_11_App_Screens_2026-11-27.zip'
    with zipfile.ZipFile(allzip,'w',zipfile.ZIP_DEFLATED) as z:
        for p in [ROOT/'README.md',ROOT/'screen-index.md',ROOT/'manifest.json',ROOT/'SHA256SUMS.txt']+sorted((ROOT/'pages').glob('*.png'))+sorted(thumbs.glob('*.png'))+sorted((ROOT/'notes').glob('*')):
            if p.is_file():z.write(p,p.relative_to(ROOT))
    seven=ROOT/'YFIT_Seven_Missing_Screens_For_Upload.zip'
    with zipfile.ZipFile(seven,'w',zipfile.ZIP_DEFLATED) as z:
        for e in entries:
            if not e['online_hash_verified']:z.write(ROOT/e['local_path'],e['filename'])
    for p,count in [(allzip,11),(seven,7)]:
        with zipfile.ZipFile(p) as z:
            assert z.testzip() is None
            originals=[n for n in z.namelist() if n.endswith('.png') and not n.startswith('thumbnails/')]
            assert len(originals)==count
            for n in originals:assert Image.open(z.open(n)).size==(1080,1920)
        print(p, p.stat().st_size,'bytes; full PNG count',count,flush=True)
    print('Local library integrity passed: 11/11; live valid originals unchanged: 4/4.',flush=True)

if __name__=='__main__':main()
