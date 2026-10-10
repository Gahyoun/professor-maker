import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDINGS,getEndingPages,endingLetterInsertions} from '../dist/stories.js';
import {MAIN_ENDINGS,endingCollection,retirementScenes} from '../dist/ending-collection.js';
import {endingEvidence} from '../dist/ending-evidence.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {createState,HIDDEN_RANGES} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {adaptResearchText} from '../dist/ending-context.js';
import {studentLetterBodies,studentLetterProseIssues} from '../scripts/letter-prose-checks.mjs';

// Synthetic contexts exercise prose branches; they are not simulation results.
function context(ending='startup',fieldId='090',labMode='dry'){
 const state=createState('김민지',17,{fieldId,labMode});
 state.ending=ending;state.month=96;
 for(const[key,[lo,hi]]of Object.entries(HIDDEN_RANGES))state.hidden[key]=lo+.9*(hi-lo);
 return {statistics:endingStatistics(state),fieldId,labMode};
}

test('founder rapport changes the contact style without granting a better business outcome',()=>{
 for(const locale of ['ko','en']){
  const versions=['close','reserved','distant'].map(relationship=>getEndingPages('startup',locale,relationship,'김민지',null,[],context()));
  assert.equal(new Set(versions.map(pages=>pages[0])).size,1,'the company origin is independent of rapport');
  const news=versions.map(pages=>pages[1].split('\n\n')[1]);
  assert.equal(new Set(news).size,1,'product revision and customer review are the same objective events');
  assert.equal(new Set(versions.map(pages=>pages[1])).size,3,'the permitted contact style still varies');
  for(const pages of versions){
   const body=pages.join('\n');
   assert.doesNotMatch(body,/첫 고객과의 계약을 마쳤|completed.*first.*contract/i,'close rapport cannot supply an unearned contract');
   assert.match(body,locale==='ko'?/계약 범위와 비용/:/agreement on scope and cost/,'IP and equipment use require their own agreement');
   assert.match(body,locale==='ko'?/처음 계획한 제품은 고객의 문제와 달랐/:/product we first planned did not fit/);
   assert.doesNotMatch(body,/Please keep the questions reasonably easy/,'both languages request useful feedback');
  }
 }
});

test('an alternate recommendation has the same required-document account in both languages and cannot precede an appointment',()=>{
 for(const ending of ['corporate','startup','institute','unemployed','youtuber'])for(const relationship of ['close','reserved','distant'])for(const locale of ['ko','en']){
  const ctx=context(ending),normal=getEndingPages(ending,locale,relationship,'김민지',null,[],ctx);
  const alternate=getEndingPages(ending,locale,relationship,'김민지',null,[],{...ctx,recommendation:'alternate'});
  assert.equal(alternate.length,normal.length+1,`${ending}/${relationship}/${locale}: a prologue is present`);
  assert.match(alternate[0],locale==='ko'?/공고에서 요구한 지도교수 추천서/:/opening.*required.*adviser’s letter/,'this is one opening’s documentation requirement, not a rule for all hiring');
  assert.doesNotMatch(alternate.join('\n'),/이 이야기의|this story’s/i);
 }
 for(const locale of ['ko','en']){
  const ctx={...context('unrelated'),recommendation:'alternate'};
  const distant=getEndingPages('unrelated',locale,'distant','김민지',null,[],ctx);
  assert.equal(distant.length,9,'the outside-career sequence keeps its authored scenes');
  assert.match(distant[3],locale==='ko'?/공고에서 요구한 지도교수 추천서/:/opening.*required.*adviser’s letter/);
  for(const ending of ['true','postdoc','bachelor','masters','external_masters','external_phd','leave','dropout','gameover','unfinished']){
   const base={...context(ending)};
   assert.deepEqual(getEndingPages(ending,locale,'close','김민지',null,[],{...base,recommendation:'alternate'}),getEndingPages(ending,locale,'close','김민지',null,[],base),`${ending}: contradictory legacy evidence cannot invent a rejected faculty application`);
  }
 }
});

