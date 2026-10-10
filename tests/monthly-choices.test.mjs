import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,simulateMonth,proposeSchedule,validateSave,eventEligible,EVENTS} from '../dist/engine.js';
import {DILEMMAS,dilemmaOptions,monthlyIssueOptions} from '../dist/monthly-choices.js';
import {managedOptions} from './play-support.mjs';
const clone=structuredClone;
test('management issues offer distinct tradeoffs and cosmetic previews preserve state and RNG',()=>{
 const s=createState('학생',18),before=clone(s);
 for(const e of DILEMMAS){const options=dilemmaOptions(s,e);assert.equal(options.length,3);assert.equal(new Set(options.map(o=>JSON.stringify([o.effects,o.progress]))).size,3);assert.ok(options.every(o=>o.hint.ko&&o.response));assert.ok(EVENTS.includes(e));}
 for(const id of ['grant-selected','grant-rejected','presentation-award','internal-admission'])assert.equal(monthlyIssueOptions(s,id).length,3);
 assert.deepEqual(s,before);
});
test('delegation builds independence but readiness and relationship change its consequences',()=>{
 const e=DILEMMAS.find(e=>e.id==='monthly-draft'),s=createState('학생',18);s.month=30;s.route='integrated';s.pending={kind:'event',id:e.id};s.hidden.research=600;s.hidden.learning=600;s.hidden.rapport=60;
 const unready=clone(s);unready.hidden.research=250;unready.hidden.rapport=-40;
 const readyChoice=dilemmaOptions(s,e)[1],unreadyChoice=dilemmaOptions(unready,e)[1];assert.ok(readyChoice.progress>unreadyChoice.progress);assert.ok(readyChoice.effects.hidden.stress<unreadyChoice.effects.hidden.stress);assert.ok(readyChoice.effects.hidden.rapport>unreadyChoice.effects.hidden.rapport);
 const next=decide(unready,1);assert.ok(next.hidden.autonomy>unready.hidden.autonomy);assert.match(next.history.at(-1).response,/다시/);assert.ok(validateSave(next));
});
test('a tight deadline strains an already overloaded student more than a manageable workload',()=>{
 const e=DILEMMAS.find(e=>e.id==='monthly-workload'),s=createState('학생',18),busy=clone(s);busy.hidden.stress=80;
 assert.ok(dilemmaOptions(busy,e)[1].effects.hidden.stress>dilemmaOptions(s,e)[1].effects.hidden.stress);
 assert.match(dilemmaOptions(busy,e)[1].response,/걱정/);
});
test('spending uses operating funds, leaves the stipend pool intact and refuses unaffordable choices',()=>{
 const s=createState('학생',18);s.month=3;s.pending={kind:'event',id:'monthly-resources'};s.lab.funds=2;s.lab.pool=500;
 const before=clone(s);assert.equal(dilemmaOptions(s,DILEMMAS.find(e=>e.id===s.pending.id))[0].disabled,true);assert.throws(()=>decide(s,0),/Insufficient/);assert.deepEqual(s,before);
 s.lab.funds=10;const next=decide(s,0);assert.equal(next.lab.funds,7);assert.equal(next.lab.pool,500);assert.ok(validateSave(next));assert.throws(()=>decide(next,0));
});
test('result responses do not pay grant income or awards twice; neutral acknowledgment stays compatible',()=>{
 for(const id of ['grant-selected','grant-rejected','presentation-award','internal-admission']){
  const s=createState('학생',18);s.month=3;s.pending={kind:'monthly-issue',id};const before=clone(s),options=monthlyIssueOptions(s,id);
  for(const o of options){const n=decide(s,o.value);assert.equal(n.lab.funds,s.lab.funds);assert.equal(n.lab.pool,s.lab.pool);assert.equal(n.career.awards,s.career.awards);assert.equal(n.history.at(-1).choice,o.value);assert.ok(validateSave(n));}
  const neutral=decide(s,'acknowledge');assert.deepEqual(neutral.hidden,s.hidden);assert.deepEqual(neutral.professor,s.professor);assert.deepEqual(s,before);assert.throws(()=>decide(s,'invented'));
 }
});
test('quiet months receive a decision while academic and counseling scenes take precedence',()=>{
 let found=0;for(let seed=1;seed<=25;seed++){const s=createState('학생',seed);s.month=2;const n=simulateMonth(s,proposeSchedule(s),managedOptions(s));assert.ok(n.pending);assert.ok(validateSave(n));if(DILEMMAS.some(e=>e.id===n.pending.id))found++;}
 assert.ok(found>0);
 const s=createState('학생',18),n=simulateMonth(s,proposeSchedule(s),managedOptions(s));assert.ok(n.pending.kind==='story');assert.ok(!n.pendingQueue.some(p=>DILEMMAS.some(e=>e.id===p.id)));
 s.month=5;s.eventFlags['monthly-draft']={lastMonth:4,count:1};assert.equal(eventEligible(s,DILEMMAS.find(e=>e.id==='monthly-draft')),false);
});
