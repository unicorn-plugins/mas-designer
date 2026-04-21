# 팀 기획서

## 기본 정보
- 플러그인명: mas-designer
- 목표: 사용자가 제시한 비즈니스 도메인·주제에 대해 **AI 활용 기획 → MAS 아키텍처 설계 → 경영진
  발표용 PPT 산출**을 end-to-end로 지원. 기획 단계는 문제가설 → 방향성 → 솔루션 탐색·선정 →
  이벤트 스토밍 → 유저스토리까지 체계적으로 수행하고, 유저스토리와 AI 기술정보(멀티모달·
  Langchain·RAG·MCP·MAS/LangGraph)를 근거로 실행 가능한 MAS 아키텍처 설계서와 발표자료를 자동 생성
- 대상 도메인: AI 활용 신규 서비스/업무 자동화 기획 · 멀티에이전트 시스템 설계
- 대상 사용자: AI 기획자, 프로덕트 매니저, 엔터프라이즈 아키텍트, AI TF 리더, CTO 보좌 조직

---

## 핵심기능
- **AI 활용 기획**: 사용자가 제시한 도메인·주제에 대해 현상문제·근본원인 → 방향성 → 솔루션 탐색
  → 솔루션 선정 → 이벤트 스토밍 → 유저스토리까지 6단계 순차 수행. 각 단계는 공유자원으로 등록된
  기획 가이드(`ai/plan/*`)를 엄격히 참조
- **MAS 아키텍처 설계**: 유저스토리와 AI 기술정보(`ai/tech-info/*`)를 근거로 에이전트 토폴로지,
  LangGraph 그래프(노드·엣지·State), 상호작용 시퀀스, Tool/MCP 바인딩, RAG·메모리 전략, 멀티모달
  I/O, 에러·폴백 전략까지 포함한 설계서 작성
- **발표자료 PPT 생성**: 기획 결과와 MAS 설계서를 바탕으로 경영진 보고용 PPT 생성
  (GREAT 2 WHY 필수: 고객 WHY + 기업 WHY, 방향성과 핵심 솔루션, MAS 아키텍처 설계 결과 필수 포함)

---

## 사용자 플로우

### STEP 1. 기획

> **경로 규약**: `{OUTPUT_DIR}` = `output/{project}/plan/`. STEP 1 산출물은 **가이드의 핸드오프
> 표**(각 가이드 상단 「경로 규약 (공통)」)에 정의된 파일명을 그대로 사용하여 평면 저장함.

- Step 1-1. 도메인·주제 입력
  - 사용자에게 비즈니스 도메인·주제·핵심 고민을 물어 입력 수집
  - 산출물: `{OUTPUT_DIR}/0-input.md`
- Step 1-2. 현상문제·근본원인 도출 (가이드: `ai/plan/01-problem-hypothesis-guide.md`)
  - 대표 현상문제 3개 선정 + 5WHY 근본원인 도출 + 비즈니스 가치 정의
  - 산출물: `{OUTPUT_DIR}/문제가설.md`, `{OUTPUT_DIR}/비즈니스가치.md`
- Step 1-3. 방향성 정의 (가이드: `ai/plan/02-direction-setting-guide.md`)
  - 킹핀 문제 선정(5기준 평가) + Needs Statement 작성(자동화/증강/생성 카테고리 명시)
  - 산출물: `{OUTPUT_DIR}/킹핀문제.md`, `{OUTPUT_DIR}/문제해결방향성.md`
- Step 1-4. 솔루션 탐색 (가이드: `ai/plan/03-ideation-guide.md`)
  - SCAMPER·Steal & Synthesize·AI 패턴 카드로 아이디어 발산 → 유사도 평가로 수렴
  - 산출물: `{OUTPUT_DIR}/솔루션탐색.md`, `{OUTPUT_DIR}/솔루션후보.md`
