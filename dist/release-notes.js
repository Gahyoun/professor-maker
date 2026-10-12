export const RELEASE_NOTES_VERSION='4.21.2';
export const RELEASE_NOTES_KEY='pm-update-notes-v1';
export const RELEASE_NOTES={title:'학생의 첫 질문에서 시작하는, 더 다양한 연구실.',changes:[
 '한국어판의 신규 입학 후보에 이름 107종·113종과 성씨 59종을 사용합니다. 기존 학생과 진행 중인 면접·기존 공유 코드의 이름은 유지합니다. 새 공유 코드도 같은 후보를 재현합니다.',
 '북미판 새 입학 후보의 이름과 외형, 유학·이민 가정·편입 등 교육 배경을 다양하게 구성했습니다. 외형과 배경은 능력·성격·연구 성과에 영향을 주지 않습니다.',
 '학생을 고른 뒤 첫 면담은 “학생은 어떻게 생각해요?”라는 질문으로 시작합니다. 북미판도 학생의 생각을 먼저 듣는 장면으로 이어집니다.',
 '현실 모드에도 첫 24개월 정착지원을 추가했습니다. 필수 지출 부족분에 월 최대 150만원·총 1,500만원을 지원하며, 부족액 자동 차입과 예산 조절은 유지합니다.',
 '오른쪽 위에 30분 포털 접속 시간과 연장 버튼을 추가했습니다. 시간이 끝나면 자동 로그아웃을 연출하고, 저장한 게임은 다시 접속해 이어 갑니다.',
 '북미판 주별 수행 결과의 달성률·교과 학습 설명과 주차 표기의 번역 누락을 수정했습니다. GitHub·로컬판의 분석 기록은 기기 저장, Sites판은 동의한 분석 기록만 서버 전송한다는 안내를 명확히 했습니다. 게임 진행 저장은 두 버전 모두 기기 내에 남습니다. 연구실 소파를 바닥 축에 맞춰 고치고 앞면을 열었습니다. 쿠션·팔걸이·다리와 앉은 학생의 높이도 맞췄습니다. 모바일 첫 화면 안내를 줄이고, 긴 업무 배분 영역의 가이드는 본문에 배치해 조절 버튼을 가리지 않게 했습니다. 연구실 그림·수학 출판 속도·미클리어 조건 안내와 A4 CV·16:9 모니터는 유지합니다.'
]};
export const validReleaseNotesSeen=value=>Array.isArray(value)&&value.length<=20&&value.every(v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v));
export function markReleaseNotesSeen(seen,version=RELEASE_NOTES_VERSION){return [...new Set([...(validReleaseNotesSeen(seen)?seen:[]),version])].slice(-20);}
