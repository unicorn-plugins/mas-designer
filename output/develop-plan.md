# mas-designer 개발 계획서

> DMAP 표준 4종(plugin / agent / skill / gateway) 준수. pptx 2단계 패턴 + generate_image 통합.

---

## 기본 정보
- **플러그인명**: mas-designer
- **목표**: AI 활용 기획(6단계) → MAS 아키텍처 설계(7섹션) → 경영진 발표 PPT(GREAT 2 WHY) 자동화
- **대상 도메인**: AI 기획 · 멀티에이전트 시스템 설계
- **대상 사용자**: AI 기획자, PM, 엔터프라이즈 아키텍트, AI TF 리더

---

## 핵심기능

### 1. AI 활용 기획 (STEP 1)
7 sub-step 순차 수행(프로젝트 네이밍 → 문제가설 → 방향성 → 솔루션 탐색/선정 → 이벤트 스토밍 → 유저스토리).
각 sub-step은 `ai/plan/*` 가이드 6종을 에이전트 로컬 `references/`에서 참조.
산출물: `output/{project}/plan/` 하위 평면 구조(문제가설.md, 킹핀문제.md 등) + `es/*.puml`.

### 2. MAS 아키텍처 설계 (STEP 2)
8 sub-step 순차 수행(에이전트 식별/LangGraph/시퀀스/Tool·MCP/RAG·메모리/멀티모달/에러폴백/통합).
`ai/tech-info/*` 5종을 각주로 인용하는 증거 기반 설계.
산출물: `output/{project}/step2/1~7.md` + `mas-architecture.md`.

### 3. 발표자료 PPT 생성 (STEP 3)
3 sub-step(스토리라인 → 시각 명세 작성 → 빌드). GREAT 2 WHY 슬라이드 필수.
`pptx-spec-writer` 에이전트가 시각 명세 작성 시 슬라이드별 이미지 프롬프트 포함,
`generate-pptx` 스킬이 `generate_image`로 실제 이미지 생성 후 `pptxgenjs` 빌드.

### 4. 독립 검증 (최종)
reviewer 에이전트가 유저스토리↔설계↔PPT 정합성, GREAT 2 WHY 충족, 근거 인용 정확성 검증.
산출물: `output/{project}/final/mas-architecture.md`, `output/{project}/final/{project}.pptx`.

---

## 업무 플로우

### 전체 파이프라인 (core 스킬)

- Step 1. 도메인/주제 수집 + 프로젝트 네이밍  
  사용자 입력 → AI가 2~3안 영문 kebab-case 제안 → 사용자 선택으로 `{project}` 확정
- Step 2. STEP 1 기획 실행 (plan 스킬 위임) → 사용자 승인
- Step 3. STEP 2 MAS 설계 실행 (design-mas 스킬 위임) → 사용자 승인
- Step 4. STEP 3 PPT 생성 실행 (generate-pptx 스킬 위임) → 사용자 승인
- Step 5. 최종 독립 검증 (review 스킬 위임)
- Step 6. `final/` 패키징 (doc-exporter 에이전트)

### 각 STEP 단독 실행

- `/mas-designer:plan` → STEP 1만 실행 (유저스토리까지 산출)
- `/mas-designer:design-mas` → STEP 2만 실행 (기존 유저스토리 전제)
- `/mas-designer:generate-pptx` → STEP 3만 실행 (기존 설계서 전제)
- `/mas-designer:review` → 기존 산출물에 대한 검증만 실행

---

## 기술 요구사항

### 기술 스택
- **오케스트레이터**: Claude Code (DMAP 런타임)
- **빌드 런타임**: Node.js (pptxgenjs), Python 3.x (generate_image / google-genai)
- **외부 API**: Gemini API (이미지 생성)
- **웹 리서치**: Claude Code builtin `WebSearch`

