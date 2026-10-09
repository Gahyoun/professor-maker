# Professor Maker

한 사람의 연구자, 여덟 번의 봄. 교수의 입장에서 한 명의 학생을 지도하고 연구실을 운영하는 한국어 경영·육성 시뮬레이션입니다.

[플레이하기](https://gahyoun.github.io/professor-maker/)

교수의 성별·연령·연구 분야·학교 유형을 선택하고, 매달 면담에서 학생이 제안한 네 주의 일정을 조정합니다. 학부연구생에서 석사·박사 또는 석박사통합과정으로 이어지며, 연구성과와 관계에 따라 진로와 후일담이 달라집니다. 정상 엔딩에서는 함께한 연구와 추억을 CV로 보관할 수 있습니다.

웹과 모바일을 지원하며 첫 방문 후 오프라인에서도 플레이할 수 있습니다. 저장 데이터는 사용하는 브라우저에 남고, JSON 파일로 내보내 다른 기기로 옮길 수 있습니다. 현재 한국어판이며 영어판은 추후 확장합니다.

## 개발

Node.js 24 이상으로 테스트합니다. 별도 npm 패키지는 필요하지 않습니다.

```sh
npm test
python3 -m http.server 4173 --directory dist
```

브라우저 검증은 Playwright가 설치된 환경에서 `PLAYWRIGHT_MODULE`을 지정하고 `node tests/browser-smoke.mjs`를 실행합니다.

`main`에 반영하면 GitHub Actions가 테스트 후 `dist`를 Pages에 배포합니다. 릴리스는 의미적 버전과 Git 태그로 구분하며 변경 내역은 [CHANGELOG](CHANGELOG.md)에 기록합니다. 저장 형식 버전과 배포 버전은 별도로 관리합니다.

운영자용 밸런스 문서와 아키텍처, 제공받은 원본 연구 데이터는 공개 게임 배포에 포함하지 않습니다.

## 제작 및 참고

기획·원작 편지: Gahyoun Gim. 네트워크 과학 연구실을 소재로 한 독립 창작 게임입니다. 경상국립대학교 홈페이지의 색상과 서체 구성을 참고하며 학교 로고는 사용하지 않습니다.

시간과 선택의 흐름은 [80억 분의 1](https://1in8b.life/ko/), 연구 진행과 사건 구조는 [PhD Simulator](https://research.wmz.ninja/projects/phd/index.html)와 [phd-game](https://github.com/morriswmz/phd-game)을 참고했습니다. 참고 게임의 코드와 대사는 복사하지 않았습니다. 학위 목표와 경영 효과는 게임 규칙이며 실제 대학의 공통 규정이 아닙니다.

## 라이선스

게임 코드·창작 콘텐츠·로고: **GNU GPL v3** ([LICENSE](LICENSE)). 폰트 SUITE와 Noto Sans KR은 동봉된 SIL Open Font License를 따릅니다. 저작권 © 2026 Gahyoun Gim.
