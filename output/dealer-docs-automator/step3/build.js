// dealer-docs-automator PPTX Builder
// pptx-build-guide.md 6절 검증 규칙 11항 준수
// - fs12() 최소 폰트 12pt 강제
// - defineLayout CUSTOM 16:9
// - pptx.shapes.RECTANGLE/ROUNDED_RECTANGLE 사용
// - slide.addTable() 사용
// - Pretendard 폰트 통일
// - main().catch 진입점

const PPTXGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────
// 규칙 #1. fs12() — 최소 폰트 크기 12pt 강제
// ─────────────────────────────────────────────────────────────
const fs12 = (n) => Math.max(12, n);

// ─────────────────────────────────────────────────────────────
// 스타일 상수 (pptx-build-guide §1, §2 준수)
// ─────────────────────────────────────────────────────────────
const FONT = "Pretendard";
const C = {
  navy: "1E3A8A",
  navyDark: "0F172A",
  teal: "0D9488",
  green: "10B981",
  amber: "F59E0B",
  red: "DC2626",
  bg: "FAFAFA",
  white: "FFFFFF",
  textMain: "111827",
  textSub: "4B5563",
  border: "D1D5DB",
  card: "F3F4F6",
  accent1: "3B82F6",
  accent2: "8B5CF6",
  accent3: "EC4899",
};

// 공통 타이틀 배치
function addTitle(slide, text, subtitle) {
  slide.addShape("rect", {
    x: 0, y: 0, w: 16, h: 0.8, fill: { color: C.navy },
  });
  slide.addText(text, {
    x: 0.5, y: 0.1, w: 15, h: 0.6,
    fontSize: fs12(22), bold: true, color: C.white, fontFace: FONT,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.82, w: 15, h: 0.35,
      fontSize: fs12(13), color: C.textSub, fontFace: FONT,
    });
  }
}

// 공통 푸터
function addFooter(slide, page, total) {
  slide.addText(`dealer-docs-automator | ${page}/${total}`, {
    x: 0.5, y: 8.6, w: 15, h: 0.3,
    fontSize: fs12(10), color: C.textSub, fontFace: FONT, align: "right",
  });
  slide.addShape("rect", {
    x: 0, y: 8.5, w: 16, h: 0.03, fill: { color: C.navy },
  });
}

// 이미지 존재·크기 검증 (규칙 #7)
function safeImage(imgPath) {
  const abs = path.join(__dirname, imgPath);
  if (!fs.existsSync(abs)) {
    console.warn(`[WARN] image missing: ${imgPath}`);
    return null;
  }
  if (fs.statSync(abs).size < 1000) {
    console.warn(`[WARN] image too small: ${imgPath}`);
    return null;
  }
  return abs;
}

const TOTAL = 17;

// ─────────────────────────────────────────────────────────────
// 슬라이드 빌더
// ─────────────────────────────────────────────────────────────

async function slide01(pptx) {  // 표지
  const s = pptx.addSlide();
  s.background = { color: C.white };
  s.addShape("rect", { x:0, y:0, w:16, h:9, fill:{color:C.white} });
  s.addShape("rect", { x:0, y:0, w:0.3, h:9, fill:{color:C.navy} });

  const img = safeImage("images/slide-01-cover.png");
  if (img) s.addImage({ path: img, x: 9.5, y: 1.5, w: 6, h: 5.5 });

  s.addText("dealer-docs-automator", {
    x: 0.8, y: 2.5, w: 9, h: 1,
    fontSize: fs12(40), bold: true, color: C.navy, fontFace: FONT,
  });
  s.addText("대리점 개통 지능 시스템", {
    x: 0.8, y: 3.6, w: 9, h: 0.6,
    fontSize: fs12(22), color: C.textMain, fontFace: FONT,
  });
  s.addText("Real-time Risk Triage Agent for Telecom Dealers", {
    x: 0.8, y: 4.2, w: 9, h: 0.5,
    fontSize: fs12(16), italic: true, color: C.teal, fontFace: FONT,
  });
  s.addText("2026-04-21 · 보고 대상: CIO 및 경영진", {
    x: 0.8, y: 7.5, w: 9, h: 0.4,
    fontSize: fs12(13), color: C.textSub, fontFace: FONT,
  });
}

