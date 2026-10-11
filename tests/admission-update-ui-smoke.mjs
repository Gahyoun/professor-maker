import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave} from '../dist/engine.js';
import {ADMISSION_KEY,admissionCandidates,admitCandidate,admissionSeed,admissionCode} from '../dist/admission.js';
import {RELEASE_NOTES_KEY,RELEASE_NOTES_VERSION} from '../dist/release-notes.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const url=(process.env.GAME_URL||'http://127.0.0.1:4194/').replace(/\/$/,'');
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-admission-ui';await fs.mkdir(dir,{recursive:true});
const errors=[],checks=[];
const fitsLegacy=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
const sameHidden=(actual,expected)=>{assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort());for(const key of Object.keys(expected))assert.ok(Math.abs(actual[key]-expected[key])<1e-10,key+' unchanged');};
try{
 for(const width of [320,390,1360]){
  const height=width===320?640:width===390?844:950;
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
  const draft=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),ADMISSION_KEY);
  const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' overflow');
  await page.goto(url+'/#lab');await page.locator('#onboarding-update').waitFor();await fits();
  const box=await page.locator('#onboarding-update').boundingBox();assert.ok(box.height<=height*(width<900?.65:1));assert.ok(box.y>=0&&box.y+box.height<=height);
  assert.equal(await page.locator('#onboarding-update li').count(),5);
  for(const button of await page.locator('#onboarding-update button').all())assert.ok((await button.boundingBox()).height>=44);
  await page.screenshot({path:`${dir}/update-${width}.png`});
  await page.locator('#onboarding-update [data-ui=update-close]').first().click();assert.equal(await page.locator('#onboarding-update').count(),0);
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RELEASE_NOTES_KEY),[RELEASE_NOTES_VERSION]);
  await page.reload();assert.equal(await page.locator('#onboarding-update').count(),0);
  await page.locator('[data-ui=update-open]').click();await page.locator('#onboarding-update').waitFor();assert.equal(await page.evaluate(()=>document.activeElement.id),'update-notice-title');
  await page.locator('#onboarding-update [data-ui=update-close]').last().click();assert.equal(await page.locator('#onboarding-update').count(),0);
  await page.locator('[name=professorName]').selectOption('custom');await page.locator('#professor-surname').fill('남궁');
  await page.locator('[name=difficulty][value=realistic]').check();await page.locator('[name=professorGender]').selectOption('female');await page.locator('[name=professorAge]').selectOption('42');
  await page.locator('#field-id').selectOption('050');await page.locator('#lab-mode').selectOption('wet');await page.locator('[name=institution]').selectOption('private');
  const seed=0x1234abcd;await page.locator('#admission-share-code').fill(admissionCode(seed,1));
  await page.locator('#start-form button[type=submit]').click();await page.locator('#admission-form').waitFor();const firstDraft=await draft();
  assert.equal(firstDraft.intakeSeed,seed);assert.equal(firstDraft.selected,1);assert.equal(await page.locator('#start-form').count(),0);assert.equal(await page.locator('#admission-share-code').count(),0);
  assert.equal(await page.locator('.candidate-option').count(),3);assert.equal(await page.locator('[name=candidateIndex]:checked').inputValue(),'1');
  assert.match(await page.locator('.admission-interview').innerText(),/남궁 교수.*현실/);assert.doesNotMatch(await page.locator('.admission-candidates').innerText(),/성실성|내성|학습능력|연구수행능력|기질|스탯|성공 확률/);
  const options={locale:'ko',professorGender:'female',professorProfile:{...firstDraft.profile}},candidates=admissionCandidates(seed,options);
  assert.deepEqual(await page.locator('.candidate-heading strong').allTextContents(),candidates.map(c=>c.name));
  for(let index=0;index<3;index++){
   const card=page.locator('.candidate-option').nth(index);await card.scrollIntoViewIfNeeded();const bounds=await card.boundingBox();assert.ok(bounds.height>=44);await fits();
   assert.match(await card.innerText(),new RegExp(candidates[index].gpa.toFixed(2).replace('.','\\.')));
  }
  await page.locator('[name=candidateIndex][value="2"]').check();const selectedDraft=await draft();assert.equal(selectedDraft.selected,2);assert.deepEqual(selectedDraft.profile,firstDraft.profile);
  const names=await page.locator('.candidate-heading strong').allTextContents();await page.reload();await page.locator('#admission-form').waitFor();assert.deepEqual(await draft(),selectedDraft);assert.deepEqual(await page.locator('.candidate-heading strong').allTextContents(),names);assert.equal(await page.locator('[name=candidateIndex]:checked').inputValue(),'2');
  await page.locator('[data-ui=settings]').click();assert.ok(await page.locator('#modal [data-ui=new]').isDisabled());assert.equal(await page.locator('#admission-code').count(),0);assert.match(await page.locator('#modal').innerText(),/세 후보 중 한 명/);await page.locator('#modal [data-ui=close]').click();
  await page.evaluate(()=>{const form=document.createElement('form');form.id='start-form';document.body.append(form);form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.remove();const b=document.createElement('button');b.dataset.ui='confirm-new';document.body.append(b);b.click();b.remove();});assert.deepEqual(await draft(),selectedDraft);
  await page.locator('#admission-form [type=submit]').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/interview-${width}.png`,fullPage:true});
  await page.locator('#admission-form [type=submit]').click();await page.locator('#decision').waitFor();const started=await snapshot();assert.ok(validateSave(started));
  const expected=admitCandidate(seed,2,options);assert.equal(started.name,expected.name);assert.equal(started.gender,expected.gender);assert.equal(started.creationSeed,admissionSeed(seed,2));sameHidden(started.hidden,expected.hidden);assert.deepEqual(started.admission,{intakeSeed:seed,candidateIndex:2});assert.equal(started.professorName,'남궁 교수');assert.deepEqual(started.professorProfile,firstDraft.profile);assert.equal(await draft(),null);
  await page.evaluate(()=>{const b=document.createElement('button');b.dataset.ui='confirm-new';document.body.append(b);b.click();b.remove();});assert.deepEqual(await snapshot(),started);
  assert.equal(await page.locator('#onboarding-update').count(),0);assert.equal(await page.locator('#screen-guide').count(),0);
  await page.reload();assert.deepEqual((await snapshot()).admission,started.admission);sameHidden((await snapshot()).hidden,expected.hidden);
  await page.locator('#decision [data-choice=none]').click();await page.locator('#screen-guide').waitFor();assert.match(await page.locator('#screen-guide').innerText(),/8년/);assert.equal(await page.locator('#onboarding-update').count(),0);
  await page.locator('[data-ui=screen-guide-skip]').click();await page.locator('[data-ui=settings]').click();assert.ok(await page.locator('#modal [data-ui=new]').isDisabled());assert.match(await page.locator('#modal').innerText(),/지도가 끝나면/);
  assert.equal(await page.locator('#admission-code').inputValue(),admissionCode(seed,2));await page.locator('[data-ui=copy-admission]').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),admissionCode(seed,2));assert.match(await page.locator('#toast').innerText(),/복사/);await fits();await page.locator('#modal [data-ui=close]').click();
  // Completing a story unlocks a genuinely new intake, with the old run backed up.
  const ended=await snapshot();ended.month=24;ended.ending='bachelor';ended.pending=null;ended.pendingQueue=[];
  await page.evaluate(state=>localStorage.setItem('pm-save-v4',JSON.stringify(state)),ended);await page.reload();await page.locator('.ending-summary').waitFor();await page.locator('.ending-summary [data-ui=new]').click();await page.locator('[data-ui=confirm-new]').click();await page.locator('#start-form').waitFor();assert.equal(await draft(),null);assert.equal(await page.locator('#onboarding-update').count(),0);
  await page.locator('#start-form [type=submit]').click();await page.locator('#admission-form').waitFor();const randomDraft=await draft();assert.equal(randomDraft.selected,null);assert.equal(await page.locator('[name=candidateIndex]:checked').count(),0);
  await page.locator('#admission-form [type=submit]').click();assert.equal((await snapshot()).started,false);assert.deepEqual(await draft(),randomDraft);await page.reload();assert.deepEqual(await draft(),randomDraft);
  checks.push({width,update:'once/replay',intake:'frozen/reload',candidate:2,share:'exact',newGame:'only-after-ending',overflow:0});await context.close();
 }
 // Unreadable auxiliary storage never replaces or corrupts an ongoing game.
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/#lab');
 const legacy=createState('김민지',155,{gender:'female',difficulty:'realistic',locale:'ko'});legacy.started=true;
 await page.evaluate(({state,intakeKey,releaseKey})=>{localStorage.clear();localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem(intakeKey,JSON.stringify({version:1,intakeSeed:-1,profile:{}}));localStorage.setItem(releaseKey,'{"bad":true}');},{state:legacy,intakeKey:ADMISSION_KEY,releaseKey:RELEASE_NOTES_KEY});
 await page.reload();await page.locator('#live-stage').waitFor();assert.equal(await page.locator('#onboarding-update').count(),0);assert.equal(await page.locator('#admission-form').count(),0);const loaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));sameHidden(loaded.hidden,legacy.hidden);assert.deepEqual({...loaded,hidden:legacy.hidden},legacy);
 await page.goto(url+'/#home');await page.locator('#onboarding-update').waitFor();for(const width of [320,390]){await page.setViewportSize({width,height:844});await fitsLegacy(page);await page.screenshot({path:`${dir}/legacy-home-${width}.png`});}await page.locator('#onboarding-update [data-ui=update-close]').first().click();await page.reload();assert.equal(await page.locator('#onboarding-update').count(),0);await page.goto(url+'/#lab');await page.locator('[data-ui=guide]').click();await page.locator('#modal [data-ui=update-open]').click();assert.equal(await page.locator('#modal .release-note-review li').count(),5);await page.locator('#modal [data-ui=close]').first().click();assert.deepEqual((await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')))).admission,undefined);
  await page.locator('[data-ui=settings]').click();assert.equal(await page.locator('#admission-code').count(),0);assert.ok(await page.locator('#modal [data-ui=new]').isDisabled());await context.close();
 assert.deepEqual(errors,[]);await fs.writeFile(`${dir}/results.json`,JSON.stringify(checks,null,2));console.log('Admission/update UI passed: 320/390/1360, capped notice with one-time/replay, fixed 3 candidates, profile/selection reload, no trait leak or reroll, exact admitted traits and sharing, only ending unlocks new intake, first guide after decision, malformed storage and legacy saves.');
}finally{await browser.close();}
