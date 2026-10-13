# CV 연구실 기록 검수 — 4.16.0

## 구현

- 새 CV의 선택 필드 `labScene`에 지도 종료 당시 연구실 이미지를 한 번 저장한다. 장면 월은 `Math.max(0, state.month - 1)`이며, 진행 중 면담은 제거하고 정지 장면으로 만든다.
- 전공 장비, 실제 소모품 수준, 의자, 화분, 창밖 계절, 기존 수상증서를 원래 연구실 렌더러에서 가져온다. 학생 도트는 CV 장면에서 생략한다. 시뮬레이션 RNG, 성장·비용·논문 값, CV의 기존 기록과 날짜는 바꾸지 않는다.
- 이미지와 전공·Wet/Dry·지도 종료월을 전체 논문 목록 앞에 표시한다. 첫 페이지 요약 밖에 배치하여 요약 분량을 유지한다.
- 화면, 독립 HTML, PDF, 재로드 및 JSON 가져오기·내보내기가 저장된 동일 이미지를 사용한다. 이전 CV v1–v3에 이미지가 없으면 임의로 추가하지 않는다.

## 저장 형식과 입력 검증

- 이미지 모델은 `version`, `month`, `fieldId`, `labMode`, `image` 다섯 필드만 받는다. CV 전공명과 장면 전공, 종료월, 해당 전공에서 허용된 연구실 모드를 함께 검사한다.
- 생성 장면은 `data:image/svg+xml,`에 정규화된 SVG를 저장한다. `%`, `#`, CR/LF/TAB은 두 자리 대문자 hex로 escape한다. 이전 canonical base64 이미지는 계속 받을 수 있다.
- 마크업은 `img`의 escape된 `src` 속성에만 들어간다. 가져온 SVG를 DOM의 HTML로 삽입하지 않는다. 독립 HTML도 `img-src data:` 안에서 같은 이미지를 표시한다.
- 단일 SVG 루트, 정해진 600×360 크기, 정적 도형 태그·속성, 유한한 좌표 및 깊이·노드·문자 길이 상한을 검사한다. 이벤트 속성, CSS, 외부 참조, `script`, `foreignObject`, `image`, `use`, DOCTYPE, 주석, 처리 명령을 거부한다.
- XML entity 대소문자, 잘못된 hex prefix, 비정상 Unicode, 잘못된 percent escape, 비정규 표현, 원시 URL delimiter도 회귀 검사한다.

## 용량·시각 검증

아래는 `tests/cv-lab-scene-ui-smoke.mjs`의 마지막 실제 Chromium 실행 결과다. 사용자 브라우저와 저장을 사용하지 않는 별도 context에서 검사했다.

| 항목 | 결과 |
| --- | --- |
| 전공·모드·장식 seed·계절·풍부한 소모품·수상증서 최대 탐색 | 1,408개 장면 검사, 최대 이미지 URI 43,939자 |
| 풍부한 실제 기록 fixture | 실제 corpus의 501개 history, 논문·통계·회상과 최대 장면을 40개 CV에 조합 |
| 40개 보관함 | 4,455,624 UTF-16 bytes |
| 현재 상태 + 동일 기록의 이전 v3 상태 + 설정·회상 키 포함 | 5,038,548 UTF-16 bytes; 실제 localStorage 저장·재로드 성공 |
| 실제 pretty JSON export | 2,851,881 UTF-8 bytes; 재가져오기 성공 |
| 원본 SVG와 압축 이미지 10개 canvas 비교 | 평균 RGBA 채널 차이 0.0115–0.0159/255; 216,000 pixels 중 114–177개 변경 |
| 동일 압축 SVG의 base64/최소 escape URI 비교 | RGBA 차이 0 |
| 모바일·데스크톱 | 320/1360px, 이미지 decode·가로 넘침 없음 |
| 악성 SVG 가져오기 | 거부, 실행 없음, 기존 상태·보관함 유지 |
| quota 실패 가져오기 | 두 차례 gallery 쓰기 실패 후 기존 5개 키·메모리 상태·보관함·회상 ID·hash 복구; 성공 toast 없음 |

좌표 압축은 이진 부동소수점 잔여를 0.01px 단위로 정리한다. 다각형의 닫힌 시작점과 방향, 불필요한 그룹·기본 속성, 동일 속성의 연속 도형 표현을 줄이며 레이어 순서를 유지한다. 보관함 fixture의 전공명은 최대 장면과 일치시켜 모델 유효성을 검사한다. 이 용량 fixture는 게임 기록을 진행·수정하는 정책으로 쓰이지 않는다.

## 출력·인쇄

실제 A4 본문 폭 703px에서 다섯 요약의 높이는 timeline 816.7px, ledger 930.1px, folio 857.9px, dossier 703.8px, notebook 993.6px다. 12mm 여백의 A4 본문 높이 안에 들어간다. 실제 PDF 첫 페이지에서 요약·footer가 끝나고 두 번째 페이지에서 연구실 기록과 전체 논문 목록이 시작하는 PNG를 생성했다.

검증 산출물 디렉터리: `../outputs/pm4160-cv-lab-scene-root-qa/`

- `report.json`: 상세 측정값
- `lab-record-320.png`, `lab-record-1360.png`: 화면 장면
- `frozen-cv.html`, `frozen-cv.pdf`: 자체 완결된 export
- `cv-{timeline,ledger,folio,dossier,notebook}.pdf`: 5개 인쇄 템플릿
- `cv-{ledger,folio,dossier,notebook}-page-01.png`, `-02.png` 및 `cv-timeline-page-1.png`, `-2.png`: 실제 1–2페이지 렌더
- `rich-40-save.json`: 용량·가져오기 fixture

최종 runtime 전체 351개 unit test와 76개 asset build 검증은 root에서 통과했다. CV 전용 22개 unit 및 위 브라우저 smoke도 통과했다. 소스 동결 후 추가 runtime 변경은 없다.
