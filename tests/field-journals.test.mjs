import test from 'node:test';import assert from 'node:assert/strict';
import {DISCIPLINES} from '../dist/disciplines.js';
import {getJournal,journalProfile,journalOptions,publicationMetric} from '../dist/venues.js';
import {createState,simulateMonth,validateSave,migrateSave} from '../dist/engine.js';
import {buildEndingCV,validateCVModel,renderCV} from '../dist/cv.js';
import {advanceImpact} from '../dist/impact.js';
test('all fields resolve ordered fictional IFs; cross-field scale does not change tier difficulty',()=>{
 for(const d of DISCIPLINES){const profile=journalProfile(d.id),values=['standard','established','leading'].map(id=>getJournal(id,d.id).impactFactor);assert.ok(values.every(v=>Number.isFinite(v)&&v>0),d.label);assert.ok(values[0]<values[1]&&values[1]<values[2]);assert.equal(profile.id!=='physics'||['050','087'].includes(d.id),true,`unmapped ${d.id}`);assert.equal(getJournal('leading',d.id).work,1.3);}
 assert.deepEqual(['standard','established','leading'].map(id=>getJournal(id,'050').impactFactor),[1.8,4.2,8]);assert.ok(getJournal('leading','048').impactFactor<getJournal('leading','107').impactFactor);assert.equal(getJournal('leading','048').citationWeight,getJournal('leading','107').citationWeight);
 for(const id of ['072','074','076','112','109'])assert.ok(journalOptions(id).some(([id])=>id==='kci'));assert.ok(!journalOptions('050').some(([id])=>id==='kci'));
});
function submittedState(fieldId,journal){const s=createState('',6,{fieldId});s.month=12;s.publication.journal=s.project.journal=journal;s.project.phase=5;s.project.submitted=true;s.project.submittedAt=11;s.project.reviewMonths=1;s.career.submissions=1;s.history.push({month:11,kind:'submission',projectId:1,journal,impactFactor:getJournal(journal,fieldId).impactFactor});s.hidden.research=s.hidden.language=999;s.hidden.luck=100;return s;}
test('KCI accepts and persists as a publication without inventing an IF, including CV and save import',()=>{
 let accepted;for(let seed=1;seed<20;seed++){const s=submittedState('072','kci');s.seed=seed;assert.ok(validateSave(s));const next=simulateMonth(s,['rest','rest','rest','rest']);if(next.career.papers){accepted=next;break;}}
 assert.ok(accepted);const paper=accepted.history.find(h=>h.kind==='paper');assert.equal(paper.journal,'kci');assert.equal(paper.impactFactor,null);assert.equal(paper.citationWeight,.035);assert.equal(accepted.career.topPapers,0);assert.ok(migrateSave(accepted));
 accepted.pending=null;accepted.pendingQueue=[];accepted.ending='leave';const cv=buildEndingCV(accepted);assert.ok(validateCVModel(cv.model));assert.equal(cv.model.projects[0].impactFactor,undefined);assert.match(cv.html,/국내 등재지/);assert.ok(!cv.html.includes('IF null'));assert.match(renderCV(cv.model),/국내 등재지/);
 const invalid=createState('',6,{fieldId:'050'});invalid.project.journal=invalid.publication.journal='kci';assert.equal(validateSave(invalid),false);const bad=structuredClone(accepted);bad.history.find(h=>h.kind==='paper').impactFactor=500;assert.equal(validateSave(bad),false);
});
test('field IF snapshots survive CV rendering and older paper histories keep their recorded values',()=>{
 const s=createState('',6,{fieldId:'048'});s.month=24;s.ending='bachelor';s.career.papers=s.career.completedProjects=s.career.submissions=2;s.history=[{month:12,kind:'paper',projectId:1,journal:'leading',impactFactor:3.5},{month:18,kind:'paper',projectId:2,journal:'standard',impactFactor:1.8}];const cv=buildEndingCV(s);assert.match(cv.html,/가상 IF 3.5/);assert.match(cv.html,/가상 IF 1.8/);assert.ok(validateCVModel(cv.model));assert.equal(publicationMetric('kci',null),'국내 등재지 · 가상 학술지');
});
test('citation visibility is normalized to the within-field tier rather than the raw field IF',()=>{
 const a=createState('',6,{fieldId:'048'}),b=structuredClone(a);for(const s of [a,b]){s.career.papers=1;s.impact={citations:[0],hIndex:0};s.history=[{kind:'paper',journal:'leading',impactFactor:s===a?3.5:14,citationWeight:.12}];}
 for(let month=1;month<70;month++){a.month=b.month=month;advanceImpact(a);advanceImpact(b);assert.deepEqual(a.impact,b.impact);}
});
