import test from 'node:test';
import assert from 'node:assert/strict';
import {rapportAfterChange,mergeRelationship} from '../dist/relationship.js';
import {createState,decide,simulateMonth,proposeSchedule,abilityScore,validateSave} from '../dist/engine.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
const setRapport=(s,n)=>{s.hidden.rapport=n*2-100;};

test('rapport grows linearly below 50, then continuously saturates toward 100',()=>{
 assert.equal(rapportAfterChange(20,3),23);
 assert.equal(rapportAfterChange(48,2),50);
 near(rapportAfterChange(50,2),100-50*Math.exp(-2/50));
 near(rapportAfterChange(49,3),rapportAfterChange(50,2));
 assert.ok(rapportAfterChange(50,.001)-50>.000999);
 const gain=n=>rapportAfterChange(n,3)-n;
 assert.ok(gain(50)>gain(70)&&gain(70)>gain(90));
 assert.ok(rapportAfterChange(95,20)<100);
 assert.equal(rapportAfterChange(100,20),100);
});

test('repeated positive changes compose exponentially while losses remain linear',()=>{
 let score=50;for(let i=0;i<100;i++)score=rapportAfterChange(score,.8);
 near(score,rapportAfterChange(50,80));
 assert.equal(rapportAfterChange(90,-3),87);
 assert.equal(rapportAfterChange(51,-3),48);
 assert.equal(rapportAfterChange(1,-3),0);
 assert.equal(rapportAfterChange(80,0),80);
});

test('support decisions and counseling events apply the same normalized relationship curve',()=>{
 for(const rapport of [20,49,50,85]){
  const s=createState('김민지',9);s.started=true;s.month=12;setRapport(s,rapport);
  s.pending={kind:'failure-counsel'};const before=structuredClone(s);
  const support=decide(s,'support');near(abilityScore(support,'rapport'),rapportAfterChange(rapport,2));assert.ok(validateSave(support));
  const strict=decide(s,'strict');near(abilityScore(strict,'rapport'),rapport-2);
  s.pending={kind:'event',id:'counsel-small-question'};
  near(abilityScore(decide(s,0),'rapport'),rapportAfterChange(rapport,3));
  s.pending=before.pending;assert.deepEqual(s,before);
 }
});

test('monthly schedule reports record the applied gain and preserve ordinary relationship losses',()=>{
 for(const rapport of [40,50,90]){
  const s=createState('학생',33);setRapport(s,rapport);const proposal=proposeSchedule(s);
  const n=simulateMonth(s,proposal,{proposal});
  near(n.lastReport.scheduleDiscussion.rapportChange,rapportAfterChange(rapport,.8)-rapport);
  assert.ok(validateSave(n));
  const imposed=simulateMonth(s,Array(proposal.length).fill('language'),{proposal,feedback:'harsh'});
  near(imposed.lastReport.scheduleDiscussion.rapportChange,-1.8);
 }
});

test('reading legacy relationship records never reapplies the growth curve',()=>{
 const current={rapport:70,learning:300};assert.deepEqual(mergeRelationship(current),current);
 const old={rapport:20,trust:80};assert.deepEqual(mergeRelationship(old),{rapport:50});assert.deepEqual(old,{rapport:20,trust:80});
});
