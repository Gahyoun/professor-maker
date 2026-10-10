import {EVENTS,adaptEventText} from './events.js';
const pick=(s,pool)=>pool[((Math.imul((s.creationSeed??s.seed)^s.month,2654435761)>>>0)%pool.length)];
export function studentObservation(s,locale='ko'){
 if(!s.started||s.ending)return '';
 if(s.hidden.rapport<10)return locale==='ko'?pick(s,['질문을 주저하는 것 같다. 노트의 메모를 만지작거린다.','질문을 주저하는 것 같다. 이야기를 꺼내려다 잠시 멈춘다.','질문을 주저하는 것 같다. 보고를 마친 뒤에도 자리에서 쉽게 일어나지 않는다.']):'They seem hesitant to ask a question, turning back to their notes.';
 if(s.pending?.kind==='event'&&EVENTS.find(e=>e.id===s.pending.id)?.kind==='counseling')return locale==='ko'?'학생이 보고 자료 옆에 따로 적어 온 질문을 펼친다.':'The student opens a separate page of questions beside the report.';
 return '';
}
export function counselingBody(event,s,locale='ko'){
 const body=adaptEventText(event.body[locale],s,locale);
 if(event.kind!=='counseling')return body;
 const opening=s.hidden.rapport<10?(locale==='ko'?'학생은 보고를 마친 뒤에도 말을 망설였다. 먼저 질문할 시간이 있다고 전하자, 메모한 고민을 조심스레 꺼냈다.':'After the report, the student hesitates. Given time to ask, they cautiously share a question.'):(locale==='ko'?'“교수님, 오늘은 이 이야기도 함께 의논하고 싶어요.” 학생이 먼저 면담 주제를 꺼냈다.':'The student begins: “There is something else I would like to discuss today.”');
 return opening+'\n\n'+body;
}
const followups={
 'counsel-daily-life':['일정 사이에 제 시간을 조금 남겨 보려고 해요. 다음 주 계획부터 다시 살펴볼게요.','제가 필요한 시간을 정해서, 할 일과 쉬는 시간을 구분해 보겠습니다.'],
 'counsel-career-first':['제가 좋아했던 일부터 적어 볼게요. 아직 결론은 없지만 알아볼 방향은 생겼어요.','진학 설명회와 취업 정보를 둘 다 알아볼게요. 다음 면담에서 제 생각을 말씀드리겠습니다.'],
 'counsel-coursework':['이번에는 수업 내용을 복습할 시간을 먼저 넣으려고 해요. 놓쳤던 기초부터 살펴볼게요.','제가 짠 공부 계획을 시도해 볼게요. 다음 면담 때 어디까지 이해했는지 설명드리겠습니다.'],
 'counsel-small-question':['같이 본 예제로 다시 확인해 볼게요. 작은 질문도 적어 와도 되는 거죠?','제가 이해한 부분부터 설명하면서, 모르는 부분을 따로 정리해 볼게요.'],
 'counsel-results':['원자료부터 다시 살펴볼게요. 어느 단계에서 달라졌는지 먼저 확인해 보겠습니다.','다른 설명을 확인할 작은 검증부터 계획해 볼게요. 제가 생각한 순서를 봐 주실 수 있나요?'],
 'counsel-master-career':['생활과 하고 싶은 일을 함께 적어 볼게요. 어느 쪽이 맞을지는 더 알아보고 정하겠습니다.','선배에게 실제 하루가 어떤지 물어보고 싶어요. 만날 기회가 생기면 제가 먼저 질문을 준비할게요.'],
 'counsel-qual':['나눈 공부 범위부터 시작해 볼게요. 모르는 부분은 다시 여쭤보겠습니다.','답을 외우는 대신 소리 내서 설명해 볼게요. 막히는 개념을 따로 적어 보겠습니다.'],
 'counsel-independent':['제가 고른 질문으로 작은 검증을 준비해 볼게요. 결과가 다르더라도 근거를 남겨 두겠습니다.','반례와 필요한 자원을 살펴서 범위를 정해 보겠습니다. 끝까지 맡을 수 있는 계획인지도 확인할게요.'],
 'counsel-phd-career':['어느 길을 고르든 제 우선순위를 먼저 생각해 볼게요. 원하는 생활도 함께 정리하겠습니다.','관심 있던 일을 하는 분께 질문을 준비해 볼게요. 필요한 경험은 이야기를 듣고 나서 정하겠습니다.'],
 'counsel-feedback':['잘한 점과 고칠 점을 따로 적어 볼게요. 이번 주에 무엇부터 할지 정해 보겠습니다.','다음 면담의 확인 기준에 맞춰 제 계획을 돌아보겠습니다. 막히는 부분도 함께 적어 둘게요.'],
};
const supportingActivities={
 'counsel-daily-life':['rest','travel'],
 'counsel-coursework':['coursework'],
 'counsel-small-question':['coursework','study'],
 'counsel-results':['experiment','analysis'],
 'counsel-qual':['coursework'],
 'counsel-independent':['study','experiment','analysis','paper'],
};
const recordedFollowups={
 'counsel-daily-life':['일정 사이에 회복할 시간을 가졌어요. 다음 계획에도 필요한 여유를 남겨 보겠습니다.','쉬는 시간을 가져 보니, 제게 필요한 일상의 리듬도 다시 생각하게 됐어요.'],
 'counsel-coursework':['수업 내용을 다시 공부해 봤어요. 이해한 부분과 아직 막히는 부분을 나누어 가져오겠습니다.','공부 계획을 시도해 봤어요. 다음 면담에서 어떤 부분을 더 확인해야 할지 설명드릴게요.'],
 'counsel-small-question':['예제를 다시 확인해 봤어요. 작은 질문도 따로 적어 보겠습니다.','다시 공부해 봤어요. 다음에는 이해한 부분부터 제 말로 설명드리겠습니다.'],
 'counsel-results':['분석을 다시 시도해 봤어요. 확인한 내용과 남은 질문을 나누어 정리하겠습니다.','작은 검증을 시도해 봤어요. 예상과 다른 부분도 빼지 않고 가져오겠습니다.'],
 'counsel-qual':['정한 범위부터 공부를 시도했어요. 아직 모르는 개념은 다시 여쭤보겠습니다.','공부한 내용을 제 말로 설명해 보겠습니다. 막히는 부분은 따로 확인하고 싶어요.'],
 'counsel-independent':['검증을 시도해 봤어요. 결과와 제 판단의 근거를 나누어 정리하겠습니다.','연구를 이어 보니 더 확인할 질문이 생겼어요. 다음 면담에서 범위를 다시 의논하고 싶습니다.'],
};
export function counselingFollowup(s,locale='ko'){
 const last=s.history.filter(h=>h.kind==='event'&&Object.hasOwn(followups,h.id)).at(-1);
 if(!last||s.month-last.month>1||s.hidden.rapport<10)return null;
 const relevant=supportingActivities[last.id]??[];
 const after=s.history.filter(h=>h.kind==='month'&&h.month>last.month).flatMap(h=>h.results??[]);
 const attempted=after.filter(r=>relevant.includes(r.actual)||relevant.includes(r.assigned??r.proposed));
 const difficult=attempted.some(r=>!r.performed||(r.scienceFailures??0)>0);
 if(difficult)return locale==='ko'?'계획대로 되지 않은 부분이 있어요. 어디서 막혔는지 정리해서 다시 의논하고 싶습니다.':'Some parts did not go as planned. I would like to review where I got stuck.';
 if(attempted.some(r=>r.performed)&&last.choice<2)return locale==='ko'?recordedFollowups[last.id][last.choice]:'I tried the planned work and would like to review what still needs checking.';
 const planned=followups[last.id][last.choice]??(last.choice===2?'제 계획과 근거를 정리해서 다음 면담에 가져오겠습니다. 부족한 부분은 다시 조정해 볼게요.':'기한과 보완할 범위부터 확인하겠습니다. 진행하면서 어려운 점이 생기면 말씀드릴게요.');
 return locale==='ko'?planned:'I will prepare the next steps we discussed and bring any questions to our next meeting.';
}
