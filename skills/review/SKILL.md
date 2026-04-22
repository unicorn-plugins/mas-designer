---
name: review
description: 최종 독립 검증 (유저스토리↔MAS 설계↔PPT 정합성, GREAT 2 WHY, 근거 인용 검증)
type: orchestrator
user-invocable: true
---

# Review (최종 독립 검증)

[REVIEW 활성화]

## 목표

reviewer 에이전트를 **독립 컨텍스트로 분리 실행**하여 STEP 1/2/3 산출물 간 정합성을 검증함. 판정 결과가 REJECTED인 경우 수정 사이클(최대 3회)을 통해 원인을 해결하고 재검증함.

## 활성화 조건

사용자가 `/mas-designer:review` 호출 시 또는 "산출물 검증", "정합성 확인", "독립 검증" 키워드 감지 시. router 스킬이 Phase 4에서 위임하는 경로 포함.

## 에이전트 호출 규칙

### 에이전트 FQN
| 에이전트 | FQN |
|---------|-----|
| reviewer | `mas-designer:reviewer:reviewer` |

### 프롬프트 조립
- `{DMAP_PLUGIN_DIR}/resources/guides/combine-prompt.md`에 따라 AGENT.md + agentcard.yaml + tools.yaml 합치기
- 독립 컨텍스트 보장: `Agent(...)` 호출 시 선행 컨텍스트 전달 최소화, 체크리스트 기반 산출물 직접 읽기 강제
- tier → 모델 매핑 (HIGH → opus-4-7)

### 서브 에이전트 호출
워크플로우 단계에 `Agent: {agent-name}`이 명시된 경우,
메인 에이전트는 해당 단계를 직접 수행하지 않고,
반드시 위 프롬프트 조립 규칙에 따라 해당 에이전트를 호출하여 결과를 받아야 함.

서브에이전트 호출 없이 메인 에이전트가 해당 산출물을 직접 작성하면
스킬 미준수로 간주함.

## 워크플로우

> **선행 조건**: `output/{project}/plan/userstory.md` + `output/{project}/step2/mas-architecture.md` + `output/{project}/step3/3.{project}.pptx` 모두 존재.
> 누락 시 해당 STEP을 먼저 완료하도록 안내 후 중단.

### Phase 1: 독립 검증 → Agent: reviewer (`ultraqa` 활용)
- **TASK**: 5개 체크 섹션(유저스토리↔MAS 정합성 / MAS↔PPT 정합성 / GREAT 2 WHY 충족 / 근거 인용 정확성 / 산출 형식 일관성) 평가 후 APPROVED/REJECTED 판정
- **EXPECTED OUTCOME**: `output/{project}/final/review-report.md` — 체크리스트 결과 + 판정 + (REJECTED 시) 사유
- **MUST DO**: 대상 산출물 모두 직접 읽기, 각 항목에 ✅/❌ + 증거 명시, 판정 근거 서술
- **MUST NOT DO**: 산출물 직접 수정 금지(reviewer의 file_write는 review-report.md 한 건으로 제한), 선행 작성 에이전트와 타협 금지
- **CONTEXT**: 검증 대상 파일 경로 목록만 전달 (판단은 에이전트 자율)

### Phase 2: 결과 처리
#### 2-A. APPROVED

최종 패키지를 `output/{project}/final/`에 정리하도록 doc-exporter 에이전트 호출.

→ Agent: doc-exporter
- **TASK**: final/ 패키징 + 파일명 표준화 + MANIFEST.md 생성
- **EXPECTED OUTCOME**: `output/{project}/final/mas-architecture.md`, `{project}.pptx`, `plan-artifacts/`, `MANIFEST.md`, `review-report.md`
- **MUST DO**: 산출물 존재 확인 → Bash로 복사 → MANIFEST 생성
- **MUST NOT DO**: 산출물 수정 금지
- **CONTEXT**: Phase 1의 검증 대상 목록

#### 2-B. REJECTED

사용자에게 실패 사유 보고 및 사이클 제안:
- **Option 1**: 해당 STEP 스킬 재실행 (`/mas-designer:plan`, `/mas-designer:design-mas`, `/mas-designer:generate-pptx` 중 원인에 맞는 것)
- **Option 2**: 수동 수정 후 `/mas-designer:review` 재호출

사용자 선택에 따라 분기. 최대 3회 사이클까지 반복, 초과 시 사용자에게 수동 개입 요청.

### Phase 3: 최종 보고
- APPROVED: final/ 패키지 경로 + MANIFEST 내용 출력
- REJECTED (3회 실패): 누적 review-report 목록 + 수동 개입 안내

## 완료 조건

- [ ] reviewer 에이전트 체크리스트 5섹션 평가 완료
- [ ] review-report.md 생성
- [ ] APPROVED 시: final/MANIFEST.md + final/ 패키지 존재
- [ ] REJECTED 시: 사용자에게 원인 및 수정 옵션 제공 (사이클 최대 3회)

## 상태 정리

각 Phase 완료 및 사이클 반복 횟수를 `AGENTS.md`의 `## 워크플로우 상태 > ### review` 섹션의 `마지막 완료 Phase`에 갱신 (예: "Phase 1 (cycle 2/3)").
완료 시 "(기록 없음)"으로 초기화.

## 재개

1. `AGENTS.md`의 `## 워크플로우 상태 > ### review` 섹션에서 `마지막 완료 Phase` + 사이클 카운트를 읽음
2. 상태 섹션이 없거나 "(기록 없음)"이면 **Phase 1: 독립 검증**부터 수행
3. 직전 review-report가 REJECTED면 사이클 카운트 +1로 Phase 1 재실행. APPROVED면 Phase 2-A로 진행
