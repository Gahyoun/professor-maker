import {getDiscipline} from './disciplines.js';
// Fictional journal metrics for game balance, not measured JCR/KCI statistics.
export const JOURNALS=Object.freeze({standard:{label:'기초 연구 저널',impactFactor:1.8,work:1,acceptance:0,citationWeight:.027,reviewMonths:2},established:{label:'분야 전문 저널',impactFactor:4.2,work:1.15,acceptance:-.09,citationWeight:.063,reviewMonths:2},leading:{label:'선도 연구 저널',impactFactor:8,work:1.3,acceptance:-.18,citationWeight:.12,reviewMonths:3},kci:{label:'국내 전문 학술지',index:'KCI',impactFactor:null,work:1.05,acceptance:-.03,citationWeight:.035,reviewMonths:2}});
export const IF_PROFILES=Object.freeze({
 mathematics:{label:'수학',values:[.6,1.6,3.5]},statistics:{label:'통계',values:[1.2,3.5,6]},physics:{label:'물리·광학',values:[1.8,4.2,8]},astronomy:{label:'천문·대기',values:[2,5,9]},earth:{label:'지구·해양·환경',values:[1.6,3.8,7.5]},chemistry:{label:'화학',values:[2.4,5.5,11]},life:{label:'생명·바이오',values:[2.8,6,12]},agriculture:{label:'농림·수산·식품',values:[1.2,3,6]},living:{label:'생활과학',values:[.8,2,4]},health:{label:'간호·보건',values:[1.2,3,6]},medicine:{label:'의학·약학',values:[2.5,6.5,14]},computing:{label:'컴퓨터·정보·AI',values:[1.5,4,8]},electronics:{label:'전기·전자·제어',values:[1.6,4,8]},built:{label:'건축·도시·조경',values:[.8,2.2,4.5]},civil:{label:'토목·환경·안전',values:[1.5,3.5,7]},materials:{label:'재료·반도체',values:[2.2,5,10]},mechanical:{label:'기계·운송',values:[1.2,3,6]},chemicalEngineering:{label:'화공·에너지',values:[2,5,10]}
});
const FIELD_PROFILES=Object.freeze({
 '048':'mathematics','049':'statistics','050':'physics','051':'astronomy','052':'earth','053':'earth','055':'chemistry','056':'life','057':'earth','156':'life',
 '058':'agriculture','059':'agriculture','060':'agriculture','061':'agriculture','062':'agriculture','063':'agriculture','064':'agriculture',
 '066':'living','067':'living','068':'living','069':'living',
 '112':'health','113':'health','114':'health','115':'health','116':'health','118':'health','163':'health',
 '065':'medicine','107':'medicine','108':'medicine','109':'medicine','110':'medicine','111':'medicine',
 '084':'electronics','085':'electronics','086':'electronics','087':'physics','088':'electronics','089':'computing','090':'computing','091':'computing','157':'computing',
 '072':'built','073':'built','074':'built','075':'civil','076':'built','077':'civil','102':'civil','103':'civil','104':'civil',
 '092':'materials','093':'materials','094':'materials','095':'materials','096':'materials',
 '078':'mechanical','079':'mechanical','080':'mechanical','081':'mechanical','082':'mechanical','083':'mechanical',
 '097':'chemicalEngineering','098':'chemicalEngineering','099':'chemicalEngineering','100':'life','101':'chemicalEngineering',
 '158':'mechanical','159':'mechanical','160':'mechanical','161':'mechanical','162':'mechanical'
});
// Domestic publication route for the game's applied/local-context research fields.
// This is a gameplay selection, not a claim that KCI is absent in other disciplines.
const KCI_FIELDS=new Set(['058','059','060','061','062','063','064','066','067','068','069','057','112','113','114','115','116','118','163','065','107','108','109','110','111','072','073','074','075','076','077','102','103','104','078','079','080','081','082','083','084','085','086','091','101','158','159','160','161','162']);
export function journalProfile(fieldId){const d=getDiscipline(fieldId);return {...IF_PROFILES[FIELD_PROFILES[d.id]??'physics'],id:FIELD_PROFILES[d.id]??'physics',kci:KCI_FIELDS.has(d.id)};}
export function getJournal(id='standard',fieldId){const base=JOURNALS[id]??JOURNALS.standard,profile=journalProfile(fieldId);return {...base,impactFactor:id==='kci'?null:profile.values[['standard','established','leading'].indexOf(id)<0?0:['standard','established','leading'].indexOf(id)]};}
// A fictional annual journal metric. This hash never advances simulation RNG.
// The submitted manuscript keeps its recorded value throughout review and replay.
export function journalMetricRecord(state,journalId=state.project?.journal??'standard',projectId=state.project?.id??1,month=state.project?.submittedAt??state.month??1){
 const fieldId=state.professorProfile?.fieldId,venue=getJournal(journalId,fieldId);
 const recorded=(state.history??[]).filter(entry=>['submission','paper'].includes(entry.kind)&&entry.projectId===projectId&&(entry.journal??'standard')===journalId);
 const previous=recorded.find(entry=>Number.isFinite(entry.impactFactor)&&entry.impactFactor>=0&&entry.impactFactor<=100)??recorded[0];
 let impactFactor=venue.impactFactor;
 if(journalId!=='kci'){
  if(Number.isFinite(previous?.impactFactor)&&previous.impactFactor>=0&&previous.impactFactor<=100)impactFactor=previous.impactFactor;
  else if(!previous&&!(projectId===state.project?.id&&state.project.submitted)){
   const year=Math.floor(Math.max(0,Number(month)-1)/12)+1;
   const identity=`${Number(state.creationSeed??state.seed)>>>0}|${fieldId}|${journalId}|${projectId}|${year}`;
   let hash=2166136261;for(const character of identity)hash=Math.imul(hash^character.charCodeAt(0),16777619)>>>0;
   impactFactor=Math.max(.1,Math.min(100,Math.round(venue.impactFactor*(.86+(hash/4294967296)*.28)*10)/10));
  }
 }
 return {journal:journalId,impactFactor,citationWeight:venue.citationWeight};
}
export function journalOptions(fieldId){return Object.entries(JOURNALS).filter(([id])=>id!=='kci'||journalProfile(fieldId).kci).map(([id])=>[id,getJournal(id,fieldId)]);}
export const isAvailableJournal=(id,fieldId)=>Object.hasOwn(JOURNALS,id)&&(id!=='kci'||journalProfile(fieldId).kci);
export function publicationMetric(id,impactFactor){return id==='kci'?'KCI 등재 · 가상 학술지':Number.isFinite(impactFactor)?`가상 IF ${impactFactor}`:'가상 IF 미기록';}
export function journalDescription(id,fieldId,state){const v=getJournal(id,fieldId),metric=state?journalMetricRecord(state,id,state.project?.id,state.project?.submittedAt??((state.month??0)+1)).impactFactor:v.impactFactor;return `${v.label} · ${publicationMetric(id,metric)}`;}
export const CONFERENCE_TIERS=Object.freeze({regular:{label:'분야 학술대회 · C',work:1,acceptance:0,learning:1},selective:{label:'선별 학술대회 · B',work:1.18,acceptance:-.09,learning:1.15},flagship:{label:'주요 학술대회 · A',work:1.4,acceptance:-.18,learning:1.3}});
export const DEFAULT_PUBLICATION=Object.freeze({journal:'standard',conference:'regular'});
export const validPublication=(p,fieldId)=>p&&Object.keys(p).length===2&&Object.hasOwn(JOURNALS,p.journal)&&(fieldId===undefined||isAvailableJournal(p.journal,fieldId))&&Object.hasOwn(CONFERENCE_TIERS,p.conference);
