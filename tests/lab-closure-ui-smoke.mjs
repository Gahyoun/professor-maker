import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,simulateMonth,validateSave} from '../dist/engine.js';
import {closureSummary,difficultyOf} from '../dist/lab-risk.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-closure-ui';await fs.mkdir(dir,{recursive:true});
const url=(process.env.GAME_URL||'http://127.0.0.1:4192/').replace(/\/$/,'');
const choices={'lab-warning':'acknowledge','conference-plan':'none','monthly-issue':'acknowledge','academic-exam':'routine','workshop-plan':'skip','failure-counsel':'review','conversation-topic':'daily',story:'encourage',event:'0'};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
 const inject=async state=>{assert.ok(validateSave(state));await page.evaluate(state=>{localStorage.clear();localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem('pm-fast','true');},state);await page.goto(url+'/#lab');await page.reload();await page.locator('#live-stage').waitFor();};
 const resolve=async()=>{for(let i=0;i<12;i++){const state=await snapshot();if(!state.pending||state.ending)return;const selected=choices[state.pending.kind];assert.ok(selected,state.pending.kind);await page.locator(`#decision [data-choice="${selected}"]`).click();await page.waitForFunction(month=>JSON.parse(localStorage.getItem('pm-save-v4')).history.length>month,state.history.length);}assert.fail('too many queued decisions');};
 // Actual radio selection is saved for each new run; older states keep their mode.
 for(const mode of ['beginner','realistic']){
  await page.goto(url+'/#lab');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#start-form').waitFor();
  assert.ok(await page.locator('[name=difficulty][value=beginner]').isChecked());
  await page.locator(`[name=difficulty][value=${mode}]`).check();
  assert.match(await page.locator('#difficulty-hint').innerText(),mode==='beginner'?/필수 지출 부족액/:/기존과 같은/);
  for(const width of [320,390,1360]){await page.setViewportSize({width,height:900});await page.locator('.difficulty-setup').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const box=await page.locator('.difficulty-option').first().boundingBox();assert.ok(box.height>=44);}
  await page.setViewportSize({width:390,height:844});if(await page.locator('#onboarding-update').count())await page.locator('#onboarding-update [data-ui=update-close]').first().click();await page.locator('#start-form [type=submit]').click();await page.locator('[name=candidateIndex][value="0"]').check();await page.locator('#admission-form button[type=submit]').click();await page.locator('#decision [data-choice=none]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);
  await page.locator('[data-ui=screen-guide-skip]').click();const started=await snapshot();assert.equal(started.professorProfile.difficulty,mode);if(mode==='beginner')assert.ok(started.lab.initialFunding>=800);
  await page.reload();assert.equal((await snapshot()).professorProfile.difficulty,mode);
 }
 const base=createState('김민지',729,{gender:'female',fieldId:'050',labMode:'wet',difficulty:'realistic'});base.started=true;base.month=6;base.professor={research:90,teaching:90,admin:0,mentoring:90};base.lab.funds=1000;base.lab.pool=1000;base.allocation={research:2,teaching:2,admin:0,mentoring:2};base.plan=base.plan.map(()=> 'rest');
 const warned=simulateMonth(base,base.plan);assert.equal(warned.pending.kind,'lab-warning');
 await inject(warned);assert.match(await page.locator('#decision').innerText(),/2개월 안에/);assert.match(await page.locator('.lab-risk-notice').innerText(),/운영 종료까지 남은 2개월/);
 await page.locator('#decision [data-choice=review]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);
 assert.ok((await snapshot()).allocation.admin>=3);assert.equal((await snapshot()).lab.budget.performance,0);
 await page.locator('[data-ui=advance]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month===m,warned.month+1);await resolve();
 assert.ok((await snapshot()).professor.admin>0);assert.equal((await snapshot()).labRisk.faculty.admin,0);
 // Acknowledging a warning does not silently rebalance the player's plan.
 await inject(warned);await page.locator('#decision [data-choice=acknowledge]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).pending===null);assert.equal((await snapshot()).allocation.admin,0);
 for(let i=0;i<2;i++){const before=await snapshot();await page.locator('[data-ui=advance]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,before.month);await resolve();}
 const closed=await snapshot();assert.equal(closed.ending,'gameover');assert.equal(closed.labClosure.streak,3);assert.match(await page.locator('#modal .closure-cause').innerText(),/학교행정.*3개월/);
 await page.locator('[data-ui=close]').click();assert.match(await page.locator('.ending-summary .closure-cause').innerText(),/학교행정.*3개월/);await page.goto(url+'/#letters');await page.locator('[data-ui=read-entry]').first().click();assert.match(await page.locator('#modal .closure-cause').innerText(),/학교행정.*3개월/);
 const archive=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-letters-v3')));assert.deepEqual(archive[0].labClosure,closed.labClosure);
 await page.reload();await page.locator('[data-ui=read-entry]').first().click();assert.equal((await page.locator('#modal .closure-cause').innerText()).replace('종료 원인 · ',''),closureSummary(closed));
 await page.locator('[data-ui=close]').click();await page.locator('[data-ui=settings]').click();const downloadEvent=page.waitForEvent('download');await page.locator('#modal [data-ui=export]').click();const download=await downloadEvent,exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.deepEqual(exported.gallery[0].labClosure,closed.labClosure);assert.deepEqual(exported.state.labClosure,closed.labClosure);
 const importedContext=await browser.newContext({viewport:{width:1360,height:960},serviceWorkers:'block',reducedMotion:'reduce'}),importedPage=await importedContext.newPage();importedPage.on('pageerror',e=>errors.push(e.message));
 await importedPage.goto(url+'/#journal');await importedPage.locator('#journal-import-file').setInputFiles({name:'closure.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await importedPage.locator('#confirm-import').click();await importedPage.waitForFunction(()=>location.hash==='#lab');assert.match(await importedPage.locator('.ending-summary .closure-cause').innerText(),/학교행정.*3개월/);
 await importedPage.goto(url+'/#letters');await importedPage.locator('[data-ui=read-entry]').first().click();assert.match(await importedPage.locator('#modal .closure-cause').innerText(),/학교행정.*3개월/);await importedPage.locator('[data-ui=close]').click();
 await importedPage.goto(url+'/#journal');const invalid=structuredClone(exported);invalid.gallery[0].labClosure.streak=2;await importedPage.locator('#journal-import-file').setInputFiles({name:'invalid-closure.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});await importedPage.waitForFunction(()=>document.querySelector('#toast').textContent.includes('유효한'));assert.equal(await importedPage.locator('#confirm-import').count(),0);assert.deepEqual(await importedPage.evaluate(()=>JSON.parse(localStorage.getItem('pm-letters-v3'))[0].labClosure),closed.labClosure);await importedContext.close();
 // A costly plan remains playable through automatic borrowing; suspension is optional.
 const costly=createState('김민지',9,{gender:'female',labMode:'wet',difficulty:'realistic'});costly.started=true;costly.month=2;costly.lab.funds=7;costly.lab.pool=100;costly.lab.budget.environment=6;costly.lab.budget.performance=6;
 await inject(costly);assert.ok(await page.locator('[data-ui=advance]').isEnabled());assert.match(await page.locator('#budget-error').innerText(),/자동 차입/);assert.equal(await page.locator('[data-ui=suspend]').count(),0);assert.equal(await page.locator('.lab-risk-notice').count(),0);
 const empty=structuredClone(costly);empty.lab.funds=0;empty.lab.pool=0;empty.lab.budget.environment=0;empty.lab.budget.performance=0;empty.attendance={domestic:'none',overseas:'none'};
 await inject(empty);assert.ok(await page.locator('[data-ui=advance]').isEnabled());assert.ok(await page.locator('[data-ui=suspend]').isEnabled());await page.locator('[data-ui=suspend]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,empty.month);assert.equal((await snapshot()).pending.kind,'lab-warning');assert.match(await page.locator('#decision').innerText(),/운영을 1개월 연속 보류/);assert.equal((await snapshot()).career.papers,0);await resolve();assert.match(await page.locator('.student-voice').innerText(),/연구비가 다시 마련될 때까지/);assert.match(await page.locator('.month-report summary').innerText(),/운영 보류.*급여/);await page.locator('.month-report summary').click();assert.doesNotMatch(await page.locator('.month-report').innerText(),/계획을 수행하지 못했다/);
 for(const width of [320,390,1360]){await page.setViewportSize({width,height:900});await page.locator('.lab-risk-notice').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${dir}/warning-${width}.png`});}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-ui=suspend]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).labRisk.funding===2);await resolve();await page.locator('[data-ui=suspend]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v4')).ending==='gameover');assert.match(await page.locator('#modal .closure-cause').innerText(),/필수 연구비 부족.*3개월/);assert.match(await page.locator('#modal .letter-paper').innerText(),/연구비를 확보하지 못해/);await page.screenshot({path:`${dir}/funding-gameover-390.png`});
 const legacy=structuredClone(costly);delete legacy.professorProfile.difficulty;await inject(legacy);assert.equal(difficultyOf(await snapshot()),'realistic');assert.match(await page.locator('.term-count').innerText(),/현실/);
 assert.deepEqual(errors,[]);console.log('Lab closure UI passed: real mode selection and reload, mobile touch targets, warning review/recovery and acknowledgement/closure, frozen cause replay/export/import and malformed-cause rejection, costly-plan adjustment versus actual suspension, funding cause, and legacy saves.');await context.close();
}finally{await browser.close();}
