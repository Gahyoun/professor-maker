import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {roomScene} from '../dist/lab-scene.js';

test('executed activities use distinct props while failed tasks do not imply work happened',()=>{
 const dry=createState('민지',12,{labMode:'dry'}),wet=createState('민지',12,{labMode:'wet',fieldId:'056'});
 const render=(state,actual,performed=true)=>roomScene(state,{actual,performed,outcome:performed?'completed':'not_completed'},1);
 assert.match(render(dry,'study'),/data-motion="reading"/);
 assert.match(render(dry,'analysis'),/data-motion="analysis"/);
 assert.match(render(wet,'experiment'),/data-motion="pipetting"/);
 assert.match(render(dry,'presentation'),/data-motion="rehearsing"/);
 assert.match(render(dry,'rest'),/data-motion="resting"/);
 for(const [state,actual] of [[dry,'study'],[dry,'analysis'],[wet,'experiment']]){
  assert.doesNotMatch(render(state,actual,false),/data-motion=/);
 }
 assert.doesNotMatch(render(dry,'experiment'),/pipetting/);
 assert.match(render(dry,'rest'),/data-pose="seated"/);
});

test('activity artwork remains deterministic and does not mutate the simulation',()=>{
 const state=createState('민지',33,{labMode:'wet',fieldId:'056'}),before=structuredClone(state);
 const result={actual:'experiment',performed:true,outcome:'completed'};
 assert.equal(roomScene(state,result,2),roomScene(state,result,2));
 assert.deepEqual(state,before);
});
