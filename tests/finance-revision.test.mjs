import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,validateSave,migrateSave,eventEligible,EVENTS} from '../dist/engine.js';
import {initialGrants,advanceGrants,annualGrantAmount} from '../dist/grants.js';
import {seededInitialFunding,grantCallOpen,advancePortfolio,validApplication,fundingResults,canApplyGrant,grantCounts} from '../dist/funding.js';
const log=(s,e)=>s.history.push({month:s.month,...e});

test('initial funds and grant terms cover the grid reproducibly without changing ability RNG',()=>{
 const totals=new Set(),terms=new Set();
 for(let seed=1;seed<=1000;seed++){
  const a=createState('학생',seed,{gender:'male'}),b=createState('학생',seed,{gender:'female'});
  const initial=seededInitialFunding(seed);
  assert.equal(a.lab.funds+a.lab.pool,initial.total);assert.ok(initial.total>=300&&initial.total<=2000);assert.equal(initial.total%100,0);
  assert.deepEqual(a.hidden,b.hidden);assert.equal(a.seed,b.seed);assert.deepEqual(initial,seededInitialFunding(seed));
  totals.add(initial.total);terms.add(initialGrants('national',seed).cycleEnd/12);assert.ok(validateSave(a));
 }
 assert.equal(totals.size,18);assert.deepEqual([...terms].sort(),[2,3,4,5]);
});

test('calls never open outside March and September even with no money',()=>{
 for(const locale of ['ko','en'])for(let month=0;month<12;month++){
  const s=createState('학생',9,{locale});s.month=month;s.lab.funds=0;
  assert.equal(grantCallOpen(s),month%6===0);
 }
 assert.ok([2,3,4,5].every(years=>validApplication({role:'pi',years})));
 assert.equal(validApplication({role:'pi',years:1}),false);
});

test('ended projects free slots, while renewal replaces one PI at the 3/5 cap',()=>{
 const s=createState('학생',8);s.month=s.grants.cycleEnd-6;
 for(let id=1;id<=4;id++)s.grants.portfolio.push({id,role:id<=2?'pi':'co',start:0,end:60,annual:90,titleIndex:0});
 assert.deepEqual(grantCounts(s),{pi:3,total:5});assert.equal(canApplyGrant(s,'pi'),true);assert.equal(canApplyGrant(s,'co'),false);
 s.grants.applicationCycles.push(s.grants.cycleEnd);assert.equal(canApplyGrant(s,'pi'),false);
 s.grants.portfolio[1].end=s.month;assert.deepEqual(grantCounts(s),{pi:2,total:4});assert.equal(canApplyGrant(s,'pi'),true);
});

test('a grant selection and its yearly payment each deposit only once',()=>{
 const s=createState('학생',2);s.month=1;s.facultyAction='funding';let draws=0;
 const options={random:()=>{draws++;return 0;},log};
 advancePortfolio(s,{role:'pi',years:2},options);const selected=structuredClone(s);
 advancePortfolio(s,{role:'pi',years:2},options);assert.equal(draws,1);assert.equal(s.lab.funds,selected.lab.funds);assert.equal(s.grants.portfolio.length,2);
 const r=fundingResults(s)[0];assert.deepEqual({awarded:r.awarded,years:r.years,annual:r.annual,source:r.source},{awarded:true,years:2,annual:179,source:'portfolio'});
 s.month=13;s.facultyAction='routine';advancePortfolio(s,{role:'pi',years:2},options);const funds=s.lab.funds,pool=s.lab.pool;
 advancePortfolio(s,{role:'pi',years:2},options);assert.equal(s.lab.funds,funds);assert.equal(s.lab.pool,pool);
});

test('renewal requires a real before-deadline application and a successful review',()=>{
 const s=createState('학생',8);s.grants=initialGrants('national',0);s.grants.cycleEnd=24;s.career.submissions=2;
 s.month=19;s.facultyAction='funding';advanceGrants(s,{application:{role:'pi',years:5},random:()=>0,log});
 assert.deepEqual(s.grants.applicationCycles,[24]);
 s.month=25;s.facultyAction='routine';s.grants.reportYears=[2];advanceGrants(s,{random:()=>0,log});
 assert.equal(s.grants.status,'active');assert.equal(s.grants.cycleEnd-s.grants.cycleStart,60);assert.equal(fundingResults(s)[0].years,5);
 const late=createState('학생',8);late.grants.cycleEnd=24;late.month=25;late.facultyAction='funding';late.career.submissions=2;
 advanceGrants(late,{random:()=>0,log});assert.equal(late.grants.status,'bridge');assert.deepEqual(late.grants.applicationCycles,[]);
 assert.equal(fundingResults(late)[0].awarded,false);assert.equal(fundingResults(late)[0].annual,0);
});

