import {DISCIPLINES} from './disciplines.js';
import {withParticle,replaceNounWithParticle} from './korean.js';
import {postdocCareer} from './postdoc-career.js';
// Explicit game-domain mapping. These are plausible fictional workplaces,
// not claims about any real employer or a prediction of graduate employment.
const groups=[
 ['058','농업·원예','품종과 재배 서비스를 개발하는 기업 연구팀','작물과 재배 환경을 연구하는 공공 연구팀','재배 자료와 생육 모형','생육 조건과 재배 시험','재배 환경 측정 장비'],
 ['059','산림·목재','산림 관리와 목재 활용을 검토하는 기업 연구팀','산림 자원과 생태 변화를 추적하는 공공 연구팀','산림 공간 자료와 자원 모형','수목과 목재 특성의 측정','수목·목재 측정 장비'],
 ['060','축산','사료와 사육 환경을 개발하는 기업 연구팀','가축 건강과 사육 환경을 연구하는 공공 연구팀','사육 자료와 생육 모형','사료와 생육 조건의 비교','사료 분석 장비'],
 ['061','수산·양식','양식 관리와 수산 자원 활용을 개발하는 기업 연구팀','수산 자원과 양식 환경을 조사하는 공공 연구팀','수산 자료와 양식 환경 모형','양식 조건과 수질의 측정','수질 분석 장비'],
 ['062','농림수산 환경·생태','생태 조사와 환경 관리 서비스를 설계하는 기업 연구팀','농림수산 생태계와 자원 변화를 조사하는 공공 연구팀','생태 자료와 공간 모형','현장 시료와 환경 조건의 비교','환경 측정 장비'],
 ['063','농업·바이오시스템','농업 장비와 생물 생산 시스템을 개발하는 기업 연구팀','농업 생산 시스템과 자동화를 연구하는 공공 연구팀','농업 시스템의 설계와 해석','생산 장비와 생육 조건의 검증','생산 시스템 시험 장비'],
 ['064 066 067','식품·영양','식품 품질과 영양·가공 조건을 검토하는 기업 연구팀','식품 안전과 영양·가공 기준을 연구하는 공공 연구팀','식품 품질 자료와 공정 모형','식품 성분과 가공 조건의 비교','식품 성분 분석 장비'],
 ['055','화학','분석법과 화학 제품의 특성을 검토하는 기업 연구팀','물질 특성과 분석 표준을 축적하는 공공 연구팀','분자 모형과 계산 결과','분석 조건과 물질 특성의 측정','분석 장비'],
 ['056 100 156','생명과학·바이오','생물학 자료와 바이오 기술을 검증하는 기업 연구팀','생물 자원과 분석법의 신뢰성을 연구하는 공공 연구팀','생물학 자료와 분석 코드','시료와 대조 조건의 비교','시료 분석 장비'],
 ['057 077','환경','환경 관리와 오염 저감 기술을 검토하는 기업 연구팀','환경 변화를 관측하고 관리 기준을 연구하는 공공 연구팀','환경 자료와 확산 모형','환경 시료와 처리 조건의 비교','환경 분석 장비'],
 ['068 101','의류·섬유','의류 설계와 섬유 제품의 성능을 개발하는 기업 연구팀','섬유 특성과 착용·생산 조건을 연구하는 공공 연구팀','의복 설계와 섬유 성능 자료','원단 특성과 착용 조건의 시험','섬유 성능 시험 장비'],
 ['069','주거·생활환경','주거 공간과 생활환경을 설계하는 기업 연구팀','주거 환경과 거주 경험을 연구하는 공공 연구팀','주거 도면과 거주 환경 자료','주거 환경의 측정','실내 환경 측정 장비'],
 ['048','수학·수리모형','수리 모형과 계산 방법을 검토하는 기업 연구팀','수학적 방법과 모형의 타당성을 연구하는 공공 연구팀','정의와 가정, 증명과 반례','모형의 타당성 검증','계산 장비'],
 ['049','통계·데이터 분석','통계 모형과 데이터 분석을 검증하는 기업 연구팀','공공 자료의 불확실성과 통계 방법을 연구하는 공공 연구팀','추정 모형과 불확실성 분석','자료 수집 조건의 검증','자료 분석 장비'],
 ['050','물리·측정','물리 모형과 장치 성능을 검토하는 기업 연구팀','물리 현상과 측정 신뢰성을 연구하는 공공 연구팀','물리 모형과 계산 결과','장치 성능과 측정 오차의 비교','물리 측정 장비'],
 ['051','천문·대기 관측','관측 자료와 기상·우주 데이터 서비스를 개발하는 기업 연구팀','천체와 대기 현상을 장기 관측하는 공공 연구팀','관측 자료와 천체·대기 모형','관측 조건의 비교','관측 자료 처리 장비'],
 ['052','지질·지반','지질 조사와 지반 해석을 검토하는 기업 연구팀','지질 자원과 지구 변화를 조사하는 공공 연구팀','지질 자료와 지반 모형','암석과 지반 특성의 측정','지반·암석 시험 장비'],
 ['053','해양 관측','해양 조사와 해양 데이터 서비스를 개발하는 기업 연구팀','해양 환경과 자원 변화를 관측하는 공공 연구팀','해양 자료와 해류 모형','해양 시료와 관측 조건의 비교','해양 관측 장비'],
 ['112 113 115 116','보건·의료서비스','보건 자료와 의료서비스의 품질을 검토하는 기업 연구팀','공공 보건과 의료서비스의 근거를 연구하는 공공 연구팀','보건 자료와 서비스 평가','평가 절차와 건강 지표의 비교','건강 지표 측정 장비'],
 ['114','재활·치료기술','재활 기기와 치료 지원 기술을 개발하는 기업 연구팀','재활 평가와 치료 효과의 근거를 연구하는 공공 연구팀','재활 자료와 효과 분석','기능 평가와 치료 조건의 비교','기능 평가 장비'],
 ['118','피부·미용','피부 관리와 미용 제품의 평가를 수행하는 기업 연구팀','피부 관리와 안전한 평가 방법을 연구하는 공공 연구팀','피부 평가 자료와 효과 분석','피부 상태와 제품 사용 조건의 비교','피부 평가 장비'],
 ['065 163','동물의료·건강','동물 건강과 진단 지원 기술을 개발하는 기업 연구팀','동물 질병과 건강 관리의 근거를 연구하는 공공 연구팀','동물 건강 자료와 분석 모형','검체와 진단 조건의 비교','진단 분석 장비'],
 ['110 111','의약·약학','의약품의 품질과 후보 물질을 검증하는 기업 연구팀','의약품의 안전성과 평가 방법을 연구하는 공공 연구팀','의약 자료와 효과 모형','후보 물질과 분석 조건의 비교','의약 분석 장비'],
 ['107 108 109','의료·진단','의료 기술과 진단·치료의 근거를 검토하는 기업 연구팀','질병과 진단·치료 방법을 연구하는 공공 연구팀','의료 자료와 효과 분석','검체와 평가 절차의 비교','의료 연구 장비'],
 ['084 085 086','전기·전자·계측','회로와 제어·계측 시스템을 개발하는 기업 연구팀','전기·전자 시스템과 측정 표준을 연구하는 공공 연구팀','회로 모형과 제어 알고리즘','회로와 계측 장치의 검증','회로·계측 시험 장비'],
 ['087','광학','광학 설계와 영상·센서 장치를 개발하는 기업 연구팀','광학 측정과 빛의 활용 기술을 연구하는 공공 연구팀','광학 모형과 광선 해석','광학 장치와 측정 조건의 비교','광학 측정 장비'],
 ['088','의료기기·의공학','의료기기와 생체 신호 분석을 개발하는 기업 연구팀','의료기기 평가와 생체 신호 방법을 연구하는 공공 연구팀','생체 신호와 의료기기 모형','의료기기 성능과 평가 조건의 비교','생체 신호 측정 장비'],
 ['089 090 157','소프트웨어·인공지능','소프트웨어와 알고리즘의 성능·재현성을 검증하는 기업 연구팀','공공 데이터와 신뢰할 수 있는 알고리즘을 연구하는 공공 연구팀','코드와 데이터 처리 과정','시스템 성능의 검증','계산 서버'],
 ['091','정보·통신','통신 시스템과 네트워크 서비스를 개발하는 기업 연구팀','통신 기술과 연결 품질을 연구하는 공공 연구팀','통신 모형과 네트워크 성능','통신 장치와 연결 조건의 비교','통신 시험 장비'],
 ['072 073','건축·설계','건축 설계와 건물 성능을 검토하는 기업 연구팀','건축 환경과 건물 안전·성능을 연구하는 공공 연구팀','설계 도면과 구조·환경 해석','건축 재료와 구조 성능의 시험','구조·환경 시험 장비'],
 ['074','조경·공간설계','조경과 외부 공간을 설계하는 기업 연구팀','녹지와 공공 공간의 이용을 연구하는 공공 연구팀','조경 도면과 공간 이용 자료','식재와 외부 환경의 측정','현장 측정 장비'],
 ['075','토목·인프라','구조물과 기반시설을 설계·검토하는 기업 연구팀','기반시설의 안전과 유지관리를 연구하는 공공 연구팀','구조·지반 모형과 설계 도면','구조물과 지반 성능의 시험','구조·지반 시험 장비'],
 ['076','도시·공간계획','도시 계획과 공간 분석을 수행하는 기업 연구팀','도시 정책과 생활권 변화를 연구하는 공공 연구팀','도시 공간 자료와 계획 모형','현장 이용 조건의 조사','공간 자료 처리 장비'],
 ['102','산업·운영 최적화','생산·물류 시스템을 분석하는 기업 연구팀','산업 시스템과 운영 방법을 연구하는 공공 연구팀','운영 자료와 최적화 모형','시스템 운영 조건의 비교','계산 장비'],
 ['103 104','안전·방재','시설 안전과 재난 대응 기술을 검토하는 기업 연구팀','위험 평가와 재난 예방을 연구하는 공공 연구팀','위험 자료와 재난 시나리오','안전 성능과 대응 조건의 검증','안전 성능 시험 장비'],
 ['092 094 095 096','재료·소재','소재 특성과 제조·품질 조건을 검토하는 기업 연구팀','물질 특성과 재료 평가 방법을 축적하는 공공 연구팀','재료 모형과 물성 해석','시편 특성과 제조 조건의 비교','재료 시험 장비'],
 ['093','반도체','반도체 소자와 공정 성능을 개발하는 기업 연구팀','반도체 소자와 공정·평가 기술을 연구하는 공공 연구팀','소자 모형과 회로 해석','소자 특성과 공정 조건의 비교','소자 측정 장비'],
 ['078 079 083','기계·자동차','기계 장치와 차량 시스템을 개발하는 기업 연구팀','기계 시스템과 동력·제어 기술을 연구하는 공공 연구팀','기구 설계와 동역학·제어 모형','장치 성능과 작동 조건의 시험','기계 성능 시험 장비'],
 ['080 160','조선·선박','선박 성능과 운항 시스템을 검토하는 기업 연구팀','선박과 해양 운항 기술을 연구하는 공공 연구팀','선박·운항 모형과 성능 해석','선박 모형과 성능 조건의 시험','선박 성능 시험 장비'],
 ['081 161 162','항공·우주','항공기와 비행·우주 시스템을 개발하는 기업 연구팀','비행과 우주 시스템의 안전·성능을 연구하는 공공 연구팀','비행 모형과 항공 시스템 해석','비행 장치와 성능 조건의 시험','항공 성능 시험 장비'],
 ['082 159','철도·제어','철도 차량과 운행 제어를 검토하는 기업 연구팀','철도 시스템과 운행 안전을 연구하는 공공 연구팀','철도 운행 모형과 제어 해석','철도 장치와 안전 조건의 시험','철도 성능 시험 장비'],
 ['097 099','화학공정·고분자','화학 공정과 고분자 제품을 개발하는 기업 연구팀','공정과 고분자 소재의 평가 방법을 연구하는 공공 연구팀','공정 모형과 고분자 물성 해석','공정 조건과 고분자 특성의 비교','공정·물성 분석 장비'],
 ['098','에너지','에너지 시스템과 변환·저장 기술을 개발하는 기업 연구팀','에너지 효율과 변환·저장 기술을 연구하는 공공 연구팀','에너지 시스템과 성능 모형','에너지 장치와 운전 조건의 시험','에너지 성능 시험 장비'],
 ['158','교통·이동 서비스','교통 계획과 이동 서비스를 분석하는 기업 연구팀','교통 흐름과 이동 정책을 연구하는 공공 연구팀','교통 자료와 이동 모형','교통 현장 조건의 조사','교통 자료 처리 장비'],
];
// Descriptive equipment labels belong in a setting. A recalled object needs a
// shorter name, so dialogue does not sound like an equipment specification.
const equipmentNames={
 '재배 환경 측정 장비':'측정 장비','수목·목재 측정 장비':'목재 시험 장비','생산 시스템 시험 장비':'시험 장비',
 '식품 성분 분석 장비':'성분 분석 장비','섬유 성능 시험 장비':'섬유 시험 장비','실내 환경 측정 장비':'환경 측정 장비',
 '물리 측정 장비':'측정 장비','관측 자료 처리 장비':'자료 처리 장치','지반·암석 시험 장비':'지반 시험 장비',
 '건강 지표 측정 장비':'분석 장비','회로·계측 시험 장비':'계측 장비','생체 신호 측정 장비':'신호 분석 장비',
 '구조·환경 시험 장비':'구조 시험 장비','공간 자료 처리 장비':'자료 처리 장치','안전 성능 시험 장비':'시험 장비',
 '구조·지반 시험 장비':'구조 시험 장비','기계 성능 시험 장비':'시험 장비','선박 성능 시험 장비':'시험 장비',
 '항공 성능 시험 장비':'시험 장비','철도 성능 시험 장비':'시험 장비','공정·물성 분석 장비':'분석 장비',
 '에너지 성능 시험 장비':'시험 장비','교통 자료 처리 장비':'자료 처리 장치',
};
export const ENDING_FIELDS=Object.fromEntries(groups.flatMap(([ids,sector,company,institute,dryTask,wetTask,equipment])=>ids.split(' ').map(id=>[id,{sector,company,institute,dryTask,wetTask,equipment,equipmentName:equipmentNames[equipment]||equipment}])));
export function researchSetting(context={}){
 // Current IDs are authoritative. Resolve legacy entries by an exact label only.
 const exact=context.field&&DISCIPLINES.find(d=>(d.label===context.field||d.labelEn===context.field));
 const d=DISCIPLINES.find(d=>d.id===context.fieldId)||exact;
 const profile=ENDING_FIELDS[d?.id]||{sector:'전공 관련',company:'전공과 관련된 업무를 검토하는 기업 연구팀',institute:'전공 관련 자료와 방법을 축적하는 공공 연구팀',dryTask:'자료와 분석 방법',wetTask:'측정 자료와 검증 절차',equipment:'연구 장비'};
 const dry=context.labMode==='dry',field=d?.label||context.field||'전공';
 const cold=!dry&&['056','100','156','110','111','065','163','107','108','109'].includes(d?.id);
 return {...profile,field,dry,task:dry?profile.dryTask:profile.wetTask,
  equipment:dry?'워크스테이션':profile.equipment,
  equipmentName:dry?'워크스테이션':profile.equipmentName||profile.equipment,
  record:dry?(/건축|주거|조경|토목/.test(field)?'설계 노트':'연구 노트'):'실험 노트',
  material:dry?'원자료와 분석 파일':cold?'시료':'측정 자료와 시험 기록',
  storage:dry?'프로젝트 보관 폴더':cold?'냉동고 맨 아래 칸':'연구 자료 보관함',
  archive:dry?'정리된 자료와 분석 파일':cold?'라벨이 붙은 튜브들':'분류해 둔 측정 자료와 시험 기록'};
}
const englishGroups=[
 ['058','crop and horticultural science','crop data and growth models','growing conditions and cultivation trials'],
 ['059','forestry','forest spatial data and resource models','tree and timber properties'],
 ['060','animal science','husbandry data and growth models','feed and growing conditions'],
 ['061','fisheries and aquaculture','aquaculture data and environmental models','water quality and aquaculture conditions'],
 ['062','agricultural and aquatic ecology','ecological data and spatial models','field samples and environmental conditions'],
 ['063','agricultural biosystems','production-system design and analysis','production equipment and growing conditions'],
 ['064 066 067','food and nutrition','food-quality data and process models','food composition and processing conditions'],
 ['055','chemistry','molecular models and computational results','analytical conditions and material properties'],
 ['056 100 156','biological science and biotechnology','biological data and analysis code','samples and comparison conditions'],
 ['057 077','environmental science','environmental data and transport models','environmental samples and treatment conditions'],
 ['068 101','clothing and textiles','clothing designs and textile-performance data','fabric properties and wearing conditions'],
 ['069','housing and living environments','housing plans and occupancy data','indoor environmental conditions'],
 ['048','mathematics','definitions, assumptions, proofs and counterexamples','model validity'],
 ['049','statistics','estimation models and uncertainty analysis','data-collection procedures'],
 ['050','physics','physical models and computational results','instrument performance and measurement uncertainty'],
 ['051','astronomy and atmospheric observation','observation data and celestial or atmospheric models','observation conditions'],
 ['052','geology and geotechnics','geological data and ground models','rock and ground properties'],
 ['053','oceanography','ocean data and circulation models','marine samples and observation conditions'],
 ['112 113 115 116','health and healthcare services','health data and service evaluations','evaluation procedures and health indicators'],
 ['114','rehabilitation technology','rehabilitation data and effect estimates','functional evaluations and treatment conditions'],
 ['118','skin care and cosmetics','skin-assessment data and effect estimates','skin assessments and product-use conditions'],
 ['065 163','animal health','animal-health data and diagnostic models','specimens and diagnostic conditions'],
 ['110 111','pharmaceutical science','pharmaceutical data and effect models','candidate compounds and analytical conditions'],
 ['107 108 109','medical and diagnostic research','medical data and effect estimates','specimens and evaluation procedures'],
 ['084 085 086','electrical and electronic systems','circuit models and control algorithms','circuits and instrumentation'],
 ['087','optics','optical models and ray analysis','optical instruments and measurement conditions'],
 ['088','biomedical engineering','biosignals and medical-device models','device performance and evaluation conditions'],
 ['089 090 157','software and artificial intelligence','code and data-processing pipelines','system performance'],
 ['091','information and communication systems','communication models and network performance','communication devices and connection conditions'],
 ['072 073','architecture','design drawings and structural or environmental analysis','building materials and structural performance'],
 ['074','landscape architecture','landscape plans and spatial-use data','planting and outdoor environmental conditions'],
 ['075','civil infrastructure','structural and ground models and design drawings','structural and ground performance'],
 ['076','urban planning','urban spatial data and planning models','field-use patterns'],
 ['102','industrial and operations engineering','operational data and optimization models','system operating conditions'],
 ['103 104','safety and disaster prevention','risk data and disaster scenarios','safety performance and response conditions'],
 ['092 094 095 096','materials science','material models and property analysis','specimen properties and manufacturing conditions'],
 ['093','semiconductors','device models and circuit analysis','device properties and process conditions'],
 ['078 079 083','mechanical and automotive engineering','mechanism designs and dynamics or control models','device performance and operating conditions'],
 ['080 160','ships and marine systems','ship and operating models','ship-model performance'],
 ['081 161 162','aerospace systems','flight models and aerospace-system analysis','flight-device performance'],
 ['082 159','rail and control systems','rail-operation models and control analysis','rail equipment and safety conditions'],
 ['097 099','chemical processes and polymers','process models and polymer-property analysis','process conditions and polymer properties'],
 ['098','energy systems','energy-system performance models','energy devices and operating conditions'],
 ['158','transportation','transport data and mobility models','traffic and field conditions']
];
export const ENGLISH_ENDING_FIELDS=Object.fromEntries(englishGroups.flatMap(([ids,sector,dryTask,wetTask])=>ids.split(' ').map(id=>[id,{sector,dryTask,wetTask}])));
export function englishResearchSetting(context={}){
 const p=researchSetting(context),id=context.fieldId||DISCIPLINES.find(d=>(d.label===context.field||d.labelEn===context.field))?.id;
 const en=ENGLISH_ENDING_FIELDS[id]||{sector:'their research field',dryTask:'data and analytical methods',wetTask:'measurement data and verification procedures'};
 return {...p,...en,task:p.dry?en.dryTask:en.wetTask,equipment:p.dry?'workstation':'research instrument',equipmentName:p.dry?'workstation':'research instrument',storage:p.dry?'project archive':p.storage==='냉동고 맨 아래 칸'?'bottom freezer drawer':'research archive',material:p.dry?'raw data and analysis files':p.storage==='냉동고 맨 아래 칸'?'samples':'measurement data and test records',archive:p.dry?'documented data and analysis files':p.storage==='냉동고 맨 아래 칸'?'labeled tubes':'organized measurement data and test records'};
}
export function adaptResearchText(text,context={},locale='ko'){
 if(!context.fieldId&&!context.field&&!context.labMode)return String(text);
 if(locale==='en'){
  const p=englishResearchSetting(context);let result=String(text)
   .replaceAll('I used our equipment to run the experiment we could not finish back then.','Here, I have continued our work on '+p.task+'.')
   .replaceAll('freezer samples',p.material)
   .replaceAll('samples in the bottom freezer drawer',p.material)
   .replaceAll('bottom freezer drawer',p.storage)
   .replaceAll('labeled tubes',p.archive)
   .replaceAll('old machine','old '+p.equipmentName);
  if(p.storage!=='bottom freezer drawer')result=result.replace(/freezer/gi,'research archive');
  if(p.dry)result=result.replace(/lab coat/gi,'everyday clothes')
   .replace(/\ban experiment notebook\b/gi,'a research notebook')
   .replace(/\bexperiment notebook(s?)\b/gi,(_,plural)=>plural?'research notebooks':'research notebook')
   .replace(/\bexperiments\b/gi,'studies').replace(/\bexperiment\b/gi,'study')
   .replace(/cultivation schedule/gi,'analysis schedule').replace(/tubes/gi,'analysis files');
  return result;
 }
 const p=researchSetting(context);
 let result=String(text)
  .replaceAll('냉동고 맨 아래 칸 샘플은 라벨을 다 붙여 두었습니다',p.dry?'원자료와 분석 파일에는 설명과 실행 조건을 정리해 두었습니다':p.storage==='냉동고 맨 아래 칸'?'냉동고 맨 아래 칸 시료는 라벨을 다 붙여 두었습니다':'측정 자료와 시험 기록은 항목별로 분류해 두었습니다')
  .replaceAll('냉동고 맨 아래 칸을 열어',withParticle(p.storage,'을/를')+' 열어')
  .replaceAll('냉동고 샘플은',withParticle(p.material,'은/는'))
  .replaceAll('라벨이 붙은 튜브들',p.archive)
  .replaceAll('여기 장비로 그때 못 했던 실험을 해 보았습니다','이곳에서 '+withParticle(p.task,'을/를')+' 이어 보았습니다')
  .replaceAll('바다 건너 타지에서 최고급 기계로 실험을 하다 보면','이곳에서 '+withParticle(p.task,'을/를')+' 이어 가다 보면')
  .replaceAll('이곳의 장비로 연구를 이어 가다 보면','이곳에서 '+withParticle(p.task,'을/를')+' 이어 가다 보면')
  .replaceAll('최고급 기계로 실험을 하다 보면',withParticle(p.task,'을/를')+' 이어 가다 보면')
  .replaceAll('실험 노트',p.record);
 for(const source of ['오래된 기계','그 기계','기사님을 부르는 기계'])result=replaceNounWithParticle(result,source,source.replace(/기계$/,p.equipmentName));
 if(p.storage!=='냉동고 맨 아래 칸')result=result.replaceAll('냉동고',p.dry?'자료 보관함':'연구 자료 보관함');
 if(p.dry)result=result.replaceAll('실험복','평상복').replaceAll('실험','연구').replaceAll('배양 일정','분석 일정');
 return result;
}
export function fieldWorkplace(context,kind,locale='ko'){if(locale==='en'){const p=englishResearchSetting(context);return `Their training continued in ${p.sector}. In ${kind==='corporate'?'an industrial R&D':'a public research'} team, they worked with colleagues on ${p.task} and documented the results.`;}const p=researchSetting(context);return `${p.field}에서 배운 방법은 ${p.sector} 분야의 새로운 일정 속에서도 이어졌다. ${kind==='corporate'?p.company:p.institute}에서 동료들과 ${withParticle(p.task,'을/를')} 검토하고 결과를 기록했다.`;}

export function careerDescription(ending,context,locale,original){if(ending==='postdoc'&&context?.statistics)return postdocCareer(context).career[locale==='en'?'en':'ko'];if(!context?.fieldId&&!context?.field)return original;const p=locale==='en'?englishResearchSetting(context):researchSetting(context);return ending==='corporate'?(locale==='en'?`Industrial R&D · ${p.sector}`:`기업 연구·개발 · ${p.sector} 분야`):ending==='institute'?(locale==='en'?`Public research institution · ${p.sector}`:`정부출연연구기관 연구원 · ${p.sector} 분야`):original;}
