import test from 'node:test';
import assert from 'node:assert/strict';
import {formatStudentName,withParticle} from '../dist/korean.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {ENDING_FIELDS,researchSetting,fieldWorkplace,careerDescription} from '../dist/ending-context.js';
import {ENDINGS,getEndingPages} from '../dist/stories.js';
import {createState} from '../dist/engine.js';
import {endingStatistics} from '../dist/statistics.js';
import {buildEndingCV} from '../dist/cv.js';
import {retirementScenes,MAIN_ENDINGS} from '../dist/ending-collection.js';

test('Korean names choose particles, copulas and the rieul directional exception',()=>{
 const input='{name}는 {name}가 {name}를 {name}와 {name}로. 보낸 사람은 {name}이었다. {name}이라는 이름. {name} 박사는 {name}의 기록을 읽었다.';
 assert.equal(formatStudentName(input,'김지훈'),'김지훈은 김지훈이 김지훈을 김지훈과 김지훈으로. 보낸 사람은 김지훈이었다. 김지훈이라는 이름. 김지훈 박사는 김지훈의 기록을 읽었다.');
 assert.equal(formatStudentName(input,'김민지'),'김민지는 김민지가 김민지를 김민지와 김민지로. 보낸 사람은 김민지였다. 김민지라는 이름. 김민지 박사는 김민지의 기록을 읽었다.');
 assert.equal(withParticle('하늘','으로/로'),'하늘로');assert.equal(withParticle('지훈','으로/로'),'지훈으로');
 assert.equal(withParticle('재활치료','을/를'),'재활치료를');assert.equal(withParticle('건축학','을/를'),'건축학을');
 assert.equal(formatStudentName('{name} is here.','$&','en'),'$& is here.');assert.equal(formatStudentName('{name}는',null),'{name}는');
});

test('every configured discipline has a workplace mapping and related industries stay distinct',()=>{
 assert.deepEqual(Object.keys(ENDING_FIELDS).sort(),DISCIPLINES.map(d=>d.id).sort());
 const architecture=fieldWorkplace({fieldId:'072',field:'화학공학',labMode:'dry'},'corporate');
 assert.match(architecture,/건축·설계/);assert.match(architecture,/설계 도면/);assert.ok(!/화학|시료|냉동고|배양/.test(architecture));
 assert.match(fieldWorkplace({fieldId:'097',labMode:'wet'},'corporate'),/화학 공정/);
 assert.match(fieldWorkplace({fieldId:'074',labMode:'dry'},'institute'),/녹지와 공공 공간/);
 assert.match(fieldWorkplace({fieldId:'076',labMode:'dry'},'corporate'),/도시 계획/);
 assert.match(fieldWorkplace({fieldId:'090',labMode:'dry'},'corporate'),/소프트웨어와 알고리즘/);
 assert.equal(researchSetting({field:'주거학',labMode:'dry'}).sector,'주거·생활환경');
 assert.equal(researchSetting({field:'알 수 없는 전공',labMode:'dry'}).sector,'전공 관련');
});

test('all Korean ending paths use the saved name and dry stories omit wet-only props',()=>{
 const s=createState('',6);s.ending='unrelated';const statistics=endingStatistics(s),before=JSON.stringify(ENDINGS);
 for(const d of DISCIPLINES)for(const labMode of d.labModes){const context={fieldId:d.id,labMode,statistics};const copy=structuredClone(context);
  for(const id of ['corporate','institute','unrelated'])for(const name of ['김지훈','김민지'])for(const distance of ['close','reserved','distant']){
   const text=getEndingPages(id,'ko',distance,name,null,[],context).join('\n');
   assert.ok(!text.includes('{name}')&&!text.includes('□'));assert.ok(text.includes(name));
   if(labMode==='dry')assert.ok(!/실험|냉동고|튜브|배양/.test(text),d.label+'/'+id);
   if(['072','073','074','075','076'].includes(d.id))assert.ok(!/화학 공정|냉동고|튜브|후보 물질/.test(text),d.label+'/'+id);
   assert.ok(!text.includes('김지훈는')&&!text.includes('김지훈가')&&!text.includes('김민지은')&&!text.includes('김민지이었다'));
  }assert.deepEqual(context,copy);
 }
 for(const id of Object.keys(ENDINGS)){const text=getEndingPages(id,'ko','close','김민지',null,[],{fieldId:'072',labMode:'dry'}).join('\n');assert.ok(!/실험|냉동고|튜브|\{name\}|□/.test(text),id);}
 assert.equal(JSON.stringify(ENDINGS),before);
});

test('retirement names and CV career descriptions follow the same saved identity and field',()=>{
 const gallery=MAIN_ENDINGS.map((ending,i)=>({ending,name:i%2?'김민지':'김지훈'}));
 assert.match(retirementScenes(gallery).join('\n'),/김지훈이 공개를 허락/);
 gallery.find(e=>e.ending==='unrelated').name='김민지';assert.match(retirementScenes(gallery).join('\n'),/김민지가 공개를 허락/);
 const s=createState('김민지',8,{fieldId:'072',labMode:'dry'});s.ending='corporate';s.month=96;s.route='integrated';s.career.qual='passed';const cv=buildEndingCV(s).model;
 assert.match(cv.careerPath,/건축·설계/);assert.equal(cv.name,'김민지');assert.equal(cv.field,'건축학');
 assert.match(careerDescription('institute',{fieldId:'098'},'ko','기본'),/에너지/);
});
