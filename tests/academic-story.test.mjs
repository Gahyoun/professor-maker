import {managedOptions,affordableEventChoice} from './play-support.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {academicWeeks,weekContext} from '../dist/academic-calendar.js';
import {createState,simulateMonth,decide,proposeSchedule,validateSave,feedbackEffect} from '../dist/engine.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
import {studentAppearance,renderPortrait} from '../dist/appearance.js';
import {weeklyScene} from '../dist/weekly-scene.js';
const choices={'workshop-plan':'skip','monthly-issue':'acknowledge','conference-plan':'none','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',event:0,route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
function resolve(s,route='integrated',graduate=false){let guard=0;while(s.pending&&!s.ending){assert.ok(guard++<12);const p=s.pending;let c=choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];if(p.kind==='event')c=affordableEventChoice(s,p.id);if(p.kind==='conference-plan')c=p.scope==='domestic'?'together':'none';if(p.kind==='route')c=route;if(p.kind==='masters'&&graduate)c='graduate';s=decide(s,c);}return s;}

test('Korean academic years contain 52–53 seven-day weeks and exams do not collide with the conference week',()=>{
 const s=createState('',6);for(let year=0;year<8;year++){let total=0;for(let month=0;month<12;month++){s.month=year*12+month;const weeks=academicWeeks(s);assert.ok([4,5].includes(weeks.length));total+=weeks.length;for(let i=0;i<weeks.length;i++){assert.equal(new Date(weeks[i].start).getUTCDay(),1);const c=weekContext(s,i,weeks.length);assert.ok(!(c.exam&&c.conference));}}assert.ok([52,53].includes(total),String(total));}
 s.month=1;assert.ok(weekContext(s,2).conference);assert.ok(weekContext(s,academicWeeks(s).length-1).important);s.month=25;assert.equal(weekContext(s,academicWeeks(s).length-1).important,false);
});
test('undergraduate observation is possible only during conference week; exam weeks prioritize study',()=>{
 const s=createState('',6);assert.ok(!proposeSchedule(s).includes('conference'));assert.throws(()=>simulateMonth(s,['conference','rest','rest','rest']),/observation/);
 s.month=1;const proposed=proposeSchedule(s);assert.equal(proposed[2],'conference');assert.equal(proposed.at(-1),'coursework');const n=simulateMonth(s,proposed);assert.equal(n.career.conferences,0);assert.ok([n.pending,...n.pendingQueue].some(p=>p?.kind==='academic-exam'));
});
test('unused workload credits persist and advance; excess credits are rejected before changing state',()=>{
 const s=createState('',6),allocation={research:2,teaching:2,admin:1,mentoring:2},before=JSON.stringify(s);const n=simulateMonth(s,proposeSchedule(s),{allocation});assert.equal(JSON.stringify(s),before);assert.deepEqual(n.allocation,allocation);assert.deepEqual(allocateCredits(allocation,12),allocation);assert.ok(validateSave(n));const tooMuch={...allocation,research:facultyCapacity(s).credits};assert.throws(()=>simulateMonth(s,proposeSchedule(s),{allocation:tooMuch}),/workload/);
});
test('full master and integrated routes follow staged defenses and never award an unearned degree',()=>{
 for(const route of ['masters','integrated']){let s=createState('',6,{age:38});s.started=true;s.lab.creditEnabled=true;for(let m=0;m<96&&!s.ending;m++){
  const aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen';
  const feedback=s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned;
  s=resolve(simulateMonth(s,proposeSchedule(s),{...managedOptions(s,m%6===0?'conversation':'routine'),feedback}),route,route==='masters');
 }assert.ok(validateSave(s));const thesis=s.history.filter(h=>h.kind==='thesis');assert.deepEqual(thesis.map(h=>h.step),['draft','presentation','questions','revision','verdict']);assert.ok(thesis.every(h=>h.level===(route==='masters'?'masters':'phd')));assert.equal(s.month,route==='masters'?48:96);assert.equal(thesis.at(-1).passed,true);assert.notEqual(s.ending,'gameover');assert.ok(s.history.some(h=>h.kind==='story'));}
 const s=createState('',6);s.month=96;s.route='integrated';s.pending={kind:'thesis',level:'phd',step:'verdict'};const failed=decide(s,'confirm');assert.equal(failed.ending,'gameover');assert.equal(failed.endingReason,'graduation_requirements');
 s.pending={kind:'thesis',level:'masters',step:'draft'};assert.throws(()=>decide(s,'outline'),/Integrated/);
});
test('portraits and weekly characters have transparent backgrounds and six original outfit shapes',()=>{
 const a=studentAppearance(6,'female'),variants=new Set();for(let outfit=0;outfit<6;outfit++){const svg=renderPortrait({...a,outfit});assert.ok(!svg.includes('<rect width="80"'));variants.add(svg);}assert.equal(variants.size,6);const s=createState('',6),next=simulateMonth(s,proposeSchedule(s));const scene=weeklyScene(next,next.lastReport.results[0],0);assert.ok(scene.includes('pixel-room'));assert.ok(scene.includes('scene-dry'));assert.ok(scene.includes(`${next.plan.length}`));
});