async function slide02(pptx) {  // 목차
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "목차", "Why → How → What 순서로 의사결정까지");

  const items = [
    ["01", "WHY", "영업사원이 원하는 것"],
    ["02", "WHY", "본사가 원하는 것"],
    ["03", "현상", "3대 고통 · 근본 원인"],
    ["04", "방향성", "3대 전략 축"],
    ["05", "솔루션", "RTA (확장형)"],
    ["06", "아키텍처", "에이전트 · 그래프 · Tool/MCP · RAG · 멀티모달"],
    ["07", "로드맵", "18개월 6단계 + 기대 효과"],
    ["08", "결정", "리스크 · 의사결정 요청"],
  ];

  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 1 + col * 7.5;
    const y = 1.5 + row * 1.6;
    s.addShape("roundRect", {
      x, y, w: 6.8, h: 1.3, rectRadius: 0.1,
      fill: { color: C.card }, line: { color: C.border, width: 0.5 },
    });
    s.addText(it[0], {
      x: x + 0.3, y: y + 0.25, w: 0.8, h: 0.8,
      fontSize: fs12(26), bold: true, color: C.teal, fontFace: FONT,
    });
    s.addText(it[1], {
      x: x + 1.3, y: y + 0.2, w: 5, h: 0.4,
      fontSize: fs12(13), bold: true, color: C.navy, fontFace: FONT,
    });
    s.addText(it[2], {
      x: x + 1.3, y: y + 0.6, w: 5, h: 0.6,
      fontSize: fs12(15), color: C.textMain, fontFace: FONT,
    });
  });
  addFooter(s, 2, TOTAL);
}

