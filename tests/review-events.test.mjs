import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,eventEligible,proposeSchedule,migrateSave,validateSave,calendarMonth,ACTIVITIES,EVENTS} from '../dist/engine.js';
import {adaptEventText} from '../dist/events.js';
import {DILEMMAS,monthlyIssueOptions} from '../dist/monthly-choices.js';
import {counselingBody} from '../dist/counseling.js';

const event=id=>EVENTS.find(e=>e.id===id);
const dry={professorProfile:{labMode:'dry'}};
function ready(month=30,route='integrated'){
  const s=createState('가상학생',91,{fieldId:'050',labMode:'wet'});
  s.month=month;s.started=true;s.route=month>=24?route:null;s.hidden.rapport=50;
  assert.ok(validateSave(s));return s;
}
const monthFor=(calendar,from=24)=>{for(let m=from;m<96;m++)if(calendarMonth(m,'ko')===calendar)return m;};

test('dry substitutions keep the resource and travel sentences readable (V-01, V-02, V-17)',()=>{
  const resources=adaptEventText(DILEMMAS.find(e=>e.id==='monthly-resources').body.ko,dry);
  assert.match(resources,/^공용 계산·저장 자원의 예약이 겹쳤다\./);
  assert.doesNotMatch(resources,/자원나|자원 계산/);
  const title=adaptEventText(event('poster-travel').title.ko,dry);
  assert.doesNotMatch(title,/출계산|계산 자원 고민/);
  assert.equal(adaptEventText('출장비가 빠듯하다.',dry),'출장 경비가 빠듯하다.');
  assert.equal(adaptEventText(event('equipment').options[0].label.ko,dry),'수리를 예약하고 이번 주는 문헌·결과 정리로 바꾼다');
  assert.doesNotMatch(monthlyIssueOptions(ready(),'grant-selected').map(o=>o.hint.ko).join(' '),/장비/);
});

test('qualifying-exam counseling appears only before a pass and after the doctoral route begins (V-03, A-03)',()=>{
  const e=event('counsel-qual');
  const integrated=ready(40);assert.ok(eventEligible(integrated,e));
  integrated.career.qual='passed';assert.equal(eventEligible(integrated,e),false);
  const masters=ready(38,'masters');assert.equal(eventEligible(masters,e),false,'not before the masters student continues');
  const doctoral=ready(52,'masters');assert.ok(eventEligible(doctoral,e));
});

test('master’s-only scenes are not offered to integrated students (V-04)',()=>{
  for(const id of ['counsel-master-career','master-scope']){
    assert.equal(eventEligible(ready(35,'integrated'),event(id)),false,id);
    assert.ok(eventEligible(ready(35,'masters'),event(id)),id);
  }
});

test('a chosen conversation topic never opens an unrelated counseling scene and the opening follows the question (V-05)',()=>{
  const early=ready(3);early.pending={kind:'conversation-topic'};
  const n=decide(early,'daily');
  assert.notEqual(n.pending?.id,'counsel-coursework');
  assert.equal(n.history.at(-1).kind,'conversation-topic');
  const research=ready(9);research.pending={kind:'conversation-topic'};
  assert.notEqual(decide(research,'research').pending?.id,'counsel-daily-life');
  const daily=ready(9);daily.pending={kind:'conversation-topic'};
  const opened=decide(daily,'daily');
  assert.equal(opened.pending?.id,'counsel-daily-life');
  const body=counselingBody(event('counsel-daily-life'),opened,'ko');
  assert.match(body,/^질문을 들은 학생이/);
  assert.doesNotMatch(body,/학생이 먼저 면담 주제를 꺼냈다/);
});

test('timeline premises match the screen date and stage (V-06, V-07, V-08, V-23, V-24)',()=>{
  assert.doesNotMatch(event('undergraduate-contest').body.ko,/2년차 10월/);
  const awarded=ready(30);awarded.career.conferences=1;
  const undergrad=ready(13);undergrad.project.phase=2;
  assert.equal(eventEligible(undergrad,event('poster-travel')),false);
  const graduate=ready(30);graduate.project.phase=2;assert.ok(eventEligible(graduate,event('poster-travel')));
  assert.doesNotMatch(event('top-journal').body.ko,/막 출판/);
  assert.doesNotMatch(event('grant-renewal').body.ko,/다음 연구비의 중간 보고서/);
  const bridge=ready(30);assert.ok(eventEligible(bridge,event('grant-renewal')));
  bridge.grants.status='bridge';assert.equal(eventEligible(bridge,event('grant-renewal')),false);
});

