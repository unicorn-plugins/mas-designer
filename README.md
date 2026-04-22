# mas-designer

> **비즈니스 도메인·주제 → AI 활용 기획 → MAS 아키텍처 설계 → 경영진 발표 PPT** end-to-end 자동화 DMAP 플러그인.

---

## 개요

**mas-designer**는 AI 기획자·프로덕트 매니저·엔터프라이즈 아키텍트가 비즈니스 도메인과 주제를 입력하면, 체계적인 기획 6단계(문제가설·방향성·솔루션 탐색/선정·이벤트 스토밍·유저스토리)를 거쳐 실행 가능한 **MAS(Multi-Agent System) 아키텍처**를 LangGraph 기반으로 설계하고, GREAT 2 WHY를 충족하는 경영진 발표용 PPT까지 자동 생성하는 DMAP 플러그인입니다.

### 주요 기능

- **AI 활용 기획 (STEP 1)**: 현상문제 3개 + 5WHY → 킹핀 문제 + 방향성 → SCAMPER/AI 패턴 카드 발산·수렴 → 이벤트 스토밍 → 유저스토리(UFR/AFR/NFR)
- **MAS 아키텍처 설계 (STEP 2)**: 에이전트 토폴로지, LangGraph 노드·엣지·State, 상호작용 시퀀스, Tool/MCP 바인딩, RAG·메모리 전략, 멀티모달 I/O, 에러·폴백·관측성·보안
- **경영진 발표 PPT (STEP 3)**: GREAT 2 WHY 필수(고객 WHY·기업 WHY) + 이미지 자동 생성(Gemini) + pptxgenjs 빌드
- **독립 검증**: 유저스토리 ↔ MAS 설계 ↔ PPT 3단 정합성, 근거 인용 정확성 자동 판정

### 플러그인 구조

| 구성 | 개수 | 설명 |
|------|:----:|------|
| 에이전트 | 10종 | problem-analyst / direction-setter / solution-explorer / solution-selector / event-storming-facilitator / user-story-writer / mas-architect / reviewer / pptx-spec-writer / doc-exporter |
| 스킬 | 7종 | setup / help / core / plan / design-mas / generate-pptx / review |
| 커스텀 도구 | 1종 | `generate_image` (Gemini Nano Banana 기반) |

---

## 설치

### 1) 마켓플레이스 등록 및 플러그인 설치

```bash
# 로컬 마켓플레이스 등록 (현재 디렉토리 기준)
claude plugin marketplace add /absolute/path/to/mas-designer
claude plugin install mas-designer@mas-designer
```

### 2) 플러그인 초기 설정

```
/mas-designer:setup
```

setup 스킬은 다음을 자동 수행합니다:
- Node.js(≥18) / Python(≥3.10) 런타임 확인
- `pptxgenjs` (npm) 및 `google-genai` + `python-dotenv` + `pillow` (pip) 설치
- `gateway/tools/.env`에 `GEMINI_API_KEY` 등록 (사용자 입력)
- `runtime-mapping.yaml`의 tier → 모델 매핑 사용자 확인
- 런타임 상주 파일(`~/.claude/CLAUDE.md` 또는 `{PLUGIN_DIR}/AGENTS.md`)에 라우팅 테이블 등록
- tier 갱신 시 런타임 어댑터 스텁(`.claude/.cursor/.codex/.antigravity/agents/*`) `model:` 필드 일괄 동기화

---

## 업그레이드

**로컬 마켓플레이스 (로컬 경로 기반)**:
```bash
# 1. 플러그인 소스 갱신
cd /absolute/path/to/mas-designer
git pull origin main

# 2. 마켓플레이스 업데이트 + 재설치
claude plugin marketplace update mas-designer
claude plugin install mas-designer@mas-designer
```

**갱신이 반영되지 않는 경우**: 삭제 후 재설치하세요.
```bash
claude plugin remove mas-designer@mas-designer
claude plugin marketplace update mas-designer
claude plugin install mas-designer@mas-designer
```

업그레이드 후 `gateway/install.yaml`에 새 의존성이 추가된 경우 `/mas-designer:setup`을 재실행합니다.

---

## 사용법

### 슬래시 명령 목록

| 명령 | 설명 |
|------|------|
| `/mas-designer:setup` | 플러그인 초기 설정 |
| `/mas-designer:help` | 사용 안내 |
| `/mas-designer:router` | **전체 파이프라인** 실행 (기획 → 설계 → PPT → 검증) |
| `/mas-designer:plan` | STEP 1 기획 단독 실행 |
| `/mas-designer:design-mas` | STEP 2 MAS 설계 단독 실행 |
| `/mas-designer:generate-pptx` | STEP 3 PPT 생성 단독 실행 |
| `/mas-designer:review` | 최종 독립 검증 |

### 기본 사용 예시

```
/mas-designer:router

→ [도메인/주제 입력] "스마트 물류에서 AI 견적 자동화"
→ [프로젝트 식별자 선택] smart-logistics-quoting / ai-quoting-agent / logistics-auto-quote
→ [STEP 1 기획 실행] → 승인
→ [STEP 2 MAS 설계 실행] → 승인
→ [STEP 3 PPT 생성 실행] → 승인
→ [최종 독립 검증 실행]
→ output/smart-logistics-quoting/final/ 에 최종 패키지 생성
```

### 산출물 디렉토리 구조

```
output/{project}/
├── plan/           # STEP 1: 문제가설·방향성·솔루션·이벤트 스토밍·유저스토리
│   └── es/         # PlantUML 시퀀스 다이어그램
├── step2/          # STEP 2: MAS 설계 7섹션 + 통합 설계서
├── step3/          # STEP 3: 스토리라인·spec·이미지·빌드 스크립트·PPTX
└── final/          # 최종 패키지 (mas-architecture.md, {project}.pptx, MANIFEST.md, review-report.md)
```

---

## 요구사항

### 런타임
- **Claude Code** (DMAP 런타임)
- **Node.js ≥18** — pptxgenjs 실행
- **Python ≥3.10** — generate_image 도구 실행

### 외부 API
- **Gemini API Key** (무료 발급: [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)) — 이미지 생성에 필요. `gateway/tools/.env`에 `GEMINI_API_KEY` 등록.

### 의존 라이브러리
| 라이브러리 | 런타임 | 설치 명령 |
|-----------|:------:|----------|
| `pptxgenjs` | node | `npm install pptxgenjs` |
| `google-genai` `python-dotenv` `pillow` | python | `pip install google-genai python-dotenv pillow` |

모두 setup 스킬이 자동 설치합니다. 수동 설치가 필요하면 위 명령을 실행하세요.

### 인터넷 접근
- Claude Code builtin `WebSearch` (도메인 리서치, 업계 벤치마크 조사용). 별도 MCP 설치 불필요.

---

## 라이선스

MIT
