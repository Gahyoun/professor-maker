import {initialTravel,validTravel,abstractAcceptance,canTravel} from './travel.js';
import {facultyCapacity,allocateCredits} from './workload.js';
import {initialImpact,advanceImpact,validImpact,externalAdmissionEligible} from './impact.js';
import {ensureFunding,validPortfolio,canApplyGrant,validApplication,depositGrant,advancePortfolio} from './funding.js';
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
export function projectThresholds(s){const mode=getDiscipline(s.professorProfile.fieldId).graduation;const factor=mode==='conference'?.9:mode==='mixed'?1:1.1;return {phaseTargets:PROJECT_PHASES.map(p=>p.target*factor),conference:mode==='conference'?34:mode==='mixed'?44:54,submission:PROJECT_PHASES.slice(0,5).reduce((n,p)=>n+p.target*factor,0)};}
export function projectWork(s){const targets=projectThresholds(s).phaseTargets;return targets.slice(0,s.project.phase).reduce((n,p)=>n+p,0)+(s.project.phase===5?0:s.project.progress);}
export function developmentalStage(s){const level=s.month<24?'undergrad':s.month<48?'masters':stage(s);return {level,independence:level==='undergrad'?.78:level==='masters'?.94:1.05,errorRate:level==='undergrad'?BALANCE.undergraduateMistakeRate:level==='masters'?BALANCE.masterMistakeRate:BALANCE.doctoralMistakeRate};}

