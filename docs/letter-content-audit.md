# 편지 자동 삽입 검토

게임 4.15.4 · 실제 종료 기록 32개

원본 시뮬레이션 종료 상태는 수정하지 않고, 편지 생성과 수집 순서만 다시 적용했습니다. 합성 종료 상태를 섞지 않습니다.

| 검사 | 결과 |
|---|---:|
| 자동 삽입 총수 | 42 |
| 사용한 서로 다른 문장 ID | 29 |
| 편지 한 통의 ‘기억합니다’ 최대 | 1 (이전 4) |
| 인계 기록 회상 래퍼 | 0 |
| 미완성 ‘교수님도’ / 맺음말 | 0 / 0 |
| ‘다음에’ 약속 중복 편지 | 0 |
| dry 회상에 wet 어휘 | 0 |
| 고급 연구 경력에 newcomer 구문 | 0 |
| close 기업 엔딩의 어긋난 거리 표현 | 0 |
| 0개 예산 엔딩의 자동 삽입 | 0 |
| 선택됐으나 보이지 않는 삽입 | 0 |
| 동일 삽입 문장의 최대 반복 | 4 |

close 최대 2개, reserved 최대 1개, distant 및 휴학·중단·운영 종료·미완·유튜버·제적은 0개입니다. 회상과 스탯 구문이 같은 예산을 공유하며 요청 또는 다음 계획 앞에만 들어갑니다. true·postdoc·institute에서는 newcomer·recovery 태그를 제외하고, 교내 연구직에서도 newcomer를 제외합니다. dry 회상에는 ‘장비’, ‘시료’, ‘배양’을 넣지 않습니다.

미노출 ID를 먼저 고르며 이미 선택한 ID는 편지에 고정합니다. 기존 보관함은 오래된 편지부터 이관하고, 읽은 ID는 편지 보관 한도와 별도로 유지합니다. 모든 후보를 읽으면 반복을 허용하므로 중복 자체를 영구적으로 없애는 규칙은 아닙니다.

## 남은 삽입 중복

- 4회: 원고를 읽을 때는 결론이 어디까지 성립하는지부터 표시합니다. 그 선을 분명히 해야 다음 질문도 보입니다.
- 4회: 예상과 다른 그래프도 함께 놓고 원자료부터 확인했던 시간을 기억합니다.
- 4회: 어떤 진로든 제가 원하는 생활을 먼저 생각해 보라고 하셨던 면담을 기억합니다.
- 3회: 제 질문으로 시작한 작은 검증을 믿고 맡겨 주셨던 일을 기억합니다.
- 2회: 잘한 점과 보완할 점을 따로 짚어 주셨던 메모가 아직 남아 있습니다.
- 2회: 좋아 보이는 결과일수록 다른 설명이 가능한지 먼저 살핍니다. 동료에게도 결론보다 확인 과정을 보여 주려 합니다.

## 샘플별 검사

| 엔딩 | 이름 | 관계 | 삽입 | 기억합니다 |
|---|---|---|---:|---:|
| unemployed | 김승현 | distant | 0 | 0 |
| unemployed | 이지훈 | distant | 0 | 0 |
| unemployed | 최지원 | distant | 0 | 0 |
| corporate | 이동현 | close | 2 | 1 |
| corporate | 박성민 | close | 2 | 0 |
| corporate | 최지은 | close | 2 | 0 |
| resident_researcher | 정유진 | close | 2 | 1 |
| resident_researcher | 이수빈 | close | 2 | 1 |
| resident_researcher | 김지영 | close | 2 | 0 |
| institute | 김민수 | distant | 0 | 0 |
| institute | 김유진 | close | 2 | 1 |
| institute | 정지혜 | close | 2 | 1 |
| unrelated | 이성현 | distant | 0 | 0 |
| unrelated | 조성민 | reserved | 1 | 1 |
| unrelated | 최재현 | distant | 0 | 0 |
| dismissed | 김성민 | reserved | 0 | 0 |
| bachelor | 정지혜 | close | 2 | 0 |
| gameover | 김성현 | distant | 0 | 0 |
| leave | 박지혜 | close | 0 | 0 |
| postdoc | 이준영 | close | 2 | 1 |
| postdoc | 박은지 | reserved | 1 | 1 |
| postdoc | 이준영 | close | 2 | 1 |
| true | 김승현 | close | 2 | 1 |
| true | 박재현 | close | 2 | 1 |
| true | 최지현 | close | 2 | 0 |
| masters | 김은지 | close | 2 | 1 |
| startup | 최지원 | close | 2 | 0 |
| true | 이지현 | close | 2 | 1 |
| true | 이지영 | close | 2 | 1 |
| true | 김지원 | close | 2 | 1 |
| true | 김지원 | close | 2 | 0 |
| youtuber | 최승현 | reserved | 0 | 0 |

[32개 전체 텍스트](letter-content-samples.md) · [검사 데이터](letter-content-audit.json)

재생성: `node scripts/build-ending-review.mjs`, `node scripts/letter-content-audit.mjs`. 이전 비교는 `LETTER_BASELINE_ROOT`에 v4.14.0 체크아웃을 지정한 경우만 계산합니다.
