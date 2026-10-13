import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,HIDDEN_RANGES,monthlyBudgetCost} from '../dist/engine.js';
import {planReadiness,recoveryPlan,acceptRecoveryPlan} from '../dist/advising-plan.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
import {examWindow,weekContext} from '../dist/academic-calendar.js';
const fixture=()=>{const s=createState('검증',1);s.started=true;s.allocation=allocateCredits(s.allocation,facultyCapacity(s).credits);return s;};
test('stipend reserves stay restricted while automatic borrowing keeps a cash-short plan playable',()=>{
 const s=fixture();s.lab.funds=0;s.lab.pool=1000;s.lab.creditEnabled=false;
 const before=JSON.stringify(s),status=planReadiness(s);
 assert.deepEqual(status.blockers,[]);assert.ok(status.estimatedBorrowing>0);assert.ok(status.ready);
 const next=simulateMonth(s,s.plan);assert.ok(next.lab.debt>0);assert.equal(JSON.stringify(s),before);assert.equal(next.lab.pool,1000-7.8);
 s.lab.creditEnabled=true;assert.ok(planReadiness(s).ready);assert.doesNotThrow(()=>simulateMonth(s,s.plan));
});
test('the exact cost boundary agrees with simulation admission for wet and dry plans',()=>{
 for(const mode of ['wet','dry']){
  const s=fixture();s.professorProfile.labMode=mode;s.plan=s.plan.map(()=> 'experiment');s.lab.pool=0;s.lab.funds=monthlyBudgetCost(s);
  assert.ok(planReadiness(s).ready);assert.doesNotThrow(()=>simulateMonth(s,s.plan));
  s.lab.funds-=.01;assert.equal(planReadiness(s).ready,true);assert.ok(Math.abs(planReadiness(s).estimatedBorrowing-.01)<1e-8);assert.ok(simulateMonth(s,s.plan).lab.debt>0);
 }
});
test('an unavailable funding call is distinguished from insufficient money',()=>{
 const s=fixture();s.month=1;s.plan=proposeSchedule(s);s.facultyAction='funding';
 const status=planReadiness(s);assert.deepEqual(status.blockers,['grant-call']);assert.ok(status.cost<s.lab.funds);
});
test('accepting requested recovery preserves other choices and fixed commitments',()=>{
 for(const month of [1,3,5,9,24]){
  const s=fixture();s.month=month;if(month>=24)s.route='integrated';
  for(const [key,value] of Object.entries({stress:10,stamina:15,resilience:70})){
   const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+value*(hi-lo)/100;
  }
  s.plan=proposeSchedule(s).map(id=>id==='recovery'?'study':id);const before=JSON.stringify(s),status=recoveryPlan(s),agreed=acceptRecoveryPlan(s);
  assert.equal(status.request.weeks,2);assert.ok(status.missing.length>0);
  for(let i=0;i<agreed.length;i++){
   if(status.offered.includes(i))assert.equal(agreed[i],'recovery');else assert.equal(agreed[i],s.plan[i]);
   if(examWindow(s,i,agreed.length)||weekContext(s,i,agreed.length).conference)assert.equal(agreed[i],s.plan[i]);
  }
  assert.equal(JSON.stringify(s),before);s.plan=agreed;assert.deepEqual(recoveryPlan(s).missing,[]);
 }
});
