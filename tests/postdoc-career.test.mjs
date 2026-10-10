import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,HIDDEN_RANGES} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {postdocCareer} from '../dist/postdoc-career.js';
import {ENDINGS,getEndingStory,getEndingPages} from '../dist/stories.js';
import {buildEndingCV,renderCV} from '../dist/cv.js';

function context(role,fieldId='090',labMode='dry'){
 const state=createState('김민지',17,{fieldId,labMode});state.ending='postdoc';
 const statistics=endingStatistics(state);
 const score={learning:55,research:55,autonomy:50,teaching:50,language:55,social:50};
 Object.assign(score,({
  fellowship:{learning:80,research:80,autonomy:60,teaching:55},
  research_professor:{learning:80,research:70,teaching:95,autonomy:60},
  group_leader:{learning:70,research:85,autonomy:95,language:80,social:65},
 })[role]);
 for(const [key,value] of Object.entries(score)){const [lo,hi]=HIDDEN_RANGES[key];statistics.student[key]=lo+value*(hi-lo)/100;}
 return {fieldId,labMode,statistics};
}

test('postdoctoral epilogue selects coherent roles without treating the advisor relationship as job eligibility',()=>{
 const affiliations={postdoc:'Postdoctoral Researcher',fellowship:'Postdoctoral Researcher',research_professor:'Research Professor',group_leader:'Junior Research Group Leader'};
 for(const role of Object.keys(affiliations)){
  const ctx=context(role),before=JSON.stringify(ctx);
  assert.equal(postdocCareer(ctx).id,role);
  const story=getEndingStory('postdoc',ctx);
  assert.equal(story.postdocRole,role);
  for(const relationship of ['close','reserved','distant']){
   const pages=getEndingPages('postdoc','ko',relationship,'김민지',null,[],ctx);
   assert.match(pages[1],new RegExp(affiliations[role]));
   assert.doesNotMatch(pages.join('\n'),/김민지은|김민지이|\{name\}|□/);
   if(role==='research_professor'){
    assert.match(story.career.ko,/연구교수/);
    assert.match(pages[5],/기간을 정해 연구교수/);
    assert.doesNotMatch(pages.join('\n'),/여전히 Postdoctoral|1년 더 포닥/);
   }
   if(role==='group_leader'){
    assert.match(story.career.ko,/Junior Research Group Leader/);
    assert.match(pages[1],/공동교신저자/);
    assert.doesNotMatch(pages.join('\n'),/교신저자는 그곳의 PI|1년 더 포닥/);
   }
   if(role==='fellowship')assert.match(pages[5],/지원과제에 선정/);
   if(relationship==='distant')assert.match(pages[6],/메일로 부탁드립니다/);
  }
  for(const rawRapport of [-80,0,80]){ctx.statistics.student.rapport=rawRapport;assert.equal(postdocCareer(ctx).id,role);}
  ctx.statistics.student.rapport=JSON.parse(before).statistics.student.rapport;
  assert.equal(JSON.stringify(ctx),before);
 }
});

test('pre-appointment true letter varies the postdoctoral role and stays before the call and first meeting',()=>{
 for(const role of ['postdoc','fellowship','research_professor','group_leader']){
  const ctx=context(role),pages=getEndingPages('true','ko','close','김민지',null,[],ctx);
  assert.match(pages[3],/아직 전임교원 지원 결과는 모르지만/);
  assert.match(pages[1],/임용 결과를 기다리던 포닥 시절/);
  assert.match(pages[4],/사흘 전이 아니라 이틀 전이었다/);
  assert.match(pages[5],/합격 소식은 지난봄/);
  assert.match(pages[8],/임용 뒤 처음 마주 보고/);
  if(role==='fellowship')assert.match(pages[3],/지원과제에 선정/);
  if(role==='research_professor')assert.match(pages[3],/연구교수/);
  if(role==='group_leader')assert.match(pages[3],/Junior Research Group Leader/);
  assert.doesNotMatch(pages[3],/연구실을 이끌다 보니|임용되었습니다|junior leader/);
  const enPages=getEndingPages('true','en','close','Minji',null,[],ctx);
  assert.doesNotMatch(enPages[3],/[가-힣]/);
 }
});

test('new and archived CVs show the same postdoctoral role as the replayed letter',()=>{
 for(const role of ['postdoc','fellowship','research_professor','group_leader']){
  const ctx=context(role),state=createState('김민지',17,{fieldId:ctx.fieldId,labMode:ctx.labMode});
  state.ending='postdoc';state.hidden={...ctx.statistics.student};state.temperament={...ctx.statistics.temperament};
  const before=JSON.stringify(state),cv=buildEndingCV(state),meta=getEndingStory('postdoc',ctx);
  assert.equal(cv.model.careerPath,meta.career.ko);
  assert.match(cv.html,new RegExp(meta.career.ko.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  cv.model.careerPath='박사후연구원';
  assert.match(renderCV(cv.model),new RegExp(meta.career.ko.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal(JSON.stringify(state),before);
 }
});

test('role wording follows every discipline and lab mode and cannot mutate shared source stories',()=>{
 const original=JSON.stringify(ENDINGS);
 for(const d of DISCIPLINES)for(const labMode of d.labModes)for(const role of ['fellowship','research_professor','group_leader']){
  const ctx=context(role,d.id,labMode),before=JSON.stringify(ctx);
  for(const locale of ['ko','en']){
   const name=locale==='ko'?'김지훈':'Jihun';
   const pages=getEndingPages('postdoc',locale,'reserved',name,null,[],ctx);
   assert.equal(pages.length,12);
   assert.doesNotMatch(pages.join('\n'),/\{name\}|□|김지훈는|김지훈가/);
   if(labMode==='dry')assert.doesNotMatch(pages.join('\n'),locale==='ko'?/냉동고|배양|튜브|실험/:/freezer|tubes|cultivation|lab coat/i);
   assert.equal(getEndingStory('postdoc',ctx).postdocRole,role);
  }
  assert.equal(JSON.stringify(ctx),before);
 }
 assert.equal(JSON.stringify(ENDINGS),original);
 assert.equal(getEndingStory('postdoc').postdocRole,'postdoc');
 assert.equal(getEndingStory('true'),ENDINGS.true);
 const first=getEndingStory('postdoc',context('fellowship'));
 first.pages[0].ko='changed';
 first.title.ko='changed';first.career.ko='changed';
 assert.notEqual(getEndingStory('postdoc',context('fellowship')).pages[0].ko,'changed');
 assert.notEqual(getEndingStory('postdoc',context('fellowship')).title.ko,'changed');
 assert.notEqual(getEndingStory('postdoc',context('fellowship')).career.ko,'changed');
});
