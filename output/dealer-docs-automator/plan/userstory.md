# 유저스토리

> UFR(기능) / AFR(AI 특화) / NFR(비기능) 3카테고리. Given-When-Then AC + LLM 검증 기준 + INVEST.
> user-story-writer 산출 — references/06-user-stories-guide.md 준수.

---

## 공통 정의

- **Actor**: 영업사원(SA) / 고객(C) / 점장(M) / 본사 리스크팀(R) / 시스템(S)
- **우선순위**: Must(필수) / Should(권장) / Could(선택)
- **Story Points**: 1 / 2 / 3 / 5 / 8 (Fibonacci)

---

## UFR — User Functional Requirements (일반 기능)

### UFR-01. 신분증 스캔 및 OCR 추출

**Narrative**: As a 영업사원, I want 태블릿 카메라로 신분증을 촬영하면 자동으로 필드가 추출되기를, so that 수기 입력 오류와 시간을 줄인다.

**Acceptance Criteria**:
- **Given** 태블릿 카메라 권한이 허용되고, 단말이 연결된 상태
  **When** 영업사원이 신분증을 촬영하면
  **Then** 주민번호(마스킹)·성명·주소·발급일이 5초 내 추출된다
- **Given** 조명 불량·사진 흐림
  **When** OCR 신뢰도 < 0.85
  **Then** 재촬영을 요청하는 가이드가 화면에 표시된다
- **Given** 신분증 위변조 의심 패턴 감지
  **When** VLM 위변조 스코어 > 0.7
  **Then** 이벤트가 Fraud Scorer에 전달되고 UI에 경고 표시

**우선순위**: Must | **Points**: 5

---

### UFR-02. 개통 진행 현황 가시화

**Narrative**: As a 영업사원, I want 현재 개통 건이 어느 단계에 있는지 실시간 진행바로 확인하기를, so that 고객에게 예상 시간을 안내할 수 있다.

**Acceptance Criteria**:
- **Given** 개통 요청 이벤트 발생
  **When** 각 에이전트(IDV/RG/FS/AD) 상태가 변경되면
  **Then** UI 단계 진행바가 500ms 내 갱신된다
- **Given** 전체 개통 완료
  **When** BSS 접수 성공
  **Then** 접수번호 + 예상 개통 시각이 표시된다

**우선순위**: Must | **Points**: 3

---

### UFR-03. 전자서명 통합

**Narrative**: As a 고객, I want 출력된 종이에 서명하지 않고 태블릿에서 바로 서명하기를, so that 대기 시간이 줄어든다.

**Acceptance Criteria**:
- **Given** 자동 생성된 PDF 서류가 UI에 표시
  **When** 서명 영역을 터치하여 서명 입력
  **Then** PDF에 서명 이미지가 삽입되고 무결성 해시 생성
- **Given** 법인 개통
  **When** 대표자·담당자 2인 서명 필요
  **Then** 순차 서명 흐름 제공

**우선순위**: Must | **Points**: 5

---

### UFR-04. 본사 BSS 자동 제출

**Narrative**: As a 시스템, I want 검증·서명 완료 건을 BSS에 자동 제출하기를, so that 영업사원 수기 업로드가 제거된다.

**Acceptance Criteria**:
- **Given** 서명 완료 + Green 판정
  **When** BSS API 호출
  **Then** 접수번호 반환, 실패 시 최대 3회 재시도
- **Given** BSS 장애
  **When** 타임아웃·5xx 반환
  **Then** Local Queue에 저장하고 Health Monitor가 복구 감지 시 자동 드레인

**우선순위**: Must | **Points**: 5

---

### UFR-05. 점장 대시보드

**Narrative**: As a 점장, I want 일 단위 개통·반려·리스크 지표를 한 화면에서 확인하기를, so that 이상 징후를 조기 감지할 수 있다.

**Acceptance Criteria**:
- **Given** 당일 개통 이벤트 누적
  **When** 대시보드 접속
  **Then** 건수·반려율·Red 건수·평균 처리 시간 표시
- **Given** Red 3건/시간 이상
  **When** 임계 초과
  **Then** 점장에게 알림 푸시

**우선순위**: Should | **Points**: 3

---

## AFR — AI Functional Requirements (AI 특화)

### AFR-01. 실시간 리스크 트리아지 (킹핀)

**Narrative**: As a 영업사원, I want 개통 접수 시 2초 내 Green/Yellow/Red 판정과 근거를 받기를, so that 의심 고객을 즉시 식별하고 대응할 수 있다.

**Acceptance Criteria**:
- **Given** 개통 이벤트 발생
  **When** Orchestrator가 IDV/RG/FS를 병렬 호출
  **Then** 2초 이내 통합 스코어(0~1) + 3단계 분류(Green/Yellow/Red) + 근거 리스트 반환
- **Given** Yellow 판정
  **When** 영업사원 UI
  **Then** 에스컬레이션 버튼 제공, 점장·본사 리스크팀 동시 알림
