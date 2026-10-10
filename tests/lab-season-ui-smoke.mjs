import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createState} from '../dist/engine.js';
import {labSeason,renderLabScene,roomScene} from '../dist/lab-scene.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=new URL('../../outputs/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const fields=[['환경학','057',['dry','wet']],['환경공학','077',['dry','wet']],['건축학','072',['dry']],['건축공학','073',['dry','wet']],['토목공학','075',['dry','wet']]];
const fixtures=[];
for(const [label,fieldId,modes] of fields)for(const labMode of modes)for(const month of [0,3,6,9]){
 const s=createState('김민지',7919,{gender:'female',fieldId,labMode});s.month=month;
 fixtures.push({label,labMode,month,season:labSeason(s,{idle:true}),svg:renderLabScene(s),working:roomScene(s,{actual:'analysis',performed:true,outcome:'completed'},0)});
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,1360]){
  await page.setViewportSize({width,height:900});
  for(const f of fixtures){
   await page.setContent(`<html><body style="margin:0"><div style="width:${Math.min(width,900)}px">${f.svg}</div></body></html>`);
   await page.locator('.mini-room-art').evaluate(svg=>{svg.style.display='block';svg.style.width='100%';});
   assert.equal(await page.locator('.mini-room-art').getAttribute('data-season'),f.season);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const geometry=await page.locator('.mini-room-art').evaluate(svg=>{
    const view=svg.viewBox.baseVal;
    return [...svg.querySelectorAll('[data-equipment],.seasonal-window')].map(el=>{const b=el.getBBox();return {name:el.getAttribute('data-equipment')||'window',visible:b.width>0&&b.height>0,inside:b.x>=view.x-.5&&b.y>=view.y-.5&&b.x+b.width<=view.x+view.width+.5&&b.y+b.height<=view.y+view.height+.5};});
   });
   for(const g of geometry)assert.ok(g.visible&&g.inside,`${f.label}/${f.labMode}/${f.season}/${width}: ${g.name}`);
   const uri='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(f.svg);
   await page.setContent(`<html><body><img id="snapshot" width="600" src="${uri}"></body></html>`);
   assert.equal(await page.locator('#snapshot').evaluate(img=>img.decode().then(()=>img.naturalWidth)),600,'CV-style standalone SVG must decode without CSS');
  }
 }
 await page.setViewportSize({width:1600,height:1000});
 const selected=fixtures.filter(f=>['057','073','075'].some(id=>f.svg.includes(`data-field-kit="${id==='057'?'environment':id==='075'?'civil':'architecture'}"`))&&!(f.label==='환경공학'||f.label==='건축학'));
 await page.setContent(`<html><head><style>body{margin:16px;background:#f5f3ee;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}section{background:white;padding:8px;border:1px solid #d3d9d8}svg.mini-room-art{width:100%;height:auto;display:block}h2{font-size:14px;margin:3px}</style></head><body><main>${selected.map(f=>`<section><h2>${f.label} · ${f.labMode} · ${f.season}</h2>${f.svg}</section>`).join('')}</main></body></html>`);
 await page.screenshot({path:fileURLToPath(new URL('pm4160-lab-seasons.png',output)),fullPage:true});
 // Larger working views preserve the existing seated arm/chair layering.
 const working=fixtures.filter(f=>f.month===3&&['환경학','건축공학','토목공학'].includes(f.label));
 await page.setContent(`<html><head><style>body{margin:12px;background:#f5f3ee}main{display:grid;grid-template-columns:1fr 1fr;gap:12px}section{background:white}svg.mini-room-art{width:100%;height:auto;display:block}.room-label{display:none}</style></head><body><main>${working.map(f=>`<section><h2>${f.label} · ${f.labMode} 분석</h2>${f.working}</section>`).join('')}</main></body></html>`);
 await page.screenshot({path:fileURLToPath(new URL('pm4160-lab-kits-working.png',output)),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Lab visuals passed: 36 major/mode/season cases at320/1360px, grounded equipment bounds, standalone CV SVG decoding and two contact sheets.');
}finally{await browser.close();}
