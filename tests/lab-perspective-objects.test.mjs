import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState} from '../dist/engine.js';
import {roomScene} from '../dist/lab-scene.js';
import {labSeason} from '../dist/lab-season.js';
import {monitorGeometry,ROOM_ANCHORS,cotGeometry,sofaGeometry} from '../dist/mini-room.js';

test('rich seasonal scenery preserves the displayed academic month and intrinsic clipped window',()=>{
 for(const locale of ['ko','en'])for(const month of [0,3,6,9,95,96]){
  const s=createState('',2026,{locale});s.month=month;
  const before=structuredClone(s),scene=roomScene(s,{actual:'idle'},0,{idle:true});
  const season=labSeason(s,{idle:true});
  assert.match(scene,new RegExp(`class="window-scenery window-season-${season}"`));
  assert.match(scene,/class="seasonal-window"[^>]+transform="matrix\(-1 .5 0 1 /);
  assert.match(scene,/<svg width="88.2" height="40" viewBox="0 0 88.2 40" overflow="hidden"/);
  for(const layer of ['far-background','midground','foreground'])assert.match(scene,new RegExp(`data-layer="${layer}"`));
  assert.match(scene,/data-midground="clock-tower"/);
  assert.match(scene,/data-midground="research-building"/);
  const effect={spring:'cherry-petals',summer:'cumulus-clouds',autumn:'autumn-leaves',winter:'pixel-snow'}[season];
  assert.match(scene,new RegExp(`data-effect="${effect}"`));
  assert.doesNotMatch(scene,/<clipPath|url\(/);
  assert.deepEqual(s,before);
 }
 const s=createState('',1);s.month=3;
 assert.match(roomScene(s,{actual:'study',performed:true}),/window-season-spring/,'completed June views belong to May');
 assert.match(roomScene(s,{actual:'idle'},0,{idle:true}),/window-season-summer/);
});

test('real lab objects supplement the current benches, desk and rest geometry',()=>{
 for(const labMode of ['dry','wet']){
  const s=createState('',7919,{fieldId:'050',labMode});
  const scene=roomScene(s,{actual:'analysis',performed:true});
  for(const object of ['capsule-coffee-machine','lab-snack-box','lab-cable-organizer','lab-bag-hanger','lab-wastebasket','board-chalk-tray','wall-calendar','wall-postits'])assert.ok(scene.includes(`class="${object}"`),object);
  assert.match(scene,labMode==='dry'?/data-equipment="server-rack"/:/data-equipment="flask-drying-rack"/);
  assert.match(scene,/data-display-aspect="16:9"/);
  assert.match(scene,/data-layer-order="chair-rear student chair-front desk-front"/);
  const display=monitorGeometry(14.2,18.3,26).display;
  assert.equal(display.width/display.height,16/9);
  const cot=cotGeometry(...ROOM_ANCHORS.cot),sofa=sofaGeometry(...ROOM_ANCHORS.sofa);
  assert.deepEqual([cot.width,cot.depth],[7,3]);assert.deepEqual([sofa.width,sofa.depth],[7,3]);
 }
 const css=readFileSync(new URL('../dist/activity-motion.css',import.meta.url),'utf8');
 assert.match(css,/@keyframes server-led-blink/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)[^]*\.server-led-indicator polygon\{opacity:1!important\}/);
});

test('new North American artwork labels contain no untranslated Korean',()=>{
 for(const labMode of ['dry','wet'])for(const month of [0,3,6,9]){
  const s=createState('',7919,{locale:'en',fieldId:'050',labMode});s.month=month;s.career.awards=4;
  const scene=roomScene(s,{actual:'free',performed:true},0,{idle:false});
  const labels=[...scene.matchAll(/aria-label="([^"]*)"/g)].map(m=>m[1]);
  for(const label of labels)assert.doesNotMatch(label,/[가-힣]/,label);
 }
});
