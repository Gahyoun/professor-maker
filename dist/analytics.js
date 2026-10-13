import {isServerAnalyticsHost,analyticsConsentCopy} from './analytics-consent.js';
import {ANALYTICS_POLICY_VERSION,ANALYTICS_EXPORT_FORMAT} from './analytics-policy.js';
import {grantCounts} from './funding.js';
import {DEFAULT_POLICIES} from './engine.js';
import {EDITION,editionStorageKey} from './edition.js';

const analysisStorage={
 getItem:key=>localStorage.getItem(editionStorageKey(key,EDITION)),
 setItem:(key,value)=>localStorage.setItem(editionStorageKey(key,EDITION),value),
 removeItem:key=>localStorage.removeItem(editionStorageKey(key,EDITION))
};
const hosted=isServerAnalyticsHost(globalThis.location?.hostname??'');
const message=(ko,en)=>EDITION==='en'?en:ko;
let enabled=false,status=analyticsConsentCopy(EDITION).disabledStatus,pending=Promise.resolve(),sessions={},consentEpoch=0,legacyRecords=false;
try{
 const consent=analysisStorage.getItem('pm-analysis-consent');
 enabled=consent===ANALYTICS_POLICY_VERSION;
 legacyRecords=consent==='anonymous-gameplay-v1';
 if(legacyRecords){
  // A 90-day opt-in cannot authorize five years. Gameplay storage is separate.
  analysisStorage.setItem('pm-analysis-consent','no');
  status=message('분석 안내 변경 · 내용을 확인하고 새로 동의해 주세요.','Analytics policy changed · review the notice and opt in again.');
 }
}catch{}
const validSession=run=>run&&typeof run==='object'&&typeof run.runKey==='string'&&run.runKey.length<=32&&/^[a-f0-9-]{36}$/.test(run.id)&&/^[a-f0-9]{64}$/.test(run.token)&&run.consentVersion===ANALYTICS_POLICY_VERSION&&run.edition===EDITION&&Number.isSafeInteger(run.expiresAt)&&run.expiresAt>0&&Number.isSafeInteger(run.retentionUntil)&&run.expiresAt<run.retentionUntil;
try{
 if(!legacyRecords){
  const stored=JSON.parse(analysisStorage.getItem('pm-analysis-sessions')||'{}');
  if(stored&&typeof stored==='object'&&!Array.isArray(stored))for(const run of Object.values(stored))if(validSession(run))sessions[run.id]=run;
 }
}catch{}
if(enabled)status=analyticsConsentCopy(EDITION).enabledStatus;
export const analyticsStatus=()=>status;
export const analyticsConsent=()=>enabled;

const database=()=>new Promise((resolve,reject)=>{
 const request=indexedDB.open(EDITION==='en'?'pm-us-anonymous-analysis':'pm-anonymous-analysis',2);
 request.onupgradeneeded=()=>{
  if(request.result.objectStoreNames.contains('months'))request.transaction.objectStore('months').clear();
  else request.result.createObjectStore('months',{keyPath:'key'});
 };
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
async function localTransaction(action){
 const db=await database();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('months','readwrite');action(tx.objectStore('months'));
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Analytics transaction aborted'));
 });}finally{db.close();}
}
const persistSessions=()=>analysisStorage.setItem('pm-analysis-sessions',JSON.stringify(sessions));
function clearAnalysisIds(){
 const prefix=editionStorageKey('pm-analysis-id-',EDITION),keys=[];
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);}
 for(const key of keys)localStorage.removeItem(key);
 // The legacy single active token must not be reused under the new policy.
 analysisStorage.removeItem('pm-analysis-session');
}
async function clearLegacyRecords(){
 if(!legacyRecords)return;
 await localTransaction(store=>store.clear());
 clearAnalysisIds();sessions={};persistSessions();legacyRecords=false;
}
if(legacyRecords)pending=pending.then(clearLegacyRecords).catch(()=>{
 status=message('분석 동의 갱신 필요 · 이전 기기 기록 정리를 다시 시도해 주세요.','Renew analytics consent · retry clearing the previous device records.');
});

export function analysisRecord(state){return {allocation:{...state.allocation},capacity:state.workload?{credits:state.workload.credits,efficiency:state.workload.efficiency,teachingRequired:state.workload.teachingRequired}:null,impact:{hIndex:state.impact?.hIndex??0,citations:[...(state.impact?.citations??[])]},funding:{...grantCounts(state),pool:state.lab.pool??0,operating:state.lab.funds},month:state.month,plan:[...state.plan],feedback:state.feedback,policies:{...(state.policies??DEFAULT_POLICIES)},stipend:state.lab.budget.salary,student:{...state.hidden},faculty:{...state.professor},outputs:Object.fromEntries(['papers','submissions','conferences','awards','completedProjects'].map(k=>[k,state.career[k]])),ending:state.ending,issues:state.history.filter(h=>h.month===state.month&&h.kind==='issue-read').slice(-8).map(h=>({id:h.id,choice:h.choice??'acknowledge'})),events:state.history.filter(h=>h.month===state.month&&h.kind==='event').slice(-16).map(h=>({id:h.id,choice:h.choice}))};}
const request=async(path,method,body,token)=>{
 const response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,credentials:'same-origin',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('Collection unavailable');return response.json();
};

