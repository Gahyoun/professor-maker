const keys=['research','teaching','admin','mentoring'];
export function facultyCapacity(state){
 const age=Math.min(65,state.professorProfile.age+state.month/12),month=((state.month+(state.locale==='en'?8:2))%12)+1;
 const vacation=[1,2,7,8].includes(month),sabbatical=state.sabbatical.active;
 const young=Math.max(0,Math.min(2,Math.round((50-age)/10))),busy=month===(state.locale==='en'?9:3)||month===(state.locale==='en'?1:9);
 const draw=(Math.imul((state.creationSeed??state.seed)^(state.month*104729),2654435761)>>>0)/4294967296,jitter=draw<.15?-1:draw>.85?1:0;
 const credits=Math.max(8,Math.min(12,8+young+(vacation?1:0)+(sabbatical?1:0)-(busy&&!sabbatical?1:0)+jitter));
 const efficiency=Number(Math.max(.78,Math.min(1.2,.78+(age-30)*.014)).toFixed(3));
 return {credits,efficiency,teachingRequired:!vacation&&!sabbatical,vacation,sabbatical,jitter,age,calendarMonth:month};
}
export function allocateCredits(allocation,credits){
 const total=keys.reduce((n,k)=>n+allocation[k],0);if(total===credits)return {...allocation};
 const floors=keys.map(k=>Math.min(2,allocation[k])),minimum=floors.reduce((a,b)=>a+b,0),remaining=credits-minimum;
 const surplus=keys.map((k,i)=>Math.max(0,allocation[k]-floors[i])),extra=surplus.reduce((a,b)=>a+b,0),weights=extra>0?surplus.map(n=>n/extra):minimum>0?keys.map((k,i)=>floors[i]>0?floors[i]/minimum:0):keys.map(()=>.25);
 const exact=weights.map(w=>w*remaining),values=exact.map((n,i)=>floors[i]+Math.floor(n));
 const order=keys.map((_,i)=>i).sort((a,b)=>(exact[b]-Math.floor(exact[b]))-(exact[a]-Math.floor(exact[a]))||a-b);
 for(let i=0,left=credits-values.reduce((a,b)=>a+b,0);i<left;i++)values[order[i%4]]++;
 return Object.fromEntries(keys.map((k,i)=>[k,values[i]]));
}
