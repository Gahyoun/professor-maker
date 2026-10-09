// Simplified 3 PI / 5 total game model. Actual programs can have exceptions.
export function grantCounts(s){const active=(s.grants.portfolio??[{id:0,role:'pi',end:s.grants.cycleEnd}]).filter(g=>g.id===0||g.end>s.month);return {pi:active.filter(g=>g.role==='pi').length,total:active.length};}
export function grantCallOpen(s){const m=((s.month+(s.locale==='en'?8:2))%12)+1;return [3,9].includes(m)||s.lab.funds<80;}
export function canApplyGrant(s,role='pi'){const n=grantCounts(s);return n.total<5&&(role==='co'||n.pi<3);}
export function validApplication(a){return a&&['pi','co'].includes(a.role)&&[1,2,3].includes(a.years)&&Object.keys(a).every(k=>['role','years'].includes(k));}
export function ensureFunding(s){
 s.lab.pool??=0;
 s.grants.portfolio??=[{id:0,role:'pi',start:s.grants.cycleStart,end:s.grants.cycleEnd,annual:s.grants.annualAmount,titleIndex:s.grants.titleIndex}];
}
export function validPortfolio(s){if(!s.grants)return false;const gs=s.grants.portfolio;if(gs===undefined)return true;if(!Array.isArray(gs)||gs.length>96||gs.some(g=>!g||!Number.isInteger(g.id)||g.id<0||!['pi','co'].includes(g.role)||!Number.isInteger(g.start)||g.start<0||g.start>96||!Number.isInteger(g.end)||g.end<=g.start||g.end-g.start>36||g.end>132||!Number.isInteger(g.annual)||g.annual<0||g.annual>1000||!Number.isInteger(g.titleIndex)||g.titleIndex<0||g.titleIndex>2)||new Set(gs.map(g=>g.id)).size!==gs.length)return false;const n=grantCounts(s);return n.pi<=3&&n.total<=5;}
export function depositGrant(s,amount){const pooled=Math.round(amount*.35);s.lab.pool=Math.min(5000,s.lab.pool+pooled);s.lab.funds=Math.min(5000,s.lab.funds+amount-pooled);}
export function advancePortfolio(s,application,{random,log}){
 ensureFunding(s);const base=s.grants.portfolio.find(g=>g.id===0);if(base){base.start=s.grants.cycleStart;base.end=s.grants.cycleEnd;base.annual=s.grants.annualAmount;base.titleIndex=s.grants.titleIndex;}
 {for(const g of s.grants.portfolio){if(g.id!==0&&s.month>g.start&&(s.month-g.start)%12===0&&s.month<g.end){depositGrant(s,g.annual);log(s,{kind:'portfolio-payment',grantId:g.id,amount:g.annual});}}}
 if(s.facultyAction!=='funding')return;
 if(!canApplyGrant(s,application.role)){log(s,{kind:'portfolio-limit',role:application.role});return;}
 const m=((s.month-1+(s.locale==='en'?8:2))%12)+1;const seasonal=[3,9].includes(m);const chance=Math.min(.85,(seasonal?.35:.15)+s.professor.research*.002+s.professor.admin*.001+Math.min(4,s.career.papers)*.035);
 const awarded=random()<chance;log(s,{kind:'portfolio-selection',awarded,role:application.role,years:application.years});
 if(awarded){const g={id:Math.max(...s.grants.portfolio.map(g=>g.id))+1,role:application.role,start:s.month,end:s.month+application.years*12,annual:application.role==='pi'?(s.professorProfile.institution==='institute'?180:150):90,titleIndex:s.grants.portfolio.length%3};s.grants.portfolio.push(g);depositGrant(s,g.annual);}
}
