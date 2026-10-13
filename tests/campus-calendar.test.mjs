import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,proposeSchedule,validateSave,feedbackEffect,abilityScore,calendarMonth,projectWork,projectThresholds,qualificationStudy,simulateMonth,eventEligible,EVENTS,studentTrainingActive,winterTrainingMonth,migrateSave,projectTitle} from '../dist/engine.js';
import {campusPolicy,campusMonth,isCampusBreak,campusSemester} from '../dist/campus-calendar.js';
import {academicWeeks,weekContext} from '../dist/academic-calendar.js';
import {facultyCapacity} from '../dist/workload.js';
import {grantCallOpen} from '../dist/funding.js';
import {canTravel} from '../dist/travel.js';
import {managedOptions,affordableEventChoice,simulateWithRestConsent} from './play-support.mjs';
const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',event:0,route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
function play(seed,route='integrated',goal='routine'){
 let s=createState('Jordan Ellis',seed,{locale:'en',age:38,gender:'male'});
 for(let month=0;month<96&&!s.ending;month++){
 if(goal==='true'&&!s.project.submitted){s.publication.journal=s.career.topPapers<1?'leading':'standard';s.project.journal=s.publication.journal;}
 const plan=proposeSchedule(s),score=k=>abilityScore(s,k);
 if(goal==='true'&&s.month>=24){const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'recovery':primary;plan[3]=score('teaching')<65?'teach':score('language')<70?'language':primary;if([4,10].includes(calendarMonth(s.month,s.locale))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='recovery';}else if(s.month>=30&&s.month<=48&&s.month%3===0){plan[0]='coursework';}else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}}
 if(goal==='true'&&s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2)){plan[0]=plan[1]='coursework';}
 const action=goal==='true'?(s.career.papers&&s.career.recommendations<4?'recommend':'conversation'):month%6===0?'conversation':'routine';const aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen';const feedback=s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned;
 s=simulateWithRestConsent(s,plan,{...managedOptions(s,action),feedback},'allow');
 for(let guard=0;s.pending&&!s.ending;guard++){if(guard>=20)throw Error('loop');const p=s.pending;if(['service','service-review'].includes(p.kind)||p.id==='military-hidden')throw Error('US service event');const c=p.kind==='event'?affordableEventChoice(s,p.id):p.kind==='conference-plan'?(p.scope==='domestic'?'together':'none'):p.kind==='route'?route:p.kind==='masters'&&route==='masters'?'graduate':choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];s=decide(s,c);}
 }
 return s;
}

test('U.S. policy starts in September and distinguishes spring classes, finals, and summer research',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en'}),policy=campusPolicy(s);
 assert.equal(policy.startMonth,9);assert.equal(policy.stipendMonth,9);
 assert.deepEqual(Array.from({length:12},(_,month)=>campusMonth(month,s)),[9,10,11,12,1,2,3,4,5,6,7,8]);
 assert.equal(campusMonth(-1,s),8);assert.equal(campusMonth(96,s),9);
 assert.deepEqual(policy.breakMonths,[6,7,8]);assert.deepEqual(policy.midtermMonths,[3,10]);assert.deepEqual(policy.finalMonths,[5,12]);
 assert.deepEqual(policy.conferenceMonths,[4,10]);assert.deepEqual(policy.grantMonths,[3,9]);
 assert.equal(campusSemester(0,s),'Fall semester');assert.equal(campusSemester(4,s),'Spring semester');assert.equal(campusSemester(9,s),'Summer break');
 assert.equal(isCampusBreak(4,s),false);assert.equal(isCampusBreak(9,s),true);
 assert.throws(()=>policy.breakMonths.push(1),TypeError);assert.throws(()=>policy.stipendMonth=3,TypeError);
 assert.equal(campusPolicy('ko').startMonth,3);assert.equal(campusSemester(0,'ko'),'1학기');assert.equal(campusSemester(10,'ko'),'겨울방학');
});

