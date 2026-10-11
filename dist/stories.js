import {POSTDOC_STORY,OUTSIDE_SCENES,VIDEO_SCENES} from './ending-scenarios.js';
import {endingVoiceCandidates,VOICE_PASSAGE_IDS,letterClosing} from './ending-voice.js';
import {adaptResearchText,researchSetting,englishResearchSetting} from './ending-context.js';
import {formatStudentName} from './korean.js';
import {postdocScenes,postdocLetter} from './postdoc-career.js';
// Original epilogues. The professor/corporate letters adapt Gahyoun Gim's supplied story.
const p=(ko,en)=>({ko,en});
export const ENDINGS={
  dismissed:{type:'ENDING',title:p('과정을 마무리하는 날','Closing this chapter'),career:p('자격시험 재응시 미통과 · 제적','Program dismissal after qualification retake'),time:p('학적 정리 후 · 다음 계획을 위한 면담','A meeting about the next chapter'),pages:[p('자격시험에서 한 차례 불합격한 뒤, 재응시 준비 기간이 주어졌다. 재응시에서도 요구되는 학습 기준을 충족하지 못해 학적을 정리하게 되었다.','After a failed qualification exam, there was time to prepare for a retake. The retake requirements were not met.'),p('{name}은 연구 노트와 개인 물품을 정리했다. 교수는 시험 결과와 행정 절차를 설명하고, 다음 계획을 묻기 전에 학생의 말을 들었다.','{name} packed personal belongings and research notes. The advisor explained the academic process and listened.'),p('이 기록은 한 과정이 끝난 이유를 남긴다. 앞으로 어떤 일을 할지는 아직 정해지지 않았다. 더 공부할지, 다른 분야에서 일할지, 시간을 두고 결정하기로 했다.','This record explains why the program ended. The next path will be chosen in time.')]},
  postdoc:POSTDOC_STORY,
  resident_researcher:{type:'EPILOGUE',title:p('같은 연구실, 다른 자리','The same lab, a different desk'),career:p('교내 연구원','University research staff'),time:p('졸업 2년 후 · 같은 건물에서 온 메일','Two years after graduation · an email from the same building'),pages:[
    p("학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n학생은 학위를 받은 뒤 우리 연구실의 연구원이 되었다. 함께 일하던 책상에는 새 명패가 놓였다.\n\n업무와 생활의 조건을 살펴본 끝에 정한 자리였다. 연구를 이어 가는 방법은 하나만 있는 것이 아니었다.","Eight years passed, and then a few more.\n\nAfter earning the degree, my former student joined our lab as a researcher. A new nameplate stood on the familiar desk.\n\nThey had considered the work and their life before choosing this position. There was more than one way to continue research."),
    p("교수님께.\n\n다음 공동연구 회의는 제가 맡아 진행하겠습니다. 새로 합류한 연구원과 업무도 나누어 보았습니다.\n\n이곳에서 이어 보고 싶은 연구가 있습니다. 제 역할과 일정을 정기적으로 의논하면서 차근차근 해 나가고 싶습니다. 서로의 의견을 편하게 묻고 나눌 수 있으면 좋겠습니다.\n― {name} 드림","Dear Professor,\n\nI will lead the next collaboration meeting. I have also discussed responsibilities with the new researcher.\n\nThere is work I would like to continue here. I would like us to review my role and schedule regularly as I develop it. I hope we can ask questions and exchange our views openly.\n— {name}"),
    p("메일을 읽고 회의 초대를 열었다. 발표자 칸에 {name}의 이름이 적혀 있었다.\n\n나는 연구 일정과 역할을 함께 의논할 시간을 잡았다. 가까이 일한다는 이유로 상대의 결정을 대신할 필요는 없었다.\n\n이제 같은 연구실에서 서로 다른 역할로 함께 일하는 동료였다.","I read the email and opened the meeting invitation. {name} was listed as the presenter.\n\nI made time to discuss the schedule and responsibilities together. Working nearby did not mean making decisions for someone else.\n\nWe were now colleagues with different roles in the same lab.")
  ]},
  leave:{type:'EPILOGUE',title:p('잠시 비워 둔 자리','A desk left empty for now'),career:p('휴학 · 회복을 위한 중단','Leave of absence'),time:p('휴학 3개월 후 · 안부 메일','Three months into leave · an email'),pages:[
    p('여덟 해를 모두 지나기 전에, 학생은 휴학원을 냈다.\n\n돌아오는 날짜를 먼저 묻고 싶었지만, 그 질문은 적지 않았다. 실험 파일의 백업부터 함께 확인했다.','Before we reached eight years, my student applied for leave.\n\nI wanted to ask when they would return, but left the question unwritten. We checked the research backups together.'),
    p('교수님께.\n\n처음에는 쉬는 중에도 메일함을 계속 열었습니다. 요즘은 저녁을 먹고 산책을 합니다. 결과가 없는 하루도 하루라는 걸 조금씩 배우고 있습니다.\n\n돌아갈지는 아직 정하지 못했습니다. 정하게 되면 먼저 말씀드리겠습니다.\n― {name} 드림','Dear Professor,\n\nAt first, I kept opening my inbox even while on leave. These days, I eat dinner and go for a walk. I am learning that a day without results is still a day.\n\nI have not decided whether to return. When I do, I will let you know.\n— {name}'),
    p('나는 면담 일정의 빈칸을 그대로 두었다.\n\n이번에는 그 빈칸을 다른 일로 채우지 않았다. 학생의 다음 선택을 기다리는 자리로 남겨 두기로 했다.','I left the meeting slot empty.\n\nThis time, I did not fill it with another task. It could remain a place for the student’s next decision.')
  ]},
  true:{type:'EPILOGUE',title:p('다시 만난 두 교수','Two professors, together again'),career:p('대학교 교수','University professor'),time:p('졸업 6년 후 · 국제학회','Six years after graduation · an international conference'),pages:[
    p("학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n박사후연구와 여러 번의 지원을 지나, 학회 초청 연사 명단에 낯익은 이름이 있었다. 이름 아래에는 새 대학과 교수 직함이 적혀 있었다.\n\n임용 소식은 이미 들었지만, 프로그램에 인쇄된 그 이름은 달랐다. 나는 그 이름을 한 번 더 읽었다.","Eight years passed, then a few more. After postdoctoral research and several applications, a familiar name appeared among the invited speakers, with a new university and a faculty title. I already knew about the appointment, but seeing it in print felt different. I read the name again.")
,    p("나는 서랍에 보관한 손편지 한 통을 떠올렸다.\n\n임용 결과를 기다리던 포닥 시절, 바다 건너 국제우편으로 온 편지였다. 봉투에는 소인이 두 번 찍혀 있었다.","I remembered a handwritten letter in my drawer. It had arrived by international post during the postdoctoral years, before the appointment decision. The envelope bore two postmarks.")
,    p("지도교수님께.\n\n추천서를 흔쾌히 써 주셔서 정말 감사합니다. 마감 사흘 전에 부탁드렸는데도 다음 날 바로 보내주셨다고 들었습니다. 지원 결과를 기다리는 동안에도 큰 힘이 됩니다.\n\n이곳의 장비로 연구를 이어 가다 보면, 가끔은 우리 연구실의 오래된 기계가 생각납니다. 계절별로 기사님을 불러야 하던 그 기계요.","Dear Professor, thank you for writing the recommendation so willingly. I asked three days before the deadline and heard you sent it the next day. It is a source of support while I await the result. Working overseas, I sometimes think of our old machine, the one that needed a technician every season.")
,    p("Junior Research Group Leader를 맡다 보니 공동연구 일정과 역할을 조율하는 일도 배우고 있습니다.\n\n아직 전임교원 지원 결과는 모르지만, 교수님께 좋은 소식을 전해 드리고 싶어서 제 자리에서 할 일을 이어 가고 있습니다. 좋은 소식은 꼭 직접 들고 찾아뵙겠습니다.\n\n건강하세요.\n― {name} 올림","As a Junior Research Group Leader, I am learning to coordinate our collaboration as well as do research. I do not know the faculty application result yet. I am continuing my work and hope to bring you good news in person. Please take care. — {name}")
,    p("사흘 전이 아니라 이틀 전이었다.\n\n부탁을 받은 다음 날 밤, 추천서를 세 번 고쳐 썼다. 너무 칭찬하면 안 믿을 것 같았고, 덜 쓰면 억울할 것 같았다.\n\n결국 마지막 문장은 이렇게 썼다.\n\n“제가 본 젊은 연구자 중 가장 끝까지 해내는 사람입니다.”\n\n그 밤에 발송했다. 녀석은 세 번 고쳐 쓴 것까지는 모를 것이다.","It was two days before the deadline, not three. The night after the request, I rewrote the recommendation three times. Too much praise might sound implausible; too little would be unfair. The final line read: Of the young researchers I have known, this is the one who sees things through. I sent it that night. The student would not know about the three revisions.")
,    p("합격 소식은 지난봄, 짧은 전화로 먼저 들었다.\n\n“교수님, 됐습니다.”\n\n그 한마디 뒤에 녀석은 덧붙였다.\n\n“자세한 건 직접 뵙고 말씀드릴게요.”\n\n그게 오늘이다.","I first heard the news in a brief call last spring. Professor, I got the position. Then came a promise: I will tell you the rest when we meet. That day is today.")
,    p("강연의 마지막 슬라이드가 화면에 떠올랐다.\nAcknowledgements.\n\n공동연구자와 연구비 목록 위에 나의 이름과 옛 연구실 사진이 있었다. 객석 몇 명이 뒤를 돌아보았다. 나는 괜히 안경을 고쳐 썼다.\n\n“좋은 소식은 직접 들고 찾아뵙겠습니다.”\n\n그 말을 이렇게 지킬 줄은 몰랐다.","The final slide appeared on the screen. Acknowledgements. Above the collaborators and grants were my name and a photograph of our old lab. A few people turned around. I adjusted my glasses. I had not imagined this was how the promise would be kept.")
,    p("발표 시간이 끝나감을 알리는 종소리가 울렸다. {name} 교수는 마지막 말을 덧붙였다.\n\n“무엇보다도, 학위 기간 동안 저를 지도해 주신 교수님께 감사의 말씀 전합니다.”\n\n박수가 이어졌다. 앞이 조금씩 흐려졌다. 안경 탓이라고 해 두자.","The bell marked the end of the talk. Professor {name} closed by thanking the professor who guided them throughout the degree. Applause followed. My vision grew hazier. Let us blame the glasses.")
,    p("세션이 끝나고 {name} 교수는 곧장 나에게 걸어왔다.\n\n“교수님, 약속대로 직접 인사드리러 왔습니다.”\n\n임용 뒤 처음 마주 보고 나눈 인사였다. 젊은 교수는 손을 내밀었다. 졸업식 날보다 조금 길고, 조금 더 단단한 악수였다.","After the session, Professor {name} walked over. I came to greet you in person, as promised. It was our first meeting since the appointment. The handshake lasted longer and felt firmer than on graduation day.")
,    p("그날 저녁, 두 사람은 학회장 근처 카페에서 커피를 마셨다.\n\n한 잔으로는 끝나지 않았다.\n\n이야기는 오래된 기계에서 시작해 {name} 교수의 대학원생 이야기로 이어졌다.\n\n나는 이제 조언을 건네기 전에, 먼저 물었다.\n\n“{name} 교수는 어떻게 생각해요?”","That evening, one coffee was not enough. We talked about the old machine and Professor {name}’s graduate students. Before offering advice, I asked first.\n\n“Professor {name}, what do you think?”")
  ]},
  corporate:{type:'EPILOGUE',title:p('딱 알맞은 거리','Just the right distance'),career:p('기업 취업 · 전공 관련 분야','Company employment · a related field'),time:p('졸업 6개월 후 · 회사에서 온 메일','Six months after graduation · an email from work'),pages:[
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n두 사람이 다시 만난 것은 어느 학회에서였다.\n\n이 이야기는 졸업하고 반년 뒤, 교수의 메일함에 도착한 안부에서 시작된다. 보낸 사람 칸에는 낯익은 이름과 낯선 회사 메일 주소가 적혀 있었다.','An undergraduate researcher, then a graduate student. Eight years had passed. And then, a few more.\n\nWe met again at a conference.\n\nThe story begins six months after graduation, with an email in my inbox. A familiar name, an unfamiliar company email address.'),
    p('“이렇게 길게 쓰다니.”\n\n메일에 들인 정성이 눈에 들어왔다. 실험 노트도 그랬다. 남들은 비워둘 칸까지 빼곡히 채워서, 검토하는 데만 한나절이 걸렸다.','“They wrote at length.”\n\nI noticed the care that had gone into the email. The notebooks were like that too: filling every space others would leave blank. It took half a day just to review them.'),
    p('교수님께.\n\n회사에 오니 실험 계획서 1장에 결재가 3번 필요합니다. 연구실에서는 교수님 ‘응’ 한마디면 됐는데요. 그게 얼마나 자유로운 일이었는지 이제야 알게 됐습니다.\n\n돌아가고 싶다는 뜻은 아닙니다.\n\n냉동고 맨 아래 칸 샘플은 라벨을 다 붙여 두었습니다. 버리기 전에 한 번만 확인해 주세요. 제 졸업 논문의 마지막 데이터가 거기서 나왔습니다.','Dear Professor,\n\nAt work, a one-page experiment plan needs three approvals. In the lab, your “sure” was enough. Only now do I realize how much freedom that was.\n\nThat does not mean I want to come back.\n\nI labeled all the samples in the bottom freezer drawer. Please check them once before throwing anything away. The last data in my dissertation came from there.'),
    p('그 데이터 이야기는 굳이 안 써도 됐을 텐데.\n\n그 ‘응’이 어떤 날은 허락이었고, 어떤 날은 바쁜 중의 짧은 대답이었다는 것을 학생도 알 것이다. 서로 모른 척했을 뿐이다.\n\n그 데이터가 나온 날을 기억한다. 일요일 밤이었다. 주차장에서 연구실 창문에 불이 켜진 걸 보고, 올라가지 않고 그냥 돌아섰다. 다음 날 학생은 정리한 그래프를 보여 주었다.','They did not need to mention that data.\n\nThey must have known that “sure” sometimes meant permission, sometimes a brief answer on a busy day. We simply pretended not to notice.\n\nI remembered the night that data appeared. A Sunday. Seeing the lab light from the parking lot, I had turned away without going upstairs. The next morning, they handed me a graph without a word.'),
    p('학회에서 뵙게 되면 커피 한 잔 정도는 사겠습니다. 그 이상은 아직 어색하니까요.\n\n추신. 교수님 논문 인용은 계속하겠습니다. 사이와는 별개로, 좋은 논문이라서요.\n― {name} 올림\n\n사이와는 별개로, 라. 자기 생각을 분명하게 전하는 문장이었다. 함께한 여덟 해에도 그런 순간들이 있었다.\n\n함께한 연구와 지금의 연락 방식을 따로 생각해 보았다.','If we meet at a conference, I will buy you a coffee. One cup. More than that would still be awkward.\n\nP.S. I will keep citing your papers. Whatever our relationship, they are good papers.\n— {name}\n\n“Whatever our relationship.” They were expressing their own view clearly. There had been moments like that throughout our eight years together.\n\nI thought about the work we had shared and the boundaries we now respected.'),
    p('나는 메일을 두 번 읽고 보관함에 넣었다. 그리고 냉동고 맨 아래 칸을 열어, 라벨이 붙은 튜브들을 오래 바라보았다.\n\n그날 연구실 불은 평소보다 조금 늦게 꺼졌다.\n\n3년 뒤의 학회. 커피는 정말로 한 잔뿐이었다.\n\n그것이 이 사제에게는 딱 알맞은 거리였다.','I read the email twice and archived it. Then I opened the bottom freezer drawer and looked at the labeled tubes for a long time.\n\nThat night, the lab light stayed on a little later than usual.\n\nThree years later, at the conference, there really was only one cup of coffee.\n\nFor the two of us, that was just the right distance.')
  ]},
  institute:{type:'EPILOGUE',title:p('다음 실험의 공동연구자','A collaborator on the next experiment'),career:p('정부출연연구기관 연구원','Researcher at a public research institute'),time:p('졸업 3년 후 · 공동연구 제안 메일','Three years later · a collaboration email'),pages:[
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n월요일 아침, 정부출연연구기관 주소에서 메일 한 통이 도착했다. 제목은 단정했다.\n\n[공동연구 제안] 후속 실험에 관하여','An undergraduate researcher, then a graduate student. Eight years had passed. And then, a few more.\n\nOn a Monday morning, an email arrived from a public research institute. The subject was precise.\n\n[Collaboration proposal] Regarding a follow-up experiment'),
    p('교수님께.\n\n여기 장비로 그때 못 했던 실험을 해 보았습니다. 학위논문 마지막 장에 ‘향후 과제’로 적어 두었던 그 일입니다.\n\n결과가 생각과 조금 다릅니다. 그래서 더 재미있습니다. 학생 때였다면 먼저 걱정했을 텐데, 이제는 어떤 질문을 해야 할지부터 생각합니다.\n\n함께 해 주시겠습니까?\n― {name} 드림','Dear Professor,\n\nI used our equipment to run the experiment we could not finish back then. It is the work I listed as “future work” in the last chapter of my dissertation.\n\nThe result is a little different from what we expected. That makes it more interesting. As a student, I would have worried first. Now I start by asking what question comes next.\n\nWould you like to work on it together?\n— {name}'),
    p('첨부된 그래프를 열었다. 축 이름도, 오차막대도 빠짐이 없었다. 빨간 펜을 찾다가 멈췄다.\n\n이제 내게 검토를 받으려고 보낸 것이 아니다.\n\n함께 해 달라는 것이다.','I opened the attached plot. Every axis labeled, every error bar in place. I reached for the red pen, then stopped.\n\nThey had not sent it to be checked.\n\nThey were asking me to join them.'),
    p('답장을 썼다.\n\n“좋습니다. 다음 주에 만나서 이야기합시다.”\n\n잠시 생각하다 한 문장을 더 적었다.\n\n“이번에는 제가 그쪽 연구실로 가겠습니다.”','I wrote back.\n\n“Sounds good. Let us meet next week.”\n\nAfter a moment, I added one more sentence.\n\n“This time, I will come to your lab.”')
  ]},
  unrelated:{type:'EPILOGUE',title:p('다른 종류의 질문','A different kind of question'),career:p('기업 취업 · 새로운 분야','Company employment · a new field'),time:p('졸업 2년 후 · 새 직장에서 온 메일','Two years later · an email from a new workplace'),pages:[
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n수업 준비를 하던 오후, 전공과는 아무 관련 없는 회사에서 메일이 왔다. 보낸 사람은 {name}이었다.','An undergraduate researcher, then a graduate student. Eight years had passed. And then, a few more.\n\nOne afternoon, while preparing a lecture, I received an email from a company with nothing to do with our field. It was from {name}.'),
    p('교수님께.\n\n요즘은 다른 업종의 회사에서 고객 데이터를 보고 있습니다.\n\n관찰하고, 가설을 세우고, 틀렸다는 걸 받아들이는 일. 연구실에서 배운 걸 여기서도 쓰고 있습니다.\n\n일하는 일정과 의논하는 방식은 달라졌습니다. 새로운 동료들과 필요한 기준을 함께 배우고 있습니다.\n― {name} 올림','Dear Professor,\n\nThese days I work with customer data at a company in a different industry.\n\nObserve. Form a hypothesis. Accept being wrong. I use what I learned in the lab here too.\n\nThe schedules and ways of discussing work have changed. I am learning the necessary standards with new colleagues.\n— {name}'),
    p('나는 메일을 두 번 읽었다. 새로운 분야의 질문을 자기 방식으로 풀어 가고 있었다.\n\n서랍에서 예전 실험 노트를 찾았다. 첫 장에는 같은 이름이, 조금 더 삐뚤게 쓰여 있었다.','I read the email twice. They were finding their own way to work on a different set of questions.\n\nI found an old notebook in the drawer. On its first page was the same name, in a less steady hand.'),
    p('답장은 짧게 썼다.\n\n“그곳의 질문도 잘 풀어 보세요. 근처에 오면 커피나 합시다.”\n\n그리고 다음 소식을 정해진 때에 보내 달라고 요구하지는 않았다.','The reply was short.\n\n“Keep working on the questions there. If you are nearby, let us have coffee.”\n\nI did not ask for another update on a fixed schedule.')
  ]},
  startup:{type:'EPILOGUE',title:p('실험실 밖의 첫 실험','The first experiment outside the lab'),career:p('스타트업 창업자','Startup founder'),time:p('졸업 2년 후 · 투자설명회 초대장','Two years later · an invitation to a pitch'),pages:[
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n연구실 우편함에 작은 초대장이 들어 있었다. 대표이사 {name}.\n\n명함에 적힌 이름만 낯익고, 나머지는 모두 새로운 것이었다.','An undergraduate researcher, then a graduate student. Eight years had passed. And then, a few more.\n\nA small invitation arrived in the lab mailbox. Founder and CEO: {name}.\n\nOnly the name on the business card was familiar. Everything else was new.'),
    p('교수님께.\n\n논문에서는 “가능성을 보였다”고 쓰면 됐는데, 여기서는 누군가 실제로 돈을 내야 합니다.\n\n첫 제품은 실패했습니다. 두 번째는 조금 덜 실패했고요. 실험 노트는 여전히 씁니다. 이제는 고객 인터뷰가 들어갈 뿐입니다.\n\n다음 주 발표에 와 주실 수 있을까요? 제품과 연구의 다음 계획에 대해 의견을 듣고 싶습니다.\n― {name} 드림','Dear Professor,\n\nIn a paper, I could write “we demonstrated the potential.” Here, someone actually has to pay.\n\nThe first product failed. The second failed a little less. I still keep an experiment notebook. It just has customer interviews now.\n\nCould you come to our pitch next week? I would like your thoughts on the next plans for the product and our research.\n— {name}'),
    p('발표자료 마지막에는 연구실 사진이 있었다. 투자를 받았는지는 아직 모른다. 성공이라 말하기에도 이르다.\n\n하지만 예전에는 내 뒤에 서 있던 학생이, 이제는 자기 팀 앞에 서 있었다.','The final slide had a photograph of our lab. I did not yet know whether they would get funding. It was too early to call this success.\n\nBut the student who once stood behind me was now standing in front of a team of their own.'),
    p('질문 시간이 되자 손을 들었다.\n\n“다음 실험은 무엇입니까?”\n\n{name}은 조금 웃고, 기다렸다는 듯 대답을 시작했다.\n\n나는 끝까지 들었다.','When it was time for questions, I raised my hand.\n\n“What is your next experiment?”\n\n{name} smiled a little and began answering, as if waiting for that question.\n\nI listened to the end.')
  ]},
  unemployed:{type:'EPILOGUE',title:p('아직 쓰지 않은 다음 장','The next chapter, still unwritten'),career:p('구직 중 · 다음 일을 준비하는 시간','Seeking work · preparing the next chapter'),time:p('졸업 1년 후 · 늦은 밤의 메일','One year later · a late-night email'),pages:[
    p("학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 시간이 지났다.\n\n어느 저녁, {name}에게서 메일이 왔다. 졸업 뒤의 생활과 다음 일을 찾는 이야기가 담겨 있었다.","An undergraduate researcher, then a graduate student. Eight years passed, followed by more time.\n\nOne evening, an email arrived from {name}. It described life after graduation and the search for the next position."),
    p("교수님께.\n\n아직 일자리를 찾고 있습니다. 채용 일정이 바뀌기도 하고, 제가 원하는 일의 조건도 다시 생각하게 됩니다. 지원서를 쓰는 한편 일상을 돌볼 시간도 챙기고 있습니다.\n\n제가 해 온 연구와 앞으로 해 보고 싶은 일을 함께 정리해 볼 수 있을까요? 교수님 일정이 괜찮다면 면담을 부탁드리고 싶습니다.\n― {name} 드림","Dear Professor,\n\nI am still looking for work. Recruitment schedules sometimes change, and I am reconsidering what I want from a position. Alongside applications, I am making time for everyday life.\n\nCould we review the research I have done and the work I would like to try? If your schedule allows, I would appreciate a meeting.\n— {name}"),
    p("나는 메일을 천천히 읽었다. 채용 결과만으로 이 사람이 보낸 시간이나 해 온 일을 설명할 수는 없었다.\n\n먼저 어떤 도움이 필요한지 물어보기로 했다. 연구 기록을 함께 정리하거나, 원한다면 지원에 필요한 추천서를 준비할 수도 있었다.","I read the email carefully. A recruitment outcome could not describe the time this person had spent or the work they had done.\n\nI would first ask what support would help. We could review their research record or, if they wished, prepare a recommendation for an application."),
    p("“목요일 오후에 만날 수 있습니다. 지금 가장 의논하고 싶은 것부터 이야기합시다.”\n\n답장을 보내고 면담 시간을 적었다.\n\n면담은 지금의 생활과 원하는 지원에 대한 이야기로 시작하기로 했다. 다음 일을 찾는 동안에도, 우리는 안부를 나눌 수 있었다.","“I am available on Thursday afternoon. Let us start with what you most want to discuss.”\n\nI sent the reply and added the meeting to my calendar.\n\nWe would start the meeting with their everyday life and the support they wanted. We could keep in touch while they searched for their next position.")
  ]},
  youtuber:{type:'EPILOGUE',title:p('구독자 수가 피인용 수를 넘었다','Subscribers outnumbered citations'),career:p('과학 유튜버','Science YouTuber'),time:p('졸업 후 · 영상 링크와 출연 요청 메일','After graduation · videos and an invitation'),pages:VIDEO_SCENES},
  bachelor:{type:'EPILOGUE',title:p('두 번의 봄, 그리고 졸업','Two springs, then graduation'),career:p('학사 졸업 · 다음 진로 선택','Bachelor’s graduation · choosing the next path'),time:p('학사 졸업 1년 후 · 안부 메일','One year after the bachelor’s degree · a check-in'),pages:[
    p('학부연구생으로 함께한 두 해가 지났다. 학생은 대학원 지원서를 내지 않았다.\n\n졸업식 날 빈 책상을 정리했다. 서랍 한쪽에 읽다 만 논문이 있었다.\n\n그리고 다시 한 해가 지났다.','Two years together as an undergraduate researcher had passed. They did not apply to graduate school.\n\nOn graduation day, I cleared the empty desk. An unfinished paper sat in the drawer.\n\nThen another year passed.'),
    p('교수님께.\n\n연구실에서 보낸 시간 덕분에 제가 어떤 일을 좋아하는지 조금 알게 되었습니다. 대학원에 가지 않기로 한 것도, 그 시간을 보냈기 때문에 내릴 수 있었던 결정입니다.\n\n다른 길에서 잘 지내고 있습니다. 교수님도 건강하세요.\n― {name} 올림','Dear Professor,\n\nThe time I spent in the lab helped me understand what I enjoy. Choosing not to go to graduate school was also a decision I could make because of that time.\n\nI am doing well on a different path. Please take care.\n— {name}'),
    p('나는 지원하지 않은 이유를 묻는 대신, 잘 지낸다는 문장을 다시 읽었다.\n\n대학원에 남는 것만이 함께 보낸 시간의 답은 아닐 것이다.\n\n“소식 줘서 고맙습니다.”','Instead of asking why they had not applied, I reread the sentence about doing well.\n\nStaying in graduate school could not be the only answer to the time we had spent together.\n\n“Thank you for letting me know.”')
  ]},
  masters:{type:'EPILOGUE',title:p('석사학위 뒤의 다음 길','The path after a master’s degree'),career:p('석사 졸업 · 다음 진로 선택','Master’s graduation · choosing the next path'),time:p('석사 졸업 6개월 후 · 짧은 메일','Six months after the master’s degree · a short email'),pages:[
    p('학부연구생과 석사과정으로 함께 연구한 시간이 흘렀다.\n\n학생은 박사과정을 이어가지 않기로 했다. 논문 마지막 페이지에는 나의 이름이 있었지만, 다음 계획에는 연구실의 이름이 없었다.\n\n반년 뒤, 메일이 왔다.','Our time together as an undergraduate researcher and then a master’s student had passed.\n\nThey chose not to continue a doctorate. My name was on the last page of the thesis. The lab’s name was not in their next plan.\n\nSix months later, an email arrived.'),
    p('교수님께.\n\n학위논문을 책장에 꽂아 두었습니다. 다시 펼치지는 않았지만, 가끔 제목을 읽습니다.\n\n그 시간을 끝냈다는 게 아직 조금 신기합니다. 배운 것들을 다음 생활에서도 이어 가려고 합니다.\n\n건강하세요.\n― {name} 올림','Dear Professor,\n\nMy thesis is on the bookshelf. I have not opened it again, but sometimes I read the title.\n\nIt still feels strange that I finished that chapter. I am taking what I learned into the next part of my life.\n\nPlease take care.\n— {name}'),
    p('나는 메일을 보관함에 넣었다. 다음 면담 시간은 비어 있었다.\n\n그 빈 시간을 두고, 학생이 떠난 것이라 생각하지 않기로 했다.\n\n한 사람이 다음으로 넘어간 것이다.','I archived the email. The next meeting slot was empty.\n\nLooking at that empty time, I decided not to call it a student leaving.\n\nSomeone had moved on to what came next.')
  ]},
  dropout:{type:'EPILOGUE',title:p('비어 있는 면담 시간','The empty meeting slot'),career:p('학위과정 중단 · 다른 계획을 선택','Leaving the degree program · choosing another plan'),time:p('연구실을 떠난 뒤 · 마지막 메일','After leaving the lab · a final email'),pages:[
    p('8년은 채워지지 않았다.\n\n어느 날부터 면담 때의 대답이 짧아졌다. 괜찮다는 말을 그대로 믿었다. 다음 주에는 더 길게 이야기하자고 생각했다.\n\n그다음 주가 오기 전에, 메일이 도착했다.','We did not reach eight years.\n\nAt some point, the answers in meetings became shorter. I took “I am fine” at face value. Next week, I thought, we would talk for longer.\n\nThe email arrived before that next week.'),
    p('교수님께.\n\n오래 고민했습니다. 지금의 저는 더 이어 갈 수 없을 것 같습니다.\n\n실험 노트와 파일은 정리해 두었습니다. 미처 말하지 못한 것들이 많지만, 지금은 잠깐 멈추고 싶습니다.\n\n그동안 감사했습니다.\n― {name} 올림','Dear Professor,\n\nI have thought about this for a long time. I do not think I can continue as I am.\n\nI have organized the notebooks and files. There is a lot I never managed to say. For now, I need to stop.\n\nThank you for the time we had.\n— {name}'),
    p('나는 비어 있는 면담 시간에 그대로 앉아 있었다. 진도표에는 해야 할 일들이 남아 있었다.\n\n그중에는 안부를 묻는 일이 없었다.\n\n한참 뒤, 답장을 시작했다.\n\n“알려 줘서 고맙습니다. 충분히 쉬었으면 합니다.”','I sat through the empty meeting slot. The progress sheet still had things to do.\n\nAsking how they were was not among them.\n\nAfter a long while, I began a reply.\n\n“Thank you for telling me. I hope you get the rest you need.”')
  ]},
  gameover:{type:'CLOSING RECORD',title:p('지속할 수 없었던 연구실','A lab that could not continue'),career:p('교수 업무 불균형으로 운영 종료','Lab operations ended after a faculty workload imbalance'),time:p('운영 종료 후 · 인계 메일','After closure · a handover email'),pages:[
    p('여덟 해의 약속을 다 채우지 못했다. 연구와 수업, 행정과 면담 중 하나를 너무 오래 뒤로 미루었다.\n\n학생의 일정표를 고치던 손으로, 이번에는 인계 계획을 적었다.','We did not reach the end of our eight-year promise. One of research, teaching, administration and advising had been set aside for too long.\n\nThe hand that once revised a student’s schedule now wrote a handover plan.'),
    p('교수님께.\n\n연구 파일과 노트를 정리해 두었습니다. 다음 지도교수님과도 이어서 이야기해 보겠습니다.\n\n그동안 배운 것을 잃지 않도록 하겠습니다. 교수님도 잠시 숨을 돌리셨으면 합니다.\n― {name} 드림','Dear Professor,\n\nI have organized the research files and notes. I will talk with my next adviser about continuing.\n\nI will try not to lose what I learned here. I hope you can take a little time to breathe, too.\n— {name}'),
    p('나는 인계 서류의 마지막 줄을 확인했다. 학생의 다음 면담 일시가 적혀 있었다.\n\n내가 할 마지막 지도는, 다음 지도가 끊기지 않게 하는 일이었다.','I checked the last line of the handover notes. It held the date of the student’s next meeting.\n\nMy final act of advising was to make sure the next act could begin.')
  ]},
  unfinished:{type:'EPILOGUE',title:p('마지막 페이지의 여백','The space on the final page'),career:p('8년 내 박사학위 미완료','Doctorate not completed within eight years'),time:p('8년의 지도기간 종료 후 · 계획을 다시 쓰는 메일','After eight years · an email to rethink the plan'),pages:[
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 하지만 논문의 마지막 장은 아직 끝나지 않았다.\n\n마지막 학기의 면담에서, 학생은 남은 일과 이후의 일정을 다시 적었다.','An undergraduate researcher, then a graduate student. Eight years had passed. But the dissertation’s final chapter was still unfinished.\n\nAt the last meeting of the term, the student wrote down the remaining work and a revised schedule.'),
    p('교수님께.\n\n지금까지 한 연구를 다시 정리했습니다. 무엇이 부족한지 이제는 조금 보입니다. 계속할지, 다른 길을 택할지 제 생각을 먼저 써 보려고 합니다.\n\n다음 면담에서는 진도보다 앞으로의 계획을 이야기하고 싶습니다.\n― {name} 드림','Dear Professor,\n\nI have reorganized the work so far. I can see a little more clearly what is missing. Before deciding whether to continue or take a different path, I want to write down what I think.\n\nAt our next meeting, I would like to talk about the future, rather than the progress report.\n— {name}'),
    p('나는 면담 일정에 새 제목을 적었다.\n\n다음 계획.\n\n8년 안에 쓰지 못한 문장이었다.','I wrote a new title in the meeting calendar.\n\nThe next plan.\n\nA sentence we had not written in those eight years.')
  ]},
  external_masters:{type:'EPILOGUE',title:p("다음 배움의 문","A door to further study"),career:p("외부 대학원 석사과정 진학","A master’s program at another university"),time:p("지도 종료 1년 후 · 새 연구실에서 온 메일","One year later · an email from a new lab"),pages:[
    p("학부연구생으로 함께한 두 해가 지났다. 진학 상담에서 학생은 다른 학교의 연구실을 조심스럽게 이야기했다.\n\n나는 관심 있는 질문과 지원 일정을 물었다. 추천서를 쓰고, 인계할 자료를 함께 정리했다.","After two years of undergraduate research, the student mentioned another laboratory. We discussed their questions and application, prepared a recommendation, and organized the handover."),
    p("교수님께.\n\n새 연구실에서는 처음부터 배우는 일이 많습니다. 그래도 실험 기록을 남기는 습관은 그대로입니다. 제가 다른 학교에 가 보고 싶다고 했을 때, 먼저 무엇을 배우고 싶은지 물어봐 주셔서 감사합니다.\n\n제 첫 연구를 시작했던 곳을 기억하며 잘 배워 보겠습니다.\n― {name} 드림","Dear Professor,\n\nThere is much to learn in my new lab. I still keep careful research notes. Thank you for asking what I wanted to learn when I brought up studying elsewhere.\n\nI will keep learning, remembering where I first began research.\n— {name}"),
    p("새 지도교수와 동료들이 보이는 사진이 첨부되어 있었다.\n\n“새로운 질문도 차근차근 풀어 보세요.”\n\n답장을 보내고 다음 면담의 자료를 폈다. 함께 시작한 연구는, 다른 곳에서도 이어지고 있었다.","A photograph showed new colleagues and an adviser. I replied with encouragement. The work we began was continuing elsewhere.")
  ]},
  external_phd:{type:'EPILOGUE',title:p("연구를 이어 갈 또 다른 곳","Another place to continue research"),career:p("외부·해외 박사과정 진학","A doctoral program elsewhere or abroad"),time:p("석사 졸업 2년 후 · 박사과정 소식 메일","Two years after the master’s · news from doctoral study"),pages:[
    p("학부연구생과 석사과정으로 함께 연구한 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n학생이 다른 학교의 박사과정에 지원하고 싶다고 했던 면담이 떠올랐다. 더 넓은 연구 환경에서 배워 보고 싶다는 말에, 나는 지원을 함께 준비했다.","Our years of undergraduate and master’s research passed, followed by a few more. I remembered helping the student prepare an application to a doctoral program elsewhere."),
    p("교수님께.\n\n이곳에서 자격시험을 준비하고 있습니다. 연구 주제도 조금 바뀌었습니다. 논문 초고에 의견을 적어 주시던 방식이 생각나서, 제 글을 소리 내어 다시 읽어 봅니다.\n\n떠나는 선택을 응원해 주셔서 감사합니다. 다음 학회에서는 새 연구 이야기를 들고 인사드리겠습니다.\n― {name} 올림","Dear Professor,\n\nI am preparing for my qualifying exam. My topic has changed a little. Your comments on my drafts still help me read my work carefully.\n\nThank you for supporting my choice. At the next conference, I will bring news of my new research.\n— {name}"),
    p("아직 박사학위를 마친 것은 아니었다. 메일에는 해야 할 일과 새로 만난 사람들의 이야기가 나란히 적혀 있었다.\n\n나는 시험 준비를 응원하는 답장을 썼다.\n\n지도는 마무리되었고, 새로운 배움은 계속되고 있었다.","The doctorate was still in progress. I sent encouragement for the coming exam. Our advising had ended, and their learning continued.")
  ]}
};

