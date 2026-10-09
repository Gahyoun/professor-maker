import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,feedbackEffect,projectWork,projectThresholds,developmentalStage,validateSave,EVENTS} from '../dist/engine.js';
import {getEndingPages} from '../dist/stories.js';
import {endingStatistics,renderStatistics,validStatistics} from '../dist/statistics.js';
import {studentAppearance} from '../dist/appearance.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {GAME_BALANCE,validBalance} from '../dist/balance.js';
const baseReport={completion:1,progress:20,published:0,conferences:0,scienceFailures:0};
test('feedback has neutral skip, evidence-sensitive efficiency and stress/rapport directions',()=>{
 const s=createState();s.lastReport=baseReport;assert.deepEqual(feedbackEffect(s,'listen'),{effects:{},efficiency:1});const praise=feedbackEffect(s,'praise'),wrong=feedbackEffect(s,'critique');assert.ok(praise.effects.stress<0&&praise.effects.rapport>0&&praise.efficiency>1);assert.ok(wrong.effects.stress>0&&wrong.effects.rapport<0&&wrong.efficiency<1);
 s.lastReport={...baseReport,completion:.5,progress:0,scienceFailures:2};const critique=feedbackEffect(s,'critique'),empty=feedbackEffect(s,'praise');assert.ok(critique.effects.stress>0&&critique.efficiency>1);assert.ok(empty.effects.rapport<0&&empty.efficiency<1);
});
test('March pay accepts every integer percentage and policies persist without mutating input',()=>{
 const s=createState();s.month=0;const before=structuredClone(s);const result=simulateMonth(s,['rest','rest','rest','rest'],{budget:{...s.lab.budget,salary:73},policies:{work:'free',study:'study'}});assert.deepEqual(s,before);assert.equal(result.lab.budget.salary,73);assert.deepEqual(result.policies,{work:'free',study:'study'});assert.throws(()=>simulateMonth(s,s.plan,{policies:{work:'bad',study:'learn'}}));assert.equal(validateSave({...s,policies:{work:'free',study:'bad'}}),false);
});
test('research contributions are weighted successful weeks; rest creates no research progress',()=>{
 const s=createState('학생',22);s.month=2;const plan=['study','study','rest','rest'];const result=simulateMonth(s,plan,{proposal:plan});const contributions=result.lastReport.results.filter(r=>r.progress>0);assert.ok(contributions.length);for(const r of contributions)assert.equal(r.progress,r.weight*r.successRate);assert.equal(result.lastReport.progress,result.lastReport.results.reduce((n,r)=>n+r.progress,0));assert.ok(result.lastReport.results.filter(r=>r.proposed==='rest').every(r=>r.progress===0));
 const idle=simulateMonth(s,['rest','rest','rest','rest']);assert.equal(projectWork(idle),projectWork(s));
 const paper={...s,professorProfile:{...s.professorProfile,fieldId:'050'}},conference={...s,professorProfile:{...s.professorProfile,fieldId:DISCIPLINES.find(d=>d.graduation==='conference').id}}; // find actual conference track, rather than assuming a real degree policy
 assert.ok(projectThresholds(paper).submission>projectThresholds(conference).submission);assert.ok(projectThresholds(paper).conference>projectThresholds(conference).conference);
});
test('development changes task support without diagnosing students; resilience decays but rest recovers',()=>{
 const s=createState();assert.equal(developmentalStage(s).level,'undergrad');s.month=30;s.route='integrated';assert.equal(developmentalStage(s).level,'masters');s.month=60;assert.equal(developmentalStage(s).level,'phd');assert.ok(developmentalStage(s).errorRate<developmentalStage(createState()).errorRate);
 const rested=simulateMonth(s,['rest','rest','rest','rest']);assert.ok(rested.hidden.resilience>s.hidden.resilience);const work=simulateMonth(s,['study','study','study','study']);assert.ok(work.hidden.resilience<s.hidden.resilience);
});
test('a completed master remains a normal degree outcome even with maximum faculty-path stats',()=>{
 const s=createState();s.month=48;s.route='masters';s.pending={kind:'masters'};s.career.submissions=1;s.career.conferences=1;const result=decide(s,'graduate');assert.equal(result.ending,'masters');
});
test('ending memories reflect actual event choices and rapport; absent events do not leak into stories',()=>{
 const first=getEndingPages('institute','ko','close','김하늘',null,[{kind:'event',id:'authorship',choice:0}]).join('\n'),second=getEndingPages('institute','ko','close','김하늘',null,[{kind:'event',id:'authorship',choice:1}]).join('\n'),plain=getEndingPages('institute','ko','close','김하늘').join('\n');assert.notEqual(first,second);assert.notEqual(first,plain);assert.ok(!plain.includes('기여 내역을 함께 적었던'));assert.notEqual(first,getEndingPages('institute','ko','distant','김하늘',null,[{kind:'event',id:'authorship',choice:0}]).join('\n'));
});
test('cosmetic Gaussian draws are reproducible, diverse, full-spectrum, and independent of game state',()=>{
 const s=createState(),before=structuredClone(s);const lengths=new Set();let male=0,female=0;for(let i=1;i<=1000;i++){const m=studentAppearance(i*7919,'male'),f=studentAppearance(i*7919,'female');lengths.add(m.hairLength);lengths.add(f.hairLength);male+=m.hairLength;female+=f.hairLength;assert.deepEqual(m,studentAppearance(i*7919,'male'));}assert.equal(lengths.size,7);assert.ok(female>male);assert.deepEqual(s,before);
});
test('statistics are unavailable during play and use real ranges, signed zero axes and exact numeric tables',()=>{
 const s=createState();assert.equal(endingStatistics(s),null);s.ending='masters';const stats=endingStatistics(s),html=renderStatistics(stats);assert.ok(validStatistics(stats));assert.ok(html.includes('<svg')&&html.includes('-100')&&html.includes('999')&&html.includes('ゲーム')===false&&html.includes('정확한 값'));const bad=structuredClone(stats);bad.student.stress=101;assert.equal(validStatistics(bad),false);
});
test('only bounded balance patches apply and growth-stage events are eligible for matching stages',()=>{assert.ok(validBalance(GAME_BALANCE));assert.equal(validBalance({...GAME_BALANCE,projectProgressScale:999}),false);for(const id of ['undergrad-record','master-scope','doctoral-lead','ordinary-meaning','third-year-question'])assert.ok(EVENTS.some(e=>e.id===id));});
