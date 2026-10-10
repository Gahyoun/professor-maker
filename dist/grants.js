import {grantCounts} from './funding.js';
// Fictional grant management: timing, amounts and chances are game balance.
export const GRANT_TITLES=['기초 현상의 구조와 동역학','복합 시스템의 변화와 회복력','연구 방법의 확장과 학술 생태계'];
export const GRANT_SOURCE='https://webzine.nrf.re.kr/magazine/2604/sub1.php';
export function annualGrantAmount(institution='national',labMode='dry'){return Math.round((institution==='institute'?450:300)*(labMode==='wet'?1.5:1));}
export function initialGrants(institution='national',seed=0,labMode='dry'){
 const years=2+((Math.imul((Number(seed)>>>0)^0x1357,2654435761)>>>0)%4);
 return {titleIndex:0,cycleStart:0,cycleEnd:years*12,annualAmount:annualGrantAmount(institution,labMode),status:'active',reportYears:[],applicationCycles:[],renewals:0,bridgeYears:0,lastPaymentMonth:0};
}
export function advanceGrants(s,{random,log,application={role:'pi',years:3}}){
 const g=s.grants,offset=(s.month-1)%12,year=Math.floor((s.month-1)/12)+1;
 if((offset>=10&&s.allocation.admin>=2)||s.facultyAction==='report')if(!g.reportYears.includes(year)){g.reportYears.push(year);log(s,{kind:'grant-report',year});}
 if([0,6].includes(offset)&&s.facultyAction==='funding'&&application.role==='pi'&&s.month<=g.cycleEnd&&g.cycleEnd-s.month<=12&&!g.applicationCycles.includes(g.cycleEnd)){
  g.applicationCycles.push(g.cycleEnd);g.applicationYears=application.years;g.lastApplicationMonth=s.month;log(s,{kind:'grant-application',cycleEnd:g.cycleEnd,years:application.years});
 }
 if(offset!==0||s.month<=1||g.lastPaymentMonth===s.month)return;
 const reported=g.reportYears.includes(year-1);
 if(s.month>g.cycleEnd){
  const prepared=g.applicationCycles.includes(g.cycleEnd),credible=s.professor.research>=35&&s.career.submissions>=Math.min(2,year-2);
  const probability=Math.min(s.professorProfile.institution==='institute'?.85:.72,.35+s.professor.research*.0015+s.professor.admin*.001+Math.min(4,s.career.papers)*.025);
  const counts=grantCounts(s),room=counts.pi<3&&counts.total<5;
  const awarded=prepared&&credible&&room&&random()<probability,years=awarded?(g.applicationYears??3):1;
  g.status=awarded?'active':'bridge';g.cycleStart=s.month-1;g.cycleEnd=g.cycleStart+years*12;
  if(awarded){g.annualAmount=annualGrantAmount(s.professorProfile.institution,s.professorProfile.labMode);g.renewals++;g.titleIndex=(g.titleIndex+1)%GRANT_TITLES.length;}
  log(s,{kind:'grant-selection',awarded,prepared,limitBlocked:!room,role:'pi',years:awarded?years:(g.applicationYears??3),annual:awarded?g.annualAmount:0,grantId:awarded?0:null,titleIndex:g.titleIndex,start:g.cycleStart,end:g.cycleStart+(awarded?years:(g.applicationYears??3))*12});
 }
 // A one-year, once-per-run bridge can ease a funding gap; it cannot replace a grant indefinitely.
 const amount=g.status==='bridge'?(g.bridgeYears===0?100:0):reported?g.annualAmount:Math.round(g.annualAmount*.6);
 if(g.status==='bridge')g.bridgeYears++;
 g.lastPaymentMonth=s.month;
 s.lab.funds=Math.min(5000,s.lab.funds+amount);
 if(!reported){s.professor.admin=Math.max(0,s.professor.admin-4);log(s,{kind:'grant-report-delay',year:year-1});}
 log(s,{kind:'annual-grant',amount,status:g.status,reported});
}
export function validateGrants(g){
 const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
 return !!g&&typeof g==='object'&&!Array.isArray(g)&&int(g.titleIndex,0,GRANT_TITLES.length-1)&&int(g.cycleStart,0,96)&&int(g.cycleEnd,1,156)&&g.cycleEnd>g.cycleStart&&g.cycleEnd-g.cycleStart<=60&&int(g.annualAmount,0,1000)&&['active','bridge'].includes(g.status)&&Array.isArray(g.reportYears)&&g.reportYears.length<=8&&g.reportYears.every(n=>int(n,1,8))&&new Set(g.reportYears).size===g.reportYears.length&&Array.isArray(g.applicationCycles)&&g.applicationCycles.length<=8&&g.applicationCycles.every(n=>int(n,12,156)&&n%12===0)&&new Set(g.applicationCycles).size===g.applicationCycles.length&&int(g.renewals,0,4)&&int(g.bridgeYears,0,7)&&int(g.lastPaymentMonth,0,96)&&(g.applicationYears===undefined||[2,3,4,5].includes(g.applicationYears))&&(g.lastApplicationMonth===undefined||int(g.lastApplicationMonth,0,96));
}