### 인증/보안
- `GOOGLE_API_KEY` (또는 `GEMINI_API_KEY`) — `.env` 격리, `.gitignore` 제외
- PII 의심 데이터는 에이전트 워크플로우에 마스킹 권고 명시

### 데이터 입출력
- **입력**: 사용자 자유 서술 (도메인·주제·고민)
- **중간 산출**: `.md`, `.puml`, `.svg`
- **최종 산출**: `.md` 설계서 + `.pptx` 바이너리

### 성능/비용
- HIGH 티어 에이전트 6개(opus) × 평균 2~4회 호출 예상
- 이미지 생성: PPT 슬라이드당 1장, 총 10~15장

### 에러 처리
- 가이드 파일 누락 → 즉시 중단, setup 스킬 재실행 안내
- PPTX 빌드 실패 → 최대 3회 재시도, pptx-build-guide 검증 규칙 로그
- 이미지 생성 API 실패 → 해당 슬라이드 플레이스홀더 박스로 대체 + 경고

---

## 공유자원

| 자원 유형 | 자원명 | 자원 경로 | 배치 대상 |
|----------|--------|-----------|----------|
| 가이드 | problem-hypothesis-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/01-problem-hypothesis-guide.md` | `agents/problem-analyst/references/` |
| 가이드 | direction-setting-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/02-direction-setting-guide.md` | `agents/direction-setter/references/` |
| 가이드 | ideation-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/03-ideation-guide.md` | `agents/solution-explorer/references/` |
| 가이드 | solution-selection-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/04-solution-selection-guide.md` | `agents/solution-selector/references/` |
| 가이드 | event-storming-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/05-event-storming-guide.md` | `agents/event-storming-facilitator/references/` |
| 가이드 | user-stories-guide | `{DMAP_PLUGIN_DIR}/resources/guides/ai/plan/06-user-stories-guide.md` | `agents/user-story-writer/references/` |
| 가이드 | multimodal-ai | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/01-multimodal-ai.md` | `agents/mas-architect/references/` |
| 가이드 | langchain | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/02-langchain.md` | `agents/mas-architect/references/` |
| 가이드 | rag | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/03-rag.md` | `agents/mas-architect/references/` |
| 가이드 | mcp | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/04-mcp.md` | `agents/mas-architect/references/` |
| 가이드 | mas-langgraph | `{DMAP_PLUGIN_DIR}/resources/guides/ai/tech-info/05-mas-langgraph.md` | `agents/mas-architect/references/` |
| 가이드 | pptx-build-guide | `{DMAP_PLUGIN_DIR}/resources/guides/office/pptx-build-guide.md` | `agents/pptx-spec-writer/references/` + `skills/generate-pptx/references/` |
| 템플릿 | pptx-spec-writer-AGENT | `{DMAP_PLUGIN_DIR}/resources/templates/office/pptx-spec-writer-AGENT.md` | `agents/pptx-spec-writer/AGENT.md` (시작점) |
| 템플릿 | pptx-builder-SKILL | `{DMAP_PLUGIN_DIR}/resources/templates/office/pptx-builder-SKILL.md` | `skills/generate-pptx/SKILL.md` (시작점) |
| 샘플 | pptx-build-sample | `{DMAP_PLUGIN_DIR}/resources/samples/office/pptx-build-sample.js` | `skills/generate-pptx/references/` |
| 도구 | generate_image | `{DMAP_PLUGIN_DIR}/resources/tools/generate-image.md`의 소스 경로 | `gateway/tools/` |

### 커스텀 도구 개발 계획
신규 개발 없음. `generate_image`는 공유자원에서 복사만 수행.

---

## 플러그인 구조 설계

### 에이전트 구성 설계

#### 에이전트 목록 및 역할

| 에이전트 | 티어 | 역할 | 책임 |
|---------|------|------|------|
| problem-analyst | HIGH | 현상문제·근본원인 도출 전문가 | STEP 1-2: 대표 현상문제 3개 선정, 5WHY, 비즈니스 가치 정의. 세부역할: domain-interviewer |
| direction-setter | HIGH | 방향성 정의 전문가 | STEP 1-3: 킹핀 문제 선정, Needs Statement, GREAT 2 WHY 초안. 세부역할: why-crystallizer |
| solution-explorer | MEDIUM | 솔루션 탐색 전문가 | STEP 1-4: SCAMPER·AI 패턴 카드로 발산 → 유사도 수렴. 세부역할: ai-pattern-lib |
| solution-selector | HIGH | 솔루션 선정 전문가 | STEP 1-5: B/F 투표 + 우선순위 매트릭스 + AI 실현 가능성 평가 |
| event-storming-facilitator | HIGH | 이벤트 스토밍 전문가 | STEP 1-6: 도메인 이벤트/Aggregate/Bounded Context + PlantUML 시퀀스 |
| user-story-writer | MEDIUM | 유저스토리 작성 전문가 | STEP 1-7: UFR/AFR/NFR + Given-When-Then + LLM 검증 AC |
| mas-architect | HIGH | MAS 아키텍처 설계 전문가 | STEP 2 전체: LangGraph 그래프, 시퀀스, Tool·MCP, RAG, 멀티모달, 에러폴백. 세부역할: graph-designer / tool-mcp-binder / rag-planner / multimodal-mapper |
| reviewer | HIGH | 독립 검증 전문가 | 유저스토리↔설계↔PPT 정합성, GREAT 2 WHY, 근거 인용 검증. 독립 컨텍스트 |
| pptx-spec-writer | MEDIUM | PPT 시각 명세 작성 전문가 | GREAT 2 WHY·방향성·MAS 아키텍처 필수 슬라이드 spec.md + 이미지 프롬프트 |
| doc-exporter | LOW | 최종 산출물 패키징 전문가 | `final/` 디렉토리 정리, 파일명 표준화, 일관성 점검 |

#### 에이전트 간 의존성

```
사용자 입력
   ↓
