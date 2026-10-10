import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=fileURLToPath(new URL('../../outputs/',import.meta.url));
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1040,height:1200},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {createState}=await import('./engine.js'),{roomScene}=await import('./lab-scene.js'),{recoveryVariant}=await import('./recovery-art.js');
  const seeds=[];for(let seed=1;seeds.length<3&&seed<100;seed++){const s=createState('최민지',seed,{gender:'female',labMode:'dry'});s.creationSeed=seed;const v=recoveryVariant(s,0);if(!seeds.some(x=>x.variant===v))seeds.push({seed,variant:v});}
  document.body.innerHTML=`<main class="recovery-test"><h1>회복 장면 · 픽셀 풍경과 움직임</h1>${['mountain','sea','city','bed'].map(destination=>`<section><h2>${{mountain:'산책로',sea:'해변',city:'도시 산책',bed:'집에서 쉬기'}[destination]}</h2><div class="recovery-test-row">${seeds.map(({seed,variant})=>{const s=createState('최민지',seed,{gender:'female',labMode:'dry'});s.creationSeed=seed;return `<article>${roomScene(s,{actual:destination==='bed'?'rest':'travel',destination,performed:true},0)}<p>색 조합 ${variant+1}</p></article>`;}).join('')}</div></section>`).join('')}</main>`;
 });
 await page.addStyleTag({content:'.recovery-test{max-width:1020px;margin:0 auto;padding:20px;background:#f4f3ee}.recovery-test h1{font-size:23px;margin:0 0 15px}.recovery-test h2{font-size:15px;margin:8px 0}.recovery-test-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.recovery-test article{min-width:0}.recovery-test .pixel-room{height:170px;border:1px solid #c7d3cf;border-radius:5px}.recovery-test .pixel-student{width:46px;bottom:10px}.recovery-test .room-label{font-size:7px;padding:3px;left:4px;top:4px}.recovery-test article p{font-size:10px;margin:5px 0 12px}.recovery-test .student-reaction-art{display:none}@media(max-width:600px){.recovery-test-row{grid-template-columns:1fr}.recovery-test .pixel-room{height:190px}}'});
 await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/recovery-art.css')));
 assert.equal(await page.locator('.recovery-scenery').count(),12);
 const active=await page.evaluate(()=>[...document.querySelectorAll('.recovery-cloud-drift,.recovery-wave,.recovery-window-glow,.recovery-quilt-breathe')].map(e=>getComputedStyle(e).animationName));
 assert.ok(active.length>12&&active.every(x=>x!=='none'));
 const bedPoses=await page.evaluate(()=>[...document.querySelectorAll('.scene-rest .pixel-student')].map(e=>getComputedStyle(e).transform));
 assert.ok(bedPoses.length===3&&bedPoses.every(t=>/^matrix\(0, -1, 1, 0,/.test(t)),'Bed scenes place the student horizontally on the quilt');
 const parsed=await page.evaluate(()=>[...document.querySelectorAll('.pixel-room-art')].every(e=>!new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror')));
 assert.ok(parsed,'Every SVG parses without malformed paths or XML');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`${output}pm412-recovery-contact.png`,fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.recovery-scenery *')].every(e=>getComputedStyle(e).animationName==='none')));
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`${output}pm412-recovery-390.png`,fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Recovery scenery passed: four destinations, three palettes, valid SVG, active motion, reduced motion, and 390 px layout.');
 await context.close();
}finally{await browser.close();}
