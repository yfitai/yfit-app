import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {prepareReview} from './planner.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'fixture.json'),'utf8'));
const routes=JSON.parse(fs.readFileSync(path.join(root,'cta-routes.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'planner.mjs'),'utf8');
assert(!/^import\s/m.test(source),'Planner must have no external imports');
const plans=prepareReview(fixture,routes);
assert.equal(plans.length,6);
const embedded=source.replace(/^export\s+/gm,'')+'\nconst fixture='+JSON.stringify(fixture)+';\nconst routes='+JSON.stringify(routes)+';\nreturn prepareReview(fixture,routes);\n';
const result=vm.runInNewContext('(function(){'+embedded+'})()', {URL}, {timeout:2000,contextCodeGeneration:{strings:false,wasm:false}});
assert.equal(JSON.stringify(result),JSON.stringify(plans),'Embedded n8n code and local module outputs must match');
const workflow={
 name:'YFIT Article-led Video — LOCAL REVIEW PLANNER ONLY — UNPUBLISHED',
 active:false,
 nodes:[
  {id:'review-manual-trigger',name:'Manual Review Only',type:'n8n-nodes-base.manualTrigger',typeVersion:1,position:[0,0],parameters:{},notes:'No schedule or webhook. This is a local planner draft, not the exported current posting workflow.',notesInFlow:true},
  {id:'review-platform-plan',name:'Build Six Review Plans — No Calls or Posting',type:'n8n-nodes-base.code',typeVersion:2,position:[320,0],parameters:{mode:'runOnceForAllItems',jsCode:embedded},notes:'Fixed local reviewed fixture. No HTTP, model, speech, render, upload, database or production calls. Outputs remain review_only and publishing_allowed=false. Current production mappings must be reviewed before any adapter integration.',notesInFlow:true}
 ],
 connections:{'Manual Review Only':{main:[[{node:'Build Six Review Plans — No Calls or Posting',type:'main',index:0}]]}},
 settings:{executionOrder:'v1'},
 pinData:{},
 meta:{templateCredsSetupCompleted:false},
 tags:[]
};
assert(workflow.nodes.every(n=>['n8n-nodes-base.manualTrigger','n8n-nodes-base.code'].includes(n.type)));
assert(!workflow.nodes.some(n=>'credentials' in n));
assert(!workflow.nodes.some(n=>/webhook|schedule|httpRequest|executeWorkflow|upload/i.test(n.type)));
assert(plans.every(p=>p.json.publishing_allowed===false && p.json.review_only===true && p.json.production_ready===false));
fs.writeFileSync(path.join(root,'n8n-unpublished-review-planner.json'),JSON.stringify(workflow,null,2)+'\n');
fs.writeFileSync(path.join(root,'six-platform-review-plans.json'),JSON.stringify(plans,null,2)+'\n');
fs.writeFileSync(path.join(root,'embedded-code-qa.json'),JSON.stringify({scope:'local VM evaluation only; no actual n8n import/execution',embedded_code_matches_module:true,platform_count:plans.length,node_type_allowlist_passed:true,network_nodes:0,credentials:0,automatic_triggers:0,live_calls:0,model_calls:0,media_generated:false,publishing_allowed:false,current_production_workflow_adapter_verified:false},null,2)+'\n');
console.log('Prepared six review plans and a two-node inactive local n8n draft. Embedded code matches the module. No external calls.');
