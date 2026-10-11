import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DISCIPLINES,degreeTargets,disciplineLabel} from '../dist/disciplines.js';
import {generateEnglishName,generateKoreanName,generateStudentName} from '../dist/names.js';
import {admissionCandidates,admitCandidate,admissionCode,parseAdmissionCode} from '../dist/admission.js';
import {CONTENT_EN,englishProjectTitle} from '../dist/content-en.js';
import {CHAPTERS,THESIS_SCENES,getChapter,getThesisScene} from '../dist/main-story.js';
import {ENDINGS,getEndingPages} from '../dist/stories.js';
import {endingRequirements,renderEndingRequirements} from '../dist/ending-requirements.js';
import {createState,projectTitle} from '../dist/engine.js';
import {roomScene} from '../dist/lab-scene.js';
import {buildEndingCV,renderCV,validateCVModel} from '../dist/cv.js';
import {buildCVExportDocument} from '../dist/cv-export.js';
import {DILEMMAS,dilemmaOptions,monthlyIssueOptions,ISSUE_CHOICES} from '../dist/monthly-choices.js';
import {MAIN_ENDINGS,retirementScenes} from '../dist/ending-collection.js';
import {endingEvidence,renderEvidence} from '../dist/ending-evidence.js';
import {renderStatistics} from '../dist/statistics.js';

