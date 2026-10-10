// Fictional work several years after graduation, selected without consuming RNG.
// These passages describe roles, not eligibility rules or a ranking of careers.
import {HIDDEN_RANGES} from './engine.js';
import {withParticle} from './korean.js';
const p=(ko,en)=>({ko,en});

const CAREERS={
 postdoc:{
  title:p('이름은 저널에, 소속은 포닥에','A name in the journal, a postdoctoral affiliation'),
  career:p('박사후연구원 · 공동연구를 이어 가는 자리','Postdoctoral researcher · continuing a collaboration'),
 },
 fellowship:{
  title:p('다음 질문을 위한 연구비','Funding for the next question'),
  career:p('박사후연구원 · 개인 연구과제 선정','Postdoctoral researcher · an awarded research project'),
 },
 research_professor:{
  title:p('연구교수의 새 명패','A research professor’s new nameplate'),
  career:p('연구교수 · 연구와 세미나를 맡은 자리','Research Professor · research and seminars'),
 },
 group_leader:{
  title:p('자신의 질문으로 꾸린 연구팀','A team built around their own question'),
  career:p('Junior Research Group Leader · 독립 연구팀 책임자','Junior Research Group Leader · an independent research team'),
 },
};

export function postdocCareer(context={},fallback='postdoc'){
 const student=context?.statistics?.student;
 const copy=id=>({id,title:{...CAREERS[id].title},career:{...CAREERS[id].career}});
 if(!student)return copy(fallback);
 const score=key=>{const [lo,hi]=HIDDEN_RANGES[key];return Number.isFinite(student[key])?(student[key]-lo)*100/(hi-lo):0;};
 const research=score('research'),learning=score('learning'),autonomy=score('autonomy'),teaching=score('teaching'),language=score('language'),social=score('social');
 const curiosity=context.statistics.temperament?.curiosity??50;
 const candidates=[];
 if(autonomy>=75&&research>=72&&language>=60&&social>=55)candidates.push(['group_leader',autonomy+research*.5+language*.2]);
 if(teaching>=70&&learning>=60&&research>=60)candidates.push(['research_professor',teaching+learning*.5+research*.2]);
 if(research>=65&&learning>=65&&autonomy>=55)candidates.push(['fellowship',research+learning*.5+curiosity*.2]);
 candidates.sort((a,b)=>b[1]-a[1]);
 const id=candidates[0]?.[0]??'postdoc';
 return copy(id);
}

