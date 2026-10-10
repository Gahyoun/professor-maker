import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,roomDecorations} from '../dist/lab-scene.js';
import {projectRoom,WALLPAPERS,FLOOR_TILES} from '../dist/mini-room.js';
test('room floor axes have equal lengths and opposing slopes; height stays vertical',()=>{
 const delta=(a,b)=>a.map((v,i)=>v-b[i]),base=projectRoom(0,0),u=delta(projectRoom(1,0),base),v=delta(projectRoom(0,1),base);
 assert.equal(Math.hypot(...u),Math.hypot(...v));assert.equal(u[0],-v[0]);assert.equal(u[1],v[1]);
 for(const [a,b,h] of [[3,4,20],[19,14,48],[28,28,90]])assert.deepEqual(delta(projectRoom(a,b,h),projectRoom(a,b)),[0,-h]);
});
test('cosmetic room variety is stable and never consumes gameplay state',()=>{
 const walls=new Set(),floors=new Set(),props=new Set();
 for(let seed=1;seed<=120;seed++){const s=createState('',seed,{labMode:seed%2?'wet':'dry'}),before=JSON.stringify(s),d=roomDecorations(s);assert.deepEqual(d,roomDecorations(s));walls.add(d.wallpaper);floors.add(d.floor);for(const [key,value]of Object.entries(d))if(value===true)props.add(key);const scene=roomScene(s,{actual:'idle'},0,{idle:true});assert.equal(JSON.stringify(s),before);assert.match(scene,/data-projection="isometric"/);assert.match(scene,/preserveAspectRatio="xMidYMid meet"/);assert.equal((scene.match(/class="portrait /g)||[]).length,1);assert.ok(!scene.includes('class="pixel-student'));
 }assert.equal(walls.size,WALLPAPERS.length);assert.equal(floors.size,FLOOR_TILES.length);for(const key of ['fridge','kettle','plush','cot','sofa','server','printer','plant','bag','deskLamp','clock','noticeboard'])assert.ok(props.has(key),key);
});
test('lab material scarcity, weekly outfit changes and conference/defense scenes survive the miniroom',()=>{
 const s=createState('',6,{labMode:'wet'});s.lab.funds=200;s.lab.budget.environment=4;s.lab.equipment=60;const rich=roomScene(s,{actual:'experiment',performed:true},0),nextWeek=roomScene(s,{actual:'experiment',performed:true},1);assert.match(rich,/data-supply="rich"/);assert.match(rich,/data-motion="measuring"/);assert.notEqual(rich,nextWeek);
 s.lab.funds=10;s.lab.budget.environment=0;const sparse=roomScene(s,{actual:'experiment',performed:true},0);assert.match(sparse,/data-supply="sparse"/);assert.ok(sparse.length<rich.length);
 assert.match(roomScene(s,{actual:'rest'}),/data-scene="rest" data-projection="isometric"/);assert.match(roomScene(s,{actual:'conference',abroad:true}),/INTERNATIONAL CONFERENCE/);
 s.pending={kind:'thesis',step:'questions'};assert.match(roomScene(s),/THESIS DEFENSE/);assert.match(roomScene(s),/질의응답/);
});
