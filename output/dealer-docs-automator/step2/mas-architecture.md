# MAS 아키텍처 설계서 — dealer-docs-automator

> 통신 대리점 개통·서류 자동 처리 멀티에이전트 시스템의 통합 설계서.
> 7개 섹션 요약 + 근거 각주. 개별 섹션 상세는 `1~7-*.md` 파일 참조.

**프로젝트**: dealer-docs-automator
**킹핀**: 통신 대리점 개통 순간의 사기·명의도용·규정 위반 실시간 차단 부재
**선정 솔루션**: **RTA (Real-time Triage Agent) 확장형**
**작성일**: 2026-04-21

---

## 목차

1. [개요 및 아키텍처 원칙](#1-개요-및-아키텍처-원칙)
2. [에이전트 구성](#2-에이전트-구성)
3. [LangGraph 그래프](#3-langgraph-그래프)
4. [상호작용 시퀀스](#4-상호작용-시퀀스)
5. [Tool·MCP 바인딩](#5-toolmcp-바인딩)
6. [RAG·메모리 전략](#6-rag메모리-전략)
7. [멀티모달 I/O](#7-멀티모달-io)
8. [신뢰성·관측성·보안](#8-신뢰성관측성보안)
9. [구현 로드맵](#9-구현-로드맵)

---

## 1. 개요 및 아키텍처 원칙

### 1-1. 목표 (킹핀 직결)

개통 접수 순간부터 **2초 내** 사기·규정 위반을 판정하고, 서류 생성·BSS 제출까지 **평균 12분** 이내 완결함.

### 1-2. 아키텍처 4대 원칙

| 원칙 | 설명 |
|------|------|
| **병렬 전문 에이전트** | Supervisor가 IDV+·RegGuard·Fraud Scorer를 2초 내 병렬 실행 |
| **증거 기반 판정** | 모든 판정은 조항 ID·데이터 소스·근거 이유 3종을 감사 로그에 동봉 |
| **Human-in-the-Loop** | Yellow는 점장, Red는 본사 리스크팀 승인. 100% 자동 판정 금지 (규제) |
| **프라이버시 퍼스트** | PII는 로컬 암호화 저장, 프롬프트·로그에 마스킹 적용, 국내 리전 |

### 1-3. 고수준 블록도

```
         [영업사원 태블릿 / 대리점 PC]
                       ▼
        ┌───────────── Orchestrator (LangGraph) ──────────────┐
        │                                                      │
   [IDV+]──────┬────[RegGuard]────┬──────[Fraud Scorer]       │
   VLM OCR    │   Regulation RAG │   ML+LLM Ensemble          │
   얼굴 대조   │   ReAct 조항 인용  │   다회선·블랙리스트        │
        │     │         │         │             │             │
        └──── JOIN (2s 타임아웃) + VERDICT (G/Y/R) ─────────── │
                       ▼                                      │
            [Escalate/ Sign/ BSS Submit]                      │
                       ▼                                      │
              [Audit Logger (Append-only)]                    │
        └─────────────────────────────────────────────────────┘
```

---

## 2. 에이전트 구성

| 에이전트 | Tier | 핵심 역할 |
|---------|:----:|----------|
| A1 Orchestrator | HIGH | LangGraph State 관리, 병렬 호출, HITL 분기 |
| A2 IDV+ | MEDIUM | 신분증 OCR + VLM 위변조 + 얼굴 + 라이브니스 |
| A3 RegGuard | MEDIUM | 규정 RAG + ReAct + 조항 인용 |
| A4 Fraud Scorer | HIGH | ML 스코어링 + LLM 해석 앙상블 |
| A5 Doc Generator | LOW | 템플릿 기반 PDF 3종 자동 생성 + 전자서명 |
| A6 Audit Logger | LOW | Append-only 감사 로그 + 일·월·분기 보고 |
| A7 Dealer Copilot | MEDIUM | 영업사원 질의응답 (선택) |

**에이전트 간 직접 호출 금지** — 조정은 Orchestrator 전담.

상세: [1-agents.md](1-agents.md). 근거: [1]

---

## 3. LangGraph 그래프

### 핵심 노드

`INTAKE → [IDV ∥ RG ∥ FS] → JOIN → VERDICT → DOC_GEN → SIGN → BSS_SUBMIT → TERMINATE`

**분기 노드**: `ESCALATE` (Yellow/Red), `QUEUE` (BSS 장애)

### State 핵심 필드

`request_id · activation_type · idv_result · reg_result · fraud_result · verdict · verdict_reasons · docs · bss_result · errors`

### 체크포인트

- `CP_INTAKE` (24h), `CP_PARALLEL_DONE` (24h), `CP_VERDICT` (7일), `CP_SIGNED` (10년)

상세: [2-graph.md](2-graph.md). 근거: [2]

---

## 4. 상호작용 시퀀스

### 대표 시퀀스 3종

1. **Green Path (정상)**: INTAKE → 3 에이전트 병렬 → GREEN → DOC → 서명 → BSS 제출 (9~12분)
2. **Yellow Path**: 규정 경고 → 점장 수동 승인 → Green 전환 → 이후 동일
3. **Red Path**: 사기 의심 → BSS 차단 → 본사 리스크팀이 차단 확정 또는 수동 승인

### 프롬프트 캐시 최적화

**3단 조립**: 공통 정적 → 에이전트별 정적 → 동적 (prefix cache 활용)

상세: [3-sequence.md](3-sequence.md). 근거: [3]

---

## 5. Tool·MCP 바인딩

### 8개 MCP 서버

| MCP 서버 | 주 소비자 |
|---------|----------|
| telco-bss-mcp | Orchestrator (본사 BSS 연동) |
| telco-kyc-mcp | RegGuard, Fraud Scorer |
| police-lostid-mcp | IDV+, Fraud Scorer (분실 신분증) |
| tax-biz-mcp | Doc Generator (법인 개통) |
| e-sign-mcp | Doc Generator (전자서명) |
| regulation-rag-mcp | RegGuard, Dealer Copilot |
| fraud-history-mcp | Fraud Scorer |
| corp-docs-mcp | Doc Generator (법인) |

### 장애 시 폴백

BSS 장애 → Local Queue / KYC 장애 → Yellow 강제 / 경찰청 장애 → Yellow 승격 / 규정 RAG 장애 → 로컬 캐시 7일.

상세: [4-tool-mcp.md](4-tool-mcp.md). 근거: [4]

---

## 6. RAG·메모리 전략

### RAG 지식 소스 6종

본사 규정집 · 상품 카탈로그 · 공지·Q&A · 사기 사례 · FAQ · 반려 이력

### 검색 파이프라인

`Query Rewriting → Hybrid(Dense+BM25) → Reranker(Cross-Encoder) → Citation Builder → LLM(ReAct)`

### 메모리 분리

- **단기**: 세션 State (휘발성) + CP_SIGNED 체크포인트
- **장기**: 감사 DB + 패턴 이력 (PII 제거 후만)
- **대화**: Redis 24h TTL (Dealer Copilot)

### 개인 사용자 데이터는 RAG에 포함하지 않음 (PII 누출 방지).

상세: [5-rag-memory.md](5-rag-memory.md). 근거: [5]

---

## 7. 멀티모달 I/O

### 입력

- **이미지**: 신분증·가족관계증명·셀피 — Gemini 2.5 Pro Vision + 로컬 ArcFace
- **텍스트**: 영업사원·고객 대화 — Claude Sonnet / Gemini Flash
- **문서(PDF)**: 규정·법인서류 — OCR + VLM
- **음성**: (선택) 외국인 대화 자막 번역

### 출력

- **UI**: 위험 배지(G/Y/R) + 근거 카드 + 진행 단계 바 + 위변조 bbox
- **PDF**: 가입신청서·위임장·동의서 (PDF/A-2b + SHA-256)
- **대시보드**: 점장 일일 HTML + Chart.js (9차트)
- **PPT**: STEP 3에서 pptx-spec-writer + generate-pptx 생성

### 프라이버시 원칙

원본 신분증·셀피는 로컬 실행 밖으로 안 나감. VLM 클라우드 호출 시 PII 영역 마스킹.

상세: [6-multimodal.md](6-multimodal.md). 근거: [6]

---

## 8. 신뢰성·관측성·보안

### 실패 분류
- **LLM**: 타임아웃·할루시네이션·JSON 불일치·컨텍스트 초과·Rate Limit
- **Tool/MCP**: 네트워크·인증·데이터결함·외부시스템장애
- **데이터**: 이미지 품질·마스킹 실패·서명 무결성·DB 조회 불가

### 타임아웃
- 병렬 에이전트 Hard 2~2.5s
- End-to-End 세션 Hard 30min
- BSS 제출 Hard 8s (초과 시 Local Queue)

### Circuit Breaker
- MCP별 CB (1분 실패율 >50% → OPEN → 30s 후 HALF-OPEN 테스트)

### 관측성 3단 스택
- Metrics (Prometheus) · Traces (OTel) · Logs (감사 append-only)

### 감사 로그
- 이벤트당 SHA-256 해시 체인, 7년 보관, 국내 리전 3복제

### 접근 제어
- 역할 5종 (영업사원·점장·리스크팀·컴플라이언스·운영자)

상세: [7-reliability.md](7-reliability.md). 근거: [7]

---

## 9. 구현 로드맵

### 단계

| 단계 | 기간 | 산출물 |
|------|:---:|-------|
| **M0 · 기반 인프라** | 1~2개월 | MCP 서버 4종 (BSS · KYC · RAG · e-sign) + Orchestrator 스켈레톤 + 감사 DB |
| **M1 · IDV+ & RegGuard 파일럿** | 2~3개월 | 신분증 VLM + 규정 RAG + 단일 대리점 파일럿 |
| **M2 · Fraud Scorer + 에스컬레이션** | 2개월 | ML 스코어링 모델·HITL 에스컬레이션 완비 |
| **M3 · AutoDoc + 전자서명** | 1~2개월 | PDF 생성·전자서명 통합 |
| **M4 · 8개 대리점 파일럿 + 평가** | 3개월 | 파일럿 보고·KPI 평가 |
| **M5 · 200 대리점 확산** | 3개월 | 운영 모니터링·모델 재학습 루프 |
| **M6 · 전사 확산** | 6개월 | 1,000+ 대리점 배포 |

**총 18개월** — ROI 회수 기간 15~22개월 목표 달성 가능.

### 조직 요건

- **MAS 엔지니어링팀** 5~7명 (LangGraph·MLOps·SRE·Security)
- **컴플라이언스·법무** 2명 (규제 대응·감사)
- **본사 BSS API팀** 2~3명 (MCP 구축)
- **데이터 사이언스** 2명 (사기 탐지 모델)

---

## 10. 성공 기준 (KPI · 게이트)

| KPI | 현재 | 파일럿 목표 (3개월) | 전사 목표 (18개월) |
|------|:---:|:-----------------:|:-----------------:|
| 개통 반려율 | 20% | ≤10% | **≤5%** |
| 사기 발생률 | 0.8% | ≤0.3% | **≤0.1%** |
| 건당 처리 시간 | 30min | ≤18min | **≤12min** |
| FP(오탐) 누적율 | - | ≤5% | ≤3% |
| 영업사원 NPS | - | ≥+30 | ≥+50 |
| 본사 영업지원 콜 | 100% | -40% | -60% |

---

## 전체 각주

[1]: `references/05-mas-langgraph.md` §2 "에이전트 토폴로지 패턴"
[2]: `references/05-mas-langgraph.md` §3 "노드·엣지·State 설계", §5 "체크포인트"
[3]: `references/02-langchain.md` §4 "Tool 바인딩", §7 "Prompt Caching"
[4]: `references/04-mcp.md` §3 "MCP 서버 연동", §5 "장애 격리·회복"
[5]: `references/03-rag.md` §2~§5, `references/02-langchain.md` §6 "Memory"
[6]: `references/01-multimodal-ai.md` §2~§5
[7]: `references/05-mas-langgraph.md` §8 "신뢰성·실패 패턴", §9 "관측성", `references/02-langchain.md` §8 "보안·거버넌스"

---

## 부록 — 세부 문서

- [1-agents.md](1-agents.md) — 에이전트 프로파일 상세
- [2-graph.md](2-graph.md) — LangGraph State 스키마·Mermaid 시각화
- [3-sequence.md](3-sequence.md) — SEQ-1/2/3 상세 + 프롬프트 조립
- [4-tool-mcp.md](4-tool-mcp.md) — MCP 8종 + 권한·Rate Limit·폴백
- [5-rag-memory.md](5-rag-memory.md) — 청킹·인덱싱·Hybrid Search·Rerank·ReAct
- [6-multimodal.md](6-multimodal.md) — 이미지·텍스트·문서·음성 I/O
- [7-reliability.md](7-reliability.md) — 실패 분류·Timeout·CB·관측성·감사·보안