test('U.S. academic years use seven-day weeks, with no exam or required-conference collision',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en'});
 for(let year=0;year<8;year++){
  let count=0;
  for(let month=0;month<12;month++){
   s.month=year*12+month;const weeks=academicWeeks(s);count+=weeks.length;
   assert.ok([4,5].includes(weeks.length));
   for(let i=0;i<weeks.length;i++){
    const week=weeks[i],context=weekContext(s,i,weeks.length);
    assert.equal(new Date(week.start).getUTCDay(),1);assert.equal(Number(week.start.slice(5,7)),campusMonth(s.month,s));
    assert.ok(!(context.exam&&context.conference));
    if(context.exam)assert.ok([3,5,10,12].includes(campusMonth(s.month,s)));
    if(context.conference)assert.ok([4,10].includes(campusMonth(s.month,s)));
   }
  }
  assert.ok([52,53].includes(count));
 }
 s.month=6;assert.equal(weekContext(s,academicWeeks(s).length-1).examType,'중간고사');
 s.month=8;assert.equal(weekContext(s,2).exam,true);assert.equal(weekContext(s,2).examType,'기말고사');
 s.month=9;assert.equal(weekContext(s,2).exam,false);
});

test('U.S. stipend changes are committed each September, while March remains a grant call',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en'}),before=JSON.stringify(s),budget={...s.lab.budget,salary:80};
 const reviewed=simulateMonth(s,proposeSchedule(s),{budget});
 assert.equal(reviewed.lab.budget.salary,80);assert.equal(reviewed.stipendLock,80);assert.equal(JSON.stringify(s),before);
 const spring=structuredClone(s);spring.month=6;
 assert.ok(grantCallOpen(spring));assert.throws(()=>simulateMonth(spring,proposeSchedule(spring),{budget}),/September/);
 const unchanged=simulateMonth(spring,proposeSchedule(spring));assert.equal(unchanged.lab.budget.salary,60);
 const nextYear=structuredClone(s);nextYear.month=12;assert.equal(simulateMonth(nextYear,proposeSchedule(nextYear),{budget}).stipendLock,80);
 const korean=createState('학생',6);assert.equal(simulateMonth(korean,proposeSchedule(korean),{budget}).stipendLock,80);
 korean.month=6;assert.throws(()=>simulateMonth(korean,proposeSchedule(korean),{budget}),/March/);
});

test('U.S. workload and coursework events require spring teaching and allow research in summer',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en'});s.month=28;s.route='integrated';
 const teaching=EVENTS.find(e=>e.id==='teaching'),coursework=EVENTS.find(e=>e.id==='counsel-coursework'),grading=EVENTS.find(e=>e.id==='grading');
 assert.equal(campusMonth(s.month,s),1);assert.equal(facultyCapacity(s).teachingRequired,true);assert.ok(eventEligible(s,teaching));assert.ok(eventEligible(s,coursework));
 s.month=33;assert.equal(campusMonth(s.month,s),6);assert.equal(facultyCapacity(s).vacation,true);assert.equal(facultyCapacity(s).teachingRequired,false);
 assert.equal(eventEligible(s,teaching),false);assert.equal(eventEligible(s,coursework),false);assert.equal(eventEligible(s,grading),true); // previous month was May finals
 s.month=34;assert.equal(eventEligible(s,grading),false);
});