[plan 스킬]
   problem-analyst → direction-setter → solution-explorer
      → solution-selector → event-storming-facilitator → user-story-writer
   ↓ (유저스토리 확정)
[design-mas 스킬]
   mas-architect (세부역할 4종 병렬 활용 가능)
   ↓ (MAS 설계서 확정)
[generate-pptx 스킬]
   pptx-spec-writer → (generate_image 호출) → pptxgenjs 빌드
   ↓ (PPTX 확정)
[review 스킬]
   reviewer (독립 컨텍스트)
   ↓
[doc-exporter] → final/ 패키징
```

- 에이전트 간 직접 호출 없음. 모든 오케스트레이션은 스킬이 담당 (DMAP MUST NOT #2).
- 핸드오프는 agentcard.yaml의 `handoff` 선언으로만 표현.

---

#### 스킬 목록

| 스킬명 | 유형 | 필수 | 설명 | 워크플로우 |
|--------|------|:----:|------|----------|
| setup | setup | 필수 | 플러그인 초기 설정 (MCP/LSP/runtime_deps 설치, API Key 설정, 라우팅 등록) | install.yaml 실행 |
| help | utility | 필수 | 명령 목록 · 자동 라우팅 안내 (하드코딩 즉시 출력) | — |
| core | orchestrator | 필수 | 전체 파이프라인 (plan → design-mas → generate-pptx → review) + STEP 경계 승인 | Phase 1~5 |
| plan | orchestrator | 필수 | STEP 1 기획 (7 sub-step, 6 에이전트 순차) | Phase 1~7 |
| design-mas | orchestrator | 필수 | STEP 2 MAS 설계 (mas-architect 세부역할 4종 활용, 8 sub-step) | Phase 1~8 |
| generate-pptx | orchestrator | 필수 | STEP 3 PPT 생성 (spec-writer 위임 + generate_image + pptxgenjs 빌드) | Phase 1~3 |
| review | orchestrator | 필수 | 최종 독립 검증 (reviewer 에이전트 단독 실행) | Phase 1~2 |

---

#### 스킬 워크플로우

**core**:
1. Phase 0. 도메인·주제 수집 + `{project}` 네이밍 (AI 2~3안 → 사용자 선택)
2. Phase 1. `→ Skill: plan` 위임 → STEP 1 완료 → 사용자 승인
3. Phase 2. `→ Skill: design-mas` 위임 → STEP 2 완료 → 사용자 승인
4. Phase 3. `→ Skill: generate-pptx` 위임 → STEP 3 완료 → 사용자 승인
5. Phase 4. `→ Skill: review` 위임
6. Phase 5. `→ Agent: doc-exporter` 위임 (final/ 패키징)

**plan**:
- Phase 1~6. 6개 기획 에이전트 순차 위임 (각 `→ Agent: {agent}` 마커, 5항목 필수)
- Phase 7. 유저스토리 검증 및 사용자 보고

**design-mas**:
- Phase 1~7. mas-architect 에이전트에 세부역할별 7회 위임
  (graph-designer / tool-mcp-binder / rag-planner / multimodal-mapper / 시퀀스 / 에러폴백 / 통합)
- Phase 8. 통합 설계서 `mas-architecture.md` 생성 및 검증

**generate-pptx** (pptx-builder-SKILL 템플릿 기반):
- Phase 1. `→ Agent: pptx-spec-writer` 위임 → `spec.md` + 이미지 프롬프트 산출
- Phase 2. 이미지 생성 루프 — Bash로 `python gateway/tools/generate_image.py` 호출 (슬라이드별)
- Phase 3. 가이드 로드 → Build script(pptxgenjs) 작성(Write) → 실행(Bash) → 파일 존재·크기 검증 (재시도 ≤3)

**review**:
- Phase 1. `→ Agent: reviewer` 위임 (체크리스트 기반 독립 검증)
- Phase 2. 결과 보고 및 수정 사이클(최대 3회)

---

### Gateway 설정 설계

#### install.yaml (설치 매니페스트)

```yaml
# MCP 서버 — 없음 (WebSearch는 Claude Code builtin)
mcp_servers: []

