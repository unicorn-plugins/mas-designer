---
name: help
description: mas-designer 플러그인 사용 안내 (명령 목록·자동 라우팅·기본 플로우)
type: utility
user-invocable: true
---

# Help

[HELP 활성화]

## 목표

mas-designer 플러그인의 사용 가능한 명령, 자동 라우팅 규칙, 기본 실행 플로우를 안내함. 런타임 상주 파일에 라우팅 테이블을 등록하는 대신, 호출 시에만 토큰을 사용하여 사용자 발견성을 제공함.

## 활성화 조건

사용자가 `/mas-designer:help` 호출 시 또는 "mas-designer 도움말", "mas-designer 뭘 할 수 있어" 키워드 감지 시.

## 명령어

**중요: 추가적인 파일 탐색이나 에이전트 위임 없이, 아래 내용을 즉시 사용자에게 출력하세요.**

### 사용 가능한 명령

| 명령 | 설명 |
|------|------|
| `/mas-designer:setup` | 플러그인 초기 설정 (의존성 설치, API Key 등록, 모델 확인) |
| `/mas-designer:help` | 사용 안내 (이 화면) |
| `/mas-designer:core` | **전체 파이프라인** 실행 — 기획→설계→PPT→검증 (STEP 경계 승인 3회) |
| `/mas-designer:plan` | STEP 1 기획 단독 — 문제가설·방향성·솔루션·이벤트 스토밍·유저스토리 |
| `/mas-designer:design-mas` | STEP 2 MAS 설계 단독 — LangGraph·Tool/MCP·RAG·멀티모달·에러폴백 |
| `/mas-designer:generate-pptx` | STEP 3 PPT 생성 단독 — spec.md 작성 + 이미지 생성 + pptxgenjs 빌드 |
| `/mas-designer:review` | 최종 독립 검증 — 유저스토리↔설계↔PPT 정합성 |

### 자동 라우팅 (키워드 감지)

- "AI 기획 도와줘", "멀티에이전트 설계" → `/mas-designer:core`
- "문제가설 정의", "근본원인 분석" → `/mas-designer:plan`
- "MAS 아키텍처 설계", "LangGraph 설계" → `/mas-designer:design-mas`
- "발표 PPT 만들어", "경영진 발표 자료" → `/mas-designer:generate-pptx`
- "산출물 검증", "설계 정합성 확인" → `/mas-designer:review`

### 기본 실행 플로우

1. **최초 1회**: `/mas-designer:setup` — 런타임 의존성 설치, Gemini API Key 등록
2. **프로젝트 시작**: `/mas-designer:core` — 도메인·주제 입력 → 프로젝트명 확정 → STEP 1/2/3 순차 수행
3. **단독 실행**: 이미 완료된 STEP이 있으면 다음 STEP을 단독 스킬로 실행 가능
4. **최종 패키지**: `output/{project}/final/mas-architecture.md`, `output/{project}/final/{project}.pptx`

### 산출물 디렉토리 구조

```
output/{project}/
├── plan/           # STEP 1 기획
├── step2/          # STEP 2 MAS 설계
├── step3/          # STEP 3 PPT 빌드 스크립트·이미지·결과
└── final/          # 최종 패키지
```

### 참고 문서

- 요구사항: `output/requirements.md`
- 개발 계획: `output/develop-plan.md`
- 팀 기획: `output/team-plan-mas-designer.md`
