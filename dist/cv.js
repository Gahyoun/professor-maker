import {JOURNALS,CONFERENCE_TIERS} from './venues.js';
import {researchText} from './lab-scene.js';
import {CHAPTERS,THESIS_SCENES} from './main-story.js';
import {hIndex} from './impact.js';
import {endingStatistics,validStatistics,renderStatistics} from './statistics.js';
import {projectTitle, PROJECT_TITLES, PROJECT_PHASES, EVENTS} from './engine.js';
import {ENDINGS} from './stories.js';
import {getDiscipline} from './disciplines.js';

// A worker can render this module without a DOM. Nothing here changes the save.
export const CV_TEMPLATES = Object.freeze([
  Object.freeze({id:'timeline',name:{ko:'연구의 시간선',en:'Research timeline'}}),
  Object.freeze({id:'ledger',name:{ko:'학술활동 원장',en:'Academic ledger'}}),
  Object.freeze({id:'folio',name:{ko:'졸업 포트폴리오',en:'Graduate folio'}}),
  Object.freeze({id:'dossier',name:{ko:'연구자 프로필',en:'Researcher dossier'}}),
  Object.freeze({id:'notebook',name:{ko:'연구실 노트',en:'Lab notebook'}}),
]);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const integer = value => Number.isFinite(value) ? Math.max(0,Math.trunc(value)) : 0;
const doctorateEndings = new Set(['true','institute','corporate','unrelated','startup','unemployed','youtuber','resident_researcher']);
const hash = text => {let value=2166136261;for(const character of text)value=Math.imul(value^character.charCodeAt(0),16777619)>>>0;return value;};
const tx = (locale,ko,en) => locale==='en'?en:ko;
function monthLabel(month,locale) {
  const elapsed=Math.max(0,integer(month)-1),year=Math.floor(elapsed/12)+1;
  const calendar=((elapsed+(locale==='en'?8:2))%12)+1;
  return locale==='en'?`Y${year} · ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calendar-1]}`:`${year}년차 ${calendar}월`;
}
function periodLabel(start,end,locale) {return `${monthLabel(start+1,locale)} — ${monthLabel(Math.max(start+1,end),locale)}`;}
function durationLabel(months,locale) {
  const years=Math.floor(months/12),remainder=months%12;
  if(locale==='en')return [years?`${years} ${years===1?'year':'years'}`:'',remainder?`${remainder} ${remainder===1?'month':'months'}`:''].filter(Boolean).join(' · ')||'0 months';
  return `${years?`${years}년`:''}${years&&remainder?' ':''}${remainder?`${remainder}개월`:''}`||'0개월';
}
function educationFrom(state,history,locale,months) {
  const t=(ko,en)=>tx(locale,ko,en),entries=[];
  const awardedBachelor=['bachelor','external_masters'].includes(state.ending)||(state.route!==null&&state.route!==undefined&&months>=24)||history.some(entry=>entry.kind==='route'&&entry.month>=24);
  entries.push({id:'undergraduate',title:t('학부연구생','Undergraduate researcher'),start:0,end:Math.min(months,24),status:awardedBachelor?t('학사 졸업','Bachelor’s degree completed'):t('연구실 활동 기록','Research experience'),awarded:awardedBachelor,degree:awardedBachelor?'bachelor':null});
  if(months<24||!['masters','integrated'].includes(state.route))return entries;
  const promotion=history.find(entry=>entry.kind==='promotion');
  const masterEnd=promotion?Math.min(months,integer(promotion.month)):['masters','external_phd'].includes(state.ending)?months:Math.min(months,integer(state.mastersReviewAt)||48);
  const doctorateComplete=doctorateEndings.has(state.ending)&&months>=96&&state.career?.qual==='passed';
  if(state.route==='masters') {
    const awardedMaster=['masters','external_phd'].includes(state.ending)||Boolean(promotion);
    entries.push({id:'masters',title:t('석사과정','Master’s program'),start:24,end:masterEnd,status:awardedMaster?t('석사학위 취득','Master’s degree completed'):t('학위 미완료','Degree not completed'),awarded:awardedMaster,degree:awardedMaster?'masters':null});
    // The promotion entry, rather than the calendar alone, proves PhD admission.
    if(promotion)entries.push({id:'doctorate',title:t('박사과정','Doctoral program'),start:integer(promotion.month),end:months,status:doctorateComplete?t('박사학위 취득','Doctorate completed'):t('학위 미완료','Degree not completed'),awarded:doctorateComplete,degree:doctorateComplete?'doctorate':null});
  } else entries.push({id:'integrated',title:t('석박사통합과정','Integrated MS / PhD program'),start:24,end:months,status:doctorateComplete?t('박사학위 취득','Doctorate completed'):t('학위 미완료','Degree not completed'),awarded:doctorateComplete,degree:doctorateComplete?'doctorate':null});
  return entries.map(entry=>({...entry,period:periodLabel(entry.start,entry.end,locale)}));
}
function projectsFrom(state,history,locale) {
  const records=new Map(),t=(ko,en)=>tx(locale,ko,en);
  for(const entry of history) {
    const id=integer(entry.projectId);if(!id)continue;
    if(!records.has(id))records.set(id,{id,title:projectTitle(state,id,locale),firstMonth:integer(entry.month),lastMonth:integer(entry.month),status:'ongoing',submissions:0,presentations:0,revisions:0});
    const record=records.get(id);record.lastMonth=Math.max(record.lastMonth,integer(entry.month));
    if(entry.kind==='submission'){record.submissions++;record.status='submitted';}
    if(entry.kind==='conference'){record.presentations++;if(Object.hasOwn(CONFERENCE_TIERS,entry.tier))record.conferenceTier=entry.tier;}
    if(entry.kind==='revision')record.revisions++;
    if(entry.kind==='paper'){record.status='accepted';record.acceptedMonth=integer(entry.month);if(Object.hasOwn(JOURNALS,entry.journal)){record.journal=entry.journal;record.impactFactor=JOURNALS[entry.journal].impactFactor;}}
  }
  const current=state.project,id=integer(current?.id);
  if(id&&!records.has(id)&&(integer(current.phase)>0||Number(current.progress)>0||!records.size)) {
    const index=integer(current.titleIndex)%PROJECT_TITLES.length;
    records.set(id,{id,title:projectTitle(state,id,locale),firstMonth:records.size?integer(state.month):0,lastMonth:integer(state.month),status:current.submitted?'submitted':'ongoing',submissions:current.submitted?1:0,presentations:current.conference?1:0,revisions:integer(current.revisions)});
  }
  return [...records.values()].sort((a,b)=>a.id-b.id).map(record=>({...record,statusLabel:record.status==='accepted'?t('게재 확정','Accepted'):record.status==='submitted'?t('투고 · 심사 기록','Submitted / reviewed'):t('진행 중인 연구','Research in progress'),phase:record.id===id?PROJECT_PHASES[integer(current.phase)]?.[locale]||'':t('연구 완료','Completed')}));
}
function memoriesFrom(history,locale) {
  const t=(ko,en)=>tx(locale,ko,en),candidates=[];
  for(const entry of history) {
    let title='',detail='';
    if(entry.kind==='story'&&CHAPTERS[entry.id]){title=CHAPTERS[entry.id].title;detail=CHAPTERS[entry.id].options[entry.choice==='encourage'?0:1];}else if(entry.kind==='thesis'&&THESIS_SCENES[entry.step]){title=`${entry.level==='masters'?'석사':'박사'} · ${THESIS_SCENES[entry.step].title}`;detail=entry.step==='verdict'?(entry.passed?'심사를 마치고 다음 길을 준비했다.':'남은 준비와 다음 길을 함께 의논했다.'):'논문과 발표를 자신의 언어로 정리했다.';}else if(entry.kind==='event') {
      const event=EVENTS.find(event=>event.id===entry.id);if(!event)continue;
      title=event.title[locale];detail=event.options[integer(entry.choice)]?.label[locale]||'';
    } else if(entry.kind==='sabbatical'){title=t('교수의 연구년','An advisor’s sabbatical');detail=entry.mode==='away'?t('해외 연구년 동안 원격 지도를 이어갔다.','Advising continued remotely during an overseas sabbatical.'):t('국내에 머무르며 지도를 이어갔다.','Advising continued while the advisor remained at home.');}
    else if(entry.kind==='qual'&&entry.passed){title=t('자격시험 통과','Qualifying exam passed');detail=t('연구 질문을 자신의 언어로 설명했다.','The research question could now be explained in their own words.');}
    else if(entry.kind==='advising-conversation'){title=t('연구 밖의 안부를 묻다','A conversation beyond research');detail=t('교수와 학생이 별도의 면담에서 생활과 다음 계획을 의논했다.','The advisor and student discussed life and next steps in a separate meeting.');}
    else if(entry.kind==='research-travel'&&entry.performed&&entry.attendance!=='professor'){title=t('방학 중 해외학회','An overseas conference during the break');detail=entry.joining?t('교수와 학생이 함께 학회에 다녀왔다.','The advisor and student attended together.'):t('학생이 스스로 학회에 다녀왔다.','The student attended independently.');}
    else if(entry.kind==='presentation-award'){title=t('학술발표 수상','A presentation award');detail=t('연구 발표가 좋은 평가를 받았다.','A research presentation earned recognition.');}
    else if(entry.kind==='recommendation'){title=t('추천서 한 통','A letter of recommendation');detail=t('다음 기회를 위해 추천서를 준비했다.','A recommendation was prepared for the next opportunity.');}
    else if(entry.kind==='paper'){title=t('논문 게재 확정','A paper accepted');detail=t(`프로젝트 ${integer(entry.projectId)}의 연구가 하나의 기록이 되었다.`,`Project ${integer(entry.projectId)} became part of the research record.`);}
    else if(entry.kind==='conference'){title=t('연구를 처음 밖으로 꺼내다','Taking the research beyond the lab');detail=t(`프로젝트 ${integer(entry.projectId)}의 학술발표를 마쳤다.`,`Presented project ${integer(entry.projectId)} at a conference.`);}
    if(title)candidates.push({month:integer(entry.month),title,detail,kind:entry.kind});
  }
  // Keep an early milestone, then a varied set of later memories.
  const picked=[],seen=new Set();
  for(const item of candidates.length?[candidates[0],...candidates.slice(1).reverse()]:[]) {
    const key=`${item.kind}:${item.title}`;if(seen.has(key))continue;seen.add(key);picked.push(item);if(picked.length===6)break;
  }
  // Academic decisions are made at the opening of the next month; research
  // outcomes are logged for the month that has just finished.
  return picked.sort((a,b)=>a.month-b.month).map(memory=>({...memory,date:monthLabel(memory.month+(['sabbatical','qual'].includes(memory.kind)?1:0),locale)}));
}
function makeModel(state) {
  const locale=state.locale==='en'?'en':'ko',months=Math.min(96,integer(state.month));
  const history=Array.isArray(state.history)?state.history.filter(entry=>entry&&typeof entry==='object'&&integer(entry.month)<=months):[];
  const education=educationFrom(state,history,locale,months).map(entry=>({...entry,period:entry.period||periodLabel(entry.start,entry.end,locale)}));
  const career=state.career||{};
  return {version:2,advisor:{name:state.professorName||'지도교수',gender:state.professorProfile.gender,age:state.professorProfile.age,institution:state.professorProfile.institution},statistics:endingStatistics(state),impact:{hIndex:state.impact?.hIndex??0,citations:[...(state.impact?.citations??[])]},locale,name:String(state.name??''),ending:state.ending,careerPath:ENDINGS[state.ending]?.career[locale]||tx(locale,'다음 길을 준비 중','Preparing the next chapter'),field:getDiscipline(state.professorProfile?.fieldId).label,months,duration:durationLabel(months,locale),period:periodLabel(0,months,locale),education,outputs:{completedProjects:integer(career.completedProjects),acceptedPapers:integer(career.papers),submissions:integer(career.submissions),conferences:integer(career.conferences),awards:integer(career.awards),recommendations:integer(career.recommendations)},projects:projectsFrom(state,history,locale),memories:memoriesFrom(history,locale),qual:career.qual==='passed'?tx(locale,'자격시험 통과','Qualifying exam passed'):null};
}
function renderParts(model,{summary=false}={}) {
  const t=(ko,en)=>tx(model.locale,ko,en),e=escapeHTML;
  const items=[['completedProjects',t('완료 프로젝트','Completed projects')],['acceptedPapers',t('게재 논문','Accepted papers')],['submissions',t('논문 투고','Submissions')],['conferences',t('학술발표','Presentations')],['awards',t('수상','Awards')],['recommendations',t('추천서','Recommendations')]];
  const education=model.education.map(entry=>`<li><time>${e(entry.period)}</time><div><h3>${e(entry.title)}</h3><p>${e(entry.status)}</p></div><span class="cv-degree-status ${entry.awarded?'cv-awarded':''}">${entry.awarded?'✓':'—'}</span></li>`).join('');
  const projects=model.projects.map(project=>`<li><span class="cv-project-number">${String(project.id).padStart(2,'0')}</span><div><h3>${e(project.title)}</h3><p>${e(project.statusLabel)}${project.journal?` · ${e(JOURNALS[project.journal].label)} (가상 IF ${project.impactFactor})`:''}${project.conferenceTier?` · ${e(CONFERENCE_TIERS[project.conferenceTier].label)}`:''}${project.presentations?` · ${e(t(`학술발표 ${project.presentations}회`,`${project.presentations} presentation${project.presentations===1?'':'s'}`))}`:''}${project.revisions?` · ${e(t(`수정 ${project.revisions}회`,`${project.revisions} revision${project.revisions===1?'':'s'}`))}`:''}</p></div></li>`).join('');
  const memories=model.memories.length?model.memories.map(memory=>`<li><time>${e(memory.date)}</time><div><h3>${e(memory.title)}</h3><p>${e(memory.detail)}</p></div></li>`).join(''):`<li class="cv-empty">${e(t('첫 기록을 남긴 시간도 이 이력의 일부다.','The beginning belongs in this record, too.'))}</li>`;
  const metricHTML=items.map(([key,label])=>`<div><dt>${e(label)}</dt><dd>${model.outputs[key]}</dd></div>`).join('');
  const publications=model.projects.filter(project=>project.status==='accepted').map(project=>`<li><time>${e(monthLabel(project.acceptedMonth??project.lastMonth,model.locale))}</time><div><h3>${e(project.title)}</h3><p>${e(model.name)} · ${e(t('게재 확정','Accepted'))}${project.journal?` · ${e(JOURNALS[project.journal].label)} · 가상 IF ${project.impactFactor}`:''}</p></div></li>`).join('');
  return {e,t,education,projects,memories,metricHTML,
    title:`<p class="cv-kicker">PROFESSOR MAKER · ${e(t('연구실 활동 기록','Research record'))}</p><h1>${e(model.name)}</h1><p class="cv-career">${e(ENDINGS[model.ending].career[model.locale])}</p><p class="cv-field">${e(model.field)}</p>${model.advisor?`<p class="cv-advisor">지도교수: ${e(model.advisor.name)} · ${e(({national:'국립대',private:'사립대',institute:'과학기술원'})[model.advisor.institution])}</p>`:''}<p class="cv-fiction-notice">게임에서 생성한 가상의 활동 기록 · 실제 학위·경력 증명서가 아닙니다.</p>`,
    period:`<p class="cv-period"><strong>${e(model.duration)}</strong><span>${e(model.period)}</span></p>`,
    educationSection:`<section class="cv-section"><h2>${e(t('학력과 연구 경험','Education & research experience'))}</h2><ol class="cv-education">${education}</ol></section>`,
    projectSection:`${!summary&&publications?`<section class="cv-section"><h2>${e(t('연구 논문','Publications'))}</h2><ol class="cv-memories cv-publications">${publications}</ol></section>`:''}<section class="cv-section"><h2>${e(t('연구 프로젝트','Research projects'))}</h2><ol class="cv-projects">${projects}</ol></section>`,
    memorySection:`<section class="cv-section"><h2>${e(t('연구실에서 남긴 장면','Moments from the lab'))}</h2><ol class="cv-memories">${memories}</ol></section>`,
    footer:`<footer class="cv-footer"><span>Professor Maker · GAME RECORD</span><span>${e(t('지도 종료 시점의 활동 기록','Activity record at the end of advising'))}</span></footer>`,
  };
}
const renderers={
  timeline:(m,p)=>`<header class="cv-header">${p.title}${p.period}</header><dl class="cv-metrics">${p.metricHTML}</dl><div class="cv-timeline-body">${p.educationSection}${p.projectSection}${p.memorySection}</div>${p.footer}`,
  ledger:(m,p)=>`<header class="cv-header"><span class="cv-record-stamp">CV / ${String(m.months).padStart(2,'0')}</span>${p.title}${p.period}</header><section class="cv-section"><h2>${p.e(p.t('학술활동 집계','Academic activity ledger'))}</h2><table class="cv-ledger-table"><thead><tr><th scope="col">${p.e(p.t('항목','Activity'))}</th><th scope="col">${p.e(p.t('기록','Count'))}</th></tr></thead><tbody>${[['completedProjects','완료 프로젝트','Completed projects'],['acceptedPapers','게재 논문','Accepted papers'],['submissions','논문 투고','Submissions'],['conferences','학술발표','Presentations'],['awards','수상','Awards'],['recommendations','추천서','Recommendations']].map(([key,ko,en])=>`<tr><th scope="row">${p.e(p.t(ko,en))}</th><td>${m.outputs[key]}</td></tr>`).join('')}</tbody></table></section><div class="cv-ledger-body">${p.educationSection}${p.projectSection}${p.memorySection}</div>${p.footer}`,
  folio:(m,p)=>`<header class="cv-header"><div>${p.title}</div>${p.period}</header><p class="cv-folio-line">${p.e(p.t('배운 것들은 다음 길에도 남는다.','What was learned travels into the next chapter.'))}</p><div class="cv-folio-body">${p.educationSection}<section class="cv-section"><h2>${p.e(p.t('연구의 기록','The research record'))}</h2><dl class="cv-metrics">${p.metricHTML}</dl></section>${p.projectSection}${p.memorySection}</div>${p.footer}`,
  dossier:(m,p)=>`<div class="cv-dossier-layout"><aside class="cv-dossier-sidebar"><header class="cv-header">${p.title}${p.period}</header><dl class="cv-metrics">${p.metricHTML}</dl></aside><div class="cv-dossier-main">${p.educationSection}${p.projectSection}${p.memorySection}</div></div>${p.footer}`,
  notebook:(m,p)=>`<header class="cv-header"><span class="cv-notebook-tab">LAB NOTE / ${String(m.months).padStart(2,'0')}</span>${p.title}${p.period}</header><div class="cv-notebook-body">${p.educationSection}<section class="cv-section"><h2>${p.e(p.t('기록의 여백','By the numbers'))}</h2><dl class="cv-metrics">${p.metricHTML}</dl></section>${p.projectSection}${p.memorySection}</div>${p.footer}`,
};

