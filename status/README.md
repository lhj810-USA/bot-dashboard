# 봇 상태 보고 방법 (JARVIS 대시보드)

각 봇은 Shell(공유 박스)로 아래 파일 **하나**를 덮어쓰면 된다:

    /workspace/bot-dashboard/status/<내 봇 ID>.json

스키마:
```json
{
  "status": "idle | working | error",
  "updatedAt": "ISO 8601 시각, 예: 2026-10-15T20:55:00-05:00",
  "summary": "한 줄 요약 (120자 이내)",
  "metrics": { "balance": 1234.5, "pnl": -12.3, "alerts": 0 },
  "stages": ["분석", "실행", "보고"],
  "stage": "실행"
}
```
- `stages`(작업 단계 목록)와 `stage`(지금 단계, stages 중 하나)는 선택 항목이다. HUD에 `분석→실행→보고`처럼 표시하고 현재 단계를 강조한다.
- `metrics`는 생략할 수 있다. 숫자는 실제 값만 넣고, 모르면 키를 빼라(추정 금지). balance/pnl은 자본 봇만 넣는다. 자본 봇들의 값을 합산해 HUD 중앙에 표시한다.
- 5분마다 반영된다(`scripts/publish-loop.sh` → data.json → GitHub Pages). 이 파일들은 박스에만 있고, 웹에는 암호화(AES-GCM)된 payload.enc.json으로만 올라간다. 그래도 비밀번호나 키 같은 비밀은 넣지 마라.

예시 (Shell 한 줄, 봇 ID 바꿔서):
```sh
python3 -c 'import json,datetime;json.dump({"status":"idle","updatedAt":datetime.datetime.now().astimezone().isoformat(timespec="seconds"),"summary":"BTC 감시 중, 이상 없음","metrics":{"alerts":0}},open("/workspace/bot-dashboard/status/173243fe-b09d-49c5-9541-2dbaff3b72d6.json","w"),ensure_ascii=False)'
```

봇 ID: 총괄 927a7b6f-fb9c-4669-8bc9-cf48f34f70b6 · 감시자 173243fe-b09d-49c5-9541-2dbaff3b72d6 · 영어공부 c16480ab-9b7e-4832-9edc-b6a27ff82899 · Event 알림 61c15c0d-aeeb-488f-99bf-88878e64b446 · 대장 c134c704-d944-4fbb-8f13-b6d70c4d75f8 · 아르바이트 92919409-9721-49b6-b150-79aaee08b3a2 · 실험 ec952ea5-d6ba-48db-8957-34895ac75c50 · 집사 c8f69e15-9014-4347-b118-d63b3ec13b29
