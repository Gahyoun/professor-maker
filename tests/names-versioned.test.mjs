import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_NAMING_VERSION,CURATED_NAME_PROVENANCE,CURATED_KOREAN_NAME_POOLS,KOREAN_NAME_POOLS,generateNameRecord,generateKoreanName,generateStudentName,generateEnglishName} from '../dist/names.js';
import {admissionCandidates,admitCandidate,admissionSeed,admissionCode,parseAdmissionCode,validAdmissionRecord} from '../dist/admission.js';
import {createState,migrateSave,validateSave} from '../dist/engine.js';

test('The expanded cast consists of whole plausible curated names, with honest non-demographic provenance',()=>{
 assert.equal(CURRENT_NAMING_VERSION,2);assert.ok(CURATED_KOREAN_NAME_POOLS.male.length>=80);assert.ok(CURATED_KOREAN_NAME_POOLS.female.length>=80);assert.ok(CURATED_KOREAN_NAME_POOLS.surname.length>=35);
 for(const [kind,pool] of Object.entries(CURATED_KOREAN_NAME_POOLS)){assert.equal(new Set(pool.map(entry=>entry.name)).size,pool.length);for(const entry of pool){assert.match(entry.name,kind==='surname'?/^[가-힣]{1,2}$/:/^[가-힣]{2}$/);assert.ok(entry.weight>0);}}
 assert.match(CURATED_NAME_PROVENANCE.status,/curated.*fictional/i);assert.match(CURATED_NAME_PROVENANCE.sampling,/not measured demographic frequencies/);assert.equal(KOREAN_NAME_POOLS.male.length,10);assert.equal(KOREAN_NAME_POOLS.female.length,10);assert.equal(KOREAN_NAME_POOLS.surname.length,10);
});
test('Version two is deterministic and substantially broader across ordinary seeds',()=>{
 for(const gender of ['male','female']){
  const records=Array.from({length:5000},(_,seed)=>generateNameRecord(seed,gender,2)),old=Array.from({length:5000},(_,seed)=>generateKoreanName(seed,gender,1));
  assert.ok(new Set(records.map(record=>record.name)).size>2500);assert.equal(new Set(records.map(record=>record.givenName)).size,CURATED_KOREAN_NAME_POOLS[gender].length);assert.equal(new Set(records.map(record=>record.surname)).size,CURATED_KOREAN_NAME_POOLS.surname.length);assert.equal(new Set(old).size,100);
  for(const seed of [0,42,1183,0xffffffff])assert.deepEqual(generateNameRecord(seed,gender,2),generateNameRecord(seed,gender,2));
 }
 assert.equal(generateStudentName(42,'male','ko'),generateKoreanName(42,'male',2));assert.equal(generateStudentName(42,'female','en',2),generateEnglishName(42,'female'));
});
test('Legacy names, intake drafts and PM codes retain their original exact identities',()=>{
 const identities=[[0,'male','이성현'],[0,'female','이지혜'],[1,'male','이현우'],[5,'female','장유진'],[42,'male','김승현'],[98,'female','윤은지'],[123456,'female','김은지'],[0xffffffff,'male','김지훈']];
 for(const [seed,gender,name] of identities){assert.equal(generateKoreanName(seed,gender),name);assert.equal(generateKoreanName(seed,gender,1),name);assert.equal(generateStudentName(seed,gender,'ko',1),name);}
 assert.deepEqual(admissionCandidates(123456).map(candidate=>candidate.name),['김지혜','김민지','최지영']);assert.deepEqual(admissionCandidates(123456),admissionCandidates(123456,{namingVersion:1}));
 const code=admissionCode(123456,1);assert.equal(code,'PM-0001E240-2');assert.deepEqual(parseAdmissionCode(code),{intakeSeed:123456,candidateIndex:1});assert.equal(admitCandidate(123456,1).name,'김민지');
 const saved=createState('기존 저장 이름',42),before=structuredClone(saved);assert.ok(validateSave(saved));assert.equal(migrateSave(saved).name,'기존 저장 이름');assert.deepEqual(saved,before);
});
test('New PM2 codes pin cosmetic naming while candidate seeds and all engine traits stay identical',()=>{
 for(const intakeSeed of [0,1183,2087,123456,0xffffffff])for(const index of [0,1,2]){
  const code=admissionCode(intakeSeed,index,2),decoded=parseAdmissionCode(code);assert.deepEqual(decoded,{intakeSeed,candidateIndex:index,namingVersion:2});assert.ok(validAdmissionRecord(decoded));
  const old=admitCandidate(intakeSeed,index,{namingVersion:1}),current=admitCandidate(intakeSeed,index,{namingVersion:2}),baseline=createState('',admissionSeed(intakeSeed,index));
  assert.equal(current.name,admissionCandidates(intakeSeed,{namingVersion:2})[index].name);assert.deepEqual(current.hidden,old.hidden);assert.deepEqual(current.temperament,old.temperament);assert.deepEqual(current.professor,old.professor);assert.deepEqual(current.lab,old.lab);assert.equal(current.seed,baseline.seed);assert.equal(current.gender,old.gender);
  assert.deepEqual(current.admission,decoded);assert.ok(validateSave(current));assert.deepEqual(migrateSave(current).admission,current.admission);assert.deepEqual(admitCandidate(decoded.intakeSeed,decoded.candidateIndex,{namingVersion:decoded.namingVersion}),current);
 }
});
test('Cosmetic duplicate resolution gives each v2 candidate a distinct displayed and admitted name',()=>{
 for(const seed of [1183,2087]){
  const candidates=admissionCandidates(seed,{namingVersion:2}),raw=candidates.map((candidate,index)=>generateStudentName(admissionSeed(seed,index),candidate.gender,'ko',2));assert.ok(new Set(raw).size<3);assert.equal(new Set(candidates.map(candidate=>candidate.name)).size,3);
  assert.deepEqual(candidates,admissionCandidates(seed,{namingVersion:2}));for(const candidate of candidates){const state=admitCandidate(seed,candidate.index,{namingVersion:2});assert.equal(state.name,candidate.name);assert.equal(state.seed,createState('',admissionSeed(seed,candidate.index)).seed);}
 }
});
test('Malformed name versions and share-code versions fail before changing a student',()=>{
 for(const version of [0,4,-1,null,'2',2.5,NaN]){assert.throws(()=>generateStudentName(42,'female','ko',version));assert.throws(()=>admissionCandidates(42,{namingVersion:version}));assert.throws(()=>admissionCode(42,0,version));assert.equal(validAdmissionRecord({intakeSeed:42,candidateIndex:0,namingVersion:version}),false);}
 for(const code of ['PM1-0000002A-1','PM4-0000002A-1','PM2-0000002A-0','PM2-0000002A-4','PM2-0000002A-1 trailing'])assert.equal(parseAdmissionCode(code),null);
 assert.equal(validAdmissionRecord({intakeSeed:42,candidateIndex:0,extra:true}),false);assert.equal(validAdmissionRecord({intakeSeed:42,candidateIndex:0,namingVersion:2,extra:true}),false);
});
