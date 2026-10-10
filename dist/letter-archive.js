import {endingLetterInsertions,validPassageIds} from './stories.js';

export const LETTER_PASSAGES_KEY='pm-letter-passages-v1';

/** Optional IDs allow older saves; present IDs must be a known, distinct list. */
export function validLetterPassages(record){
  return Boolean(record)&&typeof record==='object'&&!Array.isArray(record)&&(!Object.hasOwn(record,'passageIds')||Array.isArray(record.passageIds)&&validPassageIds(record.passageIds));
}

function checkedIds(ids){
  if(!Array.isArray(ids)||!validPassageIds(ids))throw new TypeError('Invalid letter passage IDs');
  return ids??[];
}

/** Resolve a letter once. A frozen empty selection is meaningful and stays empty. */
export function prepareLetterPassages(record,seenIds=[]){
  if(!validLetterPassages(record))throw new TypeError('Invalid archived letter passages');
  const seen=checkedIds(seenIds),out=structuredClone(record);
  if(Object.hasOwn(out,'passageIds'))return out;
  const context={statistics:out.statistics,recommendation:out.evidence?.recommendation,fieldId:out.fieldId,field:out.cv?.field,labMode:out.labMode,seenPassageIds:[...seen]};
  out.passageIds=endingLetterInsertions(out.ending,out.relationship,out.memories??[],context,'ko').map(passage=>passage.id);
  if(!validPassageIds(out.passageIds))throw new TypeError('Invalid generated letter passages');
  return out;
}

/** The prior collection persists even when its original letters leave the gallery. */
export function collectSeenPassageIds(gallery,prior=[]){
  const seen=new Set(checkedIds(prior));
  for(const record of gallery){
    if(!validLetterPassages(record))throw new TypeError('Invalid archived letter passages');
    for(const id of record.passageIds??[])seen.add(id);
  }
  return [...seen];
}

/** Gallery entries are newest first; migrate older letters before newer candidates. */
export function migrateLetterGallery(gallery,prior=[]){
  let seen=collectSeenPassageIds(gallery,prior);
  const migrated=new Array(gallery.length);
  for(let index=gallery.length-1;index>=0;index--){
    migrated[index]=prepareLetterPassages(gallery[index],seen);
    seen=collectSeenPassageIds([migrated[index]],seen);
  }
  return {gallery:migrated,seenPassageIds:[...seen]};
}

/** Keep existing copies stable, while importing all discovered IDs before pruning. */
export function mergeLetterArchives(current,incoming,prior=[],incomingPrior=[]){
  const importedSeen=collectSeenPassageIds(incoming,incomingPrior);
  const allSeen=collectSeenPassageIds(current,[...new Set([...checkedIds(prior),...importedSeen])]);
  const existing=new Set(current.map(record=>record.id));
  return migrateLetterGallery([...current,...incoming.filter(record=>!existing.has(record.id))],allSeen);
}
