import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITIES,createState,proposeSchedule,simulateMonth,autonomousChoice,migrateSave,validateSave,HIDDEN_RANGES} from '../dist/engine.js';
import {weeklyScene} from '../dist/weekly-scene.js';
import {buildEndingCV} from '../dist/cv.js';
const score=(s,key,value)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+(hi-lo)*value/100;};
function healthy(seed){const s=createState('',seed);s.month=2;s.started=true;score(s,'stamina',90);score(s,'stress',10);return s;}

test('student proposals offer self-directed time and legacy saves migrate only upcoming schedules',()=>{
 assert.ok(ACTIVITIES.free);for(const id of ['rest','coffee','startup'])assert.ok(!Object.hasOwn(ACTIVITIES,id));
 for(let seed=1;seed<=100;seed++){const s=createState('',seed);assert.ok(proposeSchedule(s).every(id=>Object.hasOwn(ACTIVITIES,id)));}
 const s=healthy(6);s.plan=['rest','coffee','startup','study'];const before=structuredClone(s),migrated=migrateSave(s);
 assert.deepEqual(migrated.plan,['free','free','industry','study']);assert.deepEqual(migrated.history,s.history);assert.deepEqual(s,before);assert.ok(validateSave(migrated));
});
test('self-directed choices cover study, travel and rest reproducibly, with recovery prioritized under strain',()=>{
 const chosen=new Set();for(let seed=1;seed<=400;seed++){const s=healthy(seed*7919),before=structuredClone(s);chosen.add(autonomousChoice(s,0));assert.equal(autonomousChoice(s,0),autonomousChoice(s,0));assert.deepEqual(s,before);score(s,'stamina',30);assert.equal(autonomousChoice(s,0),'rest');score(s,'stamina',90);score(s,'stress',80);assert.equal(autonomousChoice(s,0),'rest');}
 assert.deepEqual(chosen,new Set(['rest','coursework','experiment','travel']));
});
test('self-directed weekly reports save actual choices; only study can contribute weighted research progress',()=>{
 const choices=new Set();let progressed=false;
 for(let seed=1;seed<=80;seed++){const s=healthy(seed*7919),plan=Array(proposeSchedule(s).length).fill('free'),r=simulateMonth(s,plan,{proposal:plan});assert.deepEqual(r,simulateMonth(s,plan,{proposal:plan}));assert.ok(validateSave(r));assert.ok(validateSave(migrateSave(r)));
  for(const w of r.lastReport.results){choices.add(w.autonomous);assert.equal(w.proposed,'free');assert.ok(['study','coursework','experiment','analysis','rest','travel'].includes(w.autonomous));if(!['study','experiment','analysis'].includes(w.autonomous))assert.equal(w.progress,0);else if(w.progress>0){assert.equal(w.progress,w.weight*w.successRate);progressed=true;}assert.ok(!weeklyScene(r,w,w.week-1).includes('undefined'));}
  assert.equal(r.lastReport.progress,r.lastReport.results.reduce((sum,w)=>sum+w.progress,0));
 }
 assert.equal(choices.size,4);assert.ok(progressed);
});
test('advising conversation belongs to professor activity without consuming a student week, and enters CV memories',()=>{
 const s=healthy(6),plan=Array(proposeSchedule(s).length).fill('free'),before=structuredClone(s);
 const routine=simulateMonth(s,plan,{proposal:plan,facultyAction:'routine'}),talk=simulateMonth(s,plan,{proposal:plan,facultyAction:'conversation'});
 assert.deepEqual(s,before);assert.deepEqual(talk.plan,plan);assert.equal(talk.lastReport.results.length,plan.length);assert.ok(talk.hidden.rapport>routine.hidden.rapport);assert.equal(talk.history.filter(h=>h.kind==='advising-conversation').length,1);assert.ok(validateSave(talk));
 talk.ending='leave';const cv=buildEndingCV(talk);assert.ok(cv.model.memories.some(m=>m.kind==='advising-conversation'));assert.ok(cv.html.includes('연구 밖의 안부를 묻다'));
});
