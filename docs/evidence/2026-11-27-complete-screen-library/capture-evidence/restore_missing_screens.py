#!/usr/bin/env python3
"""Restore only seven missing YFIT PNG objects; no deletes, overwrites or policy changes."""
import argparse, hashlib, io, json, os
from pathlib import Path
from urllib.parse import urlsplit
import requests
from PIL import Image
from supabase import create_client

ROOT=Path(__file__).resolve().parents[1]
PROJECT='mxggxpoxgqubojvumjlt'
ORIGIN='https://'+PROJECT+'.supabase.co'
BUCKET='yfit-videos'
PREFIX='assets/app-screens/'
ALL=['screen_01_dashboard.png','screen_02_goals.png','screen_03_nutrition.png','screen_04_dailyTracker.png','screen_05_fitness.png','screen_06_medications.png','screen_07_progress.png','screen_08_predictions.png','screen_09_recomp.png','screen_10_aiCoach.png','screen_11_language.png']
PRESERVE={'screen_01_dashboard.png','screen_05_fitness.png','screen_06_medications.png','screen_10_aiCoach.png'}

def public_check(name):
    response=requests.get(ORIGIN+'/storage/v1/object/public/'+BUCKET+'/'+PREFIX+name,timeout=25)
    record={'filename':name,'http_status':response.status_code,'content_type':response.headers.get('content-type','')}
    if response.status_code==200 and response.headers.get('content-type','').startswith('image/'):
        image=Image.open(io.BytesIO(response.content));image.verify();image=Image.open(io.BytesIO(response.content))
        record.update({'dimensions':list(image.size),'sha256':hashlib.sha256(response.content).hexdigest(),'image_valid':True})
    else:
        record['image_valid']=False
        # Record only storage error identifiers, never arbitrary response headers/data.
        try:
            body=response.json();record['storage_error']=str(body.get('error',''))[:80];record['storage_message']=str(body.get('message',''))[:160]
        except Exception:record['storage_error']='not-json-image-response'
    return record

def main():
    args=argparse.ArgumentParser();args.add_argument('--apply',action='store_true');args=args.parse_args()
    configured=urlsplit(os.environ['SUPABASE_URL'].strip())
    assert configured.hostname==PROJECT+'.supabase.co' or (configured.hostname=='supabase.com' and ('/project/'+PROJECT) in configured.path), 'Saved URL points elsewhere; stopped.'
    key=os.environ['SUPABASE_KEY']
    client=create_client(ORIGIN,key) # Canonical API origin; saved URL is the same project's dashboard.
    before=[public_check(n) for n in ALL]
    result={'project':PROJECT,'bucket':BUCKET,'prefix':PREFIX,'create_only':True,'upsert':False,'apply_requested':args.apply,'before':before,'created':[],'preserved':[],'stopped':False,'error':None}
    output=ROOT/'notes/storage-restoration-receipt.json'
    def save():output.write_text(json.dumps(result,indent=2)+'\n')
    save()
    for item in before:
        name=item['filename'];local=ROOT/'pages'/name
        assert Image.open(local).size==(1080,1920)
        if item['image_valid']:
            # Never update existing files, even if unrelated content differs.
            result['preserved'].append(name);save();continue
        if name in PRESERVE:
            result.update(stopped=True,error='A previously restored image is no longer valid; no replacement permitted in this script.');save();break
        if item.get('storage_message')!='Object not found':
            result.update(stopped=True,error='Missing-object status not confirmed; stopped without upload: '+name);save();break
        if not args.apply:continue
        try:
            with local.open('rb') as f:
                client.storage.from_(BUCKET).upload(path=PREFIX+name,file=f,file_options={'content-type':'image/png','cache-control':'3600','upsert':'false'})
            verified=public_check(name)
            expected=hashlib.sha256(local.read_bytes()).hexdigest()
            assert verified.get('image_valid') and verified['dimensions']==[1080,1920] and verified['sha256']==expected, 'Uploaded file did not pass public hash/dimension verification'
            result['created'].append(verified);save();print('CREATED AND VERIFIED',name,flush=True)
        except Exception as exc:
            # Avoid printing SDK objects that could contain credential-bearing request data.
            code=getattr(exc,'statusCode',None) or getattr(exc,'status_code',None)
            result.update(stopped=True,error={'operation':'create-only-upload','filename':name,'exception_type':type(exc).__name__,'http_status':code,'detail':'Storage rejected the operation or verification failed; no retry, overwrite or policy change.'})
            save();print('STOPPED: storage upload was rejected; no settings or policies changed.',flush=True);break
    result['after']=[public_check(n) for n in ALL]
    result['all_eleven_public_hashes_match']=all(i.get('image_valid') and i.get('sha256')==hashlib.sha256((ROOT/'pages'/i['filename']).read_bytes()).hexdigest() for i in result['after'])
    save();print('Public valid assets:',sum(i['image_valid'] for i in result['after']),'/11',flush=True)
    print('Receipt:',output,flush=True)

if __name__=='__main__':main()
