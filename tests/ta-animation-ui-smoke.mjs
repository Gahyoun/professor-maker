import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createState} from '../dist/engine.js';
import {roomDecorations} from '../dist/mini-room.js';
import {weeklyScene} from '../dist/weekly-scene.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const output=process.env.QA_DIR||fileURLToPath(new URL('../../outputs/',import.meta.url));
await fs.mkdir(output,{recursive:true});
const teaching={assigned:'teach',proposed:'teach',actual:'teach',performed:true,outcome:'completed',progress:0};
const variants=new Map();
for(let seed=1;seed<=100&&variants.size<4;seed++){
 const state=createState('김민지',seed,{gender:'female',labMode:'dry'});
 state.month=26;state.route='integrated';
 variants.set(roomDecorations(state).boardType,state);
}

try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:4173/#home');
 await page.locator('#app').waitFor();
 const render=async(state,result=teaching)=>{
  const html=`<div class="container" style="max-width:900px"><section id="live-stage" class="live-lab is-playing">${weeklyScene(state,result,0)}</section></div>`;
  await page.evaluate(html=>{document.querySelector('#app').innerHTML=html;},html);
 };
 for(const width of [390,1360]){
  await page.setViewportSize({width,height:844});
  for(const [kind,state] of variants){
   await render(state);
   assert.equal(await page.locator('[data-pose=lecturing]').count(),1);
   assert.equal(await page.locator(`.ta-board-annotation[data-board-kind="${kind}"]`).count(),1);
   assert.equal(await page.locator('.mini-activity-prop').count(),0);
   assert.notEqual(await page.locator('.ta-lecture-arm').evaluate(el=>getComputedStyle(el).animationName),'none');
   assert.equal(await page.locator('.mini-student').evaluate(el=>getComputedStyle(el).animationName),'none');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow at ${width}px`);
   const geometry=await page.evaluate(()=>{
    const board=document.querySelector('[data-board]').getBoundingClientRect();
    const annotation=document.querySelector('.ta-board-annotation').getBoundingClientRect();
    const sprite=document.querySelector('[data-pose=lecturing]').getBoundingClientRect();
    const room=document.querySelector('.pixel-room').getBoundingClientRect();
    return {inside:annotation.left>=board.left-1&&annotation.right<=board.right+1&&annotation.top>=board.top-1&&annotation.bottom<=board.bottom+1,
     visible:sprite.left>=room.left-1&&sprite.right<=room.right+1&&sprite.top>=room.top-1&&sprite.bottom<=room.bottom+1};
   });
   assert.ok(geometry.inside,`writing escaped board ${kind} at ${width}px`);
   assert.ok(geometry.visible,`lecturing sprite clipped at ${width}px`);
  }
  await page.locator('#live-stage').screenshot({path:`${output}/pm-ta-${width}.png`});
 }
 const movement=await page.locator('.ta-lecture-arm').evaluate(el=>{
  const animation=el.getAnimations()[0];
  animation.pause();animation.currentTime=0;
  const matrix=()=>{const m=el.getScreenCTM();return [m.a,m.b,m.c,m.d,m.e,m.f];};
  const before=matrix();animation.currentTime=Number(animation.effect.getTiming().duration)/2;
  const after=matrix();animation.play();return {before,after};
 });
 assert.notDeepEqual(movement.before,movement.after,'the raised arm is marked animated but never moves');
 await page.emulateMedia({reducedMotion:'reduce'});
 await render([...variants.values()][0]);
 for(const selector of ['.ta-lecture-arm','.ta-pointer','.ta-board-stroke']){
  for(const element of await page.locator(selector).all()){
   assert.equal(await element.evaluate(el=>getComputedStyle(el).animationName),'none',`${selector} ignores reduced motion`);
  }
 }
 for(const stroke of await page.locator('.ta-board-stroke').all()){
  assert.equal(parseFloat(await stroke.evaluate(el=>getComputedStyle(el).strokeDashoffset)),0,'reduced motion hides the completed board diagram');
 }
 await render([...variants.values()][0],{...teaching,performed:false,outcome:'not_completed'});
 assert.equal(await page.locator('[data-pose=lecturing],.ta-board-annotation').count(),0);
 assert.deepEqual(errors,[]);
 console.log('TA UI passed: four board styles, narrow/wide layouts, visible lecture pose, moving arm, reduced motion and missed lessons.');
 await context.close();
}finally{await browser.close();}
