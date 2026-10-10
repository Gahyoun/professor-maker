import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_BALANCE,validBalance} from '../dist/balance.js';
import {createState,simulateMonth,decide,proposeSchedule,abilityScore,HIDDEN_RANGES,validateSave,migrateSave} from '../dist/engine.js';

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
