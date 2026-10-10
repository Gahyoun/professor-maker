import {monthlyBudgetCost,salaryBase,availableCredit,proposeSchedule,studentRestRequest} from './engine.js';
import {conferenceCosts} from './travel.js';
import {facultyCapacity} from './workload.js';
import {grantCallOpen,canApplyGrant} from './funding.js';

// The same pools and commitments used by the simulation, without changing state.
export function planReadiness(state,application={role:'pi'}){
  const stipend=salaryBase(state)*state.lab.budget.salary/100;
  const cost=monthlyBudgetCost(state)+Object.values(conferenceCosts(state)).reduce((a,b)=>a+b,0);
  const operating=cost-stipend,credit=availableCredit(state);
  const operatingAvailable=state.lab.funds+credit,totalAvailable=operatingAvailable+(state.lab.pool??0);
  const capacity=facultyCapacity(state).credits,allocated=Object.values(state.allocation).reduce((a,b)=>a+b,0);
  const blockers=[];
  if(allocated>capacity)blockers.push('workload');
  if(state.facultyAction==='funding'){
    if(!grantCallOpen(state))blockers.push('grant-call');
    else if(!canApplyGrant(state,application.role))blockers.push('grant-limit');
  }
  if(operating>operatingAvailable)blockers.push('operating-funds');
  if(cost>totalAvailable)blockers.push('total-funds');
  return {ready:!blockers.length,blockers,cost,stipend,operating,operatingAvailable,totalAvailable,
    shortfall:Math.max(0,operating-operatingAvailable,cost-totalAvailable),allocated,capacity};
}

export function recoveryPlan(state){
  const request=studentRestRequest(state);
  const offered=request?proposeSchedule(state).flatMap((id,i)=>id==='recovery'?[i]:[]):[];
  const missing=offered.filter(i=>state.plan[i]!=='recovery');
  return {request,offered,missing};
}

export function acceptRecoveryPlan(state){
  const plan=[...state.plan];
  for(const i of recoveryPlan(state).offered)plan[i]='recovery';
  return plan;
}
