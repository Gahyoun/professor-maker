// Screen guidance is stored independently of game saves and never changes a run.
export const SCREEN_GUIDE_KEY='pm-screen-guide-v1';
export const SCREEN_GUIDE_STEPS=[
 {id:'purpose',selector:'.student-voice',title:'한 학생의 성장과 다음 길을 함께 봅니다.',body:'8년 동안 학생을 지도하며 배움·연구·졸업과 다음 진로를 함께 결정합니다. 면담과 분기 이벤트, 논문과 학술대회, 교수 업무와 연구비를 경험하고, 마지막에는 편지와 CV로 함께한 기록을 돌아봅니다. 전공 문제를 푸는 게임이 아닙니다. 학생의 말과 수행 보고가 다음 선택의 힌트입니다.'},
 {id:'menus',selector:'.header-nav',title:'세 메뉴로 이동합니다.',body:'학생 지도에서 이번 달 계획을 정합니다. 연구 기록에서는 수행·성과와 저장점을, 메일함에서는 지도 종료 뒤 편지와 CV를 확인합니다.'},
 {id:'plan',selector:'.week-plan',title:'학생 제안을 보고 일정을 합의합니다.',body:'학생 제안은 추천입니다. 아래 “합의한 일정” 선택칸에서 실제 계획을 정하세요. 고정 학회·훈련 주간은 선택칸이 잠깁니다. 피로와 휴식 요청도 함께 살펴 주세요.'},
 {id:'faculty',selector:'#faculty-allocation',title:'업무 크레딧을 눌러 배분합니다.',body:'네 업무의 네모 블록을 눌러 켜고 끕니다. 합계는 이번 달 최대 크레딧 이내로 정하세요. 어느 업무가 계속 고갈되지 않도록 낮아진 항목을 챙깁니다.'},
 {id:'budget',selector:'#lab-budget .budget-row',open:'#lab-budget',title:'인건비·소모품 지출을 조정할 수 있습니다.',body:'“교수 업무·연구실 예산 조정”을 펼치세요. 인건비 계상률은 3월, “연구환경”·“연구성과 지원”은 매달 조정합니다. 실험·분석 주수와 전공에 따라 소모품·활동비도 달라집니다. 기본 유지비는 남습니다. 학생인건비 풀은 급여 전용이라 운영비·빚 상환에 쓸 수 없습니다.'},
 {id:'funding',selector:'#faculty-action',open:'#lab-budget',title:'이 선택칸에서 연구비를 신청합니다.',body:'“이번 달 추가 활동”에서 “연구비 신청”을 선택하세요. 공모는 3월·9월에 열립니다. 바로 위 “연구과제·학생인건비 관리”에서 신청 역할과 기간을 정합니다. 한 달 진행 뒤 선정과 실제 입금 소식이 도착하며, 이후 연차마다 지원됩니다. 반복 차입 부담을 줄이도록 다음 신청을 챙기세요.'},
 {id:'advance',selector:'.monthly-confirm',title:'확정 버튼으로 한 달을 진행합니다.',body:'연구비가 부족해도 자동 차입해 진행하며, 이후 입금으로 갚습니다. 매달 이자·행정 부담이 생기고, 큰 미상환액과 추가 차입이 3개월 연속이면 운영이 종료됩니다. 경고를 보고 지출·다음 입금을 계획하세요. 버튼이 비활성이면 업무 합계·신청 조건을 확인하고, 휴식 요청은 수행 전에 결정합니다.'},
 {id:'report',selector:'.month-report',fallback:'.header-nav a[href="#journal"]',title:'수행 보고를 읽고 다음 달을 고칩니다.',body:'첫 달 이후 “지난달 수행 보고”를 펼쳐 합의한 일정과 실제 수행을 비교하세요. 연구 기록에는 면담·성과와 월별 저장점이 남습니다. 지도 종료 뒤에는 메일함에서 편지와 CV를 다시 볼 수 있습니다.'}
];
export function initialScreenGuide(){return {version:1,seen:false,runKey:null,step:0,status:'unseen'};}
export function validScreenGuide(p){return p&&p.version===1&&typeof p.seen==='boolean'&&(p.runKey===null||typeof p.runKey==='string'&&/^\d{1,10}$/.test(p.runKey))&&Number.isInteger(p.step)&&p.step>=0&&p.step<SCREEN_GUIDE_STEPS.length&&['unseen','available','active','skipped','complete'].includes(p.status);}
export function screenGuideForRun(progress,state,{newRun=false}={}){
 const p=validScreenGuide(progress)?{...progress}:initialScreenGuide();
 if(!state.started)return p;
 const runKey=String(state.creationSeed??state.seed);
 if(p.runKey===runKey)return p;
 return {...p,runKey,step:0,status:newRun&&!p.seen?'active':'available',seen:true};
}
export function moveScreenGuide(progress,action){
 const p=validScreenGuide(progress)?{...progress}:initialScreenGuide();
 if(action==='start')return {...p,step:0,status:'active',seen:true};
 if(action==='skip')return {...p,status:'skipped',seen:true};
 if(action==='back')return {...p,step:Math.max(0,p.step-1)};
 if(action==='next')return p.step===SCREEN_GUIDE_STEPS.length-1?{...p,status:'complete',seen:true}:{...p,step:p.step+1};
 return p;
}

const ENGLISH_GUIDE=[
 ['One student, eight years, many possible futures','Guide a student through learning, research and graduation, then discuss their next step. Advising meetings, branching events, papers, conferences, faculty responsibilities and funding shape the story. Letters and a CV preserve your shared record. No specialist problem solving is required; comments and reports offer clues.'],
 ['Three menus organize the dashboard','My lab contains this month’s plan. Records contains progress, achievements and saved checkpoints. Alumni contains letters and CVs after advising ends.'],
 ['Agree on the weekly plan','The student’s proposal is a suggestion. Use Agreed schedule to choose the actual activity for each week. Fixed conference weeks are locked. Pay attention to energy and rest requests.'],
 ['Allocate your faculty workload','Click the square blocks to allocate effort across four responsibilities. Stay within this month’s credit limit. Protect areas that are declining before they remain depleted.'],
 ['Adjust stipends and research expenses','Open Adjust faculty workload & lab budget. Stipend allocations change each September. Research supplies and project support can change every month. Experiment and analysis weeks affect costs by field; baseline maintenance remains. The stipend reserve is restricted to student pay and cannot cover operations or debt.'],
 ['Apply for grants here','Select Apply for additional funding under Additional faculty activity. Calls open in March and September. Choose your role and award duration in Research grants & stipend reserve above. Selection and payment notices arrive after advancing the month, with annual installments afterward. Plan the next application before borrowing accumulates.'],
 ['Confirm to advance one month','If your funding runs out, an automatic departmental advance covers the shortfall; future funding repays it. Monthly interest and administrative strain apply. Additional borrowing for three consecutive months with debt above $25,000 closes the lab. Use warnings to plan costs and upcoming funding. If this button is unavailable, check workload totals and application eligibility. Rest requests are decided before the month starts.'],
 ['Review the report and adjust','After the first month, expand Last month’s report and compare the agreed plan with actual work. Records keeps meetings, achievements and monthly checkpoints. After advising ends, Alumni keeps letters and CVs.']
];
export function screenGuideSteps(locale='ko'){return locale==='en'?SCREEN_GUIDE_STEPS.map((step,i)=>({...step,title:ENGLISH_GUIDE[i][0],body:ENGLISH_GUIDE[i][1]})):SCREEN_GUIDE_STEPS;}
