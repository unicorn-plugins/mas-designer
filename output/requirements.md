# mas-designer 요구사항 정의서

> 팀 기획서(`output/team-plan-mas-designer.md`) + Phase 1 인터뷰 결과 반영.

---

## 1. 기본 정보

- **플러그인명**: mas-designer
- **목표**: 사용자가 제시한 비즈니스 도메인·주제에 대해 **AI 활용 기획 → MAS 아키텍처 설계 →
  경영진 발표용 PPT 산출**을 end-to-end로 자동화
- **대상 도메인**: AI 활용 신규 서비스/업무 자동화 기획 · 멀티에이전트 시스템 설계
- **대상 사용자**: AI 기획자, 프로덕트 매니저, 엔터프라이즈 아키텍트, AI TF 리더, CTO 보좌 조직

---

## 2. 핵심 기능

### 2-1. AI 활용 기획 (STEP 1, 7 sub-steps)
- 도메인·주제 입력 → 현상문제·근본원인 → 방향성 → 솔루션 탐색·선정 → 이벤트 스토밍 → 유저스토리
- 각 단계는 `ai/plan/*` 6종 가이드를 엄격 참조
- 산출물: 평면 파일(문제가설.md, 킹핀문제.md 등) + `es/*.puml` 디렉토리

### 2-2. MAS 아키텍처 설계 (STEP 2, 8 sub-steps)
- 에이전트 식별 → LangGraph 그래프 → 상호작용 시퀀스 → Tool/MCP 바인딩 → RAG/메모리 → 멀티모달 I/O
  → 에러·폴백·관측성 → 통합 설계서
- `ai/tech-info/*` 5종 가이드를 근거로 인용(각주 필수)
- 산출물: `output/{project}/step2/1~7.md` + 통합 `mas-architecture.md`

### 2-3. 발표자료 PPT 생성 (STEP 3, 3 sub-steps)
- GREAT 2 WHY 중심 스토리라인 → 슬라이드 마크다운 스크립트 → PPTX 빌드
- **이미지 생성**: 커버/아키텍처 일러스트 등은 `generate_image` (Gemini Nano Banana) 활용
- 산출물: `output/{project}/step3/3.{project}.pptx`

---

## 3. 인터뷰 반영 사항 (Phase 1 결정)

| 항목 | 결정 | 영향 |
|------|------|------|
| Q1. `{project}` 식별자 | **AI 자동 제안 + 사용자 확인** | Step 1-1에 `project-namer` 서브스텝 추가 — 도메인·주제·킹핀 키워드에서 영문 kebab-case 식별자 2~3안 제시 후 사용자 선택 |
| Q2. PPT 이미지 생성 | **필요** | 공유자원에 `generate_image` 도구 추가 등록 → `pptx-spec-writer` 에이전트에서 슬라이드별 이미지 생성 지시 포함 |
| Q3. PlantUML 검증 | 불필요 | Step 1-6 산출물은 검증 도구 없이 마크다운 그대로 커밋 |
| Q4. 도메인 리서치 | **기본 WebSearch 도구 활용** | 별도 MCP 등록 없음. 각 기획 에이전트가 필요 시 WebSearch 호출 |
| Q5. 승인 정책 | **STEP 경계 3회 승인** | STEP 1 완료(유저스토리 확정) / STEP 2 완료(MAS 설계서 확정) / STEP 3 완료(PPTX 확정) 시점만 사용자 승인 요청 |

---

## 4. 기술 요건

### 4-1. 기술 스택
- **런타임**: Claude Code (오케스트레이터), Node.js(pptxgenjs 빌드), Python 3.x(generate_image)
- **라이브러리**:
  - `pptxgenjs` (Node) — PPT 빌드
  - Gemini API SDK (Python) — 이미지 생성 (generate_image 도구 내장)
- **프로토콜**: WebSearch (Claude Code builtin), MCP 없음

### 4-2. 외부 시스템 연동
- **Gemini API**: 이미지 생성용 API Key 필요 (`GOOGLE_API_KEY` 또는 `GEMINI_API_KEY`, setup 스킬에서 사용자 입력 요청)
- **WebSearch**: Claude Code 기본 도구 (별도 설정 불필요)

### 4-3. 데이터 입출력
- **입력**: 사용자 자유 서술 텍스트 (비즈니스 도메인·주제·고민)
- **출력**: 마크다운 파일(.md), PlantUML(.puml), SVG, PPTX 바이너리
- **저장소**: 로컬 파일 시스템 (`{PLUGIN_DIR}/output/{project}/`)

