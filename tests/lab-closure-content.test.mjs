import test from 'node:test';
import assert from 'node:assert/strict';
import {getEndingPages} from '../dist/stories.js';
import {closureSummary,validLabClosure} from '../dist/lab-risk.js';
import {migrateLetterGallery} from '../dist/letter-archive.js';
import {reviewPages,reviewMeta} from '../dist/ending-review.js';
const closure={reason:'funding',keys:[],streak:3,month:7,recovery:'funding'};
test('funding closure stories explain the actual resource failure and retain the handover without degree-failure claims',()=>{
 assert.ok(validLabClosure(closure,7));
 for(const locale of ['ko','en'])for(const relationship of ['close','reserved','distant'])for(const labMode of ['dry','wet']){
  const pages=getEndingPages('gameover',locale,relationship,'김민지','lab_closure',[],{fieldId:'050',labMode,labClosure:closure}),text=pages.join('\n');
  assert.equal(pages.length,3);assert.ok(text.includes('김민지'));assert.doesNotMatch(text,/\{name\}|인계 기록에는/);
  assert.match(text,locale==='ko'?/연구비를 확보하지 못해/:/funds for student support/);
  assert.doesNotMatch(text,locale==='ko'?/학위요건을.*못|자격시험.*불합격|교수 업무 불균형/:/failed the qualifying|faculty workload imbalance/);
  if(labMode==='dry')assert.doesNotMatch(text,/실험|시료|배양/);
 }
});
test('a collected funding closure keeps its cause and authored pages through archive migration and the review reader',()=>{
 const record={id:'test-funding-closure',ending:'gameover',endingReason:'lab_closure',labClosure:closure,month:7,name:'김민지',date:'2026-10-11',fieldId:'050',labMode:'wet',relationship:'distant',memories:[]};
 const migrated=migrateLetterGallery([record]).gallery[0];assert.deepEqual(migrated.labClosure,closure);assert.deepEqual(migrated.passageIds,[]);
 assert.match(closureSummary(migrated),/필수 연구비 부족.*3개월/);assert.match(reviewMeta(migrated).career,/필수 연구비 부족.*3개월/);assert.match(reviewPages(migrated).join('\n'),/연구비를 확보하지 못해/);
 const faculty={...migrated,labClosure:{reason:'faculty',keys:['admin'],streak:3,month:7,recovery:'allocate'}};
 assert.match(closureSummary(faculty),/학교행정.*3개월/);assert.doesNotMatch(reviewPages(faculty).join('\n'),/연구비를 확보하지 못해/);
});

test('older ending calls without a context still render faculty closure and academic endings',()=>{
 for(const reason of [null,'graduation_requirements','time_limit','qual_failure']){const pages=getEndingPages('gameover','ko','reserved','김민지',reason);assert.ok(pages.length>0);assert.ok(pages.every(text=>typeof text==='string'));}
});

test('academic and earlier gameover records always have a readable cause without inventing a resource streak',()=>{
 for(const reason of ['graduation_requirements','time_limit','qual_failure']){const text=closureSummary({endingReason:reason});assert.ok(text.length>0);assert.doesNotMatch(text,/3개월|연구비 고갈/);}
 assert.match(closureSummary({endingReason:null}),/이전|기록/);assert.doesNotMatch(closureSummary({endingReason:null}),/3개월/);
});
test('borrowing closure keeps ongoing work distinct from suspended operations',()=>{
 const cause={...closure,mode:'borrowing'};assert.ok(validLabClosure(cause,7));
 for(const locale of ['ko','en']){
  const pages=getEndingPages('gameover',locale,'reserved','김민지','lab_closure',[],{fieldId:'050',labMode:'dry',labClosure:cause});
  assert.match(pages.join('\n'),locale==='ko'?/급여와 연구는 이어 갔다/:/kept stipends and research going/);
  assert.doesNotMatch(pages.join('\n'),/운영 보류가 세 달째|Operations were suspended for a third month/);
 }
 assert.match(closureSummary({labClosure:cause}),/학과 차입 3개월 연속/);
});
