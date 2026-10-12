import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createState,proposeSchedule,validateSave} from '../dist/engine.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
import {editionStorageKey} from '../dist/edition.js';
import {createSession,parseSession,SESSION_DURATION_MS} from '../dist/portal-session.js';
import {RELEASE_NOTES_VERSION} from '../dist/release-notes.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=(process.env.GAME_URL||'http://127.0.0.1:4195').replace(/\/$/,''),root=fileURLToPath(new URL('../',import.meta.url));
const output=process.env.QA_OUTPUT_DIR||path.resolve(root,'../outputs/pm4210-session');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),report={cases:[],errors:[]},start=Date.UTC(2026,9,12,0,0,0);
async function snapshot(page,locale){
 return page.evaluate(async locale=>{
  const {createEditionStorage}=await import('./edition-storage.js'),storage=await createEditionStorage(locale);
  const raw=storage.getItem('pm-save-v4'),gallery=storage.getItem('pm-letters-v3'),state=JSON.parse(raw);
  return {raw,gallery,name:state.name,month:state.month};
 },locale);
}
async function buttonHit(locator){
 return locator.evaluate(el=>{const r=el.getBoundingClientRect(),points=[[r.x+r.width/2,r.y+r.height/2],[r.x+2,r.y+r.height/2],[r.right-2,r.y+r.height/2]],hit=points.every(([x,y])=>{const at=document.elementFromPoint(x,y);return at===el||el.contains(at);});return {x:r.x,y:r.y,width:r.width,height:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit};});
}
async function utilityControls(page,width){
 const controls=[];
 await page.evaluate(()=>window.scrollTo(0,0));
 for(const control of await page.locator('.utility-bar button,.utility-bar a.edition-link').all()){
  const hit=await buttonHit(control);assert.ok(hit.inside&&hit.hit,'utility control is visible and unobscured');if(width<900)assert.ok(hit.height>=44,'mobile utility controls have 44px touch targets');controls.push(hit);
 }
 for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j],area=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));assert.equal(area,0,'utility controls do not overlap');}
 return controls;
}
try{
 for(const locale of ['ko','en'])for(const width of [320,390,1360]){
  const height=width===320?640:width===390?844:900,context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),row={locale,width,height};report.cases.push(row);
  page.on('pageerror',error=>report.errors.push({locale,width,message:error.message}));
  const state=createState(locale==='en'?'Jordan Ellis':'한서진',727,{locale,gender:'female',fieldId:'050'});state.started=true;state.month=14;state.professorName=locale==='en'?'Prof. Morgan':'정 교수';state.plan=proposeSchedule(state);state.allocation=allocateCredits(state.allocation,facultyCapacity(state).credits);assert.ok(validateSave(state));
  const key=editionStorageKey('pm-portal-session-v1',locale),otherKey=editionStorageKey('pm-portal-session-v1',locale==='en'?'ko':'en'),otherSession=JSON.stringify(createSession(start+120000));
  const letter={id:'preserved-letter',ending:'bachelor',name:locale==='en'?'Former Student':'졸업 학생',date:'2026-10-01',month:24,relationship:'close',fieldId:'050',labMode:'dry',memories:[],passageIds:[]};
  await context.addInitScript(({state,letter,locale,version,otherKey,otherSession})=>{
   if(sessionStorage.getItem('qa-portal-session-fixture'))return;
   const scoped=k=>locale==='en'?'pm-us-'+k.slice(3):k;
   localStorage.setItem(scoped('pm-save-v4'),JSON.stringify(state));localStorage.setItem(scoped('pm-letters-v3'),JSON.stringify([letter]));localStorage.setItem(scoped('pm-letter-passages-v1'),'[]');localStorage.setItem(scoped('pm-fast'),'true');localStorage.setItem(scoped('pm-update-notes-v1'),JSON.stringify([version]));
   localStorage.setItem(scoped('pm-screen-guide-v1'),JSON.stringify({version:1,seen:true,runKey:String(state.creationSeed),step:7,status:'complete'}));
   sessionStorage.setItem(otherKey,otherSession);sessionStorage.setItem('qa-portal-session-fixture','ready');
  },{state,letter,locale,version:RELEASE_NOTES_VERSION,otherKey,otherSession});
  await page.clock.install({time:new Date(start)});await page.clock.pauseAt(new Date(start+1000));
  await page.goto(base+(locale==='en'?'/en.html#lab':'/#lab'));await page.locator('#portal-session-clock').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.locator('#portal-session-clock').innerText(),'30:00');
  const before=await snapshot(page,locale);assert.equal(before.raw,JSON.stringify(state));assert.equal(before.gallery,JSON.stringify([letter]));
  row.utilityControls=await utilityControls(page,width);row.header=await buttonHit(page.locator('[data-ui=portal-extend]'));assert.ok(row.header.inside&&row.header.hit);if(width<900)assert.ok(row.header.height>=44);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,`${locale}-timer-${width}.png`)});
  const original=parseSession(await page.evaluate(key=>sessionStorage.getItem(key),key));assert.ok(original);assert.equal(original.deadline-original.startedAt,SESSION_DURATION_MS);
  await page.clock.fastForward(29*60000);assert.equal(await page.locator('#portal-session-clock').innerText(),'01:00');
  await page.locator('[data-ui=portal-extend]').click();assert.equal(await page.locator('#portal-session-clock').innerText(),'30:00');
  const extended=parseSession(await page.evaluate(key=>sessionStorage.getItem(key),key));assert.equal(extended.deadline-original.deadline,29*60000);assert.deepEqual(await snapshot(page,locale),before);assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),otherKey),otherSession);
  row.extendResetsThirtyMinutes=true;
  await page.clock.fastForward(29*60000+59000);assert.equal(await page.locator('#portal-session-clock').innerText(),'00:01');await page.clock.fastForward(1000);
  await page.locator('#modal.portal-timeout[open]').waitFor();assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);assert.deepEqual(await snapshot(page,locale),before);
  row.reconnect=await buttonHit(page.locator('[data-ui=portal-reconnect]'));assert.ok(row.reconnect.inside&&row.reconnect.hit&&row.reconnect.height>=44);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);await page.mouse.click(3,3);assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
  const dialog=await page.locator('#modal').boundingBox();assert.ok(dialog.x>=0&&dialog.y>=0&&dialog.x+dialog.width<=width&&dialog.y+dialog.height<=height);await page.screenshot({path:path.join(output,`${locale}-expired-${width}.png`)});
  row.escapeBlocked=true;row.backdropBlocked=true;row.expiryPreservesRawSave=true;row.expiryPreservesLetters=true;
  await page.reload();await page.locator('#modal.portal-timeout[open]').waitFor();assert.deepEqual(await snapshot(page,locale),before);assert.deepEqual(parseSession(await page.evaluate(key=>sessionStorage.getItem(key),key)),extended);row.reloadKeepsExpiredSession=true;
  await page.locator('[data-ui=portal-reconnect]').click();assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);assert.equal(await page.locator('#portal-session-clock').innerText(),'30:00');
  const resumed=parseSession(await page.evaluate(key=>sessionStorage.getItem(key),key));assert.equal(resumed.deadline-resumed.startedAt,SESSION_DURATION_MS);assert.equal(resumed.startedAt,extended.deadline);assert.deepEqual(await snapshot(page,locale),before);row.reconnectKeepsProgress=true;
  // Simulate a background tab whose timer callbacks were throttled. Advancing
  // wall time alone must be recognized when it becomes visible again.
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:true}));await page.clock.setSystemTime(new Date(resumed.deadline+60000));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.locator('#modal.portal-timeout[open]').waitFor();assert.deepEqual(await snapshot(page,locale),before);assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),otherKey),otherSession);row.visibilityChecksWallClock=true;row.editionSessionIndependent=true;
  await page.locator('[data-ui=portal-reconnect]').click();assert.equal(await page.locator('#portal-session-clock').innerText(),'30:00');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`${locale}-reconnected-${width}.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);row.overflow=0;await context.close();console.log(`${locale} ${width}px portal clock, expiry, reload and reconnect PASS`);
 }
 report.opening=[];
 for(const locale of ['ko','en'])for(const width of [320,390,1360]){
  const height=width===320?640:width===390?844:900,context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),row={locale,width,height};report.opening.push(row);page.on('pageerror',error=>report.errors.push({locale,width,message:error.message}));
  await page.clock.install({time:new Date(start)});await page.clock.pauseAt(new Date(start+1000));await page.goto(base+(locale==='en'?'/en.html#lab':'/#lab'));await page.locator('#start-form').waitFor();
  const close=page.locator('#onboarding-update [data-ui=update-close]').first();if(await close.count())await close.click();await page.locator('[name=fieldId]').selectOption('050');await page.locator('#start-form [type=submit]').click();await page.locator('#admission-form').waitFor();await page.locator('[name=candidateIndex][value="0"]').check();await page.locator('#admission-form [type=submit]').click();await page.locator('#modal.opening-meeting[open]').waitFor();
  const saved=await snapshot(page,locale);assert.equal(saved.month,0);await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);await page.mouse.click(2,2);assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);assert.deepEqual(await snapshot(page,locale),saved);
  await page.locator('[data-ui=opening-continue]').scrollIntoViewIfNeeded();const hit=await buttonHit(page.locator('[data-ui=opening-continue]'));assert.ok(hit.inside&&hit.hit&&hit.height>=44);row.continueControl=hit;row.openingCannotBeDismissed=true;await page.screenshot({path:path.join(output,`${locale}-opening-${width}.png`)});
  await page.clock.fastForward(SESSION_DURATION_MS);await page.locator('#modal.portal-timeout[open]').waitFor();assert.deepEqual(await snapshot(page,locale),saved);await page.locator('[data-ui=portal-reconnect]').click();await page.locator('#modal.opening-meeting[open]').waitFor();assert.deepEqual(await snapshot(page,locale),saved);row.timeoutReturnsToPendingOpening=true;
  await page.locator('[data-ui=opening-continue]').click();await page.locator('#decision [data-choice=none]').click();const skip=page.locator('[data-ui=screen-guide-skip]');if(await skip.count())await skip.click();row.utilityControls=await utilityControls(page,width);const after=await snapshot(page,locale);assert.equal(after.name,saved.name);assert.equal(after.month,0);
  await page.reload();await page.locator('#portal-session-clock').waitFor();assert.equal(await page.locator('#modal.opening-meeting[open]').count(),0);assert.deepEqual(await snapshot(page,locale),after);row.openingSeenOnReload=true;assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);row.overflow=0;await context.close();console.log(`${locale} ${width}px opening modal, pending-opening timeout, and utility controls PASS`);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