test('monthly dilemmas do not presuppose results, coursework or assistantships (V-09, V-10, A-11)',()=>{
  const s=ready(5);s.project.phase=0;
  for(const id of ['monthly-scope','monthly-validation'])assert.equal(eventEligible(s,DILEMMAS.find(e=>e.id===id)),false,id);
  s.project.phase=1;
  for(const id of ['monthly-scope','monthly-validation'])assert.ok(eventEligible(s,DILEMMAS.find(e=>e.id===id)),id);
  const draft=DILEMMAS.find(e=>e.id==='monthly-draft');assert.doesNotMatch(draft.body.ko,/초고/);
  const workload=DILEMMAS.find(e=>e.id==='monthly-workload');
  assert.doesNotMatch(workload.body.ko+workload.options.map(o=>o.label.ko).join(' '),/수업 과제|보조 업무/);
});

test('semester scenes follow the academic calendar (V-11, A-11)',()=>{
  const months=id=>[...new Set(Array.from({length:72},(_,i)=>i+24).filter(m=>{const s=ready(m);s.project.phase=2;return eventEligible(s,event(id));}).map(m=>calendarMonth(m,'ko')))].sort((a,b)=>a-b);
  assert.deepEqual(months('grading'),[1,7],'grading follows the June/December term ends');
  assert.deepEqual(months('teaching'),[3,4,5,6,9,10,11,12]);
  const vacation=ready(monthFor(1,3));assert.equal(eventEligible(vacation,event('counsel-coursework')),false);
  const term=ready(monthFor(10,3));assert.ok(eventEligible(term,event('counsel-coursework')));
});

test('scenes where the student set a boundary never offer a deadline or report request (V-14)',()=>{
  for(const id of ['illness','caregiving','support-without-assumptions','women-stem-consultation','family-career-consultation','third-year-question']){
    const labels=event(id).options.map(o=>o.label.ko).join(' ');
    assert.doesNotMatch(labels,/보완 보고|기한/,id);
    assert.ok(event(id).options.length>=3,id);
  }
});

test('scene text stays consistent with a one-student lab and in-world narration (V-15, V-18, V-19, V-20, V-22)',()=>{
  assert.doesNotMatch(event('peer-conflict').body.ko,/연구실 동료/);
  for(const id of ['teaching','undergrad-record'])assert.doesNotMatch(event(id).title.ko,/첫/,id);
  const military=event('military-hidden').body.ko;
  assert.doesNotMatch(military,/나는|내 경험/);
  assert.doesNotMatch(event('support-without-assumptions').body.ko,/성별에 관계없이/);
  assert.doesNotMatch(event('one-student-lab').body.ko,/다인원/);
});

test('service counseling is not reopened after training is scheduled (A-04)',()=>{
  const s=createState('',3,{gender:'male',professorGender:'male'});s.month=40;s.started=true;s.route='integrated';
  const e=event('military-hidden');assert.ok(eventEligible(s,e));
  s.service.trainingStartMonth=monthFor(1,41);s.service.trainingReturnMonth=s.service.trainingStartMonth+1;
  assert.equal(eventEligible(s,e),false);
});

test('doctoral students past coursework are not scheduled for exam weeks (A-02, A-12)',()=>{
  const before=ready(monthFor(6,30));before.hidden.rapport=0;
  assert.ok(proposeSchedule(before).includes('coursework'));
  const after=ready(monthFor(6,60));after.hidden.rapport=0;after.career.qual='passed';
  assert.equal(proposeSchedule(after).includes('coursework'),false);
  assert.doesNotMatch(ACTIVITIES.coursework.ko[1],/퀄/);
});

test('saves holding a scene that is no longer eligible are migrated instead of rejected',()=>{
  const s=ready(54);s.career.qual='passed';s.pending={kind:'event',id:'counsel-qual'};
  assert.equal(validateSave(s),false);
  const migrated=migrateSave(structuredClone(s));
  assert.ok(migrated&&validateSave(migrated));
  assert.notEqual(migrated.pending?.id,'counsel-qual');
});
