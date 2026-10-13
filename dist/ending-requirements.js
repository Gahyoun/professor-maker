import {ENDINGS} from './stories.js';
import {getDiscipline,degreeTargets} from './disciplines.js';
import * as engine from './engine.js';
import {LAB_CLOSURE_MONTHS} from './lab-risk.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rankedOrder=['youtuber','startup','corporate','institute','unrelated'];
const counts=targets=>`논문 투고 ${targets.submissions}편 · 논문 게재 ${targets.papers}편 · 학술발표 ${targets.conferences}회 이상`;
const careerPriority='박사학위 요건을 충족한 뒤, 대학교 교수 → 박사후연구원 → 교내 연구원 순서로 먼저 판정합니다. 그다음 과학 유튜버·창업·기업·출연연·새 분야 중 조건을 충족한 진로의 적합도를 비교합니다.';
const scorePriority='진로 적합도가 가장 높은 후일담이 선택됩니다. 점수가 같으면 과학 유튜버 → 창업 → 전공 관련 기업 → 출연연 → 새로운 분야 순서입니다. 특정 활동 한 번만으로 진로가 확정되지는 않습니다.';

// Only public profile and rule metadata are read. This is a guide, not a hidden-stat evaluator.
export function endingRequirements(id,context={}){
 if(context.locale==='en')return englishEndingRequirements(id,context);
 if(!Object.hasOwn(ENDINGS,id))throw new Error('알 수 없는 후일담입니다.');
 const profile=context.professorProfile??context,discipline=getDiscipline(profile.fieldId??context.fieldId);
 const publicState={professorProfile:{fieldId:discipline.id}},masters=degreeTargets(discipline.id,'masters'),phd=degreeTargets(discipline.id,'phd');
 const trueRules=typeof engine.trueRequirements==='function'?engine.trueRequirements(publicState):engine.TRUE_REQUIREMENTS;
 const trueResearch=engine.TRUE_RESEARCH_REQUIREMENTS;
 const doctoral=[`현재 ${discipline.label} 박사학위 목표: ${counts(phd)}.`, '박사 자격시험을 통과하고 연구를 스스로 진행할 역량을 갖춥니다. 8년차 학위논문 최종 심사와 마지막 면담에서 요건을 충족해야 합니다.'];
 const appointment=[`논문 게재 ${Math.max(phd.papers,trueRules.papers)}편 · 학술발표 ${Math.max(phd.conferences,trueRules.conferences)}회 · 추천서 ${trueRules.recommendations}회 이상.`, `상위권 저널 논문 ${trueResearch.leadingPaper}편 이상과 h-index ${trueResearch.hIndex} 이상을 확보합니다. h-index는 논문들의 피인용 실적을 나타냅니다.`, `학습·연구·어학·교류·독립성·교육 경험, 회복력·예의·의욕을 고르게 기릅니다. 교수의 학술활동·교육·학교행정·연구실 운영도 각각 ${trueRules.faculty} 이상으로 유지합니다.`];
 const data={id,title:ENDINGS[id].career.ko,fieldId:discipline.id,field:discipline.label,timing:'',requirements:[],actions:[],notes:[],priority:null,legacy:false,degreeTargets:{masters,phd}};
 switch(id){
  case 'bachelor':
   data.timing='학부연구생 2년을 마치는 진학 면담 · 24개월';
   data.requirements=['진학 면담에서 졸업을 선택하면 학사 졸업 후일담으로 이어집니다.','진학을 권해도 관계와 의욕이 부족하거나 학생이 내부 진학을 원하지 않으면 학사 졸업을 선택할 수 있습니다.'];
   data.notes=['외부 대학원 진학 면담이 먼저 열렸다면, 외부 진학을 응원한 결과에 따라 그 후일담으로 먼저 이어질 수 있습니다.'];break;
  case 'masters':
   data.timing='석사 경로 · 전체 48개월, 한 학기 연장 시 54개월';
   data.requirements=['학부 진학 면담에서 석사과정을 선택합니다.',`현재 ${discipline.label} 석사학위 목표: ${counts(masters)}. 학위논문 심사를 마쳐야 합니다.`,'석사 진로 면담에서 졸업을 선택합니다. 요건을 충족했더라도 관계·의욕이나 학생의 선택으로 내부 박사 진학을 멈추면 이 후일담으로 이어집니다.'];
   data.notes=['석박사통합 경로에는 별도의 석사 졸업 선택이 없습니다. 석사 경로의 자격시험 면담에서 과정을 정리하는 선택도 석사 후일담으로 이어집니다.','석사 요건이 부족하면 한 학기 연장은 한 번 가능합니다. 요건 없이 졸업을 선택하면 학위요건 미충족으로 지도 종료됩니다.'];break;
  case 'external_masters':
   data.timing='학부연구생 진학 면담 직전 · 24개월';
   data.requirements=['논문 게재 2편 이상 · h-index 2 이상 · 상위권 저널 논문 또는 수상 실적 1개 이상.','연구·어학 준비가 충분하고, 연구를 계속할 관계와 의욕이 있어야 외부 진학 면담이 열립니다.','외부 진학을 응원하고 학생이 외부 진학을 선택하면 이어집니다.'];
   data.notes=['응원하더라도 학생이 현재 연구실에 남을 수 있습니다. 외부 진학을 확정하는 버튼은 아닙니다.'];break;
  case 'external_phd':
   data.timing='석사 경로의 학위·진로 면담 · 48개월 또는 연장 후 54개월';
   data.requirements=['석사 경로를 선택하고 해당 전공의 석사학위 요건을 충족합니다.',`현재 ${discipline.label} 석사학위 목표: ${counts(masters)}.`,'논문 게재 3편 이상 · h-index 3 이상 · 상위권 저널 논문 또는 수상 실적 1개 이상.','연구·어학 준비와 관계·의욕이 충분하면 면담이 열립니다. 외부 진학을 응원하고 학생이 외부 진학을 선택하면 이어집니다.'];
   data.notes=['석박사통합 경로에는 이 석사 진학 면담이 없습니다. 외부 진학을 응원해도 학생이 현재 연구실에 남을 수 있습니다.'];break;
  case 'true':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,...appointment,'교수와 학생 사이에 두터운 신뢰가 있어야 합니다.'];
   data.actions=['게재 논문이 생긴 뒤 “이번 달 추가 활동 → 추천서·진로 지원”을 선택합니다. 추천서는 직전 추천서로부터 12개월이 지나야 새로 기록됩니다.','“수업보조 · TA”와 학생이 판단하는 연구·면담 기회를 함께 확보합니다.'];
   data.notes=['수상은 이 후일담의 필수 조건이 아닙니다.'];data.priority='박사 졸업 진로 중 가장 먼저 판정합니다.';break;
  case 'postdoc':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,...appointment,'관계가 연구를 이어 갈 정도로 유지되어야 합니다. 대학교 교수 후일담의 더 높은 신뢰 조건을 먼저 충족하면 그 후일담이 선택됩니다.'];
   data.actions=['게재 논문 이후 “추천서·진로 지원”을 준비합니다. 새 추천서 기록은 12개월 간격입니다.'];data.priority='대학교 교수 후일담 다음, 교내 연구원과 다른 진로보다 먼저 판정합니다.';break;
  case 'resident_researcher':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'교수와 학생의 관계가 매우 가깝고, 학생이 익숙한 환경을 신중하게 선택하는 기질을 지녀야 합니다.','교수의 연구실 운영 업무를 40 이상으로 유지합니다.'];
   data.actions=['학생의 질문을 듣고 연구 계획을 함께 정하며, 연구실 운영 업무와 회복 시간을 유지합니다.'];data.priority='대학교 교수·박사후연구원 조건을 먼저 충족하지 않을 때, 다른 진로 적합도보다 먼저 판정합니다.';break;
  case 'institute':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'논문 게재 4편 이상, 또는 게재 2편 이상과 상위권 저널 논문 1편 이상.','연구·학습 역량과 독립성이 충분해야 합니다.'];data.actions=['문헌·연구·분석을 꾸준히 수행하고, 학생이 자신의 연구 질문과 판단 근거를 설명하게 합니다.'];data.priority=careerPriority+' '+scorePriority;break;
  case 'corporate':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'산학 경험과 연구 역량이 충분해야 합니다.'];data.actions=['“산학과제 수행 · RA”와 “연구를 쓰는 자리” 같은 기업 협업 기회를 준비합니다. 학위 연구도 함께 이어 갑니다.'];data.priority=careerPriority+' '+scorePriority;break;
  case 'unrelated':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'산학 경험에 더해 교류 능력과 독립성이 충분해야 합니다.'];data.actions=['산학과제, 발표와 협업, 학생이 스스로 판단하는 기회를 함께 쌓습니다.'];data.priority=careerPriority+' '+scorePriority;break;
  case 'startup':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'창업 경험과 독립성이 충분해야 합니다.'];data.actions=['창의적인 “산학과제 수행 · RA”로 현장의 문제를 다루고, “사용해 보고 싶다는 사람” 이벤트의 사용자 검증·지원 검토 기회를 살핍니다.'];data.notes=['현재 주별 계획에는 별도의 “창업 실험” 선택이 없습니다. 산학과제와 관련 이벤트를 통해 준비합니다.'];data.priority=careerPriority+' '+scorePriority;break;
  case 'youtuber':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'어학·설명 능력과 교류 능력이 모두 매우 높거나, 과학소통 경험과 이를 설명할 어학 준비가 충분해야 합니다.'];data.actions=['어학·발표 연습을 하고, 게재 논문 이후 “연구를 한 문장으로”나 “코드를 함께 열다” 이벤트에서 대중 설명·공유 경험을 쌓습니다.'];data.notes=['현재 주별 계획에는 별도의 영상 활동 선택이 없습니다. 설명·공유 이벤트로 경험을 쌓습니다.','주요 후일담 8종이나 퇴임식 해금의 5종에는 포함하지 않는 특수 후일담입니다.'];data.priority=careerPriority+' '+scorePriority;break;
  case 'unemployed':
   data.timing='박사학위 취득 뒤의 진로 판정 · 96개월';data.requirements=[...doctoral,'대학교 교수·박사후연구원·교내 연구원 조건에 해당하지 않고, 다른 진로의 최소 준비 조건도 충족하지 않으면 선택됩니다.'];data.notes=['박사학위를 마친 뒤 다음 일을 준비하는 후일담입니다. 학위요건 미충족으로 운영이 끝난 경우와 다릅니다.'];data.priority='다른 모든 박사 졸업 진로 조건을 확인한 뒤 마지막으로 판정합니다.';break;
  case 'leave':
   data.timing='재학 중 매달 수행 이후의 위기 판정';data.requirements=['체력·마음의 회복 여력이 극도로 부족하거나 스트레스가 한계인 상태 등, 위기 상태가 2개월 연속 이어집니다.','두 번째 위기 판정에서 관계 붕괴로 분류되지 않으면 회복을 위한 휴학 후일담으로 이어집니다.'];data.actions=['첫 위기 경고나 휴식 요청을 보고 일정·회복·면담을 조정하면 위기 연속 기록이 끊길 수 있습니다.'];data.notes=['휴식 요청을 한 번 허용한 것만으로 휴학하는 조건은 아닙니다.'];break;
  case 'dropout':
   data.timing='재학 중 매달 수행 이후의 위기 판정';data.requirements=['몸·마음 또는 관계의 위기 상태가 2개월 연속 이어집니다.','두 번째 판정에서 신뢰가 무너지고 스트레스가 높으며 마음의 회복 여력도 부족한 관계 위기이면 학위과정 중단으로 이어집니다.'];data.actions=['학생의 말과 수행 보고, 첫 위기 경고를 확인하며 부담·관계·회복 시간을 함께 살핍니다.'];break;
  case 'dismissed':
   data.timing='박사 자격시험 · 통합 경로 48개월, 석사 경로 60개월부터';data.requirements=['박사 자격시험에 두 번 응시하고 두 번 모두 통과하지 못하면 이어집니다.'];data.actions=['시험 직전 18개월의 “전공과목 공부” 실제 수행을 6주 이상 확보합니다. 첫 미통과 뒤에는 추가로 2주 이상 실제 수행이 필요합니다.','학습·연구 기초와 의욕도 준비되어야 합니다. 시험 준비 유예는 두 번까지, 첫 미통과 뒤 재응시는 3개월 뒤입니다.'];data.notes=['학습·연구 기초와 의욕, 수업 준비에 따라 통과 여부가 달라집니다. “과정을 정리”하는 선택은 두 번 미통과에 따른 제적과 별도입니다.'];break;
  case 'gameover':
   data.timing='매달 운영 위험 판정 또는 학위논문·최종 지도 종료 판정';data.requirements=[`교수의 학술활동·교육·학교행정·연구실 운영 중 하나가 0인 상태로 ${LAB_CLOSURE_MONTHS}개월 연속 지속됩니다.`,`미상환 차입금이 1천만원을 넘은 상태에서 추가 차입이 ${LAB_CLOSURE_MONTHS}개월 연속 발생하거나, 필수 운영비 부족으로 직접 운영 보류한 상태가 ${LAB_CLOSURE_MONTHS}개월 연속 지속됩니다.`,'학위논문 최종 판정에서 요건을 충족하지 못하거나, 학위요건 없이 졸업을 선택하는 경우도 지도 종료 기록으로 이어집니다.','석박사통합 자격시험 면담에서 과정을 정리하거나, 8년 종료 뒤 학위를 마치지 못한 경우도 해당합니다.'];data.actions=['운영 위험은 학과장 면담으로 미리 경고합니다. 부족한 업무를 회복하고, 지출·다음 연구비 입금·차입 상환을 점검합니다.'];data.notes=['현금 부족 한 번이나 낮은 능력만으로 즉시 운영이 끝나지는 않습니다. 실제 종료 기록에는 해당 원인이 표시됩니다.'];break;
  case 'unfinished':
   data.timing='이전 버전에 보관된 후일담';data.requirements=['이전 버전에서 8년 안에 박사학위를 마치지 못했을 때 사용하던 후일담입니다.'];data.notes=['현재 새 플레이에서는 이 후일담을 별도로 생성하지 않습니다. 해당 상황은 “지도 종료 기록”에 학위요건 미충족 원인으로 남습니다. 보관된 이전 편지는 계속 읽을 수 있습니다.'];data.legacy=true;break;
 }
 return data;
}

