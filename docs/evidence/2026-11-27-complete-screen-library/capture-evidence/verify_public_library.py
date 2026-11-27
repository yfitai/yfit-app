#!/usr/bin/env python3
"""GET-only verification of exact public PNGs against the saved app-screen manifest."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import hashlib,io,json
import requests
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

def check(asset):
    out={'filename':asset['filename'],'label':asset['label'],'url':asset['public_url'],'expected_sha256':asset['sha256'],'preserved_approved_original':asset['preserved_approved_original']}
    try:
        r=requests.get(asset['public_url'],timeout=25)
        out.update(http_status=r.status_code,content_type=r.headers.get('content-type',''),bytes=len(r.content))
        assert r.status_code==200 and out['content_type'].startswith('image/png'), 'Public URL did not return HTTP200 PNG'
        image=Image.open(io.BytesIO(r.content));image.verify();image=Image.open(io.BytesIO(r.content));image.load()
        sha=hashlib.sha256(r.content).hexdigest()
        out.update(dimensions=list(image.size),sha256=sha,image_valid=True,hash_matches=sha==asset['sha256'],dimensions_match=list(image.size)==asset['dimensions'],bytes_match=len(r.content)==asset['bytes'])
        out['passed']=out['hash_matches'] and out['dimensions_match'] and out['bytes_match']
    except Exception as e:
        out.update(passed=False,error_type=type(e).__name__)
    print(('PASS' if out['passed'] else 'FAIL')+' '+asset['filename'],flush=True)
    return out

def main():
    manifest=json.loads((ROOT/'manifest.json').read_text())
    assert len(manifest['assets'])==11
    start=datetime.now(timezone.utc).isoformat()
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,manifest['assets']))
    passed=all(x['passed'] for x in results)
    receipt={'verification_started_at_utc':start,'verified_at_utc':datetime.now(timezone.utc).isoformat(),'project':'mxggxpoxgqubojvumjlt','bucket':manifest['bucket'],'prefix':manifest['prefix'],'http_method':'GET','authenticated_requests':False,'writes_or_uploads':False,'n8n_or_generation_or_posting_requests':False,'owner_upload_evidence_time':'2026-11-27T17:53:46-05:00','owner_screenshot_observation':'Eleven exact PNG filenames visible in correct assets/app-screens folder; inline image not reopened','all_eleven_passed':passed,'passed_count':sum(x['passed'] for x in results),'four_approved_originals_unchanged':all(x['passed'] for x in results if x['preserved_approved_original']),'assets':results,'daily_posting_remains_owner_confirmed_unpublished':True,'automatic_resume':False,'actual_video_overlay_rendering_or_publication_tested':False,'accidental_zip_object_deleted':False}
    p=ROOT/'notes/live-restoration-verification.json';p.write_text(json.dumps(receipt,indent=2)+'\n')
    print('All 11 exact public hashes verified:',passed,flush=True)
    print('Receipt:',p,flush=True)
    if not passed:raise SystemExit(1)

if __name__=='__main__':main()
