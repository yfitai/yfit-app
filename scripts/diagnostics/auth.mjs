#!/usr/bin/env node
// Offline diagnostics only. No application imports, environment access, network, builds or writes.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const ast = name => parse(source(name), {sourceType:'module', plugins:['jsx','typescript']});
function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  for (const [k,v] of Object.entries(node)) {
    if (['loc','start','end'].includes(k)) continue;
    if (Array.isArray(v)) v.forEach(x => walk(x,fn)); else if (v && typeof v === 'object') walk(v,fn);
  }
}
function expression(name, binding) {
  let found;
  walk(ast(name), n => {if(n.type === 'VariableDeclarator' && n.id.name === binding) found=n.init});
  assert(found, 'source function not found');
  return source(name).slice(found.start,found.end);
}
const quiet = {log(){},warn(){},error(){}};
function evaluate(code, scope) {return vm.runInNewContext(`(${code})`, {console:quiet, URLSearchParams, ...scope})}
const user = {id:'synthetic-auth-user',email:'fixture@example.invalid',user_metadata:{full_name:'Synthetic Fixture'}};
const names = ['getUserProfile','signIn','signUp'];
function helpers(mock) {
  const c = {supabase:mock,console:quiet,window:{location:{origin:'https://fixture.invalid'}}};
  vm.createContext(c);
  for(const name of names) vm.runInContext(`var ${name} = ${expression('src/lib/supabase.js', name)}`,c);
  return c;
}
function query(result) {
  return {select(){return this},eq(){return this},single:async()=>result,maybeSingle:async()=>result,insert:async()=>result,upsert:async()=>result};
}
function appScope(result) {
  const state = {user:null,isGuestMode:true,isNewUser:false,showInstallGuide:false,loading:true,queries:0};
  const scope = {supabase:{from(){state.queries++;return query(result)}},localStorage:{getItem(){return null}},
    setShowInstallGuide:v=>state.showInstallGuide=v,setIsNewUser:v=>state.isNewUser=v,setNeedsOnboarding(){},
    setUser:v=>state.user=v,setIsGuestMode:v=>state.isGuestMode=v,clearGuestSession(){state.cleared=true}};
  const check = evaluate(expression('src/App.jsx','checkOnboardingStatus'),scope);
  return {state,scope,check};
}
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const race = p => Promise.race([p.then(()=> 'settled'),new Promise(r=>setTimeout(()=>r('pending'),30))]);
test('signup-default mismatch reproduced from active JSX',()=>{
  let def;walk(ast('src/components/Auth.jsx'),n=>{if(n.type==='JSXOpeningElement'&&n.name.name==='Tabs')def=n.attributes.find(a=>a.name?.name==='defaultValue')?.value.value});
  assert.equal(def,'login');
  assert(source('src/App.jsx').includes('<Route path="/signup" element={<Auth onAuthSuccess={handleAuthSuccess} />} />'));
});
test('relative module resolves under /auth/assets on email callback',()=>{
  assert(source('vite.config.js').includes("base: './'"));
  assert.equal(new URL('./assets/fixture.js','https://fixture.invalid/auth/callback').pathname,'/auth/assets/fixture.js');
  assert.equal(new URL('./assets/fixture.js','https://fixture.invalid/dashboard').pathname,'/assets/fixture.js');
});
test('SDK defaults enable automatic implicit URL session detection',()=>{
  const sdk=source('node_modules/@supabase/auth-js/src/GoTrueClient.ts');
  assert(sdk.includes('detectSessionInUrl: true'));assert(sdk.includes("flowType: 'implicit'"));
});
test('logged-out callback lacks dedicated route; authenticated fallback goes dashboard',()=>{
  const routes=[];walk(ast('src/App.jsx'),n=>{
    if(n.type!=='JSXOpeningElement'||n.name.name!=='Route')return;
    const p=n.attributes.find(a=>a.name?.name==='path')?.value?.value;
    const e=n.attributes.find(a=>a.name?.name==='element')?.value?.expression;
    const to=e?.openingElement?.attributes?.find(a=>a.name?.name==='to')?.value;
    routes.push({p,to:to?.value});
  });
  assert(!routes.some(r=>r.p==='/auth/callback'));
  assert(routes.some(r=>r.p==='*'&&r.to==='/'));
  assert(routes.some(r=>r.p==='*'&&r.to==='/dashboard'));
});
test('onAuthSuccess correctly clears guest mode and accepts synthetic user',()=>{
  const {state,scope}=appScope({data:null,error:null});
  evaluate(expression('src/App.jsx','handleAuthSuccess'),scope)(user);
  assert.equal(state.user,user);assert.equal(state.isGuestMode,false);assert.equal(state.cleared,true);
});
test('profile permission error misclassified as first-time user',async()=>{
  const {state,check}=appScope({data:null,error:{code:'42501',message:'synthetic permission denial'}});
  await check(user.id);assert.equal(state.showInstallGuide,true);assert.equal(state.isNewUser,true);
});
test('missing profile intentionally opens guide and first-time Goals branch',async()=>{
  const {state,check}=appScope({data:null,error:null});await check(user.id);
  assert.equal(state.showInstallGuide,true);assert.equal(state.isNewUser,true);
});
test('existing profile bypasses first-time Goals check regardless of user_goals',async()=>{
  const {state,check}=appScope({data:{install_guide_shown:true,onboarding_completed:false},error:null});
  await check(user.id);assert.equal(state.isNewUser,false);assert.equal(state.queries,1);
});
test('first-time routing state remains latched when later profile appears',async()=>{
  let result={data:null,error:null};const {state,scope}=appScope(result);
  scope.supabase.from=()=>query(result);
  const check=evaluate(expression('src/App.jsx','checkOnboardingStatus'),scope);
  await check(user.id);result={data:{install_guide_shown:true},error:null};await check(user.id);
  assert.equal(state.isNewUser,true);assert.equal(state.showInstallGuide,true);
});
test('email signup reports success despite profile permission failure',async()=>{
  let invoked=0;
  const h=helpers({auth:{signUp:async()=>({data:{user,session:null},error:null})},from:()=>query({error:{code:'42501'}}),functions:{invoke:async()=>{invoked++;return {error:null}}}});
  const result=await h.signUp(user.email,'synthetic-only','Synthetic','Fixture');
  assert.equal(result.error,null);assert.equal(result.needsEmailConfirmation,true);assert.equal(invoked,1);
});
test('email login authentication error is returned without querying profile',async()=>{
  const h=helpers({auth:{signInWithPassword:async()=>({data:null,error:{message:'synthetic rejection'}})},from(){throw Error('should not query')}});
  assert((await h.signIn(user.email,'synthetic-only')).error);
});
test('email login success waits indefinitely if profile read does not settle',async()=>{
  const q=query({data:null,error:null});q.single=()=>new Promise(()=>{});
  const h=helpers({auth:{signInWithPassword:async()=>({data:{user,session:{user}},error:null})},from:()=>q});
  assert.equal(await race(h.signIn(user.email,'synthetic-only')),'pending');
});
test('email signup success waits indefinitely if profile insert does not settle',async()=>{
  const q=query({error:null});q.insert=()=>new Promise(()=>{});
  const h=helpers({auth:{signUp:async()=>({data:{user,session:null},error:null})},from:()=>q,functions:{invoke:async()=>({error:null})}});
  assert.equal(await race(h.signUp(user.email,'synthetic-only','Synthetic','Fixture')),'pending');
});
test('install-guide resolved upsert error is ignored and UI completes',async()=>{
  let completed=false;let dismissed=false;
  const fn=evaluate(expression('src/components/InstallGuide.jsx','markShownAndComplete'),{
    saving:false,user,Date,supabase:{from:()=>query({error:{code:'42501'}})},
    setSaving(){},setDismissed:v=>dismissed=v,onComplete(){completed=true}
  });await fn();assert.equal(dismissed,true);assert.equal(completed,true);
});
test('Google helper initiation targets dashboard on originating host',async()=>{
  let request;let error='';const fn=evaluate(expression('src/components/Auth.jsx','handleGoogleSignIn'),{
    setError:v=>error=v,setSuccess(){},setIsLoading(){},window:{location:{origin:'https://fixture.invalid'}},
    supabase:{auth:{signInWithOAuth:async r=>{request=r;return {error:null}}}}
  });await fn();assert.equal(request.provider,'google');assert.equal(request.options.redirectTo,'https://fixture.invalid/dashboard');assert.equal(error,'');
});
test('App initial session path ignores resolved initialization error',async()=>{
  let effect;
  walk(ast('src/App.jsx'),n=>{if(n.type==='CallExpression'&&n.callee.name==='useEffect'&&n.arguments[0]?.type==='ArrowFunctionExpression'){
    const c=source('src/App.jsx').slice(n.arguments[0].start,n.arguments[0].end);
    if(c.includes('authTimeout'))effect=c;
  }});
  assert(effect);let loading=true;let fallbacks=0;let listener;
  const fn=evaluate(effect,{LiveUpdateService:{initialize:()=>Promise.resolve()},setLoading:v=>loading=v,
    setUser(){},setAnalyticsUser(){},setupGlobalErrorHandlers(){},checkOnboardingStatus:async()=>{},Analytics:{login(){}},
    setTimeout:()=>1,clearTimeout(){},getCurrentUser:async()=>{fallbacks++;return null},
    supabase:{auth:{getSession:async()=>({data:{session:null},error:{message:'synthetic callback failure'}}),onAuthStateChange:cb=>{listener=cb;return {data:{subscription:{unsubscribe(){}}}}}}}
  });fn();await new Promise(r=>setImmediate(r));assert.equal(loading,false);assert.equal(fallbacks,0);assert(listener);
});
test('INITIAL_SESSION and SIGNED_IN accept session; refresh skips profile check',async()=>{
  let cb;
  walk(ast('src/App.jsx'),n=>{if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='onAuthStateChange')cb=source('src/App.jsx').slice(n.arguments[0].start,n.arguments[0].end)});
  assert(cb);let current=null;let checks=0;let logins=0;
  const fn=evaluate(cb,{setUser:v=>current=v,setAnalyticsUser(){},setupGlobalErrorHandlers(){},
    checkOnboardingStatus:async()=>{checks++},setTimeout:()=>1,Analytics:{login(){logins++}}});
  await fn('INITIAL_SESSION',{user});assert.equal(current,user);assert.equal(checks,1);
  await fn('SIGNED_IN',{user});assert.equal(checks,2);assert.equal(logins,1);
  await fn('TOKEN_REFRESHED',{user});assert.equal(checks,2);
  await fn('SIGNED_OUT',null);assert.equal(current,null);
});
test('Google dashboard route does not redirect new user to Goals',()=>{
  assert(source('src/App.jsx').includes('<Route path="/dashboard" element={<Dashboard user={user} />} />'));
  assert(source('src/components/Auth.jsx').includes('redirectTo: `${window.location.origin}/dashboard`'));
});
let count=0;
for(const {name,fn} of tests){try{await fn();count++;console.log('PASS '+name)}catch{console.log('FAIL '+name);process.exitCode=1}}
console.log(`RESULT ${count}/${tests.length} actual-source diagnostic assertions passed. Known defects are reproduced, not repaired. No network or production operations.`);
