// ScriptViews — 共用視圖元件（STEP 2 / STEP 3 / 方式二頁面共用）
//
//  PdfPreview        自行上傳通路：PDF 文稿「圖檔」預覽（佔位框，不分題）
//  ScriptDocument    API 同步通路：把分題題稿串成可捲動的連續文件（方式二照念用）
//  SubjectProgressBar 多錄音對象進度列（未錄音 / 本次 / 已完成）
//  FileCountSummary  音檔數彙整（依「錄音場次」計：分題=每場 14 小音檔，整段/上傳=每場 1 完整音檔）
//  helpers           maskIdNo / customersToSubjects / subjectStatus

// 身分證遮罩（與 CaseInfoSummary 一致：首碼 + *** + 末三碼）
function maskIdNo(idNo) {
  if (!idNo) return "";
  const s = String(idNo);
  return s.length >= 4 ? s.slice(0, 1) + "***" + s.slice(-3) : s;
}

// STEP 1 客戶清單 → 標準化錄音對象
function customersToSubjects(customers) {
  return (customers || []).map((c, i) => ({
    key: (c.idNo && c.idNo.trim()) ? c.idNo.trim().toUpperCase() : (c.name || ("cust" + i)),
    name: c.name || ("客戶 " + (i + 1)),
    idNo: c.idNo || "",
    roleKeys: c.roles || [],
    age: c.age,
  }));
}

// 對象狀態
function subjectStatus(key, sessionKeys, subjectDone) {
  if (subjectDone && subjectDone[key]) return "done";
  if (sessionKeys && sessionKeys.includes(key)) return "current";
  return "pending";
}

/* ─────────────────────────────────────────────────────
 * PDF 文稿圖檔預覽 — 自行上傳通路（不分題，直接呈現 PDF 圖檔）
 * ───────────────────────────────────────────────────── */