test('doctoral-study letters make one next-conference promise before the closing in either language',()=>{
 for(const locale of ['ko','en'])for(const relationship of ['close','reserved','distant']){
  const page=getEndingPages('external_phd',locale,relationship,'김민지',null,[],context('external_phd')).find(text=>text.includes(locale==='ko'?'― 김민지':'— 김민지'));
  const count=(page.match(locale==='ko'?/다음 학회(?:에서|에서는)/g:/At the next conference/g)||[]).length;
  assert.equal(count,1,`${locale}/${relationship}: an existing promise needs no second copy`);
 }
});

test('promise and closing checks stop at a student signature across page breaks',()=>{
 const letter=['교수님께.\n\n소식을 전합니다.','다음에 뵐 때 들려드릴게요.\n\n― 민지 올림','교수는 답장했다. “다음에 만나면 회사 밖의 이야기도 들려주세요.”'];
 assert.equal(studentLetterBodies(letter).length,1);
 assert.deepEqual(studentLetterProseIssues(letter),{incompleteClosings:0,nextPromises:1},'a professor reply is not a second student promise');
 assert.equal(studentLetterProseIssues(['교수님께.\n\n다음에 뵐 때 들려드릴게요.\n\n다음 학회에서는 이야기하겠습니다.\n― 민지 올림']).nextPromises,2,'two promises inside one student letter still fail');
 assert.equal(studentLetterProseIssues(['교수님께.\n\n다른 길에서 잘 지냅니다. 교수님도\n― 민지 올림']).incompleteClosings,1,'an incomplete ending before a signature remains detectable');
 assert.equal(studentLetterProseIssues(['교수님께.\n\n다음에 뵐 때 들려드릴게요.\n― 민지 올림','교수님께.\n\n다음 학회에서 찾아뵙겠습니다.\n― 지훈 올림']).nextPromises,1,'distinct letters each keep their own budget');
});

test('outside-career letters report their new work once and retain the professor reply',()=>{
 for(const labMode of ['wet','dry'])for(const locale of ['ko','en'])for(const relationship of ['close','reserved']){
  const pages=getEndingPages('unrelated',locale,relationship,'김민지',null,[],context('unrelated',labMode==='wet'?'056':'048',labMode));
  const body=studentLetterBodies(pages)[0];
  assert.ok(body);assert.doesNotMatch(body,/customer data instead of studies|새로운 분야에서 일하면서/);
  assert.equal((body.match(locale==='ko'?/연구실에서 배운 걸/g:/I use what I learned in the lab here too/g)||[]).length,1,'the transfer of research habits is said once');
  if(relationship==='close'){
   assert.match(pages.at(-1),locale==='ko'?/다음에 만나면 회사 밖의 이야기/:/tell me about life outside the company/);
   assert.equal(studentLetterProseIssues(pages).nextPromises,locale==='ko'?1:0);
  }
 }
});

test('English dry substitutions retain grammatical articles, number and compound words in older letters',()=>{
 const ctx={fieldId:'048',labMode:'dry'};
 const singular=adaptResearchText('I still keep an experiment notebook. Experiments may follow an experimental design.',ctx,'en');
 assert.match(singular,/a research notebook/);assert.match(singular,/studies may follow an experimental design/i);
 assert.doesNotMatch(singular,/an research|an study|studyal/);
 assert.match(adaptResearchText('Our experiment notebooks contain earlier experiments.',ctx,'en'),/research notebooks contain earlier studies/);
 for(const relationship of ['close','reserved','distant']){
  const older=getEndingPages('startup','en',relationship,'Minji',null,[],ctx).join('\n');
  assert.doesNotMatch(older,/an research notes|an research notebook/,'legacy records without statistics use a correct dry notebook description');
 }
});

