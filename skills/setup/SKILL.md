---
name: setup
description: mas-designer 플러그인 초기 설정 (pptxgenjs·google-genai 설치, Gemini API Key 등록, 모델 매핑 확인)
type: setup
user-invocable: true
---

# Setup

[SETUP 활성화]

## 목표

mas-designer 플러그인의 런타임 의존성을 설치하고, Gemini API Key를 `.env`로 안전하게 저장하며, `runtime-mapping.yaml`의 4런타임(claude-code / cursor / codex / antigravity) tier_mapping을 사용자에게 확인받아 최신 상태로 유지함. tier 갱신 시 런타임 어댑터 스텁(`.claude/.cursor/.codex/.antigravity/agents/*`)의 `model:` 필드도 일괄 동기화함. `gateway/install.yaml` 데이터만 참조하여 설치를 실행함.

## 활성화 조건

사용자가 `/mas-designer:setup` 호출 시 또는 "mas-designer 설치/설정" 키워드 감지 시.

## 워크플로우

### Phase 1: 환경 전제 확인

- Node.js ≥18 설치 여부: `node --version`
- Python ≥3.10 설치 여부: `python --version`
- 둘 중 하나라도 없으면 사용자에게 설치 안내 후 중단

### Phase 2: gateway/install.yaml 로드 및 파싱

`{PLUGIN_DIR}/gateway/install.yaml` 읽어 `runtime_dependencies`, `custom_tools` 항목 추출.

### Phase 3: 런타임 의존성 설치

각 `runtime_dependencies` 항목에 대해:
1. `check` 명령으로 기설치 여부 확인
2. 미설치 시 `install` 명령 실행 (Bash)
3. 실패 시 `required: true` 항목이면 중단, `false`이면 경고만

대상:
- `pptxgenjs` (npm install pptxgenjs)
- `google-genai` + `python-dotenv` + `pillow` (pip install)

### Phase 4: 커스텀 도구 설치 확인

`gateway/tools/generate_image.py` 파일 존재 확인. 없으면 오류 출력 및 중단.

### Phase 5: Gemini API Key 등록

AskUserQuestion으로:
- `GEMINI_API_KEY`를 이미 보유하고 있는지 질문
- 보유 시 값을 입력받아 `{PLUGIN_DIR}/gateway/tools/.env`에 저장:
  ```
  GEMINI_API_KEY=<입력값>
  ```
- 미보유 시 발급 가이드 링크 제공: https://ai.google.dev/gemini-api/docs/api-key

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있음. 입력받은 키는 화면에 에코하지 않음.

### Phase 6: runtime-mapping.yaml 4런타임 모델 확인

`{PLUGIN_DIR}/gateway/runtime-mapping.yaml`의 `tier_mapping`을 읽어 4런타임×4티어 표로 사용자에게 제시:

| tier | claude-code | cursor | codex | antigravity |
|------|-------------|--------|-------|-------------|
| HEAVY | claude-opus-4-7 | claude-opus-4-7 | gpt-5.4 | claude-opus-4-7 |
| HIGH | claude-opus-4-7 | claude-opus-4-7 | gpt-5.4 | claude-opus-4-7 |
| MEDIUM | claude-sonnet-4-6 | claude-sonnet-4-6 | gpt-5.4-mini | claude-sonnet-4-6 |
| LOW | claude-haiku-4-5 | claude-haiku-4-5 | gpt-5.4-mini | claude-haiku-4-5 |

AskUserQuestion으로 "최신 버전 반영 또는 수동 조정이 필요한지" 문의. 수정 요청 시 해당 필드만 Edit 도구로 갱신.

### Phase 7: 런타임 어댑터 스텁 `model:` 동기화

Phase 6에서 tier_mapping이 갱신된 경우, 모든 에이전트 스텁의 frontmatter `model:` 필드를 동일 매핑으로 일괄 치환:

