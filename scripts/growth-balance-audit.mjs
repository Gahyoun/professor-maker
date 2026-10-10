// Paired policy audit: allowed player actions through the production simulation worker.
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,abilityScore,calendarMonth,projectWork,projectThresholds,qualificationStudy,studentTrainingActive,EVENTS,ACTIVITIES,validateSave,canDefend} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {availableActivities,weekContext} from '../dist/academic-calendar.js';
import {dilemmaOptions} from '../dist/monthly-choices.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
const policies=['random','default','research','faculty','industry'],skills=['learning','research','autonomy','language','industry','teaching','intuition','manners'];
function distribution(values){
 const ordered=[...values].sort((a,b)=>a-b),n=ordered.length;
 const q=p=>n?Number(ordered[Math.max(0,Math.ceil(n*p)-1)].toFixed(3)):null;
 return {count:n,min:q(0),p50:q(.5),p95:q(.95),max:q(1),atLeast95:ordered.filter(x=>x>=95).length,atLeast99:ordered.filter(x=>x>=99).length};
}
if(isMainThread){
 const runsPerPolicy=Number(process.argv[2]??250),output=process.argv[3];
 if(!Number.isSafeInteger(runsPerPolicy)||runsPerPolicy<1||!output)throw Error('Usage: node scripts/growth-balance-audit.mjs runs-per-policy output.json');
 const started=Date.now(),parts=await Promise.all(policies.map(policy=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{policy,runs:runsPerPolicy}});w.on('message',resolve);w.on('error',reject);}))),sourceHashes={};
 for(const file of ['scripts/growth-balance-audit.mjs','tests/play-support.mjs','dist/simulation-worker.js','dist/engine.js','dist/balance.js','dist/relationship.js','dist/funding.js','dist/grants.js','dist/events.js','dist/main-story.js','dist/monthly-choices.js','dist/workload.js','dist/impact.js','dist/disciplines.js','dist/academic-calendar.js','dist/travel.js','dist/venues.js','dist/research-topics.js','dist/names.js'])sourceHashes[file]=createHash('sha256').update(await fs.readFile(new URL('../'+file,import.meta.url))).digest('hex');
 const report={version:JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version,runs:runsPerPolicy*policies.length,runsPerPolicy,seedFormula:'16 + 7919 * run (same across policies and versions)',method:'Five fixed policies through production simulation-worker; no ability, funds, or output injection. All policies intentionally continue into doctoral study and use managed finances to isolate student growth. Random means uniform legal weekly activities, feedback and affordable event options; default accepts proposals and first affordable event options. These are test policies, not human-player or real-world probabilities.',sourceHashes,byPolicy:Object.fromEntries(parts.map(p=>[p.policy,p])),seconds:(Date.now()-started)/1000};
 await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({runs:report.runs,seconds:report.seconds,policies:parts.map(({policy,outcomes,doctoralMeans,errors})=>({policy,outcomes,doctoralMeans,errors}))}));
}else{
 let reply;globalThis.self={postMessage:r=>{reply=r;}};await import('../dist/simulation-worker.js');
 const execute=(type,state,more={})=>{reply=null;self.onmessage({data:{id:1,type,state,...more}});if(reply.error)throw Error(reply.error);return reply.state;};
 const {policy,runs}=workerData,result={policy,runs,outcomes:{},doctoralCount:0,doctoralMeans:{},errors:[],samples:[]},totals=Object.fromEntries(skills.map(k=>[k,0])),arrivals=Object.fromEntries(skills.map(k=>[k,[]])),doctoralPapers=[];
 for(let i=0;i<runs;i++){
  const seed=16+7919*i,field=DISCIPLINES[i%DISCIPLINES.length];let rng=seed^0xc01d;
  const draw=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296),pick=items=>items[Math.floor(draw()*items.length)];
  let s=createState('학생',seed,{gender:i%2?'male':'female',age:38,fieldId:field.id,labMode:field.labModes[Math.floor(i/73)%field.labModes.length],institution:['national','private','institute'][Math.floor(i/73)%3]});s.lab.creditEnabled=true;
  let outcome;
  try{
   for(let month=0;month<96&&!s.ending;month++){
    const training=studentTrainingActive(s),score=k=>abilityScore(s,k);let plan=proposeSchedule(s);
    if(policy==='faculty'&&!s.project.submitted){s.publication.journal=s.career.topPapers<2?'leading':'standard';s.project.journal=s.publication.journal;}
    if(!training&&policy==='random')plan=plan.map((id,index)=>weekContext(s,index,plan.length).conference?id:pick(Object.keys(ACTIVITIES).filter(k=>(k!=='teach'||s.month>=24)&&(k!=='conference'||availableActivities(s,index,plan.length).conference))));
    if(!training&&s.month>=24&&['research','faculty','industry'].includes(policy)){
     const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
     plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'free':primary;
     plan[3]=policy==='industry'?'industry':policy==='faculty'?(score('teaching')<65?'teach':score('language')<70?'language':primary):'free';
     if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='free';}
     else if(s.month>=30&&s.month<=48&&s.month%3===0)plan[0]='coursework';
     else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
    }
    if(!training&&policy==='faculty'&&s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2))plan[0]=plan[1]='coursework';
    const action=training?'routine':policy==='faculty'?(s.career.papers&&s.career.recommendations<4?'recommend':'conversation'):policy==='research'||policy==='industry'?s.month%3===0?'conversation':'routine':'routine';
    const options={...managedOptions(s,action),feedback:policy==='random'?pick(['listen','praise','critique','harsh']):policy==='default'?'listen':s.lastReport?.completion>=.7?'praise':'critique'};
    try{s=execute('month',s,{plan,options});}catch(e){if(!e.message.includes('Budget exceeds'))throw e;options.budget={...options.budget,environment:0,performance:0};s=execute('month',s,{plan,options});}
    for(let guard=0;s.pending&&!s.ending;guard++){
     if(guard>=25)throw Error('Decision queue did not terminate');const p=s.pending;
     const choices={'workshop-plan':'skip','monthly-issue':'acknowledge','conference-plan':p.scope==='domestic'?'student':'none','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
     let choice=p.kind==='event'?affordableEventChoice(s,p.id):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
     if(policy==='random'&&p.kind==='event'){const opts=dilemmaOptions(s,EVENTS.find(e=>e.id===p.id));choice=pick(opts.map((o,index)=>({o,index})).filter(({o})=>!o.disabled&&Math.max(0,-(o.effects?.lab?.funds??0))<=s.lab.funds)).index;}
     s=execute('decision',s,{choice});
    }
    if(!validateSave(s))throw Error('Invalid generated save');
   }
   outcome=s.ending??'incomplete';
  }catch(e){outcome=e.message.includes('Budget exceeds')?'budget-blocked':'error';if(outcome==='error')result.errors.push({run:i,seed,month:s.month,message:e.message});}
  result.outcomes[outcome]=(result.outcomes[outcome]??0)+1;
  if(s.month===96){result.doctoralCount++;for(const key of skills){const value=abilityScore(s,key);totals[key]+=value;arrivals[key].push(value);}if(s.ending&&canDefend(s))doctoralPapers.push(s.career.papers);}
  if(result.samples.length<3&&['true','institute','corporate'].includes(outcome))result.samples.push({run:i,seed,fieldId:field.id,outcome,month:s.month,papers:s.career.papers,skills:Object.fromEntries(skills.map(k=>[k,abilityScore(s,k)]))});
 }
 result.doctoralMeans=Object.fromEntries(skills.map(k=>[k,result.doctoralCount?Number((totals[k]/result.doctoralCount).toFixed(3)):null]));
 result.arrivalAbilityDistributions=Object.fromEntries(skills.map(k=>[k,distribution(arrivals[k])]));
 result.freshDoctoralPapers={...distribution(doctoralPapers),mean:doctoralPapers.length?Number((doctoralPapers.reduce((sum,n)=>sum+n,0)/doctoralPapers.length).toFixed(3)):null};
 parentPort.postMessage(result);
}