- Step 1-5. 솔루션 선정 (가이드: `ai/plan/04-solution-selection-guide.md`)
  - B/F 투표 + 우선순위 매트릭스(No Brainers/Bit Bets/Utilities/Unwise) + AI 실현 가능성 4요소
  - 산출물: `{OUTPUT_DIR}/솔루션평가.md`, `{OUTPUT_DIR}/솔루션우선순위평가.svg`,
    `{OUTPUT_DIR}/핵심솔루션.md`
- Step 1-6. 이벤트 스토밍 (가이드: `ai/plan/05-event-storming-guide.md`)
  - 유저플로우 5~10개 식별 → PlantUML 시퀀스 다이어그램 + Bounded Context(에이전트 경계 후보)
  - 산출물: `{OUTPUT_DIR}/es/userflow.puml`, `{OUTPUT_DIR}/es/{NN}-{유저플로우명}.puml`
- Step 1-7. 유저스토리 작성 (가이드: `ai/plan/06-user-stories-guide.md`)
  - UFR/AFR/NFR 포맷 + Given-When-Then + LLM 검증 기준 AC
  - 산출물: `{OUTPUT_DIR}/userstory.md`

### STEP 2. MAS 아키텍처 설계
- Step 2-1. 에이전트 식별·책임 정의 (근거: `ai/tech-info/05-mas-langgraph.md`)
  - 유저스토리에서 에이전트 후보 도출, 프로파일(역할·책임·권한) 정의
  - 산출물: `output/{project}/step2/1-agents.md`
- Step 2-2. LangGraph 그래프 설계 (근거: `ai/tech-info/05-mas-langgraph.md`)
  - 노드(에이전트·Tool 호출)·엣지(조건·라우팅)·State 스키마·체크포인트 정의
  - 산출물: `output/{project}/step2/2-graph.md`
- Step 2-3. 상호작용 시퀀스 설계 (근거: `ai/tech-info/02-langchain.md`,
  `ai/tech-info/05-mas-langgraph.md`)
  - 주요 유저스토리별 에이전트 협력 시퀀스 다이어그램·프롬프트 전략
  - 산출물: `output/{project}/step2/3-sequence.md`
- Step 2-4. Tool·MCP 바인딩 (근거: `ai/tech-info/04-mcp.md`, `ai/tech-info/02-langchain.md`)
  - 에이전트별 외부 Tool/MCP 서버·권한·Rate Limit·장애 시 폴백 정의
  - 산출물: `output/{project}/step2/4-tool-mcp.md`
- Step 2-5. RAG·메모리 전략 (근거: `ai/tech-info/03-rag.md`, `ai/tech-info/02-langchain.md`)
  - 지식 소스·인덱싱 전략·검색 파이프라인·단기/장기 메모리 구조 정의
  - 산출물: `output/{project}/step2/5-rag-memory.md`
- Step 2-6. 멀티모달 I/O 설계 (근거: `ai/tech-info/01-multimodal-ai.md`)
  - 입력(텍스트·이미지·음성·문서), 출력(리포트·시각자료·음성) 포맷·모델·제약 정의
  - 산출물: `output/{project}/step2/6-multimodal.md`
- Step 2-7. 에러/폴백·관측성·보안
  - 실패 분류(LLM/Tool/데이터), Retry/Circuit Breaker, Trace·메트릭, PII 가드
  - 산출물: `output/{project}/step2/7-reliability.md`
- Step 2-8. MAS 아키텍처 설계서 통합
  - Step 2-1 ~ 2-7을 하나의 설계서로 통합 → `output/{project}/step2/mas-architecture.md`

### STEP 3. 발표자료 PPT 작성
- Step 3-1. PPT 스토리라인 설계 (GREAT 2 WHY 중심)
  - 목차: ① 고객 WHY ② 기업 WHY ③ 현상문제·근본원인 ④ 방향성 ⑤ 핵심 솔루션 ⑥ MAS 아키텍처
    (에이전트·그래프·Tool/MCP·RAG·멀티모달) ⑦ 실행 로드맵 ⑧ 기대효과
  - 산출물: `output/{project}/step3/1-storyline.md`
