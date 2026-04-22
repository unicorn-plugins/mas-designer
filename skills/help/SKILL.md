---
name: help
description: mas-designer 플러그인 사용 안내 (명령 목록·자동 라우팅·기본 플로우)
type: utility
user-invocable: true
---

# Help

[HELP 활성화]

## 목표
사용자 도움말 제공 — 명령 목록·자동 라우팅 규칙·기본 실행 플로우·산출물 구조 안내.

## 활성화 조건

사용자가 `/mas-designer:help` 호출 시 또는 "mas-designer 도움말", "mas-designer 뭘 할 수 있어" 키워드 감지 시.

## 사용 안내

**중요: 추가적인 파일 탐색이나 에이전트 위임 없이, 아래 내용을 즉시 사용자에게 출력하세요.**

### 명령어

| 명령 | 설명 |
|------|------|
| `/mas-designer:setup` | 플러그인 초기 설정 (의존성 설치, API Key 등록, 모델 확인) |
| `/mas-designer:help` | 사용 안내 (이 화면) |
| `/mas-designer:router` | **전체 파이프라인** 실행 — 기획→설계→PPT→검증 (STEP 경계 승인 3회) |
| `/mas-designer:plan` | STEP 1 기획 단독 — 문제가설·방향성·솔루션·이벤트 스토밍·유저스토리 |
| `/mas-designer:design-mas` | STEP 2 MAS 설계 단독 — LangGraph·Tool/MCP·RAG·멀티모달·에러폴백 |
| `/mas-designer:generate-pptx` | STEP 3 PPT 생성 단독 — spec.md 작성 + 이미지 생성 + pptxgenjs 빌드 |
| `/mas-designer:review` | 최종 독립 검증 — 유저스토리↔설계↔PPT 정합성 |

`@{skill-name}`으로 Skill 직접 호출 가능 (예: `@router`, `@plan`).

### 자동 라우팅 (키워드 감지)

- "AI 기획 도와줘", "멀티에이전트 설계", "기획부터 PPT까지" → `/mas-designer:router`
- "문제가설 정의", "근본원인 분석", "유저스토리 작성" → `/mas-designer:plan`
- "MAS 아키텍처 설계", "LangGraph 설계", "에이전트 토폴로지" → `/mas-designer:design-mas`
- "경영진 발표 PPT", "프리젠테이션 생성", "pptx 빌드" → `/mas-designer:generate-pptx`
- "산출물 검증", "설계 정합성 확인", "독립 검증" → `/mas-designer:review`

### Quick Guide

1. **최초 1회**: `/mas-designer:setup` — 런타임 의존성 설치, Gemini API Key 등록, tier 모델 확인
2. **전체 수행**: `/mas-designer:router` — 도메인·주제 입력 → 프로젝트명 확정 → STEP 1/2/3 순차 수행
3. **단독 실행**: `/mas-designer:{skill-name}` — 해당 스킬만 실행 (선행 산출물 존재 시)

## 산출물 디렉토리 구조

```
output/{project}/
├── plan/              # STEP 1 기획 (문제가설·방향성·솔루션·이벤트 스토밍·유저스토리)
│   └── es/            # PlantUML 이벤트 스토밍 시퀀스 플로우
├── step2/             # STEP 2 MAS 설계 (agents·graph·sequence·tool-mcp·rag-memory·multimodal·reliability·통합)
├── step3/             # STEP 3 PPT 빌드 (storyline·spec·image-prompts·build.js·pptx)
│   └── images/        # 슬라이드별 생성 이미지
└── final/             # 최종 패키지 (mas-architecture.md·{project}.pptx·review-report·plan-artifacts·MANIFEST)
```