const noKorean=text=>assert.doesNotMatch(String(text),/[가-힣]/);
test('All 73 disciplines have English metadata while Korean IDs, labels and targets stay authoritative',()=>{
 assert.equal(DISCIPLINES.length,73);
 for(const field of DISCIPLINES){
  assert.ok(field.labelEn&&field.groupEn&&field.majorEn,field.id);noKorean(field.labelEn);assert.equal(disciplineLabel(field.id,'en'),field.labelEn);assert.equal(disciplineLabel(field.id,'ko'),field.label);assert.equal(CONTENT_EN[field.label],field.labelEn);
  assert.deepEqual(degreeTargets(field.id,'phd'),endingRequirements('true',{locale:'en',fieldId:field.id}).degreeTargets.phd);
  const title=englishProjectTitle(field.id,`${field.id}-topic`,3);noKorean(title);assert.equal(title,englishProjectTitle(field.id,`${field.id}-topic`,3));assert.ok(title.length<200);
 }
 for(const field of DISCIPLINES){const titles=Array.from({length:100},(_,index)=>englishProjectTitle(field.id,'same-topic',index+1));assert.equal(new Set(titles).size,titles.length);assert.deepEqual(titles,Array.from({length:100},(_,index)=>englishProjectTitle(field.id,'same-topic',index+1)));}
 for(let project=1;project<20;project++)assert.doesNotMatch(englishProjectTitle('048','topic',project),/cell|sample|clinical|animal|reagent|crop/i);
});
test('English intake changes public names and 4.0 grades without redrawing the student',()=>{
 const en=admissionCandidates(724,{locale:'en',fieldId:'048'}),ko=admissionCandidates(724,{locale:'ko',fieldId:'048'});
 assert.deepEqual(en,admissionCandidates(724,{locale:'en',fieldId:'048'}));
 for(let index=0;index<3;index++){
  noKorean(JSON.stringify(en[index]));assert.equal(en[index].gpaScale,4);assert.ok(en[index].gpa<=4);assert.equal(en[index].gpa,Number((ko[index].gpa/4.5*4).toFixed(2)));
  const english=admitCandidate(724,index,{locale:'en',fieldId:'048'}),korean=admitCandidate(724,index,{locale:'ko',fieldId:'048'});
  assert.deepEqual(english.hidden,korean.hidden);assert.deepEqual(english.temperament,korean.temperament);assert.equal(english.seed,korean.seed);assert.equal(english.gender,korean.gender);assert.equal(english.name,en[index].name);assert.equal(korean.name,ko[index].name);
  assert.deepEqual(parseAdmissionCode(admissionCode(724,index)),{intakeSeed:724,candidateIndex:index});
 }
 assert.equal(generateStudentName(5,'female','ko'),generateKoreanName(5,'female'));assert.equal(generateStudentName(5,'other','en'),generateEnglishName(5,'other'));
 assert.match(generateEnglishName(5,'other'),/^[A-Za-z]+ [A-Za-z]+$/);
});
test('English chapters, defense scenes and all 18 ending guides expose no Korean source copy',()=>{
 for(const id of Object.keys(CHAPTERS)){noKorean(JSON.stringify(getChapter(id,'en')));assert.equal(getChapter(id,'ko'),CHAPTERS[id]);}
 for(const id of Object.keys(THESIS_SCENES)){noKorean(JSON.stringify(getThesisScene(id,'en')));assert.equal(getThesisScene(id,'ko'),THESIS_SCENES[id]);}
 for(const id of Object.keys(ENDINGS)){
  const context={locale:'en',fieldId:'048'};for(const key of ['hidden','temperament','career','statistics'])Object.defineProperty(context,key,{get(){throw new Error('Private state read');}});
  noKorean(renderEndingRequirements(id,context));assert.ok(endingRequirements(id,context).requirements.length);
  noKorean(getEndingPages(id,'en','reserved','Alex Morgan',undefined,[],{fieldId:'048',labMode:'dry'}).join(' '));
 }
 assert.match(renderEndingRequirements('gameover',{locale:'en',fieldId:'048'}),/\$25,000.*3 consecutive months/);
 assert.match(renderEndingRequirements('true',{locale:'en',fieldId:'048'}),/2 accepted papers/);
});
test('New English CVs preserve their September-August calendar and translate field, milestones, figures and room labels',async()=>{
 const state=createState('Alex Morgan',42,{locale:'en',fieldId:'048',labMode:'dry'});state.professorName='Dr. Taylor Reed';state.month=96;state.route='integrated';state.ending='institute';state.career.qual='passed';
 state.history=[{kind:'story',id:'contact',month:0,choice:'encourage'},{kind:'story',id:'firstyear',month:12,choice:'reflect'},{kind:'thesis',level:'phd',step:'verdict',passed:true,month:96},{kind:'submission',projectId:1,journal:'standard',month:80},{kind:'paper',projectId:1,journal:'standard',month:86},{kind:'conference',projectId:1,tier:'regular',month:85}];state.career.papers=1;state.career.submissions=1;state.career.conferences=1;
 const before=structuredClone(state),cv=buildEndingCV(state);assert.deepEqual(state,before);assert.equal(cv.model.field,'Mathematics');assert.ok(validateCVModel(cv.model));assert.match(cv.model.period,/Y1 · Sep — Y8 · Aug/);assert.equal(cv.model.education.at(-1).title,'Ph.D. program (M.S. en route)');
 noKorean(cv.html);noKorean(roomScene(state));noKorean(roomScene(state,{actual:'conference',performed:true}));noKorean(renderStatistics(cv.model.statistics,'en'));
 const css=await readFile(new URL('../dist/cv.css',import.meta.url),'utf8'),exported=buildCVExportDocument({model:cv.model,css});assert.match(exported,/@page us-cv\{size:Letter/);assert.match(exported,/\[lang=en\]\{page:us-cv/);assert.match(exported,/@page\{size:A4/);
 const old=structuredClone(cv.model);old.field='수학';old.projects[0].title='보존된 과거 연구 제목';assert.ok(validateCVModel(old));const frozen=structuredClone(old);assert.match(renderCV(old),/보존된 과거 연구 제목/);assert.deepEqual(old,frozen);
});

test('Monthly dilemmas localize titles, bodies, hints and replies without changing their mechanics',()=>{
 const ko=createState('검증',42,{locale:'ko'}),en=structuredClone(ko);en.locale='en';
 const mechanics=options=>options.map(({value,effects,progress,disabled})=>({value,effects,progress,disabled}));
 for(const event of DILEMMAS){noKorean(event.title.en);noKorean(event.body.en);const english=dilemmaOptions(en,event),korean=dilemmaOptions(ko,event);assert.deepEqual(mechanics(english),mechanics(korean));for(const option of english){noKorean(option.label.en);noKorean(option.hint.en);noKorean(option.response);}}
 for(const id of Object.keys(ISSUE_CHOICES)){const english=monthlyIssueOptions(en,id),korean=monthlyIssueOptions(ko,id);assert.deepEqual(mechanics(english),mechanics(korean));for(const option of english){noKorean(option.label.en);noKorean(option.hint.en);noKorean(option.response);}}
});
test('Retirement scenes and archived evidence have English rendering without mutating records',()=>{
 const gallery=[...MAIN_ENDINGS,'youtuber'].map((ending,index)=>({id:`fixture-${index}`,ending,name:`Alex ${index}`,relationship:'distant'})),before=structuredClone(gallery);
 noKorean(retirementScenes(gallery,'en').join(' '));assert.deepEqual(gallery,before);assert.ok(retirementScenes(gallery,'ko').some(text=>/[가-힣]/.test(text)));
 const state=createState('Alex Morgan',42,{locale:'en',fieldId:'048'});state.month=96;state.ending='true';const evidence=endingEvidence(state),frozen=structuredClone(evidence);noKorean(renderEvidence(evidence,'en'));assert.deepEqual(evidence,frozen);assert.equal(evidence.metrics.find(row=>row.label==='논문 게재'&&row.target!==undefined).target,2);
});

test('English title improvements preserve all recorded historical project names and frozen CVs',()=>{
 const state=createState('Alex Morgan',42,{locale:'en',fieldId:'048'});state.history=[{kind:'submission',projectId:1,projectTitle:'An original archived theorem title',month:40},{kind:'submission',projectId:2,projectTitle:'보존한 이전 연구 제목',month:60}];const before=structuredClone(state);
 assert.equal(projectTitle(state,1,'en'),'An original archived theorem title');assert.equal(projectTitle(state,2,'en'),'보존한 이전 연구 제목');assert.deepEqual(state,before);
});
