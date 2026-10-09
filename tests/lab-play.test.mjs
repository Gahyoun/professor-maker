import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,decide,validateSave,researchGrade,HIDDEN_RANGES,abilityScore} from '../dist/engine.js';
import {examWindow} from '../dist/academic-calendar.js';
import {supplyLevel,roomScene,researchText} from '../dist/lab-scene.js';
import {weeklyAppearance,studentAppearance,renderPortrait} from '../dist/appearance.js';
import {studentLine} from '../dist/dialogue.js';
const set=(s,k,v)=>{const [lo,hi]=HIDDEN_RANGES[k];s.hidden[k]=lo+(hi-lo)*v/100;};

test('trusted students ask for self-directed exam preparation in the exam week and the previous week',()=>{
 const s=createState('',6);s.started=true;s.month=3;set(s,'trust',80);const plan=proposeSchedule(s);
 for(let i=0;i<plan.length;i++)if(examWindow(s,i,plan.length))assert.equal(plan[i],'free');
 assert.match(studentLine(s),/시험 주와 그 전주/);set(s,'trust',30);const supported=proposeSchedule(s);for(let i=0;i<supported.length;i++)if(examWindow(s,i,supported.length))assert.equal(supported[i],'coursework');
 set(s,'trust',80);set(s,'stamina',90);const n=simulateMonth(s,plan,{proposal:plan});assert.ok(n.lastReport.results.some(w=>w.autonomous==='coursework'));assert.ok(validateSave(n));
});
test('course work develops qualification knowledge without generating research output',()=>{
 const s=createState('',6);s.month=2;set(s,'stamina',99);set(s,'motivation',99);const plan=Array(proposeSchedule(s).length).fill('coursework');const n=simulateMonth(s,plan,{proposal:plan});assert.ok(n.hidden.learning>s.hidden.learning);assert.equal(n.lastReport.progress,0);assert.ok(n.lastReport.results.some(w=>w.actual==='coursework'&&w.performed));
});
test('research rates span five grades continuously, and project progress is the weighted sum of actual rates',()=>{
 const grades=new Set(),rates=new Set();for(let seed=1;seed<=300;seed++){const s=createState('',seed*7919);s.month=2;const n=simulateMonth(s,['study','experiment','analysis','free']);for(const w of n.lastReport.results){if(w.successRate!==undefined){assert.ok(w.successRate>=0&&w.successRate<=1);grades.add(researchGrade(w.successRate));rates.add(w.successRate);assert.equal(w.progress,w.weight*w.successRate);}}assert.equal(n.lastReport.progress,n.lastReport.results.reduce((sum,w)=>sum+w.progress,0));assert.ok(validateSave(n));}
 assert.equal(grades.size,5);assert.ok(rates.size>100);
});
test('actual rehearsal makes failed conference presentations less frequent and failure never awards a presentation',()=>{
 let bare=0,rehearsed=0;for(let seed=1;seed<=120;seed++){const s=createState('',seed*7919);s.month=26;s.route='integrated';s.project.phase=3;set(s,'stamina',95);set(s,'motivation',95);set(s,'rapport',90);set(s,'trust',90);
  for(const prepared of [false,true]){const n=simulateMonth(s,prepared?['language','language','conference','free']:['free','free','conference','free']);const failed=n.history.some(h=>h.kind==='presentation-failure');if(failed){if(prepared)rehearsed++;else bare++;assert.equal(n.career.conferences,0);assert.ok([n.pending,...n.pendingQueue].some(p=>p.kind==='presentation-recovery'));while(n.pending&&n.pending.kind!=='presentation-recovery')n.pending=n.pendingQueue.shift()??null;const supported=decide(n,'rehearse');assert.ok(validateSave(supported));}}
 }assert.ok(bare>30);assert.ok(rehearsed<bare/2,`${rehearsed} vs ${bare}`);
});
test('repeated inattentive meetings and praise change habits gently; a conversation interrupts inattention',()=>{
 const s=createState('',6);s.month=2;s.advising={lastFeedback:'listen',streak:6,inattention:6};const plan=Array(proposeSchedule(s).length).fill('free');const idle=simulateMonth(s,plan,{proposal:plan,facultyAction:'routine'}),talk=simulateMonth(s,plan,{proposal:plan,facultyAction:'conversation'});assert.equal(talk.advising.inattention,0);assert.ok(idle.history.some(h=>h.kind==='advising-habit'));assert.ok(talk.hidden.rapport>idle.hidden.rapport);assert.match(studentLine(idle),/구체적으로/);
 const fresh=createState('',6);fresh.month=2;fresh.lastReport={month:2,completion:1,progress:20,published:0,conferences:0,scienceFailures:0,results:Array.from({length:4},(_,i)=>({week:i+1,proposed:'study',actual:'study',performed:true,outcome:'progress',progress:5,scienceFailures:0}))};const repeated=structuredClone(fresh);repeated.advising={lastFeedback:'praise',streak:4,inattention:0};const a=simulateMonth(fresh,plan,{proposal:plan,feedback:'praise'}),b=simulateMonth(repeated,plan,{proposal:plan,feedback:'praise'});assert.ok(b.monthlyEfficiency<a.monthlyEfficiency);assert.ok(abilityScore(b,'diligence')<abilityScore(a,'diligence'));assert.ok(validateSave(b));
});
test('wet supplies depend on available operating funds and allocation; every activity has its own room',()=>{
 const s=createState('',6,{labMode:'wet'});s.lab.budget.environment=4;assert.equal(supplyLevel(s),'rich');assert.match(roomScene(s),/data-supply="rich"/);s.lab.funds=10;s.lab.pool=1000;assert.equal(supplyLevel(s),'sparse');assert.match(roomScene(s),/자재를 아껴/);
 for(const [actual,scene] of [['rest','rest'],['conference','conference'],['travel','travel']])assert.match(roomScene(s,{actual}),new RegExp(`data-scene="${scene}"`));s.pending={kind:'thesis',level:'phd',step:'questions'};assert.match(roomScene(s),/학위심사실/);assert.match(roomScene(s),/질의응답/);
 s.professorProfile.labMode='dry';assert.ok(!researchText('예비 실험 · 실험 노트 · 실험실',s).includes('실험'));
});
test('full-body characters vary clothes each week, keep their face, and make bald styles uncommon',()=>{
 const s=createState('',6),first=weeklyAppearance(s,0);for(let i=1;i<5;i++){const a=weeklyAppearance(s,i);assert.notEqual(a.outfit,weeklyAppearance(s,i-1).outfit);assert.equal(a.hairLength,first.hairLength);assert.equal(a.skin,first.skin);}assert.ok(renderPortrait(first).includes('0 0 80 124'));assert.ok(!renderPortrait(first).includes('<rect width="80"'));
 let bald=0;for(let seed=1;seed<=5000;seed++)bald+=studentAppearance(seed*7919,'male').hairLength===0;assert.ok(bald>0&&bald<75,String(bald));
});