async function slide03(pptx) {  // 고객 WHY
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "고객 WHY — 영업사원이 원하는 것", "Great 2 WHY · 1/2");

  // 하이라이트 박스
  s.addShape("roundRect", {
    x: 0.5, y: 1.5, w: 8.5, h: 3, rectRadius: 0.15,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addText(`"내 옆에서 AI가 2초 만에 위험을 읽어주니,\n의심 고객 앞에서 당황하거나\n본사에 전화 돌리지 않아도 된다."`, {
    x: 0.7, y: 1.7, w: 8.1, h: 2.6,
    fontSize: fs12(20), bold: true, color: C.white, fontFace: FONT, valign: "middle",
  });

  // 영업사원 현황 카드
  s.addText("현재 고통", {
    x: 0.5, y: 4.8, w: 4, h: 0.4,
    fontSize: fs12(15), bold: true, color: C.red, fontFace: FONT,
  });
  s.addText("• 서류 작성 30분 + 반려 재처리\n• 본사 영업지원 콜 5~15분 대기\n• 사기 의심 고객 판단 스트레스", {
    x: 0.5, y: 5.2, w: 4, h: 2,
    fontSize: fs12(13), color: C.textMain, fontFace: FONT, paraSpaceAfter: 6,
  });
  s.addText("AI 도입 후", {
    x: 5, y: 4.8, w: 4, h: 0.4,
    fontSize: fs12(15), bold: true, color: C.green, fontFace: FONT,
  });
  s.addText("• 12분 처리 (-60%)\n• 규정 RAG로 95% 자체 답변\n• 근거 있는 위험 판정으로 자신감 +", {
    x: 5, y: 5.2, w: 4, h: 2,
    fontSize: fs12(13), color: C.textMain, fontFace: FONT,
  });

  const img = safeImage("images/slide-03-customer-why.png");
  if (img) s.addImage({ path: img, x: 9.5, y: 1.5, w: 6, h: 5.5 });

  addFooter(s, 3, TOTAL);
}

async function slide04(pptx) {  // 기업 WHY
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "기업 WHY — 본사·CIO가 원하는 것", "Great 2 WHY · 2/2");

  s.addShape("roundRect", {
    x: 0.5, y: 1.5, w: 8.5, h: 3.3, rectRadius: 0.15,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  s.addText(`"개통 순간의 사기·규정 위반을 실시간 차단해\n연 100~300억 원의 손실과 브랜드·법적 리스크를 동시에 막고,\n이 리스크 방어 아키텍처를 모든 대리점 업무의\n지능 표준으로 확장한다."`, {
    x: 0.7, y: 1.7, w: 8.1, h: 2.9,
    fontSize: fs12(18), bold: true, color: C.white, fontFace: FONT, valign: "middle",
  });

  // 3대 가치 카드
  const values = [
    ["손실 예방", "연 100~300억 원", C.red],
    ["규제 준수", "과태료·법적 방어", C.amber],
    ["지능 표준화", "전사 업무 확장", C.teal],
  ];
  values.forEach((v, i) => {
    const x = 0.5 + i * 2.9;
    s.addShape("roundRect", {
      x, y: 5.2, w: 2.7, h: 1.7, rectRadius: 0.1,
      fill: { color: C.card }, line: { color: v[2], width: 1.5 },
    });
    s.addText(v[0], {
      x: x + 0.1, y: 5.35, w: 2.5, h: 0.5,
      fontSize: fs12(15), bold: true, color: v[2], fontFace: FONT, align: "center",
    });
    s.addText(v[1], {
      x: x + 0.1, y: 5.85, w: 2.5, h: 0.9,
      fontSize: fs12(13), color: C.textMain, fontFace: FONT, align: "center", valign: "middle",
    });
  });

  const img = safeImage("images/slide-04-enterprise-why.png");
  if (img) s.addImage({ path: img, x: 9.5, y: 1.5, w: 6, h: 5.5 });

  addFooter(s, 4, TOTAL);
}

async function slide05(pptx) {  // 현상 3대 고통
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "현상 — 개통 현장의 3대 고통", "업계 통상치 기준");

  const cards = [
    { title: "반려율 15~25%", num: "20%", sub: "BSS 재처리 연 150~300억", color: C.red },
    { title: "사기 개통 0.3~1.2%", num: "0.8%", sub: "건당 100~300만 손실·법적 리스크", color: C.amber },
    { title: "처리 시간 25~40분", num: "30min", sub: "영업사원 소진·경쟁 열위", color: C.navy },
  ];

  cards.forEach((c, i) => {
    const x = 0.5 + i * 5.1;
    s.addShape("roundRect", {
      x, y: 2, w: 4.9, h: 5.5, rectRadius: 0.15,
      fill: { color: C.white }, line: { color: c.color, width: 2 },
    });
    s.addShape("rect", {
      x, y: 2, w: 4.9, h: 0.6, fill: { color: c.color },
    });
    s.addText(c.title, {
      x: x + 0.1, y: 2.05, w: 4.7, h: 0.5,
      fontSize: fs12(15), bold: true, color: C.white, fontFace: FONT, align: "center",
    });
    s.addText(c.num, {
      x, y: 3, w: 4.9, h: 1.8,
      fontSize: fs12(48), bold: true, color: c.color, fontFace: FONT, align: "center",
    });
    s.addText(c.sub, {
      x: x + 0.2, y: 5.2, w: 4.5, h: 2,
      fontSize: fs12(13), color: C.textMain, fontFace: FONT, align: "center",
    });
  });

  addFooter(s, 5, TOTAL);
}

async function slide06(pptx) {  // 근본 원인
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "근본 원인", "5WHY 심화 · 세 현상 모두 '데이터·지능이 있으나 현장 순간에 도달 안 함'");

  const rows = [
    [{ text: "현상", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } },
     { text: "근본 원인", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } }],
    [{ text: "반려율 20%", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT, bold: true } },
     { text: "규정이 현장 작성 시점에 실시간·맥락적으로 제공 안 됨", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
    [{ text: "사기 개통 0.8% (킹핀)", options: { fontSize: fs12(13), color: C.red, fontFace: FONT, bold: true } },
     { text: "위험 신호가 개통 순간에 현장에 도달하지 않음", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
    [{ text: "처리 시간 30분", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT, bold: true } },
     { text: "자동화 가능 작업이 오케스트레이션 부재로 순차 수작업", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.6, w: 15, h: 4,
    colW: [4, 11],
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: FONT,
  });

  s.addShape("roundRect", {
    x: 0.5, y: 6, w: 15, h: 2, rectRadius: 0.1,
    fill: { color: C.card }, line: { color: C.teal, width: 1 },
  });
  s.addText("→ 킹핀 문제(사기 실시간 차단) 해결이 나머지 두 문제의 트로이 목마 역할", {
    x: 0.7, y: 6.2, w: 14.6, h: 0.5,
    fontSize: fs12(15), bold: true, color: C.teal, fontFace: FONT,
  });
  s.addText("RTA 아키텍처에 규정 RAG·서류 자동화를 내부 에이전트로 편입하여 단계적으로 확장 가능", {
    x: 0.7, y: 6.8, w: 14.6, h: 1,
    fontSize: fs12(13), color: C.textMain, fontFace: FONT,
  });

  addFooter(s, 6, TOTAL);
}

async function slide07(pptx) {  // 방향성 3대 축
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "방향성 — 3대 전략 축", "독립 목표 아닌 한 아키텍처의 세 얼굴");

  const axes = [
    {
      num: "01",
      name: "Real-time\nRisk Triage",
      desc: "병렬 에이전트 · 2초 위험 스코어",
      bullets: [
        "• OCR · VLM · 규정 RAG · ML 4종 동시 실행",
        "• Green / Yellow / Red 3단계 판정",
        "• 2s Hard timeout, 부분 결과 진행 허용",
      ],
      effect: "반려율 20% → 5% · 사기 0.8% → 0.1%",
      color: C.navy,
    },
    {
      num: "02",
      name: "Explainable\nCompliance",
      desc: "조항 인용 · 근거 · 감사",
      bullets: [
        "• 규정 조항 ID + 원문 인용 (환각 방지)",
        "• ReAct + 자가 검증 프롬프트",
        "• Append-only 감사 로그 7년 보관",
      ],
      effect: "과태료 · 규제 리스크 사전 방어",
      color: C.teal,
    },
    {
      num: "03",
      name: "Progressive\nIntelligence Standard",
      desc: "사기 → 규정 → 서류 → CX 확장",
      bullets: [
        "• RTA = 대리점 지능 허브",
        "• 동일 아키텍처를 리텐션·CS로 재사용",
        "• FP·반려 사례 축적 → 데이터 자산화",
      ],
      effect: "18개월 내 전사 지능 표준화",
      color: C.amber,
    },
  ];
  axes.forEach((a, i) => {
    const x = 0.5 + i * 5.1;
    // 카드 배경 (높이 5.0 — 하단 배너 이미지 공간 확보)
    s.addShape("roundRect", {
      x, y: 1.5, w: 4.9, h: 5.0, rectRadius: 0.15,
      fill: { color: a.color }, line: { color: a.color },
    });
    // 번호
    s.addText(a.num, {
      x: x + 0.2, y: 1.6, w: 2, h: 0.75,
      fontSize: fs12(34), bold: true, color: C.white, fontFace: FONT,
    });
    // 이름
    s.addText(a.name, {
      x: x + 0.2, y: 2.4, w: 4.5, h: 1.1,
      fontSize: fs12(17), bold: true, color: C.white, fontFace: FONT,
    });
    // 한 줄 요약
    s.addText(a.desc, {
      x: x + 0.2, y: 3.55, w: 4.5, h: 0.4,
      fontSize: fs12(13), italic: true, color: C.white, fontFace: FONT,
    });
    // 구분선
    s.addShape("rect", {
      x: x + 0.2, y: 3.95, w: 4.5, h: 0.02,
      fill: { color: C.white },
    });
    // 상세 bullets
    s.addText(a.bullets.join("\n"), {
      x: x + 0.2, y: 4.05, w: 4.5, h: 1.6,
      fontSize: fs12(12), color: C.white, fontFace: FONT, paraSpaceAfter: 3,
    });
    // 기대 효과 하이라이트
    s.addShape("roundRect", {
      x: x + 0.2, y: 5.75, w: 4.5, h: 0.6, rectRadius: 0.08,
      fill: { color: C.white },
    });
    s.addText(a.effect, {
      x: x + 0.2, y: 5.75, w: 4.5, h: 0.6,
      fontSize: fs12(12), bold: true, color: a.color, fontFace: FONT,
      align: "center", valign: "middle",
    });
  });

  // 하단 배너 이미지 (재생성된 3:1 배너, sizing:contain으로 비율 유지)
  const img = safeImage("images/slide-07-direction.backup.png");
  if (img) {
    s.addImage({
      path: img,
      x: 1.5, y: 6.75, w: 13, h: 1.65,
      sizing: { type: "contain", w: 13, h: 1.65 },
    });
  }

  addFooter(s, 7, TOTAL);
}

