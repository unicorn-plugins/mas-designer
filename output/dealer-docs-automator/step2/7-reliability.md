# 7. 에러·폴백·관측성·보안

> 실패 분류 · Retry/Circuit Breaker · Trace·Metric · PII 가드.
> 근거: `references/05-mas-langgraph.md` §8 "신뢰성 패턴", `references/02-langchain.md` §8 "보안·거버넌스"

---

## 실패 분류 (Taxonomy)

### 1) LLM 실패
| 유형 | 증상 | 기본 대응 |
|------|------|----------|
| 모델 타임아웃 (>2s) | 응답 미도달 | 타임아웃 후 부분 결과로 진행, Yellow 강제 |
| 할루시네이션 | 인용 없음·조항 ID 허위 | 자가 검증 프롬프트 재실행, 불일치 시 수동 검토 |
| JSON 스키마 불일치 | 파싱 실패 | 1회 재시도 (temperature 0), 실패 시 fallback 프롬프트 |
| 컨텍스트 초과 | 4K/8K 초과 | 자동 요약 후 재호출, 실패 시 모델 escalation (Haiku→Sonnet→Opus) |
| Rate limit | 429 반환 | 지수 백오프 (1s→2s→4s), 3회 후 Yellow 강제 |

근거: [1]

### 2) Tool · MCP 실패
| 유형 | 예 | 대응 |
|------|----|-----|
| 네트워크 일시 오류 | DNS·TLS 실패 | 즉시 재시도 1회 + 2초 대기 후 재시도 1회 |
| 타임아웃 | >5s (BSS) | Section 4의 폴백 매트릭스 참조 |
| 인증 실패 | 401/403 | 토큰 갱신 시도, 실패 시 점장 알림 |
| 데이터 결함 | 빈 응답·형식 깨짐 | 데이터 검증 실패 기록 → Yellow 강제 |
| 외부 시스템 장애 | 경찰청·본사 BSS 다운 | Local Queue + Health Monitor 루프 (F07) |

### 3) 데이터 실패
| 유형 | 예 | 대응 |
|------|----|-----|
| 손상 이미지 | 품질 점수 < 0.5 | 재촬영 요청 루프 (최대 3회) |
| PII 마스킹 실패 | 마스킹 미들웨어 에러 | 즉시 중단 + 감사 기록 + 점장 알림 |
| 서명 무결성 깨짐 | SHA-256 불일치 | 재서명 요청, 3회 실패 시 에스컬레이션 |
| 블랙리스트 조회 불가 | MCP 응답 없음 | 안전측으로 Yellow, 점장 확인 |

---

## Retry · Circuit Breaker 정책

### Retry 공통
- **지수 백오프**: base=500ms, multiplier=2, max=8s
- **Jitter**: ±20% (동시 재시도 폭주 방지)
- **Idempotency key**: Orchestrator가 `request_id` 기반 생성하여 중복 제출 방지

### Circuit Breaker (MCP별)
| 상태 | 트리거 | 행동 |
|------|-------|------|
| CLOSED | 정상 | 정상 호출 |
| OPEN | 1분 내 실패율 > 50% (최소 10건) | 호출 차단, 즉시 폴백 경로 |
| HALF-OPEN | OPEN 후 30초 | 테스트 호출 1회, 성공 시 CLOSED |

근거: [2]

---

## 타임아웃 정책

| 단계 | Soft | Hard | 행동 |
|------|:----:|:----:|------|
| IDV 병렬 | 1.5s | 2.0s | Hard 초과 시 unknown 처리, 결과 없음으로 판정 |
| RG 병렬 | 1.2s | 2.0s | 동일 |
| FS 병렬 | 1.8s | 2.5s | 동일 |
| JOIN | 2.0s | 2.5s | 부분 결과로 VERDICT 진입 (최소 2개 결과 필수) |
| BSS_SUBMIT | 5.0s | 8.0s | Hard 초과 시 Local Queue |
| 전체 개통 (End-to-End) | 15min | 30min | Hard 초과 시 세션 만료, 재시작 필요 |

---

## 관측성 (Observability)

### 3단 스택
1. **Metrics** — Prometheus 또는 Grafana Cloud
2. **Traces** — OpenTelemetry + 분산 추적
3. **Logs** — 감사 로그 (Append-only) + 시스템 로그 (30일)

### 필수 메트릭

