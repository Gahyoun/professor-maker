import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createState} from '../dist/engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}),output=fileURLToPath(new URL('../../outputs/',import.meta.url));
await fs.mkdir(output,{recursive:true});
try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/#home');
 assert.doesNotMatch(await page.locator('#app').innerText(),/한 학생의 다음 봄을|함께 준비하는 일\./);
 assert.equal(await page.locator('.brand-initial-p').first().evaluate(e=>getComputedStyle(e).color),'rgb(0, 158, 219)');
 const state=createState('최민지',7919,{gender:'female',labMode:'wet'});state.started=true;
 await page.evaluate(s=>localStorage.setItem('pm-save-v4',JSON.stringify(s)),state);
 await page.goto('http://127.0.0.1:4173/#lab');await page.reload();
 for(const width of [320,390,1360]){
  await page.setViewportSize({width,height:844});
  const voice=page.locator('.student-voice');await voice.scrollIntoViewIfNeeded();
  assert.equal(await voice.locator(':scope > span').count(),0);
  assert.match(await voice.locator('p').innerText(),/― 최민지$/);
  const layout=await voice.evaluate(el=>{
   const p=el.querySelector('p'),speaker=el.querySelector('.student-speaker'),portrait=el.querySelector('.portrait'),box=el.getBoundingClientRect(),s=speaker.getBoundingClientRect(),a=portrait.getBoundingClientRect();
   const text=p.firstChild,last=text.textContent.trimEnd().length,range=document.createRange();range.setStart(text,last-1);range.setEnd(text,last);const end=range.getBoundingClientRect();
   return {speakerDisplay:getComputedStyle(speaker).display,gap:s.left-end.right,lineDiff:s.top-end.top,lineHeight:parseFloat(getComputedStyle(p).lineHeight),inside:s.right<=box.right+1,avatarWidth:a.width,avatarHeight:a.height};
  });
  assert.equal(layout.speakerDisplay,'inline');assert.ok(layout.inside);
  assert.ok(Math.abs(layout.lineDiff)<layout.lineHeight+2);
  if(Math.abs(layout.lineDiff)<5)assert.ok(layout.gap<20,'attribution drifted into its own right column');
  assert.ok(Math.abs(layout.avatarWidth-(width<=650?48:60))<.2);
  assert.ok(Math.abs(layout.avatarHeight-(width<=650?64:76))<.2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('.room-portrait').getAttribute('width'),'62.4');
  assert.equal(await page.locator('.room-portrait').getAttribute('height'),'96.72');
  await voice.screenshot({path:`${output}/pm412-voice-${width}.png`});
 }
 assert.deepEqual(errors,[]);await context.close();
 console.log('Presentation refresh passed: inline speaker, compact portraits, 320/390/1360 layouts, blue P and removed home headline.');
}finally{await browser.close();}
