import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {RETENTION_ACCESS_TTL_MS,mintRetentionAccess,verifyRetentionAccess} from '../backend/retention-access.js';
import {ANALYTICS_POLICY_VERSION} from '../dist/analytics-policy.js';

const key='test-retention-key-'.repeat(4),policy=ANALYTICS_POLICY_VERSION,now=Date.UTC(2031,9,12,9,0,0);
function signed({expiresAt=now+RETENTION_ACCESS_TTL_MS,nonce='1'.repeat(32),signingKey=key,signingPolicy=policy,scope='analytics-retention-v1'}={}){
 const signature=createHmac('sha256',signingKey).update(scope+'|'+signingPolicy+'|'+expiresAt+'|'+nonce).digest('hex');
 return 'rt1.'+expiresAt+'.'+nonce+'.'+signature;
}

test('retention access uses a fresh nonce, canonical scoped HMAC, and a five-minute exclusive deadline',async()=>{
 assert.equal(RETENTION_ACCESS_TTL_MS,300000);
 const access=await mintRetentionAccess(key,policy,now),other=await mintRetentionAccess(key,policy,now);
 assert.deepEqual(Object.keys(access).sort(),['expiresAt','token']);assert.equal(access.expiresAt,now+300000);
 const parts=access.token.split('.');assert.equal(parts[0],'rt1');assert.equal(parts[1],String(access.expiresAt));assert.match(parts[2],/^[a-f0-9]{32}$/);assert.match(parts[3],/^[a-f0-9]{64}$/);assert.notEqual(parts[2],other.token.split('.')[2]);
 assert.equal(access.token,signed({expiresAt:access.expiresAt,nonce:parts[2]}));
 assert.equal(await verifyRetentionAccess(access.token,key,policy,now),true);
 assert.equal(await verifyRetentionAccess(access.token,key,policy,access.expiresAt-1),true);
 assert.equal(await verifyRetentionAccess(access.token,key,policy,access.expiresAt),false);
 assert.equal(await verifyRetentionAccess(access.token,key,policy,access.expiresAt+1),false);
});

test('retention access rejects wrong keys, policy or scope, tampering, and signed excessive lifetimes',async()=>{
 const access=await mintRetentionAccess(key,policy,now),parts=access.token.split('.');
 assert.equal(await verifyRetentionAccess(access.token,'wrong-key-'.repeat(8),policy,now),false);
 assert.equal(await verifyRetentionAccess(access.token,key,'anonymous-gameplay-v1',now),false);
 for(const token of [signed({scope:'analytics-admin-v1'}),signed({expiresAt:now+RETENTION_ACCESS_TTL_MS+1}),signed({expiresAt:now}),signed({expiresAt:now-1})])assert.equal(await verifyRetentionAccess(token,key,policy,now),false);
 for(const index of [1,2,3]){const changed=[...parts];changed[index]=changed[index].slice(0,-1)+(changed[index].endsWith('0')?'1':'0');assert.equal(await verifyRetentionAccess(changed.join('.'),key,policy,now),false);}
});

test('retention access strictly rejects malformed or unbounded tokens and invalid verifier inputs',async()=>{
 const access=await mintRetentionAccess(key,policy,now),parts=access.token.split('.');
 for(const token of [null,undefined,1,{},'',access.token+' extra',access.token+'.extra',access.token+'\n',access.token.replace('rt1.','rt2.'),['rt1','0'+parts[1],parts[2],parts[3]].join('.'),['rt1','1e12',parts[2],parts[3]].join('.'),['rt1','9007199254740992',parts[2],parts[3]].join('.'),['rt1',parts[1],parts[2].slice(0,-1)+'A',parts[3]].join('.'),'x'.repeat(10000)])assert.equal(await verifyRetentionAccess(token,key,policy,now),false);
 for(const badKey of [undefined,'short','k'.repeat(257)])assert.equal(await verifyRetentionAccess(access.token,badKey,policy,now),false);
 for(const badPolicy of [null,'','policy|forgery','policy\nforgery','p'.repeat(129)])assert.equal(await verifyRetentionAccess(access.token,key,badPolicy,now),false);
 for(const badNow of [NaN,Infinity,-1,1.5,'123',Number.MAX_SAFE_INTEGER])assert.equal(await verifyRetentionAccess(access.token,key,policy,badNow),false);
});

test('invalid mint inputs fail without exposing configuration values',async()=>{
 for(const args of [['short',policy,now],[key,'policy|forgery',now],[key,policy,Infinity],[key,policy,Number.MAX_SAFE_INTEGER]])await assert.rejects(mintRetentionAccess(...args),{name:'RangeError',message:'Invalid retention access configuration'});
 for(const boundaryKey of ['k'.repeat(32),'k'.repeat(256)]){const access=await mintRetentionAccess(boundaryKey,policy,now);assert.equal(await verifyRetentionAccess(access.token,boundaryKey,policy,now),true);}
});
