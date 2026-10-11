import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,decide,eventEligible,validateSave} from '../dist/engine.js';
import {EVENTS} from '../dist/events.js';
import {getEndingPages} from '../dist/stories.js';

function settleOtherDecisions(state,target){
 const choices={story:'encourage','academic-exam':'support','monthly-issue':'acknowledge','conference-plan':'none','workshop-plan':'skip','failure-counsel':'review','conversation-topic':'daily','presentation-recovery':'rehearse',sabbatical:'home',event:0};
 let s=state;
 for(let guard=0;s.pending&&!s.ending&&s.pending.kind!==target;guard++){
  assert.ok(guard<20,'The decision queue must make progress.');
  const value=choices[s.pending.kind];
  assert.notEqual(value,undefined,`Unexpected decision: ${s.pending.kind}`);
  s=decide(s,value);
 }
 return s;
}

function doctoralExam(){
 const s=createState('김민지',6,{gender:'female'});
 s.month=47;s.route='integrated';s.sabbatical.start=24;
 const n=settleOtherDecisions(simulateMonth(s,proposeSchedule(s)),'qual');
 assert.equal(n.pending?.kind,'qual');
 assert.equal(n.career.qualAttempts,0);
 return n;
}

function endingText(s,lang='ko'){
 return getEndingPages(s.ending,lang,'reserved',s.name,s.endingReason,s.history).join('\n');
}

test('a first unmet master verdict reaches the semester-extension decision through the real month queue',()=>{
 const s=createState('김민지',6,{gender:'female'});
 // The verdict comes in December (month 45) of the semester before conferral; the degree decision follows in March.
 s.month=44;s.route='masters';s.sabbatical.start=24;
 let n=simulateMonth(s,proposeSchedule(s));
 assert.equal(n.pending?.kind,'thesis');
 assert.equal(n.pending.level,'masters');
 assert.equal(n.pending.step,'verdict');
 n=decide(n,'confirm');
 assert.equal(n.ending,null);
 n=settleOtherDecisions(n);n.month=47;n.plan=proposeSchedule(n);n=simulateMonth(n,n.plan);n=settleOtherDecisions(n,'masters');
 assert.equal(n.pending?.kind,'masters');
 assert.equal(n.history.filter(h=>h.kind==='thesis'&&h.step==='verdict').at(-1).passed,false);
 n=decide(n,'extend');
 assert.equal(n.mastersExtended,true);
 assert.equal(n.mastersReviewAt,54);
 assert.equal(n.ending,null);
 assert.ok(validateSave(n));

 // The extension is a chance to complete the work, not an automatic degree award.
 n=settleOtherDecisions(n);
 n.month=50;n.plan=proposeSchedule(n);
 n=simulateMonth(n,n.plan);
 assert.equal(n.pending?.kind,'thesis');
 assert.equal(n.pending.step,'verdict');
 n=decide(n,'confirm');
 assert.equal(n.ending,'gameover');
 assert.equal(n.endingReason,'graduation_requirements');
 assert.equal(n.history.filter(h=>h.kind==='thesis'&&h.step==='verdict').length,2);
 assert.ok(n.history.filter(h=>h.kind==='thesis'&&h.step==='verdict').every(h=>h.passed===false));
 assert.ok(validateSave(n));
});

test('leaving before taking qual describes an unattempted exam rather than dismissal or lab closure',()=>{
 const n=decide(doctoralExam(),'graduate');
 assert.equal(n.ending,'gameover');
 assert.equal(n.endingReason,'qual_failure');
 assert.equal(n.career.qualAttempts,0);
 const ko=endingText(n),en=endingText(n,'en');
 assert.match(ko,/아직 응시하지 않은 자격시험/);
 assert.match(ko,/계속하지 않기로 했습니다/);
 assert.doesNotMatch(ko,/불합격|제적|두 차례|운영을 종료/);
 assert.match(en,/exam they had not taken/);
 assert.doesNotMatch(en,/two failed|dismissal|lab had closed/);
 assert.ok(validateSave(n));
});

test('leaving after one qual failure is an explicit decision against a retake',()=>{
 let n=decide(doctoralExam(),'exam');
 assert.equal(n.career.qualAttempts,1);
 assert.equal(n.career.qual,'failed');
 assert.equal(n.ending,null);
 const due=n.qualDeferredAt;
 while(n.month<due){
  n=settleOtherDecisions(n,'qual');
  assert.equal(n.ending,null);
  n=settleOtherDecisions(simulateMonth(n,proposeSchedule(n)),'qual');
 }
 assert.equal(n.pending?.kind,'qual');
 n=decide(n,'graduate');
 assert.equal(n.career.qualAttempts,1);
 const ko=endingText(n);
 assert.match(ko,/첫 자격시험 결과/);
 assert.match(ko,/재응시 대신 박사과정을 정리/);
 assert.doesNotMatch(ko,/제적|두 차례|아직 응시하지 않은/);
 assert.match(endingText(n,'en'),/rather than retake the exam/);
 assert.ok(validateSave(n));
});

test('an actual second qual failure still dismisses after an additional preparation deferral',()=>{
 let n=decide(doctoralExam(),'exam');
 const due=n.qualDeferredAt;
 while(n.month<due){
  n=settleOtherDecisions(n,'qual');
  n=settleOtherDecisions(simulateMonth(n,proposeSchedule(n)),'qual');
 }
 assert.equal(n.pending?.kind,'qual');
 n=decide(n,'prepare');
 assert.equal(n.qualDeferredAt,due+1);
 n=settleOtherDecisions(n);
 n=settleOtherDecisions(simulateMonth(n,proposeSchedule(n)),'qual');
 assert.equal(n.pending?.kind,'qual');
 n=decide(n,'exam');
 assert.equal(n.career.qualAttempts,2);
 assert.equal(n.ending,'dismissed');
 const text=endingText(n);
 assert.match(text,/재응시에서도/);
 assert.doesNotMatch(text,/세 달|3개월/);
 assert.doesNotMatch(endingText(n,'en'),/three months/);
 assert.ok(validateSave(n));
});

test('the time-zone advising event requires a current overseas sabbatical and retains its one-time limit',()=>{
 const e=EVENTS.find(event=>event.id==='sabbatical-contact');
 assert.ok(e);
 const s=createState('김민지',6,{gender:'female'});
 s.month=60;s.route='integrated';s.sabbatical={...s.sabbatical,active:true,start:60,until:72,mode:'away'};
 assert.equal(eventEligible(s,e),true);
 assert.equal(eventEligible({...s,sabbatical:{...s.sabbatical,mode:'home'}},e),false);
 assert.equal(eventEligible({...s,sabbatical:{...s.sabbatical,active:false}},e),false);
 assert.equal(eventEligible({...s,eventFlags:{[e.id]:{lastMonth:48,count:1}}},e),false);
 assert.equal(eventEligible({...s,month:40},e),false);
});
