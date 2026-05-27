const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "需求訪談 第二場 - MLI 高齡錄音系統";

const C = {
  primary: "4963FA",
  dark:    "2B3467",
  light:   "F1F3FE",
  accent:  "E8EDFF",
  white:   "FFFFFF",
  ink:     "1E2A4A",
  ink2:    "4A5568",
  ink3:    "94A3B8",
  line:    "E2E8F0",
  ok:      "22C55E",
  warn:    "F59E0B",
  danger:  "EF4444",
};

function addFooter(slide, pageNum) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.275,
    fill: { color: C.dark }, line: { color: C.dark },
  });
  slide.addText("MLI 高齡錄音系統｜需求訪談 第二場", {
    x: 0.35, y: 5.35, w: 7.5, h: 0.275,
    fontSize: 9, color: C.white, valign: "middle",
    fontFace: "Noto Sans TC", margin: 0,
  });
  slide.addText(`${pageNum} / 12`, {
    x: 8.6, y: 5.35, w: 1.1, h: 0.275,
    fontSize: 9, color: C.white, valign: "middle",
    align: "right", fontFace: "Montserrat", margin: 0,
  });
}

function topBar(slide, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.07,
    fill: { color: color || C.primary }, line: { color: color || C.primary },
  });
}

function modBadge(slide, code, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.28, w: 0.62, h: 0.58,
    fill: { color: color || C.primary }, line: { color: color || C.primary },
  });
  slide.addText(code, {
    x: 0.5, y: 0.28, w: 0.62, h: 0.58,
    fontSize: 12, bold: true, color: C.white,
    fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
  });
}

// ─── SLIDE 1: Cover ───────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.28, h: 5.625,
    fill: { color: C.primary }, line: { color: C.primary },
  });

  s.addText("MLI 高齡錄音系統輔助宣讀專案", {
    x: 0.55, y: 0.5, w: 9, h: 0.35,
    fontSize: 11, color: "A5B4FC", fontFace: "Noto Sans TC", charSpacing: 2,
  });

  s.addText("需求訪談｜第二場", {
    x: 0.55, y: 0.98, w: 9, h: 1.05,
    fontSize: 46, bold: true, color: C.white, fontFace: "Noto Sans TC",
  });

  s.addText("P-1 錄音作業介面　／　P-3 案件查詢介面　／　B-1 案件管理作業", {
    x: 0.55, y: 2.18, w: 9, h: 0.5,
    fontSize: 15, color: "A5B4FC", fontFace: "Noto Sans TC",
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 2.85, w: 5.5, h: 0.04,
    fill: { color: C.primary }, line: { color: C.primary },
  });

  s.addText([
    { text: "2026.05.26", options: { bold: true, fontSize: 15, color: C.white } },
    { text: "   ｜   ",   options: { fontSize: 13, color: "5B6FAD" } },
    { text: "資訊單位 ＋ USER 單位（業務員 / 內勤人員）", options: { fontSize: 13, color: "A5B4FC" } },
  ], { x: 0.55, y: 3.12, w: 9, h: 0.45, fontFace: "Noto Sans TC" });
}

