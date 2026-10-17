# 봇 요약 대시보드

봇 7개와 오토메이션 현황을 한 페이지에서 보는 한국어 다크 테마 PWA.

- **공개 URL (GitHub Pages, 정적):** https://lhj810-USA.github.io/bot-dashboard/
- **로컬 서버 (박스 내부):** http://localhost:8787 (`server.py`, 명령 대기열 + Web Push API)

## 보안
- 공개 저장소에는 **암호문(payload.enc.json)만** 올라간다. AES-256-GCM 암호화를 쓰고, 키는 접근 코드에서 PBKDF2-SHA256(310,000회)으로 만든다. 접근 코드는 `/workspace/bot-dashboard-secrets/passcode`(600 권한, 저장소 밖)에 있다.
- 페이지를 열면 잠금 화면이 나온다. 접근 코드를 입력하면 브라우저 안에서 복호화한다. '이 기기 기억'을 켜면 코드를 localStorage에 저장한다.
- data.json과 status/*.json은 git에서 제외했다. (주의: 이전 커밋 기록에는 봇 설명과 상태 요약 평문이 남아 있다.)

## 데이터
- 봇: `scripts/update-data.py`가 profile.json과 `status/<id>.json`을 합쳐 data.json(로컬 전용)을 만든다. 형식은 status/README.md에 있다.
- 연결 데이터(금융·메일·일정·문서·개발): 커넥터는 에이전트 도구로만 호출할 수 있어서, 에이전트가 수집한 스냅샷을 `/workspace/bot-dashboard-secrets/collected.json`에 저장해 쓴다. 갱신하려면 에이전트에게 "JARVIS 연결 데이터 갱신"을 요청하거나 같은 내용의 정기 루틴을 만든다.
- `scripts/build-payload.py`: 브리핑 3줄, 8개 섹터, 봇 정보를 묶어 암호화한다. `scripts/publish-loop.sh`는 5분마다 실행되고, 내용이 바뀌었을 때만 push한다.

## 명령 / 음성 / 푸시
- 명령: 로컬 서버에서는 대기열(commands-queue.json)에 저장된다. 봇에 자동으로 전달되지는 않는다. Pages에서는 클립보드에 복사된다.
- 음성: 🎤 버튼(Web Speech API, ko-KR). "집사, …"처럼 봇 이름을 먼저 말하면 그 봇이 선택된다. ▶ 버튼은 브리핑을 음성으로 읽어준다.
- 푸시: VAPID와 서버 코드는 준비되어 있다. 하지만 박스에서 외부 터널을 열 수 없어서 공개 페이지에서는 동작하지 않는다.