# LSP 서버 — 없음
lsp_servers: []

# 커스텀 도구
custom_tools:
  - name: generate_image
    description: "Gemini(Nano Banana) 기반 이미지 생성"
    source: tools/generate_image.py
    required: true

# 런타임 의존성
runtime_dependencies:
  - name: pptxgenjs
    description: "PPT 빌드용 Node.js 라이브러리"
    runtime: node
    install: "npm install pptxgenjs"
    check: "node -e \"require('pptxgenjs')\""
    required: true
  - name: google-genai
    description: "Gemini API Python SDK (generate_image 의존성)"
    runtime: python
    install: "pip install google-genai python-dotenv pillow"
    check: "python -c \"from google import genai\""
    required: true
```

#### runtime-mapping.yaml (추상 → 구체 매핑)

> **모델 버전**: 2026-04-21 기준 최신 버전. setup 스킬이 사용자 확인 후 필요 시 조정.

```yaml
# 티어 → 모델 매핑
tier_mapping:
  default:
    HEAVY:
      model: "claude-opus-4-7"
    HIGH:
      model: "claude-opus-4-7"
    MEDIUM:
      model: "claude-sonnet-4-6"
    LOW:
      model: "claude-haiku-4-5"
  # 세부역할별 예외 — mas-architect는 통합 작업에 HEAVY 예산 할당
  mas-architect:
    HIGH:
      model: "claude-opus-4-7"
    sub_roles:
      graph-designer:
        HIGH:
          model: "claude-opus-4-7"
      tool-mcp-binder:
        MEDIUM:
          model: "claude-sonnet-4-6"
      rag-planner:
        MEDIUM:
          model: "claude-sonnet-4-6"
      multimodal-mapper:
        MEDIUM:
          model: "claude-sonnet-4-6"

