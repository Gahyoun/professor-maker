import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,HIDDEN_RANGES,proposeSchedule,simulateMonth,studentRestRequest,validateSave} from '../dist/engine.js';
import {academicWeeks,examWindow,weekContext} from '../dist/academic-calendar.js';
import {canTravel} from '../dist/travel.js';
import {studentLine} from '../dist/dialogue.js';

function setScore(s,key,score){const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+score*(hi-lo)/100;}
function state({stress=70,stamina=40,resilience=70,month=24}={}){
  const s=createState('김하늘',6);s.started=true;s.month=month;if(month>=24)s.route='integrated';
  for(const [key,value] of Object.entries({stress,stamina,resilience}))setScore(s,key,value);
  return s;
}
function uncomplicatedMonth(count){
  const s=state();for(let month=24;month<36;month++){
    s.month=month;const weeks=academicWeeks(s);
    if(weeks.length===count&&weeks.every((_,i)=>!examWindow(s,i,weeks.length)&&!weekContext(s,i,weeks.length).conference))return month;
  }
  throw new Error(`No uncomplicated ${count}-week fixture`);
}
const recoveryCount=s=>proposeSchedule(s).filter(id=>id==='recovery').length;
const restLine=(line,lang)=>assert.match(line,lang==='ko'?/쉬|회복|휴식/:/rest|recover|break/i);

test('ordinary rest requests require high stress and either low stamina or low resilience',()=>{
  for(const input of [
    {stress:64.99,stamina:25.01,resilience:20.01},
    {stress:65,stamina:45.01,resilience:35.01},
    {stress:100,stamina:80,resilience:80},
    {stress:0,stamina:40,resilience:30},
  ])assert.equal(studentRestRequest(state(input)),null,JSON.stringify(input));
  assert.deepEqual(studentRestRequest(state({stress:65,stamina:45,resilience:70})),{weeks:1,reason:'physical'});
  assert.deepEqual(studentRestRequest(state({stress:65,stamina:70,resilience:35})),{weeks:1,reason:'mental'});
  assert.deepEqual(studentRestRequest(state({stress:65,stamina:45,resilience:35})),{weeks:1,reason:'both'});
});

test('acute physical or mental exhaustion requests two weeks even without high stress',()=>{
  for(const [input,reason] of [
    [{stress:0,stamina:25,resilience:70},'physical'],
    [{stress:64.99,stamina:70,resilience:20},'mental'],
    [{stress:0,stamina:0,resilience:0},'both'],
  ]){
    const s=state({...input,month:uncomplicatedMonth(4)}),before=JSON.stringify(s);
    assert.deepEqual(studentRestRequest(s),{weeks:2,reason});
    assert.equal(recoveryCount(s),2);
    restLine(studentLine(s,'ko'),'ko');restLine(studentLine(s,'en'),'en');
    assert.equal(JSON.stringify(s),before,'requesting recovery is a pure proposal');
  }
  assert.equal(studentRestRequest(state({stress:64.99,stamina:25.01,resilience:20.01})),null);
});

test('request severity uses normalized conditions and includes the second-week boundaries',()=>{
  for(const input of [
    {stress:79.99,stamina:25.01,resilience:70},
    {stress:79.99,stamina:70,resilience:20.01},
  ])assert.equal(studentRestRequest(state(input)).weeks,1,JSON.stringify(input));
  for(const input of [
    {stress:80,stamina:40,resilience:70},
    {stress:65,stamina:25,resilience:70},
    {stress:65,stamina:70,resilience:20},
  ])assert.equal(studentRestRequest(state(input)).weeks,2,JSON.stringify(input));
  const stored=state({stress:70,stamina:46,resilience:36});
  assert.ok(stored.hidden.stamina>45&&stored.hidden.resilience>35);
  assert.equal(studentRestRequest(stored),null,'0–999 ability storage must be normalized before comparison');
});

test('four- and five-week proposals request recovery while keeping other choices intact',()=>{
  for(const count of [4,5]){
    const s=state({month:uncomplicatedMonth(count)}),healthy=structuredClone(s);
    setScore(healthy,'stress',12);setScore(healthy,'stamina',85);setScore(healthy,'resilience',65);
    const baseline=proposeSchedule(healthy),proposed=proposeSchedule(s),firstFree=baseline.indexOf('free');
    assert.equal(proposed.length,count);assert.equal(proposed[firstFree],'recovery');
    assert.equal(recoveryCount(s),1);
    for(let i=0;i<count;i++)if(i!==firstFree)assert.equal(proposed[i],baseline[i]);
    setScore(s,'stress',80);assert.equal(recoveryCount(s),2);
    assert.equal(proposeSchedule(s)[firstFree],'recovery');
    if(count===4)assert.equal(proposeSchedule(s)[0],'recovery','the extra request uses the first available work week');
    if(count===5)assert.ok(baseline.every((id,i)=>id!=='free'||proposeSchedule(s)[i]==='recovery'),'existing free weeks are used first');
  }
});