export function setAnalyticsConsent(value){
 enabled=value===true;const epoch=++consentEpoch,allow=enabled;
 try{analysisStorage.setItem('pm-analysis-consent',allow?ANALYTICS_POLICY_VERSION:'no');}catch{}
 pending=pending.then(async()=>{
  if(allow){await clearLegacyRecords();if(epoch===consentEpoch)status=analyticsConsentCopy(EDITION).enabledStatus;return;}
  // This queue also waits for any in-flight registration/write, so withdrawal
  // deletes its new token too. New opt-ins/records wait behind this deletion.
  let localFailed=false;
  try{await clearLegacyRecords();await localTransaction(store=>store.clear());clearAnalysisIds();}catch{localFailed=true;}
  let failed=false;
  if(hosted)for(const [id,run] of Object.entries(sessions)){
   if(run.retentionUntil<=Date.now()){delete sessions[id];continue;}
   try{await request('/api/runs/'+run.id,'DELETE',null,run.token);delete sessions[id];}catch{failed=true;}
  }
  try{persistSessions();}catch{}
  if(epoch===consentEpoch)status=localFailed?
   message('기기 분석 기록 삭제를 다시 시도해 주세요. 게임 진행은 유지됩니다.','Retry deleting the device analytics. Your game progress is unchanged.'):
   failed?
   message('기기 기록 삭제 · 서버 삭제를 다시 시도해 주세요.','Device analytics deleted · retry deleting the server records.'):
   message('분석 동의 철회 · 기록 삭제 완료','Consent withdrawn · analytics deleted.');
 }).catch(()=>{
  if(epoch===consentEpoch)status=message('분석 기록 정리에 실패했습니다. 다시 시도해 주세요. 게임 진행은 유지됩니다.','Analytics cleanup failed. Retry; your game progress is unchanged.');
 });return pending;
}

export function recordAnalytics(state){
 if(!enabled||!state.started)return Promise.resolve();
 const epoch=consentEpoch,runKey=String(state.creationSeed??state.seed),profile={version:'4.24.1',edition:EDITION,fieldId:state.professorProfile.fieldId,institution:state.professorProfile.institution,labMode:state.professorProfile.labMode},record=analysisRecord(state);
 pending=pending.then(async()=>{
  if(!enabled||epoch!==consentEpoch)return;
  try{
   await clearLegacyRecords();
   let localId=analysisStorage.getItem('pm-analysis-id-'+runKey);
   if(!localId){localId=crypto.randomUUID();analysisStorage.setItem('pm-analysis-id-'+runKey,localId);}
   await localTransaction(store=>store.put({key:localId+'-'+record.month,id:localId,consentVersion:ANALYTICS_POLICY_VERSION,profile,record}));
   status=message('익명 월별 기록을 이 기기에 보관했습니다.','Anonymous monthly analytics saved on this device.');
   if(!hosted||!enabled||epoch!==consentEpoch)return;
   let session=Object.values(sessions).filter(run=>validSession(run)&&run.runKey===runKey&&run.expiresAt>Date.now()&&run.retentionUntil>Date.now()).sort((a,b)=>b.expiresAt-a.expiresAt)[0];
   if(!session){
    session={...await request('/api/runs','POST',{consent:ANALYTICS_POLICY_VERSION,...profile}),runKey};
    // An old deployed server or the other edition must never receive a month.
    if(!validSession(session)||session.expiresAt<=Date.now()||session.retentionUntil<=Date.now())throw new Error('Analytics policy or edition mismatch');
    sessions[session.id]=session;persistSessions();
   }
   if(!enabled||epoch!==consentEpoch)return;
   await request('/api/runs/'+session.id,'POST',record,session.token);
   status=message('제작자 전용 서버에 익명 기록 저장 완료','Anonymous analytics saved on the creator’s server.');
  }catch{status=message('분석 기록 저장에 실패했습니다. 게임 저장에는 영향을 주지 않습니다.','Analytics storage failed. Your game save is unaffected.');}
 });return pending;
}

export async function exportAnalytics(){
 await pending;await clearLegacyRecords();const db=await database();
 try{
  const rows=await new Promise((resolve,reject)=>{const r=db.transaction('months').objectStore('months').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const runs=new Map();for(const row of rows){
   if(row.consentVersion!==ANALYTICS_POLICY_VERSION||row.profile?.edition!==EDITION)continue;
   if(!runs.has(row.id))runs.set(row.id,{id:row.id,profile:row.profile,records:[]});runs.get(row.id).records.push(row.record);
  }
  const blob=new Blob([JSON.stringify({format:ANALYTICS_EXPORT_FORMAT,consent:ANALYTICS_POLICY_VERSION,runs:[...runs.values()]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='professor-maker-anonymous-gameplay-'+EDITION+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }finally{db.close();}
}
