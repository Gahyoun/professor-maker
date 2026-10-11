// Fictional management decisions. Hints describe tradeoffs without exposing hidden values.
const p=(ko,en)=>({ko,en});
const o=(value,ko,en,hint,effects,progress=0,response='')=>({value,label:p(ko,en),hint:p(hint,hint),effects,progress,response});
const dilemma=(id,title,body,options,extra={})=>({id,title:p(title,title),body:p(body,body),kind:'dilemma',minMonth:1,maxMonth:95,cooldown:4,once:false,options,...extra});
export const DILEMMAS=[
 dilemma('monthly-scope','이번 달에는 어디까지 할까','학생이 후속 질문 두 가지를 가져왔다. 모두 시도하기에는 시간이 부족하다. 지금의 연구를 마무리할지, 작은 새 방향을 확인할지 정해야 한다.',[
  o(0,'작은 검증을 함께 설계한다','Design a small validation together','질문의 근거를 다듬는다. 교수의 다른 업무에 쓸 여유는 줄어든다.',{hidden:{research:.6,rapport:.6},professor:{research:-.5,admin:-.5}},2,'“어디까지 확인하면 되는지 정해져서 시작할 수 있겠어요.”'),
  o(1,'학생이 검증 범위와 중단 기준을 정하게 한다','Let the student set scope and stopping criteria','독립적인 판단을 연습한다. 준비와 관계가 부족하면 부담이나 방치로 받아들일 수 있다.',{hidden:{autonomy:1.5}},0,'“먼저 제 판단을 적고, 막히는 부분을 가져오겠습니다.”'),
  o(2,'핵심 질문만 남기고 새 방향은 보류한다','Keep the core question and defer expansion','부담과 지출을 억제한다. 새로운 결과를 얻는 속도는 늦어진다.',{hidden:{stress:-2,stamina:1,creativity:-.3}},-3,'“이번에는 지금 가진 결과를 잘 정리해 보겠습니다.”'),
 ],{requires:'research'}),
 dilemma('monthly-validation','추가 검증의 경계','반복 확인에서 결과 일부가 달라졌다. 원자료는 보존되어 있다. 범위를 넓혀 다시 확인할지, 현재 자료의 한계를 명확히 할지 의논한다.',[
  o(0,'추가 자원을 배정해 교차 검증한다','Fund cross-validation','검증 경험과 연구 환경을 확보한다. 운영비 30만원과 교수의 검토 시간이 필요하다.',{lab:{funds:-3,equipment:1},hidden:{research:1},professor:{research:-.5}},3,'“다른 조건에서도 같은 결론인지 확인해 보겠습니다.”'),
  o(1,'학생이 분석 절차부터 다시 점검하게 한다','Ask the student to audit the workflow','연구비를 아끼고 독립성을 기른다. 준비가 부족하면 재작업 부담이 커진다.',{hidden:{autonomy:1,learning:.5}},0,'“어느 단계에서 달라졌는지 차근차근 찾아보겠습니다.”'),
  o(2,'확인된 범위와 미확인 부분을 구분한다','Document supported findings and limitations','불확실성을 기록하고 부담을 줄인다. 이번 달에는 추가 성과를 기대하지 않는다.',{hidden:{language:.5,stress:-1}},-2,'“확인하지 못한 부분도 빠뜨리지 않고 적겠습니다.”'),
 ],{requires:'research'}),
 dilemma('monthly-workload','겹쳐 버린 일정','학생이 이번 달의 연구 마감과 겹친 다른 일정을 나란히 적었다. 모두 지키기에는 여유가 없다. 어떤 일을 미룰지 합의해야 한다.',[
  o(0,'이번 달 연구 범위를 줄여 회복 시간을 확보한다','Narrow research scope and protect recovery','회복과 관계를 돌본다. 연구의 진행 속도를 양보한다.',{hidden:{stress:-2,stamina:1.5,rapport:.5}},-3,'“이번 달에는 무엇을 안 해도 되는지도 알겠어요.”'),
  o(1,'마감은 유지하되 매주 진행을 확인한다','Keep the deadline with weekly check-ins','단기 진척을 우선한다. 학생의 부담과 교수의 지도 업무가 늘어난다.',{hidden:{stress:2,stamina:-1},professor:{mentoring:-.7}},3,'“확인할 내용을 정해 주시면 준비해 보겠습니다.”'),
  o(2,'다른 담당자와 겹친 일정을 협의한다','Negotiate the overlapping commitments','학생의 일을 덜어 낸다. 교수의 행정 업무에 쓸 여유가 줄어든다.',{hidden:{stress:-1,rapport:.5},professor:{admin:-1}},1,'“일정을 조정할 수 있는지 먼저 확인해 보겠습니다.”'),
 ]),
 dilemma('monthly-resources','공용 자원의 예약표','공용 장비·계산 자원의 예약이 겹쳤다. 추가 이용료를 내거나 다른 연구실과 협의할 수 있다. 지금 가진 자료를 먼저 정리하는 방법도 있다.',[
  o(0,'추가 이용 시간을 확보한다','Pay for additional access','이번 달 계획을 이어 간다. 운영비 30만원을 사용한다.',{lab:{funds:-3,equipment:1},hidden:{research:.3}},3,'“예약된 시간에 맞춰 준비를 마치겠습니다.”'),
  o(1,'다른 연구실과 공동 이용을 협의한다','Arrange shared access with another lab','연구비를 아끼고 동료와 연결된다. 교수의 협의·행정 부담이 생긴다.',{hidden:{social:.8},professor:{admin:-1}},2,'“같이 사용하는 분들과 조건부터 맞춰 보겠습니다.”'),
  o(2,'새 작업을 미루고 기존 자료를 정리한다','Defer new work and organize existing data','지출을 피하고 기록을 다듬는다. 새 결과를 얻는 속도는 늦어진다.',{hidden:{language:.5,stress:-1}},-3,'“그동안 쌓인 자료부터 정리해 두겠습니다.”'),
 ]),
 dilemma('monthly-seminar','공동 세미나 초대','다른 연구실에서 작은 공동 세미나를 제안했다. 학생에게 질문을 받아 볼 기회이지만 이동과 준비에는 시간이 든다.',[
  o(0,'학생이 참석할 수 있도록 지원한다','Support the student’s visit','동료와 배울 기회를 넓힌다. 운영비 20만원과 준비·이동 부담이 있다.',{lab:{funds:-2},hidden:{social:1,language:.5,stamina:-1}},0,'“어떤 질문을 받았는지 돌아와서 정리해 보겠습니다.”'),
  o(1,'우리 연구실에서 작은 세미나를 연다','Host a small seminar','학생이 내용을 설명하는 경험을 얻는다. 교수의 교육·행정 업무가 늘어난다.',{hidden:{language:1,confidence:.5},professor:{teaching:-.5,admin:-.5}},0,'“아직 부족한 부분도 질문받을 수 있게 준비하겠습니다.”'),
  o(2,'이번에는 자료만 받고 다음 기회를 잡는다','Exchange material and plan for a later visit','현재 일정과 연구비를 지킨다. 직접 만날 기회는 다음으로 미룬다.',{hidden:{learning:.5,social:-.3,stress:-.5}},0,'“보내 주신 자료를 읽고 다음 기회를 준비하겠습니다.”'),
 ]),
 dilemma('monthly-draft','초고를 검토할 시간','학생이 지금까지 정리한 글과 발표 자료를 가져왔다. 교수에게는 다른 마감도 있다. 어디까지 직접 검토하고 어디서부터 학생에게 맡길지 정한다.',[
  o(0,'주장의 핵심과 도표를 함께 고친다','Review the argument and figures together','초고의 전달력을 다듬는다. 교수의 학술·지도 업무 여유를 사용한다.',{hidden:{language:.7,research:.4,rapport:.4},professor:{research:-.5,mentoring:-.5}},2,'“독자가 어디서 헷갈리는지 이제 조금 보입니다.”'),
  o(1,'검토 기준을 주고 학생이 먼저 수정하게 한다','Give criteria and let the student revise first','독립적으로 수정하는 경험을 쌓는다. 준비가 부족하면 막히는 부분이 늘어난다.',{hidden:{autonomy:1.2,language:.3}},0,'“기준에 맞춰 고친 뒤, 해결하지 못한 부분을 여쭙겠습니다.”'),
  o(2,'검토 범위를 줄이고 발표·제출 일정을 다시 협의한다','Reduce scope and renegotiate the presentation or submission date','무리한 제출을 피한다. 이번 달의 진척과 교수의 행정 여유를 양보한다.',{hidden:{stress:-1.5},professor:{admin:-.5}},-3,'“지금 확인할 수 있는 범위부터 정확히 정리하겠습니다.”'),
 ]),
];
export function dilemmaOptions(s,event){
 const options=structuredClone(event.options);
 if(event.kind!=='dilemma')return options;
 for(const item of options){
  if(item.value===1&&['monthly-scope','monthly-validation','monthly-draft'].includes(event.id)){
   const prepared=s.month>=24&&s.hidden.research>=550&&s.hidden.learning>=450;
   item.effects.hidden={...item.effects.hidden,stress:prepared?-.5:1.5,rapport:s.hidden.rapport>=30?.4:-.6};
   item.progress=prepared?3:-2;
   if(!prepared)item.response='“혼자 정리해 보겠습니다. 다만 막히는 부분은 다시 여쭤봐도 될까요?”';
  }
  if(event.id==='monthly-workload'&&item.value===1&&s.hidden.stress>=65){item.effects.hidden.stress=4;item.effects.hidden.stamina=-2;item.response='“마감은 알겠습니다. 지금 맡은 일을 모두 해낼 수 있을지는 걱정돼요.”';}
  const cost=Math.max(0,-(item.effects.lab?.funds??0));item.disabled=cost>s.lab.funds;
 }
 return options;
}
export function monthlyIssueOptions(s,id){
 const alternatives={
  'grant-selected':[
   o('prepare','집행·검토 시간을 배정한다','Allocate time to implementation','새 수입은 이미 입금됐다. 연구 자원과 학생 계획을 점검하되 교수의 행정·학술 여유를 사용한다.',{lab:{equipment:2},hidden:{rapport:.6,research:.5},professor:{admin:-1,research:-.5}},2,'“새 과제에서 제가 맡을 범위를 먼저 정리하겠습니다.”'),
   o('reserve','운영 여유를 남기고 기존 연구에 집중한다','Preserve reserves and focus existing work','추가 지출을 억제한다. 새 과제의 세부 준비와 성과 확장은 늦어진다.',{hidden:{stress:-1}},-1,'“기존 연구를 마친 뒤 새 과제 계획을 구체화하겠습니다.”'),
  ],
  'grant-rejected':[
   o('revise','평가 의견과 다음 신청을 직접 검토한다','Review the proposal for resubmission','다음 준비의 근거를 다듬는다. 교수의 학술·행정 여유를 사용한다.',{hidden:{learning:.8,confidence:.5},professor:{research:-1,admin:-.5}},1,'“이번 결과와 제가 할 일을 나누어 생각해 보겠습니다.”'),
   o('narrow','현재 자원으로 연구 범위를 축소한다','Narrow the work to available resources','부담을 낮추고 가능한 범위를 정한다. 새 연구의 진척은 양보한다.',{hidden:{stress:-2,rapport:.5}},-3,'“지금 할 수 있는 검증부터 다시 정리하겠습니다.”'),
  ],
  'presentation-award':[
   o('recover','준비 부담을 돌아보고 짧은 여유를 준다','Protect recovery after the presentation','인정과 회복을 챙긴다. 후속 연구의 속도는 잠시 늦어진다.',{hidden:{stress:-2,stamina:1.5,rapport:1}},-2,'“준비한 걸 알아주셔서 좋았어요. 다음 계획도 차분히 세우겠습니다.”'),
   o('extend','학회 피드백을 다음 연구로 연결한다','Build on conference feedback','배운 내용을 연구로 연결한다. 추가 작업과 교수의 검토 부담이 생긴다.',{hidden:{research:.8,stress:1,stamina:-.5},professor:{research:-.7}},3,'“받았던 질문 중 바로 확인할 수 있는 것부터 해 보겠습니다.”'),
  ],
  'internal-admission':[
   o('independent','학생이 다음 단계의 질문과 목표를 정하게 한다','Entrust the next plan to the student','독립적으로 다음 단계를 설계한다. 계획 점검을 위한 교수의 지도 시간을 사용한다.',{hidden:{autonomy:1.5,stress:.5},professor:{mentoring:-.5}},0,'“남기로 했지만, 다음 연구는 제 질문으로 시작하고 싶습니다.”'),
   o('supported','초반 목표를 작게 정하고 자주 점검한다','Start small with regular check-ins','새 단계의 불확실성을 줄인다. 교수의 지도 부담이 늘고 독립적 판단 경험은 줄어든다.',{hidden:{stress:-1.5,rapport:.5,autonomy:-.4},professor:{mentoring:-1}},1,'“처음에는 작은 목표부터 확인하면서 적응하겠습니다.”'),
  ],
 };
 const options=[o('acknowledge','합의한 계획을 유지한다','Keep the agreed plan','이번 결과만 확인하고 현재 계획을 이어 간다. 별도의 추가 효과나 지출은 없다.',{},0,''),...(alternatives[id]??[])];
 for(const item of options)item.disabled=-(item.effects.lab?.funds??0)>s.lab.funds;
 return options;
}

export const ISSUE_CHOICES={'grant-selected':['acknowledge','prepare','reserve'],'grant-rejected':['acknowledge','revise','narrow'],'presentation-award':['acknowledge','recover','extend'],'internal-admission':['acknowledge','independent','supported']};
