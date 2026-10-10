import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createState} from '../dist/engine.js';
import {weeklyScene} from '../dist/weekly-scene.js';
import {renderPortrait,studentAppearance} from '../dist/appearance.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}),output=fileURLToPath(new URL('../../outputs/',import.meta.url));
await fs.mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/#home');
 const cases=[['study','dry','.study-pencil'],['analysis','dry','.analysis-cursor'],['experiment','wet','.lab-pipette'],['rest','dry','.cup-steam'],['presentation','dry','.rehearsal-words']];
 const render=async()=>{
  const scenes=cases.map(([actual,labMode])=>weeklyScene(createState('김민지',7919,{labMode,fieldId:labMode==='wet'?'056':'090'}),{actual,performed:true,outcome:actual==='rest'?'recovered':'completed'},0));
  await page.evaluate(html=>{document.querySelector('#app').innerHTML=`<main style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px">${html.map((h,i)=>`<section class="live-lab"><h2>${['문헌 탐구','데이터 분석','실험','휴식','발표 연습'][i]}</h2>${h}</section>`).join('')}</main>`;},scenes);
 };
 await render();
 for(const [,,selector] of cases){
  const movement=await page.locator(selector).first().evaluate(el=>{
   const a=el.getAnimations()[0];if(!a)return null;
   a.pause();a.currentTime=0;const start=getComputedStyle(el).transform;
   a.currentTime=Number(a.effect.getTiming().duration)/2;
   const end=getComputedStyle(el).transform;a.play();return {start,end};
  });
  assert.ok(movement,`${selector} has no animation`);assert.notEqual(movement.start,movement.end,`${selector} never moves`);
 }
 await page.screenshot({path:`${output}/pm412-activities.png`,fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await render();
 for(const [,,selector] of cases)assert.equal(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).animationName),'none');
 const a={...studentAppearance(7919,'female'),glasses:false,hairLength:4};
 const eyes=['neutral','happy','focused','sad'].flatMap(expression=>[0,1,2].map(eyes=>`<figure style="margin:0;text-align:center"><div style="width:100px;margin:auto">${renderPortrait({...a,eyes},'눈 크기 비교',expression).replace('class="portrait"','class="portrait" style="width:100px;height:155px"')}</div><figcaption>${expression} · ${eyes+1}</figcaption></figure>`));
 await page.evaluate(html=>{document.querySelector('#app').innerHTML=`<main style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:30px;max-width:700px">${html.join('')}</main>`;},eyes);
 await page.screenshot({path:`${output}/pm412-eyes.png`,fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Activity motions passed: reading, analysis, pipetting, seated rest, rehearsal, reduced motion and eye contact sheet.');
}finally{await browser.close();}
