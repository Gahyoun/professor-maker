import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createState,proposeSchedule,validateSave} from '../dist/engine.js';
import {ANALYTICS_POLICY_VERSION,analyticsRetentionUntil} from '../dist/analytics-policy.js';
import {RELEASE_NOTES_VERSION} from '../dist/release-notes.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const output=process.env.QA_OUTPUT||path.resolve('../outputs/analytics-status-ui');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch(),report={scenarios:[],errors:[]};
const uuid=n=>'33333333-3333-4333-8333-'+String(n).padStart(12,'0');
const token=n=>n.toString(16).padStart(64,'0');

function restoredState(locale){
 const state=createState('Private student fixture',739,{locale});
 state.started=true;state.month=1;state.lab.funds=4000;state.pending=null;state.pendingQueue=[];
 state.professorProfile.professorName='Private faculty fixture';state.plan=proposeSchedule(state);
 assert.ok(validateSave(state));return state;
}
async function harness({locale='ko',host='professor-maker.gahyoun.chatgpt.site',width=390,restore=false,intercept}={}){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage(),calls=[];let registrations=0;
 page.on('pageerror',error=>report.errors.push(error.message));
 if(restore)await context.addInitScript(({locale,state,policy,release})=>{
  if(sessionStorage.getItem('analytics-status-fixture-seeded'))return;
  sessionStorage.setItem('analytics-status-fixture-seeded','true');
  const key=name=>locale==='en'?'pm-us-'+name.slice(3):name;
  localStorage.setItem(key('pm-save-v4'),JSON.stringify(state));
  localStorage.setItem(key('pm-analysis-consent'),policy);
  localStorage.setItem(key('pm-update-notes-v1'),JSON.stringify([release]));
  localStorage.setItem(key('pm-screen-guide-v1'),JSON.stringify({version:1,seen:true,runKey:String(state.creationSeed??state.seed),step:0,status:'complete'}));
 },{locale,state:restoredState(locale),policy:ANALYTICS_POLICY_VERSION,release:RELEASE_NOTES_VERSION});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/api/')){
   const call={method:req.method(),path:url.pathname,body:req.postDataJSON()};calls.push(call);
   if(intercept&&await intercept(route,call))return;
   if(call.method==='POST'&&call.path==='/api/runs'){
    assert.equal(call.body.consent,ANALYTICS_POLICY_VERSION);assert.equal(call.body.edition,locale);
    const now=Date.now(),n=++registrations;
    return route.fulfill({status:201,json:{id:uuid(n),token:token(n),expiresAt:now+90*86400000,retentionUntil:analyticsRetentionUntil(now),consentVersion:ANALYTICS_POLICY_VERSION,edition:locale}});
   }
   return route.fulfill({json:call.method==='DELETE'?{deleted:true}:{saved:true}});
  }
  const relative=url.pathname.replace(/^\//,'')||'index.html',file=path.resolve(dist,relative);
  if(!file.startsWith(dist))return route.abort();
  try{const data=await fs.readFile(file);const ext=path.extname(file),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.wav':'audio/wav'};await route.fulfill({contentType:types[ext]||'application/octet-stream',body:data});}
  catch{await route.fulfill({status:404,body:'Not found'});}
 });
 await page.goto('https://'+host+(locale==='en'?'/en.html':'/index.html')+'#lab');
 if(await page.locator('#onboarding-update').count())await page.locator('#onboarding-update [data-ui=update-close]').first().click();
 return {context,page,calls};
}
async function assertLayout(page,choice,otherButtons=[]){
 assert.equal(await choice.locator('.telemetry-status').getAttribute('role'),'status');
 assert.equal(await choice.locator('.telemetry-status').getAttribute('aria-live'),'polite');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const overlap=await choice.evaluate((element,selectors)=>{
  const content=[...element.querySelectorAll('.telemetry-status,.analytics-transport-detail')].filter(node=>node.getBoundingClientRect().height>0);
  const buttons=[...element.querySelectorAll('button:not([hidden])'),...selectors.flatMap(selector=>[...document.querySelectorAll(selector)])];
  return content.some(node=>buttons.some(button=>{const a=node.getBoundingClientRect(),b=button.getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}));
 },otherButtons);assert.equal(overlap,false,'analytics status text must not cover controls');
 for(const selector of otherButtons)await page.locator(selector).click({trial:true});
}
async function openSettings(page){await page.locator('[data-ui=settings]').click();await page.locator('#modal .telemetry-choice').waitFor();return page.locator('#modal .telemetry-choice');}
try{
 // Use the actual app in both editions and every supported narrow layout.
 for(const host of ['professor-maker.gahyoun.chatgpt.site','gahyoun.github.io'])for(const locale of ['ko','en'])for(const width of [320,390,1360]){
  const h=await harness({locale,host,width});
  try{
   const onboarding=h.page.locator('#start-form .telemetry-choice');await onboarding.waitFor();
   assert.equal(await onboarding.getAttribute('data-analytics-storage'),host==='professor-maker.gahyoun.chatgpt.site'?'server':'device');
   assert.equal(await onboarding.locator('input').isChecked(),false);
   assert.ok(await onboarding.locator('[data-ui=retry-analysis]').isHidden());
   await onboarding.locator('summary').click();await assertLayout(h.page,onboarding,['#start-form button[type=submit]']);
   if(locale==='en')assert.doesNotMatch(await onboarding.innerText(),/[가-힣]/);
   await onboarding.locator('input').check();
   await h.page.waitForFunction(async()=>{const analysis=await import('/analytics.js');return analysis.analyticsConsent()&&document.querySelector('#start-form .telemetry-status').textContent===analysis.analyticsStatus();});
   assert.ok(await onboarding.locator('[data-ui=retry-analysis]').isHidden());assert.equal(h.calls.length,0,'opting in before selecting a student sends no run');
   const settings=await openSettings(h.page);assert.equal(await settings.locator('input').isChecked(),true);
   await assertLayout(h.page,settings);if(locale==='en')assert.doesNotMatch(await settings.innerText(),/[가-힣]/);
   await settings.locator('input').uncheck();
   await h.page.waitForFunction(()=>document.querySelector('#modal .telemetry-status').textContent.includes('철회')||document.querySelector('#modal .telemetry-status').textContent.includes('Consent withdrawn'));
   assert.equal(await onboarding.locator('input').isChecked(),false);assert.equal(h.calls.length,0);
   await settings.locator('.telemetry-status').scrollIntoViewIfNeeded();await h.page.screenshot({path:path.join(output,`${host}-${locale}-${width}-settings.png`)});
   await h.page.locator('#modal [data-ui=close]').click();await assertLayout(h.page,onboarding,['#start-form button[type=submit]']);
   await h.page.screenshot({path:path.join(output,`${host}-${locale}-${width}-onboarding.png`)});
   report.scenarios.push({name:'optional consent and live status remain in document flow',host,locale,width});
  }finally{await h.context.close();}
 }
 // The real app captures a restored started game, exposes safe failure stages,
 // and retries from the settings button without blocking monthly progression.
 for(const locale of ['ko','en'])for(const code of [400,503]){
  let fail=true;const h=await harness({locale,restore:true,intercept:async(route,call)=>{
   if(call.method==='POST'&&call.path!=='/api/runs'&&fail){await route.fulfill({status:code,json:{error:'Unredacted backend response must not appear in the UI'}});return true;}return false;
  }});
  try{
   await h.page.locator('#live-stage').waitFor();
   await h.page.waitForFunction(async()=>{const analysis=await import('/analytics.js');return analysis.analyticsTransportStatus().error?.httpStatus===400||analysis.analyticsTransportStatus().error?.httpStatus===503;});
   const uploads=h.calls.filter(call=>call.method==='POST'&&call.path!=='/api/runs');assert.ok(uploads.length);assert.equal(uploads[0].body.month,1);
   assert.doesNotMatch(JSON.stringify(uploads[0].body),/Private student fixture|Private faculty fixture/);
   const settings=await openSettings(h.page);
   await h.page.waitForFunction(code=>document.querySelector('#modal .analytics-transport-detail').textContent.includes(`HTTP ${code}`),code);
   assert.match(await settings.locator('.analytics-transport-detail').innerText(),locale==='en'?/Monthly upload/:/월별 기록 전송/);
   assert.doesNotMatch(await settings.innerText(),/Unredacted|33333333-3333|0000000000000000000000000000000000000000000000000000000000000001/);
   for(const width of [320,390,1360]){
    await h.page.setViewportSize({width,height:844});await settings.locator('[data-ui=retry-analysis]').scrollIntoViewIfNeeded();
    await assertLayout(h.page,settings);assert.ok(await settings.locator('[data-ui=retry-analysis]').isEnabled());
    await settings.locator('[data-ui=retry-analysis]').click({trial:true});
    await h.page.screenshot({path:path.join(output,`${locale}-${code}-${width}-retry.png`)});
   }
   fail=false;await settings.locator('[data-ui=retry-analysis]').click();
   await h.page.waitForFunction(async()=>{const analysis=await import('/analytics.js');return analysis.analyticsTransportStatus().phase==='synced'&&analysis.analyticsTransportStatus().queued===0;});
   await h.page.waitForFunction(()=>{const detail=document.querySelector('#modal .analytics-transport-detail').textContent;return detail.includes('Saved on server: 1')||detail.includes('서버 저장 1건');});
   assert.match(await settings.locator('.analytics-transport-detail').innerText(),locale==='en'?/Saved on server: 1/:/서버 저장 1건/);
   assert.ok(await settings.locator('[data-ui=retry-analysis]').isHidden());assert.equal(h.calls.filter(call=>call.path==='/api/runs').length,1);
   await h.page.locator('#modal [data-ui=close]').click();assert.ok(await h.page.locator('[data-ui=advance]').isEnabled(),'analytics errors must not disable gameplay');
   const before=JSON.stringify(uploads[0].body);await h.page.reload();await h.page.locator('#live-stage').waitFor();
   await h.page.waitForFunction(async()=>{const analysis=await import('/analytics.js');return analysis.analyticsTransportStatus().phase==='synced';});
   assert.equal(JSON.stringify(h.calls.filter(call=>call.method==='POST'&&call.path!=='/api/runs').at(-1).body),before);
   report.scenarios.push({name:'restored game capture, safe HTTP diagnostic and explicit retry',locale,code,widths:[320,390,1360]});
  }finally{await h.context.close();}
 }
 for(const locale of ['ko','en']){
  const h=await harness({locale,host:'gahyoun.github.io',restore:true});
  try{
   await h.page.locator('#live-stage').waitFor();const settings=await openSettings(h.page);
   await h.page.waitForFunction(async()=>{const analysis=await import('/analytics.js');return analysis.analyticsTransportStatus().phase==='local-only';});
   assert.equal(await settings.locator('input').isChecked(),true);assert.match(await settings.locator('.analytics-transport-detail').innerText(),locale==='en'?/this device/:/이 기기에만/);
   await h.page.evaluate(async()=>{const analysis=await import('/analytics.js');window.dispatchEvent(new Event('online'));await analysis.retryAnalytics();});
   assert.equal(h.calls.length,0,'GitHub never uploads, including restored state and online/manual retry');
   report.scenarios.push({name:'restored GitHub game stays device-only',locale});
  }finally{await h.context.close();}
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({scenarios:report.scenarios.length,errors:report.errors,output}));
}finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
