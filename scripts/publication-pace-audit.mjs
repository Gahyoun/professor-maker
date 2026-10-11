// Paired, seeded player policies; these outcomes are not real publication rates.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,abilityScore,calendarMonth,projectWork,projectThresholds,qualificationStudy,feedbackEffect,canDefend} from '../dist/engine.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
let response;
globalThis.self={postMessage:value=>{response=value;}};
await import('../dist/simulation-worker.js');
const execute=(type,state,more={})=>{response=null;self.onmessage({data:{id:1,type,state,...more}});if(!response||response.error)throw Error(response?.error??'No worker response');return response.state;};
const seeds=Number(process.argv[2]??30),output=process.argv[3];
if(!Number.isInteger(seeds)||seeds<1||!output)throw Error('Usage: node scripts/publication-pace-audit.mjs seeds output.json');
const configurations=[['048','dry'],['049','dry'],['050','dry'],['056','wet'],['073','wet'],['090','dry']],records=[];
const thesis={draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'};
const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
function strategy(s,policy){
 const plan=proposeSchedule(s);
 if(policy==='research'&&s.month>=24){
  const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
  plan[0]=plan[1]=primary;plan[2]=abilityScore(s,'stamina')<50||s.hidden.stress>55?'recovery':primary;
  plan[3]=abilityScore(s,'teaching')<65?'teach':abilityScore(s,'language')<70?'language':primary;
  if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='recovery';}
  else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
 }
 if(s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2))plan[0]=plan[1]='coursework';
 return plan;
}
for(let n=0;n<seeds;n++)for(const [fieldId,labMode] of configurations)for(const policy of ['advised','research']){
 const seed=7919*(n+1),institution='national',difficulty='realistic';
 let s=createState('검증학생',seed,{age:38,gender:'female',fieldId,labMode,institution,difficulty}),error=null;
 try{
  while(s.month<96&&!s.ending){
   if(policy==='research'&&!s.project.submitted){s.publication.journal=s.career.topPapers<1?'leading':'standard';s.project.journal=s.publication.journal;}
   const plan=strategy(s,policy),aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen';
   const action=policy==='research'&&s.career.papers&&s.career.recommendations<4?'recommend':s.month%3===0?'conversation':'routine';
   const options={...managedOptions(s,action),feedback:policy==='research'?(s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned):'listen'};
   s=execute('month',s,{plan,options});
   for(let guard=0;s.pending&&!s.ending;guard++){
    if(guard>=30)throw Error('Decision queue exceeded');const p=s.pending;
    const choice=p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):p.kind==='event'?affordableEventChoice(s,p.id):choices[p.kind]??thesis[p.step];
    if(choice===undefined)throw Error(`Unspecified policy ${p.kind}/${p.step}`);
    s=execute('decision',s,{choice});if(p.kind==='rest-request')s=execute('month',s,{plan:s.plan,options});
   }
  }
 }catch(e){error=e.message;}
 const published=s.history.filter(h=>h.kind==='paper'),submitted=s.history.filter(h=>h.kind==='submission');
 records.push({seed,fieldId,labMode,policy,institution,difficulty,month:s.month,ending:s.ending??null,reason:s.endingReason??null,error,papers:s.career.papers,submissions:s.career.submissions,conferences:s.career.conferences,topPapers:s.career.topPapers,recommendations:s.career.recommendations,firstPaperMonth:published[0]?.month??null,reviewDelays:published.map(p=>p.month-(submitted.find(q=>q.projectId===p.projectId)?.month??p.month)),revisions:s.history.filter(h=>h.kind==='revision').length,papersByYear:Array.from({length:8},(_,i)=>published.filter(p=>p.month>i*12&&p.month<=(i+1)*12).length),canDefend:canDefend(s),qual:s.career.qual,projectId:s.project.id,projectPhase:s.project.phase,projectWork:projectWork(s),funds:s.lab.funds,debt:s.lab.debt,equipment:s.lab.equipment,finalScores:Object.fromEntries(['learning','research','language','stamina','resilience','stress'].map(key=>[key,abilityScore(s,key)]))});
}
const summarize=rows=>({runs:rows.length,errors:rows.filter(r=>r.error).length,meanPapers:rows.reduce((n,r)=>n+r.papers,0)/rows.length,minPapers:Math.min(...rows.map(r=>r.papers)),maxPapers:Math.max(...rows.map(r=>r.papers)),distribution:Object.fromEntries([...new Set(rows.map(r=>r.papers))].sort((a,b)=>a-b).map(n=>[n,rows.filter(r=>r.papers===n).length])),finished96:rows.filter(r=>r.month===96).length,defendable:rows.filter(r=>r.canDefend).length,true:rows.filter(r=>r.ending==='true').length,outcomes:Object.fromEntries([...new Set(rows.map(r=>r.ending??'incomplete'))].map(k=>[k,rows.filter(r=>(r.ending??'incomplete')===k).length]))});
const hashes={};for(const file of ['engine.js','balance.js','venues.js','disciplines.js','publication-pace.js','funding.js','research-finance.js'])try{hashes[file]=createHash('sha256').update(await fs.readFile(new URL('../dist/'+file,import.meta.url))).digest('hex');}catch{}
const result={seeds,policies:['advised','research'],configurations,hashes,summary:summarize(records),groups:configurations.flatMap(([fieldId])=>['advised','research'].map(policy=>({fieldId,policy,...summarize(records.filter(r=>r.fieldId===fieldId&&r.policy===policy))}))),records};
await fs.writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({summary:result.summary,groups:result.groups},null,2));if(result.summary.errors)process.exitCode=1;
