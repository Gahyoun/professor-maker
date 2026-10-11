import {migrateSave,validateSave} from './engine.js';
const DATABASE='pm-save-points',LIMIT=400;
export const checkpointRun=state=>`${state.creationSeed??state.seed}:${state.name}`;
export const monthlyCheckpointId=state=>`${checkpointRun(state)}:month:${state.month}`;
const database=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(DATABASE,1);r.onupgradeneeded=()=>{r.result.createObjectStore('states',{keyPath:'id'});r.result.createObjectStore('index',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export function checkpointRecord(state,{kind='manual',label='',now=Date.now(),id}={}){
 if(!validateSave(state)||!['auto','manual','backup'].includes(kind))throw new Error('Invalid checkpoint');
 const run=checkpointRun(state);id??=kind==='auto'?monthlyCheckpointId(state):kind==='backup'?`${run}:backup`:`${run}:manual:${now}:${crypto.randomUUID()}`;
 const meta={id,run,kind,name:state.name,month:state.month,label:String(label).trim().slice(0,60),savedAt:now,ending:state.ending};
 return {meta,state:structuredClone(state)};
}
// When full, drop the oldest monthly auto saves (other runs first); manual saves and backups are never pruned.
export function pruneTargets(metas,run,count){const autos=metas.filter(m=>m.kind==='auto');const rank=m=>m.run===run?1:0;return autos.sort((a,b)=>rank(a)-rank(b)||a.savedAt-b.savedAt).slice(0,Math.max(0,count));}
export function checkpointState(record){const state=migrateSave(record?.state);if(!state||!validateSave(state))throw new Error('Invalid checkpoint');return structuredClone(state);}
export async function storeCheckpoint(state,options){const record=checkpointRecord(state,options),db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction(['index','states'],'readwrite'),index=tx.objectStore('index');const all=index.getAll();all.onsuccess=()=>{const metas=all.result;if(metas.length>=LIMIT&&!metas.some(m=>m.id===record.meta.id)){const victims=pruneTargets(metas,record.meta.run,metas.length-LIMIT+1);if(!victims.length){tx.abort();return;}for(const v of victims){index.delete(v.id);tx.objectStore('states').delete(v.id);}}index.put(record.meta);tx.objectStore('states').put({id:record.meta.id,state:record.state});};tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Checkpoint storage full or unavailable'));});return record.meta;}finally{db.close();}}
export async function listCheckpoints(){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('index').objectStore('index').getAll();r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.savedAt-a.savedAt));r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function readCheckpoint(id){const db=await database();try{const record=await new Promise((resolve,reject)=>{const r=db.transaction('states').objectStore('states').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return checkpointState(record);}finally{db.close();}}
export async function deleteCheckpoint(id){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction(['states','index'],'readwrite');tx.objectStore('states').delete(id);tx.objectStore('index').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
