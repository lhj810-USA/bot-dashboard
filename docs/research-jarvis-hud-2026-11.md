# JARVIS-style HUD research (2026-11)

메모만. 개인 정보 없음. v17 설계에 참고한 공개 레퍼런스.

## Looked at

- [Dix01/JARVIS](https://github.com/Dix01/JARVIS) — 풀스크린 홀로그램 커맨드 센터. Arc reactor, 음성에 반응하는 링, 부트 시퀀스, 패럴랙스, Three.js. 강점: “채팅창이 아니라 창 관리자”라는 느낌. 약점: 데스크톱/로컬 GPU 전제, 모바일 PWA에는 무거움.
- [Aniketh0/Jarvis-UI-2.0](https://github.com/Aniketh0/Jarvis-UI-2.0) — SVG 아크 리액터, 입자, 오디오 파형, 점묘 세계지도, 모드별 색. 강점: 살아 숨 쉬는 OS 레이어. 약점: 텔레메트리·AI 사고 과정이 장식인 경우가 많음.
- [Debddj/project-jarvis](https://github.com/Debddj/project-jarvis) — 음성 입출력, 대화 기억, 부트 시퀀스, Gemini 연동. 강점: 실제 대화. 약점: 개인 데이터를 클라우드 LLM에 보냄.
- [Davood121/jenman](https://github.com/Davood121/jenman) — Jayse Hansen / Perception HUD Bible 스타일, 시안 홀로그램, 스캔라인, 레티클. 강점: 영화적 밀도. 약점: 대부분 시뮬레이션 수치.
- [Kralpasa81/jarvis-dashboard-ui](https://github.com/Kralpasa81/jarvis-dashboard-ui) — 정적 프로토타입, 중앙 리액터와 카드. 안전 규칙(비밀·개인정보 커밋 금지)은 그대로 따름.
- 공통 클리셰: 부트 로그, 가짜 CPU 게이지, “시스템 온라인” 문구, 내용 없는 지구본.

## What we adopt (and do better)

- 숨 쉬는 코어, 데이터·음성에 반응하는 입자/신경망, 말할 때 파형. 모바일은 30fps 제한, 탭 숨김 시 정지, `prefers-reduced-motion`이면 정지 프레임.
- 손수 만든 캔버스 지구본(외부 3D 라이브러리 없이 오프라인 동작). 핀은 실제 좌표: 홈 도시, 서울, 거래소, USGS 지진, 뉴스 권역.
- 세계 정세는 공개 헤드라인을 권역별로 묶은 인용 요약. 지어낸 “분석”은 하지 않음.
- 관심 영상 벽과 이색 카드는 썸네일 그리드, 앱 안 재생.
- 비서는 로컬 규칙·검색. 개인 데이터를 제3자 LLM에 보내지 않음. 시간대·날씨·돈·일정·패턴으로 먼저 인사하고, 질문 기억과 “JARVIS가 눈치챈 것”을 남김.
- 홈은 3초 가독성을 유지하고, 새 세계는 궤도 런처로만 연다. 가짜 텔레메트리는 넣지 않음.

