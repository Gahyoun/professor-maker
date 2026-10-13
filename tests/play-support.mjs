// A player strategy for integration tests: plan grants ahead, scale spending in gaps,
// and direct spare credits to teaching without abandoning administration.
import {canApplyGrant,grantCallOpen,baseRenewalDue} from '../dist/funding.js';
import {EVENTS,calendarMonth,simulateMonth,decide} from '../dist/engine.js';
import {dilemmaOptions} from '../dist/monthly-choices.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
import {campusPolicy} from '../dist/campus-calendar.js';
export function managedOptions(s,facultyAction='routine'){
 const c=facultyCapacity(s),allocation={research:2,teaching:2,admin:2,mentoring:2};
 if(c.teachingRequired&&(c.credits>=9||s.professor.teaching<45&&s.professor.admin>45)){allocation.teaching=3;if(c.credits<9)allocation[s.professor.admin<s.professor.research?'research':'admin']=1;}
 if(c.credits>=9&&s.professor.admin<55){allocation.admin=3;if(c.credits===9)allocation.teaching=2;}
 if(s.professor.admin<40&&s.professor.mentoring>60){allocation.admin=3;allocation.mentoring=1;}
 const budget={...s.lab.budget};if(s.lab.funds<100){budget.environment=s.lab.funds<50?0:1;budget.performance=0;}else if(s.lab.funds>200){budget.environment=2;budget.performance=3;}
 // Persisted actions are selections for this month only; closed calls cannot be re-used.
 if(calendarMonth(s.month,s.locale)===campusPolicy(s).stipendMonth&&s.lab.funds<100)budget.salary=Math.min(budget.salary,40);
 if(facultyAction==='funding'&&(!canApplyGrant(s)||!grantCallOpen(s)))facultyAction='routine';
 if(canApplyGrant(s)&&grantCallOpen(s)&&(baseRenewalDue(s)||s.lab.funds<300))facultyAction='funding';
 return {allocation:allocateCredits(allocation,c.credits),budget,facultyAction};
}

export function affordableEventChoice(s,id,preferred=0){
 const e=EVENTS.find(e=>e.id===id),options=dilemmaOptions(s,e);
 const affordable=o=>!o.disabled&&Math.max(0,-(o.effects.lab?.funds??0))<=s.lab.funds;
 return affordable(options[preferred])?preferred:options.findIndex(affordable);
}

// Integration policies explicitly answer the pre-month consent step before
// evaluating one completed month. Individual request tests exercise both calls.
export function simulateWithRestConsent(s,plan,options,choice){
 if(!['allow','decline'].includes(choice))throw new Error('Choose a rest consent policy.');
 let next=simulateMonth(s,plan,options);
 if(next.month===s.month&&next.pending?.kind==='rest-request'){
  next=decide(next,choice);
  next=simulateMonth(next,next.plan,options);
 }
 return next;
}
