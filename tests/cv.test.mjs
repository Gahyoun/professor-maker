import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {buildEndingCV,CV_TEMPLATES,validateCVModel,renderCV} from '../dist/cv.js';

function completed(seed=123) {
  const state=createState('김하늘',seed);state.month=96;state.route='masters';state.ending='corporate';
  state.history=[{month:24,kind:'route',route:'masters'},{month:39,kind:'submission',projectId:1},{month:42,kind:'conference',projectId:1},{month:44,kind:'paper',projectId:1},{month:48,kind:'promotion'},{month:48,kind:'sabbatical',mode:'away'},{month:60,kind:'qual',passed:true},{month:77,kind:'recommendation'},{month:96,kind:'ending',ending:'corporate'}];
  state.career={...state.career,submissions:4,papers:3,completedProjects:3,conferences:3,awards:1,recommendations:2,qual:'passed'};
  state.project={...state.project,id:4,titleIndex:3,phase:3,progress:10};return state;
}
test('CV generation is pure, deterministic and excludes hidden student information',()=>{
  const state=completed(),before=structuredClone(state),first=buildEndingCV(state),second=buildEndingCV(state);
  assert.deepEqual(first,second);assert.deepEqual(state,before);assert.equal(first.model.months,96);assert.equal(first.model.duration,'8년');
  assert.equal(first.model.outputs.acceptedPapers,3);assert.equal(first.model.outputs.submissions,4);
  assert.deepEqual(first.model.education.map(x=>x.degree),['bachelor','masters','doctorate']);
  assert.ok(first.model.memories.some(x=>x.kind==='sabbatical'));
  for(const key of ['hidden','temperament','rapport','stamina','resilience','learning'])assert.ok(!Object.hasOwn(first.model,key));
  assert.ok(!first.html.includes('DOI'));assert.ok(!first.html.includes('doi.org'));
});
test('game over and active games have no career snapshot',()=>{
  const state=createState();assert.equal(buildEndingCV(state),null);state.ending='gameover';assert.equal(buildEndingCV(state),null);
});
test('five seeded choices produce five distinct document structures',()=>{
  const found=new Map();for(let seed=0;seed<300&&found.size<5;seed++){const cv=buildEndingCV(completed(seed));found.set(cv.templateId,cv.html);}
  assert.equal(found.size,5);assert.deepEqual([...found.keys()].sort(),CV_TEMPLATES.map(x=>x.id).sort());
  assert.ok(found.get('ledger').includes('<table'));assert.ok(found.get('dossier').includes('<aside'));assert.ok(found.get('notebook').includes('cv-notebook-tab'));assert.ok(found.get('folio').includes('cv-folio-line'));assert.ok(found.get('timeline').includes('cv-timeline-body'));
});
test('untrusted names are escaped in text and attribute contexts',()=>{
  const state=completed();state.name='<img src=x onerror="alert(1)">&\'';const cv=buildEndingCV(state);
  assert.ok(!cv.html.includes('<img'));assert.ok(cv.html.includes('&lt;img'));assert.ok(cv.html.includes('&quot;'));assert.ok(cv.html.includes('&#39;'));assert.equal(cv.model.name,state.name);
});
test('early departure records actual duration without awarding unearned degrees',()=>{
  const state=createState('조용한 학생',4);state.month=15;state.ending='dropout';let cv=buildEndingCV(state);
  assert.equal(cv.model.duration,'1년 3개월');assert.equal(cv.model.education.length,1);assert.equal(cv.model.education[0].awarded,false);
  state.month=37;state.route='masters';state.ending='leave';state.history=[{month:24,kind:'route',route:'masters'}];cv=buildEndingCV(state);
  assert.deepEqual(cv.model.education.map(x=>x.degree),['bachelor',null]);assert.equal(cv.model.education[1].end,37);
});
test('integrated doctorate never invents a separate master’s award; unfinished doctorate is not awarded',()=>{
  const state=completed();state.route='integrated';state.history=state.history.filter(x=>x.kind!=='promotion');let cv=buildEndingCV(state);
  assert.deepEqual(cv.model.education.map(x=>x.degree),['bachelor','doctorate']);
  state.ending='unfinished';cv=buildEndingCV(state);assert.deepEqual(cv.model.education.map(x=>x.degree),['bachelor',null]);
});
test('bachelor and master exit snapshots use the actual exit period',()=>{
  const bachelor=createState('학생',9);bachelor.month=24;bachelor.ending='bachelor';const b=buildEndingCV(bachelor);
  assert.equal(b.model.education[0].degree,'bachelor');assert.equal(b.model.duration,'2년');
  const master=completed();master.month=54;master.ending='masters';master.history=master.history.filter(x=>x.kind!=='promotion'&&x.month<=54);const m=buildEndingCV(master);
  assert.deepEqual(m.model.education.map(x=>x.degree),['bachelor','masters']);assert.equal(m.model.education[1].end,54);
});
test('English history starts in September and retains calendar boundaries',()=>{
  const state=completed();state.locale='en';const cv=buildEndingCV(state);
  assert.equal(cv.model.duration,'8 years');assert.match(cv.model.period,/Y1 · Sep — Y8 · Aug/);assert.match(cv.html,/lang="en"/);
});
test('import validation bounds arrays, strings, enums and excludes hidden fields',()=>{
  const model=buildEndingCV(completed()).model;assert.equal(validateCVModel(model),true);assert.equal(renderCV(model),buildEndingCV(completed()).html);
  for(const mutate of [m=>{m.templateId='"><script>alert(1)</script>';},m=>{m.hidden={learning:999};},m=>{m.memories=Array(7).fill(m.memories[0]);},m=>{m.projects=Array(101).fill(m.projects[0]);},m=>{m.name='a'.repeat(129);},m=>{m.outputs.acceptedPapers=Infinity;},m=>{m.ending='gameover';}]){const invalid=structuredClone(model);mutate(invalid);assert.equal(validateCVModel(invalid),false);assert.throws(()=>renderCV(invalid),/Invalid CV snapshot/);}
});
test('rendering imported content escapes descriptions and cannot add arbitrary markup',()=>{
  const model=buildEndingCV(completed()).model;model.projects[0].title='<script>alert(1)</script>';model.memories[0].detail='<img src=x onerror="alert(1)">';
  assert.equal(validateCVModel(model),true);const html=renderCV(model);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;script&gt;'));
});
test('archived CVs use current respectful career labels while preserving their research record',()=>{
  const state=completed();state.ending='unemployed';const model=buildEndingCV(state).model;
  model.careerPath='백수 · 구직 중';
  for(const template of CV_TEMPLATES){model.templateId=template.id;const html=renderCV(model);assert.ok(!html.includes('백수'));assert.ok(html.includes('구직 중'));assert.ok(html.includes(state.name));assert.equal(model.outputs.acceptedPapers,3);}
  model.ending='resident_researcher';model.careerPath='독립하지 못한 연구원';assert.ok(!renderCV(model).includes('독립하지 못한'));assert.ok(renderCV(model).includes('교내 연구원'));
});