async function slide08(pptx) {  // 핵심 솔루션
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "핵심 솔루션 — RTA (확장형)", "Real-time Triage Agent for Telecom Dealers");

  s.addShape("roundRect", {
    x: 0.5, y: 1.6, w: 15, h: 2.8, rectRadius: 0.15,
    fill: { color: C.navy },
  });
  s.addText("대리점 개통 실시간 멀티에이전트 리스크 트리아지 시스템", {
    x: 0.7, y: 1.8, w: 14.6, h: 0.6,
    fontSize: fs12(20), bold: true, color: C.white, fontFace: FONT,
  });
  s.addText(`"통신 대리점 개통 순간, 사기·명의도용·규정 위반을\n병렬 에이전트가 2초 내 판정하고, 검증·서류 생성·감사까지\n하나의 LangGraph 오케스트레이션으로 완결하는 현장 지능 시스템"`, {
    x: 0.7, y: 2.5, w: 14.6, h: 1.8,
    fontSize: fs12(15), italic: true, color: C.white, fontFace: FONT,
  });

  // 구성 에이전트 7개
  const agents = [
    { n: "Orchestrator", tier: "HIGH", color: C.navy },
    { n: "ID Verifier", tier: "MEDIUM", color: C.teal },
    { n: "Compliance", tier: "MEDIUM", color: C.teal },
    { n: "Fraud Scorer", tier: "HIGH", color: C.navy },
    { n: "Doc Generator", tier: "LOW", color: C.amber },
    { n: "Audit Logger", tier: "LOW", color: C.amber },
    { n: "Dealer Copilot", tier: "MEDIUM", color: C.teal },
  ];
  s.addText("구성 에이전트 7종", {
    x: 0.5, y: 4.8, w: 15, h: 0.4,
    fontSize: fs12(15), bold: true, color: C.textMain, fontFace: FONT,
  });
  agents.forEach((a, i) => {
    const x = 0.5 + i * 2.2;
    s.addShape("roundRect", {
      x, y: 5.3, w: 2.1, h: 1.5, rectRadius: 0.1,
      fill: { color: C.white }, line: { color: a.color, width: 1.5 },
    });
    s.addText(a.n, {
      x: x + 0.05, y: 5.4, w: 2, h: 0.8,
      fontSize: fs12(13), bold: true, color: a.color, fontFace: FONT, align: "center", valign: "middle",
    });
    s.addText(a.tier, {
      x: x + 0.05, y: 6.2, w: 2, h: 0.4,
      fontSize: fs12(12), color: C.textSub, fontFace: FONT, align: "center",
    });
  });

  s.addText("선정 근거 5항목: 킹핀 직결 · B/F 최상 · No Brainers 사분면 · AI 실현 16/20 · 방향성 3축 정합", {
    x: 0.5, y: 7.3, w: 15, h: 0.5,
    fontSize: fs12(12), italic: true, color: C.textSub, fontFace: FONT,
  });

  addFooter(s, 8, TOTAL);
}

