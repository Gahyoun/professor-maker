import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,simulateMonth,proposeSchedule,migrateSave,validateSave,professorAbroad,domesticAttendanceChoices,abilityScore} from '../dist/engine.js';
import {conferenceCosts} from '../dist/travel.js';
import {simulateWithRestConsent} from './play-support.mjs';

function abroad(){
 const s=createState('김민지',6,{gender:'female'});s.month=25;s.route='integrated';
 s.sabbatical={active:true,mode:'away',start:24,until:36};
 s.hidden.stamina=800;s.hidden.resilience=800;s.hidden.stress=20;
 s.plan=proposeSchedule(s);return s;
}

test('overseas sabbaticals allow only the student or neither at a domestic conference',()=>{
 const s=abroad(),before=structuredClone(s);s.pending={kind:'conference-plan',scope:'domestic'};
 assert.equal(professorAbroad(s),true);assert.deepEqual(domesticAttendanceChoices(s),['none','student']);
 for(const choice of ['professor','together'])assert.throws(()=>decide(s,choice),/Invalid conference plan/);
 for(const choice of ['none','student'])assert.equal(decide(s,choice).attendance.domestic,choice);
 delete before.pending;assert.equal(s.month,before.month);assert.equal(s.seed,before.seed);
 s.pending=null;assert.throws(()=>simulateMonth(s,s.plan,{attendance:{domestic:'professor',overseas:'none'}}),/overseas sabbatical/);
 assert.equal(s.month,before.month);assert.equal(s.seed,before.seed);
});

test('starting an overseas sabbatical and loading an older draft adjust attendance once',()=>{
 for(const [from,expected] of [['together','student'],['professor','none']]){
  const s=abroad();s.sabbatical.active=false;s.pending={kind:'sabbatical'};s.attendance.domestic=from;
  const n=decide(s,'away');assert.equal(n.attendance.domestic,expected);assert.equal(n.history.filter(h=>h.kind==='attendance-adjustment').length,1);assert.ok(validateSave(n));
  const legacy=abroad();legacy.attendance.domestic=from;const before=structuredClone(legacy),loaded=migrateSave(legacy);
  assert.equal(loaded.attendance.domestic,expected);assert.deepEqual(legacy,before);assert.ok(validateSave(loaded));
  const again=migrateSave(loaded);assert.equal(again.history.filter(h=>h.kind==='attendance-adjustment').length,1);
 }
});

test('an old together plan charges for one student and keeps the fixed conference week',()=>{
 const s=abroad(),before=structuredClone(s);assert.equal(conferenceCosts(s).domestic,2);
 const n=simulateWithRestConsent(s,s.plan,undefined,'decline');
 assert.equal(n.month,26);assert.equal(n.attendance.domestic,'student');assert.equal(n.lastReport.results[2].assigned,'conference');
 const festival=n.history.find(h=>h.kind==='conference-festival');assert.equal(festival.attendance,'student');assert.equal(festival.cost,2);
 assert.equal(n.history.filter(h=>h.kind==='attendance-adjustment').length,1);assert.ok(validateSave(n));assert.deepEqual(s,before);
});

test('rest preflight preserves the adjusted plan without repeating the adjustment on execution',()=>{
 let s=abroad();s.hidden.stamina=150;s.hidden.resilience=700;s.hidden.stress=80;
 const options={attendance:{domestic:'together',overseas:'none'}};
 s=simulateMonth(s,s.plan,options);assert.equal(s.month,25);assert.equal(s.pending.kind,'rest-request');assert.equal(s.attendance.domestic,'student');
 const before=abilityScore(s,'rapport');s=decide(s,'allow');assert.ok(abilityScore(s,'rapport')>before);
 s=simulateMonth(s,s.plan,options);assert.equal(s.month,26);assert.equal(s.lastReport.results[2].assigned,'conference');
 assert.equal(s.history.filter(h=>h.kind==='attendance-adjustment').length,1);assert.ok(validateSave(s));
});

test('home sabbaticals and the first month after returning restore all attendance options',()=>{
 const cases=[abroad(),abroad(),abroad()];cases[0].sabbatical.mode='home';cases[1].month=36;cases[2].sabbatical.active=false;
 for(const s of cases){
  assert.equal(professorAbroad(s),false);assert.deepEqual(domesticAttendanceChoices(s),['none','professor','together','student']);
  s.pending={kind:'conference-plan',scope:'domestic'};
  for(const choice of domesticAttendanceChoices(s))assert.equal(decide(s,choice).attendance.domestic,choice);
 }
});