test('bridge funding ends after one year and report delay never compounds nominal grants',()=>{
 const s=createState('학생',8);s.grants.cycleEnd=24;s.month=25;s.facultyAction='routine';
 advanceGrants(s,{random:()=>1,log});assert.equal(s.history.find(h=>h.kind==='annual-grant').amount,115);
 s.month=37;advanceGrants(s,{random:()=>1,log});assert.equal(s.history.filter(h=>h.kind==='annual-grant').at(-1).amount,0);
 const report=createState('학생',8);report.month=12;const delayed=simulateMonth(report,proposeSchedule(report));
 assert.equal(delayed.grants.annualAmount,359);assert.equal(delayed.history.find(h=>h.kind==='annual-grant').amount,215);
});

test('legacy finance migration preserves an original backup, caps once and never re-credits',()=>{
 const raw=createState('학생',8);delete raw.lab.financeRules;delete raw.lab.initialFunding;
 raw.lab.funds=3000;raw.lab.pool=1000;raw.lab.debt=30;const before=structuredClone(raw);
 const migrated=migrateSave(raw);assert.deepEqual(raw,before);assert.equal(migrated.lab.funds,1500);assert.equal(migrated.lab.pool,500);
 assert.deepEqual(migrated.lab.financeMigration.original,{funds:3000,pool:1000,debt:30});assert.deepEqual(migrateSave(migrated),migrated);assert.ok(validateSave(migrated));
 migrated.lab.funds=2500;assert.equal(migrateSave(migrated).lab.funds,2500,'earned new-rule funds are not repeatedly capped');
 const modest=structuredClone(raw);modest.lab.funds=120;modest.lab.pool=80;assert.equal(migrateSave(modest).lab.funds,120);
 const corrupt=structuredClone(migrated);corrupt.lab.financeMigration.original.funds='3000';assert.equal(migrateSave(corrupt),null);
});

test('selected and rejected projects are exposed in the actual month report',()=>{
 let awarded=false,rejected=false;
 for(let seed=1;seed<=30;seed++){
  const s=createState('학생',seed),n=simulateMonth(s,proposeSchedule(s),{facultyAction:'funding',grantApplication:{role:'pi',years:4}});
  const r=n.lastReport.fundingResults[0];assert.ok(r);assert.equal(r.years,4);assert.equal(r.source,'portfolio');assert.equal(r.end-r.start,48);assert.ok(validateSave(n));
  awarded||=r.awarded;rejected||=!r.awarded;if(!r.awarded)assert.equal(r.annual,0);
 }
 assert.ok(awarded&&rejected);
 const poor=createState('학생',8);poor.month=24;poor.lab.funds=0;assert.equal(eventEligible(poor,{id:'paid-only',options:[{effects:{lab:{funds:-8}}}]}),false);
});

test('bridge-to-active renewal cannot overbook a PI slot freed during the gap',()=>{
 const s=createState('학생',8);s.grants.status='bridge';s.grants.cycleStart=24;s.grants.cycleEnd=36;s.month=30;s.career.submissions=2;
 for(let id=1;id<=3;id++)s.grants.portfolio.push({id,role:'pi',start:25,end:85,annual:150,titleIndex:0});
 assert.deepEqual(grantCounts(s),{pi:3,total:3});assert.equal(canApplyGrant(s,'pi'),false);
 s.grants.applicationCycles.push(36);s.month=37;advanceGrants(s,{random:()=>0,log});
 assert.equal(s.grants.status,'bridge');assert.deepEqual(grantCounts(s),{pi:3,total:3});assert.equal(s.history.find(h=>h.kind==='grant-selection').limitBlocked,true);
});

test('wet labs receive greater grant awards while retaining the same seeded initial cap',()=>{
 for(const institution of ['national','private','institute']){
  assert.ok(Math.abs(annualGrantAmount(institution,'wet')-annualGrantAmount(institution,'dry')*1.5)<=1);
  assert.ok(Math.abs(initialGrants(institution,8,'wet').annualAmount-initialGrants(institution,8,'dry').annualAmount*1.5)<=1);
  const awarded=[];
  for(const labMode of ['dry','wet']){const s=createState('학생',8,{institution,labMode});s.month=1;s.facultyAction='funding';advancePortfolio(s,{role:'co',years:3},{random:()=>0,log});awarded.push(s.grants.portfolio.at(-1).annual);assert.equal(s.lab.initialFunding,seededInitialFunding(8,institution).total);}
  assert.deepEqual(awarded,[108,161]);
 }
});
