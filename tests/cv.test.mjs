import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {buildEndingCV,CV_TEMPLATES,validateCVModel,renderCV,upgradeCVModel} from '../dist/cv.js';

function completed(seed=123) {
  const state=createState('김하늘',seed);state.month=96;state.route='masters';state.ending='corporate';
  state.history=[{month:24,kind:'route',route:'masters'},{month:39,kind:'submission',projectId:1},{month:42,kind:'conference',projectId:1},{month:44,kind:'paper',projectId:1},{month:48,kind:'promotion'},{month:48,kind:'sabbatical',mode:'away'},{month:60,kind:'qual',passed:true},{month:77,kind:'recommendation'},{month:96,kind:'ending',ending:'corporate'}];
  state.career={...state.career,submissions:4,papers:3,completedProjects:3,conferences:3,awards:1,recommendations:2,qual:'passed'};
  state.project={...state.project,id:4,titleIndex:3,phase:3,progress:10};return state;
}
function onlySnapshotImage(html){
  assert.equal((html.match(/<img\b/g)||[]).length,1);
  assert.match(html,/<img class="cv-lab-image" src="data:image\/svg\+xml,[^"]+" width="600" height="360" alt="[^"]*">/);
  assert.ok(!html.includes('<img src=x'));
}
test('CV generation is pure and deterministic; completed-run statistics reveal all parameters',()=>{
  const state=completed(),before=structuredClone(state),first=buildEndingCV(state),second=buildEndingCV(state);
  assert.deepEqual(first,second);assert.deepEqual(state,before);assert.equal(first.model.months,96);assert.equal(first.model.duration,'8년');
  assert.equal(first.model.outputs.acceptedPapers,3);assert.equal(first.model.outputs.submissions,4);
  assert.deepEqual(first.model.education.map(x=>x.degree),['bachelor','masters','doctorate']);
  assert.ok(first.model.memories.some(x=>x.kind==='sabbatical'));
  assert.deepEqual(first.model.statistics.student,state.hidden);assert.deepEqual(first.model.statistics.temperament,state.temperament);assert.ok(!Object.hasOwn(first.model,'hidden'));assert.ok(first.html.includes('GAME RECORD'));assert.ok(first.html.includes('실제 학위'));assert.ok(first.html.includes('<svg'));
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
  onlySnapshotImage(cv.html);assert.ok(cv.html.includes('&lt;img'));assert.ok(cv.html.includes('&quot;'));assert.ok(cv.html.includes('&#39;'));assert.equal(cv.model.name,state.name);
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
  assert.equal(validateCVModel(model),true);const html=renderCV(model);assert.ok(!html.includes('<script>'));onlySnapshotImage(html);assert.ok(html.includes('&lt;script&gt;'));
});
test('archived CVs use current respectful career labels while preserving their research record',()=>{
  const state=completed();state.ending='unemployed';const model=buildEndingCV(state).model;
  model.careerPath='백수 · 구직 중';
  for(const template of CV_TEMPLATES){model.templateId=template.id;const html=renderCV(model);assert.ok(!html.includes('백수'));assert.ok(html.includes('구직 중'));assert.ok(html.includes(state.name));assert.equal(model.outputs.acceptedPapers,3);}
  model.ending='resident_researcher';model.careerPath='독립하지 못한 연구원';assert.ok(!renderCV(model).includes('독립하지 못한'));assert.ok(renderCV(model).includes('교내 연구원'));
});

