import {facultyCapacity,allocateCredits} from '../dist/workload.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,proposeSchedule,validateSave,migrateSave} from '../dist/engine.js';
import {hIndex,advanceImpact} from '../dist/impact.js';
import {grantCounts,canApplyGrant,advancePortfolio,depositGrant} from '../dist/funding.js';
import {buildEndingCV} from '../dist/cv.js';
test('h-index is citation-based; independent performance/luck growth never changes event RNG',()=>{
 assert.equal(hIndex([10,8,5,4,3]),4);assert.equal(hIndex([1,1,1]),1);assert.equal(hIndex([]),0);
 const low=createState('',9),high=structuredClone(low);for(const s of [low,high]){s.career.papers=4;s.hidden.research=700;s.hidden.language=700;}low.hidden.luck=-100;high.hidden.luck=100;
 const seed=low.seed;for(let month=1;month<=96;month++){low.month=high.month=month;advanceImpact(low);advanceImpact(high);}
 assert.equal(low.seed,seed);assert.equal(high.seed,seed);assert.ok(high.impact.citations.reduce((a,b)=>a+b,0)>=low.impact.citations.reduce((a,b)=>a+b,0));assert.equal(high.impact.hIndex,hIndex(high.impact.citations));
});
test('3 PI and 5 total limits block a fourth PI before drawing or changing funds',()=>{
 const s=createState('',8);s.month=0;s.facultyAction='funding';
 for(let id=1;id<=2;id++)s.grants.portfolio.push({id,role:'pi',start:0,end:60,annual:150,titleIndex:id%3});
 assert.deepEqual(grantCounts(s),{pi:3,total:3});assert.equal(canApplyGrant(s,'pi'),false);
 const before=structuredClone(s);assert.throws(()=>simulateMonth(s,proposeSchedule(s),{facultyAction:'funding'}),/limit/);assert.deepEqual(s,before);
 for(let id=3;id<=4;id++)s.grants.portfolio.push({id,role:'co',start:0,end:60,annual:90,titleIndex:id%3});
 assert.equal(canApplyGrant(s,'co'),false);assert.deepEqual(grantCounts(s),{pi:3,total:5});assert.ok(validateSave(s));
 s.month=s.grants.cycleEnd-6;assert.equal(canApplyGrant(s,'pi'),true,'renewal replaces the existing PI slot');
});
test('grant selection is probabilistic and grants last exactly two to five years',()=>{
 for(const years of [2,3,4,5]){const s=createState('',2);s.month=1;s.facultyAction='funding';advancePortfolio(s,{role:'pi',years},{random:()=>0,log:()=>{}});const g=s.grants.portfolio.at(-1);assert.equal(g.end-g.start,years*12);assert.ok(s.lab.pool>0);}
 const s=createState('',2);s.month=1;s.facultyAction='funding';const funds=s.lab.funds;advancePortfolio(s,{role:'pi',years:2},{random:()=>.999,log:()=>{}});assert.equal(s.grants.portfolio.length,1);assert.equal(s.lab.funds,funds);
});
test('pooled stipend survives ended projects, pays first and cannot fund operations',()=>{
 const s=createState('',8);s.month=2;s.lab.funds=0;s.lab.pool=200;depositGrant(s,100);assert.equal(s.lab.funds,65);assert.equal(s.lab.pool,235);
 const n=simulateMonth(s,['rest','rest','rest','rest']);assert.equal(n.lab.pool,235-7.8);assert.equal(n.lab.funds,55);assert.equal(n.history.find(h=>h.kind==='stipend-payment').fromPool,7.8);
 s.lab.funds=0;assert.throws(()=>simulateMonth(s,['rest','rest','rest','rest']),/Budget/);
});
test('external admission is offered at undergraduate and master transitions and advice has distinct outcomes',()=>{
 for(const level of ['bachelor','masters']){
  const s=createState('',8);s.month=level==='bachelor'?23:47;s.route=level==='bachelor'?null:'masters';s.career.papers=3;s.career.completedProjects=3;s.career.submissions=3;s.career.conferences=3;s.career.awards=1;s.hidden.research=750;s.hidden.language=650;s.hidden.rapport=30;s.impact={citations:[4,4,4],hIndex:3};
  let next=simulateMonth(s,proposeSchedule(s));if(next.pending.kind==='thesis')next=decide(next,'confirm');assert.equal(next.pending.kind,'external-admission');assert.equal(next.pending.level,level);
  const stayed=decide(next,'remain');assert.equal(stayed.ending,null);assert.equal(stayed.pending.kind,level==='bachelor'?'route':'masters');
  next.seed=999999;const left=decide(next,'encourage');assert.equal(left.ending,level==='bachelor'?'external_masters':'external_phd');assert.ok(validateSave(left));const cv=buildEndingCV(left);assert.ok(cv);assert.equal(cv.model.months,level==='bachelor'?24:48);assert.ok(!cv.model.education.some(e=>e.degree==='doctorate'));if(level==='masters')assert.ok(cv.model.education.some(e=>e.degree==='masters'));
 }
});

