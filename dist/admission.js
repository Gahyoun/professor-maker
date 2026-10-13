import {studentAppearanceForState} from './appearance.js';
import {studentBackground} from './student-background.js';
import {createState,abilityScore} from './engine.js';
import {getDiscipline} from './disciplines.js';
import {generateStudentName,validNamingVersion} from './names.js';

export const ADMISSION_KEY='pm-admission-v1';
export const CANDIDATE_COUNT=3;
const validSeed=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
function draw(seed,namespace){
 let n=2166136261;
 for(const c of `${seed}:admission:${namespace}`)n=Math.imul(n^c.charCodeAt(0),16777619);
 n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;
 return n>>>0;
}
export function admissionSeed(intakeSeed,index){
 if(!validSeed(intakeSeed)||!Number.isInteger(index)||index<0||index>=CANDIDATE_COUNT)throw new Error('유효하지 않은 입학 면접입니다.');
 // An odd stride guarantees three distinct uint32 seeds without consuming game RNG.
 return (draw(intakeSeed,'students')+Math.imul(index,0x9e3779b9))>>>0;
}
export function admissionCandidates(intakeSeed,options={}){
 const namingVersion=options.namingVersion===undefined?1:options.namingVersion;if(!validNamingVersion(namingVersion)||options.locale!=='en'&&namingVersion===3)throw new Error('Invalid naming version.');
 const usedNames=new Set();
 const discipline=getDiscipline(options.professorProfile?.fieldId??options.fieldId);
 const en=options.locale==='en';
 const interests=en?['Connecting foundational ideas with the literature','Testing questions with computation and data','Turning practical problems into research questions']:['기초 원리와 문헌의 연결','계산·자료로 질문 검증','현장의 문제를 연구로 발전'];
 const impressions=en?['Explained a research interest clearly and concisely.','Thought carefully before expanding on an answer.','Asked a question and kept the conversation going.','Paused at an unfamiliar question, then drew on personal experience.','Raised more questions during the conversation than in the prepared remarks.']:['관심 주제를 짧고 또렷하게 설명했습니다.','답을 고른 뒤 신중하게 생각을 이어갔습니다.','궁금한 점을 먼저 묻고 대화를 이어갔습니다.','낯선 질문에는 잠시 멈췄지만 자신의 경험을 이야기했습니다.','준비한 이야기보다 대화 중 떠오른 질문을 더 많이 꺼냈습니다.'];
 return Array.from({length:CANDIDATE_COUNT},(_,index)=>{
  const seed=admissionSeed(intakeSeed,index),state=createState('',seed,options);
  // Grades are a noisy, fictional application record, never a hidden-trait rating.
  const noise=draw(intakeSeed,`grade:${index}`)/0x100000000-.5;
  const gpa=Math.max(2.6,Math.min(4.45,3.35+(abilityScore(state,'learning')-30)*.018+noise*.9));
  let name=generateStudentName(seed,state.gender,options.locale,namingVersion);
  // Cosmetic collision handling never changes a candidate seed or hidden traits.
  if(namingVersion>=2){let variant=0;while(usedNames.has(name)){if(++variant>10000)throw new Error('Candidate name pool exhausted.');name=generateStudentName(seed,state.gender,options.locale,namingVersion,variant);}usedNames.add(name);}
  return {index,name,gender:state.gender,gpa:Number((en?gpa/4.5*4:gpa).toFixed(2)),...(en?{gpaScale:4}:{}),interest:`${en?discipline.labelEn:discipline.label} · ${interests[draw(intakeSeed,`interest:${index}`)%interests.length]}`,impression:impressions[draw(intakeSeed,`impression:${index}`)%impressions.length],...(en&&namingVersion===3?{background:studentBackground(seed,'en',3),appearance:studentAppearanceForState({locale:'en',admission:{namingVersion:3},creationSeed:seed,gender:state.gender})}:{})};
 });
}
export function admitCandidate(intakeSeed,index,options={}){
 const namingVersion=options.namingVersion===undefined?1:options.namingVersion;if(!validNamingVersion(namingVersion)||options.locale!=='en'&&namingVersion===3)throw new Error('Invalid naming version.');
 const seed=admissionSeed(intakeSeed,index),state=createState('',seed,options);
 state.name=namingVersion>=2?admissionCandidates(intakeSeed,options)[index].name:generateStudentName(seed,state.gender,options.locale,1);
 state.admission={intakeSeed,candidateIndex:index,...(namingVersion>=2?{namingVersion}:{})};
 return state;
}
export function admissionCode(intakeSeed,index,namingVersion=1){
 admissionSeed(intakeSeed,index);if(!validNamingVersion(namingVersion))throw new Error('Invalid naming version.');
 return `${namingVersion===1?'PM':`PM${namingVersion}`}-${intakeSeed.toString(16).padStart(8,'0').toUpperCase()}-${index+1}`;
}
export function parseAdmissionCode(value){
 const match=/^PM([23])?-([0-9a-f]{8})-([1-3])$/i.exec(String(value??'').trim());
 return match?{intakeSeed:parseInt(match[2],16),candidateIndex:Number(match[3])-1,...(match[1]?{namingVersion:Number(match[1])}:{})}:null;
}
export function validAdmissionRecord(value){
 return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===(value.namingVersion===undefined?2:3)&&Object.keys(value).every(key=>['intakeSeed','candidateIndex','namingVersion'].includes(key))&&validSeed(value.intakeSeed)&&Number.isInteger(value.candidateIndex)&&value.candidateIndex>=0&&value.candidateIndex<CANDIDATE_COUNT&&(value.namingVersion===undefined||validNamingVersion(value.namingVersion)));
}
