// Optional browser QA. Set PLAYWRIGHT_MODULE to an installed Playwright package.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const errors=[];
await fs.mkdir('/tmp/professor-maker-qa',{recursive:true});
try {
  const context=await browser.newContext({viewport:{width:1360,height:900}});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('pm-fast','true'));
  await page.goto(base);
  await page.locator('#start-form').waitFor();
  assert.equal(await page.locator('[data-ui="language"]').count(),0,'Korean is the current release');
  await page.locator('#student-name').fill('검증학생');
  await page.locator('select[name="gender"]').selectOption('female');
  await page.locator('#start-form button[type="submit"]').click();
  await page.locator('[data-week="0"]').waitFor();
  assert.equal(await page.locator('[data-week]').count(),4);
  assert.equal(await page.locator('[role="meter"]').count(),4,'Only faculty stats are numeric meters');
  assert.ok(await page.locator('[data-ui="advance"]').isEnabled(),'Valid default month is playable');
  await page.locator('[data-week="0"]').selectOption('study');
  await page.locator('[data-week="1"]').selectOption('experiment');
  await page.locator('[data-week="2"]').selectOption('rest');
  await page.locator('[data-week="3"]').selectOption('coffee');
  await page.locator('[data-ui="advance"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v3')).month===1);
  // Random events pause the month; resolve rather than assuming there is no event.
  if(await page.locator('[data-ui="decide"]').count())await page.locator('[data-ui="decide"]').first().click();
  await page.locator('#week-2').waitFor();
  assert.ok(await page.locator('[data-ui="advance"]').isEnabled(),'Resolving an event resumes month controls');
  assert.ok(await page.locator('#week-2').isDisabled(),'April week 3 is a fixed conference');
  assert.equal(await page.locator('#week-2').inputValue(),'conference');
  await page.locator('.month-report summary').click();
  assert.ok(!(await page.locator('.month-report').innerText()).includes('undefined'));
  await page.locator('.management-controls summary').click();
  await page.locator('[data-allocation="research"]').fill('3');
  assert.ok(await page.locator('[data-ui="advance"]').isDisabled());
  await page.reload();
  assert.equal(await page.locator('.term-count').innerText(),'1 / 96 개월','Invalid drafts do not corrupt the last valid save');
  await page.locator('.management-controls summary').click();
  for(const width of [320,390,768,1360]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>document.fonts.ready);
    const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(overflow.scroll<=width,`Overflow at ${width}px: ${overflow.scroll}`);
    await page.screenshot({path:`/tmp/professor-maker-qa/lab-${width}.png`,fullPage:true});
  }
  await page.locator('[data-ui="settings"]').click();
  await page.locator('[data-ui="export"]').click();
  await page.locator('[data-ui="close"]').click();
  await page.goto(base+'#design');
  assert.ok((await page.locator('main').innerText()).includes('통계'));
  await page.goto(base+'logos.html');
  assert.equal(await page.title(),'연구실 로고 시안 · Professor Maker');
  // A complete UI/Worker run verifies queued degree decisions and the epilogue reader.
  await page.goto(base);
  await page.evaluate(async()=>{
    const {createState}=await import('./engine.js');
    const s=createState('이준영',6,{gender:'male',professorGender:'male',locale:'ko'});s.started=true;
    localStorage.setItem('pm-save-v3',JSON.stringify(s));
    localStorage.setItem('pm-fast','true');
  });
  await page.reload();
  for(let guard=0;guard<160;guard++) {
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v3')));
    if(state.ending)break;
    if(state.pending) {
      if(state.pending.kind==='route')assert.equal(await page.locator('.student-id p').innerText(),'학부연구생','Admission should not display a PhD before a route is selected');
      if(state.pending.kind==='masters')assert.equal(await page.locator('.student-id p').innerText(),'석사과정');
      const values={event:'0',route:'integrated',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
      const before=JSON.stringify(state);
      await page.locator(`[data-ui="decide"][data-choice="${values[state.pending.kind]}"]`).click();
      await page.waitForFunction(prev=>localStorage.getItem('pm-save-v3')!==prev,before);
    } else {
      assert.ok(await page.locator('[data-ui="advance"]').isEnabled(),`Disabled after month ${state.month}`);
      await page.locator('[data-ui="advance"]').click();
      await page.waitForFunction(m=>JSON.parse(localStorage.getItem('pm-save-v3')).month>m,state.month);
    }
  }
  const final=await page.evaluate(()=>JSON.parse(localStorage.getItem('pm-save-v3')));
  assert.equal(final.month,96);
  assert.ok(final.ending&&final.ending!=='unfinished');
  await page.locator('.letter-reader').waitFor();
  assert.ok(!(await page.locator('.letter-reader').innerText()).includes('{name}'));
  await page.locator('[data-ui="close"]').click();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator('.ending-summary').waitFor();
  // Start a fresh offline game and calculate a month inside an offline module Worker.
  await page.locator('[data-ui="new"]').click();
  await page.locator('[data-ui="confirm-new"]').click();
  await page.locator('#start-form button[type="submit"]').click();
  await page.locator('[data-ui="advance"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pm-save-v3')).month===1);
  await context.setOffline(false);
  await context.close();
  assert.deepEqual(errors,[]);
  console.log('Browser smoke passed: 96-month UI/Worker run, degree decisions, letter, offline month, fixed conference, valid autosave, 320–1360px, dialogs, logos.');
} finally {await browser.close();}
