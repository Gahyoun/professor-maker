import {DILEMMAS,dilemmaOptions,monthlyIssueOptions} from "./monthly-choices.js";
import {mergeRelationship,scoreAfterChange} from './relationship.js';
import {chooseTopic,validTopicId,topicById} from './research-topics.js';
import {JOURNALS,CONFERENCE_TIERS,DEFAULT_PUBLICATION,validPublication,getJournal,isAvailableJournal} from './venues.js';
import {academicWeeks,weekContext,examWindow} from './academic-calendar.js';
import {CHAPTERS,THESIS_STEPS} from './main-story.js';
import {initialTravel,validTravel,abstractAcceptance,canTravel,studentAttends,conferenceCosts} from './travel.js';
import {facultyCapacity,allocateCredits,INSTITUTION_RULES,professorAge} from './workload.js';
import {initialImpact,advanceImpact,validImpact,externalAdmissionEligible} from './impact.js';
import {grantCallOpen,ensureFunding,validPortfolio,canApplyGrant,validApplication,depositGrant,advancePortfolio,seededInitialFunding,migrateFinance,validFinance,fundingResults,validFundingResults} from './funding.js';
import {GAME_BALANCE as BALANCE} from './balance.js';
// Monthly, seeded simulation. Student ability values are intentionally hidden by the UI.
import { EVENTS } from './events.js';
import { initialGrants, advanceGrants, validateGrants } from './grants.js';
import { getDiscipline, degreeTargets } from './disciplines.js';
export { EVENTS };
export const VERSION = 4;
export const MONTHS = 96;
export const WORK_POLICIES={free:'라이프 우선 · 자율 출근',core:'할 때는 열심히 · 코어 타임',regular:'매일 성실하게 · 9–6',intensive:'연구를 충실히 · 9–9'};
export const STUDY_POLICIES={study:'열심히 공부하세요',learn:'배움을 우선',research:'연구를 우선',intensive:'열심히 연구하세요'};
export const DEFAULT_POLICIES={work:'core',study:'learn'};
const validPolicies=p=>p&&Object.keys(p).every(k=>['work','study'].includes(k))&&Object.hasOwn(WORK_POLICIES,p.work)&&Object.hasOwn(STUDY_POLICIES,p.study);
export function projectThresholds(s){const mode=getDiscipline(s.professorProfile.fieldId).graduation;const venue=getJournal(s.project?.journal??'standard',s.professorProfile.fieldId);const factor=(mode==='conference'?.9:mode==='mixed'?1:1.1)*venue.work;return {phaseTargets:PROJECT_PHASES.map(p=>p.target*factor),conference:(mode==='conference'?34:mode==='mixed'?44:54)*CONFERENCE_TIERS[s.publication?.conference??'regular'].work,submission:PROJECT_PHASES.slice(0,5).reduce((n,p)=>n+p.target*factor,0)};}
export function projectWork(s){const targets=projectThresholds(s).phaseTargets;return targets.slice(0,s.project.phase).reduce((n,p)=>n+p,0)+(s.project.phase===5?0:s.project.progress);}
export function developmentalStage(s){const level=s.month<24?'undergrad':s.month<48?'masters':stage(s);return {level,independence:level==='undergrad'?.78:level==='masters'?.94:1.05,errorRate:level==='undergrad'?BALANCE.undergraduateMistakeRate:level==='masters'?BALANCE.masterMistakeRate:BALANCE.doctoralMistakeRate};}

