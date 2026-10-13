import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ANALYTICS_POLICY_VERSION,analyticsRetentionUntil} from '../dist/analytics-policy.js';
import {validRecord} from '../backend/api.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dist=fileURLToPath(new URL('../dist/',import.meta.url)),output=process.env.QA_OUTPUT||path.resolve('../outputs/analytics-transport');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch(),report={scenarios:[],errors:[]},policy=ANALYTICS_POLICY_VERSION;
const uuid=n=>'22222222-2222-4222-8222-'+String(n).padStart(12,'0');
const token=n=>n.toString(16).padStart(64,'0');
async function harness({locale='ko',host='professor-maker.gahyoun.chatgpt.site',intercept}={}){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),calls=[];
 const server={registrations:0,months:new Map(),deleted:new Set()};
 page.on('pageerror',error=>report.errors.push(error.message));
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/api/')){
   const call={method:req.method(),path:url.pathname,body:req.postDataJSON(),authorization:req.headers().authorization};calls.push(call);
   if(intercept&&await intercept(route,call,server))return;
   if(call.method==='POST'&&call.path==='/api/runs'){
    assert.equal(call.body.consent,policy);assert.equal(call.body.edition,locale);
    const now=Date.now(),n=++server.registrations;
    return route.fulfill({status:201,json:{id:uuid(n),token:token(n),expiresAt:now+90*86400000,retentionUntil:analyticsRetentionUntil(now),consentVersion:policy,edition:locale}});
   }
   if(call.method==='DELETE'){server.deleted.add(call.path);return route.fulfill({json:{deleted:true}});}
   assert.equal(validRecord(call.body),true);assert.doesNotMatch(JSON.stringify(call.body),/Private student|Private faculty/);
   server.months.set(call.path+':'+call.body.month,call.body);return route.fulfill({json:{saved:true}});
  }
  if(url.pathname==='/__analytics-transport.html')return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${locale}"><body>Isolated analytics fixture</body></html>`});
  try{const file=path.join(dist,url.pathname.replace(/^\//,''));if(!file.startsWith(dist))return route.abort();return route.fulfill({contentType:url.pathname.endsWith('.js')?'text/javascript':'text/plain',body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 await page.goto('https://'+host+'/__analytics-transport.html');
 return {context,page,calls,server,async load(){await page.evaluate(async()=>{window.analysis=await import('/analytics.js');const {createState}=await import('/engine.js');window.state=createState('Private student',74,{locale:document.documentElement.lang});state.started=true;state.professorProfile.professorName='Private faculty';window.statusChanges=[];analysis.subscribeAnalyticsStatus(value=>statusChanges.push(value));});}};
}
const state=(page)=>page.evaluate(()=>analysis.analyticsTransportStatus());
async function cleanup(h){await h.page.evaluate(()=>analysis.setAnalyticsConsent(false)).catch(()=>{});await h.context.close();}
try{
 for(const locale of ['ko','en']){
  let fail=true;const h=await harness({locale,intercept:async(route,call)=>{if(!fail||call.method==='DELETE')return false;await route.fulfill({status:503,json:{error:'Synthetic unavailable'}});return true;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);state.hidden.stress=77;await analysis.recordAnalytics(state);state.month=1;await analysis.recordAnalytics(state);});
   assert.equal((await state(h.page)).queued,2);assert.equal((await state(h.page)).error.httpStatus,503);
   fail=false;await h.page.reload();await h.load();await h.page.waitForFunction(()=>analysis.analyticsTransportStatus().queued===0&&analysis.analyticsTransportStatus().phase==='synced');
   assert.equal(h.server.registrations,1);assert.equal(h.server.months.size,2);assert.equal([...h.server.months.values()].find(row=>row.month===0).student.stress,77);
   assert.equal((await state(h.page)).uploaded,2);assert.ok((await state(h.page)).lastSuccessAt);
   report.scenarios.push({name:'offline reload recovers only latest run/month snapshots',locale});
  }finally{await cleanup(h);}
 }
 {
  let uploadFail=true;const h=await harness({intercept:async(route,call)=>{if(uploadFail&&call.method==='POST'&&call.path!=='/api/runs'){await route.abort('internetdisconnected');return true;}return false;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});assert.equal(h.server.registrations,1);
   await h.page.reload();await h.load();uploadFail=false;await h.page.evaluate(()=>window.dispatchEvent(new Event('online')));
   await h.page.waitForFunction(()=>analysis.analyticsTransportStatus().phase==='synced');assert.equal(h.server.registrations,1);assert.equal(h.server.months.size,1);
   const uploads=h.calls.filter(call=>call.method==='POST'&&call.path!=='/api/runs').length;
   await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());assert.equal(h.server.months.size,1);assert.equal(h.calls.filter(call=>call.method==='POST'&&call.path!=='/api/runs').length,uploads);
   report.scenarios.push({name:'online retry reuses durable registration; acknowledged rows stay acknowledged on reload'});
  }finally{await cleanup(h);}
 }
 {
  let unauthorized=true;const h=await harness({intercept:async(route,call)=>{if(unauthorized&&call.method==='POST'&&call.path!=='/api/runs'){unauthorized=false;await route.fulfill({status:401,json:{error:'Synthetic revoked'}});return true;}return false;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   assert.equal(h.server.registrations,2);assert.equal(h.server.months.size,1);assert.equal((await state(h.page)).phase,'synced');
   await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal(h.server.deleted.size,2);
   report.scenarios.push({name:'unauthorized write rotates once and retains both withdrawal credentials'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness({intercept:async(route,call)=>{if(call.method==='POST'&&call.path!=='/api/runs'){await route.fulfill({status:400,json:{error:'Private raw payload must not enter status'}});return true;}return false;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   const result=await state(h.page);assert.deepEqual(result.error,{stage:'upload',code:'http',httpStatus:400,retryable:false});assert.equal(result.canRetry,true);
   assert.doesNotMatch(JSON.stringify(result),/Private|Bearer|22222222|0000000000/);await h.page.waitForTimeout(1200);assert.equal(h.calls.length,2);
   report.scenarios.push({name:'permanent HTTP error exposes safe stage/code without infinite automatic retry'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness();
  try{
   await h.page.evaluate(()=>Object.defineProperty(window,'indexedDB',{configurable:true,get(){throw new DOMException('Blocked fixture','SecurityError');}}));
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   assert.equal(h.server.registrations,1);assert.equal(h.server.months.size,1);assert.equal((await state(h.page)).phase,'synced');assert.ok((await state(h.page)).localError);
   await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal(h.server.deleted.size,1);
   report.scenarios.push({name:'blocked IndexedDB cannot suppress server upload; localStorage retains deletion credential'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness({locale:'en'});
  try{
   await h.page.evaluate(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked fixture','SecurityError');}}));
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});assert.equal(h.server.registrations,1);assert.equal(h.server.months.size,1);
   await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),true);assert.equal(h.server.registrations,1);
   await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal(h.server.deleted.size,1);
   report.scenarios.push({name:'blocked localStorage uses durable IndexedDB opt-in, ID and deletion credential on reload'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness();
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked fixture','SecurityError');}});await analysis.setAnalyticsConsent(false);});
   const posts=h.calls.filter(call=>call.method==='POST').length;await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());
   assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),false);assert.equal(h.calls.filter(call=>call.method==='POST').length,posts);assert.equal((await state(h.page)).queued,0);
   report.scenarios.push({name:'durable withdrawal marker overrides stale localStorage opt-in after reload'});
  }finally{await cleanup(h);}
 }
 {
  let fail=true;const h=await harness({intercept:async(route,call)=>{if(fail&&call.method==='DELETE'){await route.fulfill({status:503,json:{error:'Synthetic deletion unavailable'}});return true;}return false;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);await analysis.setAnalyticsConsent(false);});
   assert.equal((await state(h.page)).deletionPending,1);const postCount=h.calls.filter(call=>call.method==='POST').length;
   fail=false;await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());assert.equal((await state(h.page)).deletionPending,0);assert.equal(h.calls.filter(call=>call.method==='POST').length,postCount);assert.equal((await state(h.page)).queued,0);
   report.scenarios.push({name:'failed withdrawal retries deletion on reload without replaying cleared analytics'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness();
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);window.originalId=JSON.parse(localStorage.getItem('pm-analysis-sessions'));const revoke=analysis.setAnalyticsConsent(false),allow=analysis.setAnalyticsConsent(true);await Promise.all([revoke,allow]);state.month=1;await analysis.recordAnalytics(state);});
   assert.equal(h.server.deleted.size,1);assert.equal(h.server.registrations,2);assert.equal((await state(h.page)).queued,0);assert.equal((await state(h.page)).uploaded,1);
   assert.equal([...h.server.months.values()].filter(row=>row.month===1).length,1);
   report.scenarios.push({name:'rapid withdrawal followed by re-opt-in still deletes old records and allocates a new session'});
  }finally{await cleanup(h);}
 }
 {
  let rejected=false;const h=await harness({intercept:async(route,call)=>{
   if(!rejected&&call.method==='POST'&&call.path!=='/api/runs'){rejected=true;await route.fulfill({status:401,json:{error:'Synthetic revoked session'}});return true;}
   if(call.method==='DELETE'&&call.path.endsWith(uuid(1))){await route.fulfill({status:401,json:{error:'Synthetic stale deletion token'}});return true;}
   return false;
  }});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);await analysis.setAnalyticsConsent(false);});
   assert.equal(h.server.registrations,2);assert.equal(h.server.deleted.size,1);assert.equal(h.calls.filter(call=>call.method==='DELETE').length,2);assert.equal((await state(h.page)).deletionPending,1);
   report.scenarios.push({name:'a rejected archived deletion token cannot suppress deletion of later valid sessions'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness();
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);localStorage.setItem('pm-analysis-consent','no');});
   const posts=h.calls.filter(call=>call.method==='POST').length;await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());
   assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),false);assert.equal(h.calls.filter(call=>call.method==='POST').length,posts);assert.equal(h.server.deleted.size,1);
   report.scenarios.push({name:'withdrawal written by an older cached client defeats a stale durable opt-in'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness();
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(false);const original=Storage.prototype.setItem;window.restoreStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(){throw new DOMException('Write blocked fixture','QuotaExceededError');};await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   assert.equal(h.server.registrations,1);await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());
   assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),true);assert.equal(h.server.registrations,1);assert.equal((await state(h.page)).queued,0);
   report.scenarios.push({name:'fresh IndexedDB opt-in survives a localStorage write failure with an older no marker'});
  }finally{await cleanup(h);}
 }
 {
  let failMetadata=true;let h;
  h=await harness({intercept:async(route,call,server)=>{
   if(call.method!=='DELETE')return false;
   if(server.deleted.has(call.path)){await route.fulfill({status:401,json:{error:'Synthetic already deleted'}});return true;}
   if(failMetadata){failMetadata=false;await h.page.evaluate(()=>Object.defineProperty(window,'indexedDB',{configurable:true,get(){throw new DOMException('Blocked after delete fixture','SecurityError');}}));}
   return false;
  }});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);await analysis.setAnalyticsConsent(false);});
   assert.equal((await state(h.page)).deletionPending,0);await h.page.reload();await h.load();await h.page.evaluate(()=>analysis.retryAnalytics());
   assert.equal((await state(h.page)).deletionPending,0);assert.equal(h.calls.filter(call=>call.method==='DELETE').length,1);
   report.scenarios.push({name:'successful deletion snapshot survives stale metadata in the failed second store'});
  }finally{await cleanup(h);}
 }
 {
  let fail=true;const h=await harness({intercept:async(route,call)=>{if(fail&&call.method==='POST'){await route.fulfill({status:503,json:{error:'Synthetic offline'}});return true;}return false;}});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});assert.equal((await state(h.page)).queued,1);
   const posts=h.calls.filter(call=>call.method==='POST').length;fail=false;await h.page.reload();
   await h.page.evaluate(async()=>{window.analysis=await import('/analytics.js');const revoke=analysis.setAnalyticsConsent(false),allow=analysis.setAnalyticsConsent(true);await Promise.all([revoke,allow]);});
   assert.equal((await state(h.page)).queued,0);assert.equal(h.calls.filter(call=>call.method==='POST').length,posts);
   report.scenarios.push({name:'bootstrap replay never overtakes a rapid withdrawal and fresh opt-in'});
  }finally{await cleanup(h);}
 }
 {
  const h=await harness({intercept:async(route,call)=>{if(call.method==='POST'){await route.fulfill({status:503,json:{error:'Synthetic prolonged outage'}});return true;}return false;}});
  try{
   await h.page.evaluate(()=>{const timer=window.setTimeout;window.setTimeout=(fn,delay,...args)=>timer(fn,Math.min(delay,5),...args);});
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   await h.page.waitForFunction(()=>statusChanges.filter(value=>value.phase==='error').length>=4);await h.page.waitForTimeout(150);assert.equal(h.calls.length,4);assert.equal((await state(h.page)).queued,1);
   report.scenarios.push({name:'automatic retries stop after three backoff attempts; pending row remains available'});
  }finally{await cleanup(h);}
 }
 for(const host of ['gahyoun.github.io','professor-maker-debug.gahyoun.chatgpt.site','professor-maker.gahyoun.chatgpt.site.example.com']){
  const h=await harness({host});try{await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);window.dispatchEvent(new Event('online'));await analysis.retryAnalytics();});assert.equal(h.calls.length,0);assert.equal((await state(h.page)).scope,'device');report.scenarios.push({name:'retry and online never transport device-only analytics',host});}finally{await cleanup(h);}
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({scenarios:report.scenarios.length,errors:report.errors,output}));
}finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
