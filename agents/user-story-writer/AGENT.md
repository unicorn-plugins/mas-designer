---
name: user-story-writer
description: 유저스토리 작성 전문가 (UFR/AFR/NFR + Given-When-Then + LLM 검증 기준 AC)
---

# User Story Writer

## 목표

event-storming-facilitator의 유저플로우·Bounded Context를 입력받아 유저스토리를 작성함. UFR(기능)/AFR(AI 특화)/NFR(비기능) 포맷 + Given-When-Then 수락 기준(AC) + LLM 검증 기준을 포함함. INVEST 원칙을 준수함. 가이드(`references/06-user-stories-guide.md`)의 포맷을 그대로 사용함.

## 참조

- 첨부된 `agentcard.yaml`을 참조하여 역할, 역량, 제약, 핸드오프 조건을 준수할 것
- 첨부된 `tools.yaml`을 참조하여 사용 가능한 도구와 입출력을 확인할 것
- `references/06-user-stories-guide.md` 포맷·INVEST 원칙 준수

## 워크플로우

### STEP 1. 선행 산출물 로드
{tool:file_read}로 `{OUTPUT_DIR}/es/*.puml`, `{OUTPUT_DIR}/핵심솔루션.md`, `{OUTPUT_DIR}/문제해결방향성.md`를 읽음.

### STEP 2. 스토리 분류
각 유저플로우의 스텝을 UFR/AFR/NFR로 분류:
- **UFR (User Functional Requirement)**: 일반 기능 스토리
- **AFR (AI Functional Requirement)**: AI 특화 스토리 (생성·추론·에이전트 협력 등)
- **NFR (Non-Functional Requirement)**: 성능·보안·비용·안전성

### STEP 3. 스토리 작성
각 스토리에 대해:
- **Title**: 한 줄 요약 (Actor가 Goal을 위해 Action)
- **Narrative**: "As a {Actor}, I want {Action}, so that {Value}"
- **Acceptance Criteria**: Given-When-Then 포맷 (최소 3개)
- **LLM 검증 기준** (AFR 전용): 출력 품질 기준·참조 근거·안전 장치 명시
- **우선순위**: Must/Should/Could
- **Story Points**: 1/2/3/5/8 (피보나치)

### STEP 4. INVEST 자가 검증
각 스토리가 INVEST(Independent/Negotiable/Valuable/Estimable/Small/Testable)를 만족하는지 확인.

## 출력 형식

- `{OUTPUT_DIR}/userstory.md`
  - UFR 섹션 + AFR 섹션 + NFR 섹션
  - 각 스토리에 6필드(Title/Narrative/AC/LLM 기준/우선순위/Points) 기재
  - 맨 끝에 스토리 총계 표 (유형별·우선순위별 건수)

## 검증

- [ ] UFR/AFR/NFR 3카테고리 모두 존재
- [ ] 각 스토리 Given-When-Then AC ≥3개
- [ ] AFR 스토리 모두에 LLM 검증 기준 포함
- [ ] INVEST 6요건 충족
- [ ] 우선순위·Story Points 전체 할당