test('rest proposals preserve fixed domestic conferences and exam preparation windows',()=>{
  for(const month of [1,3,7,9]){
    const s=state({stress:90,stamina:20,resilience:20,month}),healthy=structuredClone(s);
    // A close relationship gives independent exam preparation a free-time slot.
    s.hidden.rapport=60;healthy.hidden.rapport=60;setScore(healthy,'stress',12);setScore(healthy,'stamina',85);setScore(healthy,'resilience',65);
    const baseline=proposeSchedule(healthy),proposed=proposeSchedule(s);
    for(let i=0;i<proposed.length;i++)if(examWindow(s,i,proposed.length)||weekContext(s,i,proposed.length).conference){
      assert.equal(proposed[i],baseline[i],`month ${month}, protected week ${i+1}`);
      assert.notEqual(proposed[i],'recovery');
    }
    assert.ok(recoveryCount(s)<=2);
    assert.ok(recoveryCount(s)>0);
  }
});

test('accepted overseas student travel keeps the last week out of a recovery request',()=>{
  for(const overseas of ['student','together']){
    const s=state({stress:90,stamina:20,resilience:20,month:5});
    s.attendance.overseas=overseas;s.travel={status:'accepted',submittedAt:4,decidedAt:5,conferenceMonth:6,projectId:1};
    assert.ok(canTravel(s));assert.notEqual(proposeSchedule(s).at(-1),'recovery');
    assert.equal(recoveryCount(s),2);
  }
});

test('military training and an already finished run suppress new rest requests',()=>{
  const training=state({stress:90,stamina:20,resilience:20});training.service.trainingStartMonth=training.month;
  assert.equal(studentRestRequest(training),null);assert.ok(proposeSchedule(training).every(id=>id==='free'));
  const ended=state({stress:90,stamina:20,resilience:20});ended.ending='leave';
  assert.equal(studentRestRequest(ended),null);assert.equal(recoveryCount(ended),0);
});

test('a rest request takes priority over exam and repeated-feedback dialogue in both locales',()=>{
  const s=state({month:1});s.hidden.rapport=60;
  for(const advising of [
    {inattention:6,lastFeedback:'listen',streak:6},
    {inattention:0,lastFeedback:'praise',streak:4},
    {inattention:0,lastFeedback:'listen',streak:4},
  ]){
    s.advising=advising;
    for(const lang of ['ko','en']){
      const line=studentLine(s,lang);restLine(line,lang);
      assert.doesNotMatch(line,/exam week|look more closely|what I can improve|each meeting ends/i);
      assert.doesNotMatch(line,/\b(?:65|45|35|80|25|20|999)\b/,'hidden condition scores stay out of dialogue');
    }
  }
});

test('rest-request dialogue distinguishes physical and mental difficulty and clears as conditions recover',()=>{
  for(const lang of ['ko','en']){
    const physical=state({stamina:40,resilience:70}),mental=state({stamina:70,resilience:30}),both=state({stamina:40,resilience:30});
    const lines=[physical,mental,both].map(s=>studentLine(s,lang));lines.forEach(line=>restLine(line,lang));
    assert.equal(new Set(lines).size,3);
    for(const s of [physical,mental,both]){
      setScore(s,'stress',50);assert.equal(studentRestRequest(s),null);assert.equal(recoveryCount(s),0);
      setScore(s,'stress',70);setScore(s,'stamina',80);setScore(s,'resilience',70);
      assert.equal(studentRestRequest(s),null);assert.equal(recoveryCount(s),0);
    }
  }
});

test('proposing rest and reading the request never change the plan, saved state or RNG',()=>{
  const s=state({stress:90,stamina:20,resilience:20}),before=JSON.stringify(s);
  for(let i=0;i<3;i++){
    assert.deepEqual(studentRestRequest(s),{weeks:2,reason:'both'});
    proposeSchedule(s);studentLine(s,'ko');studentLine(s,'en');
  }
  assert.equal(JSON.stringify(s),before);
});

test('the agreed plan can differ from a request without silently inserting recovery activities',()=>{
  const s=state({month:0}),agreed=academicWeeks(s).map(()=> 'coursework');
  assert.ok(validateSave(s));assert.ok(proposeSchedule(s).includes('recovery'));
  const before=JSON.stringify(s),next=simulateMonth(s,agreed);
  assert.equal(JSON.stringify(s),before);assert.deepEqual(next.lastReport.results.map(result=>result.assigned),agreed);
  assert.ok(next.lastReport.results.every(result=>result.assigned!=='recovery'));
  assert.ok(validateSave(next));
});
