import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrateSave,validateSave} from '../dist/engine.js';

test('legacy scheduled events with tightened conditions are retired without discarding a valid run',()=>{
 for(const [id,month] of [['teaching',10],['grading',10],['reviewer-two',40],['sabbatical-contact',60]]){
  const s=createState('김민지',6,{gender:'female'});s.started=true;s.month=month;s.route=month>=24?'integrated':null;
  s.pending={kind:'event',id};s.pendingQueue=[{kind:'conversation-topic'}];
  const original=structuredClone(s),n=migrateSave(s);
  assert.ok(n&&validateSave(n),id);
  assert.deepEqual(s,original);
  assert.deepEqual(n.hidden,s.hidden);assert.equal(n.seed,s.seed);assert.equal(n.month,s.month);
  assert.equal(n.pending.kind,'conversation-topic');
  assert.equal(n.history.at(-1).kind,'event-migration');assert.equal(n.history.at(-1).id,id);
 }
 const s=createState('김민지',6);s.month=24;s.route='masters';s.pending={kind:'event',id:'teaching'};
 assert.equal(migrateSave(s).pending.id,'teaching','an eligible event remains pending');
 s.lab.funds=-1;assert.equal(migrateSave(s),null,'migration does not accept an otherwise malformed save');
});
