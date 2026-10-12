import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,roomDecorations} from '../dist/lab-scene.js';
import {projectRoom,sofaGeometry,sofaParts,cotGeometry,ROOM_ANCHORS} from '../dist/mini-room.js';

const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-8,`${message}: ${actual} ≠ ${expected}`);
const polygons=art=>[...art.matchAll(/<polygon points="([^"]+)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number)));
function leafPart(art,name){
 const found=art.match(new RegExp(`<g data-sofa-part="${name}">([^]*?)<\\/g>`));
 assert.ok(found,`the sofa has a ${name} part`);return found[1];
}
function seedFor(type){
 for(let seed=1;seed<=200;seed++)if(roomDecorations(createState('',seed)).restType===type)return seed;
 throw new Error(`No fixture for rest type ${type}`);
}
const sofaSeed=seedFor(0);

test('sofa cushion surfaces follow both floor tile axes instead of a viewport-dependent angle',()=>{
 const {back}=sofaParts(...ROOM_ANCHORS.sofa),surfaces=polygons(leafPart(back,'seat-cushions'));
 assert.equal(surfaces.length,6,'two cushions each expose one top and two vertical faces');
 for(const top of [surfaces[0],surfaces[3]]){
  assert.equal(top.length,4);
  const u=[top[1][0]-top[0][0],top[1][1]-top[0][1]],v=[top[3][0]-top[0][0],top[3][1]-top[0][1]];
  assert.ok(u[0]>0&&v[0]<0,'long edge follows +u and short edge follows +v');
  near(u[1]/u[0],.5,'long-edge slope follows the room floor');
  near(v[1]/v[0],-.5,'short-edge slope follows the room floor');
  for(let i=0;i<2;i++)near(top[2][i],top[1][i]+top[3][i]-top[0][i],'top is one planar parallelogram');
 }
});

test('sofa footprint and all leg bases remain inside the floor; the long front edge stays open',()=>{
 const g=sofaGeometry(...ROOM_ANCHORS.sofa),parts=sofaParts(...ROOM_ANCHORS.sofa);
 assert.ok(g.width>g.depth*2,'the couch runs along the right wall rather than across it');
 for(const [u,v]of g.footprint)assert.ok(u>=1&&u<=27&&v>=1&&v<=27,'the complete footprint keeps a floor margin');
 for(const [u,v]of g.legs){
  assert.ok(u>=1&&u+g.legSize<=27&&v>=1&&v+g.legSize<=27,'supports remain inside the room');
  const leg=parts.back.match(new RegExp(`<g class="sofa-leg" data-floor="${u},${v}">([^]*?)<\\/g>`));
  assert.ok(leg,'each modeled support is actually rendered');
  for(const p of [projectRoom(u,v+g.legSize),projectRoom(u+g.legSize,v+g.legSize),projectRoom(u+g.legSize,v)]){
   assert.ok(polygons(leg[1]).some(face=>face.some(q=>q.every((n,i)=>Math.abs(n-p[i])<1e-8))),'visible leg bases touch z=0');
  }
 }
 assert.ok(g.backrest.v+g.backrest.depth<g.seat.v,'the backrest sits behind the cushions');
 assert.equal(g.arms.length,2);
 for(const arm of g.arms){
  assert.ok(arm.width<g.width/4&&arm.depth===g.depth,'only two short end arms border the seat');
  assert.ok(arm.top<g.backrest.top,'armrests are lower than the backrest');
  assert.ok(arm.u+arm.width<=g.seat.u||arm.u>=g.seat.u+g.seat.width,'arms do not occupy the cushion opening');
 }
 assert.doesNotMatch(parts.back+parts.front,/data-sofa-part="(?:front-backrest|near-backrest|front-rail|near-long-rail)"/);
 assert.equal(polygons(parts.front).length,3,'foreground contains one short arm, not a long enclosing wall');
});

