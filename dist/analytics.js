import {isServerAnalyticsHost,analyticsConsentCopy} from './analytics-consent.js';
import {ANALYTICS_POLICY_VERSION,ANALYTICS_EXPORT_FORMAT,analyticsRetentionUntil} from './analytics-policy.js';
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
const POLICY=ANALYTICS_POLICY_VERSION,RETRY_DELAYS=[1000,5000,15000],MAX_BATCH=32;
let enabled=false,status=analyticsConsentCopy(EDITION).disabledStatus,pending=Promise.resolve(),sessions={},ids={},consentEpoch=0,legacyRecords=false;
let consentState=null,storedConsentValue=null,sessionRevision=0,retryTimer=null,retryCount=0,lastSuccessAt=null,localError=null,serverError=null,phase='disabled';
const rows=new Map(),listeners=new Set();
const validConsent=value=>value&&typeof value==='object'&&[POLICY,'no'].includes(value.value)&&Number.isSafeInteger(value.changedAt)&&value.changedAt>0;
const validSession=run=>run&&typeof run==='object'&&typeof run.runKey==='string'&&run.runKey.length<=32&&/^[a-f0-9-]{36}$/.test(run.id)&&/^[a-f0-9]{64}$/.test(run.token)&&run.consentVersion===POLICY&&run.edition===EDITION&&Number.isSafeInteger(run.expiresAt)&&run.expiresAt>0&&Number.isSafeInteger(run.retentionUntil)&&run.expiresAt<run.retentionUntil;
const validSessionSnapshot=value=>value&&typeof value==='object'&&Number.isSafeInteger(value.changedAt)&&value.changedAt>0&&value.sessions&&typeof value.sessions==='object'&&!Array.isArray(value.sessions);
const filterSessions=stored=>Object.fromEntries(Object.values(stored).filter(validSession).map(run=>[run.id,run]));
const currentRow=row=>row&&typeof row==='object'&&typeof row.key==='string'&&typeof row.id==='string'&&row.consentVersion===POLICY&&row.profile?.edition===EDITION&&Number.isInteger(row.record?.month)&&row.record.month>=0&&row.record.month<=96;
const queued=()=>[...rows.values()].filter(row=>!row.uploadedAt).length;
const deletions=()=>Object.values(sessions).filter(run=>run.deletePending||!enabled).length;
try{
 const consent=analysisStorage.getItem('pm-analysis-consent');
 storedConsentValue=consent;
 enabled=consent===POLICY;legacyRecords=consent==='anonymous-gameplay-v1';
 const saved=JSON.parse(analysisStorage.getItem('pm-analysis-consent-state')||'null');
 if(validConsent(saved)){consentState=saved;enabled=saved.value===POLICY;}
 const stored=JSON.parse(analysisStorage.getItem('pm-analysis-sessions')||'{}');
 const snapshot=JSON.parse(analysisStorage.getItem('pm-analysis-sessions-state')||'null');
 if(!legacyRecords&&validSessionSnapshot(snapshot)){sessions=filterSessions(snapshot.sessions);sessionRevision=snapshot.changedAt;}
 else if(!legacyRecords&&stored&&typeof stored==='object'&&!Array.isArray(stored))sessions=filterSessions(stored);
 const prefix=editionStorageKey('pm-analysis-id-',EDITION);
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix)){const id=localStorage.getItem(key);if(id)ids[key.slice(prefix.length)]=id;}}
}catch{}
if(legacyRecords){enabled=false;status=message('분석 안내 변경 · 내용을 확인하고 새로 동의해 주세요.','Analytics policy changed · review the notice and opt in again.');}
else if(enabled){phase=hosted?'ready':'local-only';status=analyticsConsentCopy(EDITION).enabledStatus;}