// Each replay gets fresh metadata and pages; the collected ending ID stays the same.
export function getEndingStory(id,context={}){
 const story=ENDINGS[id];
 if(id==='corporate'&&story){
  const distance=endingRelationship(context.relationship,id);
  const title=distance==='close'?p('커피가 식을 때까지','Until the coffee cooled'):distance==='distant'?p('서로의 자리에서','From our own places'):story.title;
  return {...story,title};
 }
 return id==='postdoc'&&story?postdocScenes(story,context,researchSetting(context),englishResearchSetting(context)):story;
}

// Rapport controls the distance in the letter, separately from the career outcome.
// Numbers here are raw signed rapport, not the normalized 0–100 ability score.
export function endingRelationship(relationship, id) {
  if (['close', 'reserved', 'distant'].includes(relationship)) return relationship;
  const raw = typeof relationship === 'number' ? relationship : relationship?.rapport;
  if (Number.isFinite(raw)) return raw >= 40 ? 'close' : raw < -20 ? 'distant' : 'reserved';
  return id === 'true' ? 'close' : 'reserved';
}

const relationshipNotes = {
  close: p('다음에는 일 이야기만 하지 않고, 교수님은 어떻게 지내시는지도 듣고 싶습니다. 괜찮은 날을 알려 주세요.', 'Next time, I would like to hear how you are doing as well as talk about work. Please let me know a good day.'),
  reserved: p('긴 안부를 쓰는 일은 아직 조금 어색합니다. 그래도 이 소식은 직접 전하고 싶었습니다.', 'A long personal letter still feels a little awkward. Even so, I wanted you to hear this news from me.'),
  distant: p('오랜만에 소식을 전합니다. 당분간은 이렇게 필요한 이야기를 메일로 나누면 좋겠습니다.', 'It has been a while. For now, I would prefer to keep in touch by email about what we need to discuss.'),
};
const alternateRecommendation=p(
 '마감 사흘 전, 학생은 지도교수 대신 다른 추천인에게 추천서를 부탁했다. 임용 심사는 여러 사정이 겹친 결과였고, 그 뒤 어떤 길을 택할지는 학생이 정했다.',
 'Three days before the deadline, the student asked another referee for a recommendation. The faculty search turned on many factors, and the next path was theirs to choose.'
);
const doctorateCareerEndings=new Set(['corporate','institute','unrelated','startup','unemployed','resident_researcher','youtuber']);
const hasAlternateRecommendation=(id,context)=>context?.recommendation==='alternate'&&doctorateCareerEndings.has(id);
function startupScenes(pages,distance,locale){
 const opening=p(
  '학부연구생과 석박사, 8년이라는 시간이 흘렀다. 그리고 다시 몇 해가 지났다.\n\n졸업 뒤 {name}는 새로운 문제를 찾아 독립적으로 회사를 시작했다. 연구실의 기술이나 장비를 사용할 때는 계약 범위와 비용을 별도로 확인하기로 했다. 고객과 이야기하며 방향을 바꾸고 팀의 일을 배웠다.',
  'Eight years of undergraduate and graduate research passed, followed by a few more.\n\nAfter graduation, {name} independently started a company around a new problem. Any use of the lab’s technology or equipment would require a separate agreement on scope and cost. They learned to adjust direction through conversations with customers and their team.'
 );
 const news=p(
  '교수님께.\n\n처음 계획한 제품은 고객의 문제와 달랐습니다. 면담 기록을 다시 살펴 서비스를 바꾸었습니다. 이제는 팀과 고객이 함께 검토할 수 있는 자료를 만들고 있습니다.',
  'Dear Professor,\n\nThe product we first planned did not fit the customer’s problem. We revisited our interview notes and changed the service. We are now preparing material our team and customers can review together.'
 );
 const contact={
  close:p('연구와 회사의 업무를 나누어 계획하고 있습니다. 교수님께는 제가 놓친 가정이 없는지 먼저 여쭤보고 싶습니다.','I am planning the research and company work separately. I would first like to ask whether I have overlooked an assumption.'),
  reserved:p('발표 자료와 질문을 미리 정리해 보내겠습니다. 의논할 범위를 확인한 뒤 짧게 의견을 듣고 싶습니다.','I will send the presentation material and questions in advance. After agreeing on the scope, I would appreciate your comments.'),
  distant:p('초대장과 검토를 부탁드릴 자료는 메일로 보내겠습니다. 가능하신 범위에서 의견을 주시면 팀과 함께 살펴보겠습니다.','I will send the invitation and material by email. We will review any comments you can offer within the scope that works for you.')
 };
 const request=p('다음 주 발표에 와 주실 수 있을까요? 제품과 연구의 다음 계획에 대해 의견을 듣고 싶습니다.\n― {name} 드림','Could you come to our pitch next week? I would like your thoughts on the next plans for the product and our research.\n— {name}');
 pages[0]=opening[locale];pages[1]=[news[locale],contact[distance][locale],request[locale]].join('\n\n');
}
const failurePages = {
  graduation_requirements: [
    p('학위를 마칠 시점이 왔지만, 필요한 연구와 학술발표를 모두 채우지는 못했다. 연구실 운영이 중단된 것은 아니었다. 다만 학생의 졸업에 필요한 준비가 끝나지 않았다.\n\n나는 성과표의 빈칸을 보고, 끝났다고 말할 수 없었던 시간을 생각했다.', 'The degree review arrived before all the required research and presentations were complete. The lab had not closed. The student’s preparation for graduation was unfinished.\n\nI looked at the gaps in the record and thought about the time I could not call complete.'),
    p('교수님께.\n\n지금까지 한 일과 남은 일을 정리했습니다. 해 온 연구가 없어지는 것은 아니지만, 학위를 받았다고 말할 수는 없다는 걸 알고 있습니다.\n\n계속할지 다른 길로 갈지, 다음 계획은 제가 먼저 써 보고 싶습니다.\n― {name} 드림', 'Dear Professor,\n\nI have listed what I completed and what remains. The work I did does not disappear, but I know I cannot say I earned the degree.\n\nBefore deciding whether to continue or take another path, I would like to draft my next plan myself.\n— {name}'),
    p('성적이나 일정만으로는 채울 수 없는 칸들이 있었다. 나는 다음 면담의 제목을 바꿨다.\n\n졸업을 서두르는 면담 대신, 남은 선택을 함께 살피는 면담.\n\n학생이 적어 온 계획을 면담 자료에 넣었다.', 'Some gaps could not be filled just by grades or a calendar. I changed the title of our next meeting.\n\nInstead of rushing graduation, we would examine the choices that remained.\n\nI added the student’s plan to the material for that meeting.'),
  ],
  time_limit: [
    p('학부연구생과 석박사, 8년이라는 시간이 흘렀다. 하지만 학위를 마칠 준비는 끝나지 않았다. 연구실 문은 여전히 열려 있었다.\n\n마지막 학기의 일정표 옆에, 남은 연구와 다음 계획을 나란히 적었다.', 'An undergraduate researcher, then a graduate student. Eight years had passed, but the preparation for a degree was not complete. The lab door was still open.\n\nBeside the final term’s schedule, we listed the remaining research and plans for what came next.'),
    p('교수님께.\n\n마지막 진도표를 다시 읽었습니다. 시작할 때는 여덟 해면 충분할 거라고 생각했습니다. 이제는 남은 일을 얼마나 오래 걸릴지보다 왜 하고 싶은지부터 써 보려고 합니다.\n\n다음 선택을 정리할 시간이 필요합니다.\n― {name} 드림', 'Dear Professor,\n\nI reread the final progress sheet. At the start, I thought eight years would be enough. Now I want to write why I want to do the remaining work before asking how long it will take.\n\nI need time to decide what comes next.\n— {name}'),
    p('나는 아직 남은 파일을 닫지 않았다. 어디까지 했는지 함께 확인한 기록을 첫 장에 붙였다.\n\n다음 계획을 적을 빈 페이지를 한 장 남겨 두었다.', 'I did not close the remaining files. I attached our record of the completed work to the first page.\n\nI left one blank page for the next plan.'),
  ],
  qual_failure: [
    p('자격시험을 다시 준비했지만, 이번에도 통과하지 못했다. 연구실을 운영하지 못해서 끝난 것은 아니었다. 박사과정을 이어가기 위한 관문을 넘지 못한 것이다.\n\n나는 시험 결과와 학생이 해 온 연구를 같은 말로 묶지 않으려 했다.', 'We prepared for the qualifying exam again, but did not pass. This ending was not a failure to operate the lab. The requirement for continuing the doctoral program remained unmet.\n\nI tried not to use the same words for the exam result and all the research the student had done.'),
    p('교수님께.\n\n준비한 만큼 설명할 수 있기를 바랐는데, 결과는 달랐습니다. 지금은 다시 시험 이야기를 하기보다 여기까지 해 온 일을 정리하고 싶습니다.\n\n어떤 길이 가능한지, 제가 생각해 본 뒤 상담을 부탁드리겠습니다.\n― {name} 드림', 'Dear Professor,\n\nI hoped I could explain what I had prepared, but the result was different. For now, I would like to organize what I have done rather than discuss another exam.\n\nAfter considering which paths are possible, I will ask for advice.\n— {name}'),
    p('시험 점수 옆에, 학생이 제출한 첫 그래프를 놓았다. 어느 하나가 다른 하나를 지워서는 안 됐다.\n\n나는 답장을 쓰기 전에 다음 선택을 설명할 자료부터 찾았다.', 'I placed the student’s first graph beside the exam result. Neither should erase the other.\n\nBefore writing my reply, I looked for information about the choices ahead.'),
  ],
};

