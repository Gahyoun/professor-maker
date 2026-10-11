// Reproducible policy audit, not an estimate of human players or real career odds.
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,calendarMonth,abilityScore,projectThresholds,projectWork,studentTrainingActive,studentRestRequest,monthlyBudgetCost,degreeRequirements,canDefend} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {generateKoreanName} from '../dist/names.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
const MIXED_POLICIES=['guided','faculty','formal-faculty','industry','venture','communication','new-field','job-search','independent','graduate','masters','low-contact'];
const CAREER_POLICIES=['venture-focused','communication-focused'];
const policies=workerData?.scenario==='career'||isMainThread&&process.argv[4]==='career'?CAREER_POLICIES:MIXED_POLICIES;
if(isMainThread){
 const total=Number(process.argv[2]??10000),output=process.argv[3];if(!Number.isSafeInteger(total)||total<1||!output)throw Error('Usage: node scripts/balance-review-audit.mjs count output.json');
 // Refuse to replace evidence from an earlier run, including a paired baseline.
 try{await fs.access(output);throw Error(`Audit output already exists: ${output}`);}catch(error){if(error.code!=='ENOENT')throw error;}
 const scenario=process.argv[4]??'mixed';if(!['mixed','career'].includes(scenario))throw Error('Scenario must be mixed or career');
 const started=Date.now(),jobs=Math.min(8,total),results=await Promise.all(Array.from({length:jobs},(_,start)=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{start,total,stride:jobs,scenario}});w.on('message',resolve);w.on('error',reject);})));const records=results.flatMap(r=>r.records).sort((a,b)=>a.run-b.run),errors=results.flatMap(r=>r.errors);
 if(records.length!==total||records.some((row,index)=>row.run!==index||!row.outcome))throw Error('Audit did not account for every run exactly once');
 const distribution=values=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return {n:v.length,mean:v.length?Number((v.reduce((a,b)=>a+b,0)/v.length).toFixed(3)):null,p50:v[Math.max(0,Math.ceil(v.length*.5)-1)]??null,p90:v[Math.max(0,Math.ceil(v.length*.9)-1)]??null,p95:v[Math.max(0,Math.ceil(v.length*.95)-1)]??null,max:v.at(-1)??null};};
 function summarize(rows){const endings={};for(const r of rows)endings[r.outcome]=(endings[r.outcome]??0)+1;const graduates=rows.filter(r=>r.month===96&&r.canDefend&&r.outcome!=='budget-blocked');return {runs:rows.length,outcomes:endings,qualFailedRuns:rows.filter(r=>r.qualFailed>0).length,doctoralGraduates:graduates.length,doctoralPapers:distribution(graduates.map(r=>r.papers)),finalResearch:distribution(graduates.map(r=>r.skills.research)),finalLearning:distribution(graduates.map(r=>r.skills.learning)),maxStress:distribution(rows.map(r=>r.maxStress)),healthWarningRuns:rows.filter(r=>r.healthWarnings).length,requestedRecoveryWeeks:rows.reduce((a,r)=>a+r.requestedRecovery,0),plannedRecoveryWeeks:rows.reduce((a,r)=>a+r.plannedRecovery,0),facultyFailureKeys:Object.fromEntries(['research','teaching','admin','mentoring'].map(k=>[k,rows.filter(r=>r.outcome==='gameover'&&r.lowestFacultyKey===k).length])),seedFunding:distribution(rows.map(r=>r.initialFunding)),monthlyCostPerMonth:distribution(rows.filter(r=>r.month).map(r=>r.monthlyCost/r.month)),grantAwards:distribution(rows.map(r=>r.grantAwards)),finalFunds:distribution(rows.map(r=>r.funds)),debt:distribution(rows.map(r=>r.debt))};}
 const group=key=>Object.fromEntries([...new Set(records.map(r=>r[key]))].map(value=>[value,summarize(records.filter(r=>r[key]===value))]));
 const sourceHashes={};for(const f of ['scripts/balance-review-audit.mjs','tests/play-support.mjs','dist/simulation-worker.js','dist/engine.js','dist/balance.js','dist/relationship.js','dist/funding.js','dist/grants.js','dist/events.js','dist/main-story.js','dist/monthly-choices.js','dist/workload.js','dist/impact.js','dist/disciplines.js','dist/academic-calendar.js','dist/travel.js','dist/venues.js','dist/research-topics.js','dist/names.js'])sourceHashes[f]=createHash('sha256').update(await fs.readFile(new URL('../'+f,import.meta.url))).digest('hex');
 const report={scenario,version:JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version,method:'Allowed-action twelve-policy audit through production simulation-worker. Same seeds and actions as ending-balance-audit. Focused career scenario allocates actual startup/video activities after graduate entry. No injected capabilities, funds, publications or awards. Policy mixture is not a player win rate or real career probability. Grant-enabled managed test policies are only a reproducible comparison.',seedFormula:'7919 * (run + 1)',limitations:'Institution and lab-mode summaries describe this mixture, not paired causal effects: some fields only support one lab mode. Career scenario uses distinct policies and cannot be added into mixed-scenario denominators. monthlyCost is summed planned estimates before retries and may include the final failed attempt; monthlyCostPerMonth is not actual spending. maxStress is sampled after each executed month, before pending event decisions.',policies,sourceHashes,summary:summarize(records),byPolicy:group('policy'),byLabMode:group('labMode'),byInstitution:group('institution'),byField:group('fieldId'),errors,seconds:(Date.now()-started)/1000,records};await fs.writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({summary:report.summary,byLabMode:report.byLabMode,byInstitution:report.byInstitution,errors,seconds:report.seconds}));
}else{
 let result;globalThis.self={postMessage:r=>{result=r;}};await import('../dist/simulation-worker.js');
 const execute=(type,state,more={})=>{result=null;self.onmessage({data:{id:1,type,state,...more}});if(result.error)throw Error(result.error);return result.state;};
 const stats={outcomes:{},errors:[],records:[]};
 for(let i=workerData.start;i<workerData.total;i+=workerData.stride){
  const policy=policies[i%policies.length],d=DISCIPLINES[Math.floor(i/policies.length)%DISCIPLINES.length],seed=7919*(i+1);
  const gender=Math.floor(i/policies.length)%2?'male':'female';let s=createState(generateKoreanName(seed,gender),seed,{gender,fieldId:d.id,labMode:d.labModes[Math.floor(i/73)%d.labModes.length],institution:['national','private','institute'][Math.floor(i/3)%3]});s.lab.creditEnabled=true;
  let finalOutcome=null,maxStress=s.hidden.stress,minStamina=abilityScore(s,'stamina'),requestedRecovery=0,plannedRecovery=0,monthCost=0;
  const outcome=id=>{finalOutcome=id;stats.outcomes[id]=(stats.outcomes[id]??0)+1;};
  try{
   for(let month=0;month<96&&!s.ending;month++){
    let plan=proposeSchedule(s),score=k=>abilityScore(s,k);const training=studentTrainingActive(s);
    const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
    if(['faculty','formal-faculty'].includes(policy)&&!s.project.submitted){s.publication.journal=s.career.topPapers<2?'leading':'standard';s.project.journal=s.publication.journal;}
    if(s.month>=24&&!training){
     plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'free':primary;
     plan[3]=['faculty','formal-faculty'].includes(policy)?(score('teaching')<65?'teach':score('language')<70?'language':primary):policy==='venture-focused'?'startup':policy==='communication-focused'?'video':policy==='industry'||policy==='venture'?'industry':policy==='communication'?(score('language')<90?'language':'presentation'):policy==='independent'?primary:'free';
     if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='free';}
     else if(s.month>=30&&s.month<=48&&s.month%3===0)plan[0]='coursework';
     else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
    }
    const minimal=degreeRequirements(s);
    if(s.month>=24&&!training&&['communication','new-field','job-search'].includes(policy)&&s.career.papers>=minimal.papers&&s.career.conferences>=minimal.conferences){
     plan=plan.map(()=>policy==='communication'?(score('language')<90?'language':'presentation'):policy==='new-field'&&score('industry')<35?'industry':'recovery');
     if([4,10].includes(calendarMonth(s.month)))plan[2]='conference';
    }
    let action=['faculty','formal-faculty'].includes(policy)&&s.career.papers&&s.career.recommendations<4?'recommend':policy==='low-contact'?'routine':s.month%3===0?'conversation':'routine';
    if(training){plan=proposeSchedule(s);action='routine';}
    const request=studentRestRequest(s);if(request){requestedRecovery+=request.weeks;plannedRecovery+=Math.min(request.weeks,plan.filter(id=>id==='recovery'||id==='free'||id==='rest').length);}monthCost+=monthlyBudgetCost(s,managedOptions(s,action).budget,plan);
    const options={...managedOptions(s,action),feedback:policy==='formal-faculty'&&s.month>=88?'harsh':policy==='low-contact'?'listen':s.lastReport?.completion>=.7?'praise':'critique'};
    try{s=execute('month',s,{plan,options});}catch(error){if(!error.message.includes('Budget exceeds'))throw error;options.budget={...options.budget,environment:0,performance:0};s=execute('month',s,{plan,options});}
    maxStress=Math.max(maxStress,s.hidden.stress);minStamina=Math.min(minStamina,abilityScore(s,'stamina'));
    for(let guard=0;s.pending&&!s.ending;guard++){
     if(guard>=25)throw Error('decision queue exceeded');const p=s.pending;
     const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',event:0,route:policy==='graduate'?'graduate':policy==='masters'?'masters':'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:policy==='masters'?'graduate':'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
     const choice=p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):p.kind==='event'?affordableEventChoice(s,p.id):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
     s=execute('decision',s,{choice});
     if(p.kind==='rest-request')s=execute('month',s,{plan:s.plan,options});
    }
   }
   outcome(s.ending??'incomplete');
  }catch(e){if(e.message.includes('Budget exceeds'))outcome('budget-blocked');else{outcome('error');stats.errors.push({run:i,policy,month:s.month,message:e.message});}}
  const warnings=s.history.filter(h=>h.kind==='warning'),qual=s.history.filter(h=>h.kind==='qual');
  const lowFaculty=Object.entries(s.professor).sort((a,b)=>a[1]-b[1])[0];
  stats.records.push({run:i,policy,seed,fieldId:d.id,labMode:s.professorProfile.labMode,institution:s.professorProfile.institution,outcome:finalOutcome,month:s.month,qual:s.career.qual,qualAttempts:s.career.qualAttempts,qualFailed:qual.filter(h=>!h.passed).length,papers:s.career.papers,submissions:s.career.submissions,topPapers:s.career.topPapers,canDefend:canDefend(s),skills:Object.fromEntries(['learning','research','language','social','autonomy','teaching','industry','enterprise','manners','rapport','stamina','resilience'].map(k=>[k,abilityScore(s,k)])),stress:s.hidden.stress,maxStress,minStamina,requestedRecovery,plannedRecovery,healthWarnings:warnings.filter(h=>h.reason==='health').length,relationshipWarnings:warnings.filter(h=>h.reason==='relationship').length,lowestFacultyKey:lowFaculty[0],lowestFaculty:lowFaculty[1],faculty:{...s.professor},funds:s.lab.funds,pool:s.lab.pool,debt:s.lab.debt,initialFunding:s.lab.initialFunding,monthlyCost:monthCost,grantAwards:s.history.filter(h=>['portfolio-selection','grant-selection'].includes(h.kind)&&h.awarded).length,grantApplications:s.history.filter(h=>['portfolio-selection','grant-selection'].includes(h.kind)).length});
 }
 parentPort.postMessage(stats);
}
