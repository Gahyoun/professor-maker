import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,proposeSchedule,validateSave} from '../dist/engine.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:4182/';
const output=process.env.QA_OUTPUT||'/tmp/professor-maker-advising-qa';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
const fixture=()=>{const s=createState('검증',1);s.started=true;s.allocation=allocateCredits(s.allocation,facultyCapacity(s).credits);return s;};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'#lab');
 async function inject(s){assert.ok(validateSave(s));await page.evaluate(state=>{localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem('pm-fast','true');},s);await page.reload();}
 async function overflow(label){const n=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(n.s<=n.w,`${label}: ${JSON.stringify(n)}`);}
 for(const width of [320,390,1360]){
  await page.setViewportSize({width,height:900});await inject(fixture());await overflow(`planner ${width}`);
  await page.locator('#week-0').scrollIntoViewIfNeeded();assert.equal(await page.locator('#live-stage').evaluate(el=>getComputedStyle(el).position),width<900?'relative':'sticky');
  const credit=page.locator('[data-credit=research][data-count="1"]');await credit.focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-credit')),'research');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-count')),'1');
  const size=await credit.boundingBox();assert.ok(size.width>=44&&size.height>=44);
  await page.screenshot({path:`${output}/planner-${width}.png`,fullPage:true});
 }
 const tired=fixture();tired.month=24;tired.route='integrated';tired.hidden.stamina=199.8;tired.hidden.stress=10;tired.plan=proposeSchedule(tired).map(id=>id==='recovery'?'study':id);
 await page.setViewportSize({width:390,height:844});await inject(tired);
 assert.match(await page.locator('.recovery-plan-notice').innerText(),/2주/);await page.locator('[data-ui=respect-rest]').click();
 const accepted=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).plan);assert.equal(accepted.filter(id=>id==='recovery').length,2);
 assert.match(await page.locator('#recovery-plan-status').innerText(),/반영되었습니다/);assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'주별 지도계획');await overflow('recovery');
 const recoveredWeek=accepted.findIndex(id=>id==='recovery');
 assert.ok(await page.locator('[data-ui=respect-rest]').isHidden());
 await page.locator(`#week-${recoveredWeek}`).selectOption('study');
 assert.match(await page.locator('#recovery-plan-status').innerText(),/1주가 아직/);
 assert.ok(await page.locator('[data-ui=respect-rest]').isVisible());
 assert.ok(await page.locator('[data-ui=respect-rest]').isEnabled());
 await page.locator('[data-ui=respect-rest]').click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).plan),accepted);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).month),tired.month);
 await page.locator('#monthly-plan').screenshot({path:`${output}/recovery-390.png`});
 const poor=fixture();poor.lab.funds=0;poor.lab.pool=1000;await inject(poor);
 assert.ok(await page.locator('[data-ui=advance]').isDisabled());assert.match(await page.locator('#budget-error').innerText(),/인건비 풀은 운영비로/);
 await page.locator('[data-ui=review-plan]').click();assert.ok(await page.locator('#lab-budget').evaluate(el=>el.open));
 await page.locator('#monthly-plan').screenshot({path:`${output}/budget-390.png`});await overflow('poor plan');
 const closed=fixture();closed.month=1;closed.plan=proposeSchedule(closed);closed.facultyAction='funding';await inject(closed);
 assert.match(await page.locator('#budget-error').innerText(),/연구비 신청은 3월·9월/);await page.locator('[data-ui=review-plan]').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'faculty-action');
 const capped=fixture();capped.facultyAction='funding';
 for(const id of [1,2])capped.grants.portfolio.push({id,role:'pi',start:0,end:36,annual:150,titleIndex:id});
 await inject(capped);assert.ok(await page.locator('#grant-role').isHidden());
 assert.match(await page.locator('#budget-error').innerText(),/3책5공/);
 await page.locator('[data-ui=review-plan]').click();
 assert.ok(await page.locator('.grant-panel').evaluate(el=>el.open));
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'grant-role');
 await page.locator('#grant-role').selectOption('co');
 assert.ok(await page.locator('[data-ui=advance]').isEnabled());
 const newStudent=fixture();newStudent.pending={kind:'conference-plan',scope:'domestic',targetMonth:1};await inject(newStudent);
 await page.locator('#decision [data-choice=none]').click();await page.waitForFunction(()=>document.activeElement?.matches('#monthly-plan h2'));
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).month);await page.locator('[data-ui=advance]').click();
 await page.waitForFunction(month=>JSON.parse(localStorage.getItem('pm-save-v4')).month>month,before);await overflow('actual Worker month');
 assert.deepEqual(errors,[]);await context.close();
 console.log('Advising UI passed: 320/390/1360, 44px targets, keyboard context, requested rest and rescheduling, separate stipend pools, closed funding call, grant role focus, actual Worker month, reduced motion.');
}finally{await browser.close();}
