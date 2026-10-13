import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {CURRENT_NAMING_VERSION,CURRENT_US_NAMING_VERSION,currentNamingVersion,MULTICULTURAL_ENGLISH_NAME_POOLS,US_NAME_PROVENANCE,generateEnglishName,generateStudentName} from '../dist/names.js';
import {admissionCandidates,admitCandidate,admissionSeed,admissionCode,parseAdmissionCode} from '../dist/admission.js';
import {studentAppearance,studentAppearanceForState,weeklyAppearance,renderPortrait,skinToneUS,US_SKIN_TONES} from '../dist/appearance.js';
import {studentBackground,studentBackgroundForState,STUDENT_JOURNEYS,STUDENT_JOURNEY_WEIGHTS,STUDENT_INTERESTS} from '../dist/student-background.js';
import {openingMeeting} from '../dist/opening-meeting.js';
import {createState,validateSave,migrateSave} from '../dist/engine.js';
import {buildEndingCV,renderCV} from '../dist/cv.js';

const digest=text=>createHash('sha256').update(text).digest('hex');
test('New U.S. preferred-name pools are authored whole names without demographic classifications',()=>{
 assert.equal(CURRENT_NAMING_VERSION,2);assert.equal(CURRENT_US_NAMING_VERSION,3);assert.equal(currentNamingVersion('ko'),2);assert.equal(currentNamingVersion('en'),3);
 for(const pool of Object.values(MULTICULTURAL_ENGLISH_NAME_POOLS)){assert.equal(pool.length,96);assert.equal(new Set(pool).size,pool.length);assert.ok(pool.every(name=>typeof name==='string'&&name.length<=24&&name.includes(' ')));}
 assert.match(US_NAME_PROVENANCE.sampling,/not.*census/i);assert.match(US_NAME_PROVENANCE.limitation,/does not establish race/);
 assert.equal(generateStudentName(42,'female','en',2),generateEnglishName(42,'female'));assert.equal(generateStudentName(42,'female','en'),generateStudentName(42,'female','en',3));
 const names=new Set(Array.from({length:1000},(_,seed)=>generateStudentName(seed,'female','en',3)));assert.equal(names.size,96);
});
test('PM and PM2 are stable, PM3 is reproducible and restricted to the English edition',()=>{
 for(const version of [1,2])for(const index of [0,1,2]){
  const code=admissionCode(123456,index,version),parsed=parseAdmissionCode(code),state=admitCandidate(parsed.intakeSeed,parsed.candidateIndex,{locale:'en',namingVersion:version});
  assert.equal(state.name,admissionCandidates(123456,{locale:'en',namingVersion:version})[index].name);assert.equal(studentBackgroundForState(state),null);assert.deepEqual(studentAppearanceForState(state),studentAppearance(state.creationSeed,state.gender));
 }
 for(const index of [0,1,2]){
  const code=admissionCode(123456,index,3),parsed=parseAdmissionCode(code);assert.equal(code,`PM3-0001E240-${index+1}`);assert.deepEqual(parsed,{intakeSeed:123456,candidateIndex:index,namingVersion:3});
  const state=admitCandidate(parsed.intakeSeed,parsed.candidateIndex,{locale:'en',namingVersion:3});assert.ok(validateSave(state));assert.deepEqual(migrateSave(state).admission,state.admission);assert.equal(state.name,admissionCandidates(123456,{locale:'en',namingVersion:3})[index].name);const candidate=admissionCandidates(123456,{locale:'en',namingVersion:3})[index];assert.deepEqual(candidate.appearance,studentAppearanceForState(state));assert.deepEqual(candidate.background,studentBackgroundForState(state));assert.equal(Object.hasOwn(candidate,'hidden'),false);assert.equal(Object.hasOwn(candidate,'seed'),false);
 }
 assert.throws(()=>admissionCandidates(123456,{locale:'ko',namingVersion:3}));assert.throws(()=>admitCandidate(123456,0,{locale:'ko',namingVersion:3}));assert.throws(()=>generateStudentName(42,'male','ko',3));assert.equal(parseAdmissionCode('PM4-0001E240-1'),null);
});
test('Changing naming/cosmetic version cannot change any engine state or random draw',()=>{
 for(const intakeSeed of [0,42,1183,123456,0xffffffff])for(const index of [0,1,2]){
  const old=admitCandidate(intakeSeed,index,{locale:'en',namingVersion:2}),current=admitCandidate(intakeSeed,index,{locale:'en',namingVersion:3});
  const canonical=state=>{const copy=structuredClone(state);delete copy.name;delete copy.admission;return copy;};assert.deepEqual(canonical(current),canonical(old));
  const before=structuredClone(current);studentBackgroundForState(current);studentAppearanceForState(current);weeklyAppearance(current);openingMeeting(current.name,'en');assert.deepEqual(current,before);
 }
});
test('Cosmetic portrait and background helpers do not read protected attributes or infer identity from a name',()=>{
 const plain={locale:'en',admission:{namingVersion:3},creationSeed:42,seed:123,gender:'female'},guarded={...plain};
 for(const key of ['name','hidden','temperament','professor','lab','career','nationality','race'])Object.defineProperty(guarded,key,{get(){throw new Error(`Read forbidden data: ${key}`);}});
 assert.deepEqual(studentAppearanceForState(guarded),studentAppearanceForState(plain));assert.deepEqual(studentBackgroundForState(guarded),studentBackgroundForState(plain));
 const variedName={...plain,name:'Amina Hassan'},anotherName={...plain,name:'Emma Huang'};assert.deepEqual(studentAppearanceForState(variedName),studentAppearanceForState(anotherName));assert.deepEqual(studentBackgroundForState(variedName),studentBackgroundForState(anotherName));
});
test('Every journey combines with first-generation statements and everyday interests without visa or deficit assumptions',()=>{
 const coverage=new Map(STUDENT_JOURNEYS.map(journey=>[journey.id,{first:new Set(),interests:new Set(),toneBands:new Set()}]));
 for(let seed=0;seed<10000;seed++){
  const background=studentBackground(seed,'en',3),appearance=studentAppearanceForState({locale:'en',admission:{namingVersion:3},creationSeed:seed,gender:'female'}),entry=coverage.get(background.journeyId);
  entry.first.add(background.firstGeneration);entry.interests.add(background.interestIndex);entry.toneBands.add(Math.floor(parseInt(appearance.skin.slice(1,3),16)/48));
  assert.doesNotMatch(background.body,/\b(visa|citizen|illegal|undocumented|authorized|poor|weak English|lazy|stress|talent|ability)\b/i);
  assert.deepEqual(background,studentBackground(seed,'en',3));assert.ok(background.body.length<500);
 }
 for(const entry of coverage.values()){assert.equal(entry.first.size,2);assert.equal(entry.interests.size,STUDENT_INTERESTS.length);assert.ok(entry.toneBands.size>=4);}
 assert.equal(studentBackground(42,'ko',3),null);assert.equal(studentBackground(42,'en',2),null);assert.equal(studentBackgroundForState({locale:'en',creationSeed:42}),null);
});
test('Growing up and studying locally is a substantial ordinary path without citizenship or race assumptions',()=>{
 assert.equal(STUDENT_JOURNEY_WEIGHTS.length,STUDENT_JOURNEYS.length);
 const total=STUDENT_JOURNEY_WEIGHTS.reduce((sum,weight)=>sum+weight,0),localIndex=STUDENT_JOURNEYS.findIndex(journey=>journey.id==='local-school');
 assert.equal(STUDENT_JOURNEY_WEIGHTS[localIndex]/total,.5);
 const counts=new Map(STUDENT_JOURNEYS.map(journey=>[journey.id,0]));
 for(let seed=0;seed<10000;seed++){const background=studentBackground(seed,'en',3);counts.set(background.journeyId,counts.get(background.journeyId)+1);}
 assert.ok(counts.get('local-school')>=4700&&counts.get('local-school')<=5300);
 for(const [id,count] of counts)if(id!=='local-school')assert.ok(count>=800&&count<=1200,`${id}: ${count}`);
 const local=STUDENT_JOURNEYS[localIndex];assert.equal(local.label,'Grew up and studied locally');assert.match(local.body,/grew up and went to school in this area/);
 assert.doesNotMatch(local.body,/citizen|nationality|race|native-born|American-born/i);
 assert.match(STUDENT_JOURNEYS.find(journey=>journey.id==='regional-move').body,/another part of the United States/);
 assert.match(STUDENT_JOURNEYS.find(journey=>journey.id==='transfer').body,/community college/);
});
test('Legacy portrait pixels and already frozen CV images remain byte-for-byte unchanged',()=>{
 const hashes=[[0,'male','b752b36cf419779427e2792f063d49f12cb3577ec8f133c458e267b9b8e4cfa3'],[42,'female','7f707baa52da256fde616df812ded56e7417d2ebb03b8bfcb53e81df173ab7ef'],[1183,'unspecified','9b5a3f34333a66be059c1450b8ba85c74c6e122d68a596ec4ff55b0080cd0eff'],[79190,'female','3699e7cdca62cd44bcbf4bd979b0f57fa93d3789b0e9c5276dbd87fdba52616b']];
 for(const [seed,gender,hash] of hashes)assert.equal(digest(renderPortrait(studentAppearance(seed,gender))),hash);
 const legacy=admitCandidate(123456,0,{locale:'en',namingVersion:2});legacy.month=96;legacy.route='integrated';legacy.ending='institute';legacy.career.qual='passed';const cv=buildEndingCV(legacy).model,before=structuredClone(cv);renderCV(cv);assert.deepEqual(cv,before);assert.ok(!Object.hasOwn(cv,'background'));assert.ok(!Object.hasOwn(cv,'race'));
 assert.equal(skinToneUS(0),US_SKIN_TONES[0]);assert.equal(skinToneUS(1),US_SKIN_TONES.at(-1));assert.ok(parseInt(skinToneUS(0).slice(1,3),16)-parseInt(skinToneUS(1).slice(1,3),16)>180);
});
test('The first meeting asks for the named student’s view and preserves agency without hidden information',()=>{
 const ko=openingMeeting('김지은','ko'),en=openingMeeting('Amina Hassan','en');assert.equal(ko.professorLine,'김지은 학생은 어떻게 생각해요?');assert.equal(en.professorLine,'What do you think, Amina Hassan?');assert.match(en.studentLine,/question of my own/);assert.match(ko.studentLine,/제가 궁금한/);assert.doesNotMatch(JSON.stringify(en),/[가-힣]/);assert.deepEqual(en,openingMeeting('Amina Hassan','en'));
});
