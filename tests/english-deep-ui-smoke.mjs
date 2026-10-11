import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.QA_OUTPUT||path.resolve(fileURLToPath(new URL('../../outputs/pm4200-local',import.meta.url)));
const base=(process.env.GAME_URL||'http://127.0.0.1:4194/').replace(/\/?$/,'/');
const {generateEnglishDeepFixture}=await import('./english-play-support.mjs');
const fixtures=generateEnglishDeepFixture();
const {state,record,journalState,storyState}=fixtures,errors=[],scans=[],geometry=[],exports=[];
await fs.mkdir(output,{recursive:true});
await fs.writeFile(path.join(output,'english-run-fixture.json'),JSON.stringify(fixtures,null,2));
const browser=await chromium.launch({headless:true});
async function seed(page,run,hash='lab',gallery=[record]){
 await page.goto(base+'en.html#'+hash);
 await page.evaluate(async({run,gallery})=>{await new Promise((resolve,reject)=>{const open=indexedDB.open('pm-us-edition-v1',1);open.onupgradeneeded=()=>open.result.createObjectStore('values');open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('values','readwrite'),store=tx.objectStore('values');store.clear();store.put(JSON.stringify(run),'pm-us-save-v4');store.put(JSON.stringify(gallery),'pm-us-letters-v3');store.put('true','pm-us-fast');store.put(JSON.stringify(['4.20.0']),'pm-us-release-notes-v1');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});},{run,gallery});
 await page.reload();await page.locator('#main').waitFor();
}
async function scan(page,screen,width){
 const data=await page.evaluate(()=>({visible:document.body.innerText.replace('한국어', '').split('\n').filter(t=>/[가-힣]/.test(t.trim())).map(t=>t.trim()),aria:[...document.querySelectorAll('[aria-label]')].filter(el=>el.getBoundingClientRect().width&&el.getBoundingClientRect().height).map(el=>el.getAttribute('aria-label')).filter(t=>/[가-힣]/.test(t)),overflow:document.documentElement.scrollWidth>innerWidth}));
 scans.push({screen,width,...data});return data;
}
async function closeModal(page){await page.locator('#modal [data-ui=close]').first().click();}
try{
 for(const width of [320,390,1360]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // A real pending main-story scene from the generated English run.
  await seed(page,storyState);await page.locator('#decision').waitFor();await scan(page,'main-story',width);await page.locator('#decision').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`english-main-story-${width}.png`)});
  // The live journal uses actual historical outcomes, not invented event entries.
  await seed(page,journalState,'journal');await page.locator('.journal-list').waitFor();await scan(page,'historical-journal',width);await page.screenshot({path:path.join(output,`english-journal-${width}.png`)});
  await seed(page,state);await page.locator('.ending-summary').waitFor();await scan(page,'ending-summary',width);
  await page.locator('[data-ui=read-current]').click();await page.locator('.letter-reader').waitFor();
  let pages=0;
  while(true){await scan(page,`ending-letter-${pages+1}`,width);if(pages===0||pages===3)await page.screenshot({path:path.join(output,`english-ending-${pages+1}-${width}.png`)});pages++;const next=page.locator('[data-ui=next-page]');if(!await next.count())break;await next.click();if(pages>20)throw new Error('Reader loop');}
  await closeModal(page);
  // Open the collected letter from its actual details list.
  await page.goto(base+'en.html#letters');await page.locator('.mail-list').waitFor();await scan(page,'letters-list',width);await page.locator('[data-ui=read-entry]').first().click();await page.locator('.letter-reader').waitFor();await scan(page,'letters-detail',width);await closeModal(page);
  await page.locator('[data-ui=record-cv]').first().click();await page.locator('.cv-document').waitFor();await page.waitForFunction(()=>document.querySelector('.cv-lab-image')?.naturalWidth===600);await scan(page,'cv-modal',width);
  const image=await page.locator('.cv-lab-image').getAttribute('src');assert.equal(image,record.cv.labScene.image);await page.locator('.cv-lab-record').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`english-cv-room-${width}.png`)});
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-ui=download-cv]').click();const download=await downloadPromise,html=await fs.readFile(await download.path(),'utf8');assert.match(html,/lang="en"/);assert.doesNotMatch(html,/[가-힣]/);assert.match(html,/@page us-cv\{size:Letter/);assert.match(html,/Y1 · Sep — Y8 · Aug/);exports.push({width,suggestedFilename:download.suggestedFilename(),bytes:Buffer.byteLength(html),frozenImageUnchanged:true});
  if(width===1360){await download.saveAs(path.join(output,'english-cv-export.html'));const cvPage=await context.newPage(),requests=[];cvPage.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await cvPage.setContent(html);await cvPage.waitForFunction(()=>document.querySelector('.cv-lab-image')?.naturalWidth===600);await cvPage.emulateMedia({media:'print'});const layout=await cvPage.evaluate(()=>({page:getComputedStyle(document.querySelector('.cv-document')).page,formHeight:document.querySelector('.cv-print-form').getBoundingClientRect().height,reportDisplay:getComputedStyle(document.querySelector('.research-report')).display,summaryDisplay:getComputedStyle(document.querySelector('.cv-summary')).display}));assert.equal(layout.page,'us-cv');assert.equal(layout.reportDisplay,'none');assert.equal(layout.summaryDisplay,'none');assert.ok(layout.formHeight>100);assert.deepEqual(requests,[]);geometry.push({width,...layout,externalRequests:0});await cvPage.screenshot({path:path.join(output,'english-cv-print-layout.png'),fullPage:true});if(process.env.CREATE_PDF==='1')await cvPage.pdf({path:path.join(output,'english-cv-letter.pdf'),format:'Letter',preferCSSPageSize:true,printBackground:true});await cvPage.close();}
  await closeModal(page);await page.reload();await scan(page,'letters-reload',width);await context.close();
 }
 const report={fixture:{seed:state.creationSeed,locale:state.locale,month:state.month,ending:state.ending,papers:state.career.papers,historyEntries:state.history.length},scans,geometry,exports,errors};await fs.writeFile(path.join(output,'english-deep-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.deepEqual(errors,[]);for(const scan of scans){assert.equal(scan.overflow,false,`${scan.screen}/${scan.width}: overflow`);assert.deepEqual(scan.visible,[],`${scan.screen}/${scan.width}: visible Korean`);assert.deepEqual(scan.aria,[],`${scan.screen}/${scan.width}: Korean aria`);}
}finally{await browser.close();}
