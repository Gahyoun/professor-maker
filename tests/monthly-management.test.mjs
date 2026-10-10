import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,proposeSchedule,validateSave,migrateSave,isTrueEnding,TRUE_REQUIREMENTS,HIDDEN_RANGES,EVENTS,failureRun} from '../dist/engine.js';
import {grantCallOpen,canApplyGrant} from '../dist/funding.js';
import {roomScene,conferenceHall,figureType} from '../dist/lab-scene.js';
import {studentAppearance,renderPortrait} from '../dist/appearance.js';
import {getEndingPages} from '../dist/stories.js';
import {endingStatistics} from '../dist/statistics.js';
import {validRecord} from '../backend/api.js';
import {managedOptions} from './play-support.mjs';
const clone=structuredClone;
const rest=['rest','rest','rest','rest'];
const choices={'monthly-issue':'acknowledge','conference-plan':'none','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',event:0,route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
function resolve(s){for(let i=0;s.pending&&!s.ending;i++){assert.ok(i<20);const p=s.pending;s=decide(s,choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step]);}return s;}
function pending(s){return [s.pending,...s.pendingQueue].filter(Boolean);}
test('sabbatical scheduling covers years 3–7 deterministically and never repeats',()=>{
 const years=new Set();for(let seed=1;seed<=30;seed++){let s=createState('학생',seed,{gender:'female'});years.add(s.sabbatical.start/12+1);const start=s.sabbatical.start;s.month=start-1;s.route='integrated';const before=s.seed;
 const n=simulateMonth(s,rest);assert.ok(pending(n).some(p=>p.kind==='sabbatical'));assert.equal(s.seed,before);assert.equal(s.sabbatical.start,start);
 s=n;while(s.pending&&s.pending.kind!=='sabbatical')s=decide(s,choices[s.pending.kind]??'exam');const chosen=decide(s,'home');assert.equal(chosen.sabbatical.until,start+12);assert.equal(chosen.history.filter(h=>h.kind==='sabbatical').length,1);
 const old=clone(chosen);delete old.sabbatical.start;assert.equal(migrateSave(old).sabbatical.start,start);assert.equal(old.sabbatical.start,undefined);
 const repeat=createState('학생',seed,{gender:'female'});repeat.month=start-1;repeat.route='integrated';repeat.history=[{month:start-12,kind:'sabbatical',mode:'home'}];assert.ok(!pending(simulateMonth(repeat,rest)).some(p=>p.kind==='sabbatical'));
 }assert.deepEqual([...years].sort(),[3,4,5,6,7]);
});
test('accepting proposals and free time affect rapport each month; ignore streaks add gentle loss',()=>{
 const s=createState('학생',33),proposal=proposeSchedule(s),accepted=simulateMonth(s,proposal,{proposal}),free=simulateMonth(s,proposal.map(()=> 'free'),{proposal}),ignored=simulateMonth(s,proposal.map(()=> 'language'),{proposal});
 assert.equal(accepted.lastReport.scheduleDiscussion.acceptance,1);assert.equal(free.lastReport.scheduleDiscussion.acceptance,1);assert.equal(ignored.lastReport.scheduleDiscussion.acceptance,0);assert.ok(accepted.lastReport.scheduleDiscussion.rapportChange>ignored.lastReport.scheduleDiscussion.rapportChange);
 let n=s;for(let month=0;month<6;month++)n=resolve(simulateMonth(n,proposeSchedule(n),managedOptions(n)));assert.ok(n.history.some(h=>h.kind==='advising-habit'&&h.habit==='repeated-skip'));
});
test('undergraduate proposals emphasize course work and graduates respond to actual prior work',()=>{
 const u=createState('학생',35);assert.equal(proposeSchedule(u).slice(0,2).filter(x=>x==='coursework').length,2);
 const g=clone(u);g.month=30;g.route='integrated';g.project.phase=2;assert.ok(proposeSchedule(g).slice(0,2).some(x=>['experiment','study','analysis'].includes(x)));
 g.lastReport={results:[{actual:'analysis',performed:true,successRate:.8},{actual:'experiment',performed:true,successRate:.2}]};assert.equal(proposeSchedule(g)[0],'analysis');assert.equal(proposeSchedule(g)[1],'study');
});
test('course work can fail; three consecutive failed weeks unlock distinct counseling responses',()=>{
 let failed=false;for(let seed=1;seed<60;seed++){const s=createState('학생',seed);s.hidden.learning=1;const n=simulateMonth(s,Array(4).fill('coursework'));if(n.lastReport.results.some(r=>r.scienceFailures>0)){failed=true;assert.ok(n.lastReport.results.every(r=>r.progress===0));assert.ok(n.lastReport.results.filter(r=>r.performed).every(r=>r.weight===0));}}
 assert.ok(failed);
 const s=createState('학생',11);s.month=10;s.history=[{month:9,kind:'month',results:Array(3).fill({actual:'coursework',performed:false,scienceFailures:1})}];assert.equal(failureRun(s),3);assert.ok(pending(simulateMonth(s,rest)).some(p=>p.kind==='failure-counsel'));
 s.pending={kind:'failure-counsel'};const before=clone(s),support=decide(s,'support'),strict=decide(s,'strict');assert.deepEqual(s,before);assert.ok(support.hidden.stress<strict.hidden.stress);assert.ok(support.hidden.rapport>strict.hidden.rapport);assert.ok(strict.hidden.diligence>support.hidden.diligence);assert.throws(()=>decide(s,'invented'));
});
test('salary is locked outside March and publicity spending is rejected; old saves migrate safely',()=>{
 const s=createState('학생',25);s.month=1;const changed={...s.lab.budget,salary:75};assert.throws(()=>simulateMonth(s,rest,{budget:changed}),/March/);assert.throws(()=>simulateMonth(s,rest,{budget:{...s.lab.budget,publicity:1}}),/Publicity/);
 s.month=12;assert.equal(simulateMonth(s,rest,{budget:changed}).stipendLock,75);const old=clone(s);delete old.stipendLock;old.lab.budget.publicity=3;const migrated=migrateSave(old);assert.equal(migrated.lab.budget.publicity,0);assert.equal(old.lab.budget.publicity,3);
});
test('normal finance needs planning while institute support remains easier, and limited funds are actionable',()=>{
 const normal=createState('학생',16),easy=createState('학생',16,{institution:'institute'});assert.ok(normal.lab.funds<easy.lab.funds/2);
 for(const s of [normal,easy]){s.month=12;s.grants.reportYears=[1];}const n=simulateMonth(normal,rest),e=simulateMonth(easy,rest);assert.ok(n.grants.annualAmount<e.grants.annualAmount/2);
 const s=createState('학생',16);s.month=2;assert.equal(grantCallOpen(s),false);s.lab.funds=70;assert.equal(grantCallOpen(s),true);const options=managedOptions(s);assert.equal(options.facultyAction,'funding');assert.equal(options.budget.performance,0);assert.ok(validateSave(simulateMonth(s,proposeSchedule(s),options)));
});
test('grant selection and rejection become acknowledged issues; no repeated deposits on reading',()=>{
 let awarded=false,rejected=false;for(let seed=1;seed<=20;seed++){let s=createState('학생',seed);s=simulateMonth(s,proposeSchedule(s),{facultyAction:'funding'});const decision=s.history.find(h=>h.kind==='portfolio-selection');assert.ok(decision);const id=decision.awarded?'grant-selected':'grant-rejected';awarded||=decision.awarded;rejected||=!decision.awarded;assert.ok(pending(s).some(p=>p.kind==='monthly-issue'&&p.id===id));while(s.pending&&s.pending.kind!=='monthly-issue')s=decide(s,choices[s.pending.kind]);const funds=s.lab.funds,pool=s.lab.pool;s=decide(s,'acknowledge');assert.equal(s.lab.funds,funds);assert.equal(s.lab.pool,pool);}
 assert.ok(awarded&&rejected);
});
test('conference attendance planning is a month ahead and invalid overseas student travel is blocked',()=>{
 let s=simulateMonth(createState('학생',16),rest);assert.ok(pending(s).some(p=>p.kind==='conference-plan'&&p.scope==='domestic'));
 s=createState('학생',16);s.month=1;s.pending={kind:'conference-plan',scope:'domestic'};for(const choice of ['none','professor','student','together'])assert.equal(decide(s,choice).attendance.domestic,choice);
 s.pending={kind:'conference-plan',scope:'overseas'};assert.throws(()=>decide(s,'student'));assert.equal(decide(s,'professor').attendance.overseas,'professor');
});
test('all ordinary situations offer 3–4 responses and analytics reject out-of-bounds choices',()=>{
 for(const event of EVENTS)assert.ok(event.options.length>=3&&event.options.length<=4,event.id);
 const s=createState('학생',4),base={month:1,plan:s.plan,feedback:'listen',policies:s.policies,stipend:60,student:s.hidden,faculty:s.professor,outputs:{papers:0,submissions:0,conferences:0,awards:0,completedProjects:0},ending:null,events:[]};
 const event=EVENTS.find(e=>e.options.length===4);assert.equal(validRecord({...base,events:[{id:event.id,choice:3}]}),true);assert.equal(validRecord({...base,events:[{id:event.id,choice:4}]}),false);
});
test('true ending additionally requires strong published work, awards and citation visibility',()=>{
 const s=createState('학생',4);s.month=96;s.route='integrated';s.career={...s.career,qual:'passed',papers:8,submissions:8,conferences:7,topPapers:2,awards:2,recommendations:4};s.impact={citations:Array(8).fill(8),hIndex:8};for(const [key,value] of Object.entries(TRUE_REQUIREMENTS)){if(key in s.hidden){const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+(hi-lo)*value/100;}else if(key in s.career)s.career[key]=value;else Object.keys(s.professor).forEach(k=>s.professor[k]=value);}
 assert.equal(isTrueEnding(s),true);for(const [key,value] of [['topPapers',1],['awards',1]]){const low=clone(s);low.career[key]=value;assert.equal(isTrueEnding(low),false);}const low=clone(s);low.impact={citations:Array(8).fill(4),hIndex:4};assert.equal(isTrueEnding(low),false);
});
test('email combinations use personality, final state and field without changing saved data or RNG',()=>{
 const s=createState('학생',77);s.ending='institute';s.month=96;const context={statistics:endingStatistics(s),fieldId:'048',labMode:'dry'},before=clone(context);const a=getEndingPages('institute','ko','close','학생',null,[],context);
 const b=clone(context);b.statistics.temperament={caution:90,curiosity:10,expression:10};const c=clone(context);c.statistics.student.stress=90;const d={...clone(context),fieldId:'055',labMode:'wet'};
 for(const variant of [b,c,d])assert.notDeepEqual(getEndingPages('institute','ko','close','학생',null,[],variant),a);assert.deepEqual(context,before);assert.equal(getEndingPages('corporate','ko','close','학생',null,[],context).join('').includes('냉동고'),false);assert.ok(!a.join('').includes('실험'));assert.ok(a.join('').includes('수학'));
});
test('room layouts and sixteen distinct fringes are cosmetic, escape labels and preserve RNG',()=>{
 const s=createState('학생',77),before=clone(s),halls=new Set();for(let m=0;m<16;m++)halls.add(conferenceHall({...s,month:m}));assert.equal(halls.size,4);assert.equal(figureType({...s,professorProfile:{...s.professorProfile,fieldId:'048'}}),'equation');assert.equal(figureType({...s,professorProfile:{...s.professorProfile,fieldId:'055'}}),'spectrum');
 const a={...studentAppearance(77,'female'),hairLength:5};const fringes=new Set(Array.from({length:16},(_,fringe)=>renderPortrait({...a,fringe})));assert.equal(fringes.size,16);assert.ok([...fringes].every(svg=>svg.includes('160 248')&&svg.includes('hair-fringe')));assert.ok(!renderPortrait(a,'<img>').includes('<img>'));assert.ok(roomScene(s).includes('data-props'));assert.deepEqual(s,before);
});
test('well prepared graduate presentations can earn awards and appear as important issues',()=>{
 let awards=0;for(let seed=1;seed<=60;seed++){
 const s=createState('학생',seed);s.month=25;s.route='integrated';s.project.phase=3;s.project.progress=20;s.hidden.language=950;s.hidden.research=950;s.hidden.motivation=100;s.hidden.stamina=999;s.hidden.stress=30;
 const n=simulateMonth(s,['language','language','conference','free']);if(n.history.some(h=>h.kind==='presentation-award')){awards++;assert.equal(n.lastReport.results[2].outcome,'presented');assert.ok(pending(n).some(p=>p.id==='presentation-award'));assert.ok(n.career.awards>0);}
 const poor=clone(s);poor.hidden.language=1;assert.ok(!simulateMonth(poor,['language','language','conference','free']).history.some(h=>h.kind==='presentation-award'));
 }assert.ok(awards>3&&awards<50);
});
test('high rapport makes voluntary internal progression more likely after encouragement',()=>{
 let close=0,distant=0;for(let seed=1;seed<=100;seed++){
 const s=createState('학생',seed);s.month=24;s.pending={kind:'external-admission',level:'bachelor'};s.career.papers=s.career.submissions=s.career.completedProjects=2;s.career.topPapers=1;s.project.id=3;s.hidden.research=800;s.hidden.language=800;s.impact={citations:[4,4],hIndex:2};
 for(const [rapport,counter] of [[90,'close'],[-80,'distant']]){const candidate=clone(s);candidate.hidden.rapport=rapport;const n=decide(candidate,'encourage');if(!n.ending){if(counter==='close')close++;else distant++;assert.ok(pending(n).some(p=>p.id==='internal-admission'));}else assert.equal(n.ending,'external_masters');}
 }assert.ok(close>distant+25,{close,distant});
});
