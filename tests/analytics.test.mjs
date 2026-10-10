import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {analyticsAPI,validRecord} from '../backend/api.js';
import {createState,DEFAULT_POLICIES} from '../dist/engine.js';
function fixture(){const s=createState('이름은 수집하지 않음',22);return {month:1,plan:s.plan,feedback:'listen',policies:DEFAULT_POLICIES,stipend:60,student:s.hidden,faculty:s.professor,outputs:{papers:0,submissions:0,conferences:0,awards:0,completedProjects:0},ending:null,events:[]};}
function environment(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(fs.readFileSync(new URL('../drizzle/0000_game_analytics.sql',import.meta.url),'utf8'));const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}};},async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};return {DB,ADMIN_KEY:'a'.repeat(64),close:()=>db.close()};}
const req=(path,{method='GET',data,token,origin='http://127.0.0.1:4173'}={})=>new Request('http://127.0.0.1:4173'+path,{method,headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
test('record schema rejects identifying fields, invalid ranges and malicious event values',()=>{assert.ok(validRecord(fixture()));for(const bad of [{...fixture(),professorName:'실명'},{...fixture(),student:{...fixture().student,stress:101}},{...fixture(),events:[{id:'<script>',choice:0}]}])assert.equal(validRecord(bad),false);});
test('SQLite-backed API isolates sessions, deduplicates months, protects admin and deletes revoked records',async()=>{
 const env=environment();try{
 const start={consent:'anonymous-gameplay-v1',version:'4.4.0',fieldId:'050',institution:'national',labMode:'dry'};
 assert.equal((await analyticsAPI(req('/api/runs',{method:'POST',data:{...start,consent:false}}),env)).status,400);
 assert.equal((await analyticsAPI(req('/api/runs',{method:'POST',data:start,origin:'https://untrusted.example'}),env)).status,403);
 const result=await analyticsAPI(req('/api/runs',{method:'POST',data:start}),env);assert.equal(result.status,201);const session=await result.json();const path='/api/runs/'+session.id;
 assert.equal((await analyticsAPI(req(path,{method:'POST',data:fixture(),token:'b'.repeat(64)}),env)).status,401);
 for(let i=0;i<2;i++)assert.equal((await analyticsAPI(req(path,{method:'POST',data:fixture(),token:session.token}),env)).status,200);
 assert.equal((await analyticsAPI(req('/api/admin/summary'),env)).status,401);
 const summary=await (await analyticsAPI(req('/api/admin/summary',{token:env.ADMIN_KEY}),env)).json();assert.equal(summary.runs,1);assert.equal(summary.monthlyRecords,1);
 const rows=await (await analyticsAPI(req('/api/admin/export',{token:env.ADMIN_KEY}),env)).json();assert.equal(rows.records.length,1);assert.ok(!JSON.stringify(rows).includes('token_hash'));assert.ok(!JSON.stringify(rows).includes('professorName'));
 assert.equal((await analyticsAPI(req(path,{method:'DELETE',token:session.token}),env)).status,200);assert.equal((await analyticsAPI(req(path,{method:'POST',data:fixture(),token:session.token}),env)).status,401);
 }finally{env.close();}
});
test('private administrator can import anonymous exports idempotently without accepting names',async()=>{
 const env=environment();try{const run={id:crypto.randomUUID(),consent:'anonymous-gameplay-v1',profile:{version:'4.4.0',fieldId:'050',institution:'national',labMode:'dry'},records:[fixture(),{...fixture(),month:2,ending:'masters'}]};
 assert.equal((await analyticsAPI(req('/api/admin/import',{method:'POST',data:run}),env)).status,401);
 for(let i=0;i<2;i++)assert.equal((await analyticsAPI(req('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:run}),env)).status,200);
 const result=await (await analyticsAPI(req('/api/admin/summary',{token:env.ADMIN_KEY}),env)).json();assert.equal(result.runs,1);assert.equal(result.monthlyRecords,2);assert.equal(result.endings[0].runs,1);
 assert.equal((await analyticsAPI(req('/api/admin/import',{method:'POST',token:env.ADMIN_KEY,data:{...run,name:'실명'}}),env)).status,400);
 }finally{env.close();}
});
test('legacy relationship records normalize once in SQLite while current-version runs keep one relationship and exclude surnames',async()=>{
 const env=environment();try{
 const result=await analyticsAPI(req('/api/runs',{method:'POST',data:{consent:'anonymous-gameplay-v1',version:'4.5.0',fieldId:'050',institution:'national',labMode:'dry'}}),env);assert.equal(result.status,201);const session=await result.json(),record=fixture();record.student={...record.student,rapport:20,trust:80};
 assert.equal((await analyticsAPI(req('/api/runs/'+session.id,{method:'POST',data:record,token:session.token}),env)).status,200);const rows=await (await analyticsAPI(req('/api/admin/export',{token:env.ADMIN_KEY}),env)).json(),stored=JSON.parse(rows.records[0].record);assert.equal(stored.student.rapport,50);assert.equal(Object.hasOwn(stored.student,'trust'),false);
 assert.equal((await analyticsAPI(req('/api/runs/'+session.id,{method:'POST',data:{...record,professorSurname:'남궁'},token:session.token}),env)).status,400);
 }finally{env.close();}
});

test('anonymous issue choices accept only bounded known decisions and reject injected fields',()=>{const good={...fixture(),issues:[{id:'grant-selected',choice:'reserve'}]};assert.ok(validRecord(good));assert.equal(validRecord({...good,issues:[{id:'grant-selected',choice:'<script>'}]}),false);assert.equal(validRecord({...good,issues:[{id:'grant-selected',choice:'reserve',name:'실명'}]}),false);assert.equal(validRecord({...good,issues:Array(9).fill(good.issues[0])}),false);});
