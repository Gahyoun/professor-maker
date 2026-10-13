export const RETENTION_ACCESS_TTL_MS=300000;
const retentionAccessKeyValid=key=>typeof key==='string'&&key.length>=32&&key.length<=256;
const retentionAccessPolicyValid=policy=>typeof policy==='string'&&/^[a-z0-9-]{1,128}$/.test(policy);
const retentionAccessNowValid=now=>Number.isSafeInteger(now)&&now>=0&&now<=Number.MAX_SAFE_INTEGER-RETENTION_ACCESS_TTL_MS;
const retentionAccessMessage=(policy,expiresAt,nonce)=>'analytics-retention-v1|'+policy+'|'+expiresAt+'|'+nonce;
async function retentionAccessSignature(key,policy,expiresAt,nonce){
 const encoder=new TextEncoder();
 const cryptoKey=await crypto.subtle.importKey('raw',encoder.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',cryptoKey,encoder.encode(retentionAccessMessage(policy,expiresAt,nonce)));
 return [...new Uint8Array(signature)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
export async function mintRetentionAccess(key,policy,now=Date.now()){
 if(!retentionAccessKeyValid(key)||!retentionAccessPolicyValid(policy)||!retentionAccessNowValid(now))throw new RangeError('Invalid retention access configuration');
 const expiresAt=now+RETENTION_ACCESS_TTL_MS;
 const nonce=[...crypto.getRandomValues(new Uint8Array(16))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
 return {token:'rt1.'+expiresAt+'.'+nonce+'.'+await retentionAccessSignature(key,policy,expiresAt,nonce),expiresAt};
}
export async function verifyRetentionAccess(token,key,policy,now=Date.now()){
 if(typeof token!=='string'||token.length>128||!retentionAccessKeyValid(key)||!retentionAccessPolicyValid(policy)||!retentionAccessNowValid(now))return false;
 const match=token.match(/^rt1\.([1-9][0-9]{0,15})\.([a-f0-9]{32})\.([a-f0-9]{64})$/);
 if(!match)return false;
 const expiresAt=Number(match[1]);
 if(!Number.isSafeInteger(expiresAt)||expiresAt<=now||expiresAt>now+RETENTION_ACCESS_TTL_MS)return false;
 try{
  const expected=await retentionAccessSignature(key,policy,expiresAt,match[2]);
  // Both strings have fixed validated lengths; do not stop at the first
  // different character or expose the signing key in error messages.
  let different=0;for(let i=0;i<64;i++)different|=expected.charCodeAt(i)^match[3].charCodeAt(i);
  return different===0;
 }catch{return false;}
}