function PdfPreview({ fileName = "錄音題目文稿.pdf", pages = 3, maxHeight = 680, compact = false }) {
  const stripe = "repeating-linear-gradient(135deg, var(--primary-soft-2) 0 14px, #fff 14px 28px)";
  return (
    <div style={{ maxHeight, overflowY: "auto", padding: compact ? "16px" : "22px 24px",
      background: "var(--primary-bg)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 14 : 20, alignItems: "center" }}>
        {Array.from({ length: pages }, (_, i) => (
          <div key={i} style={{
            width: "100%", maxWidth: compact ? 320 : 560, aspectRatio: "1 / 1.414",
            background: "#fff", borderRadius: 6, border: "1px solid var(--line)",
            boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden",
          }}>
            {/* 條紋佔位 + 說明 */}
            <div style={{ position: "absolute", inset: 0, background: stripe, opacity: .6 }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8 }}>
              <I.Doc size={compact ? 26 : 34} stroke="var(--primary-2)" sw={1.4} />
              <div style={{ font: `500 ${compact ? 11 : 12}px/1 "Montserrat", monospace`,
                color: "var(--ink-3)", letterSpacing: ".06em" }}>
                PDF 第 {i + 1} 頁 · 文稿圖檔
              </div>
            </div>
          </div>
        ))}
        <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0 4px" }}>
          <I.Info size={12} stroke="var(--ink-4)" /> 上傳之 PDF 將以原圖檔逐頁呈現，業務員照此文稿錄音（不分題）
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * 連續題稿文件 — API 同步通路（方式二整段錄音照念用）
 * ───────────────────────────────────────────────────── */
function ScriptDocument({ questions, maxHeight = 680 }) {
  return (
    <div style={{ maxHeight, overflowY: "auto", padding: "8px 0" }}>
      {questions.map((q) => (
        <div key={q.no} style={{ padding: "16px 26px", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className="tabular ff-mont" style={{ font: "700 13px/1 Montserrat", color: "var(--primary)" }}>
              Q{String(q.no).padStart(2, "0")}
            </span>
            <span style={{ font: "600 14px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>{q.title}</span>
            <span className="tag" style={q.type === "self" ? { background: "rgb(238,246,255)", color: "rgb(53,150,253)" } : undefined}>
              {q.tag}
            </span>
          </div>
          <p style={{ margin: 0, font: "400 14.5px/1.85 'Noto Sans TC'", color: "var(--ink-2)", textWrap: "pretty" }}>
            {q.script}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * 錄音對象進度列 — STEP 3 / 方式二頂部
 * ───────────────────────────────────────────────────── */
function SubjectProgressBar({ subjects, sessionKeys, subjectDone, note }) {
  const doneCount = subjects.filter(s => subjectDone && subjectDone[s.key]).length;
  return (
    <div className="card" style={{ padding: "14px 20px", marginBottom: 18,
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <I.User size={16} stroke="var(--primary)" />
        <span style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)", letterSpacing: ".04em" }}>
          錄音對象
        </span>
        <span className="tabular ff-mont" style={{ font: "600 13px/1 Montserrat", color: "var(--primary)" }}>
          {doneCount}<span style={{ color: "var(--ink-4)" }}> / {subjects.length}</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
        {subjects.map((s) => {
          const st = subjectStatus(s.key, sessionKeys, subjectDone);
          const palette = {
            done:    { bg: "var(--ok-soft)", border: "rgba(72,153,61,.3)", color: "var(--ok)" },
            current: { bg: "var(--primary-soft)", border: "rgba(73,99,250,.35)", color: "var(--primary)" },
            pending: { bg: "#fff", border: "var(--line)", color: "var(--ink-4)" },
          }[st];
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 9,
              padding: "8px 13px", borderRadius: 10, background: palette.bg,
              border: `1px solid ${palette.border}` }}>
              {st === "done"
                ? <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--ok)",
                    display: "grid", placeItems: "center" }}><I.Check size={11} stroke="#fff" sw={3} /></span>
                : st === "current"
                ? <span className="pulse" style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--primary)",
                    display: "grid", placeItems: "center" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /></span>
                : <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--line-3)", background: "#fff" }} />}
              <span style={{ font: "500 13.5px/1 'Noto Sans TC'", color: st === "pending" ? "var(--ink-3)" : "var(--ink)" }}>
                {s.name}
              </span>
              <span style={{ display: "flex", gap: 3 }}>
                {s.roleKeys.map(r => (
                  <span key={r} className="tag" style={{ padding: "1px 6px", fontSize: 10,
                    background: "rgba(255,255,255,.7)", color: palette.color, border: `1px solid ${palette.border}` }}>
                    {CASE_ROLE_MAP[r] ? CASE_ROLE_MAP[r].abbr : r}
                  </span>
                ))}
              </span>
              <span style={{ font: "500 11px/1 'Noto Sans TC'", color: palette.color, marginLeft: 2 }}>
                {st === "done" ? "已完成" : st === "current" ? "本次錄音" : "未錄音"}
              </span>
            </div>
          );
        })}
      </div>
      {note && <span className="meta" style={{ flexBasis: "100%" }}>{note}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * 音檔數彙整 — 依「錄音場次」計
 * ───────────────────────────────────────────────────── */
function FileCountSummary({ completedSessions, subjects, currentLabel }) {
  const nameOf = (k) => (subjects.find(s => s.key === k)?.name) || k;
  const segSessions = completedSessions.filter(s => s.method === "segmented");
  const wholeSessions = completedSessions.filter(s => s.method === "whole");
  const smallFiles = segSessions.length * 14;
  const wholeFiles = wholeSessions.length;

  if (completedSessions.length === 0) {
    return (
      <div style={{ font: "400 12px/1.5 'Noto Sans TC'", color: "var(--ink-4)" }}>
        尚未完成任何錄音場次
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {smallFiles > 0 && (
          <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "var(--primary-bg)", border: "1px solid var(--line-2)" }}>
            <div className="tabular ff-mont" style={{ font: "700 20px/1 Montserrat", color: "var(--primary)" }}>{smallFiles}</div>
            <div style={{ font: "400 11px/1 'Noto Sans TC'", color: "var(--ink-3)", marginTop: 4 }}>小音檔 · 送出後合併</div>
          </div>
        )}
        {wholeFiles > 0 && (
          <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "var(--primary-bg)", border: "1px solid var(--line-2)" }}>
            <div className="tabular ff-mont" style={{ font: "700 20px/1 Montserrat", color: "var(--primary)" }}>{wholeFiles}</div>
            <div style={{ font: "400 11px/1 'Noto Sans TC'", color: "var(--ink-3)", marginTop: 4 }}>完整音檔 · 無須合併</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {completedSessions.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
            font: "400 12px/1.4 'Noto Sans TC'", color: "var(--ink-2)" }}>
            <I.Check size={13} stroke="var(--ok)" sw={2.4} />
            <span style={{ flex: 1 }}>{s.keys.map(nameOf).join("、")}</span>
            <span className="tabular ff-mont" style={{ font: "500 11.5px/1 Montserrat", color: "var(--ink-3)" }}>
              {s.method === "segmented" ? "14 小音檔" : "1 完整音檔"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
 * SubjectMatrix — 分題：對象 × 題目 矩陣（概覽 + 點開看題級細節）
 * ──────────────────────────────────────── */
function MatrixCell({ status }) {
  // ● recorded · – skipped · ○ pending
  const base = { width: 19, height: 19, borderRadius: 5, display: "grid", placeItems: "center", flexShrink: 0 };
  if (status === "recorded") return <span title="已錄" style={{ ...base, background: "var(--ok)" }}><I.Check size={11} stroke="#fff" sw={3} /></span>;
  if (status === "skipped") return <span title="跳過" style={{ ...base, background: "rgba(140,142,157,.22)", border: "1px solid var(--ink-4)" }}><span style={{ width: 8, height: 2, background: "var(--ink-4)", borderRadius: 1 }} /></span>;
  return <span title="未錄" style={{ ...base, background: "#fff", border: "1.5px solid var(--line-3)" }} />;
}

function SubjectMatrixRow({ subject, prog, questions }) {
  const [open, setOpen] = React.useState(false);
  const totalQ = questions.length;
  const qm = (prog.q && prog.q[subject.key]) || {};
  const cnt = progSubjectCount(prog, subject.key, totalQ);
  const done = progSubjectDone(prog, subject.key, totalQ);
  const started = cnt.done > 0;
  const statusLabel = done ? "已完成" : started ? "錄音中" : "未開始";
  const statusColor = done ? "var(--ok)" : started ? "var(--primary)" : "var(--ink-4)";

  return (
    <div style={{ borderBottom: "1px solid var(--line-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
        {/* 對象 */}
        <div style={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ font: "600 14.5px/1 'Noto Sans TC'", color: "var(--ink)" }}>{subject.name}</span>
            <span style={{ display: "flex", gap: 3 }}>
              {subject.roleKeys.map(r => (
                <span key={r} className="tag" style={{ padding: "1px 6px", fontSize: 10 }}>
                  {CASE_ROLE_MAP[r] ? CASE_ROLE_MAP[r].abbr : r}
                </span>
              ))}
            </span>
          </div>
          <span style={{ font: "500 11px/1 'Noto Sans TC'", color: statusColor }}>
            {statusLabel} · {cnt.done}/{totalQ}
          </span>
        </div>
        {/* 點陣 */}
        <div style={{ flex: 1, display: "flex", gap: 5, flexWrap: "wrap" }}>
          {questions.map(q => <MatrixCell key={q.no} status={qm[q.no] || "pending"} />)}
        </div>
        {/* 展開 */}
        <button className="btn btn-quiet btn-sm" onClick={() => setOpen(o => !o)} style={{ flexShrink: 0 }}>
          {open ? "收起" : "看題級"} <I.ChevronD size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: ".15s" }} />
        </button>
      </div>
      {open && (
        <div style={{ padding: "4px 18px 16px 184px", display: "flex", flexDirection: "column", gap: 2 }}>
          {questions.map(q => {
            const st = qm[q.no] || "pending";
            return (
              <div key={q.no} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <MatrixCell status={st} />
                <span className="tabular ff-mont" style={{ font: "600 11px/1 Montserrat", color: "var(--ink-3)", width: 30 }}>Q{String(q.no).padStart(2, "0")}</span>
                <span style={{ flex: 1, font: "400 12.5px/1.3 'Noto Sans TC'", color: st === "pending" ? "var(--ink-4)" : "var(--ink-2)",
                  textDecoration: st === "skipped" ? "line-through" : "none", textDecorationColor: "var(--ink-4)" }}>{q.title}</span>
                <span style={{ font: "500 11px/1 'Noto Sans TC'",
                  color: st === "recorded" ? "var(--ok)" : st === "skipped" ? "var(--ink-3)" : "var(--ink-4)" }}>
                  {st === "recorded" ? "已錄" : st === "skipped" ? "跳過" : "未錄"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubjectMatrix({ prog, questions }) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 10 }}>
        <I.Wave size={16} stroke="var(--primary)" />
        <span style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>各對象題目完成狀態</span>
        <span className="tag" style={{ marginLeft: 2 }}>分題錄音</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="meta" style={{ display: "flex", alignItems: "center", gap: 5 }}><MatrixCell status="recorded" /> 已錄</span>
          <span className="meta" style={{ display: "flex", alignItems: "center", gap: 5 }}><MatrixCell status="skipped" /> 跳過</span>
          <span className="meta" style={{ display: "flex", alignItems: "center", gap: 5 }}><MatrixCell status="pending" /> 未錄</span>
        </span>
      </div>
      {prog.subjects.map(s => <SubjectMatrixRow key={s.key} subject={s} prog={prog} questions={questions} />)}
    </section>
  );
}

/* ────────────────────────────────────────
 * SubjectChecklist — 整段/上傳：對象層級清單（無題目欄）
 * ──────────────────────────────────────── */
function SubjectChecklist({ prog }) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 10 }}>
        <I.Headset size={16} stroke="var(--primary)" />
        <span style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>各對象完整音檔狀態</span>
        <span className="tag" style={{ marginLeft: 2 }}>整段 / 上傳</span>
      </div>
      {prog.subjects.map(s => {
        const w = (prog.whole && prog.whole[s.key]) || "pending";
        const done = w !== "pending";
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--line-2)" }}>
            {done
              ? <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--ok)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Check size={13} stroke="#fff" sw={3} /></span>
              : <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--line-3)", background: "#fff", flexShrink: 0 }} />}
            <span style={{ font: "600 14.5px/1 'Noto Sans TC'", color: "var(--ink)" }}>{s.name}</span>
            <span style={{ display: "flex", gap: 4 }}>
              {s.roleKeys.map(r => <span key={r} className="tag" style={{ padding: "1px 6px", fontSize: 10 }}>{CASE_ROLE_MAP[r] ? CASE_ROLE_MAP[r].abbr : r}</span>)}
            </span>
            <span style={{ marginLeft: "auto", font: "500 12.5px/1 'Noto Sans TC'", color: done ? "var(--ok)" : "var(--ink-4)" }}>
              {w === "uploaded" ? "已上傳完整音檔" : w === "recorded" ? "已錄完整音檔" : "未錄音"}
            </span>
          </div>
        );
      })}
    </section>
  );
}

/* ────────────────────────────────────────
 * SubjectProgressList — 詳情頁統一「錄音進度」（每位對象一條，不顯示題目）
 * 依方式區分分題 / 整段上傳；X/Y 為完成單位（分題=14、整段/上傳=1）
 * ──────────────────────────────────────── */
function ProgressStatusIcon({ status, size = 22 }) {
  if (status === "done") return <span style={{ width: size, height: size, borderRadius: "50%", background: "var(--ok)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Check size={size * 0.6} stroke="#fff" sw={3} /></span>;
  if (status === "active") return <span className="pulse" style={{ width: size, height: size, borderRadius: "50%", background: "var(--primary)", display: "grid", placeItems: "center", flexShrink: 0 }}><span style={{ width: size * 0.3, height: size * 0.3, borderRadius: "50%", background: "#fff" }} /></span>;
  return <span style={{ width: size, height: size, borderRadius: "50%", border: "1.5px solid var(--line-3)", background: "#fff", flexShrink: 0 }} />;
}

function SubjectProgressList({ disp }) {
  const methodLabel = disp.method === "whole" ? "整段 / 上傳" : "分題錄音";
  const doneCount = disp.subjects.filter(s => s.complete).length;
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 10 }}>
        {disp.method === "whole" ? <I.Headset size={17} stroke="var(--primary)" /> : <I.Wave size={17} stroke="var(--primary)" />}
        <span style={{ font: "700 15px/1 'Noto Sans TC'", color: "var(--ink)", letterSpacing: ".04em" }}>錄音進度</span>
        <span className="meta">對象 {doneCount}/{disp.subjects.length} 完成</span>
        <span className="tag" style={{ marginLeft: "auto" }}>{methodLabel}</span>
      </div>
      {disp.subjects.map(s => {
        const color = s.status === "done" ? "var(--ok)" : s.status === "active" ? "var(--primary)" : "var(--ink-4)";
        const label = s.status === "done" ? "已完成" : s.status === "active" ? "錄音中" : "未開始";
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 20px", borderBottom: "1px solid var(--line-2)" }}>
            <ProgressStatusIcon status={s.status} />
            <div style={{ width: 168, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "600 14.5px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>{s.name}</span>
              <span style={{ display: "flex", gap: 3 }}>
                {s.roleAbbrs.map(r => <span key={r} className="tag" style={{ padding: "1px 6px", fontSize: 10 }}>{r}</span>)}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 60, height: 7, borderRadius: 4, background: "var(--line-2)", overflow: "hidden" }}>
              <div style={{ width: `${s.total ? s.done / s.total * 100 : 0}%`, height: "100%", background: color, transition: "width .3s" }} />
            </div>
            <span className="tabular ff-mont" style={{ font: "600 14px/1 Montserrat", color: "var(--ink-2)", minWidth: 46, textAlign: "right" }}>
              {s.done}/{s.total}
            </span>
            <span style={{ font: "500 12px/1 'Noto Sans TC'", color, minWidth: 52, textAlign: "right" }}>{label}</span>
          </div>
        );
      })}
    </section>
  );
}

// 清單「進度」欄的緊湊版：每位對象一條 X/Y
function SubjectProgressMini({ disp }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {disp.subjects.map(s => {
        const color = s.status === "done" ? "var(--ok)" : s.status === "active" ? "var(--primary)" : "var(--ink-4)";
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ font: "500 12.5px/1 'Noto Sans TC'", color: "var(--ink-2)", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span className="tabular ff-mont" style={{ marginLeft: "auto", font: "600 12.5px/1 Montserrat", color: s.complete ? "var(--ok)" : "var(--ink)" }}>
              {s.done}/{s.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 詳情頁側欄精簡版「錄音進度」：窄欄用，每位對象兩行（資訊列 + 進度條）
function SubjectProgressCompact({ disp }) {
  const methodLabel = disp.method === "whole" ? "整段 / 上傳" : "分題錄音";
  const doneCount = disp.subjects.filter(s => s.complete).length;
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 8 }}>
        {disp.method === "whole" ? <I.Headset size={15} stroke="var(--primary)" /> : <I.Wave size={15} stroke="var(--primary)" />}
        <span style={{ font: "700 13px/1 'Noto Sans TC'", color: "var(--ink)", letterSpacing: ".04em" }}>錄音進度</span>
        <span className="tag" style={{ marginLeft: "auto", padding: "1px 7px", fontSize: 10 }}>{methodLabel}</span>
      </div>
      <div style={{ padding: "6px 16px 4px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="meta">對象完成度</span>
        <span className="tabular ff-mont" style={{ font: "600 12.5px/1 Montserrat", color: "var(--primary)" }}>
          {doneCount}<span style={{ color: "var(--ink-4)" }}> / {disp.subjects.length}</span>
        </span>
      </div>
      {disp.subjects.map(s => {
        const color = s.status === "done" ? "var(--ok)" : s.status === "active" ? "var(--primary)" : "var(--ink-4)";
        const label = s.status === "done" ? "已完成" : s.status === "active" ? "錄音中" : "未開始";
        return (
          <div key={s.key} style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ProgressStatusIcon status={s.status} size={17} />
              <span style={{ font: "600 13.5px/1.2 'Noto Sans TC'", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ display: "flex", gap: 3 }}>
                {s.roleAbbrs.map(r => <span key={r} className="tag" style={{ padding: "1px 5px", fontSize: 9.5 }}>{r}</span>)}
              </span>
              <span className="tabular ff-mont" style={{ marginLeft: "auto", font: "600 13px/1 Montserrat", color: "var(--ink-2)" }}>
                {s.done}<span style={{ color: "var(--ink-4)" }}>/{s.total}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--line-2)", overflow: "hidden" }}>
                <div style={{ width: `${s.total ? s.done / s.total * 100 : 0}%`, height: "100%", background: color, transition: "width .3s" }} />
              </div>
              <span style={{ font: "500 11px/1 'Noto Sans TC'", color, minWidth: 42, textAlign: "right" }}>{label}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

Object.assign(window, { maskIdNo, customersToSubjects, subjectStatus,
  PdfPreview, ScriptDocument, SubjectProgressBar, FileCountSummary,
  SubjectMatrix, SubjectChecklist, SubjectProgressList, SubjectProgressMini,
  SubjectProgressCompact });
