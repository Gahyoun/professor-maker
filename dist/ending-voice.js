// Original modular email passages, drawn from a completed run, with no extra RNG.
import {researchSetting} from './ending-context.js';
import {withParticle} from './korean.js';
import {HIDDEN_RANGES} from './engine.js';
const line=(locale,ko,en)=>locale==='en'?en:ko;
export function endingVoice(context,locale='ko'){
 const h=context?.statistics?.student,t=context?.statistics?.temperament;
 if(!h||!t)return [];
 const normalized=k=>{const [lo,hi]=HIDDEN_RANGES[k];return (h[k]-lo)/(hi-lo)*100;};
 const notes=[];
 if(context.ending==='youtuber'){return [line(locale,normalized('autonomy')>=75?'촬영 일정과 대본은 제가 정합니다. 교수님 출연분만은 검토란을 세 칸 만들어 두었습니다.':'어려운 개념을 짧게 설명하는 연습이 영상 편집에서도 도움이 됩니다. 단, 리뷰어 2의 말은 짧게 줄여도 길더군요.','Explaining difficult ideas briefly helps with editing too. Reviewer Two still takes a long time.')];}
 if(context.relationship==='distant')return [line(locale,normalized('autonomy')>=70?'다음 일정과 연락 범위는 제가 정해 필요한 내용만 정리해 드리겠습니다.':'인계 자료는 빠짐없이 정리했습니다. 이후에는 필요한 절차에 관한 연락만 부탁드립니다.','I have organized the handover. Please keep further contact to the necessary arrangements.')];
 if(t.caution>=65)notes.push(line(locale,'이 글도 바로 보내지 못하고 한 번 더 읽었습니다. 질문을 적어 두고 자료를 확인하던 습관은 지금도 남아 있습니다.','I reread this letter before sending it. I still write questions down and check the evidence before moving ahead.'));
 else if(t.expression>=65&&normalized('social')>=55)notes.push(line(locale,'요즘도 모르는 것이 생기면 사람들에게 먼저 물어봅니다. 함께 이야기하다가 생각이 정리되는 순간을 좋아합니다.','I still ask people when I am unsure. I enjoy the moment a conversation helps an idea become clearer.'));
 else if(t.curiosity>=65&&normalized('creativity')>=55)notes.push(line(locale,'다른 일을 하다가도 궁금한 것이 생기면 노트에 적습니다. 전부 답을 찾지는 못해도, 질문을 남기는 일은 계속하고 싶습니다.','I still put unexpected questions in my notebook. I cannot answer them all, but I want to keep asking.'));
 else if(normalized('diligence')>=70)notes.push(line(locale,'작게 나누어 할 일을 적고, 끝낸 것에 표시하는 버릇은 여전합니다. 이제는 일정표에 여유 시간도 같이 적어 둡니다.','I still break work into small tasks and mark what is done. I now leave room in the schedule as well.'));
 else notes.push(line(locale,'말로 다 하지 못했던 이야기를 이렇게 적어 봅니다. 제 속도에 맞는 생활과 일하는 방식을 조금씩 찾아가고 있습니다.','I am writing down what I could not quite say aloud. I am gradually finding a way of working and living that suits my pace.'));
 if(h.stress>=65||normalized('stamina')<35)notes.push(line(locale,'마지막 무렵에는 마친 일보다 못 마친 일만 자꾸 생각했습니다. 요즘은 하루를 정리할 때 생활을 돌본 일도 함께 적습니다.','Near the end, I kept thinking about unfinished work. These days I also count the things I do to take care of everyday life.'));
 else if(h.autonomy>=75)notes.push(line(locale,'다음 일을 정할 때는 먼저 제 계획을 써 봅니다. 조언을 구하더라도, 선택의 이유는 제가 설명할 수 있도록 하려고 합니다.','I write my own plan before deciding what comes next. Even when I seek advice, I want to explain the reasons for my choice.'));
 else if(normalized('language')>=65)notes.push(line(locale,'어려운 내용을 상대가 이해할 수 있게 고쳐 쓰는 일이 많이 익숙해졌습니다. 초고와 발표 자료를 여러 번 수정했던 시간이 지금도 도움이 됩니다.','I have become more comfortable rewriting difficult ideas for an audience. Revising drafts and presentations still helps me today.'));
 else if(normalized('research')>=65)notes.push(line(locale,'결과를 정리할 때 잘 나온 부분만 남기지 않으려고 합니다. 확인할 수 있는 것과 아직 모르는 것을 나누어 적던 습관이 도움이 됩니다.','When I review results, I try not to keep only what worked. Separating what is supported from what remains unknown still helps.'));
 else notes.push(line(locale,'모르는 것을 모른다고 말하고, 필요한 도움을 구하는 일도 배웠습니다. 앞으로도 조금씩 익혀 가려고 합니다.','I also learned to say when I do not know and ask for help. I intend to keep learning that way.'));
 const expertise=[['teaching',line(locale,'새로 배우는 동료에게 개념을 설명하다 보면, 수업을 도우며 받았던 질문이 떠오릅니다.','Explaining concepts to new colleagues brings back the questions I received while assisting classes.')],['industry',line(locale,'현장의 일정과 요구사항을 문서로 확인하는 습관은 지금 하는 일에도 도움이 됩니다.','Checking practical schedules and requirements in writing still helps with my work.')],['language',line(locale,'자료를 읽고 다른 언어로 다시 설명할 때, 뜻이 달라지지 않았는지 한 번 더 확인합니다.','When explaining material in another language, I check that its meaning has not changed.')],['research',line(locale,'예상과 다른 결과도 지우지 않고 기록합니다. 다시 확인할 근거가 남아 있어야 한다는 걸 배웠습니다.','I record unexpected results too, leaving the evidence needed to check them again.')],['learning',line(locale,'새 일을 배우면서 기초부터 다시 확인하는 시간이 늘었습니다. 모르는 부분을 나누어 공부합니다.','Learning new work brings me back to the fundamentals, studying unfamiliar parts one at a time.')]].sort((a,b)=>normalized(b[0])-normalized(a[0]));
 if(normalized(expertise[0][0])>=60)notes.push(expertise[0][1]);
 const setting=researchSetting(context),field=setting.field;
 const detail=withParticle(setting.task,'을/를')+' 확인하던 시간';
 if(context.fieldId||context.field)notes.push(line(locale,`${withParticle(field,'을/를')} 공부하며 ${withParticle(detail,'을/를')} 기억합니다. 바로 쓸 수 있는 답보다, 근거를 확인하는 방식을 배운 것이 오래 남습니다.`,`I remember studying ${field} and checking assumptions, evidence and methods. Learning how to justify an answer has stayed with me.`));
 return notes;
}
export function dryEndingText(text){return String(text).replaceAll('냉동고 맨 아래 칸 샘플','서버의 마지막 프로젝트 폴더').replaceAll('냉동고 맨 아래 칸을 열어','서버의 마지막 프로젝트 폴더를 열어').replaceAll('냉동고 샘플','보관 데이터').replaceAll('라벨이 붙은 튜브들','정리된 데이터 파일들').replaceAll('샘플은 라벨을 다 붙여 두었습니다','파일에는 설명과 실행 조건을 정리해 두었습니다').replaceAll('라벨을 다 붙여 두었습니다','설명과 실행 조건을 정리해 두었습니다').replaceAll('냉동고','자료 보관함').replaceAll('오래된 기계','오래된 워크스테이션').replaceAll('기계로 실험','컴퓨터로 계산').replaceAll('실험 노트','연구 노트').replaceAll('실험','연구');}

