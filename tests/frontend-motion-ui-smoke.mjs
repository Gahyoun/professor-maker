import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,simulateMonth,proposeSchedule} from '../dist/engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const output='/private/tmp/professor-maker-qa';await fs.mkdir(output,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1360,height:950},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:4173/')+'#home');
 assert.equal(await page.locator('.brand-initial-p').first().evaluate(el=>getComputedStyle(el).color),'rgb(0, 158, 219)');
 assert.equal(await page.locator('.brand-initial-m').first().evaluate(el=>getComputedStyle(el).color),'rgb(0, 158, 219)');
 await page.locator('.header-nav a[href="#lab"]').click();
 await page.waitForFunction(()=>location.hash==='#lab'&&document.activeElement.id==='main');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 await page.locator('.skip-link').focus();await page.locator('.skip-link').press('Enter');
 assert.equal(await page.evaluate(()=>location.hash),'#lab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 await page.locator('#start-form button[type=submit]').click();
 await page.locator('#decision [data-choice=together]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);
 for(const width of [320,390,768,1360]){
  await page.setViewportSize({width,height:950});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px overflows`);
 }
 await page.screenshot({path:output+'/pm413-campus-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:output+'/pm413-campus-mobile.png',fullPage:true});
 await page.locator('[data-ui="advance"]').click();
 await page.waitForFunction(()=>document.body.classList.contains('month-playing'));
 await page.locator('.month-cue').waitFor();
 await page.waitForTimeout(300);
 const cueBounds=await page.evaluate(()=>{
  const cue=document.querySelector('.month-cue'),header=cue.closest('.week-scene-header');
  const c=cue.getBoundingClientRect(),h=header.getBoundingClientRect(),label=document.querySelector('#live-stage .room-label').getBoundingClientRect();
  return {withinHeader:c.left>=h.left&&c.right<=h.right&&c.top>=h.top&&c.bottom<=h.bottom,beforeCaption:c.bottom<=label.top};
 });
 assert.deepEqual(cueBounds,{withinHeader:true,beforeCaption:true});
 assert.ok(await page.locator('.schedule').evaluate(el=>el.inert));
 assert.ok(await page.locator('[data-skip-weeks]').evaluate(el=>el===document.activeElement));
 await page.screenshot({path:output+'/pm413-month-cue.png'});
 await page.locator('[data-skip-weeks]').press('Enter');
 await page.waitForFunction(()=>!document.body.classList.contains('month-playing'));
 assert.equal(await page.locator('[inert]').count(),0);
 // The real engine supplies the funding notice; find one deterministic awarded run.
 let source,expected;
 for(let seed=1;seed<100;seed++){
  const s=createState('김민지',seed);s.started=true;s.facultyAction='funding';s.plan=proposeSchedule(s);
  const next=simulateMonth(s,s.plan,{facultyAction:'funding',grantApplication:{role:'pi',years:5},proposal:proposeSchedule(s),feedback:s.feedback});
  if(next.lastReport.fundingResults.some(result=>result.awarded)){source=s;expected=next.lastReport.fundingResults;break;}
 }
 assert.ok(source);
 await page.evaluate(s=>{localStorage.setItem('pm-save-v4',JSON.stringify(s));localStorage.setItem('pm-fast','true');},source);
 await page.reload();
 await page.locator('.grant-panel summary').click();
 assert.deepEqual(await page.locator('#grant-years option').evaluateAll(options=>options.map(option=>option.value)),['2','3','4','5']);
 await page.locator('#grant-years').selectOption('5');
 await page.locator('[data-ui=advance]').click();
 await page.locator('#funding-results .funding-awarded').waitFor();
 assert.match(await page.locator('#funding-results').innerText(),/5년/);
 assert.match(await page.locator('#toast').innerText(),/선정되었습니다/);
 const real=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).lastReport.fundingResults);
 assert.deepEqual(real,expected);
 await page.locator('#funding-results').scrollIntoViewIfNeeded();
 await page.screenshot({path:output+'/pm413-grant-award.png'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#toast')).opacity==='0');
 await page.locator('#funding-results').screenshot({path:output+'/pm413-grant-award-panel.png'});
 await page.locator('.header-nav a[href="#journal"]').click();
 await page.waitForFunction(()=>location.hash==='#journal'&&document.activeElement.id==='main');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 await page.emulateMedia({reducedMotion:'reduce'});
 const motion=await page.evaluate(async()=>{
  const {enterWeek,motionAllowed}=await import('./ui-motion.js');
  const stage=document.createElement('section');stage.innerHTML='<div class="week-scene-header"></div><div class="week-outcome"></div>';
  document.body.append(stage);enterWeek(stage,{first:true,monthLabel:'1년차 3월'});
  const result={allowed:motionAllowed(),animations:stage.getAnimations({subtree:true}).length,cues:stage.querySelectorAll('.month-cue').length};stage.remove();return result;
 });
 assert.deepEqual(motion,{allowed:false,animations:0,cues:0});
 assert.deepEqual(errors,[]);
 console.log('Frontend motion passed: GNU accents, 320–1360px layout, route focus, keyboard playback skip, unchanged awarded funding result, and reduced motion.');
 await context.close();
}finally{await browser.close();}