test('first academic dates come from the complete chronology, not the newest project',()=>{
  const state=completed();state.growthLegacyThrough=70;
  state.history.push({month:20,kind:'event',id:'undergraduate-contest',choice:0},
    {month:43,kind:'presentation-award',projectId:1},{month:43,kind:'event',id:'best-presentation',choice:0},
    {month:75,kind:'event',id:'best-paper',choice:0},
    {month:96,kind:'conference',projectId:9},{month:95,kind:'thesis',level:'doctorate',step:'presentation'},
    {month:96,kind:'thesis',level:'doctorate',step:'verdict',passed:true});
  state.history.reverse();
  const {model,html}=buildEndingCV(state),byId=Object.fromEntries(model.milestones.map(entry=>[entry.id,entry]));
  assert.equal(model.version,3);assert.equal(model.growthVersion,state.growthVersion);assert.equal(model.growthLegacyThrough,70);
  assert.equal(byId['first-showcase'].month,20);assert.equal(byId['first-presentation'].month,42);
  assert.equal(byId['first-presentation'].date,'4년차 8월');assert.equal(byId['first-presentation'].title,'첫 학술대회 발표');
  assert.equal(byId['first-award'].month,43);assert.equal(model.milestones.filter(entry=>entry.title.includes('수상')||entry.title==='우수발표상'||entry.title==='우수논문 선정').length,2);
  assert.equal(byId['qual-passed'].date,'6년차 3월');assert.equal(byId['thesis-doctorate-presentation'].month,95);
  assert.equal(byId['degree-doctorate'].date,'8년차 2월');assert.equal(model.memories.find(entry=>entry.kind==='conference').title,'학술발표를 마치다');
  assert.ok(html.indexOf('첫 학술대회 발표')<html.indexOf('SIMULATION REPORT'));
});
test('observing an undergraduate showcase does not invent a poster presentation',()=>{
  const state=completed();state.history.push({month:20,kind:'event',id:'undergraduate-contest',choice:1});
  assert.ok(!buildEndingCV(state).model.milestones.some(entry=>entry.id==='first-showcase'));
});
test('named manuscript list retains every paper, status, journal and actual submission/acceptance date',()=>{
  const state=completed();state.professorProfile.fieldId='058';state.professorProfile.labMode='dry';
  state.history=state.history.filter(entry=>!['submission','paper','conference'].includes(entry.kind));
  for(let id=1;id<=5;id++){
    const journal=id===2?'kci':'standard';
    state.history.push({month:30+id*6,kind:'submission',projectId:id,projectTitle:`논문 제목 ${id}`,journal,impactFactor:2.8},
      {month:33+id*6,kind:'paper',projectId:id,projectTitle:`논문 제목 ${id}`,journal,impactFactor:2.8},
      {month:90+id,kind:'conference',projectId:id});
  }
  state.history.push({month:93,kind:'submission',projectId:6,projectTitle:'검토 중인 원고',journal:'established',impactFactor:4.7},
    {month:95,kind:'revision',projectId:6});
  state.project={...state.project,id:6,phase:5,submitted:true,submittedAt:93,revisions:1};
  state.career.papers=5;state.career.submissions=6;state.career.completedProjects=5;
  const {model,html}=buildEndingCV(state),papers=model.publications;
  assert.equal(papers.length,6);assert.equal(papers[0].title,'검토 중인 원고');assert.equal(papers[0].status,'revision');assert.equal(papers[0].acceptedMonth,null);
  const second=papers.find(paper=>paper.id===2);assert.equal(second.journal,'kci');assert.equal(second.impactFactor,undefined);
  assert.equal(second.submittedMonth,42);assert.equal(second.acceptedMonth,45);
  for(let id=1;id<=5;id++)assert.ok(html.includes(`논문 제목 ${id}`));
  assert.ok(html.includes('전체 6편'));assert.ok(html.includes('수정 후 재심사'));assert.ok(html.includes('국내 등재지'));
  assert.ok(html.indexOf('전체 연구 논문 및 투고 기록')<html.indexOf('SIMULATION REPORT'));
});
test('old CV archives retain titles and stored IF without guessing missing dates or first experiences',()=>{
  const model=buildEndingCV(completed()).model;model.version=2;
  for(const key of ['publications','milestones','growthVersion','growthLegacyThrough','labScene'])delete model[key];
  const paper=model.projects[0];paper.title='보존된 기존 논문명';paper.journal='standard';paper.impactFactor=2.8;
  delete paper.submittedMonth;delete paper.acceptedMonth;
  model.memories=[{month:96,date:'8년차 2월',kind:'conference',title:'연구를 처음 밖으로 꺼내다',detail:'프로젝트 9의 발표'}];
  const before=structuredClone(model);assert.ok(validateCVModel(model));
  const html=renderCV(model);assert.deepEqual(model,before);assert.ok(html.includes('보존된 기존 논문명'));assert.ok(html.includes('가상 IF 2.8'));
  assert.ok(html.includes('투고 시점 미기록'));assert.ok(html.includes('게재 확정 시점 미기록'));
  assert.ok(!html.includes('연구를 처음 밖으로 꺼내다'));assert.ok(html.includes('기록된 학술발표'));
  assert.ok(!html.includes('cv-lab-image'));assert.ok(!Object.hasOwn(model,'labScene'));
  model.version=1;for(const key of ['advisor','statistics','impact'])delete model[key];assert.ok(validateCVModel(model));assert.ok(renderCV(model).includes('보존된 기존 논문명'));
});
test('new manuscript and milestone snapshots validate bounds and escape all imported prose',()=>{
  const model=buildEndingCV(completed()).model;
  for(const mutate of [m=>{m.publications[0].acceptedMonth=97;},m=>{m.publications[0].submittedMonth=90;},m=>{m.publications[0].journal='javascript:';},m=>{m.publications.push({...m.publications[0]});},m=>{m.milestones[0].html='<img>';},m=>{m.milestones.push({...m.milestones[0]});},m=>{m.growthLegacyThrough=97;}]){
    const invalid=structuredClone(model);mutate(invalid);assert.equal(validateCVModel(invalid),false);assert.throws(()=>renderCV(invalid),/Invalid/);
  }
  model.publications[0].title='<img src=x onerror="alert(1)">';model.milestones[0].detail='<script>alert(1)</script>';
  assert.ok(validateCVModel(model));const html=renderCV(model);onlySnapshotImage(html);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;img'));
});
test('matching full save restores old CV first dates while retaining every archived score, title and IF',()=>{
  const state=completed();state.growthLegacyThrough=96;
  state.history.push({month:96,kind:'conference',projectId:9});
  const old=buildEndingCV(state).model;old.version=2;for(const key of ['publications','milestones','growthVersion','growthLegacyThrough','labScene'])delete old[key];
  old.projects[0].title='기존에 보관된 논문명';old.projects[0].journal='standard';old.projects[0].impactFactor=2.8;
  delete old.projects[0].submittedMonth;old.statistics.student.learning=789;
  old.memories=[{month:96,date:'8년차 2월',kind:'conference',title:'연구를 처음 밖으로 꺼내다',detail:'프로젝트 9의 발표'}];
  const before=structuredClone(old),savedBefore=structuredClone(state),upgraded=upgradeCVModel(old,state);
  assert.equal(upgraded.version,3);assert.deepEqual(old,before);assert.deepEqual(state,savedBefore);
  assert.deepEqual(upgraded.statistics,old.statistics);assert.deepEqual(upgraded.outputs,old.outputs);assert.equal(upgraded.templateId,old.templateId);
  assert.equal(upgraded.publications.find(paper=>paper.id===1).title,'기존에 보관된 논문명');assert.equal(upgraded.publications.find(paper=>paper.id===1).impactFactor,2.8);
  assert.equal(upgraded.publications.find(paper=>paper.id===1).submittedMonth,39);assert.equal(upgraded.milestones.find(entry=>entry.id==='first-presentation').month,42);
  assert.equal(upgraded.growthLegacyThrough,96);assert.ok(validateCVModel(upgraded));assert.ok(!renderCV(upgraded).includes('연구를 처음 밖으로 꺼내다'));
  assert.ok(!Object.hasOwn(upgraded,'labScene'));assert.ok(!renderCV(upgraded).includes('cv-lab-image'));
  for(const other of [{...state,name:'다른 학생'},{...state,month:95},{...state,ending:'postdoc'},{...state,history:[]},{...state,professorProfile:{...state.professorProfile,fieldId:'048'}}])assert.equal(upgradeCVModel(old,other),old);
});
