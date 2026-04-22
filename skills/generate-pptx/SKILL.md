---
name: generate-pptx
description: STEP 3 경영진 발표 PPT 생성 (spec-writer 위임 + generate_image + pptxgenjs 빌드)
type: orchestrator
user-invocable: true
---

# Generate PPTX (STEP 3: 발표자료 PPT 작성)

[GENERATE-PPTX 활성화]

## 목표

STEP 1 기획·STEP 2 MAS 설계 산출물을 입력받아 경영진 발표용 PPT를 자동 생성함. 2단계 패턴 적용:
1. **spec-writer 위임**: `pptx-spec-writer` 에이전트가 GREAT 2 WHY·방향성·MAS 아키텍처 필수 슬라이드 포함 명세(`spec.md`) 및 이미지 프롬프트 JSON 작성
2. **이미지 생성 + 빌드**: 오케스트레이터가 `generate_image`로 슬라이드별 이미지 생성 후 `pptxgenjs` 기반 빌드 스크립트를 Write하여 실행, `.pptx` 산출

외부 변환 스킬(anthropic-skills:pptx 등) 미사용 — Cursor·Cowork 등 모든 런타임 호환.

## 활성화 조건

사용자가 `/mas-designer:generate-pptx` 호출 시 또는 "경영진 발표 PPT", "프리젠테이션 생성", "pptx 빌드" 키워드 감지 시.

## 에이전트 호출 규칙

### 에이전트 FQN
| 에이전트 | FQN |
|---------|-----|
| pptx-spec-writer | `mas-designer:pptx-spec-writer:pptx-spec-writer` |

### 프롬프트 조립
- `{DMAP_PLUGIN_DIR}/resources/guides/combine-prompt.md`에 따라 AGENT.md + agentcard.yaml + tools.yaml 합치기
- tier → 모델 매핑은 `gateway/runtime-mapping.yaml` 참조 (MEDIUM → sonnet-4-6)

### 서브 에이전트 호출
워크플로우 단계에 `Agent: {agent-name}`이 명시된 경우,
메인 에이전트는 해당 단계를 직접 수행하지 않고,
반드시 위 프롬프트 조립 규칙에 따라 해당 에이전트를 호출하여 결과를 받아야 함.

서브에이전트 호출 없이 메인 에이전트가 해당 산출물을 직접 작성하면
스킬 미준수로 간주함.

## 워크플로우

> **선행 조건**: `output/{project}/plan/*.md`(문제해결방향성 등) + `output/{project}/step2/mas-architecture.md` 존재 필수.
> 없으면 `/mas-designer:plan`·`/mas-designer:design-mas` 먼저 실행하도록 안내 후 중단.

### Phase 1: 입력 확인
AskUserQuestion으로 확인 (기본값 사용 시 스킵):
- PPT 제목 (기본: 프로젝트명 + "경영진 발표")
- 대상 청중 (기본: 경영진)
- 목표 슬라이드 수 (기본: 15~17장)
- 출력 디렉토리 (기본: `output/{project}/step3/`)

### Phase 2: 스토리라인 설계 → Agent: pptx-spec-writer
스토리라인 초안 작성 후 `output/{project}/step3/1-storyline.md`에 저장.

- **TASK**: GREAT 2 WHY 중심 목차(고객WHY→기업WHY→문제→방향성→핵심솔루션→MAS→로드맵→기대효과) 설계
- **EXPECTED OUTCOME**: `output/{project}/step3/1-storyline.md`
- **MUST DO**: 15~17장 목차·각 슬라이드 패턴(A~F) 예비 매핑
- **MUST NOT DO**: 슬라이드 상세 콘텐츠 작성 금지 (Phase 3에서 수행)
- **CONTEXT**: 기획 산출물 6종 + mas-architecture.md 전수 로드

### Phase 3: 시각 명세 작성 → Agent: pptx-spec-writer
- **TASK**: Phase 2 스토리라인 기반 슬라이드별 시각 명세(.md) + 이미지 프롬프트 JSON 작성
- **EXPECTED OUTCOME**: `output/{project}/step3/2.script.md` + `output/{project}/step3/image-prompts.json`
- **MUST DO**: `references/pptx-build-guide.md` 1~5절 스타일 준수, 슬라이드당 본문 ≤7줄, 이미지 참조는 `![설명](images/slide-N.png)`, 고객 WHY/기업 WHY 문장은 `문제해결방향성.md` 원문 재사용
- **MUST NOT DO**: 컬러·폰트 직접 지정 금지(가이드 표준 사용), 실제 이미지 생성 금지(이 Phase는 프롬프트 JSON만)
- **CONTEXT**: Phase 2 스토리라인 + 기획 산출물 + mas-architecture.md

### Phase 4: 이미지 생성 (Build — Claude Code 직접 수행)

1. `output/{project}/step3/image-prompts.json` 로드
2. 출력 디렉토리 준비: `mkdir -p output/{project}/step3/images`
3. 각 항목에 대해 Bash로 generate_image 실행:
   ```bash
   python gateway/tools/generate_image.py \
     --prompt "{prompt}" \
     --output-dir output/{project}/step3/images \
     --output-name "{filename without .png}"
   ```
