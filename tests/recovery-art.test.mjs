import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {recoveryArt,recoveryDestination,recoveryVariant} from '../dist/recovery-art.js';
import {roomScene} from '../dist/lab-scene.js';

test('recovery scenery is repeatable and leaves the save and game RNG untouched',()=>{
 const s=createState('최민지',37,{gender:'female',labMode:'dry'}),before=JSON.stringify(s);
 for(const destination of ['mountain','sea','city','bed']){
  const result={actual:destination==='bed'?'rest':'travel',destination,performed:true};
  assert.equal(recoveryDestination(s,result,2),destination);
  assert.equal(recoveryArt(s,result,2),recoveryArt(s,result,2));
  assert.match(roomScene(s,result,2),new RegExp(`data-destination="${destination}"`));
 }
 assert.equal(JSON.stringify(s),before);
});
test('original seed, month and week provide four destinations and three scenery palettes',()=>{
 const places=new Set(),palettes=new Set();
 for(let seed=1;seed<=30;seed++){
  const s=createState('',seed);s.creationSeed=seed;
  for(let week=0;week<5;week++){places.add(recoveryDestination(s,{},week));palettes.add(recoveryVariant(s,week));}
 }
 assert.deepEqual([...places].sort(),['bed','city','mountain','sea']);
 assert.deepEqual([...palettes].sort(),[0,1,2]);
 const s=createState('',8);s.creationSeed=8;const first=recoveryArt(s,{},2);s.seed=9123;
 assert.equal(recoveryArt(s,{},2),first);
});
test('invalid destinations fall back to trusted scenery without injecting markup',()=>{
 const s=createState('',6),malicious='<script>alert(1)</script>';
 const art=recoveryArt(s,{destination:malicious},0);
 assert.ok(!art.includes('<script')&&!art.includes('undefined')&&!art.includes('NaN'));
 assert.equal(recoveryDestination(s,{destination:malicious},0),recoveryDestination(s,{},0));
});
