import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,simulateMonth,decide,proposeSchedule,abilityScore,calendarMonth,projectThresholds,projectWork,validateSave} from '../dist/engine.js';
import {managedOptions} from './play-support.mjs';

test('a demanding faculty ending remains reachable through 96 months without injected funds or abilities',()=>{
 const choices={'workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',event:0,route:'integrated','presentation-recovery':'rehearse','external-admission':'remain',masters:'continue',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
 let s=createState('학생',16,{age:38,gender:'female'});
 for(let month=0;month<96&&!s.ending;month++){
  // These are player-selectable publication goals and schedules, not stat overrides.
  if(!s.project.submitted){s.publication.journal=s.career.topPapers<2?'leading':'standard';s.project.journal=s.publication.journal;}
  const plan=proposeSchedule(s),score=k=>abilityScore(s,k);
  if(s.month>=24){
   const primary=['study','experiment','experiment','analysis','analysis','analysis'][s.project.phase];
   plan[0]=plan[1]=primary;plan[2]=score('stamina')<50||s.hidden.stress>55?'free':primary;
   plan[3]=score('teaching')<65?'teach':score('language')<70?'language':primary;
   if([4,10].includes(calendarMonth(s.month))){plan[0]=plan[1]='presentation';plan[2]='conference';plan[3]='free';}
   else if(s.month>=30&&s.month<=48&&s.month%3===0){plan[0]='coursework';}
   else if(!s.project.conference&&projectWork(s)>=projectThresholds(s).conference){plan[0]=plan[1]='presentation';plan[2]='conference';}
  }
  const action=s.career.papers&&s.career.recommendations<4?'recommend':s.month%3===0?'conversation':'routine';
  s=simulateMonth(s,plan,{...managedOptions(s,action),feedback:s.lastReport?.completion>=.7?'praise':'critique'});
  for(let guard=0;s.pending&&!s.ending;guard++){
   assert.ok(guard<20);const p=s.pending;
   s=decide(s,p.kind==='conference-plan'?(p.scope==='domestic'?'student':'none'):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step]);
  }
 }
 assert.equal(s.month,96);assert.equal(s.ending,'true');assert.ok(s.career.topPapers>=1);assert.ok(s.career.awards>=1);assert.ok(s.impact.hIndex>=4);assert.ok(validateSave(s));
});
