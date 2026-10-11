export const RELEASE_NOTES_VERSION='4.20.0';
export const RELEASE_NOTES_KEY='pm-update-notes-v1';
export const RELEASE_NOTES={title:'미국 학사 일정에 맞춘 영어판을 열었습니다.',changes:[
 'English U.S. Edition을 별도 주소에서 시작할 수 있습니다. 9월 시작, 가을·봄 학기, 여름 연구 일정, 달러 예산과 4.0 학점제 입학 면접을 반영했습니다. 한국어판과 진행 저장은 분리됩니다.',
 '전공별로 연구 검증과 출판 속도를 구분했습니다. 수학은 증명과 심사에 더 시간이 필요하며, 해당 전공의 학위·엔딩 요건도 함께 조정했습니다.',
 '미클리어 후일담을 누르면 달성 조건과 필요한 선택 시점을 볼 수 있습니다. 이미 얻은 편지와 연구 기록은 그대로 보관합니다.',
 'CV 파일에 해당 플레이의 연구실 그림과 한글 글꼴을 포함합니다. 인쇄·PDF는 A4 CV 양식으로 학력, 논문, 발표와 수상을 정리합니다.',
 '학회장을 강의실·컨벤션·포스터·호텔 홀로 구분했습니다. 연구실·엔딩 그림의 크기를 고정하고, 모니터는 16:9로 맞췄습니다.',
 '첫 화면에서 자동 차입과 이자·운영 부담, 인건비·소모품 예산 조절, 과제 신청과 저장·기록 메뉴를 안내합니다. 모바일에서도 안내가 버튼을 가리지 않도록 점검했습니다.'
]};
export const validReleaseNotesSeen=value=>Array.isArray(value)&&value.length<=20&&value.every(v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v));
export function markReleaseNotesSeen(seen,version=RELEASE_NOTES_VERSION){return [...new Set([...(validReleaseNotesSeen(seen)?seen:[]),version])].slice(-20);}
