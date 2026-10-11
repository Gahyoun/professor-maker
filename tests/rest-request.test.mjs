import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,HIDDEN_RANGES,abilityScore,proposeSchedule,simulateMonth,decide,studentRestRequest,criticalRestCause,REST_REQUEST_COOLDOWN,autonomousChoice,validateSave,migrateSave} from '../dist/engine.js';
import {academicWeeks,examWindow,weekContext} from '../dist/academic-calendar.js';
import {canTravel} from '../dist/travel.js';
import {studentLine} from '../dist/dialogue.js';
import {recoveryPlan,acceptRecoveryPlan} from '../dist/advising-plan.js';
function setScore(s,key,score){const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+score*(hi-lo)/100;}
function state({stress=80,stamina=30,resilience=70,month=26,seed=6}={}){
 const s=createState('김하늘',seed,{gender:'female',labMode:'dry'});s.started=true;s.month=month;if(month>=24)s.route='integrated';
 for(const [key,value] of Object.entries({stress,stamina,resilience}))setScore(s,key,value);
 s.attendance={domestic:'none',overseas:'none'};s.facultyAction='routine';s.plan=proposeSchedule(s);return s;
}
const request=(s,plan=s.plan,options={})=>{const n=simulateMonth(s,plan,options);assert.equal(n.pending?.kind,'rest-request');assert.equal(n.month,s.month);return n;};
const execute=(s,choice,plan=s.plan,options={})=>{const n=decide(request(s,plan,options),choice);return simulateMonth(n,n.plan,options);};
const restLine=(line,lang)=>assert.match(line,lang==='ko'?/쉬|회복|휴식/:/rest|recover|break/i);
test('ordinary requests use higher stress and low resource thresholds, severe exhaustion still asks early',()=>{
 for(const input of [{stress:79.99,stamina:18.01,resilience:12.01},{stress:80,stamina:30.01,resilience:20.01},{stress:100,stamina:80,resilience:80},{stress:0,stamina:30,resilience:20}])assert.equal(studentRestRequest(state(input)),null,JSON.stringify(input));
 for(const [input,reason] of [[{stamina:30},'physical'],[{stamina:70,resilience:20},'mental'],[{stamina:30,resilience:20},'both']])assert.deepEqual(studentRestRequest(state(input)),{weeks:1,reason,critical:false});
 for(const [input,reason] of [[{stress:0,stamina:18},'physical'],[{stress:0,stamina:70,resilience:12},'mental'],[{stress:0,stamina:0,resilience:0},'both']]){
  const s=state(input),before=JSON.stringify(s);assert.deepEqual(studentRestRequest(s),{weeks:2,reason,critical:reason==='both'});assert.equal(proposeSchedule(s).filter(x=>x==='recovery').length,2);assert.equal(JSON.stringify(s),before);
 }
 assert.equal(studentRestRequest(state({stress:84.99})).weeks,1);assert.equal(studentRestRequest(state({stress:85})).weeks,2);
});
test('request preflight preserves time, finance, RNG, outcomes and mutable plan choices',()=>{
 const s=state({month:24,stress:86}),before=structuredClone(s),plan=academicWeeks(s).map(()=> 'study');
 const options={allocation:{research:2,teaching:2,admin:2,mentoring:2},budget:{...s.lab.budget,environment:0,performance:0},feedback:'praise',facultyAction:'funding',grantApplication:{role:'co',years:5},attendance:{domestic:'none',overseas:'none'},policies:{...s.policies,study:'learn'}};
 const n=request(s,plan,options);
 assert.deepEqual(s,before);assert.equal(n.seed,s.seed);assert.deepEqual(n.history,s.history);assert.deepEqual(n.career,s.career);assert.deepEqual(n.lastReport,s.lastReport);assert.deepEqual(n.labRisk,s.labRisk);
 assert.equal(n.lab.funds,s.lab.funds);assert.equal(n.lab.pool,s.lab.pool);assert.deepEqual(n.funding,s.funding);
 assert.deepEqual(n.plan,plan);assert.deepEqual(n.allocation,options.allocation);assert.deepEqual(n.lab.budget,options.budget);assert.equal(n.feedback,'praise');assert.deepEqual(n.grantApplication,{role:'co',years:5});
 assert.ok(validateSave(n));assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(n))).grantApplication,n.grantApplication);assert.throws(()=>simulateMonth(n,plan),/pending decision/);
});
test('allow grants trust once, reserves at most two work weeks, and executes recovery without research progress',()=>{
 const s=state({stress:86}),plan=academicWeeks(s).map(()=> 'analysis'),q=request(s,plan),before=structuredClone(q),n=decide(q,'allow');
 assert.deepEqual(q,before);assert.equal(n.month,s.month);assert.ok(abilityScore(n,'rapport')>abilityScore(q,'rapport'));assert.equal(n.history.filter(h=>h.kind==='rest-request-response').length,1);
 assert.equal(n.plan.filter(id=>id==='recovery').length,2);assert.equal(n.restConsent.indices.length,2);assert.equal(studentRestRequest(n),null);assert.throws(()=>decide(n,'allow'),/No pending/);
 const changed=structuredClone(n);changed.plan=plan;const status=recoveryPlan(changed);assert.equal(status.request.weeks,2);assert.equal(status.missing.length,2);assert.deepEqual(acceptRecoveryPlan(changed),n.plan);assert.equal(changed.hidden.rapport,n.hidden.rapport);
 const done=simulateMonth(changed,plan);assert.equal(done.month,s.month+1);assert.equal(done.history.filter(h=>h.kind==='rest-request-response').length,1);
 for(const i of n.restConsent.indices){assert.equal(done.lastReport.results[i].assigned,'recovery');assert.equal(done.lastReport.results[i].progress,0);}assert.ok(validateSave(done));
});
test('decline raises stress once and retains work, while usual performance can still fail',()=>{
 const s=state(),plan=academicWeeks(s).map(()=> 'analysis'),q=request(s,plan),n=decide(q,'decline');
 assert.deepEqual(n.plan,plan);assert.ok(Math.abs(n.hidden.stress-q.hidden.stress-4*(1.4-abilityScore(q,'resilience')/125))<1e-8);assert.deepEqual(n.restConsent.indices,[]);assert.equal(studentRestRequest(n),null);assert.deepEqual(proposeSchedule(n).filter(x=>x==='recovery'),[]);
 const done=simulateMonth(n,n.plan);assert.equal(done.month,s.month+1);assert.equal(done.history.filter(h=>h.kind==='rest-request-response').length,1);assert.ok(done.lastReport.results.every(r=>r.assigned==='analysis'));
 assert.ok(done.lastReport.results.every(r=>!r.criticalRest&&r.actual!=='rest'));assert.ok(validateSave(done));
 let failure=false,allowProgress=0,declineProgress=0;
 for(let seed=1;seed<=60;seed++){const source=state({seed,stress:86}),a=execute(source,'allow',plan),d=execute(source,'decline',plan);allowProgress+=a.lastReport.progress;declineProgress+=d.lastReport.progress;failure||=d.lastReport.results.some(r=>!r.performed&&r.actual==='unfinished');}
 assert.ok(failure,'refusing recovery does not guarantee successful work');assert.ok(allowProgress<declineProgress,'accepted recovery reserves weeks that would otherwise contribute work');
});
test('answers survive queued decisions and reload, cannot replay, and a later month may ask again',()=>{
 let q=request(state());q.pendingQueue=[{kind:'conversation-topic'}];let n=decide(q,'decline');const afterResponse=structuredClone(n);assert.equal(n.pending.kind,'conversation-topic');n=decide(n,'daily');assert.equal(n.restConsent.month,n.month);assert.equal(n.history.filter(h=>h.kind==='rest-request-response').length,1);
 if(n.pending?.kind==='event')n=decide(n,0);n=migrateSave(JSON.parse(JSON.stringify(n)));assert.ok(n);assert.equal(studentRestRequest(n),null);assert.throws(()=>decide({...n,pending:{kind:'rest-request',weeks:1,reason:'physical',critical:false}},'decline'),/Invalid saved/);
 n=simulateMonth(n,n.plan);n.pending=null;n.pendingQueue=[];setScore(n,'stress',80);setScore(n,'stamina',25);setScore(n,'resilience',70);assert.equal(studentRestRequest(n),null);n.month=afterResponse.month+REST_REQUEST_COOLDOWN;assert.ok(studentRestRequest(n));assert.equal(n.history.filter(h=>h.kind==='rest-request-response').length,1);assert.ok(afterResponse.hidden.stress>80);
});
test('ordinary repeated requests wait three months after either answer and survive reload without replaying effects',()=>{
 assert.equal(REST_REQUEST_COOLDOWN,3);
 for(const choice of ['allow','decline']){
  const q=request(state()),answered=decide(q,choice),stored=migrateSave(JSON.parse(JSON.stringify(answered)));
  assert.ok(stored);assert.deepEqual(stored.restConsent,answered.restConsent);
  const history=structuredClone(stored.history),rapport=stored.hidden.rapport,stress=stored.hidden.stress;
  for(const delta of [1,2,3]){
   const n=structuredClone(stored);n.month+=delta;setScore(n,'stress',80);setScore(n,'stamina',30);setScore(n,'resilience',70);
   const before=structuredClone(n),offer=studentRestRequest(n);assert.equal(Boolean(offer),delta===3);assert.deepEqual(n,before);
   const restored=migrateSave(JSON.parse(JSON.stringify(n)));assert.equal(Boolean(studentRestRequest(restored)),delta===3);assert.deepEqual(restored.history,history);
   if(delta<3){assert.ok(!proposeSchedule(restored).includes('recovery'));const forged={...restored,pending:{kind:'rest-request',weeks:1,reason:'physical',critical:false}};assert.equal(validateSave(forged),false);}
  }
  assert.equal(stored.hidden.rapport,rapport);assert.equal(stored.hidden.stress,stress);assert.equal(stored.history.filter(h=>h.kind==='rest-request-response').length,1);
 }
});
test('a true physical or mental limit bypasses request cooldown and still pauses work after refusal',()=>{
 for(const choice of ['allow','decline'])for(const [key,cause] of [['stamina','physical'],['resilience','mental']]){
  let n=decide(request(state()),choice);n.month++;setScore(n,'stress',80);setScore(n,'stamina',80);setScore(n,'resilience',70);setScore(n,key,8);n.plan=academicWeeks(n).map(()=> 'analysis');
  const offer=studentRestRequest(n);assert.equal(offer.critical,true);assert.equal(offer.reason,cause);
  n=decide(request(n,n.plan),'decline');const done=simulateMonth(n,n.plan);assert.ok(done.lastReport.results.some(r=>r.criticalRest));assert.ok(done.history.some(h=>h.kind==='rest-warning'));assert.ok(validateSave(done));
 }
});
test('accepted requests and cooldown months preserve scheduled thesis and final-defense checkpoints',()=>{
 for(const [month,step] of [[89,'draft'],[91,'presentation'],[92,'verdict'],[95,'defense']]){
  const source=state({month,stress:80,stamina:30});source.plan=academicWeeks(source).map(()=> 'study');
  const q=request(source,source.plan),accepted=decide(q,'allow'),done=simulateMonth(accepted,accepted.plan);
  assert.equal(done.month,month+1);assert.ok(validateSave(done));
  const decisions=[done.pending,...done.pendingQueue].filter(Boolean);
  assert.ok(decisions.some(p=>step==='defense'?p.kind==='defense':p.kind==='thesis'&&p.level==='phd'&&p.step===step),`${month}: ${JSON.stringify(decisions)}`);
  const denied=decide(q,'decline');denied.month++;setScore(denied,'stress',80);setScore(denied,'stamina',30);setScore(denied,'resilience',70);
  if(denied.month<96)assert.equal(studentRestRequest(migrateSave(denied)),null);
 }
});
test('accepted rest preserves exams, newly selected domestic conferences and effective overseas travel',()=>{
 for(const month of [1,3,7,9]){const s=state({month,stress:90,stamina:20,resilience:20});s.attendance.domestic='together';const proposed=proposeSchedule(s);for(let i=0;i<proposed.length;i++)if(examWindow(s,i,proposed.length)||weekContext(s,i,proposed.length).conference)assert.notEqual(proposed[i],'recovery');}
 const s=state({month:1}),plan=['study','study','conference','study'],q=request(s,plan,{attendance:{domestic:'student',overseas:'none'}}),n=decide(q,'allow');assert.equal(n.plan[2],'conference');
 const changed=structuredClone(n);changed.attendance.domestic='none';changed.restConsent.indices=[2];changed.restConsent.weeks=1;const done=simulateMonth(changed,plan,{attendance:{domestic:'student',overseas:'none'}});assert.equal(done.lastReport.results[2].assigned,'conference');
 for(const action of ['routine','abroad_student','abroad_together']){
  const a=state({month:29,stress:86});a.travel={status:'accepted',submittedAt:28,decidedAt:29,conferenceMonth:30,projectId:1};assert.ok(canTravel(a));
  const noTravel=decide(request(a,['study','study','study','free']),'allow');assert.equal(noTravel.plan.at(-1),'recovery');
  const opts={facultyAction:action,attendance:{domestic:'none',overseas:action==='routine'?'student':'none'}},executed=simulateMonth(noTravel,noTravel.plan,opts);assert.equal(executed.lastReport.results.at(-1).abroad,true);assert.notEqual(executed.lastReport.results.at(-1).assigned,'recovery');assert.equal(executed.lastReport.results.at(-1).destination,undefined);assert.ok(validateSave(executed));
  const queued=request(a,['study','study','study','free'],opts),accepted=decide(queued,'allow');assert.notEqual(accepted.plan.at(-1),'recovery');assert.ok(!accepted.restConsent.indices.includes(3));
 }
});
test('ordinary fatigue produces unfinished work instead of forced rest; critical rest is warned with its cause',()=>{
 let unfinished=false;for(let seed=1;seed<=40;seed++){const s=state({seed,stress:10,stamina:30,resilience:70}),n=simulateMonth(s,['analysis','analysis','analysis','analysis']);for(const r of n.lastReport.results){assert.ok(r.criticalRest||r.actual!=='rest');if(r.actual==='unfinished')unfinished=true;}}assert.ok(unfinished);
 for(const [input,cause] of [[{stamina:8,resilience:70},'physical'],[{stamina:70,resilience:8},'mental'],[{stamina:8,resilience:8},'both'],[{stress:95,stamina:20,resilience:70},'stress']]){
  const s=state(input);assert.equal(criticalRestCause(s),cause);const q=request(s,['analysis','analysis','analysis','analysis']);assert.equal(q.pending.critical,true);const n=decide(q,'decline'),done=simulateMonth(n,n.plan),r=done.lastReport.results.find(r=>r.criticalRest);assert.ok(r);assert.equal(r.actual,'rest');assert.ok(['physical','mental','both','stress'].includes(r.recoveryCause));assert.equal(r.advanceWarning,true);assert.equal(r.progress,0);assert.equal(r.performed,false);assert.equal(r.deviation,'critical-rest');const warning=done.history.findIndex(h=>h.kind==='rest-warning'&&h.week===r.week&&h.reason===r.recoveryCause);assert.ok(warning>=0);assert.ok(warning<done.history.findIndex(h=>h.kind==='month'));assert.ok(validateSave(done));
 }
});
test('stress alone retains early health warning before persistent crisis ends the run',()=>{
 const s=state({stress:100,stamina:100,resilience:80});assert.equal(studentRestRequest(s),null);assert.equal(criticalRestCause(s),null);const plan=['analysis','analysis','analysis','analysis'],n=simulateMonth(s,plan,{proposal:plan,feedback:'harsh'});assert.equal(n.ending,null);assert.equal(n.crisis,1);assert.ok(n.history.some(h=>h.kind==='warning'&&h.reason==='health'&&h.cause==='stress'));
});
test('training and ended runs suppress requests, and dialogue stays qualitative',()=>{
 const training=state();training.service.trainingStartMonth=training.month;assert.equal(studentRestRequest(training),null);assert.equal(criticalRestCause(training),null);assert.ok(proposeSchedule(training).every(id=>id==='free'));const ended=state();ended.ending='leave';assert.equal(studentRestRequest(ended),null);
 for(const lang of ['ko','en'])for(const input of [{stamina:30},{stamina:70,resilience:20},{resilience:20}]){const s=state(input),before=JSON.stringify(s);restLine(studentLine(s,lang),lang);assert.doesNotMatch(studentLine(s,lang),/\b(?:80|30|20|85|18|12|999)\b/);assert.equal(JSON.stringify(s),before);}
});
test('malformed consent, request and application data is rejected; legacy saves remain valid',()=>{
 const old=state({stress:10,stamina:80});assert.ok(validateSave(old));assert.ok(migrateSave(old));const q=request(state()),a=decide(q,'allow');assert.ok(validateSave(a));
 for(const patch of [{month:a.month+1},{choice:'yes'},{weeks:3},{reason:'guess'},{indices:[0,0]},{indices:[5]},{choice:'decline',indices:[0]}]){const bad=structuredClone(a);Object.assign(bad.restConsent,patch);assert.equal(validateSave(bad),false,JSON.stringify(patch));}
 for(const patch of [{critical:undefined},{weeks:2},{reason:'mental'}]){const bad=structuredClone(q);Object.assign(bad.pending,patch);assert.equal(validateSave(bad),false);}const replay=structuredClone(a);replay.pending=q.pending;assert.equal(validateSave(replay),false);const queued=structuredClone(q);queued.pendingQueue=[q.pending];assert.equal(validateSave(queued),false);const bad=structuredClone(q);bad.grantApplication={role:'other',years:3};assert.equal(validateSave(bad),false);
});
test('autonomous rest is at most half the old seeded frequency and denial removes ordinary rest',()=>{
 const frames=[{stamina:85,stress:12,resilience:65,baseline:.452375},{stamina:50,stress:50,resilience:40,baseline:1},{stamina:70,stress:70,resilience:40,baseline:1},{stamina:35,stress:75,resilience:25,baseline:1}];
 for(const frame of frames){let rests=0,denied=0;for(let seed=1;seed<=2000;seed++){const s=state({...frame,seed,month:40});for(let i=0;i<4;i++)rests+=autonomousChoice(s,i)==='rest';s.restConsent={month:39,choice:'decline',weeks:1,reason:'physical',indices:[]};for(let i=0;i<4;i++)denied+=autonomousChoice(s,i)==='rest';}assert.ok(rests/8000<=frame.baseline/2,`${JSON.stringify(frame)}: ${rests}/8000`);assert.equal(denied,0);}
});
