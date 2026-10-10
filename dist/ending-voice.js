// Original modular letter passages. IDs survive replays and collection exports.
import {replaceNounWithParticle} from './korean.js';
import {HIDDEN_RANGES} from './engine.js';
const line=(locale,ko,en)=>locale==='en'?en:ko;
const passage=(id,ko,en,tags=[])=>({id,ko,en,tags});
const VOICE_BANK={
 caution:[
  passage('voice.caution.reread.v1','보내기 전에 이 글을 한 번 더 읽었습니다. 쉽게 단정하지 않고 확인할 것부터 적는 버릇은 여전합니다.','I reread this letter before sending it. I still write down what needs checking before reaching a conclusion.'),
  passage('voice.caution.uncertainty.v1','회의에서도 확실한 것과 아직 확인할 것을 나누어 말합니다. 답을 늦게 내더라도 그 구분은 지키려고 합니다.','In meetings, I distinguish what is established from what still needs checking. I keep that distinction even when it takes longer to answer.'),
  passage('voice.caution.criteria.v1','새 제안을 받으면 먼저 판단할 기준을 적습니다. 서두르지 않고 그 기준을 함께 확인하는 편이 제게 잘 맞습니다.','When a new proposal arrives, I first write down how to assess it. Taking time to agree on those criteria suits me.'),
 ],
 expression:[
  passage('voice.expression.conversation.v1','생각이 막히면 동료에게 먼저 말을 겁니다. 서로 설명하다 보면 혼자서는 놓쳤던 질문이 나오곤 합니다.','When I get stuck, I start a conversation with a colleague. Explaining our thoughts often uncovers a question I missed alone.'),
  passage('voice.expression.followup.v1','회의가 끝난 뒤에도 질문이 남으면 따로 연락합니다. 짧은 대화 하나가 다음 일의 방향을 바꾸기도 합니다.','If a question remains after a meeting, I follow up. A brief conversation can change the direction of the next task.'),
 ],
 curiosity:[
  passage('voice.curiosity.notebook.v1','계획에 없던 질문도 노트 한쪽에 적어 둡니다. 당장 답하지 못해도 나중에 다시 꺼낼 수 있으니까요.','I keep unplanned questions in the margin of my notebook. Even when I cannot answer them now, I can return to them later.'),
  passage('voice.curiosity.detour.v1','예상과 다른 결과를 만나면 그 옆에 새 질문을 적습니다. 가끔은 그 질문이 원래 계획보다 오래 남습니다.','When a result differs from what I expected, I write a new question beside it. Sometimes that question outlasts the original plan.'),
 ],
 diligence:[
  passage('voice.diligence.checklist.v1','일을 작게 나누어 적고 끝낸 항목에 표시합니다. 다음 사람이 이어받을 수 있도록 마지막 확인까지 남겨 둡니다.','I break work into small tasks and mark each one complete. I leave a final check so the next person can take it forward.'),
  passage('voice.diligence.buffer.v1','계획표에는 수정할 시간도 따로 잡습니다. 마감일만 적었을 때보다 동료들과 약속을 지키기 수월해졌습니다.','I set aside time for revisions in the schedule. It helps me keep commitments to colleagues better than listing deadlines alone.'),
 ],
 newroutine:[
  passage('voice.newroutine.working.v1','새 일의 하루가 어떤지 조금씩 알아가고 있습니다. 지금은 제게 맞는 생활과 일하는 방식을 찾아보려 합니다.','I am gradually learning what a day in this new work is like. For now, I am finding a routine that suits me.',['newcomer']),
  passage('voice.newroutine.smallsteps.v1','익숙하지 않은 일은 작은 단계로 나누어 시작합니다. 처음부터 다 할 수 있다고 약속하지는 않으려고 합니다.','I begin unfamiliar work in small steps. I try not to promise that I can do everything at once.',['newcomer']),
 ],
 recovery:[
  passage('voice.recovery.stop.v1','요즘은 일을 멈출 시간도 미리 정합니다. 다음 날을 남겨 두는 것도 제 계획에 넣기로 했습니다.','These days I decide when to stop working in advance. Leaving room for tomorrow is part of my plan.',['recovery']),
  passage('voice.recovery.daily.v1','하루를 정리할 때 식사와 산책도 함께 적습니다. 결과를 낸 일만으로 하루를 세지 않으려고 합니다.','When I review my day, I include meals and walks. I try not to measure the whole day only by its results.',['recovery']),
 ],
 research:[
  passage('voice.research.review.v1','좋아 보이는 결과일수록 다른 설명이 가능한지 먼저 살핍니다. 동료에게도 결론보다 확인 과정을 보여 주려 합니다.','The more promising a result looks, the more carefully I consider other explanations. I show colleagues the checks before the conclusion.'),
  passage('voice.research.records.v1','뜻밖의 결과도 원자료와 함께 남깁니다. 다시 확인할 사람이 같은 출발점에서 시작할 수 있어야 하니까요.','I keep unexpected results alongside the source material, so anyone checking them can start from the same evidence.'),
  passage('voice.research.limits.v1','원고를 읽을 때는 결론이 어디까지 성립하는지부터 표시합니다. 그 선을 분명히 해야 다음 질문도 보입니다.','When reading a draft, I first mark the limits of its conclusions. A clear boundary makes the next question visible.'),
 ],
 learning:[
  passage('voice.learning.assumptions.v1','익숙한 방법을 쓰더라도 그 가정이 이번 문제에 맞는지 다시 살핍니다. 배운 것을 그대로 옮기기보다 쓰일 조건을 확인합니다.','Even with a familiar method, I check whether its assumptions fit this problem. I examine the conditions before transferring what I learned.'),
  passage('voice.learning.compare.v1','새 방법을 검토할 때는 기존 방법과 같은 자료로 비교합니다. 무엇이 달라졌는지 제 말로 설명할 수 있어야 선택할 수 있습니다.','I compare a new method with the existing one on the same evidence. I choose only when I can explain what changed in my own words.'),
  passage('voice.learning.reading.v1','읽다가 이해가 어긋나는 부분은 그냥 넘기지 않습니다. 관련 근거를 옆에 놓고 다시 읽는 시간이 제 일의 일부가 되었습니다.','I do not skip a passage when my understanding breaks down. Rereading it alongside the relevant evidence has become part of my work.'),
  passage('voice.learning.argument.v1','논문을 읽으면 주장과 그것을 뒷받침하는 근거를 따로 정리합니다. 결론만 읽었을 때는 보이지 않던 다음 질문이 그 사이에서 나옵니다.','When reading a paper, I set out its claims separately from the evidence supporting them. The gap between the two reveals questions I would miss by reading only the conclusion.'),
  passage('voice.learning.tradeoffs.v1','방법을 고를 때는 정확도뿐 아니라 필요한 자료와 계산 시간도 함께 적습니다. 더 복잡한 방법이 언제 도움이 되는지 설명할 수 있어야 합니다.','When choosing a method, I list the required evidence and computing time alongside its accuracy. I need to explain when a more complex approach would help.'),
  passage('voice.learning.original.v1','인용된 설명이 중요해지면 원문까지 찾아 읽습니다. 문장을 옮기는 동안 생략된 조건이 없는지 확인하고 제 글에도 그 범위를 남깁니다.','When a cited explanation becomes important, I read the original source. I check which conditions may have been omitted and retain those limits in my own writing.'),
  passage('voice.learning.application.v1','새로 배운 개념은 잘 아는 문제에 먼저 적용해 봅니다. 익숙한 답과 달라지는 지점을 살펴야 새로운 문제에서도 어디까지 쓸 수 있을지 알 수 있습니다.','I first apply a newly learned concept to a problem I know well. Comparing it with the familiar answer helps me understand how far it can be used on a new problem.'),
  passage('voice.learning.disagreement.v1','서로 다른 설명을 읽으면 둘의 전제가 어디서 갈리는지 적어 봅니다. 하나를 바로 고르기보다 판단에 필요한 자료를 찾는 편이 도움이 됩니다.','When reading conflicting explanations, I write down where their premises diverge. Looking for the evidence needed to decide helps more than immediately choosing one.'),
  passage('voice.learning.foundations.v1','새 일을 배우면서 기초부터 다시 확인하고 있습니다. 모르는 부분을 나누어 공부하니 다음에 물어볼 것도 분명해집니다.','I return to the fundamentals as I learn this new work. Studying unfamiliar parts one at a time clarifies my next questions.',['newcomer']),
 ],
 language:[
  passage('voice.language.audience.v1','같은 내용도 듣는 사람에 맞춰 다시 씁니다. 짧게 설명하더라도 중요한 조건은 빠뜨리지 않으려고 합니다.','I rewrite the same material for different audiences. Even in a short explanation, I try to retain the conditions that matter.'),
  passage('voice.language.translation.v1','다른 언어로 자료를 설명할 때는 뜻이 달라지지 않았는지 확인합니다. 표현을 다듬는 동안 제 설명의 빈틈도 보입니다.','When explaining material in another language, I check that its meaning remains intact. Revising the wording also reveals gaps in my explanation.'),
  passage('voice.language.editing.v1','초고를 동료에게 읽어 달라고 부탁하고, 어디서 이해가 끊겼는지 묻습니다. 고치는 동안 제가 먼저 정리해야 할 질문도 찾습니다.','I ask a colleague to read a draft and tell me where it becomes unclear. Revising it helps me find the questions I need to resolve first.'),
 ],
 social:[
  passage('voice.social.exchange.v1','다른 팀의 사람과 이야기할 때는 그쪽이 궁금해하는 것도 먼저 묻습니다. 서로 다른 관심사를 놓고 이야기해야 협업의 시작점이 보입니다.','When speaking with another team, I first ask what they want to understand. Discussing both sides’ interests helps us find a starting point for collaboration.'),
  passage('voice.social.questions.v1','회의에서는 조용했던 사람에게도 질문할 틈을 남깁니다. 모두가 같은 뜻으로 이해했는지 확인하는 데 도움이 됩니다.','I leave room in meetings for people who have been quiet to ask questions. It helps us check that we understand one another.'),
  passage('voice.social.followup.v1','행사에서 나눈 이야기는 돌아온 뒤 짧게 정리해 보냅니다. 명함을 모으는 것보다 다음에 함께 할 일을 확인하는 편이 좋습니다.','After an event, I send a short account of what we discussed. I prefer agreeing on possible next steps to simply collecting contacts.'),
 ],
 autonomy:[
  passage('voice.autonomy.reasons.v1','의견을 구하기 전에 제 계획과 선택한 이유를 먼저 씁니다. 조언을 받은 뒤에도 최종 판단은 제가 설명할 수 있도록 합니다.','Before asking for advice, I write down my plan and reasons. Even after hearing others’ views, I make sure I can explain my final decision.'),
  passage('voice.autonomy.scope.v1','새 일을 맡을 때는 제가 결정할 범위부터 확인합니다. 맡은 판단을 미루지 않으면서도 동료와 맞출 부분은 따로 의논합니다.','When taking on new work, I clarify what I can decide. I take responsibility for those decisions and discuss what needs agreement with colleagues.'),
  passage('voice.autonomy.revision.v1','계획을 바꿀 때는 바뀐 근거도 함께 남깁니다. 처음 세운 계획보다 지금 확인한 내용에 책임을 지려 합니다.','When changing a plan, I record the new evidence too. I take responsibility for what we now know, rather than only for the original plan.'),
 ],
 teaching:[
  passage('voice.teaching.question.v1','설명하다가 질문을 받으면 답부터 서두르지 않습니다. 어디서 생각이 갈렸는지 함께 살피는 편이 서로에게 도움이 됩니다.','When a question comes during an explanation, I do not rush to answer. Looking together at where our reasoning diverged helps both of us.'),
  passage('voice.teaching.example.v1','처음 듣는 사람에게 설명할 때는 작은 예시부터 고릅니다. 설명이 끝나면 그 사람이 이해한 내용을 먼저 들어 봅니다.','For someone new to a topic, I begin with a small example. After explaining, I first listen to how they understood it.'),
  passage('voice.teaching.seminar.v1','세미나 자료에는 정답만 적지 않습니다. 어떤 가정을 썼는지 함께 묻도록 질문을 남겨 둡니다.','My seminar materials do not contain only answers. I leave questions that invite us to examine the assumptions together.'),
 ],
 industry:[
  passage('voice.industry.requirements.v1','현장에서 요청이 바뀌면 일정과 요구사항부터 다시 확인합니다. 서로 다르게 이해한 채 진행하지 않도록 기록으로 남깁니다.','When a practical request changes, I recheck the schedule and requirements. I record the agreement so we do not proceed with different understandings.'),
  passage('voice.industry.verification.v1','납품할 때는 잘 작동한 조건과 아직 확인하지 못한 조건을 나눠 적습니다. 사용할 사람에게 그 범위를 설명하는 일도 제 몫입니다.','At delivery, I distinguish the conditions that worked from those still untested. Explaining those limits to the user is part of my responsibility.'),
  passage('voice.industry.coordination.v1','팀마다 다른 일정은 먼저 문서로 맞춰 봅니다. 할 수 있는 범위를 일찍 확인해야 서로의 약속도 지킬 수 있습니다.','I compare the teams’ schedules in writing first. Clarifying what is possible early helps us keep our commitments to one another.'),
 ],
 enterprise:[
  passage('voice.enterprise.customer.v1','설명을 길게 하기 전에 상대가 풀고 싶은 문제부터 묻습니다. 답을 듣고 나면 처음 생각했던 계획을 바꾸기도 합니다.','Before giving a long explanation, I ask what problem the other person wants to solve. Their answer sometimes changes my original plan.'),
  passage('voice.enterprise.promises.v1','새 제안을 할 때는 비용과 할 수 있는 일을 함께 적습니다. 기대를 크게 만드는 것보다 지킬 약속을 분명히 하려 합니다.','When making a proposal, I set out the cost and what I can deliver. I prefer clear commitments to inflated expectations.'),
  passage('voice.enterprise.team.v1','혼자 빨리 정하는 것보다 팀이 같은 문제를 보고 있는지 먼저 확인합니다. 방향을 바꿀 때도 이유를 함께 나누려 합니다.','Rather than deciding quickly alone, I check that the team is addressing the same problem. I share the reasons when changing direction too.'),
 ],
 outreach:[
  passage('voice.outreach.limits.v1','연구를 소개할 때는 알게 된 것과 아직 모르는 것을 함께 말합니다. 흥미로운 설명이 근거보다 앞서가지 않도록 살핍니다.','When introducing research, I describe both what we know and what remains unknown. I make sure an engaging explanation does not outrun the evidence.'),
  passage('voice.outreach.examples.v1','설명을 쉽게 만들 때도 핵심 조건은 남겨 둡니다. 듣는 사람의 질문을 받아야 어떤 예시가 필요한지 알 수 있습니다.','Even in an accessible explanation, I retain the key conditions. The audience’s questions tell me which examples they need.'),
  passage('voice.outreach.correction.v1','설명에 오류가 있으면 고친 내용도 같은 자리에서 알립니다. 다음 이야기를 이어 가려면 그 확인이 먼저라고 생각합니다.','When an explanation contains an error, I publish the correction in the same place. I think that check must come before the next account.'),
 ],
 intuition:[
  passage('voice.intuition.check.v1','떠오른 설명은 작은 검증부터 해 봅니다. 처음의 감이 맞았는지보다 무엇을 확인했는지를 남깁니다.','I test a possible explanation on a small scale first. I record what was checked, rather than only whether my first instinct was right.'),
  passage('voice.intuition.alternative.v1','익숙한 설명이 떠올라도 다른 가능성을 하나는 함께 적습니다. 둘을 가를 자료가 무엇인지 찾는 데 도움이 됩니다.','Even when a familiar explanation comes to mind, I write down an alternative. It helps me find the evidence that distinguishes them.'),
  passage('voice.intuition.pattern.v1','비슷해 보이는 결과를 만나면 차이부터 표시합니다. 그 작은 차이를 따라가다 새 질문을 찾을 때가 있습니다.','When results look similar, I mark their differences first. Following a small difference sometimes leads to a new question.'),
 ],
};
export const VOICE_PASSAGE_IDS=Object.freeze(Object.values(VOICE_BANK).flat().map(p=>p.id));
const NO_VOICE_ENDINGS=new Set(['leave','dropout','gameover','unfinished','dismissed','youtuber']);
const NO_NEWCOMER_ENDINGS=new Set(['true','postdoc','institute','resident_researcher']);
const NO_RECOVERY_ENDINGS=new Set(['true','postdoc','institute']);
const eligibleVoice=(candidate,ending)=>!(NO_NEWCOMER_ENDINGS.has(ending)&&candidate.tags.includes('newcomer'))&&!(NO_RECOVERY_ENDINGS.has(ending)&&candidate.tags.includes('recovery'));

