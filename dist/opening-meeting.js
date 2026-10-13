// A first conversation asks for the student's view, rather than inferring a
// personality or assessment from their name, appearance or background.
export function openingMeeting(name,locale='ko'){
 const studentName=String(name??'').trim()||(locale==='en'?'Student':'학생');
 return Object.freeze(locale==='en'?{
  heading:'Our first conversation',
  professorLine:`What do you think, ${studentName}?`,
  studentLine:'I would like to start with a small question of my own. Could we work out what I need to learn first?',
  body:'Make room for the student’s questions, then agree on one manageable next step.'
 }:{
  heading:'우리의 첫 면담',
  professorLine:`${studentName} 학생은 어떻게 생각해요?`,
  studentLine:'제가 궁금한 작은 질문부터 시작해 보고 싶어요. 먼저 무엇을 배워야 할지 함께 정리할 수 있을까요?',
  body:'학생의 질문을 듣고, 함께 시도할 작은 다음 단계를 정합니다.'
 });
}
export const renderOpeningMeeting=openingMeeting;
