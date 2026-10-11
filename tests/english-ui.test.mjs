import test from 'node:test';
import assert from 'node:assert/strict';
import {translateUIEnglish} from '../dist/ui-english.js';
import {renderOnboardingFlow,renderAdmissionInterview,renderUpdateNotice} from '../dist/onboarding-ui.js';
import {screenGuideSteps,SCREEN_GUIDE_STEPS} from '../dist/tutorial.js';
import {admissionCandidates} from '../dist/admission.js';
const plain=html=>html.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ');
test('U.S. funding guidance explains progression, restricted stipends, calendar and costs',()=>{
 const body=plain(renderOnboardingFlow({locale:'en'}));assert.doesNotMatch(body,/[가-힣]/);assert.match(body,/September/);assert.match(body,/departmental advance/);assert.match(body,/restricted to student pay/);assert.match(body,/March or September/);assert.match(body,/illustrative/);
 const steps=screenGuideSteps('en');assert.equal(steps.length,SCREEN_GUIDE_STEPS.length);assert.match(steps.find(x=>x.id==='budget').body,/September/);assert.match(steps.find(x=>x.id==='advance').body,/\$25,000/);assert.doesNotMatch(steps.map(x=>x.title+x.body).join(''),/[가-힣]/);assert.equal(screenGuideSteps('ko'),SCREEN_GUIDE_STEPS);
});
test('English intake keeps three real native candidate values and U.S. GPA labels',()=>{
 const profile={gender:'female',age:38,fieldId:'050',labMode:'dry',institution:'national',difficulty:'beginner'},candidates=admissionCandidates(54321,{locale:'en',professorGender:'female',professorProfile:profile});
 const html=renderAdmissionInterview({candidates,profile,professorName:'Prof. Morgan',selected:1,locale:'en'});assert.equal((html.match(/name="candidateIndex"/g)||[]).length,3);assert.match(html,/value="1" checked/);assert.match(html,/GPA .* \/ 4\.0/);assert.match(html,/Prof\. Morgan/);assert.doesNotMatch(plain(html),/[가-힣]/);
});
test('dynamic English UI preserves numbers and communicates actual September stipend policy',()=>{
 assert.equal(translateUIEnglish('현재 38세'),'Age 38');assert.equal(translateUIEnglish('80% · 다음 3월에 조정'),'80% · review next September');assert.equal(translateUIEnglish('부족액 $750 자동 차입'),'Automatic advance for a $750 shortfall');assert.equal(translateUIEnglish('참석 경비 20만원'),'Attendance cost $500');assert.equal(translateUIEnglish('User-entered English'),'User-entered English');assert.doesNotMatch(plain(renderUpdateNotice({locale:'en'})),/[가-힣]/);
});