// Candidates are alternatives, not paragraphs to append. The story composer owns
// the shared memory/voice budget, context filtering and the position in a letter.
export function endingVoiceCandidates(context={},locale='ko'){
 const h=context?.statistics?.student,t=context?.statistics?.temperament;
 if(!h||!t||NO_VOICE_ENDINGS.has(context.ending)||context.relationship==='distant')return [];
 const normalized=key=>{const range=HIDDEN_RANGES[key];return range&&Number.isFinite(h[key])?(h[key]-range[0])*100/(range[1]-range[0]):0;};
 const candidates=[];
 const add=(key,group,priority)=>{for(const row of VOICE_BANK[key])candidates.push({id:row.id,text:line(locale,row.ko,row.en),tags:[...row.tags],group,priority});};
 if(t.caution>=65)add('caution','trait',70);
 else if(t.expression>=65&&normalized('social')>=55)add('expression','trait',70);
 else if(t.curiosity>=65&&normalized('creativity')>=55)add('curiosity','trait',70);
 else if(normalized('diligence')>=70)add('diligence','trait',70);
 else add('newroutine','trait',55);
 if(h.stress>=65||normalized('stamina')<35)add('recovery','trait',65);
 const skills=['research','learning','language','social','autonomy','teaching','industry','enterprise','outreach','intuition'].map(key=>({key,score:normalized(key)})).filter(skill=>skill.score>=60).sort((a,b)=>b.score-a.score).slice(0,2);
 for(const skill of skills)add(skill.key,'skill',90+skill.score/100);
 return candidates.filter(candidate=>eligibleVoice(candidate,context.ending));
}