test('event recollections preserve a planned introduction or workshop without inventing a completed meeting',()=>{
 const cases=[
  ['counsel-master-career',/질문을 준비하던|preparing questions/],
  ['counsel-phd-career',/무엇을 묻고 어떤 경험을 준비할지|discussed what to ask/],
  ['best-paper',/어떻게 설명할지 함께 준비|prepared how I would explain/],
  ['best-presentation',/질문을 받을 시간도 계획|planned time for other people/]
 ];
 for(const[id,planned]of cases)for(const locale of ['ko','en']){
  const history=[{kind:'event',id,choice:1,month:48}],ctx={...context('bachelor','056','wet'),passageIds:[`memory.${id}.1`]};
  const notes=endingLetterInsertions('bachelor','close',history,ctx,locale);
  assert.equal(notes.length,1);assert.match(notes[0].text,planned);
  assert.deepEqual(endingLetterInsertions('bachelor','close',[],ctx,locale),[],'an old frozen ID alone cannot invent the event');
 }
});

test('retirement keeps unique reunion scenes, eight major outcomes and the photograph permission',()=>{
 const gallery=MAIN_ENDINGS.map((ending,i)=>({ending,name:i%2?'김민지':'김지훈'}));
 assert.equal(endingCollection(gallery).total,8);assert.ok(endingCollection(gallery.slice(0,5)).unlocked);
 const scenes=retirementScenes(gallery),text=scenes.join('\n');
 assert.equal(new Set(scenes).size,scenes.length);
 assert.doesNotMatch(text,/각자의 일과 생활 속에서 가져온 안부|어디에서 일하는지보다|모든 주요 후일담|하나의 서열/);
 assert.match(text,/공개를 허락한 산 사진/);
 assert.equal(endingCollection([...gallery.slice(0,4),{ending:'youtuber',name:'준영'}]).count,4);
 const distant=gallery.map(entry=>entry.ending==='corporate'?{...entry,relationship:'distant'}:entry);
 assert.doesNotMatch(retirementScenes(distant).join('\n'),/오늘 커피는 제가 삽니다/,'the retirement visit does not override a distant graduate’s contact boundary');
});

test('Korean ending evidence names manuscript submission rather than displaying its storage key',()=>{
 const state=createState('김민지',17);state.ending='institute';state.route='integrated';state.month=96;
 const evidence=endingEvidence(state);
 assert.ok(evidence.requirements.some(row=>row.label==='논문 제출'));
 assert.ok(evidence.requirements.every(row=>row.label!=='submissions'));
});

test('all major-field, lab, rapport and language prose branches keep budgets and exclude game-time narration',()=>{
 const history=['counsel-master-career','best-presentation','authorship','counsel-results','doctoral-lead','equipment'].map((id,i)=>({kind:'event',id,choice:1,month:20+i}));
 const fixedTone=new Set(['leave','dropout','gameover','unfinished','youtuber','dismissed']);
 let combinations=0;
 for(const discipline of DISCIPLINES)for(const labMode of discipline.labModes)for(const ending of Object.keys(ENDINGS))for(const relationship of ['close','reserved','distant'])for(const locale of ['ko','en']){
  const ctx=context(ending,discipline.id,labMode),before=JSON.stringify(ctx);
  const notes=endingLetterInsertions(ending,relationship,history,ctx,locale);
  const pages=getEndingPages(ending,locale,relationship,'김민지',null,history,ctx),text=pages.join('\n\n');
  const label=`${discipline.id}/${labMode}/${ending}/${relationship}/${locale}`;
  const budget=fixedTone.has(ending)||relationship==='distant'?0:relationship==='reserved'?1:2;
  assert.ok(notes.length<=budget,label);
  for(const note of notes)assert.ok(text.includes(note.text),`${label}: selected passage is rendered`);
  assert.doesNotMatch(text,/이 게임|게임의 기간|이 이야기의|time in this game|period in this game|allowed by this game|game’s period|fictional views/i,label);
  assert.doesNotMatch(text,/\{name\}|□/,label);
  assert.ok((text.match(/기억합니다/g)||[]).length<=1,label);
  if(locale==='en')assert.doesNotMatch(text.replaceAll('김민지',''),/[가-힣]/,label);
  assert.equal(JSON.stringify(ctx),before,`${label}: rendering cannot change the run`);
  combinations++;
 }
 assert.equal(combinations,12096,'this text-only regression matrix is separate from actual worker play statistics');
});
