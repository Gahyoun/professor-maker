import test from 'node:test';
import assert from 'node:assert/strict';
import {studentAppearance,weeklyAppearance,labHairStyle} from '../dist/appearance.js';
import {renderStudentPortrait} from '../dist/student-pixel-art.js';
import {createState} from '../dist/engine.js';
const poses=[['standing','front'],['seated','monitor'],['lecturing','front'],['experiment','front'],['seated','front']];

test('wet long hair is tied by a stable seed choice and dry or short hair stays loose',()=>{
 const variants=new Set();
 for(let seed=1;seed<=100;seed++){
  for(const length of [5,6]){const style=labHairStyle(seed,length,'wet');variants.add(style);assert.equal(style,labHairStyle(seed,length,'wet'));assert.equal(labHairStyle(seed,length,'dry'),'loose');}
  for(const length of [0,1,2,3,4])assert.equal(labHairStyle(seed,length,'wet'),'loose');
 }
 assert.deepEqual(variants,new Set(['braided-bun','ponytail']));
});

test('every wet long-haired identity uses the same tie in study, TA, experiment and rest without editing the save',()=>{
 for(const gender of ['female','unspecified']){
  let seed;for(let n=1;n<=1000;n++)if(studentAppearance(n,gender).hairLength>=5){seed=n;break;}assert.ok(seed);
  const state=createState('',seed,{labMode:'wet',gender});state.gender=gender;state.month=36;const saved=structuredClone(state);
  const initial=studentAppearance(state.creationSeed,gender),style=labHairStyle(state.creationSeed,initial.hairLength,'wet');
  for(let week=0;week<5;week++){
   const a=weeklyAppearance(state,week);assert.equal(a.hairLength,initial.hairLength);assert.equal(a.hairStyle,style);
   for(const [pose,facing]of poses)assert.ok(renderStudentPortrait(a,'학생','neutral',pose,facing).includes(`data-hair-style="${style}"`));
  }
  assert.deepEqual(state,saved);
 }
});

test('training buzz overrides a long wet haircut, then restores its original saved length and tie',()=>{
 let seed;for(let n=1;n<=50000;n++)if(studentAppearance(n,'male').hairLength>=5){seed=n;break;}assert.ok(seed);
 const state=createState('',seed,{labMode:'wet',gender:'male'});state.gender='male';state.month=40;
 state.service={...state.service,trainingStartMonth:40,trainingReturnMonth:41};const original=studentAppearance(state.creationSeed,'male');
 for(const [month,index]of [[40,3],[41,0],[42,4]]){
  const a=weeklyAppearance({...state,month},index);assert.equal(a.hairLength,0);assert.equal(a.hairStyle,'loose');
  assert.ok(!renderStudentPortrait(a,'학생','neutral','seated','monitor').includes('data-hair-style'));
 }
 const recovered=weeklyAppearance({...state,month:43});assert.equal(recovered.hairLength,original.hairLength);assert.equal(recovered.hairStyle,labHairStyle(seed,original.hairLength,'wet'));
});

test('dry rendering preserves loose hair even if an old render-only tie property remains',()=>{
 const a={...studentAppearance(13,'female'),hairLength:6,labMode:'dry',glasses:true};
 for(const [pose,facing]of poses){
  const loose=renderStudentPortrait({...a,hairStyle:'loose'},'학생','neutral',pose,facing);
  for(const hairStyle of ['ponytail','braided-bun'])assert.equal(renderStudentPortrait({...a,hairStyle},'학생','neutral',pose,facing),loose);
 }
});