// ─── SLIDE 2: Goals ───────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);

  s.addText("本場目標", {
    x: 0.55, y: 0.22, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const goals = [
    "確認業務員錄音完整流程與邊界條件",
    "確認案件查詢與操作權限範圍",
    "確認內勤審核流程（含照會機制）",
    "釐清審核狀態定義與流轉規則",
  ];

  goals.forEach((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75;
    const y = 1.05 + row * 1.35;
    const w = 4.45;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 1.15,
      fill: { color: i % 2 === 0 ? C.light : "F0F4FF" },
      line: { color: C.line, width: 0.5 },
    });

    s.addShape(pres.shapes.OVAL, {
      x: x + 0.18, y: y + 0.35, w: 0.44, h: 0.44,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(`${i + 1}`, {
      x: x + 0.18, y: y + 0.35, w: 0.44, h: 0.44,
      fontSize: 13, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });

    s.addText(g, {
      x: x + 0.75, y: y + 0.28, w: w - 0.9, h: 0.58,
      fontSize: 14, color: C.ink, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.9, w: 9.0, h: 0.5,
    fill: { color: "FFF8E7" }, line: { color: "FDE68A", width: 0.5 },
  });
  s.addText("系統操作細節將搭配 Prototype 現場確認，本場以流程確認與待釐清問題為主", {
    x: 0.7, y: 3.9, w: 8.6, h: 0.5,
    fontSize: 12, color: "92400E", fontFace: "Noto Sans TC", valign: "middle", margin: 0,
  });

  addFooter(s, 2);
}

// ─── SLIDE 3: Roles ───────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);

  s.addText("使用者角色總覽", {
    x: 0.55, y: 0.22, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const cards = [
    {
      x: 0.5, title: "業務員", titleBg: C.primary,
      sections: [
        { label: "系統入口", lines: ["iPad — 行銷系統 App", "Web — 桌機瀏覽器"] },
        { label: "主要任務", lines: ["建立錄音案件（取號）", "逐題引導錄音 / 自動播稿", "查詢案件狀態", "補錄 / 重傳音檔"] },
      ],
    },
    {
      x: 5.15, title: "內勤人員", titleBg: C.dark,
      sections: [
        { label: "系統入口", lines: ["後台網頁（公司內網）"] },
        { label: "主要任務", lines: ["審核音檔（退回補正 / 通過）", "案件查詢與追蹤", "手動上傳補件", "案件清單匯出"] },
      ],
    },
  ];

  cards.forEach(card => {
    const w = 4.35;
    s.addShape(pres.shapes.RECTANGLE, {
      x: card.x, y: 1.05, w, h: 3.85,
      fill: { color: C.light }, line: { color: C.line, width: 0.5 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: card.x, y: 1.05, w, h: 0.55,
      fill: { color: card.titleBg }, line: { color: card.titleBg },
    });
    s.addText(card.title, {
      x: card.x + 0.15, y: 1.05, w: w - 0.3, h: 0.55,
      fontSize: 16, bold: true, color: C.white,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });

    let offsetY = 1.72;
    card.sections.forEach(sec => {
      s.addText(sec.label, {
        x: card.x + 0.18, y: offsetY, w: w - 0.3, h: 0.28,
        fontSize: 11, bold: true, color: card.titleBg,
        fontFace: "Noto Sans TC", valign: "middle", margin: 0,
      });
      offsetY += 0.3;
      sec.lines.forEach(ln => {
        s.addText("· " + ln, {
          x: card.x + 0.28, y: offsetY, w: w - 0.42, h: 0.3,
          fontSize: 12, color: C.ink2, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
        });
        offsetY += 0.3;
      });
      offsetY += 0.12;
    });
  });

  addFooter(s, 3);
}

// ─── SLIDE 4: P-1 Flow ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);
  modBadge(s, "P-1");

  s.addText("錄音核心流程", {
    x: 1.28, y: 0.28, w: 8.2, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const steps = [
    { n: "1", title: "取號\n建立案件",   desc: "帶入商品文稿\n業務員確認資訊" },
    { n: "2", title: "逐題引導",          desc: "業務員自錄\n或自動播稿 (TTS)" },
    { n: "3", title: "即時上傳",          desc: "每題完成即上傳\n斷線保護" },
    { n: "4", title: "送出檢核",          desc: "確認全部題卡\n已錄或已跳過" },
    { n: "5", title: "合併送審",          desc: "後端合併音檔\n進入審核佇列" },
  ];

  const bW = 1.58, bH = 2.7, gap = 0.2;
  const totalW = steps.length * bW + (steps.length - 1) * gap;
  const sx = (10 - totalW) / 2;

  steps.forEach((st, i) => {
    const x = sx + i * (bW + gap);
    const y = 1.02;
    const isFirst = i === 0;
    const isLast  = i === steps.length - 1;
    const boxBg   = isFirst ? C.primary : isLast ? C.dark : C.light;
    const textCol = (isFirst || isLast) ? C.white : C.ink;
    const descCol = (isFirst || isLast) ? "A5B4FC" : C.ink2;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: bW, h: bH,
      fill: { color: boxBg },
      line: { color: isFirst ? C.primary : isLast ? C.dark : "C7D2FE", width: 0.5 },
    });

    s.addShape(pres.shapes.OVAL, {
      x: x + bW / 2 - 0.23, y: y + 0.22, w: 0.46, h: 0.46,
      fill: { color: (isFirst || isLast) ? C.white : C.primary },
      line: { color: (isFirst || isLast) ? C.white : C.primary },
    });
    s.addText(st.n, {
      x: x + bW / 2 - 0.23, y: y + 0.22, w: 0.46, h: 0.46,
      fontSize: 14, bold: true, color: (isFirst || isLast) ? C.primary : C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });

    s.addText(st.title, {
      x: x + 0.08, y: y + 0.84, w: bW - 0.16, h: 0.65,
      fontSize: 13, bold: true, color: textCol,
      fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.desc, {
      x: x + 0.08, y: y + 1.56, w: bW - 0.16, h: 0.85,
      fontSize: 11, color: descCol,
      fontFace: "Noto Sans TC", align: "center", valign: "top", margin: 0,
    });

    if (i < steps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: x + bW, y: y + bH / 2, w: gap, h: 0,
        line: { color: C.primary, width: 1.5 },
      });
    }
  });

  // Legend
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.94, w: 9.0, h: 0.62,
    fill: { color: C.light }, line: { color: "C7D2FE", width: 0.5 },
  });
  s.addText("題卡狀態：", {
    x: 0.72, y: 3.94, w: 1.1, h: 0.62,
    fontSize: 12, bold: true, color: C.primary, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
  });

  const stateItems = [
    { label: "未錄音", color: C.ink3 },
    { label: "錄音中", color: C.primary },
    { label: "已錄音", color: C.ok },
    { label: "已跳過", color: "94A3B8" },
  ];
  stateItems.forEach((st, i) => {
    const ox = 1.8 + i * 1.9;
    s.addShape(pres.shapes.OVAL, {
      x: ox, y: 4.17, w: 0.22, h: 0.22,
      fill: { color: st.color }, line: { color: st.color },
    });
    s.addText(st.label, {
      x: ox + 0.3, y: 4.14, w: 1.4, h: 0.28,
      fontSize: 12, color: C.ink2, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  addFooter(s, 4);
}

// ─── SLIDE 5: P-1 Questions ───────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);
  modBadge(s, "P-1");

  s.addText("需確認事項", {
    x: 1.28, y: 0.28, w: 6.5, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.0, y: 0.33, w: 1.52, h: 0.44,
    fill: { color: "FEF3C7" }, line: { color: "FCD34D", width: 0.5 },
  });
  s.addText("USER 確認", {
    x: 8.0, y: 0.33, w: 1.52, h: 0.44,
    fontSize: 10, bold: true, color: "92400E",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });

  const qs = [
    {
      q:  "建立案件時畫面顯示哪些欄位？商品資訊如何帶入？",
      sub: "建議書系統自動帶入 vs 業務員手動輸入，兩種通路是否有差異？",
    },
    {
      q:  "送審後的案件狀態有哪些種類？",
      sub: "目前設計：草稿 ／ 審核中 ／ 退回補正 ／ 審核通過 ／ 逾期 — 請確認是否完整",
    },
    {
      q:  "即時儲存失敗（網路中斷）時，使用者看到什麼提示？是否自動重試？",
      sub: "題卡狀態應如何標示，讓業務員明確知道哪題尚未成功儲存？",
    },
    {
      q:  "題卡「播放」(F-105) 播的是單題音檔，還是完整合併音檔？",
      sub: "此問題同時影響 P-3 的 F-303 播放設計",
    },
  ];

  qs.forEach((item, i) => {
    const y = 1.04 + i * 1.05;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.42, h: 0.88,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(`Q${i + 1}`, {
      x: 0.5, y, w: 0.42, h: 0.88,
      fontSize: 11, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.92, y, w: 8.63, h: 0.88,
      fill: { color: i % 2 === 0 ? C.light : "F8FAFF" },
      line: { color: C.line, width: 0.5 },
    });
    s.addText(item.q, {
      x: 1.08, y: y + 0.06, w: 8.3, h: 0.38,
      fontSize: 14, bold: true, color: C.ink,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(item.sub, {
      x: 1.08, y: y + 0.46, w: 8.3, h: 0.36,
      fontSize: 11, color: C.ink2,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  addFooter(s, 5);
}

// ─── SLIDE 6: P-3 Overview ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);
  modBadge(s, "P-3");

  s.addText("業務員案件查詢", {
    x: 1.28, y: 0.28, w: 8.2, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const features = [
    { code: "F-301", name: "案件清單",   desc: "錄音編號、商品、錄音對象、審核狀態、進度" },
    { code: "F-302", name: "案件內容",   desc: "檢視案件詳細資訊" },
    { code: "F-303", name: "播放音檔",   desc: "聽取已錄製的音檔" },
    { code: "F-304", name: "案件搜尋",   desc: "錄音編號、保單號、商品、要保人等關鍵字篩選" },
    { code: "F-305", name: "修改案件資訊", desc: "限特定欄位（範圍待確認）" },
    { code: "F-306", name: "刪除音檔",   desc: "退回 / 未審核音檔刪除" },
    { code: "F-307", name: "上傳音檔",   desc: "重新上傳或 Web 通路手動上傳" },
  ];

  features.forEach((f, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i < 4 ? i : i - 4;
    const x = 0.5 + col * 4.75;
    const y = 1.05 + row * 0.93;
    const w = 4.5;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.8,
      fill: { color: i % 2 === 0 ? C.light : "F8FAFF" },
      line: { color: C.line, width: 0.5 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.08, y: y + 0.23, w: 0.72, h: 0.33,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(f.code, {
      x: x + 0.08, y: y + 0.23, w: 0.72, h: 0.33,
      fontSize: 9.5, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addText(f.name, {
      x: x + 0.9, y: y + 0.04, w: w - 1.05, h: 0.36,
      fontSize: 13, bold: true, color: C.ink,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(f.desc, {
      x: x + 0.9, y: y + 0.42, w: w - 1.05, h: 0.32,
      fontSize: 11, color: C.ink2,
      fontFace: "Noto Sans TC", valign: "top", margin: 0,
    });
  });

  addFooter(s, 6);
}

// ─── SLIDE 7: P-3 Questions ───────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);
  modBadge(s, "P-3");

  s.addText("需確認事項", {
    x: 1.28, y: 0.28, w: 6.5, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.0, y: 0.33, w: 1.52, h: 0.44,
    fill: { color: "FEF3C7" }, line: { color: "FCD34D", width: 0.5 },
  });
  s.addText("USER 確認", {
    x: 8.0, y: 0.33, w: 1.52, h: 0.44,
    fontSize: 10, bold: true, color: "92400E",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });

  const qs = [
    {
      q:   "F-305 業務員可修改哪些欄位？修改後是否需重新送審？",
      sub: "修改範圍需明確定義，避免審核後業務員任意更動關鍵資訊",
    },
    {
      q:   "F-306 / F-307 刪除與重傳的觸發條件為何？",
      sub: "僅退回補正可操作？還是審核中也允許自行刪除並重傳？",
    },
    {
      q:   "F-303 播放是完整合併音檔，還是可選分題播放？",
      sub: "與 P-1 F-105（單題播放）設計需一致，確認業務員的聆聽需求",
    },
    {
      q:   "案件清單需要分頁嗎？業務員平均管理多少件案件？",
      sub: "件數規模影響前端效能設計，請提供預估件數或歷史數量",
    },
  ];

  qs.forEach((item, i) => {
    const y = 1.04 + i * 1.05;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.42, h: 0.88,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(`Q${i + 1}`, {
      x: 0.5, y, w: 0.42, h: 0.88,
      fontSize: 11, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.92, y, w: 8.63, h: 0.88,
      fill: { color: i % 2 === 0 ? C.light : "F8FAFF" },
      line: { color: C.line, width: 0.5 },
    });
    s.addText(item.q, {
      x: 1.08, y: y + 0.06, w: 8.3, h: 0.38,
      fontSize: 14, bold: true, color: C.ink,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(item.sub, {
      x: 1.08, y: y + 0.46, w: 8.3, h: 0.36,
      fontSize: 11, color: C.ink2,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  addFooter(s, 7);
}

// ─── SLIDE 8: B-1 Overview ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s, C.dark);
  modBadge(s, "B-1", C.dark);

  s.addText("內勤案件管理", {
    x: 1.28, y: 0.28, w: 8.2, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const features = [
    { code: "F-101", name: "案件追蹤",     desc: "依地區角色過濾，顯示案件基本資訊",          tag: null },
    { code: "F-102", name: "案件搜尋",     desc: "保單號、錄音編號、日期區間等多條件搜尋",    tag: null },
    { code: "F-103", name: "檢視與編輯",   desc: "逐字稿、AI 比對、原始文稿（可編輯特定欄位）", tag: null },
    { code: "F-104", name: "審核案件",     desc: "播放音檔 → 退回補正（含原因）或 審核通過",  tag: "照會流程待確認" },
    { code: "F-105", name: "建立案件",     desc: "與前台 F-101 相同功能",                    tag: null },
    { code: "F-106", name: "手動上傳音檔", desc: "補件 / 特殊案件，上傳後觸發 STT",          tag: null },
    { code: "F-107", name: "重新合併音檔", desc: "需特定權限才可執行",                        tag: null },
    { code: "F-108", name: "案件清單匯出", desc: "依時間區間匯出案件清單（行政統計用）",      tag: "Nice-to-have" },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75;
    const y = 1.05 + row * 0.93;
    const w = 4.5;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.8,
      fill: { color: i % 2 === 0 ? "F0F4FF" : "F8FAFF" },
      line: { color: C.line, width: 0.5 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.08, y: y + 0.23, w: 0.72, h: 0.33,
      fill: { color: C.dark }, line: { color: C.dark },
    });
    s.addText(f.code, {
      x: x + 0.08, y: y + 0.23, w: 0.72, h: 0.33,
      fontSize: 9.5, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addText(f.name, {
      x: x + 0.9, y: y + 0.04, w: w - 1.05 - (f.tag ? 1.3 : 0), h: 0.36,
      fontSize: 13, bold: true, color: C.ink,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(f.desc, {
      x: x + 0.9, y: y + 0.42, w: w - 1.05, h: 0.32,
      fontSize: 10, color: C.ink2,
      fontFace: "Noto Sans TC", valign: "top", margin: 0,
    });

    if (f.tag) {
      const isNice = f.tag === "Nice-to-have";
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + w - 1.38, y: y + 0.07, w: 1.28, h: 0.28,
        fill: { color: isNice ? "E0F2FE" : "FEF3C7" },
        line: { color: isNice ? "BAE6FD" : "FCD34D", width: 0.5 },
      });
      s.addText(f.tag, {
        x: x + w - 1.38, y: y + 0.07, w: 1.28, h: 0.28,
        fontSize: 9, color: isNice ? "0369A1" : "92400E",
        fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
      });
    }
  });

  addFooter(s, 8);
}

// ─── SLIDE 9: Status Flow ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s, C.dark);
  modBadge(s, "B-1", C.dark);

  s.addText("案件狀態流轉（待確認）", {
    x: 1.28, y: 0.28, w: 8.2, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  // Main horizontal flow: 草稿 → 審核中 → 審核通過 → 核保(BPM)
  const mainY = 1.55;
  const bW = 1.4, bH = 0.58;

  const mainBoxes = [
    { label: "草稿",    bg: "F3F4F6", border: "8C8E9D", color: "4A5568", x: 0.5 },
    { label: "審核中",  bg: "FFF5DE", border: "B2680C", color: "92400E", x: 2.55 },
    { label: "審核通過",bg: "E7F7E5", border: "3A7C31", color: "3A7C31", x: 5.15 },
    { label: "核保(BPM)", bg: "EFF6FF", border: C.dark, color: C.dark,  x: 7.5, w: 1.8 },
  ];

  mainBoxes.forEach(b => {
    const w = b.w || bW;
    s.addShape(pres.shapes.RECTANGLE, {
      x: b.x, y: mainY, w, h: bH,
      fill: { color: b.bg }, line: { color: b.border, width: 1 },
    });
    s.addText(b.label, {
      x: b.x, y: mainY, w, h: bH,
      fontSize: 13, bold: true, color: b.color,
      fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
    });
  });

  // Arrows between main boxes
  const arrowDefs = [
    { x1: 0.5 + bW, y1: mainY + bH / 2, len: 2.55 - (0.5 + bW), label: "業務員送出", color: C.primary },
    { x1: 2.55 + bW, y1: mainY + bH / 2, len: 5.15 - (2.55 + bW), label: "審核通過", color: C.ok },
    { x1: 5.15 + bW, y1: mainY + bH / 2, len: 7.5 - (5.15 + bW), label: "送核保", color: C.ok },
  ];
  arrowDefs.forEach(a => {
    s.addShape(pres.shapes.LINE, {
      x: a.x1, y: a.y1, w: a.len, h: 0,
      line: { color: a.color, width: 1.5 },
    });
    s.addText(a.label, {
      x: a.x1, y: a.y1 - 0.24, w: a.len, h: 0.22,
      fontSize: 9, color: a.color,
      fontFace: "Noto Sans TC", align: "center", margin: 0,
    });
  });

  // 退回補正 box (below 審核通過)
  const retY = 2.75;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: retY, w: bW, h: bH,
    fill: { color: "FFECEC" }, line: { color: "C43737", width: 1 },
  });
  s.addText("退回補正", {
    x: 5.15, y: retY, w: bW, h: bH,
    fontSize: 13, bold: true, color: "C43737",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });

  // 審核通過 → 退回補正 (vertical arrow down)
  s.addShape(pres.shapes.LINE, {
    x: 5.15 + bW / 2, y: mainY + bH, w: 0, h: retY - (mainY + bH),
    line: { color: "C43737", width: 1.5 },
  });
  s.addText("退回", {
    x: 5.15 + bW / 2 + 0.05, y: mainY + bH + 0.05, w: 0.55, h: 0.22,
    fontSize: 9, color: "C43737", fontFace: "Noto Sans TC", margin: 0,
  });

  // 退回補正 → 審核中 (dashed line back)
  s.addShape(pres.shapes.LINE, {
    x: 2.55 + bW / 2, y: retY + bH / 2,
    w: 5.15 - (2.55 + bW / 2), h: 0,
    line: { color: "C43737", width: 1, dashType: "dash" },
  });
  s.addText("補錄後重新送出 →", {
    x: 2.8, y: retY + bH / 2 + 0.04, w: 2.1, h: 0.25,
    fontSize: 9, color: "C43737", fontFace: "Noto Sans TC", margin: 0,
  });

  // 逾期 box (above 審核中)
  const overY = 0.92;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.55, y: overY, w: bW, h: 0.46,
    fill: { color: "ECE8E4" }, line: { color: "56443A", width: 1 },
  });
  s.addText("逾期", {
    x: 2.55, y: overY, w: bW, h: 0.46,
    fontSize: 12, bold: true, color: "56443A",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });
  s.addShape(pres.shapes.LINE, {
    x: 2.55 + bW / 2, y: mainY, w: 0, h: -(mainY - (overY + 0.46)),
    line: { color: "94A3B8", width: 1.5 },
  });
  s.addText("超時", {
    x: 2.55 + bW / 2 + 0.05, y: overY + 0.48, w: 0.5, h: 0.22,
    fontSize: 9, color: "94A3B8", fontFace: "Noto Sans TC", margin: 0,
  });

  // 照會 question box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.68, w: 9.0, h: 0.62,
    fill: { color: "FFF8E7" }, line: { color: "FDE68A", width: 0.5 },
  });
  s.addText([
    { text: "待確認：", options: { bold: true, color: "92400E" } },
    { text: "照會狀態是獨立的 status 還是 flag？誰可發起？業務員如何收到通知？是否有期限設定？", options: { color: "92400E" } },
  ], {
    x: 0.7, y: 3.68, w: 8.6, h: 0.62,
    fontSize: 12, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
  });

  s.addText("目前設計 5 種狀態（草稿 ／ 審核中 ／ 退回補正 ／ 審核通過 ／ 逾期）｜照會機制待本場訪談確認", {
    x: 0.5, y: 4.42, w: 9.0, h: 0.3,
    fontSize: 10, color: C.ink3,
    fontFace: "Noto Sans TC", align: "center", margin: 0,
  });

  addFooter(s, 9);
}

// ─── SLIDE 10: B-1 Questions ──────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s, C.dark);
  modBadge(s, "B-1", C.dark);

  s.addText("需確認事項", {
    x: 1.28, y: 0.28, w: 5.3, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.7, y: 0.33, w: 1.52, h: 0.44,
    fill: { color: "FEF3C7" }, line: { color: "FCD34D", width: 0.5 },
  });
  s.addText("USER 確認", {
    x: 6.7, y: 0.33, w: 1.52, h: 0.44,
    fontSize: 10, bold: true, color: "92400E",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.35, y: 0.33, w: 1.15, h: 0.44,
    fill: { color: "EFF6FF" }, line: { color: "BAE6FD", width: 0.5 },
  });
  s.addText("IT 確認", {
    x: 8.35, y: 0.33, w: 1.15, h: 0.44,
    fontSize: 10, bold: true, color: "0369A1",
    fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
  });

  const qs = [
    { q: "照會（F-104）完整流程為何？",                            sub: "誰可發起？業務員如何收到通知？是否有照會期限設定？" },
    { q: "地區過濾邏輯：跨地區主管是否有跨區查看權限？",            sub: "跨地區稽核或主管角色的可見範圍需明確定義" },
    { q: "F-103 內勤可編輯哪些欄位？編輯後是否留存 Log？",         sub: "B-5 操作 Log 已規劃自動記錄，需確認哪些欄位允許手動修改" },
    { q: "F-106 手動上傳適用場景？是否需主管審批？",               sub: "補件 vs 特殊案件的操作流程是否一致？" },
    { q: "F-108 案件清單匯出：欄位範圍？格式 xlsx or csv？",       sub: "供行政統計使用，需確認目標受眾與使用工具" },
  ];

  qs.forEach((item, i) => {
    const y = 1.04 + i * 0.84;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.42, h: 0.7,
      fill: { color: C.dark }, line: { color: C.dark },
    });
    s.addText(`Q${i + 1}`, {
      x: 0.5, y, w: 0.42, h: 0.7,
      fontSize: 11, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.92, y, w: 8.63, h: 0.7,
      fill: { color: i % 2 === 0 ? "F0F4FF" : "F8FAFF" },
      line: { color: C.line, width: 0.5 },
    });
    s.addText(item.q, {
      x: 1.08, y: y + 0.04, w: 8.3, h: 0.32,
      fontSize: 13, bold: true, color: C.ink,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(item.sub, {
      x: 1.08, y: y + 0.38, w: 8.3, h: 0.28,
      fontSize: 10, color: C.ink2,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  addFooter(s, 10);
}

// ─── SLIDE 11: Open Items Table ───────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  topBar(s);

  s.addText("Open Items 彙總", {
    x: 0.5, y: 0.2, w: 9, h: 0.58,
    fontSize: 26, bold: true, color: C.dark, fontFace: "Noto Sans TC", margin: 0,
  });

  const items = [
    { q: "建立案件欄位與資訊帶入方式",            mod: "P-1",     who: "USER" },
    { q: "審核狀態完整定義",                      mod: "P-1",     who: "USER+IT" },
    { q: "即時儲存失敗提示與重試機制",            mod: "P-1",     who: "IT" },
    { q: "F-105 播放單題 vs 合併音檔",            mod: "P-1/P-3", who: "USER" },
    { q: "F-305 可修改欄位與重審規則",            mod: "P-3",     who: "USER" },
    { q: "F-306/307 刪除與重傳觸發條件",          mod: "P-3",     who: "USER" },
    { q: "照會流程（發起 / 通知 / 期限）",        mod: "B-1",     who: "USER" },
    { q: "地區過濾與跨區查看權限",                mod: "B-1",     who: "USER+IT" },
    { q: "F-103 可編輯欄位與 Log 記錄",           mod: "B-1",     who: "USER" },
    { q: "F-108 匯出欄位與格式",                  mod: "B-1",     who: "USER" },
  ];

  const modC = {
    "P-1":     { bg: C.accent, color: C.primary, border: "C7D2FE" },
    "P-3":     { bg: "EDE8FF", color: "6D28D9", border: "C4B5FD" },
    "P-1/P-3": { bg: C.accent, color: C.primary, border: "C7D2FE" },
    "B-1":     { bg: "E0E7FF", color: C.dark,    border: "A5B4FC" },
  };
  const whoC = {
    "USER":    { bg: "FEF3C7", color: "92400E", border: "FCD34D" },
    "IT":      { bg: "EFF6FF", color: "0369A1", border: "BAE6FD" },
    "USER+IT": { bg: "F0FDF4", color: "166534", border: "BBF7D0" },
  };

  const colX = [0.5, 0.95, 6.9, 8.28];
  const colW = [0.45, 5.95, 1.38, 1.27];
  const hdrH = 0.34;
  const hdrY = 0.88;

  [" #", "問題摘要", "模組", "負責確認方"].forEach((txt, ci) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: colX[ci], y: hdrY, w: colW[ci], h: hdrH,
      fill: { color: C.dark }, line: { color: C.dark },
    });
    s.addText(txt, {
      x: colX[ci] + 0.05, y: hdrY, w: colW[ci] - 0.1, h: hdrH,
      fontSize: 10, bold: true, color: C.white,
      fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
  });

  items.forEach((item, i) => {
    const y = hdrY + hdrH + i * 0.39;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9.05, h: 0.37,
      fill: { color: i % 2 === 0 ? "F8FAFC" : C.white },
      line: { color: C.line, width: 0.3 },
    });
    s.addText(`${i + 1}`, {
      x: colX[0], y, w: colW[0], h: 0.37,
      fontSize: 10, bold: true, color: C.ink3,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addText(item.q, {
      x: colX[1] + 0.06, y, w: colW[1] - 0.1, h: 0.37,
      fontSize: 11, color: C.ink, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });

    const mc = modC[item.mod];
    s.addShape(pres.shapes.RECTANGLE, {
      x: colX[2] + 0.06, y: y + 0.07, w: colW[2] - 0.12, h: 0.23,
      fill: { color: mc.bg }, line: { color: mc.border, width: 0.3 },
    });
    s.addText(item.mod, {
      x: colX[2] + 0.06, y: y + 0.07, w: colW[2] - 0.12, h: 0.23,
      fontSize: 8.5, bold: true, color: mc.color,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });

    const wc = whoC[item.who];
    s.addShape(pres.shapes.RECTANGLE, {
      x: colX[3] + 0.06, y: y + 0.07, w: colW[3] - 0.12, h: 0.23,
      fill: { color: wc.bg }, line: { color: wc.border, width: 0.3 },
    });
    s.addText(item.who, {
      x: colX[3] + 0.06, y: y + 0.07, w: colW[3] - 0.12, h: 0.23,
      fontSize: 8.5, bold: true, color: wc.color,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
  });

  addFooter(s, 11);
}

// ─── SLIDE 12: Next Steps ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.28, h: 5.625,
    fill: { color: C.primary }, line: { color: C.primary },
  });

  s.addText("後續行動", {
    x: 0.55, y: 0.28, w: 9, h: 0.6,
    fontSize: 30, bold: true, color: C.white, fontFace: "Noto Sans TC", margin: 0,
  });

  // Left panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 1.05, w: 4.3, h: 3.6,
    fill: { color: "1C2457" }, line: { color: "3D4E8A", width: 0.5 },
  });
  s.addText("Action Items", {
    x: 0.72, y: 1.15, w: 4.0, h: 0.38,
    fontSize: 13, bold: true, color: "A5B4FC", fontFace: "Noto Sans TC", margin: 0,
  });

  const actions = [
    { txt: "USER：確認審核狀態完整定義",           when: "本週內" },
    { txt: "USER：確認照會流程規格",               when: "本週內" },
    { txt: "USER：確認可修改欄位與刪除條件",       when: "本週內" },
    { txt: "整合雙方意見更新 Funcmap v2",          when: "下週一前" },
  ];

  actions.forEach((a, i) => {
    const ay = 1.68 + i * 0.82;
    s.addShape(pres.shapes.OVAL, {
      x: 0.72, y: ay + 0.1, w: 0.32, h: 0.32,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText("→", {
      x: 0.72, y: ay + 0.1, w: 0.32, h: 0.32,
      fontSize: 9, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addText(a.txt, {
      x: 1.14, y: ay, w: 3.0, h: 0.34,
      fontSize: 12, color: C.white, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.14, y: ay + 0.36, w: 0.9, h: 0.24,
      fill: { color: "2D3A6B" }, line: { color: C.primary, width: 0.5 },
    });
    s.addText(a.when, {
      x: 1.14, y: ay + 0.36, w: 0.9, h: 0.24,
      fontSize: 9, color: "A5B4FC",
      fontFace: "Noto Sans TC", align: "center", valign: "middle", margin: 0,
    });
  });

  // Right panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 1.05, w: 4.35, h: 3.6,
    fill: { color: "1C2457" }, line: { color: "3D4E8A", width: 0.5 },
  });
  s.addText("第三場訪談預告", {
    x: 5.32, y: 1.15, w: 4.0, h: 0.38,
    fontSize: 13, bold: true, color: "A5B4FC", fontFace: "Noto Sans TC", margin: 0,
  });

  const nextTopics = [
    { code: "P-2", name: "語音轉譯引擎",       desc: "TTS 預生成 / 多語言 / 語速調整" },
    { code: "B-2", name: "語音分析引擎",        desc: "STT 轉文字 / 語者辨識 / 比對報告" },
    { code: "B-1", name: "案件管理（儀表板）",  desc: "管理者統計視圖 / KPI 指標" },
  ];

  nextTopics.forEach((t, i) => {
    const ty = 1.72 + i * 1.0;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.32, y: ty, w: 0.58, h: 0.58,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(t.code, {
      x: 5.32, y: ty, w: 0.58, h: 0.58,
      fontSize: 10, bold: true, color: C.white,
      fontFace: "Montserrat", align: "center", valign: "middle", margin: 0,
    });
    s.addText(t.name, {
      x: 6.02, y: ty + 0.02, w: 3.38, h: 0.3,
      fontSize: 13, bold: true, color: C.white, fontFace: "Noto Sans TC", valign: "middle", margin: 0,
    });
    s.addText(t.desc, {
      x: 6.02, y: ty + 0.32, w: 3.38, h: 0.24,
      fontSize: 10, color: "6B7DB3", fontFace: "Noto Sans TC", valign: "top", margin: 0,
    });
  });

  addFooter(s, 12);
}

// Write file
pres.writeFile({ fileName: "C:\\Users\\user\\Desktop\\三商美邦\\第二場訪談_20260526.pptx" })
  .then(() => console.log("Done"))
  .catch(err => { console.error(err); process.exit(1); });
