# 편지 자동 삽입 검토

게임 4.15.3 · 실제 종료 기록 32개

원본 시뮬레이션 종료 상태는 수정하지 않고, 편지 생성과 수집 순서만 다시 적용했습니다. 합성 종료 상태를 섞지 않습니다.

| 검사 | 결과 |
|---|---:|
| 자동 삽입 총수 | 38 |
| 사용한 서로 다른 문장 ID | 31 |
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

- 4회: [회상] 예상과 다른 그래프도 함께 놓고 원자료부터 확인했던 시간을 기억합니다.
- 2회: [회상] 제 질문으로 시작한 작은 검증을 믿고 맡겨 주셨던 일을 기억합니다.
- 2회: 논문을 읽으면 주장과 그것을 뒷받침하는 근거를 따로 정리합니다. 결론만 읽었을 때는 보이지 않던 다음 질문이 그 사이에서 나옵니다.
- 2회: 방법을 고를 때는 정확도뿐 아니라 필요한 자료와 계산 시간도 함께 적습니다. 더 복잡한 방법이 언제 도움이 되는지 설명할 수 있어야 합니다.
- 2회: 새 방법을 검토할 때는 기존 방법과 같은 자료로 비교합니다. 무엇이 달라졌는지 제 말로 설명할 수 있어야 선택할 수 있습니다.

## 샘플별 검사

| 엔딩 | 이름 | 관계 | 삽입 | 기억합니다 |
|---|---|---|---:|---:|
| dismissed | 정지은 | close | 0 | 0 |
| institute | 정성현 | close | 2 | 1 |
| institute | 이수빈 | close | 2 | 0 |
| institute | 정지혜 | close | 2 | 1 |
| resident_researcher | 정지현 | close | 2 | 1 |
| resident_researcher | 김준영 | close | 2 | 0 |
| resident_researcher | 김재현 | close | 2 | 1 |
| unrelated | 이성현 | distant | 0 | 0 |
| unrelated | 조성민 | distant | 0 | 0 |
| unrelated | 윤지은 | distant | 0 | 0 |
| corporate | 김지혜 | close | 2 | 1 |
| corporate | 최지은 | close | 2 | 1 |
| corporate | 김지현 | close | 2 | 1 |
| startup | 최유진 | close | 2 | 0 |
| startup | 최승현 | close | 2 | 0 |
| startup | 박지혜 | close | 2 | 1 |
| bachelor | 정지혜 | close | 2 | 1 |
| unemployed | 김승현 | distant | 0 | 0 |
| unemployed | 이지훈 | distant | 0 | 0 |
| unemployed | 최지원 | distant | 0 | 0 |
| postdoc | 김지은 | reserved | 1 | 0 |
| postdoc | 박은지 | close | 2 | 0 |
| postdoc | 이준영 | reserved | 1 | 0 |
| leave | 박지혜 | reserved | 0 | 0 |
| gameover | 김민수 | distant | 0 | 0 |
| youtuber | 정은지 | reserved | 0 | 0 |
| youtuber | 박동현 | reserved | 0 | 0 |
| youtuber | 김동현 | reserved | 0 | 0 |
| true | 박성민 | close | 2 | 1 |
| true | 박민수 | close | 2 | 1 |
| true | 이지훈 | close | 2 | 1 |
| masters | 김은지 | close | 2 | 1 |

[29개 전체 텍스트](letter-content-samples.md) · [검사 데이터](letter-content-audit.json)

재생성: `node scripts/build-ending-review.mjs`, `node scripts/letter-content-audit.mjs`. 이전 비교는 `LETTER_BASELINE_ROOT`에 v4.14.0 체크아웃을 지정한 경우만 계산합니다.
