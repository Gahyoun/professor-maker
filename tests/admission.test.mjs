import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,validateSave,migrateSave} from '../dist/engine.js';
import {admissionCandidates,admitCandidate,admissionSeed,admissionCode,parseAdmissionCode} from '../dist/admission.js';

test('an interview exposes only incomplete application information, with three stable distinct candidates',()=>{
 const options={fieldId:'050',labMode:'dry'},a=admissionCandidates(123456,options);
 assert.equal(a.length,3);assert.equal(new Set(a.map(c=>admissionSeed(123456,c.index))).size,3);
 assert.deepEqual(a,admissionCandidates(123456,options));
 for(const c of a){assert.deepEqual(Object.keys(c).sort(),['gender','gpa','impression','index','interest','name']);assert.ok(c.gpa>=2.6&&c.gpa<=4.45);assert.match(c.interest,/물리학/);}
 assert.notDeepEqual(a,admissionCandidates(123457,options));
});
test('selecting and sharing a candidate reproduces original engine traits without improving or rerolling them',()=>{
 for(const index of [0,1,2]){
  const code=admissionCode(0xffffffff,index),record=parseAdmissionCode(code),options={fieldId:'056',labMode:'wet',difficulty:'beginner'};
  assert.deepEqual(record,{intakeSeed:0xffffffff,candidateIndex:index});
  const a=admitCandidate(record.intakeSeed,record.candidateIndex,options),baseline=createState('',admissionSeed(0xffffffff,index),options);
  assert.deepEqual(a.hidden,baseline.hidden);assert.deepEqual(a.temperament,baseline.temperament);assert.equal(a.seed,baseline.seed);
  assert.equal(a.name,admissionCandidates(0xffffffff,options)[index].name);assert.ok(validateSave(a));
  assert.deepEqual(migrateSave(a).admission,a.admission);assert.deepEqual(admitCandidate(record.intakeSeed,record.candidateIndex,options),a);
 }
});
test('interview codes validate inputs before use and field changes never consume candidate RNG',()=>{
 for(const value of ['', 'PM-123-1','PM-FFFFFFFF-0','PM-FFFFFFFF-4','PM-FFFFFFFF-1 trailing'])assert.equal(parseAdmissionCode(value),null);
 for(const [seed,index] of [[-1,0],[NaN,0],[0,3],[0,-1],[0,1.5]])assert.throws(()=>admissionSeed(seed,index));
 const dry=admitCandidate(98,1,{fieldId:'048',labMode:'dry'}),wet=admitCandidate(98,1,{fieldId:'056',labMode:'wet'});
 assert.deepEqual(dry.hidden,wet.hidden);assert.equal(dry.seed,wet.seed);
});
test('saved interview metadata rejects malformed seeds and indexes while legacy runs remain valid',()=>{
 const legacy=createState('기존 학생',6);assert.equal(legacy.admission,undefined);assert.ok(validateSave(legacy));assert.ok(migrateSave(legacy));
 const admitted=admitCandidate(0xffffffff,2),before=structuredClone(admitted);assert.ok(validateSave(admitted));assert.deepEqual(migrateSave(admitted).admission,admitted.admission);assert.deepEqual(admitted,before);
 for(const admission of [null,[],{}, {intakeSeed:-1,candidateIndex:0},{intakeSeed:0x100000000,candidateIndex:0},{intakeSeed:'1',candidateIndex:0},{intakeSeed:1.5,candidateIndex:0},{intakeSeed:1,candidateIndex:3},{intakeSeed:1,candidateIndex:-1},{intakeSeed:1,candidateIndex:1.5},{intakeSeed:1,candidateIndex:'1'},{intakeSeed:1,candidateIndex:0,unexpected:true}]){
  const bad={...admitted,admission};assert.equal(validateSave(bad),false,JSON.stringify(admission));assert.equal(migrateSave(bad),null);
 }
});