### 4-4. 보안/프라이버시
- 사용자 입력 원문은 플러그인 외부로 전송하지 않음 (WebSearch는 도메인 키워드만 사용)
- API Key는 `.env`로 격리, `.gitignore`로 제외
- PII 의심 데이터는 마스킹 권고 안내

### 4-5. 성능/비용
- 18 sub-step 전체 수행 기준 예상 시간 30~60분 (인터뷰 답변 대기 시간 제외)
- 이미지 생성 건수: PPT 슬라이드당 최대 1장, 전체 10~15장 예상

### 4-6. 에러 처리
- 가이드 참조 실패(파일 누락) → 에이전트 즉시 중단, 사용자에게 setup 스킬 재실행 안내
- PPTX 빌드 실패 → 스크립트 로그 출력 + 최대 3회 재시도 (build-guide 검증 규칙 위반)
- 이미지 생성 실패(API 오류) → 해당 슬라이드는 플레이스홀더 박스로 대체, 경고 로그 기록

---

## 5. 공유자원 (업데이트)

팀 기획서 15건 + Q2 반영 1건 = **총 16건**

| 자원 유형 | 자원명 | 자원 경로 | 배치 대상 |
|----------|--------|-----------|----------|
| 가이드 | problem-hypothesis-guide | `{DMAP}/resources/guides/ai/plan/01-problem-hypothesis-guide.md` | `agents/problem-analyst/references/` |
| 가이드 | direction-setting-guide | `{DMAP}/resources/guides/ai/plan/02-direction-setting-guide.md` | `agents/direction-setter/references/` |
| 가이드 | ideation-guide | `{DMAP}/resources/guides/ai/plan/03-ideation-guide.md` | `agents/solution-explorer/references/` |
| 가이드 | solution-selection-guide | `{DMAP}/resources/guides/ai/plan/04-solution-selection-guide.md` | `agents/solution-selector/references/` |
| 가이드 | event-storming-guide | `{DMAP}/resources/guides/ai/plan/05-event-storming-guide.md` | `agents/event-storming-facilitator/references/` |
| 가이드 | user-stories-guide | `{DMAP}/resources/guides/ai/plan/06-user-stories-guide.md` | `agents/user-story-writer/references/` |
| 가이드 | multimodal-ai | `{DMAP}/resources/guides/ai/tech-info/01-multimodal-ai.md` | `agents/mas-architect/references/` |
| 가이드 | langchain | `{DMAP}/resources/guides/ai/tech-info/02-langchain.md` | `agents/mas-architect/references/` |
| 가이드 | rag | `{DMAP}/resources/guides/ai/tech-info/03-rag.md` | `agents/mas-architect/references/` |
| 가이드 | mcp | `{DMAP}/resources/guides/ai/tech-info/04-mcp.md` | `agents/mas-architect/references/` |
| 가이드 | mas-langgraph | `{DMAP}/resources/guides/ai/tech-info/05-mas-langgraph.md` | `agents/mas-architect/references/` |
| 가이드 | pptx-build-guide | `{DMAP}/resources/guides/office/pptx-build-guide.md` | `agents/pptx-spec-writer/references/` + `skills/generate-pptx/references/` |
| 템플릿 | pptx-spec-writer-AGENT | `{DMAP}/resources/templates/office/pptx-spec-writer-AGENT.md` | `agents/pptx-spec-writer/AGENT.md` (시작점) |
| 템플릿 | pptx-builder-SKILL | `{DMAP}/resources/templates/office/pptx-builder-SKILL.md` | `skills/generate-pptx/SKILL.md` (시작점) |
| 샘플 | pptx-build-sample | `{DMAP}/resources/samples/office/pptx-build-sample.js` | `skills/generate-pptx/references/` |
| **도구 (신규 추가)** | **generate_image** | `{DMAP}/resources/tools/generate-image.md`의 '소스 경로' | `gateway/tools/` |

---

## 6. 에이전트 구성 (변경 없음)

팀 기획서의 10개 에이전트 + 세부역할 체계 그대로 유지.