- Step 3-2. 슬라이드 마크다운 스크립트 작성 (스타일 가이드: pptx-build-guide)
  - 슬라이드별 패턴(A~F) 주석 명시
  - 산출물: `output/{project}/step3/2.script.md`
- Step 3-3. PPTX 생성
  - pptxgenjs 기반 코드 생성·실행 → `output/{project}/step3/3.{project}.pptx`

### 최종 산출
- 최종 Review: 유저스토리↔MAS 설계↔PPT 3단 정합성, GREAT 2 WHY 충족, 설계서 체크리스트 100%
- 최종 패키지: `output/{project}/final/mas-architecture.md`, `output/{project}/final/{project}.pptx`

---

## 에이전트 구성

- **problem-analyst** (HIGH): 현상문제·근본원인 도출 전문가 — 대표 현상문제 3개와 근본원인
  (5-Why·Fishbone) 체계적 도출 담당
  - **domain-interviewer**: 도메인별 맞춤 질문 템플릿 생성(고객·업무·운영)

- **direction-setter** (HIGH): 방향성 정의 전문가 — AI 활용 방향성 및 고객·기업 관점 가치 제안
  정의 담당
  - **why-crystallizer**: GREAT 2 WHY(고객/기업) 초안 생성(STEP 3 PPT 재사용 전제)

- **solution-explorer** (MEDIUM): 솔루션 탐색 전문가 — 발산·카테고리화·중복 병합 담당
  - **ai-pattern-lib**: AI 활용 패턴(분류·추천·생성·에이전트화) 카드 세트 제공

- **solution-selector** (HIGH): 솔루션 선정 전문가 — Biz Value × 실현 가능성 매트릭스 평가 및
  최적안 1개 선정, 선정 근거 명시 담당

- **event-storming-facilitator** (HIGH): 이벤트 스토밍 전문가 — 도메인 이벤트 수집·
  Aggregate/Bounded Context 도출 담당

- **user-story-writer** (MEDIUM): 유저스토리 작성 전문가 — Actor·Goal·Acceptance Criteria 포함
  스토리 작성, INVEST 원칙 준수 담당

- **mas-architect** (HIGH): MAS 아키텍처 설계 전문가 — 유저스토리 + AI 기술정보 5종을 근거로
  에이전트 식별, LangGraph 그래프, 상호작용 시퀀스, Tool/MCP 바인딩, RAG/메모리, 멀티모달 I/O,
  에러/폴백 전략 설계 담당
  - **graph-designer**: LangGraph 노드·엣지·State 스키마 자동 초안
  - **tool-mcp-binder**: 에이전트별 Tool/MCP 매핑·권한·폴백 설계
  - **rag-planner**: 지식 소스·청킹·검색 전략 설계
  - **multimodal-mapper**: 입출력 모달리티 매핑·모델 선정

- **reviewer** (HIGH): 독립 검증 전문가 — 유저스토리↔MAS 설계↔PPT 정합성, GREAT 2 WHY 충족,
  설계서 체크리스트 만족, AI 기술정보 근거 인용 정확성 검증 담당
  - 별도 컨텍스트로 분리 실행하여 자체 산출물에 대한 독립적 검증 수행

- **pptx-spec-writer** (MEDIUM): PPT 시각 명세 작성 전문가 — GREAT 2 WHY·방향성·MAS 아키텍처
  필수 슬라이드 포함 spec.md 작성 담당(office 2단계 패턴)

- **doc-exporter** (LOW): 최종 산출물 패키징 전문가 — 마크다운 설계서와 PPTX를 `final/`
  디렉토리로 정리·일관성 점검·파일명 표준화 담당

---

## 공유자원

본 플러그인은 **DMAP 공유자원 매칭 메커니즘**(team-planner Step4-2 → develop-plugin
Phase3-Step3)을 활용함. 아래 자원은 `{DMAP_PLUGIN_DIR}/resources/plugin-resources.md`에 사전
등록되어 있으며, develop-plugin이 에이전트·스킬 로컬 `references/` 경로로 자동 복사함.