- **Given** Red 판정
  **When** BSS 제출
  **Then** 본사 리스크팀 수동 승인 없이 제출 차단

**LLM 검증 기준**:
- 근거 리스트는 **각 에이전트 판정 이유 1~3개**를 **조항 ID·데이터 소스 명시** 형식으로 제공
- 스코어가 Red임에도 근거가 빈 경우 → **거부 후 재평가 트리거** (자가 일관성 검증)
- FP(False Positive) 사용자 피드백 버튼 제공, 7일 누적 FP > 5% 시 모델 재학습 알람

**우선순위**: Must | **Points**: 8

---

### AFR-02. VLM 기반 신분증 위변조 탐지

**Narrative**: As a 시스템, I want 신분증 이미지를 VLM으로 분석해 위조·변조·재촬영 여부를 판정하기를, so that 명의도용을 사전 차단한다.

**Acceptance Criteria**:
- **Given** OCR 완료 상태
  **When** VLM 위변조 분석 실행
  **Then** 0~1 스코어 + 의심 영역(bbox) + 의심 유형(합성/변조/재촬영/불명) 제공
- **Given** 스코어 > 0.7
  **When** 고위험 판정
  **Then** 고객 셀피 · 라이브니스 체크 추가 요청

**LLM 검증 기준**:
- 의심 유형이 "불명"인 경우 → Orchestrator가 **자동 재촬영 요구 + 로그 누적**
- 판정 근거에 **이미지 영역 설명**(예: "홀로그램 위치 이상") 포함 필수
- 셀피 대조 시 임베딩 유사도 < 0.6이면 Red 판정 자동 트리거

**우선순위**: Must | **Points**: 8

---

### AFR-03. 규정 RAG 실시간 검색 및 조항 인용

**Narrative**: As a 영업사원, I want 현재 상황에 적용되는 규정 조항을 자동으로 인용받기를, so that 본사 영업지원에 전화하지 않아도 된다.

**Acceptance Criteria**:
- **Given** 개통 요청 유형(신규/MNP/법인/외국인 등) 분류
  **When** RegGuard가 RAG 검색
  **Then** 관련 규정 조항 3~5건 리랭킹 + 인용 원문 제공
- **Given** 규정 개정
  **When** 본사 규정집 업데이트
  **Then** Vector DB 자동 재인덱싱 (24시간 내)

**LLM 검증 기준**:
- 조항 인용 시 **조항 ID + 원문 일치율 ≥ 95%** (환각 방지)
- 적용되지 않는 조항 인용 시 → **자가 검증 프롬프트**로 재판정
- 상담 중 영업사원 질의에 대해 **Hallucination 점수 내장**, 일정 수준 이하만 노출

**우선순위**: Must | **Points**: 5

---

### AFR-04. 이상 패턴 기반 사기 스코어링

**Narrative**: As a 시스템, I want 최근 개통 이력·블랙리스트·다회선 패턴을 결합해 사기 확률을 계산하기를, so that 현장 영업사원이 차단 결정에 활용한다.

**Acceptance Criteria**:
- **Given** 고객 식별 정보 확보
  **When** Fraud Scorer가 분산 DB 조회 + ML 스코어링
  **Then** 0~1 점수 + 주요 feature 3개 + 유사 사례 1건 제공
- **Given** 스코어 > 0.9
  **When** 자동 Red 판정
  **Then** 영업사원 UI + 본사 리스크팀 동시 알림

**LLM 검증 기준**:
- **ML 점수 + LLM 추론**이 불일치하면 더 보수적 쪽으로 판정
- Feature 중 PII 포함 시 마스킹 후 설명에 노출
- 매일 FP 리뷰 데이터셋 자동 샘플링 → 주간 보고

**우선순위**: Must | **Points**: 8

---

### AFR-05. 서류 자동 생성 (AutoDoc)

**Narrative**: As a 시스템, I want 검증된 정보를 바탕으로 가입신청서·위임장·동의서를 템플릿에 자동 기입하기를, so that 영업사원 수기 입력을 제거한다.

**Acceptance Criteria**:
- **Given** IDV/RG/FS Green
  **When** AutoDoc이 서류 생성
  **Then** PDF 3종(가입신청서·위임장·동의서) 생성, 필드 누락 없음
- **Given** 법인 개통
  **When** 다중 회선 요청
  **Then** 회선별 서류 자동 일괄 생성

**LLM 검증 기준**:
- 모든 필드가 **데이터 소스 검증**(입력값 일치) 후에만 기입
- 자동 생성본과 템플릿 구조 일치 검증 (자가 비교)
- 생성된 PDF 내 PII는 **원본만 허용, 요약/로그에는 마스킹**

**우선순위**: Must | **Points**: 5

---

### AFR-06. 다국어 약관 번역 (외국인 가입자)

**Narrative**: As a 외국인 고객, I want 약관을 내 언어로 이해하기를, so that 불완전판매 없이 동의할 수 있다.

