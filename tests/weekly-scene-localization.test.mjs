import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,ACTIVITIES,LEGACY_ACTIVITIES,researchGrade} from '../dist/engine.js';
import {weeklyScene,weeklyActivityLabel,weeklyResearchGrade} from '../dist/weekly-scene.js';

const state=(locale='en',labMode='dry')=>createState('Morgan Reed',7919,{locale,labMode,gender:'female',fieldId:'050'});
const week=(actual,patch={})=>({actual,assigned:actual,proposed:actual,performed:true,outcome:'completed',progress:0,...patch});
// Art may contain protected, hidden SVG metadata. Assert the scene's human-facing
// copy and accessibility labels independently of that decorative SVG.
const copy=html=>html.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ');
const assertEnglish=html=>{
 assert.doesNotMatch(copy(html),/[가-힣]|\bundefined\b|\b1 weeks\b/);
 assert.match(html,/aria-label="Week \d result"/);
 assert.match(html,/aria-label="Weekly progress"/);
};

test('zero coursework result renders the complete English sentence from the screenshot',()=>{
 const s=state(),r=week('coursework',{successRate:0,outcome:'inconclusive'}),before=structuredClone({s,r});
 const html=weeklyScene(s,r,1);
 assertEnglish(html);
 assert.match(html,/Setback · Achievement 0%/);
 assert.match(html,/Course work · reviewed concepts and recorded the learning check\./);
 assert.match(html,/Week 2 \/ 4/);
 assert.match(html,/>Week 1<\/li>/);
 assert.deepEqual({s,r},before,'copy rendering must not change state, results or RNG');
});

test('all current and historical activities have explicit English playback copy',()=>{
 for(const actual of [...Object.keys(ACTIVITIES),...Object.keys(LEGACY_ACTIVITIES),'unfinished','travel','training']){
  const r=week(actual,{performed:!['unfinished','training'].includes(actual),outcome:actual==='training'?'training':actual==='unfinished'?'not_completed':'completed'});
  assertEnglish(weeklyScene(state(),r,0));
  assert.doesNotMatch(weeklyActivityLabel(state(),actual),/[가-힣]|undefined/);
 }
 assert.equal(weeklyActivityLabel(state(),'experiment'),'Computation & modeling');
 assert.equal(weeklyActivityLabel(state('en','wet'),'experiment'),'Experiment');
});

test('research grades, numeric progress and zero-progress attempts are fully English',()=>{
 for(const [rate,label] of [[0,'Setback'],[.2,'Limited setback'],[.4,'Mixed result'],[.7,'Success'],[.9,'Complete success']]){
  assert.equal(weeklyResearchGrade(rate,'en'),label);
  assert.equal(weeklyResearchGrade(rate,'ko'),researchGrade(rate));
  assertEnglish(weeklyScene(state(),week('analysis',{successRate:rate,progress:rate*8}),0));
 }
 assert.match(weeklyScene(state(),week('analysis',{successRate:.7,progress:5.678}),0),/Research progress Δ \+5\.7/);
 assert.match(weeklyScene(state(),week('analysis',{successRate:0,outcome:'inconclusive'}),0),/Research progress 0 · the attempt remains in the record\./);
});

test('autonomous, agreed recovery, missed and conference outcomes stay coherent in English',()=>{
 for(const actual of ['coursework','study','experiment','analysis','rest','travel'])assertEnglish(weeklyScene(state(),week(actual,{assigned:'free',proposed:'free',autonomous:actual,outcome:actual==='rest'?'recovered':actual==='travel'?'explored':'completed'}),0));
 assert.match(weeklyScene(state(),week('travel',{assigned:'recovery',proposed:'recovery',outcome:'explored'}),0),/Agreed recovery time completed/);
 assert.match(weeklyScene(state(),week('unfinished',{assigned:'analysis',proposed:'analysis',performed:false,outcome:'not_completed',deviation:'unfinished'}),0),/Planned activity not completed/);
 for(const [outcome,label] of [['presented','Research presentation completed'],['attended','Conference attendance completed'],['preparing','More preparation needed before presenting'],['presentation_failed','Difficulty preparing and delivering the presentation']]){
  const html=weeklyScene(state(),week('conference',{outcome}),0);assertEnglish(html);assert.ok(html.includes(label));
 }
});

test('assignment deviations explain the English planned and actual activities',()=>{
 const missed=weeklyScene(state(),week('rest',{assigned:'analysis',proposed:'analysis',performed:false,outcome:'recovered',deviation:'rest-needed'}),0);
 assertEnglish(missed);assert.match(missed,/Agreed schedule: Analyze data → Actual: Recovery · Rested due to fatigue/);
 const critical=weeklyScene(state(),week('rest',{assigned:'analysis',proposed:'analysis',performed:false,outcome:'recovered',deviation:'critical-rest',criticalRest:true}),0);
 assertEnglish(critical);assert.match(critical,/Work paused for essential recovery/);assert.match(critical,/Recovery needed at a critical limit/);
 assert.doesNotMatch(weeklyScene(state(),week('rest',{assigned:'recovery',proposed:'recovery'}),0),/assignment-change/);
});

test('Korean coursework, grades, assignment explanation and week labels retain their copy',()=>{
 const s=state('ko'),html=weeklyScene(s,week('coursework',{successRate:0,outcome:'inconclusive'}),1);
 assert.match(html,/실패 · 달성률 0%/);
 assert.match(html,/교과 학습 · 복습과 점검을 기록했습니다\./);
 assert.ok(html.includes(`2주차 / ${s.plan.length}`));assert.match(html,/>1주<\/li>/);
 assert.match(html,/aria-label="2주차 수행 결과"/);
 const rest=weeklyScene(state('ko'),week('rest',{assigned:'teach',proposed:'teach',performed:false,deviation:'rest-needed'}),0);
 assert.match(rest,/합의한 일정: 수업보조 · TA → 실제: 휴식 · 피로로 휴식/);
});
