import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ANALYTICS_POLICY_VERSION,ANALYTICS_EXPORT_FORMAT,analyticsRetentionUntil} from '../dist/analytics-policy.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dist=fileURLToPath(new URL('../dist/',import.meta.url)),dir=process.env.QA_OUTPUT||path.resolve('../outputs/pm4220-analysis-client');
const releaseVersion=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version;
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch(),report={scenarios:[],errors:[]};
const current=ANALYTICS_POLICY_VERSION;
const editionKey=(key,locale)=>locale==='en'?'pm-us-'+key.slice(3):key;
const dbName=locale=>locale==='en'?'pm-us-anonymous-analysis':'pm-anonymous-analysis';
const uuid=n=>'11111111-1111-4111-8111-'+String(n).padStart(12,'0');
const token=n=>n.toString(16).padStart(64,'0');
async function harness({locale='ko',host='professor-maker.gahyoun.chatgpt.site',onAPI}={}){
 const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage(),calls=[];
 let registrations=0;
 page.on('pageerror',error=>report.errors.push(error.message));
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/api/')){
   const call={method:req.method(),path:url.pathname,body:req.postDataJSON(),authorization:req.headers().authorization};calls.push(call);
   if(onAPI&&await onAPI(route,call))return;
   if(call.method==='POST'&&call.path==='/api/runs'){
    const now=await page.evaluate(()=>Date.now()),n=++registrations;
    return route.fulfill({status:201,json:{id:uuid(n),token:token(n),expiresAt:now+90*86400000,retentionUntil:analyticsRetentionUntil(now),consentVersion:current,edition:locale}});
   }
   return route.fulfill({json:call.method==='DELETE'?{deleted:true}:{saved:true}});
  }
  if(url.pathname==='/__analysis-policy-test.html')return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Analytics policy test</title></head><body><p>Isolated analytics test fixture</p></body></html>`});
  try{const file=path.join(dist,url.pathname.replace(/^\//,''));if(!file.startsWith(dist))return route.abort();const data=await fs.readFile(file);return route.fulfill({contentType:url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.html')?'text/html':'text/plain',body:data});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 const origin=host==='localhost'?'http://localhost:4196':'https://'+host;
 await page.goto(origin+'/__analysis-policy-test.html');
 return {context,page,calls,origin,async load(){await page.evaluate(async()=>{window.analysis=await import('/analytics.js');const {createState}=await import('/engine.js');window.state=createState('Private test name',44,{locale:document.documentElement.lang});state.started=true;state.professorProfile.professorName='Private faculty name';window.analyticsExport=async()=>{let exported;const original=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return original(blob);};const prevent=event=>{if(event.target.tagName==='A')event.preventDefault();};document.addEventListener('click',prevent);try{await analysis.exportAnalytics();return JSON.parse(await exported.text());}finally{URL.createObjectURL=original;document.removeEventListener('click',prevent);}};});}};
}
async function rows(page,name){return page.evaluate(async name=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise((resolve,reject)=>{const r=db.transaction('months').objectStore('months').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}},name);}
try{
 for(const host of ['professor-maker.gahyoun.chatgpt.site','gahyoun.github.io','localhost'])for(const locale of ['ko','en']){
  const h=await harness({host,locale}),other=locale==='en'?'ko':'en';
  try{
   await h.page.evaluate(async({locale,other})=>{
    const key=(value,edition)=>edition==='en'?'pm-us-'+value.slice(3):value;
    localStorage.setItem(key('pm-analysis-consent',locale),'anonymous-gameplay-v1');
    localStorage.setItem(key('pm-analysis-consent',other),'anonymous-gameplay-v1');
    localStorage.setItem(key('pm-analysis-id-44',locale),'old-analysis-id');
    localStorage.setItem(key('pm-analysis-sessions',locale),JSON.stringify({44:{id:'old-session',token:'old-token',expiresAt:Date.now()+86400000}}));
    localStorage.setItem(key('pm-analysis-session',locale),'old-session');
    localStorage.setItem(key('pm-save-v4',locale),'protected game save');localStorage.setItem(key('pm-letters-v3',locale),'protected letters');
    const seedDB=async(name,storeName,row)=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore(storeName,{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{await new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}};
    await seedDB(locale==='en'?'pm-us-anonymous-analysis':'pm-anonymous-analysis','months',{key:'old',id:'old',profile:{edition:locale},record:{month:1}});
    await seedDB(other==='en'?'pm-us-anonymous-analysis':'pm-anonymous-analysis','months',{key:'other',id:'other',record:{month:2}});
    await seedDB(key('pm-checkpoints',locale),'months',{key:'keep',kind:'protected checkpoint'});
   },{locale,other});
   await h.load();assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),false);
   await h.page.evaluate(()=>analysis.recordAnalytics(state));
   const empty=await h.page.evaluate(()=>analyticsExport());assert.equal(empty.format,ANALYTICS_EXPORT_FORMAT);assert.equal(empty.consent,current);assert.deepEqual(empty.runs,[]);assert.equal(h.calls.length,0);
   assert.equal((await rows(h.page,dbName(locale))).length,0);assert.equal((await rows(h.page,dbName(other))).length,1);
   const preserved=await h.page.evaluate(({locale,other})=>{const key=(value,edition)=>edition==='en'?'pm-us-'+value.slice(3):value;return {game:localStorage.getItem(key('pm-save-v4',locale)),letters:localStorage.getItem(key('pm-letters-v3',locale)),otherConsent:localStorage.getItem(key('pm-analysis-consent',other)),oldId:localStorage.getItem(key('pm-analysis-id-44',locale)),oldSession:localStorage.getItem(key('pm-analysis-session',locale))};},{locale,other});
   assert.deepEqual(preserved,{game:'protected game save',letters:'protected letters',otherConsent:'anonymous-gameplay-v1',oldId:null,oldSession:null});assert.equal((await rows(h.page,editionKey('pm-checkpoints',locale)))[0].kind,'protected checkpoint');
   await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});
   const exported=await h.page.evaluate(()=>analyticsExport());assert.equal(exported.runs.length,1);assert.equal(exported.runs[0].profile.edition,locale);assert.equal(exported.runs[0].profile.version,releaseVersion);assert.doesNotMatch(JSON.stringify(exported),/Private test name|Private faculty name/);
   const registrations=h.calls.filter(c=>c.path==='/api/runs');assert.equal(registrations.length,host==='professor-maker.gahyoun.chatgpt.site'?1:0);if(registrations.length){assert.equal(registrations[0].body.edition,locale);assert.equal(registrations[0].body.consent,current);}
   await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal((await rows(h.page,dbName(locale))).length,0);assert.equal((await rows(h.page,dbName(other))).length,1);
   assert.equal(await h.page.evaluate(key=>localStorage.getItem(key),editionKey('pm-save-v4',locale)),'protected game save');
   report.scenarios.push({name:'legacy opt-in requires fresh consent; only current-edition analysis resets',host,locale,requests:h.calls.map(c=>({method:c.method,path:c.path,edition:c.body?.edition}))});
  }finally{await h.context.close();}
 }
 for(const locale of ['ko','en'])for(const mismatch of ['policy','edition','expired']){
  const h=await harness({locale,onAPI:async(route,call)=>{if(call.path!=='/api/runs')return false;const now=Date.now();await route.fulfill({status:201,json:{id:uuid(8),token:token(8),expiresAt:mismatch==='expired'?now-1000:now+90*86400000,retentionUntil:analyticsRetentionUntil(now),consentVersion:mismatch==='policy'?'anonymous-gameplay-v1':current,edition:mismatch==='edition'?(locale==='ko'?'en':'ko'):locale}});return true;}});
  try{await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);});assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/api/runs');assert.equal((await rows(h.page,dbName(locale))).length,1);assert.equal(await h.page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem(document.documentElement.lang==='en'?'pm-us-analysis-sessions':'pm-analysis-sessions')||'{}')).length),0);report.scenarios.push({name:'mismatched registration cannot upload months',locale,mismatch});}finally{await h.context.close();}
 }
 for(const locale of ['ko','en']){
  const h=await harness({locale});
  try{
   await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);window.clock=Date.now()+91*86400000;Date.now=()=>window.clock;state.month=1;await analysis.recordAnalytics(state);});
   assert.equal(h.calls.filter(c=>c.path==='/api/runs').length,2);
   const archives=await h.page.evaluate(key=>Object.values(JSON.parse(localStorage.getItem(key))),editionKey('pm-analysis-sessions',locale));assert.equal(archives.length,2);assert.equal(archives[0].expiresAt<await h.page.evaluate(()=>Date.now()),true);
   const clock=await h.page.evaluate(()=>Date.now());await h.page.reload();await h.page.evaluate(clock=>{Date.now=()=>clock;},clock);await h.load();assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),true);
   await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal(h.calls.filter(c=>c.method==='DELETE').length,2);assert.equal((await rows(h.page,dbName(locale))).length,0);assert.deepEqual(await h.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),editionKey('pm-analysis-sessions',locale)),{});report.scenarios.push({name:'90-day token rotation retains every deletion token through five-year retention and reload',locale});
  }finally{await h.context.close();}
 }
 {
  let releaseRegistration,registrationReached;
  const reached=new Promise(resolve=>registrationReached=resolve),gate=new Promise(resolve=>releaseRegistration=resolve);
  const h=await harness({onAPI:async(route,call)=>{if(call.path!=='/api/runs')return false;registrationReached();await gate;const now=Date.now();await route.fulfill({status:201,json:{id:uuid(9),token:token(9),expiresAt:now+90*86400000,retentionUntil:analyticsRetentionUntil(now),consentVersion:current,edition:'ko'}});return true;}});
  try{await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);window.write=analysis.recordAnalytics(state);});await reached;await h.page.evaluate(()=>{window.withdrawal=analysis.setAnalyticsConsent(false);});releaseRegistration();await h.page.evaluate(async()=>{await write;await withdrawal;});assert.equal(h.calls.filter(c=>c.method==='POST'&&c.path!=='/api/runs').length,0);assert.equal(h.calls.filter(c=>c.method==='DELETE').length,1);assert.equal((await rows(h.page,dbName('ko'))).length,0);report.scenarios.push({name:'withdrawal during registration cancels upload and deletes the issued session'});}finally{releaseRegistration();await h.context.close();}
 }
 {
  let fail=true;const h=await harness({onAPI:async(route,call)=>{if(call.method!=='DELETE')return false;await route.fulfill({status:fail?503:200,json:fail?{error:'temporary'}:{deleted:true}});return true;}});
  try{await h.load();await h.page.evaluate(async()=>{await analysis.setAnalyticsConsent(true);await analysis.recordAnalytics(state);await analysis.setAnalyticsConsent(false);});assert.equal(await h.page.evaluate(()=>analysis.analyticsConsent()),false);assert.equal(await h.page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('pm-analysis-sessions'))).length),1);await h.page.reload();await h.load();fail=false;await h.page.evaluate(()=>analysis.setAnalyticsConsent(false));assert.equal(h.calls.filter(c=>c.method==='DELETE').length,2);assert.deepEqual(await h.page.evaluate(()=>JSON.parse(localStorage.getItem('pm-analysis-sessions'))),{});report.scenarios.push({name:'failed server withdrawal keeps deletion credential for retry after reload'});}finally{await h.context.close();}
 }
 {
  const h=await harness({onAPI:async(route,call)=>{if(call.path==='/api/admin/import'){await route.fulfill({json:{imported:1}});return true;}return false;}});
  try{await h.page.goto(h.origin+'/admin.html');const upload=async data=>h.page.locator('#import').setInputFiles({name:'anonymous.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});const good={format:ANALYTICS_EXPORT_FORMAT,consent:current,runs:[{id:uuid(10),profile:{edition:'en',version:'4.22.0',fieldId:'050',institution:'national',labMode:'dry'},records:[{month:1}]}]};await upload({...good,format:'professor-maker-anonymous-v1',consent:'anonymous-gameplay-v1'});await h.page.waitForFunction(()=>document.querySelector('#status').textContent.includes('형식'));assert.equal(h.calls.length,0);await upload({...good,runs:[{...good.runs[0],profile:{...good.runs[0].profile,edition:undefined}}]});await h.page.waitForFunction(()=>document.querySelector('#status').textContent.includes('구분'));assert.equal(h.calls.length,0);await upload(good);await h.page.waitForFunction(()=>document.querySelector('#status').textContent.includes('적재'));assert.equal(h.calls.length,1);assert.equal(h.calls[0].body.consent,current);assert.equal(h.calls[0].body.profile.edition,'en');report.scenarios.push({name:'administrator import requires current consent and an explicit edition before sending'});}finally{await h.context.close();}
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({scenarios:report.scenarios.length,errors:report.errors,output:dir}));
}finally{await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));await browser.close();}
