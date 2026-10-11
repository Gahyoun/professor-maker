import test from 'node:test';
import assert from 'node:assert/strict';
import {DISCIPLINES,degreeTargets} from '../dist/disciplines.js';
import {getJournal,JOURNALS} from '../dist/venues.js';
import {publicationPaceProfile,publicationProgressFactor} from '../dist/publication-pace.js';
import {createState,simulateMonth,migrateSave,validateSave,projectThresholds,trueRequirements,isTrueEnding,canDefend,HIDDEN_RANGES} from '../dist/engine.js';
const copy=structuredClone;
function setScore(s,key,value){const [low,high]=HIDDEN_RANGES[key];s.hidden[key]=low+(high-low)*value/100;}
function clearDecisions(s){s.pending=null;s.pendingQueue=[];return s;}
const rest=s=>clearDecisions(simulateMonth(s,['rest','rest','rest','rest'],{attendance:{domestic:'none',overseas:'none'}}));
function submit(fieldId='048',journal='standard'){
 const s=createState('학생',2,{gender:'female',fieldId});s.month=2;s.project.phase=4;s.project.progress=100;s.publication.journal=s.project.journal=journal;
 return rest(s);
}
test('field pacing is bounded and read-only across every supported major',()=>{
 for(const d of DISCIPLINES){const s=createState('학생',7,{fieldId:d.id,labMode:d.labModes[0]}),before=JSON.stringify(s),p=publicationPaceProfile(s);
  assert.equal(p.phaseEffort.length,5);assert.ok(p.phaseEffort.every(x=>x>=1&&x<=1.5),d.label);assert.ok(p.reviewDelay>=0&&p.reviewDelay<=2);assert.ok(p.acceptanceAdjustment<=0&&p.acceptanceAdjustment>=-.04);
  for(let phase=0;phase<5;phase++)assert.ok(publicationProgressFactor(s,phase)>0&&publicationProgressFactor(s,phase)<1);
  assert.equal(JSON.stringify(s),before);assert.ok(validateSave(s));
 }
 assert.ok(publicationProgressFactor('048',2)<publicationProgressFactor('056',2));
 assert.ok(publicationProgressFactor('056',2)<publicationProgressFactor('050',2));
 assert.equal(publicationPaceProfile('090').id,'computing');
});
test('future mathematical proof work is slower while existing work and success draws remain intact',()=>{
 const general=createState('학생',11,{gender:'female'});general.month=26;general.route='integrated';general.project.phase=2;general.project.progress=5;
 for(const key of ['stamina','research','learning','intuition','rapport'])setScore(general,key,90);general.hidden.motivation=95;
 const math=copy(general);math.professorProfile.fieldId='048';
 assert.deepEqual(projectThresholds(math),projectThresholds(general));
 const a=simulateMonth(general,['analysis','rest','rest','rest']),b=simulateMonth(math,['analysis','rest','rest','rest']);
 const x=a.lastReport.results[0],y=b.lastReport.results[0];assert.equal(x.performed,true);assert.equal(y.performed,true);assert.equal(x.successRate,y.successRate);assert.equal(x.researchGrade,y.researchGrade);
 assert.ok(x.progress>y.progress);assert.ok(Math.abs(y.progress/x.progress-1/1.5)<1e-12);
 assert.equal(general.project.progress,5);assert.equal(math.project.progress,5);assert.ok(validateSave(a)&&validateSave(b));
 const migrated=migrateSave(math);assert.equal(migrated.project.progress,5);assert.equal(migrated.project.phase,2);assert.deepEqual(projectThresholds(migrated),projectThresholds(math));
});
test('new submissions snapshot field-specific review duration without changing journal tier work or IF',()=>{
 for(const [fieldId,months] of [['048',4],['049',3],['050',2],['056',3],['073',2],['090',2]]){
  const s=submit(fieldId);assert.equal(s.project.submitted,true);assert.equal(s.project.reviewDuration,months);assert.equal(s.project.reviewDifficulty,getJournal('standard',fieldId).acceptance);assert.equal(s.project.reviewMonths,0);assert.ok(validateSave(s));
  const loaded=migrateSave(s);assert.equal(loaded.project.reviewDuration,months);assert.equal(loaded.project.reviewDifficulty,s.project.reviewDifficulty);assert.equal(loaded.history.find(h=>h.kind==='submission').impactFactor,s.history.find(h=>h.kind==='submission').impactFactor);
  assert.equal(getJournal('leading',fieldId).work,1.3);
 }
 assert.equal(submit('048','leading').project.reviewDuration,5);assert.equal(submit('056','leading').project.reviewDuration,4);
});
test('math review cannot produce a paper before four completed review months',()=>{
 let s=submit();const recorded=s.history.find(h=>h.kind==='submission').impactFactor;
 for(let month=1;month<=3;month++){s=rest(s);assert.equal(s.career.papers,0);assert.equal(s.project.reviewMonths,month);assert.equal(s.project.progress,24*month/4);assert.ok(validateSave(s));}
 s=rest(s);assert.ok(s.history.some(h=>['paper','revision'].includes(h.kind)));assert.equal(s.history.filter(h=>h.kind==='paper').every(h=>h.impactFactor===recorded),true);assert.ok(validateSave(s));
});
test('already submitted old saves keep the previous review period and historical metric',()=>{
 let old=submit();delete old.project.reviewDuration;delete old.project.reviewDifficulty;
 old.history.find(h=>h.kind==='submission').impactFactor=9.7;const history=copy(old.history);assert.ok(validateSave(old));old=migrateSave(old);assert.deepEqual(old.history,history);
 old=rest(old);assert.equal(old.project.reviewMonths,1);assert.equal(old.career.papers,0);old=rest(old);
 assert.ok(old.history.some(h=>['paper','revision'].includes(h.kind)));const paper=old.history.find(h=>h.kind==='paper');if(paper)assert.equal(paper.impactFactor,9.7);
 assert.equal(JOURNALS.standard.reviewMonths,2);assert.ok(validateSave(old));
});
test('a rejected submission retains its review contract and metric through revision and reload',()=>{
 let rejected;
 for(let seed=1;seed<40&&!rejected;seed++){
  let s=submit();s.seed=seed;setScore(s,'research',0);setScore(s,'language',0);s.hidden.luck=0;
  for(let i=0;i<4;i++)s=rest(s);
  if(s.project.revisions)rejected=s;
 }
 assert.ok(rejected);assert.equal(rejected.project.reviewMonths,0);assert.equal(rejected.project.reviewDuration,4);assert.equal(rejected.project.reviewDifficulty,-.04);assert.equal(rejected.project.submitted,true);
 const loaded=migrateSave(rejected);assert.deepEqual(loaded.project,rejected.project);assert.equal(rest(loaded).project.reviewMonths,1);
});
test('malformed or incomplete review snapshots are rejected but legacy snapshots remain valid',()=>{
 const s=submit();assert.ok(validateSave(s));
 for(const mutate of [p=>p.reviewDuration=0,p=>p.reviewDuration=13,p=>p.reviewDuration=2.5,p=>p.reviewDifficulty=.1,p=>p.reviewDifficulty=-1,p=>delete p.reviewDuration,p=>delete p.reviewDifficulty,p=>p.submitted=false]){const bad=copy(s);mutate(bad.project);assert.equal(validateSave(bad),false);}
 const old=copy(s);delete old.project.reviewDuration;delete old.project.reviewDifficulty;assert.ok(validateSave(old));
});
test('lower-volume mathematics has a matching doctorate and faculty path without relaxing preparation',()=>{
 assert.deepEqual(degreeTargets('048','phd'),{submissions:2,papers:2,conferences:3});assert.deepEqual(degreeTargets('048','masters'),{submissions:1,papers:0,conferences:1});assert.deepEqual(degreeTargets('050','phd'),{submissions:3,papers:3,conferences:3});assert.deepEqual(degreeTargets('090','phd'),{submissions:1,papers:1,conferences:4});
 const s=createState('학생',7,{gender:'female',fieldId:'048'});s.month=96;s.route='integrated';s.career.qual='passed';
 for(const [key,value] of Object.entries(trueRequirements(s))){if(key in s.hidden)setScore(s,key,value);else if(key in s.career)s.career[key]=value;else for(const k of Object.keys(s.professor))s.professor[k]=value;}
 s.career.submissions=s.career.completedProjects=s.career.papers=2;s.career.topPapers=1;s.impact={citations:[2,2],hIndex:2};assert.ok(canDefend(s));assert.ok(isTrueEnding(s));
 for(const mutate of [x=>x.career.topPapers=0,x=>x.impact={citations:[1,1],hIndex:1},x=>x.career.recommendations=2,x=>x.career.conferences=2,x=>x.career.papers=1]){const bad=copy(s);mutate(bad);assert.equal(isTrueEnding(bad),false);}
 const physics=copy(s);physics.professorProfile.fieldId='050';assert.equal(canDefend(physics),false);assert.equal(isTrueEnding(physics),false);assert.equal(trueRequirements(physics).papers,3);
});