// Compatibility helper for callers outside the story composer.
export function endingVoice(context={},locale='ko'){
 const budget=context.relationship==='distant'||NO_VOICE_ENDINGS.has(context.ending)?0:context.relationship==='close'?2:1;
 const candidates=endingVoiceCandidates(context,locale).sort((a,b)=>b.priority-a.priority);
 const groups=new Set(),notes=[];
 for(const candidate of candidates){if(notes.length>=budget)break;if(groups.has(candidate.group))continue;groups.add(candidate.group);notes.push(candidate.text);}
 return notes;
}
export function dryEndingText(text){return replaceNounWithParticle(String(text),'오래된 기계','오래된 워크스테이션').replaceAll('냉동고 맨 아래 칸 샘플','서버의 마지막 프로젝트 폴더').replaceAll('냉동고 맨 아래 칸을 열어','서버의 마지막 프로젝트 폴더를 열어').replaceAll('냉동고 샘플','보관 데이터').replaceAll('라벨이 붙은 튜브들','정리된 데이터 파일들').replaceAll('샘플은 라벨을 다 붙여 두었습니다','파일에는 설명과 실행 조건을 정리해 두었습니다').replaceAll('라벨을 다 붙여 두었습니다','설명과 실행 조건을 정리해 두었습니다').replaceAll('냉동고','자료 보관함').replaceAll('기계로 실험','컴퓨터로 계산').replaceAll('실험 노트','연구 노트').replaceAll('실험','연구');}