- problem-analyst (HIGH) + domain-interviewer
- direction-setter (HIGH) + why-crystallizer
- solution-explorer (MEDIUM) + ai-pattern-lib
- solution-selector (HIGH)
- event-storming-facilitator (HIGH)
- user-story-writer (MEDIUM)
- mas-architect (HIGH) + graph-designer / tool-mcp-binder / rag-planner / multimodal-mapper
- reviewer (HIGH) — 독립 검증
- pptx-spec-writer (MEDIUM) — generate_image 호출 포함
- doc-exporter (LOW) — final/ 패키징

---

## 7. 스킬 구성 (예비 설계)

| 스킬 | 유형 | 필수 | 설명 |
|------|------|:----:|------|
| setup | Setup | 필수 | 의존성 설치, API Key 설정, 라우팅 등록 |
| help | Utility | 필수 | 명령 목록·자동 라우팅 안내 (하드코딩) |
| core | Core (위임형) | 선택 | STEP 1→2→3 파이프라인 전체 실행 |
| plan | Orchestrator | 필수 | STEP 1 (AI 활용 기획 7 sub-steps) 수행 |
| design-mas | Orchestrator | 필수 | STEP 2 (MAS 아키텍처 설계 8 sub-steps) 수행 |
| generate-pptx | Orchestrator | 필수 | STEP 3 (PPT 생성 3 sub-steps) — spec-writer 위임 + pptxgenjs 빌드 |
| review | Orchestrator | 필수 | 최종 독립 검증 (유저스토리 ↔ 설계 ↔ PPT 정합성) |

> 세부 워크플로우는 Phase 2 개발 계획서에서 확정.

---

## 8. 디렉토리 구조 (예비)

```
mas-designer/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── skills/
│   ├── setup/
│   ├── help/
│   ├── core/
│   ├── plan/
│   ├── design-mas/
│   ├── generate-pptx/
│   └── review/
├── agents/
│   ├── problem-analyst/
│   ├── direction-setter/
│   ├── solution-explorer/
│   ├── solution-selector/
│   ├── event-storming-facilitator/
│   ├── user-story-writer/
│   ├── mas-architect/
│   ├── reviewer/
│   ├── pptx-spec-writer/
│   └── doc-exporter/
├── gateway/
│   ├── install.yaml
│   ├── runtime-mapping.yaml
│   └── tools/
│       └── generate_image.py  ← 공유자원 복사
├── commands/
│   ├── setup.md
│   ├── help.md
│   ├── core.md
│   ├── plan.md
│   ├── design-mas.md
│   ├── generate-pptx.md
│   └── review.md
├── output/
│   └── {project}/{plan|step2|step3|final}/
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## 9. 성공 기준 (팀 기획서 + 보완)

| 구분 | 성공 기준 |
|------|----------|
| 기획 완결성 | 현상문제 3개·근본원인·방향성·솔루션 후보 5+개·최적안 선정 근거·이벤트 스토밍·유저스토리 100% 산출 |
| 근거 인용 | MAS 설계서 각 섹션이 `ai/tech-info/*.md` 해당 섹션을 각주로 인용 |
| 설계 구체성 | LangGraph 노드/엣지/State, 에이전트 프로파일, Tool·MCP 바인딩, RAG·메모리, 멀티모달 I/O, 에러/폴백 7개 항목 모두 충족 |
| GREAT 2 WHY | PPT에 고객 WHY + 기업 WHY 슬라이드 각각 포함, 방향성·핵심 솔루션·MAS 아키텍처 결과 슬라이드 존재 |
| 이미지 생성 | 커버·아키텍처 다이어그램 슬라이드에 generate_image 산출물 포함 |
| 승인 정책 | STEP 1/2/3 경계에서 사용자 승인 3회 획득 |
| 독립 검증 | reviewer가 정합성 체크리스트 통과 판정 |
| 산출 형식 | 마크다운 설계서 + PPTX 2종 일관성 유지, pptx-build-guide 스타일 준수 |

---

## 10. 비기능 요구사항

- **이식성**: DMAP 기반 Claude Code·Cursor·Cowork 호환
- **공유자원 일원화**: 에이전트 로컬 `references/`만 참조 (외부 절대경로 금지)
- **증거 기반 설계**: MAS 설계 각 섹션은 근거 파일 경로·섹션 각주 인용
- **보안**: API Key는 `.env` 격리, PII 마스킹 권고
- **경영진 소통**: PPT는 고객 WHY → 기업 WHY → 문제·방향성 → 핵심 솔루션 → MAS 설계 → 로드맵 → 기대효과 순서 고정
