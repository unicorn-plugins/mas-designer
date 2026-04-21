# 4. Tool · MCP 바인딩

> 에이전트별 외부 Tool/MCP 서버 매핑 + 권한 + Rate Limit + 장애 시 폴백.
> 근거: `references/04-mcp.md` §3 "MCP 서버 연동 패턴", `references/02-langchain.md` §4 "Tool 바인딩"

---

## MCP 서버 카탈로그

| MCP 서버 | 제공 도구 | 사용 에이전트 | 목적 |
|---------|----------|--------------|------|
| `telco-bss-mcp` | submit_activation, query_status, mnp_request, health | Orchestrator | 본사 BSS 연동 |
| `telco-kyc-mcp` | query_identity, blacklist_check, aml_score | RegGuard, Fraud Scorer | KYC/AML 조회 |
| `police-lostid-mcp` | query_lost_or_stolen_id | IDV+, Fraud Scorer | 분실·도난 신분증 조회 |
| `tax-biz-mcp` | verify_business_number, check_dormant | Doc Generator (법인) | 사업자 진위 확인 |
| `e-sign-mcp` | create_session, capture_signature, verify_integrity | Doc Generator | 전자서명 |
| `regulation-rag-mcp` | search_clause, cite_clause | RegGuard, Dealer Copilot | 규정집 검색·인용 |
| `fraud-history-mcp` | query_dealer_history, pattern_match | Fraud Scorer | 사기 이력·패턴 |
| `corp-docs-mcp` | ocr_corp_doc, verify_employment | Doc Generator (법인) | 법인 서류 검증 |

근거: [1]

---

## 에이전트별 Tool 매핑

### A1. Orchestrator
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `state_read`, `state_write` | LangGraph State API | Full | - |
| `agent_delegate` | Task (내부 에이전트 호출) | Full | - |
| `submit_activation` | telco-bss-mcp | Write | 10 rps/대리점 |
| `query_status` | telco-bss-mcp | Read | 30 rps |
| `health_check` | telco-bss-mcp | Read | 5 rps |
| `queue_put`, `queue_drain` | Local Queue | Full | - |
| `log_event` | audit_logger 호출 | Write | - |

### A2. IDV+
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `vision_ocr` | VLM (Gemini/Claude Vision) | 이미지 입력만 | 20 rps/대리점 |
| `face_compare` | ArcFace 라이브러리 (로컬) | 입력만 | 로컬 무제한 |
| `liveness_check` | Active Challenge 라이브러리 | 입력만 | 로컬 무제한 |
| `query_lost_or_stolen_id` | police-lostid-mcp | Read | 5 rps, 인증 필수 |

### A3. RegGuard
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `search_clause` | regulation-rag-mcp | Read | 50 rps |
| `cite_clause` | regulation-rag-mcp | Read | 50 rps |
| `query_identity` | telco-kyc-mcp | Read (PII 마스킹) | 20 rps |
| `aml_score` | telco-kyc-mcp | Read | 10 rps |

### A4. Fraud Scorer
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `query_dealer_history` | fraud-history-mcp | Read | 30 rps |
| `pattern_match` | fraud-history-mcp | Read | 20 rps |
| `blacklist_check` | telco-kyc-mcp | Read | 30 rps |
| `ml_score_ensemble` | 내부 모델 서버 (gRPC) | Read/Inference | 50 rps |

### A5. Doc Generator
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `fill_template` | 내부 PDF 엔진 | 로컬 | 무제한 |
| `create_session` | e-sign-mcp | Write | 10 rps |
| `capture_signature` | e-sign-mcp | Write | 10 rps |
| `verify_integrity` | e-sign-mcp | Read | 10 rps |
| `ocr_corp_doc` | corp-docs-mcp | Read | 10 rps |
| `verify_business_number` | tax-biz-mcp | Read | 10 rps |

### A6. Audit Logger
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `log_append` | 감사 DB (Append-only) | Write | - |
| `summarize_daily` | LLM 요약 | Read | 1 rps |

### A7. Dealer Copilot (선택)
| 추상 도구 | 실제 구현 | 권한 | Rate Limit |
|----------|----------|:----:|:---------:|
| `search_clause` | regulation-rag-mcp | Read | 50 rps |
| `web_search` (빌트인) | WebSearch | Read | 별도 제한 |

---

## 장애 시 폴백 전략

| MCP 서버 | 장애 시 행동 | 사용자 영향 |
|---------|------------|------------|
| `telco-bss-mcp` | **Local Queue** 저장 → BSS 복구 감지 시 자동 드레인 (F07) | 개통 지연 안내, 접수번호 임시 |
| `telco-kyc-mcp` | KYC 미조회 시 `Fraud Scorer` 가중치로 대체, **Yellow 강제 설정** | 영업사원에게 수동 확인 요청 |
| `police-lostid-mcp` | 조회 실패 시 **Yellow 등급 승격** | 점장 수동 확인 필수 |
| `regulation-rag-mcp` | 로컬 캐시(최신 7일) 사용 + "최신 규정 반영 불가" 경고 | 중요 판정 시 영업사원 확인 요청 |
| `e-sign-mcp` | 전자서명 불가 시 종이 서명 모드 폴백 | 시간 증가 +5분 |
| `tax-biz-mcp` | 법인 개통만 해당, 미조회 시 수동 검토 | 법인 건은 수동 처리로 전환 |

근거: [1] §5 "장애 격리·회복 패턴"

---

## 권한·보안 정책

### MCP 서버 인증
- 모든 MCP는 **Mutual TLS + 대리점 ID 기반 토큰** 사용
- 민감 API(KYC·police)는 **프로젝트 토큰 + 건별 감사 ID** 동시 요구
- 토큰 만료 1일, 자동 갱신

### Rate Limit 실패 처리
- 자기 대리점 Limit 초과 시 **2초 지연 후 재시도 1회**
- 전역 Limit 초과(피크 타임) 시 **Yellow 강제 + 점장 확인** 유도 (개통 거절하지 않음)

### PII 전송 원칙
- PII는 **MCP 요청 본문에서 마스킹/토큰화**
- 평문 PII 필요한 서버(e-sign-mcp)는 국내 리전 + mTLS 필수
- 근거: [2]

---

## 각주

[1]: `references/04-mcp.md` §3 "MCP 서버 연동 패턴", §5 "장애 격리·회복"
[2]: `references/02-langchain.md` §8 "보안·거버넌스 Tool 바인딩"