// Career-specific closings. No generic sentimental postscript for the special comedy.
export function letterClosing(id,distance,context,locale='ko'){
 if(distance==='distant')return '';
 const close=distance==='close';
 const endings={
 postdoc:close?['건강하세요.','Please take care.']:['긴 안부를 쓰는 일은 아직 조금 어색합니다. 그래도 이 소식은 직접 전하고 싶었습니다.','A long personal letter still feels a little awkward. Even so, I wanted you to hear this news from me.'],
 youtuber:close?['다음 촬영 전에 대본부터 보내겠습니다. 이번에는 “응”의 뜻을 제가 먼저 여쭤볼게요.','I will send the script before we film. This time, I will ask what your Hmm means.']:['대본 검토는 메일로 부탁드립니다. 6번 “응”은 편집으로 살릴 수 없습니다.','Please review the script by email. Editing cannot fix Hmm number six.'],
 bachelor:close?['다음에 뵐 때 새로 배우는 일도 들려드릴게요.','I will tell you what I am learning when we next meet.']:['다음 계획이 정해지면 짧게 소식 전하겠습니다.','I will send a short update when my next plan is settled.'],
 masters:close?['다음에 뵐 때 연구실 밖에서 배운 이야기도 들려드릴게요.','I will tell you what I have learned beyond the lab next time.']:['새 생활에 익숙해지면 다시 소식 전하겠습니다.','I will send an update once I have settled into this new routine.'],
 external_masters:close?['새 연구실에서 배운 이야기를 다음 방학에 들려드릴게요.','I will tell you about my new lab during the next break.']:['수업과 연구가 자리를 잡으면 다음 소식 전하겠습니다.','I will send news once my courses and research have settled.'],
 external_phd:close?['건강하세요.','Please take care.']:['시험과 연구 일정이 정리되면 다시 연락드리겠습니다.','I will write again after organizing my exam and research schedule.'],
 institute:close?['다음에 뵐 때 교수님 안부도 듣고 싶습니다.','I hope to hear how you are doing when we meet.']:['공동연구 범위와 일정은 회의 전에 메일로 정리하겠습니다.','I will send the collaboration scope and schedule before the meeting.'],
 startup:close?['다음에 만나면 첫 고객에게 배운 이야기도 들려드릴게요.','Next time, I will tell you what our first customer taught us.']:['협업이 필요한 일은 범위와 비용부터 정리해 연락드리겠습니다.','For any collaboration, I will write after setting out its scope and cost.'],
 resident_researcher:close?['회의 뒤에는 연구 말고 서로의 안부도 나누면 좋겠습니다.','After the meeting, I hope we can catch up beyond research.']:['다음 회의의 안건과 역할을 먼저 정리해 공유하겠습니다.','I will share the agenda and responsibilities before the next meeting.'],
 leave:close?['여유가 생기면 산책 이야기부터 들려드릴게요.','When I have room for it, I will tell you about my walks.']:['교수님도 건강히 지내시길 바랍니다.','I hope you are keeping well.'],
 dropout:close?['다른 일을 시작하더라도 함께 배운 시간을 기억하겠습니다.','I will remember what we learned together as I begin something else.']:['남은 인계가 끝나면 제 생활을 정리할 시간을 갖겠습니다.','After the handover, I will take time to organize my own life.'],
 unfinished:close?['남은 일을 정리하고 제가 원하는 다음 계획을 말씀드릴게요.','I will review the remaining work and tell you about my next plan.']:['다음 계획은 조금 더 살펴본 뒤 말씀드리겠습니다.','I will share my next plan after considering it further.'],
 gameover:close?['필요한 정리를 마친 뒤, 새로운 계획으로 다시 인사드릴게요.','After finishing the arrangements, I will share my new plans.']:['남은 절차를 확인하고 이후 계획은 제 속도로 정하겠습니다.','I will check the remaining procedures and decide what comes next at my own pace.'],
 };
 const pair=endings[id]??(close?['다음에 뵐 때 이야기 더 들려드릴게요.','I will tell you more when we next meet.']:['긴 안부를 쓰는 일은 아직 조금 어색합니다. 그래도 이 소식은 직접 전하고 싶었습니다.','A long personal letter still feels a little awkward. Even so, I wanted you to hear this news from me.']);
 return pair[locale==='en'?1:0];
}