export const analyticsStatus=()=>status;
export const analyticsConsent=()=>enabled;
export function analyticsTransportStatus(){
 return Object.freeze({scope:hosted?'server':'device',enabled,phase,queued:queued(),uploaded:[...rows.values()].filter(row=>row.uploadedAt).length,lastSuccessAt,error:serverError?Object.freeze({...serverError}):null,localError:localError?Object.freeze({...localError}):null,canRetry:Boolean(localError||hosted&&(enabled&&queued()||deletions())),deletionPending:deletions(),durable:!localError});
}
export function subscribeAnalyticsStatus(listener){
 if(typeof listener!=='function')return ()=>{};
 listeners.add(listener);try{listener(analyticsTransportStatus());}catch{}
 return ()=>listeners.delete(listener);
}
function notify(next=phase){
 phase=next;
 if(phase==='disabled')status=analyticsConsentCopy(EDITION).disabledStatus;
 else if(phase==='deleting')status=message('분석 동의 철회 · 서버 기록 삭제 요청 중입니다.','Consent withdrawn · requesting deletion of server analytics.');
 else if(phase==='withdrawn')status=message('분석 동의 철회 · 기록 삭제 완료','Consent withdrawn · analytics deleted.');
 else if(phase==='synced')status=message('제작자 서버에 익명 기록 저장 완료','Anonymous analytics saved on the creator’s server.');
 else if(!enabled&&deletions())status=message('기기 기록 삭제 · 서버 삭제를 다시 시도해 주세요.','Device analytics deleted · retry deleting the server records.');
 else if(phase==='uploading')status=message('동의한 익명 기록을 서버로 전송 중입니다.','Uploading consented anonymous analytics.');
 else if(hosted&&queued())status=message(`익명 기록 ${queued()}건 전송 대기 · 다시 시도할 수 있습니다.`,`${queued()} anonymous ${queued()===1?'record':'records'} awaiting upload · you can retry.`);
 else if(enabled)status=hosted?analyticsConsentCopy(EDITION).enabledStatus:message('익명 월별 기록을 이 기기에 보관했습니다.','Anonymous monthly analytics saved on this device.');
 if(localError)status+=' '+message('기기 분석 저장에 오류가 있습니다.','Device analytics storage needs attention.');
 const snapshot=analyticsTransportStatus();for(const listener of listeners)try{listener(snapshot);}catch{}
}
const storageFailure=(stage,error)=>{localError={stage,code:error?.name==='QuotaExceededError'?'quota':error?.name==='SecurityError'?'blocked':'unavailable'};};
function tryStorage(action,stage='localStorage'){try{action();return true;}catch(error){storageFailure(stage,error);return false;}}
const database=()=>new Promise((resolve,reject)=>{
 let request,abandoned=false;try{request=indexedDB.open(EDITION==='en'?'pm-us-anonymous-analysis':'pm-anonymous-analysis',3);}catch(error){reject(error);return;}
 request.onupgradeneeded=event=>{
  if(request.result.objectStoreNames.contains('months')){if(event.oldVersion<2)request.transaction.objectStore('months').clear();}
  else request.result.createObjectStore('months',{keyPath:'key'});
  if(!request.result.objectStoreNames.contains('metadata'))request.result.createObjectStore('metadata',{keyPath:'key'});
 };
 request.onsuccess=()=>{if(abandoned)request.result.close();else resolve(request.result);};request.onerror=()=>reject(request.error);
 request.onblocked=()=>{abandoned=true;reject(new Error('Analytics database blocked'));};
});
async function transaction(storeNames,action,mode='readwrite'){
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(storeNames,mode);let result;try{result=action(tx);}catch(error){tx.abort();reject(error);return;}
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Analytics transaction aborted'));
 });}finally{db.close();}
}
async function readStore(name){let result=[];await transaction([name],tx=>{const req=tx.objectStore(name).getAll();req.onsuccess=()=>{result=req.result;};},'readonly');return result;}
async function localWrite(action,stage){try{await action();return true;}catch(error){storageFailure(stage,error);return false;}}
async function persistMetadata(){
 sessionRevision=Math.max(Date.now(),sessionRevision+1);const sessionSnapshot={changedAt:sessionRevision,sessions};
 const ls=tryStorage(()=>{
  // One atomic snapshot preserves deletions when the other store is stale.
  analysisStorage.setItem('pm-analysis-sessions-state',JSON.stringify(sessionSnapshot));
  analysisStorage.setItem('pm-analysis-sessions',JSON.stringify(sessions));
  if(consentState){analysisStorage.setItem('pm-analysis-consent-state',JSON.stringify(consentState));analysisStorage.setItem('pm-analysis-consent',consentState.value);}
  for(const [key,id] of Object.entries(ids))analysisStorage.setItem('pm-analysis-id-'+key,id);
 });
 // A stale tab may still use the previous client and write only the original
 // consent key. Remember what it contained when metadata was committed, so a
 // later explicit "no" cannot be overwritten by an older durable opt-in.
 try{storedConsentValue=analysisStorage.getItem('pm-analysis-consent');if(consentState)consentState={...consentState,localStorageValue:storedConsentValue};}catch{}
 const db=await localWrite(()=>transaction(['metadata'],tx=>{
  const store=tx.objectStore('metadata');store.put({key:'sessions',value:sessions});store.put({key:'ids',value:ids});
  store.put({key:'sessions-state',value:sessionSnapshot});
  if(consentState)store.put({key:'consent',value:consentState});
 }), 'indexedDB-metadata');
 return {ls,db};
}
function clearAnalysisIds(){
 const prefix=editionStorageKey('pm-analysis-id-',EDITION),keys=[];
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);}
 for(const key of keys)localStorage.removeItem(key);analysisStorage.removeItem('pm-analysis-session');
}
async function clearLocalRows(){
 rows.clear();ids={};
 const db=await localWrite(()=>transaction(['months'],tx=>tx.objectStore('months').clear()),'indexedDB-delete');
 const ls=tryStorage(clearAnalysisIds);return db&&ls;
}
async function clearLegacyRecords(){
 if(!legacyRecords)return;
 if(!await clearLocalRows())throw new Error('Legacy analytics cleanup failed');
 sessions={};legacyRecords=false;await persistMetadata();
}
async function initialize(){
 try{
  const metadata=Object.fromEntries((await readStore('metadata')).map(row=>[row.key,row.value]));
  if(validConsent(metadata.consent)&&(!consentState||metadata.consent.changedAt>consentState.changedAt||metadata.consent.changedAt===consentState.changedAt&&metadata.consent.value==='no')){consentState=metadata.consent;enabled=consentState.value===POLICY;}
  if(storedConsentValue==='no'&&consentState?.value===POLICY&&consentState.localStorageValue!=='no'){
   consentState={value:'no',changedAt:Math.max(Date.now(),consentState.changedAt+1)};enabled=false;
  }
  const snapshot=metadata['sessions-state'];
  if(validSessionSnapshot(snapshot)&&snapshot.changedAt>sessionRevision){sessions=filterSessions(snapshot.sessions);sessionRevision=snapshot.changedAt;}
  else if(!sessionRevision&&metadata.sessions&&typeof metadata.sessions==='object')sessions={...filterSessions(metadata.sessions),...sessions};
  if(metadata.ids&&typeof metadata.ids==='object')for(const [key,id]of Object.entries(metadata.ids))if(typeof id==='string'&&!ids[key])ids[key]=id;
  if(!legacyRecords)for(const row of await readStore('months'))if(currentRow(row)){
   const runKey=row.runKey??Object.keys(ids).find(key=>ids[key]===row.id)??row.id.replaceAll('-','').slice(0,32);
   if(row.capturedAt&&analyticsRetentionUntil(row.capturedAt)<=Date.now())continue;
   rows.set(row.key,{...row,runKey});if(row.uploadedAt)lastSuccessAt=Math.max(lastSuccessAt??0,row.uploadedAt);
  }
 }catch(error){storageFailure('indexedDB-read',error);}
 if(legacyRecords){enabled=false;consentState={value:'no',changedAt:Date.now()};try{await clearLegacyRecords();}catch{notify('error');}}
 if(!consentState&&enabled)consentState={value:POLICY,changedAt:Date.now()};
 if(!enabled)for(const run of Object.values(sessions))run.deletePending=true;
 if(!enabled&&rows.size)await clearLocalRows();
 if(consentState)await persistMetadata();
 notify(enabled?(hosted?(queued()?'queued':'ready'):'local-only'):'disabled');
}

