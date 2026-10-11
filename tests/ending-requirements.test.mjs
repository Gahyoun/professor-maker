import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDINGS} from '../dist/stories.js';
import {DISCIPLINES,degreeTargets} from '../dist/disciplines.js';
import * as engine from '../dist/engine.js';
import {endingRequirements,renderEndingRequirements,endingCareerPriority} from '../dist/ending-requirements.js';

test('Every authored ending has public, nonempty conditions; retained unfinished ending is clearly legacy',()=>{
 for(const id of Object.keys(ENDINGS)){
  const data=endingRequirements(id,{fieldId:'048'}),html=renderEndingRequirements(id,{fieldId:'048'});
  assert.equal(data.id,id);assert.ok(data.title&&data.timing&&data.requirements.length,id);
  assert.match(html,/스포일러 안내/);assert.match(html,/목록으로 돌아가기/);
 }
 assert.equal(endingRequirements('unfinished').legacy,true);assert.match(renderEndingRequirements('unfinished'),/현재 새 플레이에서는.*별도로 생성하지/);
 assert.throws(()=>endingRequirements('invented'));
});

test('Degree and appointment counts follow the current field helpers without reading private student data',()=>{
 for(const field of DISCIPLINES){
  const context={professorProfile:{fieldId:field.id}};
  for(const key of ['hidden','temperament','statistics','career'])Object.defineProperty(context,key,{get(){throw new Error('private state read: '+key);}});
  const masters=degreeTargets(field.id,'masters'),phd=degreeTargets(field.id,'phd'),rule=engine.trueRequirements?.({professorProfile:{fieldId:field.id}})??engine.TRUE_REQUIREMENTS;
  assert.deepEqual(endingRequirements('masters',context).degreeTargets.masters,masters);
  assert.deepEqual(endingRequirements('true',context).degreeTargets.phd,phd);
  const text=endingRequirements('true',context).requirements.join(' ');assert.ok(text.includes(`논문 게재 ${Math.max(phd.papers,rule.papers)}편`),field.id);assert.ok(text.includes(`추천서 ${rule.recommendations}회`),field.id);
 }
 const context={fieldId:'048'};Object.defineProperty(context,'hidden',{enumerable:true,get(){throw new Error('hidden state read');}});assert.doesNotThrow(()=>endingRequirements('corporate',context));
});

test('Conditions preserve branch timing, modern activities, legacy limits and actual career priority',()=>{
 assert.match(renderEndingRequirements('external_masters'),/논문 게재 2편.*h-index 2/);
 assert.match(renderEndingRequirements('external_phd'),/석사.*48개월.*54개월/);
 assert.match(renderEndingRequirements('external_phd'),/석박사통합.*없습니다/);
 assert.match(renderEndingRequirements('true'),/12개월/);assert.match(renderEndingRequirements('true'),/수상은.*필수 조건이 아닙니다/);
 assert.match(renderEndingRequirements('dismissed'),/두 번.*두 번/);assert.match(renderEndingRequirements('dismissed'),/18개월.*6주/);assert.match(renderEndingRequirements('dismissed'),/추가로 2주/);
 assert.match(renderEndingRequirements('gameover'),/1천만원.*3개월 연속/);assert.match(renderEndingRequirements('gameover'),/직접 운영 보류/);
 assert.match(renderEndingRequirements('startup'),/현재 주별 계획에는 별도의.*선택이 없습니다/);
 assert.match(renderEndingRequirements('youtuber'),/현재 주별 계획에는 별도의 영상 활동 선택이 없습니다/);
 assert.deepEqual(endingCareerPriority(),['true','postdoc','resident_researcher','youtuber','startup','corporate','institute','unrelated','unemployed']);
});
