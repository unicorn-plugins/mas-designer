# 1. 에이전트 식별·책임 정의

> userstory.md + es/*.puml을 기반으로 MAS 에이전트 후보 도출 및 프로파일 정의.
> 근거: `references/05-mas-langgraph.md` §2 "에이전트 토폴로지 패턴"

---

## 에이전트 토폴로지 개요

**패턴 선정**: **Supervisor + Parallel Specialists + Human-in-the-Loop**

- Supervisor(Orchestrator)가 병렬 전문가를 호출, 결과를 취합 판정
- Yellow 이상의 경우 사람(점장·본사 리스크팀)에게 에스컬레이션
- 결정론적 작업(서류 생성·로깅)은 Tool 호출로 처리, 에이전트 아님

---

## 에이전트 프로파일

### A1. Orchestrator (Supervisor)
- **역할**: LangGraph State 관리, 병렬 에이전트 호출·스코어 종합, Human-in-the-Loop 분기
- **책임**: 전체 개통 이벤트의 수명주기 관리, 타임아웃·폴백 정책 집행
- **권한**: 전체 State 읽기/쓰기, 모든 에이전트 호출, BSS 제출 최종 결정
- **tier**: HIGH (조정·판정 로직 복잡도 높음)
- **근거 각주**: [1]

### A2. ID Verifier (IDV+)
- **역할**: 신분증 OCR + VLM 위변조 + 얼굴 대조 + 라이브니스
- **책임**: 신원 관련 PASS/FAIL + 신뢰도 + 의심 영역 bbox 반환
- **권한**: 이미지 입력만 수신, PII는 즉시 마스킹 후 저장
- **tier**: MEDIUM (VLM 호출, 결정론적 후처리)
- **근거 각주**: [2]

### A3. Compliance RegGuard
- **역할**: 규정 RAG 조회, 약정·미성년·KYC·AML 규정 판정
- **책임**: PASS/WARN/FAIL + 인용 조항 ID·원문 제공
- **권한**: Vector DB 읽기, 규정 판정만 (수정권 없음)
- **tier**: MEDIUM (검색+추론, 하이브리드)
- **근거 각주**: [3]

### A4. Fraud Scorer
- **역할**: 다회선·블랙리스트·이상 패턴 ML 스코어링 + LLM 해석
- **책임**: 0~1 스코어 + 주요 feature 3개 + 유사 사례
- **권한**: 개통 이력 DB 읽기 전용, 블랙리스트 조회
- **tier**: HIGH (ML + LLM 앙상블 판정)
- **근거 각주**: [1], [4]

### A5. Doc Generator (AutoDoc)
- **역할**: 검증 완료 데이터로 가입신청서·위임장·동의서 자동 생성
- **책임**: PDF 3종 생성 + 무결성 해시 + PII 검증
- **권한**: 템플릿 읽기, PDF 생성, 전자서명 API 호출
- **tier**: LOW (템플릿 기반 결정론적, LLM은 문구 보정만)
- **근거 각주**: [1]

### A6. Audit Logger
- **역할**: 전체 이벤트·판정·사용자 확인·본사 응답 구조화 저장
- **책임**: 감사 로그 작성, 규제 보고서 자동 생성
- **권한**: 감사 DB 쓰기 전용 (다른 에이전트는 읽기만)
- **tier**: LOW (결정론적 이벤트 싱크)
- **근거 각주**: [1]

### A7. Dealer Copilot (선택)
- **역할**: 영업사원에게 설명 스크립트·약관·FAQ 제공
- **책임**: 자연어 질의 응답, RAG 기반 정보 제공
- **권한**: RegGuard의 Vector DB 공유, 고객 개통 맥락 읽기
- **tier**: MEDIUM
- **근거 각주**: [3]

---

## Bounded Context 매핑 (이벤트 스토밍 결과 연계)

| Bounded Context | 담당 에이전트 | 주요 이벤트 |
|-----------------|--------------|-------------|
| ID 검증 | A2 IDV+ | IDCaptured, FaceMatched, LivenessPassed |
| 규정 검증 | A3 RegGuard | RegulationChecked, ComplianceWarnIssued |
| 사기 탐지 | A4 Fraud Scorer | RiskScored, BlacklistHit |
| 서류 생성 | A5 AutoDoc | DocsGenerated, SignatureCaptured |
| 감사 | A6 Audit Logger | DecisionLogged, EscalationLogged |
| 오케스트레이션 | A1 Orchestrator | ActivationReceived, VerdictIssued, BSSSubmitted |

---

## 에이전트 상호 호출 금지 원칙 (DMAP 표준)

- 에이전트 간 직접 호출 금지. 모든 조정은 **A1 Orchestrator**가 수행.
- A7 Dealer Copilot은 영업사원 UI 질의에 응답하는 별개 세션, 타 에이전트 간 의존 없음.

---

## 각주

[1]: `references/05-mas-langgraph.md` §2 "Supervisor + Parallel Specialist 패턴"
[2]: `references/01-multimodal-ai.md` §3 "VLM 기반 이미지 분석·OCR"
[3]: `references/03-rag.md` §4 "조항 인용 RAG · ReAct 패턴"
[4]: `references/02-langchain.md` §5 "ML 스코어링 + LLM 해석 앙상블"
