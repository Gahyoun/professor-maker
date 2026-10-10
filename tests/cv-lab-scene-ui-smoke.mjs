import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildEndingCV,renderCV,validateCVModel,CV_TEMPLATES} from '../dist/cv.js';
import {renderLabScene} from '../dist/lab-scene.js';
import {createCVLabScene} from '../dist/cv-lab-scene.js';
import {createState,validateSave,EVENTS,abilityScore} from '../dist/engine.js';
import {DISCIPLINES,getDiscipline} from '../dist/disciplines.js';
import {endingStatistics} from '../dist/statistics.js';
import {endingEvidence} from '../dist/ending-evidence.js';
import {prepareLetterPassages,collectSeenPassageIds,LETTER_PASSAGES_KEY} from '../dist/letter-archive.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:4182/';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=process.env.QA_OUTPUT||path.resolve(root,'../outputs/pm4160-cv-lab-scene-qa');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[],report={geometry:[],templates:[],storage:null};
const saveKey='pm-save-v4',galleryKey='pm-letters-v3',prefix='data:image/svg+xml;base64,';
const textPrefix='data:image/svg+xml,',decode=image=>image.startsWith(textPrefix)?decodeURIComponent(image.slice(textPrefix.length)):Buffer.from(image.slice(prefix.length),'base64').toString('utf8');
const samples=JSON.parse(await fs.readFile(path.join(root,'docs/ending-audit-10000-samples.json'),'utf8')).samples.map(x=>x.state).filter(s=>s.ending!=='gameover');
function entry(state,id){
 return prepareLetterPassages({id,ending:state.ending,fieldId:state.professorProfile.fieldId,labMode:state.professorProfile.labMode,name:state.name,date:'2026-10-10',month:state.month,relationship:abilityScore(state,'rapport')>=70?'close':abilityScore(state,'rapport')>=40?'reserved':'distant',career:{...state.career},endingReason:state.endingReason,statistics:endingStatistics(state),evidence:endingEvidence(state),memories:state.history.filter(h=>h.kind==='event'&&EVENTS.some(e=>e.id===h.id&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<e.options.length)).slice(-16).map(h=>({kind:'event',id:h.id,choice:h.choice,month:h.month})),cv:buildEndingCV(state).model});
}
const archiveId=s=>`${s.creationSeed??s.seed}-${s.month}-${s.ending}`;
const ranked=samples.map(state=>({state,record:entry(state,archiveId(state))})).sort((a,b)=>JSON.stringify(b.record).length-JSON.stringify(a.record).length);
const rich=ranked[0].state,record=ranked[0].record;
// Include actual visual progression: rich stocks and all three displayed awards.
let maximum=null,sceneCases=0;
function inspectScene(seed,fieldId,labMode,month=96){
 const state=createState('검증',seed,{professorProfile:{gender:'female',age:38,fieldId,labMode,institution:'national'}});
 state.month=month;state.lab.funds=200;state.lab.budget.environment=3;state.career.awards=3;
 const scene=createCVLabScene(state);sceneCases++;
 if(!maximum||scene.image.length>maximum.scene.image.length)maximum={state,scene};
 return scene;
}
for(const field of DISCIPLINES)for(const mode of field.labModes)for(const seed of [16,42,7919,20533967])inspectScene(seed,field.id,mode);
const maximumField=maximum.scene.fieldId,maximumMode=maximum.scene.labMode;
for(let seed=1;seed<=512;seed++)inspectScene(seed,maximumField,maximumMode);
const maximumWinter=maximum;
for(const field of DISCIPLINES)for(const mode of field.labModes)for(const month of [1,4,7,10])inspectScene(16,field.id,mode,month);
assert.ok(maximum.scene.image.length<50000,`Largest scene ${maximum.scene.image.length}`);
report.maximum={cases:sceneCases,imageLength:maximum.scene.image.length,fieldId:maximum.scene.fieldId,labMode:maximum.scene.labMode,seed:maximum.state.creationSeed,month:maximum.state.month};
// Keep all real chronology, publications, statistics and memories. Only combine
// the largest legitimate frozen scene with the matching CV field and mode.
record.cv.field=getDiscipline(maximumWinter.scene.fieldId).label;record.cv.labScene=maximumWinter.scene;
record.fieldId=maximumWinter.scene.fieldId;record.labMode=maximumWinter.scene.labMode;
assert.ok(validateCVModel(record.cv));
const gallery=Array.from({length:40},(_,i)=>({...structuredClone(record),id:i===0?archiveId(rich):`capacity-${i}`}));
const payload={format:'professor-maker',version:4,state:rich,gallery,seenPassageIds:collectSeenPassageIds(gallery)};
const pretty=JSON.stringify(payload,null,2);
assert.ok(validateSave(rich));assert.ok(Buffer.byteLength(pretty)<4500000);
await fs.writeFile(path.join(output,'rich-40-save.json'),pretty);
try{
 const context=await browser.newContext({viewport:{width:1360,height:900},acceptDownloads:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 // Compare exact source SVG and the compact snapshot in the browser's own rasterizer.
 for(const [fieldId,mode]of [['058','wet'],['107','wet'],['050','dry'],['090','dry'],['073','dry']])for(const seed of [16,7919]){
  const state=createState('검증',seed,{professorProfile:{gender:'female',age:38,fieldId,labMode:mode,institution:'national'}});state.month=96;
  state.lab.funds=200;state.lab.budget.environment=3;state.career.awards=3;
  const scene=createCVLabScene(state),svg=renderLabScene({...state,month:95,visualMonth:95,pending:null},{actual:'idle'},0,{idle:true,student:false});
  const original=prefix+Buffer.from(svg).toString('base64');
  const metrics=await page.evaluate(async({original,compact})=>{
   const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Image decode failed'));img.src=src;});
   const images=await Promise.all([load(original),load(compact)]),pixels=images.map(img=>{const c=document.createElement('canvas');c.width=600;c.height=360;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return ctx.getImageData(0,0,600,360).data;});
   let total=0,changed=0,max=0;for(let i=0;i<pixels[0].length;i+=4){let delta=0;for(let j=0;j<4;j++)delta+=Math.abs(pixels[0][i+j]-pixels[1][i+j]);total+=delta;max=Math.max(max,delta);if(delta)changed++;}
   return {meanChannelDifference:total/pixels[0].length,changedPixels:changed,totalPixels:600*360,maxPixelDifference:max};
  },{original,compact:scene.image});
  assert.ok(metrics.meanChannelDifference<0.6,`${fieldId}/${mode}/${seed}: ${JSON.stringify(metrics)}`);
  report.geometry.push({fieldId,mode,seed,imageLength:scene.image.length,...metrics});
 }
 await page.goto(base+'#lab');
 await page.evaluate(({payload,saveKey,galleryKey,passagesKey})=>{localStorage.clear();localStorage.setItem(saveKey,JSON.stringify(payload.state));localStorage.setItem('pm-save-v3',JSON.stringify(payload.state));localStorage.setItem('pm-legacy-settings',JSON.stringify({theme:'original',help:true}));localStorage.setItem(galleryKey,JSON.stringify(payload.gallery));localStorage.setItem(passagesKey,JSON.stringify(payload.seenPassageIds));localStorage.setItem('pm-fast','true');},{payload,saveKey,galleryKey,passagesKey:LETTER_PASSAGES_KEY});
 await page.reload();await page.locator('.ending-summary').waitFor();
 await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===40,galleryKey);
 assert.match(await page.locator('.save-status').innerText(),/자동 저장 켜짐/);
 const stored=await page.evaluate(({saveKey,galleryKey})=>({state:localStorage.getItem(saveKey),gallery:localStorage.getItem(galleryKey),keys:Object.keys(localStorage).map(key=>({key,characters:localStorage.getItem(key).length}))}),{saveKey,galleryKey});
 assert.equal(JSON.parse(stored.gallery).length,40);assert.equal(JSON.parse(stored.gallery)[0].cv.labScene.image,record.cv.labScene.image);
 report.storage={richest:rich.name,fieldId:record.fieldId,historyEntries:rich.history.length,modelCharacters:JSON.stringify(record.cv).length,imageLength:record.cv.labScene.image.length,galleryUTF16Bytes:stored.gallery.length*2,stateUTF16Bytes:stored.state.length*2,totalUTF16Bytes:stored.keys.reduce((n,k)=>n+(k.key.length+k.characters)*2,0),prettyExportUTF8Bytes:Buffer.byteLength(pretty),keys:stored.keys};
 assert.ok(report.storage.totalUTF16Bytes<5*1024*1024-200000,`Insufficient localStorage headroom: ${report.storage.totalUTF16Bytes}`);
 await page.locator('[data-ui=view-current-cv]').click();await page.locator('.cv-lab-image').waitFor();
 await page.waitForFunction(()=>{const img=document.querySelector('.cv-lab-image');return img?.complete&&img.naturalWidth===600&&img.naturalHeight===360;});
 const initialImage=await page.locator('.cv-lab-image').getAttribute('src');assert.equal(initialImage,record.cv.labScene.image);
 for(const width of [320,1360]){
  await page.setViewportSize({width,height:900});await page.locator('.cv-lab-record').scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.cv-lab-record').screenshot({path:path.join(output,`lab-record-${width}.png`)});
 }
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-ui=download-cv]').click();const download=await downloadPromise;
 const standalone=await fs.readFile(await download.path(),'utf8');const escapedImage=initialImage.replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));assert.ok(standalone.includes(escapedImage));assert.ok(standalone.includes("img-src data:"));await download.saveAs(path.join(output,'frozen-cv.html'));
 const cvPage=await context.newPage();cvPage.on('pageerror',e=>errors.push(e.message));
 await cvPage.setContent(standalone);await cvPage.waitForFunction(()=>document.querySelector('.cv-lab-image')?.naturalWidth===600);
 await cvPage.pdf({path:path.join(output,'frozen-cv.pdf'),format:'A4',printBackground:true});
 const css=await fs.readFile(path.join(root,'dist/cv.css'),'utf8');
 for(const template of CV_TEMPLATES){
  const model={...structuredClone(record.cv),templateId:template.id};
  await cvPage.setContent(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:8px}${css}</style><body>${renderCV(model)}</body></html>`);
  await cvPage.waitForFunction(()=>document.querySelector('.cv-lab-image')?.naturalWidth===600);
  for(const width of [320,1360]){await cvPage.setViewportSize({width,height:900});assert.ok(await cvPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${template.id}/${width}`);}
  await cvPage.setViewportSize({width:703,height:1030});await cvPage.emulateMedia({media:'print'});
  const layout=await cvPage.evaluate(()=>({summaryHeight:document.querySelector('.cv-summary').getBoundingClientRect().height,labInsideSummary:!!document.querySelector('.cv-summary .cv-lab-record'),catalogBreak:getComputedStyle(document.querySelector('.cv-publication-catalog')).breakBefore}));
  assert.ok(layout.summaryHeight<1030,`${template.id}: ${JSON.stringify(layout)}`);assert.equal(layout.labInsideSummary,false);assert.equal(layout.catalogBreak,'page');report.templates.push({id:template.id,...layout});
  await cvPage.pdf({path:path.join(output,`cv-${template.id}.pdf`),format:'A4',printBackground:true});await cvPage.emulateMedia({media:'screen'});
 }
 await cvPage.close();await page.locator('[data-ui=close]').click();await page.reload();
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))[0].cv.labScene.image,galleryKey),initialImage);
 await page.locator('[data-ui=settings]').click();const exportPromise=page.waitForEvent('download');await page.locator('[data-ui=export]').click();const exported=await exportPromise,exportedData=JSON.parse(await fs.readFile(await exported.path(),'utf8'));
 assert.equal(exportedData.gallery.length,40);assert.equal(exportedData.gallery[0].cv.labScene.image,initialImage);
 const exportedJSON=JSON.stringify(exportedData,null,2);report.storage.actualExportUTF8Bytes=Buffer.byteLength(exportedJSON);assert.ok(report.storage.actualExportUTF8Bytes<4500000);
 await page.locator('#import-file').setInputFiles({name:'roundtrip-40.json',mimeType:'application/json',buffer:Buffer.from(exportedJSON)});await page.locator('#confirm-import').click();
 await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='저장 파일을 불러왔습니다.');
 assert.match(await page.locator('.save-status').innerText(),/자동 저장 켜짐/);assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))[0].cv.labScene.image,galleryKey),initialImage);
 // Simulate quota exhaustion only on the two gallery persistence attempts.
 // The third attempt restores the original values during transaction rollback.
 await page.evaluate(()=>{location.hash='letters';});await page.waitForFunction(()=>document.body.dataset.view==='letters');
 const transactionKeys=[saveKey,'pm-language',galleryKey,LETTER_PASSAGES_KEY,'pm-fast'];
 const transactionBefore=await page.evaluate(keys=>({hash:location.hash,values:keys.map(key=>[key,localStorage.getItem(key)])}),transactionKeys);
 const rejected=structuredClone(exportedData);rejected.state.name='보관 실패 확인';assert.ok(validateSave(rejected.state));
 await page.locator('[data-ui=settings]').click();await page.locator('#import-file').setInputFiles({name:'quota-rejection.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(rejected))});await page.locator('#confirm-import').waitFor();
 await page.evaluate(key=>{
  const original=Storage.prototype.setItem;window.__restoreCVSetItem=()=>{Storage.prototype.setItem=original;};window.__cvQuotaFailures=0;window.__cvImportToasts=[];
  new MutationObserver(()=>window.__cvImportToasts.push(document.querySelector('#toast').textContent)).observe(document.querySelector('#toast'),{childList:true,subtree:true,characterData:true});
  Storage.prototype.setItem=function(k,v){if(k===key&&window.__cvQuotaFailures<2){window.__cvQuotaFailures++;throw new DOMException('QA quota boundary','QuotaExceededError');}return original.call(this,k,v);};
 },galleryKey);
 await page.locator('#confirm-import').click();await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('기존 진행을 유지했습니다.'));
 assert.equal(await page.evaluate(()=>window.__cvQuotaFailures),2);
 assert.deepEqual(await page.evaluate(keys=>({hash:location.hash,values:keys.map(key=>[key,localStorage.getItem(key)])}),transactionKeys),transactionBefore);
 assert.equal(await page.evaluate(()=>window.__cvImportToasts.some(text=>text==='저장 파일을 불러왔습니다.')),false);
 await page.evaluate(()=>window.__restoreCVSetItem());assert.match(await page.locator('.save-status').innerText(),/자동 저장 켜짐/);
 await page.locator('[data-ui=settings]').click();const rollbackExportPromise=page.waitForEvent('download');await page.locator('[data-ui=export]').click();const rollbackExport=await rollbackExportPromise,rollbackData=JSON.parse(await fs.readFile(await rollbackExport.path(),'utf8'));
 assert.deepEqual(rollbackData.state,JSON.parse(transactionBefore.values.find(([key])=>key===saveKey)[1]));assert.deepEqual(rollbackData.gallery,JSON.parse(transactionBefore.values.find(([key])=>key===galleryKey)[1]));assert.deepEqual(rollbackData.seenPassageIds,JSON.parse(transactionBefore.values.find(([key])=>key===LETTER_PASSAGES_KEY)[1]));
 await page.locator('[data-ui=close]').click();report.quotaRollback={injectedFailures:2,preservedKeys:transactionKeys,hashPreserved:true,statePreserved:true,galleryPreserved:true,seenPassagesPreserved:true,noSuccessToast:true};
 const before=await page.evaluate(({saveKey,galleryKey})=>[localStorage.getItem(saveKey),localStorage.getItem(galleryKey)],{saveKey,galleryKey});
 for(const replacement of ['<script>window.__cvXss=1</script>','<foreignObject><div>HTML</div></foreignObject>','<image href="https://example.com/pixel"/>','<g onload="window.__cvXss=1"/>']){
  const invalid=structuredClone(exportedData),svg=decode(initialImage);invalid.gallery[0].cv.labScene.image=prefix+Buffer.from(svg.replace('</svg>',replacement+'</svg>')).toString('base64');
  await page.locator('[data-ui=settings]').click();await page.locator('#import-file').setInputFiles({name:'invalid-scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('유효한 월간'));
  assert.equal(await page.locator('#confirm-import').count(),0);assert.equal(await page.evaluate(()=>window.__cvXss),undefined);
  assert.deepEqual(await page.evaluate(({saveKey,galleryKey})=>[localStorage.getItem(saveKey),localStorage.getItem(galleryKey)],{saveKey,galleryKey}),before);
  await page.locator('[data-ui=close]').click();
 }
 await context.close();assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));console.log('CV lab scene smoke passed: geometry, 40 rich archives, persistence/export/import, malicious SVG rejection, 320/1360 layouts, standalone HTML/PDF and five one-page summaries.');
}finally{await browser.close();}
