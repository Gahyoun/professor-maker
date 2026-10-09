// Original modular email passages, drawn from a completed run, with no extra RNG.
import {getDiscipline} from './disciplines.js';
const line=(locale,ko,en)=>locale==='en'?en:ko;
export function endingVoice(context,locale='ko'){
 const h=context?.statistics?.student,t=context?.statistics?.temperament;
 if(!h||!t)return [];
 const notes=[];
 if(t.caution>=65)notes.push(line(locale,'메일도 바로 보내지 못하고 한 번 더 읽었습니다. 질문을 적어 두고 자료를 확인하던 습관은 지금도 남아 있습니다.','I reread this email before sending it. I still write questions down and check the evidence before moving ahead.'));
 else if(t.expression>=65&&h.social>=20)notes.push(line(locale,'요즘도 모르는 것이 생기면 사람들에게 먼저 물어봅니다. 함께 이야기하다가 생각이 정리되는 순간을 좋아합니다.','I still ask people when I am unsure. I enjoy the moment a conversation helps an idea become clearer.'));
 else if(t.curiosity>=65&&h.creativity>=20)notes.push(line(locale,'다른 일을 하다가도 궁금한 것이 생기면 노트에 적습니다. 전부 답을 찾지는 못해도, 질문을 남기는 일은 계속하고 싶습니다.','I still put unexpected questions in my notebook. I cannot answer them all, but I want to keep asking.'));
 else if(h.diligence>=40)notes.push(line(locale,'작게 나누어 할 일을 적고, 끝낸 것에 표시하는 버릇은 여전합니다. 이제는 일정표에 여유 시간도 같이 적어 둡니다.','I still break work into small tasks and mark what is done. I now leave room in the schedule as well.'));
 else notes.push(line(locale,'말로 다 하지 못했던 이야기를 이렇게 적어 봅니다. 제 속도에 맞는 생활과 일하는 방식을 조금씩 찾아가고 있습니다.','I am writing down what I could not quite say aloud. I am gradually finding a way of working and living that suits my pace.'));
 if(h.stress>=65||h.stamina<350)notes.push(line(locale,'마지막 무렵에는 마친 일보다 못 마친 일만 자꾸 생각했습니다. 요즘은 하루를 정리할 때 생활을 돌본 일도 함께 적습니다.','Near the end, I kept thinking about unfinished work. These days I also count the things I do to take care of everyday life.'));
 else if(h.autonomy>=75)notes.push(line(locale,'다음 일을 정할 때는 먼저 제 계획을 써 봅니다. 조언을 구하더라도, 선택의 이유는 제가 설명할 수 있도록 하려고 합니다.','I write my own plan before deciding what comes next. Even when I seek advice, I want to explain the reasons for my choice.'));
 else if(h.language>=650)notes.push(line(locale,'어려운 내용을 상대가 이해할 수 있게 고쳐 쓰는 일이 많이 익숙해졌습니다. 초고와 발표 자료를 여러 번 수정했던 시간이 지금도 도움이 됩니다.','I have become more comfortable rewriting difficult ideas for an audience. Revising drafts and presentations still helps me today.'));
 else if(h.research>=650)notes.push(line(locale,'결과를 정리할 때 잘 나온 부분만 남기지 않으려고 합니다. 확인할 수 있는 것과 아직 모르는 것을 나누어 적던 습관이 도움이 됩니다.','When I review results, I try not to keep only what worked. Separating what is supported from what remains unknown still helps.'));
 else notes.push(line(locale,'모르는 것을 모른다고 말하고, 필요한 도움을 구하는 일도 배웠습니다. 앞으로도 조금씩 익혀 가려고 합니다.','I also learned to say when I do not know and ask for help. I intend to keep learning that way.'));
 const d=getDiscipline(context.fieldId),field=context.field||d.label,dry=context.labMode==='dry';
 let detail=/수학|통계/.test(field)?'정의와 가정을 확인하고 반례를 찾던 시간':/컴퓨터|정보|소프트/.test(field)?'코드와 데이터 처리 과정을 다시 실행하며 확인하던 시간':/생명|생물|바이오|의학|약학/.test(field)?(dry?'자료의 품질과 분석 조건을 비교하던 시간':'시료의 상태와 대조 조건을 확인하던 시간'):/화학|재료/.test(field)?(dry?'계산 조건과 모형의 한계를 검토하던 시간':'조건을 바꾸고 측정 기록을 비교하던 시간'):'자료를 정리하고 모형과 관측의 차이를 의논하던 시간';
 if(context.fieldId||context.field)notes.push(line(locale,`${field}을 공부하며 ${detail}을 기억합니다. 바로 쓸 수 있는 답보다, 근거를 확인하는 방식을 배운 것이 오래 남습니다.`,`I remember studying ${field} and checking assumptions, evidence and methods. Learning how to justify an answer has stayed with me.`));
 return notes;
}
export function dryEndingText(text){return String(text).replaceAll('냉동고 맨 아래 칸 샘플','서버의 마지막 프로젝트 폴더').replaceAll('냉동고 맨 아래 칸을 열어','서버의 마지막 프로젝트 폴더를 열어').replaceAll('냉동고 샘플','보관 데이터').replaceAll('라벨이 붙은 튜브들','정리된 데이터 파일들').replaceAll('샘플은 라벨을 다 붙여 두었습니다','파일에는 설명과 실행 조건을 정리해 두었습니다').replaceAll('라벨을 다 붙여 두었습니다','설명과 실행 조건을 정리해 두었습니다').replaceAll('냉동고','자료 보관함').replaceAll('오래된 기계','오래된 워크스테이션').replaceAll('기계로 실험','컴퓨터로 계산').replaceAll('실험 노트','연구 노트').replaceAll('실험','연구');}
