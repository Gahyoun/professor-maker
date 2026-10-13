import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave} from '../dist/engine.js';
import {ENDINGS} from '../dist/stories.js';
import {endingRequirements} from '../dist/ending-requirements.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const url=(process.env.GAME_URL||'http://127.0.0.1:4192/').replace(/\/$/,'');
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-ending-conditions';await fs.mkdir(dir,{recursive:true});
const errors=[],checks=[];
try{
 for(const width of [320,390,1360]){
  const context=await browser.newContext({viewport:{width,height:width===320?640:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/#letters');
  const state=createState('김민지',727,{gender:'female',fieldId:'048',labMode:'dry',difficulty:'realistic'});state.started=true;state.month=26;state.route='integrated';assert.ok(validateSave(state));
  await page.evaluate(state=>{localStorage.clear();localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem('pm-fast','true');},state);await page.reload();await page.locator('.ending-collection details summary').click();
  const saveBefore=await page.evaluate(()=>localStorage.getItem('pm-save-v4'));assert.equal(await page.locator('[data-ui=ending-requirements]').count(),Object.keys(ENDINGS).length);
  for(const id of Object.keys(ENDINGS)){
   const card=page.locator(`[data-ui=ending-requirements][data-ending=${id}]`);assert.ok(await card.isEnabled());assert.ok((await card.boundingBox()).height>=44);await card.click();await page.locator('#modal .ending-requirements').waitFor();
   const text=await page.locator('#modal .ending-requirements').innerText();assert.match(text,/현재 연구실: 수학/);assert.match(text,/스포일러 안내/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(id==='true'){const model=endingRequirements(id,{fieldId:'048'});assert.ok(text.includes(model.requirements[2]));await page.screenshot({path:`${dir}/true-math-${width}.png`});}
   if(id==='unfinished')assert.match(text,/현재 새 플레이에서는.*별도로 생성하지/);
   await page.locator('#modal .ending-requirements [data-ui=close]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('pm-save-v4')),saveBefore,'reading conditions does not change a run');
  }
  // Old letter archives still open the authored reader and retain their data through reloads.
  const old=[{id:'old-bachelor',ending:'bachelor',name:'예전 학생',date:'2026-10-10',month:24,relationship:'reserved',fieldId:'050',labMode:'dry'},{id:'old-unfinished',ending:'unfinished',name:'이전 연구자',date:'2026-10-10',month:96,relationship:'reserved',fieldId:'050',labMode:'dry'}];
  await page.evaluate(old=>localStorage.setItem('pm-letters-v3',JSON.stringify(old)),old);await page.reload();await page.locator('.ending-collection details summary').click();const galleryBefore=await page.evaluate(()=>localStorage.getItem('pm-letters-v3'));
  assert.equal(await page.locator('[data-ui=read][data-ending=bachelor]').count(),1);await page.locator('[data-ui=read][data-ending=bachelor]').click();await page.locator('.letter-reader').waitFor();assert.equal(await page.locator('.ending-requirements').count(),0);assert.match(await page.locator('.letter-reader').innerText(),/예전 학생|두 번의 봄/);await page.locator('#modal [data-ui=close]').first().click();
  await page.locator('[data-ui=ending-requirements][data-ending=corporate]').click();await page.locator('#modal .ending-requirements [data-ui=close]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('pm-letters-v3')),galleryBefore);await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem('pm-letters-v3')),galleryBefore);
  // Help shortcuts expose the actual expenditure and funding controls without changing them.
  await page.goto(url+'/#lab');await page.locator('[data-ui=guide]').click();assert.match(await page.locator('#modal .guide-finance-basics').innerText(),/자동 차입.*이자.*행정 부담/s);assert.match(await page.locator('#modal .guide-finance-basics').innerText(),/인건비.*3월.*연구환경/s);
  const beforeGuide=await page.evaluate(()=>localStorage.getItem('pm-save-v4'));await page.locator('[data-ui=guide-budget]').click();await page.locator('#screen-guide').waitFor();assert.equal(await page.locator('#lab-budget').evaluate(el=>el.open),true);await page.evaluate(()=>new Promise(requestAnimationFrame));assert.match(await page.locator('#screen-guide').innerText(),/소모품.*급여 전용/s);
  assert.equal(await page.evaluate(()=>localStorage.getItem('pm-save-v4')),beforeGuide);for(const button of await page.locator('#screen-guide button').all()){const r=await button.boundingBox();assert.ok(r.height>=44&&r.y>=0&&r.y+r.height<=(width===320?640:900));assert.equal(await button.evaluate(el=>{const r=el.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return at===el||el.contains(at);}),true);}
  const overlap=await page.evaluate(()=>{const a=document.querySelector('.screen-guide-target').getBoundingClientRect(),b=document.querySelector('#screen-guide').getBoundingClientRect();return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));});assert.equal(overlap,0,'budget guide card does not cover the highlighted control');await page.screenshot({path:`${dir}/budget-guide-${width}.png`});
  await page.locator('[data-ui=screen-guide-skip]').click();await page.locator('[data-ui=guide]').click();await page.locator('[data-ui=guide-funding]').click();assert.equal(await page.locator('#lab-budget').evaluate(el=>el.open),true);assert.match(await page.locator('#screen-guide').innerText(),/3월·9월/);assert.equal(await page.evaluate(()=>localStorage.getItem('pm-save-v4')),beforeGuide);await page.locator('[data-ui=screen-guide-next]').click();assert.match(await page.locator('#screen-guide').innerText(),/매달 이자·행정 부담.*3개월 연속/s);await page.screenshot({path:`${dir}/advance-guide-${width}.png`});await page.locator('[data-ui=screen-guide-skip]').click();
  checks.push({width,conditions:Object.keys(ENDINGS).length,mathTargets:true,savedRunUnchanged:true,oldGalleryUnchanged:true,shortcuts:true,budgetOverlap:0,overflow:0});await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${dir}/results.json`,JSON.stringify(checks,null,2));console.log('Ending conditions and guide UI PASS: all 18 types clickable at 320/390/1360, current math counts, legacy unfinished explanation, cleared letters unchanged, saved runs/gallery preserved, actual budget/funding help shortcuts and bounded guide controls.');
}finally{await browser.close();}
