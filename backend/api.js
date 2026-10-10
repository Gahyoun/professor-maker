import {ISSUE_CHOICES} from '../dist/monthly-choices.js';
import {mergeRelationship} from '../dist/relationship.js';
import {HIDDEN_RANGES,ACTIVITIES,LEGACY_ACTIVITIES,EVENTS} from '../dist/engine.js';
import {DISCIPLINES} from '../dist/disciplines.js';
// Exact released schemas only; registration and administrator import share this gate.
const SUPPORTED_ANALYTICS_VERSIONS=Object.freeze(['4.1.0','4.2.0','4.3.0','4.4.0','4.5.0','4.6.0','4.7.0','4.8.0','4.9.0','4.10.0','4.11.0','4.12.0','4.13.0','4.13.1','4.13.2','4.13.3']);
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
async function authorizeRun(request,env,id){const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))return false;const row=await env.DB.prepare('SELECT token_hash, expires_at FROM game_runs WHERE id = ?').bind(id).first();return row&&row.expires_at>Date.now()&&row.token_hash===await hash(token);}
async function cleanup(env){const now=Date.now();await env.DB.batch([env.DB.prepare('DELETE FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE expires_at <= ? LIMIT 1000)').bind(now),env.DB.prepare('DELETE FROM game_runs WHERE id IN (SELECT id FROM game_runs WHERE expires_at <= ? LIMIT 1000)').bind(now)]);}
async function admin(request,env){const supplied=request.headers.get('Authorization')?.replace(/^Bearer /,'');return typeof env.ADMIN_KEY==='string'&&env.ADMIN_KEY.length>=32&&typeof supplied==='string'&&supplied.length<=256&&await hash(supplied)===await hash(env.ADMIN_KEY);}
export async function analyticsAPI(request,env){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/'))return null;
 const origin=request.headers.get('Origin'),cors=allowedOrigin(request)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'POST, DELETE, OPTIONS'}:{};
 if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigin(request)?204:403,headers:cors});
 if(!env.DB)return json({error:'Database unavailable'},503,cors);
 try{
  if(path==='/api/admin/import'&&request.method==='POST'){
   if(!await admin(request,env))return json({error:'Unauthorized'},401);
   await cleanup(env);
   const run=await body(request,500000);
   if(!plain(run)||Object.keys(run).some(k=>!['id','profile','records','consent'].includes(k))||run.consent!=='anonymous-gameplay-v1'||typeof run.id!=='string'||!/^[a-f0-9-]{36}$/.test(run.id)||!Array.isArray(run.records)||run.records.length>97||!run.records.every(validRecord)||new Set(run.records.map(r=>r.month)).size!==run.records.length||!plain(run.profile)||Object.keys(run.profile).some(k=>!['version','fieldId','institution','labMode'].includes(k))||!validAnalyticsVersion(run.profile.version)||!DISCIPLINES.some(d=>d.id===run.profile.fieldId)||!['national','private','institute'].includes(run.profile.institution)||!['dry','wet'].includes(run.profile.labMode))return json({error:'Invalid anonymous run'},400);
   const existing=await env.DB.prepare('SELECT id FROM game_runs WHERE id = ?').bind(run.id).first();const now=Date.now();
   if(!existing)await env.DB.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode) VALUES (?,?,?,?,?,?,?,?)').bind(run.id,await hash(crypto.randomUUID()),now,now+90*86400000,run.profile.version,run.profile.fieldId,run.profile.institution,run.profile.labMode).run();
   await env.DB.batch(run.records.map(r=>env.DB.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?) ON CONFLICT(run_id,month) DO UPDATE SET record=excluded.record').bind(run.id,r.month,JSON.stringify({...r,student:mergeRelationship(r.student)}),now)));return json({imported:run.records.length});
  }
  if(path==='/api/admin/summary'||path==='/api/admin/export'){
   if(!await admin(request,env))return json({error:'Unauthorized'},401);
   await cleanup(env);
   if(request.method!=='GET')return json({error:'Method not allowed'},405);
   if(path.endsWith('export')){const rows=await env.DB.prepare('SELECT r.id,r.version,r.field_id,r.institution,r.lab_mode,m.month,m.record FROM game_runs r JOIN game_months m ON m.run_id=r.id WHERE r.expires_at > ? ORDER BY r.created_at DESC,m.month LIMIT 20000').bind(Date.now()).all();return json({records:rows.results});}
   const summary=await env.DB.prepare("SELECT json_extract(m.record,'$.ending') AS ending, COUNT(*) AS runs FROM game_months m JOIN game_runs r ON r.id=m.run_id WHERE r.expires_at > ? AND m.month=(SELECT MAX(last.month) FROM game_months last WHERE last.run_id=m.run_id) AND json_extract(m.record,'$.ending') IS NOT NULL GROUP BY ending").bind(Date.now()).all();
   const counts=await env.DB.prepare('SELECT COUNT(*) AS runs FROM game_runs WHERE expires_at > ?').bind(Date.now()).first();
   const months=await env.DB.prepare('SELECT COUNT(*) AS records FROM game_months m JOIN game_runs r ON r.id=m.run_id WHERE r.expires_at > ?').bind(Date.now()).first();return json({runs:counts.runs,monthlyRecords:months.records,endings:summary.results,retentionDays:90});
  }
  if(!allowedOrigin(request))return json({error:'Origin denied'},403);
  if(path==='/api/runs'&&request.method==='POST'){
   const data=await body(request);
   if(!plain(data)||Object.keys(data).some(k=>!['consent','version','fieldId','institution','labMode'].includes(k))||data.consent!=='anonymous-gameplay-v1'||!validAnalyticsVersion(data.version)||!DISCIPLINES.some(d=>d.id===data.fieldId)||!['national','private','institute'].includes(data.institution)||!['wet','dry'].includes(data.labMode))return json({error:'Invalid run'},400,cors);
   // Stop accepting new records before an unbounded database grows.
   const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM game_runs WHERE expires_at > ?').bind(Date.now()).first();if(count.n>=50000)return json({error:'Collection capacity reached'},429,cors);
   const id=crypto.randomUUID(),token=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join(''),now=Date.now();
   await env.DB.batch([env.DB.prepare('DELETE FROM game_months WHERE run_id IN (SELECT id FROM game_runs WHERE expires_at < ? LIMIT 1000)').bind(now),env.DB.prepare('DELETE FROM game_runs WHERE id IN (SELECT id FROM game_runs WHERE expires_at < ? LIMIT 1000)').bind(now),env.DB.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode) VALUES (?,?,?,?,?,?,?,?)').bind(id,await hash(token),now,now+90*86400000,data.version,data.fieldId,data.institution,data.labMode)]);
   return json({id,token,expiresAt:now+90*86400000},201,cors);
  }
  const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})$/);
  if(match){const id=match[1];if(!await authorizeRun(request,env,id))return json({error:'Unauthorized'},401,cors);
   if(request.method==='DELETE'){await env.DB.batch([env.DB.prepare('DELETE FROM game_months WHERE run_id = ?').bind(id),env.DB.prepare('DELETE FROM game_runs WHERE id = ?').bind(id)]);return json({deleted:true},200,cors);}
   if(request.method==='POST'){const record=await body(request);if(!validRecord(record))return json({error:'Invalid record'},400,cors);await env.DB.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?) ON CONFLICT(run_id,month) DO UPDATE SET record=excluded.record').bind(id,record.month,JSON.stringify({...record,student:mergeRelationship(record.student)}),Date.now()).run();return json({saved:true},200,cors);}
  }
  return json({error:'Not found'},404,cors);
 }catch(error){return json({error:error.message==='size'?'Request too large':error instanceof SyntaxError?'Invalid JSON':'Storage temporarily unavailable'},error.message==='size'?413:error instanceof SyntaxError?400:503,cors);}
}
