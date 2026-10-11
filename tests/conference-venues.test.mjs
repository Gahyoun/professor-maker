import test from 'node:test';import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,renderLabScene,conferenceHall,CONFERENCE_VENUES,conferenceVenue} from '../dist/lab-scene.js';

test('all four conference venues have distinct structures and cosmetic selection never changes state',()=>{
 const state=createState('김민지',25,{gender:'female',fieldId:'050',labMode:'dry'});state.month=36;const saved=structuredClone(state),all=new Set();
 for(const v of CONFERENCE_VENUES){
  const scene=roomScene(state,{actual:'conference',abroad:true,outcome:'presented'},2,{venue:v.id});all.add(scene);
  assert.match(scene,new RegExp(`data-venue="${v.id}"`));assert.match(scene,/viewBox="0 0 600 360"/);assert.match(scene,/preserveAspectRatio="xMidYMid meet"/);assert.match(scene,/INTERNATIONAL CONFERENCE/);
  assert.equal((scene.match(/class="portrait conference-portrait"/g)||[]).length,1);assert.doesNotMatch(scene,/class="pixel-student /);
  if(v.id==='poster')assert.equal((scene.match(/class="conference-poster"/g)||[]).length,3);
  if(v.id==='hotel')assert.equal((scene.match(/class="conference-round-table"/g)||[]).length,3);
  assert.deepEqual(state,saved);assert.equal(scene,roomScene(state,{actual:'conference',abroad:true,outcome:'presented'},2,{venue:v.id}));
 }
 assert.equal(all.size,4);
});
test('seeded hall selection remains stable; explicit venue and safe fallback do not consume RNG',()=>{
 const state=createState('',77),saved=structuredClone(state),halls=new Set();
 for(let month=0;month<16;month++){const s={...state,month};halls.add(conferenceHall(s));assert.match(roomScene(s,{actual:'conference'}),new RegExp(`data-venue="${CONFERENCE_VENUES[conferenceHall(s)].id}"`));}
 assert.equal(halls.size,4);assert.equal(conferenceVenue('invalid',3),3);assert.equal(conferenceVenue(-1,2),2);
 assert.match(roomScene(state,{actual:'conference',venue:'poster'}),/data-venue="poster"/);assert.deepEqual(state,saved);
});
test('defense and exported snapshots use the shared venue drawing and a single student',()=>{
 const state=createState('',6,{labMode:'wet'});state.pending={kind:'thesis',step:'questions'};
 for(const v of CONFERENCE_VENUES){const scene=roomScene(state,{actual:'idle'},0,{venue:v.id});assert.match(scene,/THESIS (DEFENSE|POSTER DISCUSSION)/);assert.match(scene,/class="defense-panel"/);assert.match(scene,/질의응답/);assert.match(renderLabScene(state,{actual:'conference'},0,{venue:v.id}),new RegExp(`data-venue="${v.id}"`));}
});

test('all conference display planes are16:9 and contain no responsive geometry',()=>{
 const state=createState('',6,{fieldId:'050',labMode:'dry'});
 for(const v of CONFERENCE_VENUES){const svg=renderLabScene(state,{actual:'conference'},0,{venue:v.id});const displays=[...svg.matchAll(/<rect class="monitor-display"[^>]+width="([\d.]+)" height="([\d.]+)"/g)];assert.equal(displays.length,1);for(const m of displays)assert.ok(Math.abs(+m[1]/+m[2]-16/9)<1e-9);}
});
