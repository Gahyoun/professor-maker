import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,HIDDEN_RANGES,simulateMonth,validateSave} from '../dist/engine.js';
import {academicWeeks} from '../dist/academic-calendar.js';
import {monthlyFundingNotice} from '../dist/funding-notice.js';
import {planReadiness} from '../dist/advising-plan.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=(process.env.GAME_URL||'http://127.0.0.1:4194/').replace(/\/$/,'');
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-borrowing-ui';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
function fixture(seed=46){
 const s=createState('김민지',seed,{gender:'female',labMode:'wet',difficulty:'realistic'});s.started=true;s.month=6;
 s.lab.funds=0;s.lab.pool=0;s.lab.debt=0;s.lab.creditEnabled=false;s.attendance={domestic:'none',overseas:'none'};s.professor={research:85,teaching:85,admin:85,mentoring:85};
 for(const [k,v] of Object.entries({stress:10,stamina:80,resilience:80,motivation:90,rapport:70,research:80,learning:80,language:80,luck:80,diligence:80})){const [lo,hi]=HIDDEN_RANGES[k];s.hidden[k]=lo+v*(hi-lo)/100;}
 s.plan=academicWeeks(s).map(()=> 'analysis');s.lab.budget.environment=1;s.lab.budget.performance=1;s.feedback='listen';s.facultyAction='routine';return s;
}
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
 const inject=async s=>{assert.ok(validateSave(s));await page.goto(url+'/#lab');await page.evaluate(state=>{localStorage.clear();localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem('pm-fast','true');},s);await page.reload();await page.locator('#monthly-plan').waitFor();};
 const resolve=async()=>{const choices={'lab-warning':'acknowledge','conference-plan':'none','monthly-issue':'acknowledge','academic-exam':'routine','workshop-plan':'skip','failure-counsel':'review','conversation-topic':'daily',story:'encourage',event:'0'};for(let i=0;i<12;i++){const s=await snapshot();if(!s.pending||s.ending)return;const n=s.history.length;await page.locator(`#decision [data-choice="${choices[s.pending.kind]}"]`).click();await page.waitForFunction(n=>JSON.parse(localStorage.getItem('pm-save-v4')).history.length>n,n);}};
 for(const kind of ['zero','pool-only','application','legacy-debt']){
  const s=fixture();if(kind==='pool-only')s.lab.pool=1000;if(kind==='application'){s.facultyAction='funding';s.grantApplication={role:'co',years:5};}if(kind==='legacy-debt')s.lab.debt=1000;
  await inject(s);assert.ok(await page.locator('[data-ui=advance]').isEnabled(),kind);assert.match(await page.locator('#budget-error').innerText(),/자동 차입/);assert.match(await page.locator('#confirm-borrowing').innerText(),/자동 차입/);assert.equal(await page.locator('#operating-credit-enabled').count(),0);
  for(const width of [320,390,1360]){await page.setViewportSize({width,height:900});await page.locator('[data-ui=advance]').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const box=await page.locator('[data-ui=advance]').boundingBox();assert.ok(box.height>=44);assert.ok(await page.locator('#confirm-borrowing').isVisible());await page.screenshot({path:`${dir}/${kind}-${width}.png`});}
  await page.locator('[data-ui=advance]').click();try{await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,s.month);}catch(error){console.error(kind, await page.locator('#toast').innerText(), errors, (await snapshot()).pending);await page.screenshot({path:`${dir}/failed-${kind}.png`});throw error;}const next=await snapshot();assert.ok(next.lastReport.borrowed>0,kind);assert.ok(next.lastReport.results.some(r=>r.performed),kind);assert.equal(next.history.filter(h=>h.kind==='stipend-payment'&&h.month===next.month).length,1,kind);assert.ok(!next.lastReport.suspended,kind);if(kind==='pool-only')assert.ok(next.lab.pool<s.lab.pool);
  if(kind==='legacy-debt'){assert.equal(next.pending.kind,'lab-warning');assert.equal(next.pending.mode,'borrowing');assert.match(await page.locator('#decision').innerText(),/학과 차입/);assert.doesNotMatch(await page.locator('#decision').innerText(),/운영을 1개월 연속 보류/);}
  await resolve();assert.match(await page.locator('.month-report summary').innerText(),/학과 차입하며 진행/);await page.locator('.month-report summary').click();assert.match(await page.locator('.borrowing-report-summary').innerText(),/급여와 연구 활동/);
 }
 // A real award announces the title and actual gross deposit even when repayment absorbs the cash.
 let awardBase,awarded;
 for(let seed=1;seed<80;seed++){const s=fixture(seed);s.lab.debt=1000;s.facultyAction='funding';const n=simulateMonth(s,s.plan,{facultyAction:'funding',grantApplication:{role:'co',years:5}});if(n.lastReport.fundingResults.some(r=>r.awarded)){awardBase=s;awarded=n;break;}}
 assert.ok(awardBase);awardBase.grantApplication={role:'co',years:5};await inject(awardBase);await page.locator('[data-ui=advance]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,awardBase.month);
 const selected=await snapshot(),notice=monthlyFundingNotice(selected);assert.ok(notice.repaid>0);assert.match(await page.locator('#funding-results').innerText(),/좋은 소식!/);assert.match(await page.locator('#funding-results').innerText(),/이번 달 실제 입금/);assert.match(await page.locator('#funding-results').innerText(),/차입 상환/);assert.match(await page.locator('#toast').innerText(),/좋은 소식!/);await page.setViewportSize({width:390,height:844});await page.locator('#funding-results').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/grant-good-news-390.png`});await page.reload();assert.equal(await page.locator('#toast').innerText(),'');assert.match(await page.locator('#funding-results').innerText(),/좋은 소식!/);await resolve();assert.equal(await page.locator('#toast').innerText(),'');
 // Existing annual support is an annual deposit, and preview matches the +15% future rule.
 const annual=fixture();annual.month=12;annual.lab.debt=1000;annual.grants.annualAmount=300;delete annual.grants.grantScaleVersion;annual.grants.reportYears=[1];annual.plan=academicWeeks(annual).map(()=> 'analysis');annual.grants.portfolio[0].annual=300;delete annual.grants.portfolio[0].grantScaleVersion;await inject(annual);await page.locator('.grant-panel summary').click();assert.match(await page.locator('.grant-list').innerText(),/3,450만원/);
 await page.locator('[data-ui=advance]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,annual.month);assert.match(await page.locator('#funding-results').innerText(),/연차 연구비 입금/);assert.doesNotMatch(await page.locator('#funding-results').innerText(),/좋은 소식! 연구과제가 선정/);assert.match(await page.locator('#toast').innerText(),/연차 연구비 입금/);await page.reload();assert.equal(await page.locator('#toast').innerText(),'');await resolve();await page.locator('[data-ui=advance]').click();await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v4')).month>m,annual.month+1);assert.equal(await page.locator('#funding-results').count(),0);
 assert.deepEqual(errors,[]);console.log('Automatic borrowing UI passed: zero cash, stipend pool only, funding application, debt beyond legacy limit, 320/390/1360 actionable advances, actual payroll/research/borrowing, borrowing warning, real award gross/repayment, annual funding preview, reload and month-scoped positive alerts.');await context.close();
}finally{await browser.close();}
