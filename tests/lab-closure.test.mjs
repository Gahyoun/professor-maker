import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,simulateSuspendedMonth,decide,validateSave,migrateSave,essentialLabStatus,proposeSchedule,calendarMonth,failureRun,monthlyBudgetCost} from '../dist/engine.js';
import {planReadiness} from '../dist/advising-plan.js';
import {difficultySettings,settlementSupport,closureSummary,validLabClosure,labWarningText} from '../dist/lab-risk.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';

const rest=Array(4).fill('free');
function fixture(month=0,{difficulty='realistic',labMode='dry'}={}){
 const s=createState('회복 검증',3,{difficulty,labMode,gender:'female'});s.month=month;s.started=true;s.attendance={domestic:'none',overseas:'none'};s.plan=rest.slice();if(month>=24)s.route='integrated';s.allocation=allocateCredits({research:2,teaching:3,admin:2,mentoring:1},facultyCapacity(s).credits);return s;
}
// These directed fixtures isolate one risk episode; all real monthly decisions
// still go through decide, while unrelated academic pages are retained as data.
function acknowledgeWarnings(s){while(s.pending?.kind==='lab-warning')s=decide(s,'acknowledge');return s;}
function readyNextMonth(s){s=acknowledgeWarnings(s);s.pending=null;s.pendingQueue=[];return s;}
function empty(s){s.lab.funds=0;s.lab.pool=0;s.lab.creditEnabled=false;return s;}

