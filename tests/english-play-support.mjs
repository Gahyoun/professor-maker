import{createState,simulateMonth,decide,proposeSchedule,validateSave,abilityScore,PROJECT_PHASES,EVENTS,qualificationStudy,feedbackEffect,projectWork,projectThresholds}from'../dist/engine.js';
import{managedOptions,affordableEventChoice}from'./play-support.mjs';
import{campusMonth}from'../dist/campus-calendar.js';
import{buildEndingCV}from'../dist/cv.js';
import{endingEvidence}from'../dist/ending-evidence.js';
import{endingStatistics}from'../dist/statistics.js';
import{prepareLetterPassages}from'../dist/letter-archive.js';
// All fixtures are produced by ordinary engine decisions: no injected funds or traits.
export function generateEnglishDeepFixture(){
const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
const thesis={draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'};
let best=null,summary=[];
for(const seed of [7919,15838,23757,31676,39595,47514,55433,63352,71271,79190,87109,95028]){
 let s=createState('Maya Morgan',seed,{locale:'en',age:38,gender:'female',fieldId:'050',labMode:'dry',difficulty:'beginner'});s.professorName='Prof. Taylor Reed';let journalState=null,storyState=null;
 while(s.month<96&&!s.ending){
  if(!s.project.submitted){s.publication.journal=s.career.topPapers<1?'leading':'standard';s.project.journal=s.publication.journal;}
  const plan=proposeSchedule(s);
  if(s.month>=24){const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];plan[0]=plan[1]=primary;plan[2]=abilityScore(s,'stamina')<50||s.hidden.stress>55?'recovery':primary;plan[3]=abilityScore(s,'teaching')<65?'teach':abilityScore(s,'language')<70?'language':primary;
   if([4,10].includes(campusMonth(s.month,s))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='recovery';}else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
  }
  if(s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2))plan[0]=plan[1]='coursework';
  const aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen',action=s.career.papers&&s.career.recommendations<4?'recommend':s.month%3===0?'conversation':'routine';
  const options={...managedOptions(s,action),feedback:s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned};s=simulateMonth(s,plan,options);
  for(let guard=0;s.pending&&!s.ending;guard++){
   if(guard>=40)throw new Error('Too many decisions');const p=s.pending;if(p.kind==='story'&&!storyState)storyState=structuredClone(s);
   const choice=p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):p.kind==='event'?affordableEventChoice(s,p.id):choices[p.kind]??thesis[p.step];if(choice===undefined)throw new Error(`Unknown ${p.kind}`);
   s=decide(s,choice);if(p.kind==='rest-request')s=simulateMonth(s,s.plan,options);
  }
  if(s.month>=70&&!s.ending&&!s.pending)journalState=structuredClone(s);
 }
 if(!validateSave(s))throw Error('Invalid result');summary.push({seed,month:s.month,ending:s.ending,papers:s.career.papers,history:s.history.length});
 if(s.ending!=='gameover'&&(!best||(s.ending==='true'?10000:0)+s.history.length>(best.state.ending==='true'?10000:0)+best.state.history.length)){best={state:s,storyState,journalState};}
}
if(!best)throw Error('No completed English run');const s=best.state,id=`${s.creationSeed??s.seed}-${s.month}-${s.ending}`;
const record=prepareLetterPassages({id,ending:s.ending,fieldId:s.professorProfile.fieldId,labMode:s.professorProfile.labMode,name:s.name,date:'2026-10-12',month:s.month,relationship:abilityScore(s,'rapport')>=70?'close':abilityScore(s,'rapport')>=40?'reserved':'distant',career:{...s.career},endingReason:s.endingReason,statistics:endingStatistics(s),evidence:endingEvidence(s),memories:s.history.filter(h=>h.kind==='event'&&EVENTS.some(e=>e.id===h.id&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<e.options.length)).slice(-16).map(h=>({kind:'event',id:h.id,choice:h.choice,month:h.month})),cv:buildEndingCV(s).model});
return {...best,record,summary};
}
