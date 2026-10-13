import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {labSeason,renderLabScene,roomScene,supplyLevel} from '../dist/lab-scene.js';

test('the window follows the displayed academic month in Korean and English',()=>{
 for(const [locale,expected] of [['ko',['spring','summer','autumn','winter']],['en',['autumn','winter','spring','summer']]]){
  const state=createState('',7919);state.locale=locale;
  for(const [i,season] of expected.entries()){
   state.month=i*3;
   assert.equal(labSeason(state,{idle:true}),season);
   assert.match(roomScene(state,{actual:'idle'},0,{idle:true}),new RegExp(`data-season="${season}"`));
  }
 }
 const state=createState('',7919);state.month=3; // Current June; completed weeks belong to May.
 assert.equal(labSeason(state,{idle:true}),'summer');
 assert.equal(labSeason(state),'spring');
 state.visualMonth=9;
 assert.equal(labSeason(state,{idle:true}),'winter');
});

test('completed calendars retain the final February or August window view',()=>{
 for(const [locale,season] of [['ko','winter'],['en','summer']]){
  const state=createState('',7919);state.locale=locale;
  for(const month of [95,96]){
   state.month=month;
   assert.equal(labSeason(state,{idle:true}),season);
   assert.match(renderLabScene(state),new RegExp(`data-season="${season}"`));
  }
  assert.equal(labSeason(state),season,'completed replay uses the last performed month');
  state.visualMonth=0;
  assert.equal(labSeason(state,{idle:true}),locale==='ko'?'spring':'autumn','explicit snapshot month keeps priority');
 }
});

test('CV snapshots can omit the student while preserving the same grounded room and season',()=>{
 const state=createState('',7919,{gender:'female',fieldId:'073',labMode:'wet'}),before=structuredClone(state);
 const full=renderLabScene(state),snapshot=renderLabScene(state,{actual:'idle'},0,{idle:true,student:false});
 assert.equal((full.match(/class="portrait /g)||[]).length,1);
 assert.doesNotMatch(snapshot,/class="portrait |class="mini-student /);
 for(const marker of ['seasonal-window','compression-frame','chair-support-pole','concrete-specimens'])assert.ok(snapshot.includes(marker),marker);
 assert.ok(snapshot.length<full.length/2,'omitting the detailed student limits archive size');
 assert.deepEqual(state,before);
});

test('standalone snapshots retain the live room supply level unless explicitly overridden',()=>{
 const state=createState('',7919,{fieldId:'057',labMode:'wet'});
 for(const [funds,environment,equipment,stock] of [[10,2,60,'sparse'],[100,2,60,'balanced'],[200,3,60,'rich']]){
  state.lab.funds=funds;state.lab.budget.environment=environment;state.lab.equipment=equipment;
  assert.equal(supplyLevel(state),stock);
  assert.equal(renderLabScene(state,{actual:'idle'},0,{idle:true,student:false}),renderLabScene(state,{actual:'idle'},0,{idle:true,student:false,stock}));
 }
 assert.notEqual(renderLabScene(state,{actual:'idle'},0,{idle:true,student:false,stock:'sparse'}),renderLabScene(state,{actual:'idle'},0,{idle:true,student:false}));
});

test('discipline kits and seasonal SVG stay standalone and do not change saved gameplay',()=>{
 for(const [fieldId,kit] of [['057','environment'],['077','environment'],['072','architecture'],['073','architecture'],['075','civil']]){
  for(const labMode of fieldId==='072'?['dry']:['dry','wet'])for(const month of [0,3,6,9]){
   const state=createState('',173,{fieldId,labMode});state.month=month;
   const before=structuredClone(state),svg=renderLabScene(state),again=renderLabScene(state);
   assert.equal(svg,again);assert.deepEqual(state,before);
   assert.match(svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
   assert.match(svg,new RegExp(`data-field-kit="${kit}"`));
   assert.match(svg,/class="seasonal-window"/);
   assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|(?:href|src)=|url\(|NaN|undefined|Infinity/);
   assert.match(svg,/data-layer-order="chair-rear student chair-front desk-front"/);
   assert.equal((svg.match(/class="portrait /g)||[]).length,1);
  }
 }
});