test('undergraduate conferences teach observation only, with a fixed final-year October showcase',()=>{
 const s=createState('',6);s.month=19;s.project.phase=3;const n=simulateMonth(s,['rest','rest','conference','rest']);assert.equal(n.career.conferences,0);assert.equal(n.lastReport.results[2].outcome,'attended');assert.equal(n.pending.id,'undergraduate-contest');assert.ok(validateSave(decide(n,0)));
 const grad=createState('',6);grad.month=26;grad.route='integrated';grad.history=[{kind:'paper',month:18,projectId:1},{kind:'month',month:25,results:[{actual:'language',performed:true},{actual:'language',performed:true}]}];grad.career.papers=grad.career.completedProjects=grad.career.submissions=1;grad.project.id=2;const out=simulateMonth(grad,['rest','rest','conference','rest']);assert.equal(out.career.conferences,1);assert.equal(out.history.find(e=>e.kind==='conference').projectId,1);
});

test('faculty capacity and efficiency vary with seniority and seeded calendar pressure without consuming RNG',()=>{
 const young=createState('',12,{age:30}),senior=createState('',12,{age:55});let a=0,b=0;for(let month=0;month<12;month++){young.month=senior.month=month;a+=facultyCapacity(young).credits;b+=facultyCapacity(senior).credits;}assert.ok(a>b);assert.ok(facultyCapacity(senior).efficiency>facultyCapacity(young).efficiency);const before=structuredClone(young);assert.deepEqual(facultyCapacity(young),facultyCapacity(young));assert.deepEqual(young,before);
});
test('reduced faculty credits retain eight for maintenance and never exceed eleven',()=>{
 for(const age of [30,42,55]){
  const s=createState('',12,{age}),before=structuredClone(s);
  for(let month=0;month<96;month++)for(const active of [false,true]){
   const capacity=facultyCapacity({...s,month,sabbatical:{...s.sabbatical,active}});
   assert.ok(capacity.credits>=8&&capacity.credits<=11);
  }
  assert.deepEqual(s,before);
 }
});
test('loading an over-budget workload fits the new cap and can advance without altering the original save',()=>{
 const old=createState('',12,{age:42});old.allocation={research:3,teaching:3,admin:3,mentoring:3};
 const before=structuredClone(old),migrated=migrateSave(old),capacity=facultyCapacity(migrated).credits;
 assert.ok(validateSave(migrated));assert.deepEqual(old,before);
 assert.equal(Object.values(migrated.allocation).reduce((a,b)=>a+b,0),capacity);
 assert.ok(Object.values(migrated.allocation).every(n=>n>=2));
 assert.equal(simulateMonth(migrated,proposeSchedule(migrated),{allocation:migrated.allocation}).month,1);
 const spare={...old,allocation:{research:2,teaching:2,admin:1,mentoring:2}};
 assert.deepEqual(migrateSave(spare).allocation,spare.allocation);
});
test('teaching neglect decays gently on vacation and sabbatical but is costly during semester',()=>{
 const term=createState('',12),vacation=structuredClone(term),sabbatical=structuredClone(term);term.month=2;vacation.month=4;sabbatical.month=2;sabbatical.sabbatical={active:true,until:14,mode:'home'};
 const results=[term,vacation,sabbatical].map(s=>simulateMonth(s,['rest','rest','rest','rest'],{allocation:allocateCredits({research:3,teaching:0,admin:3,mentoring:2},facultyCapacity(s).credits)}));assert.ok(results[0].professor.teaching<results[1].professor.teaching-5);assert.ok(results[0].professor.teaching<results[2].professor.teaching-5);assert.equal(facultyCapacity(vacation).teachingRequired,false);assert.equal(facultyCapacity(sabbatical).teachingRequired,false);
});