# 추상 도구 → 실제 도구 매핑 (builtin 제외)
tool_mapping:
  image_generate:
    - type: custom
      source: "tools/generate_image.py"
      tools: ["generate_image"]

# 금지 액션 → 실제 도구 매핑
action_mapping:
  file_write: ["Write", "Edit"]
  file_delete: ["Bash"]
  code_execute: ["Bash"]
  network_access: ["WebFetch", "WebSearch"]
  user_interact: ["AskUserQuestion"]
  agent_delegate: ["Task"]
```

> **WebSearch 처리**: builtin 도구이므로 tool_mapping에 등록하지 않음 (Gateway MUST NOT #2).
> 에이전트가 `{tool:web_search}` 대신 직접 builtin WebSearch 호출 허용.

---

### 디렉토리 구조 설계

```
mas-designer/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── .gitignore
├── CLAUDE.md
├── README.md
├── commands/
│   ├── setup.md
│   ├── help.md
│   ├── core.md
│   ├── plan.md
│   ├── design-mas.md
│   ├── generate-pptx.md
│   └── review.md
├── skills/
│   ├── setup/SKILL.md
│   ├── help/SKILL.md
│   ├── core/SKILL.md
│   ├── plan/SKILL.md
│   ├── design-mas/SKILL.md
│   ├── generate-pptx/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── pptx-build-guide.md
│   │       └── pptx-build-sample.js
│   └── review/SKILL.md
├── agents/
│   ├── problem-analyst/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/01-problem-hypothesis-guide.md
│   ├── direction-setter/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/02-direction-setting-guide.md
│   ├── solution-explorer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/03-ideation-guide.md
│   ├── solution-selector/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/04-solution-selection-guide.md
│   ├── event-storming-facilitator/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/05-event-storming-guide.md
│   ├── user-story-writer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/06-user-stories-guide.md
│   ├── mas-architect/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/
│   │       ├── 01-multimodal-ai.md
│   │       ├── 02-langchain.md
│   │       ├── 03-rag.md
│   │       ├── 04-mcp.md
│   │       └── 05-mas-langgraph.md
│   ├── reviewer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   └── tools.yaml
│   ├── pptx-spec-writer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   ├── tools.yaml
│   │   └── references/pptx-build-guide.md
│   └── doc-exporter/
│       ├── AGENT.md
│       ├── agentcard.yaml
│       └── tools.yaml
├── gateway/
│   ├── install.yaml
│   ├── runtime-mapping.yaml
│   └── tools/
│       └── generate_image.py
└── output/                # 사용자 실행 결과. gitignore 제외하지 않음
    └── {project}/
        ├── plan/
        ├── step2/
        ├── step3/
        └── final/