const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const boundedText=(value,max)=>typeof value==='string'&&value.length<=max;
const boundedInteger=(value,max=10000)=>Number.isInteger(value)&&value>=0&&value<=max;
const allowedKeys=(value,keys)=>Object.keys(value).every(key=>keys.includes(key));

/** Imported snapshots are data, never a source of trusted HTML. */
export function validateCVModel(model) {
  if(!plain(model)||!allowedKeys(model,['version','templateId','locale','name','ending','careerPath','field','months','duration','period','education','outputs','projects','memories','qual','advisor','statistics','impact']))return false;
  if(![1,2].includes(model.version)||!CV_TEMPLATES.some(template=>template.id===model.templateId)||!['ko','en'].includes(model.locale)||!boundedText(model.name,128)||!model.name.trim()||!Object.hasOwn(ENDINGS,model.ending)||model.ending==='gameover')return false;
  if(!boundedInteger(model.months,96)||!boundedText(model.careerPath,200)||!boundedText(model.field,100)||!boundedText(model.duration,80)||!boundedText(model.period,120)||!(model.qual===null||boundedText(model.qual,100)))return false;
  if(model.impact!==undefined&&(!plain(model.impact)||!allowedKeys(model.impact,['hIndex','citations'])||!boundedInteger(model.impact.hIndex,model.outputs?.acceptedPapers??0)||!Array.isArray(model.impact.citations)||model.impact.citations.length>(model.outputs?.acceptedPapers??0)||!model.impact.citations.every(n=>boundedInteger(n,100000))||model.impact.hIndex!==hIndex(model.impact.citations)))return false;
  if(model.version===1&&(Object.hasOwn(model,'advisor')||Object.hasOwn(model,'statistics')||Object.hasOwn(model,'impact')))return false;
  if(model.version===2&&(!plain(model.advisor)||!allowedKeys(model.advisor,['name','gender','age','institution'])||!boundedText(model.advisor.name,40)||!model.advisor.name.trim()||!['male','female','other'].includes(model.advisor.gender)||!Number.isInteger(model.advisor.age)||model.advisor.age<30||model.advisor.age>55||!['national','private','institute'].includes(model.advisor.institution)||!validStatistics(model.statistics)))return false;
  const outputKeys=['completedProjects','acceptedPapers','submissions','conferences','awards','recommendations'];
  if(!plain(model.outputs)||!allowedKeys(model.outputs,outputKeys)||!outputKeys.every(key=>boundedInteger(model.outputs[key])))return false;
  if(!Array.isArray(model.education)||model.education.length<1||model.education.length>3)return false;
  for(const entry of model.education) {
    if(!plain(entry)||!allowedKeys(entry,['id','title','start','end','status','awarded','degree','period'])||!['undergraduate','masters','doctorate','integrated'].includes(entry.id)||!boundedText(entry.title,160)||!boundedText(entry.status,160)||!boundedText(entry.period,120)||!boundedInteger(entry.start,96)||!boundedInteger(entry.end,model.months)||entry.start>entry.end||typeof entry.awarded!=='boolean'||![null,'bachelor','masters','doctorate'].includes(entry.degree)||entry.awarded!==(entry.degree!==null))return false;
    if(entry.degree==='doctorate'&&(!doctorateEndings.has(model.ending)||model.months<96||!model.qual))return false;
    if(entry.degree==='bachelor'&&model.months<24)return false;
  }
  if(!Array.isArray(model.projects)||model.projects.length>100)return false;
  for(const project of model.projects) {
    if(project.journal!==undefined&&!Object.hasOwn(JOURNALS,project.journal)||project.impactFactor!==undefined&&(!Number.isFinite(project.impactFactor)||project.impactFactor<0||project.impactFactor>100)||project.conferenceTier!==undefined&&!Object.hasOwn(CONFERENCE_TIERS,project.conferenceTier))return false;
    if(!plain(project)||!allowedKeys(project,['id','title','firstMonth','lastMonth','status','submissions','presentations','revisions','acceptedMonth','statusLabel','phase','journal','impactFactor','conferenceTier'])||!boundedInteger(project.id,1000)||project.id===0||!boundedText(project.title,200)||!boundedInteger(project.firstMonth,model.months)||!boundedInteger(project.lastMonth,model.months)||project.firstMonth>project.lastMonth||!['ongoing','submitted','accepted'].includes(project.status)||!['submissions','presentations','revisions'].every(key=>boundedInteger(project[key]))||!boundedText(project.statusLabel,160)||!boundedText(project.phase,100)||!(project.acceptedMonth===undefined||boundedInteger(project.acceptedMonth,model.months)))return false;
  }
  if(!Array.isArray(model.memories)||model.memories.length>6)return false;
  for(const memory of model.memories)if(!plain(memory)||!allowedKeys(memory,['month','title','detail','kind','date'])||!boundedInteger(memory.month,model.months)||!boundedText(memory.title,200)||!boundedText(memory.detail,800)||!boundedText(memory.kind,80)||!boundedText(memory.date,100))return false;
  return true;
}

