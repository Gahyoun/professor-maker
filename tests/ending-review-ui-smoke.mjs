import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const reviewData=JSON.parse(await readFile(new URL('../dist/ending-review-data.json',import.meta.url),'utf8'));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1360,height:960},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4173/ending-review.html#true');
 await page.evaluate(()=>{localStorage.setItem('pm-save-v4','current-player-sentinel');localStorage.setItem('pm-letters-v3','current-gallery-sentinel');});
 const before=await page.evaluate(async()=>({save:localStorage.getItem('pm-save-v4'),gallery:localStorage.getItem('pm-letters-v3'),db:(await indexedDB.databases()).map(d=>d.name).sort()}));
 await page.locator('#review-sample').waitFor();assert.match(await page.locator('#collection-proof').innerText(),/8 \/ 8/);
 for(const width of [320,390,1360]){await page.setViewportSize({width,height:960});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow at ${width}`);}
 const trueSamples=await page.locator('#review-sample option').count();assert.ok(trueSamples>=2,'True ending reached in at least two actual major samples');
 for(const id of [...new Set(reviewData.records.map(r=>r.ending))]){
  await page.locator(`a[href="#${id}"]`).click();await page.waitForFunction(id=>document.querySelector('#ending-nav a[aria-current]')?.getAttribute('href')==='#'+id,id);
  const expected=reviewData.records.filter(r=>r.ending===id);assert.equal(await page.locator('#review-sample option').count(),expected.length);
  for(let i=0;i<expected.length;i++){await page.locator('#review-sample').selectOption(String(i));assert.match(await page.locator('.review-summary').innerText(),new RegExp(expected[i].field.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.ok((await page.locator('.letter-paper').innerText()).length>20);assert.ok(!/\{name\}|□/.test(await page.locator('.letter-paper').innerText()));}
 }
 await page.locator('a[href="#true"]').click();await page.waitForFunction(()=>document.querySelector('#ending-nav a[aria-current]')?.getAttribute('href')==='#true');
 for(let i=0;i<trueSamples;i++){await page.locator('#review-sample').selectOption(String(i));assert.match(await page.locator('.review-source').innerText(),/자동 플레이 실제 종료.*seed/);assert.ok(!/\{name\}|□/.test(await page.locator('.letter-paper').innerText()));}
 await page.locator('[data-action=full]').click();assert.match(await page.locator('.letter-paper').innerText(),/합격 소식/);assert.ok(await page.locator('.review-full-page').count()>8);await page.locator('[data-action=full]').click();
 let limit=30;while(await page.locator('[data-action=next]').count()){assert.ok(limit--);await page.locator('[data-action=next]').click();}
 assert.match(await page.locator('.letter-paper').innerText(),/교수는 어떻게 생각해요/);
 await page.screenshot({path:'/private/tmp/professor-maker-qa/pm413-true-review.png',fullPage:true});
 await page.locator('a[href="#retirement"]').click();await page.waitForFunction(()=>document.querySelector('#reader .review-source')?.textContent.includes('실제 종료 기록 8종'));assert.match(await page.locator('#reader').innerText(),/실제 종료 기록 8종.*전체 수집 완료/);
 limit=30;while(await page.locator('[data-action=next]').count()){assert.ok(limit--);await page.locator('[data-action=next]').click();}
 assert.match(await page.locator('.letter-paper').innerText(),/연구실 문을 천천히 닫는다/);assert.ok(await page.locator('.review-finish-note').count());
 await page.screenshot({path:'/private/tmp/professor-maker-qa/pm413-retirement-review.png',fullPage:true});
 const after=await page.evaluate(async()=>({save:localStorage.getItem('pm-save-v4'),gallery:localStorage.getItem('pm-letters-v3'),db:(await indexedDB.databases()).map(d=>d.name).sort()}));assert.deepEqual(after,before);assert.deepEqual(errors,[]);
 console.log(`Ending review UI passed: ${trueSamples} true-ending majors, retirement final scene, 320/390/1360px layout, no player storage changes.`);await context.close();
}finally{await browser.close();}