```

---

## 개발 계획

### 3.1 개발 순서 (순차적)

| 순번 | 단계 | 파일/디렉토리 | 예상 시간 | 검증 방법 |
|-----|------|-------------|---------|---------|
| 1 | 스켈레톤 생성 | `.claude-plugin/`, `.gitignore`, 디렉토리 골격 | 10분 | 디렉토리 트리 확인 |
| 2 | Gateway 설정 | `gateway/install.yaml`, `gateway/runtime-mapping.yaml` | 20분 | YAML 파싱 OK, 모델명 최신 확인 |
| 3 | 공유자원 복사 | `agents/*/references/`, `skills/generate-pptx/references/`, `gateway/tools/generate_image.py` | 15분 | 16건 전수 존재 확인 |
| 4 | 에이전트 개발 (10종) | `agents/{name}/{AGENT.md, agentcard.yaml, tools.yaml}` | 120분 | 표준 체크리스트 통과 |
| 5 | 스킬 개발 (7종) | `skills/{name}/SKILL.md` | 90분 | frontmatter + 마커 체크 |
| 6 | commands 진입점 (7종) | `commands/*.md` | 15분 | description + 3단계 지시문 |
| 7 | README.md | `README.md` | 20분 | 6개 필수 섹션 포함 |
| 8 | CLAUDE.md | `CLAUDE.md` | 20분 | 멤버 10명 + 스킬 7종 매핑 |
| 9 | 전체 검증 | 체크리스트 14항 | 20분 | 모든 항목 체크 통과 |

**총 예상**: 약 330분 (5.5시간).

### 3.2 병렬 가능 단계

- Step 4 (에이전트 10종): 에이전트 간 의존 없음 → 병렬 작성 가능 (6개 기획 + mas-architect + reviewer + pptx-spec-writer + doc-exporter)
- Step 5 (스킬 7종): setup/help 먼저, 이후 plan/design-mas/generate-pptx/review/core 병렬 가능
- Step 6 (commands 7종): 템플릿 기반 병렬 생성

### 3.3 공유 자원 활용 계획

- 가이드 12종은 에이전트별 `references/`에 정확히 매핑 (위 공유자원 표 배치 대상 컬럼 참조)
- 템플릿 2종(pptx-spec-writer-AGENT, pptx-builder-SKILL)은 시작점으로 사용 후 도메인 특화 보강
- 샘플(pptx-build-sample.js)은 빌드 스크립트 작성 시 구조 참조
- 도구(generate_image) 소스 복사 후 `.env` 예시 파일 생성 (`GOOGLE_API_KEY=your-key-here`)

### 3.4 기술 요구사항 확인

#### Python 라이브러리
- `google-genai>=0.3.0` — Gemini API SDK
- `python-dotenv>=1.0.0` — `.env` 로드
- `pillow>=10.0.0` — 이미지 처리

#### Node.js 라이브러리
- `pptxgenjs>=3.12.0` — PPT 빌드

#### 환경 변수 (`.env`)
- `GOOGLE_API_KEY` 또는 `GEMINI_API_KEY` — Gemini API 키 (필수)
- `.env.example` 템플릿 제공, `.gitignore`에 `.env` 등록

---

## Office 산출물 패턴 적용

- 감지 형식: **pptx** (단독)
- 적용 패턴: **2단계 패턴** (pptx-spec-writer 에이전트 + generate-pptx 빌더 스킬)
- `pptx-build-guide` 검증 규칙 11항 빌더 스킬 SKILL.md에 명시 적용
- 외부 변환 스킬(`anthropic-skills:pptx` 등) 호출 금지 — 모든 런타임 호환성 확보

---

## 검증 기준

개발 완료 시 다음 14개 체크리스트 통과:

- [ ] 표준 디렉토리 구조 준수
- [ ] `.claude-plugin/plugin.json` + `marketplace.json` 존재 및 표준 필드 포함
- [ ] 에이전트 10종 모두 AGENT.md + agentcard.yaml 존재
- [ ] 스킬 7종 모두 SKILL.md 존재, frontmatter 포함
- [ ] setup 스킬 존재, install.yaml 참조
- [ ] help 스킬 존재, 즉시 출력 방식
- [ ] Gateway install.yaml + runtime-mapping.yaml 존재
- [ ] commands/ 진입점 7개 파일 존재
- [ ] 에이전트 tools.yaml 추상 도구가 runtime-mapping.yaml tool_mapping 또는 builtin으로 매핑
- [ ] agentcard.yaml tier가 tier_mapping에 매핑
- [ ] 에이전트가 다른 에이전트를 직접 호출하지 않음
- [ ] README.md 6개 필수 섹션 포함
- [ ] pptx 2단계 패턴 준수 + pptx-build-guide 검증 규칙 명시
- [ ] install.yaml의 runtime_dependencies에 pptxgenjs + google-genai 등록, setup 스킬이 이를 참조
