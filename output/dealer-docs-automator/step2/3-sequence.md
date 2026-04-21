# 3. 상호작용 시퀀스

> 주요 유저스토리·유저플로우별 에이전트 협력 시퀀스 + 프롬프트 전략.
> 근거: `references/02-langchain.md` §4 "Tool 바인딩 + 메모리", `references/05-mas-langgraph.md` §6 "병렬 에이전트 오케스트레이션"

---

## 대표 시퀀스 3종

### SEQ-1. Green Path (신규 개통 정상)

```
[고객] --(개통요청)--> [영업사원] --(단말 스캔)--> [UI]
                                                     |
                                                     v
                                               [Orchestrator]
                                                     |
                             ┌───────────────────────┼───────────────────────┐
                             v                        v                        v
                       [IDV+] (<=1.5s)         [RegGuard] (<=1.2s)       [Fraud Scorer] (<=1.8s)
                             |                        |                        |
                             └───────────────────────>JOIN<───────────────────┘
                                                     |
                                                     v
                                              verdict=GREEN
                                                     |
                                              [AutoDoc] -> PDF 3종
                                                     |
                                              [UI -> 전자서명] <--> [고객]
                                                     |
                                              [BSS_SUBMIT]
                                                     |
                                              접수번호 반환
                                                     |
                                              [Audit Logger]
```

**프롬프트 전략**:
- IDV+ · RegGuard · Fraud Scorer 프롬프트는 **동일 State 일부만 주입** (필요 필드만) → 프롬프트 캐시 재사용
- 각 에이전트 프롬프트 앞부분에 **공통 시스템 프롬프트**(규제·PII 마스킹 지침) → prefix 캐시
- 근거: [1]

---

### SEQ-2. Yellow Path (규정 경고 → 점장 승인)

```
[Orchestrator]
    |
    v
 verdict=YELLOW
    |
    v
[UI: 에스컬레이션 알림]  <-->  [영업사원]
    |
    v
[점장 단말 푸시]
    |
    v
[점장]
    |  [Manager 확인 UI]
    v
[Orchestrator: Yellow -> Green 전환]
    |
    v
[AutoDoc] -> (이하 Green Path와 동일)
```

**핵심**: 점장의 수동 확인이 State에 기록되며 감사 로그에 `approver_id`, `approval_reason`, `approval_ts` 저장. 근거: [2]

---

### SEQ-3. Red Path (사기 의심 차단)

```
[Orchestrator]
    |
    v
verdict=RED
    |
    v
[UI: 차단 알림] -> [영업사원]
    |
    v
[본사 리스크팀 푸시]  -->  [Risk Team]
    |
    v
[Risk Team] -- 차단 확정 --> [Orchestrator: TERMINATE + 블랙리스트 등록]
          또는
[Risk Team] -- 수동 승인 --> [Orchestrator: Yellow -> Green 전환]
                                  (수동 승인자·사유 감사 로그 필수)
```

**중요**: Red는 영업사원이 **우회할 수 없음**. 본사 리스크팀만 전환 가능. 근거: [2]

---

## 프롬프트 조립 전략 (공통 정적 → 에이전트별 정적 → 동적)

DMAP 표준에 따른 3단 프롬프트 구성 (prefix 캐시 최적화):

### 계층 1. 공통 정적 (모든 에이전트)
```
# 글로벌 행동 원칙
- PII 마스킹: 주민번호·전화·주소는 마스킹 후 전달받음
- 응답 형식: JSON schema 준수
- 환각 금지: 모르는 사실은 "unknown"으로 반환
- 감사 준비: 모든 판정은 근거 필수
```

### 계층 2. 에이전트별 정적 (AGENT.md + agentcard.yaml + tools.yaml 합친 결과)
- 각 에이전트 역할·금지액션·핸드오프·tools 선언

### 계층 3. 동적 (State 일부)
- 현재 개통 건의 필드 (마스킹 완료 상태)

### 조립 순서·예시
```
<계층1 공통 시스템 프롬프트>  ← 캐시 가능
<계층2 에이전트 AGENT.md>     ← 캐시 가능
<계층2 agentcard.yaml 요약>   ← 캐시 가능
<계층2 tools.yaml 추상 도구>  ← 캐시 가능
<계층3 State 입력>            ← 동적
```

근거: [1] §7 "Prompt Caching Best Practice"

---

## 시퀀스 관점 주요 관찰

| 관찰 | 설계 반영 |
|------|----------|
| 병렬 3 에이전트의 지연 편차가 결과 시각에 결정적 | JOIN에 2s 타임아웃, 부분 결과로 VERDICT 진행 |
| Yellow/Red 시 사람의 판단이 중요 | HITL 노드의 UI·알림 채널 이중화 (앱 푸시 + 음성) |
| Red 우회 방지 | 권한 분리 (영업사원은 Green, 점장은 Yellow, 리스크팀은 Red까지) |
| 감사 로그의 시점 엄격성 | JOIN/VERDICT/ESCALATE/SIGN 직후 즉시 로깅 (비동기라도 순서 보장) |

---

## 각주

[1]: `references/02-langchain.md` §4 "Tool 바인딩", §7 "Prompt Caching"
[2]: `references/05-mas-langgraph.md` §6 "병렬 에이전트 오케스트레이션", §7 "Human-in-the-Loop 패턴"
