import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createState,validateSave} from '../dist/engine.js';
import {migrateLetterGallery,LETTER_PASSAGES_KEY} from '../dist/letter-archive.js';
import {reviewPages} from '../dist/ending-review.js';
const data=JSON.parse(await fs.readFile(new URL('../dist/ending-review-data.json',import.meta.url),'utf8'));
const legacy=data.records.filter(r=>r.ending==='true').slice(0,2).reverse().map(r=>{const copy={...r,date:'2026-10-10'};delete copy.passageIds;return copy;});
const expected=migrateLetterGallery(legacy),state=createState('저장 검토',7919);state.started=true;assert.ok(validateSave(state));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/#letters');
 await page.evaluate(({state,legacy,key})=>{localStorage.setItem('pm-save-v4',JSON.stringify(state));localStorage.setItem('pm-letters-v3',JSON.stringify(legacy));localStorage.removeItem(key);},{state,legacy,key:LETTER_PASSAGES_KEY});await page.reload();
 const readArchive=()=>page.evaluate(key=>({gallery:JSON.parse(localStorage.getItem('pm-letters-v3')),seenPassageIds:JSON.parse(localStorage.getItem(key))}),LETTER_PASSAGES_KEY);
 assert.deepEqual(await readArchive(),expected,'Legacy letters migrate oldest first in the browser');
 await page.locator(`[data-ui=read-entry][data-entry="${legacy[0].id}"]`).click();
 const pages=reviewPages(expected.gallery[0]);
 for(let i=0;i<pages.length;i++){
  const actual=await page.locator('#modal .letter-paper').innerText();
  assert.equal(actual.replace(/\s+/g,' ').trim(),pages[i].replace(/\s+/g,' ').trim());
  if(i<pages.length-1)await page.locator('[data-ui=next-page]').click();
 }
 await page.locator('[data-ui=close]').click();await page.locator('[data-ui=settings]').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('#modal [data-ui=export]').click();const download=await downloadEvent;
 const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.deepEqual(exported.gallery,expected.gallery);assert.deepEqual(exported.seenPassageIds,expected.seenPassageIds);assert.deepEqual(exported.state,state);
 await page.reload();assert.deepEqual(await readArchive(),expected,'Reload preserves the selected IDs');
 const other=await browser.newContext({viewport:{width:1360,height:960},serviceWorkers:'block',reducedMotion:'reduce'}),otherPage=await other.newPage();otherPage.on('pageerror',e=>errors.push(e.message));await otherPage.goto('http://127.0.0.1:4173/#journal');
 await otherPage.locator('#journal-import-file').setInputFiles({name:'saved-letters.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await otherPage.locator('#confirm-import').click();await otherPage.waitForFunction(()=>location.hash==='#lab');
 const imported=await otherPage.evaluate(key=>({gallery:JSON.parse(localStorage.getItem('pm-letters-v3')),seenPassageIds:JSON.parse(localStorage.getItem(key))}),LETTER_PASSAGES_KEY);assert.deepEqual(imported,expected);
 await otherPage.goto('http://127.0.0.1:4173/#journal');
 await otherPage.locator('#journal-import-file').setInputFiles({name:'invalid-ids.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,seenPassageIds:['not-a-known-passage']}))});
 await otherPage.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('유효한'));assert.equal(await otherPage.locator('#confirm-import').isVisible(),false);assert.deepEqual(await otherPage.evaluate(key=>JSON.parse(localStorage.getItem(key)),LETTER_PASSAGES_KEY),expected.seenPassageIds);
 assert.deepEqual(errors,[]);console.log('Letter content UI passed: legacy migration, stable full letter, reload, JSON export/import and malformed-ID rejection.');await other.close();await context.close();
}finally{await browser.close();}
