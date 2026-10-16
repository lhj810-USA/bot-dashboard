# 봇 요약 대시보드

봇 7개와 오토메이션 현황을 한 페이지에서 보는 한국어 다크 테마 PWA.

- **공개 URL (GitHub Pages, 정적):** https://lhj810-USA.github.io/bot-dashboard/
- **로컬 서버 (박스 내부):** http://localhost:8787 (`server.py`, 명령 대기열 + Web Push API)

## 데이터
- `scripts/update-data.py`가 `/home/box/agent-data/agents/<id>/profile.json`을 읽기 전용으로 읽어 `data.json`을 만든다. 값이 없으면 `알 수 없음`.
- 박스의 봇 파일에 `lastTurnAt`과 status가 없어서 마지막 활동은 `알 수 없음`, 상태는 회색 `알 수 없음`으로 나온다. 대신 "로컬 데이터 수정" 시각(store.db 파일 수정 시각, CT)을 따로 표시한다.
- 페이지는 `data.json`을 불러오고, 실패하면 인라인 데이터를 사용한다. '새로고침' 버튼을 누르면 다시 불러온다(로컬 서버에서는 요청할 때마다 다시 생성). Pages 데이터 갱신: `python3 scripts/update-data.py && git commit -am data && git push`.
- 오토메이션: 자동화 트레이닝 (ea82d2ea-…) 비활성/아카이브. 표시만 한다.

## 명령 보내기
- 로컬 서버에 연결된 경우: `POST /api/command`가 `commands-queue.json`(git에서 제외)에 명령을 추가한다. **봇에게 자동으로 전달되지는 않는다.** 대기열에 기록만 된다.
- 정적 Pages: 명령을 클립보드에 복사한다. Grok Bot 앱에서 해당 봇에게 붙여넣어 보내야 한다.

## PWA / 푸시
- manifest, 아이콘(192/512, apple-touch-icon), 서비스 워커(앱 셸 캐시, push 핸들러)를 포함한다.
- VAPID 키는 `/workspace/bot-dashboard-secrets/`에 저장된다(저장소 밖, 600 권한). 구독 정보도 같은 곳에 저장된다.
- `server.py`의 watcher가 60초마다 데이터를 다시 만들고, 상태나 lastTurnAt이 바뀌면 푸시를 보낸다. 엔드포인트: `GET /api/vapid`, `POST /api/subscribe`, `POST /api/test-push`.
- **제한:** 이 박스는 외부로 나가는 터널 연결(cloudflared 7844, SSH)이 차단되어 있어 서버를 공개 HTTPS로 노출할 수 없다. 그래서 Pages 버전의 '알림 허용'과 '테스트 알림'은 지금 동작하지 않는다. 공개 HTTPS 서버를 마련한 뒤 `scripts/set-api-base.sh https://…`로 `config.js`를 설정하고 push하면 동작한다.
- 푸시 활성화 방법(서버가 공개된 뒤): iPhone은 iOS 16.4 이상 → Safari에서 열기 → 공유 → 홈 화면에 추가 → 홈 화면 아이콘으로 열기 → '알림 허용'. Android Chrome은 메뉴에서 앱 설치 → '알림 허용'.

## 실행
```
/workspace/bot-dashboard-venv/bin/python server.py   # PORT=8787
```
Grok Build CLI(`grok`)는 박스에 없고 npm에서도 찾을 수 없어, 빌드 단계 없는 정적 프로젝트로 만들었다.
