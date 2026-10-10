import test from 'node:test';
import assert from 'node:assert/strict';
import {getEndingPages,endingMemoryNotes,endingRelationship,endingLetterInsertions} from '../dist/stories.js';
import {createState} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {ENGLISH_ENDING_FIELDS} from '../dist/ending-context.js';

const context=()=>{const s=createState('김민지',7,{fieldId:'072',labMode:'dry'});s.ending='unemployed';return {fieldId:'072',labMode:'dry',statistics:endingStatistics(s)};};

test('alternate recommendation scenes preserve each career sequence and the selected relationship',()=>{
 const ctx={...context(),recommendation:'alternate'};
 const corporate=getEndingPages('corporate','ko','distant','김민지',null,[],ctx);
 assert.equal(corporate.length,7);
 assert.match(corporate[0],/추천서/);
 assert.match(corporate.at(-1),/더 긴 대화를 약속하지는 않았다/);
 assert.equal(corporate.filter(p=>p.includes('3년 뒤 학회')).length,1);
 assert.doesNotMatch(corporate.join('\n'),/커피는 정말로 한 잔뿐/);
 const startup=getEndingPages('startup','ko','distant','김지훈',null,[],ctx);
 assert.match(startup[0],/추천서/);
 assert.match(startup[1],/독립적으로 회사를 시작/);
 assert.match(startup[2],/처음 계획한 제품은/);
 assert.doesNotMatch(startup.join('\n'),/김지훈는|김지훈가/);
});

test('distant letters omit automated memories and keep contact boundaries in the authored story',()=>{
 const history=['funding-cut','equipment','counsel-coursework'].map((id,i)=>({kind:'event',id,choice:2,month:i+1}));
 assert.deepEqual(endingMemoryNotes(history,'distant'),[]);
 const deferred=endingMemoryNotes(history,'reserved').join('\n');assert.match(deferred,/검토하기로 했던 약속/);assert.doesNotMatch(deferred,/검토를 마쳤|확인했던 방법을/,'a promised follow-up cannot become completed work');
 const ctx=context();ctx.statistics.student.autonomy=20;
 assert.deepEqual(endingLetterInsertions('unemployed','distant',history,ctx),[]);
 const unemployed=getEndingPages('unemployed','ko','distant','김민지',null,history,ctx).join('\n');
 assert.doesNotMatch(unemployed,/인계 기록에는|검토하기로 했던 약속을 기억합니다|지금은 필요한 기록을 중심으로/);
 assert.match(unemployed,/연락|서류|면담/,'the fixed story can still arrange necessary support');
 assert.equal(endingRelationship(-25,'corporate'),'distant');
 assert.equal(endingRelationship(-20,'corporate'),'reserved');
});

test('English field descriptions cover all majors and dry epilogues do not inherit wet storage or paper-letter props',()=>{
 assert.deepEqual(Object.keys(ENGLISH_ENDING_FIELDS).sort(),DISCIPLINES.map(d=>d.id).sort());
 for(const d of DISCIPLINES.filter(d=>d.labModes.includes('dry'))){
  const ctx={...context(),fieldId:d.id};
  for(const distance of ['close','reserved','distant'])for(const ending of ['corporate','institute','unrelated','startup']){
   const text=getEndingPages(ending,'en',distance,'Minji',null,[],ctx).join('\n');
   assert.doesNotMatch(text,/freezer|tubes|lab coat|cultivation/i,`${d.label}/${ending}/${distance}`);
   assert.doesNotMatch(text,/\{name\}/);
   if(ending==='corporate')assert.doesNotMatch(text,/handwriting|envelope|put it in the drawer/i);
  }
 }
 assert.match(getEndingPages('corporate','en','close','Minji',null,[],context()).join('\n'),/architecture|design drawings/);
});