// Letters may span several scenes. Their final request and closing have separate slots.
const letterAnchors={
 true:p('아직 전임교원 지원 결과는 모르지만','I do not know the result of my faculty application yet.'),
 postdoc:p('다음에는 꼭 좋은 소식을','I hope to bring good news next time.'),
 institute:p('함께 해 주시겠습니까?','Would you like to work on it together?'),
 corporate:p('학회에서 뵙게 되면 커피','If we meet at a conference, I will buy'),
 startup:p('다음 주 발표에 와 주실 수 있을까요?','Could you come to our pitch next week?'),
 unemployed:p('제가 해 온 연구와 앞으로 해 보고 싶은 일을','Could we review the research I have done'),
 resident_researcher:p('이곳에서 이어 보고 싶은 연구가 있습니다.','There is work I would like to continue here.'),
 bachelor:p('다른 길에서 잘 지내고 있습니다.','I am doing well on a different path.'),
 masters:p('배운 것들을 다음 생활에서도 이어 가려고 합니다.','I am taking what I learned into the next part of my life.'),
 external_masters:p('제 첫 연구를 시작했던 곳을','I will keep learning, remembering where I first began research.'),
 external_phd:p('떠나는 선택을 응원해 주셔서 감사합니다.','Thank you for supporting my choice.'),
 leave:p('돌아갈지는 아직 정하지 못했습니다.','I have not decided whether to return.'),
 dropout:p('그동안 감사했습니다.','Thank you for the time we had.'),
 unfinished:p('다음 면담에서는','At our next meeting,'),
 unrelated:p('일하는 일정과 의논하는 방식은 달라졌습니다.','The schedules and ways of discussing work have changed.'),
 gameover:p('그동안 배운 것을 잃지 않도록 하겠습니다.','I will try not to lose what I learned here.')
};
const failureAnchors={
 graduation_requirements:p('계속할지 다른 길로 갈지, 다음 계획은','Before deciding whether to continue or take another path,'),
 time_limit:p('다음 선택을 정리할 시간이 필요합니다.','I need time to decide what comes next.'),
 qual_failure:p('어떤 길이 가능한지, 제가 생각해 본 뒤','After considering which paths are possible,'),
 qual_withdrawal:p('다음 계획은 제가 먼저 생각해 보고,','I will consider my next plans and contact you')
};
export function endingLetterAnchor(id,locale='ko',reason){return (id==='gameover'&&failureAnchors[reason]||letterAnchors[id])?.[locale==='en'?'en':'ko']??'';}
function insertLetterClosing(pages,note,locale){
 const signature=locale==='en'?'— {name}':'― {name}',index=pages.findIndex(text=>text.includes(signature));
 if(index<0||!note)return;
 const text=pages[index],at=text.indexOf(signature);
 const prefix=text.slice(0,at).trimEnd().replace(locale==='en'?/(?:\s*Please take care\.)$/:/(?:\s*(?:교수님도\s+)?건강하세요\.)$/,'').trimEnd();
 pages[index]=(prefix?prefix+'\n\n':'')+note+'\n\n'+text.slice(at);
}
function insertLetterPassages(pages,id,notes,locale,reason){
 if(!notes.length)return;
 const anchor=endingLetterAnchor(id,locale,reason),index=pages.findIndex(text=>anchor&&text.includes(anchor));
 // An absent slot contributes no filler: never append after a closing or signature.
 if(index<0)return;
 const at=pages[index].indexOf(anchor),prefix=pages[index].slice(0,at).trimEnd();
 pages[index]=(prefix?prefix+'\n\n':'')+notes.map(n=>n.text).join('\n\n')+'\n\n'+pages[index].slice(at);
}

