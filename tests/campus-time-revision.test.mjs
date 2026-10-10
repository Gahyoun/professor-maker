import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,validateSave,calendarMonth,abilityScore,HIDDEN_RANGES,eventEligible,eventWeight,EVENTS} from '../dist/engine.js';
import {facultyCapacity,professorAge} from '../dist/workload.js';
import {CONFERENCE_TIERS} from '../dist/venues.js';
import {GAME_BALANCE} from '../dist/balance.js';

const rest=Array(4).fill('rest');
const clone=structuredClone;
const pending=s=>[s.pending,...s.pendingQueue].filter(Boolean);
const score=(s,key,value)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+(hi-lo)*value/100;};
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} differs from ${expected}`);

function fixture(seed,month=26,options={}){
 const s=createState('김하늘',seed,{gender:'female',...options});
 s.month=month;
 if(month>=24)s.route='integrated';
 for(const [key,value] of Object.entries({stamina:100,motivation:100,rapport:100,diligence:100,stress:20,language:40,social:30}))score(s,key,value);
 return s;
}

function findRun(make,plan,wanted,options={}){
 for(let seed=1;seed<=120;seed++){
  const s=make(seed),before=clone(s);
  const n=simulateMonth(s,plan,{proposal:plan,...options});
  assert.deepEqual(s,before,'simulation must not mutate its input or RNG');
  if(wanted(n,s)){assert.ok(validateSave(n));return {s,n};}
 }
 assert.fail('No deterministic seed in the fixture range produced the required outcome');
}

test('elapsed faculty age feeds capacity and the age-limited new-PI event',()=>{
 const s=createState('학생',7,{gender:'female',age:35}),before=clone(s);
 for(const [month,age] of [[0,35],[12,36],[24,37],[96,43]]){
  const at={...s,month};
  assert.equal(professorAge(at),age);
  assert.equal(facultyCapacity(at).age,age);
  assert.equal(at.professorProfile.age,35);
 }
 const event=EVENTS.find(e=>e.id==='new-pi-mistake');
 assert.ok(eventEligible({...s,month:24},event));
 assert.equal(eventEligible({...s,month:25},event),false);
 assert.ok(eventWeight({...s,month:3},event)>eventWeight({...s,month:24},event));
 assert.equal(eventWeight({...s,month:25},event),1);
 assert.deepEqual(s,before);
});

test('sabbaticals protect teaching and administration through their last month, including fatigue and recommendation work',()=>{
 for(const institution of ['national','private','institute'])for(const mode of ['home','away'])for(const facultyAction of ['routine','recommend']){
  const s=fixture(16,32,{institution});
  s.sabbatical={...s.sabbatical,active:true,until:33,mode};
  s.professorEnergy=20;
  const allocation={research:4,teaching:0,admin:0,mentoring:4};
  const options={proposal:rest,allocation,facultyAction};
  const n=simulateMonth(s,rest,options);
  assert.equal(n.workload.sabbatical,true);
  assert.equal(n.sabbatical.active,false);
  assert.ok(n.professorEnergy<25,'the fixture must exercise the fatigue penalty');
  assert.equal(n.professor.teaching,s.professor.teaching,`${institution}/${mode}/${facultyAction}: teaching`);
  assert.equal(n.professor.admin,s.professor.admin,`${institution}/${mode}/${facultyAction}: administration`);
  const ordinary=clone(s);ordinary.sabbatical.active=false;
  const comparison=simulateMonth(ordinary,rest,options);
  assert.ok(comparison.professor.teaching<s.professor.teaching);
  assert.ok(comparison.professor.admin<s.professor.admin);
  // Isolate the following automatic month from separately chosen event effects.
  const following=clone(n);following.pending=null;following.pendingQueue=[];
  const next=simulateMonth(following,rest,options);
  assert.equal(next.workload.sabbatical,false);
  assert.ok(next.professor.teaching<n.professor.teaching);
  assert.ok(next.professor.admin<n.professor.admin);
 }
});

test('a sabbatical still applies explicit event consequences',()=>{
 const s=fixture(16,32);
 s.sabbatical={...s.sabbatical,active:true,until:44,mode:'home'};
 s.pending={kind:'event',id:'committee'};
 const n=decide(s,1);
 assert.equal(n.professor.admin,s.professor.admin-4);
 assert.equal(n.professor.teaching,s.professor.teaching+3);
 assert.equal(n.sabbatical.active,true);
});

test('domestic attendance is decided during March or September for the following conference month in either locale',()=>{
 for(const [locale,month] of [['ko',11],['ko',5],['en',5],['en',11]]){
  const s=fixture(16,month,{locale});
  const n=simulateMonth(s,rest,{proposal:rest});
  assert.ok([3,9].includes(calendarMonth(n.month,locale)));
  const plans=pending(n).filter(p=>p.kind==='conference-plan'&&p.scope==='domestic');
  assert.equal(plans.length,1);
  assert.equal(plans[0].targetMonth,n.month+1);
  assert.ok([4,10].includes(calendarMonth(plans[0].targetMonth,locale)));
  const choosing=clone(n);choosing.pending=plans[0];choosing.pendingQueue=[];
  const chosen=decide(choosing,'none');
  assert.equal(chosen.attendance.domestic,'none');
  assert.equal(chosen.history.at(-1).targetMonth,n.month+1);
  const conferenceMonth=simulateMonth(chosen,rest,{proposal:rest});
  assert.equal(pending(conferenceMonth).some(p=>p.kind==='conference-plan'&&p.scope==='domestic'),false);
 }
 const malformed=fixture(16,12);malformed.pending={kind:'conference-plan',scope:'domestic',targetMonth:97};
 assert.equal(validateSave(malformed),false);
});

test('domestic listening and unsuccessful presentation still build social experience; successful presentation builds more',()=>{
 const plan=['rest','rest','conference','rest'];
 const {s:listener,n:listened}=findRun(seed=>fixture(seed,1),plan,n=>n.lastReport.results[2].outcome==='attended');
 close(abilityScore(listened,'social')-abilityScore(listener,'social'),2*CONFERENCE_TIERS.regular.learning*GAME_BALANCE.abilityGrowthScale);
 close(abilityScore(listened,'language')-abilityScore(listener,'language'),.7*GAME_BALANCE.abilityGrowthScale);
 assert.equal(listened.career.conferences,0);

 const talk=['conference','rest','rest','rest'];
 const prepared=seed=>{
  const s=fixture(seed);s.project.phase=3;s.project.progress=20;
  s.history.push({month:s.month,kind:'month',results:[{actual:'presentation',performed:true},{actual:'presentation',performed:true}]});
  return s;
 };
 const success=findRun(prepared,talk,n=>n.lastReport.results[0].outcome==='presented');
 close(abilityScore(success.n,'social')-abilityScore(success.s,'social'),4*CONFERENCE_TIERS.regular.learning*GAME_BALANCE.abilityGrowthScale);
 assert.equal(success.n.career.conferences,1);

 const failure=findRun(seed=>{const s=fixture(seed);s.project.phase=3;s.project.progress=20;return s;},talk,n=>n.lastReport.results[0].outcome==='presentation_failed');
 close(abilityScore(failure.n,'social')-abilityScore(failure.s,'social'),2*CONFERENCE_TIERS.regular.learning*GAME_BALANCE.abilityGrowthScale);
 assert.equal(failure.n.career.conferences,0);
 assert.ok(pending(failure.n).some(p=>p.kind==='presentation-recovery'));
});

test('overseas participation retains its social benefit when the talk fails and adds a larger benefit when it succeeds',()=>{
 const make=seed=>{
  const s=fixture(seed,29);
  s.travel={status:'accepted',submittedAt:28,decidedAt:29,conferenceMonth:30,projectId:s.project.id,tier:'regular'};
  return s;
 };
 for(const [outcome,gain,count] of [['presentation_failed',2,0],['presented',6,1]]){
  const {s,n}=findRun(make,rest,n=>n.lastReport.results.at(-1).outcome===outcome,{facultyAction:'abroad_student'});
  close(abilityScore(n,'social')-abilityScore(s,'social'),gain*GAME_BALANCE.abilityGrowthScale);
  assert.equal(n.career.conferences,count);
  assert.ok(n.history.some(h=>h.kind==='research-travel'&&h.attendance==='student'));
 }
});

test('a full work month raises stress modestly while resilience still buffers the increase',()=>{
 const plan=Array(4).fill('language');
 const {s,n}=findRun(seed=>{const s=fixture(seed,32);score(s,'resilience',60);return s;},plan,n=>n.lastReport.results.every(r=>r.performed));
 const delta=n.hidden.stress-s.hidden.stress;
 // Former full-month workload: four 2-point weeks plus 0.4 monthly,
 // buffered by resilience and reduced by the default core-hours policy.
 const formerDelta=(4*2+.4)*(1.4-60/125)-1;
 assert.ok(delta>formerDelta+1&&delta<formerDelta+5,{delta,formerDelta});
 assert.ok(n.hidden.stress<50,'a normal work month should not immediately cause a crisis');
 const resilient=clone(s);score(resilient,'resilience',90);
 const buffered=simulateMonth(resilient,plan,{proposal:plan});
 assert.ok(buffered.lastReport.results.every(r=>r.performed));
 assert.ok(buffered.hidden.stress-resilient.hidden.stress<delta);
});
