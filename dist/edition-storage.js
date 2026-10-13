import {editionStorageKey,EDITION} from './edition.js';

const US_DATABASE='pm-us-edition-v1',STORE='values';
const scopedLocalStorage=locale=>({
 kind:'local',getItem:key=>localStorage.getItem(editionStorageKey(key,locale)),
 setItem:(key,value)=>localStorage.setItem(editionStorageKey(key,locale),String(value)),
 removeItem:key=>localStorage.removeItem(editionStorageKey(key,locale)),flush:async()=>{},
});
function openDatabase(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open(US_DATABASE,1);
 request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error??new Error('Browser storage is unavailable.'));
 request.onblocked=()=>reject(new Error('Close another U.S. edition tab to finish opening storage.'));
});}
function readValues(database){return new Promise((resolve,reject)=>{
 const tx=database.transaction(STORE,'readonly'),store=tx.objectStore(STORE),keys=store.getAllKeys(),values=store.getAll();
 tx.oncomplete=()=>resolve(new Map(keys.result.map((key,i)=>[String(key),String(values.result[i])])));
 tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Saved progress could not be read.'));
});}
function writeValues(database,values){return new Promise((resolve,reject)=>{
 const tx=database.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
 for(const [key,value]of values){if(value===null)store.delete(key);else store.put(value,key);}
 tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Saved progress could not be stored.'));
});}
function recoverMissingValues(database,values){return new Promise((resolve,reject)=>{
 const tx=database.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
 // Check inside the same transaction that writes the fallback. A second tab
 // can save after our startup read; its already stored values still take priority.
 for(const [key,value]of values){const request=store.get(key);request.onsuccess=()=>{if(request.result===undefined)store.put(value,key);};}
 tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error??new Error('Fallback progress could not be recovered.'));
});}
// If IndexedDB becomes available after a fallback session, recover that edition
// before starting a fresh run. An existing database always wins; old fallback
// values are retained when they differ, rather than overwriting newer progress.
async function recoverFallback(database,memory){
 const fallback=[];
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if((key?.startsWith('pm-us-')&&!key.startsWith('pm-us-analysis-'))||key?.startsWith('pm-us:')){const value=localStorage.getItem(key);if(value!==null)fallback.push([key,value]);}}}catch{return memory;}
 if(!fallback.length)return memory;
 await recoverMissingValues(database,fallback);
 const recovered=await readValues(database);
 for(const [key,value]of fallback){try{if(recovered.get(key)===value&&localStorage.getItem(key)===value)localStorage.removeItem(key);}catch{}}
 return recovered;
}
export async function createEditionStorage(locale=EDITION){
 if(locale!=='en')return scopedLocalStorage('ko');
 let database,memory;
 try{database=await openDatabase();memory=await readValues(database);memory=await recoverFallback(database,memory);}catch{database?.close();return scopedLocalStorage('en');}
 let revision=0,persisted=0,queued=-1,failed=false,scheduled=false,tail=Promise.resolve();
 const dirty=new Map();
 function flush(){
  if(revision===persisted)return Promise.resolve();
  if(revision===queued&&!failed)return tail;
  const version=revision,mutations=[...dirty],values=mutations.map(([key,change])=>[key,change.value]);queued=version;failed=false;
  tail=tail.catch(()=>{}).then(()=>writeValues(database,values));
  tail.then(()=>{for(const [key,change]of mutations){if(dirty.get(key)?.version===change.version)dirty.delete(key);}persisted=Math.max(persisted,version);if(revision>version)schedule();},()=>{failed=true;});
  return tail;
 }
 function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;void flush().catch(()=>{});});}
 return {
  kind:'indexeddb',
  getItem:key=>memory.get(editionStorageKey(key,'en'))??null,
  setItem(key,value){const k=editionStorageKey(key,'en'),v=String(value);if(memory.get(k)===v)return;memory.set(k,v);revision++;dirty.set(k,{value:v,version:revision});schedule();},
  removeItem(key){const k=editionStorageKey(key,'en');if(!memory.delete(k))return;revision++;dirty.set(k,{value:null,version:revision});schedule();},
  flush,
 };
}
