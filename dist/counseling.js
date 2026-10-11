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

const REACTIONS={
 'counsel-daily-life':[
  {baseExpression:'relieved',responses:{ko:'안도하는 미소를 지으며 “교수님께서 먼저 생활 시간을 살펴 주셔서 마음이 한결 가벼워졌어요. 무리하지 않고 균형을 찾아보겠습니다.”',en:'With a relieved smile: “It brings me peace of mind that you looked after my daily rhythm first. I will find a healthy balance.”'},caution:{expression:'focused',ko:'생각에 잠긴 표정으로 노트를 짚으며 “제가 무리했던 부분부터 적어 볼게요. 지킬 수 있는 일정으로 다시 정하겠습니다.”',en:'Looking thoughtful, they point to their notes: “I will write down where I overextended myself and set a realistic schedule.”'},guarded:{expression:'surprised',ko:'조금 놀란 표정으로 “진도를 재촉하지 않으셔서 다행이에요. 제 페이스를 천천히 찾아보겠습니다.”',en:'Looking a bit surprised: “I am relieved you did not press for more progress. I will find my own pace.”'}},
  {baseExpression:'happy',responses:{ko:'환하게 미소 지으며 “제가 직접 충전할 시간과 연구 시간을 나누어 계획서를 가져오겠습니다! 믿고 맡겨 주셔서 감사해요.”',en:'Smiling brightly: “I will bring a plan that clearly separates research hours from recharge time! Thank you for trusting me.”'},diligence:{expression:'focused',ko:'진지하게 고개를 끄덕이며 “회복 시간과 집중 근무 시간을 꼼꼼하게 구분해 두겠습니다.”',en:'Nodding thoughtfully: “I will carefully organize my recovery blocks alongside deep-work hours.”'},guarded:{expression:'surprised',ko:'조금 놀란 눈으로 “제가 직접 쉬는 시간을 정해도 되나요? 꼼꼼히 정리해 오겠습니다.”',en:'With surprised eyes: “May I truly set my own rest hours? I will plan it carefully.”'}}
 ],
 'counsel-career-first':[
  {baseExpression:'focused',responses:{ko:'생각에 잠긴 눈으로 노트를 펼치며 “연구실에서 뿌듯했던 순간과 버거웠던 순간을 정직하게 적어 볼게요.”',en:'Looking thoughtful, opening their notebook: “I will write down both the proud moments and the exhausting ones honestly.”'},close:{expression:'relieved',ko:'안도하는 표정으로 “교수님과 함께 제 마음을 돌아볼 수 있어 든든해요.”',en:'Looking relieved: “It gives me so much confidence to reflect on my feelings together with you.”'}},
  {baseExpression:'happy',responses:{ko:'환하게 미소 지으며 “진학과 취업, 두 길을 모두 열어 두고 고민할 수 있게 해 주셔서 정말 감사합니다.”',en:'Smiling warmly: “Thank you so much for allowing me room to explore both graduate study and industry.”'},caution:{expression:'focused',ko:'생각에 잠겨 고개를 끄덕이며 “각각의 선택지에서 필요한 준비 사항을 꼼꼼히 비교해 보겠습니다.”',en:'Nodding in thought: “I will carefully compare the prerequisites and preparations for each path.”'}}
 ],
 'counsel-coursework':[
  {baseExpression:'relieved',responses:{ko:'안도하는 숨을 내쉬며 “기초가 부족해 불안했는데, 연구 범위를 조정해 주셔서 살 것 같아요. 수업 복습부터 챙기겠습니다.”',en:'Breathing a sigh of relief: “I was anxious about my weak foundations. Narrowing the scope helps so much; I will review the basics first.”'},guarded:{expression:'surprised',ko:'놀란 표정으로 “수업을 우선 챙기라고 배려해 주실 줄 몰랐어요. 감사히 공부하겠습니다.”',en:'Looking surprised: “I did not expect you to prioritize my coursework over research. Thank you, I will study diligently.”'}},
  {baseExpression:'focused',responses:{ko:'집중하는 표정으로 눈을 반짝이며 “제가 세운 복습 계획의 빈틈을 찾아서 다음 면담 때 보여드리겠습니다.”',en:'With a focused look and keen eyes: “I will identify gaps in my study plan and show you at our next meeting.”'},curiosity:{expression:'happy',ko:'미소를 지으며 “어려운 개념도 원리부터 파고들어 제 것으로 만들어 볼게요!”',en:'Smiling: “I will dig into difficult concepts from first principles and make them my own!”'}}
 ],
 'counsel-small-question':[
  {baseExpression:'happy',responses:{ko:'미소를 띠며 “사소한 질문이라 망설였는데, 친절하게 짚어 주셔서 의문이 풀렸어요!”',en:'Smiling: “I hesitated over such a trivial question, but your kind explanation cleared it up completely!”'},guarded:{expression:'surprised',ko:'놀란 눈으로 “작은 질문에도 정성껏 답해 주셔서 감사해요. 메모해 두겠습니다.”',en:'With surprised eyes: “Thank you for answering such a small question with such care. I will take notes.”'}},
  {baseExpression:'focused',responses:{ko:'잠시 생각에 잠겼다가 “제가 이해한 바를 소리 내어 설명해 볼게요. 틀린 지점을 바로잡아 주세요.”',en:'Pausing in thought: “Let me explain what I understand aloud. Please point out where I go wrong.”'},close:{expression:'delighted',ko:'활짝 웃으며 “교수님께 제 언어로 설명해 볼 기회가 생겨 신나요!”',en:'Smiling brightly: “I am excited for the chance to explain it to you in my own words!”'}}
 ],
 'counsel-results':[
  {baseExpression:'relieved',responses:{ko:'안도하며 가슴을 쓸어내리고 “혼자 고민할 때는 막막했는데, 원자료부터 함께 짚어 주시니 원인이 보여요.”',en:'Relieved, letting out a breath: “I was lost on my own, but going through the raw data together shows where things diverged.”'},guarded:{expression:'surprised',ko:'조금 놀란 표정으로 “꾸중 대신 원자료부터 차분히 확인해 주셔서 정말 다행입니다.”',en:'Looking slightly surprised: “I am so grateful you reviewed the raw data calmly instead of reprimanding me.”'}},
  {baseExpression:'focused',responses:{ko:'생각에 잠겨 고개를 끄덕이며 “예상과 다른 결과 속에 숨은 새로운 가설을 검증할 작은 계획을 짜 보겠습니다.”',en:'Nodding in deep thought: “I will design a small test to verify the new hypothesis hidden behind this unexpected result.”'},curiosity:{expression:'happy',ko:'눈을 반짝이며 “어쩌면 이 예상 밖의 결과가 새로운 발견의 시작일지도 모르겠어요!”',en:'With sparkling eyes: “Perhaps this unexpected result is the start of a whole new discovery!”'}}
 ],
 'counsel-master-career':[
  {baseExpression:'focused',responses:{ko:'생각에 잠긴 얼굴로 “제가 원하는 삶의 리듬과 연구의 의미를 진지하게 정리해 보겠습니다.”',en:'With a thoughtful expression: “I will earnestly reflect on both the rhythm of life I desire and the meaning of research.”'},close:{expression:'happy',ko:'따뜻한 미소로 “제 삶의 균형까지 함께 고민해 주셔서 늘 큰 힘이 됩니다.”',en:'With a warm smile: “It is always such a strength that you think about my life balance alongside work.”'}},
  {baseExpression:'happy',responses:{ko:'환하게 미소 지으며 “연구실 밖의 가능성도 편견 없이 조언해 주셔서 한결 가벼운 마음으로 탐색해 보겠습니다.”',en:'Smiling brightly: “Thank you for giving unbiased advice on paths beyond the lab; I can explore with a lighter heart.”'},caution:{expression:'focused',ko:'신중한 표정으로 “선배들의 실제 경험담과 현장 요구사항부터 면밀히 조사해 볼게요.”',en:'Looking prudent: “I will closely investigate seniors’ actual experiences and field requirements first.”'}}
 ],
 'counsel-qual':[
  {baseExpression:'relieved',responses:{ko:'안도하는 한숨과 함께 “퀄 시험 범위가 너무 막막했는데, 분량을 나누고 일정을 잡아 주시니 해낼 수 있겠다는 용기가 생겨요.”',en:'With a relieved breath: “The qual syllabus felt overwhelming, but breaking down the milestones gives me courage that I can do this.”'},guarded:{expression:'surprised',ko:'놀란 표정으로 “직접 확인 일정을 챙겨 주시다니… 열심히 준비해서 실망시켜 드리지 않겠습니다.”',en:'With a surprised look: “I am surprised you offered to schedule check-ins yourself... I will prepare hard and not let you down.”'}},
  {baseExpression:'focused',responses:{ko:'진지하게 생각에 잠기며 “단순 암기를 넘어, 핵심 논리를 제 말로 막힘없이 설명할 수 있을 때까지 훈련하겠습니다.”',en:'Reflecting deeply: “Beyond mere memorization, I will train until I can explain the core logic fluently in my own words.”'},diligence:{expression:'happy',ko:'미소를 지으며 “노트 정리를 마치고 제 말로 설명하는 스터디 계획을 바로 시작하겠습니다!”',en:'Smiling: “I will finish my summary notes and immediately start practicing explaining aloud!”'}}
 ],
 'counsel-independent':[
  {baseExpression:'happy',responses:{ko:'환하게 미소 지으며 “제가 가져온 질문의 의미를 알아봐 주셔서 정말 기뻐요! 보완할 점을 꼼꼼히 반영해 보겠습니다.”',en:'Smiling brightly: “I am so happy you recognized the value of my question! I will incorporate your feedback diligently.”'},guarded:{expression:'surprised',ko:'놀란 표정으로 “제 미숙한 제안을 진지하게 검토해 주셔서 가슴이 벅찹니다.”',en:'Looking surprised: “I am overwhelmed that you took my novice proposal so seriously.”'}},
  {baseExpression:'focused',responses:{ko:'깊은 생각에 잠겨 “제 가설의 취약점과 반례부터 빈틈없이 확인한 뒤 본격적인 연구에 착수하겠습니다.”',en:'Lost in deep thought: “I will thoroughly test the vulnerabilities and counterexamples of my hypothesis before diving in.”'},curiosity:{expression:'delighted',ko:'환한 미소를 지으며 “반례를 찾는 과정 자체가 또 하나의 흥미진진한 연구가 될 것 같아요!”',en:'Smiling with delight: “Searching for counterexamples feels like an exciting new inquiry in itself!”'}}
 ],
 'counsel-phd-career':[
  {baseExpression:'focused',responses:{ko:'생각에 잠겨 메모를 적으며 “학계와 산업계의 현실적인 일정표를 나란히 두고, 제 역량과 준비도를 점검하겠습니다.”',en:'Taking notes in deep thought: “I will place the schedules of academia and industry side by side to assess my readiness.”'},close:{expression:'happy',ko:'미소를 지으며 “현실적인 타임라인을 짚어 주셔서 막연했던 졸업 후 그림이 또렷해졌어요.”',en:'Smiling: “Walking through the realistic timelines makes the picture after graduation so much clearer.”'}},
  {baseExpression:'happy',responses:{ko:'따뜻한 미소를 지으며 “스펙보다 제가 어떤 삶을 살고 싶은지 먼저 물어봐 주셔서 큰 위로가 되었습니다.”',en:'With a warm smile: “It was such a comfort that you asked what kind of life I want before looking at credentials.”'},caution:{expression:'focused',ko:'생각에 잠겨 고개를 끄덕이며 “제 가치관과 우선순위를 먼저 분명히 정리해 보겠습니다.”',en:'Nodding in thought: “I will first clarify my core values and personal priorities.”'}}
 ],
 'counsel-feedback':[
  {baseExpression:'relieved',responses:{ko:'안도하는 표정으로 “막연했던 불안감이 사라졌어요. 짚어 주신 보완점 목록을 우선순위대로 하나씩 고치겠습니다.”',en:'With a relieved look: “My vague anxiety is gone. I will tackle the improvement items in order of priority.”'},guarded:{expression:'surprised',ko:'조금 놀란 표정으로 “잘한 점까지 분명히 짚어 주셔서 감사해요. 용기가 납니다.”',en:'Looking a bit surprised: “Thank you for clearly recognizing what went well too. It gives me courage.”'}},
  {baseExpression:'focused',responses:{ko:'생각에 잠겨 자신의 자료를 바라보며 “스스로의 눈으로 부족한 부분을 엄격하고 정직하게 짚어 보겠습니다.”',en:'Gazing at their work thoughtfully: “I will evaluate where my work falls short with my own eyes, strictly and honestly.”'},diligence:{expression:'happy',ko:'미소를 지으며 “자가 진단 체크리스트를 만들어 스스로 검토하는 힘을 기르겠습니다!”',en:'Smiling: “I will make a self-assessment checklist and build the habit of independent review!”'}}
 ]
};

