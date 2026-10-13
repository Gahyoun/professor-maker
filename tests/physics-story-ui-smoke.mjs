import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4195',dir=process.env.QA_OUTPUT||path.resolve('../outputs/pm4240-story');
const entry='physics-story-eb03f2f340a5fd8e128e2069b7b3119729f60a7aec5cef2a3f8062a34933037e.html';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch(),report={views:[],errors:[],apiRequests:[]};
try{
 for(const width of [1360,390,320]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))report.apiRequests.push(request.url());});
  await page.route('**/api/**',route=>route.abort());
  await page.addInitScript(()=>{localStorage.setItem('pm-story-qa','keep my game');sessionStorage.setItem('pm-story-qa','keep my session');});
  const response=await page.goto(`${base}/${entry}`);assert.equal(response.status(),200);
  await page.locator('#sequence-reader').waitFor({state:'visible'});
  assert.match(await page.locator('#sequence-paper p').first().textContent(),/학부연구생과 석박사, 8년이라는 시간이 흘렀다/);
  assert.equal(await page.locator('#sequence-paper').getAttribute('data-phase'),'ending');
  assert.doesNotMatch(await page.locator('#sequence-reader').textContent(),/우리의 첫 면담|학생의 질문을 듣고|학위논문 초안과 심사 준비/);
  const openingStyle=await page.locator('#sequence-paper').evaluate(paper=>{const first=getComputedStyle(paper.querySelector('p:first-child')),body=getComputedStyle(paper.querySelector('p:last-child'));return {sameWeight:first.fontWeight===body.fontWeight,sameColor:first.color===body.color,sameSize:first.fontSize===body.fontSize,noRule:first.borderLeftWidth==='0px'};});
  assert.deepEqual(openingStyle,{sameWeight:true,sameColor:true,sameSize:true,noRule:true});
  assert.equal(await page.locator('[data-sequence="previous"]').isDisabled(),true);
  assert.equal(await page.locator('[data-sequence="first"]').isDisabled(),true);
  await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('pm-story-qa',1);request.onupgradeneeded=()=>request.result.createObjectStore('save');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('save','readwrite');tx.objectStore('save').put('unchanged','current');tx.oncomplete=()=>{db.close();resolve();};};}));
  await page.screenshot({path:path.join(dir,`${width}-opening.png`),fullPage:true});
  let count=0;
  for(let i=0;i<10;i++){
   assert.equal(await page.locator('#sequence-count').textContent(),`${i+1} / 10`);
   assert.equal(await page.locator('#sequence-paper').getAttribute('data-phase'),'ending');
   const layout=await page.evaluate(()=>{
    const box=selector=>document.querySelector(selector).getBoundingClientRect();
    const paper=box('#sequence-paper'),controls=box('#sequence-controls'),caption=box('#sequence-scene>.scene-caption');
    const art=document.querySelector('#sequence-scene>.story-scene-canvas,#sequence-scene>svg').getBoundingClientRect();
    const first=box('[data-sequence="first"]'),next=box('[data-sequence="next"]');
    return {overflow:document.documentElement.scrollWidth>innerWidth,paperOverlap:paper.bottom>controls.top,captionOverlap:caption.bottom>art.top+1,buttonsOverlap:first.top<next.bottom-1,sceneTitle:document.querySelector('#sequence-heading').textContent};
   });
   assert.equal(layout.overflow,false);assert.equal(layout.paperOverlap,false);assert.equal(layout.captionOverlap,false);assert.equal(layout.buttonsOverlap,false);assert.ok(layout.sceneTitle);count++;
   if(i<9)await page.locator('[data-sequence="next"]').click();
  }
  assert.equal(await page.locator('[data-sequence="next"]').isDisabled(),true);
  assert.equal(await page.locator('#sequence-finish').isVisible(),true);
  assert.equal(await page.locator('#sequence-paper p').last().textContent(),'“이지현 교수는 어떻게 생각해요?”');
  const closingStyle=await page.locator('#sequence-paper').evaluate(paper=>{const last=getComputedStyle(paper.querySelector('p:last-child')),body=getComputedStyle(paper.querySelector('p:first-child'));return {sameWeight:last.fontWeight===body.fontWeight,sameColor:last.color===body.color,sameSize:last.fontSize===body.fontSize,noRule:last.borderLeftWidth==='0px'};});
  assert.deepEqual(closingStyle,{sameWeight:true,sameColor:true,sameSize:true,noRule:true});
  await page.screenshot({path:path.join(dir,`${width}-ending.png`),fullPage:true});
  await page.locator('[data-sequence="previous"]').click();assert.equal(await page.locator('#sequence-count').textContent(),'9 / 10');
  await page.locator('#sequence-heading').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#sequence-count').textContent(),'10 / 10');
  await page.keyboard.press('Home');assert.equal(await page.locator('#sequence-count').textContent(),'1 / 10');
  await page.locator('.sequence-contents summary').click();await page.locator('[data-scene-index="4"]').click();assert.equal(await page.locator('#sequence-count').textContent(),'5 / 10');
  assert.equal(await page.locator('.sequence-contents').getAttribute('open'),null);
  const persistence=await page.evaluate(async()=>({local:localStorage.getItem('pm-story-qa'),session:sessionStorage.getItem('pm-story-qa'),serviceWorkers:(await navigator.serviceWorker.getRegistrations()).length,save:await new Promise((resolve,reject)=>{const r=indexedDB.open('pm-story-qa');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('save'),get=tx.objectStore('save').get('current');get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>db.close();};})}));
  assert.deepEqual(persistence,{local:'keep my game',session:'keep my session',serviceWorkers:0,save:'unchanged'});
  await page.locator('[data-sequence="first"]').click();assert.equal(await page.locator('#sequence-count').textContent(),'1 / 10');
  report.views.push({width,scenes:count,persistence});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto(`${base}/physics-letter-6a27c35e3a83bfe4498f18e354bfc7621a6c2456eb0e5555412286b354dc4af1.html`);
 await page.locator('#story-reader').waitFor({state:'visible'});assert.equal(await page.locator('#story-count').textContent(),'1 / 10');await context.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.apiRequests,[]);
 console.log(JSON.stringify({views:report.views.length,sceneChecks:report.views.reduce((s,v)=>s+v.scenes,0),errors:report.errors,apiRequests:report.apiRequests.length,oldReader:'1 / 10',dir}));
}finally{await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));await browser.close();}
