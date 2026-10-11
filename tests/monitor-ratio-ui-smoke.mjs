import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState} from '../dist/engine.js';
import {roomScene} from '../dist/lab-scene.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=(process.env.GAME_URL||'http://127.0.0.1:4193/').replace(/\/$/,'');
const output=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-monitor';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),report=[],errors=[];
const measure=page=>page.locator('.monitor-display polygon').evaluateAll(polygons=>polygons.map(el=>{
 const p=Array.from(el.points).map(p=>({x:p.x,y:p.y})),box=el.getBoundingClientRect();
 return {localRatio:(p[1].x-p[0].x)/(p[1].y-p[2].y),visibleRatio:box.width/box.height,points:el.getAttribute('points'),width:box.width,height:box.height};
}));
function checkScreens(screens){for(const s of screens){assert.ok(Math.abs(s.localRatio-16/9)<1e-6);assert.ok(s.visibleRatio>1.3);}}
try{
 for(const width of [320,390,1360,1920]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/welcome-preview.html?view=room&activity=analysis');
  for(const activity of ['analysis','teach','experiment','rest']){
   await page.locator('#preview-activity').selectOption(activity);
   const screens=await measure(page);checkScreens(screens);assert.ok(screens.length>=2);
   const art=await page.locator('.pixel-room-art').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
   for(const a of art){assert.ok(a.width<=600.01);assert.ok(Math.abs(a.width/a.height-5/3)<1e-4);}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   report.push({width,activity,screens,art,overflow:0});
   if(activity==='analysis')await page.locator('.preview-room-card').first().screenshot({path:output+'/room-'+width+'.png'});
  }
  // Include the secondary workstation and wet workbench stocked with samples.
  const scenes=[['090','dry'],['056','wet']].map(([fieldId,labMode])=>{
   const state=createState('화면 검증',7919,{fieldId,labMode});state.lab.funds=200;state.lab.budget.environment=3;
   return '<section class="live-lab">'+roomScene(state,{actual:'analysis',performed:true,outcome:'completed'})+'</section>';
  });
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">'+['style.css','activity-motion.css','scene-stage.css'].map(name=>'<link rel="stylesheet" href="'+base+'/'+name+'">').join('')+'<main style="padding:16px;max-width:650px;margin:auto">'+scenes.join('')+'</main>');
  const screens=await measure(page);checkScreens(screens);assert.equal(screens.length,3);
  for(const polygon of await page.locator('.monitor-display polygon').all()){
   await polygon.scrollIntoViewIfNeeded();
   assert.ok(await polygon.evaluate(el=>{
    const p=Array.from(el.points),monitor=el.closest('.lab-monitor'),matrix=el.getScreenCTM();
    return [[.15,.15],[.5,.12],[.85,.15],[.85,.7],[.15,.7]].every(([x,y])=>{
     const point=new DOMPoint(p[0].x+(p[1].x-p[0].x)*x+(p[3].x-p[0].x)*y,p[0].y+(p[1].y-p[0].y)*x+(p[3].y-p[0].y)*y).matrixTransform(matrix);
     return document.elementFromPoint(point.x,point.y)?.closest('.lab-monitor')===monitor;
    });
   }),'the display is covered by a sample, lamp or unrelated object');
  }
  for(const cursor of await page.locator('.analysis-cursor').all()){
   assert.ok(await cursor.evaluate(el=>{
    const animation=el.getAnimations()[0];if(!animation)return false;animation.pause();
    const screen=el.closest('.lab-monitor').querySelector('.monitor-display polygon'),p=Array.from(screen.points),w=p[1].x-p[0].x,h=p[0].y-p[3].y,tilt=(p[1].y-p[0].y)/w;
    const points=Array.from(el.getAttribute('d').matchAll(/[ML]([\d.+-]+) ([\d.+-]+)/g)).map(m=>new DOMPoint(+m[1],+m[2]));
    for(const t of [0,.35,.7,1]){animation.currentTime=t*Number(animation.effect.getTiming().duration);const transform=new DOMMatrix(getComputedStyle(el).transform);for(const source of points){const pt=source.matrixTransform(transform),x=(pt.x-p[0].x)/w,y=(p[0].y+tilt*(pt.x-p[0].x)-pt.y)/h;if(!(x>.02&&x<.98&&y>.02&&y<.98))return false;}}
    return true;
   }),'an animated cursor leaves the display');
  }
  report.push({width,fixtureScreens:screens,displayHitChecks:'pass',cursorMotionBounds:'pass'});
  await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));
 console.log('Monitor UI PASS: 16:9 source planes, landscape appearance, fixed desktop scale, 320/390 fit, primary/secondary/wet screens, sample/lamp occlusion and animated cursor bounds.');
}finally{await browser.close();}
