import {grantCounts} from './funding.js';
import {DEFAULT_POLICIES} from './engine.js';
let enabled=false,session=null,status='기기 내 저장만 사용 중',pending=Promise.resolve(),sessions={};
try{enabled=localStorage.getItem('pm-analysis-consent')==='anonymous-gameplay-v1';session=JSON.parse(localStorage.getItem('pm-analysis-session')||'null');}catch{}
try{sessions=JSON.parse(localStorage.getItem('pm-analysis-sessions')||'{}');if(session?.runKey)sessions[session.runKey]=session;}catch{}
const hosted=typeof location!=='undefined'&&location.hostname==='professor-maker.gahyoun.chatgpt.site';
export const analyticsStatus=()=>status;
export const analyticsConsent=()=>enabled;
const database=()=>new Promise((resolve,reject)=>{const request=indexedDB.open('pm-anonymous-analysis',1);request.onupgradeneeded=()=>request.result.createObjectStore('months',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
async function localWrite(value){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('months','readwrite');tx.objectStore('months').put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export function analysisRecord(state){return {allocation:{...state.allocation},capacity:state.workload?{credits:state.workload.credits,efficiency:state.workload.efficiency,teachingRequired:state.workload.teachingRequired}:null,impact:{hIndex:state.impact?.hIndex??0,citations:[...(state.impact?.citations??[])]},funding:{...grantCounts(state),pool:state.lab.pool??0,operating:state.lab.funds},month:state.month,plan:[...state.plan],feedback:state.feedback,policies:{...(state.policies??DEFAULT_POLICIES)},stipend:state.lab.budget.salary,student:{...state.hidden},faculty:{...state.professor},outputs:Object.fromEntries(['papers','submissions','conferences','awards','completedProjects'].map(k=>[k,state.career[k]])),ending:state.ending,issues:state.history.filter(h=>h.month===state.month&&h.kind==='issue-read').slice(-8).map(h=>({id:h.id,choice:h.choice??'acknowledge'})),events:state.history.filter(h=>h.month===state.month&&h.kind==='event').slice(-16).map(h=>({id:h.id,choice:h.choice}))};}
const request=async(path,method,body,token)=>{const response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,credentials:'same-origin',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Collection unavailable');return response.json();};
const persistSessions=()=>localStorage.setItem('pm-analysis-sessions',JSON.stringify(sessions));
export async function setAnalyticsConsent(value){
 enabled=value;try{localStorage.setItem('pm-analysis-consent',enabled?'anonymous-gameplay-v1':'no');}catch{}
 if(enabled){status=hosted?'동의한 익명 기록을 제작자 서버에 보관합니다.':'분석용 익명 기록을 기기에 저장합니다. 직접 내보내기 전에는 전달되지 않습니다.';return;}
 // Let an in-flight write finish, then delete it too. Queued writes check consent again.
 await pending;
 const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('months','readwrite');tx.objectStore('months').clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}
 let failed=false;if(hosted){for(const [key,run] of Object.entries(sessions)){if(run.expiresAt<=Date.now()){delete sessions[key];continue;}try{await request('/api/runs/'+run.id,'DELETE',null,run.token);delete sessions[key];}catch{failed=true;}}}
 session=null;try{persistSessions();localStorage.removeItem('pm-analysis-session');}catch{}
 status=failed?'기기 기록 삭제 · 서버 삭제를 다시 시도해 주세요':'분석 동의 철회 · 기록 삭제 완료';
}
export function recordAnalytics(state){
 if(!enabled||!state.started)return Promise.resolve();
 const runKey=String(state.creationSeed??state.seed),profile={version:'4.8.1',fieldId:state.professorProfile.fieldId,institution:state.professorProfile.institution,labMode:state.professorProfile.labMode},record=analysisRecord(state);
 pending=pending.then(async()=>{
  if(!enabled)return;
  try{let localId=localStorage.getItem('pm-analysis-id-'+runKey);if(!localId){localId=crypto.randomUUID();localStorage.setItem('pm-analysis-id-'+runKey,localId);}
   await localWrite({key:localId+'-'+record.month,id:localId,profile,record});status='익명 월별 기록을 이 기기에 보관했습니다.';
   if(hosted){session=sessions[runKey];if(!session||session.expiresAt<Date.now()){session={...await request('/api/runs','POST',{consent:'anonymous-gameplay-v1',...profile}),runKey};sessions[runKey]=session;persistSessions();}
    await request('/api/runs/'+session.id,'POST',record,session.token);status='제작자 전용 서버에 익명 기록 저장 완료';}
  }catch{status='분석 기록 저장에 실패했습니다. 게임 저장에는 영향을 주지 않습니다.';}
 });return pending;
}
export async function exportAnalytics(){await pending;const db=await database();try{const rows=await new Promise((resolve,reject)=>{const r=db.transaction('months').objectStore('months').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const runs=new Map();for(const row of rows){if(!runs.has(row.id))runs.set(row.id,{id:row.id,profile:row.profile,records:[]});runs.get(row.id).records.push(row.record);}const blob=new Blob([JSON.stringify({format:'professor-maker-anonymous-v1',consent:'anonymous-gameplay-v1',runs:[...runs.values()]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='professor-maker-anonymous-gameplay.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}finally{db.close();}}
