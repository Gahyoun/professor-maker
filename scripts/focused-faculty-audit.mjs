// A second, explicitly focused strategy audit; it does not change the main 12-policy mix.
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,abilityScore,calendarMonth,projectThresholds,projectWork,qualificationStudy,studentTrainingActive,canDefend,TRUE_REQUIREMENTS,feedbackEffect} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {generateKoreanName} from '../dist/names.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
if(isMainThread){
 const runs=Number(process.argv[2]??1000);if(!Number.isSafeInteger(runs)||runs<1)throw Error('Invalid runs');
 const sourceHashes={};for(const file of ['scripts/focused-faculty-audit.mjs','tests/play-support.mjs','dist/simulation-worker.js','dist/engine.js','dist/balance.js','dist/funding.js','dist/grants.js','dist/relationship.js','dist/disciplines.js','dist/events.js','dist/monthly-choices.js','dist/academic-calendar.js','dist/main-story.js','dist/travel.js','dist/workload.js','dist/impact.js','dist/venues.js','dist/research-topics.js','dist/names.js'])sourceHashes[file]=createHash('sha256').update(await fs.readFile(new URL('../'+file,import.meta.url))).digest('hex');
 const started=Date.now(),parts=await Promise.all(Array.from({length:2},(_,start)=>new Promise((resolve,reject)=>{const w=new Worker(new URL(import.meta.url),{workerData:{start,runs,stride:2}});w.on('message',resolve);w.on('error',reject);})));
 const report={engineVersion:JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version,runs,seedFormula:'16 + 7919 * run',genders:'alternating female / male',method:'Actual simulation-worker month and decision handlers; allowed actions only, no injected ability, funds, papers or awards. Frequent conversations, actual remedial qual coursework, evidence-matched varied feedback, and targeted teaching/language preparation; distinct from the main 12-policy mixture.',sourceHashes,outcomes:{},unmet:Object.fromEntries(Object.keys(TRUE_REQUIREMENTS).map(k=>[k,0])),evaluated:0,errors:[],seconds:(Date.now()-started)/1000};
 for(const part of parts){for(const [id,n]of Object.entries(part.outcomes))report.outcomes[id]=(report.outcomes[id]??0)+n;for(const [key,n]of Object.entries(part.unmet))report.unmet[key]+=n;report.evaluated+=part.evaluated;report.errors.push(...part.errors);}
 report.truePercent=Number(((report.outcomes.true??0)*100/runs).toFixed(4));report.accountedRuns=Object.values(report.outcomes).reduce((a,b)=>a+b,0);if(report.accountedRuns!==runs)throw Error('Unaccounted runs');
 const sample=parts.find(x=>x.sample)?.sample;if(sample)await fs.writeFile(new URL('../docs/focused-faculty-sample.json',import.meta.url),JSON.stringify({engineVersion:report.engineVersion,sourceHashes,method:report.method,sample},null,2)+'\n');
 await fs.writeFile(new URL('../docs/focused-faculty-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 await fs.writeFile(new URL('../docs/focused-faculty-audit.md',import.meta.url),`# 집중 임용 준비 전략 감사 · v${report.engineVersion}\n\n실제 simulation-worker로 ${runs.toLocaleString('en-US')}회 실행했습니다. 시드는 \`16 + 7919 × 회차\`이며 성별·73개 전공·wet/dry·학교 유형을 순환합니다. 별도 집중 전략으로 매달 가능한 면담을 하고, 퀄 불합격 뒤에는 실제 전공 공부를 배정하며 교육·어학을 준비하고 연구 증거에 맞춰 피드백을 선택합니다. 같은 피드백을 세 번 반복한 뒤에는 쉬어 갑니다. 능력·연구비·논문·수상을 주입하지 않습니다. 메인 12개 전략의 혼합 비율과 분리해서 봐야 합니다.\n\n트루 **${report.outcomes.true??0} / ${runs} (${report.truePercent}%)**. 실행 예외 ${report.errors.length}회. 이 비율은 실제 사용자 승률이나 2–3회 재도전의 성공 보장이 아닙니다.\n\n| 결과 | 회차 |\n| --- | ---: |\n${Object.entries(report.outcomes).sort((a,b)=>b[1]-a[1]).map(([id,n])=>`| ${id} | ${n} |`).join('\n')}\n\n[상세 원자료](focused-faculty-audit.json) · [시드 16 실제 종료 상태](focused-faculty-sample.json)\n`);
 console.log(JSON.stringify({runs,outcomes:report.outcomes,truePercent:report.truePercent,errors:report.errors,seconds:report.seconds}));
}else{
 let reply;globalThis.self={postMessage:r=>{reply=r;}};await import('../dist/simulation-worker.js');
 const run=(type,state,more={})=>{reply=null;self.onmessage({data:{id:1,type,state,...more}});if(reply.error)throw Error(reply.error);return reply.state;};
 const result={outcomes:{},unmet:Object.fromEntries(Object.keys(TRUE_REQUIREMENTS).map(k=>[k,0])),evaluated:0,errors:[],sample:null};
 for(let i=workerData.start;i<workerData.runs;i+=workerData.stride){
  const seed=16+7919*i,d=i===0?DISCIPLINES.find(d=>d.id==='050'):DISCIPLINES[i%DISCIPLINES.length],gender=i%2?'male':'female';
  let s=createState(generateKoreanName(seed,gender),seed,{age:38,gender,fieldId:d.id,labMode:i===0?'dry':d.labModes[Math.floor(i/73)%d.labModes.length],institution:['national','private','institute'][Math.floor(i/73)%3]});s.lab.creditEnabled=true;
  let outcome;
  try{
   for(let month=0;month<96&&!s.ending;month++){
    if(!s.project.submitted){s.publication.journal=s.career.topPapers<2?'leading':'standard';s.project.journal=s.publication.journal;}
    const plan=proposeSchedule(s),score=k=>abilityScore(s,k),training=studentTrainingActive(s);
    if(s.month>=24&&!training){
     const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
     plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'free':primary;
     plan[3]=score('teaching')<65?'teach':score('language')<70?'language':primary;
     if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='free';}
     else if(s.month>=30&&s.month<=48&&s.month%3===0)plan[0]='coursework';
     else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
    }
    if(!training&&s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2))plan[0]=plan[1]='coursework';
    const action=training?'routine':s.career.papers&&s.career.recommendations<4?'recommend':'conversation';
    const aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen';
    const feedback=s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned;
    const options={...managedOptions(s,action),feedback};
    try{s=run('month',s,{plan,options});}catch(e){if(!e.message.includes('Budget exceeds'))throw e;options.budget={...options.budget,environment:0,performance:0};s=run('month',s,{plan,options});}
    for(let guard=0;s.pending&&!s.ending;guard++){
     if(guard>=20)throw Error('Unterminated decision queue');const p=s.pending;
     const choice=p.kind==='event'?affordableEventChoice(s,p.id):p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
     s=run('decision',s,{choice});
     if(p.kind==='rest-request')s=run('month',s,{plan:s.plan,options});
    }
   }
   outcome=s.ending??'incomplete';
  }catch(e){outcome=e.message.includes('Budget exceeds')?'budget-blocked':'error';if(outcome==='error')result.errors.push({run:i,seed,month:s.month,message:e.message});}
  result.outcomes[outcome]=(result.outcomes[outcome]??0)+1;
  if(s.month===96){result.evaluated++;for(const [key,value]of Object.entries(TRUE_REQUIREMENTS)){const actual=key==='faculty'?Math.min(...Object.values(s.professor)):key in s.hidden?abilityScore(s,key):s.career[key];if(actual<value)result.unmet[key]++;}}
  if(i===0)result.sample={run:i,seed,endingId:s.ending,field:{id:d.id,label:d.label},labMode:s.professorProfile.labMode,canDefend:canDefend(s),state:s};
 }
 parentPort.postMessage(result);
}