export function renderEndingRequirements(id,context={}){
 const data=endingRequirements(id,context),list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
 if(context.locale==='en')return `<section class="ending-requirements" aria-labelledby="ending-requirements-title"><span class="ending-requirements-label">Ending conditions · spoiler guide</span><h2 id="ending-requirements-title">${esc(data.title)}</h2><p class="ending-requirements-context">Current lab: <strong>${esc(data.field)}</strong>. These are public degree, activity and decision rules. Learn about the student’s abilities and temperament through conversations and performance reports.</p><dl class="ending-requirements-timing"><dt>When is it decided?</dt><dd>${esc(data.timing)}</dd></dl><h3>${data.legacy?'Earlier-version conditions':'What is required?'}</h3>${list(data.requirements)}${data.actions.length?`<h3>How can I prepare?</h3>${list(data.actions)}`:''}${data.priority?`<h3>If several careers are possible</h3><p>${esc(data.priority)}</p>`:''}${data.notes.length?`<div class="ending-requirements-notes">${list(data.notes)}</div>`:''}<button class="primary" type="button" data-ui="close">Back to the list</button></section>`;
 return `<section class="ending-requirements" aria-labelledby="ending-requirements-title"><span class="ending-requirements-label">후일담 조건 · 스포일러 안내</span><h2 id="ending-requirements-title">${esc(data.title)}</h2><p class="ending-requirements-context">현재 연구실: <strong>${esc(data.field)}</strong> · 공개 학위·활동 조건과 선택 시점을 안내합니다. 학생의 능력과 기질은 대사·수행 보고로 살펴 주세요.</p><dl class="ending-requirements-timing"><dt>언제 판정하나요?</dt><dd>${esc(data.timing)}</dd></dl><h3>${data.legacy?'이전 기록의 조건':'어떤 조건이 필요한가요?'}</h3>${list(data.requirements)}${data.actions.length?`<h3>어떻게 준비하나요?</h3>${list(data.actions)}`:''}${data.priority?`<h3>다른 진로도 준비했다면</h3><p>${esc(data.priority)}</p>`:''}${data.notes.length?`<div class="ending-requirements-notes">${list(data.notes)}</div>`:''}<button class="primary" type="button" data-ui="close">목록으로 돌아가기</button></section>`;
}

