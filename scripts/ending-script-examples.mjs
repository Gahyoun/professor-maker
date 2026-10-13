// Feedback document generated from the same narrative functions as the game.
// Audited terminal states remain distinct from synthetic examples of rare exits.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createState,HIDDEN_RANGES,abilityScore,canDefend,careerEnding,degreeRequirements,TRUE_REQUIREMENTS,TRUE_RESEARCH_REQUIREMENTS,EVENTS} from '../dist/engine.js';
import {getDiscipline} from '../dist/disciplines.js';
import {ENDINGS,getEndingPages,getEndingStory} from '../dist/stories.js';
import {endingStatistics} from '../dist/statistics.js';
import {endingEvidence} from '../dist/ending-evidence.js';
import {adaptResearchText,careerDescription} from '../dist/ending-context.js';
import {researchText} from '../dist/lab-scene.js';
import {prepareLetterPassages,collectSeenPassageIds} from '../dist/letter-archive.js';
import {MAIN_ENDINGS,endingCollection,retirementScenes} from '../dist/ending-collection.js';

const preferredFields={true:'090',postdoc:'056',institute:'055',corporate:'072',unrelated:'048',startup:'157',unemployed:'050',resident_researcher:'084',youtuber:'090',bachelor:'076',masters:'092',external_masters:'048',external_phd:'084'};
const displayNames={true:'김민지',postdoc:'박지훈',institute:'최수빈',corporate:'이서윤',unrelated:'김하늘',startup:'정지우',unemployed:'윤준영',resident_researcher:'이지혜',youtuber:'김준영',bachelor:'한민서',masters:'오현우',external_masters:'홍유진',external_phd:'서도윤',leave:'송예린',dropout:'김태윤',dismissed:'이민재',gameover:'장예진',unfinished:'백수아'};
const conditions={
 true:'박사학위요건과 자격시험을 충족하고, 아래 교수 임용 후보 요건 전체와 라포 80 이상을 충족한다. 다른 진로보다 먼저 판정한다.',
 postdoc:'교수 임용 후보 요건을 모두 충족하되 라포 40 이상·80 미만이다. 후보 요건을 충족하지 못한 학생의 일반 진로 판정과는 별도 분기다.',
 resident_researcher:'박사학위요건 충족, 라포 80 이상, 신중함 65 이상, 교수의 연구실 운영 40 이상. 트루·포닥 판정을 먼저 통과하지 않은 경우다. 정신력이 낮아서 잔류하는 조건은 없다.',
 institute:'연구수행 70 이상, 학습 65 이상, 자율성 60 이상, 게재 논문 4편 이상 또는 게재 논문 2편 이상·상위 논문 1편 이상. 점수 = 연구수행×0.45 + 학습×0.20 + 자율성×0.20 + min(논문 수,5)×3.',
 corporate:'산학 경험 55 이상, 연구수행 50 이상. 점수 = 산학 경험×0.65 + 연구수행×0.35. 라포는 진로 조건에 포함하지 않고 연락 거리와 장면에 반영한다.',
 unrelated:'산학 경험 20 이상, 의사소통 45 이상, 자율성 45 이상. 점수 = 산학 경험×0.35 + 의사소통×0.35 + 자율성×0.30. 라포는 진로 조건에 포함하지 않으며 낮은 라포에서는 메일 없는 9장면 후일담을 사용한다.',
 startup:'창업 경험 65 이상, 자율성 60 이상. 점수 = 창업 경험×0.70 + 자율성×0.30. 높은 라포에서는 계약을 분리한 연구실 스핀오프, 그 외에는 독립 창업 장면을 사용한다.',
 unemployed:'트루·포닥·교내 연구원 조건에 해당하지 않고, 정출연·기업 연구개발·새 분야·스타트업·영상 진로 점수가 모두 -1인 경우다. 학위를 마친 뒤 다음 일을 준비하는 후일담이다.',
 youtuber:'어학 90 이상·의사소통 90 이상이면 점수 80. 또는 과학소통 경험 65 이상·어학 45 이상이면 점수 = 과학소통×0.75 + 어학×0.15 + 의사소통×0.10. 두 점수 중 큰 값을 사용한다. 라포 조건이 없으며 퇴임식 해금 개수에서 제외한다.',
 bachelor:'24개월 진학 면담에서 학사 졸업을 선택하거나, 진학 지속 조건(라포 30 이상·의욕 30 이상)을 충족하지 못하거나, 학생이 내부 진학 권유를 거절하면 학사 졸업으로 종료한다.',
 masters:'석사과정 학위요건을 충족한 뒤 졸업을 선택하거나 박사 진학 권유를 거절한다. 석사 심사는 기본 48개월, 한 차례 연장한 경우 54개월이다.',
 external_masters:'24개월에 게재 논문 2편 이상·h-index 2 이상·연구수행 65 이상·어학 55 이상·상위 논문 또는 수상 1개 이상으로 외부 진학 상담이 열린다. 진학 지속 조건도 충족해야 하며, 외부 진학을 권유한 뒤 내부 잔류 추첨에 해당하지 않으면 종료한다.',
 external_phd:'석사 심사 시점에 게재 논문 3편 이상·h-index 3 이상·연구수행 65 이상·어학 55 이상·상위 논문 또는 수상 1개 이상으로 외부 박사 진학 상담이 열린다. 석사 학위요건과 진학 지속 조건도 충족하고, 외부 진학을 권유한 뒤 내부 잔류 추첨에 해당하지 않으면 종료한다.',
 leave:'월말 위기 판정이 2개월 연속이다. 위기는 체력 5 이하·스트레스 95 이상·정신력 5 이하 중 하나, 또는 관계 위기 조건이다. 관계 위기 조건에 해당하지 않은 경우 휴학으로 종료한다.',
 dropout:'월말 위기 판정이 2개월 연속이고, 종료 시점에 라포 8 이하·스트레스 85 이상·정신력 30 이하의 관계 위기 조건에도 해당하면 학위과정 중단으로 종료한다. 종료 시점에 관계 위기에 해당하지 않은 경우는 휴학으로 구분한다.',
 dismissed:'자격시험을 두 번 불합격한 경우다. 첫 불합격 뒤 3개월 준비기간이 주어지며, 최근 18개월 전공과목 공부 6주 이상·첫 불합격 이후 전공과목 공부 2주 이상이 재응시 준비 요건이다. 학습 45·연구수행 40·의욕 25 이상의 기본 기준도 필요하다.',
 gameover:'교수의 학술활동·교육·학교행정·연구실 운영 중 하나가 0에 도달하면 연구실 운영 종료로 판정한다. 학위요건 미충족·기간 종료·자격시험 중단은 같은 ID의 서로 다른 사유와 스크립트로 표시한다.',
 unfinished:'호환용으로 남아 있는 옛 저장 데이터의 스크립트다. 현재 엔진에서 이 ID를 새로 판정하지 않으며, 이전 저장 데이터의 unfinished는 gameover / graduation_requirements로 전환한다.',
};

