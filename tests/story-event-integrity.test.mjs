import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,eventEligible,simulateMonth,validateSave,EVENTS} from '../dist/engine.js';
import {adaptEventText} from '../dist/events.js';
import {counselingBody,counselingFollowup} from '../dist/counseling.js';

const event=id=>EVENTS.find(e=>e.id===id);
function ready(month=30){
  const s=createState('가상학생',91,{fieldId:'050',labMode:'wet'});
  s.month=month;s.started=true;s.route=month>=24?'integrated':null;
  assert.ok(validateSave(s));return s;
}

test('announced awards remain achievements under every adviser response and later acknowledgment does not award them twice',()=>{
  for(const id of ['best-paper','best-presentation']){
    const s=ready();s.pending={kind:'event',id};
    if(id==='best-paper'){s.career.papers=1;s.career.submissions=1;s.career.completedProjects=1;}
    else s.career.conferences=1;
    assert.ok(validateSave(s));assert.ok(eventEligible(s,event(id)));
    const before=structuredClone(s);
    for(let choice=0;choice<event(id).options.length;choice++){
      const n=decide(s,choice);
      assert.equal(n.career.awards,1,`${id} choice ${choice}`);
      assert.equal(n.history.filter(h=>h.kind==='event'&&h.id===id).length,1);
      assert.equal(eventEligible(n,event(id)),false,'a once-only award announcement cannot reopen');
      assert.ok(validateSave(n));
      assert.throws(()=>decide(n,choice),/No pending decision/);
      n.pending={kind:'monthly-issue',id:'presentation-award'};
      const acknowledged=decide(n,'acknowledge');
      assert.equal(acknowledged.career.awards,1,'reading the result does not award it again');
      assert.ok(validateSave(acknowledged));
    }
    assert.deepEqual(s,before);
  }
});

test('TA teaching and grading events obey the same graduate-school gate as weekly TA',()=>{
  const undergrad=ready(10);
  for(const id of ['teaching','grading'])assert.equal(eventEligible(undergrad,event(id)),false,id);
  assert.throws(()=>simulateMonth(undergrad,['teach','rest','rest','rest']),/TA unlocks in graduate school/);
  for(const route of ['masters','integrated']){
    for(const id of ['teaching','grading']){
      // Grading follows the June term end (month 28); teaching happens during term (month 24 is March).
      const graduate=ready(id==='grading'?28:24);graduate.route=route;
      assert.ok(eventEligible(graduate,event(id)),`${route} ${id}`);
      graduate.pending={kind:'event',id};
      assert.ok(validateSave(decide(graduate,0)));
    }
  }
});

test('a presentation-award follow-up does not create a second copy of the already recorded award',()=>{
  const s=ready();s.career.conferences=2;s.career.awards=1;
  s.history=[{month:29,kind:'presentation-award',projectId:1,abroad:false}];
  s.pending={kind:'event',id:'best-presentation'};
  assert.ok(validateSave(s));
  for(let choice=0;choice<4;choice++){
    const n=decide(s,choice);
    assert.equal(n.career.awards,1,`follow-up choice ${choice}`);
    assert.equal(n.history.filter(h=>h.kind==='presentation-award').length,1);
    assert.ok(validateSave(n));
  }
});

test('reviewer feedback targets an actual current revision rather than any historical submission',()=>{
  const s=ready(40);s.career.submissions=1;s.career.papers=1;s.career.completedProjects=1;
  s.project.id=2;s.project.titleIndex=1;
  s.history=[{month:32,kind:'submission',projectId:1},{month:34,kind:'paper',projectId:1}];
  assert.ok(validateSave(s));
  assert.equal(eventEligible(s,event('reviewer-two')),false,'an accepted old paper cannot trigger a new revision');
  const current=ready(40);current.career.submissions=1;
  Object.assign(current.project,{phase:5,progress:0,submitted:true,submittedAt:39,reviewMonths:0,revisions:0});
  assert.ok(validateSave(current));
  assert.equal(eventEligible(current,event('reviewer-two')),false,'waiting for a first review is not a revision request');
  current.project.revisions=1;
  current.history.push({month:40,kind:'revision',projectId:current.project.id});
  assert.ok(validateSave(current));assert.ok(eventEligible(current,event('reviewer-two')));
});