const activity = (ko, en, icon) => ({ ko, en, icon });
export const ACTIVITIES = {
  study: activity(['문헌 탐구', '논문과 교재를 읽으며 연구 질문을 다듬는다.'], ['Read & study', 'Read papers and refine a research question.'], 'book'),
  coursework: activity(['전공과목 공부', '수업의 개념과 문제를 정리하며 시험과 퀄을 준비한다.'], ['Course work', 'Study course concepts and prepare for exams and qualification.'], 'book'),
  experiment: activity(['실험', '관찰과 실험으로 가설을 검증한다.'], ['Experiment', 'Test a hypothesis against observations.'], 'flask'),
  analysis: activity(['데이터 분석', '재현성과 통계, 그래프를 점검한다.'], ['Analyze data', 'Check statistics, reproducibility and figures.'], 'chart'),
  conference: activity(['학술 발표', '준비된 프로젝트를 학회에서 발표한다.'], ['Conference', 'Present a prepared project to peers.'], 'globe'),
  free: activity(['자율 시간', '학생이 공부·여행·휴식 중 필요한 활동을 스스로 선택한다.'], ['Self-directed time', 'The student chooses study, travel or rest.'], 'leaf'),
  language: activity(['어학', '외국어 논문을 읽고 듣기·말하기·글쓰기를 연습한다.'], ['Language & presentation', 'Practice reading, writing and speaking.'], 'globe'),
  presentation: activity(['발표 연습','연구 내용을 설명하고 질의응답을 연습한다.'],['Presentation practice','Rehearse a talk and questions.'],'globe'),
  recovery: activity(['회복·여행','산·바다·도시에서 쉬거나 침대에서 휴식한다.'],['Recovery & travel','Take time to recover.'],'leaf'),
  industry: activity(['산학과제 수행 · RA', '산학과제의 연구 업무를 맡아 현장의 문제를 다룬다.'], ['Industry collaboration', 'Connect research with practical problems.'], 'briefcase'),
  teach: activity(['수업보조 · TA', '수업 자료와 실습, 질문 응답을 도우며 배움을 전달한다.'], ['Teach & mentor', 'Help another person learn.'], 'book'),
};
// Retained for historical saves and earlier monthly records, never selectable in current play.
export const LEGACY_ACTIVITIES={
  paper: activity(['논문 쓰기', '결과를 정리하고 심사 의견에 답한다.'], ['Write a paper', 'Build an argument and answer reviewers.'], 'pen'),
  video: activity(['과학 콘텐츠', '연구를 대중에게 설명하는 연습을 한다.'], ['Science communication', 'Practice explaining research to the public.'], 'play'),
  rest: activity(['휴식', '쉬는 시간을 일정의 일부로 확보한다.'], ['Rest', 'Protect time to recover.'], 'leaf'),
  coffee: activity(['커피와 대화', '연구실 밖에서 안부와 고민을 나눈다.'], ['Coffee & a conversation', 'Talk about life beyond the lab.'], 'cup'),
  startup: activity(['창업 실험', '작은 시제품을 만들고 수요를 알아본다.'], ['Venture prototype', 'Build a prototype and investigate demand.'], 'spark'),
};
export const currentActivity=id=>({rest:'free',coffee:'free',startup:'industry',paper:'analysis',video:'language'})[id]??id;
export const PROJECT_PHASES = [
  {id:'idea',ko:'연구 질문',en:'Research question',target:24},
  {id:'preliminary',ko:'예비 실험',en:'Preliminary work',target:32},
  {id:'results',ko:'결과 검증',en:'Validate results',target:40},
  {id:'figures',ko:'분석과 도표',en:'Analysis & figures',target:36},
  {id:'draft',ko:'논문 작성',en:'Manuscript',target:32},
  {id:'review',ko:'심사와 수정',en:'Review & revision',target:24},
];
export const PROJECT_TITLES = [
  {ko:'기초 가설의 재현성 검증',en:'Reproducibility of a foundational hypothesis'},
  {ko:'분석 방법의 정확도와 적용 범위 비교',en:'Comparing accuracy and scope of analysis methods'},
  {ko:'관측 자료의 변화와 설명 모형',en:'Observed variation and explanatory models'},
  {ko:'불완전한 자료에서의 추정과 검증',en:'Estimation and validation with incomplete data'},
  {ko:'환경 조건에 따른 시스템의 응답',en:'System responses to environmental conditions'},
  {ko:'오차와 불확실성을 고려한 예측',en:'Prediction under error and uncertainty'},
  {ko:'독립 자료를 이용한 후속 검증',en:'Follow-up validation with independent data'},
];
export const HIDDEN_RANGES = Object.fromEntries([
  ...['manners','stamina','resilience','language','learning','research'].map(k=>[k,[0,999]]),
  ...['social','creativity','diligence','rapport','luck'].map(k=>[k,[-100,100]]),
  ...['motivation','stress','autonomy','teaching','industry','enterprise','outreach','intuition','confidence'].map(k=>[k,[0,100]]),
]);
const HIDDEN_KEYS = Object.keys(HIDDEN_RANGES);
// Skills accumulate through practice; condition recovery and temperamental tendencies
// retain their ordinary changes. Output counts, project progress and money are separate.
const SATURATING_SKILLS=new Set(['rapport','learning','research','language','social','autonomy','teaching','industry','enterprise','outreach','intuition']);
const GROWING_ABILITIES=new Set([...SATURATING_SKILLS].filter(key=>key!=='rapport').concat('manners'));
// Public engine helper, not a display permission: the UI still keeps student values hidden.
export function abilityScore(stateOrHidden,key) { const h=stateOrHidden.hidden??stateOrHidden;const [lo,hi]=HIDDEN_RANGES[key]??[0,100];return (h[key]-lo)*100/(hi-lo); }
const scores=s=>Object.fromEntries(HIDDEN_KEYS.map(k=>[k,abilityScore(s,k)]));
const FACULTY_KEYS = ['research','teaching','admin','mentoring'];
const BUDGET_KEYS = ['salary','environment','performance','publicity'];
const FEEDBACK = ['listen','praise','critique','harsh'];
const WEEKLY_OUTCOMES = ['completed','explored','recovered','not_completed','inconclusive','progress','presented','attended','presentation_failed','preparing','training'];
const knownActivity = id => typeof id==='string'&&(Object.hasOwn(ACTIVITIES,id)||Object.hasOwn(LEGACY_ACTIVITIES,id));
const FACULTY_ACTIONS = ['routine','funding','recommend','support','report','abroad_student','abroad_together','abroad_shared','abstract','conversation'];
const ENDINGS = ['bachelor','masters','true','postdoc','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','dropout','dismissed','unfinished','gameover','external_masters','external_phd'];
const validAttendance=a=>plain(a)&&Object.keys(a).length===2&&['none','professor','together','student'].includes(a.domestic)&&['none','professor','together','student'].includes(a.overseas);
const PENDING_KINDS = ['monthly-issue','conference-plan','failure-counsel','conversation-topic','workshop-plan','route','masters','qual','sabbatical','service','service-review','defense','event','external-admission','story','academic-exam','thesis','presentation-recovery'];
const clamp = (n,lo=0,hi=100) => Math.max(lo,Math.min(hi,n));
function random(s) { s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0; return s.seed/4294967296; }
function gaussian(s,mean,deviation,min=0,max=100) {
  const u=1-random(s),v=random(s);
  return clamp(mean+deviation*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v),min,max);
}
function shift(s,group,effects={}) { for (const [k,n] of Object.entries(effects)) if (k in s[group] && Number.isFinite(n)) {
  const [lo,hi]=group==='hidden'?HIDDEN_RANGES[k]:[0,group==='lab'&&k==='funds'?5000:100];
  // Effects are normalized game points, then translated to each stored spectrum.
  const buffered=group==='hidden'&&k==='stress'&&n>0?n*(1.4-abilityScore(s,'resilience')/125):group==='professor'&&n<0&&s.month<=12&&s.professorProfile?.institution==='institute'?n*.65:n;
  const change=group==='hidden'&&buffered>0&&GROWING_ABILITIES.has(k)?buffered*BALANCE.abilityGrowthScale:buffered;
  s[group][k]=group==='hidden'&&SATURATING_SKILLS.has(k)?lo+scoreAfterChange(abilityScore(s,k),change)*(hi-lo)/100:clamp(s[group][k]+change*(group==='hidden'?(hi-lo)/100:1),lo,hi);
} }
function log(s,entry) { const topicId=entry.projectId===s.project?.id?s.project.topicId:null;s.history.push({month:s.month,...(topicId?{topicId}:{}),...entry}); }
function finish(s,ending,reason=null) { s.ending=ending;s.endingReason=reason;s.pending=null;s.pendingQueue=[];log(s,{kind:'ending',ending,...(reason?{reason}:{})});return s; }
export function projectTitle(s,id=s.project.id,locale=s.locale){const topicId=id===s.project?.id?s.project.topicId:s.history.find(h=>h.projectId===id&&h.topicId)?.topicId;const topic=topicById(topicId);return locale==='ko'&&topic?topic.title:PROJECT_TITLES[(id-1)%PROJECT_TITLES.length][locale==='en'?'en':'ko'];}
function newProject(s,id) { return {id,...(chooseTopic(s,id)?{topicId:chooseTopic(s,id).id}:{}),journal:s.publication?.journal??'standard',titleIndex:(id-1)%PROJECT_TITLES.length,phase:0,progress:0,conference:false,reviewMonths:0,submitted:false,submittedAt:null,revisions:0}; }
export function createState(name='김하늘',seed=Date.now(),{gender,professorGender='other',locale='ko',age=42,fieldId='050',labMode,institution='national',professorProfile}={}) {
  const requested=professorProfile??{gender:professorGender,age,fieldId,labMode,institution};
  const discipline=getDiscipline(requested.fieldId??fieldId);
  const profile={gender:['male','female','other'].includes(requested.gender)?requested.gender:'other',age:Number.isFinite(requested.age)?clamp(Math.round(requested.age),30,55):42,fieldId:discipline.id,labMode:discipline.labModes.includes(requested.labMode)?requested.labMode:discipline.labModes[0],institution:['national','private','institute'].includes(requested.institution)?requested.institution:'national'};
  const s={version:VERSION,name:String(name).trim().slice(0,24)||'김하늘',gender:'unspecified',professorGender:profile.gender,professorProfile:profile,professorEnergy:100,locale:locale==='en'?'en':'ko',month:0,route:null,started:false,
    hidden:{learning:299.7,research:249.75,language:299.7,social:-30,stamina:849.15,resilience:649.35,manners:599.4,creativity:0,diligence:20,rapport:25,luck:0,motivation:70,stress:12,autonomy:20,teaching:10,industry:0,enterprise:0,outreach:0,intuition:28,confidence:55},
    temperament:{curiosity:50,caution:50,expression:50},professor:{research:55,teaching:55,admin:55,mentoring:55},lab:{financeRules:1,initialFunding:seededInitialFunding(seed,profile.institution).total,funds:profile.institution==='institute'?600:profile.institution==='private'?270:300,pool:profile.institution==='institute'?0:profile.institution==='private'?90:100,debt:0,creditEnabled:false,budget:{salary:60,environment:2,performance:3,publicity:0},equipment:100},
    career:{submissions:0,papers:0,conferences:0,festivalAttendance:0,recommendations:0,awards:0,topPapers:0,completedProjects:0,qual:'not_due',qualAttempts:0},
    grants:initialGrants(profile.institution,seed,profile.labMode),project:null,publication:{...DEFAULT_PUBLICATION},attendance:{domestic:'together',overseas:'none'},plan:['study','experiment','rest','coffee'],feedback:'listen',allocation:{research:2,teaching:2,admin:2,mentoring:2},facultyAction:'routine',
    sabbatical:{active:false,until:0,mode:'home',start:24+12*((Math.imul((Number(seed)>>>0)^0x51ab,2654435761)>>>0)%5)},stipendLock:60,service:{status:'none',completed:(Number(seed)>>>0)%4===0},history:[],lastReport:null,crisis:0,ending:null,endingReason:null,pending:null,pendingQueue:[],eventFlags:{},seed:Number(seed)>>>0,behavior:{harsh:0,listen:0,praise:0,critique:0},qualDeferredAt:null,qualPreparations:0,mastersReviewAt:48,mastersExtended:false,lastRecommendationMonth:-12,lastAcademicWarning:null};
  // Always draw the gender value, including when overridden: abilities share the same seed.
  const sexDraw=random(s);s.gender=['male','female','unspecified'].includes(gender)?gender:sexDraw<.55?'male':'female';
  const initial={learning:[30,7],research:[25,7],language:[30,8],social:[35,12],intuition:[28,7],manners:[60,10],stamina:[85,7],resilience:[55,15],luck:[50,12],diligence:[55,15],creativity:[50,15],motivation:[70,8],rapport:[65,7],legacyRelationship:[60,7],confidence:[55,10]};
  for(const [key,[mean,sd]] of Object.entries(initial)){const target=key==='legacyRelationship'?'rapport':key;const [lo,hi]=HIDDEN_RANGES[target],draw=lo+gaussian(s,mean,sd)*(hi-lo)/100;s.hidden[target]=key==='legacyRelationship'?(s.hidden.rapport+draw)/2:draw;}
  for (const k of Object.keys(s.temperament)) s.temperament[k]=gaussian(s,50,12);
  Object.assign(s.lab,seededInitialFunding(seed,profile.institution));delete s.lab.total;s.creationSeed=Number(seed)>>>0;s.allocation=allocateCredits(s.allocation,facultyCapacity(s).credits);s.travel=initialTravel();s.impact=initialImpact();ensureFunding(s);s.creationSeed=Number(seed)>>>0;s.policies={...DEFAULT_POLICIES};s.professorName='지도교수';s.project=newProject(s,1);s.plan=proposeSchedule(s);return s;
}
export function stage(s) { return s.month<24?'undergrad':s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?'masters':'phd'; }
export function calendarMonth(month,locale='ko') { return ((month+(locale==='en'?8:2))%12)+1; }
// Winter is a fictional scheduling preference, not a legal enrollment guarantee.
export function studentTrainingActive(s){return s.service?.trainingStartMonth!==undefined&&s.month===s.service.trainingStartMonth;}
export function studentRestRequest(s){
  if(s.ending||studentTrainingActive(s))return null;
  const h=scores(s),physical=h.stamina<=45,mental=h.resilience<=35;
  if(!(h.stress>=65&&(physical||mental)))return null;
  return {weeks:h.stress>=80||h.stamina<=25||h.resilience<=20?2:1,reason:physical&&mental?'both':physical?'physical':'mental'};
}
export function winterTrainingMonth(s){
 const preferred=(Math.imul((s.creationSeed??s.seed)^0x741,2654435761)>>>0)%4===0?2:1;
 for(let month=s.month;month<MONTHS;month++)if(calendarMonth(month,s.locale)===preferred)return month;
 return null;
}
export function salaryBase(s) { return s.month<24?13:s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?22:30; }
export const OPERATING_ADVANCE_LIMIT=100; // 1,000만원 fictional institutional bridge, not a personal loan.
export function availableCredit(s){return s.lab.creditEnabled?Math.max(0,OPERATING_ADVANCE_LIMIT-(s.lab.debt??0)):0;}
export function monthlyBudgetCost(s,budget=s.lab.budget,plan=s.plan) { const wet=s.professorProfile.labMode==='wet',experiments=wet?plan.filter((id,i)=>id==='experiment'&&(!studentTrainingActive(s)||i>=3)).length:0;return salaryBase(s)*budget.salary/100+budget.environment*(wet?3.5:2)+budget.performance*2+(wet?6+experiments*2:0); }
export function proposeSchedule(s) {
  if(studentTrainingActive(s))return academicWeeks(s).map(()=> 'free');
  const phase=s.project?.phase||0;const recent=s.lastReport?.results??[];
  const primary=['study','experiment','experiment','analysis','analysis','analysis'][phase];
  const secondary=phase===0?'study':phase===1?'study':phase===2?'analysis':primary;
  const h=scores(s);
  const care='free';
  const growth=s.month<48&&s.month%3===0?'coursework':h.motivation<40?'free':s.month>=24&&phase>=1&&!s.project.conference&&studentAttends(s.attendance?.domestic??'together')?'conference':h.language<55?'language':s.temperament.expression>60?(s.month>=24?'teach':'presentation'):s.temperament.curiosity>60?'analysis':'study';
  const weeks=academicWeeks(s),plan=s.month<24?['coursework','coursework',care,s.month%2?'study':primary]:[primary,secondary,care,growth];
  for(let i=0;i<2;i++){const last=recent[i];if(last&&!last.performed)plan[i]=s.month<24?'coursework':last.actual==='rest'?'free':primary;else if(last?.successRate<.4)plan[i]=s.month<24?'coursework':'study';else if(s.month>=24&&last?.actual==='analysis'&&last.successRate>=.7)plan[i]='analysis';}if(weeks.length===5)plan.push(care);
  const qualAt=s.route==='masters'?60:48;
  if(s.month>=qualAt-18&&s.month<qualAt&&s.career.qual!=='passed'&&qualificationStudy(s)<8)plan[0]='coursework';
  if(s.career.qual==='failed'){
    const failedAt=s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month;
    if(qualificationStudy(s,failedAt+1)<2)plan[0]=plan[1]='coursework';
  }
  for(let i=0;i<plan.length;i++){const c=weekContext(s,i,plan.length);if(c.conference&&studentAttends(s.attendance?.domestic??'together'))plan[i]='conference';else if(examWindow(s,i,plan.length))plan[i]=h.rapport>=70?'free':'coursework';}
  if(s.month>=24){const first=plan.indexOf('conference');if(first>=0){let needed=Math.max(0,2-presentationPractice(s));for(let i=0;i<first&&needed>0;i++)if(!examWindow(s,i,plan.length)&&plan[i]!=='coursework'){plan[i]='presentation';needed--;}}}
  const request=studentRestRequest(s);
  if(request){
    // Keep fixed commitments; offer recovery in ordinary self-directed time first.
    const eligible=plan.map((_,i)=>i).filter(i=>!examWindow(s,i,plan.length)&&!(weekContext(s,i,plan.length).conference&&studentAttends(s.attendance?.domestic))&&!(i===plan.length-1&&canTravel(s)&&studentAttends(s.attendance?.overseas)));
    eligible.sort((a,b)=>Number(plan[b]==='free')-Number(plan[a]==='free')||a-b);
    for(const i of eligible.slice(0,request.weeks))plan[i]='recovery';
  }
  return plan;
}
function checkAllocation(a,total) {const sum=FACULTY_KEYS.reduce((n,k)=>n+(a?.[k]??0),0);return a&&FACULTY_KEYS.every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=12)&&(total===undefined?sum>=0&&sum<=12:sum<=total);}
function checkBudget(b) { return b&&Number.isInteger(b.salary)&&b.salary>=0&&b.salary<=100&&['environment','performance','publicity'].every(k=>Number.isInteger(b[k])&&b[k]>=0&&b[k]<=6); }
function queue(s,p) { s.pendingQueue.push(p); }
function nextPending(s) { s.pending=s.pendingQueue.shift()||null; }
function academicDue(s) {
  const chapter=({1:'contact',12:'firstyear',25:'graduate',42:'uncertainty',72:'independence',85:'lastyear'})[s.month];if(chapter)queue(s,{kind:'story',id:chapter});

  if(s.route==='masters'&&s.month===s.mastersReviewAt-3)queue(s,{kind:'thesis',level:'masters',step:'draft'});
  if(s.route==='masters'&&s.month===s.mastersReviewAt-1)queue(s,{kind:'thesis',level:'masters',step:'presentation'});
  if(s.route==='masters'&&s.month===s.mastersReviewAt)queue(s,{kind:'thesis',level:'masters',step:'verdict'});
  if(s.month===93)queue(s,{kind:'thesis',level:'phd',step:'draft'});
  if(s.month===95)queue(s,{kind:'thesis',level:'phd',step:'presentation'});
  if(s.month===96)queue(s,{kind:'thesis',level:'phd',step:'verdict'});
  if(s.month===20)queue(s,{kind:'event',id:'undergraduate-contest'});
  if(s.month===24){if(externalAdmissionEligible(s,'bachelor')&&canContinue(s))queue(s,{kind:'external-admission',level:'bachelor'});queue(s,{kind:'route'});}
  if(s.month===36&&s.locale==='ko'&&s.gender==='male'&&!s.service.completed)queue(s,{kind:'service'});
  if(s.month===s.mastersReviewAt&&s.route==='masters'){if(externalAdmissionEligible(s,'masters')&&requirementsMet(s,'masters')&&canContinue(s))queue(s,{kind:'external-admission',level:'masters'});queue(s,{kind:'masters'});}
  if((s.route==='integrated'&&s.month===48)||(s.route==='masters'&&s.month===60)||s.qualDeferredAt===s.month){s.career.qual='due';queue(s,{kind:'qual'});s.qualDeferredAt=null;}
  if(s.month===s.sabbatical.start&&!s.history.some(h=>h.kind==='sabbatical')&&!s.sabbatical.active)queue(s,{kind:'sabbatical'});
  if(s.month===84&&s.locale==='ko'&&s.gender==='male'&&s.service.status==='planning'&&!s.service.completed)queue(s,{kind:'service-review'});
  if(s.month===MONTHS)queue(s,{kind:'defense'});
  const exam=weekContext({...s,month:s.month-1},s.lastReport.results.length-1,s.lastReport.results.length);const finalExam=[6,12].includes(calendarMonth(s.month-1,s.locale));if(s.month<=48&&(exam.exam||finalExam))queue(s,{kind:'academic-exam',level:s.month<=24?'undergrad':'graduate',examType:finalExam?'기말고사':'중간고사'});
}
export function feedbackEffect(s,type){
 const r=s.lastReport;if(type==='harsh')return {effects:{rapport:-5,confidence:-3,motivation:-2,stress:6},efficiency:.85};if(!r||type==='listen')return {effects:{},efficiency:1};
 const rates=(r.results??[]).filter(w=>Number.isFinite(w.successRate)).map(w=>w.successRate);const quality=rates.length?rates.reduce((a,b)=>a+b,0)/rates.length:1;
 const well=(r.progress>0||r.published>0||r.conferences>0)&&r.completion>=.65&&quality>=.55;
 const difficulty=!well&&(r.scienceFailures>0||r.completion<.65);
 if(type==='praise')return well?{effects:{stress:-3,rapport:1.6,motivation:4,confidence:3},efficiency:BALANCE.praiseEfficiency}:{effects:{motivation:-3,confidence:-2,rapport:-2.4,stress:2},efficiency:BALANCE.mismatchedFeedbackEfficiency};
 if(type==='critique')return difficulty?{effects:{research:2,intuition:1,stress:2},efficiency:BALANCE.critiqueEfficiency}:{effects:{motivation:-3,rapport:-3,confidence:-3,stress:3},efficiency:BALANCE.mismatchedFeedbackEfficiency};
 return {effects:{rapport:-5,confidence:-3,motivation:-2,stress:6},efficiency:.85};
}
function feedback(s,type){s.behavior[type]++;const effect=feedbackEffect(s,type);shift(s,'hidden',effect.effects);s.monthlyEfficiency=effect.efficiency;
 const habits=s.advising??={lastFeedback:null,streak:0,inattention:0};habits.streak=habits.lastFeedback===type?habits.streak+1:1;habits.lastFeedback=type;
 habits.inattention=type==='listen'&&s.facultyAction==='routine'&&s.monthlyChanged===0?habits.inattention+1:0;
 if(habits.inattention>=6){shift(s,'hidden',{rapport:-.2,motivation:-.15});s.monthlyEfficiency*=.97;log(s,{kind:'advising-habit',habit:'inattention'});}
 if(type==='listen'&&habits.streak>=4){shift(s,'hidden',{rapport:-.9});log(s,{kind:'advising-habit',habit:'repeated-skip'});}
 if(s.history.slice(-40).filter(h=>h.kind==='month').slice(-3).length===3&&s.history.filter(h=>h.kind==='month').slice(-3).every(h=>h.feedback===type&&h.facultyAction===s.facultyAction&&h.plan.join(',')===s.plan.join(','))){shift(s,'hidden',{rapport:-.25});log(s,{kind:'advising-habit',habit:'uniform'});}
 if(type==='praise'&&habits.streak>=4){shift(s,'hidden',{diligence:-.15,confidence:.15});s.monthlyEfficiency=Math.min(s.monthlyEfficiency,1.02);log(s,{kind:'advising-habit',habit:'repeated-praise'});}
 delete s.monthlyChanged;
}
function policyMonth(s){
 const p=s.policies??DEFAULT_POLICIES;
 shift(s,'hidden',({free:{stamina:3,stress:-2,autonomy:.7},core:{stamina:1,stress:-1,diligence:.25},regular:{diligence:.6,stamina:-2,stress:.8},intensive:{diligence:.8,stamina:-6,stress:3}})[p.work]);
 const studyEffects={...({study:{learning:.9,research:.1},learn:{learning:.5,research:.25},research:{learning:.2,research:.5},intensive:{research:.8,learning:.1,stamina:-1,stress:.5}})[p.study]};
 for(const key of ['learning','research'])studyEffects[key]*=BALANCE.policyGrowthScale;
 shift(s,'hidden',studyEffects);
}
function facultyMonth(s,professorTravel=false) {
  const absent=studentTrainingActive({...s,month:s.month-1});
  const capacity=s.workload??facultyCapacity({...s,month:Math.max(0,s.month-1)});
  const institution=INSTITUTION_RULES[s.professorProfile.institution];
  const exempt=k=>capacity.sabbatical&&['teaching','admin'].includes(k);
  for(const k of FACULTY_KEYS){const allotted=absent&&k==='mentoring'?0:s.allocation[k],decay=exempt(k)?0:k==='teaching'&&!capacity.teachingRequired?-.35:absent&&k==='mentoring'?-.35:allotted===0?-7:allotted===1?-2:0;const gain=allotted>=2?(.85+(allotted-2)*2.3)*capacity.efficiency:0;shift(s,'professor',{[k]:decay+gain});}
  if(capacity.teachingRequired){shift(s,'professor',{teaching:-1-Math.max(0,3-s.allocation.teaching)*1.3,admin:-.4});}
  shift(s,'professor',{admin:exempt('admin')?0:-institution.adminLoad,research:-institution.researchLoad});
  if(professorTravel)shift(s,'professor',{research:2});
  if(s.sabbatical.active) {
    shift(s,'professor',{research:1,teaching:0,admin:0,mentoring:s.sabbatical.mode==='away'?-2.5:-.7});
    if(s.sabbatical.mode==='away')shift(s,'hidden',{rapport:-1.5,autonomy:1});
  }
  if(s.facultyAction==='funding'){shift(s,'professor',{research:2,admin:3,mentoring:-3});}
  else if(s.facultyAction==='report')shift(s,'professor',{admin:3,research:-1});
  else if(!absent&&s.facultyAction==='conversation'){shift(s,'professor',{mentoring:1,research:-.5});shift(s,'hidden',{rapport:2.8,motivation:1,stress:-3,resilience:BALANCE.conversationResilienceRecovery});log(s,{kind:'advising-conversation'});}
  else if(!absent&&s.facultyAction==='support'){shift(s,'professor',{mentoring:2,research:-1});shift(s,'hidden',{rapport:1.6,motivation:2,stress:-2,resilience:.2});}
  else if(s.facultyAction==='recommend') {
    shift(s,'professor',{mentoring:1,admin:exempt('admin')?0:-1});
    if(s.career.papers>0&&s.month-s.lastRecommendationMonth>=12){s.career.recommendations++;s.lastRecommendationMonth=s.month;shift(s,'hidden',{autonomy:2,motivation:2});log(s,{kind:'recommendation'});}
  }
  if(s.professorProfile.institution==='private')shift(s,'hidden',{autonomy:.12});
  const researchWeeks=s.plan.filter(id=>['study','experiment','analysis','paper'].includes(id)).length;
  const load=(FACULTY_KEYS.some(k=>s.allocation[k]>=4)?3:0)+(['funding','report'].includes(s.facultyAction)?3:0)+(professorTravel?4:0)+(researchWeeks>=3?researchWeeks-1:0);
  const aging=1+(professorAge(s)-30)/50;
  s.professorEnergy=clamp(s.professorEnergy+4-load*aging);
  if(s.professorEnergy<25)for(const k of FACULTY_KEYS)if(!exempt(k))shift(s,'professor',{[k]:-1});
}
function upkeep(s) {
  const b=s.lab.budget;
  shift(s,'hidden',{motivation:(b.salary-50)*.05,stamina:b.salary>=50?1:-2,intuition:b.salary>=60?.35:0,stress:b.salary<30?3:0,rapport:b.salary>=70?.5:b.salary<30?-2:0});
  shift(s,'lab',{equipment:(b.environment-2)*3+(s.professorProfile.labMode==='wet'?1.5:.5)});

}
const matching=[['study','analysis'],['experiment','study','industry'],['experiment','analysis','industry'],['analysis','experiment'],['paper','language','analysis'],['paper','analysis']];
export function researchGrade(rate){return rate>=.9?'완전성공':rate>=.7?'성공':rate>=.4?'보통':rate>0?'약간실패':'실패';}
export function presentationPractice(s){return s.history.filter(h=>h.kind==='month'&&h.month>=s.month-(s.weeklyExecuted?2:1)).flatMap(h=>h.results??[]).concat(s.weeklyExecuted??[]).filter(w=>(w.actual==='presentation'||w.actual==='language'&&w.assigned===undefined)&&w.performed).length;}
function presentationFails(s,abroad){const prepared=presentationPractice(s)>=2;const penalty=-CONFERENCE_TIERS[(abroad?s.travel.tier:s.publication?.conference)??'regular'].acceptance;if(random(s)>=Math.min(.9,(prepared?.04:.7)+penalty))return false;shift(s,'hidden',{stress:2,confidence:-1});log(s,{kind:'presentation-failure',abroad,prepared});if(!s.pendingQueue.some(p=>p.kind==='presentation-recovery'))queue(s,{kind:'presentation-recovery',abroad});return true;}
function scienceProgress(s,id,result) {
  if(!['study','experiment','analysis','paper','industry'].includes(id))return;
  const p=s.project,h=scores(s);
  if(p.phase===5&&p.submitted)return; // Peer review proceeds asynchronously.
  const fit=matching[p.phase].includes(id);
  const skill=id==='study'?h.learning:id==='paper'?(h.research+h.language)/2:(h.research+h.intuition)/2;
  const environmentSupport=id==='experiment'?(s.professorProfile.labMode==='wet'?s.lab.equipment*.0015+s.lab.budget.environment*.005-.06:s.lab.equipment*.0005+s.lab.budget.environment*.015+.02):s.lab.equipment*.001;
  const growth=developmentalStage(s);const probability=clamp(.55+skill*.003+environmentSupport-growth.errorRate-(h.stress>60?.12:0)+(h.luck-50)*.0006,.3,.96);result.successProbability=probability;
  const roll=random(s);result.successRate=roll>=probability?0:clamp(1-Math.pow(roll/probability,4),0,1);if(result.successRate<.4)result.scienceFailures++;result.researchGrade=researchGrade(result.successRate);
  const languageFactor=id==='paper'?.75+h.language/200:1;
  const creativityFactor=.8+h.creativity/250;
  const emphasis=(s.policies??DEFAULT_POLICIES).study;const policyWeight=id==='study'?(emphasis==='study'?1.2:emphasis==='learn'?1.1:.9):(emphasis==='intensive'?1.2:emphasis==='research'?1.1:.95);const weight=(fit?12:5)*(1+skill/160)*(1+s.lab.budget.performance*.025)*languageFactor*creativityFactor*growth.independence*policyWeight*(s.monthlyEfficiency??1)*(1+(p.eventSupport??0))*BALANCE.projectProgressScale*(4/s.plan.length)*1.25;result.weight=weight*(s.month<=24?.65:1);const amount=result.weight*result.successRate;
  p.progress+=amount;result.progress=amount;result.outcome=amount>0?'progress':'inconclusive';
}
export function autonomousChoice(s,index){
 const h=scores(s);if(h.stamina<55||h.stress>60)return 'rest';
 if(examWindow({...s,month:Math.max(0,s.month-1)},index,s.plan.length)&&h.rapport>=70)return 'coursework';
 const n=(Math.imul((s.creationSeed??s.seed)^(s.month*104729)^((index+1)*7919),2654435761)>>>0)/4294967296;
 const research=s.month>=24?.15+h.autonomy*.003+h.creativity*.002:.03;const rest=.65+Math.max(0,80-h.stamina)*.01+h.stress*.002,study=.12+s.temperament.curiosity*.002+Math.max(0,h.diligence-60)*.003,travel=.23+Math.max(0,h.social-50)*.003;
 const draw=n*(rest+study+research+travel);return draw<rest?'rest':draw<rest+study?(s.month<24?'coursework':'study'):draw<rest+study+research?(s.project.phase<=2?'experiment':'analysis'):'travel';
}
function weekly(s,id,index) {
  if(id==='recovery'){const destination=['mountain','sea','city','bed'][(Math.imul((s.creationSeed??s.seed)^(s.month*31+index),2654435761)>>>0)%4],r=weekly(s,'rest',index);return {...r,proposed:id,actual:destination==='bed'?'rest':'travel',destination};}
  if(id==='free'){const selected=autonomousChoice(s,index);shift(s,'hidden',{autonomy:.25});if(selected==='travel'){shift(s,'hidden',{stamina:14,stress:-10,motivation:3,social:2,autonomy:1.5,resilience:.15});return {week:index+1,proposed:'free',actual:'travel',performed:true,outcome:'explored',progress:0,scienceFailures:0,autonomous:selected};}const result=weekly(s,selected,index);result.proposed='free';result.autonomous=selected;return result;}
  const h=scores(s),result={week:index+1,proposed:id,actual:id,performed:true,outcome:'completed',progress:0,scienceFailures:0};
  if(id==='rest') {shift(s,'hidden',{stamina:28,stress:-14,motivation:2,confidence:.3,resilience:BALANCE.restResilienceRecovery});result.outcome='recovered';return result;}
  const probability=clamp(.32+h.stamina*.003+h.motivation*.003+h.rapport*.0017+(h.diligence-50)*.0018+(h.luck-50)*.0004+(s.feedback==='harsh'?.13:0)-(h.stress>65?.1:0),.18,.98);
  if(random(s)>probability){result.actual=h.stamina<40?'rest':'unfinished';result.performed=false;result.outcome='not_completed';shift(s,'hidden',{stamina:8,motivation:-.7,stress:-2});return result;}
  if(id==='coffee')shift(s,'hidden',{rapport:3.24,motivation:3,stamina:8,stress:-7,social:1.2,resilience:BALANCE.conversationResilienceRecovery});
  else {
    shift(s,'hidden',{stamina:-7*(.8+h.diligence/250)*(1+s.month/(12*160)),stress:2.6,motivation:-.35,autonomy:.25});
    if(id==='coursework'){const chance=clamp(.65+h.learning*.002-developmentalStage(s).errorRate+(h.luck-50)*.0006,.3,.94),roll=random(s);result.successRate=roll<chance?clamp(1-Math.pow(roll/chance,4),0,1):0;result.successProbability=chance;result.weight=0;result.researchGrade=researchGrade(result.successRate);if(result.successRate<.4){result.scienceFailures++;result.outcome='inconclusive';shift(s,'hidden',{stress:1.5,confidence:-.4});}shift(s,'hidden',{learning:3.5*result.successRate,intuition:.3*result.successRate,confidence:.5*result.successRate});}
    scienceProgress(s,id,result);
    // Failed research still teaches, but contributes less than a successful week.
    const practice=Number.isFinite(result.successRate)?.35+.65*result.successRate:1;
    const practiceShift=effects=>shift(s,'hidden',Object.fromEntries(Object.entries(effects).map(([key,n])=>[key,['research','learning','intuition','language'].includes(key)?n*practice:n])));
    if(id==='study')practiceShift({learning:1.5,research:.3,intuition:.6,creativity:.2});
    if(id==='experiment') {practiceShift({research:1.4,intuition:.9});shift(s,'lab',{equipment:s.professorProfile.labMode==='wet'?-1.2:-.15});}
    if(id==='analysis')practiceShift({research:1.2,learning:.5,intuition:.7});
    if(id==='paper')practiceShift({research:.6,language:1.1,autonomy:.7});
    if(id==='language')shift(s,'hidden',{language:3,social:.5});
    if(id==='presentation')shift(s,'hidden',{language:1,social:1.5,confidence:1});
    if(id==='industry')practiceShift({enterprise:Math.min(3,Math.max(.15,(h.creativity-60)/8)),industry:4.5*(.75+h.social/200),research:.6,autonomy:1,social:1,manners:.4});
    if(id==='startup')shift(s,'hidden',{enterprise:4.5*(.75+h.social/200),industry:.7,autonomy:1.3,social:1,creativity:.5});
    if(id==='video')shift(s,'hidden',{outreach:4.5,language:1,social:1.3});
    if(id==='teach')shift(s,'hidden',{teaching:4,learning:.5,social:1.4,autonomy:.9,manners:.5});
    if(id==='conference') {
      shift(s,'hidden',{social:2*CONFERENCE_TIERS[s.publication?.conference??'regular'].learning});
      const currentReady=projectWork(s)>=projectThresholds(s).conference&&!s.project.conference;const earlier=s.history.find(e=>e.kind==='paper'&&!s.history.some(h=>h.kind==='conference'&&h.projectId===e.projectId));const projectId=currentReady?s.project.id:earlier?.projectId;
      if(s.month>24&&(currentReady||earlier)){if(presentationFails(s,false)){result.outcome='presentation_failed';return result;}if(currentReady)s.project.conference=true;s.career.conferences++;shift(s,'hidden',{social:2*CONFERENCE_TIERS[s.publication?.conference??'regular'].learning,language:2*CONFERENCE_TIERS[s.publication?.conference??'regular'].learning,autonomy:3,motivation:3});result.outcome='presented';log(s,{kind:'conference',projectId,tier:s.publication?.conference??'regular'});
        presentationAward(s,projectId);
      }
      else {shift(s,'hidden',{language:.7});result.outcome=s.month<=24?'attended':s.project.conference?'attended':'preparing';}
    }
  }
  return result;
}
function advanceProject(s,reviewTick=false) {
  const p=s.project,venue=getJournal(p.journal??'standard',s.professorProfile.fieldId);
  const venueRecord={journal:p.journal??'standard',impactFactor:venue.impactFactor,citationWeight:venue.citationWeight};
  while(p.phase<5&&p.progress>=projectThresholds(s).phaseTargets[p.phase]){p.progress-=projectThresholds(s).phaseTargets[p.phase];p.phase++;log(s,{kind:'project-phase',projectId:p.id,phase:PROJECT_PHASES[p.phase].id});}
  if(p.phase===5&&!p.submitted) {
    p.progress=0;p.submitted=true;p.submittedAt=s.month;p.reviewMonths=0;s.career.submissions++;log(s,{kind:'submission',projectId:p.id,...venueRecord});return;
  }
  if(p.phase!==5||!p.submitted||!reviewTick||p.submittedAt===s.month)return;
  p.reviewMonths++;p.progress=Math.min(24,p.reviewMonths*12);
  if(p.reviewMonths<venue.reviewMonths)return;
  const h=scores(s);
  const probability=clamp(.62+h.research*.002+h.language*.001+p.revisions*.12+(h.luck-50)*.0006+venue.acceptance,.35,.97);
  if(random(s)<probability) {
    s.career.papers++;s.career.completedProjects++;shift(s,'hidden',{motivation:5,confidence:4,autonomy:2});if(p.journal==='leading')s.career.topPapers++;log(s,{kind:'paper',projectId:p.id,revisions:p.revisions,...venueRecord});s.project=newProject(s,p.id+1);
  } else {
    p.revisions++;p.reviewMonths=0;p.progress=0;shift(s,'hidden',{motivation:-3,stress:3});log(s,{kind:'revision',projectId:p.id});
  }
}
function required(s,req) {
  const list=Array.isArray(req)?req:req?[req]:[];
  return list.every(r=>r==='paper'?s.career.papers>0:r==='top_paper'?s.career.topPapers>0:r==='conference'?s.career.conferences>0:r==='submission'?s.career.submissions>0:r==='revision'?s.project.submitted===true&&s.project.phase===5&&s.project.revisions>0:r==='low_motivation'?s.hidden.motivation<45:r==='stress'?s.hidden.stress>45:r==='graduate'?stage(s)!=='undergrad':r==='early_graduate'?developmentalStage(s).level==='masters':r==='sabbatical'?s.sabbatical.active:r==='away_sabbatical'?s.sabbatical.active&&s.sabbatical.mode==='away':r==='research'?s.project.phase>=1:r==='male_pair'?s.locale==='ko'&&s.gender==='male'&&s.professorProfile.gender==='male':r==='female_pair'?s.locale==='ko'&&s.gender==='female'&&s.professorProfile.gender==='female':r==='young_professor'?professorAge(s)<=37:r==='national'?s.professorProfile.institution==='national':r==='institute'?s.professorProfile.institution==='institute':false);
}
export function eventEligible(s,e) {
  if(studentTrainingActive(s)||!e.options.some(o=>Math.max(0,-(o.effects.lab?.funds??0))<=s.lab.funds))return false;
  if(e.id==='military-hidden'&&s.service.completed)return false;const flag=s.eventFlags[e.id];
  return s.month>=(e.minMonth??0)&&s.month<=(e.maxMonth??MONTHS)&&(!e.stages||e.stages.includes(stage(s)))&&!(e.once&&flag?.count>0)&&(!flag||s.month-flag.lastMonth>=(e.cooldown??12))&&required(s,e.requires);
}
const SOCIAL_EVENTS = new Set(['collaboration','seminar','internship']);
// Fictional opportunity weights, not measured probabilities of academic collaborations.
export function eventWeight(s,eventOrId) {
  const id=typeof eventOrId==='string'?eventOrId:eventOrId.id;
  if(SOCIAL_EVENTS.has(id))return clamp(.5+abilityScore(s,'social')/100,.5,1.5);
  if(['stipend-delay','funding-cut','authorship','ethics','annual-report'].includes(id)&&s.professorProfile.institution==='national')return 1.25;
  if(id==='new-pi-mistake')return Math.max(1,1+(37-professorAge(s))*.03);
  return 1;
}
function selectWeightedEvent(s,eligible) {
  const weights=eligible.map(e=>eventWeight(s,e));
  let draw=random(s)*weights.reduce((sum,weight)=>sum+weight,0);
  for(let index=0;index<eligible.length;index++){draw-=weights[index];if(draw<0)return eligible[index];}
  return eligible.at(-1);
}
function checkFailure(s) {
  if(FACULTY_KEYS.some(k=>s.professor[k]<=0))return finish(s,'gameover');
  const h=scores(s),relationshipFailed=h.rapport<=8&&h.stress>=85&&h.resilience<=30;
  const critical=relationshipFailed||h.stamina<=5||h.stress>=95||h.resilience<=5;
  s.crisis=critical?s.crisis+1:0;
  if(critical&&s.crisis===1){s.lastAcademicWarning=s.month;log(s,{kind:'warning',reason:relationshipFailed?'relationship':'health'});}
  if(s.crisis>=2)return finish(s,relationshipFailed?'dropout':'leave');
  return s;
}
export function simulateMonth(state,plan,options={}) {
  if(!validateSave(state))throw new Error('Invalid saved game.');
  if(state.ending||state.pending)throw new Error('Resolve the pending decision first.');
  if(state.month>=MONTHS)return finish(structuredClone(state),'gameover','time_limit');
  if(!Array.isArray(plan)||![4,5].includes(plan.length)||!plan.every(knownActivity))throw new Error('Choose four or five weekly activities.');
  const training=studentTrainingActive(state);
  if(training&&['conversation','support'].includes(options.facultyAction??state.facultyAction))throw new Error('Student advising is unavailable during military training.');
  const offered=proposeSchedule(state),proposal=options.proposal??(offered.length===plan.length?offered:plan);
  if(plan.includes('teach')&&state.month<24)throw new Error('TA unlocks in graduate school.');
  if(!Array.isArray(proposal)||proposal.length!==plan.length||!proposal.every(knownActivity))throw new Error('Invalid student proposal.');
  const capacity=facultyCapacity(state);const allocation=options.allocation??allocateCredits(state.allocation,capacity.credits),budget=options.budget??state.lab.budget,type=options.feedback??state.feedback,action=options.facultyAction??state.facultyAction;
  if(!checkAllocation(allocation,capacity.credits))throw new Error('Allocate the available faculty workload credits.');
  if(!checkBudget(budget))throw new Error('Invalid stipend percentage or operating budget.');
  if(calendarMonth(state.month,state.locale)!==3&&budget.salary!==(state.stipendLock??state.lab.budget.salary))throw new Error('Stipend allocation changes only in March.');
  if(budget.publicity!==0)throw new Error('Publicity spending is no longer available.');
  const policies=options.policies??state.policies??DEFAULT_POLICIES;if(!validPolicies(policies))throw new Error('Invalid monthly advising policy.');
  const application=options.grantApplication??{role:'pi',years:3};if(!validApplication(application))throw new Error('Invalid grant application.');if(action==='funding'&&!canApplyGrant(state,application.role))throw new Error('Research participation limit reached.');if(action==='funding'&&!grantCallOpen(state))throw new Error('Grant calls open in March and September.');
  const attendance=options.attendance??state.attendance??{domestic:'together',overseas:'none'};if(!validAttendance(attendance))throw new Error('Invalid conference attendance.');
  const overseas=({abroad_student:'student',abroad_together:'together',abroad_shared:'together'})[action]??attendance.overseas;const actualMonth=calendarMonth(state.month,state.locale),festival=[4,10].includes(actualMonth);
  if(state.month<24&&plan.some((id,index)=>id==='conference'&&!(festival&&index===2)))throw new Error('Undergraduate conference observation is limited to conference week.');
  if(!studentAttends(attendance.domestic)&&plan.includes('conference'))throw new Error('The student is not attending this domestic conference.');
  if(festival&&studentAttends(attendance.domestic)&&plan[2]!=='conference')throw new Error('The third week is the April/October conference festival.');
  const travel=overseas!=='none',studentTravel=studentAttends(overseas);
  if(training&&studentTravel)throw new Error('Student conference travel is unavailable during military training.');
  if(action==='abstract'&&(![7,1].includes(actualMonth)||state.month<24))throw new Error('Abstract submission opens at the start of graduate vacation.');
  if(studentTravel&&!canTravel(state))throw new Error('An accepted abstract is required for this conference.');
  if(travel&&![8,2].includes(actualMonth))throw new Error('Research travel is available in vacation months.');
  const costs=conferenceCosts(state,plan,attendance,action),travelCost=costs.overseas;
  const cost=monthlyBudgetCost(state,budget,plan)+costs.domestic+travelCost;
  const stipend=salaryBase(state)*budget.salary/100;const operating=cost-stipend;
  const credit=availableCredit(state);if(operating>state.lab.funds+credit||cost>state.lab.funds+(state.lab.pool??0)+credit)throw new Error('Budget exceeds available funds before new grants.');
  if(!FEEDBACK.includes(type)||!FACULTY_ACTIONS.includes(action))throw new Error('Invalid mentoring choice.');
  const s=structuredClone(state);
  if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');
  s.travel??=initialTravel();if(action==='abstract'){const earlier=s.history.find(e=>e.kind==='paper'&&!s.history.some(h=>h.kind==='conference'&&h.projectId===e.projectId));s.travel={status:'review',tier:s.publication?.conference??'regular',submittedAt:s.month,decidedAt:null,conferenceMonth:s.month+2,projectId:earlier?.projectId??s.project.id};log(s,{kind:'abstract-submission',month:s.month+1,projectId:s.travel.projectId});}
  s.workload={...capacity};s.started=true;s.attendance={...attendance,overseas:'none'};s.policies={...policies};s.month++;s.plan=[...plan];s.allocation={...allocation};s.lab.budget={...budget};const borrowed=Math.max(0,operating-s.lab.funds,cost-s.lab.funds-(s.lab.pool??0));if(borrowed){s.lab.debt=(s.lab.debt??0)+borrowed;s.lab.funds+=borrowed;log(s,{kind:'operating-advance',amount:borrowed,debt:s.lab.debt});}s.stipendLock=budget.salary;s.feedback=type;s.facultyAction=action;ensureFunding(s);const pooledPayment=Math.min(s.lab.pool,stipend);s.lab.pool-=pooledPayment;s.lab.funds-=cost-pooledPayment;log(s,{kind:'stipend-payment',amount:stipend,fromPool:pooledPayment});
  const fundingBalance=s.lab.funds;
  advanceGrants(s,{application,random:()=>random(s),log:(entryOrState,entry)=>{
    const grantEntry=entry??entryOrState;
    if(grantEntry.kind==='annual-grant'){
      // A stable public-institution model; private awards have a small seeded variation.
      const factor=s.professorProfile.institution==='private'?.9+random(s)*.2:1;
      const amount=Math.round(grantEntry.amount*factor);
      s.lab.funds=fundingBalance;depositGrant(s,amount);
      log(s,{...grantEntry,amount,institution:s.professorProfile.institution,factor});
    }else log(s,grantEntry);
  }});
  advancePortfolio(s,application,{random:()=>random(s),log});
  const changed=plan.filter((id,index)=>id!==proposal[index]).length;
  const approach=changed===0?'agreed':type==='harsh'?'imposed':'discussed';
  const accepted=plan.filter((id,i)=>id==='free'||id===proposal[i]).length,acceptance=accepted/plan.length,rapportBeforeDiscussion=abilityScore(s,'rapport');
  if(!training)shift(s,'hidden',{rapport:(acceptance-.5)*1.6+(type==='harsh'&&changed?-1:0),autonomy:accepted===plan.length?.15:0});
  const rapportChange=abilityScore(s,'rapport')-rapportBeforeDiscussion;
  s.monthlyChanged=changed;if(!training)feedback(s,type);else {s.feedback='listen';delete s.monthlyChanged;}facultyMonth(s,travel&&['professor','together'].includes(overseas));upkeep(s);if(!training)policyMonth(s);
  const papers=s.career.papers,conferences=s.career.conferences;
  s.weeklyExecuted=[];const results=plan.map((id,index)=>{const r=training&&index<3?{week:index+1,proposed:id,actual:'training',performed:false,outcome:'training',progress:0,scienceFailures:0}:training?weekly(s,'free',index):studentTravel&&index===plan.length-1?{week:index+1,proposed:id,actual:'conference',abroad:true,performed:false,outcome:'preparing',progress:0,scienceFailures:0}:weekly(s,id,index);r.assigned=id;if(id==='recovery'){r.destination=['mountain','sea','city','bed'][(Math.imul((s.creationSeed??s.seed)^(s.month*31+index),2654435761)>>>0)%4];}if(!r.performed&&r.outcome!=='training'&&r.actual!==id)r.deviation=r.actual==='rest'?'rest-needed':'unfinished';s.weeklyExecuted.push(r);advanceProject(s);return r;});
  // Reviews advance once per month, never once per week. Newly submitted manuscripts wait.
  advanceProject(s,true);
  if(costs.domestic){if(festival&&studentAttends(attendance.domestic))s.career.festivalAttendance++;if(['professor','together'].includes(attendance.domestic))shift(s,'professor',{research:.5});log(s,{kind:'conference-festival',calendarMonth:actualMonth,week:festival?3:null,presented:results.some(r=>r.outcome==='presented'),attendance:attendance.domestic,cost:costs.domestic});}
  if(action==='abstract'){const prepared=s.history.some(h=>h.kind==='paper'&&h.projectId===s.travel.projectId)?projectThresholds(s).conference:projectWork(s);const probability=clamp(abstractAcceptance(s,prepared,projectThresholds(s).conference)+CONFERENCE_TIERS[s.travel.tier??'regular'].acceptance,.05,.95),accepted=random(s)<probability;s.travel.status=accepted?'accepted':'rejected';s.travel.decidedAt=s.month;log(s,{kind:'abstract-decision',accepted,projectId:s.travel.projectId});}
  if(travel&&overseas==='professor'){shift(s,'professor',{research:3});shift(s,'hidden',{autonomy:1});log(s,{kind:'research-travel',calendarMonth:actualMonth,attendance:overseas,joining:false,rooms:1,performed:true,cost:travelCost,projectId:null});}
  if(studentTravel) {
    const h=scores(s),joining=overseas==='together';const performed=random(s)<clamp(.4+h.stamina*.002+h.motivation*.003+h.rapport*.002+(h.luck-50)*.0004,.2,.98);
    if(performed)shift(s,'hidden',{social:2,stress:2.6});
    const presented=performed&&!presentationFails(s,true);
    if(presented){shift(s,'hidden',{language:6,social:4,research:3,learning:2,intuition:2,autonomy:joining?4:6,rapport:joining?2.6:1.4,confidence:4,motivation:4,stamina:-6});if(!s.history.some(h=>h.kind==='conference'&&h.projectId===s.travel.projectId))s.career.conferences++;if(s.travel.projectId===s.project.id)s.project.conference=true;log(s,{kind:'conference',projectId:s.travel.projectId,abroad:true,topicId:topicById(s.history.find(h=>h.projectId===s.travel.projectId&&h.topicId)?.topicId)?.id??(s.travel.projectId===s.project.id?s.project.topicId:undefined),tier:s.travel.tier??s.publication?.conference??'regular'});s.travel.status='attended';presentationAward(s,s.travel.projectId,true);}
    else shift(s,'hidden',{stress:2});
    Object.assign(results.at(-1),{performed:presented,outcome:presented?'presented':performed?'presentation_failed':'not_completed'});
    log(s,{kind:'research-travel',calendarMonth:actualMonth,joining,rooms:joining?2:1,sharedConsent:false,attendance:overseas,performed:presented,cost:travelCost,projectId:s.travel.projectId});
  }
  if(s.travel.status==='accepted'&&s.month>=s.travel.conferenceMonth){s.travel.status='expired';log(s,{kind:'abstract-window-closed'});}
  delete s.weeklyExecuted;const performed=results.filter(r=>r.performed).length;
  if(training)log(s,{kind:'military-training',weeks:3,advising:false});
  const availableWeeks=results.filter(r=>r.outcome!=='training').length;
  const report={month:s.month,results,fundingResults:fundingResults(s),completion:availableWeeks?performed/availableWeeks:0,progress:results.reduce((n,r)=>n+r.progress,0),scienceFailures:results.reduce((n,r)=>n+r.scienceFailures,0),published:s.career.papers-papers,conferences:s.career.conferences-conferences,scheduleDiscussion:{changed,approach,accepted,total:plan.length,acceptance,rapportChange}};
  s.lastReport=report;log(s,{kind:'month',plan:[...plan],results,progress:report.progress,papers:report.published,feedback:type,facultyAction:action});
  const mentalLoad=s.month<=24?BALANCE.undergradResilienceDecay:s.month>=48&&s.month<=72?BALANCE.earlyDoctoralResilienceDecay:BALANCE.graduateResilienceDecay;shift(s,'hidden',{motivation:-.5,stress:.8,resilience:-mentalLoad});
  if(s.hidden.stress>70)shift(s,'hidden',{resilience:-1});
  if(s.sabbatical.active&&s.month>=s.sabbatical.until)s.sabbatical.active=false;
  advanceImpact(s);checkFailure(s);if(s.ending)return s;
  academicDue(s);monthlyIssues(s);
  if(!s.pendingQueue.length&&s.month<MONTHS){const latest=s.history.filter(h=>h.kind==='event'&&EVENTS.find(e=>e.id===h.id)?.kind==='counseling').at(-1)?.month??0;if(s.month-latest>=6){const pool=EVENTS.filter(e=>e.kind==='counseling'&&eventEligible(s,e));if(pool.length)queue(s,{kind:'event',id:pool[(Math.imul((s.creationSeed??s.seed)^s.month,2654435761)>>>0)%pool.length].id});}}
  if(!s.pendingQueue.length&&s.month<MONTHS&&random(s)<BALANCE.randomEventProbability){const eligible=EVENTS.filter(e=>e.kind!=='counseling'&&e.kind!=='dilemma'&&eventEligible(s,e));if(eligible.length){const e=selectWeightedEvent(s,eligible);queue(s,{kind:'event',id:e.id});}}
  if(!s.pendingQueue.length&&s.month<MONTHS){const pool=DILEMMAS.filter(e=>eventEligible(s,e));if(pool.length){const id=pool[(Math.imul((s.creationSeed??s.seed)^s.month,2246822519)>>>0)%pool.length].id;queue(s,{kind:'event',id});}}
  nextPending(s);return s;
}
export function failureRun(s){let count=0;for(const r of s.history.filter(h=>h.kind==='month').flatMap(h=>h.results??[])){if(r.outcome==='training')continue;if(!r.performed||r.scienceFailures>0||r.outcome==='presentation_failed')count++;else if(!['rest','travel','coffee'].includes(r.actual))count=0;}return count;}
function monthlyIssues(s){
 const current=s.history.filter(h=>h.month===s.month);const ids=new Set();
 for(const h of current){const id=['portfolio-selection','grant-selection'].includes(h.kind)?(h.awarded?'grant-selected':'grant-rejected'):h.kind==='presentation-award'?'presentation-award':null;if(id)ids.add(id);}
 for(const id of ids)if(s.pendingQueue.length<8)queue(s,{kind:'monthly-issue',id});
 if(studentTrainingActive(s))return;
 const previous=calendarMonth(s.month-1,s.locale);if([3,9].includes(calendarMonth(s.month,s.locale))&&s.month<MONTHS&&s.pendingQueue.length<8)queue(s,{kind:'conference-plan',scope:'domestic',targetMonth:s.month+1});
 if([7,1].includes(previous)&&s.month>=24&&s.pendingQueue.length<8)queue(s,{kind:'conference-plan',scope:'overseas'});
 if([7,1].includes(calendarMonth(s.month,s.locale))&&s.pendingQueue.length<8)queue(s,{kind:'workshop-plan'});
 const lastFailure=s.history.filter(h=>h.kind==='failure-support').at(-1)?.month??-6;
 if(failureRun(s)>=3&&s.month-lastFailure>=6&&s.pendingQueue.length<8)queue(s,{kind:'failure-counsel'});
 if(s.month<95&&s.pendingQueue.length<8&&s.month%6===3){const d=(Math.imul((s.creationSeed??s.seed)^(s.month*7919),2654435761)>>>0)/4294967296;if(d<.55)queue(s,{kind:'conversation-topic'});}
}
function presentationAward(s,projectId,abroad=false){
 const h=scores(s),work=projectId===s.project.id?projectWork(s):projectThresholds(s).submission;
 if(h.language<65||work<projectThresholds(s).conference*1.25||s.history.some(e=>e.kind==='presentation-award'&&e.projectId===projectId))return;
 if(random(s)<clamp(.05+(h.language-65)*.005+Math.min(1,work/projectThresholds(s).submission)*.12+(h.luck-50)*.001,.02,.4)){s.career.awards++;shift(s,'hidden',{stress:-6,confidence:3,motivation:3});log(s,{kind:'presentation-award',projectId,abroad});}
}
export function degreeRequirements(s,level='phd') { return degreeTargets(s.professorProfile.fieldId,level); }
const requirementsMet=(s,level)=>Object.entries(degreeRequirements(s,level)).every(([key,n])=>s.career[key]>=n);
// The invitation is advice; the student may choose to finish the degree instead.
export function internalAdmissionRefusalChance(s){
 const rapport=abilityScore(s,'rapport');
 return rapport>=60?0:clamp((60-rapport)*.012+(s.hidden.motivation<50?.08:0),0,.5);
}
function declinesInternalAdmission(s,level){
 const chance=internalAdmissionRefusalChance(s),declined=chance>0&&random(s)<chance;
 log(s,{kind:'admission-response',level,declined,choice:declined?'graduate':'remain'});
 return declined;
}
export function qualificationStudy(s,since=Math.max(0,s.month-18)){return s.history.filter(h=>h.kind==='month'&&h.month>=since).flatMap(h=>h.results??[]).filter(r=>r.actual==='coursework'&&r.performed).length;}
export function canContinue(s) { return abilityScore(s,'rapport')>=30&&s.hidden.motivation>=30&&(!(s.route==='masters'&&s.month>=48)||requirementsMet(s,'masters')); }
export function canDefend(s) { return s.career.qual==='passed'&&abilityScore(s,'research')>=50&&requirementsMet(s,'phd'); }
export const TRUE_REQUIREMENTS={learning:78,research:82,language:70,social:60,autonomy:78,teaching:65,rapport:80,resilience:60,manners:60,motivation:65,papers:3,conferences:3,recommendations:3,faculty:40};
// A fresh doctorate is assessed on a small, prepared body of work. Awards help
// the student's record, but winning a random award is not an appointment gate.
export const TRUE_RESEARCH_REQUIREMENTS={leadingPaper:1,hIndex:2};
export function recommendationCandidate(s) { return canDefend(s)&&s.career.topPapers>=TRUE_RESEARCH_REQUIREMENTS.leadingPaper&&(s.impact?.hIndex??0)>=TRUE_RESEARCH_REQUIREMENTS.hIndex&&Object.entries(TRUE_REQUIREMENTS).filter(([k])=>k!=='rapport').every(([k,n])=>k==='faculty'?FACULTY_KEYS.every(f=>s.professor[f]>=n):(k in s.hidden?abilityScore(s,k):s.career[k])>=n); }
export function isTrueEnding(s) { return recommendationCandidate(s)&&abilityScore(s,'rapport')>=TRUE_REQUIREMENTS.rapport; }
export function careerScores(s) {
  const h=scores(s),c=s.career;
  return {
    institute:h.research>=70&&h.learning>=65&&h.autonomy>=60&&(c.papers>=4||c.papers>=2&&c.topPapers>=1)?h.research*.45+h.learning*.2+h.autonomy*.2+Math.min(c.papers,5)*3:-1,
    corporate:h.industry>=55&&h.research>=50?h.industry*.65+h.research*.35:-1,
    unrelated:h.industry>=20&&h.social>=45&&h.autonomy>=45?h.industry*.35+h.social*.35+h.autonomy*.3:-1,
    startup:h.enterprise>=65&&h.autonomy>=60?h.enterprise*.7+h.autonomy*.3:-1,
    youtuber:Math.max(h.language>=90&&h.social>=90?80:-1,h.outreach>=65&&h.language>=45?h.outreach*.75+h.language*.15+h.social*.1:-1),
  };
}
export function careerEnding(s) { if(s.ending==='masters'||s.pending?.kind==='masters')return 'masters';if(isTrueEnding(s))return 'true';if(recommendationCandidate(s)&&abilityScore(s,'rapport')>=40)return 'postdoc';if(canDefend(s)&&abilityScore(s,'rapport')>=85&&s.temperament.caution>=65&&s.professor.mentoring>=40)return 'resident_researcher';const priority=['youtuber','startup','corporate','institute','unrelated'];const ranked=Object.entries(careerScores(s)).sort((a,b)=>b[1]-a[1]||priority.indexOf(a[0])-priority.indexOf(b[0]));return ranked[0][1]>=0?ranked[0][0]:'unemployed'; }
function applyEvent(s,o,event) {
  const collaborationFactor=event.id==='collaboration'?.75+abilityScore(s,'social')/200:1;
  for(const group of ['hidden','professor','lab'])if(o.effects?.[group])shift(s,group,o.effects[group]);
  for(const [key,n] of Object.entries(o.effects?.career||{})) {
    if(!['awards','topPapers','recommendations'].includes(key)||!Number.isInteger(n))continue;
    if(key==='topPapers'&&s.career.papers>0)s.career.topPapers=clamp(s.career.topPapers+n,0,s.career.papers);
    if(key==='awards'&&event.id==='best-presentation'&&s.history.some(h=>h.kind==='presentation-award'))continue;
    if(key==='awards'&&(s.career.papers>0||s.career.conferences>0))s.career.awards=clamp(s.career.awards+n,0,s.career.papers+s.career.conferences);
    if(key==='recommendations'&&s.career.papers>0)s.career.recommendations=Math.max(0,s.career.recommendations+n);
  }
  if(Number.isFinite(o.progress)&&s.project.phase<5)s.project.eventSupport=clamp((s.project.eventSupport??0)+o.progress*collaborationFactor/100,-.25,.25);
}
export function decide(state,choice) {
  if(!validateSave(state))throw new Error('Invalid saved game.');
  const s=structuredClone(state),p=s.pending;if(!p||s.ending)throw new Error('No pending decision.');
  if(p.kind==='story'){
    if(!['encourage','review'].includes(choice))throw new Error('Invalid story choice.');
    shift(s,'hidden',choice==='encourage'?{rapport:1,motivation:1,stress:-1}:{learning:.5,autonomy:.5});log(s,{kind:'story',id:p.id,choice});
  } else if(p.kind==='presentation-recovery'){
    if(!['rehearse','support'].includes(choice))throw new Error('Invalid presentation support.');
    shift(s,'hidden',choice==='rehearse'?{language:1,confidence:1,stress:-1}:{rapport:1,stress:-2});log(s,{kind:'presentation-support',choice,abroad:p.abroad});
  } else if(p.kind==='academic-exam'){
    if(!['support','routine'].includes(choice))throw new Error('Invalid exam choice.');
    const prepared=s.lastReport.results.filter(r=>(r.actual==='coursework'||r.actual==='study')&&r.performed).length;
    if(choice==='support')shift(s,'hidden',{stress:-2,rapport:1});
    shift(s,'hidden',prepared?{learning:p.level==='undergrad'?1:.3,confidence:1}:{stress:p.level==='undergrad'?3:1});log(s,{kind:'academic-exam',level:p.level,examType:p.examType,prepared:prepared>0,choice});
  } else if(p.kind==='thesis'){
    const expected=({draft:['outline','rehearse'],presentation:['present'],questions:['answer'],revision:['revise'],verdict:['confirm']})[p.step];if(!expected.includes(choice))throw new Error('Invalid thesis choice.');
    if(p.level==='masters'&&s.route!=='masters')throw new Error('Integrated programs have no separate master defense.');
    if(p.step==='draft')shift(s,'hidden',choice==='outline'?{research:1,language:1}:{language:1,confidence:1});
    if(p.step==='questions')shift(s,'hidden',{autonomy:1,language:.5});
    if(p.step==='revision')shift(s,'hidden',{language:.5});
    const ready=p.level==='masters'?requirementsMet(s,'masters'):canDefend(s);
    log(s,{kind:'thesis',level:p.level,step:p.step,choice,...(p.step==='revision'?{revision:abilityScore(s,'research')>=60&&abilityScore(s,'language')>=50?'minor':'major'}:{}),...(p.step==='verdict'?{passed:ready}:{})});
    if(p.step==='presentation')s.pendingQueue.unshift({kind:'thesis',level:p.level,step:'questions'});
    if(p.step==='questions')s.pendingQueue.unshift({kind:'thesis',level:p.level,step:'revision'});
    if(p.step==='verdict'&&!ready&&(p.level!=='masters'||s.mastersExtended))return finish(s,'gameover','graduation_requirements');
  } else if(p.kind==='monthly-issue'){
    const o=monthlyIssueOptions(s,p.id).find(o=>o.value===choice);if(!o||o.disabled)throw new Error('Invalid monthly issue choice.');applyEvent(s,o,{id:p.id});log(s,{kind:'issue-read',id:p.id,choice,response:o.response});
  } else if(p.kind==='conference-plan'){
    if(!['none','professor','together','student'].includes(choice)||p.scope==='overseas'&&studentAttends(choice)&&!canTravel(s))throw new Error('Invalid conference plan.');s.attendance??={domestic:'together',overseas:'none'};s.attendance[p.scope]=choice;log(s,{kind:'conference-plan',scope:p.scope,attendance:choice,...(p.targetMonth!==undefined?{targetMonth:p.targetMonth}:{})});
  } else if(p.kind==='workshop-plan'){
    const options={host:{cost:12,energy:8,effects:{learning:1,research:1,social:2,stress:2}},small:{cost:3,energy:3,effects:{learning:.7,social:1,stress:-1}},skip:{cost:0,energy:0,effects:{stress:-1}}},o=options[choice];if(!o)throw new Error('Invalid workshop choice.');if(s.lab.funds<o.cost)throw new Error('Insufficient workshop funds.');s.lab.funds-=o.cost;s.professorEnergy=Math.max(0,s.professorEnergy-o.energy);shift(s,'hidden',o.effects);if(choice!=='skip')shift(s,'professor',{research:1,mentoring:1});log(s,{kind:'workshop',choice,cost:o.cost});
  } else if(p.kind==='failure-counsel'){
    if(!['support','review','independent','strict'].includes(choice))throw new Error('Invalid failure consultation.');shift(s,'hidden',({support:{resilience:1.2,stress:-5,rapport:2,motivation:1},review:{research:1,learning:1,resilience:.5,stress:-2,rapport:1},independent:{autonomy:2,rapport:-.2,stress:1},strict:{diligence:1,stress:4,rapport:-2,resilience:-.4}})[choice]);log(s,{kind:'failure-support',choice});
  } else if(p.kind==='conversation-topic'){
    const topics={daily:'counsel-daily-life',academic:'counsel-coursework',research:'counsel-results'};if(!Object.hasOwn(topics,choice))throw new Error('Invalid conversation topic.');const eligible=EVENTS.filter(e=>e.kind==='counseling'&&eventEligible(s,e));const event=eligible.find(e=>e.id===topics[choice])??eligible[0];if(event)s.pendingQueue.unshift({kind:'event',id:event.id});log(s,{kind:'conversation-topic',topic:choice});
  } else if(p.kind==='event') {
    const e=EVENTS.find(e=>e.id===p.id),o=e?dilemmaOptions(s,e)[choice]:null;if(!Number.isInteger(choice)||!o)throw new Error('Invalid event choice.');
    if(o.effects?.lab?.funds<0&&s.lab.funds<-o.effects.lab.funds)throw new Error('Insufficient funds for this purchase.');applyEvent(s,o,e);const old=s.eventFlags[e.id];s.eventFlags[e.id]={lastMonth:s.month,count:(old?.count||0)+1};log(s,{kind:'event',id:e.id,choice,...(o.response?{response:o.response}:{})});
  } else if(p.kind==='external-admission'){
    if(!['encourage','remain'].includes(choice))throw new Error('Invalid admission advice.');
    const stayed=choice==='encourage'&&random(s)<clamp(.1+abilityScore(s,'rapport')*.006,.1,.7);log(s,{kind:'external-admission',level:p.level,choice,stayed});
    if(choice==='encourage'&&!stayed)return finish(s,p.level==='bachelor'?'external_masters':'external_phd');
    if(stayed){shift(s,'hidden',{rapport:1,autonomy:1});queue(s,{kind:'monthly-issue',id:'internal-admission'});}
    shift(s,'hidden',{rapport:-.3,autonomy:.5});
  } else if(p.kind==='route') {
    if(!['masters','integrated','graduate'].includes(choice))throw new Error('Invalid route.');
    if(choice==='graduate'||!canContinue(s)||declinesInternalAdmission(s,'bachelor'))return finish(s,'bachelor');s.route=choice;log(s,{kind:'route',route:choice});
  } else if(p.kind==='masters') {
    if(!['continue','graduate','extend'].includes(choice))throw new Error('Invalid degree decision.');
    const eligible=requirementsMet(s,'masters');
    if(choice==='extend') {if(s.mastersExtended)throw new Error('The master review can only be extended once.');s.mastersExtended=true;s.mastersReviewAt=54;log(s,{kind:'masters-extension'});}
    else if(choice==='graduate')return finish(s,eligible?'masters':'gameover',eligible?null:'graduation_requirements');
    else {if(!eligible)throw new Error('A manuscript submission and conference presentation are required before advancement.');if(!canContinue(s)||declinesInternalAdmission(s,'masters'))return finish(s,'masters');s.mastersExtended=false;log(s,{kind:'promotion'});}
  } else if(p.kind==='qual') {
    if(!['exam','prepare','graduate'].includes(choice))throw new Error('Invalid qualification choice.');
    if(choice==='graduate')return finish(s,s.route==='masters'?'masters':'gameover',s.route==='masters'?null:'qual_failure');
    if(choice==='prepare') {
      if(s.qualPreparations>=2)throw new Error('The qualification exam can only be deferred twice.');s.qualPreparations++;s.qualDeferredAt=s.month+1;s.career.qual='preparing';shift(s,'hidden',{learning:6,confidence:4,stress:-6});log(s,{kind:'qual-preparation'});
    } else {
      s.career.qualAttempts++;
      const h=scores(s),mastered=h.learning>=45&&h.research>=40&&h.motivation>=25;
      const coursework=qualificationStudy(s),firstFailure=s.history.find(h=>h.kind==='qual'&&!h.passed),afterFailure=firstFailure?qualificationStudy(s,firstFailure.month+1):coursework,prepared=coursework>=6&&(!firstFailure||afterFailure>=2);
      const passed=prepared&&mastered&&(h.learning>=65||random(s)<clamp(.86+Math.min(.08,coursework*.01)+(h.luck-50)*.0006,.82,.97));
      s.career.qual=passed?'passed':'failed';log(s,{kind:'qual',passed,attempt:s.career.qualAttempts,coursework,afterFailure});
      if(passed)shift(s,'hidden',{motivation:5,confidence:5});
      else if(s.career.qualAttempts>=2)return finish(s,'dismissed','qual_failure');
      else {s.qualDeferredAt=s.month+3;shift(s,'hidden',{motivation:-3,stress:3});}
    }
  } else if(p.kind==='sabbatical') {
    if(!['home','away'].includes(choice))throw new Error('Invalid sabbatical choice.');s.sabbatical={...s.sabbatical,active:true,until:Math.min(MONTHS,s.month+12),mode:choice};log(s,{kind:'sabbatical',mode:choice});
  } else if(p.kind==='service'||p.kind==='service-review') {
    if(!['consult','skip','training'].includes(choice)||s.service.completed)throw new Error('Invalid service consultation.');
    // Narrative counseling only: this never assigns a legal service status or guarantees selection.
    if(s.locale!=='ko'||s.gender!=='male')throw new Error('This consultation is not applicable.');
    if(choice==='training'){if(s.service.trainingStartMonth!==undefined||s.service.trainingReturnMonth!==undefined)throw new Error('Training has already been scheduled or shown.');const start=winterTrainingMonth(s);if(start===null)throw new Error('No winter training window remains.');s.service.trainingStartMonth=start;s.service.trainingReturnMonth=start+1;}
    s.service.status=choice==='training'?'consulted':choice==='consult'?(p.kind==='service'?'planning':'consulted'):'not_requested';log(s,{kind:p.kind,choice});
    if(choice==='consult'&&s.professorProfile.gender==='male')shift(s,'hidden',{rapport:2.2});
  } else if(p.kind==='defense') {
    if(choice!=='defend')throw new Error('Invalid defense choice.');return finish(s,canDefend(s)?careerEnding(s):'gameover',canDefend(s)?null:'graduation_requirements');
  }
  s.pending=null;if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');nextPending(s);return s;
}
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
const number=(n,min=0,max=100)=>Number.isFinite(n)&&n>=min&&n<=max;
const integer=(n,min=0,max=10000)=>Number.isInteger(n)&&n>=min&&n<=max;
function validPending(p) { if(p?.kind==='monthly-issue'&&!['grant-selected','grant-rejected','presentation-award','internal-admission'].includes(p.id)||p?.kind==='conference-plan'&&!['domestic','overseas'].includes(p.scope))return false; if(p?.kind==='conference-plan'&&p.targetMonth!==undefined&&!integer(p.targetMonth,1,96))return false; if(p?.kind==='presentation-recovery'&&typeof p.abroad!=='boolean')return false;if(p?.kind==='story'&&!Object.hasOwn(CHAPTERS,p.id)||p?.kind==='academic-exam'&&(!['undergrad','graduate'].includes(p.level)||!['중간고사','기말고사'].includes(p.examType))||p?.kind==='thesis'&&(!['masters','phd'].includes(p.level)||!THESIS_STEPS.includes(p.step)))return false;return p===null||(plain(p)&&PENDING_KINDS.includes(p.kind)&&(p.kind!=='event'||EVENTS.some(e=>e.id===p.id))&&(p.kind!=='external-admission'||['bachelor','masters'].includes(p.level))); }
function validWeeklyResult(r,index) { return plain(r)&&(r.actual==='training'||r.outcome==='training'?r.actual==='training'&&r.outcome==='training'&&index<3&&r.performed===false&&r.progress===0&&r.scienceFailures===0:true)&&(r.assigned===undefined||knownActivity(r.assigned))&&(r.destination===undefined||['mountain','sea','city','bed'].includes(r.destination))&&(r.deviation===undefined||['rest-needed','unfinished'].includes(r.deviation))&&r.week===index+1&&knownActivity(r.proposed)&&(knownActivity(r.actual)||['unfinished','travel','training'].includes(r.actual))&&(r.autonomous===undefined||r.proposed==='free'&&['study','coursework','experiment','analysis','rest','travel'].includes(r.autonomous))&&(r.abroad===undefined||typeof r.abroad==='boolean')&&typeof r.performed==='boolean'&&WEEKLY_OUTCOMES.includes(r.outcome)&&number(r.progress,0,1000)&&integer(r.scienceFailures,0,1)&&(r.researchGrade===undefined||['완전성공','성공','보통','약간실패','실패'].includes(r.researchGrade))&&(r.weight===undefined||number(r.weight,0,1000))&&(r.successRate===undefined||number(r.successRate,0,1))&&(r.successProbability===undefined||number(r.successProbability,0,1)); }
export function migrateSave(raw) {
  if(!plain(raw)||![3,VERSION].includes(raw.version))return null;
  let s;try{s=structuredClone(raw);}catch{return null;}
  if(s.version===3){
    const gender=['male','female'].includes(s.professorGender)?s.professorGender:'other';
    s.version=VERSION;s.professorGender=gender;s.professorProfile={gender,age:42,fieldId:'050',labMode:getDiscipline('050').labModes[0],institution:'national'};s.professorEnergy=100;s.endingReason=null;
    if(s.ending==='unfinished'){s.ending='gameover';s.endingReason='graduation_requirements';}
    log(s,{kind:'save-migration',fromVersion:3});
  }
  s.sabbatical.start??=s.history.find(h=>h.kind==='sabbatical')?.month??(s.pending?.kind==='sabbatical'||s.pendingQueue?.some(p=>p.kind==='sabbatical')?s.month:Math.min(72,Math.max(24,Math.ceil(s.month/12)*12+12)));s.stipendLock??=s.lab.budget.salary;s.lab.budget.publicity=0;s.hidden=mergeRelationship(s.hidden);s.publication??={...DEFAULT_PUBLICATION};s.attendance??={domestic:'together',overseas:'none'};if(s.facultyAction==='abroad_shared')s.facultyAction='abroad_together';s.policies??={...DEFAULT_POLICIES};s.professorName??='지도교수';s.creationSeed??=s.seed;
  // Retire only previously scheduled events whose conditions were tightened in 4.12.
  // Validate the rest of the save before consulting its state; never reset a run.
  const revisedEvents=new Set(['teaching','grading','reviewer-two','sabbatical-contact']);
  const revised=p=>p?.kind==='event'&&revisedEvents.has(p.id);
  const previous=revised(s.pending)&&!s.ending?s.pending:null;
  if(previous)s.pending=null;
  if(!validateSave(s))return null;
  s.pendingQueue=s.pendingQueue.filter(p=>!revised(p)||eventEligible(s,EVENTS.find(e=>e.id===p.id)));
  if(previous){
    if(eventEligible(s,EVENTS.find(e=>e.id===previous.id)))s.pending=previous;
    else {log(s,{kind:'event-migration',id:previous.id});nextPending(s);}
  }
  if(!validateSave(s))return null;migrateFinance(s);ensureFunding(s);s.impact??=initialImpact();s.travel??=initialTravel();if(['abroad_student','abroad_together'].includes(s.facultyAction)){s.attendance.overseas=s.facultyAction==='abroad_student'?'student':'together';s.facultyAction='routine';}if(s.attendance.overseas!=='none'&&(![8,2].includes(calendarMonth(s.month,s.locale))||studentAttends(s.attendance.overseas)&&!canTravel(s)))s.attendance.overseas='none';s.plan=s.plan.map(currentActivity);if(!s.ending)s.allocation=allocateCredits(s.allocation,facultyCapacity(s).credits);return validateSave(s)?s:null;
}
export function validateSave(s) {
  if(!plain(s)||s.version!==VERSION||typeof s.name!=='string'||!s.name.trim()||s.name.length>24||!integer(s.month,0,MONTHS)||!integer(s.seed,0,4294967295)||!['male','female','unspecified'].includes(s.gender)||!['male','female','other','unspecified'].includes(s.professorGender)||!['ko','en'].includes(s.locale)||![null,'masters','integrated'].includes(s.route)||typeof s.started!=='boolean'||!(s.ending===null||ENDINGS.includes(s.ending)))return false;
  if(s.policies!==undefined&&!validPolicies(s.policies)||s.professorName!==undefined&&(typeof s.professorName!=='string'||!s.professorName.trim()||s.professorName.length>40))return false;
  const p=s.professorProfile;
  if(!plain(p)||!['male','female','other'].includes(p.gender)||!(p.gender===s.professorGender||p.gender==='other'&&s.professorGender==='unspecified')||!integer(p.age,30,55)||typeof p.fieldId!=='string'||getDiscipline(p.fieldId).id!==p.fieldId||!getDiscipline(p.fieldId).labModes.includes(p.labMode)||!['national','private','institute'].includes(p.institution)||!number(s.professorEnergy)||!(s.endingReason===null||['graduation_requirements','time_limit','qual_failure'].includes(s.endingReason)))return false;
  if(s.stipendLock!==undefined&&!integer(s.stipendLock,0,100)||s.sabbatical?.start!==undefined&&![24,36,48,60,72].includes(s.sabbatical.start))return false;
  if(s.advising!==undefined&&(!plain(s.advising)||!['listen','praise','critique','harsh',null].includes(s.advising.lastFeedback)||!integer(s.advising.streak,0,96)||!integer(s.advising.inattention,0,96)))return false;
  if(s.publication!==undefined&&!validPublication(s.publication,p.fieldId))return false;
  if(s.project?.journal!==undefined&&!isAvailableJournal(s.project.journal,p.fieldId)||s.project?.topicId!==undefined&&!validTopicId(s.project.topicId))return false;
  if(s.attendance!==undefined&&!validAttendance(s.attendance))return false;
  if(s.travel!==undefined&&!validTravel(s.travel,s.month))return false;
  if(s.impact!==undefined&&!validImpact(s.impact,s.career?.papers))return false;if(!validPortfolio(s)||!validFinance(s)||s.lab?.pool!==undefined&&!number(s.lab.pool,0,5000))return false;
  if(!plain(s.hidden)||Object.keys(s.hidden).some(k=>!HIDDEN_KEYS.includes(k))||!HIDDEN_KEYS.every(k=>number(s.hidden[k],...HIDDEN_RANGES[k]))||!plain(s.temperament)||!['curiosity','caution','expression'].every(k=>number(s.temperament[k]))||!plain(s.professor)||!FACULTY_KEYS.every(k=>number(s.professor[k]))||!validateGrants(s.grants))return false;
  if(!plain(s.eventFlags))return false;
  if(!plain(s.lab)||!number(s.lab.funds,0,5000)||(s.lab.debt!==undefined&&!number(s.lab.debt,0,OPERATING_ADVANCE_LIMIT))||(s.lab.creditEnabled!==undefined&&typeof s.lab.creditEnabled!=='boolean')||!number(s.lab.equipment)||!checkBudget(s.lab.budget)||!checkAllocation(s.allocation)||!FEEDBACK.includes(s.feedback)||!FACULTY_ACTIONS.includes(s.facultyAction))return false;
  if(!plain(s.career)||!['submissions','papers','conferences','festivalAttendance','recommendations','awards','topPapers','completedProjects','qualAttempts'].every(k=>integer(s.career[k]))||!['not_due','due','preparing','passed','failed'].includes(s.career.qual)||s.career.papers>s.career.submissions||s.career.topPapers>s.career.papers||s.career.awards>s.career.papers+s.career.conferences||s.career.completedProjects!==s.career.papers||s.career.qualAttempts>2)return false;
  if(!plain(s.project)||s.project.eventSupport!==undefined&&!number(s.project.eventSupport,-.25,.25)||!integer(s.project.id,1)||!integer(s.project.titleIndex,0,PROJECT_TITLES.length-1)||!integer(s.project.phase,0,5)||!number(s.project.progress,0,1000)||typeof s.project.conference!=='boolean'||typeof s.project.submitted!=='boolean'||!integer(s.project.reviewMonths)||!integer(s.project.revisions)||!(s.project.submittedAt===null||integer(s.project.submittedAt,1,s.month))||s.project.submitted&&(s.project.phase!==5||s.project.submittedAt===null))return false;
  if(!Array.isArray(s.plan)||![4,5].includes(s.plan.length)||!s.plan.every(knownActivity)||!Array.isArray(s.history)||s.history.length>3000||s.history.some(h=>!plain(h)||!integer(h.month,0,s.month)||typeof h.kind!=='string'||['paper','submission'].includes(h.kind)&&(h.journal!==undefined&&!Object.hasOwn(JOURNALS,h.journal)||h.impactFactor!==undefined&&h.impactFactor!==null&&!number(h.impactFactor,0,100)||h.citationWeight!==undefined&&!number(h.citationWeight,0,.12))))return false;
  if(!validPending(s.pending)||!Array.isArray(s.pendingQueue)||s.pendingQueue.length>8||!s.pendingQueue.every(p=>p!==null&&validPending(p))||s.ending&&(s.pending||s.pendingQueue.length)||s.pending?.kind==='event'&&!eventEligible(s,EVENTS.find(e=>e.id===s.pending.id)))return false;
  if(!plain(s.behavior)||!FEEDBACK.every(k=>integer(s.behavior[k]))||!integer(s.crisis,0,MONTHS)||!plain(s.eventFlags)||Object.entries(s.eventFlags).some(([id,f])=>!EVENTS.some(e=>e.id===id)||!plain(f)||!integer(f.lastMonth,0,s.month)||!integer(f.count,1)))return false;
  if(!plain(s.sabbatical)||typeof s.sabbatical.active!=='boolean'||!integer(s.sabbatical.until,0,MONTHS)||!['home','away'].includes(s.sabbatical.mode)||!plain(s.service)||!['none','planning','consulted','not_requested'].includes(s.service.status)||(s.service.completed!==undefined&&typeof s.service.completed!=='boolean')||(s.service.trainingReturnMonth!==undefined&&(!integer(s.service.trainingReturnMonth,0,MONTHS)||s.gender!=='male'||s.service.completed)))return false;
  if(s.service.trainingStartMonth!==undefined&&(!integer(s.service.trainingStartMonth,0,MONTHS-1)||![1,2].includes(calendarMonth(s.service.trainingStartMonth,s.locale))||s.service.trainingReturnMonth!==s.service.trainingStartMonth+1||s.gender!=='male'||s.service.completed))return false;
  if(!(s.qualDeferredAt===null||integer(s.qualDeferredAt,s.month,MONTHS))||!integer(s.qualPreparations,0,2)||![48,54].includes(s.mastersReviewAt)||typeof s.mastersExtended!=='boolean'||!integer(s.lastRecommendationMonth,-12,MONTHS)||!(s.lastAcademicWarning===null||integer(s.lastAcademicWarning,0,s.month)))return false;
  if(s.lastReport!==null&&(!plain(s.lastReport)||!integer(s.lastReport.month,1,s.month)||!number(s.lastReport.completion,0,1)||!Array.isArray(s.lastReport.results)||![4,5].includes(s.lastReport.results.length)||!s.lastReport.results.every(validWeeklyResult)||!number(s.lastReport.progress,0,1000)||!integer(s.lastReport.scienceFailures,0,5)||!integer(s.lastReport.published)||!integer(s.lastReport.conferences)||(s.lastReport.fundingResults!==undefined&&!validFundingResults(s.lastReport.fundingResults))))return false;
  return true;
}
