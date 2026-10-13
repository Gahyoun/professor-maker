import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {validRecord} from '../backend/api.js';
// Import the browser adapter with an empty ephemeral storage; Node's optional
// localStorage file is unrelated to this pure record/privacy test.
const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem(){},removeItem(){}}});
const {analysisRecord}=await import('../dist/analytics.js');
if(storageDescriptor)Object.defineProperty(globalThis,'localStorage',storageDescriptor);else delete globalThis.localStorage;

test('monthly analytics include gameplay measures without names, seed, backgrounds or portraits',()=>{
 const state=createState('Name must stay local',423,{locale:'en'});state.started=true;
 state.professorProfile.professorName='Faculty name must stay local';state.professorProfile.professorSurname='Surname must stay local';
 state.background={immigration:'private background'};state.appearance={skin:'private appearance'};
 const record=analysisRecord(state);
 assert.equal(validRecord(record),true);const json=JSON.stringify(record);
 for(const value of ['Name must stay local','Faculty name must stay local','Surname must stay local','private background','private appearance'])assert.equal(json.includes(value),false);
 for(const key of ['name','seed','creationSeed','locale','professorProfile','background','appearance'])assert.equal(Object.hasOwn(record,key),false);
});

test('analytics records snapshot gameplay arrays instead of exposing mutable save references',()=>{
 const state=createState('Synthetic name',44),record=analysisRecord(state),originalPlan=[...record.plan];
 state.plan[0]='rest';state.professor.research=0;state.hidden.stress=99;
 assert.deepEqual(record.plan,originalPlan);assert.notEqual(record.faculty.research,state.professor.research);assert.notEqual(record.student.stress,state.hidden.stress);
});
