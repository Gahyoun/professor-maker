import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave} from '../dist/engine.js';
import {academicWeeks} from '../dist/academic-calendar.js';
import {researchOperatingCost} from '../dist/research-finance.js';
import {applicationGrantAmount,nextGrantAmount} from '../dist/funding.js';
import {planReadiness} from '../dist/advising-plan.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=(process.env.GAME_URL||'http://127.0.0.1:4194/').replace(/\/$/,'');
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-finance-profile-ui';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),money=n=>`${Math.round(n*10).toLocaleString('ko-KR')}만원`;
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
 for(const [fieldId,labMode]of [['048','dry'],['057','wet'],['072','wet'],['115','wet']]){
  const s=createState('예산 검증',46,{gender:'female',fieldId,labMode,difficulty:'realistic'});s.started=true;s.month=2;s.plan=academicWeeks(s).map(()=> 'analysis');s.lab.funds=3000;s.lab.pool=1000;s.attendance={domestic:'none',overseas:'none'};s.grants.annualAmount=300;delete s.grants.grantScaleVersion;s.grants.portfolio[0].annual=300;delete s.grants.portfolio[0].grantScaleVersion;assert.ok(validateSave(s));
  await page.goto(url+'/#lab');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('pm-save-v4',JSON.stringify(s));localStorage.setItem('pm-fast','true');},s);await page.reload();await page.locator('#lab-budget summary').click();
  const cost=researchOperatingCost(s);assert.match(await page.locator('#research-budget-details').innerText(),new RegExp(cost.profile.label));
  const rows=await page.locator('.budget-breakdown>div').evaluateAll(els=>Object.fromEntries(els.map(e=>[e.querySelector('dt').textContent,e.querySelector('dd').textContent])));assert.equal(rows['기본 유지비'],money(cost.fixed));assert.equal(rows['환경·성과 지원'],money(cost.support));assert.equal(rows['계획한 연구 활동비'],money(cost.activities));assert.equal(await page.locator('#confirm-cost').innerText(),money(planReadiness(s).cost));
  for(const width of [320,390]){await page.setViewportSize({width,height:900});await page.locator('#research-budget-details').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${dir}/field-${fieldId}-${labMode}-${width}.png`});}
  await page.locator('#week-0').selectOption('experiment');const changed=await snapshot();assert.equal(await page.locator('.budget-breakdown>div').filter({has:page.locator('dt',{hasText:'계획한 연구 활동비'})}).locator('dd').innerText(),money(researchOperatingCost(changed).activities));assert.equal(await page.locator('#confirm-cost').innerText(),money(planReadiness(changed).cost));
  await page.locator('.grant-panel summary').click();assert.match(await page.locator('#grant-annual-preview').innerText(),new RegExp(money(applicationGrantAmount(changed,'pi'))));await page.locator('#grant-role').selectOption('co');assert.match(await page.locator('#grant-annual-preview').innerText(),new RegExp(money(applicationGrantAmount(changed,'co'))));assert.match(await page.locator('.grant-list').innerText(),new RegExp(money(nextGrantAmount(300))));assert.equal((await snapshot()).grants.annualAmount,300,'preview never modifies a contract');
 }
 assert.deepEqual(errors,[]);console.log('Research finance UI passed: math/dry, environment/wet, architecture/wet, clinical/wet mobile profile hints and exact breakdown, actual plan change updates costs, PI/co new funding preview and unchanged legacy contract.');await context.close();
}finally{await browser.close();}
