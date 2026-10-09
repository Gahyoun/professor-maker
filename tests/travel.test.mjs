import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,validateSave} from '../dist/engine.js';
import {abstractAcceptance,canTravel} from '../dist/travel.js';
const rest=['rest','rest','rest','rest'];
function vacation(seed=1){const s=createState('학생',seed);s.month=28;s.route='integrated';s.project.phase=2;s.hidden.stamina=800;s.hidden.motivation=85;s.hidden.rapport=70;s.hidden.rapport=70;return s;}
function accepted(){for(let seed=1;seed<100;seed++){const s=simulateMonth(vacation(seed),rest,{facultyAction:'abstract'});if(canTravel(s)){s.pending=null;s.pendingQueue=[];return s;}}throw Error('No accepted fixture');}

test('abstracts open only in graduate vacation; deterministic results precede the travel month',()=>{
  const undergraduate=createState('학생',1);undergraduate.month=4;
  assert.throws(()=>simulateMonth(undergraduate,rest,{facultyAction:'abstract'}),/Abstract submission/);
  const semester=vacation();semester.month=27;
  assert.throws(()=>simulateMonth(semester,rest,{facultyAction:'abstract'}),/Abstract submission/);
  const s=accepted();assert.equal(s.month,29);assert.equal(s.travel.submittedAt,28);assert.equal(s.travel.conferenceMonth,30);assert.equal(s.travel.decidedAt,29);assert.ok(validateSave(s));
  assert.deepEqual(simulateMonth(vacation(s.creationSeed),rest,{facultyAction:'abstract'}),simulateMonth(vacation(s.creationSeed),rest,{facultyAction:'abstract'}));
  assert.ok(s.history.some(h=>h.kind==='abstract-submission'));assert.ok(s.history.some(h=>h.kind==='abstract-decision'&&h.accepted));
});
test('acceptance increases with prepared research and luck without guaranteeing acceptance',()=>{
  const s=vacation();s.hidden.research=300;s.hidden.luck=-100;
  const base=abstractAcceptance(s,10,54),prepared=abstractAcceptance(s,54,54);assert.ok(prepared>base);
  s.hidden.luck=100;assert.ok(abstractAcceptance(s,54,54)>prepared);
  s.hidden.research=999;assert.ok(abstractAcceptance(s,54,54)<1);
  const outcomes=new Set();for(let seed=1;seed<=100;seed++)outcomes.add(simulateMonth(vacation(seed),rest,{facultyAction:'abstract'}).travel.status);
  assert.deepEqual(outcomes,new Set(['accepted','rejected']));
});
test('accepted abstracts require operating funds; attendance boosts learning more than a domestic talk',()=>{
  const s=accepted(),poor=structuredClone(s);poor.lab.funds=0;poor.lab.pool=1000;
  assert.throws(()=>simulateMonth(poor,rest,{facultyAction:'abroad_student'}),/funds/);
  let trip;for(let seed=1;seed<100;seed++){s.seed=seed;trip=simulateMonth(s,rest,{facultyAction:'abroad_student'});if(trip.travel.status==='attended')break;}
  assert.equal(trip.travel.status,'attended');assert.ok(validateSave(trip));assert.equal(trip.career.conferences,s.career.conferences+1);
  const baseline=simulateMonth(s,rest,{facultyAction:'routine'});
  assert.ok(trip.hidden.language-baseline.hidden.language>2*9.99);assert.ok(trip.hidden.social-baseline.hidden.social>3*2);
  assert.ok(trip.hidden.autonomy>baseline.hidden.autonomy);assert.ok(trip.hidden.research>baseline.hidden.research);
  assert.equal(trip.history.find(h=>h.kind==='research-travel').cost,40);
  assert.equal(trip.history.find(h=>h.kind==='conference').abroad,true);
});
test('rejected or missed abstracts cannot travel; repeated presentations do not duplicate degree credit',()=>{
  const s=accepted(),missed=simulateMonth(s,rest,{facultyAction:'routine'});assert.equal(missed.travel.status,'expired');
  assert.throws(()=>simulateMonth({...missed,pending:null,pendingQueue:[]},rest,{facultyAction:'abroad_student'}),/accepted abstract/);
  const rejected=structuredClone(s);rejected.travel.status='rejected';assert.throws(()=>simulateMonth(rejected,rest,{facultyAction:'abroad_student'}),/accepted abstract/);
  s.history.push({kind:'conference',projectId:s.travel.projectId,month:27});s.career.conferences=1;s.project.conference=true;
  const trip=simulateMonth(s,rest,{facultyAction:'abroad_student'});assert.equal(trip.career.conferences,1);
});
