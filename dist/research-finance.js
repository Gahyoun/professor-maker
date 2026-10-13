import {getDiscipline} from './disciplines.js';

// NRF's 2025 survey reports calendar-year 2024 activity. Appendix table 15,
// printed pp.147–149: million KRW per FULL-TIME FACULTY MEMBER, including
// non-recipients. These are not individual grant sizes or selection odds.
export const RESEARCH_FINANCE_SOURCE='https://www.nrf.re.kr/page/419?ac=view&boardNo=150&menuNo=419&postNo=266697';
export const RESEARCH_FINANCE_YEAR=2024;
const refs={
 mathematics:['수학',76.48],statistics:['통계학',83.77],physics:['물리학',295.73],
 chemistry:['화학',267.56],biology:['생물학',274.71],earth:['지구과학',267.44],
 geology:['지질학',251.98],ocean:['해양학',412.8],astronomy:['천문학',210.63],
 computing:['컴퓨터학',217.9],electronics:['전자/정보통신공학',286.2],
 electrical:['전기공학',269.6],control:['제어계측공학',216.5],
 mechanical:['기계공학',292.2],architecture:['건축공학',101],civil:['토목공학',188.8],
 environment:['환경공학',265.6],industrial:['산업공학',118.4],safety:['안전공학',64.1],
 materials:['재료공학',431.2],metal:['금속공학',313.9],chemicalEngineering:['화학공학',337.9],
 polymer:['고분자공학',340.9],biotechnology:['생물공학',333.7],textiles:['섬유공학',200.9],
 aerospace:['항공우주공학',379.8],automotive:['자동차공학',266.2],ship:['조선공학',294.6],
 transport:['교통공학',223.3],bioengineering:['의공학',344.9],agriculture:['농학',219.3],
 forest:['임학',179],animal:['축산학',231],fish:['수산학',333.7],food:['식품과학',199.5],
 agriculturalEngineering:['농공학',299.8],landscape:['조경학',72.8],life:['생활과학',79.61],
 nursing:['간호학',27.4],medicine:['의약학 소계',109.5],pharmacy:['약학',208.2],
 traditionalMedicine:['한의학',86.5],dentistry:['치의학',71.1],veterinary:['수의학',207.3],
 publicHealth:['예방의학/직업환경의학',222.2],clinical:['임상병리학',62.8],rehab:['재활의학',61.8],
 natural:['자연과학 소계',215.29],engineering:['공학 소계',253.6]
};
// Related fields use an explicitly named broader reference; unsupported small
// subfields are never presented as having their own measured funding average.
const fieldRefs={
 '048':'mathematics','049':'statistics','050':'physics','051':'astronomy','052':'geology','053':'ocean',
 '055':'chemistry','056':'biology','057':'environment','156':'biotechnology',
 '058':'agriculture','059':'forest','060':'animal','061':'fish','062':'agriculture','063':'agriculturalEngineering','064':'food',
 '065':'veterinary','066':'food','067':'life','068':'life','069':'life',
 '072':'architecture','073':'architecture','074':'landscape','075':'civil','076':'civil','077':'environment',
 '078':'mechanical','079':'mechanical','080':'ship','081':'aerospace','082':'mechanical','083':'automotive',
 '084':'electrical','085':'electronics','086':'control','087':'physics','088':'bioengineering',
 '089':'computing','090':'computing','091':'electronics','157':'computing',
 '092':'metal','093':'materials','094':'materials','095':'materials','096':'materials',
 '097':'chemicalEngineering','098':'chemicalEngineering','099':'polymer','100':'biotechnology','101':'textiles',
 '102':'industrial','103':'safety','104':'safety',
 '107':'medicine','108':'dentistry','109':'traditionalMedicine','110':'pharmacy','111':'pharmacy',
 '112':'nursing','113':'publicHealth','114':'rehab','115':'clinical','116':'publicHealth','118':'medicine','163':'veterinary',
 '158':'transport','159':'transport','160':'ship','161':'aerospace','162':'aerospace'
};
const profiles={
 theory:{label:'이론·문헌',hint:'문헌·계산 중심으로 환경 지출을 낮게 유지하고 발표·교류에 여유를 둡니다.',dry:[0,1.4,1.7,0,0],wet:[4,2.8,1.8,1.5,0]},
 compute:{label:'계산·데이터',hint:'분석이 많은 달에는 연산·데이터 이용비가 늘어납니다. 환경 지원은 계산 자원을 보완합니다.',dry:[0,2.2,2,.4,.4],wet:[6,3.5,2,2,0]},
 survey:{label:'현장·시료',hint:'현장 조사·시료 분석이 많은 달에는 활동비가 늘어납니다. 문헌 정리 달에는 지출을 줄일 수 있습니다.',dry:[0,1.8,1.8,.6,.3],wet:[4.5,2.8,1.8,1.8,.3]},
 design:{label:'설계·모형',hint:'설계·분석과 모형 검증에 활동비가 듭니다. 분석 달과 시편 검증 달의 예산을 다르게 잡습니다.',dry:[0,1.8,1.8,.5,.3],wet:[5,3,1.8,2,.3]},
 biology:{label:'생명·재료 소모품',hint:'배양·시약 등 기본 유지비가 있습니다. 실험을 모아서 진행하고 분석 달에는 선택 지출을 조정합니다.',dry:[0,2,2,0,0],wet:[6,3.5,2,2,0]},
 instrument:{label:'장비·시편',hint:'장비 유지와 시편 검증에 예산이 듭니다. 연구환경 지원과 검증 주간의 수를 함께 조정합니다.',dry:[0,2,2,0,0],wet:[6,3.5,2,2,0]},
 clinical:{label:'보건·자료 수집',hint:'측정·자료 수집 비용과 대상자·기록 관리가 중심입니다. 분석 달에는 선택 지출을 낮출 수 있습니다.',dry:[0,1.8,1.8,.3,.2],wet:[4,2.6,1.8,1.2,.2]}
};
const has=(ids,id)=>ids.includes(id);
export function researchFinanceProfile(state){
 const p=state?.professorProfile??state??{},d=getDiscipline(p.fieldId),id=d.id,mode=p.labMode==='wet'?'wet':'dry';
 const key=has(['048','049'],id)?'theory':has(['089','090','091','157','102','158','159','160','161','162'],id)?'compute':has(['057','058','059','061','062','052','053','077','074'],id)?'survey':has(['068','069','072','073','075','076'],id)?'design':has(['112','113','114','115','116','118','107','108','109'],id)?'clinical':has(['055','056','156','060','063','064','065','066','067','110','111','100','163'],id)?'biology':'instrument';
 const profile=profiles[key],referenceKey=fieldRefs[id]??(d.major==='공학'?'engineering':'natural'),[referenceLabel,mean]=refs[referenceKey];
 const [fixed,environment,performance,experiment,analysis]=profile[mode];
 // Compress real differences so a low-funded field stays playable. Keep
 // funding odds, stipends, histories and already-contracted annual sums intact.
 const grantMultiplier=Math.round(Math.max(.95,Math.min(1.15,1+.12*Math.log(mean/215.29)))*100)/100;
 return {id:key,label:profile.label,hint:profile.hint,mode,fixed,environment,performance,experiment,analysis,grantMultiplier,reference:{label:referenceLabel,meanMillions:mean,year:RESEARCH_FINANCE_YEAR,source:RESEARCH_FINANCE_SOURCE}};
}
export function researchOperatingCost(state,budget=state.lab.budget,plan=state.plan,{training=false}={}){
 const p=researchFinanceProfile(state);const weeks=plan.filter((id,i)=>!training||i>=3);
 const activities=weeks.reduce((sum,id)=>sum+(id==='experiment'?p.experiment:id==='analysis'?p.analysis:0),0);
 const support=(budget.environment*p.environment+budget.performance*p.performance)*.88;
 return {fixed:p.fixed,support,activities,total:p.fixed+support+activities,profile:p};
}
