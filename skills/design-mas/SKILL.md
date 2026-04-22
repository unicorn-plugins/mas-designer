---
name: design-mas
description: STEP 2 MAS 아키텍처 설계 (mas-architect 세부역할 4종 활용, 8 sub-step)
type: orchestrator
user-invocable: true
---

# Design MAS (STEP 2: MAS 아키텍처 설계)

[DESIGN-MAS 활성화]

## 목표

STEP 1 유저스토리(`userstory.md`)와 AI 기술정보 가이드 5종을 근거로 LangGraph 기반 MAS 아키텍처를 설계함. mas-architect 에이전트의 4개 세부역할(graph-designer / tool-mcp-binder / rag-planner / multimodal-mapper)을 적절한 Phase에 매핑하여 7섹션 설계 후 통합 설계서로 산출함.

## 활성화 조건

사용자가 `/mas-designer:design-mas` 호출 시 또는 "MAS 아키텍처 설계", "LangGraph 설계", "에이전트 토폴로지" 키워드 감지 시. router 스킬이 Phase 2에서 위임하는 경로 포함.

## 에이전트 호출 규칙

### 에이전트 FQN
| 에이전트 | FQN |
|---------|-----|
| mas-architect | `mas-designer:mas-architect:mas-architect` |

### 프롬프트 조립
- `{DMAP_PLUGIN_DIR}/resources/guides/combine-prompt.md`에 따라 AGENT.md + agentcard.yaml + tools.yaml 합치기
- 세부역할(sub_role)을 프롬프트에 명시하여 해당 워크플로우 서브섹션만 활성화
- tier·sub_role → 모델 매핑은 `gateway/runtime-mapping.yaml`의 `mas-architect.sub_roles` 참조

### 서브 에이전트 호출
워크플로우 단계에 `Agent: {agent-name}`이 명시된 경우,
메인 에이전트는 해당 단계를 직접 수행하지 않고,
반드시 위 프롬프트 조립 규칙에 따라 해당 에이전트를 호출하여 결과를 받아야 함.

서브에이전트 호출 없이 메인 에이전트가 해당 산출물을 직접 작성하면
스킬 미준수로 간주함.

## 워크플로우

> **선행 조건**: `output/{project}/plan/userstory.md` 및 `es/*.puml` 존재 필수.
> 없으면 `/mas-designer:plan` 먼저 실행하도록 안내 후 중단.

### Phase 1: 에이전트 식별·책임 정의 → Agent: mas-architect (sub_role=graph-designer) (`ralplan` 활용)
- **TASK**: Bounded Context × 유저스토리 교차하여 MAS 에이전트 후보 도출, 각 에이전트 프로파일(역할·책임·권한·tier) 정의
- **EXPECTED OUTCOME**: `output/{project}/step2/1-agents.md`
- **MUST DO**: `references/05-mas-langgraph.md` 에이전트 토폴로지 섹션 인용, 각 에이전트 역할 단일성 확인
- **MUST NOT DO**: 오케스트레이터(스킬) 역할을 에이전트에 부여하지 않음
- **CONTEXT**: `userstory.md` + `es/*.puml` 전수 로드

### Phase 2: LangGraph 그래프 설계 → Agent: mas-architect (sub_role=graph-designer) (`ralplan` 활용)
- **TASK**: 노드(에이전트·Tool 호출) / 엣지(조건·라우팅) / State 스키마 / 체크포인트 설계
- **EXPECTED OUTCOME**: `output/{project}/step2/2-graph.md` (PlantUML 또는 Mermaid 포함)
- **MUST DO**: `references/05-mas-langgraph.md` 노드·엣지·State 섹션 각주 인용, 순환 그래프 허용 여부·재귀 제한 명시
- **MUST NOT DO**: 구현 코드 작성 금지 (설계 문서만)
- **CONTEXT**: Phase 1 에이전트 목록

### Phase 3: 상호작용 시퀀스 → Agent: mas-architect (sub_role=graph-designer)
- **TASK**: 주요 유저스토리별 에이전트 협력 시퀀스 + 프롬프트 전략
- **EXPECTED OUTCOME**: `output/{project}/step2/3-sequence.md`
- **MUST DO**: `references/02-langchain.md` Tool 바인딩·메모리 섹션 각주, 시퀀스 다이어그램 포함
- **MUST NOT DO**: 전체 유저스토리를 시퀀스로 전개할 필요 없음 (대표 3~5개)
- **CONTEXT**: Phase 1~2 산출물