- `{PLUGIN_DIR}/.claude/agents/*.md` — YAML frontmatter `model:` 라인 → `tier_mapping.{tier}.claude-code` 값
- `{PLUGIN_DIR}/.cursor/agents/*.md` — YAML frontmatter `model:` 라인 → `tier_mapping.{tier}.cursor` 값
- `{PLUGIN_DIR}/.codex/agents/*.toml` — 상위 `model = "..."` 라인 → `tier_mapping.{tier}.codex` 값
- `{PLUGIN_DIR}/.antigravity/agents/*.md` — YAML frontmatter `model:` 라인 → `tier_mapping.{tier}.antigravity` 값

> **주의**: 스텁의 **본문·AUTO-GENERATED 주석·FQN·지시문은 절대 변경하지 않음**. `model:` 라인만 Edit로 치환.
> 각 에이전트의 tier는 `{PLUGIN_DIR}/agents/{name}/agentcard.yaml`의 `tier:` 필드에서 읽음.

### Phase 8: 라우팅 블록 등록

AskUserQuestion으로 적용 범위 문의:

| 선택지 | 설명 | 대상 파일 |
|--------|------|----------|
| 모든 프로젝트 | 어디서든 mas-designer 사용 | `~/.claude/CLAUDE.md` |
| 이 프로젝트만 | 현재 프로젝트에서만 사용 | `{PLUGIN_DIR}/AGENTS.md` |

선택된 파일에 다음 라우팅 블록을 Edit 도구로 추가 (이미 있으면 스킵):

```markdown
## mas-designer 플러그인
`@{스킬명}` 입력 시 `/mas-designer:{스킬명}` 실행.
- `@setup`: 플러그인 초기 설정
- `@help`: 사용 안내
- `@router`: 기획→설계→PPT 전체 파이프라인 실행
- `@plan`: STEP 1 기획 단독 실행
- `@design-mas`: STEP 2 MAS 설계 단독 실행
- `@generate-pptx`: STEP 3 PPT 생성 단독 실행
- `@review`: 최종 독립 검증
```

### Phase 9: 설치 결과 요약 보고

| 항목 | 상태 |
|------|------|
| Node.js 런타임 | ✅/❌ |
| Python 런타임 | ✅/❌ |
| pptxgenjs | ✅ 설치 |
| google-genai | ✅ 설치 |
| generate_image.py | ✅ 존재 |
| .env (GEMINI_API_KEY) | ✅ 등록 / ⏭ 스킵 |
| tier_mapping (4런타임) | 확인 완료 |
| 어댑터 스텁 `model:` 동기화 | ✅ (40 파일) / ⏭ 변경 없음 |
| 라우팅 등록 | ✅ (대상: ...) |

완료 시 사용자에게 "`/mas-designer:help` 또는 `/mas-designer:router`로 시작하세요" 안내.

## 완료 조건

- [ ] Node.js·Python 런타임 존재
- [ ] runtime_dependencies 전원 설치 확인
- [ ] generate_image.py 존재
- [ ] `.env`의 GEMINI_API_KEY 등록 또는 사용자 스킵 확인
- [ ] tier_mapping 4런타임 엔트리 존재 및 사용자 확인
- [ ] (tier 갱신 시) 어댑터 스텁 40개 `model:` 필드 동기화
- [ ] 라우팅 블록 등록 (이미 있으면 스킵)

## 문제 해결

| 증상 | 해결 |
|------|------|
| `npm install pptxgenjs` 실패 | Node.js ≥18 확인, `npm cache clean --force` 후 재시도 |
| `pip install google-genai` 실패 | Python 3.10+ 확인, venv 활성화, `pip install -U pip` 후 재시도 |
| generate_image.py 실행 시 API 401 | `.env`의 GEMINI_API_KEY 값 재확인, 공백·따옴표 제거 |
| 모델 버전이 런타임에서 인식 안 됨 | runtime-mapping.yaml의 모델명 오타 확인 |
| 어댑터 스텁 `model:` 동기화 누락 | `{PLUGIN_DIR}/.claude/.cursor/.codex/.antigravity/agents/` 디렉토리 존재 확인 후 setup 재실행 |
