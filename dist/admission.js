import {createState,abilityScore} from './engine.js';
import {getDiscipline} from './disciplines.js';
import {generateKoreanName} from './names.js';

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
 const discipline=getDiscipline(options.professorProfile?.fieldId??options.fieldId);
 const interests=['기초 원리와 문헌의 연결','계산·자료로 질문 검증','현장의 문제를 연구로 발전'];
 const impressions=['관심 주제를 짧고 또렷하게 설명했습니다.','답을 고른 뒤 신중하게 생각을 이어갔습니다.','궁금한 점을 먼저 묻고 대화를 이어갔습니다.','낯선 질문에는 잠시 멈췄지만 자신의 경험을 이야기했습니다.','준비한 이야기보다 대화 중 떠오른 질문을 더 많이 꺼냈습니다.'];
 return Array.from({length:CANDIDATE_COUNT},(_,index)=>{
  const seed=admissionSeed(intakeSeed,index),state=createState('',seed,options);
  // Grades are a noisy, fictional application record, never a hidden-trait rating.
  const noise=draw(intakeSeed,`grade:${index}`)/0x100000000-.5;
  const gpa=Math.max(2.6,Math.min(4.45,3.35+(abilityScore(state,'learning')-30)*.018+noise*.9));
  return {index,name:generateKoreanName(seed,state.gender),gender:state.gender,gpa:Number(gpa.toFixed(2)),interest:`${discipline.label} · ${interests[draw(intakeSeed,`interest:${index}`)%interests.length]}`,impression:impressions[draw(intakeSeed,`impression:${index}`)%impressions.length]};
 });
}
export function admitCandidate(intakeSeed,index,options={}){
 const seed=admissionSeed(intakeSeed,index),state=createState('',seed,options);
 state.name=generateKoreanName(seed,state.gender);
 state.admission={intakeSeed,candidateIndex:index};
 return state;
}
export function admissionCode(intakeSeed,index){
 admissionSeed(intakeSeed,index);
 return `PM-${intakeSeed.toString(16).padStart(8,'0').toUpperCase()}-${index+1}`;
}
export function parseAdmissionCode(value){
 const match=/^PM-([0-9a-f]{8})-([1-3])$/i.exec(String(value??'').trim());
 return match?{intakeSeed:parseInt(match[1],16),candidateIndex:Number(match[2])-1}:null;
}
export function validAdmissionRecord(value){
 return Boolean(value&&validSeed(value.intakeSeed)&&Number.isInteger(value.candidateIndex)&&value.candidateIndex>=0&&value.candidateIndex<CANDIDATE_COUNT);
}
