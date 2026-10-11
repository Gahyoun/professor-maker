import test from 'node:test';
import assert from 'node:assert/strict';
import {getEndingPages} from '../dist/stories.js';
import {createState} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {renderEvidence} from '../dist/ending-evidence.js';
import {retirementScenes,MAIN_ENDINGS} from '../dist/ending-collection.js';
import {postdocScenes} from '../dist/postdoc-career.js';
import {POSTDOC_STORY} from '../dist/ending-scenarios.js';
import {letterClosing} from '../dist/ending-voice.js';

const context=(fieldId='055',labMode='wet')=>{const s=createState('김민지',7,{fieldId,labMode});s.ending='unemployed';return {fieldId,labMode,statistics:endingStatistics(s)};};
const pages=(id,distance,ctx=context(),locale='ko',reason=null)=>getEndingPages(id,locale,distance,'김민지',reason,[],ctx);

test('E-01 alternate recommendation text names another referee without a single-cause verdict',()=>{
 const ctx={...context(),recommendation:'alternate'};
 for(const id of ['institute','corporate','startup','unemployed','youtuber'])for(const distance of ['close','reserved','distant']){
  const text=pages(id,distance,ctx).join('\n');
  assert.match(text,/다른 추천인에게 추천서를 부탁했다/,id);assert.match(text,/여러 사정이 겹친/,id);
  assert.doesNotMatch(text,/추천서가 비어|통과하지 못했다|추천서 공백/,id);
 }
 const outside=pages('unrelated','distant',ctx).join('\n');
 assert.match(outside,/다른 추천인에게 추천서를 부탁했다/);assert.doesNotMatch(outside,/추천서가 비어|통과하지 못했다/);
 const html=renderEvidence({metrics:[],requirements:[],reason:null,recommendation:'alternate'});
 assert.match(html,/다른 추천인에게 요청/);assert.doesNotMatch(html,/공백/);
});

test('E-03 the retirement postcard scene follows the recorded rapport',()=>{
 const gallery=MAIN_ENDINGS.map((ending,i)=>({ending,name:'제자'+i,relationship:'close'}));
 const text=retirementScenes(gallery).join('\n');
 assert.doesNotMatch(text,/산 사진 엽서/);assert.match(text,/회사 밖에서 배운 이야기/);
 gallery.find(e=>e.ending==='unrelated').relationship='distant';
 assert.match(retirementScenes(gallery).join('\n'),/산 사진 엽서가 놓였다\. “건강하세요\.” 교수도 더 긴 연락을 요구하지 않았다/);
});

test('E-04/E-16 institute mail comes from the institute and the future-work reference stays readable',()=>{
 for(const [fieldId,labMode] of [['055','wet'],['072','dry']]){
  const text=pages('institute','close',context(fieldId,labMode)).join('\n');
  assert.match(text,/정부출연연구기관 주소에서/);assert.doesNotMatch(text,/주소로 메일|것요|기억하시나요/);
  assert.match(text,/‘향후 과제’로 적어 두었던 그 일입니다/);
 }
});

test('E-06/E-07 unrelated letters avoid repeated lines and keep the no-schedule boundary in English',()=>{
 for(const distance of ['close','reserved']){
  const ko=pages('unrelated',distance).join('\n');
  assert.doesNotMatch(ko,/새로운 일의 이야기를 읽었다|교수는 메일/);
  assert.match(ko,/나는 메일을 두 번 읽었다/);
 }
 assert.match(pages('unrelated','reserved',context(),'en').join('\n'),/fixed schedule|any schedule/);
});

test('E-08/E-17 external doctorate letter has one meeting promise and no fixed four-year span',()=>{
 for(const distance of ['close','reserved']){
  const text=pages('external_phd',distance).join('\n');
  assert.doesNotMatch(text,/네 해/);
  assert.ok(text.split(/다음 학회/).length-1<=1);
 }
});

test('E-09 reason-specific gameover letters do not repeat the next-plan closing',()=>{
 for(const reason of ['graduation_requirements','qual_failure','time_limit'])for(const distance of ['close','reserved']){
  const text=pages('gameover',distance,context(),'ko',reason).join('\n');
  assert.doesNotMatch(text,/제 속도로 정하겠습니다|새로운 계획으로 다시/,reason);
 }
 assert.match(letterClosing('gameover','reserved',{},'ko'),/제 속도로/,'the operation-closure letter keeps its closing');
 assert.doesNotMatch(pages('gameover','reserved',context('072','dry')).join('\n'),/연구 파일과 연구 기록/,'E-18');
});

test('E-10/E-15/E-22 true ending keeps the final question in English, first person and one "몇 해"',()=>{
 const ko=pages('true','close').join('\n'),en=pages('true','close',context(),'en').at(-1);
 assert.match(en,/“Professor 김민지, what do you think\?”$/);
 assert.doesNotMatch(ko,/교수는 서랍/);assert.match(ko,/나는 서랍에 보관한 손편지/);
 assert.equal(pages('true','close')[0].split('몇 해').length-1,1);
 assert.match(ko,/“김민지 교수는 어떻게 생각해요\?”/);
});

test('E-12 non-fellowship postdoc roles do not cite unseen funding acknowledgments',()=>{
 const stats=context().statistics;
 for(const values of [{autonomy:100,research:100,language:100,social:100},{teaching:100,learning:100,research:100,autonomy:0}]){
  const ctx={statistics:{...stats,student:{...stats.student,...values}}};
  const story=postdocScenes(POSTDOC_STORY,ctx);assert.notEqual(story.postdocRole,'fellowship');
  assert.doesNotMatch(story.pages[2].ko,/연구비 감사 문구/);
 }
});

test('E-13/E-14/E-19/E-21 small continuity and wording fixes',()=>{
 const corporate=pages('corporate','reserved').join('\n');
 assert.doesNotMatch(corporate,/마지막 문장은 굳이/);assert.doesNotMatch(corporate,/교수는 메일을 두 번/);
 const video=pages('youtuber','close').join('\n');assert.doesNotMatch(video,/다음 촬영/);
 const job=pages('unemployed','distant').at(-1);assert.doesNotMatch(job,/우리는 안부를 나눌 수 있었다/);assert.match(job,/학생이 정한 대로/);
 const dropout=pages('dropout','reserved').join('\n');assert.match(dropout,/그다음 주/);assert.doesNotMatch(dropout,/이어갈/);
});
