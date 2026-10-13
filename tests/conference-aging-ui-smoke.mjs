// Actual-browser regression for prior-month conference decisions and elapsed faculty age.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,proposeSchedule,validateSave,monthlyBudgetCost} from '../dist/engine.js';
import {conferenceCosts} from '../dist/travel.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}),output='/private/tmp/professor-maker-qa';
await fs.mkdir(output,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('pm-fast','true'));
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
 const inject=async state=>{state.started=true;assert.ok(validateSave(state));await page.evaluate(state=>localStorage.setItem('pm-save-v4',JSON.stringify(state)),state);await page.reload();await page.locator('#live-stage').waitFor();};
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:4173/')+'#lab');
 await page.locator('[name=professorAge]').selectOption('40');
 if(await page.locator('#onboarding-update').count())await page.locator('#onboarding-update [data-ui=update-close]').first().click();await page.locator('#start-form button[type=submit]').click();await page.locator('[name=candidateIndex][value="0"]').check();await page.locator('#admission-form button[type=submit]').click();
 await page.locator('#decision').waitFor();
 let state=await snapshot();
 assert.deepEqual(state.pending,{kind:'conference-plan',scope:'domestic',targetMonth:1});
 assert.match(await page.locator('#decision h2').innerText(),/다음 달 4월 국내학회/);
 assert.equal(await page.locator('#decision [data-ui=decide]').count(),4);
 assert.match(await page.locator('#decision [data-choice=together]').innerText(),/40만원/);
 assert.match(await page.locator('#decision [data-choice=professor]').innerText(),/20만원/);
 assert.match(await page.locator('#decision [data-choice=none]').innerText(),/경비 없음/);
 assert.equal(await page.locator('#domestic-attendance').count(),0);
 assert.match(await page.locator('.faculty-scroll-summary [data-professor-age]').innerText(),/40세/);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#toast')).opacity==='0');
 await page.locator('#decision').scrollIntoViewIfNeeded();
 await page.screenshot({path:output+'/pm413-conference-prior-month.png'});
 await page.locator('#decision [data-choice=none]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);if(await page.locator('[data-ui=screen-guide-skip]').count())await page.locator('[data-ui=screen-guide-skip]').click();
 assert.equal((await snapshot()).month,0);
 assert.equal((await snapshot()).attendance.domestic,'none');
 assert.equal(await page.locator('.domestic-conference-summary').count(),0);
 await page.locator('[data-ui=advance]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).month===1);
 for(let guard=0;(await snapshot()).pending;guard++){
  assert.ok(guard<12);
  assert.notEqual((await snapshot()).pending.kind,'conference-plan','Conference choice belongs to March, not April');
  const before=JSON.stringify(await snapshot());
  await page.locator('#decision .choice:not([disabled])').first().click();
  await page.waitForFunction(before=>localStorage.getItem('pm-save-v4')!==before,before);
 }
 assert.match(await page.locator('.domestic-conference-summary').innerText(),/안 가기/);
 assert.match(await page.locator('.domestic-conference-summary').innerText(),/경비 0만원/);
 assert.equal(await page.locator('#week-2').isDisabled(),false);
 assert.equal(await page.locator('.festival-notice').count(),0);
 assert.equal(await page.locator('#domestic-attendance').count(),0);
 // The four choices persist; attending locks only the conference week of its actual month.
 for(const attendance of ['professor','student','together']){
  state=createState('김민지',17,{age:40,gender:'female'});state.started=true;state.pending={kind:'conference-plan',scope:'domestic',targetMonth:1};
  await inject(state);
  await page.locator(`#decision [data-choice=${attendance}]`).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);
  state=await snapshot();assert.equal(state.attendance.domestic,attendance);
  state.month=1;state.plan=proposeSchedule(state);await inject(state);
  assert.equal(await page.locator('#week-2').isDisabled(),attendance!=='professor');
  assert.equal(await page.locator('#domestic-attendance').count(),0);
  if(attendance==='together'){
   assert.match(await page.locator('.domestic-conference-summary').innerText(),/경비 40만원/);
   await page.evaluate(()=>{const summary=document.querySelector('.domestic-conference-summary');window.scrollTo({top:scrollY+summary.getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),behavior:'instant'});});
   await page.screenshot({path:output+'/pm413-conference-confirmed.png'});
   await page.locator('.domestic-conference-summary').screenshot({path:output+'/pm413-conference-confirmed-panel.png'});
  }
 }
 // Older saves can carry the old, late conference prompt without a target month.
 state=createState('김민지',17,{age:40});state.month=1;state.pending={kind:'conference-plan',scope:'domestic'};state.plan=proposeSchedule(state);await inject(state);
 assert.match(await page.locator('#decision h2').innerText(),/이번 달 4월 국내학회/);
 assert.ok(!(await page.locator('#decision').innerText()).includes('5월'));
 // Ordinary graduate months retain activities without a permanent attendance control.
 state=createState('김민지',17,{age:40});state.month=26;state.route='integrated';state.plan=proposeSchedule(state);await inject(state);
 assert.equal(await page.locator('#domestic-attendance,.domestic-conference-summary').count(),0);
 assert.match(await page.locator('.faculty-scroll-summary [data-professor-age]').innerText(),/42세/);
 for(const width of [320,390,1360]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // Wet lab consumable estimates follow the schedule actually selected in the UI.
 state=createState('김민지',17,{age:40,labMode:'wet'});state.month=26;state.route='integrated';state.plan=proposeSchedule(state);await inject(state);
 await page.locator('#week-0').selectOption('experiment');
 const wet=await snapshot(),estimate=monthlyBudgetCost(wet)+Object.values(conferenceCosts(wet)).reduce((n,v)=>n+v,0);
 assert.equal(Number((await page.locator('#confirm-cost').innerText()).replace(/[^0-9]/g,'')),Math.round(estimate*10));
 state.month=96;state.pending={kind:'defense'};state.plan=proposeSchedule(state);await inject(state);
 assert.match(await page.locator('.faculty-age [data-professor-age]').innerText(),/48세/);
 assert.equal((await snapshot()).professorProfile.age,40,'Initial age stays in the save');
 await page.locator('.faculty-overview').screenshot({path:output+'/pm413-professor-age-eight-years.png'});
 assert.deepEqual(errors,[]);
 await context.close();
 console.log('Conference/age UI passed: March four-choice decision, actual April read-only cost, no permanent graduate control, 320–1360px, and eight elapsed years without changing initial age.');
}finally{await browser.close();}
