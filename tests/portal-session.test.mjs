import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_DURATION_MS,createSession,parseSession,remainingSeconds,sessionExpired,sessionLabel} from '../dist/portal-session.js';

test('the simulated portal session lasts thirty wall-clock minutes and expires exactly at its deadline',()=>{
 const start=1791734400000,session=createSession(start);
 assert.equal(SESSION_DURATION_MS,1800000);assert.deepEqual(session,{version:1,startedAt:start,deadline:start+1800000});
 assert.equal(remainingSeconds(session.deadline,start),1800);assert.equal(sessionExpired(session,start),false);
 assert.equal(remainingSeconds(session.deadline,start+1799999),1);assert.equal(sessionExpired(session,start+1799999),false);
 assert.equal(remainingSeconds(session.deadline,start+1800000),0);assert.equal(sessionExpired(session,start+1800000),true);
 assert.equal(remainingSeconds(session.deadline,start+3600000),0);assert.equal(sessionExpired(session,start+3600000),true);
});

test('reload preserves the actual deadline, including an already expired simulated session',()=>{
 const session=createSession(1000000),serialized=JSON.stringify(session),restored=parseSession(serialized);
 assert.deepEqual(restored,session);assert.equal(remainingSeconds(restored.deadline,session.startedAt+1200000),600);
 assert.equal(sessionExpired(restored,session.deadline+1),true);assert.equal(serialized,JSON.stringify(session));
 assert.notEqual(restored,session,'parsed snapshots do not alias input objects');assert.notEqual(parseSession(session),session);
});

test('extension or reconnection creates a fresh deadline without mutating the previous session or progress',()=>{
 const prior=createSession(1000),before=structuredClone(prior),progress={month:44,name:'Student',debt:120},saved=JSON.stringify(progress);
 const extended=createSession(600000),reconnected=createSession(prior.deadline+120000);
 assert.equal(extended.deadline,600000+SESSION_DURATION_MS);assert.equal(reconnected.deadline,prior.deadline+120000+SESSION_DURATION_MS);
 assert.deepEqual(prior,before);assert.equal(JSON.stringify(progress),saved);
});

test('backwards clocks and delayed timer callbacks keep the displayed countdown bounded',()=>{
 const session=createSession(1000000);
 assert.equal(remainingSeconds(session.deadline,0),1800);assert.equal(sessionLabel(remainingSeconds(session.deadline,0)),'30:00');
 assert.equal(remainingSeconds(session.deadline,session.startedAt+60500),1740);
 assert.equal(sessionLabel(1740),'29:00');assert.equal(sessionLabel(59),'00:59');assert.equal(sessionLabel(0),'00:00');
 assert.equal(sessionLabel(-100),'00:00');assert.equal(sessionLabel(Infinity),'00:00');assert.equal(sessionLabel(NaN),'00:00');assert.equal(sessionLabel(20000),'30:00');
 assert.equal(sessionLabel(61,'en'),sessionLabel(61,'ko'));
});

test('malformed snapshots and deadline values cannot extend or corrupt the simulated session',()=>{
 const session=createSession(1000000);
 for(const raw of [null,undefined,[],0,'','not json','null','[]',{}, {...session,version:2},{...session,deadline:session.deadline+1},{...session,deadline:String(session.deadline)},{...session,startedAt:-1},{...session,startedAt:1.5},{...session,deadline:NaN},{...session,deadline:Infinity},{...session,extra:true},{version:1,deadline:session.deadline}]){
  assert.equal(parseSession(raw),null);assert.equal(sessionExpired(raw,1000000),true);
 }
 for(const now of [-1,1.5,NaN,Infinity,'1000000',null,Number.MAX_SAFE_INTEGER])assert.throws(()=>createSession(now),TypeError);
 for(const bad of [-1,1.5,NaN,Infinity,'1000000',null]){assert.equal(remainingSeconds(bad,1000000),0);assert.equal(remainingSeconds(session.deadline,bad),0);assert.equal(sessionExpired(session,bad),true);}
});
