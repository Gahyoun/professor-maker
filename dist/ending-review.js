import {closureSummary} from './lab-risk.js';
import {ENDINGS,getEndingPages,getEndingStory} from './stories.js';
import {MAIN_ENDINGS,endingCollection,retirementScenes} from './ending-collection.js';
import {endingStatistics,renderStatistics} from './statistics.js';
import {endingEvidence,renderEvidence} from './ending-evidence.js';
import {adaptResearchText,careerDescription} from './ending-context.js';
import {abilityScore,EVENTS} from './engine.js';
import {getDiscipline} from './disciplines.js';
import {weeklyAppearance,renderPortrait} from './appearance.js';
import {researchText} from './lab-scene.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const REVIEW_ENDING_LABELS={true:'두 교수 · 트루 엔딩',postdoc:'박사후연구원',institute:'정부출연연구기관',corporate:'기업 연구·개발',unrelated:'연구실 밖의 길',startup:'스타트업',unemployed:'다음 자리를 기다리며',resident_researcher:'교내 연구직',youtuber:'과학소통 영상 · 특수 엔딩',bachelor:'학사 졸업',masters:'석사 졸업',external_masters:'외부 대학원 진학',external_phd:'외부 박사과정 진학',leave:'휴학',withdrawal:'자퇴',dismissed:'자격시험 이후',unfinished:'마지막 기록',gameover:'지도 종료'};

// Only real completed audit states become review records. The viewer never imports
// or writes a player save, gallery, IndexedDB checkpoint, or simulation state.
export function reviewRecord(sample){
 const s=sample.state;
 if(!s?.ending||!Object.hasOwn(ENDINGS,s.ending))throw new Error('A completed simulation ending is required');
 const field=getDiscipline(s.professorProfile.fieldId),rapport=abilityScore(s,'rapport');
 return {id:`audit-${sample.run??sample.seed}-${s.ending}-${field.id}`,ending:s.ending,name:s.name,month:s.month,fieldId:field.id,field:field.label,labMode:s.professorProfile.labMode,relationship:rapport>=70?'close':rapport>=40?'reserved':'distant',rapport,endingReason:s.endingReason??null,...(s.labClosure?{labClosure:structuredClone(s.labClosure)}:{}),statistics:endingStatistics(s),evidence:endingEvidence(s),memories:s.history.filter(h=>h.kind==='event'&&EVENTS.some(e=>e.id===h.id&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<e.options.length)).slice(-16).map(h=>({kind:'event',id:h.id,choice:h.choice,month:h.month})),career:{papers:s.career.papers,awards:s.career.awards,conferences:s.career.conferences},hIndex:s.impact?.hIndex??0,appearance:weeklyAppearance(s),source:{seed:sample.seed,run:sample.run??null,policy:sample.policy}};
}
export function reviewMeta(record){
 const context={statistics:record.statistics,fieldId:record.fieldId,field:record.field,labMode:record.labMode,relationship:record.relationship},story=getEndingStory(record.ending,context);
 const meta={title:adaptResearchText(story.title.ko,context),career:careerDescription(record.ending,context,'ko',story.career.ko),time:story.time.ko,type:record.ending==='true'?'TRUE ENDING':record.ending==='youtuber'?'SPECIAL ENDING':MAIN_ENDINGS.includes(record.ending)?'EPILOGUE':'ENDING'};
 if(record.ending==='unrelated'&&record.relationship==='distant'){meta.title='연구실 밖의 길';meta.time='졸업 2년 뒤 · 메일 없이 남은 후일담';}
 if(record.ending==='gameover'){
  if(record.labClosure){meta.title='지속할 수 없었던 연구실';meta.career=closureSummary(record);}const reason={graduation_requirements:['졸업 준비 미완료','학위요건 미충족'],time_limit:['마지막 학기의 끝','8년 내 학위 미완료'],qual_failure:['다음 길을 의논하다','자격시험 미통과']}[record.endingReason];
  if(reason){[meta.title,meta.career]=reason;meta.time='지도 기간의 마지막 기록';}
 }
 return meta;
}
export function reviewPages(record){return getEndingPages(record.ending,'ko',record.relationship,record.name,record.endingReason,record.memories,{statistics:record.statistics,recommendation:record.evidence?.recommendation,fieldId:record.fieldId,field:record.field,labMode:record.labMode,labClosure:record.labClosure,passageIds:record.passageIds}).map(text=>researchText(text,{professorProfile:{labMode:record.labMode}}));}
export function reviewCollection(records){
 const gallery=MAIN_ENDINGS.flatMap(id=>{const record=records.find(r=>r.ending===id);return record?[record]:[];});
 const special=records.find(r=>r.ending==='youtuber');if(special)gallery.push(special);
 return {gallery,...endingCollection(gallery),pages:retirementScenes(gallery)};
}
const paragraphHTML=text=>text.split('\n\n').map(p=>`<p>${escape(p).replaceAll('\n','<br>')}</p>`).join('');
const sourceLine=record=>`자동 플레이 실제 종료 · 전략 ${escape(record.source.policy)} · seed ${escape(record.source.seed)} · ${record.month}개월 수행`;
function sceneHTML(record,body,meta){
 const mail=/교수님께\.|Dear Professor,|메일은 이렇게 이어졌다\.|The email continued\./.test(body);
 return `<div class="vn-scene ${mail?'vn-mail':'vn-memory'}" aria-label="${mail?'편지를 읽는 교수의 책상':'연구실을 돌아보는 장면'}"><div class="vn-window"></div><div class="vn-desk"><span class="vn-screen">${mail?'도착한 편지':'함께한 기록'}</span><span class="vn-cup"></span></div>${renderPortrait(record.appearance,`${record.name}의 학생 도트`)}<div class="vn-scene-caption">${escape(meta.time)}</div></div>`;
}
function retirementSceneHTML(){return `<div class="vn-scene review-retirement" aria-label="퇴임식 강당"><div class="vn-window"></div><div class="vn-desk"><span class="vn-screen">퇴임식 · 함께한 시간</span></div><div class="review-audience" aria-hidden="true">${Array.from({length:8},()=>'<i></i>').join('')}</div><div class="vn-scene-caption">여러 회차에서 함께한 제자들의 마지막 기록</div></div>`;}

