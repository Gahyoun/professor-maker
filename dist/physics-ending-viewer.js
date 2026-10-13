import {getEndingStory} from './stories.js';
import {physicsEndingRecord,physicsEndingPages} from './physics-ending-record.js';
export {physicsEndingRecord,physicsEndingPages} from './physics-ending-record.js';
import {adaptResearchText} from './ending-context.js';
import {renderStudentPortrait} from './student-pixel-art.js';
import {fieldFigure} from './lab-scene.js';
import {CONFERENCE_VENUES,conferenceVenue,renderConferenceArt} from './conference-art.js';

// An isolated story reader. No game, archive or browser-storage API is used.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphHTML=text=>text.split('\n\n').map(p=>`<p>${escape(p).replaceAll('\n','<br>')}</p>`).join('');

export function bootPhysicsEndingReader(){
 const pages=physicsEndingPages(),context={fieldId:'050',field:'물리학',labMode:'dry'},story=getEndingStory('true',context);
 const paper=document.querySelector('#story-paper'),scene=document.querySelector('#story-scene'),count=document.querySelector('#story-count'),heading=document.querySelector('#scene-heading');
 const previous=document.querySelector('[data-story="previous"]'),next=document.querySelector('[data-story="next"]'),first=document.querySelector('[data-story="first"]');
 let index=0,venue=conferenceVenue(new URL(location.href).searchParams.get('venue'),3);
 const venueControls=document.createElement('div');venueControls.className='viewer-venue-controls';
 venueControls.innerHTML=`<label for="story-venue">학회장 그림<select id="story-venue">${CONFERENCE_VENUES.map((v,i)=>`<option value="${v.id}" ${i===venue?'selected':''}>${v.label}</option>`).join('')}</select></label><span>장소를 바꾸어도 이야기의 순서는 유지됩니다.</span>`;
 scene.before(venueControls);
 const conferenceState={creationSeed:6,seed:6,month:96,gender:'female',professorProfile:context};
 document.querySelector('#story-venue').addEventListener('change',event=>{
  venue=conferenceVenue(event.target.value,3);const url=new URL(location.href);url.searchParams.set('venue',CONFERENCE_VENUES[venue].id);history.replaceState(null,'',url);render();
 });
 document.querySelector('#story-title').textContent=adaptResearchText(story.title.ko,context);
 document.querySelector('#story-time').textContent=story.time.ko;
 function render({moveFocus=false}={}){
  const body=pages[index],letter=index===2||index===3,conference=index===0||index>=6;
  scene.className=`story-scene ${letter?'scene-letter':conference?'scene-conference':'scene-memory'}`;
  scene.setAttribute('aria-label',letter?'서랍에 보관한 손편지':conference?'국제학회에서 다시 만난 제자':'함께한 시간을 떠올리는 교수의 책상');
  scene.innerHTML=conference?`<span id="scene-label" class="scene-caption">${escape(CONFERENCE_VENUES[venue].label)} · 다시 만난 날</span>${renderConferenceArt(conferenceState,{actual:'conference',abroad:true},0,{venue,figure:fieldFigure(conferenceState),appearance:physicsEndingRecord.appearance})}`:`<span id="scene-label" class="scene-caption">${letter?'소인이 두 번 찍힌 손편지':'함께한 시간'}</span><div class="story-scene-canvas"><div class="scene-window" aria-hidden="true"></div><div class="scene-desk" aria-hidden="true"><div class="scene-screen"></div></div><div id="scene-portrait" class="scene-portrait">${renderStudentPortrait(physicsEndingRecord.appearance,`${physicsEndingRecord.name}의 학생 모습`,'neutral','standing','front')}</div></div>`;
  paper.innerHTML=paragraphHTML(body);
  count.textContent=`${index+1} / ${pages.length}`;
  heading.textContent=`장면 ${index+1}`;
  previous.disabled=index===0;next.disabled=index===pages.length-1;first.disabled=index===0;
  document.querySelector('#story-finish').hidden=index!==pages.length-1;
  if(moveFocus){heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'auto'});}
 }
 document.querySelector('#story-controls').addEventListener('click',event=>{
  const button=event.target.closest('[data-story]');if(!button||button.disabled)return;
  if(button.dataset.story==='next')index++;else if(button.dataset.story==='previous')index--;else if(button.dataset.story==='first')index=0;
  render({moveFocus:true});
 });
 document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  const button=event.key==='ArrowRight'?next:event.key==='ArrowLeft'?previous:event.key==='Home'?first:null;
  if(button&&!button.disabled){event.preventDefault();button.click();}
 });
 render();document.querySelector('#reader-status').hidden=true;document.querySelector('#story-reader').hidden=false;
}
if(typeof document!=='undefined'){
 try{bootPhysicsEndingReader();}catch{document.querySelector('#reader-status').textContent='이야기를 불러오지 못했습니다. 새로고침해 다시 확인해 주세요.';}
}
