import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene,supplyLevel} from '../dist/lab-scene.js';
import {createCVLabScene,validateCVLabScene} from '../dist/cv-lab-scene.js';
import {DISCIPLINES} from '../dist/disciplines.js';

test('achievement art reflects existing awards and papers without inventing milestones',()=>{
 for(const labMode of ['dry','wet']){
  const s=createState('정다은',2026,{fieldId:'050',labMode});
  let scene=roomScene(s);
  assert.doesNotMatch(scene,/award-certificate|crystal-plaque|championship-trophy/);
  assert.match(scene,/class="desk-thesis-binder"/);
  assert.match(scene,/class="lab-founding-plaque"/);
  for(const awards of [1,2,3,4,8]){
   s.career.awards=awards; const before=structuredClone(s);
   scene=roomScene(s);
   assert.equal((scene.match(/class="award-certificate"/g)||[]).length,Math.min(awards,4));
   assert.match(scene,/data-monument="crystal-trophy"/);
   assert.equal(scene.includes('championship-trophy'),awards>=2);
   const corners=[...scene.matchAll(/<path d="([^"]+)" fill="#fff0a6"/g)];
   assert.equal(corners.length,Math.min(awards,4));
   for(const [,d]of corners)assert.equal((d.match(/M/g)||[]).length,4,'four corner brackets share one compact path');
   assert.deepEqual(s,before);
  }
  s.career.awards=0;s.career.papers=1;
  assert.match(roomScene(s),/class="trophy-plaque championship-trophy"/);
 }
});

test('library and plush art retain the current plant collection and material scarcity',()=>{
 for(const labMode of ['dry','wet']){
  const s=createState('연구원',9999,{labMode});
  for(const tier of ['theses','textbooks','journals'])assert.match(roomScene(s),new RegExp(`data-shelf-tier="${tier}"`));
  const scene=roomScene(s);
  for(const toy of ['mochi-cat','baby-bear','pink-bunny','mint-frog','yellow-chick'])assert.match(scene,new RegExp(`class="plushie-${toy}"`));
  assert.match(scene,/class="window-plant-shelf"/);
  assert.match(scene,/class="room-plant"/);
  if(labMode==='wet'){
   s.lab.funds=200;s.lab.budget.environment=4;s.lab.equipment=60;
   const rich=roomScene(s,{actual:'experiment',performed:true});
   s.lab.funds=10;s.lab.budget.environment=0;
   const sparse=roomScene(s,{actual:'experiment',performed:true});
   assert.match(rich,/data-supply="rich"/);assert.match(sparse,/data-supply="sparse"/);
   assert.ok(sparse.length<rich.length);
  }
 }
});

test('all disciplines render new decorations without changing their scientific kit or game state',()=>{
 for(const field of DISCIPLINES){
  const s=createState('',42,{fieldId:field.id,labMode:field.labMode??'dry'});
  s.career.awards=2;
  const before=structuredClone(s),scene=roomScene(s);
  assert.match(scene,/data-field-kit=/);
  assert.doesNotMatch(scene,/NaN|undefined|Infinity/);
  assert.deepEqual(s,before);
 }
});

test('free time uses the existing desk occlusion and render-only lighting',()=>{
 for(const labMode of ['dry','wet']){
  const s=createState('',1234,{labMode}),before=structuredClone(s);
  const scene=roomScene(s,{actual:'free',performed:true,outcome:'completed'});
  assert.match(scene,/class="mini-student pose-seated[^"]* action-free"/);
  assert.match(scene,/data-facing="monitor"/);
  assert.match(scene,/data-layer-order="chair-rear student chair-front desk-front"/);
  assert.match(scene,/class="free-desk-lamp-light"/);
  assert.match(scene,/class="idea-sketchbook"/);
  assert.match(scene,/data-motion="free-thought"/);
  assert.doesNotMatch(roomScene(s,{actual:'free',performed:false}),/free-desk-lamp-light|data-motion="free-thought"/);
  assert.deepEqual(s,before);
 }
});

test('decorated mature labs retain strict CV limits with rich supplies and variable furniture',()=>{
 let max=0;
 for(const gender of ['female','male'])for(const seed of [16,5,42,7919])for(const locale of ['ko','en'])for(const labMode of ['wet','dry'])for(const awards of [0,1,2,4]){
  const state=createState('김하늘',seed,{gender,locale,professorProfile:{gender:'female',age:38,fieldId:'058',labMode,institution:'national'}});
  state.month=96;state.route='integrated';state.ending='institute';state.career.awards=awards;state.career.papers=2;state.career.completedProjects=2;
  state.lab.funds=200;state.lab.equipment=60;state.lab.budget.environment=3;
  assert.equal(supplyLevel(state),'rich');
  const before=structuredClone(state),scene=createCVLabScene(state);
  assert.ok(validateCVLabScene(scene,96),`${seed}/${locale}/${labMode}/awards=${awards}`);
  const svg=decodeURIComponent(scene.image.slice('data:image/svg+xml,'.length));
  max=Math.max(max,svg.length);assert.ok(svg.length<60000);
  assert.deepEqual(state,before);
 }
 assert.ok(max<60000,`largest decorated lab ${max}`);
});