test('rendered resting hips meet the sofa cushion plane in both laboratory modes',()=>{
 const geometry=sofaGeometry(...ROOM_ANCHORS.sofa),seat=geometry.occupant;
 assert.ok(seat.u>geometry.seat.u&&seat.u<geometry.seat.u+geometry.seat.width);
 assert.ok(seat.v>geometry.seat.v&&seat.v<geometry.seat.v+geometry.seat.depth);
 for(const labMode of ['dry','wet'])for(const actual of ['rest','coffee']){
  const state=createState('',sofaSeed,{labMode}),scene=roomScene(state,{actual,performed:true,outcome:'completed'});
  const actor=scene.indexOf('class="mini-student '),portrait=scene.slice(actor).match(/<svg\b[^>]*class="portrait room-portrait"[^>]*>/);
  assert.ok(portrait,`${labMode}/${actual}: seated portrait is rendered`);
  const attrs=Object.fromEntries([...portrait[0].matchAll(/\b(y|height)="([^"]+)"/g)].map(m=>[m[1],Number(m[2])]));
  // The front seated sprite's hips resolve to y=376 in its 496-high SVG.
  // Check the actual portrait placement, rather than only a matching lift constant.
  const hipY=attrs.y+attrs.height*376/496,targetY=projectRoom(seat.u,seat.v,geometry.seat.top)[1];
  near(hipY,targetY,`${labMode}/${actual}: hip rests on the cushion`);
  assert.match(scene,new RegExp(`data-floor="${seat.u},${seat.v}"`));
 }
});

test('sofa painter order keeps the backrest behind the occupant and the near arm in front',()=>{
 for(const labMode of ['dry','wet'])for(const actual of ['rest','coffee']){
  const scene=roomScene(createState('',sofaSeed,{labMode}),{actual,performed:true,outcome:'completed'});
  const rear=scene.indexOf('class="room-sofa"'),backrest=scene.indexOf('data-sofa-part="far-backrest"',rear),cushions=scene.indexOf('data-sofa-part="seat-cushions"',rear),student=scene.indexOf('class="mini-student ',rear),nearArm=scene.indexOf('data-sofa-part="near-arm"',rear);
  assert.ok(rear>=0&&backrest>rear&&cushions>backrest&&student>cushions&&nearArm>student,`${labMode}/${actual}: rear → seat → student → near arm`);
  assert.equal((scene.match(/class="mini-student /g)||[]).length,1,'the resting actor is painted once');
 }
});

test('rest furniture rendering preserves game state and keeps folding bed supports on the floor',()=>{
 for(const labMode of ['dry','wet'])for(const restType of [0,1]){
  const state=createState('',seedFor(restType),{labMode}),before=structuredClone(state);
  for(const actual of ['idle','rest','coffee','analysis']){
   const scene=roomScene(state,{actual,performed:true,outcome:'completed'},0,{idle:actual==='idle'});
   if(restType===0){
    const parts=sofaParts(...ROOM_ANCHORS.sofa);
    assert.ok(scene.includes(parts.back)&&scene.includes(parts.front),'furniture shape does not change with activity');
   }else{
    const g=cotGeometry(...ROOM_ANCHORS.cot);
    for(const [u,v]of g.footprint)assert.ok(u>=1&&u<=27&&v>=1&&v<=27);
    const supports=[...scene.matchAll(/<g class="cot-leg" data-floor="([^"]+)">([^]*?)<\/g>/g)];
    assert.equal(supports.length,4);
    for(const support of supports){
     const [u,v]=support[1].split(',').map(Number),p=projectRoom(u+g.legSize,v+g.legSize);
     assert.ok(polygons(support[2]).some(face=>face.some(q=>q.every((n,i)=>Math.abs(n-p[i])<1e-8))),'cot legs retain the shared z=0 plane');
    }
   }
  }
  assert.deepEqual(state,before,'cosmetic geometry never changes simulation seed, balances, or student attributes');
 }
});
