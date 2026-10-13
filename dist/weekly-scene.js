import {roomScene} from './lab-scene.js';
import {researchGrade,ACTIVITIES,LEGACY_ACTIVITIES} from './engine.js';
const labels={training:'군사교육소집',study:'문헌 탐구',coursework:'전공과목 공부',experiment:'실험',analysis:'데이터 분석',paper:'논문 쓰기',conference:'학회에서 배우기',free:'자율 시간',travel:'여행·새로운 경험',rest:'휴식',coffee:'커피 한 잔의 여유',language:'어학',presentation:'발표 연습',recovery:'회복·여행',industry:'산학과제 수행 · RA',video:'과학 콘텐츠',teach:'수업보조 · TA',unfinished:'계획 다시 살피기'};
const englishLabels={training:'Military training',conference:'Learning at a conference',travel:'Travel and new experiences',rest:'Recovery',coffee:'Coffee break',teach:'Teaching assistant · TA',unfinished:'Reviewing the plan'};
const englishGrades={'완전성공':'Complete success','성공':'Success','보통':'Mixed result','약간실패':'Limited setback','실패':'Setback'};
const autonomousEnglish={coursework:'Self-directed study · course review',study:'Self-directed study · literature review',experiment:'Self-directed research · hypothesis testing',analysis:'Self-directed research · data analysis',rest:'Self-directed recovery completed',coffee:'Self-directed coffee break completed',travel:'Self-directed time · travel and exploration'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Translate complete dynamic sentences, rather than substituting fragments such
// as "기록" inside a sentence that has no English translation.
export function weeklyResearchGrade(rate,locale='ko'){
 const grade=researchGrade(rate);return locale==='en'?englishGrades[grade]:grade;
}
export function weeklyActivityLabel(state,id){
 if(state.locale!=='en')return labels[id]??ACTIVITIES[id]?.ko[0]??LEGACY_ACTIVITIES[id]?.ko[0]??id;
 if(id==='experiment'&&state.professorProfile.labMode==='dry')return 'Computation & modeling';
 return englishLabels[id]??ACTIVITIES[id]?.en[0]??LEGACY_ACTIVITIES[id]?.en[0]??'Reviewing the plan';
}
function statusText(state,result){
 const id=result.actual;
 if(state.locale==='en'){
  if(id==='training')return 'Military training · student advising paused';
  if(result.criticalRest)return 'Work paused for essential recovery';
  if(result.proposed==='free'&&result.performed)return autonomousEnglish[result.autonomous]??'Self-directed activity completed';
  if(!result.performed)return 'Planned activity not completed';
  if(result.outcome==='presentation_failed')return 'Difficulty preparing and delivering the presentation';
  if(result.outcome==='inconclusive')return 'No measurable progress from this attempt';
  if(result.assigned==='recovery'||result.proposed==='recovery')return 'Agreed recovery time completed';
  if(id==='rest')return 'Recovery time completed';
  if(id==='coffee')return 'Coffee break completed';
  if(id==='conference')return result.outcome==='presented'?'Research presentation completed':result.outcome==='preparing'?'More preparation needed before presenting':'Conference attendance completed';
  return 'Planned activity completed';
 }
 return id==='training'?'군사교육소집 · 학생 지도 중단':result.proposed==='free'&&result.performed?({coursework:'자율 학습 · 교과목 복습',study:'자율 학습 · 문헌 검토',experiment:'자율 연구 · 가설 검증',analysis:'자율 연구 · 데이터 분석',rest:'자율 회복 활동 완료',coffee:'자율 커피 휴식 완료',travel:'자율 활동 · 여행과 탐색'})[result.autonomous]:!result.performed?'계획한 활동 미완료':result.outcome==='presentation_failed'?'발표 준비와 전달에 어려움':result.outcome==='inconclusive'?'이번 시도에서 확인 가능한 진전 없음':id==='rest'?'자율 회복 활동을 마쳤습니다':id==='coffee'?'따뜻한 커피와 함께 휴식을 취했습니다':id==='conference'?(result.outcome==='presented'?'연구 발표 완료':'학술대회 청강 완료'):'계획한 활동을 수행했습니다';
}
function progressText(state,result,scientific){
 const id=result.actual;
 if(state.locale==='en')return id==='training'?'Three weeks in winter break · study and research are paused.':id==='teach'&&result.performed?'Explained concepts at the board and answered questions.':result.progress>0?`Research progress Δ +${result.progress.toFixed(1)}`:scientific?(id==='coursework'?'Course work · reviewed concepts and recorded the learning check.':'Research progress 0 · the attempt remains in the record.'):id==='rest'?'Room to recover before next week':id==='coffee'?'Taking a moment to recharge and refocus':'Recorded what was learned.';
 return id==='training'?'겨울방학 중 3주 · 학습과 연구 일정은 진행하지 않습니다.':id==='teach'&&result.performed?'칠판 앞에서 개념을 설명하고 질문에 답했습니다.':result.progress>0?`연구 진척 Δ +${result.progress.toFixed(1)}`:scientific?(id==='coursework'?'교과 학습 · 복습과 점검을 기록했습니다.':'연구 진척 0 · 시도도 기록에 남습니다.'):id==='rest'?'다음 주를 위한 여유':id==='coffee'?'잠시 숨을 고르며 재충전하는 시간':'배운 것을 기록했습니다.';
}
export function weeklyScene(state,result,index){
 const en=state.locale==='en',id=result.actual,scientific=Number.isFinite(result.successRate),success=scientific?result.successRate>=.4:result.performed,total=state.lastReport?.results.length??state.plan.length;
 const status=statusText(state,result),progress=progressText(state,result,scientific),activity=id==='experiment'&&state.professorProfile.labMode==='dry'?(en?'Computation & modeling':'계산·모델링'):weeklyActivityLabel(state,id)||weeklyActivityLabel(state,result.proposed);
 const achievement=scientific?`${weeklyResearchGrade(result.successRate,state.locale)} · ${en?'Achievement':'달성률'} ${Math.round(result.successRate*100)}%`:status;
 const deviation=en?(result.criticalRest?'Recovery needed at a critical limit':result.deviation==='rest-needed'?'Rested due to fatigue':'Not completed'):(result.deviation==='rest-needed'?'피로로 휴식':'미수행');
 const assignment=id!=='training'&&result.assigned&&result.actual!==result.assigned&&!['free','recovery'].includes(result.assigned)?`<p class="assignment-change">${en?'Agreed schedule':'합의한 일정'}: ${escape(weeklyActivityLabel(state,result.assigned))} → ${en?'Actual':'실제'}: ${escape(weeklyActivityLabel(state,result.actual))} · ${deviation}</p>`:'';
 return `<div class="weekly-stage ${success?'week-success':'week-trying'} task-${id}" aria-label="${en?`Week ${index+1} result`:`${index+1}주차 수행 결과`}"><div class="week-scene-header"><span>${en?`Week ${index+1}`:`${index+1}주차`} / ${total}</span><strong>${escape(activity)}</strong></div>${roomScene(state,result,index)}<div class="week-outcome"><strong>${escape(achievement)}</strong><p>${escape(progress)}</p>${assignment}<ol class="week-dots" aria-label="${en?'Weekly progress':'주별 진행'}">${Array.from({length:total},(_,i)=>`<li class="${i<index?'done':i===index?'current':''}">${en?`Week ${i+1}`:`${i+1}주`}</li>`).join('')}</ol></div></div>`;
}
