import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {renderPortrait,studentAppearance} from '../dist/appearance.js';
import {roomScene} from '../dist/lab-scene.js';
import {roomDecorations} from '../dist/mini-room.js';
import {weeklyScene} from '../dist/weekly-scene.js';

const teaching={assigned:'teach',proposed:'teach',actual:'teach',performed:true,outcome:'completed',progress:0};
const graduate=(seed=3,labMode='dry')=>{
 const state=createState('김민지',seed,{gender:'female',labMode});
 state.month=26;state.route='integrated';return state;
};

test('a completed TA week explains the lesson at the board instead of holding a floating book',()=>{
 const state=graduate(),html=weeklyScene(state,teaching,0);
 assert.match(html,/data-pose="lecturing"/);
 assert.match(html,/pose-lecturing[^>]+data-floor="24,3"/);
 assert.match(html,/class="ta-lecture-arm"/);
 assert.match(html,/class="ta-pointer"/);
 assert.match(html,/class="ta-board-annotation"/);
 assert.match(html,/ta-board-stroke/);
 assert.doesNotMatch(html,/mini-activity-prop/);
 assert.match(html,/칠판|판서/);
});

test('the TA scene keeps all four board variants and casual clothes in a dry lab',()=>{
 const variants=new Map();
 for(let seed=1;seed<=100&&variants.size<4;seed++){
  const state=graduate(seed),kind=roomDecorations(state).boardType;
  variants.set(kind,roomScene(state,teaching,0));
 }
 assert.equal(variants.size,4);
 for(const [kind,html] of variants){
  assert.match(html,new RegExp(`data-board="${kind}"`));
  assert.match(html,new RegExp(`data-board-kind="${kind}"`));
  assert.match(html,/data-pose="lecturing" data-outfit="[1-5]"/);
 }
});

test('a missed TA week, an idle view, and training do not imply a lesson took place',()=>{
 const state=graduate();
 for(const html of [
  roomScene(state,{...teaching,performed:false,outcome:'not_completed'},0),
  roomScene(state,{...teaching,performed:undefined},0),
  roomScene(state,teaching,0,{idle:true}),
  roomScene(state,{...teaching,actual:'training',performed:false,outcome:'training'},0),
  roomScene(state,{...teaching,outcome:'training'},0),
  roomScene(state,{...teaching,actual:'unfinished',performed:false,outcome:'not_completed'},0),
 ]){
  assert.doesNotMatch(html,/data-pose="lecturing"|ta-lecture-arm|ta-pointer|ta-board-annotation/);
 }
});

test('an assigned TA week that became rest displays what the student actually did',()=>{
 const html=weeklyScene(graduate(),{...teaching,actual:'rest',performed:false,deviation:'rest-needed'},0);
 assert.doesNotMatch(html,/data-pose="lecturing"|ta-board-annotation/);
 assert.match(html,/합의한 일정: 수업보조 · TA → 실제: 휴식/);
});

test('lecturing preserves cosmetic identity and renders without altering state or RNG',()=>{
 const state=graduate(),snapshot=structuredClone(state),first=roomScene(state,teaching,2);
 assert.equal(first,roomScene(state,teaching,2));
 assert.deepEqual(state,snapshot);
 const appearance=studentAppearance(state.creationSeed,state.gender),before=structuredClone(appearance);
 const portrait=renderPortrait(appearance,'학생','focused','lecturing');
 assert.deepEqual(appearance,before);
 assert.match(portrait,/data-pose="lecturing"/);
 assert.match(portrait,/앞머리/);
});

test('board teaching does not replace seated coursework or wet-lab tool handling',()=>{
 const dry=graduate(),wet=graduate(3,'wet');
 for(const actual of ['study','coursework','analysis','language']){
  const html=roomScene(dry,{actual,performed:true},0);
  assert.match(html,/data-pose="seated"/);
  assert.doesNotMatch(html,/ta-board-annotation/);
 }
 const experiment=roomScene(wet,{actual:'experiment',performed:true},0);
 assert.match(experiment,/data-pose="experiment" data-outfit="0"/);
 assert.doesNotMatch(experiment,/ta-board-annotation/);
 assert.match(roomScene(wet,teaching,0),/data-pose="lecturing"/);
});