### Phase 4: Tool·MCP 바인딩 → Agent: mas-architect (sub_role=tool-mcp-binder)
- **TASK**: 에이전트별 외부 Tool/MCP 서버·권한·Rate Limit·폴백 매핑
- **EXPECTED OUTCOME**: `output/{project}/step2/4-tool-mcp.md`
- **MUST DO**: `references/04-mcp.md` + `references/02-langchain.md` 각주, 장애 시 폴백 전략 명시
- **MUST NOT DO**: 실제 MCP 서버 설치·설정 금지 (설계만)
- **CONTEXT**: Phase 1 에이전트 프로파일

### Phase 5: RAG·메모리 전략 → Agent: mas-architect (sub_role=rag-planner)
- **TASK**: 지식 소스·청킹·인덱싱·검색 파이프라인·리랭킹·단기/장기 메모리 구조 정의
- **EXPECTED OUTCOME**: `output/{project}/step2/5-rag-memory.md`
- **MUST DO**: `references/03-rag.md` + `references/02-langchain.md` 각주, Vector DB·임베딩 모델·메모리 스키마 명시
- **MUST NOT DO**: 인덱스 실제 구축 금지 (설계만)
- **CONTEXT**: Phase 1 에이전트 프로파일

### Phase 6: 멀티모달 I/O 설계 → Agent: mas-architect (sub_role=multimodal-mapper)
- **TASK**: 입력(텍스트·이미지·음성·문서) 및 출력(리포트·시각자료·음성) 포맷·모델·제약 정의
- **EXPECTED OUTCOME**: `output/{project}/step2/6-multimodal.md`
- **MUST DO**: `references/01-multimodal-ai.md` 각주, 모달리티별 전처리·후처리 단계 명시
- **MUST NOT DO**: 모달리티 미활용 시에도 "미적용" 사유 기록 생략 금지
- **CONTEXT**: Phase 1 에이전트 프로파일

### Phase 7: 에러/폴백·관측성·보안 → Agent: mas-architect (기본 역할)
- **TASK**: 실패 분류(LLM/Tool/데이터), Retry/Circuit Breaker, Trace·메트릭, PII 가드 정의
- **EXPECTED OUTCOME**: `output/{project}/step2/7-reliability.md`
- **MUST DO**: 실패 분류 3유형 모두 기술, PII·보안 규제 대응 방침 포함
- **MUST NOT DO**: 운영 도구 실제 구축 금지
- **CONTEXT**: Phase 2~6 산출물

### Phase 8: 통합 설계서 생성 → Agent: mas-architect (기본 역할)
- **TASK**: Phase 1~7 결과를 `mas-architecture.md` 단일 파일로 통합
- **EXPECTED OUTCOME**: `output/{project}/step2/mas-architecture.md` — 모든 섹션 포함, 각 섹션 끝 각주
- **MUST DO**: 7개 섹션 전원 포함, 각주 포맷 `[N]: references/...md §x.y "제목"`
- **MUST NOT DO**: 원본 Phase 산출물 삭제 금지
- **CONTEXT**: Phase 1~7 산출물 전수

### Phase 9: STEP 2 완료 보고
산출물 체크리스트:
- [ ] step2/1-agents.md ~ 7-reliability.md (7종)
- [ ] step2/mas-architecture.md (통합)
- [ ] 각 파일 끝 `references/` 각주 ≥1건

사용자에게 완료 보고 + 승인 요청.

## 완료 조건

- [ ] Phase 1~8 모두 에이전트 위임 완료
- [ ] 8개 설계 파일 존재
- [ ] 모든 섹션에 `references/` 근거 각주 포함 (Phase 9 Grep 확인)
- [ ] 사용자 승인

## 상태 정리

각 Phase 완료 시 `AGENTS.md`의 `## 워크플로우 상태 > ### design-mas` 섹션의 `마지막 완료 Phase`를 갱신.
완료 시 임시 파일 없음.

## 재개

1. `AGENTS.md`의 `## 워크플로우 상태 > ### design-mas` 섹션에서 `마지막 완료 Phase`를 읽음
2. 상태 섹션이 없거나 "(기록 없음)"이면 **Phase 1: 에이전트 식별·책임 정의**부터 수행
3. 마지막 완료 Phase의 다음 Phase부터 진행. 선행 산출물이 존재하면 해당 Phase는 건너뜀
