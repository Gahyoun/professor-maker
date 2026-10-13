import {getEndingStory} from './stories.js';
import {physicsEndingRecord,physicsEndingContext,physicsEndingPages} from './physics-ending-record.js';
import {renderStudentPortrait} from './student-pixel-art.js';
import {renderConferenceArt} from './conference-art.js';

// This reader has no simulation, persistence, consent or telemetry entry point.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseLabel={opening:'첫 면담',main:'함께한 8년',thesis:'학위 심사',ending:'다시 만난 두 교수'};
const physicsFigure='<path d="M140 111L172 91 205 104 240 75 275 88 310 64 345 83" fill="none" stroke="#81a797" stroke-width="4"/>';

export function getPublicPhysicsEndingScenes(){
 const story=getEndingStory('true',physicsEndingContext);
 return physicsEndingPages().map((body,index)=>({id:`ending-${index+1}`,phase:'ending',title:story.title.ko,time:story.time.ko,month:96,visual:index===2||index===3?'letter':index===0||index>=6?'conference':'memory',paragraphs:body.split('\n\n')}));
}

export function storySceneArt(item){
 const caption=item.phase==='opening'?'우리의 첫 면담':item.phase==='thesis'?'연구를 자기 말로 설명하는 자리':item.visual==='letter'?'소인이 두 번 찍힌 손편지':item.visual==='conference'?'국제학회 · 다시 만난 날':'함께한 시간';
 const label=`<span class="scene-caption">${escape(caption)}</span>`;
 if(item.phase==='thesis'||item.visual==='conference'){
  const defense=item.phase==='thesis',state={locale:'ko',creationSeed:6,seed:6,month:item.month,gender:'female',professorProfile:{fieldId:'050',labMode:'dry'}};
  return label+renderConferenceArt(state,{actual:'conference',abroad:!defense},0,{venue:defense?0:3,defense,figure:physicsFigure,appearance:physicsEndingRecord.appearance});
 }
 const portrait=renderStudentPortrait(physicsEndingRecord.appearance,'이지현의 학생 모습','neutral','standing','front');
 return label+`<div class="story-scene-canvas"><div class="scene-window" aria-hidden="true"></div><div class="scene-desk" aria-hidden="true"><div class="scene-screen"></div></div>${item.phase!=='ending'?'<div class="scene-notebook" aria-hidden="true"></div>':''}<div class="scene-portrait">${portrait}</div></div>`;
}

export function bootPhysicsStoryReader(doc=document){
 const reader=doc.querySelector('#sequence-reader');if(!reader)return;
 const scenes=getPublicPhysicsEndingScenes(),paper=doc.querySelector('#sequence-paper'),scene=doc.querySelector('#sequence-scene'),heading=doc.querySelector('#sequence-heading');
 const previous=doc.querySelector('[data-sequence="previous"]'),next=doc.querySelector('[data-sequence="next"]'),first=doc.querySelector('[data-sequence="first"]'),contents=doc.querySelector('#sequence-contents');
 let index=0;
 contents.innerHTML=scenes.map((item,i)=>`<li><button type="button" data-scene-index="${i}">${escape(item.time)} · ${escape(item.title)}</button></li>`).join('');
 function render({moveFocus=false}={}){
  const item=scenes[index];
  scene.className=`story-scene ${item.visual==='letter'?'scene-letter':item.visual==='conference'||item.phase==='thesis'?'scene-conference':'scene-memory'}`;
  scene.setAttribute('role','img');scene.setAttribute('aria-label',`${phaseLabel[item.phase]} · ${item.title}`);scene.innerHTML=storySceneArt(item);
  doc.querySelector('#sequence-phase').textContent=phaseLabel[item.phase];doc.querySelector('#sequence-progress').textContent=`${index+1} / ${scenes.length} 장면`;
  doc.querySelector('#sequence-time').textContent=item.time;heading.textContent=item.title;
  paper.dataset.phase=item.phase;paper.dataset.final=String(index===scenes.length-1);
  paper.innerHTML=item.paragraphs.map(text=>`<p>${escape(text).replaceAll('\n','<br>')}</p>`).join('');
  doc.querySelector('#sequence-count').textContent=`${index+1} / ${scenes.length}`;
  previous.disabled=index===0;next.disabled=index===scenes.length-1;first.disabled=index===0;
  doc.querySelector('#sequence-finish').hidden=index!==scenes.length-1;
  contents.querySelectorAll('button').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  if(moveFocus){heading.focus({preventScroll:true});reader.scrollIntoView({block:'start',behavior:'auto'});}
 }
 doc.querySelector('#sequence-controls').addEventListener('click',event=>{
  const button=event.target.closest('[data-sequence]');if(!button||button.disabled)return;
  index=button.dataset.sequence==='next'?index+1:button.dataset.sequence==='previous'?index-1:0;render({moveFocus:true});
 });
 contents.addEventListener('click',event=>{
  const button=event.target.closest('[data-scene-index]');if(!button)return;
  const target=Number(button.dataset.sceneIndex);if(!Number.isInteger(target)||target<0||target>=scenes.length)return;
  index=target;contents.closest('details').open=false;render({moveFocus:true});
 });
 doc.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY/.test(event.target.tagName)||event.target.isContentEditable)return;
  const button=event.key==='ArrowRight'?next:event.key==='ArrowLeft'?previous:event.key==='Home'?first:null;
  if(button&&!button.disabled){event.preventDefault();button.click();}
 });
 render();doc.querySelector('#sequence-status').hidden=true;reader.hidden=false;
}
if(typeof document!=='undefined'){
 try{bootPhysicsStoryReader();}catch{const status=document.querySelector('#sequence-status');if(status)status.textContent='이야기를 불러오지 못했습니다. 새로고침해 다시 확인해 주세요.';}
}
