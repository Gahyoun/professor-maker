import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {analyticsAPI,analyticsMaintenance} from '../backend/api.js';
import {createState,DEFAULT_POLICIES} from '../dist/engine.js';
import {ANALYTICS_POLICY_VERSION,ANALYTICS_RETENTION_YEARS,ANALYTICS_TOKEN_DAYS,analyticsRetentionUntil} from '../dist/analytics-policy.js';

const schema=index=>fs.readFileSync(new URL('../drizzle/'+JSON.parse(fs.readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8')).entries[index].tag+'.sql',import.meta.url),'utf8');
function environment({legacySchema=false}={}){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(schema(0));if(!legacySchema)db.exec(schema(1));
 const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}};},async batch(statements){db.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
 return {DB,db,ADMIN_KEY:'a'.repeat(64),close:()=>db.close()};
}
const request=(path,{method='GET',data,token,origin='https://professor-maker.gahyoun.chatgpt.site'}={})=>new Request('https://professor-maker.gahyoun.chatgpt.site'+path,{method,headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
const profile=(edition='ko')=>({version:'4.22.0',fieldId:'050',institution:'national',labMode:'dry',edition});
const registration=(edition='ko')=>({...profile(edition),consent:ANALYTICS_POLICY_VERSION});
function record(month=1){const s=createState('Never collected',22);return {month,plan:s.plan,feedback:'listen',policies:DEFAULT_POLICIES,stipend:60,student:s.hidden,faculty:s.professor,outputs:{papers:0,submissions:0,conferences:0,awards:0,completedProjects:0},ending:null,events:[]};}
async function start(env,edition='ko'){const response=await analyticsAPI(request('/api/runs',{method:'POST',data:registration(edition)}),env);assert.equal(response.status,201);return response.json();}
function seedRun(env,{policy=null,retention=null,edition=null,months=1,expires=Date.now()+86400000}={}){
 const id=crypto.randomUUID(),now=Date.now();
 env.db.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode,consent_version,retention_until,edition) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,'unusable-test-hash',now,expires,'4.16.0','050','national','dry',policy,retention,edition);
 for(let month=1;month<=months;month++)env.db.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?)').run(id,month,JSON.stringify(record(month)),now);
 return id;
}

test('retention is five UTC calendar years with leap-day clamp and exact time preservation',()=>{
 assert.equal(ANALYTICS_RETENTION_YEARS,5);assert.equal(ANALYTICS_TOKEN_DAYS,90);
 assert.equal(new Date(analyticsRetentionUntil(Date.UTC(2024,1,29,18,23,45,321))).toISOString(),'2029-02-28T18:23:45.321Z');
 assert.equal(new Date(analyticsRetentionUntil(Date.UTC(2026,9,12,7,8,9,123))).toISOString(),'2031-10-12T07:08:09.123Z');
 assert.equal(new Date(analyticsRetentionUntil(Date.UTC(2023,2,31,23,59,59))).toISOString(),'2028-03-31T23:59:59.000Z');
 for(const value of [NaN,Infinity,-1,1.5,'1791800000000',Number.MAX_SAFE_INTEGER])assert.throws(()=>analyticsRetentionUntil(value),RangeError);
});

test('append-only migration preserves legacy rows until an authorized runtime sweep',async()=>{
 const env=environment({legacySchema:true});try{
  const id=crypto.randomUUID();env.db.prepare('INSERT INTO game_runs VALUES (?,?,?,?,?,?,?,?)').run(id,'legacy-test-hash',Date.now(),Date.now()+86400000,'4.16.0','050','national','dry');env.db.prepare('INSERT INTO game_months VALUES (?,?,?,?)').run(id,1,JSON.stringify(record()),Date.now());
  env.db.exec(schema(1));assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,1);assert.equal(env.db.prepare('SELECT consent_version,retention_until,edition FROM game_runs').get().consent_version,null);
  assert.equal((await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',data:{consent:ANALYTICS_POLICY_VERSION}}),env)).status,401);
  assert.equal((await analyticsAPI(request('/api/runs',{method:'POST',data:{...registration(),consent:'anonymous-gameplay-v1'}}),env)).status,400);
  assert.equal((await analyticsAPI(request('/api/runs',{method:'POST',data:registration(),origin:'https://untrusted.example'}),env)).status,403);
  assert.equal((await analyticsAPI(request('/api/runs/'+id,{method:'POST',data:record(),token:'b'.repeat(64)}),env)).status,401);
  assert.equal((await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data:{consent:'anonymous-gameplay-v1'}}),env)).status,400);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,1);
  const result=await (await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data:{consent:ANALYTICS_POLICY_VERSION}}),env)).json();assert.equal(result.legacyDeleted,1);assert.equal(result.legacyMonthlyDeleted,1);assert.equal(result.legacyRemaining,0);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,0);assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,0);
  assert.equal((await analyticsMaintenance(env)).legacyDeleted,0);
 }finally{env.close();}
});

