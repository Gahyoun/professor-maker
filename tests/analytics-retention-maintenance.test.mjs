import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {analyticsAPI,analyticsRetentionBatch} from '../backend/api.js';
import {ANALYTICS_POLICY_VERSION} from '../dist/analytics-policy.js';

const origin='https://professor-maker.gahyoun.chatgpt.site';
const path='/api/maintenance/analytics-retention';
const routineBody={consent:ANALYTICS_POLICY_VERSION};
function environment(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 const journal=JSON.parse(fs.readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
 for(const entry of journal.entries)db.exec(fs.readFileSync(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8'));
 const env={db,ADMIN_KEY:'a'.repeat(64),RETENTION_MAINTENANCE_KEY:'r'.repeat(64),failParent:false,close:()=>db.close()};
 env.DB={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async run(){if(env.failParent&&sql.startsWith('DELETE FROM game_runs WHERE id IN'))throw new Error('secret-database-details');const result=db.prepare(sql).run(...args);return {success:true,meta:{changes:Number(result.changes)}};}};},async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}};
 return env;
}
function request(env,{method='POST',token=env.RETENTION_MAINTENANCE_KEY,data=routineBody,target=path,authorization}={}){
 return new Request(origin+target,{method,headers:{...(token?{Authorization:authorization??'Bearer '+token}:{}),...(data!==undefined&&!['GET','HEAD'].includes(method)?{'Content-Type':'application/json'}:{})},body:data!==undefined&&!['GET','HEAD'].includes(method)?JSON.stringify(data):undefined});
}
function seed(env,{policy=ANALYTICS_POLICY_VERSION,retention=Date.now()-1,edition='ko',expires=Date.now()-1,months=2}={}){
 const id=crypto.randomUUID(),now=Date.now();
 env.db.prepare('INSERT INTO game_runs (id,token_hash,created_at,expires_at,version,field_id,institution,lab_mode,consent_version,retention_until,edition) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,'never-exposed-hash',now,expires,'4.22.0','050','national','dry',policy,retention,edition);
 for(let month=0;month<months;month++)env.db.prepare('INSERT INTO game_months (run_id,month,record,created_at) VALUES (?,?,?,?)').run(id,month,JSON.stringify({month}),now);
 return id;
}
const counts=env=>({runs:env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,months:env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n});

test('released 4.23.0 profiles register and import with the unchanged fresh-consent policy',async()=>{
 const env=environment();try{
  for(const edition of ['ko','en']){
   const profile={version:'4.23.0',fieldId:'050',institution:'national',labMode:'dry',edition};
   assert.equal((await analyticsAPI(request(env,{target:'/api/runs',token:null,data:{...profile,consent:ANALYTICS_POLICY_VERSION}}),env)).status,403);
   const registration=new Request(origin+'/api/runs',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...profile,consent:ANALYTICS_POLICY_VERSION})});
   assert.equal((await analyticsAPI(registration,env)).status,201);
   assert.equal((await analyticsAPI(request(env,{target:'/api/admin/import',token:env.ADMIN_KEY,data:{id:crypto.randomUUID(),consent:ANALYTICS_POLICY_VERSION,profile,records:[]}}),env)).status,200);
  }
 }finally{env.close();}
});

test('unattended retention POST requires its separate bearer key and a strict routine-only body',async()=>{
 const env=environment();try{
  seed(env);
  for(const token of [null,'wrong-key',env.ADMIN_KEY])assert.equal((await analyticsAPI(request(env,{token}),env)).status,401);
  for(const authorization of [env.RETENTION_MAINTENANCE_KEY,'Basic '+env.RETENTION_MAINTENANCE_KEY,'Bearer '+env.RETENTION_MAINTENANCE_KEY+' extra'])assert.equal((await analyticsAPI(request(env,{authorization}),env)).status,401);
  for(const secret of [undefined,'short']){const previous=env.RETENTION_MAINTENANCE_KEY;env.RETENTION_MAINTENANCE_KEY=secret;assert.equal((await analyticsAPI(request(env,{token:previous}),env)).status,401);env.RETENTION_MAINTENANCE_KEY=previous;}
  for(const data of [null,[],{}, {consent:'anonymous-gameplay-v1'}, {...routineBody,extra:true}, {...routineBody,purgeCurrent:true,reason:'purpose-complete'}, {...routineBody,limit:5000}])assert.equal((await analyticsAPI(request(env,{data}),env)).status,400);
  for(const method of ['GET','HEAD','DELETE','PUT','OPTIONS']){const response=await analyticsAPI(request(env,{method}),env);assert.equal(response.status,405);assert.equal(response.headers.get('Allow'),'POST');}
  assert.deepEqual(counts(env),{runs:1,months:2});
  const response=await analyticsAPI(request(env),env);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
  const result=await response.json();assert.equal(result.deletedRuns,1);assert.equal(result.deletedMonthlyRecords,2);assert.equal(result.complete,true);
 }finally{env.close();}
});