test('dry-lab event titles, scenes and choices use computing and validation rather than wet-lab work without altering state or effects',()=>{
  for(const fieldId of ['048','049','050','056','072','090']){
    const dry=createState('가상학생',91,{fieldId,labMode:'dry'});
    assert.equal(dry.professorProfile.labMode,'dry',fieldId);
    const before=structuredClone(dry),eventsBefore=structuredClone(EVENTS);
    for(const e of EVENTS){
      const title=adaptEventText(e.title.ko,dry),body=counselingBody(e,dry);
      const labels=e.options.map(o=>adaptEventText(o.label.ko,dry));
      assert.doesNotMatch([title,body,...labels].join('\n'),/실험|대조군|시료|배양|공동기기실/,`${fieldId} ${e.id}`);
    }
    assert.deepEqual(dry,before,'rendering never consumes RNG');
    assert.deepEqual(EVENTS,eventsBefore,'rendering never changes shared event definitions');
    assert.match(counselingBody(event('equipment'),dry),/계산·저장 장치/);
    assert.match(counselingBody(event('negative-result'),dry),/반복 계산과 자료 검증/);
  }
});

test('dry-lab noun substitutions preserve Korean subject, object and directional particles',()=>{
  const dry=createState('가상학생',91,{fieldId:'048',labMode:'dry'});
  assert.equal(adaptEventText('장비를 교체한다. 장비가 멈췄다. 장비로 확인한다. 장비와 자료를 점검한다.',dry),
    '계산 자원을 교체한다. 계산 자원이 멈췄다. 계산 자원으로 확인한다. 계산 자원과 자료를 점검한다.');
  assert.equal(adaptEventText('시료를 확인한다. 대조군을 정한다.',dry),'원자료를 확인한다. 비교 조건을 정한다.');
});

test('wet-lab event presentation retains instrument and experiment details',()=>{
  const wet=createState('가상학생',91,{fieldId:'056',labMode:'wet'}),before=structuredClone(wet);
  for(const e of EVENTS){
    assert.equal(adaptEventText(e.title.ko,wet),e.title.ko);
    assert.equal(adaptEventText(e.body.ko,wet),e.body.ko);
    for(const o of e.options)assert.equal(adaptEventText(o.label.ko,wet),o.label.ko);
  }
  assert.match(counselingBody(event('negative-result'),wet),/반복 측정/);
  assert.match(counselingBody(event('negative-result'),wet),/실험/);
  assert.deepEqual(wet,before);
});

test('research-visit counseling is offered only while the adviser is actually away',()=>{
  const s=ready(50);s.sabbatical={...s.sabbatical,active:false,until:0,mode:'home'};
  assert.equal(eventEligible(s,event('sabbatical-contact')),false);
  s.sabbatical={...s.sabbatical,active:true,until:60,mode:'home'};
  assert.equal(eventEligible(s,event('sabbatical-contact')),false);
  s.sabbatical.mode='away';
  assert.ok(eventEligible(s,event('sabbatical-contact')));
  assert.match(event('sabbatical-contact').body.ko,/방문 연구 중/);
});

test('counseling follow-up distinguishes a promise from recorded work, difficulties and untracked external meetings',()=>{
  const s=ready();s.pending={kind:'event',id:'counsel-coursework'};
  let n=decide(s,1);const before=structuredClone(n);
  assert.match(counselingFollowup(n),/시도해 볼게요/);
  assert.doesNotMatch(counselingFollowup(n),/해 봤어요/);
  assert.deepEqual(n,before);
  n.month++;
  n.history.push({month:n.month,kind:'month',results:[{actual:'rest',performed:true,scienceFailures:0}]});
  assert.match(counselingFollowup(n),/시도해 볼게요/,'a rest week is not evidence of coursework');
  n.history.at(-1).results=[{actual:'coursework',performed:true,scienceFailures:0}];
  assert.match(counselingFollowup(n),/시도해 봤어요/);
  n.history.at(-1).results=[{actual:'unfinished',assigned:'coursework',performed:false,scienceFailures:0}];
  assert.match(counselingFollowup(n),/계획대로 되지 않은/);
  n.history.at(-1).results=[{actual:'coursework',performed:true,scienceFailures:1}];
  assert.match(counselingFollowup(n),/계획대로 되지 않은/,'participation is not necessarily a successful study session');
  const career=ready(35);career.route='masters';career.pending={kind:'event',id:'counsel-master-career'};
  const connected=decide(career,1);connected.month++;
  assert.doesNotMatch(counselingFollowup(connected),/선배와 이야기해 봤어요/);
  assert.match(counselingFollowup(connected),/질문을 준비/,'a planned introduction cannot invent an external meeting');
});