async function slide09(pptx) {  // MAS 아키텍처 ① 에이전트 표
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "MAS 아키텍처 ① — 7 전문 에이전트", "Supervisor + Parallel Specialists + Human-in-the-Loop");

  const rows = [
    [["#", C.white], ["에이전트", C.white], ["Tier", C.white], ["핵심 역할", C.white]].map(([t, c]) => ({
      text: t, options: { bold: true, color: c, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" }
    })),
    ...[
      ["1", "Orchestrator", "HIGH", "State 관리·병렬 호출·HITL 분기"],
      ["2", "ID Verifier (IDV+)", "MEDIUM", "OCR + VLM 위변조 + 얼굴 + 라이브니스"],
      ["3", "Compliance RegGuard", "MEDIUM", "규정 RAG + ReAct + 조항 인용"],
      ["4", "Fraud Scorer", "HIGH", "ML + LLM 앙상블 사기 스코어"],
      ["5", "Doc Generator", "LOW", "PDF 3종 자동 생성 + 전자서명"],
      ["6", "Audit Logger", "LOW", "Append-only 감사 로그"],
      ["7", "Dealer Copilot", "MEDIUM", "영업사원 질의응답 (선택)"],
    ].map(r => r.map((t, idx) => ({
      text: t,
      options: {
        fontSize: fs12(13), color: C.textMain, fontFace: FONT,
        align: idx === 0 || idx === 2 ? "center" : "left",
        bold: idx === 1,
      }
    })))
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.6, w: 15, h: 6,
    colW: [0.8, 4.2, 2, 8],
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: FONT,
  });

  s.addText("에이전트 간 직접 호출 금지 — 조정은 Orchestrator 전담 (DMAP 표준)", {
    x: 0.5, y: 7.8, w: 15, h: 0.5,
    fontSize: fs12(12), italic: true, color: C.textSub, fontFace: FONT,
  });

  addFooter(s, 9, TOTAL);
}

async function slide10(pptx) {  // MAS 아키텍처 ② LangGraph
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "MAS 아키텍처 ② — LangGraph 병렬 오케스트레이션", "2초 병렬 · HITL · Local Queue 업무 연속성");

  const img = safeImage("images/slide-10-architecture.png");
  if (img) s.addImage({ path: img, x: 0.5, y: 1.6, w: 9, h: 5 });

  // 단계별 설명
  const steps = [
    ["INTAKE", "이벤트 수신·PII 마스킹"],
    ["IDV ∥ RG ∥ FS", "2초 병렬 평가"],
    ["JOIN / VERDICT", "Green/Yellow/Red"],
    ["ESCALATE", "HITL (Y/R 시)"],
    ["DOC_GEN / SIGN", "서류·전자서명"],
    ["BSS_SUBMIT / LOG", "제출·감사"],
  ];
  steps.forEach((st, i) => {
    const y = 1.6 + i * 1.1;
    s.addShape("roundRect", {
      x: 10, y, w: 5.5, h: 0.95, rectRadius: 0.1,
      fill: { color: C.card }, line: { color: C.teal, width: 1 },
    });
    s.addText(`${i+1}. ${st[0]}`, {
      x: 10.15, y: y + 0.05, w: 5.2, h: 0.4,
      fontSize: fs12(14), bold: true, color: C.navy, fontFace: FONT,
    });
    s.addText(st[1], {
      x: 10.15, y: y + 0.45, w: 5.2, h: 0.45,
      fontSize: fs12(12), color: C.textMain, fontFace: FONT,
    });
  });

  addFooter(s, 10, TOTAL);
}