test('authorized cleanup purges obsolete consent and expired retention once while keeping valid retained analytics',async()=>{
 const env=environment();try{
  seedRun(env,{months:2});seedRun(env,{policy:'anonymous-gameplay-v1',retention:Date.now()+86400000,edition:'en'});
  seedRun(env,{policy:ANALYTICS_POLICY_VERSION,retention:Date.now()-1,edition:'ko'});
  const retained=seedRun(env,{policy:ANALYTICS_POLICY_VERSION,retention:analyticsRetentionUntil(Date.now()),edition:'en',expires:Date.now()-1});
  const result=await analyticsMaintenance(env);assert.deepEqual(result,{legacyDeleted:2,legacyMonthlyDeleted:3,legacyRemaining:0,expiredDeleted:1,expiredMonthlyDeleted:1,expiredRemaining:0,retentionYears:5});
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,1);assert.equal(env.db.prepare('SELECT id FROM game_runs').get().id,retained);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,1);
  const repeat=await analyticsMaintenance(env);assert.equal(repeat.legacyDeleted,0);assert.equal(repeat.expiredDeleted,0);
  const exported=await (await analyticsAPI(request('/api/admin/export',{token:env.ADMIN_KEY}),env)).json();assert.equal(exported.records.length,1);assert.equal(exported.records[0].edition,'en');assert.equal(exported.records[0].consent_version,ANALYTICS_POLICY_VERSION);assert.equal(exported.retentionYears,5);
 }finally{env.close();}
});

test('fresh policy and explicit edition are mandatory on registration and administrative import',async()=>{
 const env=environment();try{
  for(const value of [null,'us','fr','',1])assert.equal((await analyticsAPI(request('/api/runs',{method:'POST',data:{...registration(),edition:value}}),env)).status,400);
  const missing=registration();delete missing.edition;assert.equal((await analyticsAPI(request('/api/runs',{method:'POST',data:missing}),env)).status,400);
  assert.equal((await analyticsAPI(request('/api/runs',{method:'POST',data:{...registration(),consent:'anonymous-gameplay-v1'}}),env)).status,400);
  for(const consent of [undefined,'anonymous-gameplay-v1'])assert.equal((await analyticsAPI(request('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:{id:crypto.randomUUID(),consent,profile:profile(),records:[record()]}}),env)).status,400);
  const ko=await start(env,'ko'),en=await start(env,'en');assert.equal(ko.edition,'ko');assert.equal(en.edition,'en');assert.equal(ko.consentVersion,ANALYTICS_POLICY_VERSION);assert.equal(ko.maintenance.legacyRemaining,0);
  const summary=await (await analyticsAPI(request('/api/admin/summary',{token:env.ADMIN_KEY}),env)).json();assert.deepEqual(summary.editions,[{edition:'en',runs:1},{edition:'ko',runs:1}]);assert.equal(summary.retentionYears,5);assert.equal(Object.hasOwn(summary,'retentionDays'),false);
 }finally{env.close();}
});

test('write tokens expire at 90 days while retention and authenticated withdrawal last up to five years',async context=>{
 let now=Date.UTC(2024,1,29,18,23,45,321);context.mock.method(Date,'now',()=>now);
 const env=environment();try{
  const session=await start(env),stored=env.db.prepare('SELECT * FROM game_runs WHERE id = ?').get(session.id);
  assert.equal(session.expiresAt,now+90*86400000);assert.equal(session.retentionUntil,Date.UTC(2029,1,28,18,23,45,321));assert.equal(stored.created_at,now);assert.equal(stored.retention_until,session.retentionUntil);
  assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'POST',data:record(),token:session.token}),env)).status,200);
  now=session.expiresAt;assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'POST',data:record(2),token:session.token}),env)).status,401);
  const summary=await (await analyticsAPI(request('/api/admin/summary',{token:env.ADMIN_KEY}),env)).json();assert.equal(summary.runs,1);assert.equal(summary.monthlyRecords,1);
  const exported=await (await analyticsAPI(request('/api/admin/export',{token:env.ADMIN_KEY}),env)).json();assert.equal(exported.records.length,1);
  assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'DELETE',token:'b'.repeat(64)}),env)).status,401);
  assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'DELETE',token:session.token}),env)).status,200);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,0);
 }finally{env.close();}
});

