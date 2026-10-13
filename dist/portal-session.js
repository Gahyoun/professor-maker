// A fictional faculty-portal timer. This module never authenticates, connects,
// logs out, or reads/writes a game save. The UI owns its timer and sessionStorage.
export const SESSION_DURATION_MS=30*60*1000;
const DURATION_SECONDS=SESSION_DURATION_MS/1000;
const validTime=value=>Number.isSafeInteger(value)&&value>=0;
export function createSession(now=Date.now()){
 if(!validTime(now)||now>Number.MAX_SAFE_INTEGER-SESSION_DURATION_MS)throw new TypeError('Invalid portal session time.');
 return {version:1,startedAt:now,deadline:now+SESSION_DURATION_MS};
}
export function parseSession(raw){
 let session;
 try{session=typeof raw==='string'?JSON.parse(raw):raw;}catch{return null;}
 if(!session||typeof session!=='object'||Array.isArray(session)||Object.keys(session).length!==3||!Object.keys(session).every(key=>['version','startedAt','deadline'].includes(key))||session.version!==1||!validTime(session.startedAt)||!validTime(session.deadline)||session.deadline-session.startedAt!==SESSION_DURATION_MS)return null;
 return {version:1,startedAt:session.startedAt,deadline:session.deadline};
}
export function remainingSeconds(deadline,now=Date.now()){
 if(!validTime(deadline)||!validTime(now))return 0;
 return Math.min(DURATION_SECONDS,Math.max(0,Math.ceil((deadline-now)/1000)));
}
export function sessionExpired(session,now=Date.now()){
 const parsed=parseSession(session);
 return !parsed||!validTime(now)||now>=parsed.deadline;
}
export function sessionLabel(seconds,locale='ko'){
 const safe=Number.isFinite(seconds)?Math.min(DURATION_SECONDS,Math.max(0,Math.ceil(seconds))):0;
 return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
}