// Original composite memories: only events that actually occurred can appear.
const eventMemories={
 'counsel-daily-life':['생활 시간을 함께 확인하며 다음 주 계획을 다시 정했던 면담을 기억합니다.','스스로 필요한 자율 시간을 제안할 수 있도록 해 주셨던 이야기가 남아 있습니다.'],
 'counsel-career-first':['연구가 좋은지, 대학원에 가고 싶은지는 다른 질문이라고 함께 생각했던 면담이 기억납니다.','진학과 취업을 함께 알아볼 시간을 주셨던 것이 제 선택에 도움이 됐습니다.'],
 'counsel-coursework':['놓쳤던 기초를 돌아보고 공부 시간을 다시 잡았던 경험이 지금도 도움이 됩니다.','제가 짠 공부 계획을 설명하고 확인했던 방식은 새로운 일을 배울 때도 쓰고 있습니다.'],
 'counsel-small-question':['다들 알 것 같은 작은 질문도 꺼내 볼 수 있었던 면담을 기억합니다.','어디까지 이해했는지 먼저 설명해 보던 습관이 아직 남아 있습니다.'],
 'counsel-results':['예상과 다른 그래프도 함께 놓고 원자료부터 확인했던 시간을 기억합니다.','다른 설명을 작은 검증으로 확인해 보던 방법을 지금도 쓰고 있습니다.'],
 'counsel-master-career':['석사 뒤의 일과 생활을 함께 의논했던 시간이 제 선택에 도움이 됐습니다.','관심 있던 길을 간 선배에게 물어볼 질문을 준비하던 때가 떠오릅니다.'],
 'counsel-qual':['퀄 준비 범위를 함께 나누니, 모르는 것을 하나씩 물을 수 있었습니다.','시험 답을 소리 내어 설명하다가 막히는 부분을 다시 찾던 연습이 기억납니다.'],
 'counsel-independent':['제 질문으로 시작한 작은 검증을 믿고 맡겨 주셨던 일을 기억합니다.','반례와 필요한 자원을 놓고 독립 연구의 범위를 의논했던 시간을 기억합니다.'],
 'counsel-phd-career':['어떤 진로든 제가 원하는 생활을 먼저 생각해 보라고 하셨던 면담을 기억합니다.','관심 있는 일을 하는 분께 무엇을 묻고 어떤 경험을 준비할지 의논했던 일이 떠오릅니다.'],
 'counsel-feedback':['잘한 점과 보완할 점을 따로 짚어 주셨던 메모가 아직 남아 있습니다.','다음 면담의 확인 기준을 함께 정한 뒤 스스로 계획을 돌아보기 쉬워졌습니다.'],
 'equipment': ['장비가 멈춘 날, 제 실수인지부터 물었던 것을 기억합니다. 함께 점검 기록을 확인했던 방법을 지금도 쓰고 있습니다.','공동기기실에서 다시 배운 기록과 예약 습관이 새 자리에서도 도움이 됩니다.'],
 'authorship':['기여 내역을 함께 적었던 일이 기억납니다. 지금도 새로운 협업을 시작하면 역할부터 의논합니다.','원고를 잠시 멈추고 모두의 의견을 들었던 경험이 남았습니다. 저도 합의할 시간을 먼저 잡으려고 합니다.'],
 'caregiving':['개인적인 설명을 길게 하지 않아도 일정을 의논할 수 있었던 날을 기억합니다. 자세한 이야기는 이 메일에도 남기지 않겠습니다.','제가 가능한 시간을 먼저 정해 보았던 경험 덕분에, 이제도 필요한 지원을 구체적으로 요청하려고 합니다.'],
 'best-paper':['공동연구자들과 함께 축하했던 날의 사진이 아직 남아 있습니다.','수상 발표에서 제 연구를 어떻게 설명할지 함께 준비하던 때가 떠오릅니다.'],
 'best-presentation':['질의응답을 잘했다고 짚어 주신 부분을 기억합니다. 다음 발표에서도 그때의 메모를 꺼내 보았습니다.','발표 워크숍을 맡겨 주셨을 때, 다른 사람의 질문을 받을 시간도 계획해 두었습니다.'],
 'data-loss':['폴더가 열리지 않던 날 이후로 백업을 확인하는 습관이 생겼습니다.','분석 과정을 다시 만들었던 기록을 보며, 재현할 수 있다는 말의 의미를 생각합니다.'],
 'funding-cut':['연구비가 줄었던 때에도 약속한 인건비를 먼저 확인해 주셨던 일을 기억합니다.','빠듯한 예산을 함께 살펴보고 공동 장비를 찾았던 기억이 납니다.'],
 'support-without-assumptions':['사정을 다 설명하기 전에 필요한 도움부터 물어보셨던 대화를 기억합니다.','지원 창구를 알려 주시고 결정은 제게 맡겨 주셨던 일을 기억합니다.'],
 'undergrad-record':['처음에는 파일 이름부터 자주 틀렸습니다. 원자료와 분석본을 나누던 규칙은 지금도 남아 있습니다.','첫 실험을 작은 단계로 나눴던 노트를 다시 보았습니다. 모르면 확인해도 된다는 경험이 남아 있습니다.'],
 'master-scope':['하고 싶은 일을 한꺼번에 적었던 계획서를 기억합니다. 범위를 정하는 것도 연구라는 것을 그때 배웠습니다.','작은 검증을 먼저 마친 뒤 다음 질문을 적던 방식이 지금도 도움이 됩니다.'],
 'doctoral-lead':['회의를 제가 진행하기 시작했을 때부터 제 판단을 설명하는 연습을 했습니다.','독립적으로 정한 계획을 함께 검토하던 시간이, 다음 연구를 준비하는 데 도움이 됐습니다.'],
};
const englishMemories={
 'counsel-daily-life':['I remember revising the next week’s plan after discussing my everyday schedule.','The chance to propose the time I needed for myself has stayed with me.'],
 'counsel-career-first':['We treated enjoying research and choosing graduate school as different questions.','Having time to explore both study and work helped me make my choice.'],
 'counsel-coursework':['Revisiting the basics and setting aside study time still helps me.','I still explain and check my study plan when learning something new.'],
 'counsel-small-question':['I could ask the small questions that everyone else seemed to understand.','I still start by explaining what I understand so far.'],
 'counsel-results':['We put the unexpected graphs on the table too and checked the raw evidence.','I still test another explanation with a small check first.'],
 'counsel-master-career':['Discussing work and life after the master’s helped me make my choice.','I remember preparing questions for a graduate working on the path I was considering.'],
 'counsel-qual':['Dividing up the exam material made it possible to ask one question at a time.','Explaining answers aloud helped me find what I had not understood.'],
 'counsel-independent':['You entrusted me with a small test that began with my own question.','We discussed counterexamples and resources before setting the scope of my independent work.'],
 'counsel-phd-career':['You asked me to consider the life I wanted alongside the career.','We discussed what to ask people doing the work and which experience to prepare next.'],
 'counsel-feedback':['I still have the notes separating what worked from what needed revision.','Agreeing on what to check at the next meeting helped me review my own plan.'],
 equipment:['When the equipment stopped, we checked the maintenance record together. I still use that approach.','What I learned in the shared facility still helps me keep records and arrange access.'],
 authorship:['We wrote down everyone’s contributions. I still discuss roles before a new collaboration.','Pausing the manuscript to hear everyone’s views taught me to allow time for agreement.'],
 caregiving:['I could discuss a schedule without explaining every personal detail. I will keep those details out of this email too.','Setting out when I was available helped me request the support I needed.'],
 'best-paper':['I still have the photograph of us celebrating with our collaborators.','We prepared how I would explain my work in the award presentation.'],
 'best-presentation':['I used the notes about what went well in the questions at my next presentation.','When you asked me to lead the presentation workshop, I planned time for other people’s questions.'],
 'data-loss':['After the folder stopped opening, I began checking the backups.','Rebuilding the analysis made reproducibility a concrete responsibility.'],
 'funding-cut':['You checked the stipend we had agreed on even when funding fell.','We looked at the limited budget together and found shared equipment.'],
 'support-without-assumptions':['You asked what support I needed before asking me to explain my circumstances.','You showed me the support office and left the decision with me.'],
 'undergrad-record':['I often got filenames wrong at first. I still separate raw evidence from analysis.','Breaking the first experiment into small steps showed me that I could ask and check.'],
 'master-scope':['The first plan tried to do everything. I learned that choosing a scope was research too.','I still finish a small test before writing down the next question.'],
 'doctoral-lead':['Chairing the meetings gave me practice in explaining my judgment.','Reviewing the plan I had chosen helped me prepare the next study.']
};
function memoryCandidates(history,locale='ko'){
 const found=Array.isArray(history)?history.filter(h=>h?.kind==='event'&&Object.hasOwn(eventMemories,h.id)&&Number.isInteger(h.choice)&&h.choice>=0&&h.choice<4):[];
 const unique=[...new Map(found.map(h=>[h.id,h])).values()].reverse();
 return unique.map((h,index)=>({id:`memory.${h.id}.${h.choice}`,group:'memory',priority:100-index,
  tags:[...(['counsel-daily-life','caregiving','support-without-assumptions'].includes(h.id)?['recovery']:['counsel-coursework','undergrad-record'].includes(h.id)?['newcomer']:[]),
   ...(h.id==='equipment'||h.id==='funding-cut'&&h.choice===1||h.id==='undergrad-record'&&h.choice===1?['wet']:['wet','dry'])],
  text:locale==='en'?(englishMemories[h.id]?.[h.choice]??(h.choice===2?'We agreed to review the evidence for my plan at the next meeting.':'We agreed on a deadline and the work that needed revision.')):(eventMemories[h.id][h.choice]??(h.choice===2?'다음 면담에서 제 계획의 근거를 검토하기로 했던 약속이 남아 있습니다.':'기한과 보완할 범위를 분명히 정했던 면담이 떠오릅니다.'))}));
}
export function validPassageIds(ids){const known=new Set([...VOICE_PASSAGE_IDS,...Object.keys(eventMemories).flatMap(id=>[0,1,2,3].map(choice=>`memory.${id}.${choice}`))]);return Array.isArray(ids)&&ids.length<=known.size&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&known.has(id));}
const passageHash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export function endingLetterInsertions(id,relationship,history=[],context={},locale='ko'){
 const distance=endingRelationship(relationship,id),budget=distance==='close'?2:distance==='reserved'?1:0;
 if(!budget||['leave','dropout','gameover','unfinished','youtuber','dismissed'].includes(id))return [];
 const advanced=['true','postdoc','institute'].includes(id),ctx={...context,ending:id,relationship:distance};
 const candidates=[...memoryCandidates(history,locale),...endingVoiceCandidates(ctx,locale)].filter(note=>
  (!advanced||!note.tags.some(tag=>['newcomer','recovery'].includes(tag)))&&
  (id!=='resident_researcher'||!note.tags.includes('newcomer'))&&
  (!['wet','dry'].includes(context.labMode)||!note.tags.some(tag=>['wet','dry'].includes(tag))||note.tags.includes(context.labMode)));
 const clean=note=>({...note,tags:[...note.tags],text:adaptResearchText(note.text,context,locale)});
 if(Array.isArray(context.passageIds)){
  const frozen=context.passageIds.map(key=>candidates.find(n=>n.id===key)).filter(Boolean).slice(0,budget);
  let remembers=0;return frozen.filter(n=>(remembers+=(n.text.match(/기억합니다/g)||[]).length)<=1).map(clean);
 }
 const seen=new Set(Array.isArray(context.seenPassageIds)?context.seenPassageIds:[]),chosen=[];
 const salt=JSON.stringify([id,context.fieldId,context.labMode,context.statistics?.temperament,context.statistics?.student]);
 const take=group=>{
  const available=candidates.filter(n=>n.group===group&&!chosen.some(p=>p.id===n.id||p.text===n.text)&&([...chosen,n].reduce((count,p)=>count+(p.text.match(/기억합니다/g)||[]).length,0)<=1));
  available.sort((a,b)=>Number(seen.has(a.id))-Number(seen.has(b.id))||(b.priority??0)-(a.priority??0)||passageHash(salt+a.id)-passageHash(salt+b.id));
  if(available[0])chosen.push(available[0]);
 };
 if(candidates.some(n=>n.group==='memory')){take('memory');if(budget===2){take('skill');if(chosen.length<2)take('trait');}}
 else if(budget===2){take('trait');take('skill');}else{take('skill');if(!chosen.length)take('trait');}
 return chosen.slice(0,budget).map(clean);
}
export function endingMemoryNotes(history,relationship='reserved'){
 const budget=relationship==='close'?2:relationship==='reserved'?1:0,notes=[];
 for(const note of memoryCandidates(history)){if(notes.length>=budget)break;if(notes.reduce((n,text)=>n+(text.match(/기억합니다/g)||[]).length,0)+(note.text.match(/기억합니다/g)||[]).length<=1)notes.push(note.text);}
 return notes;
}
// Return fresh strings: gallery replays and locale switches cannot alter source stories.
export function getEndingPages(id, lang = 'ko', relationship, name, reason, history = [], context) {
  const locale = lang === 'en' ? 'en' : 'ko';
  const story = getEndingStory(id,{...context,relationship});
  if (!story) return [];
  const distance = endingRelationship(relationship, id);
  if(id==='dismissed'){const closing={close:['학생은 이후에도 필요한 절차를 함께 확인하기로 했다. 다음 계획이 정해지면 학생이 먼저 연락하기로 했다.','They agreed to review the remaining procedures and get in touch when plans were ready.'],reserved:['필요한 서류와 연락 방법을 정리했다. 이후의 계획을 재촉하지 않았다.','They reviewed the documents and contact details without pressing for plans.'],distant:['행정상 필요한 연락만 남기고, 더 이야기하고 싶지 않다는 학생의 뜻을 존중했다.','Only administrative contact remained, respecting the student’s wish for privacy.']};return story.pages.map((p,i)=>p[locale]+(i===story.pages.length-1?'\n\n'+closing[distance][locale==='en'?1:0]:'')).map(p=>formatStudentName(p,name,locale));}
  const suppliedReason = typeof reason === 'object' ? reason?.endingReason : reason;
  const rawPages = id === 'gameover' && failurePages[suppliedReason] ? failurePages[suppliedReason] : story.pages;
  let pages = rawPages.map(page => page[locale]);
  if(id==='true')pages[3]=postdocLetter(context,locale,locale==='en'?englishResearchSetting(context):researchSetting(context));
  if(id==='gameover'&&suppliedReason==='qual_failure'&&history.filter(h=>h.kind==='qual'&&!h.passed).length<2){
    const tried=history.some(h=>h.kind==='qual'&&!h.passed);
    pages=[
      p(tried?'첫 자격시험 결과를 확인한 뒤, 학생은 재응시 대신 박사과정을 정리하기로 했다. 연구실 운영이 중단된 것은 아니었다. 나는 시험 결과와 학생이 선택한 다음 계획을 구분해 기록했다.':'박사과정을 이어가기 위한 요건과 앞으로의 계획을 확인한 뒤, 학생은 과정을 정리하기로 했다. 연구실 운영이 중단된 것은 아니었다. 나는 아직 응시하지 않은 자격시험의 결과를 대신 판단하지 않았다.',tried?'After reviewing the first qualifying exam result, the student chose to leave the doctoral program rather than retake the exam. The lab had not closed. I recorded the exam result separately from the student’s next decision.':'After reviewing the doctoral requirements and their plans, the student chose to leave the program. The lab had not closed. I did not presume the result of an exam they had not taken.'),
      p('교수님께.\n\n여기까지 해 온 일과 필요한 인계 절차를 정리했습니다. 박사과정을 계속하지 않기로 했습니다. 다음 계획은 제가 먼저 생각해 보고, 필요한 서류가 있으면 연락드리겠습니다.\n― {name} 드림','Dear Professor,\n\nI have organized the work I completed and the handover procedures. I have decided not to continue the doctorate. I will consider my next plans and contact you if I need documents.\n— {name}'),
      p('함께 확인할 서류와 연구 기록을 정리했다. 더 설명하고 싶지 않은 사정은 묻지 않았다. 과정은 여기서 끝났지만, 학생이 해 온 일을 없던 것으로 기록하지는 않았다.','We organized the documents and research records. I did not ask about circumstances the student did not wish to explain. The program ended here; the work they had done remained.')
    ].map(page=>page[locale]);
  }
  if(id==='startup'&&context?.statistics)startupScenes(pages,distance,locale);

  if(id==='postdoc'&&distance==='distant')pages[6]=p('필요한 서류와 연구 기록에 관한 연락은 메일로 부탁드립니다.\n― {name} 올림','Please contact me by email about the necessary documents and research records. — {name}')[locale];
  if(id==='unemployed'&&distance==='distant'){
    const request=p('제가 해 온 연구와 앞으로 해 보고 싶은 일을 함께 정리해 볼 수 있을까요? 교수님 일정이 괜찮다면 면담을 부탁드리고 싶습니다.','Could we review the research I have done and the work I would like to try? If your schedule allows, I would appreciate a meeting.')[locale];
    const agenda=p('면담에서는 지원에 필요한 연구 기록과 서류를 중심으로 의논하고 싶습니다. 연락 범위도 제가 정리해서 말씀드리겠습니다.','For our meeting, I would like to focus on the research record and documents needed for applications. I will also explain the contact boundaries that work for me.')[locale];
    pages[1]=pages[1].replace(request,request+'\n\n'+agenda);
    pages[3]=pages[3].replace(p('다음 일을 찾는 동안에도, 우리는 안부를 나눌 수 있었다.','We could keep in touch while they searched for their next position.')[locale],p('연락의 범위는 학생이 정한 대로 따르기로 했다.','I would follow the contact boundaries they chose.')[locale]);
  }
  if(id==='youtuber')pages[7]=pages[7].replace(locale==='en'?'— {name}':'― {name}',p('교수님 출연분만은 대본에 검토란을 세 칸 만들어 두었습니다.\n― {name}','For your scenes, the script has three separate review boxes.\n— {name}')[locale]);
  if(id==='unrelated'&&distance==='distant'&&context?.statistics){pages=OUTSIDE_SCENES.map(p=>p[locale]);if(hasAlternateRecommendation(id,context))pages[3]+='\n\n'+alternateRecommendation[locale];return pages.map(p=>formatStudentName(adaptResearchText(p,context,locale),name,locale));}
  if(id==='unrelated'&&distance==='close'){
    pages[pages.length-1]=p('나는 다음 안부를 재촉하지 않고 답장을 썼다. “새로운 일을 배우고 있군요. 다음에 만나면 회사 밖의 이야기도 들려주세요.”\n\n연구를 직업으로 이어 가지 않아도, 함께 배운 시간을 이야기할 수 있었다.','I replied without pressing for another update. “You are learning new work. When we next meet, tell me about life outside the company too.”\n\nWe could talk about what we had learned together, even though research was no longer their job.')[locale];
  }

  if (id === 'corporate' && distance === 'close') {
    pages[0] = pages[0].replace(locale === 'ko' ? '그날의 커피는 정말로 한 잔뿐이었다.' : 'There really was only one cup of coffee.', locale === 'ko' ? '커피가 식는 동안에도 이야기는 끝나지 않았다.' : 'The conversation continued long after the coffee cooled.');
    pages[4] = p('학회에서 뵙게 되면 커피를 사겠습니다. 그때는 교수님 이야기도 오래 듣고 싶습니다.\n\n추신. 교수님 논문 인용은 계속하겠습니다. 다음에는 그 논문에서 시작한 제 실험도 보여 드릴게요.\n― {name} 올림\n\n나는 마지막 문장을 한 번 더 읽었다. 이제는 검토를 받기 위해서만 연락하는 사이가 아니었다.\n\n함께 했던 연구가 다른 자리에서도 이어진다는 사실을 오래 생각했다.', 'If we meet at a conference, I will buy the coffee. This time I would like to hear more about you too.\n\nP.S. I will keep citing your papers. Next time, I will show you the experiment I began from one of them.\n— {name}\n\nI reread the last sentence. We no longer kept in touch only for my review.\n\nI thought about how our shared research continued elsewhere.')[locale];
    pages[5] = pages[5].replace(locale === 'ko' ? '커피는 정말로 한 잔뿐이었다.' : 'there really was only one cup of coffee.', locale === 'ko' ? '첫 잔이 비었는데도 두 사람은 자리에서 일어나지 않았다.' : 'we stayed seated after the first cup was empty.');
    pages[5] = pages[5].replace(locale === 'ko' ? '그것이 이 사제에게는 딱 알맞은 거리였다.' : 'For the two of us, that was just the right distance.', locale === 'ko' ? '거리는 처음보다 조금 가까워져 있었다.' : 'The distance between us had grown a little smaller.');
  } else if (id === 'corporate' && distance === 'distant') {
    pages[0] = pages[0].replace(locale === 'ko' ? '그날의 커피는 정말로 한 잔뿐이었다.' : 'There really was only one cup of coffee.', locale === 'ko' ? '두 사람은 세션이 끝난 뒤 짧게 인사를 나누었다.' : 'We exchanged a brief greeting after the session.');
    pages[4] = p('자료 인계 때문에 한 가지를 덧붙입니다. 냉동고 샘플은 보존 여부를 결정하신 뒤 메일로 알려 주세요.\n\n교수님 논문은 계속 인용하겠습니다. 함께 지낸 시간과는 별개로, 연구에 필요한 논문이라서요.\n― {name} 올림\n\n메일로 알려 달라는 문장을 다시 읽었다. 그 거리를 줄이겠다는 답장은 쓰지 않았다.\n\n연구 기록을 확인하고, 필요한 답만 보내기로 했다.', 'One more detail for the handover: please email me once you decide whether to retain the freezer samples.\n\nI will keep citing your papers. Whatever our time together was like, the papers remain useful to my work.\n— {name}\n\nI reread the request for an email. I did not reply with an attempt to close that distance.\n\nI would check the records and send the information needed.')[locale];
    pages[5] = p('나는 메일을 두 번 읽고 보관함에 넣었다. 냉동고 맨 아래 칸을 열어 라벨이 붙은 튜브들을 오래 바라보았다.\n\n3년 뒤 학회에서 두 사람은 짧게 인사를 나누었다. 더 긴 대화를 약속하지는 않았다.\n\n함께한 연구는 남았고, 연락의 방식은 달라졌다.', 'I read the email twice and archived it. Then I opened the bottom freezer drawer and looked at the labeled tubes for a long time.\n\nThree years later, we exchanged a brief greeting at a conference. We did not promise a longer conversation.\n\nThe work we had done remained. The way we kept in touch had changed.')[locale];
  } else if (id === 'true' && distance !== 'close') {
    // Preserve the recommendation, old machine, acknowledgements and promised good news.
    pages[3] = pages[3].replace(locale === 'ko' ? '건강하세요.' : 'Please take care.', relationshipNotes[distance][locale] + '\n\n' + (locale === 'ko' ? '건강하세요.' : 'Please take care.'));
    pages[pages.length-1] = distance === 'reserved' ? p('그날 저녁, 두 사람은 학회장 근처 카페에서 커피를 마셨다. 한 잔을 마시는 동안 오래된 기계와 {name} 교수의 대학원생 이야기가 이어졌다.\n\n다음 만남을 서두르지는 않았다. 돌아가기 전, 나는 처음으로 학생의 진도가 아닌 동료의 의견을 물었다.\n\n“{name} 교수는 어떻게 생각해요?”', 'That evening, we had one coffee at a café near the venue. We talked about the old machine and Professor {name}’s graduate students.\n\nWe did not rush to arrange another meeting. Before leaving, I asked for a colleague’s view rather than a student’s progress.\n\n“What do you think?”')[locale] : p('카페에 같이 가자는 말은 꺼내지 않았다. {name} 교수는 다음 세션으로 향했고, 나는 그 뒷모습을 잠깐 바라보았다.\n\n좋은 소식은 약속대로 직접 가져왔다. 그 뒤의 거리는 각자가 정할 일이었다.\n\n며칠 뒤 받은 메일에는 새로운 연구 질문이 적혀 있었다. 이번에는 동료에게 답장을 썼다.', 'I did not suggest going to a café together. Professor {name} headed to the next session, and I watched for a moment.\n\nThe good news had been brought in person as promised. The distance afterward was for each of us to choose.\n\nA few days later, an email arrived with a new research question. This time, I wrote to a colleague.')[locale];
  } else if (id !== 'corporate' && id !== 'true') {
    const closing=letterClosing(id,distance,context,locale,suppliedReason);if(closing)insertLetterClosing(pages,closing,locale);
  }
  if(id==='corporate')pages[4]=p('메일은 이렇게 이어졌다.','The email continued.')[locale]+'\n\n'+pages[4];
  if(id==='startup'&&context?.labMode==='dry')pages=pages.map(text=>text.replace(locale==='ko'?'다음 실험은 무엇입니까?':'What is your next experiment?',locale==='ko'?'다음 연구는 무엇입니까?':'What is your next study?'));
  const slotReason=id==='gameover'&&suppliedReason==='qual_failure'&&history.filter(h=>h.kind==='qual'&&!h.passed).length<2?'qual_withdrawal':suppliedReason;
  insertLetterPassages(pages,id,endingLetterInsertions(id,distance,history,context??{},locale),locale,slotReason);
  pages=pages.map(text=>adaptResearchText(text,context,locale));
  // Add the recommendation prologue after positional scene replacements.
  if(hasAlternateRecommendation(id,context))pages.unshift(alternateRecommendation[locale]);
  return pages.map(text=>formatStudentName(text,name,locale));
}
