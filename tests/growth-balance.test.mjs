import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_BALANCE,validBalance} from '../dist/balance.js';
import {createState,simulateMonth,decide,proposeSchedule,abilityScore,HIDDEN_RANGES,validateSave,migrateSave,GROWTH_VERSION,projectThresholds} from '../dist/engine.js';
import {abilityAfterChange,rapportAfterChange} from '../dist/relationship.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const setScore=(s,key,n)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+n*(hi-lo)/100;};
function fixture(seed=19){
 const s=createState('김하늘',19,{fieldId:'056',labMode:'wet',age:38});
 s.started=true;s.month=24;s.route='integrated';s.seed=seed;
 for(const key of Object.keys(HIDDEN_RANGES))setScore(s,key,40);
 for(const key of ['stamina','motivation','diligence'])setScore(s,key,80);
 setScore(s,'rapport',70);setScore(s,'stress',20);
 s.temperament={curiosity:50,caution:50,expression:50};
 s.project.phase=1;s.project.progress=0;
 s.professor={research:70,teaching:70,admin:70,mentoring:70};
 s.policies={work:'core',study:'study'};
 s.lab.funds=1500;s.lab.pool=500;s.lab.budget.salary=50;s.stipendLock=50;
 assert.ok(validateSave(s));return s;
}
const recoveries=()=>Array(4).fill('recovery');
const options=s=>({proposal:s.plan,policies:s.policies,feedback:'listen',facultyAction:'routine',attendance:{domestic:'none',overseas:'none'}});

test('successful scientific work develops more capability than failed work with the same initial abilities',()=>{
 let failure,success;
 for(let seed=1;seed<=240&&(!failure||!success);seed++){
  const s=fixture(seed*7919),plan=['experiment','recovery','recovery','recovery'],before=structuredClone(s);
  const n=simulateMonth(s,plan,{...options(s),proposal:plan}),r=n.lastReport.results[0];
  assert.deepEqual(s,before);assert.ok(validateSave(n));
  if(!r.performed)continue;
  const experience=.35+.65*r.successRate;
  near(abilityScore(n,'research')-abilityScore(s,'research'),(.1*GAME_BALANCE.policyGrowthScale+1.4*experience)*GAME_BALANCE.abilityGrowthScale);
  near(abilityScore(n,'intuition')-abilityScore(s,'intuition'),.9*experience*GAME_BALANCE.abilityGrowthScale);
  // Project output uses the existing progress model independently of capability tuning.
  near(r.progress,r.weight*r.successRate);
  if(r.successRate===0)failure={s,n,r};
  if(r.successRate>.8)success={s,n,r};
 }
 assert.ok(failure,'a completed but inconclusive experiment must be sampled');
 assert.ok(success,'a strong experiment must be sampled');
 assert.deepEqual(success.s.hidden,failure.s.hidden);
 assert.ok(abilityScore(success.n,'research')>abilityScore(failure.n,'research'));
 assert.ok(abilityScore(success.n,'intuition')>abilityScore(failure.n,'intuition'));
 assert.ok(abilityScore(failure.n,'research')>abilityScore(failure.s,'research'),'failure still provides modest experience');
});

test('a month spent recovering grants only small policy learning and keeps recovery strength intact',()=>{
 const s=fixture();setScore(s,'stress',60);const plan=recoveries(),before=structuredClone(s);
 const n=simulateMonth(s,plan,{...options(s),proposal:plan});
 near(abilityScore(n,'learning')-abilityScore(s,'learning'),.9*GAME_BALANCE.policyGrowthScale*GAME_BALANCE.abilityGrowthScale);
 near(abilityScore(n,'research')-abilityScore(s,'research'),.1*GAME_BALANCE.policyGrowthScale*GAME_BALANCE.abilityGrowthScale);
 for(const key of ['language','social','teaching','industry','enterprise','outreach','intuition','manners'])near(abilityScore(n,key),abilityScore(s,key));
 near(abilityScore(n,'stamina'),100);
 near(abilityScore(n,'resilience'),40+4*GAME_BALANCE.restResilienceRecovery-GAME_BALANCE.graduateResilienceDecay);
 near(n.hidden.confidence,40+4*.3);
 near(n.hidden.stress,60-1-4*14+.8*(1.4-(40+4*GAME_BALANCE.restResilienceRecovery)/125));
 assert.ok(n.lastReport.results.every(r=>r.outcome==='recovered'));
 assert.deepEqual(n.career,s.career);assert.deepEqual(s,before);assert.ok(validateSave(n));
});

