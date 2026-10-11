export const RELEASE_NOTES_VERSION='4.18.0';
export const RELEASE_NOTES_KEY='pm-update-notes-v1';
export const RELEASE_NOTES={title:'연구실 운영과 첫 플레이를 다듬었습니다.',changes:[
 '연구비 부족액은 자동 차입하고, 과제 지원을 늘렸습니다. 선정과 실제 입금은 좋은 소식으로 알려드립니다.',
 '운영 종료 원인과 학과장 사전 경고, 쉬움 난도의 정착지원을 더했습니다. 학생의 휴식도 먼저 의논합니다.',
 '입학면접에서 세 지원자 중 한 명을 선택합니다. 학생 공유 코드와 목표·메뉴를 알려 주는 첫 화면 가이드를 더했습니다.',
 '전공별 연구비 지출을 구분하고, 해외 연구년 중에는 국내학회에 학생만 참석하도록 고쳤습니다.',
 '긴머리의 뒷목과 앞머리, 팔·의자·침대의 겹침을 점검하고 연구실 도트를 보수했습니다.'
]};
export const validReleaseNotesSeen=value=>Array.isArray(value)&&value.length<=20&&value.every(v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v));
export function markReleaseNotesSeen(seen,version=RELEASE_NOTES_VERSION){return [...new Set([...(validReleaseNotesSeen(seen)?seen:[]),version])].slice(-20);}
