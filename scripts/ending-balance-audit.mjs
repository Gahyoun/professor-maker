// Reproducible policy audit, not an estimate of human players or real career odds.
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs/promises';
import {createState,proposeSchedule,calendarMonth,abilityScore,projectThresholds,projectWork,studentTrainingActive,TRUE_REQUIREMENTS,recommendationCandidate,degreeRequirements} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {managedOptions} from '../tests/play-support.mjs';
const policies=['guided','faculty','formal-faculty','industry','venture','communication','new-field','job-search','independent','graduate','masters','low-contact'];
if(isMainThread){
 const total=Number(process.argv[2]??10000),jobs=Math.min(8,total),started=Date.now();
 const results=await Promise.all(Array.from({length:jobs},(_,i)=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{start:i,total,stride:jobs}});w.on('message',resolve);w.on('error',reject);})));
 const report={runs:total,seedFormula:'7919 * (run + 1)',endings:{},byPolicy:{},unmetFacultyCriteria:{},errors:[],seconds:(Date.now()-started)/1000};
 for(const r of results){for(const [k,n]of Object.entries(r.endings))report.endings[k]=(report.endings[k]??0)+n;for(const [k,n]of Object.entries(r.unmet))report.unmetFacultyCriteria[k]=(report.unmetFacultyCriteria[k]??0)+n;for(const [p,v]of Object.entries(r.byPolicy)){const target=report.byPolicy[p]??={runs:0,endings:{}};target.runs+=v.runs;for(const [k,n]of Object.entries(v.endings))target.endings[k]=(target.endings[k]??0)+n;}report.errors.push(...r.errors);}
 await fs.writeFile(new URL('../docs/ending-balance-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}else{
 let result;globalThis.self={postMessage:r=>{result=r;}};await import('../dist/simulation-worker.js');
 const execute=(type,state,more={})=>{result=null;self.onmessage({data:{id:1,type,state,...more}});if(result.error)throw Error(result.error);return result.state;};
 const stats={endings:{},byPolicy:{},unmet:{},errors:[]};
 for(let i=workerData.start;i<workerData.total;i+=workerData.stride){
  const policy=policies[i%policies.length],d=DISCIPLINES[Math.floor(i/policies.length)%DISCIPLINES.length],seed=7919*(i+1);
  let s=createState('감사학생',seed,{gender:i%2?'male':'female',fieldId:d.id,labMode:d.labModes[Math.floor(i/73)%d.labModes.length],institution:['national','private','institute'][Math.floor(i/3)%3]});s.lab.creditEnabled=true;
  const group=stats.byPolicy[policy]??={runs:0,endings:{}};group.runs++;
  try{
   for(let month=0;month<96&&!s.ending;month++){
    let plan=proposeSchedule(s),score=k=>abilityScore(s,k);const training=studentTrainingActive(s);
    const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
    if(['faculty','formal-faculty'].includes(policy)&&!s.project.submitted){s.publication.journal=s.career.topPapers<2?'leading':'standard';s.project.journal=s.publication.journal;}
    if(s.month>=24&&!training){
     plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'free':primary;
     plan[3]=['faculty','formal-faculty'].includes(policy)?(score('teaching')<65?'teach':score('language')<70?'language':primary):policy==='industry'||policy==='venture'?'industry':policy==='communication'?(score('language')<90?'language':'presentation'):policy==='independent'?primary:'free';
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
    const options={...managedOptions(s,action),feedback:policy==='formal-faculty'&&s.month>=88?'harsh':policy==='low-contact'?'listen':s.lastReport?.completion>=.7?'praise':'critique'};
    try{s=execute('month',s,{plan,options});}catch(error){if(!error.message.includes('Budget exceeds'))throw error;options.budget={...options.budget,environment:0,performance:0};s=execute('month',s,{plan,options});}
    for(let guard=0;s.pending&&!s.ending;guard++){
     if(guard>=25)throw Error('decision queue exceeded');const p=s.pending;
     const choices={'workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',event:0,route:policy==='graduate'?'graduate':policy==='masters'?'masters':'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:policy==='masters'?'graduate':'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
     const choice=p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):p.kind==='event'?(policy==='venture'&&p.id==='startup'?0:0):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
     s=execute('decision',s,{choice});
    }
   }
   const ending=s.ending??'incomplete';stats.endings[ending]=(stats.endings[ending]??0)+1;group.endings[ending]=(group.endings[ending]??0)+1;
   if(s.month===96&&s.ending!=='true'){
    for(const [k,target]of Object.entries(TRUE_REQUIREMENTS)){const value=k==='faculty'?Math.min(...Object.values(s.professor)):k in s.hidden?abilityScore(s,k):s.career[k];if(value<target)stats.unmet[k]=(stats.unmet[k]??0)+1;}
    for(const [k,ok]of [['leadingPaper',s.career.topPapers>=1],['award',s.career.awards>=1],['hIndex',s.impact.hIndex>=4]])if(!ok)stats.unmet[k]=(stats.unmet[k]??0)+1;
   }
  }catch(e){if(e.message.includes('Budget exceeds')){const ending='budget-blocked';stats.endings[ending]=(stats.endings[ending]??0)+1;group.endings[ending]=(group.endings[ending]??0)+1;}else stats.errors.push({run:i,policy,month:s.month,message:e.message});}
 }
 parentPort.postMessage(stats);
}
