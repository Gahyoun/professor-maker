import {renderOnboardingFlow,renderAdmissionInterview,renderUpdateNotice} from './onboarding-ui.js';
import {admissionCandidates} from './admission.js';
import {createState} from './engine.js';
import {roomScene} from './lab-scene.js';

const main=document.querySelector('#main');
const params=new URLSearchParams(location.search);
const profile={gender:'female',age:38,fieldId:'072',labMode:'dry',institution:'national',difficulty:'beginner'};
const candidates=admissionCandidates(0x1234abcd,{locale:'ko',professorGender:profile.gender,professorProfile:profile});
let selected=/^[0-2]$/.test(params.get('selected')??'')?Number(params.get('selected')):null;
let view=['updates','interview','room'].includes(params.get('view'))?params.get('view'):'updates';
let activity=['analysis','teach','experiment','rest','idle'].includes(params.get('activity'))?params.get('activity'):'analysis';
let noticeOpen=view==='updates';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rooms=[
  {seed:9,fieldId:'072',labMode:'dry',name:'긴 생머리',note:'Dry lab · 풀어 내린 뒷머리로 목덜미를 가립니다.'},
  {seed:57,fieldId:'072',labMode:'dry',name:'곱슬 긴머리',note:'Dry lab · 곱슬머리의 볼륨과 앞머리를 유지합니다.'},
  {seed:6,fieldId:'056',labMode:'wet',name:'포니테일',note:'Wet lab · 긴머리를 묶어 실험 공간에서 정리합니다.'},
  {seed:25,fieldId:'056',labMode:'wet',name:'땋아올린 번',note:'Wet lab · 긴머리를 땋아 올린 번으로 정리합니다.'}
];
function updateURL(){const query=new URLSearchParams({view});if(selected!==null)query.set('selected',String(selected));if(view==='room')query.set('activity',activity);history.replaceState(null,'',location.pathname+'?'+query);}
function syncNotice(){
  document.querySelector('#onboarding-update')?.remove();document.body.classList.remove('update-notice-active');document.documentElement.style.removeProperty('--update-notice-space');
  if(!noticeOpen)return;
  const panel=document.createElement('aside');panel.id='onboarding-update';panel.className='onboarding-update';panel.setAttribute('aria-labelledby','update-notice-title');panel.innerHTML=renderUpdateNotice();document.body.append(panel);
  document.body.classList.add('update-notice-active');document.documentElement.style.setProperty('--update-notice-space',`${Math.ceil(panel.getBoundingClientRect().height+80)}px`);
}
function render(){
  for(const button of document.querySelectorAll('[data-preview-view]')){if(button.dataset.previewView===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  if(view==='updates')main.innerHTML=`<section class="preview-intro"><h1>첫 플레이에서 만나는 안내</h1><p>게임과 같은 업데이트 박스입니다. 안내 안의 내용은 스크롤할 수 있고, 닫기와 확인 버튼은 항상 보입니다.</p><button class="secondary" type="button" data-ui="update-open">업데이트 안내 다시 보기</button></section>${renderOnboardingFlow()}<section class="preview-next"><h2>학생과 함께하는 여덟 번의 봄</h2><p>학생의 제안을 듣고 일정·업무·연구비를 선택하며, 학위와 연구 성과, 이후의 편지와 CV를 남깁니다.</p><button type="button" class="primary" data-preview-view="interview">입학 면접 화면 보기 →</button></section>`;
  else if(view==='interview')main.innerHTML=renderAdmissionInterview({candidates,profile,professorName:'지도교수',selected})+'<p class="preview-intro">후보를 선택하고 확정 버튼을 눌러 볼 수 있습니다. 이 화면에서는 학생을 입학시키거나 게임을 저장하지 않습니다.</p>';
  else main.innerHTML=`<section class="preview-intro"><h1>수정된 연구실 도트</h1><p>실제 게임의 연구실 그림을 같은 코드로 그립니다. 자세를 바꾸며 앞머리·뒷머리와 가구의 겹침을 확인해 보세요.</p><label class="preview-room-controls">학생의 자세<select id="preview-activity">${[['analysis','모니터 앞'],['teach','TA 강의'],['experiment','실험·계산'],['rest','휴식'],['idle','정면']].map(([id,label])=>`<option value="${id}" ${id===activity?'selected':''}>${label}</option>`).join('')}</select></label></section><div class="preview-room-grid">${rooms.map(r=>{const state=createState(r.name,r.seed,{gender:'female',fieldId:r.fieldId,labMode:r.labMode});state.creationSeed=r.seed;state.month=36;const result={actual:activity,performed:true,outcome:'completed',destination:activity==='rest'?'chair':undefined};return `<article class="preview-room-card"><h2>${r.name}</h2><p>${r.note}</p><section class="live-lab" aria-label="${r.name}의 연구실">${roomScene(state,result,0,{idle:activity==='idle'})}</section></article>`;}).join('')}</div>`;
  syncNotice();
}
function switchView(next){view=next;noticeOpen=view==='updates';updateURL();render();window.scrollTo(0,0);const heading=main.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
document.addEventListener('click',event=>{
  const tab=event.target.closest('[data-preview-view]');if(tab){switchView(tab.dataset.previewView);return;}
  const action=event.target.closest('[data-ui]')?.dataset.ui;
  if(action==='update-close'){noticeOpen=false;syncNotice();const button=main.querySelector('[data-ui=update-open]');button?.focus({preventScroll:true});}
  if(action==='update-open'){noticeOpen=true;syncNotice();const heading=document.querySelector('#update-notice-title');heading.tabIndex=-1;heading.focus({preventScroll:true});}
});
document.addEventListener('change',event=>{
  if(event.target.name==='candidateIndex'){selected=Number(event.target.value);updateURL();for(const label of document.querySelectorAll('.candidate-option'))label.classList.toggle('selected',label.querySelector('input').checked);document.querySelector('#preview-next-step')?.remove();}
  if(event.target.id==='preview-activity'){activity=event.target.value;updateURL();render();document.querySelector('#preview-activity')?.focus({preventScroll:true});}
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='admission-form')return;event.preventDefault();if(selected===null)return;
  document.querySelector('#preview-next-step')?.remove();const next=document.createElement('section');next.id='preview-next-step';next.className='preview-next';next.setAttribute('role','status');next.innerHTML=`<h2>${esc(candidates[selected].name)} 학생을 선택했습니다.</h2><p>실제 게임에서는 첫 면담으로 이어집니다. 여기서는 화면만 확인하며, 기존 플레이와 학생 기록은 유지됩니다.</p><button type="button" class="primary" data-preview-view="room">연구실 도트도 보기 →</button>`;event.target.after(next);next.tabIndex=-1;next.focus();next.scrollIntoView({block:'start'});
});
window.addEventListener('resize',syncNotice);
updateURL();render();
