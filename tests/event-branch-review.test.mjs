import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,EVENTS,eventEligible,eventWeight,simulateMonth,decide,migrateSave,validateSave,calendarMonth,studentTrainingActive} from '../dist/engine.js';
import {adaptEventText} from '../dist/events.js';
import {DISCIPLINES} from '../dist/disciplines.js';

const event=id=>EVENTS.find(e=>e.id===id);
function graduate(month=50,locale='ko'){
  const s=createState('검수학생',91,{gender:'male',professorGender:'male',locale});
  s.month=month;s.started=true;s.route='integrated';
  assert.ok(validateSave(s));return s;
}

test('qualification counseling remains available before an attempt or during a retake, and ends after passing',()=>{
  for(const status of ['not_due','due','preparing','failed','passed']){
    const s=graduate();s.career.qual=status;
    assert.equal(eventEligible(s,event('counsel-qual')),status!=='passed',status);
  }
  const undergraduate=createState('검수학생',91);undergraduate.month=20;
  assert.equal(eventEligible(undergraduate,event('counsel-qual')),false);
});

test('semester-end grading follows the completed June or December in either locale, and never precedes graduate admission',()=>{
  for(const locale of ['ko','en'])for(const route of ['masters','integrated'])for(let month=25;month<37;month++){
    const s=graduate(month,locale);s.route=route;
    const completedMonth=calendarMonth(month-1,locale);
    assert.equal(eventEligible(s,event('grading')),[6,12].includes(completedMonth),`${locale}/${route}/${completedMonth}`);
  }
  const undergraduate=createState('검수학생',91);undergraduate.month=4;
  assert.equal(calendarMonth(undergraduate.month-1),6);
  assert.equal(eventEligible(undergraduate,event('grading')),false);
});

test('loading an obsolete pending exam or grading event keeps the run and advances to the remaining decision',()=>{
  for(const id of ['counsel-qual','grading']){
    const s=graduate();s.career.qual='passed';
    s.pending={kind:'event',id};s.pendingQueue=[{kind:'conversation-topic'}];
    const before=structuredClone(s),n=migrateSave(s);
    assert.ok(n&&validateSave(n),id);
    assert.equal(n.pending?.kind,'conversation-topic');
    assert.deepEqual(n.hidden,before.hidden);assert.deepEqual(n.career,before.career);
    assert.equal(n.month,before.month);assert.equal(n.seed,before.seed);
    assert.deepEqual(s,before,'migration must not mutate the original save');
    assert.equal(n.history.at(-1).kind,'event-migration');
    assert.deepEqual(migrateSave(n),n,'an obsolete event is retired only once');
  }
  const grading=graduate(28);grading.pending={kind:'event',id:'grading'};
  assert.equal(migrateSave(grading).pending.id,'grading','a correctly timed pending event is preserved');
});

test('declared rare counseling actually occurs less often without consuming the gameplay RNG',()=>{
  assert.equal(eventWeight(graduate(),'one-student-lab'),.3);
  assert.equal(eventWeight(graduate(),'military-hidden'),.5);
  const counts=new Map();
  for(let seed=1;seed<=400;seed++){
    if(seed%4===0)continue; // This fixture needs an unfulfilled service plan.
    const s=createState('검수학생',seed,{gender:'male',professorGender:'male'});s.month=12;
    const rest=Array(4).fill('rest'),n=simulateMonth(s,rest,{proposal:rest});
    assert.equal(n.seed,s.seed,'counseling retains its deterministic draw, with no added RNG consumption');
    assert.equal(event(n.pending?.id)?.kind,'counseling');
    counts.set(n.pending.id,(counts.get(n.pending.id)??0)+1);
  }
  const rare=counts.get('military-hidden'),ordinary=[...counts].filter(([id])=>id!=='military-hidden').map(([,count])=>count);
  const mean=ordinary.reduce((sum,count)=>sum+count,0)/ordinary.length;
  assert.ok(rare>mean*.3&&rare<mean*.7,JSON.stringify(Object.fromEntries(counts)));
});

