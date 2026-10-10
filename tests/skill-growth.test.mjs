import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAfterChange} from '../dist/relationship.js';
import {GAME_BALANCE} from '../dist/balance.js';
import {createState,decide,abilityScore,HIDDEN_RANGES,validateSave,migrateSave} from '../dist/engine.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
const setScore=(s,key,n)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+n*(hi-lo)/100;};

test('academic feedback softens high skill growth without reducing condition recovery',()=>{
 for(const level of [30,49.5,50,90]){
  const s=createState('학생',19);s.started=true;s.month=28;s.route='integrated';s.pending={kind:'failure-counsel'};
  for(const key of ['learning','research','resilience'])setScore(s,key,level);
  s.hidden.stress=40;const before=structuredClone(s),n=decide(s,'review');
  for(const key of ['learning','research'])near(abilityScore(n,key),scoreAfterChange(level,GAME_BALANCE.abilityGrowthScale));
  near(abilityScore(n,'resilience'),level+.5);assert.equal(n.hidden.stress,38);
  assert.deepEqual(s,before);assert.ok(validateSave(n));
 }
});

test('workshop learning and communication saturate while spending and faculty work remain ordinary',()=>{
 const s=createState('학생',19);s.month=28;s.route='integrated';s.pending={kind:'workshop-plan'};
 for(const key of ['learning','research','social'])setScore(s,key,90);
 const before=structuredClone(s),n=decide(s,'host');
 for(const key of ['learning','research'])near(abilityScore(n,key),scoreAfterChange(90,GAME_BALANCE.abilityGrowthScale));
 near(abilityScore(n,'social'),scoreAfterChange(90,2*GAME_BALANCE.abilityGrowthScale));
 assert.equal(n.lab.funds,s.lab.funds-12);assert.equal(n.professorEnergy,s.professorEnergy-8);
 assert.equal(n.professor.research,s.professor.research+1);assert.deepEqual(n.career,s.career);assert.deepEqual(n.project,s.project);
 assert.deepEqual(s,before);assert.ok(validateSave(n));
});

test('independent planning gains saturate but confidence and wellbeing retain direct support',()=>{
 const s=createState('학생',19);s.started=true;s.month=12;s.pending={kind:'event',id:'counsel-small-question'};
 for(const key of ['learning','autonomy','language','rapport','confidence'])setScore(s,key,90);
 const welcome=decide(s,0);near(abilityScore(welcome,'learning'),scoreAfterChange(90,2*GAME_BALANCE.abilityGrowthScale));near(abilityScore(welcome,'rapport'),scoreAfterChange(90,3));near(abilityScore(welcome,'confidence'),91);
 const explain=decide(s,1);near(abilityScore(explain,'autonomy'),scoreAfterChange(90,2*GAME_BALANCE.abilityGrowthScale));near(abilityScore(explain,'language'),scoreAfterChange(90,GAME_BALANCE.abilityGrowthScale));
});

test('advanced preparation remains mathematically reachable and loading never rescales existing skills',()=>{
 // Eight nominal practice points per month for twelve months can lift 50 to above 90,
 // while no finite ordinary growth reaches 100. This is not an injected play result.
 let score=50;for(let month=0;month<12;month++)score=scoreAfterChange(score,8);
 assert.ok(score>90&&score<100);assert.ok(scoreAfterChange(50,52)>82);
 const s=createState('학생',19);for(const key of ['learning','research','language','social','autonomy','teaching','industry','enterprise','outreach','intuition'])setScore(s,key,90);
 const before=structuredClone(s),loaded=migrateSave(s);assert.deepEqual(loaded.hidden,s.hidden);assert.deepEqual(s,before);
});
