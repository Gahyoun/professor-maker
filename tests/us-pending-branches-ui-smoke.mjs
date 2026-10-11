import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createState,HIDDEN_RANGES,validateSave,studentRestRequest} from '../dist/engine.js';
import {academicWeeks} from '../dist/academic-calendar.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
const url=(process.env.GAME_URL||'http://127.0.0.1:4194/').replace(/\/$/,''),dir=process.env.QA_OUTPUT||path.resolve('../outputs/us-pending-branches');await fs.mkdir(dir,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true});
const setScore=(s,key,value)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+value*(hi-lo)/100;};
function fixture(month=26,route='integrated'){
 const s=createState('Alex Rivera',46,{locale:'en',gender:'female',fieldId:'050',labMode:'dry',difficulty:'realistic'});s.started=true;s.month=month;s.route=route;s.professorName='Prof. Morgan';s.plan=academicWeeks(s).map(()=> 'analysis');s.professor={research:85,teaching:85,admin:85,mentoring:85};s.allocation=allocateCredits({research:3,teaching:2,admin:2,mentoring:2},facultyCapacity(s).credits);s.attendance={domestic:'none',overseas:'none'};return s;
}
const cases=[];function add(label,pending,{month=26,route='integrated',configure,choices}={}){const state=fixture(month,route);configure?.(state);state.pending=pending;assert.ok(validateSave(state),label+' must be a valid save');cases.push({label,state,choices});}
add('qualification',{kind:'qual'},{month:48,choices:['exam','prepare','graduate']});
add('undergraduate-route',{kind:'route'},{month:23,route:null,choices:['masters','integrated','graduate']});
add('masters-review',{kind:'masters'},{month:48,route:'masters',choices:['continue','graduate','extend']});
for(const step of ['presentation','questions','revision','verdict'])add('phd-review-'+step,{kind:'thesis',level:'phd',step},{month:94});
add('defense',{kind:'defense'},{month:95,choices:['defend']});
add('sabbatical',{kind:'sabbatical'},{month:36,choices:['home','away']});
const tired=fixture();for(const [key,value]of Object.entries({stress:80,stamina:4,resilience:70,motivation:90,rapport:70}))setScore(tired,key,value);tired.pending={kind:'rest-request',...studentRestRequest(tired)};assert.ok(validateSave(tired));cases.push({label:'critical-rest-request',state:tired,choices:['allow','decline']});
add('borrowing-warning',{kind:'lab-warning',reason:'funding',mode:'borrowing',keys:[],streak:2,remainingMonths:1},{configure:s=>{s.lab.funds=0;s.lab.debt=110;s.labRisk.lastEvaluatedMonth=s.month;s.labRisk.funding=2;s.labRisk.fundingMode='borrowing';},choices:['review','acknowledge']});
add('faculty-warning',{kind:'lab-warning',reason:'faculty',keys:['admin'],streak:2,remainingMonths:1},{configure:s=>{s.professor.admin=0;s.labRisk.lastEvaluatedMonth=s.month;s.labRisk.faculty.admin=2;},choices:['review','acknowledge']});
for(const id of ['grant-selected','grant-rejected','presentation-award'])add(id,{kind:'monthly-issue',id});
add('external-admission',{kind:'external-admission',level:'masters'},{choices:['encourage','remain']});
add('graduate-exam',{kind:'academic-exam',level:'graduate',examType:'기말고사'},{choices:['support','routine']});
add('workshop',{kind:'workshop-plan'});
const report={screens:[],errors:[]};
try{
 for(const item of cases){const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',error=>report.errors.push({case:item.label,error:error.message}));await page.goto(url+'/en.html#lab');await page.locator('#start-form').waitFor();
  await page.evaluate(state=>new Promise((resolve,reject)=>{const open=indexedDB.open('pm-us-edition-v1',1);open.onsuccess=()=>{const db=open.result,tx=db.transaction('values','readwrite'),store=tx.objectStore('values');store.clear();store.put(JSON.stringify(state),'pm-us-save-v4');store.put('true','pm-us-fast');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=tx.onabort=()=>reject(tx.error);};open.onerror=()=>reject(open.error);}),item.state);await page.reload();await page.locator('#decision').waitFor();
  if(item.choices)assert.deepEqual(await page.locator('#decision [data-choice]').evaluateAll(buttons=>buttons.map(b=>b.dataset.choice)),item.choices);
  for(const width of [320,390,1360]){await page.setViewportSize({width,height:900});if(width>=900)await page.locator('.student-details').evaluate(el=>el.open=true);
   const residuals=await page.evaluate(()=>{const out=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement.closest('script,style,.edition-link,[data-user-text]'))continue;if(node.parentElement.getClientRects().length&&/[가-힣]/.test(node.nodeValue))out.push(node.nodeValue.trim());}for(const el of document.querySelectorAll('[aria-label],[title],[placeholder],optgroup[label]')){if(el.closest('.edition-link,[data-user-text]'))continue;for(const attr of ['aria-label','title','placeholder','label']){const text=el.getAttribute(attr);if(text&&/[가-힣]/.test(text))out.push(attr+': '+text);}}for(const el of document.querySelectorAll('body *')){if(!el.getClientRects().length)continue;for(const pseudo of ['::before','::after']){const text=getComputedStyle(el,pseudo).content;if(text&&/[가-힣]/.test(text))out.push('CSS '+text);}}return [...new Set(out)];});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),choices=[];for(const button of await page.locator('#decision [data-choice]:not(:disabled)').all()){await button.scrollIntoViewIfNeeded();const rect=await button.boundingBox(),hittable=await button.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el;});assert.ok(rect.height>=44&&hittable,item.label+' '+width);choices.push(await button.getAttribute('data-choice'));}
   report.screens.push({case:item.label,width,residuals,overflow,choices});assert.equal(overflow,false,item.label+' '+width);if(width===390){await page.locator('#decision').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,item.label+'.png')});}
  }await context.close();console.log(item.label+' checked');
 }
 await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));const leaks=report.screens.filter(row=>row.residuals.length);assert.deepEqual(leaks,[]);assert.deepEqual(report.errors,[]);console.log(JSON.stringify({screens:report.screens.length,dir,errors:report.errors}));
}finally{await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));await browser.close();}