| 지표 | 설명 | 알림 기준 |
|------|------|----------|
| `activation_latency_p95` | End-to-End p95 | > 3s 지속 5min |
| `verdict_distribution` | G/Y/R 비율 | Red 급증 (>1%) |
| `agent_error_rate` | 에이전트별 에러율 | > 2% 5min |
| `mcp_circuit_state` | 각 MCP CB 상태 | OPEN 상태 |
| `queue_depth` | Local Queue 크기 | > 100 건 |
| `fp_reports_daily` | 영업사원 FP 보고 건수 | 7일 합 > 누적 5% |
| `pii_mask_failures` | PII 마스킹 실패 | > 0 즉시 알림 |
| `escalation_rate` | Yellow/Red 비율 | > 10% 급변 |

### 트레이스 포인트
- 모든 State 전이에 OpenTelemetry span
- 각 에이전트 내부 LLM/Tool 호출 sub-span
- Trace ID는 `request_id`와 1:1 매핑

근거: [3]

---

## 감사 로깅 (Append-only)

### 로그 이벤트 스키마
```json
{
  "event_id": "uuid",
  "request_id": "act_...",
  "timestamp": "2026-04-21T10:30:00Z",
  "actor": "agent:fraud-scorer | user:dealer:123 | system",
  "action": "VERDICT_ISSUED",
  "payload": {
    "verdict": "RED",
    "scores": { "idv": 0.81, "reg": 1.0, "fraud": 0.94 },
    "reasons": ["다회선 7일 내 3회선 개통"],
    "decision_model": "claude-opus-4-7"
  },
  "pii_masked": true,
  "signature": "sha256-..."
}
```

### 보관 정책
- **감사 DB**: Append-only, 이벤트당 무결성 해시 체인
- **보관 기간**: 7년 (개인정보보호법·KYC·AML 규제)
- **검색**: 대리점ID·영업사원ID·request_id·판정 결과로 인덱스
- **백업**: 국내 리전 3복제 + 분기 오프사이트

근거: [4]

---

## 보안 (Security)

### PII 가드
- **마스킹 미들웨어**: 입력 단계에서 주민번호·전화·주소 마스킹 후에만 에이전트로 전달
- **평문 PII 허용 영역**: 로컬 단말 암호화 저장소 + e-sign-mcp (국내 리전) 한정
- **프롬프트 안전성 감사**: 주 1회 무작위 샘플 1000건 로그 점검 (평문 PII 누출 여부)

### 접근 제어
| 역할 | 권한 |
|------|------|
| 영업사원 | 자기 대리점 개통 요청 생성·조회, Yellow까지 확인·진행 |
| 점장 | 자기 대리점 전체, Yellow 승인, 대시보드 |
| 본사 리스크팀 | 전국, Red 승인·차단, 블랙리스트 관리 |
| 본사 컴플라이언스 | 전국, 감사 로그 조회, 정기 보고 |
| 운영자 | 시스템 메트릭·CB 상태, PII 접근 금지 |

### 네트워크 격리
- 대리점 단말 → Orchestrator: mTLS + 대리점 인증서
- MCP 간: mTLS + Service Mesh
- LLM API 호출: 프록시 경유 + PII 마스킹 검증 후 전송

근거: [5]

---

## 복구·재시작 (Disaster Recovery)

### 시나리오별 RPO / RTO
| 시나리오 | RPO | RTO | 전략 |
|---------|:---:|:---:|------|
| Orchestrator 재시작 | 0 | 30s | Checkpoint 기반 State 복원 |
| MCP 장애 | 0 | 5min | Circuit Breaker + 폴백 |
| BSS 장애 | 0 | 복구 시까지 | Local Queue |
| Vector DB 손상 | 1h | 2h | 일 스냅샷 복원 |
| 감사 DB 손상 | 0 (append-only) | 4h | 복제본 전환 |
| 대규모 재해 (리전) | 24h | 8h | 오프사이트 백업 복원 |

---

## 거버넌스·컴플라이언스

### 정기 감사 프로세스
- **주간**: FP 피드백 리뷰, 모델 재학습 후보 선정
- **월간**: 규정 개정 영향 평가 (최근 30일 개통 재검토)
- **분기**: 외부 감사 보고서, KPI 달성도 리뷰
- **연간**: 전체 리스크 평가, 임계값·티어 매핑 재조정

### 인적 Human-in-the-Loop 의무
- Yellow 이상은 사람 최종 판단
- 자동화 판정 100% 금지 (규제 요구)

근거: [4]

---

## 각주

[1]: `references/05-mas-langgraph.md` §8 "실패 패턴·재시도", `references/02-langchain.md` §10 "LLM 오류 처리"
[2]: `references/05-mas-langgraph.md` §8.3 "Circuit Breaker"
[3]: `references/05-mas-langgraph.md` §9 "관측성·Tracing"
[4]: `references/02-langchain.md` §8 "보안·거버넌스·감사"
[5]: `references/04-mcp.md` §4 "보안 · mTLS · 권한"