test('capability growth tuning does not soften losses, relationship support, or workshop costs',()=>{
 const s=fixture();s.pending={kind:'monthly-issue',id:'internal-admission'};
 setScore(s,'rapport',40);const before=structuredClone(s),n=decide(s,'supported');
 near(abilityScore(n,'autonomy'),40-.4);
 near(abilityScore(n,'rapport'),40+.5);
 near(n.hidden.stress,s.hidden.stress-1.5);
 assert.deepEqual(s,before);assert.ok(validateSave(n));
 const workshop=fixture();workshop.pending={kind:'workshop-plan'};
 const result=decide(workshop,'host');
 near(abilityScore(result,'research')-abilityScore(workshop,'research'),GAME_BALANCE.abilityGrowthScale);
 near(abilityScore(result,'learning')-abilityScore(workshop,'learning'),GAME_BALANCE.abilityGrowthScale);
 assert.equal(result.lab.funds,workshop.lab.funds-12);
 assert.equal(result.professorEnergy,workshop.professorEnergy-8);
 assert.deepEqual(result.career,workshop.career);assert.deepEqual(result.project,workshop.project);
});

test('growth tuning accepts bounded values and rejects missing or non-finite factors',()=>{
 assert.ok(validBalance(GAME_BALANCE));
 for(const key of ['abilityGrowthScale','policyGrowthScale']){
  for(const value of [0,.5,1])assert.equal(validBalance({...GAME_BALANCE,[key]:value}),true);
  for(const value of [-.01,1.01,NaN,Infinity,'0.5'])assert.equal(validBalance({...GAME_BALANCE,[key]:value}),false);
  const incomplete={...GAME_BALANCE};delete incomplete[key];assert.equal(validBalance(incomplete),false);
 }
});

test('loading a saved student never retroactively scales attained capabilities or mutates the input',()=>{
 const s=fixture();
 for(const key of ['learning','research','language','social','autonomy','teaching','industry','enterprise','outreach','intuition','manners'])setScore(s,key,88);
 const before=structuredClone(s),n=migrateSave(s);
 assert.ok(n);assert.ok(validateSave(n));assert.deepEqual(n.hidden,s.hidden);assert.deepEqual(s,before);
 assert.deepEqual(migrateSave(n).hidden,n.hidden);
});


test('slower growth preserves actionable qualification preparation proposals without forcing the agreed plan',()=>{
 const s=createState('학생',19);s.started=true;s.month=30;s.route='integrated';s.project.phase=1;
 const before=JSON.stringify(s);assert.equal(proposeSchedule(s)[0],'coursework');assert.equal(JSON.stringify(s),before);
 s.month=48;s.career.qual='failed';s.history.push({month:48,kind:'qual',passed:false,attempt:1});
 assert.deepEqual(proposeSchedule(s).slice(0,2),['coursework','coursework']);
 s.month=50;s.history.push({month:49,kind:'month',results:[{actual:'coursework',performed:true},{actual:'coursework',performed:true}]});
 assert.deepEqual(proposeSchedule(s).slice(0,2),['presentation','presentation']);
 s.service.trainingStartMonth=s.month;assert.ok(proposeSchedule(s).every(id=>id==='free'));
});