export function analysisRecord(state){return {allocation:{...state.allocation},capacity:state.workload?{credits:state.workload.credits,efficiency:state.workload.efficiency,teachingRequired:state.workload.teachingRequired}:null,impact:{hIndex:state.impact?.hIndex??0,citations:[...(state.impact?.citations??[])]},funding:{...grantCounts(state),pool:state.lab.pool??0,operating:state.lab.funds},month:state.month,plan:[...state.plan],feedback:state.feedback,policies:{...(state.policies??DEFAULT_POLICIES)},stipend:state.lab.budget.salary,student:{...state.hidden},faculty:{...state.professor},outputs:Object.fromEntries(['papers','submissions','conferences','awards','completedProjects'].map(k=>[k,state.career[k]])),ending:state.ending,issues:state.history.filter(h=>h.month===state.month&&h.kind==='issue-read').slice(-8).map(h=>({id:h.id,choice:h.choice??'acknowledge'})),events:state.history.filter(h=>h.month===state.month&&h.kind==='event').slice(-16).map(h=>({id:h.id,choice:h.choice}))};}
function transportError(stage,code,httpStatus=null,retryable=false){const error=new Error('Analytics transport failed');error.analytics={stage,code,httpStatus,retryable};return error;}
async function request(path,method,body,token,stage){
 let response;try{response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,credentials:'same-origin',signal:AbortSignal.timeout(8000)});}catch(error){throw transportError(stage,error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network',null,true);}
 if(!response.ok)throw transportError(stage,'http',response.status,response.status===408||response.status===429||response.status>=500);
 try{return await response.json();}catch{throw transportError(stage,'response',response.status,false);}
}
function cancelRetry(){if(retryTimer!==null)clearTimeout(retryTimer);retryTimer=null;}
function scheduleRetry(){
 if(!hosted||retryTimer!==null||retryCount>=RETRY_DELAYS.length||globalThis.navigator?.onLine===false)return;
 if(!enabled&&!deletions()||enabled&&!queued()&&!deletions())return;
 if(serverError&&!serverError.retryable)return;
 const epoch=consentEpoch;retryTimer=setTimeout(()=>{retryTimer=null;if(epoch!==consentEpoch)return;enqueue(()=>flush(epoch));},RETRY_DELAYS[retryCount++]);
 retryTimer?.unref?.();notify('retry-wait');
}
function enqueue(action){pending=pending.then(action).catch(error=>{serverError=error.analytics??{stage:'client',code:'unexpected',httpStatus:null,retryable:false};notify('error');});return pending;}
async function deleteSessions(){
 if(!hosted)return;
 let failure=null;
 for(const [id,run]of Object.entries(sessions)){
  if(!run.deletePending&&enabled)continue;
  if(run.retentionUntil<=Date.now()){delete sessions[id];continue;}
  notify('deleting');
  try{await request('/api/runs/'+run.id,'DELETE',null,run.token,'delete');delete sessions[id];}
  catch(error){
   // 401 means this token no longer identifies a retained authorized row. It
   // must never be reused for upload; keep the credential for explicit retry.
   run.deletePending=true;failure??=error;
  }
 }
 await persistMetadata();
 if(failure)throw failure;
}
async function sessionFor(row,epoch){
 let session=Object.values(sessions).filter(run=>validSession(run)&&run.runKey===row.runKey&&!run.uploadBlocked&&!run.deletePending&&run.expiresAt>Date.now()&&run.retentionUntil>Date.now()).sort((a,b)=>b.expiresAt-a.expiresAt)[0];
 if(session)return session;
 if(!enabled||epoch!==consentEpoch)return null;
 session={...await request('/api/runs','POST',{consent:POLICY,...row.profile},null,'register'),runKey:row.runKey};
 if(!validSession(session)||session.expiresAt<=Date.now()||session.retentionUntil<=Date.now())throw transportError('register','policy-or-edition',null,false);
 sessions[session.id]=session;
 // Keep the newly issued deletion credential even when consent was withdrawn
 // while registration was in flight. Local failure cannot cancel transport.
 if(!enabled||epoch!==consentEpoch)session.deletePending=true;
 await persistMetadata();return session;
}
async function flush(epoch){
 if(!hosted)return;
 serverError=null;let deletionError=null;
 try{
  try{await deleteSessions();}catch(error){deletionError=error;}
  if(!enabled||epoch!==consentEpoch){if(deletionError)throw deletionError;notify(deletions()?'error':'withdrawn');return;}
  if(globalThis.navigator?.onLine===false)throw transportError('upload','offline',null,true);
  const batch=[...rows.values()].filter(row=>!row.uploadedAt&&currentRow(row)).slice(0,MAX_BATCH);
  if(!batch.length){if(deletionError)throw deletionError;notify(lastSuccessAt?'synced':'ready');return;}
  notify('uploading');
  for(const row of batch){
   if(!enabled||epoch!==consentEpoch)return;
   let session=await sessionFor(row,epoch);if(!session||!enabled||epoch!==consentEpoch)return;
   try{await request('/api/runs/'+session.id,'POST',row.record,session.token,'upload');}
   catch(error){
    if(![401,403].includes(error.analytics?.httpStatus))throw error;
    session.uploadBlocked=true;await persistMetadata();
    if(!enabled||epoch!==consentEpoch)return;
    session=await sessionFor(row,epoch);if(!session||!enabled||epoch!==consentEpoch)return;
    await request('/api/runs/'+session.id,'POST',row.record,session.token,'upload');
   }
   if(!enabled||epoch!==consentEpoch)return;
   lastSuccessAt=Date.now();row.uploadedAt=lastSuccessAt;row.serverId=session.id;
   await localWrite(()=>transaction(['months'],tx=>tx.objectStore('months').put(row)),'indexedDB-acknowledge');
   notify(queued()?'uploading':'synced');
  }
  if(deletionError)throw deletionError;
  notify(queued()?'queued':'synced');
 }catch(error){serverError=error.analytics??{stage:'client',code:'unexpected',httpStatus:null,retryable:false};notify('error');}
 scheduleRetry();
}

export function setAnalyticsConsent(value){
 enabled=value===true;const epoch=++consentEpoch,allow=enabled;cancelRetry();retryCount=0;
 consentState={value:allow?POLICY:'no',changedAt:Math.max(Date.now(),(consentState?.changedAt??0)+1)};
 tryStorage(()=>{analysisStorage.setItem('pm-analysis-consent',consentState.value);analysisStorage.setItem('pm-analysis-consent-state',JSON.stringify(consentState));});
 notify(allow?'ready':'disabled');
 return enqueue(async()=>{
  // initialize may have restored an older metadata marker while this user
  // action was waiting. The explicit action remains authoritative.
  if(allow){
   if(epoch!==consentEpoch)return;enabled=true;consentState={value:POLICY,changedAt:Math.max(Date.now(),(consentState?.changedAt??0)+1)};
   await clearLegacyRecords();await persistMetadata();if(epoch===consentEpoch){notify(hosted?'ready':'local-only');await flush(epoch);}return;
  }
  // Every withdrawal clears its old records, even if the user immediately
  // opts in again. That new opt-in waits behind this cleanup and gets new IDs.
  if(epoch===consentEpoch){enabled=false;consentState={value:'no',changedAt:Math.max(Date.now(),(consentState?.changedAt??0)+1)};}
  for(const run of Object.values(sessions))run.deletePending=true;
  const localDeleted=await clearLocalRows();await persistMetadata();serverError=null;
  try{await deleteSessions();if(epoch===consentEpoch)notify(localDeleted?'withdrawn':'error');}
  catch(error){serverError=error.analytics;notify('error');scheduleRetry();}
 });
}
export function recordAnalytics(state){
 if(!enabled||!state.started)return Promise.resolve();
 const epoch=consentEpoch,runKey=String(state.creationSeed??state.seed),profile={version:'4.26.0',edition:EDITION,fieldId:state.professorProfile.fieldId,institution:state.professorProfile.institution,labMode:state.professorProfile.labMode},record=analysisRecord(state);
 cancelRetry();retryCount=0;
 return enqueue(async()=>{
  if(!enabled||epoch!==consentEpoch)return;await clearLegacyRecords();
  let id=ids[runKey];if(!id){id=crypto.randomUUID();ids[runKey]=id;await persistMetadata();}
  const row={key:id+'-'+record.month,id,runKey,consentVersion:POLICY,profile,record,capturedAt:Date.now(),uploadedAt:null};
  rows.set(row.key,row);await localWrite(()=>transaction(['months'],tx=>tx.objectStore('months').put(row)),'indexedDB-write');
  notify(hosted?'queued':'local-only');if(enabled&&epoch===consentEpoch)await flush(epoch);
 });
}
export function retryAnalytics(){cancelRetry();retryCount=0;return enqueue(async()=>{
 localError=null;await persistMetadata();
 if(enabled&&rows.size)await localWrite(()=>transaction(['months'],tx=>{const store=tx.objectStore('months');for(const row of rows.values())store.put(row);}),'indexedDB-write');
 else if(!enabled)await clearLocalRows();
 await flush(consentEpoch);if(!hosted)notify(enabled?'local-only':'withdrawn');
});}

export async function exportAnalytics(){
 await pending;await clearLegacyRecords();
 const runs=new Map();for(const row of rows.values()){
  if(!currentRow(row))continue;
  if(!runs.has(row.id))runs.set(row.id,{id:row.id,profile:row.profile,records:[]});runs.get(row.id).records.push(row.record);
 }
 const blob=new Blob([JSON.stringify({format:ANALYTICS_EXPORT_FORMAT,consent:POLICY,runs:[...runs.values()]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='professor-maker-anonymous-gameplay-'+EDITION+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const bootstrapEpoch=consentEpoch;
pending=pending.then(initialize).catch(error=>{storageFailure('initialize',error);notify('error');});
if(typeof globalThis.addEventListener==='function'){
 globalThis.addEventListener('online',()=>{if(enabled||deletions())void retryAnalytics();});
 globalThis.addEventListener('storage',event=>{
  if(event.key!==editionStorageKey('pm-analysis-consent',EDITION))return;
  const allow=event.newValue===POLICY;if(allow!==enabled)void setAnalyticsConsent(allow);
 });
}
// Recover only months recorded under this exact policy and edition, after
// durable consent has loaded. There is no timer while opted out or device-only.
pending=pending.then(()=>{if(hosted&&(enabled||deletions())&&bootstrapEpoch===consentEpoch)return flush(bootstrapEpoch);});
