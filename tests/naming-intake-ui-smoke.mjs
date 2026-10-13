import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave} from '../dist/engine.js';
import {admissionCandidates,admissionCode,admissionSeed} from '../dist/admission.js';
import {RELEASE_NOTES_VERSION,RELEASE_NOTES_KEY} from '../dist/release-notes.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=(process.env.GAME_URL||'http://127.0.0.1:4195').replace(/\/$/,''),output=process.env.QA_OUTPUT_DIR||'/private/tmp/pm-naming-intake';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),profile={gender:'female',age:38,fieldId:'050',labMode:'dry',institution:'national',difficulty:'beginner'};
const options={locale:'ko',professorGender:profile.gender,professorProfile:profile};
async function run({draft,shareCode}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const saved=createState('원래 저장 이름',42,{locale:'ko'});saved.started=false;
 await page.addInitScript(({saved,draft,key,version})=>{if(localStorage.getItem('qa-naming-seeded'))return;localStorage.setItem('qa-naming-seeded','yes');localStorage.setItem('pm-save-v4',JSON.stringify(saved));localStorage.setItem(key,JSON.stringify([version]));if(draft)localStorage.setItem('pm-admission-v1',JSON.stringify(draft));},{saved,draft,key:RELEASE_NOTES_KEY,version:RELEASE_NOTES_VERSION});
 await page.goto(base+'/index.html#lab');
 if(!draft){await page.locator('#start-form').waitFor();if(shareCode)await page.locator('#admission-share-code').fill(shareCode);await page.locator('#start-form [type=submit]').click();}
 await page.locator('#admission-form').waitFor();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-admission-v1'))),namingVersion=stored.namingVersion??1;
 const expected=admissionCandidates(stored.intakeSeed,{locale:'ko',namingVersion,professorGender:stored.profile.gender,professorProfile:stored.profile}),names=await page.locator('.candidate-heading strong').allTextContents();
 assert.deepEqual(names,expected.map(c=>c.name));await page.reload();assert.deepEqual(await page.locator('.candidate-heading strong').allTextContents(),names);
 await page.locator('[name=candidateIndex][value="2"]').check();await page.locator('#admission-form [type=submit]').click();await page.locator('#decision').waitFor();
 await page.locator('[data-ui=opening-continue]').click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')));
 assert.ok(validateSave(state));assert.equal(state.name,names[2]);assert.equal(state.admission.namingVersion??1,namingVersion);
 const original=createState('',admissionSeed(stored.intakeSeed,2),{locale:'ko',professorGender:stored.profile.gender,professorProfile:stored.profile});
 assert.deepEqual(state.hidden,original.hidden);assert.deepEqual(state.temperament,original.temperament);assert.equal(state.seed,original.seed);
 await page.locator('#decision [data-choice=none]').click();await page.locator('#monthly-plan').waitFor();
 if(await page.locator('[data-ui=screen-guide-skip]').count())await page.locator('[data-ui=screen-guide-skip]').click();
 await page.locator('[data-ui=settings]').click();await page.locator('#admission-code').waitFor();assert.equal(await page.locator('#admission-code').inputValue(),admissionCode(stored.intakeSeed,2,namingVersion));
 await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v4')).name),names[2]);
 assert.deepEqual(errors,[]);await context.close();return {namingVersion,names,code:admissionCode(stored.intakeSeed,2,namingVersion),reload:true,traitsUnchanged:true};
}
try{
 const legacy=await run({draft:{version:1,intakeSeed:1183,selected:null,profile,professorName:'지도교수'}});assert.equal(legacy.namingVersion,1);
 const fresh=await run();assert.equal(fresh.namingVersion,2);assert.equal(new Set(fresh.names).size,3);
 const oldCode=await run({shareCode:admissionCode(1183,2)});assert.equal(oldCode.namingVersion,1);
 const newCode=await run({shareCode:admissionCode(1183,2,2)});assert.equal(newCode.namingVersion,2);assert.equal(new Set(newCode.names).size,3);
 await fs.writeFile(output+'/report.json',JSON.stringify({legacy,fresh,oldCode,newCode},null,2));console.log('Naming intake UI PASS: saved legacy draft, fresh naming v2, PM/PM2 codes, selected name, reload and unchanged student traits.');
}finally{await browser.close();}
