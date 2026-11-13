import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsPDF } from 'jspdf';
import * as ingredients from '../../src/lib/medicationIngredients.js';
import * as schedule from '../../src/lib/medicationSchedule.js';
const require = createRequire(import.meta.url);
let passed = 0;
const pass = label => { passed++; console.log(`PASS ${label}`); };
const t = (key, fallback) => typeof fallback === 'string' ? fallback : key;
const ids = [1,2,3,4,5].map(n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`);
const rows = [1,2,3,4].map((n,i) => ({name:`Fictional ingredient ${n}`,dosage:`Fictional label strength ${n}`,medication_id:ids[i]}));
const parent = {id:'fictional-parent',custom_name:'Fictional compound parent',dosage:'Fictional directions',frequency:'Twice weekly',scheduled_weekdays:[1,4],combination_ingredients:rows,route:'Oral',start_date:'2026-01-01',notes:'Fictional notes',prescriber_name:'Fictional prescriber'};
const form = {dosage:parent.dosage,frequency:parent.frequency,scheduled_weekdays:[1,4],combination_ingredients:rows,route:'Oral',start_date:parent.start_date,prescriber_id:'',pharmacy:'',refills_remaining:'',notes:parent.notes};
const custom = {...form,custom_name:parent.custom_name,custom_generic_name:'',is_supplement:false};
const existing = [{id:'fictional-existing',custom_name:'Fictional existing parent',is_supplement:null,medication_id:ids[0],medication:{id:ids[0],name:rows[0].name}}, {id:'fictional-supplement',custom_name:'Fictional unmatched supplement',is_supplement:true,medication_id:null}];
function client({fail=false,meds=existing}={}) {
  const calls=[];
  return {calls,from(table){
    const call={table,filters:[]}; calls.push(call);
    const q={select(){return q},eq(k,v){call.filters.push([k,v]);return q},order(){return q},in(k,v){call.ids=v;return q},or(value){call.or=value;return q},insert(value){call.insert=value;return q},update(value){call.update=value;return q},then(resolve,reject){
      const data=table==='user_medications'?meds:table==='medications'?(call.ids||[]).map(id=>({id,name:`Fictional catalog ${id.slice(-1)}`})):table==='drug_interactions'?[{drug_a_id:ids[0],drug_b_id:ids[1],severity:'major',description:'Fictional catalog conflict',management:'Fictional catalog management'}]:[];
      return Promise.resolve({data,error:fail&&table==='user_medications'?new Error('Fictional read failure'):null}).then(resolve,reject);
    }};return q;
  }};
}
async function harness(name,initial,db=client(),PDF=jsPDF) {
  let cursor=0,refCursor=0;const states=[...initial],refs=[],alerts=[];
  const react={...React,useState(value){const i=cursor++;if(!(i in states))states[i]=typeof value==='function'?value():value;return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next}]},useEffect(){},useRef(value){const i=refCursor++;return refs[i]||=( {current:value} )}};
  const editor=({value})=>React.createElement('section',{'data-ingredient-editor':true},(value||[]).map((r,i)=>React.createElement('div',{key:i},`${r.name} — ${r.dosage}`)));
  const picker=({frequency,days})=>React.createElement('div',{'data-weekday-picker':true},`${frequency}: ${(days||[]).join(',')}`);
  const imports={react,'react-i18next':{useTranslation:()=>({t,i18n:{language:'en',resolvedLanguage:'en'}})},'../lib/supabase':{supabase:db,getUserProfile(){throw new Error('Unexpected profile access')}},'../lib/medicationIngredients':ingredients,'../lib/medicationSchedule':schedule,'./MedicationIngredientEditor':{__esModule:true,default:editor},'./MedicationWeekdayPicker':{__esModule:true,default:picker},jspdf:{jsPDF:PDF}};
  const {code}=await transform(fs.readFileSync(`src/components/${name}.jsx`,'utf8'),{loader:'jsx',jsx:'automatic',format:'cjs'});
  const module={exports:{}};
  vm.runInThisContext(`(function(require,module,exports,alert,confirm,window){${code}\n})`)(id=>id in imports?imports[id]:require(id),module,module.exports,msg=>alerts.push(msg),()=>true,{print(){}});
  return {states,alerts,db,tree(){cursor=0;refCursor=0;return module.exports.default({user:{id:'fictional-user',email:'fictional@example.invalid'},onAddMedication(){}})},markup(){return renderToStaticMarkup(this.tree())}};
}
function nodes(node,predicate,out=[]) {if(node&&typeof node==='object'){if(predicate(node))out.push(node);React.Children.forEach(node.props?.children,child=>nodes(child,predicate,out));}return out;}
function text(node){if(typeof node==='string'||typeof node==='number')return String(node);if(!node)return '';return React.Children.toArray(node.props?.children).map(text).join('');}
function button(tree,label){const found=nodes(tree,n=>n.type==='button'&&text(n).includes(label)).at(-1);assert.ok(found,`Missing button ${label}`);return found;}
const search=await harness('MedicationSearch',['',[],false,null,[],null,true,form,custom]);
assert.match(search.markup(),/Check ingredients against my medications/);assert.match(search.markup(),/Fictional ingredient 4/);assert.match(search.markup(),/not medical clearance/);
await button(search.tree(),'Check ingredients against my medications').props.onClick();
let html=search.markup();for(const value of ['Fictional catalog conflict','Fictional catalog management','Unmatched ingredients or medications','Potential duplicate ingredients','Fictional ingredient 1','Coverage is limited'])assert.ok(html.includes(value), `Missing safety text: ${value}`);
assert.doesNotMatch(html,/No known interactions|safe to take/i);assert.deepEqual(search.db.calls[0].filters,[['user_id','fictional-user'],['is_active',true]]);assert.ok(!search.db.calls.some(c=>c.insert||c.update));pass('Custom check shows interactions, management, unresolved, duplicates and coverage; NULL flags included; no write');
search.states[8]={...custom,dosage:'Changed fictional directions'};assert.doesNotMatch(search.markup(),/Fictional catalog conflict/);assert.match(search.markup(),/Check again/);pass('Changed drafts hide obsolete results');
const regular=await harness('MedicationSearch',['',[],false,{id:ids[4],name:'Fictional catalog parent'},[],null,false,form,custom]);await button(regular.tree(),'Check ingredients against my medications').props.onClick();assert.match(regular.markup(),/Fictional catalog conflict/);pass('Regular check includes parent catalog ID and four draft ingredients');
const failed=await harness('MedicationSearch',['',[],false,null,[],null,true,form,custom],client({fail:true}));await button(failed.tree(),'Check ingredients against my medications').props.onClick();assert.match(failed.markup(),/The ingredient check failed/);assert.doesNotMatch(failed.markup(),/Coverage is limited:|Fictional catalog conflict/);pass('Failed reads show error, not successful zero interactions');
search.states[8]={...custom,combination_ingredients:[{name:'Fictional partial row',dosage:'',medication_id:null}]};let before=search.db.calls.length;await button(search.tree(),'Add Custom Medication').props.onClick();assert.equal(search.db.calls.length,before);assert.match(search.alerts.at(-1),/name and prescribed strength/);pass('Custom save rejects partial ingredient rows before persistence');
regular.states[7]={...form,combination_ingredients:[{name:'Fictional ingredient',dosage:'Fictional strength',medication_id:'invalid-id'}]};before=regular.db.calls.length;await button(regular.tree(),'medications.addMedication').props.onClick();assert.equal(regular.db.calls.length,before);assert.match(regular.alerts.at(-1),/valid catalog match/);pass('Regular save rejects invalid ingredient IDs');
regular.states[7]=form;await button(regular.tree(),'medications.addMedication').props.onClick();const saved=regular.db.calls.find(c=>c.insert).insert;assert.equal(saved.medication_id,ids[4]);assert.deepEqual(saved.combination_ingredients,rows);assert.deepEqual(saved.scheduled_weekdays,[1,4]);assert.equal(saved.frequency,form.frequency);assert.equal(saved.dosage,form.dosage);assert.deepEqual(regular.states[7].combination_ingredients,[]);pass('Regular save writes one parent with four normalized rows, preserved weekday/dosage/frequency and reset');
search.states[8]=custom;await button(search.tree(),'Add Custom Medication').props.onClick();const customSaved=search.db.calls.find(c=>c.insert).insert;assert.equal(customSaved.custom_name,custom.custom_name);assert.deepEqual(customSaved.combination_ingredients,rows);assert.deepEqual(customSaved.scheduled_weekdays,[1,4]);assert.deepEqual(search.states[8].combination_ingredients,[]);pass('Custom save preserves grouping, normalized ingredients, weekdays and reset');
const list=await harness('MedicationList',[[parent],[],false,null,{}],client({meds:[parent]}));assert.equal((list.markup().match(/<li /g)||[]).length,4);assert.match(list.markup(),/Monday, Thursday/);nodes(list.tree(),n=>n.type==='button'&&n.props.title==='Edit')[0].props.onClick();assert.deepEqual(list.states[4].combination_ingredients,rows);assert.notEqual(list.states[4].combination_ingredients,rows);assert.notEqual(list.states[4].combination_ingredients[0],rows[0]);assert.match(list.markup(),/data-ingredient-editor/);list.states[4]={...list.states[4],combination_ingredients:[{name:'Partial fictional row',dosage:'',medication_id:null}]};before=list.db.calls.length;await button(list.tree(),'Save').props.onClick();assert.equal(list.db.calls.length,before);assert.match(list.alerts.at(-1),/name and prescribed strength/);list.states[4]={dosage:parent.dosage,frequency:parent.frequency,scheduled_weekdays:[1,4],combination_ingredients:rows,route:'Oral',notes:parent.notes};await button(list.tree(),'Save').props.onClick();const updated=list.db.calls.find(c=>c.update).update;assert.deepEqual(updated.combination_ingredients,rows);assert.deepEqual(updated.scheduled_weekdays,[1,4]);assert.equal(updated.notes,parent.notes);pass('List groups four bullets, hydrates independent edit rows, validates and preserves notes/weekdays on update');
let trace=[],savedPDF='';function PDF(options){const doc=new jsPDF(options),original=doc.text.bind(doc);doc.text=(value,x,y,...args)=>{trace.push({value:String(value),x,y,page:doc.internal.getCurrentPageInfo().pageNumber});return original(value,x,y,...args)};doc.save=name=>{savedPDF=name};return doc;}
const fillers=Array.from({length:14},(_,i)=>({...parent,id:`fictional-filler-${i}`,custom_name:`Fictional filler ${i}`,combination_ingredients:null,notes:null,prescriber_name:null}));
const supplement={...parent,id:'fictional-compound-supplement',custom_name:'Fictional compound supplement',combination_ingredients:rows.map(row=>({...row,name:`Supplement ${row.name}`}))};
const report=await harness('ProviderReport',[[...fillers,parent],[supplement],[{allergen:'Fictional allergen',severity:'Fictional severity',reaction:'Fictional reaction'}],[{id:'fictional-provider',name:'Fictional provider'}],false,false,{full_name:'Fictional Patient'},'fictional-provider',false,{name:'',specialty:'',phone:'',email:'',address:''}],client(),PDF);
html=report.markup();for(const value of ['Fictional Patient','Fictional provider','Fictional allergen','Fictional reaction','Supplement Fictional ingredient 4','Monday, Thursday','Twice weekly','break-inside:avoid'])assert.ok(html.includes(value));assert.ok(button(report.tree(),'Print'));assert.equal(report.db.calls.length,0);pass('Screen/print preserves patient/provider/allergies/frequency and includes medication/supplement ingredients/weekdays');
await button(report.tree(),'Download PDF').props.onClick();assert.match(savedPDF,/Medication_Report_/);assert.equal(report.alerts.length,0);assert.ok(new Set(trace.map(r=>r.page)).size>1);for(const [heading,prefix] of [['15. Fictional compound parent','- Fictional ingredient'],['1. Fictional compound supplement','- Supplement Fictional ingredient']]){const title=trace.find(r=>r.value===heading);assert.ok(title);const lines=trace.filter(r=>r.x===32&&r.value.startsWith(prefix));assert.equal(lines.length,4);assert.ok(lines.every(r=>r.page===title.page&&r.y>=20&&r.y<=282));}assert.ok(trace.some(r=>r.value.includes('Dosing days: Monday, Thursday')));assert.ok(trace.some(r=>r.value.includes('Frequency: Twice weekly')));assert.equal(report.db.calls.length,0);pass('Multi-page in-memory PDF groups four ingredient strengths with each parent, indents/bounds lines and keeps frequency plus weekdays');
console.log(`${passed} assertion groups passed; no real records, browser, database, service, build, bundle or PDF file.`);