test('event scenes do not invent an accepted abstract, an unpaid completed month or repeated firsts',()=>{
  const s=graduate(30);s.history.push({kind:'stipend-payment',month:30,amount:13,fromPool:13});
  assert.equal(s.travel.status,'none');
  for(const locale of ['ko','en']){
    const poster=adaptEventText(event('poster-travel').body[locale],s,locale);
    assert.doesNotMatch(poster,/초록은 채택|abstract is accepted/);
    assert.match(poster,/확인하기 전에|Before confirming/);
    const payment=event('stipend-delay').body[locale];
    assert.match(payment,/다음 인건비|next stipend/);
    assert.doesNotMatch(payment,/이번 달 월세|rent is due this month/);
  }
  assert.doesNotMatch(event('teaching').title.ko,/첫/);
  assert.doesNotMatch(event('collaboration').body.ko,/처음으로/);
  assert.doesNotMatch(event('top-journal').body.ko,/막 출판/);
  assert.match(event('first-year-helper').body.ko,/공동 세미나/);
  assert.match(event('peer-conflict').body.ko,/다른 팀/);
});

test('all supported dry disciplines receive computing and data-security scenes in both languages without changing event effects',()=>{
  for(const field of DISCIPLINES.filter(field=>field.labModes.includes('dry'))){
    const s=createState('검수학생',91,{fieldId:field.id,labMode:'dry'}),before=structuredClone(s),definitions=structuredClone(EVENTS);
    for(const e of EVENTS)for(const locale of ['ko','en']){
      const scene=[e.title[locale],e.body[locale],...e.options.map(o=>o.label[locale])].map(text=>adaptEventText(text,s,locale)).join('\n');
      assert.doesNotMatch(scene,locale==='ko'?/실험|시료|대조군|배양|공동기기실/:/\bexperiment(?:s)?\b|\bmeasurement(?:s)?\b|\binstrument(?:s)?\b|\blab notebook\b|\bcontrol group\b/i,`${field.id}/${locale}/${e.id}`);
    }
    assert.match(adaptEventText(event('equipment').body.en,s,'en'),/storage device/);
    assert.match(adaptEventText(event('safety').body.en,s,'en'),/data security/);
    assert.deepEqual(s,before);assert.deepEqual(EVENTS,definitions);
  }
});

test('an already recorded presentation award is shown as a follow-up rather than another first award',()=>{
  const s=graduate(30);s.career.conferences=1;s.career.awards=1;
  s.history.push({month:29,kind:'presentation-award',projectId:1});
  s.pending={kind:'event',id:'best-presentation'};
  const before=structuredClone(s);
  for(const locale of ['ko','en']){
    assert.match(adaptEventText(event('best-presentation').title[locale],s,locale),/이후|After/);
    assert.match(adaptEventText(event('best-presentation').body[locale],s,locale),/이미 기록|recorded/);
  }
  const n=decide(s,0);
  assert.equal(n.career.awards,1);
  assert.deepEqual(s,before,'rendering and the follow-up decision preserve the input');
});

test('winter training blocks advising and student events throughout the three absent weeks, with winter-only start dates',()=>{
  for(const seed of [1,2,3,5,6,7]){
    let s=createState('검수학생',seed,{gender:'male',professorGender:'male'});
    s.month=36;s.route='integrated';s.pending={kind:'service'};
    s=decide(s,'training');
    s.month=s.service.trainingStartMonth;s.pending=null;s.pendingQueue=[];
    assert.ok([1,2].includes(calendarMonth(s.month)));
    assert.equal(studentTrainingActive(s),true);
    for(const e of EVENTS)assert.equal(eventEligible(s,e),false,e.id);
    const rest=Array(4).fill('free');
    for(const facultyAction of ['conversation','support'])assert.throws(()=>simulateMonth(s,rest,{facultyAction}),/advising is unavailable/);
    const n=simulateMonth(s,rest,{facultyAction:'routine'});
    assert.ok(n.lastReport.results.slice(0,3).every(r=>r.actual==='training'&&!r.performed&&r.progress===0));
    assert.equal(n.history.some(h=>h.month===n.month&&h.kind==='advising-conversation'),false);
    assert.equal(studentTrainingActive(n),false);
    assert.ok(validateSave(n));
  }
});