/**
 * Returns dynamic facial expression and nuanced response dialogue tailored to student temperament and rapport.
 */
export function counselingReaction(s, eventId, choice, locale='ko'){
 const item=REACTIONS[eventId]?.[choice];
 const h=s?.hidden??{},t=s?.temperament??{},rapport=h.rapport??0;
 const lang=locale==='en'?'en':'ko';
 if(!item){
  const exp=choice===0?(rapport<10?'surprised':h.stress>=60?'relieved':'happy'):(t.caution>=65?'focused':t.curiosity>=65?'happy':'focused');
  const resp=choice===0?
   (lang==='ko'?'안도하는 표정으로 “말씀해 주신 내용을 바탕으로 마음을 가다듬고 정리해 보겠습니다.”':'Looking relieved: “I will organize my thoughts based on what you shared.”'):
   (lang==='ko'?'생각에 잠긴 표정으로 “제가 챙겨야 할 부분을 꼼꼼하게 검토하여 다음 면담에 가져오겠습니다.”':'Looking thoughtful: “I will carefully review what needs checking and bring it to our next meeting.”');
  return {expression:exp,response:resp};
 }
 if(rapport<10&&item.guarded)return {expression:item.guarded.expression??'surprised',response:item.guarded[lang]??item.responses[lang]};
 if(rapport>=40&&item.close)return {expression:item.close.expression??'happy',response:item.close[lang]??item.responses[lang]};
 if(t.caution>=65&&item.caution)return {expression:item.caution.expression??'focused',response:item.caution[lang]??item.responses[lang]};
 if(t.curiosity>=65&&item.curiosity)return {expression:item.curiosity.expression??'happy',response:item.curiosity[lang]??item.responses[lang]};
 if((h.diligence>=65||t.diligence>=65)&&item.diligence)return {expression:item.diligence.expression??'focused',response:item.diligence[lang]??item.responses[lang]};
 return {expression:item.baseExpression??'neutral',response:item.responses[lang]};
}
