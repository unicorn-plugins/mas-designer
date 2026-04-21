---
name: core
description: mas-designer 전체 파이프라인 실행 (기획→설계→PPT→검증, STEP 경계 3회 사용자 승인)
type: orchestrator
user-invocable: true
---

# Core (전체 파이프라인)

[CORE 활성화]

## 목표

도메인·주제 입력부터 경영진 발표 PPT·최종 검증까지 end-to-end 파이프라인을 오케스트레이션함. STEP 1(기획) → STEP 2(MAS 설계) → STEP 3(PPT 생성) → 최종 검증의 4개 Phase를 순차 수행하며, STEP 경계에서 3회 사용자 승인을 획득함.

## 활성화 조건

사용자가 `/mas-designer:core` 호출 시 또는 "AI 기획 도와줘", "멀티에이전트 설계", "기획부터 PPT까지" 등 포괄 요청 키워드 감지 시.

## 에이전트 호출 규칙

본 스킬은 에이전트를 직접 호출하지 않고 다른 스킬(plan / design-mas / generate-pptx / review)에 위임함. 각 하위 스킬이 자체적으로 에이전트 호출을 담당.

## 워크플로우

### Phase 0: 도메인·주제 수집 + 프로젝트 네이밍 (`ulw` 활용)

1. AskUserQuestion으로 비즈니스 도메인·주제·핵심 고민 수집
2. 수집된 정보에서 영문 kebab-case 프로젝트 식별자 **2~3안** 자동 제안:
   - 예: 도메인="스마트 물류" + 주제="AI 견적 자동화" → `smart-logistics-quoting`, `ai-quoting-agent`, `logistics-auto-quote`
3. AskUserQuestion으로 사용자에게 최종 `{project}` 식별자 선택 (직접 입력 옵션 포함)
4. `output/{project}/` 하위 디렉토리 구조 생성:
   ```
   output/{project}/{plan,step2,step3,final}/
   output/{project}/plan/es/
   output/{project}/step3/images/
   ```
5. 수집된 도메인·주제를 `output/{project}/plan/0-input.md`에 저장

### Phase 1: STEP 1 기획 실행 → Skill: plan (`/mas-designer:plan` 위임)

- **INTENT**: 문제가설 → 방향성 → 솔루션 탐색/선정 → 이벤트 스토밍 → 유저스토리 순차 수행
- **ARGS**: `{project}` 식별자, `output/{project}/plan/0-input.md` 경로
- **RETURN**: STEP 1 완료 상태 + 산출물 13종 경로 + plan 스킬 Phase 8의 체크리스트 결과

#### Phase 1 종료 후: 사용자 승인 (1차)

plan 스킬 완료 보고를 사용자에게 제시하고 "STEP 2(MAS 설계)로 진행할까요?" 문의.
- 승인 → Phase 2로 진행
- 수정 요청 → 원인에 따라 plan 스킬 재호출 또는 개별 Phase 재수행
- 중단 → 산출물 보존 후 종료

### Phase 2: STEP 2 MAS 설계 실행 → Skill: design-mas (`/mas-designer:design-mas` 위임)

- **INTENT**: 에이전트 식별 → LangGraph 그래프 → 시퀀스 → Tool·MCP → RAG/메모리 → 멀티모달 → 에러폴백 → 통합 설계서
- **ARGS**: `{project}` 식별자
- **RETURN**: STEP 2 완료 상태 + 8개 설계 파일 경로

#### Phase 2 종료 후: 사용자 승인 (2차)

design-mas 스킬 완료 보고 + mas-architecture.md 요약을 사용자에게 제시.
"STEP 3(경영진 발표 PPT 생성)으로 진행할까요?" 문의.

### Phase 3: STEP 3 PPT 생성 실행 → Skill: generate-pptx (`/mas-designer:generate-pptx` 위임)

- **INTENT**: 스토리라인 → spec.md 작성 → 이미지 생성 → pptxgenjs 빌드
- **ARGS**: `{project}` 식별자
- **RETURN**: STEP 3 완료 상태 + `3.{project}.pptx` 경로 + 파일 크기

#### Phase 3 종료 후: 사용자 승인 (3차)

generate-pptx 스킬 완료 보고를 사용자에게 제시.
"최종 독립 검증으로 진행할까요?" 문의.

### Phase 4: 최종 독립 검증 → Skill: review (`/mas-designer:review` 위임)

- **INTENT**: 5개 체크 섹션 정합성 검증 + doc-exporter로 final/ 패키징
- **ARGS**: `{project}` 식별자
- **RETURN**: APPROVED 시 final/ 패키지 경로 + MANIFEST, REJECTED 시 수정 옵션

### Phase 5: 최종 보고

사용자에게 최종 산출물 보고:
- 설계서: `output/{project}/final/mas-architecture.md`
- PPTX: `output/{project}/final/{project}.pptx`
- 검증 리포트: `output/{project}/final/review-report.md`
- 기획 아카이브: `output/{project}/final/plan-artifacts/`
- 매니페스트: `output/{project}/final/MANIFEST.md`

## 완료 조건

- [ ] Phase 0 `{project}` 확정
- [ ] Phase 1/2/3에서 각 STEP 승인 획득 (총 3회)
- [ ] Phase 4 review APPROVED
- [ ] final/ 디렉토리 5개 산출물 모두 존재

## 검증 프로토콜

각 Phase 위임 완료 후 하위 스킬의 완료 조건 충족 여부 확인. 1건이라도 누락 시 해당 Phase 재시도(최대 3회). 초과 시 사용자에게 수동 개입 요청.

## 상태 정리

진행 상태를 `.omc/state/mas-designer-core-progress.json`에 기록:
```json
{
  "project": "{project}",
  "phase_completed": ["phase-0", "phase-1", ...],
  "current_phase": "phase-N",
  "approvals": [{"phase": 1, "at": "2026-04-21T..."}, ...]
}
```
완료 시 상태 파일 삭제.

## 취소

"cancelomc"/"stopomc" 시 즉시 중단. 진행 중이던 Phase까지의 산출물 보존.

## 재개

상태 파일 존재 시 마지막 `phase_completed` 다음부터 재시작. `{project}` 식별자 재확인 필수.
