import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createState} from '../dist/engine.js';
import {weeklyScene} from '../dist/weekly-scene.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=fileURLToPath(new URL('../../outputs/',import.meta.url));
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const cases=[
 ['생명과학 · 실험','056','wet','biology'],
 ['화학 · 분석 장비','055','wet','analytical'],
 ['물리학 · 계측 장비','050','wet','measurement'],
 ['건축학 · 설계 모형','072','dry','design'],
 ['컴퓨터공학 · 워크스테이션','090','dry','computing'],
];
const renderCase=([,fieldId,labMode])=>{
 const s=createState('김민지',7919,{gender:'female',fieldId,labMode});s.month=28;s.route='integrated';
 return weeklyScene(s,{actual:labMode==='wet'?'experiment':'analysis',performed:true,outcome:'completed'},0);
};
try{
 const page=await browser.newPage({viewport:{width:1360,height:844},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:4173/#home');
 await page.locator('#app').waitFor();
 for(const viewport of [{width:320,height:844},{width:390,height:844},{width:844,height:390},{width:1360,height:844}]){
  await page.setViewportSize(viewport);
  for(const fixture of cases){
   await page.evaluate(({title,html})=>{document.querySelector('#app').innerHTML=`<div class="container" style="max-width:1000px"><section id="live-stage" class="live-lab is-playing"><h2>${title}</h2>${html}</section></div>`;},{title:fixture[0],html:renderCase(fixture)});
   assert.equal(await page.locator('.mini-room-art').getAttribute('data-equipment-profile'),fixture[3]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow at ${viewport.width}px / ${fixture[0]}`);
   const geometry=await page.locator('.mini-room-art').evaluate(svg=>{
    const room=svg.getBoundingClientRect(),view=svg.viewBox.baseVal;
    const elements=[...svg.querySelectorAll('[data-equipment]')];
    return elements.map(el=>{
     const b=el.getBBox(),screen=el.getBoundingClientRect();
     return {name:el.dataset.equipment,insideView:b.x>=view.x-.5&&b.y>=view.y-.5&&b.x+b.width<=view.x+view.width+.5&&b.y+b.height<=view.y+view.height+.5,
      insideScreen:screen.left>=room.left-1&&screen.top>=room.top-1&&screen.right<=room.right+1&&screen.bottom<=room.bottom+1,visible:screen.width>0&&screen.height>0};
    });
   });
   assert.ok(geometry.length>0);
   for(const g of geometry)assert.ok(g.insideView&&g.insideScreen&&g.visible,`clipped ${g.name} at ${viewport.width}px / ${fixture[0]}`);
   const marker=fixture[3]==='measurement'?'measuring':fixture[2]==='wet'?'pipetting':'analysis';
   assert.equal(await page.locator(`[data-motion="${marker}"]`).count(),1,`${fixture[0]} activity prop missing`);
  }
  await page.locator('#live-stage').screenshot({path:`${output}/pm412-equipment-${viewport.width}.png`});
 }
 await page.setViewportSize({width:1360,height:1100});
 const scenes=cases.map(f=>`<section class="live-lab is-playing"><h2 style="margin:8px 16px;font-size:20px">${f[0]}</h2>${renderCase(f)}</section>`);
 await page.evaluate(html=>{document.querySelector('#app').innerHTML=`<main style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;background:#faf9f5">${html.join('')}</main>`;},scenes);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.screenshot({path:`${output}/pm412-equipment.png`,fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Lab equipment UI passed: five major-specific kits, 320/390/844 landscape/1360 layouts, visible instruments, executed activity props and screenshot contact sheet.');
}finally{await browser.close();}
