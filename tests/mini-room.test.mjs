import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,roomDecorations} from '../dist/lab-scene.js';
import {projectRoom,chairGeometry,ROOM_ANCHORS,WALLPAPERS,FLOOR_TILES,PLANT_SPECIES} from '../dist/mini-room.js';
test('room floor axes have equal lengths and opposing slopes; height stays vertical',()=>{
 const delta=(a,b)=>a.map((v,i)=>v-b[i]),base=projectRoom(0,0),u=delta(projectRoom(1,0),base),v=delta(projectRoom(0,1),base);
 assert.equal(Math.hypot(...u),Math.hypot(...v));assert.equal(u[0],-v[0]);assert.equal(u[1],v[1]);
 for(const [a,b,h] of [[3,4,20],[19,14,48],[28,28,90]])assert.deepEqual(delta(projectRoom(a,b,h),projectRoom(a,b)),[0,-h]);
});

test('students have no ground shadow in any lab pose while furniture keeps its shadow',()=>{
 for(const labMode of ['dry','wet']){
  const state=createState('',9,{labMode}),before=structuredClone(state);
  for(const actual of ['idle','analysis','experiment','presentation','coursework','rest','coffee']){
   const scene=roomScene(state,{actual,performed:true,outcome:'completed'},0,{idle:actual==='idle'});
   assert.equal((scene.match(/class="mini-student /g)||[]).length,1,`${labMode}/${actual}`);
   assert.doesNotMatch(scene,/#b9b4a4|student-shadow|drop-shadow/);
   assert.match(scene,/class="chair-floor-shadow"/,'furniture shading remains');
  }
  assert.deepEqual(state,before);
 }
});

test('resting students sit at their own furniture anchor with the backrest behind them',()=>{
 const seen=new Set(),anchors=['24.3,8.5','26,6.5','24.1,7.5','23.5,6.5'];
 for(let seed=1;seed<=100&&seen.size<4;seed++){
  const s=createState('',seed,{labMode:'dry'}),type=roomDecorations(s).restType;if(seen.has(type))continue;seen.add(type);
  for(const actual of ['rest','coffee']){
   const scene=roomScene(s,{actual,performed:true,outcome:'completed'});
   assert.equal((scene.match(/class="mini-student /g)||[]).length,1);
   assert.match(scene,new RegExp('data-floor="'+anchors[type]+'"'));
   const seat=scene.indexOf('class="rest-seat-layer"'),backrest=scene.indexOf('data-rest=',seat),student=scene.indexOf('class="mini-student ',seat);
   assert.ok(seat>=0&&backrest>seat&&student>backrest,'rest furniture must render before its seated occupant');
   assert.match(scene,/data-pose="seated"/);
  }
 }
 assert.equal(seen.size,4);
});
test('desk work sits in front of the monitor and faces it, with one chair and aligned desktop tools',()=>{
 for(const labMode of ['dry','wet']){
  const state=createState('',9,{labMode}),before=structuredClone(state);
  for(const actual of ['study','coursework','analysis','language','paper',...(labMode==='dry'?['experiment']:[])]){
   const scene=roomScene(state,{actual,performed:true,outcome:'completed'});
   assert.match(scene,/data-pose="seated" data-outfit="[0-5]" data-facing="monitor"/);
   assert.match(scene,/class="mini-student [^>]+data-floor="13.5,23.5"/);
   assert.match(scene,/class="desk-monitor" data-floor="14.2,18.3"/);
   assert.match(scene,/class="desk-keyboard" data-floor="13.5,21.3"/);
   assert.equal((scene.match(/data-chair=/g)||[]).length,1+(scene.includes('data-rest="camp-chair"')?1:0));
   const seat=scene.indexOf('class="desk-seat-layer"'),chair=scene.indexOf('data-chair=',seat),student=scene.indexOf('class="mini-student ',seat),front=scene.indexOf('class="chair-foreground"',seat);
   assert.ok(seat>=0&&chair>seat&&student>chair&&front>student,'the occupant sits between the chair seat and its near backrest');
   assert.ok(seat>scene.indexOf('class="desk-keyboard"'),'the desktop must not repaint over the student face');
  }
  assert.deepEqual(state,before);
 }
 const seat=projectRoom(13.5,23.5),screen=projectRoom(16.55,18.6,44);
 assert.ok(screen[0]>seat[0]&&screen[1]<seat[1],'the seated student looks towards the upper-right screen');
});
test('all four desk chairs occlude the seated body, while the idle student stands clear of the plant',()=>{
 const seen=new Set();
 for(let seed=1;seed<=120;seed++){
  const s=createState('',seed,{labMode:seed%2?'wet':'dry'}),before=JSON.stringify(s),type=roomDecorations(s).chairType;
  if(!seen.has(type)){
   seen.add(type);const scene=roomScene(s,{actual:'analysis',performed:true,outcome:'completed'});
   const student=scene.indexOf('class="mini-student '),front=scene.indexOf('class="chair-foreground"');
   assert.ok(front>student,`chair ${type}: near backrest must occlude the student's lower back`);
   assert.match(scene,new RegExp(`data-chair="${type}" data-chair-facing="monitor"`));
  }
  const scene=roomScene(s,{actual:'idle'},0,{idle:true});
  assert.match(scene,new RegExp(`class="mini-student [^>]+data-floor="${ROOM_ANCHORS.standing.join(',')}"`));
  assert.match(scene,new RegExp(`class="room-plant" data-floor="${ROOM_ANCHORS.plant.join(',')}"`));
  assert.equal(JSON.stringify(s),before);
 }
 assert.equal(seen.size,4);
 const [x]=projectRoom(...ROOM_ANCHORS.standing),[plantX]=projectRoom(...ROOM_ANCHORS.plant);
 assert.ok(Math.abs(x-plantX)>=36,'idle feet and the foreground plant need separate projected footprints');
});
test('office chairs connect five grounded casters to a visible support pole and mounted armrests',()=>{
 for(const type of [2,3]){
  const geometry=chairGeometry(12,22,type),{center,seat,casters}=geometry;
  assert.deepEqual(center,ROOM_ANCHORS.deskSeat);
  assert.equal(casters.length,5);assert.equal(new Set(casters.map(p=>p.join(','))).size,5);
  for(const [u,v] of casters)assert.ok(Math.abs(Math.hypot(u-center[0],v-center[1])-1.85)<1e-9);
  const front=projectRoom(seat.u+seat.w,seat.v+seat.d,seat.bottom)[1],hub=projectRoom(...center,3)[1];
  assert.ok(hub-front>4,'the lower pole must remain visible below the seat instead of hiding entirely behind it');
  let state;for(let seed=1;seed<=120;seed++){const candidate=createState('',seed,{labMode:'dry'});if(roomDecorations(candidate).chairType===type){state=candidate;break;}}
  const scene=roomScene(state,{actual:'analysis',performed:true,outcome:'completed'});
  assert.equal((scene.match(/class="chair-spoke"/g)||[]).length,5);
  assert.match(scene,/class="chair-support-pole"/);
  assert.equal((scene.match(/class="chair-armrest"/g)||[]).length,2);
  assert.ok(scene.indexOf('class="chair-wheelbase"')<scene.indexOf('class="mini-student '),'the connected support is behind the seated body');
 }
});
test('the far chair arm stays behind the student while near desk edges occlude the legs',()=>{
 const seen=new Set();
 for(let seed=1;seed<=120&&seen.size<4;seed++){
  const state=createState('',seed,{labMode:'dry'}),type=roomDecorations(state).chairType;if(seen.has(type))continue;seen.add(type);
  const scene=roomScene(state,{actual:'analysis',performed:true,outcome:'completed'});
  const seat=scene.indexOf('class="desk-seat-layer"'),keyboard=scene.indexOf('class="desk-keyboard"'),student=scene.indexOf('class="mini-student ',seat),backrest=scene.indexOf('data-chair-part="near-backrest"',seat),desk=scene.indexOf('class="desk-foreground"',seat);
  assert.ok(keyboard<student&&student<backrest&&backrest<desk,'only near desk edges repaint after the avatar and chair back');
  if(type>=2){assert.ok(scene.indexOf('data-chair-part="far-armrest"',seat)<student);assert.ok(scene.indexOf('data-chair-part="near-armrest"',seat)>student);}
  assert.equal((scene.match(/class="desk-lower-occlusion"/g)||[]).length,1);
  const hipY=projectRoom(...ROOM_ANCHORS.deskSeat,20)[1];
  assert.ok(scene.includes(`class="desk-lower-occlusion" x="0" y="${hipY}"`),'late desk repaint is clipped below the seat instead of covering the upper body');
 }
 assert.equal(seen.size,4);
});
test('cosmetic room variety is stable and never consumes gameplay state',()=>{
 const walls=new Set(),floors=new Set(),props=new Set(),plants=new Set();
 for(let seed=1;seed<=120;seed++){const s=createState('',seed,{labMode:seed%2?'wet':'dry'}),before=JSON.stringify(s),d=roomDecorations(s);assert.deepEqual(d,roomDecorations(s));walls.add(d.wallpaper);floors.add(d.floor);for(const [key,value]of Object.entries(d))if(value===true)props.add(key);const scene=roomScene(s,{actual:'idle'},0,{idle:true});assert.equal(JSON.stringify(s),before);assert.match(scene,/data-projection="isometric"/);assert.match(scene,/preserveAspectRatio="xMidYMid meet"/);assert.equal((scene.match(/class="portrait /g)||[]).length,1);assert.ok(!scene.includes('class="pixel-student'));
  plants.add(d.plantType);assert.match(scene,/class="window-plant-shelf"/);assert.ok((scene.match(/data-plant-species=/g)||[]).length>=2);
 }assert.equal(walls.size,WALLPAPERS.length);assert.equal(floors.size,FLOOR_TILES.length);assert.equal(plants.size,PLANT_SPECIES.length);for(const key of ['fridge','kettle','plush','cot','sofa','server','printer','plant','bag','deskLamp','clock','noticeboard'])assert.ok(props.has(key),key);
});
test('lab material scarcity, weekly outfit changes and conference/defense scenes survive the miniroom',()=>{
 const s=createState('',6,{labMode:'wet'});s.lab.funds=200;s.lab.budget.environment=4;s.lab.equipment=60;const rich=roomScene(s,{actual:'experiment',performed:true},0),nextWeek=roomScene(s,{actual:'experiment',performed:true},1);assert.match(rich,/data-supply="rich"/);assert.match(rich,/data-motion="measuring"/);assert.notEqual(rich,nextWeek);
 s.lab.funds=10;s.lab.budget.environment=0;const sparse=roomScene(s,{actual:'experiment',performed:true},0);assert.match(sparse,/data-supply="sparse"/);assert.ok(sparse.length<rich.length);
 assert.match(roomScene(s,{actual:'rest'}),/data-scene="rest" data-projection="isometric"/);assert.match(roomScene(s,{actual:'conference',abroad:true}),/INTERNATIONAL CONFERENCE/);
 s.pending={kind:'thesis',step:'questions'};assert.match(roomScene(s),/THESIS DEFENSE/);assert.match(roomScene(s),/질의응답/);
});
