import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,decide,proposeSchedule,abilityScore,calendarMonth,projectThresholds,projectWork,validateSave,qualificationStudy,feedbackEffect} from '../dist/engine.js';
import {managedOptions,affordableEventChoice,simulateWithRestConsent} from './play-support.mjs';

test('a demanding faculty ending remains reachable through 96 months without injected funds or abilities',()=>{
 const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'daily',story:'encourage','academic-exam':'support',event:0,route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
 // A reproducible seed uses planned recovery as well as fewer automatic requests.
 let s=createState('학생',2,{age:38,gender:'female'});
 for(let month=0;month<96&&!s.ending;month++){
  // These are player-selectable publication goals and schedules, not stat overrides.
  if(!s.project.submitted){s.publication.journal=s.career.topPapers<1?'leading':'standard';s.project.journal=s.publication.journal;}
  const plan=proposeSchedule(s),score=k=>abilityScore(s,k);
  if(s.month>=24){
   const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
   plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'recovery':primary;
   plan[3]=score('teaching')<65?'teach':score('language')<70?'language':primary;
   if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='recovery';}
   else if(s.month>=30&&s.month<=48&&s.month%3===0){plan[0]='coursework';}
   else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
  }
  // A failed qual prompts actual remedial study before the second attempt.
  if(s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'&&qualificationStudy(s,(s.history.find(h=>h.kind==='qual'&&!h.passed)?.month??s.month)+1)<2)){plan[0]=plan[1]='coursework';}
  const action=s.career.papers&&s.career.recommendations<4?'recommend':'conversation';
  // Respond to the research evidence, rather than treating completion alone as quality.
  const aligned=feedbackEffect(s,'praise').efficiency>1?'praise':feedbackEffect(s,'critique').efficiency>1?'critique':'listen';
  const feedback=s.advising?.lastFeedback===aligned&&s.advising.streak>=3?'listen':aligned;
  s=simulateWithRestConsent(s,plan,{...managedOptions(s,action),feedback},'allow');
  for(let guard=0;s.pending&&!s.ending;guard++){
   assert.ok(guard<20);const p=s.pending;
   s=decide(s,p.kind==='event'?affordableEventChoice(s,p.id):p.kind==='conference-plan'?(p.scope==='domestic'?'together':'none'):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step]);
  }
 }
 assert.equal(s.month,96);assert.equal(s.ending,'true');assert.ok(s.career.topPapers>=1);assert.ok(s.impact.hIndex>=2);assert.ok(validateSave(s));
});
