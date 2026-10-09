import test from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,MONTHS,ACTIVITIES,PROJECT_PHASES,EVENTS,createState,simulateMonth,decide,stage,proposeSchedule,calendarMonth,salaryBase,monthlyBudgetCost,canContinue,canDefend,careerEnding,isTrueEnding,TRUE_REQUIREMENTS,validateSave,HIDDEN_RANGES,abilityScore} from '../dist/engine.js';
const copy=s=>structuredClone(s);
const normalized=s=>Object.fromEntries(Object.keys(s.hidden).map(k=>[k,abilityScore(s,k)]));
function setScore(s,key,value){const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+value*(hi-lo)/100;}
function resolve(s,route='integrated') {
  let guard=0;
  while(s.pending&&!s.ending) {
    assert.ok(guard++<8,'decision queue must terminate');
    const kind=s.pending.kind;
    s=decide(s,kind==='event'?0:kind==='route'?route:kind==='masters'?'continue':kind==='qual'?'exam':kind==='sabbatical'?'home':kind==='defense'?'defend':'consult');
  }
  return s;
}
function strategy(s,goal='institute') {
  const plan=proposeSchedule(s),h=normalized(s);
  if(['unemployed','unrelated'].includes(goal)&&s.career.papers>=3){plan.splice(0,4,'rest','coffee','rest',h.learning<50?'study':'language');}
  else if(goal==='true') {
    plan[3]=h.learning<85?'study':h.language<75?'language':h.teaching<75?'teach':h.social<65?'coffee':'study';
    if(s.project.phase===5){plan[0]=h.teaching<75?'teach':'study';plan[1]=h.language<75?'language':'coffee';}
  } else if(goal==='corporate')plan[3]='industry';
  else if(goal==='startup')plan[3]='startup';
  else if(goal==='youtuber')plan[3]='video';
  else if(goal==='unrelated')plan[3]=h.industry<35?'industry':'language';
  if(goal==='unrelated'&&s.career.papers>=3&&h.industry<35)plan[3]='industry';
  if(s.project.phase>=2&&!s.project.conference&&s.career.papers<(goal==='unemployed'||goal==='unrelated'?3:20))plan[3]='conference';
  if([4,10].includes(calendarMonth(s.month,s.locale))){plan[2]='conference';plan[3]='rest';}
  return plan;
}
export function play(goal='institute',seed=1,route='integrated',locale='ko') {
  let s=createState('Test student',seed,{gender:'female',locale});
  for(let m=0;m<MONTHS&&!s.ending;m++) {
    const plan=strategy(s,goal);
    const facultyAction=goal==='true'&&s.career.recommendations<4?'recommend':s.sabbatical.active?'support':'routine';
    s=resolve(simulateMonth(s,plan,{feedback:'listen',facultyAction}),route);
    assert.ok(validateSave(s),`invalid generated state at month ${s.month}`);
  }
  return s;
}

