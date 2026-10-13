import test from 'node:test';import assert from 'node:assert/strict';import {createState,validateSave} from '../dist/engine.js';import {checkpointRecord,checkpointState,monthlyCheckpointId} from '../dist/checkpoints.js';import {studentAppearance,weeklyAppearance} from '../dist/appearance.js';import {roomScene} from '../dist/lab-scene.js';
test('checkpoint restores exact plans and RNG through a validated deep copy',()=>{const s=createState('김민지',3);s.creationSeed=3;s.started=true;s.plan=['language','language','analysis','free'];const record=checkpointRecord(s,{kind:'auto',now:100});assert.equal(record.meta.id,monthlyCheckpointId(s));s.hidden.rapport=10;s.plan[0]='study';const loaded=checkpointState(record);assert.equal(loaded.hidden.rapport,record.state.hidden.rapport);assert.deepEqual(loaded.plan,['language','language','analysis','free']);assert.equal(loaded.seed,record.state.seed);loaded.plan[0]='study';assert.equal(record.state.plan[0],'language');assert.ok(validateSave(loaded));assert.throws(()=>checkpointState({state:{...record.state,lab:{...record.state.lab,debt:-1}}}));assert.throws(()=>checkpointRecord(s,{kind:'unexpected'}));});
test('hair lengths peak short for men, span short to long for women, and dry clothing never uses a coat',()=>{const male=Array(7).fill(0),female=Array(7).fill(0);for(let i=1;i<=3000;i++){male[studentAppearance(i*7919,'male').hairLength]++;female[studentAppearance(i*7919,'female').hairLength]++;}assert.equal(male.indexOf(Math.max(...male)),2);assert.ok(male[1]+male[2]+male[3]>2700);assert.ok(female.slice(1).every(n=>n>350));const s=createState('',3,{labMode:'dry'});s.creationSeed=3;for(let m=0;m<96;m++){s.month=m;for(let w=0;w<5;w++)assert.notEqual(weeklyAppearance(s,w).outfit,0);}assert.ok(!roomScene(s,{actual:'experiment',performed:true}).includes('data-outfit="0"'));s.professorProfile.labMode='wet';assert.match(roomScene(s,{actual:'experiment',performed:true}),/data-outfit="0"/);});

test('a full checkpoint store prunes the oldest monthly auto saves of other runs first', async () => {
  const {pruneTargets} = await import('../dist/checkpoints.js');
  const metas = [
    {id: 'a:month:1', run: 'a', kind: 'auto', savedAt: 5},
    {id: 'b:month:1', run: 'b', kind: 'auto', savedAt: 9},
    {id: 'b:month:2', run: 'b', kind: 'auto', savedAt: 1},
    {id: 'b:manual:1', run: 'b', kind: 'manual', savedAt: 0},
    {id: 'b:backup', run: 'b', kind: 'backup', savedAt: 0},
  ];
  assert.deepEqual(pruneTargets(metas, 'a', 2).map(m => m.id), ['b:month:2', 'b:month:1']);
  assert.deepEqual(pruneTargets(metas, 'a', 3).map(m => m.id), ['b:month:2', 'b:month:1', 'a:month:1']);
  assert.equal(pruneTargets(metas.filter(m => m.kind !== 'auto'), 'a', 1).length, 0);
});