async function slide11(pptx) {  // MAS ③ Tool/MCP·RAG·멀티모달
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "MAS 아키텍처 ③ — Tool/MCP · RAG · 멀티모달", "외부 시스템 · 지식 · 입출력");

  const rows = [
    [{ text: "영역", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } },
     { text: "구성", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } }],
    [{ text: "MCP 8종", options: { bold: true, fontSize: fs12(13), color: C.navy, fontFace: FONT } },
     { text: "telco-bss · telco-kyc · police-lostid · tax-biz · e-sign · regulation-rag · fraud-history · corp-docs", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
    [{ text: "RAG", options: { bold: true, fontSize: fs12(13), color: C.teal, fontFace: FONT } },
     { text: "규정·카탈로그·사기사례·FAQ · Hybrid(Dense+BM25) + Reranker + ReAct 인용", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
    [{ text: "멀티모달", options: { bold: true, fontSize: fs12(13), color: C.amber, fontFace: FONT } },
     { text: "Gemini 2.5 Pro Vision (OCR·위변조) + ArcFace (로컬 얼굴) + Active Liveness", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
    [{ text: "장애 폴백", options: { bold: true, fontSize: fs12(13), color: C.red, fontFace: FONT } },
     { text: "BSS 장애 → Local Queue · KYC 장애 → Yellow 강제 · 경찰청 장애 → Yellow 승격", options: { fontSize: fs12(13), color: C.textMain, fontFace: FONT } }],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.6, w: 15, h: 5,
    colW: [2.5, 12.5],
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: FONT,
  });

  s.addShape("roundRect", {
    x: 0.5, y: 7, w: 15, h: 1.2, rectRadius: 0.1,
    fill: { color: C.card },
  });
  s.addText("MCP 표준으로 외부 시스템을 연결 → 확장성·벤더 중립성 확보", {
    x: 0.7, y: 7.1, w: 14.6, h: 0.4,
    fontSize: fs12(14), bold: true, color: C.navy, fontFace: FONT,
  });
  s.addText("신규 데이터 소스·모델 추가 시 에이전트 코드 변경 없이 MCP 서버만 연결", {
    x: 0.7, y: 7.55, w: 14.6, h: 0.6,
    fontSize: fs12(12), color: C.textSub, fontFace: FONT,
  });

  addFooter(s, 11, TOTAL);
}

async function slide12(pptx) {  // 신뢰성·보안
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "신뢰성 · 보안", "CIO 거버넌스 관심사 응답");

  const rows = [
    [{ text: "항목", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } },
     { text: "설계", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: fs12(14), fontFace: FONT, align: "center" } }],
    ...[
      ["SLA", "병렬 에이전트 Hard 2.5s · End-to-End 30min · BSS 제출 5s+Queue"],
      ["Circuit Breaker", "MCP별 1분 실패율 > 50% → OPEN → 30s 후 HALF-OPEN 테스트"],
      ["HITL", "Yellow = 점장 승인 · Red = 본사 리스크팀만 승인 가능"],
      ["PII 보호", "로컬 암호화 저장 + 클라우드 전송 전 마스킹 · 국내 리전 3복제"],
      ["감사 로그", "Append-only · SHA-256 해시 체인 · 7년 보관"],
      ["규제 준수", "개인정보보호법 · 정보통신망법 · 전자서명법 · KYC/AML"],
    ].map(r => r.map((t, idx) => ({
      text: t,
      options: {
        fontSize: fs12(13), color: C.textMain, fontFace: FONT,
        bold: idx === 0, align: idx === 0 ? "center" : "left",
      }
    })))
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.6, w: 15, h: 6,
    colW: [3, 12],
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: FONT,
  });

  addFooter(s, 12, TOTAL);
}

