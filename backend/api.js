import {ISSUE_CHOICES} from '../dist/monthly-choices.js';
import {mergeRelationship} from '../dist/relationship.js';
import {HIDDEN_RANGES,ACTIVITIES,LEGACY_ACTIVITIES,EVENTS} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {ANALYTICS_POLICY_VERSION,ANALYTICS_RETENTION_YEARS,ANALYTICS_TOKEN_DAYS,analyticsRetentionUntil} from '../dist/analytics-policy.js';
// Exact released schemas only; registration and administrator import share this gate.
const SUPPORTED_ANALYTICS_VERSIONS=Object.freeze(['4.1.0','4.2.0','4.3.0','4.4.0','4.5.0','4.6.0','4.7.0','4.8.0','4.9.0','4.10.0','4.11.0','4.12.0','4.13.0','4.13.1','4.13.2','4.13.3','4.14.0','4.15.0','4.15.1','4.15.2','4.15.3','4.15.4','4.15.5','4.16.0','4.22.0','4.23.0']);
const validAnalyticsVersion=value=>typeof value==='string'&&SUPPORTED_ANALYTICS_VERSIONS.includes(value);
const outcomes=['bachelor','masters','true','postdoc','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher','leave','dropout','dismissed','unfinished','gameover','external_masters','external_phd'];
const allowedOrigin=(request)=>{const origin=request.headers.get('Origin');return origin===new URL(request.url).origin||origin==='https://gahyoun.github.io'||/^http:\/\/127\.0\.0\.1:(4173|4174)$/.test(origin||'');};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin',...headers}});
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validRecord(record){
 if(!plain(record)||Object.keys(record).some(k=>!['month','plan','feedback','policies','stipend','student','faculty','outputs','ending','events','issues','funding','impact','allocation','capacity'].includes(k)))return false;
 if(!Number.isInteger(record.month)||record.month<0||record.month>96||!Array.isArray(record.plan)||![4,5].includes(record.plan.length)||!record.plan.every(k=>(Object.hasOwn(ACTIVITIES,k)||Object.hasOwn(LEGACY_ACTIVITIES,k)))||!['listen','praise','critique','harsh'].includes(record.feedback)||!Number.isInteger(record.stipend)||record.stipend<0||record.stipend>100||!plain(record.policies)||!['free','core','regular','intensive'].includes(record.policies.work)||!['study','learn','research','intensive'].includes(record.policies.study))return false;
 const exact=(data,keys)=>plain(data)&&Object.keys(data).length===keys.length&&keys.every(k=>Object.hasOwn(data,k));
 const student=mergeRelationship(record.student);
 if(!exact(student,Object.keys(HIDDEN_RANGES))||!Object.entries(HIDDEN_RANGES).every(([k,[lo,hi]])=>Number.isFinite(student[k])&&student[k]>=lo&&student[k]<=hi))return false;
 if(!exact(record.faculty,['research','teaching','admin','mentoring'])||!Object.values(record.faculty).every(n=>Number.isFinite(n)&&n>=0&&n<=100))return false;
 if(!exact(record.outputs,['papers','submissions','conferences','awards','completedProjects'])||!Object.values(record.outputs).every(n=>Number.isInteger(n)&&n>=0&&n<=10000))return false;
 if(record.allocation!==undefined&&(!exact(record.allocation,['research','teaching','admin','mentoring'])||!Object.values(record.allocation).every(n=>Number.isInteger(n)&&n>=0&&n<=12)||Object.values(record.allocation).reduce((a,b)=>a+b,0)>12))return false;
 if(record.capacity!==undefined&&record.capacity!==null&&(!exact(record.capacity,['credits','efficiency','teachingRequired'])||!Number.isInteger(record.capacity.credits)||record.capacity.credits<8||record.capacity.credits>12||!Number.isFinite(record.capacity.efficiency)||record.capacity.efficiency<.78||record.capacity.efficiency>1.2||typeof record.capacity.teachingRequired!=='boolean'))return false;
 if(record.funding!==undefined&&(!exact(record.funding,['pi','total','pool','operating'])||!Number.isInteger(record.funding.pi)||record.funding.pi<0||record.funding.pi>3||!Number.isInteger(record.funding.total)||record.funding.total<record.funding.pi||record.funding.total>5||![record.funding.pool,record.funding.operating].every(n=>Number.isFinite(n)&&n>=0&&n<=5000)))return false;
 if(record.impact!==undefined&&(!exact(record.impact,['hIndex','citations'])||!Number.isInteger(record.impact.hIndex)||record.impact.hIndex<0||record.impact.hIndex>record.outputs.papers||!Array.isArray(record.impact.citations)||record.impact.citations.length>record.outputs.papers||!record.impact.citations.every(n=>Number.isInteger(n)&&n>=0&&n<=100000)))return false;
 if(record.ending!==null&&!outcomes.includes(record.ending))return false;
 if(record.issues!==undefined&&(!Array.isArray(record.issues)||record.issues.length>8||!record.issues.every(h=>plain(h)&&Object.keys(h).length===2&&Object.hasOwn(ISSUE_CHOICES,h.id)&&ISSUE_CHOICES[h.id].includes(h.choice))))return false;
 return Array.isArray(record.events)&&record.events.length<=16&&record.events.every(h=>plain(h)&&Object.keys(h).length===2&&EVENTS.some(e=>e.id===h.id&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<(e.options?.length??e.optionCount)));
}
async function body(request,limit=20000){if(Number(request.headers.get('Content-Length')||0)>limit)throw new Error('size');const reader=request.body?.getReader();if(!reader)throw new SyntaxError('body');const parts=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('size');}parts.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}return JSON.parse(new TextDecoder().decode(bytes));}
const LEGACY_WHERE="consent_version IS NULL OR consent_version != ? OR retention_until IS NULL OR edition IS NULL";
const CURRENT_WHERE="consent_version = ? AND retention_until > ? AND edition IN ('ko','en')";
const validProfile=data=>plain(data)&&Object.keys(data).every(k=>['version','fieldId','institution','labMode','edition'].includes(k))&&validAnalyticsVersion(data.version)&&DISCIPLINES.some(d=>d.id===data.fieldId)&&['national','private','institute'].includes(data.institution)&&['dry','wet'].includes(data.labMode)&&['ko','en'].includes(data.edition);
async function authorizeRun(request,env,id,{allowExpiredToken=false}={}){
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!token||!/^[a-f0-9]{64}$/.test(token))return false;
 const row=await env.DB.prepare('SELECT token_hash,expires_at,retention_until,consent_version,edition FROM game_runs WHERE id = ?').bind(id).first();
 const now=Date.now();
 return !!row&&row.consent_version===ANALYTICS_POLICY_VERSION&&['ko','en'].includes(row.edition)&&row.retention_until>now&&(allowExpiredToken||row.expires_at>now)&&row.token_hash===await hash(token);
}
async function cleanup(env){
 const now=Date.now(),policy=ANALYTICS_POLICY_VERSION;
 const count=async predicate=>({runs:await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE '+predicate.sql).bind(...predicate.args).first(),months:await env.DB.prepare('SELECT COUNT(*) AS n FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE '+predicate.sql+')').bind(...predicate.args).first()});
 const legacy={sql:LEGACY_WHERE,args:[policy]},expired={sql:'consent_version = ? AND retention_until <= ?',args:[policy,now]};
 const beforeLegacy=await count(legacy),beforeExpired=await count(expired);
 // D1 batch is transactional. NULL/obsolete policy rows disappear once and
 // cannot be promoted to longer retention by a migration or an old token.
 await env.DB.batch([
  env.DB.prepare('DELETE FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE '+LEGACY_WHERE+')').bind(policy),
  env.DB.prepare('DELETE FROM game_runs WHERE '+LEGACY_WHERE).bind(policy),
  env.DB.prepare('DELETE FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE consent_version = ? AND retention_until <= ?)').bind(policy,now),
  env.DB.prepare('DELETE FROM game_runs WHERE consent_version = ? AND retention_until <= ?').bind(policy,now)
 ]);
 const afterLegacy=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE '+LEGACY_WHERE).bind(policy).first();
 const afterExpired=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE consent_version = ? AND retention_until <= ?').bind(policy,now).first();
 return {legacyDeleted:beforeLegacy.runs.n-afterLegacy.n,legacyMonthlyDeleted:beforeLegacy.months.n,legacyRemaining:afterLegacy.n,expiredDeleted:beforeExpired.runs.n-afterExpired.n,expiredMonthlyDeleted:beforeExpired.months.n,expiredRemaining:afterExpired.n,retentionYears:ANALYTICS_RETENTION_YEARS};
}
// Trusted Worker lifecycle hook; HTTP maintenance still requires ADMIN_KEY.
export async function analyticsMaintenance(env){if(!env.DB)return {error:'Database unavailable'};return cleanup(env);}
const RETENTION_BATCH_LIMIT=500;
// The same candidate subquery runs inside one D1 transaction. Removing monthly
// rows does not change the selected runs, so the parent deletion uses the exact
// same bounded set without binding hundreds of IDs or relying on cascade.
export async function analyticsRetentionBatch(env){
 if(!env.DB)throw new Error('Database unavailable');
 const cutoff=Date.now(),policy=ANALYTICS_POLICY_VERSION;
 const predicate='('+LEGACY_WHERE+') OR (consent_version = ? AND retention_until <= ?)';
 const candidate='SELECT id FROM game_runs WHERE '+predicate+' ORDER BY COALESCE(retention_until,created_at),id LIMIT ?';
 const args=[policy,policy,cutoff];
 const results=await env.DB.batch([
  env.DB.prepare('DELETE FROM game_months WHERE run_id IN ('+candidate+')').bind(...args,RETENTION_BATCH_LIMIT),
  env.DB.prepare('DELETE FROM game_runs WHERE id IN ('+candidate+')').bind(...args,RETENTION_BATCH_LIMIT)
 ]);
 const changed=index=>{const n=results[index]?.meta?.changes;if(!Number.isInteger(n)||n<0)throw new Error('Invalid maintenance result');return n;};
 const remaining=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE '+predicate).bind(...args).first();
 const remainingMonths=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE '+predicate+')').bind(...args).first();
 return {cutoff,deletedRuns:changed(1),deletedMonthlyRecords:changed(0),remainingRuns:remaining.n,remainingMonthlyRecords:remainingMonths.n,complete:remaining.n===0,batchLimit:RETENTION_BATCH_LIMIT,retentionYears:ANALYTICS_RETENTION_YEARS};
}
async function purgeCurrentAnalytics(env){
 const policy=ANALYTICS_POLICY_VERSION;
 const runs=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE consent_version = ?').bind(policy).first();
 const months=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE consent_version = ?)').bind(policy).first();
 await env.DB.batch([env.DB.prepare('DELETE FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE consent_version = ?)').bind(policy),env.DB.prepare('DELETE FROM game_runs WHERE consent_version = ?').bind(policy)]);
 return {currentDeleted:runs.n,currentMonthlyDeleted:months.n,reason:'purpose-complete'};
}
async function admin(request,env){const supplied=request.headers.get('Authorization')?.replace(/^Bearer /,'');return typeof env.ADMIN_KEY==='string'&&env.ADMIN_KEY.length>=32&&typeof supplied==='string'&&supplied.length<=256&&await hash(supplied)===await hash(env.ADMIN_KEY);}
async function retentionOperator(request,env){
 const supplied=request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1],secret=env.RETENTION_MAINTENANCE_KEY;
 return typeof secret==='string'&&secret.length>=32&&secret.length<=256&&typeof supplied==='string'&&supplied.length>=32&&supplied.length<=256&&await hash(supplied)===await hash(secret);
}
export async function analyticsAPI(request,env){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/'))return null;
 if(path==='/api/maintenance/analytics-retention'&&request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
 const origin=request.headers.get('Origin'),cors=allowedOrigin(request)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'POST, DELETE, OPTIONS'}:{};
 if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigin(request)?204:403,headers:cors});
 if(!env.DB)return json({error:'Database unavailable'},503,cors);
 try{
  if(path==='/api/maintenance/analytics-retention'){
   if(!await retentionOperator(request,env))return json({error:'Unauthorized'},401);
   const data=await body(request,1024);
   if(!plain(data)||Object.keys(data).length!==1||data.consent!==ANALYTICS_POLICY_VERSION)return json({error:'Current policy acknowledgment required'},400);
   return json(await analyticsRetentionBatch(env));
  }
  if(path==='/api/admin/policy-maintenance'&&request.method==='POST'){
   if(!await admin(request,env))return json({error:'Unauthorized'},401);
   const data=await body(request);
   const routine=plain(data)&&Object.keys(data).length===1&&data.consent===ANALYTICS_POLICY_VERSION;
   const purposeComplete=plain(data)&&Object.keys(data).length===3&&Object.keys(data).every(k=>['consent','purgeCurrent','reason'].includes(k))&&data.consent===ANALYTICS_POLICY_VERSION&&data.purgeCurrent===true&&data.reason==='purpose-complete';
   if(!routine&&!purposeComplete)return json({error:'Current policy acknowledgment and explicit purge reason required'},400);
   const maintenance=await cleanup(env);
   return json(purposeComplete?{...maintenance,...await purgeCurrentAnalytics(env)}:maintenance);
  }
  if(path==='/api/admin/import'&&request.method==='POST'){
   if(!await admin(request,env))return json({error:'Unauthorized'},401);
   const run=await body(request,500000);
   if(!plain(run)||Object.keys(run).some(k=>!['id','profile','records','consent'].includes(k))||run.consent!==ANALYTICS_POLICY_VERSION||typeof run.id!=='string'||!/^[a-f0-9-]{36}$/.test(run.id)||!Array.isArray(run.records)||run.records.length>97||!run.records.every(validRecord)||new Set(run.records.map(r=>r.month)).size!==run.records.length||!validProfile(run.profile))return json({error:'Invalid anonymous run'},400);
   await cleanup(env);
   const existing=await env.DB.prepare('SELECT id,version,field_id,institution,lab_mode,edition FROM game_runs WHERE id = ?').bind(run.id).first(),now=Date.now();
   if(existing&&(existing.edition!==run.profile.edition||existing.version!==run.profile.version||existing.field_id!==run.profile.fieldId||existing.institution!==run.profile.institution||existing.lab_mode!==run.profile.labMode))return json({error:'Run profile mismatch'},409);
   if(!existing)await env.DB.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode,consent_version,retention_until,edition) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(run.id,await hash(crypto.randomUUID()),now,now+ANALYTICS_TOKEN_DAYS*86400000,run.profile.version,run.profile.fieldId,run.profile.institution,run.profile.labMode,ANALYTICS_POLICY_VERSION,analyticsRetentionUntil(now),run.profile.edition).run();
   await env.DB.batch(run.records.map(r=>env.DB.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?) ON CONFLICT(run_id,month) DO UPDATE SET record=excluded.record').bind(run.id,r.month,JSON.stringify({...r,student:mergeRelationship(r.student)}),now)));return json({imported:run.records.length});
  }
  if(path==='/api/admin/summary'||path==='/api/admin/export'){
   if(!await admin(request,env))return json({error:'Unauthorized'},401);
   if(request.method!=='GET')return json({error:'Method not allowed'},405);
   await cleanup(env);
   const now=Date.now(),policy=ANALYTICS_POLICY_VERSION;
   if(path.endsWith('export')){const rows=await env.DB.prepare("SELECT r.id,r.version,r.field_id,r.institution,r.lab_mode,r.edition,r.consent_version,r.retention_until,m.month,m.record FROM game_runs r JOIN game_months m ON m.run_id=r.id WHERE r.consent_version = ? AND r.retention_until > ? AND r.edition IN ('ko','en') ORDER BY r.created_at DESC,m.month LIMIT 20000").bind(policy,now).all();return json({records:rows.results,retentionYears:ANALYTICS_RETENTION_YEARS});}
   const summary=await env.DB.prepare("SELECT json_extract(m.record,'$.ending') AS ending, COUNT(*) AS runs FROM game_months m JOIN game_runs r ON r.id=m.run_id WHERE r.consent_version = ? AND r.retention_until > ? AND r.edition IN ('ko','en') AND m.month=(SELECT MAX(last.month) FROM game_months last WHERE last.run_id=m.run_id) AND json_extract(m.record,'$.ending') IS NOT NULL GROUP BY ending").bind(policy,now).all();
   const counts=await env.DB.prepare('SELECT COUNT(*) AS runs FROM game_runs WHERE '+CURRENT_WHERE).bind(policy,now).first();
   const months=await env.DB.prepare("SELECT COUNT(*) AS records FROM game_months m JOIN game_runs r ON r.id=m.run_id WHERE r.consent_version = ? AND r.retention_until > ? AND r.edition IN ('ko','en')").bind(policy,now).first();
   const editions=await env.DB.prepare('SELECT edition,COUNT(*) AS runs FROM game_runs WHERE '+CURRENT_WHERE+' GROUP BY edition').bind(policy,now).all();
   return json({runs:counts.runs,monthlyRecords:months.records,endings:summary.results,editions:editions.results,retentionYears:ANALYTICS_RETENTION_YEARS});
  }
  if(!allowedOrigin(request))return json({error:'Origin denied'},403);
  if(path==='/api/runs'&&request.method==='POST'){
   const data=await body(request),profile=plain(data)?Object.fromEntries(Object.entries(data).filter(([key])=>key!=='consent')):null;
   if(!plain(data)||data.consent!==ANALYTICS_POLICY_VERSION||!validProfile(profile))return json({error:'Invalid run'},400,cors);
   const maintenance=await cleanup(env),now=Date.now();
   // Capacity covers all retained records, including those with expired write
   // tokens. Token expiry must not evade the collection bound.
   const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE '+CURRENT_WHERE).bind(ANALYTICS_POLICY_VERSION,now).first();if(count.n>=50000)return json({error:'Collection capacity reached'},429,cors);
   const id=crypto.randomUUID(),token=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join(''),expiresAt=now+ANALYTICS_TOKEN_DAYS*86400000,retentionUntil=analyticsRetentionUntil(now);
   await env.DB.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode,consent_version,retention_until,edition) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id,await hash(token),now,expiresAt,data.version,data.fieldId,data.institution,data.labMode,ANALYTICS_POLICY_VERSION,retentionUntil,data.edition).run();
   return json({id,token,expiresAt,retentionUntil,consentVersion:ANALYTICS_POLICY_VERSION,edition:data.edition,maintenance},201,cors);
  }
  const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})$/);
  if(match){
   const id=match[1];if(!await authorizeRun(request,env,id,{allowExpiredToken:request.method==='DELETE'}))return json({error:'Unauthorized'},401,cors);
   if(request.method==='DELETE'){await env.DB.batch([env.DB.prepare('DELETE FROM game_months WHERE run_id = ?').bind(id),env.DB.prepare('DELETE FROM game_runs WHERE id = ?').bind(id)]);return json({deleted:true},200,cors);}
   if(request.method==='POST'){const record=await body(request);if(!validRecord(record))return json({error:'Invalid record'},400,cors);await cleanup(env);await env.DB.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?) ON CONFLICT(run_id,month) DO UPDATE SET record=excluded.record').bind(id,record.month,JSON.stringify({...record,student:mergeRelationship(record.student)}),Date.now()).run();return json({saved:true},200,cors);}
  }
  return json({error:'Not found'},404,cors);
 }catch(error){return json({error:error.message==='size'?'Request too large':error instanceof SyntaxError?'Invalid JSON':'Storage temporarily unavailable'},error.message==='size'?413:error instanceof SyntaxError?400:503,cors);}
}
