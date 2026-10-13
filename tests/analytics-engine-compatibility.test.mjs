import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {analyticsAPI,validRecord} from '../backend/api.js';
import {analysisRecord} from '../dist/analytics.js';
import {ANALYTICS_POLICY_VERSION} from '../dist/analytics-policy.js';
import {createState,simulateMonth,decide,proposeSchedule,mastersEligible,qualificationStudy,studentTrainingActive} from '../dist/engine.js';
import {managedOptions,affordableEventChoice} from './play-support.mjs';

const version=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const site='https://professor-maker.gahyoun.chatgpt.site';
function request(path,data,token){
 return new Request(site+path,{method:'POST',headers:{Origin:site,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
}
function environment(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 const journal=JSON.parse(fs.readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
 for(const entry of journal.entries)db.exec(fs.readFileSync(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8'));
 const DB={
  prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}};},
  async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}
 };
 return {DB,db,close:()=>db.close()};
}
function pendingChoice(s,route='integrated'){
 const p=s.pending;
 if(p.kind==='event')return affordableEventChoice(s,p.id);
 if(p.kind==='thesis')return {draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'}[p.step];
 const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','conference-plan':p.scope==='domestic'?'student':'none','failure-counsel':'review','conversation-topic':'academic',story:'encourage','academic-exam':'support',route,'presentation-recovery':'rehearse','external-admission':'remain',masters:mastersEligible(s)?'graduate':s.mastersExtended?'graduate':'extend',qual:'exam',sabbatical:'home',service:'consult','service-review':'consult',defense:'defend'};
 assert.ok(Object.hasOwn(choices,p.kind),`Unhandled real decision ${p.kind}`);
 return choices[p.kind];
}

test('the current release registers both editions and stores real initial, monthly and decision records',async()=>{
 const env=environment();
 try{
  for(const locale of ['ko','en'])for(const [fieldId,labMode] of [['050','dry'],['056','wet']]){
   let s=createState('Uncollected test name',16,{locale,fieldId,labMode,gender:'female'});s.started=true;
   const profile={version,edition:locale,fieldId,institution:s.professorProfile.institution,labMode,consent:ANALYTICS_POLICY_VERSION};
   const registration=await analyticsAPI(request('/api/runs',profile),env);
   assert.equal(registration.status,201,`Current release ${version}/${locale} cannot register`);
   const session=await registration.json();
   assert.equal(session.edition,locale);assert.equal(session.consentVersion,ANALYTICS_POLICY_VERSION);
   assert.match(session.id,/^[a-f0-9-]{36}$/);assert.match(session.token,/^[a-f0-9]{64}$/);
   assert.ok(session.expiresAt>Date.now());assert.ok(session.retentionUntil>session.expiresAt);
   const path='/api/runs/'+session.id;
   const save=async state=>{
    const record=analysisRecord(state);assert.ok(validRecord(record));
    const response=await analyticsAPI(request(path,record,session.token),env);
    assert.equal(response.status,200,`${locale}/${fieldId} month ${state.month} rejected`);
    assert.deepEqual(await response.json(),{saved:true});
   };
   await save(s);s=simulateMonth(s,proposeSchedule(s),managedOptions(s));await save(s);
   for(let guard=0;s.pending&&!s.ending;guard++){
    assert.ok(guard<25);s=decide(s,pendingChoice(s));await save(s);
   }
   const rows=env.db.prepare('SELECT month,record FROM game_months WHERE run_id=? ORDER BY month').all(session.id);
   assert.deepEqual(rows.map(row=>row.month),[0,1]);
   assert.deepEqual(JSON.parse(rows.at(-1).record),analysisRecord(s));
   assert.ok(!rows.some(row=>row.record.includes('Uncollected test name')));
   assert.equal((await analyticsAPI(new Request(site+path,{method:'DELETE',headers:{Origin:site,Authorization:'Bearer '+session.token}}),env)).status,200);
  }
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_runs').get().n,0);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM game_months').get().n,0);
 }finally{env.close();}
});

test('normal full gameplay transitions remain compatible with analytics across editions and lab tracks',()=>{
 let checked=0;const endings=new Set();
 const tracks=[['050','dry'],['048','dry'],['055','wet'],['056','wet'],['089','dry'],['077','wet'],['072','dry'],['058','wet']];
 for(const locale of ['ko','en'])for(let i=0;i<tracks.length;i++){
  const [fieldId,labMode]=tracks[i];
  let s=createState('Test student',16+7919*i,{locale,fieldId,labMode,gender:i%2?'male':'female',age:38,institution:['national','private','institute'][i%3]});
  const check=place=>{checked++;assert.ok(validRecord(analysisRecord(s)),`${locale}/${fieldId} month ${s.month} after ${place}`);};
  check('initial state');
  for(let m=0;m<96&&!s.ending;m++){
   const plan=proposeSchedule(s),training=studentTrainingActive(s);
   if(!training&&s.month>=30&&s.month<52&&s.career.qual!=='passed'&&(qualificationStudy(s)<8||s.career.qual==='failed'))plan[0]=plan[1]='coursework';
   const options=managedOptions(s,training?'routine':'conversation');
   s=simulateMonth(s,plan,options);check('monthly progression');
   for(let guard=0;s.pending&&!s.ending;guard++){
    assert.ok(guard<25,'Decision queue must terminate');const kind=s.pending.kind;
    s=decide(s,pendingChoice(s,i%4===0?'masters':'integrated'));check(kind);
    if(kind==='rest-request'){s=simulateMonth(s,s.plan,options);check('approved recovery');}
   }
  }
  assert.ok(s.ending,`${locale}/${fieldId} did not reach an ending`);endings.add(s.ending);
 }
 assert.ok(checked>2000,`Only ${checked} gameplay states checked`);
 assert.ok(endings.size>=2,'Both early graduation and later ending paths must be covered');
});