test('advanced practice tapers continuously without changing rapport, recovery or losses',()=>{
 for(const initial of [30,49.5,50,68,70,80,95]){
  let score=initial;for(let i=0;i<80;i++)score=abilityAfterChange(score,.75);
  near(score,abilityAfterChange(initial,60));
  assert.ok(score<100);assert.ok(score>initial);
 }
 near(abilityAfterChange(69,2),abilityAfterChange(abilityAfterChange(69,1),1));
 const gain=n=>abilityAfterChange(n,1)-n;
 assert.ok(gain(50)>gain(70)&&gain(70)>gain(90)&&gain(90)>gain(95));
 assert.ok(abilityAfterChange(95,40)<96,'a long high-level practice block must not fill the ceiling');
 assert.ok(abilityAfterChange(90,5)<rapportAfterChange(90,5),'advanced skills taper more than rapport');
 for(const initial of [1,50,95,100])assert.equal(abilityAfterChange(initial,-3),Math.max(0,initial-3));
});

test('old maximized records preserve accomplishments and mark where the new growth rules start',()=>{
 const s=fixture();delete s.growthVersion;
 for(const key of ['learning','research','language','social','autonomy','teaching','industry','enterprise','outreach','intuition','manners'])setScore(s,key,100);
 const before=structuredClone(s),loaded=migrateSave(s);
 assert.ok(loaded);assert.equal(loaded.growthVersion,GROWTH_VERSION);assert.equal(loaded.growthLegacyThrough,s.month);
 assert.deepEqual(loaded.hidden,before.hidden);assert.deepEqual(loaded.career,before.career);assert.deepEqual(loaded.project,before.project);assert.deepEqual(s,before);
 assert.equal(loaded.history.filter(h=>h.kind==='growth-rules').length,1);
 assert.deepEqual(migrateSave(loaded),loaded,'repeated loading must not reapply a migration');
 const oldEnding=structuredClone(s);oldEnding.ending='institute';
 const restored=migrateSave(oldEnding);assert.deepEqual(restored.history,oldEnding.history);assert.deepEqual(restored.hidden,oldEnding.hidden);assert.equal(restored.ending,'institute');
});

test('new and legacy ongoing students use the same prospective growth without rewriting attained values',()=>{
 const current=fixture(),legacy=structuredClone(current);delete legacy.growthVersion;
 for(const s of [current,legacy])for(const key of ['learning','research','manners'])setScore(s,key,90);
 const plan=recoveries(),currentNext=simulateMonth(current,plan,{...options(current),proposal:plan}),legacyNext=simulateMonth(legacy,plan,{...options(legacy),proposal:plan});
 assert.deepEqual(legacyNext.hidden,currentNext.hidden);assert.equal(legacyNext.growthLegacyThrough,legacy.month);assert.equal(legacyNext.growthVersion,GROWTH_VERSION);
 near(abilityScore(currentNext,'learning'),abilityAfterChange(90,.9*GAME_BALANCE.policyGrowthScale*GAME_BALANCE.abilityGrowthScale));
 assert.ok(abilityScore(currentNext,'learning')-90<.01);
 assert.equal(currentNext.growthLegacyThrough,undefined);
 for(const value of [0,3,-1,NaN,'2'])assert.equal(validateSave({...current,growthVersion:value}),false);
 assert.equal(validateSave({...current,growthLegacyThrough:current.month+1}),false);
});

test('later projects need further original work while the first research project and conference preparation stay accessible',()=>{
 const s=fixture(),first=projectThresholds(s);s.project.id=2;const second=projectThresholds(s);s.project.id=8;const later=projectThresholds(s);
 assert.ok(second.submission>first.submission);assert.ok(later.submission>second.submission);
 assert.equal(second.conference,first.conference);assert.equal(later.conference,first.conference);
 assert.equal(first.phaseTargets.slice(0,5).reduce((a,b)=>a+b,0),first.submission);
});
