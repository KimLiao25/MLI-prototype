// recProgress.js — 案件錄音進度的狀態模型與純函式助手
//
// 進度物件（以 recordingNo 為 key 存於 app 狀態）：
//   {
//     method: "segmented" | "whole" | null,   // 首場決定後鎖定，不可中途變更
//     subjects: [ {key, name, idNo, roleKeys} ],   // 排序固定
//     q:     { [subjectKey]: { [qNo]: "pending"|"recorded"|"skipped" } },  // 分題
//     whole: { [subjectKey]: "pending"|"recorded"|"uploaded" },            // 整段/上傳
//     sessions: [ {keys:[...], method} ],   // 已完成場次（音檔數依此計）
//     status: "draft" | "reviewing",
//   }

function progInit(subjects) {
  const q = {}, whole = {};
  (subjects || []).forEach(s => { q[s.key] = {}; whole[s.key] = "pending"; });
  return { method: null, subjects: subjects || [], q, whole, sessions: [], status: "draft" };
}

// 單一對象是否完成
function progSubjectDone(prog, key, totalQ) {
  if (!prog) return false;
  if (prog.method === "whole") {
    const w = prog.whole[key];
    return !!w && w !== "pending";
  }
  // segmented：全部題目皆 recorded 或 skipped
  const qm = prog.q[key] || {};
  for (let n = 1; n <= totalQ; n++) {
    const st = qm[n];
    if (st !== "recorded" && st !== "skipped") return false;
  }
  return true;
}

// 單一對象的分題計數
function progSubjectCount(prog, key, totalQ) {
  const qm = (prog && prog.q[key]) || {};
  let rec = 0, sk = 0;
  for (let n = 1; n <= totalQ; n++) {
    if (qm[n] === "recorded") rec++;
    else if (qm[n] === "skipped") sk++;
  }
  return { rec, sk, done: rec + sk, pending: totalQ - rec - sk };
}

// 對象是否「已開始但未完成」（分題用）
function progSubjectStarted(prog, key, totalQ) {
  if (!prog) return false;
  if (prog.method === "whole") return false;
  return progSubjectCount(prog, key, totalQ).done > 0;
}

// 全案是否完成（可送出）
function progAllDone(prog, totalQ) {
  if (!prog || !prog.method || !prog.subjects.length) return false;
  return prog.subjects.every(s => progSubjectDone(prog, s.key, totalQ));
}

// 完成狀態 map：{ key: bool }
function progDoneMap(prog, totalQ) {
  const m = {};
  if (prog) prog.subjects.forEach(s => { m[s.key] = progSubjectDone(prog, s.key, totalQ); });
  return m;
}

// 已完成對象數 / 總數
function progSubjectSummary(prog, totalQ) {
  if (!prog) return { done: 0, total: 0 };
  const done = prog.subjects.filter(s => progSubjectDone(prog, s.key, totalQ)).length;
  return { done, total: prog.subjects.length };
}

// 寫入一場分題錄音的題目狀態到指定對象們（只存 recorded/skipped，其餘視為 pending）
function progWriteSegmented(prog, keys, recQuestions) {
  const q = { ...prog.q };
  keys.forEach(k => {
    const m = { ...(q[k] || {}) };
    recQuestions.forEach(r => {
      m[r.no] = (r.status === "recorded" || r.status === "skipped") ? r.status : "pending";
    });
    q[k] = m;
  });
  return { ...prog, q };
}

// 統一「錄音進度」顯示：不論動態（新流程）或靜態（示範案）都輸出一致結構
//   回傳 { method:'segmented'|'whole', subjects:[{key,name,roleAbbrs,done,total,complete,status}], dynamic }
function buildDisplayProgress(caseInfo, prog, totalQ) {
  const abbrOf = (k) => (window.CASE_ROLE_MAP && window.CASE_ROLE_MAP[k] ? window.CASE_ROLE_MAP[k].abbr : k);
  // 動態（走過新錄音流程的案）
  if (prog && prog.subjects && prog.subjects.length) {
    const method = prog.method || (caseInfo.channel && caseInfo.channel.startsWith("Web") ? "whole" : "segmented");
    const total = method === "whole" ? 1 : totalQ;
    const subjects = prog.subjects.map(s => {
      const done = method === "whole"
        ? ((prog.whole[s.key] && prog.whole[s.key] !== "pending") ? 1 : 0)
        : progSubjectCount(prog, s.key, totalQ).done;
      const complete = done >= total;
      return { key: s.key, name: s.name, roleAbbrs: (s.roleKeys || []).map(abbrOf),
        done, total, complete, status: complete ? "done" : done > 0 ? "active" : "pending" };
    });
    return { method, subjects, dynamic: true };
  }
  // 靜態（示範案，無逐對象資料）—依通路推測方式，依狀態推測完成度
  const uniq = window.__MLI_uniqueSubjects(caseInfo);
  const method = caseInfo.channel && caseInfo.channel.startsWith("Web") ? "whole" : "segmented";
  const total = method === "whole" ? 1 : totalQ;
  const st = caseInfo.status;
  const caseComplete = ["reviewing", "approved", "returned", "resubmit"].includes(st);
  const agg = (caseInfo.progress ? (caseInfo.progress.recorded || 0) + (caseInfo.progress.skipped || 0) : 0);
  const subjects = uniq.map((s, i) => {
    let done = 0;
    if (caseComplete) done = total;
    else if (st === "draft") done = method === "whole" ? (i === 0 && agg > 0 ? 1 : 0) : (i === 0 ? Math.min(agg, total) : 0);
    const complete = done >= total;
    return { key: s.idNo || s.name, name: s.name, roleAbbrs: s.roles || [],
      done, total, complete, status: complete ? "done" : done > 0 ? "active" : "pending" };
  });
  return { method, subjects, dynamic: false };
}

Object.assign(window, {
  progInit, progSubjectDone, progSubjectCount, progSubjectStarted,
  progAllDone, progDoneMap, progSubjectSummary, progWriteSegmented, buildDisplayProgress,
});