export function postdocScenes(story,context={},setting={task:'연구 자료와 검증 절차'},enSetting={task:'research evidence and verification procedures'}){
 const role=postdocCareer(context),pages=story.pages.map(page=>({...page}));
 const task=withParticle(setting.task,'을/를');
 const enTask=enSetting.task;
 if(role.id==='fellowship'){
  pages[1]=p('이번 호 표지 논문의 제1저자는 {name} 박사였다.\n\n소속란에는 해외 연구소와 Postdoctoral Researcher가 적혀 있었다. 교신저자는 함께 연구한 PI였다. 연구비 감사 문구에는 {name} 박사가 선정받은 개인 연구과제도 적혀 있었다.','Dr. {name} was first author of the cover paper. The affiliation read Postdoctoral Researcher, and the corresponding author was the collaborating PI. The funding acknowledgments also named the personal research award received by Dr. {name}.');
  pages[5]=p(`이번 국내 전임교원 지원에서는 좋은 소식을 전해 드리지 못하게 되었습니다.\n\n다만 제 이름으로 낸 연구계획서는 지원과제에 선정되었습니다. 이곳에서 ${task} 검토하는 후속 연구를 시작합니다. 지원 범위와 계약 기간을 확인했고, 공동기기를 사용하는 비용도 계획서에 따로 적었습니다.`,`This application for a faculty position at home was unsuccessful. Separately, the research proposal I submitted received funding. I am starting follow-up work on ${enTask}, after checking the award’s scope, contract period and shared-facility costs.`);
 }
 if(role.id==='research_professor'){
  pages[1]=p('이번 호 표지 논문의 공동교신저자 중 한 명은 {name} 박사였다.\n\n해외 대학의 연구소 소속과 Research Professor라는 직함이 적혀 있었다. 연구소 프로젝트를 수행하는 연구직이었다.','Dr. {name} was one of the corresponding authors of the cover paper. The affiliation was a university research institute overseas, with the title Research Professor: a research position carrying out institute projects.');
  pages[5]=p(`이번 국내 전임교원 지원에서는 좋은 소식을 전해 드리지 못하게 되었습니다.\n\n이곳 연구소에서는 기간을 정해 연구교수로 일하게 되었습니다. ${task} 검토하는 과제와 대학원 세미나를 맡았습니다. 연구 일정과 계약 갱신 조건을 함께 확인하며 다음 해의 계획을 세우고 있습니다.`,`This application for a faculty position at home was unsuccessful. I have taken a fixed-term Research Professor position here, working on ${enTask} and leading a graduate seminar. I am planning next year’s work after reviewing the research schedule and contract renewal terms.`);
 }
 if(role.id==='group_leader'){
  pages[1]=p('이번 호 표지 논문의 공동교신저자 중 한 명은 {name} 박사였다.\n\n해외 연구소 소속 옆에 Junior Research Group Leader가 적혀 있었다. 자기 연구 주제로 꾸린 작은 팀의 책임자가 되어 있었다.','Dr. {name} was one of the corresponding authors of the cover paper. The overseas institute listed their title as Junior Research Group Leader. They now led a small team built around their own research question.');
  pages[5]=p(`이번 국내 전임교원 지원에서는 좋은 소식을 전해 드리지 못하게 되었습니다.\n\n이곳에서 Junior Research Group Leader를 맡았습니다. ${task} 검토할 작은 팀을 꾸렸고, 연구비와 역할을 나누는 일도 시작했습니다. 기간을 정해 지원받는 자리라 다음 단계의 계획도 함께 세우고 있습니다.`,`This application for a faculty position at home was unsuccessful. Here, I have become a Junior Research Group Leader, building a small team to work on ${enTask}. Alongside the research, I am planning the budget, agreeing on responsibilities and preparing for what follows this fixed-term position.`);
 }
 if(role.id!=='postdoc'){
  pages[2]=p('좋은 저널이다. 우리 연구실에서는 아직 가보지 못한 곳이다.\n\n작년 이맘때 국내 전임교원에 지원했다는 이야기를 들었다. 결과는 몇 달 전 메일로 들었다. 지금의 소속과 연구비 감사 문구를 읽으며, 그 이후에도 이어 온 일을 생각했다.','An excellent journal. Last year, the student had applied for a faculty position at home. I heard the result in an email a few months earlier. Reading the current affiliation and funding acknowledgments, I thought of the work that had continued since then.');
  pages[10]=p('발표는 훌륭했다. 질의응답에서 누군가 물었다. “국내에서는 함께 연구할 계획이 있나요?”\n\n“지금 하는 연구를 이어 갈 공동연구를 찾고 있습니다.”\n\n교수는 지원 일정만이 아니라, 지금의 연구에 필요한 것도 먼저 물어보기로 했다.','The presentation was excellent. Someone asked about collaborating with researchers at home. I am looking for collaborations that can continue this work, came the reply. I decided to ask what the current research needed, as well as about application schedules.');
 }
 return {...story,title:role.title,career:role.career,pages,postdocRole:role.id};
}

export function postdocLetter(context={},locale='ko',setting={task:'연구 자료와 검증 절차'}){
 const {id}=postdocCareer(context,'group_leader');
 const task=withParticle(setting.task,'을/를'),enTask=setting.task;
 const openings={
  group_leader:p(`Junior Research Group Leader를 맡다 보니, ${task} 검토하는 일뿐 아니라 팀의 연구비와 공동연구 일정, 역할을 조율하는 일도 배우고 있습니다.`,`As a Junior Research Group Leader, I am learning to plan our budget and coordinate responsibilities and collaborations, as well as work on ${enTask}.`),
  fellowship:p(`제 이름으로 낸 연구계획서가 지원과제에 선정되었습니다. ${task} 검토할 연구비가 생겼고, 계획서의 약속과 실제 진도를 함께 살피고 있습니다.`,`The research proposal I submitted received funding. I can pursue ${enTask}, while learning to compare the commitments in my proposal with the work as it develops.`),
  research_professor:p(`이곳 연구소에서 연구교수로 일하게 되었습니다. ${task} 검토하는 과제와 세미나를 맡으며, 연구를 설명하고 동료들의 질문을 듣는 일도 배우고 있습니다.`,`I have started work as a Research Professor at this institute. Alongside a project on ${enTask}, I lead a seminar and am learning to explain the work and listen to colleagues’ questions.`),
  postdoc:p(`박사후연구를 이어 가며 ${task} 검토하고 있습니다. 공동연구 회의에서는 제 질문과 필요한 자료를 먼저 정리해 가져가는 습관이 생겼습니다.`,`I am continuing my postdoctoral work on ${enTask}. Before collaboration meetings, I now set out my questions and the evidence I need.`),
 };
 return openings[id][locale]+p('\n\n아직 전임교원 지원 결과는 모르지만, 교수님께 좋은 소식을 전해 드리고 싶어서 제 자리에서 할 일을 이어 가고 있습니다. 좋은 소식은 꼭 직접 들고 찾아뵙겠습니다.\n\n건강하세요.\n― {name} 올림','\n\nI do not know the result of my faculty application yet. I am continuing my work and hope to bring you good news in person. Please take care.\n— {name}')[locale];
}
