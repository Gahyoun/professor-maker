import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDINGS,getEndingPages,getEndingStory,endingMemoryNotes,endingRelationship,endingLetterInsertions} from '../dist/stories.js';
import {createState} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {ENGLISH_ENDING_FIELDS} from '../dist/ending-context.js';
import {reviewMeta} from '../dist/ending-review.js';

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

test('a distant job-seeking letter requests a meeting before specifying its agenda',()=>{
 const ctx=context(),history=[{kind:'event',id:'doctoral-lead',choice:0,month:85}];
 for(const locale of ['ko','en']){
  const page=getEndingPages('unemployed',locale,'distant','김민지',null,history,ctx).find(page=>page.includes(locale==='ko'?'― 김민지':'— 김민지'));
  const request=page.indexOf(locale==='ko'?'함께 정리해 볼 수 있을까요?':'Could we review');
  const agenda=page.indexOf(locale==='ko'?'면담에서는':'For our meeting,');
  assert.ok(request>=0&&agenda>request,`${locale}: request comes before the practical agenda`);
  assert.ok(page.indexOf(locale==='ko'?'연락 범위도':'contact boundaries')>request,`${locale}: the requested contact boundary follows the invitation`);
  assert.doesNotMatch(page,/회의를 제가 진행하기 시작했을 때부터|Chairing the meetings/,'distant rapport does not inject a warm leadership recollection');
 }
});

test('company reunion tone and displayed title follow rapport without changing the original story',()=>{
 const before=JSON.stringify(ENDINGS.corporate),ctx=context(),titles=[];
 for(const relationship of ['close','reserved','distant']){
  const story=getEndingStory('corporate',{...ctx,relationship});titles.push(story.title.ko);
  const record={ending:'corporate',name:'김민지',month:96,relationship,fieldId:ctx.fieldId,labMode:ctx.labMode,statistics:ctx.statistics};
  assert.equal(reviewMeta(record).title,story.title.ko,'the reader shows the same rapport-specific title as the story API');
  const korean=getEndingPages('corporate','ko',relationship,'김민지',null,[],ctx).join('\n');
  const english=getEndingPages('corporate','en',relationship,'Minji',null,[],ctx).join('\n');
  if(relationship==='close'){
   assert.doesNotMatch(korean,/딱 알맞은 거리/);assert.doesNotMatch(english,/just the right distance/i);
   assert.match(korean,/첫 잔이 비었는데도/,'a close reunion lasts beyond the first coffee');
   assert.match(korean,/가까워/,'the ending recognizes the closer relationship');
  }
  if(relationship==='reserved')assert.match(korean,/커피는 정말로 한 잔뿐이었다/,'the original tentative reunion remains reserved');
  if(relationship!=='distant'){
   assert.match(korean,/메일은 이렇게 이어졌다/,'the resumed mail is visibly separated from the professor’s intervening reflection');
   assert.match(english,/The email continued/i);
  }
  const opening=getEndingPages('corporate','ko',relationship,'김민지',null,[],ctx)[0];
  assert.doesNotMatch(opening,/에서 배운 방법은|분야의 새로운 일정|성능·재현성을 검증하는 기업 연구팀에서/,'the first scene has no appended job-description paragraph');
 }
 assert.equal(new Set(titles).size,3,'each relationship has a corresponding title');
 assert.equal(JSON.stringify(ENDINGS.corporate),before,'metadata variants cannot alter the original text');
});

test('startup variants retain the eight-year opening and a short next-work question',()=>{
 const base=context();
 for(const labMode of ['wet','dry'])for(const relationship of ['close','reserved','distant'])for(const withStatistics of [false,true]){
  const ctx={fieldId:labMode==='wet'?'056':'090',labMode,...(withStatistics?{statistics:base.statistics}:{})};
  const pages=getEndingPages('startup','ko',relationship,'김민지',null,[],ctx);
  assert.ok(pages[0].startsWith('학부연구생과 석박사, 8년이라는 시간이 흘렀다.'),'the tailored introduction retains the common time passage');
  assert.doesNotMatch(pages[0],/분야에서 현장의 요구와 기술의 적용 범위를 살피며 사업 방향/,'no appended industry-summary narration');
  const question=pages.at(-1).match(/“(다음 [^”]*\?)”/)?.[1];
  assert.ok(question&&question.length<=22,'the final question is brief enough to carry the scene');
  if(labMode==='wet')assert.equal(question,'다음 실험은 무엇입니까?');
  else assert.doesNotMatch(question,/실험/,'a dry lab gets a short research question rather than a wet experiment');
 }
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
 assert.match(getEndingPages('institute','en','close','Minji',null,[],context()).join('\n'),/design drawings|structural and environmental analysis/,'the research proposal retains meaningful field work after corporate job-description prose is removed');
});
