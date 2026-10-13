import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,roomDecorations} from '../dist/lab-scene.js';
import {projectRoom,cotGeometry,cot,restFurniture,yogaMat,ROOM_ANCHORS} from '../dist/mini-room.js';

const polygons=art=>[...art.matchAll(/<polygon points="([^"]+)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number)));

function seedFor(type){
 for(let seed=1;seed<=200;seed++)if(roomDecorations(createState('',seed)).restType===type)return seed;
 throw new Error(`No fixture for rest type ${type}`);
}

test('cot 3D isometric axonometric projection, frame structure, mattress, pillow and blanket folds', () => {
 for (const anchor of [ROOM_ANCHORS.cot, ROOM_ANCHORS.spareCot]) {
  const g = cotGeometry(...anchor);
  assert.equal(g.width, 7, 'cot width is 7 units');
  assert.equal(g.depth, 3, 'cot depth is 3 units');
  assert.equal(g.legs.length, 4, 'cot has 4 corner legs');
  for (const [u, v] of g.footprint) {
   assert.ok(u >= 1 && u <= 27 && v >= 1 && v <= 27, 'footprint retains room floor margins');
  }
  for (const [u, v] of g.legs) {
   assert.ok(u >= 1 && u + g.legSize <= 27 && v >= 1 && v + g.legSize <= 27, 'legs stay inside floor');
  }
 }

 const cotSeed = seedFor(1);
 const state = createState('이하늘', cotSeed, {gender: 'female', labMode: 'wet'});
 const scene = roomScene(state, {actual: 'idle'}, 0, {idle: true});

 // Cot frame, mattress, pillow, wrinkles
 assert.match(scene, /class="room-cot"/, 'room cot is present');
 assert.match(scene, /data-cot-type="cot"/, 'data-cot-type attribute present on cot');
 assert.match(scene, /class="cot-floor-shadow"/, 'cot contact shadow is cast on floor');
 const legs = [...scene.matchAll(/<g class="cot-leg" data-floor="([^"]+)">([^]*?)<\/g>/g)];
 assert.equal(legs.length, 4, 'all 4 corner legs rendered');
 for (const leg of legs) {
  const [u, v] = leg[1].split(',').map(Number), p = projectRoom(u + 0.5, v + 0.5);
  assert.ok(polygons(leg[2]).some(face => face.some(q => q.every((n, i) => Math.abs(n - p[i]) < 1e-8))), 'legs touch floor at z=0');
 }

 // Frame center folding brackets and hinge rivet
 assert.match(scene, /fill="#cbd5e1"/, 'folding hinge rivet circle rendered');
 // Blanket fold wrinkles and pillow
 assert.match(scene, /aria-label="접이식 침대"/, 'accessible cot label present');
});

test('yoga mat, foam roller, and nap cushion healing props', () => {
 // Standalone export test
 const matHtml = yogaMat(10, 10, {w: 5.0, d: 1.2});
 assert.match(matHtml, /class="lab-yoga-mat"/, 'yoga mat root group rendered');
 assert.match(matHtml, /data-cot-type="yoga-mat"/, 'data-cot-type attribute set');
 assert.match(matHtml, /data-object="yoga-mat"/, 'data-object attribute set');
 assert.match(matHtml, /class="yoga-foam-roller"/, 'foam roller group rendered');
 assert.match(matHtml, /data-object="foam-roller"/, 'data-object foam roller set');
 assert.match(matHtml, /class="yoga-nap-cushion"/, 'nap cushion group rendered');
 assert.match(matHtml, /data-object="nap-cushion"/, 'data-object nap cushion set');

 // Integrated rest cot rendering test
 const cotSeed = seedFor(1);
 const state = createState('한지우', cotSeed, {gender: 'male', labMode: 'dry'});
 const scene = roomScene(state, {actual: 'idle'}, 0, {idle: true});
 assert.match(scene, /class="lab-yoga-mat"/, 'yoga mat rendered beside cot');
 assert.match(scene, /class="yoga-foam-roller"/, 'stretching foam roller rendered beside cot');
 assert.match(scene, /class="yoga-nap-cushion"/, 'nap cushion rendered beside cot');

 // Spare cot in corner (seed 5 has sofa restType 0 and cot: true) does not render redundant yoga mat at boundary
 const spareState = createState('', 5, {gender: 'female', labMode: 'dry'});
 const spareScene = roomScene(spareState, {actual: 'idle'}, 0, {idle: true});
 assert.match(spareScene, /class="room-cot" data-floor="19,24"/, 'spare cot is rendered');
 assert.doesNotMatch(spareScene, /class="lab-yoga-mat"/, 'spare cot does not render redundant yoga mat at floor edge');
});