export function entryFromState(original,{rename=false}={}){
 const s=structuredClone(original);
 if(rename)s.name=displayNames[s.ending]??s.name;
 const rapport=abilityScore(s,'rapport');
 return {name:s.name,ending:s.ending,fieldId:s.professorProfile.fieldId,labMode:s.professorProfile.labMode,month:s.month,relationship:rapport>=70?'close':rapport>=40?'reserved':'distant',endingReason:s.endingReason,career:{...s.career},statistics:endingStatistics(s),evidence:endingEvidence(s),memories:s.history.filter(h=>h.kind==='event'&&EVENTS.some(e=>e.id===h.id)&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<EVENTS.find(e=>e.id===h.id).options.length).slice(-16).map(h=>({kind:'event',id:h.id,choice:h.choice,month:h.month}))};
}
export function exampleMetadata(entry){
 const context={statistics:entry.statistics,fieldId:entry.fieldId,labMode:entry.labMode,relationship:entry.relationship},base=getEndingStory(entry.ending,context);
 const meta={title:adaptResearchText(base.title.ko,context),career:careerDescription(entry.ending,context,'ko',base.career.ko),time:base.time.ko};
 if(entry.ending==='unrelated'&&entry.relationship==='distant'){meta.title='연구실 밖의 길';meta.time='졸업 2년 뒤 · 메일 없이 남은 후일담';}
 if(entry.ending==='gameover'){
  const reasons={graduation_requirements:['졸업 준비 미완료','학위요건 미충족'],time_limit:['마지막 학기의 끝','8년 내 학위 미완료'],qual_failure:['다음 길을 의논하다','자격시험 미통과']};
  const detail=reasons[entry.endingReason];if(detail){[meta.title,meta.career]=detail;meta.time='지도 기간의 마지막 기록';}
 }
 return meta;
}
export function examplePages(entry){
 const context={statistics:entry.statistics,recommendation:entry.evidence?.recommendation,fieldId:entry.fieldId,labMode:entry.labMode,passageIds:entry.passageIds};
 return getEndingPages(entry.ending,'ko',entry.relationship,entry.name,entry.endingReason,entry.memories,context).map(text=>researchText(text,{professorProfile:{labMode:entry.labMode}}));
}
export function selectSamples(data){
 const rows=Array.isArray(data)?data:Array.isArray(data.samples)?data.samples:Object.values(data.samples??data).flat();
 const all=rows.filter(r=>r?.state?.ending||r?.ending&&r?.professorProfile).map(r=>r.state?{...r,state:r.state}:{state:r});
 const selected=new Map(),used=new Set();
 for(const id of [...MAIN_ENDINGS,'youtuber','bachelor','masters','external_masters','external_phd','leave','dropout','dismissed','gameover']){
  const pool=all.filter(r=>r.state.ending===id);if(!pool.length)continue;
  const score=r=>(r.state.professorProfile.fieldId===preferredFields[id]?100:0)+(used.has(r.state.professorProfile.fieldId)?0:10);
  pool.sort((a,b)=>score(b)-score(a));selected.set(id,pool[0]);used.add(pool[0].state.professorProfile.fieldId);
 }
 return selected;
}
function syntheticState(id,reason=null){
 const fieldId=preferredFields[id]??'090',d=getDiscipline(fieldId);
 const s=createState(displayNames[id],7919,{fieldId,labMode:fieldId==='056'||fieldId==='055'||fieldId==='092'?'wet':'dry',gender:['박지훈','윤준영','오현우','서도윤','이민재','김태윤','김준영'].includes(displayNames[id])?'male':'female'});
 s.month=id==='bachelor'||id==='external_masters'?24:id==='masters'||id==='external_phd'?48:id==='dismissed'?51:['leave','dropout','gameover'].includes(id)?36:96;
 s.route=['masters','external_phd'].includes(id)?'masters':'integrated';s.pending=null;s.pendingQueue=[];
 for(const [key,[lo,hi]]of Object.entries(HIDDEN_RANGES))s.hidden[key]=lo+(hi-lo)*.5;
 const score=(key,value)=>{const [lo,hi]=HIDDEN_RANGES[key];s.hidden[key]=lo+(hi-lo)*value/100;};
 for(const [key,value]of Object.entries({learning:60,research:55,language:60,stamina:65,resilience:65,motivation:65,stress:30,manners:65,autonomy:50,social:50,teaching:40,industry:10,enterprise:10,outreach:10,rapport:60}))score(key,value);
 s.temperament={curiosity:55,caution:45,expression:50};s.professor={research:65,teaching:65,admin:65,mentoring:65};
 Object.assign(s.career,degreeRequirements(s,['masters','external_phd'].includes(id)?'masters':'phd'),{submissions:6,qual:'passed',qualAttempts:1,topPapers:0,awards:0,recommendations:1});
 if(['true','postdoc'].includes(id)){
  for(const [key,value]of Object.entries(TRUE_REQUIREMENTS))if(key in s.hidden)score(key,Math.min(100,value+5));else if(key!=='faculty')s.career[key]=value;
  score('rapport',id==='true'?90:60);s.career.topPapers=TRUE_RESEARCH_REQUIREMENTS.leadingPaper;s.career.awards=0;s.impact={citations:[6,4,1],hIndex:TRUE_RESEARCH_REQUIREMENTS.hIndex};
 }else{
  const values={resident_researcher:{rapport:90,research:60,autonomy:65},corporate:{industry:85,research:60,autonomy:60},institute:{learning:80,research:85,autonomy:75},unrelated:{industry:35,social:70,autonomy:65,rapport:30},startup:{enterprise:88,autonomy:80,research:65},youtuber:{language:96,social:95},unemployed:{industry:10,social:40,autonomy:40},leave:{stress:96,resilience:25,stamina:4,rapport:60},dropout:{stress:90,resilience:25,rapport:5},dismissed:{learning:35,research:40,rapport:45},bachelor:{rapport:45},masters:{rapport:55}};
  for(const [key,value]of Object.entries(values[id]??{}))score(key,value);
  if(id==='resident_researcher')s.temperament.caution=85;
  if(id==='institute'){s.career.papers=Math.max(2,s.career.papers);s.career.topPapers=1;}
  if(id==='gameover'&&!reason)s.professor.admin=0;
  if(id==='gameover'&&reason){
   s.professor.admin=65;s.month=reason==='qual_failure'?48:96;
   s.career.qual=reason==='qual_failure'?'failed':'not_due';
   score('research',40);s.career.papers=0;s.career.submissions=0;s.career.conferences=0;
  }
  if(id==='dismissed'){s.career.qual='failed';s.career.qualAttempts=2;}
  if(id==='bachelor')Object.assign(s.career,{papers:0,conferences:0,submissions:0,qual:'not_due'});
  s.impact={citations:Array.from({length:s.career.papers},()=>1),hIndex:s.career.papers?1:0};
  if(['external_masters','external_phd'].includes(id)){
   score('research',75);score('language',65);score('learning',70);
   s.career.papers=id==='external_masters'?2:3;s.career.topPapers=1;
   s.impact={citations:Array.from({length:s.career.papers},()=>s.career.papers),hIndex:s.career.papers};
  }
 }
 s.ending=id;s.endingReason=reason??(id==='dismissed'?'qual_failure':null);
 assert.ok(d.labModes.includes(s.professorProfile.labMode));
 if(MAIN_ENDINGS.includes(id)||id==='youtuber'){assert.ok(canDefend(s));assert.equal(careerEnding(s),id);}
 return s;
}
const koLabels={learning:'학습',research:'연구수행',language:'어학',social:'의사소통',autonomy:'자율성',teaching:'교육 경험',rapport:'라포',industry:'산학 경험',enterprise:'창업 경험'};
function sampleParameters(state,entry){
 const scores=Object.keys(koLabels).map(key=>`${koLabels[key]} ${abilityScore(state,key).toFixed(1)}`).join(' · ');
 const c=state.career;return `능력·경험(정규화 0–100): ${scores}\n\n실적: 게재 논문 ${c.papers}편 · 학술 발표 ${c.conferences}회 · 상위 논문 ${c.topPapers}편 · 수상 ${c.awards}회 · 추천서 ${c.recommendations}건 · h-index ${state.impact.hIndex}\n\n기질: 호기심 ${state.temperament.curiosity.toFixed(1)} · 신중함 ${state.temperament.caution.toFixed(1)} · 표현성 ${state.temperament.expression.toFixed(1)}. 연락 거리: ${{close:'가까움',reserved:'중간',distant:'거리 유지'}[entry.relationship]}. 종료 시점 ${state.month}개월.`;
}
export async function writeExamples(){
 const packageInfo=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8'));
 let sampleData=null;try{sampleData=JSON.parse(await fs.readFile(new URL('../docs/ending-audit-samples.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const selected=sampleData?selectSamples(sampleData):new Map();
 const order=[...MAIN_ENDINGS,'youtuber','bachelor','masters','external_masters','external_phd','leave','dropout','dismissed','gameover'];
 const examples=order.map(id=>({id,sample:selected.get(id)??null,state:selected.get(id)?.state??syntheticState(id)}));
 for(const reason of ['graduation_requirements','time_limit','qual_failure'])examples.push({id:'gameover',reason,sample:null,state:syntheticState('gameover',reason)});
 examples.push({id:'unfinished',sample:null,state:syntheticState('unfinished')});
 assert.deepEqual(new Set(examples.map(e=>e.id)),new Set(Object.keys(ENDINGS)));
 const blocks=[`# 엔딩 스크립트 대표 시나리오\n\n2026-10-10 · 게임 ${packageInfo.version} · 한국어\n\n이 문서는 실제 게임의 \`getEndingPages\`·\`researchText\`·\`retirementScenes\`로 생성한 전체 장면입니다. 관측한 엔딩은 1만 회 시뮬레이션과 별도 실제 플레이의 종료 상태와 이름·분야·파라미터·이벤트 기록을 그대로 사용했습니다. 관측하지 못한 중도 종료 장면은 **합성 예시**로 명확히 구분하며, 그 설정이 실제 플레이로 도달했다는 뜻은 아닙니다. 엔딩 비율은 [별도 통계 보고서](ending-balance-audit.md)를 참고하세요.\n\n편지 안의 성격·능력·분야·연락 거리·실제로 기록된 선택에 관한 문장도 현재 생성 결과 그대로 포함합니다. 본문에 별도 편지가 없는 장면에 새 편지를 덧붙이지 않았습니다.\n\n## 판정 읽는 법\n\n박사 진로는 트루 → 포닥 → 교내 연구원 순으로 먼저 검사한 뒤, 나머지 유효한 진로 중 점수가 가장 큰 것을 선택합니다. 동점 순서는 영상 → 스타트업 → 기업 연구개발 → 정출연 → 새 분야입니다. 아래의 최소값 하나만 넘었다고 해당 엔딩이 보장되는 것은 아닙니다. 박사학위요건은 전공별이며, 자격시험 통과와 연구수행 50 이상도 필요합니다.\n\n학습·연구수행·어학·의사소통·라포 등의 기준은 원래 숨은 수치의 **0–100 정규화 점수**입니다. 라포에 따른 편지의 거리 구간은 가까움 70 이상, 중간 40 이상·70 미만, 거리 유지 40 미만입니다. 트루의 임용 기준인 라포 80는 그보다 엄격합니다.\n\n### 교수 임용 후보의 전체 요건\n\n| 항목 | 기준 |\n|---|---:|\n| 학습 | ${TRUE_REQUIREMENTS.learning} |\n| 연구수행 | ${TRUE_REQUIREMENTS.research} |\n| 어학 | ${TRUE_REQUIREMENTS.language} |\n| 의사소통 | ${TRUE_REQUIREMENTS.social} |\n| 자율성 | ${TRUE_REQUIREMENTS.autonomy} |\n| 교육 경험 | ${TRUE_REQUIREMENTS.teaching} |\n| 라포(트루 분기) | ${TRUE_REQUIREMENTS.rapport} |\n| 정신력 | ${TRUE_REQUIREMENTS.resilience} |\n| 예의범절 | ${TRUE_REQUIREMENTS.manners} |\n| 의욕 | ${TRUE_REQUIREMENTS.motivation} |\n| 게재 논문 | ${TRUE_REQUIREMENTS.papers}편 |\n| 학술 발표 | ${TRUE_REQUIREMENTS.conferences}회 |\n| 추천서 | ${TRUE_REQUIREMENTS.recommendations}건 |\n| 교수 업무 네 항목 각각 | ${TRUE_REQUIREMENTS.faculty} 이상 |\n| 상위 논문(추가) | ${TRUE_RESEARCH_REQUIREMENTS.leadingPaper}편 이상 |\n| h-index(추가) | ${TRUE_RESEARCH_REQUIREMENTS.hIndex} 이상 |\n\n공통 박사학위요건과 자격시험 통과도 검사합니다. 수상은 추가 성취로 기록하며 임용 후보의 필수 관문은 아닙니다. 임용 후보 조건에 라포를 제외하고 모두 해당하면, 라포 80 이상은 트루, 40 이상·80 미만은 포닥 후일담이 됩니다.\n\n외부 진학을 권해도 내부에 남을 확률은 \`clamp(0.1 + 라포×0.006, 0.1, 0.7)\`입니다. 내부 진학을 권했을 때 학생의 거절 확률은 라포 60 이상이면 0, 그 미만이면 \`clamp((60−라포)×0.012 + (의욕<50 ? 0.08 : 0), 0, 0.5)\`입니다.`];
 let auditRunCount=null;try{auditRunCount=JSON.parse(await fs.readFile(new URL('../docs/ending-balance-audit.json',import.meta.url),'utf8')).runs;}catch(e){if(e.code!=='ENOENT')throw e;}
 blocks[0]=blocks[0].replace('1만 회 시뮬레이션',`백엔드 시뮬레이션${Number.isInteger(auditRunCount)?`(${auditRunCount.toLocaleString('en-US')}회)`:''}`).replace('관측하지 못한 중도 종료 장면','관측하지 못한 엔딩 장면');
 const gallery=[];let seenPassageIds=[];
 for(let i=0;i<examples.length;i++){
  const item=examples[i],entry=prepareLetterPassages(entryFromState(item.state),seenPassageIds),meta=exampleMetadata(entry),pages=examplePages(entry);
  seenPassageIds=collectSeenPassageIds([entry],seenPassageIds);
  assert.ok(pages.length>0);assert.ok(!pages.join('\n').includes('{name}'));
  const source=item.sample?`**관측된 실제 종료 상태** · ${item.sample.policy??item.sample.strategy??'시뮬레이션 표본'} · run ${item.sample.run??item.sample.index??'기록 참조'}`:`**합성 예시** · ${item.id==='unfinished'?'호환용 옛 스크립트':'관측률과 별개로 스크립트 확인을 위한 대표 설정'}`;
  const detail=item.reason?`사유 \`${item.reason}\`. `:'';
  blocks.push(`## ${i+1}. ${meta.title}\n\n\`${item.id}\`${item.reason?` / \`${item.reason}\``:''} · ${meta.career} · ${meta.time}\n\n${source}\n\n대표 인물: ${entry.name} · ${getDiscipline(entry.fieldId).label} · ${entry.labMode==='dry'?'Dry lab':'Wet lab'}\n\n판정: ${detail}${conditions[item.id]}\n\n${sampleParameters(item.state,entry)}\n\n${pages.map((page,index)=>`### 장면 ${index+1}/${pages.length}\n\n${page}`).join('\n\n')}`);
  if(MAIN_ENDINGS.includes(item.id)||item.id==='youtuber')gallery.push({...entry,id:`example-${item.id}`});
 }
 const collection=endingCollection(gallery),retirement=retirementScenes(gallery);assert.equal(collection.count,8);assert.ok(collection.complete);
 blocks.push(`## ${examples.length+1}. 각자의 자리에서, 다시 만나다\n\n퇴임식 · 주요 엔딩 수집 후의 추가 시나리오\n\n해금: 주요 8종 중 5종 수집. 주요 8종을 모두 수집하면 마지막 장면 추가. 유튜버는 해금 개수에 포함하지 않으며, 이미 수집한 경우 참석 장면만 추가됩니다.\n\n아래는 주요 8종과 유튜버 후일담이 모두 기록된 경우의 전체 장면입니다. 실제 관측 표본의 이름과 후일담을 모아 만든 수집 예시이며, 한 학생이 모든 진로를 거친 이야기는 아닙니다.\n\n${retirement.map((page,index)=>`### 장면 ${index+1}/${retirement.length}\n\n${page}`).join('\n\n')}`);
 blocks.push('## 생성과 재현\n\n실행: `node scripts/ending-script-examples.mjs`. 표본 입력: `docs/ending-audit-samples.json`. 본문 생성: `dist/stories.js`, `dist/ending-voice.js`, `dist/ending-context.js`, `dist/lab-scene.js`. 진로 판정: `dist/engine.js`. 퇴임식: `dist/ending-collection.js`.\n\n합성 설정과 실제 관측 상태를 섞어서 엔딩 비율을 계산하지 않습니다. 모든 본문은 화면에 표시하는 순서 그대로이며, 가독성을 위한 장면 번호만 추가했습니다.');
 await fs.writeFile(new URL('../docs/ending-script-examples.md',import.meta.url),blocks.join('\n\n---\n\n')+'\n');
 return {scenarios:examples.length,retirementScenes:retirement.length,actualSamples:examples.filter(e=>e.sample).length,syntheticExamples:examples.filter(e=>!e.sample).length};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)console.log(JSON.stringify(await writeExamples()));
