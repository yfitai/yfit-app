#!/usr/bin/env python3
"""Package already-verified local assets; no network, uploads, or workflow actions."""
from pathlib import Path
import hashlib,json,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
CANON=Path('/home/ubuntu/yfit-app-full/docs/evidence/2026-11-27-complete-screen-library')

def copy_unless_same(source,target):
    if source.resolve()!=target.resolve():
        shutil.copy2(source,target)

def main():
    receipt=json.loads((ROOT/'notes/live-restoration-verification.json').read_text())
    assert receipt['all_eleven_passed'] and receipt['passed_count']==11
    manifest=json.loads((ROOT/'manifest.json').read_text())
    for key in ('new_uploads_created','upload_attempt_stopped_after_rejection'):
        manifest.pop(key,None)
    manifest.update(public_check_time_utc=receipt['verified_at_utc'],online_count=11,live_restoration_complete=True,assistant_uploads_created=0,owner_uploaded_seven_missing_pngs=True,daily_posting_owner_confirmed_unpublished=True,automatic_resume=False,historical_preparation_manifest='manifest.json in the original preparation evidence, not this current archive')
    by_name={a['filename']:a for a in receipt['assets']}
    for asset in manifest['assets']:
        assert by_name[asset['filename']]['passed']
        data=(ROOT/asset['local_path']).read_bytes()
        assert len(data)==asset['bytes'] and hashlib.sha256(data).hexdigest()==asset['sha256']
        asset.update(online_hash_verified=True,online_status='valid-and-identical',public_check_time_utc=receipt['verified_at_utc'])
    (ROOT/'manifest-live-verified.json').write_text(json.dumps(manifest,indent=2)+'\n')
    index=(ROOT/'screen-index.md').read_text().replace('all 11 saved assets','all 11 live-verified assets').replace('Four images are online; the seven others are prepared but still need owner-dashboard upload.','All eleven images were independently verified online on November 27, 2026 at 17:54 EST; each exact public hash matches its saved PNG.').replace('README.md','README-live-verified.md').replace('**Prepared; upload required**','**Online and hash-verified**')
    (ROOT/'screen-index-live-verified.md').write_text(index.rstrip()+'\n')
    selected=['README-live-verified.md','screen-index-live-verified.md','manifest-live-verified.json','SHA256SUMS.txt','notes/live-restoration-verification.json']
    for name in selected:
        target=CANON/name;target.parent.mkdir(parents=True,exist_ok=True);copy_unless_same(ROOT/name,target)
    for name in ('verify_public_library.py','package_live_verified.py'):
        copy_unless_same(Path(__file__).resolve().parent/name,CANON/'capture-evidence'/name)
    archive=ROOT/'YFIT_All_11_App_Screens_Live_Verified_2026-11-27.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for name in selected:z.write(ROOT/name,name)
        for asset in manifest['assets']:
            for folder in ('pages','thumbnails'):
                p=ROOT/folder/asset['filename'];z.write(p,str(p.relative_to(ROOT)))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert len([n for n in z.namelist() if n.startswith('pages/')])==11
        for asset in manifest['assets']:
            assert hashlib.sha256(z.read(asset['local_path'])).hexdigest()==asset['sha256']
    copy_unless_same(archive,CANON/archive.name)
    print('Live-verified archive:',archive)
    print('Bytes:',archive.stat().st_size,'SHA256:',hashlib.sha256(archive.read_bytes()).hexdigest())
    print('Current metadata and evidence copied to canonical app docs; original preparation snapshot preserved.')

if __name__=='__main__':main()
