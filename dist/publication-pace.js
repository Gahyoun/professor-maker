// Fictional workload and review tuning. These are not measured publication rates,
// journal acceptance rates, or national degree requirements.
export const PUBLICATION_PROGRESS_SCALE=.96;
const profile=(id,label,phaseEffort,reviewDelay,acceptanceAdjustment,hint,doctoratePapers)=>Object.freeze({id,label,phaseEffort:Object.freeze(phaseEffort),reviewDelay,acceptanceAdjustment,hint,...(doctoratePapers===undefined?{}:{doctoratePapers,truePapers:doctoratePapers})});
export const PUBLICATION_PACE_PROFILES=Object.freeze({
 mathematics:profile('mathematics','증명과 반례 검증',[1.12,1.4,1.5,1.08,1.16],2,-.04,'예비 논증과 증명·반례 점검에 시간을 들이며, 적은 수의 완성된 논문을 준비합니다.',2),
 statistics:profile('statistics','방법과 모형 검증',[1,1.05,1.14,1.12,1.03],1,-.01,'모형의 가정과 방법의 검증, 분석의 정확성을 확인합니다.'),
 experimental:profile('experimental','재현과 시료 검증',[1,1.08,1.18,1.1,1.03],1,-.015,'시료·실험 결과의 재현성을 확인하고 분석과 보고를 정리합니다.'),
 engineering:profile('engineering','모형과 설계 검증',[1,1.04,1.12,1.06,1.02],0,-.01,'모형·설계와 측정 결과를 검증한 뒤 연구를 정리합니다.'),
 computing:Object.freeze({...profile('computing','알고리즘과 평가',[1,1,1.08,1.05,1],0,0,'알고리즘과 평가 결과를 점검하며 학술대회 경로를 함께 준비합니다.'),doctorateConferences:4}),
 general:profile('general','연구 검증과 논문 정리',[1,1,1,1,1],0,0,'연구 결과를 검증하고 논문으로 정리하는 시간이 필요합니다.')
});
const computing=new Set(['089','090','091','157']);
const experimental=new Set(['055','056','058','059','060','061','062','063','064','065','100','107','108','109','110','111','112','113','114','115','116','118','156','163']);
const engineering=new Set(['072','073','074','075','076','077','078','079','080','081','082','083','084','085','086','088','092','093','094','095','096','097','098','099','101','102','103','104','158','159','160','161','162']);
export function publicationPaceProfile(fieldOrState){
 const id=typeof fieldOrState==='string'?fieldOrState:fieldOrState?.professorProfile?.fieldId;
 const key=id==='048'?'mathematics':id==='049'?'statistics':computing.has(id)?'computing':experimental.has(id)?'experimental':engineering.has(id)?'engineering':'general';
 return PUBLICATION_PACE_PROFILES[key];
}
// Only new work changes pace: stored phase targets, progress, papers and IFs stay intact.
export function publicationProgressFactor(fieldOrState,phase){return PUBLICATION_PROGRESS_SCALE/(publicationPaceProfile(fieldOrState).phaseEffort[phase]??1);}