async function slide13(pptx) {  // 로드맵
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "실행 로드맵 — 18개월 6단계", "M4에 KPI 게이트 배치, CIO 재검토 시점");

  const img = safeImage("images/slide-13-roadmap.png");
  if (img) s.addImage({ path: img, x: 0.5, y: 1.6, w: 15, h: 3 });

  const phases = [
    ["M0", "인프라 구축", "1~2m", "MCP 4종 + Orch + 감사 DB"],
    ["M1", "IDV+ · RegGuard", "2~3m", "VLM + RAG 파일럿"],
    ["M2", "Fraud Scorer", "2m", "ML + HITL 에스컬레이션"],
    ["M3", "AutoDoc", "1~2m", "PDF + 전자서명"],
    ["M4", "8점 파일럿", "3m", "KPI 게이트 · CIO 재검토"],
    ["M5+M6", "확산", "9m", "200점 → 전사 1,000+점"],
  ];

  phases.forEach((p, i) => {
    const x = 0.5 + (i % 3) * 5.1;
    const y = 4.9 + Math.floor(i / 3) * 1.7;
    s.addShape("roundRect", {
      x, y, w: 4.9, h: 1.55, rectRadius: 0.1,
      fill: { color: C.card }, line: { color: C.teal, width: 1 },
    });
    s.addText(p[0], {
      x: x + 0.1, y: y + 0.05, w: 1.2, h: 0.7,
      fontSize: fs12(18), bold: true, color: C.navy, fontFace: FONT,
    });
    s.addText(p[2], {
      x: x + 0.1, y: y + 0.75, w: 1.2, h: 0.4,
      fontSize: fs12(12), color: C.teal, fontFace: FONT,
    });
    s.addText(p[1], {
      x: x + 1.4, y: y + 0.1, w: 3.3, h: 0.4,
      fontSize: fs12(14), bold: true, color: C.textMain, fontFace: FONT,
    });
    s.addText(p[3], {
      x: x + 1.4, y: y + 0.55, w: 3.3, h: 0.9,
      fontSize: fs12(12), color: C.textSub, fontFace: FONT,
    });
  });

  addFooter(s, 13, TOTAL);
}

async function slide14(pptx) {  // 기대 효과
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "기대 효과 — KPI 3종 + ROI", "보수 시나리오 기준 (공격적 확산 시 12개월 회수)");

  const kpis = [
    { title: "반려율", from: "20%", to: "5%", delta: "-75%", sub: "BSS 재처리 연 150~300억↓", color: C.red },
    { title: "사기율", from: "0.8%", to: "0.1%", delta: "-87%", sub: "손실·법적 리스크 연 50~120억↓", color: C.amber },
    { title: "처리시간", from: "30min", to: "12min", delta: "-60%", sub: "매출 +5~8%", color: C.teal },
  ];
  kpis.forEach((k, i) => {
    const x = 0.5 + i * 5.1;
    s.addShape("roundRect", {
      x, y: 1.6, w: 4.9, h: 4, rectRadius: 0.15,
      fill: { color: C.white }, line: { color: k.color, width: 2 },
    });
    s.addText(k.title, {
      x: x + 0.2, y: 1.75, w: 4.5, h: 0.5,
      fontSize: fs12(16), bold: true, color: k.color, fontFace: FONT, align: "center",
    });
    s.addText(`${k.from}  →  ${k.to}`, {
      x: x + 0.2, y: 2.4, w: 4.5, h: 0.8,
      fontSize: fs12(22), bold: true, color: C.textMain, fontFace: FONT, align: "center",
    });
    s.addText(k.delta, {
      x: x + 0.2, y: 3.3, w: 4.5, h: 0.6,
      fontSize: fs12(32), bold: true, color: k.color, fontFace: FONT, align: "center",
    });
    s.addText(k.sub, {
      x: x + 0.2, y: 4.2, w: 4.5, h: 1.3,
      fontSize: fs12(13), color: C.textMain, fontFace: FONT, align: "center",
    });
  });

  // ROI 카드
  s.addShape("roundRect", {
    x: 0.5, y: 6, w: 15, h: 2, rectRadius: 0.15,
    fill: { color: C.navy },
  });
  s.addText("ROI 회수 기간 15~22개월", {
    x: 0.7, y: 6.1, w: 14.6, h: 0.6,
    fontSize: fs12(22), bold: true, color: C.white, fontFace: FONT,
  });
  s.addText("도입 비용 30~60억  ·  연간 절감+증대 200~450억  ·  ROI 3.5~7.5배", {
    x: 0.7, y: 6.8, w: 14.6, h: 1,
    fontSize: fs12(15), color: C.white, fontFace: FONT,
  });

  addFooter(s, 14, TOTAL);
}

async function slide15(pptx) {  // 리스크·대응
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "리스크 · 대응", "주요 리스크 5종 + 완화 방안");

  const rows = [
    [{ text: "리스크", options: { bold: true, color: C.white, fill: { color: C.red }, fontSize: fs12(14), fontFace: FONT, align: "center" } },
     { text: "완화 방안", options: { bold: true, color: C.white, fill: { color: C.red }, fontSize: fs12(14), fontFace: FONT, align: "center" } }],
    ...[
      ["규정 잦은 개정", "RAG 자동 재인덱싱 24h + 영향 리포트"],
      ["모델 드리프트 (FP 증가)", "주간 FP 리뷰 + 월간 재학습 + 피드백 루프"],
      ["조직 저항", "8점 파일럿 선행 + 영업사원 NPS 목표 +30"],
      ["외부 의존 (LLM API)", "이중화 + 로컬 경량 모델 백업 + Circuit Breaker"],
      ["PII 유출", "마스킹 미들웨어 + 주 1회 무작위 감사"],
    ].map(r => r.map((t, idx) => ({
      text: t,
      options: {
        fontSize: fs12(13), color: C.textMain, fontFace: FONT,
        bold: idx === 0, align: idx === 0 ? "left" : "left",
      }
    })))
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.6, w: 15, h: 6,
    colW: [5, 10],
    border: { type: "solid", pt: 0.5, color: C.border },
    fontFace: FONT,
  });

  addFooter(s, 15, TOTAL);
}