test('difficulty only buffers finite first-two-year funding and preserves seeded student abilities',()=>{
 for(let seed=1;seed<=80;seed++)for(const institution of ['national','private','institute']){
  const normal=createState('학생',seed,{institution}),easy=createState('학생',seed,{institution,difficulty:'beginner'});
  assert.equal(normal.professorProfile.difficulty,'realistic');assert.ok(easy.lab.initialFunding>=800&&easy.lab.initialFunding<=2000);assert.equal(easy.lab.initialFunding%100,0);
  assert.equal(easy.lab.funds+easy.lab.pool,easy.lab.initialFunding);assert.deepEqual(easy.hidden,normal.hidden);assert.equal(easy.seed,normal.seed);assert.deepEqual(easy.professor,normal.professor);assert.deepEqual(easy.grants,normal.grants);assert.ok(validateSave(easy));
 }
 const normal=fixture();assert.equal(difficultySettings(normal).totalSupport,0);assert.equal(difficultySettings(fixture(0,{difficulty:'beginner'})).totalSupport,300);
});
test('old saves retain balances and adopt realistic mode without granting a fresh buffer',()=>{
 const old=fixture(20);delete old.professorProfile.difficulty;delete old.labRisk;old.lab.funds=14;old.lab.pool=3;const before=structuredClone(old),n=migrateSave(old);
 assert.ok(validateSave(n));assert.equal(n.professorProfile.difficulty,'realistic');assert.deepEqual(n.lab,old.lab);assert.equal(n.labRisk.supportUsed,0);assert.deepEqual(old,before);
 const bad=structuredClone(n);bad.professorProfile.difficulty='free-money';assert.equal(validateSave(bad),false);assert.equal(migrateSave(bad),null);
 const malformed=structuredClone(old);malformed.professorProfile=null;assert.equal(migrateSave(malformed),null);
});
test('settlement support pays only locked stipends and essential wet supplies, once per month',()=>{
 for(const labMode of ['dry','wet']){
  const s=empty(fixture(2,{difficulty:'beginner',labMode}));s.lab.budget={salary:60,environment:0,performance:0,publicity:0};
  const status=planReadiness(s),before=structuredClone(s),expected=7.8+(labMode==='wet'?6:0);
  assert.ok(status.ready);assert.ok(Math.abs(status.support.amount-expected)<1e-9);assert.equal(essentialLabStatus(s).blocked,false);
  assert.throws(()=>simulateSuspendedMonth(s),/Essential operations/);
  const n=simulateMonth(s,rest);assert.ok(validateSave(n));assert.ok(Math.abs(n.labRisk.supportUsed-expected)<1e-9);assert.equal(n.history.filter(h=>h.kind==='settlement-support').length,1);assert.equal(n.history.find(h=>h.kind==='stipend-payment').amount,7.8);assert.ok(n.lab.funds>=0);assert.deepEqual(s,before);
  const read=acknowledgeWarnings(n);assert.equal(read.labRisk.supportUsed,n.labRisk.supportUsed);assert.equal(read.lab.funds,n.lab.funds);
 }
});
test('settlement support cannot subsidize expensive selected plans, travels or discretionary equipment',()=>{
 const s=empty(fixture(2,{difficulty:'beginner',labMode:'wet'}));s.lab.budget={salary:60,environment:6,performance:6,publicity:0};s.plan=Array(4).fill('experiment');
 assert.equal(planReadiness(s).ready,true);assert.ok(planReadiness(s).estimatedBorrowing>0);assert.equal(essentialLabStatus(s).blocked,false);const financed=simulateMonth(s,s.plan);assert.ok(financed.lab.debt>0);assert.equal(financed.labRisk.supportUsed,13.8);assert.throws(()=>simulateSuspendedMonth(s),/adjust optional spending/);assert.equal(s.labRisk.funding,0);assert.equal(s.history.length,0);
 s.lab.budget={salary:60,environment:0,performance:0,publicity:0};assert.ok(planReadiness({...s,plan:rest}).ready);
 s.labRisk.supportUsed=295;const support=settlementSupport(s,{stipend:7.8});assert.equal(support.available,5);assert.equal(support.amount,5);assert.equal(essentialLabStatus(s).blocked,true);
 s.labRisk.supportUsed=300;assert.equal(settlementSupport(s,{stipend:7.8}).amount,0);s.labRisk.supportUsed=0;s.month=24;assert.equal(settlementSupport(s,{stipend:13.2}).amount,0);
});
test('one zero faculty month warns, decisions do not advance it, and three zero months close with a precise cause',()=>{
 let s=fixture(1);s.professor.admin=3;const allocation=allocateCredits({research:3,teaching:3,admin:0,mentoring:2},facultyCapacity(s).credits);
 let n=simulateMonth(s,rest,{allocation});assert.equal(n.ending,null);assert.equal(n.labRisk.faculty.admin,1);assert.equal(n.pending.kind,'lab-warning');assert.equal(n.pending.remainingMonths,2);
 const warning=structuredClone(n.pending),ack=decide(n,'acknowledge');assert.equal(ack.labRisk.faculty.admin,1);assert.equal(ack.labRisk.lastEvaluatedMonth,n.month);assert.match(labWarningText(warning),/2개월/);
 s=readyNextMonth(ack);s=simulateMonth(s,rest,{allocation});assert.equal(s.ending,null);assert.equal(s.labRisk.faculty.admin,2);s=readyNextMonth(s);s=simulateMonth(s,rest,{allocation});
 assert.equal(s.ending,'gameover');assert.equal(s.endingReason,'lab_closure');assert.deepEqual(s.labClosure.keys,['admin']);assert.equal(s.labClosure.streak,3);assert.match(closureSummary(s),/학교행정.*3개월/);assert.ok(validateSave(s));assert.ok(validLabClosure(s.labClosure,s.month));
});
test('reviewing a teaching warning creates a viable allocation without instant stat restoration, and recovery rearms warnings',()=>{
 let s=fixture(1);s.professor.teaching=0;const neglect=allocateCredits({research:3,teaching:0,admin:3,mentoring:2},facultyCapacity(s).credits);
 let n=simulateMonth(s,rest,{allocation:neglect});assert.equal(n.labRisk.faculty.teaching,1);const before=n.professor.teaching;
 n=decide(n,'review');assert.equal(n.professor.teaching,before);assert.ok(n.allocation.teaching>=3);n=readyNextMonth(n);n=simulateMonth(n,n.plan);assert.ok(n.professor.teaching>0);assert.equal(n.labRisk.faculty.teaching,0);assert.ok(n.labRisk.warned.teaching<2);
 n=readyNextMonth(n);n.professor.teaching=0;n=simulateMonth(n,rest,{allocation:neglect});assert.equal(n.labRisk.faculty.teaching,1);assert.ok([n.pending,...n.pendingQueue].some(p=>p?.kind==='lab-warning'&&p.keys.includes('teaching')&&p.streak===1));
});
test('one selected costly plan is financed without immediate closure or misusing stipend reserves',()=>{
 const s=fixture(2);s.lab.funds=0;s.lab.pool=100;s.lab.budget={salary:60,environment:6,performance:6,publicity:0};const before=structuredClone(s);
 assert.equal(essentialLabStatus(s).blocked,false);assert.equal(planReadiness(s).ready,true);assert.throws(()=>simulateSuspendedMonth(s),/adjust optional/);const funded=simulateMonth(s,rest);assert.equal(funded.month,s.month+1);assert.equal(funded.ending,null);assert.ok(funded.lab.debt>0);assert.equal(funded.lab.pool,100-7.8);assert.deepEqual(s,before);
 s.lab.budget={salary:60,environment:0,performance:0,publicity:0};const n=simulateMonth(s,rest);assert.equal(n.labRisk.funding,0);assert.equal(n.ending,null);assert.equal(n.history.filter(h=>h.kind==='lab-suspension').length,0);
});
test('three explicitly suspended, unrecovered months close; no salary, project progress or skill inflation occurs',()=>{
 let s=empty(fixture(1));const original=structuredClone(s),warningCounts=[];
 for(let i=1;i<=3;i++){
  s=simulateSuspendedMonth(s);assert.ok(validateSave(s));assert.equal(s.lab.funds,0);assert.equal(s.lab.pool,0);assert.equal(s.labRisk.funding,i);assert.equal(s.project.progress,original.project.progress);assert.equal(s.career.papers,original.career.papers);assert.equal(s.hidden.learning,original.hidden.learning);assert.equal(s.hidden.research,original.hidden.research);assert.equal(s.lastReport.suspended,true);assert.ok(s.lastReport.results.every(r=>!r.performed&&r.progress===0&&r.suspended));
  warningCounts.push(s.history.filter(h=>h.kind==='lab-warning'&&h.reason==='funding'&&h.streak>0).length);
  if(i<3){assert.equal(s.ending,null);s=readyNextMonth(s);}
 }
 assert.equal(s.endingReason,'lab_closure');assert.equal(s.labClosure.reason,'funding');assert.match(closureSummary(s),/연구비 부족.*3개월/);assert.equal(s.history.filter(h=>h.kind==='stipend-payment').length,0);assert.equal(s.history.filter(h=>h.kind==='lab-suspension').length,3);assert.deepEqual(warningCounts,[1,1,1]);assert.equal(failureRun(s),0);
});
test('scheduled annual funding rescues a suspended month, resets its streak, and is never paid again by decisions',()=>{
 let s=empty(fixture(12));s.grants.reportYears=[1];s.labRisk.funding=2;s.labRisk.warned.funding=2;s.labRisk.lastEvaluatedMonth=12;
 const n=simulateSuspendedMonth(s);assert.equal(n.month,13);assert.equal(n.ending,null);assert.equal(n.labRisk.funding,0);assert.equal(essentialLabStatus(n).blocked,false);assert.ok(n.lab.funds>0);assert.equal(n.history.filter(h=>h.kind==='annual-grant').length,1);const cash=n.lab.funds+n.lab.pool;
 s=acknowledgeWarnings(n);assert.equal(s.lab.funds+s.lab.pool,cash);s=readyNextMonth(s);s=simulateMonth(s,rest);assert.equal(s.history.filter(h=>h.kind==='annual-grant'&&h.month===13).length,1);assert.equal(s.labRisk.funding,0);
 s=readyNextMonth(s);empty(s);s=simulateSuspendedMonth(s);assert.equal(s.labRisk.funding,1);assert.ok([s.pending,...s.pendingQueue].some(p=>p?.kind==='lab-warning'&&p.reason==='funding'&&p.streak===1));
});
test('suspension advances every required academic checkpoint instead of skipping degree decisions',()=>{
 const expected={24:['route'],48:['qual'],90:['thesis','draft'],92:['thesis','presentation'],93:['thesis','verdict'],96:['defense']};
 for(const [target,[kind,step]] of Object.entries(expected)){
  const month=Number(target),s=empty(fixture(month-1));s.hidden.stamina=900;s.hidden.resilience=700;s.hidden.stress=10;
  const n=simulateSuspendedMonth(s),pending=[n.pending,...n.pendingQueue].filter(Boolean);assert.equal(n.month,month);assert.ok(validateSave(n));assert.ok(pending.some(p=>p.kind===kind&&(!step||p.step===step)),String(target));assert.equal(n.history.filter(h=>h.kind==='month'&&h.month===month).length,1);assert.equal(n.history.filter(h=>h.kind==='stipend-payment').length,0);
 }
});
test('suspended professor energy does not charge imaginary student research weeks',()=>{
 const a=empty(fixture(3)),b=structuredClone(a);a.plan=Array(4).fill('experiment');b.plan=Array(4).fill('free');a.professorEnergy=b.professorEnergy=50;
 const n=simulateSuspendedMonth(a),m=simulateSuspendedMonth(b);assert.equal(n.professorEnergy,m.professorEnergy);assert.deepEqual(n.professor,m.professor);
});
test('thin funding is a prospective warning and invalid closure snapshots are rejected',()=>{
 assert.doesNotMatch(labWarningText({reason:'funding',keys:[],streak:0,remainingMonths:3}),/연속 보류/);assert.match(closureSummary({endingReason:'graduation_requirements'}),/학위 요건/);assert.match(closureSummary({endingReason:'time_limit'}),/8년/);assert.match(closureSummary({endingReason:null}),/이전 기록/);
 const s=fixture(5);s.ending='gameover';s.endingReason='lab_closure';assert.equal(validateSave(s),false);s.labClosure={reason:'funding',keys:[],streak:3,month:5,recovery:'funding'};assert.ok(validateSave(s));s.labClosure.keys=['admin'];assert.equal(validateSave(s),false);s.labClosure.keys=[];s.labClosure.streak=1;assert.equal(validateSave(s),false);
 const bad=fixture();bad.labRisk.supportUsed=1;assert.equal(validateSave(bad),false);bad.professorProfile.difficulty='beginner';bad.labRisk.supportUsed=301;assert.equal(validateSave(bad),false);
 const exhausted=fixture(5);exhausted.professor.research=0;exhausted.labRisk.faculty.research=3;assert.equal(validateSave(exhausted),false);assert.throws(()=>simulateMonth(exhausted,rest),/Invalid saved/);
 const premature=fixture();premature.labRisk.faculty.research=2;assert.equal(validateSave(premature),false);premature.labRisk.faculty.research=0;premature.labRisk.funding=2;assert.equal(validateSave(premature),false);
});
