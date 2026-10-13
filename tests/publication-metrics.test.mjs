import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,validateSave} from '../dist/engine.js';
import {getJournal,journalMetricRecord,journalDescription} from '../dist/venues.js';

test('fictional IF variation is bounded and reproducible without advancing RNG or mutating a save',()=>{
  const state=createState('김하늘',123,{fieldId:'049'}),before=structuredClone(state),values=new Set();
  for(let project=1;project<=25;project++)for(const month of [1,13,25]){
    const record=journalMetricRecord(state,'standard',project,month),base=getJournal('standard','049').impactFactor;
    assert.deepEqual(record,journalMetricRecord(state,'standard',project,month));
    assert.ok(record.impactFactor>=base*.86-.05&&record.impactFactor<=base*1.14+.05);
    assert.equal(record.impactFactor*10,Math.round(record.impactFactor*10));values.add(record.impactFactor);
  }
  assert.ok(values.size>=4);assert.deepEqual(state,before);
  const alternate=createState('김하늘',456,{fieldId:'049'});
  assert.notDeepEqual(Array.from({length:5},(_,i)=>journalMetricRecord(state,'standard',i+1,13)),Array.from({length:5},(_,i)=>journalMetricRecord(alternate,'standard',i+1,13)));
});
test('submission freezes IF across a new year, review, reload and changed RNG seed',()=>{
  const state=createState('김하늘',123,{fieldId:'049'}),metric=journalMetricRecord(state,'standard',1,12);
  state.month=12;state.project.phase=5;state.project.submitted=true;state.project.submittedAt=12;
  state.history=[{month:12,kind:'submission',projectId:1,...metric}];
  for(const month of [13,20,96]){state.month=month;state.seed=month*901;assert.equal(journalMetricRecord(state).impactFactor,metric.impactFactor);assert.ok(journalDescription('standard','049',state).includes(`가상 IF ${metric.impactFactor}`));}
  assert.equal(journalMetricRecord(structuredClone(state)).impactFactor,metric.impactFactor);
});
test('old stored IF is preserved, including a paper metric when an older submission omitted it',()=>{
  const state=createState('김하늘',123,{fieldId:'049'});
  state.history=[{month:10,kind:'submission',projectId:1,journal:'standard'},
    {month:13,kind:'paper',projectId:1,journal:'standard',impactFactor:2.8}];
  assert.equal(journalMetricRecord(state,'standard',1,50).impactFactor,2.8);
  state.history[0].impactFactor=2.8;assert.equal(journalMetricRecord(state,'standard',1,50).impactFactor,2.8);
  state.history=[{month:10,kind:'submission',projectId:1,journal:'standard'}];
  assert.equal(journalMetricRecord(state,'standard',1,50).impactFactor,getJournal('standard','049').impactFactor);
});
test('KCI does not acquire a fictional IF through variation or malformed old data',()=>{
  const state=createState('김하늘',123,{fieldId:'072'});state.history=[{month:10,kind:'paper',projectId:1,journal:'kci',impactFactor:2.8}];
  assert.equal(journalMetricRecord(state,'kci',1,12).impactFactor,null);
  assert.ok(!journalDescription('kci','072',state).includes('IF'));
});
test('year-boundary UI preview matches the actual next-month submission and remains frozen in review',()=>{
  const state=createState('김하늘',6,{fieldId:'049'});state.month=12;state.project.phase=5;
  assert.ok(validateSave(state));const expected=journalMetricRecord(state,'standard',1,13).impactFactor;
  assert.ok(journalDescription('standard','049',state).includes(`가상 IF ${expected}`));
  const next=simulateMonth(state,['rest','rest','rest','rest']),submission=next.history.find(entry=>entry.kind==='submission');
  assert.equal(submission.month,13);assert.equal(submission.impactFactor,expected);assert.ok(validateSave(next));
  next.pending=null;next.pendingQueue=[];next.month=14;
  assert.equal(journalMetricRecord(next).impactFactor,expected);
});
