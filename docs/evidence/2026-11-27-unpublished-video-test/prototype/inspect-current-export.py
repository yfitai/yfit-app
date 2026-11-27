#!/usr/bin/env python3
"""Inspect an owner-supplied n8n export; preserve topology, redact secrets, never call n8n."""
from pathlib import Path
import copy,hashlib,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
MASK='<REDACTED_REBIND_EXISTING_CREDENTIAL>'
SECRET_NAME=re.compile(r'authorization|api[-_ ]?key|xi-api-key|x-n8n-api-key|password|secret|access[-_ ]?token|refresh[-_ ]?token',re.I)
JWT=re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')
TOKEN=re.compile(r'(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{20,})')

def parse(text):
    try:data=json.loads(text)
    except json.JSONDecodeError:
        data=None;decoder=json.JSONDecoder()
        for offset,char in enumerate(text):
            if char=='{':
                try:
                    candidate,_=decoder.raw_decode(text[offset:])
                    if isinstance(candidate,dict) and isinstance(candidate.get('nodes'),list):data=candidate;break
                except json.JSONDecodeError:pass
    if not isinstance(data,dict) or not isinstance(data.get('nodes'),list):raise ValueError('Not a workflow JSON export')
    return data

def main():
    supplied=Path(sys.argv[1]);data=parse(supplied.read_text())
    assert data.get('id')=='h7bRds9UOUfmP36F' and data.get('name')=='YFIT Social Media Automation v2','Wrong workflow identity'
    assert data.get('active') is False,'Expected owner-paused workflow export'
    secrets=set();events=[]
    def expression(value):return isinstance(value,str) and value.startswith('=') and any(s in value for s in ('$env.','$credentials.'))
    def discover(obj):
        if isinstance(obj,dict):
            if isinstance(obj.get('name'),str) and SECRET_NAME.search(obj['name']):
                value=obj.get('value')
                if isinstance(value,str) and value and not expression(value):
                    secrets.add(value)
                    bearer=re.search(r'Bearer\s+([^\s]+)',value,re.I)
                    if bearer:secrets.add(bearer.group(1))
            for key,value in obj.items():
                if SECRET_NAME.fullmatch(key) and isinstance(value,str) and value and not expression(value):secrets.add(value)
                discover(value)
        elif isinstance(obj,list):
            for value in obj:discover(value)
    discover(data)
    def clean(obj,path='root'):
        if isinstance(obj,dict):
            cleaned={}
            for key,value in obj.items():
                where=path+'.'+key
                if key in ('pinData','staticData'):
                    cleaned[key]={};events.append(where+': removed optional data')
                elif key=='credentials':
                    cleaned[key]={kind:{'id':MASK,'name':'EXISTING_CREDENTIAL_BINDING_REQUIRED'} for kind in value};events.append(where+': anonymized binding refs')
                elif key=='webhookId':
                    cleaned[key]='REVIEW_EXPORT_REQUIRES_NEW_WEBHOOK_ID';events.append(where+': removed live webhook identifier')
                elif key=='value' and isinstance(obj.get('name'),str) and SECRET_NAME.search(obj['name']) and not expression(value):
                    cleaned[key]=MASK;events.append(where+': masked secret parameter')
                elif SECRET_NAME.fullmatch(key) and isinstance(value,str) and not expression(value):
                    cleaned[key]=MASK;events.append(where+': masked secret field')
                else:cleaned[key]=clean(value,where)
            return cleaned
        if isinstance(obj,list):return [clean(value,path+f'[{i}]') for i,value in enumerate(obj)]
        if isinstance(obj,str):
            result=obj
            for secret in sorted(secrets,key=len,reverse=True):
                if len(secret)>5 and secret in result:result=result.replace(secret,MASK)
            result=JWT.sub(MASK,result);result=TOKEN.sub(MASK,result)
            result=re.sub(r'(https?://[^\s\"\x27]+/webhook(?:-test)?/)[^\s\"\x27]+',r'\1REDACTED_ENDPOINT',result)
            if result!=obj:events.append(path+': masked embedded secret or webhook endpoint')
            return result
        return obj
    safe=clean(copy.deepcopy(data))
    for node in safe['nodes']:
        if node.get('type')=='n8n-nodes-base.webhook' and 'path' in node.get('parameters',{}):
            node['parameters']['path']='REDACTED_EXISTING_WEBHOOK_PATH';events.append(node['name']+': webhook path masked')
    text=json.dumps(safe,indent=2)+'\n'
    assert not JWT.search(text) and not TOKEN.search(text),'Recognizable token remains; stop backup'
    assert all(secret not in text for secret in secrets if len(secret)>5),'Detected secret remains; stop backup'
    assert [(n['id'],n['name'],n['type']) for n in data['nodes']]==[(n['id'],n['name'],n['type']) for n in safe['nodes']]
    assert safe['connections']==data['connections']
    target=ROOT/'current-workflow-redacted.json';target.write_text(text)
    receipt={'source':'owner-supplied Download/export attachment, 2026-11-27 18:16 EST','original_attachment_sha256':hashlib.sha256(supplied.read_bytes()).hexdigest(),'workflow_id':safe['id'],'workflow_name':safe['name'],'export_version_id':safe.get('versionId'),'export_active':safe.get('active'),'active_version_id_field_present':'activeVersionId' in safe,'independent_instance_api_read':False,'nodes_preserved':len(safe['nodes']),'connections_preserved':True,'pin_data_retained':False,'credential_values_backed_up':False,'raw_export_copied_into_repo':False,'redactions_count':len(events),'redaction_locations':events,'redacted_export_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'restoration_requires_existing_credential_rebinding_and_webhook_review':True,'live_workflow_changed':False,'execution_or_posting':False}
    (ROOT/'current-export-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('Current owner export saved after redaction:',target)
    print('Nodes preserved:',len(safe['nodes']),'connections preserved:',True,'redaction events:',len(events))
    print('Credential values and raw export not copied into repo. No network calls.')

if __name__=='__main__':main()