async function slide16(pptx) {  // 의사결정 요청
  const s = pptx.addSlide();
  s.background = { color: C.white };
  addTitle(s, "의사결정 요청 · 다음 단계", "CIO 승인 획득 · 파일럿 착수");

  s.addShape("roundRect", {
    x: 0.5, y: 1.6, w: 15, h: 3, rectRadius: 0.15,
    fill: { color: C.teal },
  });
  s.addText("요청 사항", {
    x: 0.7, y: 1.7, w: 14.6, h: 0.5,
    fontSize: fs12(18), bold: true, color: C.white, fontFace: FONT,
  });
  s.addText("① M0 인프라 예산 승인 (약 15억 원 내외)\n② BSS API팀 · 데이터사이언스 Co-located 지원 (2+2명)\n③ 파일럿 대상 8 대리점 선정 승인 (번화가 5 + 외곽 3)", {
    x: 0.9, y: 2.3, w: 14.4, h: 2.2,
    fontSize: fs12(16), color: C.white, fontFace: FONT, paraSpaceAfter: 8,
  });

  s.addShape("roundRect", {
    x: 0.5, y: 5, w: 15, h: 3, rectRadius: 0.15,
    fill: { color: C.card }, line: { color: C.navy, width: 1 },
  });
  s.addText("검토·승인 포인트", {
    x: 0.7, y: 5.1, w: 14.6, h: 0.5,
    fontSize: fs12(16), bold: true, color: C.navy, fontFace: FONT,
  });
  s.addText("• M4 파일럿 완료 시 KPI 게이트에서 CIO 재검토 (3개월 후)\n• 월간 리스크 리포트 + 분기 외부 감사 보고서 CIO 직접 배포\n• 확산 여부는 파일럿 KPI 달성 여부로 정보 기반 결정", {
    x: 0.9, y: 5.7, w: 14.4, h: 2.2,
    fontSize: fs12(14), color: C.textMain, fontFace: FONT, paraSpaceAfter: 6,
  });

  addFooter(s, 16, TOTAL);
}

async function slide17(pptx) {  // Q&A
  const s = pptx.addSlide();
  s.background = { color: C.navy };

  s.addText("Q & A", {
    x: 0.5, y: 2, w: 15, h: 2,
    fontSize: fs12(96), bold: true, color: C.white, fontFace: FONT, align: "center",
  });
  s.addText("감사합니다", {
    x: 0.5, y: 4.5, w: 15, h: 1,
    fontSize: fs12(32), color: C.white, fontFace: FONT, align: "center",
  });
  s.addText("상세 문서: output/dealer-docs-automator/step2/mas-architecture.md\n기획 산출물: output/dealer-docs-automator/plan/", {
    x: 0.5, y: 7, w: 15, h: 1.3,
    fontSize: fs12(13), italic: true, color: C.card, fontFace: FONT, align: "center",
  });
}

// ─────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────
async function main() {
  const pptx = new PPTXGenJS();

  // 규칙 #4. defineLayout CUSTOM 16:9
  pptx.defineLayout({ name: "CUSTOM", width: 16, height: 9 });
  pptx.layout = "CUSTOM";

  pptx.title = "dealer-docs-automator — RTA for Telecom Dealers";
  pptx.author = "mas-designer";

  await slide01(pptx);
  await slide02(pptx);
  await slide03(pptx);
  await slide04(pptx);
  await slide05(pptx);
  await slide06(pptx);
  await slide07(pptx);
  await slide08(pptx);
  await slide09(pptx);
  await slide10(pptx);
  await slide11(pptx);
  await slide12(pptx);
  await slide13(pptx);
  await slide14(pptx);
  await slide15(pptx);
  await slide16(pptx);
  await slide17(pptx);

  const out = path.join(__dirname, "3.dealer-docs-automator.pptx");
  await pptx.writeFile({ fileName: out });
  console.log(`[OK] generated: ${out}`);
  console.log(`[OK] size: ${fs.statSync(out).size} bytes`);
}

// 규칙 #11. main().catch 진입점
main().catch(e => {
  console.error(`[FATAL] ${e.stack || e.message}`);
  process.exit(1);
});