**Acceptance Criteria**:
- **Given** 외국인 가입자 + 언어 선택
  **When** LLM 번역 실행
  **Then** 원문 한글 + 참고 번역본 병기, "법적 효력은 원문에 있음" Disclaimer 표시
- **Given** 번역 신뢰도 < 0.9
  **When** 주요 조항
  **Then** 영업사원에게 수동 확인 요청

**LLM 검증 기준**:
- 번역 결과에 대해 **역번역 재대조**하여 의미 일치율 측정
- 법적 용어는 **번역 사전 고정 매핑** 우선 적용
- 번역문에 원문 조항 ID 유지

**우선순위**: Should | **Points**: 5

---

## NFR — Non-Functional Requirements

### NFR-01. 응답 지연 (Latency)

- Orchestrator 병렬 평가 합산 **≤ 2초** (p95), **≤ 3.5초** (p99)
- BSS 제출 타임아웃 5초, 재시도 3회
- UI 업데이트 500ms 내
- **Must** | **Points**: 3

### NFR-02. 개인정보 보호 (PII)

- 주민번호·전화번호·주소·신분증 원본은 **로컬 암호화 저장**, 전송 시 마스킹
- 로그·프롬프트에 PII 평문 금지
- 감사 로그 7년 보관 (개인정보보호법 기준)
- **Must** | **Points**: 5

### NFR-03. 가용성

- 대리점 단말 로컬 실행 가능 (OCR·PII 마스킹은 로컬)
- BSS 장애 시 오프라인 큐잉 (UFR-04 연계)
- 연간 가용성 **≥ 99.5%**
- **Must** | **Points**: 5

### NFR-04. 설명 가능성 (XAI)

- 모든 AI 판정은 근거 리스트 제공 (이유 + 데이터 소스)
- 블랙박스 판정 금지 (거버넌스 리뷰 통과 조건)
- 감사 로그에 판정 근거 저장
- **Must** | **Points**: 3

### NFR-05. 확장성 (Scalability)

- 1,000 대리점 × 평균 5건/일 × 피크 3배 = 15,000건/일 피크 처리
- Orchestrator 수평 확장 가능 (Stateless + 외부 Checkpoint)
- **Should** | **Points**: 5

### NFR-06. 준수 · 규제

- 개인정보보호법 / 정보통신망법 / 전자서명법 / KYC·AML 규제 준수
- 외부 감사 보고서 분기별 생성 가능
- **Must** | **Points**: 3

### NFR-07. 다국어 지원

- UI: 한국어 기본, 영어/중국어/베트남어 지원
- 약관 번역: LLM 기반 (AFR-06)
- **Should** | **Points**: 2

### NFR-08. 국내 데이터 거주

- 모든 PII는 국내 리전에 저장 (규제 요구)
- 해외 모델 API 호출 시 PII 마스킹 후 전송
- **Must** | **Points**: 3

---

## 유저스토리 총계

| 카테고리 | 건수 | 총 Story Points |
|---------|:---:|:--------------:|
| UFR | 5 | 21 |
| AFR | 6 | 39 |
| NFR | 8 | 29 |
| **합계** | **19** | **89** |

### 우선순위별

| 우선순위 | UFR | AFR | NFR | 계 |
|---------|:---:|:---:|:---:|:--:|
| Must | 4 | 5 | 5 | 14 |
| Should | 1 | 1 | 2 | 4 |
| Could | 0 | 0 | 1 | 1 |

---

## INVEST 자가 검증 요약

모든 19개 스토리에 대해:
- ✅ **Independent**: 스토리 간 하드 의존 없이 개별 개발 가능 (AFR-01이 오케스트레이션 허브)
- ✅ **Negotiable**: 수용 기준을 유연 조정 가능 (예: 2초 → 3초 협상 여지)
- ✅ **Valuable**: 각 스토리가 고객 또는 기업 가치에 직접 기여
- ✅ **Estimable**: Story Points 1~8 범위에 모두 위치
- ✅ **Small**: 8pt 초과 스토리 없음 (AFR-01/02/04는 8pt, 분할 검토 가능)
- ✅ **Testable**: Given-When-Then 명시, LLM 검증 기준 포함

---

## 다음 단계 (STEP 2 진입)

mas-architect 에이전트가 본 유저스토리 + `es/*.puml` + `ai/tech-info/*` 5종 가이드를 근거로
다음 8개 설계 산출물 작성:

1. `step2/1-agents.md` — 에이전트 프로파일
2. `step2/2-graph.md` — LangGraph 그래프 설계
3. `step2/3-sequence.md` — 상호작용 시퀀스
4. `step2/4-tool-mcp.md` — Tool·MCP 바인딩
5. `step2/5-rag-memory.md` — RAG·메모리 전략
6. `step2/6-multimodal.md` — 멀티모달 I/O
7. `step2/7-reliability.md` — 에러·폴백·관측성·보안
8. `step2/mas-architecture.md` — 통합 설계서
