import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,migrateSave,validateSave,monthlyBudgetCost,HIDDEN_RANGES} from '../dist/engine.js';
import {difficultySettings,settlementSupport} from '../dist/lab-risk.js';
import {seededInitialFunding} from '../dist/funding.js';
const plan=Array(4).fill('free');
function empty({month=2,difficulty='realistic',labMode='wet',locale='ko'}={}){
 const s=createState('정착연구비 검증',3,{difficulty,labMode,locale,gender:'female'});s.month=month;s.started=true;if(month>=24)s.route='integrated';
 s.lab.funds=0;s.lab.pool=0;s.lab.creditEnabled=false;s.lab.budget={salary:60,environment:0,performance:0,publicity:0};s.attendance={domestic:'none',overseas:'none'};s.plan=[...plan];return s;
}

test('standard mode gets a finite smaller two-year buffer without changing initial seeded funding',()=>{
 const standard=createState('학생',3),easy=createState('학생',3,{difficulty:'beginner'}),settings=difficultySettings(standard),assisted=difficultySettings(easy);
 assert.equal(settings.supportUntil,24);assert.equal(settings.totalSupport,150);assert.equal(settings.monthlySupport,15);assert.equal(settings.supportFloor,0);
 assert.equal(assisted.supportUntil,24);assert.equal(assisted.totalSupport,300);assert.equal(assisted.monthlySupport,30);assert.equal(assisted.supportFloor,800);
 assert.equal(standard.lab.initialFunding,seededInitialFunding(3,'national').total);assert.deepEqual(standard.hidden,easy.hidden);assert.equal(standard.seed,easy.seed);
});

test('standard essential support is credited on completion once, never by a consent response or reloading',()=>{
 for(const locale of ['ko','en']){
  const s=empty({locale}),before=structuredClone(s),[lo,hi]=HIDDEN_RANGES.stamina;s.hidden.stamina=lo+25*(hi-lo)/100;s.hidden.stress=80;s.hidden.resilience=700;
  const requested=simulateMonth(s,plan);assert.equal(requested.pending.kind,'rest-request');assert.equal(requested.labRisk.supportUsed,0);assert.equal(requested.history.filter(h=>h.kind==='settlement-support').length,0);
  const allowed=decide(requested,'allow');assert.equal(allowed.labRisk.supportUsed,0);const completed=simulateMonth(allowed,allowed.plan);
  assert.equal(completed.month,s.month+1);assert.equal(completed.labRisk.supportUsed,13.8);assert.equal(completed.history.filter(h=>h.kind==='settlement-support').length,1);assert.equal(completed.history.find(h=>h.kind==='settlement-support').remaining,136.2);assert.ok(validateSave(completed));
  const restored=migrateSave(completed);assert.equal(restored.lab.funds,completed.lab.funds);assert.equal(restored.labRisk.supportUsed,13.8);assert.deepEqual(restored.history,completed.history);
  assert.deepEqual(before.lab,s.lab,'planning and consent do not pay or consume the buffer');
 }
});

test('standard monthly and lifetime limits cover essentials while debt finances the remainder',()=>{
 const s=empty();s.lab.budget.salary=s.stipendLock=100;s.lab.budget.environment=6;s.lab.budget.performance=6;
 const cost=monthlyBudgetCost(s),n=simulateMonth(s,plan);assert.equal(n.labRisk.supportUsed,15);assert.ok(Math.abs(n.lastReport.borrowed-(cost-15))<1e-8);assert.ok(n.lastReport.borrowed>0);assert.ok(validateSave(n));
 const almost=empty();almost.labRisk.supportUsed=149.9;const a=simulateMonth(almost,plan);assert.equal(a.labRisk.supportUsed,150);assert.ok(Math.abs(a.history.find(h=>h.kind==='settlement-support').amount-.1)<1e-9);assert.equal(a.history.find(h=>h.kind==='settlement-support').remaining,0);assert.ok(validateSave(a));
 const exhausted=empty();exhausted.labRisk.supportUsed=150;const done=simulateMonth(exhausted,plan);assert.equal(done.labRisk.supportUsed,150);assert.equal(done.history.filter(h=>h.kind==='settlement-support').length,0);assert.equal(done.lastReport.borrowed,monthlyBudgetCost(exhausted));
 const ample=empty();ample.lab.funds=100;assert.equal(settlementSupport(ample,{stipend:7.8}).amount,0);
});

test('remaining standard support cannot be paid after year two or diverted from protected stipends',()=>{
 const last=empty({month:23});assert.equal(settlementSupport(last,{stipend:7.8}).amount,13.8);
 const ended=empty({month:24});assert.equal(settlementSupport(ended,{stipend:13.2}).available,0);const n=simulateMonth(ended,plan);assert.equal(n.labRisk.supportUsed,0);assert.equal(n.history.filter(h=>h.kind==='settlement-support').length,0);
 const pooled=empty();pooled.lab.pool=100;const paid=simulateMonth(pooled,plan);assert.equal(paid.lab.pool,92.2);assert.equal(paid.labRisk.supportUsed,6);assert.equal(paid.history.find(h=>h.kind==='stipend-payment').fromPool,7.8);
});

test('legacy and new standard saves retain balances and counters, with strict mode-specific caps',()=>{
 const old=empty();delete old.labRisk;delete old.professorProfile.difficulty;const before=structuredClone(old),loaded=migrateSave(old);assert.ok(validateSave(loaded));assert.equal(loaded.labRisk.supportUsed,0);assert.deepEqual(loaded.lab,old.lab);assert.deepEqual(old,before);
 const used=empty();used.labRisk.supportUsed=90;const again=migrateSave(used);assert.equal(again.labRisk.supportUsed,90);assert.equal(difficultySettings(again).remainingSupport,60);assert.deepEqual(migrateSave(again),again);
 for(const value of [150.00000000000003,151,301,Infinity,NaN,-1,'10']){const bad=empty();bad.labRisk.supportUsed=value;assert.equal(validateSave(bad),false);assert.equal(migrateSave(bad),null);}
 const easy=empty({difficulty:'beginner'});easy.labRisk.supportUsed=300;assert.ok(validateSave(easy));easy.labRisk.supportUsed=300.00000000000006;assert.equal(validateSave(easy),false);
});
