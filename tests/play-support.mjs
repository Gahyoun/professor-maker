// A player strategy for integration tests: plan grants ahead, scale spending in gaps,
// and direct spare credits to teaching without abandoning administration.
import {canApplyGrant,grantCallOpen} from '../dist/funding.js';
import {facultyCapacity,allocateCredits} from '../dist/workload.js';
export function managedOptions(s,facultyAction='routine'){
 const c=facultyCapacity(s),allocation={research:2,teaching:2,admin:2,mentoring:2};
 if(c.teachingRequired&&(c.credits>=9||s.professor.teaching<45&&s.professor.admin>45)){allocation.teaching=3;if(c.credits<9)allocation.admin=1;}
 const budget={...s.lab.budget};if(s.lab.funds<100){budget.environment=1;budget.performance=0;}else if(s.lab.funds>200){budget.environment=2;budget.performance=3;}
 if(canApplyGrant(s)&&grantCallOpen(s)&&s.lab.funds<180)facultyAction='funding';
 return {allocation:allocateCredits(allocation,c.credits),budget,facultyAction};
}