| 자원 유형 | 자원명 | 자원 경로 |
|----------|--------|------------|
| 가이드 | problem-hypothesis-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/01-problem-hypothesis-guide.md` |
| 가이드 | direction-setting-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/02-direction-setting-guide.md` |
| 가이드 | ideation-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/03-ideation-guide.md` |
| 가이드 | solution-selection-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/04-solution-selection-guide.md` |
| 가이드 | event-storming-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/05-event-storming-guide.md` |
| 가이드 | user-stories-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/06-user-stories-guide.md` |
| 가이드 | multimodal-ai | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/01-multimodal-ai.md` |
| 가이드 | langchain | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/02-langchain.md` |
| 가이드 | rag | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/03-rag.md` |
| 가이드 | mcp | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/04-mcp.md` |
| 가이드 | mas-langgraph | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/05-mas-langgraph.md` |
| 가이드 | pptx-build-guide | `{DMAP_PLUGIN_DIR}/resources/guides/office/pptx-build-guide.md` |
| 템플릿 | pptx-spec-writer-AGENT | `{DMAP_PLUGIN_DIR}/resources/templates/office/pptx-spec-writer-AGENT.md` |
| 템플릿 | pptx-builder-SKILL | `{DMAP_PLUGIN_DIR}/resources/templates/office/pptx-builder-SKILL.md` |
| 샘플 | pptx-build-sample | `{DMAP_PLUGIN_DIR}/resources/samples/office/pptx-build-sample.js` |

> **배치 원칙** (develop-plugin Phase3-Step3 자동 복사):
> - `ai/plan/*` 6종 → 각 sub-step 담당 에이전트의 `references/` (problem-analyst,
>   direction-setter, solution-explorer, solution-selector, event-storming-facilitator,
>   user-story-writer)
> - `ai/tech-info/*` 5종 → `agents/mas-architect/references/`
> - `pptx-*` 3종 → `agents/pptx-spec-writer/` 및 `skills/generate-pptx/`

---

## 비기능 요구사항

- **이식성**: DMAP 기반으로 Claude Code·Cursor·Cowork 어디서나 동작
  (`gateway/runtime-mapping.yaml`)
- **공유자원 경유 일원화**: 기획·설계 단계는 **develop-plugin이 자동 배치한 에이전트 로컬
  `references/` 경로만 참조**. 외부 npd·output 경로 직접 참조 금지
- **증거 기반 설계**: MAS 설계 각 섹션은 근거가 된 AI 기술정보 파일 경로·섹션을 각주로 인용
- **보안/프라이버시**: 사용자가 입력한 도메인·주제·인터뷰 원문은 플러그인 외부로 전송하지 않음.
  PII 의심 데이터는 마스킹 권고 안내
- **경영진 소통**: PPT는 "고객 WHY → 기업 WHY → 문제·방향성 → 핵심 솔루션 → MAS 설계 → 로드맵 →
  기대효과" 순서 고정, 기술 용어는 비즈니스 언어로 번역

---

## 성공 기준

| 구분 | 성공 기준 |
|------|---------|
| 기획 완결성 | 현상문제 3개·근본원인·방향성·솔루션 후보 5+개·최적안 선정 근거·이벤트 스토밍·유저스토리 100% 산출 |
| 근거 인용 | MAS 설계서 각 섹션이 에이전트 로컬 `references/` 하위 `ai/tech-info/*.md` 해당 섹션을 인용(각주 필수) |
| 설계 구체성 | LangGraph 노드/엣지/State, 에이전트 프로파일, Tool·MCP 바인딩, RAG·메모리, 멀티모달 I/O, 에러/폴백 7개 항목 모두 충족 |
| GREAT 2 WHY | PPT에 고객 WHY + 기업 WHY 슬라이드 각각 포함, 방향성·핵심 솔루션·MAS 아키텍처 결과 슬라이드 존재 |
| 독립 검증 | reviewer가 유저스토리↔설계↔PPT 정합성 체크리스트 통과 판정 |
| 산출 형식 | 마크다운 설계서 + PPTX 2종 일관성 유지, pptx-build-guide 스타일 준수 |
