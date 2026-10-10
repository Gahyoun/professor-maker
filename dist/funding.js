// Fictional 3 PI / 5 total model; real programs and exemptions require official guidance.
export const FINANCE_RULES_VERSION=1;
export const LEGACY_BALANCE_CAP=2000; // Game unit = 100,000 KRW; cap = 200 million KRW.
export function seededInitialFunding(seed,institution='national'){
 const hash=Math.imul((Number(seed)>>>0)^0x49e17,2654435761)>>>0;
 const total=(3+hash%18)*100; // 30–200 million KRW, in 10 million KRW steps.
 const pool=institution==='institute'?0:Math.round(total*.25);
 return {total,funds:total-pool,pool};
}
export function migrateFinance(s){
 if(s.lab.financeRules===FINANCE_RULES_VERSION)return;
 const original={funds:s.lab.funds,pool:s.lab.pool??0,debt:s.lab.debt??0},total=original.funds+original.pool;
 const ratio=total>LEGACY_BALANCE_CAP?LEGACY_BALANCE_CAP/total:1;
 const funds=Math.round(original.funds*ratio*10000)/10000,pool=ratio<1?LEGACY_BALANCE_CAP-funds:original.pool;
 s.lab.funds=funds;s.lab.pool=pool;s.lab.financeRules=FINANCE_RULES_VERSION;
 s.lab.initialFunding=seededInitialFunding(s.creationSeed??s.seed,s.professorProfile.institution).total;
 s.lab.financeMigration={version:FINANCE_RULES_VERSION,month:s.month,original,applied:{funds,pool,debt:original.debt}};
 s.history.push({month:s.month,kind:'finance-migration',version:FINANCE_RULES_VERSION,adjusted:ratio<1,beforeTotal:total,afterTotal:funds+pool});
}
export function validFinance(s){
 const lab=s.lab,number=(x,max)=>Number.isFinite(x)&&x>=0&&x<=max;
 if(lab?.financeRules===undefined)return true;
 if(lab.financeRules!==FINANCE_RULES_VERSION||!Number.isInteger(lab.initialFunding)||lab.initialFunding<300||lab.initialFunding>2000||lab.initialFunding%100!==0)return false;
 const b=lab.financeMigration;if(b===undefined)return true;
 return b&&b.version===FINANCE_RULES_VERSION&&Number.isInteger(b.month)&&b.month>=0&&b.month<=s.month&&['original','applied'].every(k=>b[k]&&number(b[k].funds,5000)&&number(b[k].pool,5000)&&number(b[k].debt,100))&&b.applied.funds+b.applied.pool<=LEGACY_BALANCE_CAP+.0001;
}
export function grantCounts(s){
 const active=(s.grants.portfolio??[{id:0,role:'pi',start:s.grants.cycleStart,end:s.grants.cycleEnd}]).filter(g=>g.start<=s.month&&g.end>s.month&&(g.id!==0||s.grants.status==='active'));
 return {pi:active.filter(g=>g.role==='pi').length,total:active.length};
}
export function grantCallOpen(s){const m=((s.month+(s.locale==='en'?8:2))%12)+1;return [3,9].includes(m);}
export function baseRenewalDue(s){return s.month<s.grants.cycleEnd&&s.grants.cycleEnd-s.month<=12&&!s.grants.applicationCycles.includes(s.grants.cycleEnd);}
export function canApplyGrant(s,role='pi'){const n=grantCounts(s);return role==='pi'&&s.grants.status==='active'&&baseRenewalDue(s)||n.total<5&&(role==='co'||n.pi<3);}
export function validApplication(a){return a&&['pi','co'].includes(a.role)&&[2,3,4,5].includes(a.years)&&Object.keys(a).every(k=>['role','years'].includes(k));}
export function ensureFunding(s){
 s.lab.pool??=0;
 s.grants.portfolio??=[{id:0,role:'pi',start:s.grants.cycleStart,end:s.grants.cycleEnd,annual:s.grants.annualAmount,titleIndex:s.grants.titleIndex}];
}
export function validPortfolio(s){
 if(!s.grants)return false;const gs=s.grants.portfolio;if(gs===undefined)return true;
 if(!Array.isArray(gs)||gs.length>96||gs.some(g=>!g||!Number.isInteger(g.id)||g.id<0||!['pi','co'].includes(g.role)||!Number.isInteger(g.start)||g.start<0||g.start>96||!Number.isInteger(g.end)||g.end<=g.start||g.end-g.start>60||g.end>156||!Number.isInteger(g.annual)||g.annual<0||g.annual>1000||!Number.isInteger(g.titleIndex)||g.titleIndex<0||g.titleIndex>2||(g.lastPaymentMonth!==undefined&&(!Number.isInteger(g.lastPaymentMonth)||g.lastPaymentMonth<0||g.lastPaymentMonth>96)))||new Set(gs.map(g=>g.id)).size!==gs.length)return false;
 const n=grantCounts(s);return n.pi<=3&&n.total<=5;
}
export function depositGrant(s,amount){const pooled=Math.round(amount*.35);s.lab.pool=Math.min(5000,s.lab.pool+pooled);s.lab.funds=Math.min(5000,s.lab.funds+amount-pooled);const repayment=Math.min(s.lab.funds,s.lab.debt??0);s.lab.funds-=repayment;if(s.lab.debt!==undefined)s.lab.debt-=repayment;if(repayment)s.history.push({month:s.month,kind:'advance-repayment',amount:repayment,debt:s.lab.debt});}
export function advancePortfolio(s,application,{random,log}){
 ensureFunding(s);const base=s.grants.portfolio.find(g=>g.id===0);if(base){base.start=s.grants.cycleStart;base.end=s.grants.cycleEnd;base.annual=s.grants.annualAmount;base.titleIndex=s.grants.titleIndex;}
 for(const g of s.grants.portfolio){if(g.id!==0&&s.month>g.start&&(s.month-g.start)%12===0&&s.month<g.end&&g.lastPaymentMonth!==s.month){g.lastPaymentMonth=s.month;depositGrant(s,g.annual);log(s,{kind:'portfolio-payment',grantId:g.id,amount:g.annual});}}
 if(s.facultyAction!=='funding'||!validApplication(application))return;
 // A replacement application reserves the existing PI slot rather than adding a fourth.
 if(s.history.some(h=>h.month===s.month&&h.kind==='grant-application'))return;
 if(!grantCallOpen({...s,month:s.month-1})){log(s,{kind:'portfolio-call-closed'});return;}
 if(s.grants.lastApplicationMonth===s.month){log(s,{kind:'portfolio-repeat-blocked'});return;}
 if(!canApplyGrant(s,application.role)){log(s,{kind:'portfolio-limit',role:application.role});return;}
 s.grants.lastApplicationMonth=s.month;
 const chance=Math.min(.8,.3+s.professor.research*.002+s.professor.admin*.001+Math.min(4,s.career.papers)*.035);
 const awarded=random()<chance,annual=Math.round((application.role==='pi'?(s.professorProfile.institution==='institute'?180:150):90)*(s.professorProfile.labMode==='wet'?1.5:1));
 const id=Math.max(0,...s.grants.portfolio.map(g=>g.id))+1,titleIndex=id%3;
 log(s,{kind:'portfolio-selection',awarded,role:application.role,years:application.years,annual:awarded?annual:0,grantId:awarded?id:null,titleIndex,start:s.month,end:s.month+application.years*12});
 if(awarded){const g={id,role:application.role,start:s.month,end:s.month+application.years*12,annual,titleIndex};s.grants.portfolio.push(g);depositGrant(s,g.annual);}
}
export function fundingResults(s){return s.history.filter(h=>h.month===s.month&&['portfolio-selection','grant-selection'].includes(h.kind)).map(h=>({source:h.kind==='portfolio-selection'?'portfolio':'renewal',awarded:h.awarded,role:h.role??'pi',years:h.years??Math.round((s.grants.cycleEnd-s.grants.cycleStart)/12),annual:h.annual??s.grants.annualAmount,grantId:h.grantId??null,titleIndex:h.titleIndex??s.grants.titleIndex,start:h.start??s.grants.cycleStart,end:h.end??s.grants.cycleEnd}));}
export function validFundingResults(results){return Array.isArray(results)&&results.length<=5&&results.every(r=>r&&['portfolio','renewal'].includes(r.source)&&typeof r.awarded==='boolean'&&['pi','co'].includes(r.role)&&Number.isInteger(r.years)&&r.years>=1&&r.years<=5&&Number.isInteger(r.annual)&&r.annual>=0&&r.annual<=1000&&(r.grantId===null||Number.isInteger(r.grantId)&&r.grantId>=0)&&Number.isInteger(r.titleIndex)&&r.titleIndex>=0&&r.titleIndex<=2&&Number.isInteger(r.start)&&r.start>=0&&r.start<=96&&Number.isInteger(r.end)&&r.end>r.start&&r.end<=156);}
