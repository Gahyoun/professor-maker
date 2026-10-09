// Monthly, seeded simulation. Student ability values are intentionally hidden by the UI.
import { EVENTS } from './events.js';
import { initialGrants, advanceGrants, validateGrants } from './grants.js';
export { EVENTS };
export const VERSION = 3;
export const MONTHS = 96;
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
  {ko:'작은 세계 모형의 연결 규칙 검증',en:'Testing connection rules in small-world models'},
  {ko:'커뮤니티 검출의 해상도 비교',en:'Comparing resolutions in community detection'},
  {ko:'지역 인구와 대학 전공 네트워크',en:'Regional populations and networks of university majors'},
  {ko:'불완전한 접촉 자료의 확산 모형',en:'Spread models with incomplete contact data'},
  {ko:'생태 네트워크의 종 제거 시뮬레이션',en:'Species removal in ecological networks'},
  {ko:'전력망 핵심 노드의 회복력',en:'Resilience of critical nodes in power grids'},
  {ko:'공동연구 네트워크의 다층 구조',en:'Multilayer structures of collaboration networks'},
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
const FACULTY_ACTIONS = ['routine','funding','recommend','support','report','abroad_student','abroad_together','abroad_shared'];
const ENDINGS = ['bachelor','masters','true','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','dropout','unfinished','gameover'];
const PENDING_KINDS = ['route','masters','qual','sabbatical','service','service-review','defense','event'];
const clamp = (n,lo=0,hi=100) => Math.max(lo,Math.min(hi,n));
function random(s) { s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0; return s.seed/4294967296; }
function shift(s,group,effects={}) { for (const [k,n] of Object.entries(effects)) if (k in s[group] && Number.isFinite(n)) {
  const [lo,hi]=group==='hidden'?HIDDEN_RANGES[k]:[0,group==='lab'&&k==='funds'?5000:100];
  // Effects are normalized game points, then translated to each stored spectrum.
  const buffered=group==='hidden'&&k==='stress'&&n>0?n*(1.4-abilityScore(s,'resilience')/125):n;
  s[group][k]=clamp(s[group][k]+buffered*(group==='hidden'?(hi-lo)/100:1),lo,hi);
} }
function log(s,entry) { s.history.push({month:s.month,...entry}); }
function finish(s,ending) { s.ending=ending;s.pending=null;s.pendingQueue=[];log(s,{kind:'ending',ending});return s; }
function newProject(s,id) { return {id,titleIndex:(id-1)%PROJECT_TITLES.length,phase:0,progress:0,conference:false,reviewMonths:0,submitted:false,submittedAt:null,revisions:0}; }
export function createState(name='김하늘',seed=Date.now(),{gender,professorGender='unspecified',locale='ko'}={}) {
  const s={version:VERSION,name:String(name).trim().slice(0,24)||'김하늘',gender:'unspecified',professorGender:['male','female','unspecified'].includes(professorGender)?professorGender:'unspecified',locale:locale==='en'?'en':'ko',month:0,route:null,started:false,
    hidden:{learning:299.7,research:249.75,language:299.7,social:-30,stamina:849.15,resilience:649.35,manners:599.4,creativity:0,diligence:20,rapport:30,trust:20,luck:0,motivation:70,stress:12,autonomy:20,teaching:10,industry:0,enterprise:0,outreach:0,intuition:28,confidence:55},
    temperament:{curiosity:50,caution:50,expression:50},professor:{research:55,teaching:55,admin:55,mentoring:55},lab:{funds:600,budget:{salary:60,environment:2,performance:3,publicity:1},equipment:100},
    career:{submissions:0,papers:0,conferences:0,festivalAttendance:0,recommendations:0,awards:0,topPapers:0,completedProjects:0,qual:'not_due',qualAttempts:0},
    grants:initialGrants(),project:null,plan:['study','experiment','rest','coffee'],feedback:'listen',allocation:{research:2,teaching:2,admin:2,mentoring:2},facultyAction:'routine',
    sabbatical:{active:false,until:0,mode:'home'},service:{status:'none'},history:[],lastReport:null,crisis:0,ending:null,pending:null,pendingQueue:[],eventFlags:{},seed:Number(seed)>>>0,behavior:{harsh:0,listen:0,praise:0,critique:0},qualDeferredAt:null,qualPreparations:0,mastersReviewAt:48,mastersExtended:false,lastRecommendationMonth:-12,lastAcademicWarning:null};
  // Always draw the gender value, including when overridden: abilities share the same seed.
  const sexDraw=random(s);s.gender=['male','female','unspecified'].includes(gender)?gender:sexDraw<.55?'male':'female';
  for (const k of ['learning','research','language','social','intuition']) shift(s,'hidden',{[k]:Math.floor(random(s)*9)-4});
  s.hidden.resilience=249.75+random(s)*499.5;
  s.hidden.luck=(random(s)-.5)*80;
  s.hidden.diligence=10+(random(s)-.5)*60;
  s.hidden.creativity=(random(s)-.5)*60;
  for (const k of Object.keys(s.temperament)) s.temperament[k]=30+Math.floor(random(s)*41);
  s.project=newProject(s,1);s.plan=proposeSchedule(s);return s;
}
export function stage(s) { return s.month<24?'undergrad':s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?'masters':'phd'; }
export function calendarMonth(month,locale='ko') { return ((month+(locale==='en'?8:2))%12)+1; }
export function salaryBase(s) { return s.month<24?13:s.route==='masters'&&(s.month<48||s.mastersExtended&&s.month<54)?22:30; }
export function monthlyBudgetCost(s,budget=s.lab.budget) { return salaryBase(s)*budget.salary/100+budget.environment*2+budget.performance*2+budget.publicity; }
export function proposeSchedule(s) {
  const phase=s.project?.phase||0;
  const primary=['study','experiment','experiment','analysis','paper','paper'][phase];
  const secondary=phase===0?'study':phase===1?'study':phase===2?'analysis':primary;
  const h=scores(s);
  const care=h.stamina<60||h.stress>45?'rest':h.rapport<45?'coffee':'rest';
  const growth=h.motivation<40?'coffee':phase>=1&&!s.project.conference?'conference':h.language<55?'language':s.temperament.expression>60?'teach':s.temperament.curiosity>60?'analysis':'study';
  return [primary,secondary,[4,10].includes(calendarMonth(s.month,s.locale))?'conference':care,[4,10].includes(calendarMonth(s.month,s.locale))?'rest':growth];
}
function checkAllocation(a) { return a&&FACULTY_KEYS.every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=8)&&FACULTY_KEYS.reduce((n,k)=>n+a[k],0)===8; }
function checkBudget(b) { return b&&Number.isInteger(b.salary)&&b.salary>=0&&b.salary<=100&&b.salary%10===0&&['environment','performance','publicity'].every(k=>Number.isInteger(b[k])&&b[k]>=0&&b[k]<=6); }
function queue(s,p) { s.pendingQueue.push(p); }
function nextPending(s) { s.pending=s.pendingQueue.shift()||null; }
function academicDue(s) {
  if(s.month===24)queue(s,{kind:'route'});
  if(s.month===36&&s.locale==='ko'&&s.gender==='male')queue(s,{kind:'service'});
  if(s.month===s.mastersReviewAt&&s.route==='masters')queue(s,{kind:'masters'});
  if((s.route==='integrated'&&s.month===48)||(s.route==='masters'&&s.month===60)||s.qualDeferredAt===s.month){s.career.qual='due';queue(s,{kind:'qual'});s.qualDeferredAt=null;}
  if(s.month===48)queue(s,{kind:'sabbatical'});
  if(s.month===84&&s.locale==='ko'&&s.gender==='male'&&s.service.status==='planning')queue(s,{kind:'service-review'});
  if(s.month===MONTHS)queue(s,{kind:'defense'});
}
function feedback(s,type) {
  s.behavior[type]++;
  const r=s.lastReport;
  const well=r&&(r.progress>0||r.published>0||r.conferences>0)&&r.completion>=.65;
  const difficulty=r&&(r.scienceFailures>0||r.completion<.65);
  if(type==='listen')shift(s,'hidden',{rapport:1,trust:1,manners:.2,stress:-2,motivation:.5,autonomy:.6});
  else if(type==='praise')shift(s,'hidden',well?{motivation:4,confidence:3,rapport:1,trust:1}:{motivation:-3,confidence:-2,rapport:-2,trust:-3});
  else if(type==='critique') {
    shift(s,'hidden',difficulty?{research:2,intuition:1,confidence:1,trust:1,stress:1}:{motivation:-3,rapport:-3,trust:-3,confidence:-3,stress:3});
    if(difficulty&&s.project.phase<5)s.project.progress+=3;
  } else shift(s,'hidden',{rapport:-5,trust:-5,confidence:-3,motivation:-2,stress:6});
}
function facultyMonth(s) {
  for(const k of FACULTY_KEYS)shift(s,'professor',{[k]:s.allocation[k]===0?-7:s.allocation[k]===1?-2:1.1+(s.allocation[k]-2)*2.3});
  const offset=s.month%12;
  if([1,2,3,4,7,8,9,10].includes(offset))shift(s,'professor',{teaching:-.7,admin:-.4});
  if(s.sabbatical.active) {
    shift(s,'professor',{research:1,teaching:-.5,admin:-.5,mentoring:s.sabbatical.mode==='away'?-2.5:-.7});
    if(s.sabbatical.mode==='away')shift(s,'hidden',{rapport:-1.5,autonomy:1});
  }
  if(s.facultyAction==='funding'){shift(s,'professor',{research:2,admin:3,mentoring:-3});s.lab.funds=clamp(s.lab.funds+40,0,5000);}
  else if(s.facultyAction==='report')shift(s,'professor',{admin:3,research:-1});
  else if(s.facultyAction==='support'){shift(s,'professor',{mentoring:2,research:-1});shift(s,'hidden',{rapport:2,trust:1,motivation:2,stress:-2,resilience:.2});}
  else if(s.facultyAction==='recommend') {
    shift(s,'professor',{mentoring:1,admin:-1});
    if(s.career.papers>0&&s.month-s.lastRecommendationMonth>=12){s.career.recommendations++;s.lastRecommendationMonth=s.month;shift(s,'hidden',{autonomy:2,motivation:2});log(s,{kind:'recommendation'});}
  }
}
function upkeep(s) {
  const b=s.lab.budget;
  shift(s,'hidden',{motivation:(b.salary-50)*.05,stamina:b.salary>=50?1:-2,intuition:b.salary>=60?.35:0,stress:b.salary<30?3:0,rapport:b.salary>=70?.5:b.salary<30?-2:0,trust:b.salary>=70?.4:b.salary<30?-2:0});
  shift(s,'lab',{equipment:(b.environment-2)*3+.5});
  shift(s,'hidden',{outreach:b.publicity*.13});
}
const matching=[['study','analysis'],['experiment','study'],['experiment','analysis'],['analysis','experiment'],['paper','language'],['paper','analysis']];
function scienceProgress(s,id,result) {
  if(!['study','experiment','analysis','paper'].includes(id))return;
  const p=s.project,h=scores(s);
  if(p.phase===5&&p.submitted)return; // Peer review proceeds asynchronously.
  const fit=matching[p.phase].includes(id);
  const skill=id==='study'?h.learning:id==='paper'?(h.research+h.language)/2:(h.research+h.intuition)/2;
  const probability=clamp(.55+skill*.003+s.lab.equipment*.001-(h.stress>60?.12:0)+(h.luck-50)*.0006,.4,.96);
  if(random(s)>=probability){result.scienceFailures++;result.outcome='inconclusive';return;}
  const languageFactor=id==='paper'?.75+h.language/200:1;
  const creativityFactor=.8+h.creativity/250;
  const amount=(fit?12:5)*(1+skill/160)*(1+s.lab.budget.performance*.025)*languageFactor*creativityFactor;
  p.progress+=amount;result.progress=amount;result.outcome='progress';
}
function weekly(s,id,index) {
  const h=scores(s),result={week:index+1,proposed:id,actual:id,performed:true,outcome:'completed',progress:0,scienceFailures:0};
  if(id==='rest') {shift(s,'hidden',{stamina:28,stress:-14,motivation:2,confidence:.3,resilience:.08});result.outcome='recovered';return result;}
  const probability=clamp(.32+h.stamina*.003+h.motivation*.003+h.rapport*.001+h.trust*.0007+(h.diligence-50)*.0018+(h.luck-50)*.0004+(s.feedback==='harsh'?.13:0)-(h.stress>65?.1:0),.18,.98);
  if(random(s)>probability){result.actual=h.stamina<40?'rest':'unfinished';result.performed=false;result.outcome='not_completed';shift(s,'hidden',{stamina:8,motivation:-.7,stress:-2});return result;}
  if(id==='coffee')shift(s,'hidden',{rapport:5,trust:.6,motivation:3,stamina:8,stress:-7,social:1.2});
  else {
    shift(s,'hidden',{stamina:-7*(.8+h.diligence/250),stress:2,motivation:-.35,autonomy:.5});
    if(id==='study')shift(s,'hidden',{learning:1.5,research:.3,intuition:.6,creativity:.2});
    if(id==='experiment') {shift(s,'hidden',{research:1.4,intuition:.9});shift(s,'lab',{equipment:-.35});}
    if(id==='analysis')shift(s,'hidden',{research:1.2,learning:.5,intuition:.7});
    if(id==='paper')shift(s,'hidden',{research:.6,language:1.1,autonomy:.7});
    if(id==='language')shift(s,'hidden',{language:3,social:.5});
    if(id==='industry')shift(s,'hidden',{industry:4.5*(.75+h.social/200),research:.6,autonomy:1,social:1,manners:.4});
    if(id==='startup')shift(s,'hidden',{enterprise:4.5*(.75+h.social/200),industry:.7,autonomy:1.3,social:1,creativity:.5});
    if(id==='video')shift(s,'hidden',{outreach:4.5,language:1,social:1.3});
    if(id==='teach')shift(s,'hidden',{teaching:4,learning:.5,social:1.4,autonomy:.9,manners:.5});
    if(id==='conference') {
      if(s.project.phase>=1&&!s.project.conference){s.project.conference=true;s.career.conferences++;shift(s,'hidden',{social:3,language:2,autonomy:3,motivation:3});result.outcome='presented';log(s,{kind:'conference',projectId:s.project.id});
        if(random(s)<clamp(.01+h.language*.0005+h.social*.0002+(h.luck-50)*.0001,.005,.09)){s.career.awards++;log(s,{kind:'presentation-award',projectId:s.project.id});}
      }
      else {shift(s,'hidden',{social:1,language:.7});result.outcome=s.project.conference?'attended':'preparing';}
    }
    scienceProgress(s,id,result);
  }
  return result;
}
function advanceProject(s,reviewTick=false) {
  const p=s.project;
  while(p.phase<5&&p.progress>=PROJECT_PHASES[p.phase].target){p.progress-=PROJECT_PHASES[p.phase].target;p.phase++;log(s,{kind:'project-phase',projectId:p.id,phase:PROJECT_PHASES[p.phase].id});}
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
  return list.every(r=>r==='paper'?s.career.papers>0:r==='conference'?s.career.conferences>0:r==='submission'?s.career.submissions>0:r==='low_motivation'?s.hidden.motivation<45:r==='stress'?s.hidden.stress>45:r==='graduate'?stage(s)!=='undergrad':r==='sabbatical'?s.sabbatical.active:r==='research'?s.project.phase>=1:false);
}
function eventEligible(s,e) {
  const flag=s.eventFlags[e.id];
  return s.month>=(e.minMonth??0)&&s.month<=(e.maxMonth??MONTHS)&&(!e.stages||e.stages.includes(stage(s)))&&!(e.once&&flag?.count>0)&&(!flag||s.month-flag.lastMonth>=(e.cooldown??12))&&required(s,e.requires);
}
function checkFailure(s) {
  if(FACULTY_KEYS.some(k=>s.professor[k]<=0))return finish(s,'gameover');
  const h=scores(s),relationshipFailed=h.rapport<=12||h.trust<=12||h.motivation<=12;
  const critical=relationshipFailed||h.stamina<=5||h.stress>=95||h.resilience<=5;
  s.crisis=critical?s.crisis+1:0;
  if(critical&&s.crisis===1){s.lastAcademicWarning=s.month;log(s,{kind:'warning',reason:relationshipFailed?'relationship':'health'});}
  if(s.crisis>=2)return finish(s,relationshipFailed?'dropout':'leave');
  return s;
}
export function simulateMonth(state,plan,options={}) {
  if(!validateSave(state))throw new Error('Invalid saved game.');
  if(state.ending||state.pending)throw new Error('Resolve the pending decision first.');
  if(state.month>=MONTHS)throw new Error('The eight years are complete.');
  if(!Array.isArray(plan)||plan.length!==4||!plan.every(knownActivity))throw new Error('Choose four weekly activities.');
  const proposal=options.proposal??proposeSchedule(state);
  if(!Array.isArray(proposal)||proposal.length!==4||!proposal.every(knownActivity))throw new Error('Invalid student proposal.');
  const allocation=options.allocation??state.allocation,budget=options.budget??state.lab.budget,type=options.feedback??state.feedback,action=options.facultyAction??state.facultyAction;
  if(!checkAllocation(allocation))throw new Error('Allocate eight faculty workload points.');
  if(!checkBudget(budget))throw new Error('Invalid stipend percentage or operating budget.');
  if(state.month%12!==0&&budget.salary!==state.lab.budget.salary)throw new Error('Stipend rates are agreed at the academic year opening.');
  const actualMonth=calendarMonth(state.month,state.locale),festival=[4,10].includes(actualMonth);
  if(festival&&plan[2]!=='conference')throw new Error('The third week is the April/October conference festival.');
  const travel=action.startsWith('abroad_');
  if(travel&&![7,8,1,2].includes(actualMonth))throw new Error('Research travel is available in vacation months.');
  if(action==='abroad_shared'&&!(state.gender!=='unspecified'&&state.gender===state.professorGender&&options.travelConsent===true))throw new Error('Shared accommodation needs matching specified genders and explicit student consent.');
  const travelCost=action==='abroad_student'?18:action==='abroad_together'?34:action==='abroad_shared'?26:0;
  const cost=monthlyBudgetCost(state,budget)+travelCost;
  if(cost>state.lab.funds)throw new Error('Budget exceeds available funds before new grants.');
  if(!FEEDBACK.includes(type)||!FACULTY_ACTIONS.includes(action))throw new Error('Invalid mentoring choice.');
  const s=structuredClone(state);
  if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');
  s.started=true;s.month++;s.plan=[...plan];s.allocation={...allocation};s.lab.budget={...budget};s.feedback=type;s.facultyAction=action;s.lab.funds-=cost;
  advanceGrants(s,{random:()=>random(s),log:(entryOrState,entry)=>log(s,entry??entryOrState)});
  const changed=plan.filter((id,index)=>id!==proposal[index]).length;
  const approach=changed===0?'agreed':type==='harsh'?'imposed':'discussed';
  shift(s,'hidden',approach==='agreed'?{trust:.5,rapport:.3,autonomy:.3}:approach==='discussed'?{trust:.8,rapport:.5,manners:.2}:{trust:-3,rapport:-2});
  feedback(s,type);facultyMonth(s);upkeep(s);
  const papers=s.career.papers,conferences=s.career.conferences;
  const results=plan.map((id,index)=>{const r=weekly(s,id,index);advanceProject(s);return r;});
  // Reviews advance once per month, never once per week. Newly submitted manuscripts wait.
  advanceProject(s,true);
  if(festival){s.career.festivalAttendance++;log(s,{kind:'conference-festival',calendarMonth:actualMonth,week:3,presented:results[2].outcome==='presented'});}
  if(travel) {
    const h=scores(s),joining=action!=='abroad_student';const performed=random(s)<clamp(.4+h.stamina*.002+h.motivation*.003+h.rapport*.001+h.trust*.001+(h.luck-50)*.0004,.2,.98);
    if(performed){shift(s,'hidden',{language:3,social:2,autonomy:joining?1:3,rapport:joining?1:0});if(s.project.phase>=1&&!s.project.conference){s.project.conference=true;s.career.conferences++;log(s,{kind:'conference',projectId:s.project.id,abroad:true});}}
    else shift(s,'hidden',{stress:2});
    log(s,{kind:'research-travel',calendarMonth:actualMonth,joining,rooms:joining?(action==='abroad_shared'?1:2):1,sharedConsent:action==='abroad_shared',performed,cost:travelCost});
  }
  const performed=results.filter(r=>r.performed).length;
  const report={month:s.month,results,completion:performed/4,progress:results.reduce((n,r)=>n+r.progress,0),scienceFailures:results.reduce((n,r)=>n+r.scienceFailures,0),published:s.career.papers-papers,conferences:s.career.conferences-conferences,scheduleDiscussion:{changed,approach}};
  s.lastReport=report;log(s,{kind:'month',plan:[...plan],results,progress:report.progress,papers:report.published});
  shift(s,'hidden',{motivation:-.5,stress:.4});
  if(s.hidden.stress>70)shift(s,'hidden',{resilience:-1});
  if(s.sabbatical.active&&s.month>=s.sabbatical.until)s.sabbatical.active=false;
  checkFailure(s);if(s.ending)return s;
  academicDue(s);
  if(!s.pendingQueue.length&&s.month<MONTHS&&random(s)<.18){const eligible=EVENTS.filter(e=>eventEligible(s,e));if(eligible.length){const e=eligible[Math.floor(random(s)*eligible.length)];queue(s,{kind:'event',id:e.id});}}
  nextPending(s);return s;
}
export function canContinue(s) { return abilityScore(s,'rapport')>=30&&abilityScore(s,'trust')>=25&&s.hidden.motivation>=30; }
export function canDefend(s) { return s.career.qual==='passed'&&abilityScore(s,'research')>=50&&s.career.submissions>=3&&s.career.papers>=3&&s.career.conferences>=3; }
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
export function careerEnding(s) { if(isTrueEnding(s))return 'true';if(canDefend(s)&&abilityScore(s,'rapport')>=85&&abilityScore(s,'trust')>=60&&abilityScore(s,'resilience')<=40&&s.professor.mentoring>=40)return 'resident_researcher';const priority=['youtuber','startup','corporate','institute','unrelated'];const ranked=Object.entries(careerScores(s)).sort((a,b)=>b[1]-a[1]||priority.indexOf(a[0])-priority.indexOf(b[0]));return ranked[0][1]>=0?ranked[0][0]:'unemployed'; }
function applyEvent(s,o) {
  for(const group of ['hidden','professor','lab'])if(o.effects?.[group])shift(s,group,o.effects[group]);
  for(const [key,n] of Object.entries(o.effects?.career||{})) {
    if(!['awards','topPapers','recommendations'].includes(key)||!Number.isInteger(n))continue;
    if(key==='topPapers'&&s.career.papers>0)s.career.topPapers=clamp(s.career.topPapers+n,0,s.career.papers);
    if(key==='awards'&&(s.career.papers>0||s.career.conferences>0))s.career.awards=clamp(s.career.awards+n,0,s.career.papers+s.career.conferences);
    if(key==='recommendations'&&s.career.papers>0)s.career.recommendations=Math.max(0,s.career.recommendations+n);
  }
  if(Number.isFinite(o.progress)&&s.project.phase<5)s.project.progress=Math.max(0,s.project.progress+o.progress);
}
export function decide(state,choice) {
  if(!validateSave(state))throw new Error('Invalid saved game.');
  const s=structuredClone(state),p=s.pending;if(!p||s.ending)throw new Error('No pending decision.');
  if(p.kind==='event') {
    const e=EVENTS.find(e=>e.id===p.id),o=e?.options[choice];if(!Number.isInteger(choice)||!o)throw new Error('Invalid event choice.');
    applyEvent(s,o);const old=s.eventFlags[e.id];s.eventFlags[e.id]={lastMonth:s.month,count:(old?.count||0)+1};log(s,{kind:'event',id:e.id,choice});
  } else if(p.kind==='route') {
    if(!['masters','integrated','graduate'].includes(choice))throw new Error('Invalid route.');
    if(choice==='graduate'||!canContinue(s))return finish(s,'bachelor');s.route=choice;log(s,{kind:'route',route:choice});
  } else if(p.kind==='masters') {
    if(!['continue','graduate','extend'].includes(choice))throw new Error('Invalid degree decision.');
    const eligible=s.career.submissions>=1&&s.career.conferences>=1;
    if(choice==='extend') {if(s.mastersExtended)throw new Error('The master review can only be extended once.');s.mastersExtended=true;s.mastersReviewAt=54;log(s,{kind:'masters-extension'});}
    else if(choice==='graduate')return finish(s,eligible?'masters':'unfinished');
    else {if(!eligible)throw new Error('A manuscript submission and conference presentation are required before advancement.');if(!canContinue(s))return finish(s,'masters');s.mastersExtended=false;log(s,{kind:'promotion'});}
  } else if(p.kind==='qual') {
    if(!['exam','prepare','graduate'].includes(choice))throw new Error('Invalid qualification choice.');
    if(choice==='graduate')return finish(s,s.route==='masters'?'masters':'unfinished');
    if(choice==='prepare') {
      if(s.qualPreparations>=2)throw new Error('The qualification exam can only be deferred twice.');s.qualPreparations++;s.qualDeferredAt=s.month+1;s.career.qual='preparing';shift(s,'hidden',{learning:6,confidence:4,stress:-6});log(s,{kind:'qual-preparation'});
    } else {
      s.career.qualAttempts++;
      const h=scores(s),mastered=h.learning>=45&&h.research>=40&&h.motivation>=25;
      const passed=mastered&&(h.learning>=65||random(s)<clamp(.9+(h.luck-50)*.0006,.85,.95));
      s.career.qual=passed?'passed':'failed';log(s,{kind:'qual',passed,attempt:s.career.qualAttempts});
      if(passed)shift(s,'hidden',{motivation:5,confidence:5});
      else if(s.career.qualAttempts>=2)return finish(s,'unfinished');
      else {s.qualDeferredAt=s.month+1;shift(s,'hidden',{motivation:-3,stress:3});}
    }
  } else if(p.kind==='sabbatical') {
    if(!['home','away'].includes(choice))throw new Error('Invalid sabbatical choice.');s.sabbatical={active:true,until:60,mode:choice};log(s,{kind:'sabbatical',mode:choice});
  } else if(p.kind==='service'||p.kind==='service-review') {
    if(!['consult','skip'].includes(choice))throw new Error('Invalid service consultation.');
    // Narrative counseling only: this never assigns a legal service status or guarantees selection.
    if(s.locale!=='ko'||s.gender!=='male')throw new Error('This consultation is not applicable.');
    s.service.status=choice==='consult'?(p.kind==='service'?'planning':'consulted'):'not_requested';log(s,{kind:p.kind,choice});
  } else if(p.kind==='defense') {
    if(choice!=='defend')throw new Error('Invalid defense choice.');return finish(s,canDefend(s)?careerEnding(s):'unfinished');
  }
  s.pending=null;if(FACULTY_KEYS.some(k=>s.professor[k]===0))return finish(s,'gameover');nextPending(s);return s;
}
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
const number=(n,min=0,max=100)=>Number.isFinite(n)&&n>=min&&n<=max;
const integer=(n,min=0,max=10000)=>Number.isInteger(n)&&n>=min&&n<=max;
function validPending(p) { return p===null||(plain(p)&&PENDING_KINDS.includes(p.kind)&&(p.kind!=='event'||EVENTS.some(e=>e.id===p.id))); }
function validWeeklyResult(r,index) { return plain(r)&&r.week===index+1&&knownActivity(r.proposed)&&(knownActivity(r.actual)||r.actual==='unfinished')&&typeof r.performed==='boolean'&&WEEKLY_OUTCOMES.includes(r.outcome)&&number(r.progress,0,1000)&&integer(r.scienceFailures,0,1); }
export function validateSave(s) {
  if(!plain(s)||s.version!==VERSION||typeof s.name!=='string'||!s.name.trim()||s.name.length>24||!integer(s.month,0,MONTHS)||!integer(s.seed,0,4294967295)||!['male','female','unspecified'].includes(s.gender)||!['male','female','unspecified'].includes(s.professorGender)||!['ko','en'].includes(s.locale)||![null,'masters','integrated'].includes(s.route)||typeof s.started!=='boolean'||!(s.ending===null||ENDINGS.includes(s.ending)))return false;
  if(!plain(s.hidden)||!HIDDEN_KEYS.every(k=>number(s.hidden[k],...HIDDEN_RANGES[k]))||!plain(s.temperament)||!['curiosity','caution','expression'].every(k=>number(s.temperament[k]))||!plain(s.professor)||!FACULTY_KEYS.every(k=>number(s.professor[k]))||!validateGrants(s.grants))return false;
  if(!plain(s.eventFlags))return false;
  if(!plain(s.lab)||!number(s.lab.funds,0,5000)||!number(s.lab.equipment)||!checkBudget(s.lab.budget)||!checkAllocation(s.allocation)||!FEEDBACK.includes(s.feedback)||!FACULTY_ACTIONS.includes(s.facultyAction))return false;
  if(!plain(s.career)||!['submissions','papers','conferences','festivalAttendance','recommendations','awards','topPapers','completedProjects','qualAttempts'].every(k=>integer(s.career[k]))||!['not_due','due','preparing','passed','failed'].includes(s.career.qual)||s.career.papers>s.career.submissions||s.career.topPapers>s.career.papers||s.career.awards>s.career.papers+s.career.conferences||s.career.completedProjects!==s.career.papers||s.career.qualAttempts>2)return false;
  if(!plain(s.project)||!integer(s.project.id,1)||!integer(s.project.titleIndex,0,PROJECT_TITLES.length-1)||!integer(s.project.phase,0,5)||!number(s.project.progress,0,1000)||typeof s.project.conference!=='boolean'||typeof s.project.submitted!=='boolean'||!integer(s.project.reviewMonths)||!integer(s.project.revisions)||!(s.project.submittedAt===null||integer(s.project.submittedAt,1,s.month))||s.project.submitted&&(s.project.phase!==5||s.project.submittedAt===null))return false;
  if(!Array.isArray(s.plan)||s.plan.length!==4||!s.plan.every(knownActivity)||!Array.isArray(s.history)||s.history.length>3000||s.history.some(h=>!plain(h)||!integer(h.month,0,s.month)||typeof h.kind!=='string'))return false;
  if(!validPending(s.pending)||!Array.isArray(s.pendingQueue)||s.pendingQueue.length>8||!s.pendingQueue.every(p=>p!==null&&validPending(p))||s.ending&&(s.pending||s.pendingQueue.length)||s.pending?.kind==='event'&&!eventEligible(s,EVENTS.find(e=>e.id===s.pending.id)))return false;
  if(!plain(s.behavior)||!FEEDBACK.every(k=>integer(s.behavior[k]))||!integer(s.crisis,0,MONTHS)||!plain(s.eventFlags)||Object.entries(s.eventFlags).some(([id,f])=>!EVENTS.some(e=>e.id===id)||!plain(f)||!integer(f.lastMonth,0,s.month)||!integer(f.count,1)))return false;
  if(!plain(s.sabbatical)||typeof s.sabbatical.active!=='boolean'||!integer(s.sabbatical.until,0,MONTHS)||!['home','away'].includes(s.sabbatical.mode)||!plain(s.service)||!['none','planning','consulted','not_requested'].includes(s.service.status))return false;
  if(!(s.qualDeferredAt===null||integer(s.qualDeferredAt,s.month,MONTHS))||!integer(s.qualPreparations,0,2)||![48,54].includes(s.mastersReviewAt)||typeof s.mastersExtended!=='boolean'||!integer(s.lastRecommendationMonth,-12,MONTHS)||!(s.lastAcademicWarning===null||integer(s.lastAcademicWarning,0,s.month)))return false;
  if(s.lastReport!==null&&(!plain(s.lastReport)||!integer(s.lastReport.month,1,s.month)||!number(s.lastReport.completion,0,1)||!Array.isArray(s.lastReport.results)||s.lastReport.results.length!==4||!s.lastReport.results.every(validWeeklyResult)||!number(s.lastReport.progress,0,1000)||!integer(s.lastReport.scienceFailures,0,4)||!integer(s.lastReport.published)||!integer(s.lastReport.conferences)))return false;
  return true;
}
