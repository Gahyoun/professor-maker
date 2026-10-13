import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,decide,validateSave,migrateSave,EVENTS,eventEligible,HIDDEN_RANGES,projectThresholds,projectTitle,monthlyBudgetCost} from '../dist/engine.js';
import {studentLine} from '../dist/dialogue.js';
import {studentObservation,counselingBody,counselingFollowup} from '../dist/counseling.js';
import {endingMemoryNotes} from '../dist/stories.js';
import {endingStatistics,validStatistics,renderStatistics} from '../dist/statistics.js';
import {validRecord} from '../backend/api.js';
import {analysisRecord} from '../dist/analytics.js';
import {RESEARCH_TOPICS,chooseTopic} from '../dist/research-topics.js';
import {roomDecorations,roomScene,researchText} from '../dist/lab-scene.js';
import {buildEndingCV,validateCVModel} from '../dist/cv.js';
import {attendanceCost,conferenceCosts} from '../dist/travel.js';
const rest=['rest','rest','rest','rest'];
const clone=x=>structuredClone(x);

test('stage-specific counseling covers career, academic learning and research without ranking careers',()=>{
 const s=createState('',6),counseling=EVENTS.filter(e=>e.kind==='counseling'&&e.id!=='military-hidden');assert.equal(counseling.length,10);
 for(const e of counseling){s.month=e.minMonth;s.route=s.month>=24?(e.stages?.includes('masters')?'masters':'integrated'):null;s.project.phase=2;assert.ok(eventEligible(s,e),e.id);s.pending={kind:'event',id:e.id};assert.ok(validateSave(s),e.id);
  for(const choice of [0,1]){const n=decide(s,choice);assert.ok(validateSave(n));assert.ok(n.hidden.rapport>=s.hidden.rapport);assert.ok(endingMemoryNotes(n.history).length);n.ending='leave';const cv=buildEndingCV(n);assert.ok(validateCVModel(cv.model));assert.ok(cv.model.memories.some(m=>m.title===e.title.ko));}
  assert.ok(e.options.every(o=>!Object.hasOwn(o.effects?.career??{},'papers')),'A conversation never invents an achievement');
 }
 s.pending=null;s.month=60;s.route='integrated';assert.equal(eventEligible(s,EVENTS.find(e=>e.id==='counsel-career-first')),false);assert.equal(eventEligible(s,EVENTS.find(e=>e.id==='counsel-independent')),true);
});
test('low rapport shows hesitant questions and observational narration; supportive counseling has a distinct follow-up',()=>{
 const s=createState('',6);s.month=12;s.started=true;s.hidden.rapport=-40;s.pending={kind:'event',id:'counsel-small-question'};const e=EVENTS.find(e=>e.id===s.pending.id),before=clone(s);
 assert.match(studentObservation(s),/質問|질문을 주저하는 것 같다/);assert.match(counselingBody(e,s),/조심스레/);assert.ok(studentLine(s));assert.deepEqual(s,before,'Rendering does not consume RNG or change abilities');
 s.hidden.rapport=45;assert.match(counselingBody(e,s),/학생이 먼저/);const n=decide(s,0);assert.match(counselingFollowup(n),/예제로/);assert.match(studentLine(n),/예제로/);const other=decide(s,1);assert.notEqual(studentLine(n),studentLine(other));n.month+=2;assert.equal(counselingFollowup(n),null);
});
test('counseling gets protected opportunities, respects a six-month gap and never jumps ahead of important events',()=>{
 const offered=new Set();for(let seed=1;seed<50;seed++){let s=createState('',seed);s.month=10;s.attendance.domestic='none';s=simulateMonth(s,rest);assert.equal(s.pending.kind,'event');assert.equal(EVENTS.find(e=>e.id===s.pending.id).kind,'counseling');offered.add(s.pending.id);s=decide(s,0);const next=simulateMonth(s,rest);assert.ok(![next.pending,...next.pendingQueue].filter(Boolean).some(p=>p.kind==='event'&&EVENTS.find(e=>e.id===p.id).kind==='counseling'));assert.ok(validateSave(next));}assert.ok(offered.size>=3);
 const s=createState('',6);s.month=23;const n=simulateMonth(s,rest);assert.ok([n.pending,...n.pendingQueue].some(p=>p.kind==='route'));assert.ok(![n.pending,...n.pendingQueue].some(p=>p.kind==='event'&&EVENTS.find(e=>e.id===p.id).kind==='counseling'));
});
test('rapport is the only relationship in new saves, with bounded legacy migration across saves, CV plots and analytics',()=>{
 const s=createState('',6);for(const e of EVENTS)for(const o of e.options)for(const key of Object.keys(o.effects?.hidden??{}))assert.ok(Object.hasOwn(HIDDEN_RANGES,key),`${e.id} uses only current parameters`);assert.equal(Object.hasOwn(s.hidden,'trust'),false);assert.equal(Object.hasOwn(HIDDEN_RANGES,'trust'),false);
 const old=clone(s);old.hidden.rapport=20;old.hidden.trust=80;const before=clone(old),migrated=migrateSave(old);assert.equal(migrated.hidden.rapport,50);assert.equal(Object.hasOwn(migrated.hidden,'trust'),false);assert.deepEqual(old,before);assert.ok(validateSave(migrated));assert.equal(validateSave(old),false);
 old.hidden.trust=1000;assert.equal(migrateSave(old),null);
 s.ending='leave';const stats=endingStatistics(s);stats.student={...stats.student,rapport:20,trust:80};assert.ok(validStatistics(stats));const html=renderStatistics(stats);assert.match(html,/라포·신뢰/);assert.ok(!html.includes('<th scope="row">신뢰</th>'));
 const record=analysisRecord(s);record.student={...record.student,rapport:20,trust:80};assert.ok(validRecord(record));record.student.trust=101;assert.equal(validRecord(record),false);
});
test('field-matched paraphrased topics persist through research records and CVs without institution data',()=>{
 assert.equal(RESEARCH_TOPICS.length,1343);assert.ok(RESEARCH_TOPICS.every(t=>Object.keys(t).sort().join(',')==='field,id,title,year'));
 for(const fieldId of ['050','049','061','063','075']){const s=createState('',6,{fieldId}),topic=chooseTopic(s),before=clone(s);if(topic){assert.equal(topic.field,s.professorProfile.fieldId);assert.equal(projectTitle(s),topic.title);assert.ok(chooseTopic(s,2));s.history.push({month:1,kind:'paper',projectId:1,topicId:topic.id,journal:'standard',impactFactor:1.8});s.month=24;s.ending='bachelor';s.pending=null;const cv=buildEndingCV(s);assert.ok(cv.model.projects.some(p=>p.title===researchText(topic.title,s)));assert.ok(cv.html.includes('가상 IF 1.8'));}assert.equal(before.seed,s.seed);}
 const s=createState('',6);delete s.project.topicId;assert.match(projectTitle(s),/기초 가설/,'Legacy project names do not retroactively become a real-source topic');
});
test('domestic attendance costs 20 per person, permits ordinary student schedules and leaves pooled stipends untouched for travel',()=>{
 assert.deepEqual(['none','professor','together','student'].map(m=>attendanceCost(m)),[0,2,4,2]);const s=createState('',6);s.month=1;
 for(const mode of ['none','professor','together','student']){const a=clone(s);a.attendance.domestic=mode;const p=proposeSchedule(a),joined=['together','student'].includes(mode),cost=attendanceCost(mode);assert.equal(p[2]==='conference',joined);const n=simulateMonth(a,p);assert.ok(validateSave(n));assert.equal(n.career.festivalAttendance,joined?1:0);assert.equal(n.career.conferences,0);assert.ok(Math.abs(a.lab.funds-n.lab.funds+(a.lab.pool-n.lab.pool)-monthlyBudgetCost(a)-cost)<1e-8);assert.equal(conferenceCosts(a,p).domestic,cost);if(mode==='professor')assert.ok(n.lastReport.results.every(w=>w.actual!=='conference'));}
});
test('overseas four-way attendance uses 400 per person; PI-only travel needs no student acceptance and gives no student outputs',()=>{
 assert.deepEqual(['none','professor','together','student'].map(m=>attendanceCost(m,true)),[0,40,80,40]);const reserved=createState('',6);reserved.month=29;assert.equal(conferenceCosts(reserved,['study','free','language','conference'],{domestic:'together',overseas:'student'}).domestic,0);const s=createState('',6);s.month=29;s.route='integrated';const attendance={domestic:'none',overseas:'professor'};
 const n=simulateMonth(s,rest,{attendance});assert.equal(n.career.conferences,0);assert.ok(n.lastReport.results.every(w=>!w.abroad));assert.equal(n.history.find(h=>h.kind==='research-travel').cost,40);assert.equal(n.attendance.overseas,'none');assert.ok(validateSave(n));const ended=clone(n);ended.ending='leave';assert.ok(!buildEndingCV(ended).model.memories.some(m=>m.title==='방학 중 해외학회'));
 assert.throws(()=>simulateMonth(s,rest,{attendance:{...attendance,overseas:'student'}}),/accepted abstract/);s.lab.funds=0;s.lab.pool=1000;const bridged=simulateMonth(s,rest,{attendance});assert.equal(bridged.month,s.month+1);assert.equal(bridged.history.find(h=>h.kind==='research-travel').cost,40);assert.ok(bridged.lastReport.borrowed>=40);assert.equal(bridged.lab.pool,1000-13.2);assert.ok(validateSave(bridged));
});
test('journal IF and conference tiers require more preparation; accepted venue metrics persist as fictional CV data',()=>{
 const s=createState('',6),base=projectThresholds(s);s.project.journal='leading';s.publication.conference='flagship';const hard=projectThresholds(s);assert.ok(hard.submission>base.submission);assert.ok(hard.conference>base.conference);
 s.month=2;s.ending='leave';s.history=[{month:1,kind:'paper',projectId:1,topicId:s.project.topicId,journal:'leading',impactFactor:8},{month:2,kind:'conference',projectId:1,tier:'flagship'}];const cv=buildEndingCV(s);assert.ok(validateCVModel(cv.model));assert.match(cv.html,/가상 IF 8/);assert.match(cv.html,/학술대회 · A/);
});
test('room furnishings vary reproducibly across students while preserving wet stock and transparent portraits',()=>{
 const combinations=new Set(),seen=new Set();for(let seed=1;seed<100;seed++){const s=createState('',seed*7919),before=clone(s),d=roomDecorations(s);assert.deepEqual(d,roomDecorations(s));assert.deepEqual(s,before);combinations.add(JSON.stringify(d));for(const [k,v] of Object.entries(d))if(v)seen.add(k);assert.match(roomScene(s),/data-props=/);}assert.ok(combinations.size>=10);for(const prop of ['fridge','kettle','plush','cot'])assert.ok(seen.has(prop));
});
