import {EVENTS} from './events.js';
const pick=(s,pool)=>pool[((Math.imul((s.creationSeed??s.seed)^s.month,2654435761)>>>0)%pool.length)];
export function studentObservation(s,locale='ko'){
 if(!s.started||s.ending)return '';
 if(s.hidden.rapport<10)return locale==='ko'?pick(s,['질문을 주저하는 것 같다. 노트의 메모를 만지작거린다.','질문을 주저하는 것 같다. 이야기를 꺼내려다 잠시 멈춘다.','질문을 주저하는 것 같다. 보고를 마친 뒤에도 자리에서 쉽게 일어나지 않는다.']):'They seem hesitant to ask a question, turning back to their notes.';
 if(s.pending?.kind==='event'&&EVENTS.find(e=>e.id===s.pending.id)?.kind==='counseling')return locale==='ko'?'학생이 보고 자료 옆에 따로 적어 온 질문을 펼친다.':'The student opens a separate page of questions beside the report.';
 return '';
}
export function counselingBody(event,s,locale='ko'){
 if(event.kind!=='counseling')return event.body[locale];
 const opening=s.hidden.rapport<10?(locale==='ko'?'학생은 보고를 마친 뒤에도 말을 망설였다. 먼저 질문할 시간이 있다고 전하자, 메모한 고민을 조심스레 꺼냈다.':'After the report, the student hesitates. Given time to ask, they cautiously share a question.'):(locale==='ko'?'“교수님, 오늘은 이 이야기도 함께 의논하고 싶어요.” 학생이 먼저 면담 주제를 꺼냈다.':'The student begins: “There is something else I would like to discuss today.”');
 return opening+'\n\n'+event.body[locale];
}
const followups={
 'counsel-career-first':['제가 좋아했던 일이 뭔지부터 적어 봤어요. 아직 결론은 없지만 알아볼 방향은 생겼어요.','진학 설명회와 채용 안내를 둘 다 봤어요. 조금 더 알아본 다음 제 생각을 말씀드릴게요.'],
 'counsel-coursework':['이번에는 수업 내용을 복습할 시간을 먼저 넣었어요. 놓쳤던 기초가 조금씩 연결돼요.','제가 짠 공부 계획을 해 봤어요. 다음 면담 때 어디까지 이해했는지 설명드려 볼게요.'],
 'counsel-small-question':['지난번에 같이 본 예제로 다시 계산해 봤어요. 작은 질문도 적어 와도 되는 거죠?','제가 이해한 부분부터 설명하니까 모르는 부분도 좀 더 분명해졌어요.'],
 'counsel-results':['원자료부터 다시 보니 어떤 단계에서 달라졌는지 보였어요. 아직 확인할 것은 남았어요.','다른 설명을 확인할 작은 검증을 짜 봤어요. 제가 생각한 순서를 봐 주실 수 있나요?'],
 'counsel-master-career':['생활과 하고 싶은 일을 같이 적으니 선택을 조금 다르게 보게 됐어요.','선배와 이야기해 봤어요. 실제 하루가 어떤지 물어본 게 도움이 됐어요.'],
 'counsel-qual':['공부할 범위를 나누니 시작하기가 좀 수월해졌어요. 모르는 부분은 다시 여쭤볼게요.','답을 외우는 대신 소리 내서 설명해 봤어요. 막히는 개념을 따로 적어 왔어요.'],
 'counsel-independent':['제가 고른 질문으로 작은 검증을 시작했어요. 결과가 다르더라도 근거를 남겨 둘게요.','반례를 찾다 보니 처음 생각한 범위를 줄였어요. 이 정도면 제가 끝까지 맡아 볼 수 있을 것 같아요.'],
 'counsel-phd-career':['어느 길을 고르든 준비해 볼 수 있다고 말씀해 주셔서, 제 우선순위를 더 생각해 봤어요.','관심 있던 일을 하는 분께 이야기를 들었어요. 다음에는 필요한 경험부터 준비하려고요.'],
 'counsel-feedback':['잘한 점과 고칠 점을 따로 적으니 이번 주에 무엇부터 할지 보였어요.','다음 면담에서 확인할 기준을 정해 두니, 혼자서도 계획을 돌아보기 쉬워졌어요.'],
};
export function counselingFollowup(s,locale='ko'){
 const last=s.history.filter(h=>h.kind==='event'&&Object.hasOwn(followups,h.id)).at(-1);
 if(!last||s.month-last.month>1||s.hidden.rapport<10)return null;
 return locale==='ko'?followups[last.id][last.choice]:'I revisited our last conversation and brought the next question I would like to explore.';
}
