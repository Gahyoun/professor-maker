import test from 'node:test';
import assert from 'node:assert/strict';
import {formatStudentName,withParticle,replaceNounWithParticle} from '../dist/korean.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {ENDING_FIELDS,researchSetting,englishResearchSetting,fieldWorkplace,careerDescription,adaptResearchText} from '../dist/ending-context.js';
import {endingVoiceCandidates,endingVoice,letterClosing} from '../dist/ending-voice.js';
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

test('field-specific equipment substitutions recompute all attached Korean particles',()=>{
 const source='오래된 기계가 멈췄다. 오래된 기계를 고친다. 오래된 기계로 확인한다. 오래된 기계와 기록. 오래된 기계는 남았다. 그 기계요. 기사님을 부르는 기계가 있다.';
 const dry=adaptResearchText(source,{fieldId:'090',labMode:'dry'});
 assert.equal(dry,'오래된 워크스테이션이 멈췄다. 오래된 워크스테이션을 고친다. 오래된 워크스테이션으로 확인한다. 오래된 워크스테이션과 기록. 오래된 워크스테이션은 남았다. 그 워크스테이션이요. 기사님을 부르는 워크스테이션이 있다.');
 for(const d of DISCIPLINES)for(const labMode of d.labModes){
  const context={fieldId:d.id,labMode},equipment=researchSetting(context).equipmentName;
  assert.equal(adaptResearchText('오래된 기계가 멈췄다.',context),withParticle('오래된 '+equipment,'이/가')+' 멈췄다.');
  assert.equal(adaptResearchText('오래된 기계로 확인한다.',context),withParticle('오래된 '+equipment,'으로/로')+' 확인한다.');
 }
 assert.equal(replaceNounWithParticle('장치였다. 장치라고 기록했다.','장치','서버'),'서버였다. 서버라고 기록했다.');
 assert.equal(replaceNounWithParticle('기계였다. 기계라고 기록했다.','기계','워크스테이션'),'워크스테이션이었다. 워크스테이션이라고 기록했다.');
});

test('equipment descriptions and brief spoken names remain separate and correctly inflected',()=>{
 const context={fieldId:'112',labMode:'wet'},setting=researchSetting(context);
 assert.equal(setting.equipment,'건강 지표 측정 장비');assert.equal(setting.equipmentName,'분석 장비');
 assert.equal(adaptResearchText('계절별로 기사님을 불러야 하던 그 기계요.',context),'계절별로 기사님을 불러야 하던 그 분석 장비요.');
 assert.equal(adaptResearchText('오래된 기계로 확인했습니다.',context),'오래된 분석 장비로 확인했습니다.');
 assert.equal(englishResearchSetting(context).equipmentName,'research instrument');
 assert.equal(adaptResearchText('Our old machine stopped.',context,'en'),'Our old research instrument stopped.');
 const math={fieldId:'048',labMode:'dry'};
 assert.equal(researchSetting(math).equipmentName,'워크스테이션');
 assert.equal(adaptResearchText('오래된 기계가 있습니다. 그 기계로 확인했습니다.',math),'오래된 워크스테이션이 있습니다. 그 워크스테이션으로 확인했습니다.');
});

test('voice candidate and compatibility APIs share ending context exclusions',()=>{
 const state=createState('김민지',6);state.ending='corporate';const statistics=endingStatistics(state);
 statistics.temperament={curiosity:50,caution:50,expression:50};
 statistics.student.learning=999;statistics.student.diligence=0;statistics.student.stress=80;
 const base={statistics,relationship:'close'},before=JSON.stringify(base);
 for(const locale of ['ko','en']){
  const ordinary=endingVoiceCandidates({...base,ending:'corporate'},locale);
  assert.ok(ordinary.some(c=>c.tags.includes('newcomer')));
  for(const ending of ['true','postdoc','institute','resident_researcher']){
   const candidates=endingVoiceCandidates({...base,ending},locale);
   assert.ok(candidates.length>0,ending);
   assert.ok(candidates.every(c=>!c.tags.includes('newcomer')),ending);
   if(ending==='resident_researcher')assert.ok(candidates.some(c=>c.tags.includes('recovery')));
   else assert.ok(candidates.every(c=>!c.tags.includes('recovery')),ending);
   assert.doesNotMatch(endingVoice({...base,ending},locale).join('\n'),/기초부터 다시|새 일의 하루|fundamentals|this new work/);
  }
  for(const ending of ['leave','dropout','gameover','unfinished','dismissed','youtuber']){
   assert.deepEqual(endingVoiceCandidates({...base,ending},locale),[],ending);
   assert.deepEqual(endingVoice({...base,ending},locale),[],ending);
  }
 }
 assert.equal(JSON.stringify(base),before);
});

test('closing lines do not repeat the postdoc visit promise or leave return decision',()=>{
 for(const locale of ['ko','en']){
  assert.equal(letterClosing('postdoc','close',{},locale),locale==='ko'?'건강하세요.':'Please take care.');
  assert.doesNotMatch(letterClosing('leave','reserved',{},locale),/복학|연락|return|decid|get in touch/);
 }
});

test('name particles tolerate closing punctuation, decomposed Hangul, numbers and research acronyms',()=>{
 assert.equal(withParticle('“김지훈”','은/는'),'“김지훈”은');
 assert.equal(withParticle('김민지'.normalize('NFD'),'이/가'),'김민지'.normalize('NFD')+'가');
 for(const [word,wanted]of [['1','1로'],['3','3으로'],['7','7로'],['AI','AI로'],['GPU','GPU로'],['R','R로']])assert.equal(withParticle(word,'으로/로'),wanted);
 assert.equal(withParticle('PM','은/는'),'PM은');assert.equal(withParticle('RA','이/가'),'RA가');
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
   if(labMode==='dry')assert.ok(!/실험|냉동고|(?<!유)튜브|배양/.test(text),d.label+'/'+id);
   if(['072','073','074','075','076'].includes(d.id))assert.ok(!/화학 공정|냉동고|(?<!유)튜브|후보 물질/.test(text),d.label+'/'+id);
   assert.ok(!text.includes('김지훈는')&&!text.includes('김지훈가')&&!text.includes('김민지은')&&!text.includes('김민지이었다'));
  }assert.deepEqual(context,copy);
 }
 for(const id of Object.keys(ENDINGS)){const text=getEndingPages(id,'ko','close','김민지',null,[],{fieldId:'072',labMode:'dry'}).join('\n');assert.ok(!/실험|냉동고|(?<!유)튜브|\{name\}|□/.test(text),id);}
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