test('cot rest furniture group supports yoga-mat as selectable rest cot variant with data-rest="cot"', () => {
 const yogaCotHtml = cot(20, 5, {cotType: 'yoga-mat'});
 assert.match(yogaCotHtml, /class="room-cot"/);
 assert.match(yogaCotHtml, /data-cot-type="yoga-mat"/);
 assert.match(yogaCotHtml, /class="lab-yoga-mat"/);

 // Standalone yoga mat rest furniture under data-rest="cot"
 const yogaRest = restFurniture(20, 5, 'yoga-mat');
 assert.match(yogaRest, /<g data-rest="cot" data-cot-type="yoga-mat">/);
 assert.match(yogaRest, /class="lab-yoga-mat"/);
});

test('bedside nightstand, mood lamp, mug, and warm rest scene atmosphere', () => {
 const cotSeed = seedFor(1);
 const state = createState('박도현', cotSeed, {gender: 'female', labMode: 'dry'});

 // Rest action test
 const restScene = roomScene(state, {actual: 'rest', performed: true, outcome: 'completed'}, 0, {idle: false});
 assert.match(restScene, /class="rest-nightstand"/, 'bedside nightstand rendered');
 assert.match(restScene, /data-object="bedside-nightstand"/, 'nightstand object attribute');
 assert.match(restScene, /data-object="rest-mug"/, 'bedside mug present');
 assert.match(restScene, /class="cup-steam"/, 'mug steam present');
 assert.match(restScene, /data-object="mood-lamp"/, 'mood lamp present');
 assert.match(restScene, /class="rest-lamp-lighting"/, 'mood lamp glow aura active in rest');
 assert.match(restScene, /class="rest-scene-atmosphere"/, 'warm rest lighting atmosphere active');
 assert.match(restScene, /class="cot-lap-drape"/, 'cot lap blanket drape fold active for resting student');

 // Coffee break action test
 const coffeeScene = roomScene(state, {actual: 'coffee', performed: true, outcome: 'completed'}, 0, {idle: false});
 assert.match(coffeeScene, /class="rest-nightstand"/, 'nightstand present during coffee break');
 assert.match(coffeeScene, /class="rest-lamp-lighting"/, 'lamp lighting active during coffee break');
 assert.match(coffeeScene, /class="rest-scene-atmosphere"/, 'rest atmosphere active during coffee break');
});

test('axonometric painter depth order places atmosphere and nightstand behind cot without occlusion defects', () => {
 const cotSeed = seedFor(1);
 const state = createState('강서준', cotSeed, {gender: 'male', labMode: 'wet'});
 const scene = roomScene(state, {actual: 'rest', performed: true, outcome: 'completed'}, 0, {idle: false});

 const atmosphereIndex = scene.indexOf('class="rest-scene-atmosphere"');
 const nightstandIndex = scene.indexOf('class="rest-nightstand"');
 const cotIndex = scene.indexOf('class="room-cot"');
 assert.ok(atmosphereIndex > 0, 'atmosphere is in scene');
 assert.ok(nightstandIndex > 0, 'nightstand is in scene');
 assert.ok(cotIndex > 0, 'cot is in scene');
 assert.ok(atmosphereIndex < nightstandIndex, 'atmosphere (floor glow) is painted before nightstand');
 assert.ok(nightstandIndex < cotIndex, 'nightstand (lower u+v) is painted before cot in painter order');
});

test('rest scene rendering preserves game state and supports English localization', () => {
 const cotSeed = seedFor(1);
 const stateKo = createState('윤채원', cotSeed, {gender: 'female', locale: 'ko', labMode: 'wet'});
 const beforeKo = structuredClone(stateKo);
 const sceneKo = roomScene(stateKo, {actual: 'rest', performed: true}, 0);
 assert.deepEqual(stateKo, beforeKo, 'Korean rendering does not alter game state');
 assert.match(sceneKo, /aria-label="머리맡 원목 협탁과 휴게 소품"/);
 assert.match(sceneKo, /aria-label="스트레칭 폼 요가매트와 폼롤러"/);

 const stateEn = createState('Yoon Chaewon', cotSeed, {gender: 'female', locale: 'en', labMode: 'wet'});
 const beforeEn = structuredClone(stateEn);
 const sceneEn = roomScene(stateEn, {actual: 'rest', performed: true}, 0);
 assert.deepEqual(stateEn, beforeEn, 'English rendering does not alter game state');
 assert.match(sceneEn, /aria-label="Bedside nightstand and rest accessories"/);
 assert.match(sceneEn, /aria-label="Stretching foam yoga mat and foam roller"/);
});
