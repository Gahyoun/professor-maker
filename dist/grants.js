// Fictional management model inspired by Korean grant administration.
// Amounts, timing and selection rules are game balance, not current grant rules.
export const GRANT_TITLES = [
  '기초 현상의 구조와 동역학',
  '복합 시스템의 변화와 회복력',
  '연구 방법의 확장과 학술 생태계',
];
export const GRANT_SOURCE = 'https://webzine.nrf.re.kr/magazine/2604/sub1.php';
export function initialGrants(institution='national') {
  return {titleIndex:0,cycleStart:0,cycleEnd:36,annualAmount:institution==='institute'?600:institution==='private'?360:400,status:'active',
    reportYears:[],applicationCycles:[],renewals:0,bridgeYears:0,lastPaymentMonth:0};
}
export function advanceGrants(s,{random,log}) {
  const g=s.grants,offset=(s.month-1)%12,year=Math.floor((s.month-1)/12)+1;
  // Workload spent on administration includes reports; the extra activity is a shortcut.
  if((offset>=10&&s.allocation.admin>=2)||s.facultyAction==='report') {
    if(!g.reportYears.includes(year)){g.reportYears.push(year);log(s,{kind:'grant-report',year});}
  }
  if([0,6].includes(offset)&&s.facultyAction==='funding'&&g.cycleEnd-s.month<=12) {
    if(!g.applicationCycles.includes(g.cycleEnd)){g.applicationCycles.push(g.cycleEnd);log(s,{kind:'grant-application',cycleEnd:g.cycleEnd});}
  }
  if(offset!==0||s.month<=1||g.lastPaymentMonth===s.month)return;
  const reported=g.reportYears.includes(year-1);
  if(s.month>g.cycleEnd) {
    // Balanced faculty work can prepare the application without a separate click.
    const prepared=g.applicationCycles.includes(g.cycleEnd)||(s.allocation.admin>=2&&s.professor.admin>=35);
    const credible=s.professor.research>=35&&s.career.submissions>=Math.min(2,year-2);
    const easy=s.professorProfile?.institution==='institute';
    const probability=easy?.93:Math.min(.72,.4+s.professor.research*.0015+s.professor.admin*.001+Math.min(4,s.career.papers)*.025);
    const awarded=prepared&&credible&&random()<probability;
    g.status=awarded?'active':'bridge';g.cycleStart=s.month-1;g.cycleEnd=Math.min(96,g.cycleStart+36);
    if(awarded){g.renewals++;g.titleIndex=(g.titleIndex+1)%GRANT_TITLES.length;}
    log(s,{kind:'grant-selection',awarded,prepared});
  }
  const easy=s.professorProfile?.institution==='institute';
  const amount=easy?(g.status==='bridge'?180:reported?Math.round(420+(s.professor.research+s.professor.admin)*.5):220):(g.status==='bridge'?140:reported?Math.round(350+(s.professor.research+s.professor.admin)*.3):180);
  if(g.status==='bridge')g.bridgeYears++;
  g.annualAmount=amount;g.lastPaymentMonth=s.month;
  s.lab.funds=Math.min(5000,s.lab.funds+amount);
  if(!reported){s.professor.admin=Math.max(0,s.professor.admin-4);log(s,{kind:'grant-report-delay',year:year-1});}
  log(s,{kind:'annual-grant',amount,status:g.status,reported});
}
export function validateGrants(g) {
  const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
  return !!g&&typeof g==='object'&&!Array.isArray(g)&&int(g.titleIndex,0,GRANT_TITLES.length-1)
    &&int(g.cycleStart,0,96)&&int(g.cycleEnd,1,96)&&g.cycleEnd>g.cycleStart
    &&int(g.annualAmount,0,1000)&&['active','bridge'].includes(g.status)
    &&Array.isArray(g.reportYears)&&g.reportYears.length<=8&&g.reportYears.every(n=>int(n,1,8))&&new Set(g.reportYears).size===g.reportYears.length
    &&Array.isArray(g.applicationCycles)&&g.applicationCycles.length<=3&&g.applicationCycles.every(n=>[36,72,96].includes(n))&&new Set(g.applicationCycles).size===g.applicationCycles.length
    &&int(g.renewals,0,2)&&int(g.bridgeYears,0,7)&&int(g.lastPaymentMonth,0,96);
}
