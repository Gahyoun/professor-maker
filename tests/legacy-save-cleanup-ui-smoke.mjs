import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave,migrateSave,VERSION} from '../dist/engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}),base=(process.env.GAME_URL||'http://127.0.0.1:4192/').replace(/\/$/,'');
const dir=process.env.QA_OUTPUT_DIR||'/tmp/professor-maker-legacy-cleanup';await fs.mkdir(dir,{recursive:true});
const errors=[],checks=[],key4='pm-save-v4',key3='pm-save-v3';
const fixture=(name='현재 학생',seed=217)=>{const s=createState(name,seed,{gender:'female',locale:'ko',fieldId:'050',labMode:'dry',difficulty:'realistic'});s.started=true;s.month=26;s.route='integrated';return s;};
const contexts=[];
async function prepared({state=fixture(),legacy=null,onlyLegacy=false,failLoad=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();contexts.push(context);page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/#lab');
 const raw4=JSON.stringify(state),raw3=typeof legacy==='string'?legacy:legacy===null?null:JSON.stringify(legacy);
 await page.evaluate(({raw4,raw3,onlyLegacy})=>{localStorage.clear();if(!onlyLegacy)localStorage.setItem('pm-save-v4',raw4);if(raw3!==null)localStorage.setItem('pm-save-v3',raw3);localStorage.setItem('pm-fast','true');localStorage.setItem('pm-save-unreadable','do not delete');},{raw4,raw3,onlyLegacy});
 if(failLoad)await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='pm-save-v4')throw new DOMException('QA write failure','QuotaExceededError');return original.call(this,k,v);};});
 await page.reload();await page.locator('#live-stage').waitFor();return {page,raw4,raw3};
}
try{
 const state=fixture();assert.ok(validateSave(state));
 {
  const {page}=await prepared({state,legacy:state});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),null);assert.ok(validateSave(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key4)));assert.equal(await page.evaluate(()=>localStorage.getItem('pm-save-unreadable')),'do not delete');checks.push('identical v3/v4 removed after successful canonical write');
 }
 {
  const reordered=Object.fromEntries(Object.entries(state).reverse()),{page}=await prepared({state,legacy:reordered});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),null);checks.push('equal object properties compare independently of JSON key order');
 }
 for(const [label,legacy] of [['different valid run',fixture('다른 학생',219)],['different locale',{...state,locale:'en'}],['unreadable legacy','unreadable { record']]){
  const {page,raw3}=await prepared({state,legacy});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),raw3,label);checks.push(label+' preserved');
 }
 {
  const old={...state,version:3};assert.ok(migrateSave(old));const {page}=await prepared({state,legacy:old,onlyLegacy:true});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),null);assert.ok(validateSave(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key4)));checks.push('valid v3-only save migrates and commits before cleanup');
 }
 {
  const {page,raw3,raw4}=await prepared({state,legacy:state,failLoad:true});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),raw3);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key4),raw4);checks.push('initial v4 write failure preserves both original keys');
 }
 {
  const {page}=await prepared({state});await page.evaluate(()=>{localStorage.setItem('pm-save-v3',localStorage.getItem('pm-save-v4'));});await page.locator('[data-policy=work]').selectOption('core');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),null);checks.push('ordinary successful save also removes only exact duplicate');
 }
 {
  const {page}=await prepared({state});const before=await page.evaluate(()=>{const raw=localStorage.getItem('pm-save-v4');localStorage.setItem('pm-save-v3',raw);const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='pm-save-v4')throw new DOMException('QA write failure','QuotaExceededError');return original.call(this,k,v);};return {v3:raw,v4:raw};});await page.locator('[data-policy=work]').selectOption('core');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key3),before.v3);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key4),before.v4);checks.push('ordinary failed v4 save leaves duplicate v3 untouched');
 }
 {
  const incoming=fixture('불러올 학생',221),{page,raw3}=await prepared({state,legacy:incoming});const keys=[key4,key3,'pm-language','pm-letters-v3','pm-letter-passages-v1','pm-fast','pm-admission-v1'],before=await page.evaluate(keys=>keys.map(key=>[key,localStorage.getItem(key)]),keys);assert.equal(before.find(([key])=>key===key3)[1],raw3);
  await page.locator('[data-ui=settings]').click();await page.locator('#import-file').setInputFiles({name:'legacy-import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'professor-maker',version:VERSION,state:incoming,gallery:[]}))});await page.locator('#confirm-import').waitFor();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;window.__quotaTriggered=0;window.__legacyRemoved=false;Storage.prototype.setItem=function(k,v){if(k==='pm-letters-v3'&&!localStorage.getItem('pm-save-v3')&&!window.__quotaTriggered){window.__quotaTriggered++;window.__legacyRemoved=true;throw new DOMException('QA failure after successful v4 write and legacy cleanup','QuotaExceededError');}return original.call(this,k,v);};});
  await page.locator('#confirm-import').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('기존 진행을 유지했습니다.'));assert.equal(await page.evaluate(()=>window.__quotaTriggered),1);assert.equal(await page.evaluate(()=>window.__legacyRemoved),true);assert.deepEqual(await page.evaluate(keys=>keys.map(key=>[key,localStorage.getItem(key)]),keys),before);checks.push('import failure restores distinct legacy bytes after temporary duplicate cleanup');
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${dir}/results.json`,JSON.stringify({checks,errors},null,2));console.log('Legacy cleanup UI PASS: exact duplicates only, key-order equality, different run/locale and unreadable records retained, v3-only canonical commit, initial/ordinary v4 failures retain legacy data, successful save cleanup, and transactional import rollback restores original v3 bytes.');
}finally{for(const context of contexts)await context.close();await browser.close();}