/** Re-render saved data using a known layout and escape every text/attribute value. */
export function renderCV(model) {
  if(!validateCVModel(model))throw new Error('Invalid CV snapshot.');
  const fullParts=renderParts(model),parts=renderParts({...model,projects:model.projects.slice(-2),memories:model.memories.slice(-2)},{summary:true});
  return `<article class="cv-document cv-${model.templateId}" lang="${model.locale}" aria-label="${escapeHTML(tx(model.locale,`${model.name}의 경력 기록`,`${model.name}’s career record`))}"><span class="cv-watermark" aria-hidden="true">PROFESSOR MAKER · GAME RECORD</span><div class="cv-summary">${renderers[model.templateId](model,parts)}${model.impact?`<p class="cv-impact">h-index ${model.impact.hIndex} · 가상 학술 인용 ${model.impact.citations.reduce((a,b)=>a+b,0)}회</p>`:''}</div>${model.statistics?`<div class="research-report"><header><small>PROFESSOR MAKER · SIMULATION REPORT</small><h1>지도 종료 기록: 상태 변수 및 수행 이력</h1><p>가상의 단일 플레이 기록 · 재현 가능한 시뮬레이션 결과</p></header>${renderStatistics(model.statistics)}<p class="report-methods">자료: 해당 게임 종료 시점의 저장 상태. 막대는 각 변수의 값을 표시하며 오차막대는 표시하지 않는다. 각 척도의 범위는 게임 설계에 의해 정의된다. 실제 사람을 측정한 자료가 아니다.</p><section class="report-appendix"><h2>부록 · 연구 활동 및 주요 경험</h2>${fullParts.projectSection}${fullParts.memorySection}</section></div>`:''}</article>`;
}

/** Render an immutable career snapshot for a completed run. Parameter snapshots are included only after advising has ended. */
export function buildEndingCV(state) {
  if(!state||typeof state!=='object'||!state.ending||state.ending==='gameover'||!Object.hasOwn(ENDINGS,state.ending))return null;
  const model=makeModel(state),index=hash(`${Number(state.seed)>>>0}|${state.month}|${state.ending}`)%CV_TEMPLATES.length;
  model.templateId=CV_TEMPLATES[index].id;for(const p of model.projects){p.title=researchText(p.title,state);p.phase=researchText(p.phase,state);}for(const m of model.memories){m.title=researchText(m.title,state);m.detail=researchText(m.detail,state);}
  return {templateId:model.templateId,html:renderCV(model),model};
}