test('version 3 uses 96 months with four weekly plans and a serial six-phase project',()=>{
  const s=createState('Student',42);assert.equal(VERSION,3);assert.equal(MONTHS,96);assert.equal(s.plan.length,4);assert.equal(PROJECT_PHASES.length,6);assert.equal(Object.keys(ACTIVITIES).length,12);assert.ok(validateSave(s));
});
test('simulation and decisions preserve their inputs; seeded runs reproduce outcomes',()=>{
  const initial=createState('Student',42),snapshot=JSON.stringify(initial);
  const a=simulateMonth(initial,proposeSchedule(initial));assert.equal(JSON.stringify(initial),snapshot);assert.equal(a.month,1);
  assert.deepEqual(a,simulateMonth(initial,proposeSchedule(initial)));
  a.pending={kind:'route'};const before=JSON.stringify(a);decide(a,'integrated');assert.equal(JSON.stringify(a),before);
});
test('gender generation is slightly male-biased but never changes ability or outcomes',()=>{
  let males=0;for(let seed=1;seed<=2000;seed++)males+=createState('Student',seed*7919).gender==='male';assert.ok(males>1000&&males<1200,String(males));
  const male=createState('Student',7,{gender:'male'}),female=createState('Student',7,{gender:'female'});
  assert.deepEqual(male.hidden,female.hidden);assert.deepEqual(male.temperament,female.temperament);assert.equal(male.seed,female.seed);
  assert.deepEqual(simulateMonth(male,proposeSchedule(male)).hidden,simulateMonth(female,proposeSchedule(female)).hidden);
});
test('invalid weekly plans, allocation and operating budgets cannot advance',()=>{
  const s=createState();assert.throws(()=>simulateMonth(s,['study']));assert.throws(()=>simulateMonth(s,['x','x','x','x']));
  assert.throws(()=>simulateMonth(s,s.plan,{allocation:{research:2,teaching:2,admin:2,mentoring:1}}));
  assert.throws(()=>simulateMonth(s,s.plan,{budget:{...s.lab.budget,environment:7}}));
  assert.throws(()=>simulateMonth(s,s.plan,{budget:{...s.lab.budget,salary:65}}));
  s.pending={kind:'route'};assert.throws(()=>simulateMonth(s,s.plan));
});
test('Korean calendar starts March, English September; April/October week 3 is mandatory',()=>{
  assert.deepEqual(Array.from({length:12},(_,i)=>calendarMonth(i,'ko')),[3,4,5,6,7,8,9,10,11,12,1,2]);
  assert.deepEqual(Array.from({length:12},(_,i)=>calendarMonth(i,'en')),[9,10,11,12,1,2,3,4,5,6,7,8]);
  for(const locale of ['ko','en']){const s=createState('Student',1,{locale});s.month=1;assert.equal(proposeSchedule(s)[2],'conference');assert.throws(()=>simulateMonth(s,['study','study','rest','coffee']));const n=simulateMonth(s,['rest','rest','conference','rest']);assert.equal(n.career.festivalAttendance,1);assert.equal(n.career.conferences,0);assert.ok(n.history.some(h=>h.kind==='conference-festival'&&h.week===3));}
});
test('annual grants, degree stipends, annual pay lock and funding timing use actual costs',()=>{
  let s=createState('Student',1);assert.equal(s.lab.funds,600);assert.equal(salaryBase(s),13);assert.equal(monthlyBudgetCost(s),18.8);
  const first=simulateMonth(s,s.plan);assert.ok(Math.abs(first.lab.funds-(600-18.8))<1e-8);
  assert.throws(()=>simulateMonth(first,proposeSchedule(first),{budget:{...first.lab.budget,salary:70}}));
  s.month=12;s.lab.funds=0;assert.throws(()=>simulateMonth(s,proposeSchedule(s),{facultyAction:'funding'}));
  s.lab.funds=25;s.grants.reportYears=[1];const grant=simulateMonth(s,proposeSchedule(s));assert.ok(grant.history.some(h=>h.kind==='annual-grant'));assert.ok(grant.lab.funds>400);
  s.month=24;s.route='masters';assert.equal(salaryBase(s),22);s.month=48;assert.equal(salaryBase(s),30);
});
test('vacation travel checks cost, room count and affirmative same-gender consent',()=>{
  const s=createState('Student',1,{gender:'female',professorGender:'male'});
  assert.throws(()=>simulateMonth(s,s.plan,{facultyAction:'abroad_student'}));
  s.month=4;assert.equal(calendarMonth(s.month),7);
  assert.throws(()=>simulateMonth(s,proposeSchedule(s),{facultyAction:'abroad_shared',travelConsent:true}));
  const trip=simulateMonth(s,proposeSchedule(s),{facultyAction:'abroad_together'});const entry=trip.history.find(h=>h.kind==='research-travel');assert.equal(entry.rooms,2);assert.equal(entry.cost,34);assert.equal(entry.joining,true);
  s.professorGender='female';assert.throws(()=>simulateMonth(s,proposeSchedule(s),{facultyAction:'abroad_shared'}));
  assert.equal(simulateMonth(s,proposeSchedule(s),{facultyAction:'abroad_shared',travelConsent:true}).history.find(h=>h.kind==='research-travel').rooms,1);
  s.gender='unspecified';s.professorGender='unspecified';assert.throws(()=>simulateMonth(s,proposeSchedule(s),{facultyAction:'abroad_shared',travelConsent:true}));
});
test('performance feedback depends on evidence; harshness has a relationship cost',()=>{
  const base=createState('Student',1);const report={month:1,results:Array.from({length:4},(_,index)=>({week:index+1,proposed:'study',actual:'study',performed:true,outcome:'completed',progress:5,scienceFailures:0})),completion:1,progress:20,scienceFailures:0,published:0,conferences:0};base.month=2;base.lastReport=report;
  const good=simulateMonth(base,['rest','rest','rest','rest'],{feedback:'praise'}),bad=simulateMonth(base,['rest','rest','rest','rest'],{feedback:'critique'});
  assert.ok(good.hidden.motivation>bad.hidden.motivation);assert.ok(good.hidden.confidence>bad.hidden.confidence);
  base.lastReport={...report,completion:.5,progress:0,scienceFailures:2};const repaired=simulateMonth(base,['rest','rest','rest','rest'],{feedback:'critique'});assert.ok(repaired.hidden.research>base.hidden.research);assert.ok(repaired.project.progress>base.project.progress);
  const harsh=simulateMonth(base,['rest','rest','rest','rest'],{feedback:'harsh'});assert.ok(harsh.hidden.rapport<base.hidden.rapport);assert.equal(harsh.behavior.harsh,1);
});
test('rest recovers fatigue; low wellbeing warns then causes departure, faculty zero is immediate',()=>{
  const s=createState('Student',1);setScore(s,'stamina',20);s.hidden.stress=80;
  const recovered=simulateMonth(s,['rest','rest','coffee','rest']);assert.ok(recovered.hidden.stamina>s.hidden.stamina);assert.ok(recovered.hidden.stress<s.hidden.stress);
  setScore(s,'rapport',0);setScore(s,'trust',0);s.hidden.motivation=0;let first=simulateMonth(s,['experiment','experiment','experiment','experiment'],{feedback:'harsh'});assert.equal(first.crisis,1);assert.equal(first.ending,null);assert.ok(first.history.some(h=>h.kind==='warning'));
  first=resolve(first);const second=simulateMonth(first,['experiment','experiment','conference','experiment'],{feedback:'harsh'});assert.equal(second.ending,'dropout');
  const p=createState();p.professor.admin=0;assert.equal(simulateMonth(p,p.plan).ending,'gameover');
  const neglected=createState();neglected.professor.admin=3;assert.equal(simulateMonth(neglected,neglected.plan,{allocation:{research:4,teaching:2,admin:0,mentoring:2}}).ending,'gameover');
});
test('project submissions and accepted papers differ; review never completes in one month',()=>{
  const s=createState('Student',2);s.month=2;s.project.phase=4;s.project.progress=31;setScore(s,'language',100);setScore(s,'research',100);setScore(s,'learning',100);
  const submitted=simulateMonth(s,['paper','paper','paper','rest']);assert.equal(submitted.career.submissions,1);assert.equal(submitted.career.papers,0);assert.equal(submitted.project.phase,5);assert.equal(submitted.project.reviewMonths,0);
  const waiting=simulateMonth(resolve(submitted),['rest','rest','rest','rest']);assert.equal(waiting.career.papers,0);assert.equal(waiting.project.reviewMonths,1);
  const reviewed=simulateMonth(resolve(waiting),['rest','rest','rest','rest']);assert.equal(reviewed.career.submissions,1);assert.ok(reviewed.career.papers<=1);if(reviewed.career.papers)assert.equal(reviewed.project.id,2);
});
test('presentations require a prepared project and cannot be counted repeatedly',()=>{
  const s=createState('Student',1);s.month=2;s.project.phase=2;setScore(s,'stamina',100);s.hidden.motivation=100;setScore(s,'rapport',100);
  const presented=simulateMonth(s,['conference','conference','conference','rest']);assert.equal(presented.career.conferences,1);assert.ok(presented.project.conference);
  const again=simulateMonth(resolve(presented),['conference','conference','conference','rest']);assert.equal(again.career.conferences,1);
});
test('both degree paths, qualification and overlapping sabbatical decisions are queued',()=>{
  for(const route of ['masters','integrated']) {
    let s=createState('Student',3,{gender:'female'});s.month=23;s=simulateMonth(s,proposeSchedule(s));assert.equal(s.pending.kind,'route');s=decide(s,route);assert.equal(stage(s),route==='masters'?'masters':'phd');
    s.month=47;setScore(s,'learning',75);setScore(s,'research',75);s.career.submissions=1;s.career.papers=1;s.career.completedProjects=1;s.career.conferences=1;
    s=simulateMonth(s,proposeSchedule(s));assert.equal(s.pending.kind,route==='masters'?'masters':'qual');s=decide(s,route==='masters'?'continue':'exam');assert.equal(s.pending.kind,'sabbatical');s=decide(s,'home');assert.equal(s.sabbatical.until,60);assert.equal(s.pending,null);
    if(route==='masters'){s.month=59;s=simulateMonth(s,proposeSchedule(s));assert.equal(s.pending.kind,'qual');s=decide(s,'exam');}assert.equal(s.career.qual,'passed');
  }
});
test('master review validates outputs, allows one extension, and rechecks after six months',()=>{
  const s=createState();s.month=48;s.route='masters';s.pending={kind:'masters'};assert.throws(()=>decide(s,'continue'));assert.equal(decide(s,'graduate').ending,'unfinished');
  const extended=decide(s,'extend');assert.equal(extended.mastersReviewAt,54);assert.equal(stage(extended),'masters');extended.pending={kind:'masters'};assert.throws(()=>decide(extended,'extend'));
});
test('qualification can be prepared and retried; two failures end the academic path',()=>{
  const s=createState();s.month=48;s.route='integrated';s.pending={kind:'qual'};const prepared=decide(s,'prepare');assert.equal(prepared.qualDeferredAt,49);assert.ok(prepared.hidden.learning>s.hidden.learning);
  const failed=decide(s,'exam');assert.equal(failed.career.qualAttempts,1);assert.equal(failed.qualDeferredAt,49);failed.month=49;failed.pending={kind:'qual'};assert.equal(decide(failed,'exam').ending,'unfinished');
});
test('Korean male service events are counseling only; other genders and English omit them',()=>{
  for(const [locale,gender,expected] of [['ko','male',true],['ko','female',false],['en','male',false]]) {
    let s=createState('Student',1,{gender,locale});s.month=35;s.route='integrated';s=simulateMonth(s,proposeSchedule(s));assert.equal(s.pending?.kind==='service',expected);
    if(expected){s=decide(s,'consult');assert.equal(s.service.status,'planning');s.month=83;s=simulateMonth(s,proposeSchedule(s));assert.equal(s.pending.kind,'service-review');assert.equal(decide(s,'consult').service.status,'consulted');}
  }
  const male=createState('Student',5,{gender:'male'}),female=createState('Student',5,{gender:'female'});
  male.month=36;male.pending={kind:'service'};const consulted=decide(male,'consult');assert.deepEqual(consulted.hidden,female.hidden);
});
test('normal profiles remain distinct and every true-ending constraint is necessary',()=>{
  const s=createState();s.month=96;s.route='integrated';s.career.qual='passed';s.career.submissions=7;s.career.papers=7;s.career.completedProjects=7;s.career.conferences=6;s.career.recommendations=4;
  for(const [key,value] of Object.entries(TRUE_REQUIREMENTS)){if(key in s.hidden)setScore(s,key,value);else if(key in s.career)s.career[key]=value;else for(const f of Object.keys(s.professor))s.professor[f]=value;}
  assert.ok(isTrueEnding(s));for(const [key,value] of Object.entries(TRUE_REQUIREMENTS)){const c=copy(s);if(key in c.hidden)setScore(c,key,value-1);else if(key in c.career)c.career[key]=value-1;else c.professor.admin=value-1;assert.equal(isTrueEnding(c),false,key);}
  s.career.qual='failed';assert.equal(isTrueEnding(s),false);assert.equal(canDefend(s),false);
});
test('whole eight-year runs survive balanced care across seeds and both calendars',()=>{
  for(const locale of ['ko','en'])for(let seed=1;seed<=8;seed++){const s=play('institute',seed,'integrated',locale);assert.equal(s.month,96,JSON.stringify({seed,locale,month:s.month,ending:s.ending,hidden:s.hidden}));assert.ok(canDefend(s));assert.ok(s.ending);assert.equal(s.career.festivalAttendance,16);assert.equal(s.history.filter(h=>h.kind==='month').length,96);}
});
test('all six normal careers and the demanding faculty ending are reachable through play',()=>{
  for(const goal of ['institute','corporate','unrelated','startup','unemployed','youtuber','true']){const s=play(goal,6);assert.equal(s.ending,goal,JSON.stringify({goal,ending:s.ending,month:s.month,hidden:s.hidden,career:s.career,professor:s.professor}));}
});
test('saved games reject old versions, malformed weeks, impossible career counts and invalid events',()=>{
  const s=createState();assert.ok(validateSave(s));
  for(const mutate of [c=>c.version=1,c=>c.plan.pop(),c=>c.hidden.stress='0',c=>c.lab.budget.salary=61,c=>c.professor.research=NaN,c=>c.project.phase=6,c=>c.career.papers=1,c=>c.pending={kind:'event',id:'missing'},c=>c.pending={kind:'event',id:'best-paper'}]){const c=copy(s);mutate(c);assert.equal(validateSave(c),false);}
});
test('imported weekly results reject null rows, unknown HTML activity and malformed fields',()=>{
  const initial=createState('Student',42),s=simulateMonth(initial,proposeSchedule(initial));assert.ok(validateSave(s));
  const corruptions=[
    rows=>rows[0]=null,
    rows=>rows[0].proposed='<img src=x onerror=alert(1)>',
    rows=>rows[0].actual='<script>alert(1)</script>',
    rows=>rows[0].proposed='toString',
    rows=>rows[0].week=2,
    rows=>rows[0].performed='true',
    rows=>rows[0].outcome='unknown',
    rows=>rows[0].progress=-1,
    rows=>rows[0].progress=1001,
    rows=>rows[0].scienceFailures=2,
    rows=>rows[0].scienceFailures=.5,
  ];
  for(const mutate of corruptions){const c=copy(s);mutate(c.lastReport.results);assert.equal(validateSave(c),false);}
  const unfinished=copy(s);unfinished.lastReport.results[0].actual='unfinished';unfinished.lastReport.results[0].performed=false;unfinished.lastReport.results[0].outcome='not_completed';assert.ok(validateSave(unfinished));
  assert.throws(()=>simulateMonth(initial,['toString','rest','rest','rest']));
});
test('event preconditions, once flags and cooldowns survive saves; awards require completed work',()=>{
  const s=createState();s.month=30;s.route='integrated';s.career.submissions=1;s.career.papers=1;s.career.completedProjects=1;s.pending={kind:'event',id:'best-paper'};
  const awarded=decide(s,0);assert.equal(awarded.career.awards,1);assert.ok(awarded.eventFlags['best-paper'].count===1);assert.ok(validateSave(awarded));awarded.pending={kind:'event',id:'best-paper'};assert.equal(validateSave(awarded),false);
  const ids=new Set();for(const e of EVENTS){assert.ok(!ids.has(e.id));ids.add(e.id);assert.ok(e.options.length===2);for(const lang of ['ko','en']){assert.ok(e.title[lang]);assert.ok(e.body[lang]);assert.ok(e.options.every(o=>o.label[lang]));}}
});
test('mixed student spectra normalize consistently and reject each out-of-range save value',()=>{
  const s=createState('Student',6);for(const [key,[lo,hi]] of Object.entries(HIDDEN_RANGES)){
    const c=copy(s);c.hidden[key]=lo;assert.equal(abilityScore(c,key),0);c.hidden[key]=hi;assert.equal(abilityScore(c,key),100);
    c.hidden[key]=lo-1;assert.equal(validateSave(c),false,key);c.hidden[key]=hi+1;assert.equal(validateSave(c),false,key);
  }
  const legacy=copy(s);legacy.version=2;assert.equal(validateSave(legacy),false);
});
test('diligence improves execution while trading away stamina; resilience buffers stress',()=>{
  let highCompleted=0,lowCompleted=0,highStamina=0,lowStamina=0;
  const plan=['experiment','experiment','experiment','experiment'];
  for(let seed=1;seed<=60;seed++){
    const low=createState('Student',seed),high=copy(low);low.month=2;high.month=2;
    for(const s of [low,high])for(const key of ['stamina','motivation','rapport','trust'])setScore(s,key,50);
    setScore(low,'diligence',0);setScore(high,'diligence',100);
    const a=simulateMonth(low,plan,{proposal:plan}),b=simulateMonth(high,plan,{proposal:plan});
    lowCompleted+=a.lastReport.completion;highCompleted+=b.lastReport.completion;lowStamina+=abilityScore(a,'stamina');highStamina+=abilityScore(b,'stamina');
  }
  assert.ok(highCompleted>lowCompleted);assert.ok(highStamina<lowStamina);
  const frail=createState('Student',2),resilient=copy(frail);frail.month=2;resilient.month=2;setScore(frail,'resilience',25);setScore(resilient,'resilience',90);
  assert.ok(simulateMonth(resilient,plan,{proposal:plan}).hidden.stress<simulateMonth(frail,plan,{proposal:plan}).hidden.stress);
});
test('schedule discussion changes trust independently from rapport and preserves proposal data',()=>{
  const s=createState('Student',6),proposal=['study','study','rest','language'],plan=['experiment','analysis','rest','coffee'];s.month=2;
  const discussed=simulateMonth(s,plan,{proposal,feedback:'listen'}),imposed=simulateMonth(s,plan,{proposal,feedback:'harsh'});
  assert.equal(discussed.lastReport.scheduleDiscussion.approach,'discussed');assert.equal(discussed.lastReport.scheduleDiscussion.changed,3);assert.equal(imposed.lastReport.scheduleDiscussion.approach,'imposed');assert.ok(discussed.hidden.trust>imposed.hidden.trust);
  assert.deepEqual(proposal,['study','study','rest','language']);assert.throws(()=>simulateMonth(s,plan,{proposal:['study']}));
});
test('language supports manuscript progress and creativity supports research productivity',()=>{
  const plan=['paper','paper','rest','rest'];let fluentProgress=0,basicProgress=0;
  for(let seed=1;seed<=30;seed++){
    const basic=createState('Student',seed),fluent=copy(basic);for(const s of [basic,fluent]){s.month=2;s.project.phase=4;setScore(s,'research',60);}
    setScore(basic,'language',15);setScore(fluent,'language',90);
    basicProgress+=simulateMonth(basic,plan,{proposal:plan}).lastReport.progress;fluentProgress+=simulateMonth(fluent,plan,{proposal:plan}).lastReport.progress;
  }
  assert.ok(fluentProgress>basicProgress);
  const ordinary=createState('Student',6),creative=copy(ordinary);ordinary.month=2;creative.month=2;setScore(ordinary,'creativity',10);setScore(creative,'creativity',90);
  const science=['study','study','rest','rest'];assert.ok(simulateMonth(creative,science,{proposal:science}).lastReport.progress>simulateMonth(ordinary,science,{proposal:science}).lastReport.progress);
});
test('the hidden resident researcher career is reachable after a full real cultivation history',()=>{
  const s=play('institute',4);assert.equal(s.month,96);assert.equal(s.ending,'resident_researcher');assert.ok(canDefend(s));assert.ok(abilityScore(s,'rapport')>=85);assert.ok(abilityScore(s,'resilience')<=40);
  const distant=copy(s);setScore(distant,'rapport',60);assert.notEqual(careerEnding(distant),'resident_researcher');
  const resilient=copy(s);setScore(resilient,'resilience',70);assert.notEqual(careerEnding(resilient),'resident_researcher');
});
test('sustained overwork causes leave while sustained relationship damage causes dropout',()=>{
  let s=createState('Student',6,{gender:'female'});
  for(let i=0;i<36&&!s.ending;i++){
    const primary=['study','experiment','experiment','analysis','paper','paper'][s.project.phase],plan=Array(4).fill(primary);
    if([4,10].includes(calendarMonth(s.month,s.locale)))plan[2]='conference';
    s=resolve(simulateMonth(s,plan,{proposal:plan,feedback:'listen'}));
  }
  assert.equal(s.ending,'leave');assert.ok(s.history.some(h=>h.kind==='warning'&&h.reason==='health'));assert.ok(abilityScore(s,'rapport')>12);assert.ok(abilityScore(s,'trust')>12);
});
test('grant reporting, three-year renewal history and save validation integrate with monthly play',()=>{
  const s=play('institute',6);assert.ok(s.history.some(h=>h.kind==='grant-report'));assert.equal(s.history.filter(h=>h.kind==='grant-selection').length,2);assert.ok(s.grants.reportYears.includes(8));assert.ok(validateSave(s));
  const c=copy(s);c.grants=null;assert.equal(validateSave(c),false);
  const report=createState('Student',1);assert.ok(simulateMonth(report,report.plan,{facultyAction:'report'}).grants.reportYears.includes(1));
});
