---
name: plan
description: STEP 1 AI 활용 기획 (7 sub-step, 6 기획 에이전트 순차 위임)
type: orchestrator
user-invocable: true
---

# Plan (STEP 1: AI 활용 기획)

[PLAN 활성화]

## 목표

사용자 도메인·주제 입력부터 유저스토리 확정까지, STEP 1 기획 7 sub-step을 순차 수행하는 오케스트레이터. 6개 기획 에이전트(problem-analyst → direction-setter → solution-explorer → solution-selector → event-storming-facilitator → user-story-writer)를 순차 위임하여 증거 기반 기획 산출물을 생성함.

## 활성화 조건

사용자가 `/mas-designer:plan` 호출 시 또는 "AI 기획", "문제가설", "방향성 정의", "유저스토리 작성" 키워드 감지 시. router 스킬이 Phase 1에서 위임하는 경로도 동일.

## 에이전트 호출 규칙

### 에이전트 FQN
| 에이전트 | FQN |
|---------|-----|
| problem-analyst | `mas-designer:problem-analyst:problem-analyst` |
| direction-setter | `mas-designer:direction-setter:direction-setter` |
| solution-explorer | `mas-designer:solution-explorer:solution-explorer` |
| solution-selector | `mas-designer:solution-selector:solution-selector` |
| event-storming-facilitator | `mas-designer:event-storming-facilitator:event-storming-facilitator` |
| user-story-writer | `mas-designer:user-story-writer:user-story-writer` |

### 프롬프트 조립
- `{DMAP_PLUGIN_DIR}/resources/guides/combine-prompt.md`에 따라 AGENT.md + agentcard.yaml + tools.yaml 합치기
- `Agent(subagent_type=FQN, model=tier_mapping 결과, prompt=조립된 프롬프트)` 호출
- tier → 모델 매핑은 `gateway/runtime-mapping.yaml` 참조

### 서브 에이전트 호출
워크플로우 단계에 `Agent: {agent-name}`이 명시된 경우,
메인 에이전트는 해당 단계를 직접 수행하지 않고,
반드시 위 프롬프트 조립 규칙에 따라 해당 에이전트를 호출하여 결과를 받아야 함.

서브에이전트 호출 없이 메인 에이전트가 해당 산출물을 직접 작성하면
스킬 미준수로 간주함.

## 워크플로우

> **공통 컨텍스트**: `{OUTPUT_DIR}` = `output/{project}/plan/`. `{project}`는 router 스킬의 Phase 0에서 확정된 값을 상속.
> 단독 실행 시 사용자에게 `{project}` 식별자(영문 kebab-case) 입력을 요청.

### Phase 1: 도메인·주제 수집

{PLUGIN_DIR}/output/{project}/plan/0-input.md에 도메인·주제·핵심 고민을 정리하여 저장.
AskUserQuestion으로 수집하며, 누락 항목 발견 시 재질문.

### Phase 2: 현상문제·근본원인 도출 → Agent: problem-analyst

- **TASK**: 수집된 도메인·주제에서 대표 현상문제 3개 선정, 5WHY 근본원인, 비즈니스 가치 정의
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/문제가설.md` + `{OUTPUT_DIR}/비즈니스가치.md`
- **MUST DO**: `references/01-problem-hypothesis-guide.md` 절차 준수, 5WHY 5회 전개, 고객·기업 관점 가치 분리
- **MUST NOT DO**: 해결책 선제시 금지, 가이드 절차 임의 변경 금지
- **CONTEXT**: `{OUTPUT_DIR}/0-input.md` 참조, 필요 시 WebSearch로 업계 사례 조사

### Phase 3: 방향성 정의 → Agent: direction-setter

- **TASK**: 킹핀 문제 선정(5기준 평가), Needs Statement 작성, GREAT 2 WHY 초안 도출
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/킹핀문제.md` + `{OUTPUT_DIR}/문제해결방향성.md`
- **MUST DO**: `references/02-direction-setting-guide.md` 준수, AI 활용 카테고리(자동화/증강/생성) 명시, GREAT 2 WHY 각 1문장
- **MUST NOT DO**: 현상문제 재정의 금지, 임의 문구 추가 금지
- **CONTEXT**: Phase 2 산출물(`문제가설.md`, `비즈니스가치.md`) 로드

