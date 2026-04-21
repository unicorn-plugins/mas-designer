---
name: setup
description: mas-designer 플러그인 초기 설정 (pptxgenjs·google-genai 설치, Gemini API Key 등록, 모델 매핑 확인)
type: setup
user-invocable: true
---

# Setup

[SETUP 활성화]

## 목표

mas-designer 플러그인의 런타임 의존성을 설치하고, Gemini API Key를 `.env`로 안전하게 저장하며, `runtime-mapping.yaml`의 모델 버전을 사용자에게 확인받아 최신 상태로 유지함. `gateway/install.yaml` 데이터만 참조하여 설치를 실행함.

## 활성화 조건

사용자가 `/mas-designer:setup` 호출 시 또는 "mas-designer 설치/설정" 키워드 감지 시.

## 워크플로우

### Step 1: 환경 전제 확인 (`ulw` 활용)

- Node.js ≥18 설치 여부: `node --version`
- Python ≥3.10 설치 여부: `python --version`
- 둘 중 하나라도 없으면 사용자에게 설치 안내 후 중단

### Step 2: gateway/install.yaml 로드 및 파싱

`{PLUGIN_DIR}/gateway/install.yaml` 읽어 `runtime_dependencies`, `custom_tools` 항목 추출.

### Step 3: 런타임 의존성 설치 (`ulw` 활용)

각 runtime_dependency에 대해:
1. `check` 명령으로 기설치 여부 확인
2. 미설치 시 `install` 명령 실행 (Bash)
3. 실패 시 `required: true` 항목이면 중단, `false`이면 경고만

대상:
- `pptxgenjs` (npm install pptxgenjs)
- `google-genai` + `python-dotenv` + `pillow` (pip install)

### Step 4: 커스텀 도구 설치 확인

`gateway/tools/generate_image.py` 파일 존재 확인. 없으면 오류 출력 및 중단.

### Step 5: Gemini API Key 등록 (`ulw` 활용)

사용자 상호작용(AskUserQuestion):
- `GEMINI_API_KEY`를 이미 보유하고 있는지 질문
- 보유 시 값을 입력받아 `{PLUGIN_DIR}/gateway/tools/.env`에 저장:
  ```
  GEMINI_API_KEY=<입력값>
  ```
- 미보유 시 발급 가이드 링크 제공: https://ai.google.dev/gemini-api/docs/api-key

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있음. 입력받은 키는 화면에 에코하지 않음.

### Step 6: runtime-mapping.yaml 모델 버전 확인 (`ulw` 활용)

`{PLUGIN_DIR}/gateway/runtime-mapping.yaml` 읽어 현재 `tier_mapping.default` 모델을 사용자에게 제시:
- HEAVY/HIGH: claude-opus-4-7
- MEDIUM: claude-sonnet-4-6
- LOW: claude-haiku-4-5

사용자에게 "최신 버전 반영 또는 수동 조정이 필요한지" 문의. 수정 요청 시 해당 필드만 Edit 도구로 갱신.

### Step 7: 런타임 상주 파일에 라우팅 등록 (`ulw` 활용)

AskUserQuestion으로 적용 범위 문의:
| 선택지 | 설명 | 대상 파일 |
|--------|------|----------|
| 모든 프로젝트 | 어디서든 mas-designer 사용 | `~/.claude/CLAUDE.md` |
| 이 프로젝트만 | 현재 프로젝트에서만 사용 | `./CLAUDE.md` |

선택된 파일에 다음 라우팅 블록을 Edit 도구로 추가 (이미 있으면 스킵):

```markdown
## mas-designer 플러그인
`@{스킬명}` 입력 시 `/mas-designer:{스킬명}` 실행.
- `@setup`: 플러그인 초기 설정
- `@help`: 사용 안내
- `@core`: 기획→설계→PPT 전체 파이프라인 실행
- `@plan`: STEP 1 기획 단독 실행
- `@design-mas`: STEP 2 MAS 설계 단독 실행
- `@generate-pptx`: STEP 3 PPT 생성 단독 실행
- `@review`: 최종 독립 검증
```

### Step 8: 설치 결과 요약 보고 (`ulw` 활용)

| 항목 | 상태 |
|------|------|
| Node.js 런타임 | ✅/❌ |
| Python 런타임 | ✅/❌ |
| pptxgenjs | ✅ 설치 |
| google-genai | ✅ 설치 |
| generate_image.py | ✅ 존재 |
| .env (GEMINI_API_KEY) | ✅ 등록 / ⏭ 스킵 |
| tier_mapping 모델 | 확인 완료 |
| 라우팅 등록 | ✅ (대상: ...) |

완료 시 사용자에게 "`/mas-designer:help` 또는 `/mas-designer:core`로 시작하세요" 안내.

## 사용자 상호작용

- Step 5의 API Key 입력
- Step 6의 모델 버전 확인
- Step 7의 라우팅 적용 범위 선택

AskUserQuestion 도구만 사용 (자유 대화 프롬프트 금지).

## 스킬 위임

없음 (직결형 단독 수행).

## 문제 해결

| 증상 | 해결 |
|------|------|
| `npm install pptxgenjs` 실패 | Node.js ≥18 확인, `npm cache clean --force` 후 재시도 |
| `pip install google-genai` 실패 | Python 3.10+ 확인, venv 활성화, `pip install -U pip` 후 재시도 |
| generate_image.py 실행 시 API 401 | `.env`의 GEMINI_API_KEY 값 재확인, 공백·따옴표 제거 |
| 모델 버전이 런타임에서 인식 안 됨 | runtime-mapping.yaml의 모델명 오타 확인 |