const activity = (ko, en, icon) => ({ ko, en, icon });
export const ACTIVITIES = {
  study: activity(['문헌 공부', '논문과 교재를 읽으며 연구 질문을 다듬는다.'], ['Read & study', 'Read papers and refine a research question.'], 'book'),
  experiment: activity(['실험', '관찰과 실험으로 가설을 검증한다.'], ['Experiment', 'Test a hypothesis against observations.'], 'flask'),
  analysis: activity(['데이터 분석', '재현성과 통계, 그래프를 점검한다.'], ['Analyze data', 'Check statistics, reproducibility and figures.'], 'chart'),
  paper: activity(['논문 쓰기', '결과를 정리하고 심사 의견에 답한다.'], ['Write a paper', 'Build an argument and answer reviewers.'], 'pen'),
  conference: activity(['학술 발표', '준비된 프로젝트를 학회에서 발표한다.'], ['Conference', 'Present a prepared project to peers.'], 'globe'),
  rest: activity(['휴식', '쉬는 시간을 일정의 일부로 확보한다.'], ['Rest', 'Protect time to recover.'], 'leaf'),
  coffee: activity(['커피와 대화', '연구실 밖에서 안부와 고민을 나눈다.'], ['Coffee & a conversation', 'Talk about life beyond the lab.'], 'cup'),
  language: activity(['언어와 발표 연습', '읽기와 글쓰기, 발표를 연습한다.'], ['Language & presentation', 'Practice reading, writing and speaking.'], 'globe'),
  industry: activity(['산학 협업', '현장의 문제를 연구와 연결한다.'], ['Industry collaboration', 'Connect research with practical problems.'], 'briefcase'),
  startup: activity(['창업 실험', '작은 시제품을 만들고 수요를 알아본다.'], ['Venture prototype', 'Build a prototype and investigate demand.'], 'spark'),
  video: activity(['과학 콘텐츠', '연구를 대중에게 설명하는 연습을 한다.'], ['Science communication', 'Practice explaining research to the public.'], 'play'),
  teach: activity(['수업과 멘토링', '다음 사람에게 배운 것을 전달한다.'], ['Teach & mentor', 'Help another person learn.'], 'book'),
};
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
  ...['social','creativity','diligence','rapport','trust','luck'].map(k=>[k,[-100,100]]),
  ...['motivation','stress','autonomy','teaching','industry','enterprise','outreach','intuition','confidence'].map(k=>[k,[0,100]]),
]);
const HIDDEN_KEYS = Object.keys(HIDDEN_RANGES);
// Public engine helper, not a display permission: the UI still keeps student values hidden.
export function abilityScore(stateOrHidden,key) { const h=stateOrHidden.hidden??stateOrHidden;const [lo,hi]=HIDDEN_RANGES[key]??[0,100];return (h[key]-lo)*100/(hi-lo); }
const scores=s=>Object.fromEntries(HIDDEN_KEYS.map(k=>[k,abilityScore(s,k)]));
const FACULTY_KEYS = ['research','teaching','admin','mentoring'];
const BUDGET_KEYS = ['salary','environment','performance','publicity'];
const FEEDBACK = ['listen','praise','critique','harsh'];
const WEEKLY_OUTCOMES = ['completed','recovered','not_completed','inconclusive','progress','presented','attended','preparing'];
const knownActivity = id => typeof id==='string'&&Object.hasOwn(ACTIVITIES,id);
const FACULTY_ACTIONS = ['routine','funding','recommend','support','report','abroad_student','abroad_together','abroad_shared','abstract'];
const ENDINGS = ['bachelor','masters','true','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','dropout','unfinished','gameover','external_masters','external_phd'];
const PENDING_KINDS = ['route','masters','qual','sabbatical','service','service-review','defense','event','external-admission'];
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
  s[group][k]=clamp(s[group][k]+buffered*(group==='hidden'?(hi-lo)/100:1),lo,hi);
} }
function log(s,entry) { s.history.push({month:s.month,...entry}); }
function finish(s,ending,reason=null) { s.ending=ending;s.endingReason=reason;s.pending=null;s.pendingQueue=[];log(s,{kind:'ending',ending,...(reason?{reason}:{})});return s; }
function newProject(s,id) { return {id,titleIndex:(id-1)%PROJECT_TITLES.length,phase:0,progress:0,conference:false,reviewMonths:0,submitted:false,submittedAt:null,revisions:0}; }
export function createState(name='김하늘',seed=Date.now(),{gender,professorGender='other',locale='ko',age=42,fieldId='050',labMode,institution='national',professorProfile}={}) {
  const requested=professorProfile??{gender:professorGender,age,fieldId,labMode,institution};
  const discipline=getDiscipline(requested.fieldId??fieldId);
  const profile={gender:['male','female','other'].includes(requested.gender)?requested.gender:'other',age:Number.isFinite(requested.age)?clamp(Math.round(requested.age),30,55):42,fieldId:discipline.id,labMode:discipline.labModes.includes(requested.labMode)?requested.labMode:discipline.labModes[0],institution:['national','private','institute'].includes(requested.institution)?requested.institution:'national'};
  const s={version:VERSION,name:String(name).trim().slice(0,24)||'김하늘',gender:'unspecified',professorGender:profile.gender,professorProfile:profile,professorEnergy:100,locale:locale==='en'?'en':'ko',month:0,route:null,started:false,
    hidden:{learning:299.7,research:249.75,language:299.7,social:-30,stamina:849.15,resilience:649.35,manners:599.4,creativity:0,diligence:20,rapport:30,trust:20,luck:0,motivation:70,stress:12,autonomy:20,teaching:10,industry:0,enterprise:0,outreach:0,intuition:28,confidence:55},
    temperament:{curiosity:50,caution:50,expression:50},professor:{research:55,teaching:55,admin:55,mentoring:55},lab:{funds:600,budget:{salary:60,environment:2,performance:3,publicity:1},equipment:100},
    career:{submissions:0,papers:0,conferences:0,festivalAttendance:0,recommendations:0,awards:0,topPapers:0,completedProjects:0,qual:'not_due',qualAttempts:0},
    grants:initialGrants(),project:null,plan:['study','experiment','rest','coffee'],feedback:'listen',allocation:{research:2,teaching:2,admin:2,mentoring:2},facultyAction:'routine',
    sabbatical:{active:false,until:0,mode:'home'},service:{status:'none'},history:[],lastReport:null,crisis:0,ending:null,endingReason:null,pending:null,pendingQueue:[],eventFlags:{},seed:Number(seed)>>>0,behavior:{harsh:0,listen:0,praise:0,critique:0},qualDeferredAt:null,qualPreparations:0,mastersReviewAt:48,mastersExtended:false,lastRecommendationMonth:-12,lastAcademicWarning:null};
  // Always draw the gender value, including when overridden: abilities share the same seed.
  const sexDraw=random(s);s.gender=['male','female','unspecified'].includes(gender)?gender:sexDraw<.55?'male':'female';
  const initial={learning:[30,7],research:[25,7],language:[30,8],social:[35,12],intuition:[28,7],manners:[60,10],stamina:[85,7],resilience:[55,15],luck:[50,12],diligence:[55,15],creativity:[50,15],motivation:[70,8],rapport:[65,7],trust:[60,7],confidence:[55,10]};
  for(const [key,[mean,sd]] of Object.entries(initial)){const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+gaussian(s,mean,sd)*(hi-lo)/100;}
  for (const k of Object.keys(s.temperament)) s.temperament[k]=gaussian(s,50,12);
  s.creationSeed=Number(seed)>>>0;s.allocation=allocateCredits(s.allocation,facultyCapacity(s).credits);s.travel=initialTravel();s.impact=initialImpact();ensureFunding(s);s.creationSeed=Number(seed)>>>0;s.policies={...DEFAULT_POLICIES};s.professorName='지도교수';s.project=newProject(s,1);s.plan=proposeSchedule(s);return s;
}
export function stage(s) { return s.month<24?'undergrad':s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?'masters':'phd'; }
export function calendarMonth(month,locale='ko') { return ((month+(locale==='en'?8:2))%12)+1; }
export function salaryBase(s) { return s.month<24?13:s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?22:30; }
export function monthlyBudgetCost(s,budget=s.lab.budget) { const wet=s.professorProfile.labMode==='wet';return salaryBase(s)*budget.salary/100+budget.environment*(wet?2.5:2)+budget.performance*2+budget.publicity+(wet?3:0); }
export function proposeSchedule(s) {
  const phase=s.project?.phase||0;
  const primary=['study','experiment','experiment','analysis','paper','paper'][phase];
  const secondary=phase===0?'study':phase===1?'study':phase===2?'analysis':primary;
  const h=scores(s);
  const care=h.stamina<60||h.stress>45?'rest':h.rapport<45?'coffee':'rest';
  const growth=h.motivation<40?'coffee':phase>=1&&!s.project.conference?'conference':h.language<55?'language':s.temperament.expression>60?'teach':s.temperament.curiosity>60?'analysis':'study';
  return [primary,secondary,[4,10].includes(calendarMonth(s.month,s.locale))?'conference':care,[4,10].includes(calendarMonth(s.month,s.locale))?'rest':growth];
}
function checkAllocation(a,total) {const sum=FACULTY_KEYS.reduce((n,k)=>n+(a?.[k]??0),0);return a&&FACULTY_KEYS.every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=12)&&(total===undefined?sum>=7&&sum<=12:sum===total);}
function checkBudget(b) { return b&&Number.isInteger(b.salary)&&b.salary>=0&&b.salary<=100&&['environment','performance','publicity'].every(k=>Number.isInteger(b[k])&&b[k]>=0&&b[k]<=6); }
function queue(s,p) { s.pendingQueue.push(p); }
function nextPending(s) { s.pending=s.pendingQueue.shift()||null; }
function academicDue(s) {
  if(s.month===20)queue(s,{kind:'event',id:'undergraduate-contest'});
  if(s.month===24){if(externalAdmissionEligible(s,'bachelor')&&canContinue(s))queue(s,{kind:'external-admission',level:'bachelor'});queue(s,{kind:'route'});}
  if(s.month===36&&s.locale==='ko'&&s.gender==='male')queue(s,{kind:'service'});
  if(s.month===s.mastersReviewAt&&s.route==='masters'){if(externalAdmissionEligible(s,'masters')&&requirementsMet(s,'masters')&&canContinue(s))queue(s,{kind:'external-admission',level:'masters'});queue(s,{kind:'masters'});}
  if((s.route==='integrated'&&s.month===48)||(s.route==='masters'&&s.month===60)||s.qualDeferredAt===s.month){s.career.qual='due';queue(s,{kind:'qual'});s.qualDeferredAt=null;}
  if(s.month===48)queue(s,{kind:'sabbatical'});
  if(s.month===84&&s.locale==='ko'&&s.gender==='male'&&s.service.status==='planning')queue(s,{kind:'service-review'});
  if(s.month===MONTHS)queue(s,{kind:'defense'});
}
export function feedbackEffect(s,type){
 const r=s.lastReport;if(type==='harsh')return {effects:{rapport:-5,trust:-5,confidence:-3,motivation:-2,stress:6},efficiency:.85};if(!r||type==='listen')return {effects:{},efficiency:1};
 const well=(r.progress>0||r.published>0||r.conferences>0)&&r.completion>=.65;
 const difficulty=!well&&(r.scienceFailures>0||r.completion<.65);
 if(type==='praise')return well?{effects:{stress:-3,rapport:2,trust:1,motivation:4,confidence:3},efficiency:BALANCE.praiseEfficiency}:{effects:{motivation:-3,confidence:-2,rapport:-2,trust:-3,stress:2},efficiency:BALANCE.mismatchedFeedbackEfficiency};
 if(type==='critique')return difficulty?{effects:{research:2,intuition:1,stress:2},efficiency:BALANCE.critiqueEfficiency}:{effects:{motivation:-3,rapport:-3,trust:-3,confidence:-3,stress:3},efficiency:BALANCE.mismatchedFeedbackEfficiency};
 return {effects:{rapport:-5,trust:-5,confidence:-3,motivation:-2,stress:6},efficiency:.85};
}
function feedback(s,type){s.behavior[type]++;const effect=feedbackEffect(s,type);shift(s,'hidden',effect.effects);s.monthlyEfficiency=effect.efficiency;}
function policyMonth(s){
 const p=s.policies??DEFAULT_POLICIES;
 shift(s,'hidden',({free:{stamina:3,stress:-2,autonomy:.7},core:{stamina:1,stress:-1,diligence:.25},regular:{diligence:.6,stamina:-2,stress:.8},intensive:{diligence:.8,stamina:-6,stress:3}})[p.work]);
 shift(s,'hidden',({study:{learning:.9,research:.1},learn:{learning:.5,research:.25},research:{learning:.2,research:.5},intensive:{research:.8,learning:.1,stamina:-1,stress:.5}})[p.study]);
}
function facultyMonth(s) {
  const capacity=s.workload??facultyCapacity({...s,month:Math.max(0,s.month-1)});
  for(const k of FACULTY_KEYS){const allotted=s.allocation[k],decay=k==='teaching'&&!capacity.teachingRequired?-.35:allotted===0?-7:allotted===1?-2:0;const gain=allotted>=2?(1.1+(allotted-2)*2.3)*capacity.efficiency:0;shift(s,'professor',{[k]:decay+gain});}
  if(capacity.teachingRequired){shift(s,'professor',{teaching:-.7-Math.max(0,3-s.allocation.teaching)*1.2,admin:-.4});}
  if(s.sabbatical.active) {
    shift(s,'professor',{research:1,teaching:0,admin:-.5,mentoring:s.sabbatical.mode==='away'?-2.5:-.7});
    if(s.sabbatical.mode==='away')shift(s,'hidden',{rapport:-1.5,autonomy:1});
  }
  if(s.facultyAction==='funding'){shift(s,'professor',{research:2,admin:3,mentoring:-3});}
  else if(s.facultyAction==='report')shift(s,'professor',{admin:3,research:-1});
  else if(s.facultyAction==='support'){shift(s,'professor',{mentoring:2,research:-1});shift(s,'hidden',{rapport:2,trust:1,motivation:2,stress:-2,resilience:.2});}
  else if(s.facultyAction==='recommend') {
    shift(s,'professor',{mentoring:1,admin:-1});
    if(s.career.papers>0&&s.month-s.lastRecommendationMonth>=12){s.career.recommendations++;s.lastRecommendationMonth=s.month;shift(s,'hidden',{autonomy:2,motivation:2});log(s,{kind:'recommendation'});}
  }
  if(s.professorProfile.institution==='private')shift(s,'hidden',{autonomy:.12});
  const researchWeeks=s.plan.filter(id=>['study','experiment','analysis','paper'].includes(id)).length;
  const load=(FACULTY_KEYS.some(k=>s.allocation[k]>=4)?3:0)+(['funding','report'].includes(s.facultyAction)?3:0)+(s.facultyAction.startsWith('abroad_')?4:0)+(researchWeeks>=3?researchWeeks-1:0);
  const aging=1+(s.professorProfile.age+s.month/12-30)/50;
  s.professorEnergy=clamp(s.professorEnergy+4-load*aging);
  if(s.professorEnergy<25)for(const k of FACULTY_KEYS)shift(s,'professor',{[k]:-1});
}
function upkeep(s) {
  const b=s.lab.budget;
  shift(s,'hidden',{motivation:(b.salary-50)*.05,stamina:b.salary>=50?1:-2,intuition:b.salary>=60?.35:0,stress:b.salary<30?3:0,rapport:b.salary>=70?.5:b.salary<30?-2:0,trust:b.salary>=70?.4:b.salary<30?-2:0});
  shift(s,'lab',{equipment:(b.environment-2)*3+(s.professorProfile.labMode==='wet'?1.5:.5)});
  shift(s,'hidden',{outreach:b.publicity*.13});
}
const matching=[['study','analysis'],['experiment','study'],['experiment','analysis'],['analysis','experiment'],['paper','language'],['paper','analysis']];
function scienceProgress(s,id,result) {
  if(!['study','experiment','analysis','paper'].includes(id))return;
  const p=s.project,h=scores(s);
  if(p.phase===5&&p.submitted)return; // Peer review proceeds asynchronously.
  const fit=matching[p.phase].includes(id);
  const skill=id==='study'?h.learning:id==='paper'?(h.research+h.language)/2:(h.research+h.intuition)/2;
  const environmentSupport=id==='experiment'?(s.professorProfile.labMode==='wet'?s.lab.equipment*.0015+s.lab.budget.environment*.005-.06:s.lab.equipment*.0005+s.lab.budget.environment*.015+.02):s.lab.equipment*.001;
  const growth=developmentalStage(s);const probability=clamp(.55+skill*.003+environmentSupport-growth.errorRate-(h.stress>60?.12:0)+(h.luck-50)*.0006,.3,.96);result.successProbability=probability;
  if(random(s)>=probability){result.scienceFailures++;result.outcome='inconclusive';result.successRate=0;return;}result.successRate=1;
  const languageFactor=id==='paper'?.75+h.language/200:1;
  const creativityFactor=.8+h.creativity/250;
  const emphasis=(s.policies??DEFAULT_POLICIES).study;const policyWeight=id==='study'?(emphasis==='study'?1.2:emphasis==='learn'?1.1:.9):(emphasis==='intensive'?1.2:emphasis==='research'?1.1:.95);const weight=(fit?12:5)*(1+skill/160)*(1+s.lab.budget.performance*.025)*languageFactor*creativityFactor*growth.independence*policyWeight*(s.monthlyEfficiency??1)*(1+(p.eventSupport??0))*BALANCE.projectProgressScale;result.weight=weight;const amount=weight*result.successRate;
  p.progress+=amount;result.progress=amount;result.outcome='progress';
}
function weekly(s,id,index) {
  const h=scores(s),result={week:index+1,proposed:id,actual:id,performed:true,outcome:'completed',progress:0,scienceFailures:0};
  if(id==='rest') {shift(s,'hidden',{stamina:28,stress:-14,motivation:2,confidence:.3,resilience:BALANCE.restResilienceRecovery});result.outcome='recovered';return result;}
  const probability=clamp(.32+h.stamina*.003+h.motivation*.003+h.rapport*.001+h.trust*.0007+(h.diligence-50)*.0018+(h.luck-50)*.0004+(s.feedback==='harsh'?.13:0)-(h.stress>65?.1:0),.18,.98);
  if(random(s)>probability){result.actual=h.stamina<40?'rest':'unfinished';result.performed=false;result.outcome='not_completed';shift(s,'hidden',{stamina:8,motivation:-.7,stress:-2});return result;}
  if(id==='coffee')shift(s,'hidden',{rapport:5,trust:.6,motivation:3,stamina:8,stress:-7,social:1.2,resilience:BALANCE.conversationResilienceRecovery});
  else {
    shift(s,'hidden',{stamina:-7*(.8+h.diligence/250)*(1+s.month/(12*160)),stress:2,motivation:-.35,autonomy:.5});
    if(id==='study')shift(s,'hidden',{learning:1.5,research:.3,intuition:.6,creativity:.2});
    if(id==='experiment') {shift(s,'hidden',{research:1.4,intuition:.9});shift(s,'lab',{equipment:s.professorProfile.labMode==='wet'?-1.2:-.15});}
    if(id==='analysis')shift(s,'hidden',{research:1.2,learning:.5,intuition:.7});
    if(id==='paper')shift(s,'hidden',{research:.6,language:1.1,autonomy:.7});
    if(id==='language')shift(s,'hidden',{language:3,social:.5});
    if(id==='industry')shift(s,'hidden',{industry:4.5*(.75+h.social/200),research:.6,autonomy:1,social:1,manners:.4});
    if(id==='startup')shift(s,'hidden',{enterprise:4.5*(.75+h.social/200),industry:.7,autonomy:1.3,social:1,creativity:.5});
    if(id==='video')shift(s,'hidden',{outreach:4.5,language:1,social:1.3});
    if(id==='teach')shift(s,'hidden',{teaching:4,learning:.5,social:1.4,autonomy:.9,manners:.5});
    if(id==='conference') {
      const currentReady=projectWork(s)>=projectThresholds(s).conference&&!s.project.conference;const earlier=s.history.find(e=>e.kind==='paper'&&!s.history.some(h=>h.kind==='conference'&&h.projectId===e.projectId));const projectId=currentReady?s.project.id:earlier?.projectId;
      if(s.month>24&&(currentReady||earlier)){if(currentReady)s.project.conference=true;s.career.conferences++;shift(s,'hidden',{social:3,language:2,autonomy:3,motivation:3});result.outcome='presented';log(s,{kind:'conference',projectId});
        if(random(s)<clamp(.01+h.language*.0005+h.social*.0002+(h.luck-50)*.0001,.005,.09)){s.career.awards++;log(s,{kind:'presentation-award',projectId});}
      }
      else {shift(s,'hidden',{social:1,language:.7});result.outcome=s.month<=24?'attended':s.project.conference?'attended':'preparing';}
    }
    scienceProgress(s,id,result);
  }
  return result;
}
function advanceProject(s,reviewTick=false) {
  const p=s.project;
  while(p.phase<5&&p.progress>=projectThresholds(s).phaseTargets[p.phase]){p.progress-=projectThresholds(s).phaseTargets[p.phase];p.phase++;log(s,{kind:'project-phase',projectId:p.id,phase:PROJECT_PHASES[p.phase].id});}
  if(p.phase===5&&!p.submitted) {
    p.progress=0;p.submitted=true;p.submittedAt=s.month;p.reviewMonths=0;s.career.submissions++;log(s,{kind:'submission',projectId:p.id});return;
  }
  if(p.phase!==5||!p.submitted||!reviewTick||p.submittedAt===s.month)return;
  p.reviewMonths++;p.progress=Math.min(24,p.reviewMonths*12);
  if(p.reviewMonths<2)return;
  const h=scores(s);
  const probability=clamp(.62+h.research*.002+h.language*.001+p.revisions*.12+(h.luck-50)*.0006,.55,.97);
  if(random(s)<probability) {
    s.career.papers++;s.career.completedProjects++;shift(s,'hidden',{motivation:5,confidence:4,autonomy:2});log(s,{kind:'paper',projectId:p.id,revisions:p.revisions});s.project=newProject(s,p.id+1);
  } else {
    p.revisions++;p.reviewMonths=0;p.progress=0;shift(s,'hidden',{motivation:-3,stress:3});log(s,{kind:'revision',projectId:p.id});
  }
}
function required(s,req) {
  const list=Array.isArray(req)?req:req?[req]:[];
  return list.every(r=>r==='paper'?s.career.papers>0:r==='conference'?s.career.conferences>0:r==='submission'?s.career.submissions>0:r==='low_motivation'?s.hidden.motivation<45:r==='stress'?s.hidden.stress>45:r==='graduate'?stage(s)!=='undergrad':r==='early_graduate'?developmentalStage(s).level==='masters':r==='sabbatical'?s.sabbatical.active:r==='research'?s.project.phase>=1:r==='female_pair'?s.locale==='ko'&&s.gender==='female'&&s.professorProfile.gender==='female':r==='young_professor'?s.professorProfile.age<=37:r==='national'?s.professorProfile.institution==='national':r==='institute'?s.professorProfile.institution==='institute':false);
}
function eventEligible(s,e) {
  const flag=s.eventFlags[e.id];
  return s.month>=(e.minMonth??0)&&s.month<=(e.maxMonth??MONTHS)&&(!e.stages||e.stages.includes(stage(s)))&&!(e.once&&flag?.count>0)&&(!flag||s.month-flag.lastMonth>=(e.cooldown??12))&&required(s,e.requires);
}
const SOCIAL_EVENTS = new Set(['collaboration','seminar','internship']);
// Fictional opportunity weights, not measured probabilities of academic collaborations.
export function eventWeight(s,eventOrId) {
  const id=typeof eventOrId==='string'?eventOrId:eventOrId.id;
  if(SOCIAL_EVENTS.has(id))return clamp(.5+abilityScore(s,'social')/100,.5,1.5);
  if(['stipend-delay','funding-cut','authorship','ethics','annual-report'].includes(id)&&s.professorProfile.institution==='national')return 1.25;
  if(id==='new-pi-mistake')return Math.max(1,1+(37-s.professorProfile.age)*.03);
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
  if(!Array.isArray(plan)||plan.length!==4||!plan.every(knownActivity))throw new Error('Choose four weekly activities.');
  const proposal=options.proposal??proposeSchedule(state);
  if(!Array.isArray(proposal)||proposal.length!==4||!proposal.every(knownActivity))throw new Error('Invalid student proposal.');
  const capacity=facultyCapacity(state);const allocation=options.allocation??allocateCredits(state.allocation,capacity.credits),budget=options.budget??state.lab.budget,type=options.feedback??state.feedback,action=options.facultyAction??state.facultyAction;
  if(!checkAllocation(allocation,capacity.credits))throw new Error('Allocate the available faculty workload credits.');
  if(!checkBudget(budget))throw new Error('Invalid stipend percentage or operating budget.');
  const policies=options.policies??state.policies??DEFAULT_POLICIES;if(!validPolicies(policies))throw new Error('Invalid monthly advising policy.');
  const application=options.grantApplication??{role:'pi',years:3};if(!validApplication(application))throw new Error('Invalid grant application.');if(action==='funding'&&!canApplyGrant(state,application.role))throw new Error('Research participation limit reached.');
  const actualMonth=calendarMonth(state.month,state.locale),festival=[4,10].includes(actualMonth);
  if(festival&&plan[2]!=='conference')throw new Error('The third week is the April/October conference festival.');
  const travel=action.startsWith('abroad_');
  if(action==='abstract'&&(![7,1].includes(actualMonth)||state.month<24))throw new Error('Abstract submission opens at the start of graduate vacation.');
  if(travel&&!canTravel(state))throw new Error('An accepted abstract is required for this conference.');
  if(travel&&![7,8,1,2].includes(actualMonth))throw new Error('Research travel is available in vacation months.');
  if(action==='abroad_shared'&&!(state.gender!=='unspecified'&&state.gender===state.professorGender&&options.travelConsent===true))throw new Error('Shared accommodation needs matching specified genders and explicit student consent.');
  const travelCost=action==='abroad_student'?18:action==='abroad_together'?34:action==='abroad_shared'?26:0;
  const cost=monthlyBudgetCost(state,budget)+travelCost;
  const stipend=salaryBase(state)*budget.salary/100;const operating=cost-stipend;
  if(operating>state.lab.funds||cost>state.lab.funds+(state.lab.pool??0))throw new Error('Budget exceeds available funds before new grants.');
  if(!FEEDBACK.includes(type)||!FACULTY_ACTIONS.includes(action))throw new Error('Invalid mentoring choice.');
  const s=structuredClone(state);
  if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');
  s.travel??=initialTravel();if(action==='abstract'){const earlier=s.history.find(e=>e.kind==='paper'&&!s.history.some(h=>h.kind==='conference'&&h.projectId===e.projectId));s.travel={status:'review',submittedAt:s.month,decidedAt:null,conferenceMonth:s.month+2,projectId:earlier?.projectId??s.project.id};log(s,{kind:'abstract-submission',month:s.month+1,projectId:s.travel.projectId});}
  s.workload={...capacity};s.started=true;s.policies={...policies};s.month++;s.plan=[...plan];s.allocation={...allocation};s.lab.budget={...budget};s.feedback=type;s.facultyAction=action;ensureFunding(s);const pooledPayment=Math.min(s.lab.pool,stipend);s.lab.pool-=pooledPayment;s.lab.funds-=cost-pooledPayment;log(s,{kind:'stipend-payment',amount:stipend,fromPool:pooledPayment});
  const fundingBalance=s.lab.funds;
  advanceGrants(s,{random:()=>random(s),log:(entryOrState,entry)=>{
    const grantEntry=entry??entryOrState;
    if(grantEntry.kind==='annual-grant'){
      // A stable public-institution model; private awards have a small seeded variation.
      const factor=s.professorProfile.institution==='private'?.9+random(s)*.2:1;
      const amount=Math.round(grantEntry.amount*factor);
      s.lab.funds=fundingBalance;depositGrant(s,amount);s.grants.annualAmount=amount;
      log(s,{...grantEntry,amount,institution:s.professorProfile.institution,factor});
    }else log(s,grantEntry);
  }});
  advancePortfolio(s,application,{random:()=>random(s),log});
  const changed=plan.filter((id,index)=>id!==proposal[index]).length;
  const approach=changed===0?'agreed':type==='harsh'?'imposed':'discussed';
  shift(s,'hidden',approach==='agreed'?{trust:.5,rapport:.3,autonomy:.3}:approach==='discussed'?{trust:.8,rapport:.5,manners:.2}:{trust:-3,rapport:-2});
  feedback(s,type);facultyMonth(s);upkeep(s);policyMonth(s);
  const papers=s.career.papers,conferences=s.career.conferences;
  const results=plan.map((id,index)=>{const r=weekly(s,id,index);advanceProject(s);return r;});
  // Reviews advance once per month, never once per week. Newly submitted manuscripts wait.
  advanceProject(s,true);
  if(festival){s.career.festivalAttendance++;log(s,{kind:'conference-festival',calendarMonth:actualMonth,week:3,presented:results[2].outcome==='presented'});}
  if(action==='abstract'){const prepared=s.history.some(h=>h.kind==='paper'&&h.projectId===s.travel.projectId)?projectThresholds(s).conference:projectWork(s);const probability=abstractAcceptance(s,prepared,projectThresholds(s).conference),accepted=random(s)<probability;s.travel.status=accepted?'accepted':'rejected';s.travel.decidedAt=s.month;log(s,{kind:'abstract-decision',accepted,projectId:s.travel.projectId});}
  if(travel) {
    const h=scores(s),joining=action!=='abroad_student';const performed=random(s)<clamp(.4+h.stamina*.002+h.motivation*.003+h.rapport*.001+h.trust*.001+(h.luck-50)*.0004,.2,.98);
    if(performed){shift(s,'hidden',{language:6,social:5,research:3,learning:2,intuition:2,autonomy:joining?4:6,rapport:joining?3:1,trust:2,confidence:4,motivation:4,stamina:-6});if(!s.history.some(h=>h.kind==='conference'&&h.projectId===s.travel.projectId))s.career.conferences++;if(s.travel.projectId===s.project.id)s.project.conference=true;log(s,{kind:'conference',projectId:s.travel.projectId,abroad:true});s.travel.status='attended';}
    else shift(s,'hidden',{stress:2});
    log(s,{kind:'research-travel',calendarMonth:actualMonth,joining,rooms:joining?(action==='abroad_shared'?1:2):1,sharedConsent:action==='abroad_shared',performed,cost:travelCost,projectId:s.travel.projectId});
  }
  if(s.travel.status==='accepted'&&s.month>=s.travel.conferenceMonth){s.travel.status='expired';log(s,{kind:'abstract-window-closed'});}
  const performed=results.filter(r=>r.performed).length;
  const report={month:s.month,results,completion:performed/4,progress:results.reduce((n,r)=>n+r.progress,0),scienceFailures:results.reduce((n,r)=>n+r.scienceFailures,0),published:s.career.papers-papers,conferences:s.career.conferences-conferences,scheduleDiscussion:{changed,approach}};
  s.lastReport=report;log(s,{kind:'month',plan:[...plan],results,progress:report.progress,papers:report.published});
  const mentalLoad=s.month<=24?BALANCE.undergradResilienceDecay:s.month>=48&&s.month<=72?BALANCE.earlyDoctoralResilienceDecay:BALANCE.graduateResilienceDecay;shift(s,'hidden',{motivation:-.5,stress:.4,resilience:-mentalLoad});
  if(s.hidden.stress>70)shift(s,'hidden',{resilience:-1});
  if(s.sabbatical.active&&s.month>=s.sabbatical.until)s.sabbatical.active=false;
  advanceImpact(s);checkFailure(s);if(s.ending)return s;
  academicDue(s);
  if(!s.pendingQueue.length&&s.month<MONTHS&&random(s)<BALANCE.randomEventProbability){const eligible=EVENTS.filter(e=>eventEligible(s,e));if(eligible.length){const e=selectWeightedEvent(s,eligible);queue(s,{kind:'event',id:e.id});}}
  nextPending(s);return s;
}
export function degreeRequirements(s,level='phd') { return degreeTargets(s.professorProfile.fieldId,level); }
const requirementsMet=(s,level)=>Object.entries(degreeRequirements(s,level)).every(([key,n])=>s.career[key]>=n);
export function canContinue(s) { return abilityScore(s,'rapport')>=30&&abilityScore(s,'trust')>=25&&s.hidden.motivation>=30&&(!(s.route==='masters'&&s.month>=48)||requirementsMet(s,'masters')); }
export function canDefend(s) { return s.career.qual==='passed'&&abilityScore(s,'research')>=50&&requirementsMet(s,'phd'); }
export const TRUE_REQUIREMENTS={learning:85,research:90,language:75,social:65,autonomy:85,teaching:75,rapport:85,trust:80,resilience:60,manners:65,motivation:70,papers:7,conferences:6,recommendations:4,faculty:40};
export function isTrueEnding(s) { return canDefend(s)&&Object.entries(TRUE_REQUIREMENTS).every(([k,n])=>k==='faculty'?FACULTY_KEYS.every(f=>s.professor[f]>=n):(k in s.hidden?abilityScore(s,k):s.career[k])>=n); }
export function careerScores(s) {
  const h=scores(s),c=s.career;
  return {
    institute:h.research>=70&&h.learning>=65&&h.autonomy>=60&&c.papers>=4?h.research*.45+h.learning*.2+h.autonomy*.2+Math.min(c.papers,10)*1.5:-1,
    corporate:h.industry>=55&&h.research>=50?h.industry*.65+h.research*.35:-1,
    unrelated:h.industry>=20&&h.social>=45&&h.autonomy>=45?h.industry*.35+h.social*.35+h.autonomy*.3:-1,
    startup:h.enterprise>=65&&h.autonomy>=60?h.enterprise*.7+h.autonomy*.3:-1,
    youtuber:h.outreach>=65&&h.language>=45?h.outreach*.75+h.language*.15+h.social*.1:-1,
  };
}
export function careerEnding(s) { if(s.ending==='masters'||s.pending?.kind==='masters')return 'masters';if(isTrueEnding(s))return 'true';if(canDefend(s)&&abilityScore(s,'rapport')>=85&&abilityScore(s,'trust')>=60&&abilityScore(s,'resilience')<=40&&s.professor.mentoring>=40)return 'resident_researcher';const priority=['youtuber','startup','corporate','institute','unrelated'];const ranked=Object.entries(careerScores(s)).sort((a,b)=>b[1]-a[1]||priority.indexOf(a[0])-priority.indexOf(b[0]));return ranked[0][1]>=0?ranked[0][0]:'unemployed'; }
function applyEvent(s,o,event) {
  const collaborationFactor=event.id==='collaboration'?.75+abilityScore(s,'social')/200:1;
  for(const group of ['hidden','professor','lab'])if(o.effects?.[group])shift(s,group,o.effects[group]);
  for(const [key,n] of Object.entries(o.effects?.career||{})) {
    if(!['awards','topPapers','recommendations'].includes(key)||!Number.isInteger(n))continue;
    if(key==='topPapers'&&s.career.papers>0)s.career.topPapers=clamp(s.career.topPapers+n,0,s.career.papers);
    if(key==='awards'&&(s.career.papers>0||s.career.conferences>0))s.career.awards=clamp(s.career.awards+n,0,s.career.papers+s.career.conferences);
    if(key==='recommendations'&&s.career.papers>0)s.career.recommendations=Math.max(0,s.career.recommendations+n);
  }
  if(Number.isFinite(o.progress)&&s.project.phase<5)s.project.eventSupport=clamp((s.project.eventSupport??0)+o.progress*collaborationFactor/100,-.25,.25);
}
export function decide(state,choice) {
  if(!validateSave(state))throw new Error('Invalid saved game.');
  const s=structuredClone(state),p=s.pending;if(!p||s.ending)throw new Error('No pending decision.');
  if(p.kind==='event') {
    const e=EVENTS.find(e=>e.id===p.id),o=e?.options[choice];if(!Number.isInteger(choice)||!o)throw new Error('Invalid event choice.');
    applyEvent(s,o,e);const old=s.eventFlags[e.id];s.eventFlags[e.id]={lastMonth:s.month,count:(old?.count||0)+1};log(s,{kind:'event',id:e.id,choice});
  } else if(p.kind==='external-admission'){
    if(!['encourage','remain'].includes(choice))throw new Error('Invalid admission advice.');
    log(s,{kind:'external-admission',level:p.level,choice});
    if(choice==='encourage')return finish(s,p.level==='bachelor'?'external_masters':'external_phd');
    shift(s,'hidden',{rapport:-.3,autonomy:.5});
  } else if(p.kind==='route') {
    if(!['masters','integrated','graduate'].includes(choice))throw new Error('Invalid route.');
    if(choice==='graduate'||!canContinue(s))return finish(s,'bachelor');s.route=choice;log(s,{kind:'route',route:choice});
  } else if(p.kind==='masters') {
    if(!['continue','graduate','extend'].includes(choice))throw new Error('Invalid degree decision.');
    const eligible=requirementsMet(s,'masters');
    if(choice==='extend') {if(s.mastersExtended)throw new Error('The master review can only be extended once.');s.mastersExtended=true;s.mastersReviewAt=54;log(s,{kind:'masters-extension'});}
    else if(choice==='graduate')return finish(s,eligible?'masters':'gameover',eligible?null:'graduation_requirements');
    else {if(!eligible)throw new Error('A manuscript submission and conference presentation are required before advancement.');if(!canContinue(s))return finish(s,'masters');s.mastersExtended=false;log(s,{kind:'promotion'});}
  } else if(p.kind==='qual') {
    if(!['exam','prepare','graduate'].includes(choice))throw new Error('Invalid qualification choice.');
    if(choice==='graduate')return finish(s,s.route==='masters'?'masters':'gameover',s.route==='masters'?null:'qual_failure');
    if(choice==='prepare') {
      if(s.qualPreparations>=2)throw new Error('The qualification exam can only be deferred twice.');s.qualPreparations++;s.qualDeferredAt=s.month+1;s.career.qual='preparing';shift(s,'hidden',{learning:6,confidence:4,stress:-6});log(s,{kind:'qual-preparation'});
    } else {
      s.career.qualAttempts++;
      const h=scores(s),mastered=h.learning>=45&&h.research>=40&&h.motivation>=25;
      const passed=mastered&&(h.learning>=65||random(s)<clamp(.9+(h.luck-50)*.0006,.85,.95));
      s.career.qual=passed?'passed':'failed';log(s,{kind:'qual',passed,attempt:s.career.qualAttempts});
      if(passed)shift(s,'hidden',{motivation:5,confidence:5});
      else if(s.career.qualAttempts>=2)return finish(s,'gameover','qual_failure');
      else {s.qualDeferredAt=s.month+1;shift(s,'hidden',{motivation:-3,stress:3});}
    }
  } else if(p.kind==='sabbatical') {
    if(!['home','away'].includes(choice))throw new Error('Invalid sabbatical choice.');s.sabbatical={active:true,until:60,mode:choice};log(s,{kind:'sabbatical',mode:choice});
  } else if(p.kind==='service'||p.kind==='service-review') {
    if(!['consult','skip'].includes(choice))throw new Error('Invalid service consultation.');
    // Narrative counseling only: this never assigns a legal service status or guarantees selection.
    if(s.locale!=='ko'||s.gender!=='male')throw new Error('This consultation is not applicable.');
    s.service.status=choice==='consult'?(p.kind==='service'?'planning':'consulted'):'not_requested';log(s,{kind:p.kind,choice});
    if(choice==='consult'&&s.professorProfile.gender==='male')shift(s,'hidden',{rapport:3,trust:1});
  } else if(p.kind==='defense') {
    if(choice!=='defend')throw new Error('Invalid defense choice.');return finish(s,canDefend(s)?careerEnding(s):'gameover',canDefend(s)?null:'graduation_requirements');
  }
  s.pending=null;if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');nextPending(s);return s;
}
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
const number=(n,min=0,max=100)=>Number.isFinite(n)&&n>=min&&n<=max;
const integer=(n,min=0,max=10000)=>Number.isInteger(n)&&n>=min&&n<=max;
function validPending(p) { return p===null||(plain(p)&&PENDING_KINDS.includes(p.kind)&&(p.kind!=='event'||EVENTS.some(e=>e.id===p.id))&&(p.kind!=='external-admission'||['bachelor','masters'].includes(p.level))); }
function validWeeklyResult(r,index) { return plain(r)&&r.week===index+1&&knownActivity(r.proposed)&&(knownActivity(r.actual)||r.actual==='unfinished')&&typeof r.performed==='boolean'&&WEEKLY_OUTCOMES.includes(r.outcome)&&number(r.progress,0,1000)&&integer(r.scienceFailures,0,1)&&(r.weight===undefined||number(r.weight,0,1000))&&(r.successRate===undefined||number(r.successRate,0,1))&&(r.successProbability===undefined||number(r.successProbability,0,1)); }
export function migrateSave(raw) {
  if(!plain(raw)||![3,VERSION].includes(raw.version))return null;
  let s;try{s=structuredClone(raw);}catch{return null;}
  if(s.version===3){
    const gender=['male','female'].includes(s.professorGender)?s.professorGender:'other';
    s.version=VERSION;s.professorGender=gender;s.professorProfile={gender,age:42,fieldId:'050',labMode:getDiscipline('050').labModes[0],institution:'national'};s.professorEnergy=100;s.endingReason=null;
    if(s.ending==='unfinished'){s.ending='gameover';s.endingReason='graduation_requirements';}
    log(s,{kind:'save-migration',fromVersion:3});
  }
  s.policies??={...DEFAULT_POLICIES};s.professorName??='지도교수';s.creationSeed??=s.seed;if(!validateSave(s))return null;ensureFunding(s);s.impact??=initialImpact();s.travel??=initialTravel();return s;
}
export function validateSave(s) {
  if(!plain(s)||s.version!==VERSION||typeof s.name!=='string'||!s.name.trim()||s.name.length>24||!integer(s.month,0,MONTHS)||!integer(s.seed,0,4294967295)||!['male','female','unspecified'].includes(s.gender)||!['male','female','other','unspecified'].includes(s.professorGender)||!['ko','en'].includes(s.locale)||![null,'masters','integrated'].includes(s.route)||typeof s.started!=='boolean'||!(s.ending===null||ENDINGS.includes(s.ending)))return false;
  if(s.policies!==undefined&&!validPolicies(s.policies)||s.professorName!==undefined&&(typeof s.professorName!=='string'||!s.professorName.trim()||s.professorName.length>40))return false;
  const p=s.professorProfile;
  if(!plain(p)||!['male','female','other'].includes(p.gender)||!(p.gender===s.professorGender||p.gender==='other'&&s.professorGender==='unspecified')||!integer(p.age,30,55)||typeof p.fieldId!=='string'||getDiscipline(p.fieldId).id!==p.fieldId||!getDiscipline(p.fieldId).labModes.includes(p.labMode)||!['national','private','institute'].includes(p.institution)||!number(s.professorEnergy)||!(s.endingReason===null||['graduation_requirements','time_limit','qual_failure'].includes(s.endingReason)))return false;
  if(s.travel!==undefined&&!validTravel(s.travel,s.month))return false;
  if(s.impact!==undefined&&!validImpact(s.impact,s.career?.papers))return false;if(!validPortfolio(s)||s.lab?.pool!==undefined&&!number(s.lab.pool,0,5000))return false;
  if(!plain(s.hidden)||!HIDDEN_KEYS.every(k=>number(s.hidden[k],...HIDDEN_RANGES[k]))||!plain(s.temperament)||!['curiosity','caution','expression'].every(k=>number(s.temperament[k]))||!plain(s.professor)||!FACULTY_KEYS.every(k=>number(s.professor[k]))||!validateGrants(s.grants))return false;
  if(!plain(s.eventFlags))return false;
  if(!plain(s.lab)||!number(s.lab.funds,0,5000)||!number(s.lab.equipment)||!checkBudget(s.lab.budget)||!checkAllocation(s.allocation)||!FEEDBACK.includes(s.feedback)||!FACULTY_ACTIONS.includes(s.facultyAction))return false;
  if(!plain(s.career)||!['submissions','papers','conferences','festivalAttendance','recommendations','awards','topPapers','completedProjects','qualAttempts'].every(k=>integer(s.career[k]))||!['not_due','due','preparing','passed','failed'].includes(s.career.qual)||s.career.papers>s.career.submissions||s.career.topPapers>s.career.papers||s.career.awards>s.career.papers+s.career.conferences||s.career.completedProjects!==s.career.papers||s.career.qualAttempts>2)return false;
  if(!plain(s.project)||s.project.eventSupport!==undefined&&!number(s.project.eventSupport,-.25,.25)||!integer(s.project.id,1)||!integer(s.project.titleIndex,0,PROJECT_TITLES.length-1)||!integer(s.project.phase,0,5)||!number(s.project.progress,0,1000)||typeof s.project.conference!=='boolean'||typeof s.project.submitted!=='boolean'||!integer(s.project.reviewMonths)||!integer(s.project.revisions)||!(s.project.submittedAt===null||integer(s.project.submittedAt,1,s.month))||s.project.submitted&&(s.project.phase!==5||s.project.submittedAt===null))return false;
  if(!Array.isArray(s.plan)||s.plan.length!==4||!s.plan.every(knownActivity)||!Array.isArray(s.history)||s.history.length>3000||s.history.some(h=>!plain(h)||!integer(h.month,0,s.month)||typeof h.kind!=='string'))return false;
  if(!validPending(s.pending)||!Array.isArray(s.pendingQueue)||s.pendingQueue.length>8||!s.pendingQueue.every(p=>p!==null&&validPending(p))||s.ending&&(s.pending||s.pendingQueue.length)||s.pending?.kind==='event'&&!eventEligible(s,EVENTS.find(e=>e.id===s.pending.id)))return false;
  if(!plain(s.behavior)||!FEEDBACK.every(k=>integer(s.behavior[k]))||!integer(s.crisis,0,MONTHS)||!plain(s.eventFlags)||Object.entries(s.eventFlags).some(([id,f])=>!EVENTS.some(e=>e.id===id)||!plain(f)||!integer(f.lastMonth,0,s.month)||!integer(f.count,1)))return false;
  if(!plain(s.sabbatical)||typeof s.sabbatical.active!=='boolean'||!integer(s.sabbatical.until,0,MONTHS)||!['home','away'].includes(s.sabbatical.mode)||!plain(s.service)||!['none','planning','consulted','not_requested'].includes(s.service.status))return false;
  if(!(s.qualDeferredAt===null||integer(s.qualDeferredAt,s.month,MONTHS))||!integer(s.qualPreparations,0,2)||![48,54].includes(s.mastersReviewAt)||typeof s.mastersExtended!=='boolean'||!integer(s.lastRecommendationMonth,-12,MONTHS)||!(s.lastAcademicWarning===null||integer(s.lastAcademicWarning,0,s.month)))return false;
  if(s.lastReport!==null&&(!plain(s.lastReport)||!integer(s.lastReport.month,1,s.month)||!number(s.lastReport.completion,0,1)||!Array.isArray(s.lastReport.results)||s.lastReport.results.length!==4||!s.lastReport.results.every(validWeeklyResult)||!number(s.lastReport.progress,0,1000)||!integer(s.lastReport.scienceFailures,0,4)||!integer(s.lastReport.published)||!integer(s.lastReport.conferences)))return false;
  return true;
}