test('retention maintenance key cannot read, import, export, or explicitly purge valid analytics',async()=>{
 const env=environment();try{
  seed(env,{retention:Date.now()+86400000});
  for(const target of ['/api/admin/summary','/api/admin/export'])assert.equal((await analyticsAPI(request(env,{target,method:'GET'}),env)).status,401);
  for(const target of ['/api/admin/import','/api/admin/policy-maintenance'])assert.equal((await analyticsAPI(request(env,{target,data:{...routineBody,purgeCurrent:true,reason:'purpose-complete'}}),env)).status,401);
  assert.deepEqual(counts(env),{runs:1,months:2});
 }finally{env.close();}
});

test('direct unattended sweep deletes exact-deadline and legacy rows without any visit or analytics API request',async context=>{
 const cutoff=Date.UTC(2031,9,12,9,0,0);context.mock.method(Date,'now',()=>cutoff);
 const env=environment();try{
  seed(env,{edition:'ko',retention:cutoff-1});seed(env,{edition:'en',retention:cutoff});
  seed(env,{policy:null,retention:null,edition:null,months:1});seed(env,{policy:'anonymous-gameplay-v1',retention:cutoff+86400000,edition:'en',months:1});
  const retained=[seed(env,{retention:cutoff+1,edition:'ko'}),seed(env,{retention:cutoff+86400000,edition:'en',expires:cutoff-90*86400000})];
  // This lifecycle function has no Request argument and needs no browser or
  // upload. A scheduler can run it after the site has been idle for years.
  const result=await analyticsRetentionBatch(env);
  assert.deepEqual(result,{cutoff,deletedRuns:4,deletedMonthlyRecords:6,remainingRuns:0,remainingMonthlyRecords:0,complete:true,batchLimit:500,retentionYears:5});
  assert.deepEqual(env.db.prepare('SELECT id FROM game_runs ORDER BY id').all().map(row=>row.id),retained.sort());assert.deepEqual(counts(env),{runs:2,months:4});
  assert.deepEqual(Object.keys(result).sort(),['cutoff','deletedRuns','deletedMonthlyRecords','remainingRuns','remainingMonthlyRecords','complete','batchLimit','retentionYears'].sort());
  assert.equal(JSON.stringify(result).includes('never-exposed-hash'),false);assert.equal(JSON.stringify(result).includes(retained[0]),false);
  const again=await analyticsRetentionBatch(env);assert.equal(again.deletedRuns,0);assert.equal(again.deletedMonthlyRecords,0);assert.equal(again.complete,true);assert.deepEqual(counts(env),{runs:2,months:4});
 }finally{env.close();}
});

test('routine sweep is bounded to 500 runs and repeated calls fully drain an expired backlog',async context=>{
 const cutoff=Date.UTC(2031,9,12);context.mock.method(Date,'now',()=>cutoff);
 const env=environment();try{
  for(let i=0;i<1002;i++)seed(env,{edition:i%2?'en':'ko',retention:cutoff-i,months:2});
  const retained=seed(env,{retention:cutoff+1,expires:cutoff-1,months:3});
  for(const expected of [{deleted:500,remaining:502},{deleted:500,remaining:2},{deleted:2,remaining:0}]){
   const result=await analyticsRetentionBatch(env);assert.equal(result.deletedRuns,expected.deleted);assert.equal(result.deletedMonthlyRecords,expected.deleted*2);assert.equal(result.remainingRuns,expected.remaining);assert.equal(result.remainingMonthlyRecords,expected.remaining*2);assert.equal(result.complete,expected.remaining===0);
  }
  assert.deepEqual(counts(env),{runs:1,months:3});assert.equal(env.db.prepare('SELECT id FROM game_runs').get().id,retained);
  assert.equal((await analyticsRetentionBatch(env)).deletedRuns,0);
 }finally{env.close();}
});

test('failure rolls back both deletion statements and returns no private storage details',async()=>{
 const env=environment();try{
  seed(env);env.failParent=true;
  const response=await analyticsAPI(request(env),env);assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'Storage temporarily unavailable'});assert.deepEqual(counts(env),{runs:1,months:2});
  env.failParent=false;
  const retried=await analyticsRetentionBatch(env);assert.equal(retried.deletedRuns,1);assert.equal(retried.deletedMonthlyRecords,2);assert.deepEqual(counts(env),{runs:0,months:0});
 }finally{env.close();}
});