export const endingCareerPriority=()=>['true','postdoc','resident_researcher',...rankedOrder,'unemployed'];

function englishEndingRequirements(id,context={}){
 if(!Object.hasOwn(ENDINGS,id))throw new Error('Unknown ending.');
 const profile=context.professorProfile??context,discipline=getDiscipline(profile.fieldId??context.fieldId),masters=degreeTargets(discipline.id,'masters'),phd=degreeTargets(discipline.id,'phd');
 const rules=engine.trueRequirements({professorProfile:{fieldId:discipline.id}}),research=engine.TRUE_RESEARCH_REQUIREMENTS;
 const count=t=>`${t.submissions} manuscript submission(s), ${t.papers} accepted paper(s), and ${t.conferences} conference presentation(s)`;
 const degree=[`Current ${discipline.labelEn} Ph.D. target: ${count(phd)}.`,`Pass the qualifying exam and develop independent research skills. Meet the dissertation requirements at the final defense and career meeting in year 8.`];
 const appointment=[`At least ${Math.max(phd.papers,rules.papers)} accepted papers, ${Math.max(phd.conferences,rules.conferences)} conference presentations, and ${rules.recommendations} recommendation letters.`,`At least ${research.leadingPaper} leading-journal paper and h-index ${research.hIndex}. The h-index summarizes citations to the student’s papers.`,`Develop learning, research, communication, collaboration, independence, teaching, resilience, courtesy and motivation. Keep each faculty responsibility—research, teaching, service and lab management—at ${rules.faculty} or above.`];
 const careerPriority='Ph.D. outcomes are checked in this order: faculty appointment, postdoctoral position, then resident researcher. Remaining eligible careers are compared by their preparation scores.';
 const scorePriority='Ties are resolved in this order: science communication, startup, industrial R&D, public research, then a new field. A single activity does not guarantee a career.';
 const data={id,title:ENDINGS[id].career.en,fieldId:discipline.id,field:discipline.labelEn,timing:'',requirements:[],actions:[],notes:[],priority:null,legacy:false,degreeTargets:{masters,phd}};
 switch(id){
 case 'bachelor':data.timing='Undergraduate advising and graduate-admission meeting · month 24';data.requirements=['Choose graduation at the undergraduate admission meeting.','Even if graduate study is encouraged, the student may graduate if trust, motivation or their preference does not support staying.'];data.notes=['An earlier meeting about graduate study elsewhere can lead to that outcome first.'];break;
 case 'masters':data.timing='M.S. route · month 48, or month 54 after one semester of extension';data.requirements=['Choose the M.S. route after undergraduate study.',`Current ${discipline.labelEn} M.S. target: ${count(masters)}. Complete the thesis defense.`,'Choose graduation at the M.S. career meeting. The student may also finish the M.S. if they decide against continuing in this lab.'];data.notes=['The Ph.D. (M.S. en route) game route has no separate M.S. exit decision.','A one-semester M.S. extension is available once. Choosing graduation without the requirements closes the advising record.'];break;
 case 'external_masters':data.timing='Before the undergraduate admission meeting · month 24';data.requirements=['At least 2 accepted papers, h-index 2, and either a leading-journal paper or an award.','Strong research and communication preparation, trust and motivation open a meeting about studying elsewhere.','Encourage the move and let the student choose the outside program.'];data.notes=['Encouragement does not guarantee a move: the student can choose to stay.'];break;
 case 'external_phd':data.timing='M.S. degree and career meeting · month 48, or month 54 after extension';data.requirements=['Choose the M.S. route and meet its field-specific degree requirements.',`Current ${discipline.labelEn} M.S. target: ${count(masters)}.`,'At least 3 accepted papers, h-index 3, and either a leading-journal paper or an award.','Research and communication preparation, trust and motivation open the meeting. Encourage the move and let the student choose a doctoral program elsewhere.'];data.notes=['This M.S. admission meeting is absent from the Ph.D. (M.S. en route) game route. The student may still choose to stay.'];break;
 case 'true':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,...appointment,'Build deep mutual trust between advisor and student.'];data.actions=['After a paper is accepted, choose “Faculty action → Recommendation and career support.” New recommendation letters require 12 months since the previous letter.','Provide TA experience and opportunities to make research decisions and discuss them.'];data.notes=['An award is not required for this ending.'];data.priority='Checked first among completed Ph.D. career outcomes.';break;
 case 'postdoc':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,...appointment,'Maintain enough trust to continue research. If the higher-trust faculty ending is also satisfied, that ending takes priority.'];data.actions=['Prepare recommendation and career support after publication. New letters are recorded at 12-month intervals.'];data.priority='Checked after faculty appointment, before resident researcher and other careers.';break;
 case 'resident_researcher':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'A very close relationship and a student temperament that favors choosing a familiar research environment.','Keep faculty lab management at 40 or above.'];data.actions=['Listen to the student’s questions, plan together and sustain lab management and recovery time.'];data.priority='Checked after faculty and postdoctoral outcomes, before other career scores.';break;
 case 'institute':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'At least 4 accepted papers, or at least 2 accepted papers including 1 leading-journal paper.','Strong research, learning and independent judgment.'];data.actions=['Maintain literature study, research and analysis; ask the student to explain their question and reasoning.'];data.priority=careerPriority+' '+scorePriority;break;
 case 'corporate':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'Sufficient industry experience and research preparation.'];data.actions=['Use industry-sponsored RA work and collaboration events while continuing the degree research.'];data.priority=careerPriority+' '+scorePriority;break;
 case 'unrelated':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'Industry experience together with strong collaboration skills and independent judgment.'];data.actions=['Build experience through industry projects, presentations, collaboration and student-led decisions.'];data.priority=careerPriority+' '+scorePriority;break;
 case 'startup':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'Sufficient venture experience and independent judgment.'];data.actions=['Use creative industry-sponsored RA work and user-validation or support decisions in venture events.'];data.notes=['The weekly schedule has no separate startup activity. Preparation comes through RA work and related events.'];data.priority=careerPriority+' '+scorePriority;break;
 case 'youtuber':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'Very strong communication and collaboration, or substantial public-communication experience with sufficient communication preparation.'];data.actions=['Practice communication and presentations; use public-explanation and code-sharing events after publication.'];data.notes=['The weekly schedule has no separate video-production activity. Preparation comes through explanation and sharing events.','This special ending does not count toward the eight main endings or the five needed for the retirement reflection.'];data.priority=careerPriority+' '+scorePriority;break;
 case 'unemployed':data.timing='Career decision after the Ph.D. · month 96';data.requirements=[...degree,'No faculty, postdoctoral or resident-researcher outcome applies, and no other career reaches its preparation threshold.'];data.notes=['This is a completed Ph.D. followed by a search for the next role, distinct from failure to complete degree requirements.'];data.priority='Checked last, after all other Ph.D. career conditions.';break;
 case 'leave':data.timing='Monthly crisis check during enrollment';data.requirements=['Severely depleted physical or mental recovery resources, or extreme stress, persist for 2 consecutive months.','If the second check is not classified as a relationship breakdown, the student takes leave to recover.'];data.actions=['Adjust the schedule, recovery time and meetings after the first warning or rest request to break the crisis streak.'];data.notes=['Approving one rest request does not by itself trigger this ending.'];break;
 case 'dropout':data.timing='Monthly crisis check during enrollment';data.requirements=['A physical, mental or relationship crisis persists for 2 consecutive months.','At the second check, collapsed trust, high stress and depleted mental recovery resources classify it as a relationship crisis.'];data.actions=['Read the student’s comments, performance report and first warning; review workload, trust and recovery together.'];break;
 case 'dismissed':data.timing='Ph.D. qualifying exam · from month 48 on the direct Ph.D. route or month 60 on the M.S. route';data.requirements=['Attempt the qualifying exam twice and fail both attempts.'];data.actions=['Before the exam, complete at least 6 weeks of coursework in the preceding 18 months. After the first failure, complete at least 2 additional weeks.','Learning, research foundations and motivation also matter. Preparation can be deferred twice; the first retake is 3 months later.'];data.notes=['Leaving the program at the qualifying meeting is distinct from dismissal after two failed attempts.'];break;
 case 'gameover':data.timing='Monthly lab-risk check, thesis decision or final advising closure';data.requirements=[`One faculty responsibility remains at 0 for ${LAB_CLOSURE_MONTHS} consecutive months.`,`Outstanding operating advances exceed $25,000 and additional borrowing occurs for ${LAB_CLOSURE_MONTHS} consecutive months, or the player chooses to suspend operations for essential-cost shortages for ${LAB_CLOSURE_MONTHS} consecutive months.`,'Final thesis requirements remain unmet, or graduation is chosen without the degree requirements.','The direct Ph.D. qualifying meeting ends the program, or the student reaches the eight-year limit without completing the degree.'];data.actions=['A department-chair meeting gives advance warning. Restore depleted responsibilities and review costs, grant deposits and debt repayment.'];data.notes=['A single cash shortage or low ability does not close the lab immediately. The closure record states the actual cause. Dollar amounts are fictional game-scale values.'];break;
 case 'unfinished':data.timing='An archived outcome from an earlier version';data.requirements=['Earlier versions used this ending when the Ph.D. was not completed within eight years.'];data.notes=['New playthroughs record this as an advising closure with an unmet-degree-requirements cause. Archived letters remain readable.'];data.legacy=true;break;
 }
 return data;
}