// Career-specific closings. No generic sentimental postscript for the special comedy.
export function letterClosing(id,distance,context,locale='ko'){
 if(distance==='distant')return '';
 const close=distance==='close';
 const endings={
 youtuber:close?['다음 촬영 전에 대본부터 보내겠습니다. 이번에는 “응”의 뜻을 제가 먼저 여쭤볼게요.','I will send the script before we film. This time, I will ask what your Hmm means.']:['대본 검토는 메일로 부탁드립니다. 6번 “응”은 편집으로 살릴 수 없습니다.','Please review the script by email. Editing cannot fix Hmm number six.'],
 bachelor:close?['다음에 뵐 때 새로 배우는 일도 들려드릴게요.','I will tell you what I am learning when we next meet.']:['다음 계획이 정해지면 짧게 소식 전하겠습니다.','I will send a short update when my next plan is settled.'],
 masters:close?['다음에 뵐 때 연구실 밖에서 배운 이야기도 들려드릴게요.','I will tell you what I have learned beyond the lab next time.']:['새 생활에 익숙해지면 다시 소식 전하겠습니다.','I will send an update once I have settled into this new routine.'],
 external_masters:close?['새 연구실에서 배운 이야기를 다음 방학에 들려드릴게요.','I will tell you about my new lab during the next break.']:['수업과 연구가 자리를 잡으면 다음 소식 전하겠습니다.','I will send news once my courses and research have settled.'],
 external_phd:close?['다음 학회에서 만나면 바뀐 연구 질문부터 들려드릴게요.','At the next conference, I will tell you about my new research question.']:['시험과 연구 일정이 정리되면 다시 연락드리겠습니다.','I will write again after organizing my exam and research schedule.'],
 institute:close?['다음에 뵐 때 공동연구 이야기와 교수님 안부도 함께 나누고 싶습니다.','I hope to discuss our collaboration and hear how you are doing.']:['공동연구 범위와 일정은 회의 전에 메일로 정리하겠습니다.','I will send the collaboration scope and schedule before the meeting.'],
 startup:close?['다음에 만나면 첫 고객에게 배운 이야기도 들려드릴게요.','Next time, I will tell you what our first customer taught us.']:['협업이 필요한 일은 범위와 비용부터 정리해 연락드리겠습니다.','For any collaboration, I will write after setting out its scope and cost.'],
 resident_researcher:close?['회의 뒤에는 연구 말고 서로의 안부도 나누면 좋겠습니다.','After the meeting, I hope we can catch up beyond research.']:['다음 회의의 안건과 역할을 먼저 정리해 공유하겠습니다.','I will share the agenda and responsibilities before the next meeting.'],
 leave:close?['여유가 생기면 산책 이야기부터 들려드릴게요.','When I have room for it, I will tell you about my walks.']:['복학 여부는 제가 정리한 뒤 먼저 연락드리겠습니다.','I will get in touch after deciding whether to return.'],
 dropout:close?['다른 일을 시작하더라도 함께 배운 시간을 기억하겠습니다.','I will remember what we learned together as I begin something else.']:['남은 인계가 끝나면 제 생활을 정리할 시간을 갖겠습니다.','After the handover, I will take time to organize my own life.'],
 unfinished:close?['남은 일을 정리하고 제가 원하는 다음 계획을 말씀드릴게요.','I will review the remaining work and tell you about my next plan.']:['다음 계획은 조금 더 살펴본 뒤 말씀드리겠습니다.','I will share my next plan after considering it further.'],
 gameover:close?['필요한 정리를 마친 뒤, 새로운 계획으로 다시 인사드릴게요.','After finishing the arrangements, I will share my new plans.']:['남은 절차를 확인하고 이후 계획은 제 속도로 정하겠습니다.','I will check the remaining procedures and decide what comes next at my own pace.'],
 };
 const pair=endings[id]??(close?['다음에 뵐 때 이야기 더 들려드릴게요.','I will tell you more when we next meet.']:['긴 안부를 쓰는 일은 아직 조금 어색합니다. 그래도 이 소식은 직접 전하고 싶었습니다.','A long personal letter still feels a little awkward. Even so, I wanted you to hear this news from me.']);
 return pair[locale==='en'?1:0];
}
