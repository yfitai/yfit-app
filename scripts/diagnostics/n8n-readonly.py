#!/usr/bin/env python3
"""Authorized GET-only n8n audit. Credentials and raw responses stay in memory.
Emits allowlisted structure, schedules and execution metadata, never node data/code.
No retries, redirects, webhooks, mutations or credential API access.
"""
import collections
import datetime as dt
import json
import os
import re
import sys
from urllib.parse import urlsplit
from zoneinfo import available_timezones
import requests

START = dt.datetime.now(dt.timezone.utc)
CUTOFF = START - dt.timedelta(days=14)
ROOT = os.environ.get('N8N_INSTANCE_URL', '').rstrip('/')
KEY = os.environ.get('N8N_API_KEY', '')
if not ROOT or not KEY:
    print(json.dumps({'blocker': 'Required authorized runtime variables are absent'}))
    sys.exit(2)
u = urlsplit(ROOT)
if u.scheme != 'https' or not u.hostname or u.username or u.password:
    print(json.dumps({'blocker': 'Instance URL is not an unambiguous credential-free HTTPS base'}))
    sys.exit(2)
ROOT = ROOT[:-7] if ROOT.endswith('/api/v1') else ROOT
EDITOR_URL_NORMALIZED = '/workflow/' in u.path
if EDITOR_URL_NORMALIZED:
    ROOT = u.scheme + '://' + u.netloc + u.path.split('/workflow/', 1)[0]