test('retention deadline is exclusive, and administrative sweeping physically removes expired records',async context=>{
 let now=Date.UTC(2026,9,12);context.mock.method(Date,'now',()=>now);
 const env=environment();try{
  const session=await start(env);assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'POST',data:record(),token:session.token}),env)).status,200);
  now=session.retentionUntil;
  assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'DELETE',token:session.token}),env)).status,401);
  const summary=await (await analyticsAPI(request('/api/admin/summary',{token:env.ADMIN_KEY}),env)).json();assert.equal(summary.runs,0);assert.equal(summary.monthlyRecords,0);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,0);assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,0);
 }finally{env.close();}
});

test('administrator import is idempotent without extending retention or changing an existing run edition',async context=>{
 let now=Date.UTC(2026,9,12);context.mock.method(Date,'now',()=>now);
 const env=environment();try{
  const run={id:crypto.randomUUID(),consent:ANALYTICS_POLICY_VERSION,profile:profile('ko'),records:[record()]};
  assert.equal((await analyticsAPI(request('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:run}),env)).status,200);
  const original=env.db.prepare('SELECT created_at,retention_until FROM game_runs WHERE id = ?').get(run.id);now+=30*86400000;
  assert.equal((await analyticsAPI(request('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:run}),env)).status,200);
  assert.deepEqual(env.db.prepare('SELECT created_at,retention_until FROM game_runs WHERE id = ?').get(run.id),original);
  assert.equal((await analyticsAPI(request('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:{...run,profile:profile('en')}}),env)).status,409);
  assert.equal(env.db.prepare('SELECT edition FROM game_runs WHERE id = ?').get(run.id).edition,'ko');assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,1);
 }finally{env.close();}
});

test('early purpose-completion purge requires administrator authorization and strict explicit confirmation',async()=>{
 const env=environment();try{
  const ko=await start(env,'ko'),en=await start(env,'en');
  for(const [session,month] of [[ko,1],[ko,2],[en,1]])assert.equal((await analyticsAPI(request('/api/runs/'+session.id,{method:'POST',data:record(month),token:session.token}),env)).status,200);
  const confirmed={consent:ANALYTICS_POLICY_VERSION,purgeCurrent:true,reason:'purpose-complete'};
  assert.equal((await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',data:confirmed}),env)).status,401);
  for(const data of [{consent:ANALYTICS_POLICY_VERSION,purgeCurrent:true},{...confirmed,purgeCurrent:'true'},{...confirmed,purgeCurrent:false},{...confirmed,reason:'expired'},{...confirmed,extra:true},{...confirmed,consent:'anonymous-gameplay-v1'}])assert.equal((await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data}),env)).status,400);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,2);assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,3);
  const ordinary=await (await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data:{consent:ANALYTICS_POLICY_VERSION}}),env)).json();assert.equal(Object.hasOwn(ordinary,'currentDeleted'),false);assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,2);
  const purged=await (await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data:confirmed}),env)).json();assert.equal(purged.currentDeleted,2);assert.equal(purged.currentMonthlyDeleted,3);assert.equal(purged.reason,'purpose-complete');
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,0);assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,0);
  const repeated=await (await analyticsAPI(request('/api/admin/policy-maintenance',{method:'POST',token:env.ADMIN_KEY,data:confirmed}),env)).json();assert.equal(repeated.currentDeleted,0);assert.equal(repeated.currentMonthlyDeleted,0);
 }finally{env.close();}
});
