// Paired allowed-action policy audit. Outcomes are not estimates of player win rates.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,abilityScore} from '../dist/engine.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
let response;
globalThis.self={postMessage:r=>{response=r;}};
await import('../dist/simulation-worker.js');
function execute(type,state,more={}){
 response=null;self.onmessage({data:{id:1,type,state,...more}});
 if(!response||response.error)throw Error(response?.error??'Worker did not respond');
 return response.state;
}
const runs=Number(process.argv[2]??40),output=process.argv[3];
if(!Number.isInteger(runs)||runs<1||!output)throw Error('Usage: node scripts/lab-closure-audit.mjs seeds output.json');
const records=[],fieldAudit=process.argv[4]==='fields';
const configurations=fieldAudit?[['048','dry'],['089','dry'],['077','wet'],['072','wet'],['093','wet'],['112','wet']]:[['072','dry'],['056','wet']];
for(let n=0;n<runs;n++)for(const [fieldId,labMode] of configurations)for(const difficulty of ['realistic','beginner']){
 const seed=7919*(n+1),institution=['national','private','institute'][n%3];
 let s=createState('검증학생',seed,{gender:n%2?'female':'male',fieldId,labMode,institution,difficulty});
 let suspended=0,warningCount=0,outcome=null,error=null;
 try{
  while(s.month<96&&!s.ending){
   const plan=proposeSchedule(s),options=managedOptions(s,s.month%3===0?'conversation':'routine');
   s=execute('month',s,{plan,options});
   for(let guard=0;s.pending&&!s.ending;guard++){
    if(guard>=30)throw Error('Decision queue exceeded');
    const p=s.pending;
    if(p.kind==='lab-warning')warningCount++;
    const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
    const choice=p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):p.kind==='event'?affordableEventChoice(s,p.id):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
    if(choice===undefined)throw Error(`Missing decision policy: ${p.kind}/${p.step}`);
    s=execute('decision',s,{choice});
     if(p.kind==='rest-request')s=execute('month',s,{plan:s.plan,options});
   }
  }
 }catch(e){error=e.message;outcome='error';}
 const weeks=s.history.filter(h=>h.kind==='month').flatMap(h=>h.results??[]);
 const rest={requests:s.history.filter(h=>h.kind==='rest-request-response').length,agreedWeeks:weeks.filter(w=>w.assigned==='recovery').length,criticalWeeks:weeks.filter(w=>w.criticalRest).length,autonomousWeeks:weeks.filter(w=>w.proposed==='free').length,autonomousRest:weeks.filter(w=>w.proposed==='free'&&w.autonomous==='rest').length};
 const finalScores=Object.fromEntries(['learning','research','language','stamina','resilience','stress'].map(k=>[k,abilityScore(s,k)]));
 records.push({seed,fieldId,labMode,institution,difficulty,month:s.month,outcome:outcome??s.ending??'incomplete',reason:s.endingReason??null,closure:s.labClosure??null,suspended,warningCount,initialFunding:s.lab.initialFunding,supportUsed:s.labRisk?.supportUsed??0,finalFunds:s.lab.funds,finalPool:s.lab.pool,finalDebt:s.lab.debt??0,borrowed:s.history.filter(h=>h.kind==='operating-advance').reduce((a,h)=>a+h.amount,0),interest:s.history.filter(h=>h.kind==='operating-interest').reduce((a,h)=>a+h.amount,0),papers:s.career.papers,rest,finalScores,error});
}
const summarize=rows=>({runs:rows.length,outcomes:Object.fromEntries([...new Set(rows.map(r=>r.outcome))].map(k=>[k,rows.filter(r=>r.outcome===k).length])),closureReasons:Object.fromEntries(['faculty','funding'].map(k=>[k,rows.filter(r=>r.closure?.reason===k).length])),warnings:rows.reduce((a,r)=>a+r.warningCount,0),suspendedMonths:rows.reduce((a,r)=>a+r.suspended,0),supportTotal:rows.reduce((a,r)=>a+r.supportUsed,0),maxSupport:Math.max(...rows.map(r=>r.supportUsed)),meanMonth:rows.reduce((a,r)=>a+r.month,0)/rows.length,meanDebt:rows.reduce((a,r)=>a+r.finalDebt,0)/rows.length,totalBorrowed:rows.reduce((a,r)=>a+r.borrowed,0),totalInterest:rows.reduce((a,r)=>a+r.interest,0),meanPapers:rows.reduce((a,r)=>a+r.papers,0)/rows.length,rest:Object.fromEntries(['requests','agreedWeeks','criticalWeeks','autonomousWeeks','autonomousRest'].map(k=>[k,rows.reduce((a,r)=>a+r.rest[k],0)])),meanFinalScores:Object.fromEntries(['learning','research','language','stamina','resilience','stress'].map(k=>[k,rows.reduce((a,r)=>a+r.finalScores[k],0)/rows.length]))});
const sourceHashes={};
for(const file of ['dist/engine.js','dist/funding.js','dist/grants.js','dist/research-finance.js','dist/travel.js','dist/balance.js','dist/lab-risk.js','dist/advising-plan.js','dist/simulation-worker.js','tests/play-support.mjs','scripts/lab-closure-audit.mjs'])sourceHashes[file]=createHash('sha256').update(await fs.readFile(new URL('../'+file,import.meta.url))).digest('hex');
const report={version:JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url))).version,method:'Same seeds, institutions, lab modes and managed player policy paired across difficulty. Production simulation-worker only; no injected abilities, money or publications. Policy outcomes are not human win rates. Every valid monthly plan advances using automatic borrowing for cash shortfalls; no manual budget rescue or injected funds. Includes three institution types.',fieldAudit,sourceHashes,summary:summarize(records),byDifficulty:Object.fromEntries(['realistic','beginner'].map(d=>[d,summarize(records.filter(r=>r.difficulty===d))])),errors:records.filter(r=>r.error),records};
await fs.writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({summary:report.summary,byDifficulty:report.byDifficulty,errors:report.errors}));
if(report.errors.length)process.exitCode=1;