### Phase 4: 솔루션 탐색 → Agent: solution-explorer (`ralplan` 활용)

- **TASK**: 3기법(SCAMPER / Steal & Synthesize / AI 패턴 카드) 발산 + 유사도 수렴
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/솔루션탐색.md` + `{OUTPUT_DIR}/솔루션후보.md` (수렴 후보 5~8개)
- **MUST DO**: `references/03-ideation-guide.md` 절차 준수, 발산 ≥15개, 수렴 후보에 핵심 AI 기술 명시
- **MUST NOT DO**: 조기 평가로 후보 축소 금지
- **CONTEXT**: Phase 2~3 산출물 로드

### Phase 5: 솔루션 선정 → Agent: solution-selector (`ralplan` 활용)

- **TASK**: B/F 투표 + 우선순위 매트릭스 + AI 실현 가능성 4요소 평가 → 최적안 1개 선정
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/솔루션평가.md` + `{OUTPUT_DIR}/솔루션우선순위평가.svg` + `{OUTPUT_DIR}/핵심솔루션.md`
- **MUST DO**: 평가 매트릭스 수치화, AI 4요소 평가, 선정 근거 5항목 명시
- **MUST NOT DO**: 감정적 선호로 선정 금지
- **CONTEXT**: Phase 4 후보 목록 로드

### Phase 6: 이벤트 스토밍 → Agent: event-storming-facilitator

- **TASK**: 도메인 이벤트 수집 → 유저플로우 5~10개 → PlantUML 시퀀스 + Bounded Context 도출
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/es/userflow.puml` + `{OUTPUT_DIR}/es/{NN}-{플로우명}.puml` × 5~10
- **MUST DO**: 이벤트 ≥20개, 각 플로우에 Actor·Trigger·Outcome, 에이전트 경계 후보 제안
- **MUST NOT DO**: 에이전트 내부 로직 설계 금지 (MAS 설계는 STEP 2 담당)
- **CONTEXT**: Phase 5 핵심 솔루션 로드

### Phase 7: 유저스토리 작성 → Agent: user-story-writer

- **TASK**: UFR/AFR/NFR + Given-When-Then AC + LLM 검증 기준 작성
- **EXPECTED OUTCOME**: `{OUTPUT_DIR}/userstory.md`
- **MUST DO**: `references/06-user-stories-guide.md` 포맷 준수, INVEST 6요건, AFR 전원 LLM 검증 기준 포함, 우선순위·Story Points 할당
- **MUST NOT DO**: 구현 상세 기술 금지
- **CONTEXT**: Phase 6 PlantUML 플로우 전수 로드

### Phase 8: STEP 1 완료 보고

산출물 체크리스트:
- [ ] 0-input.md / 문제가설.md / 비즈니스가치.md
- [ ] 킹핀문제.md / 문제해결방향성.md
- [ ] 솔루션탐색.md / 솔루션후보.md / 솔루션평가.md / 솔루션우선순위평가.svg / 핵심솔루션.md
- [ ] es/userflow.puml + es/{NN}-*.puml × 5~10
- [ ] userstory.md

사용자에게 STEP 1 완료 보고 + 승인 요청. 승인 시 router 스킬로 복귀(또는 단독 실행이면 종료).

## 완료 조건

- [ ] Phase 2~7 모두 에이전트 위임 완료
- [ ] 13+ 산출물 파일 존재 확인
- [ ] Phase 8 체크리스트 13항 전원 확인 (누락 시 해당 Phase 재수행)
- [ ] 사용자 승인 획득

## 상태 정리

각 Phase 완료 시 `AGENTS.md`의 `## 워크플로우 상태 > ### plan` 섹션의 `마지막 완료 Phase`를 갱신.
완료 시 임시 파일 없음. 산출물은 모두 `{OUTPUT_DIR}` 하위에 보존.

## 재개

1. `AGENTS.md`의 `## 워크플로우 상태 > ### plan` 섹션에서 `마지막 완료 Phase`를 읽음
2. 상태 섹션이 없거나 "(기록 없음)"이면 **Phase 1: 도메인·주제 수집**부터 수행
3. 마지막 완료 Phase의 다음 Phase부터 진행. 선행 산출물이 존재하면 해당 Phase는 건너뜀
