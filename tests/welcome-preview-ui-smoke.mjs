import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const url=(process.env.GAME_URL||'http://127.0.0.1:4192/').replace(/\/$/,'');
const output=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-preview-nav';
const checks=[];
await fs.mkdir(output,{recursive:true});
const intersection=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
try{
 for(const [width,height] of [[320,568],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  await context.addInitScript(()=>{
   const storage=window.localStorage,session=window.sessionStorage;
   if(!storage.getItem('preview-existing-save'))storage.setItem('preview-existing-save','keep-existing-player');
   const snapshot=()=>({local:Object.fromEntries(Object.keys(storage).map(key=>[key,storage.getItem(key)])),session:Object.fromEntries(Object.keys(session).map(key=>[key,session.getItem(key)]))});
   const before=snapshot(),accesses=[];
   for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){accesses.push(key);throw new Error('Preview must not access '+key)},configurable:true});
   Object.defineProperty(navigator,'serviceWorker',{get(){accesses.push('serviceWorker');throw new Error('Preview must not access SW')},configurable:true});
   navigator.sendBeacon=()=>{accesses.push('sendBeacon');throw new Error('Preview must not send analytics')};
   window.fetch=()=>{accesses.push('fetch');throw new Error('Preview must not fetch runtime data')};
   window.previewStorageGuard=()=>({before,after:snapshot(),accesses});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const safeStorage=async()=>{const guard=await page.evaluate(()=>window.previewStorageGuard());assert.deepEqual(guard.accesses,[]);assert.deepEqual(guard.after,guard.before);};
  for(const view of ['updates','interview','room']){
   await page.goto(`${url}/welcome-preview.html?view=updates`);await page.locator('#onboarding-update').waitFor();
   const panel=await page.locator('#onboarding-update').boundingBox(),tabs=page.locator('.preview-tabs [data-preview-view]'),boxes=[];
   assert.equal(await tabs.count(),3);assert.ok(panel.y>=0&&panel.y+panel.height<=height);
   for(const tab of await tabs.all()){
    const box=await tab.boundingBox();boxes.push(box);assert.ok(box.height>=44&&box.width>=44);assert.equal(intersection(box,panel),0,`${width}: floating notice overlaps a navigation button`);
    // Check the whole control, including its edges, rather than only its center.
    for(const [dx,dy] of [[1,box.height/2],[box.width-1,box.height/2],[box.width/2,1],[box.width/2,box.height-1],[box.width/2,box.height/2]])assert.ok(await page.evaluate(({x,y})=>Boolean(document.elementFromPoint(x,y)?.closest('.preview-tabs [data-preview-view]')),{x:box.x+dx,y:box.y+dy}));
   }
   assert.ok(boxes.every(box=>Math.abs(box.y-boxes[0].y)<1),`${width}: all three navigation controls must stay on one row`);
   await page.locator(`.preview-tabs [data-preview-view=${view}]`).click();assert.equal(new URL(page.url()).searchParams.get('view'),view);assert.equal(await page.locator(`.preview-tabs [data-preview-view=${view}]`).getAttribute('aria-current'),'page');
   await page.locator(view==='updates'?'#onboarding-update':view==='interview'?'#admission-form':'.preview-room-card').first().waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await safeStorage();
   if(view==='updates'){
    for(const button of await page.locator('#onboarding-update [data-ui=update-close]').all())assert.ok((await button.boundingBox()).height>=44);
    await page.screenshot({path:`${output}/update-${width}.png`});
    await page.locator('#onboarding-update [data-ui=update-close]').first().click();assert.equal(await page.locator('#onboarding-update').count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.ui),'update-open');
    await page.locator('main [data-ui=update-open]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'update-notice-title');
    await page.locator('#onboarding-update [data-ui=update-close]').last().click();await safeStorage();
   }
  }
  assert.deepEqual(errors,[]);checks.push({width,height,navRows:1,tabNoticeIntersection:0,minTouchHeight:44,actualClicks:3,storageAccesses:0,pageErrors:0});await context.close();
 }
 await fs.writeFile(`${output}/results.json`,JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
}finally{await browser.close();}
