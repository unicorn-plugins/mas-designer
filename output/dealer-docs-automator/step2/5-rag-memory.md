# 5. RAG · 메모리 전략

> 지식 소스·청킹·인덱싱·검색 파이프라인·리랭킹·메모리 구조.
> 근거: `references/03-rag.md` §2~§6, `references/02-langchain.md` §6 "Memory 패턴"

---

## RAG 대상 지식 소스

| 소스 | 형식 | 업데이트 주기 | 인덱스 |
|------|------|:-------------:|--------|
| 본사 규정집 (개인정보·AML·KYC·약관) | Markdown + PDF | 월 2회+ | `reg-main` |
| 상품·요금제 카탈로그 | JSON + PDF | 주 1회 | `catalog-main` |
| 본사 공지·Q&A | HTML | 일 | `notice-main` |
| 사기 사례·패턴 (익명화) | JSONL | 주 | `fraud-cases` |
| 영업지원 FAQ (콜센터 녹취 요약) | Markdown | 주 | `faq-main` |
| 과거 반려 사유 (축적 학습) | JSONL | 일 | `rejection-history` |

**개인 사용자 데이터는 RAG에 포함하지 않음** (PII 누출 방지). 근거: [1]

---

## 청킹 전략

### 1) 규정집 청킹
- **기준**: 조항 단위 (§단위 분할), 최대 **800 토큰**, overlap **100 토큰**
- **메타데이터**: `{clause_id, section, title, effective_date, tags}`
- **특수 처리**: 표·숫자 데이터는 별도 청크 분리 (수치 검색 우선)

### 2) 상품 카탈로그 청킹
- **기준**: 상품 단위 + 결합 조건 단위
- **메타데이터**: `{product_id, carrier, monthly_fee, term, discount_rules, effective_date}`

### 3) 사기 사례 청킹
- **기준**: 사례 1건 = 1 청크, **PII 완전 제거** 후
- **메타데이터**: `{case_type, dealer_region, detection_signal, outcome}`

근거: [2]

---

## 인덱싱 파이프라인

```
[소스 문서]
   │
   ▼
[전처리: PII 마스킹 · 노이즈 제거 · 정규화]
   │
   ▼
[청킹 (상기 전략 적용)]
   │
   ▼
[임베딩 생성]
   │   ├─ Dense: text-embedding-3-large (한국어 특화 대안: KoSimCSE)
   │   └─ Sparse: BM25 (하이브리드 검색용)
   │
   ▼
[Vector DB 저장]
   │   └─ pgvector + hybrid 검색
   │
   ▼
[메타데이터 태깅 · 버전 관리]
```

### 임베딩 모델 선정
- **주력**: OpenAI `text-embedding-3-large` (다국어·정확도 우수)
- **폴백**: 로컬 `KoSimCSE` (PII 포함 테스트용, 국내 리전)
- **업데이트 전략**: 모델 변경 시 전체 재인덱싱 (지원 기간 3년 단위)

근거: [3]

---

## 검색 파이프라인

```
[질의 (State의 activation_type + 사용자 자연어)]
   │
   ▼
[Query Rewriting]
   │   - 약어 복원 (MNP → "번호이동")
   │   - 도메인 용어 확장 (예: "위약금" → "해지 위약금 § 5.1 관련")
   │
   ▼
[Hybrid Search: Dense(vector) + Sparse(BM25)]
   │   - Top-K 각 20개
   │
   ▼
[Reranker]
   │   - Cross-Encoder (Cohere Rerank 또는 bge-reranker-large)
   │   - 최종 Top 5~8
   │
   ▼
[Citation Builder]
   │   - 조항 ID · 원문 발췌 · 유효일자 표기
   │
   ▼
[LLM 추론 (ReAct 패턴)]
   │   - 인용 텍스트 기반 판정·근거 생성
   │
   ▼
[응답 + 조항 ID 링크]
```

### Reranking 필요 이유
- 규정은 유사 키워드(예: "해지", "해제", "철회") 혼재 → 단순 유사도로 부적절 매칭 위험
- Cross-encoder로 질의·조항 쌍 관계를 재평가

근거: [2], [3]

---

## ReAct 프롬프트 패턴 (RegGuard용)

```
시스템: 당신은 통신 규정 판정자이다. 판정 시 반드시 조항을 인용한다.

사용자: {activation_type=MNP, 기존 약정 유지중, 잔여 6개월}
       → 이 개통은 규정상 진행 가능한가?

에이전트 추론(ReAct):
  Thought: MNP + 기존 약정 잔여 시 위약금 규정 필요.
  Action: search_clause("MNP 기존 약정 위약금")
  Observation: 조항 §5.1, §7.3 반환
  Thought: §5.1은 위약금 계산 공식, §7.3은 사전 고지 의무.
  Action: cite_clause("§5.1"), cite_clause("§7.3")
  Observation: 원문 반환
  Final: "진행 가능 (Yellow). 사유: 기존 약정 잔여로 위약금 5만 원 발생 예상.
          §5.1에 따라 계산, §7.3에 따라 고지 의무 있음. 고지 후 고객 동의 필수."
```

근거: [1] §4 "ReAct + RAG 결합"

---

## 메모리 전략 (단기·장기)

### 단기 메모리 (Session-scoped)
- **범위**: 단일 개통 세션 (약 15분)
- **저장소**: LangGraph State (휘발성) + CP_SIGNED 체크포인트
- **내용**: 현재 고객 대화 이력, 에이전트 중간 판정, 영업사원 확인 기록
- **종료**: 세션 종료 시 자동 폐기 (감사 로그로만 이관)

### 장기 메모리 (Persistent)
- **범위**: 대리점·영업사원 단위 누적
- **저장소**: 감사 DB + fraud-history-mcp
- **내용**:
  - 영업사원 FP(오탐) 피드백 이력 → 개인화 스코어 보정
  - 대리점별 사기 패턴 트렌드 → 지역 가중치
  - 반려 이력 → rejection-history RAG 인덱스로 환원 (축적 학습)

### 대화 메모리 (Dealer Copilot)
- **범위**: 영업사원 1일 세션
- **저장소**: Redis + TTL 24h
- **내용**: 최근 질의 5건, 제공 답변 요약
- **용도**: 반복 질의 응답 속도 향상, 맥락 기반 답변

### PII 처리 원칙
- 단기 메모리: 원본 보관 가능 (격리된 세션 컨테이너)
- 장기 메모리: **PII 완전 제거 또는 토큰화**만 저장
- 근거: [4]

---

## 지식 소스 업데이트 자동화

```
[본사 규정 Git 저장소] --(webhook)--> [Re-indexer Job] --> [Vector DB]
                                          │
                                          └──(변경 리포트)──> [Slack/Email 알림]
```

- 규정 개정 시 **24시간 내** Vector DB 반영
- 변경 조항에 영향 받는 **최근 30일 개통 이력**은 감사 리포트로 자동 검토

---

## 각주

[1]: `references/03-rag.md` §2 "청킹 전략", §4 "ReAct + RAG"
[2]: `references/03-rag.md` §3 "Hybrid Search", §5 "Reranking"
[3]: `references/02-langchain.md` §6 "Memory", §9 "Embedding 모델 선정"
[4]: `references/02-langchain.md` §6 "단기·장기 메모리 분리 원칙"
