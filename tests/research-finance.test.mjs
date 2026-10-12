import test from 'node:test';
import assert from 'node:assert/strict';
import {DISCIPLINES} from '../dist/disciplines.js';
import {createState,monthlyBudgetCost,essentialLabStatus,salaryBase,simulateMonth,validateSave} from '../dist/engine.js';
import {researchFinanceProfile,researchOperatingCost} from '../dist/research-finance.js';
import {annualGrantAmount} from '../dist/grants.js';
import {applicationGrantAmount,nextGrantAmount} from '../dist/funding.js';

test('every supported discipline and lab track has a bounded, source-labelled finance profile without mutating RNG or state',()=>{
 for(const field of DISCIPLINES)for(const labMode of field.labModes){
  const s=createState('분야 검증',731,{fieldId:field.id,labMode}),before=structuredClone(s),p=researchFinanceProfile(s),cost=researchOperatingCost(s);
  assert.ok(p.grantMultiplier>=.95&&p.grantMultiplier<=1.15);
  assert.ok(p.reference.meanMillions>0);assert.equal(p.reference.year,2024);assert.match(p.reference.source,/nrf\.re\.kr/);
  assert.ok(Number.isFinite(cost.total)&&cost.total>=0);assert.deepEqual(s,before);
 }
});
test('wet maintenance, sample collection and analysis months create distinct spending choices',()=>{
 const budget={salary:60,environment:0,performance:0,publicity:0};
 const fields=[['048','dry'],['089','dry'],['077','wet'],['072','wet'],['093','wet'],['112','wet']];
 const costs=fields.map(([fieldId,labMode])=>{
  const s=createState('분야 검증',731,{fieldId,labMode});
  const experiments=researchOperatingCost(s,budget,Array(4).fill('experiment')),analysis=researchOperatingCost(s,budget,Array(4).fill('analysis'));
  if(labMode==='wet')assert.ok(experiments.total>analysis.total);
  assert.equal(monthlyBudgetCost(s,budget,Array(4).fill('experiment')),salaryBase(s)*.6+experiments.total);
  return experiments.total;
 });
 assert.equal(costs[0],0,'theory does not invent consumable costs');assert.ok(costs[1]>0,'compute time has an activity charge');
 assert.equal(new Set(costs).size,6,'representative cost profiles are strategically distinct');
 const dry=createState('',1,{fieldId:'056',labMode:'dry'}),wet=createState('',1,{fieldId:'056',labMode:'wet'});
 assert.equal(essentialLabStatus(dry).operating,0);assert.equal(essentialLabStatus(wet).operating,6);
});
test('optional support scales independently from essential safety support and respects training weeks',()=>{
 const s=createState('',731,{fieldId:'077',labMode:'wet',difficulty:'beginner'});s.lab.funds=0;s.lab.pool=0;s.lab.debt=0;
 const essential=essentialLabStatus(s),low={...s.lab.budget,environment:0,performance:0},high={...low,environment:6,performance:6},plan=Array(4).fill('experiment');
 const cost=researchOperatingCost(s,high,plan),training=researchOperatingCost(s,high,plan,{training:true});
 assert.ok(cost.total>researchOperatingCost(s,low,plan).total);assert.equal(cost.activities,training.activities*4);
 s.lab.budget=high;assert.deepEqual(essentialLabStatus(s).support,essential.support,'settlement support does not pay optional upgrades');
 assert.ok(essential.support.amount<=30);assert.equal(essential.operating,researchFinanceProfile(s).fixed);
});
test('new contract and UI estimates include discipline once, while old contracts retain their promised nominal amounts',()=>{
 const math=createState('',731,{fieldId:'048',labMode:'dry'}),physics=createState('',731,{fieldId:'050',labMode:'dry'}),materials=createState('',731,{fieldId:'093',labMode:'wet'});
 assert.ok(annualGrantAmount('national','dry','048')<annualGrantAmount('national','dry','050'));
 for(const s of [math,physics,materials]){
  assert.equal(s.grants.annualAmount,annualGrantAmount('national',s.professorProfile.labMode,s.professorProfile.fieldId));
  assert.equal(nextGrantAmount(s.grants.annualAmount,s.grants.grantScaleVersion),s.grants.annualAmount);
  assert.ok(applicationGrantAmount(s,'pi')>applicationGrantAmount(s,'co'));
 }
 assert.equal(nextGrantAmount(300),345,'legacy future payment gets the common 15% increase only');
});
test('zero-cash months advance under each representative discipline, protecting restricted payroll pools',()=>{
 for(const [fieldId,labMode] of [['048','dry'],['089','dry'],['077','wet'],['072','wet'],['093','wet'],['112','wet']]){
  const s=createState('분야 검증',731,{fieldId,labMode});s.month=2;s.started=true;s.pending=null;s.attendance={domestic:'none',overseas:'none'};
  s.plan=Array(4).fill('analysis');s.lab.budget={salary:60,environment:0,performance:0,publicity:0};s.lab.funds=0;s.lab.pool=100;
  const n=simulateMonth(s,s.plan),cost=monthlyBudgetCost(s),startup=researchFinanceProfile(s).fixed;
  assert.equal(n.month,3);assert.equal(n.lab.pool,92.2);assert.equal(n.labRisk.supportUsed,startup);assert.ok(Math.abs(n.lastReport.borrowed-Math.max(0,cost-7.8-startup))<1e-8);assert.ok(validateSave(n));
 }
});
