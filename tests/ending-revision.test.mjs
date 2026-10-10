import test from 'node:test';import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,validateSave,proposeSchedule,studentTrainingActive,calendarMonth,failureRun,careerEnding,HIDDEN_RANGES} from '../dist/engine.js';
import {getEndingPages,endingLetterInsertions} from '../dist/stories.js';import {endingStatistics} from '../dist/statistics.js';import {endingCollection,MAIN_ENDINGS,retirementScenes} from '../dist/ending-collection.js';import {weeklyAppearance} from '../dist/appearance.js';import {weeklyScene} from '../dist/weekly-scene.js';
test('faculty story retains chronological postdoc letter, call, first meeting, revised letter and colleague greeting',()=>{
 const pages=getEndingPages('true','ko','close','김민지',null,[],{fieldId:'090',labMode:'dry'}),text=pages.join('\n');
 assert.match(text,/소인이 두 번/);assert.match(text,/국제우편/);assert.match(text,/Junior Research Group Leader/);assert.match(text,/사흘 전이 아니라 이틀 전이었다/);
 assert.ok(pages.findIndex(p=>p.includes('Junior Research Group Leader'))<pages.findIndex(p=>p.includes('합격 소식은 지난봄')));assert.ok(pages.findIndex(p=>p.includes('합격 소식은 지난봄'))<pages.findIndex(p=>p.includes('화면에 떠올랐다')));
 assert.match(text,/임용 뒤 처음 마주 보고/);assert.match(text,/김민지 교수는 어떻게 생각해요/);assert.ok(!/실험|냉동고|자네는/.test(text));
 const end=pages.find(p=>p.includes('종소리'));assert.ok(end.indexOf('종소리')<end.indexOf('감사'));assert.ok(end.indexOf('감사')<end.indexOf('박수'));
 const postdoc=getEndingPages('postdoc','ko','reserved','김지훈').join('\n');assert.match(postdoc,/결과는 몇 달 전 메일로 들었다/);assert.match(postdoc,/추천서 한 장 때문은 아니었을 것이다/);
});
test('letter combinations follow personality, abilities, rapport, field and outcome without changing source or RNG',()=>{
 const s=createState('김민지',6);s.ending='bachelor';const before=JSON.stringify(s),versions=new Set();
 for(const relationship of ['close','reserved','distant'])for(const trait of ['caution','expression','curiosity'])for(const skill of ['research','language','teaching','industry'])for(const fieldId of ['090','072','056']){
  const statistics=structuredClone(endingStatistics(s));statistics.temperament={curiosity:30,caution:30,expression:30};statistics.temperament[trait]=90;
  // Expression and curiosity need social/creative experience as well as a tendency;
  // low seed traits must not silently turn both fixtures into the newcomer fallback.
  for(const [key,score]of Object.entries({social:75,creativity:75,[skill]:95})){const [lo,hi]=HIDDEN_RANGES[key];statistics.student[key]=lo+score*(hi-lo)/100;}
  const context={statistics,fieldId,labMode:fieldId==='056'?'wet':'dry'},contextBefore=structuredClone(context),notes=endingLetterInsertions('bachelor',relationship,[],context);
  if(relationship==='close'){assert.equal(notes.length,2);assert.ok(notes.some(note=>note.group==='trait'&&note.id.startsWith(`voice.${trait}.`)),`${trait} is represented within the two-passage cap`);}
  if(relationship!=='distant'){assert.ok(notes.some(note=>note.group==='skill'&&note.id.startsWith(`voice.${skill}.`)),`${skill} is the strongest eligible ability`);if(relationship==='reserved')assert.equal(notes.length,1);}
  else assert.deepEqual(notes,[],'distant letters deliberately omit automatic recollections');
  const pages=getEndingPages('bachelor','ko',relationship,'김민지',null,[],context);versions.add(pages.join('\n'));assert.deepEqual(context,contextBefore);
  assert.ok(!pages.join('').includes('김민지은'));if(relationship==='distant')assert.ok(!pages.join('').includes('긴 안부를 쓰는 일'));
 }
 assert.ok(versions.size>=40);assert.equal(JSON.stringify(s),before);
 const fieldTasks={'090':'코드와 데이터 처리 과정','072':'설계 도면과 구조·환경 해석','056':'시료와 대조 조건의 비교'},fieldVersions=new Set();
 for(const [fieldId,task]of Object.entries(fieldTasks)){
  const text=getEndingPages('institute','ko','close','김민지',null,[],{statistics:endingStatistics(s),fieldId,labMode:fieldId==='056'?'wet':'dry'}).join('\n');
  assert.ok(text.includes(task),`${fieldId} uses work from the chosen discipline`);fieldVersions.add(text);
 }assert.equal(fieldVersions.size,3,'field differences remain meaningful in the core research story');
 const outcomeText=id=>getEndingPages(id,'ko','close','김민지',null,[],{statistics:endingStatistics(s),fieldId:'090',labMode:'dry'}).join('\n');
 assert.match(outcomeText('institute'),/공동연구 제안|함께 해 주시겠습니까/);assert.match(outcomeText('bachelor'),/대학원 지원서를 내지 않았다|대학원에 가지 않기로/);assert.match(outcomeText('startup'),/첫 고객|회사를 시작/);
 assert.equal(new Set(['institute','bachelor','startup'].map(outcomeText)).size,3,'the shared passage bank cannot replace the career-specific events');
 for(const id of ['youtuber','bachelor','external_masters','external_phd'])assert.ok(!getEndingPages(id,'ko','reserved','김지훈').join('').includes('긴 안부를 쓰는 일'));
 const corporate=getEndingPages('corporate','ko','reserved','김민지').join('');assert.equal(corporate.split('커피는 정말로 한 잔뿐이었다').length-1,1);
 const high=getEndingPages('corporate','ko','close','김민지',null,[],{fieldId:'072',labMode:'dry'}).join('');assert.ok(!/어색하니까|냉동고|배양/.test(high));
});
test('special video ending does not count toward either retirement milestone',()=>{
 assert.equal(MAIN_ENDINGS.length,8);const four=MAIN_ENDINGS.slice(0,4).map(ending=>({ending,name:'민지'}));const video={ending:'youtuber',name:'준영'};
 assert.equal(endingCollection([...four,video]).count,4);assert.ok(!endingCollection([...four,video]).unlocked);
 const all=MAIN_ENDINGS.map(ending=>({ending,name:'민지'}));assert.ok(endingCollection(all).complete);assert.match(retirementScenes([...all,video]).join(''),/카메라/);
 const s=createState('',3);s.hidden.language=899.1;s.hidden.social=80;s.hidden.outreach=0;assert.equal(careerEnding(s),'youtuber');s.hidden.language=898;assert.notEqual(careerEnding(s),'youtuber');
});
test('training schedules in winter, blocks advising and three weekly activities, then restores normal play',()=>{
 let s=createState('김준영',3,{gender:'male'});s.month=36;s.route='integrated';s.pending={kind:'service'};s=decide(s,'training');assert.ok(validateSave(s));assert.ok([1,2].includes(calendarMonth(s.service.trainingStartMonth)));assert.ok(!studentTrainingActive(s));
 s.month=s.service.trainingStartMonth;s.pending=null;s.pendingQueue=[];s.plan=proposeSchedule(s);s.facultyAction='routine';assert.ok(studentTrainingActive(s));assert.ok(validateSave(s));
 assert.throws(()=>simulateMonth(s,s.plan,{facultyAction:'conversation'}),/unavailable/);assert.throws(()=>simulateMonth(s,s.plan,{facultyAction:'support'}),/unavailable/);
 const n=simulateMonth(s,s.plan,{feedback:'harsh',facultyAction:'routine'});assert.ok(validateSave(n));assert.equal(n.lastReport.results.filter(r=>r.outcome==='training').length,3);assert.equal(n.behavior.harsh,s.behavior.harsh);assert.equal(failureRun(n),0);assert.ok(!studentTrainingActive(n));assert.equal(weeklyAppearance({...n,visualMonth:s.month},3).hairLength,0);
 const scene=weeklyScene(n,n.lastReport.results[0],0);assert.match(scene,/학생 지도 중단/);assert.ok(!scene.includes('room-portrait'));assert.ok(!scene.includes('미완료'));
 assert.throws(()=>decide({...n,pending:{kind:'service'}},'training'),/already/);
});
