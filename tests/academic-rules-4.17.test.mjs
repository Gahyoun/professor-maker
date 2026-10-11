import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,proposeSchedule,decide,calendarMonth,doctoralPhase,salaryBase,mastersEligible} from '../dist/engine.js';
import {publicationMetric} from '../dist/venues.js';

const queued=(s,month)=>{const n=structuredClone(s);n.month=month-1;n.sabbatical.start=24;const r=simulateMonth(n,proposeSchedule(n));return [r.pending,...r.pendingQueue].filter(p=>p?.kind==='thesis').map(p=>`${p.level}:${p.step}`);};

test('thesis reviews run in the semester before conferral (Sep draft, Nov defense, Dec verdict)',()=>{
 const masters=createState('김민지',6);masters.route='masters';
 assert.deepEqual(queued(masters,42),['masters:draft']);assert.equal(calendarMonth(42),9);
 assert.deepEqual(queued(masters,44),['masters:presentation']);assert.equal(calendarMonth(44),11);
 assert.deepEqual(queued(masters,45),['masters:verdict']);assert.equal(calendarMonth(45),12);
 for(const month of [46,47,48])assert.deepEqual(queued(masters,month),[],`no master thesis step in ${calendarMonth(month)}월`);
 const extended={...structuredClone(masters),mastersExtended:true,mastersReviewAt:54};
 assert.deepEqual([49,50,51].map(m=>queued(extended,m)[0]),['masters:draft','masters:presentation','masters:verdict']);
 assert.deepEqual([49,50,51].map(m=>calendarMonth(m)),[4,5,6]);
 const doctoral=createState('김민지',6);doctoral.route='integrated';
 assert.deepEqual([90,92,93].map(m=>queued(doctoral,m)[0]),['phd:draft','phd:presentation','phd:verdict']);
 assert.deepEqual([90,92,93].map(m=>calendarMonth(m)),[9,11,12]);
});

test('the March master decision follows a failed December verdict',()=>{
 const s=createState('김민지',6);s.route='masters';s.month=48;
 s.career={...s.career,submissions:5,papers:5,conferences:5};
 assert.ok(mastersEligible(s));
 s.history.push({month:45,kind:'thesis',level:'masters',step:'verdict',choice:'confirm',passed:false});
 assert.equal(mastersEligible(s),false,'work finished after a failed verdict needs the extension semester');
});

test('integrated students count as master\'s students for four semesters (stipend and military training)',()=>{
 const s=createState('김준영',3,{gender:'male'});s.route='integrated';
 for(const [month,doctoral,base] of [[30,false,22],[47,false,22],[48,true,30],[70,true,30]]){s.month=month;assert.equal(doctoralPhase(s),doctoral,String(month));assert.equal(salaryBase(s),base,String(month));}
 const m=createState('김준영',3,{gender:'male'});m.route='masters';m.month=40;assert.equal(salaryBase(m),22);assert.equal(doctoralPhase(m),false);
 m.month=50;assert.equal(doctoralPhase(m),true);assert.equal(salaryBase(m),30);
 const early=createState('김준영',3,{gender:'male'});early.route='masters';early.month=36;early.pending={kind:'service'};
 assert.throws(()=>decide(early,'training'),/doctoral-stage/);
 const ok=decide(early,'consult');assert.equal(ok.service.trainingStartMonth,undefined);
});

test('the domestic venue is labelled without a real index name',()=>{
 assert.equal(publicationMetric('kci',null),'국내 등재지 · 가상 학술지');
 assert.doesNotMatch(publicationMetric('kci',null),/KCI/);
});