async function boot(){
 const status=document.querySelector('#review-status'),reader=document.querySelector('#reader');
 let data;
 try{const response=await fetch('./ending-review-data.json',{cache:'no-cache'});if(!response.ok)throw new Error('Ending audit data unavailable');data=await response.json();if(!Array.isArray(data.records)||!data.records.length)throw new Error('Ending audit records empty');}
 catch{status.className='review-error';status.textContent='종료 기록을 불러오지 못했습니다. 새로고침해 다시 확인해 주세요.';return;}
 const records=data.records,collection=reviewCollection(records),available=[...MAIN_ENDINGS,...Object.keys(ENDINGS).filter(id=>!MAIN_ENDINGS.includes(id))].filter(id=>records.some(r=>r.ending===id));
 let current='',sampleIndex=0,page=0,full=false;
 document.querySelector('#review-layout').hidden=false;status.hidden=true;
 document.querySelector('#collection-proof').innerHTML=`<strong>주요 엔딩 ${collection.count} / ${collection.total}</strong><span>${collection.complete?'전체 수집 · 퇴임식의 마지막 장면까지 해금':collection.unlocked?'퇴임식 해금':'퇴임식은 주요 엔딩 5종부터 해금'}</span><span>유튜버 엔딩은 해금 수에 포함되지 않습니다.</span>`;
 function navigation(){document.querySelector('#ending-nav').innerHTML=available.map(id=>{const count=records.filter(r=>r.ending===id).length;return `<a href="#${id}" ${current===id?'aria-current="page"':''}>${escape(REVIEW_ENDING_LABELS[id]??ENDINGS[id].title.ko)}<small>실제 종료 기록 · ${count}개 전공·상태</small></a>`;}).join('')+`<a href="#retirement" ${current==='retirement'?'aria-current="page"':''}>퇴임식<small>${collection.complete?'주요 8종 전체 · 마지막 장면 해금':collection.unlocked?'주요 5종 이상 · 해금':'아직 해금되지 않음'}</small></a>`;}
 function pagination(pages){return `<div class="letter-pagination review-pagination"><button class="secondary" data-action="prev" ${page===0?'disabled':''}>← 이전</button><span class="review-page-count" aria-live="polite">${page+1} / ${pages.length}</span><button class="primary" data-action="${page===pages.length-1?'first':'next'}">${page===pages.length-1?'첫 장면으로':'다음 →'}</button></div>`;}
 function render(){
  navigation();full=false;
  if(current==='retirement'){
   const pages=collection.pages;page=Math.max(0,Math.min(page,pages.length-1));
   reader.innerHTML=pages.length?`<div class="review-source">실제 종료 기록 ${collection.count}종으로 수집 판정 · ${collection.complete?'전체 수집 완료':'퇴임식 해금'}</div>${retirementSceneHTML()}<div class="vn-text"><div class="letter-meta">RETIREMENT<span>평행세계의 제자들이 한 자리에</span></div><h2>각자의 자리에서, 다시 만나다</h2><div class="letter-paper" aria-live="polite">${paragraphHTML(pages[page])}</div>${pagination(pages)}${page===pages.length-1?'<p class="review-finish-note">주요 엔딩 8종 전체 수집으로 마지막 장면까지 도달했습니다.</p>':''}<details><summary>퇴임식 해금에 사용한 실제 종료 기록</summary><div class="review-collected">${collection.gallery.filter(r=>MAIN_ENDINGS.includes(r.ending)).map(r=>`<p><strong>${escape(REVIEW_ENDING_LABELS[r.ending])}</strong>${escape(r.name)} · ${escape(r.field)} · ${escape(r.labMode)} lab<br>${sourceLine(r)}</p>`).join('')}</div></details></div>`:'<div class="vn-text"><h2>퇴임식 기록</h2><p>주요 엔딩 5종의 실제 종료 기록이 필요합니다.</p></div>';
   return;
  }
  const candidates=records.filter(r=>r.ending===current);sampleIndex=Math.min(sampleIndex,candidates.length-1);const record=candidates[sampleIndex],meta=reviewMeta(record),pages=reviewPages(record);page=Math.max(0,Math.min(page,pages.length-1));
  reader.innerHTML=`<div class="review-controls"><label>전공별 실제 플레이 기록<select id="review-sample">${candidates.map((r,i)=>`<option value="${i}" ${i===sampleIndex?'selected':''}>${escape(r.field)} · ${r.labMode==='wet'?'Wet':'Dry'} lab · ${escape(r.name)} · 라포 ${r.rapport.toFixed(1)}</option>`).join('')}</select></label><button class="secondary" data-action="full">전체 스크립트 펼치기</button></div><div class="review-summary"><span><strong>${escape(record.name)}</strong> · ${escape(record.field)}</span><span>라포 ${record.rapport.toFixed(1)} / 100</span><span>논문 ${record.career.papers} · 수상 ${record.career.awards} · h-index ${record.hIndex}</span></div><div class="review-source">${sourceLine(record)}</div>${sceneHTML(record,pages[page],meta)}<div class="vn-text"><div class="letter-meta">${escape(meta.type)}<span>${escape(meta.career)}</span></div><h2>${escape(meta.title)}</h2><p class="letter-time">${escape(record.name)}의 ${record.month}개월 지도 기록 · ${escape(meta.time)}</p><div class="letter-paper" aria-live="polite">${paragraphHTML(pages[page])}</div>${pagination(pages)}<details><summary>종료 시점 수치와 엔딩 판정 근거</summary>${renderEvidence(record.evidence)}${renderStatistics(record.statistics)}</details></div>`;
 }
 function selectHash(){const id=location.hash.slice(1);current=id==='retirement'||available.includes(id)?id:available[0];page=0;sampleIndex=0;render();}
 document.addEventListener('change',event=>{if(event.target.id!=='review-sample')return;sampleIndex=Number(event.target.value);page=0;render();});
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;
  if(action==='full'){
   const record=records.filter(r=>r.ending===current)[sampleIndex],pages=reviewPages(record),paper=reader.querySelector('.letter-paper');full=!full;paper.innerHTML=full?pages.map((text,i)=>`<section class="review-full-page"><h3>장면 ${i+1} / ${pages.length}</h3>${paragraphHTML(text)}</section>`).join(''):paragraphHTML(pages[page]);button.textContent=full?'한 장면씩 읽기':'전체 스크립트 펼치기';reader.querySelector('.review-pagination').hidden=full;return;
  }
  if(action==='next')page++;else if(action==='prev')page--;else if(action==='first')page=0;
  render();reader.querySelector(action==='prev'&&page>0?'[data-action="prev"]':'[data-action="next"],[data-action="first"]')?.focus({preventScroll:true});
 });
 window.addEventListener('hashchange',()=>{selectHash();reader.focus({preventScroll:true});});selectHash();
}
if(typeof document!=='undefined')void boot();
