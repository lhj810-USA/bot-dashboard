# AI 인사이트 루틴 프롬프트 (하루 2회 · Grok Bot 에이전트)

이 문서는 7AM/6PM 루틴 에이전트가 JARVIS의 **AI 제안·추천·재미**를 만들 때 따르는 규칙이다.
개인 데이터는 박스 안에서만 읽고, 결과는 `secrets/ai-insights.json`(비공개)에만 쓴다. 저장소에는 암호화된 payload만 올라간다.

## 순서
1. 평소대로 수집 단계를 실행한다 (collected.json 갱신, collect-extra / collect-grok-memory / collect-photos).
2. `python3 scripts/ai-insights.py` 실행 → 규칙 기반 기본본 생성 (근거 필드·추정 라벨 포함).
3. 에이전트 보강(선택, 권장): 아래 입력을 읽고 `secrets/ai-insights.json`의 `agent` 필드만 추가/교체한다.
   - 입력: `collected.json`(finance, events, mailx.school, calendar, sideIncome, reco), `patterns.json`, `grok-memory.json`, `photos-meta.json`(메타만, 이미지 X), `fun.json`, `market.json`, `extra-info.json`, 그리고 같은 파일의 기본 `suggestions`.
   - 출력 형식:
     ```json
     "agent": {"at": "YYYY-MM-DDTHH:MM-06:00",
               "briefing": ["한 줄 3~4개, 혁진님 호칭, 숫자는 근거 데이터 그대로"],
               "picks": [{"cat":"money|family|english|invest|future|side|fun","title":"…","body":"…","src":["finance.byCategory[식비]"],"est":true,"go":"cat:식비"}]}
     ```
4. `scripts/build-payload.py` 실행 (aiInsights 가 암호화 payload 에 포함됨) → 퍼블리시 루프가 push.

## 규칙
- 모든 항목에 `src`(근거 필드 경로) 필수. 계산·예측·분류 추정은 `est:true` + 문장에 "추정".
- 금융 항목엔 "금융 조언 아님". 부업·수입 항목엔 L-1 비자 제약(미국 내 별도 고용·자영 제한 가능, 전문가 확인) 문구.
- 주말·가족 제안은 Cedar Park 기준 100km 이내 행사(Event 알림봇 메일)와 주말 예보를 함께 본다. 아이(초등) 친화 우선.
- 영어 제안은 반도체·비즈니스 실무 표현, 영어 표현 노트 시트와 연결.
- 투자 제안은 시세 관찰·학습 중심(보유 계좌 미연결), 레버리지·실전 자동매매는 모의 검증 우선.
- 재미: 1년 전 이맘때 사진(메타), 역사 속 오늘, 관심사(자동매매·반도체·우주·여행) 연결 사실.
- 금지: 비밀번호·접근 코드·계좌번호·정확한 집 주소·신분 서류·X 핸들을 출력에 쓰지 않는다. 외부 AI API로 개인 데이터를 보내지 않는다(에이전트 자신의 추론만 사용).