SESSION = requests.Session()
SESSION.headers.update({'X-N8N-API-KEY': KEY, 'Accept': 'application/json'})
SESSION.trust_env = False
CALLS = []
ZONES = available_timezones()
SAFE_SETTINGS = {'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'executionOrder', 'callerPolicy', 'redactionPolicy'}
PLATFORMS = ('tiktok', 'instagram', 'youtube', 'facebook', 'pinterest', 'linkedin')

class Blocked(Exception):
    pass

def safe_label(v):
    s = str(v or '')
    for secret in (KEY, os.environ.get('N8N_INSTANCE_URL', '')):
        if secret:
            s = s.replace(secret, '[redacted]')
    s = re.sub(r'https?://\S+', '[URL omitted]', s)
    s = re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[email omitted]', s)
    s = re.sub(r'(?i)(bearer|api[_ -]?key|token|password|secret)\s*[:=]\s*\S+', '[secret omitted]', s)
    s = re.sub(r'\b[A-Za-z0-9_-]{40,}\b', '[opaque value omitted]', s)
    return s.replace('\n', ' ')[:180]

def get(path, params=None, category=None):
    if not re.fullmatch(r'/(workflows|executions)(/[A-Za-z0-9_-]+)?', path):
        raise Blocked('Endpoint rejected by GET-only allowlist')
    if len(CALLS) >= 85 or (dt.datetime.now(dt.timezone.utc)-START).total_seconds() > 330:
        raise Blocked('Bounded request/time budget reached')
    try:
        r = SESSION.get(ROOT + '/api/v1' + path, params=params, timeout=(6, 15), allow_redirects=False)
    except requests.RequestException:
        CALLS.append({'category': category or path.split('/')[1], 'status': 'network_exception'})
        raise Blocked('GET failed; request details suppressed')
    CALLS.append({'category': category or path.split('/')[1], 'status': r.status_code})
    if r.status_code in (401, 403):
        raise Blocked('Authentication/authorization HTTP ' + str(r.status_code) + '; no substitute credential attempted')
    if r.status_code != 200:
        return None, r.status_code
    try:
        return r.json(), 200
    except ValueError:
        raise Blocked('API response was not JSON; body suppressed')

def timestamp(v):
    try:
        return dt.datetime.fromisoformat(str(v).replace('Z', '+00:00'))
    except (TypeError, ValueError):
        return None

def settings_summary(s):
    s = s if isinstance(s, dict) else {}
    out = {k: v for k,v in s.items() if k in SAFE_SETTINGS and isinstance(v, (str,int,float,bool))}
    if 'timezone' in s:
        out['timezone'] = s['timezone'] if s['timezone'] in ZONES else '[nonstandard timezone omitted]'
    else:
        out['timezone'] = 'INHERITED_INSTANCE_DEFAULT_NOT_EXPOSED'
    for k in ('saveDataErrorExecution','saveDataSuccessExecution','saveManualExecutions','saveExecutionProgress'):
        out.setdefault(k, 'INHERITED_INSTANCE_DEFAULT_NOT_EXPOSED')
    return out

def schedules(p):
    out = []
    def walk(obj):
        if isinstance(obj, dict):
            clean = {}
            for k,v in obj.items():
                if k in {'expression','cronExpression'} and isinstance(v,str) and re.fullmatch(r'[0-9A-Za-z*/?,#LW\s-]{1,140}',v):
                    clean[k] = v
                elif k in {'field','mode','unit'} and isinstance(v,str) and re.fullmatch(r'[A-Za-z]{1,35}',v):
                    clean[k] = v
                elif k in {'secondsInterval','minutesInterval','hoursInterval','daysInterval','weeksInterval','triggerAtHour','triggerAtMinute','hour','minute','dayOfMonth','month','weekday'} and isinstance(v,(int,float)):
                    clean[k] = v
                elif k == 'triggerAtDay' and isinstance(v,list) and all(isinstance(x,int) for x in v):
                    clean[k] = v
            if clean: out.append(clean)
            for v in obj.values(): walk(v)
        elif isinstance(obj,list):
            for v in obj: walk(v)
    walk(p)
    return out

def destination(url):
    if not isinstance(url,str): return None
    match = re.search(r'https?://[^\s\'\"<>]+', url)
    if not match: return None
    z = urlsplit(match.group())
    host = z.hostname
    if not host or not re.fullmatch(r'[A-Za-z0-9.-]+',host): return None
    kind = 'other HTTP destination'
    for marker,label in [('generate-social-content','social generation Edge Function'),('upload-post','Upload-Post provider'),('/assemble','video assembly'),('weekly','weekly report destination'),('monthly','monthly report destination'),('yearly','yearly report destination')]:
        if marker in match.group().lower(): kind=label; break
    if host.endswith('.supabase.co') and kind == 'other HTTP destination': kind='Supabase API/function'
    return {'hostname': host, 'classification': kind}

def wf_summary(w):
    nodes = w.get('nodes') or []
    av = w.get('activeVersion')
    deployed = av.get('nodes') if isinstance(av,dict) else None
    def node_summary(n):
        p = n.get('parameters') or {}
        typ = n.get('type','')
        out = {'name':safe_label(n.get('name')), 'type':safe_label(typ), 'disabled':bool(n.get('disabled',False))}
        if any(x in typ.lower() for x in ('scheduletrigger','cron')): out['schedule_rules'] = schedules(p)
        if typ.endswith('.webhook'):
            out['method'] = p.get('httpMethod') if p.get('httpMethod') in ('GET','POST','PUT','PATCH','DELETE') else 'default'
            out['authentication_configured'] = p.get('authentication','none') != 'none'
            out['response_mode'] = p.get('responseMode') if p.get('responseMode') in ('onReceived','lastNode','responseNode') else 'default/other'
        if typ.endswith('.httpRequest'):
            d = destination(p.get('url'))
            if d: out['destination'] = d
        if typ.endswith('.executeWorkflow'):
            target=p.get('workflowId')
            if isinstance(target,dict): target=target.get('value')
            if isinstance(target,str) and re.fullmatch(r'[A-Za-z0-9_-]{1,36}',target): out['target_workflow_id']=target
        # Inspect internal code text; emit only derived booleans, never source/parameters.
        if typ.endswith(('.code','.function','.functionItem')):
            code = str(p.get('jsCode') or p.get('functionCode') or '')
            out['code_structure_flags'] = {
                'reads_first_input':bool(re.search(r'\$input\.first\s*\(',code)),
                'literal_success_true':bool(re.search(r'\bsuccess\s*:\s*true\b',code)),
                'mentions_dry_run':bool(re.search(r'\bdry_run\b',code)),
                'mentions_platforms':[x for x in PLATFORMS if x in code.lower()],
                'mentions_generate_social_content':'generate-social-content' in code,
                'mentions_weekly_report':'weekly' in code.lower() and 'report' in code.lower(),
                'mentions_monthly_report':'monthly' in code.lower() and 'report' in code.lower(),
                'mentions_yearly_report':bool(re.search(r'(yearly|annual)',code,re.I)) and 'report' in code.lower(),
            }
        return out
    edges=[]
    for src, channels in (w.get('connections') or {}).items():
        if isinstance(channels,dict):
            for groups in channels.values():
                for group in groups if isinstance(groups,list) else []:
                    for target in group if isinstance(group,list) else []:
                        if isinstance(target,dict): edges.append([safe_label(src),safe_label(target.get('node'))])
    result={'id':str(w.get('id')), 'name':safe_label(w.get('name')), 'active':w.get('active'), 'archived':w.get('isArchived'), 'createdAt':w.get('createdAt'), 'updatedAt':w.get('updatedAt'), 'activeVersionId_field_present':'activeVersionId' in w, 'active_version_present':bool(w.get('activeVersionId')), 'editable_differs_from_active_version':(w.get('activeVersionId') != w.get('versionId')) if w.get('activeVersionId') else None, 'settings':settings_summary(w.get('settings')), 'nodes':[node_summary(n) for n in nodes], 'edges':edges}
    if deployed: result['active_version_nodes']=[node_summary(n) for n in deployed]
    return result

def error_summary(e):
    d = e.get('data') or {}
    result=d.get('resultData') or {}
    err=result.get('error') or {}
    # Never return raw error text: classify against narrowly defined known causes.
    msg=str(err.get('message') or '').lower()
    node=err.get('node')
    if isinstance(node,dict): node=node.get('name')
    node=node or result.get('lastNodeExecuted')
    category='Unclassified error; raw message suppressed'
    rules=[(r'(unauthorized|authentication|invalid.*api.*key|401)', 'Authentication rejected'),(r'(forbidden|permission denied|403)', 'Permission/access rejected'),(r'(timeout|timed out|etimedout)', 'Request/execution timeout'),(r'(rate limit|too many requests|429)', 'Rate limit'),(r'(could not be found|not found|404)', 'Resource not found'),(r'(connection refused|econnrefused|enotfound|dns)', 'Network connection/DNS failure'),(r'(json|unexpected token)', 'JSON parsing/format failure'),(r'(invalid url)', 'Invalid URL configuration'),(r'(referenced node|node.*does not exist)', 'Referenced node missing'),(r'(no.*article|article.*not)', 'Article input unavailable')]
    for pattern,label in rules:
        if re.search(pattern,msg): category=label; break
    if not err: category='No top-level error message available'
    run = result.get('runData') or {}
    failed=[]
    for name, tasks in run.items():
        if any(isinstance(t,dict) and t.get('error') for t in tasks if isinstance(tasks,list)):
            failed.append(safe_label(name))
    return {'failing_or_last_node':safe_label(node), 'sanitized_error_category':category, 'nodes_with_errors':failed, 'executed_node_names':[safe_label(k) for k in run], 'data_available':bool(d), 'redacted':bool((d.get('redactionInfo') or {}).get('isRedacted'))}

out={'snapshot_utc':START.isoformat(), 'window_start_utc':CUTOFF.isoformat(), 'read_only':True, 'workflow_inventory':[], 'executions':[], 'errors':[], 'limitations':[]}
out['supplied_editor_url_normalized_to_same_host_api_root'] = EDITOR_URL_NORMALIZED
try:
    cursor=None
    for page in range(4):
        q={'limit':100,'excludePinnedData':'true'}
        if cursor:q['cursor']=cursor
        obj,status=get('/workflows',q,'workflow_list')
        if obj is None:raise Blocked('Workflow list HTTP '+str(status))
        for w in obj.get('data',[]):
            detail,st=get('/workflows/'+str(w['id']),category='workflow_detail')
            out['workflow_inventory'].append(wf_summary(detail if detail else w))
        cursor=obj.get('nextCursor')
        if not cursor: break
    out['workflow_pagination_exhausted']=not bool(cursor)
    cursor=None
    time_filter=True
    detail_candidates=[]
    for page in range(12):
        q={'limit':100,'includeData':'false'}
        if time_filter:q.update({'startedAfter':CUTOFF.isoformat(),'startedBefore':START.isoformat()})
        if cursor:q['cursor']=cursor
        obj,status=get('/executions',q,'execution_list')
        if status==400 and page==0:
            time_filter=False
            out['limitations'].append('Server rejected documented date filters; bounded newest-first pagination with local 14-day filter used')
            obj,status=get('/executions',{'limit':100,'includeData':'false'},'execution_list_compatibility')
        if obj is None:raise Blocked('Execution list HTTP '+str(status))
        older=False
        for e in obj.get('data',[]):
            ts=timestamp(e.get('startedAt'))
            if ts and ts<CUTOFF:older=True;continue
            if ts and ts>START:continue
            meta={k:e.get(k) for k in ('id','workflowId','status','mode','startedAt','stoppedAt')}
            out['executions'].append(meta)
            if e.get('status') in ('error','crashed','canceled'):detail_candidates.append(e)
        cursor=obj.get('nextCursor')
        if not cursor or (not time_filter and older):break
    out['execution_pagination_exhausted']=not bool(cursor)
    out['execution_time_filters_used']=time_filter
    # Read a bounded sample of errors, newest distinct workflow and node can be assessed internally.
    for e in detail_candidates[:24]:
        obj,status=get('/executions/'+str(e['id']),{'includeData':'true'},'execution_error_detail')
        if obj:
            meta={k:e.get(k) for k in ('id','workflowId','status','mode','startedAt','stoppedAt')}
            meta.update(error_summary(obj));out['errors'].append(meta)
    out['error_details_sample_count']=len(out['errors'])
    out['error_execution_count']=len(detail_candidates)
except Blocked as exc:
    out['blocker']=str(exc)
out['request_counts']=dict(collections.Counter(str(c['status']) for c in CALLS))
out['request_categories']=dict(collections.Counter(c['category'] for c in CALLS))
out['requests_total']=len(CALLS)
out['retention_validation']='Workflow save overrides read. Public workflow/execution GET endpoints do not expose remote instance global save/prune age/count policy; inherited values and remote retention remain unverified.'
print(json.dumps(out,indent=2))