4. 실패 시 최대 3회 재시도, 그래도 실패한 슬라이드는 `image-fallback.log`에 기록 후 플레이스홀더 처리
5. 생성 결과 인벤토리(파일명·크기·상태) 출력

### Phase 5: pptxgenjs 빌드 (Build & Verify — Claude Code 직접 수행) (`ralph` 활용)

1. **가이드 로드**: `skills/generate-pptx/references/pptx-build-guide.md` 전체 읽기 (특히 6절 검증 규칙 11항)
2. **Spec 분석**: `2.script.md` 파싱하여 슬라이드별 패턴(A~F) 매핑
3. **빌드 코드 작성**: Write 도구로 `output/{project}/step3/build.js` 생성
   - pptxgenjs 사용, 가이드 6절 11항 모두 준수:
     - `pptx.shapes.RECTANGLE`/`ROUNDED_RECTANGLE`
     - `defineLayout({name:"CUSTOM", width:16, height:9})`
     - `async function createSlideXX(pptx)` 패턴
     - `slide.addTable()` (수동 셀 그리기 금지)
     - `fs12()` 헬퍼로 12pt 미만 차단
     - 이미지 임베딩 전 경로·크기 검증
     - Pretendard 폰트 통일
     - `main().catch(e => { console.error(...); process.exit(1); })` 진입점
4. **빌드 실행**: Bash `cd output/{project}/step3 && node build.js`
5. **검증 A — 빌드 확인**:
   - 종료 코드 0 확인
   - `3.{project}.pptx` 존재 + 크기 > 0
   - 실패 시 에러 분석 → 코드 수정 → 재실행 (최대 3회)
6. **검증 B — PowerShell COM 시각적 검토**:
   - 아래 PS1 템플릿으로 `.temp/export-pptx.ps1`을 생성 후 슬라이드별 PNG 추출
   ```powershell
   $pptxPath = '<절대경로\3.{project}.pptx>'
   $outDir   = '<절대경로\preview>'
   if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
   Add-Type -AssemblyName Microsoft.Office.Interop.PowerPoint
   $ppt  = New-Object -ComObject PowerPoint.Application
   $pres = $ppt.Presentations.Open($pptxPath, 0, 0, 0)
   foreach ($i in 1..$pres.Slides.Count) {
       $pres.Slides.Item($i).Export("$outDir\slide-$i.png", 'PNG', 1600, 900)
   }
   $pres.Close(); $ppt.Quit()
   ```
   - PowerShell 실행 전 `Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force`로 파일 잠금 해제
   - 추출된 PNG를 Read 도구로 열어 레이아웃·이미지 비율·텍스트 잘림 시각 확인
   - 이상 발견 시 `build.js` 수정 → 재빌드 → 재검토 (최대 2회)
   - **기존 이미지 파일(`images/` 폴더)은 절대 삭제하지 말 것 — 레이아웃·크기만 조정**
   - 시각 검토 완료 후 임시 파일 정리: `Remove-Item '<preview경로>\*.png' -Force; Remove-Item '.temp\export-pptx.ps1' -Force`
7. **사용자 보고**: 절대 경로, 파일 크기, 슬라이드 수, 빌드 스크립트 경로, 시각 검토 결과 요약

### Phase 6: STEP 3 완료 보고
산출물 체크리스트:
- [ ] step3/1-storyline.md
- [ ] step3/2.script.md
- [ ] step3/image-prompts.json
- [ ] step3/images/*.png (생성 또는 플레이스홀더 로그)
- [ ] step3/build.js
- [ ] step3/3.{project}.pptx (0바이트 초과)

사용자에게 완료 보고 + 승인 요청.

## 완료 조건

- [ ] Phase 2~3 에이전트 위임 완료
- [ ] 이미지 생성 시도 완료 (실패 시 플레이스홀더 로그)
- [ ] PPTX 파일 0바이트 초과 (Phase 5 검증 A)
- [ ] 가이드 검증 규칙 11항 통과 (Phase 5 검증 A, 최대 3회 재시도)
- [ ] PowerShell COM 시각 검토 통과 (Phase 5 검증 B, 최대 2회 재검토)
- [ ] `images/` 기존 파일 삭제 금지 (레이아웃·크기 조정만 허용)
- [ ] 외부 변환 스킬(`anthropic-skills:pptx` 등) 미호출
- [ ] 사용자 승인

## 상태 정리

각 Phase 완료 시 `AGENTS.md`의 `## 워크플로우 상태 > ### generate-pptx` 섹션의 `마지막 완료 Phase`를 갱신.
완료 시 임시 파일 없음. `images/` 디렉토리는 산출물로 보존.

## 재개

1. `AGENTS.md`의 `## 워크플로우 상태 > ### generate-pptx` 섹션에서 `마지막 완료 Phase`를 읽음
2. 상태 섹션이 없거나 "(기록 없음)"이면 **Phase 1: 입력 확인**부터 수행
3. `spec.md`·`image-prompts.json`이 존재하면 Phase 3 스킵. 마지막 완료 Phase의 다음 Phase부터 진행
