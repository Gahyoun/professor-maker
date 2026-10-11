// Fictional, visible recovery windows. These are game rules, not institutional policy.
import {researchFinanceProfile} from './research-finance.js';
export const LAB_RISK_KEYS=['research','teaching','admin','mentoring'];
const labels={research:'학술활동',teaching:'교육',admin:'학교행정',mentoring:'연구실 운영'};
const english={research:'Research',teaching:'Teaching',admin:'Administration',mentoring:'Lab management'};
export const LAB_CLOSURE_MONTHS=3;
export const difficultyOf=s=>s?.professorProfile?.difficulty==='beginner'?'beginner':'realistic';
export function difficultySettings(s){
 const id=difficultyOf(s),easy=id==='beginner';
 return {id,label:easy?'신임교수(쉬움)':'현실(보통)',supportUntil:easy?24:0,supportFloor:easy?800:0,totalSupport:easy?300:0,monthlySupport:easy?30:0,remainingSupport:easy?Math.max(0,300-(s.labRisk?.supportUsed??0)):0};
}
export function initialLabRisk(month=0){return {version:1,lastEvaluatedMonth:month,faculty:Object.fromEntries(LAB_RISK_KEYS.map(k=>[k,0])),funding:0,warned:Object.fromEntries([...LAB_RISK_KEYS,'funding'].map(k=>[k,0])),supportUsed:0};}
export function settlementSupport(s,{stipend=0,credit=0}={}){
 const settings=difficultySettings(s),available=s.month<settings.supportUntil?Math.min(settings.monthlySupport,settings.remainingSupport):0;
 const operating=researchFinanceProfile(s).fixed;
 const shortfall=Math.max(0,operating-s.lab.funds-credit,stipend+operating-s.lab.funds-(s.lab.pool??0)-credit);
 return {available,amount:Math.min(available,shortfall),remaining:settings.remainingSupport,untilMonth:settings.supportUntil};
}
export function labRiskStatus(s){
 const risk=s.labRisk??initialLabRisk(s.month??0),items=[];
 for(const key of LAB_RISK_KEYS){const streak=risk.faculty[key];if(streak||s.professor?.[key]<=15)items.push({key,label:labels[key],streak,remaining:streak?Math.max(0,LAB_CLOSURE_MONTHS-streak):LAB_CLOSURE_MONTHS,advice:`${labels[key]}에 업무 크레딧을 다시 배분하세요.`});}
 if(risk.funding)items.push({key:'funding',label:'연구비',streak:risk.funding,remaining:Math.max(0,LAB_CLOSURE_MONTHS-risk.funding),advice:'선택 지출을 줄이고 미상환 차입금과 다음 연구과제 입금을 확인하세요.'});
 return {items,fundingStreak:risk.funding};
}
export function labWarningText(p,locale='ko'){
 if(p.reason==='funding')return !p.streak?(locale==='en'?'The balance available for essential commitments is below three months of expenses. The department chair asks you to review spending and upcoming grant deposits.':'필수 지출에 사용할 잔액이 3개월분보다 적습니다. 학과장이 지출 조정과 다음 연구과제 입금 확인을 요청했습니다.'):p.mode==='borrowing'?(locale==='en'?`Operations continued through department borrowing for ${p.streak} consecutive month(s), with more than 10 million KRW outstanding. There are ${p.remainingMonths} months to restore funding.`:`운영비가 부족해 ${p.streak}개월 연속 학과 차입으로 진행했으며 미상환액이 1천만원을 넘었습니다. 폐쇄 전 ${p.remainingMonths}개월 안에 지출과 과제 입금을 조정해 주세요.`):(locale==='en'?`Essential funding is unavailable. Operations have been suspended for ${p.streak} consecutive month(s). There are ${p.remainingMonths} months to restore funding.`:`필수 운영비가 부족해 연구실 운영을 ${p.streak}개월 연속 보류했습니다. 폐쇄 전 ${p.remainingMonths}개월의 회복 기회가 남았습니다.`);
 const names=p.keys.map(k=>(locale==='en'?english:labels)[k]).join(' · ');
 return p.streak?(locale==='en'?`${names} has remained at zero for ${p.streak} month(s). Restore it within ${p.remainingMonths} months.`:`${names}이 ${p.streak}개월 연속 0입니다. ${p.remainingMonths}개월 안에 해당 업무를 회복해야 합니다.`):(locale==='en'?`${names} is low. Review your workload before it reaches zero; closure requires three consecutive months at zero.`:`${names}이 낮아 학과장이 업무 조정을 요청했습니다. 해당 업무가 0으로 3개월 연속 지속되면 연구실 운영이 종료됩니다.`);
}
export function closureSummary(s,locale='ko'){
 const cause=s?.labClosure;if(!cause){
  const reasons={graduation_requirements:['필요한 논문·발표 등 학위 요건 미충족','Degree requirements were not met.'],time_limit:['8년 안에 학위 과정 미완료','The degree was not completed within eight years.'],qual_failure:['박사과정 자격 요건 미충족 또는 과정 정리','Doctoral qualifying requirements were unmet or the track was discontinued.']};
  return reasons[s?.endingReason]?.[locale==='en'?1:0]??(locale==='en'?'The earlier record does not retain a detailed reason for ending.':'이전 기록에는 세부 종료 원인이 남아 있지 않습니다.');
 }
 if(cause.reason==='funding')return cause.mode==='borrowing'?(locale==='en'?`Operating funds shortage: department borrowing for ${cause.streak} consecutive months with more than 10 million KRW outstanding.`:`운영비 부족·학과 차입 ${cause.streak}개월 연속, 미상환액 1천만원 초과`):(locale==='en'?`Essential funding shortage: operations suspended for ${cause.streak} consecutive months.`:`필수 연구비 부족으로 연구실 운영 ${cause.streak}개월 연속 보류`);
 const names=cause.keys.map(k=>(locale==='en'?english:labels)[k]).join(' · ');
 return locale==='en'?`${names} remained at zero for ${cause.streak} consecutive months.`:`${names} 0 상태 ${cause.streak}개월 연속 미회복`;
}
const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi;
export function validLabClosure(cause,month=96){return !!cause&&typeof cause==='object'&&!Array.isArray(cause)&&(cause.mode===undefined||cause.reason==='funding'&&['borrowing','suspension'].includes(cause.mode))&&['faculty','funding'].includes(cause.reason)&&Array.isArray(cause.keys)&&new Set(cause.keys).size===cause.keys.length&&cause.keys.every(k=>LAB_RISK_KEYS.includes(k))&&(cause.reason==='faculty'?cause.keys.length>0:cause.keys.length===0)&&cause.streak===LAB_CLOSURE_MONTHS&&int(cause.month,LAB_CLOSURE_MONTHS,month)&&cause.recovery===(cause.reason==='faculty'?'allocate':'funding');}
export function validLabRisk(risk,month){
 if(risk===undefined)return true;
 return !!risk&&typeof risk==='object'&&!Array.isArray(risk)&&(risk.fundingMode===undefined||risk.funding>0&&['borrowing','suspension'].includes(risk.fundingMode))&&risk.version===1&&int(risk.lastEvaluatedMonth,0,month)&&risk.faculty&&Object.keys(risk.faculty).length===4&&LAB_RISK_KEYS.every(k=>int(risk.faculty[k],0,Math.min(LAB_CLOSURE_MONTHS,risk.lastEvaluatedMonth)))&&int(risk.funding,0,Math.min(LAB_CLOSURE_MONTHS,risk.lastEvaluatedMonth))&&risk.warned&&Object.keys(risk.warned).length===5&&[...LAB_RISK_KEYS,'funding'].every(k=>int(risk.warned[k],0,2))&&Number.isFinite(risk.supportUsed)&&risk.supportUsed>=0&&risk.supportUsed<=300;
}
export function validLabWarning(p){return p&&(p.mode===undefined||p.reason==='funding'&&['borrowing','suspension'].includes(p.mode))&&['faculty','funding'].includes(p.reason)&&Array.isArray(p.keys)&&new Set(p.keys).size===p.keys.length&&p.keys.every(k=>LAB_RISK_KEYS.includes(k))&&(p.reason==='faculty'?p.keys.length>0:p.keys.length===0)&&int(p.streak,0,2)&&int(p.remainingMonths,1,3)&&p.remainingMonths===LAB_CLOSURE_MONTHS-p.streak;}
