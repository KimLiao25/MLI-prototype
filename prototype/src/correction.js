// correction.js — 退回補正「多輪」資料層（業務員前台 + 內勤後台 共用）
//
// 設計原則（依客戶議題確認）：
//   • 一筆案件 = 同一個錄音編號；退回補正後仍是同案。
//   • 補正音檔一律與「原始完整音檔」獨立，不合併、不覆蓋。
//   • 多輪退回：每一輪都是 append-only，新一輪不動到前面已上傳/已生成的內容。
//   • 前台補正只走「整段 / 上傳」（不分題），故每一輪 = 1 個完整補正音檔。
//
// 流轉：審核中 → 退回補正(returned) → 〔業務補正錄音→送出〕→ 補件審核(resubmit)
//        → 審核通過 / 再退回(returned, 進入下一輪)
//
// 結構：window.__MLI_CORRECTION[caseNo] = { rounds: [ round, ... ] }  （round 由舊到新）
//   round = {
//     round:        Number,                第幾輪退回（1-based）
//     returnedAt:   String,                退回時間
//     reviewer:     String,                退回的審核員
//     reasonType:   key of __MLI_REASON_TYPES,
//     reasonText:   String,                退回說明（通知業務員的文字）
//     qNos:         [Number],              需重錄的題目
//     subjectNames: [String],              需重錄的對象
//     status:       'awaiting' | 'submitted',
//                   // awaiting  = 已退回、等待業務員補正中（補正音檔/逐字稿/AI 尚未產生）
//                   // submitted = 業務已補正送出、後端已跑完 STT + AI，待內勤複審
//     audio:        null | { name, durationSec, sizeMB, uploadedAt, method },
//     transcript:   [ { speaker, startSec, asr, confidence } ],   // STT 重跑結果
//     ai:           null | { passRate, summary, items:[ { title, pass, note } ] },  // LLM 補正質檢
//   }

(function(){
  // 退回原因類別（前後台共用文字）
  window.__MLI_REASON_TYPES = {
    audio_quality:   "音檔不清晰",
    incomplete:      "錄音缺漏",
    negation:        "客戶回應未明確",
    script_mismatch: "與原稿差異過大",
    other:           "其他",
  };

  const C = {};
  window.__MLI_CORRECTION = C;

  // ── Demo 1：A0004-1（returned）— 已退回、等待業務員補正中（尚無補正音檔）──
  C["A0004-1"] = {
    rounds: [
      {
        round: 1,
        returnedAt: "2026/05/21 09:18",
        reviewer: "王怡萱",
        reasonType: "audio_quality",
        reasonText: "Q07 健康告知音檔不清晰、背景雜訊干擾；Q10 自動墊繳客戶回應「應該可以吧」屬未明確回應，請就上述題目重新錄製並取得客戶明確答覆。",
        qNos: [7, 10],
        subjectNames: ["李美玲"],
        status: "awaiting",
        audio: null,
        transcript: [],
        ai: null,
      },
    ],
  };

  // ── Demo 2：A0006-1（resubmit）— 業務已補正送出、待內勤複審（補正資料齊全）──
  C["A0006-1"] = {
    rounds: [
      {
        round: 1,
        returnedAt: "2026/05/18 16:30",
        reviewer: "王怡萱",
        reasonType: "audio_quality",
        reasonText: "Q07 健康告知音檔不清晰、客戶回應「應該…沒有吧」屬模糊回應，請重新錄製並取得明確答覆。",
        qNos: [7],
        subjectNames: ["吳秀英"],
        status: "submitted",
        audio: { name: "A0006-1_correction_r1.wav", durationSec: 86, sizeMB: 1.4, uploadedAt: "2026/05/19 10:48", method: "whole" },
        transcript: [
          { speaker: "agent",   startSec: 0,  asr: "吳女士您好，這邊針對健康告知事項，我們重新錄製一次，請您聽完每一項後明確回答「有」或「沒有」。", confidence: 0.97 },
          { speaker: "agent",   startSec: 14, asr: "第一項，最近兩個月內，是否曾因接受醫師治療、診療或用藥？", confidence: 0.96 },
          { speaker: "insured", startSec: 24, asr: "沒有，這兩個月都沒有看醫生。", confidence: 0.95 },
          { speaker: "agent",   startSec: 32, asr: "第二項，過去五年內是否曾因受傷或生病接受手術、住院七日以上，或健康檢查發現異常？", confidence: 0.95 },
          { speaker: "insured", startSec: 47, asr: "沒有，都沒有。", confidence: 0.96 },
          { speaker: "agent",   startSec: 54, asr: "第三項，目前是否懷孕中？", confidence: 0.94 },
          { speaker: "insured", startSec: 60, asr: "沒有。", confidence: 0.97 },
          { speaker: "agent",   startSec: 64, asr: "好的，謝謝您的明確回答，本段補正錄音到此結束。", confidence: 0.96 },
        ],
        ai: {
          passRate: 100,
          summary: "補正音檔針對 Q07 既往症告知事項重新錄製，音質清晰、無雜訊；客戶就三項告知事項皆明確回應「沒有」，未再出現否定或模糊語意，原退回問題已修正，建議審核通過。",
          items: [
            { title: "Q07 既往症告知事項", pass: true, note: "客戶逐項明確回答「沒有」，無「應該」「不太確定」等模糊語意；STT 辨識信心平均 0.96，音檔清晰。" },
          ],
        },
      },
    ],
  };

  // ── 工具函式 ──────────────────────────────────────────────────────────

  // 取得案件的所有補正輪（由舊到新）
  window.mliCorrectionRounds = function(caseNo) {
    const e = C[caseNo];
    return e && e.rounds ? e.rounds : [];
  };

  // 取得「最新一輪」退回（前台 banner / 後台 reason 用）
  window.mliLatestRound = function(caseNo) {
    const r = window.mliCorrectionRounds(caseNo);
    return r.length ? r[r.length - 1] : null;
  };

  // 退回原因的可讀類別文字
  window.mliReasonLabel = function(reasonType) {
    return window.__MLI_REASON_TYPES[reasonType] || "其他";
  };

  // 後台「確認退回」時，把一輪結構化退回 append 進案件（多輪 append-only）
  // 回傳新輪物件
  window.mliPushReturn = function(caseNo, { reasonType, reasonText, qNos, subjectNames, reviewer, returnedAt }) {
    if (!C[caseNo]) C[caseNo] = { rounds: [] };
    const rounds = C[caseNo].rounds;
    const round = {
      round: rounds.length + 1,
      returnedAt: returnedAt || "",
      reviewer: reviewer || "",
      reasonType, reasonText,
      qNos: qNos || [],
      subjectNames: subjectNames || [],
      status: "awaiting",
      audio: null, transcript: [], ai: null,
    };
    rounds.push(round);
    return round;
  };
})();