test('U.S. summer abstracts lead to July or August travel and summer workshops',()=>{
 let accepted;
 for(let seed=1;seed<=100&&!accepted;seed++){
  const s=createState('Jordan Ellis',seed,{locale:'en'});s.month=33;s.route='integrated';
  const result=simulateWithRestConsent(s,proposeSchedule(s),{facultyAction:'abstract'},'allow');
  if(canTravel(result)){accepted=result;accepted.pending=null;accepted.pendingQueue=[];}
 }
 assert.ok(accepted);assert.equal(campusMonth(accepted.month,accepted),7);assert.equal(accepted.travel.conferenceMonth,35);assert.ok(validateSave(accepted));
 const trip=simulateWithRestConsent(accepted,proposeSchedule(accepted),{facultyAction:'abroad_student'},'allow');
 assert.ok(trip.history.some(h=>h.kind==='research-travel'&&h.calendarMonth===7));assert.ok(validateSave(trip));
 const winter=createState('Jordan Ellis',6,{locale:'en'});winter.month=28;winter.route='integrated';
 assert.throws(()=>simulateMonth(winter,proposeSchedule(winter),{facultyAction:'abstract'}),/Abstract submission/);
 assert.throws(()=>simulateMonth(winter,proposeSchedule(winter),{attendance:{domestic:'none',overseas:'professor'}}),/Research travel/);
 const may=createState('Jordan Ellis',6,{locale:'en'});may.month=8;
 const june=simulateMonth(may,proposeSchedule(may));
 assert.ok([june.pending,...june.pendingQueue].some(p=>p?.kind==='academic-exam'&&p.examType==='기말고사'));
 assert.ok([june.pending,...june.pendingQueue].some(p=>p?.kind==='workshop-plan'));
});

test('English saves and pure titles remain valid without Korean service scheduling',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en',gender:'male'}),before=JSON.stringify(s);
 assert.equal(winterTrainingMonth(s),null);assert.equal(studentTrainingActive(s),false);assert.ok(!eventEligible(s,EVENTS.find(e=>e.id==='military-hidden')));
 assert.doesNotMatch(projectTitle(s),/[가-힣]/);assert.equal(projectTitle(s),projectTitle(s));assert.equal(JSON.stringify(s),before);
 const loaded=migrateSave(s);assert.ok(validateSave(loaded));assert.equal(loaded.locale,'en');assert.equal(JSON.stringify(s),before);
});

test('older English saves leave inapplicable service prompts without losing past records',()=>{
 const s=createState('Jordan Ellis',6,{locale:'en',gender:'male'});s.month=36;s.route='integrated';
 s.pending={kind:'service'};s.pendingQueue=[{kind:'service-review'},{kind:'event',id:'military-hidden'},{kind:'story',id:'graduate'}];
 s.history.push({kind:'service',month:24,choice:'consult'});const before=JSON.stringify(s),loaded=migrateSave(s);
 assert.ok(validateSave(loaded));assert.deepEqual(loaded.pending,{kind:'story',id:'graduate'});assert.deepEqual(loaded.pendingQueue,[]);
 assert.deepEqual(loaded.history.filter(h=>h.kind==='service'),s.history.filter(h=>h.kind==='service'));assert.equal(JSON.stringify(s),before);
});

test('U.S. master and direct Ph.D. routes complete staged defenses through ordinary play',()=>{
 for(const [route,months] of [['masters',48],['integrated',96]]){
  const s=play(6,route);assert.equal(s.month,months);assert.ok(validateSave(s));assert.notEqual(s.ending,'gameover');
  const thesis=s.history.filter(h=>h.kind==='thesis');assert.deepEqual(thesis.map(h=>h.step),['draft','presentation','questions','revision','verdict']);assert.equal(thesis.at(-1).passed,true);
  assert.equal(campusMonth(s.month-1,s),8);assert.equal(s.history.filter(h=>h.kind==='month').length,months);
  assert.ok(!s.history.some(h=>['service','service-review','military-training'].includes(h.kind)||h.id==='military-hidden'));
  if(route==='integrated')assert.equal(s.career.qual,'passed');
 }
});

test('the U.S. faculty ending remains reachable in 96 months without injected abilities or funds',()=>{
 const s=play(2,'integrated','true');assert.equal(s.month,96);assert.equal(s.ending,'true');assert.ok(validateSave(s));
 assert.ok(s.career.topPapers>=1);assert.ok(s.impact.hIndex>=2);assert.equal(s.career.qual,'passed');assert.equal(s.history.filter(h=>h.kind==='month').length,96);
 assert.ok(!s.history.some(h=>['service','service-review','military-training'].includes(h.kind)||h.id==='military-hidden'));
});
