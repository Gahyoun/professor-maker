import {mergeRelationship} from './relationship.js';
// Game parameters revealed only in a completed-run snapshot.
import {HIDDEN_RANGES} from './engine.js';
const labels={manners:'예의범절',stamina:'체력',resilience:'정신력',language:'언어',learning:'학습능력',research:'연구수행능력',social:'사교성',creativity:'창의성',diligence:'성실성',rapport:'라포·신뢰',luck:'운',motivation:'의욕',stress:'스트레스',autonomy:'자율성',teaching:'교육 경험',industry:'산학 경험',enterprise:'창업 경험',outreach:'과학소통 경험',intuition:'연구 직관',confidence:'자신감'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function endingStatistics(state){
 if(!state?.ending)return null;
 return {student:mergeRelationship(state.hidden),temperament:{...state.temperament},faculty:{...state.professor},professorEnergy:state.professorEnergy};
}
export function validStatistics(value){
 const valid=(record,ranges)=>record&&typeof record==='object'&&!Array.isArray(record)&&Object.keys(record).length===Object.keys(ranges).length&&Object.entries(ranges).every(([key,[lo,hi]])=>Number.isFinite(record[key])&&record[key]>=lo&&record[key]<=hi);
 return value&&Object.keys(value).every(k=>['student','temperament','faculty','professorEnergy'].includes(k))&&valid(mergeRelationship(value.student),HIDDEN_RANGES)&&valid(value.temperament,{curiosity:[0,100],caution:[0,100],expression:[0,100]})&&valid(value.faculty,{research:[0,100],teaching:[0,100],admin:[0,100],mentoring:[0,100]})&&Number.isFinite(value.professorEnergy)&&value.professorEnergy>=0&&value.professorEnergy<=100;
}
function plot(rows,lo,hi,title){
 const x=132,width=270,height=rows.length*31+56,scale=n=>x+(n-lo)/(hi-lo)*width,zero=scale(0),ticks=lo<0?[-100,-50,0,50,100]:hi===999?[0,250,500,750,999]:[0,25,50,75,100];
 return `<figure class="parameter-figure"><figcaption>Figure ${title==='능력과 회복 자원'?'1':title==='관계와 성향'?'3':title==='경험과 상태'?'2':title==='초기 기질'?'4':'5'}. ${escape(title)} · 척도 ${lo}–${hi}</figcaption><svg viewBox="0 0 468 ${height}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title>${ticks.map(n=>`<path d="M${scale(n)} 8V${height-32}" stroke="#d9dee3" stroke-width=".7"/><text x="${scale(n)}" y="${height-12}" text-anchor="middle" font-size="11">${n}</text>`).join('')}<path d="M${zero} 8V${height-32}" stroke="#334a5c"/>${rows.map(([key,value],i)=>{const y=i*31+10,end=scale(value);return `<text x="120" y="${y+15}" text-anchor="end" font-size="12">${escape(labels[key]||key)}</text><rect x="${Math.min(zero,end)}" y="${y}" width="${Math.max(.7,Math.abs(end-zero))}" height="20" fill="${value<0?'#aa755e':'#46728c'}"/><text x="420" y="${y+15}" font-size="11">${Math.round(value)}</text>`;}).join('')}</svg><table class="parameter-data"><caption>${escape(title)}의 정확한 값</caption><tbody>${rows.map(([key,value])=>`<tr><th scope="row">${escape(labels[key]||key)}</th><td>${value.toFixed(2)}</td></tr>`).join('')}</tbody></table></figure>`;
}
function renderStatisticsSource(value){
 if(!validStatistics(value))return '';
 const rows=Object.entries(mergeRelationship(value.student));
 return `<section class="ending-statistics"><h2>결과 · 종료 시점의 상태 변수</h2><p class="stat-fiction">가상의 게임 수치입니다. 사람의 능력이나 건강을 평가하는 검사가 아닙니다.</p>${[999,100,-100].map(group=>{const selected=rows.filter(([key])=>group===-100?HIDDEN_RANGES[key][0]===-100:group===999?HIDDEN_RANGES[key][1]===999:HIDDEN_RANGES[key][0]===0&&HIDDEN_RANGES[key][1]===100);return plot(selected,group===-100?-100:0,group===999?999:100,group===-100?'관계와 성향':group===999?'능력과 회복 자원':'경험과 상태');}).join('')}${plot(Object.entries(value.temperament).map(([k,v])=>[({curiosity:'호기심',caution:'신중함',expression:'표현성'})[k],v]),0,100,'초기 기질')}${plot([...Object.entries(value.faculty).map(([k,v])=>[({research:'교수 학술활동',teaching:'교수 교육',admin:'교수 행정',mentoring:'교수 연구실 운영'})[k],v]),['교수 체력',value.professorEnergy]],0,100,'교수의 업무 상태')}</section>`;
}

const englishLabels={"예의범절":"Courtesy","체력":"Stamina","정신력":"Resilience","언어":"Communication","학습능력":"Learning","연구수행능력":"Research","사교성":"Social connection","창의성":"Creativity","성실성":"Diligence","라포·신뢰":"Rapport / trust","운":"Luck","의욕":"Motivation","스트레스":"Stress","자율성":"Autonomy","교육 경험":"Teaching experience","산학 경험":"Industry experience","창업 경험":"Venture experience","과학소통 경험":"Public communication","연구 직관":"Research intuition","자신감":"Confidence","호기심":"Curiosity","신중함":"Caution","표현성":"Expression","교수 학술활동":"Faculty research","교수 교육":"Faculty teaching","교수 행정":"Faculty service","교수 연구실 운영":"Lab management","교수 체력":"Faculty energy","능력과 회복 자원":"Abilities and recovery","관계와 성향":"Relationships and traits","경험과 상태":"Experience and condition","초기 기질":"Initial temperament","교수의 업무 상태":"Faculty workload","결과 · 종료 시점의 상태 변수":"Results · final game parameters","가상의 게임 수치입니다. 사람의 능력이나 건강을 평가하는 검사가 아닙니다.":"Fictional game values; not an assessment of a person’s abilities or health.","척도":"Scale","의 정확한 값":" — exact values"};
export function renderStatistics(value,locale='ko'){
 const html=renderStatisticsSource(value);if(locale!=='en')return html;
 return Object.entries(englishLabels).sort((a,b)=>b[0].length-a[0].length).reduce((text,[ko,en])=>text.replaceAll(ko,en),html).replaceAll('text-anchor="end" font-size="12"','text-anchor="end" font-size="9"');
}
