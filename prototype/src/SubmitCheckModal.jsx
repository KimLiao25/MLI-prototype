// SubmitCheckModal — 送出前檢核視窗（取代原「完成送出頁」）
//
// 由分題錄音頁的「送出前檢核」按鈕彈出。三段內部狀態：
//   check   — 各錄音對象進度總覽 + 統計 +「完成送出」(全數完成才 enable)
//   merging — 後端合併分題小音檔為單一完整音檔
//   done    — 送出完成
//
// 「繼續錄音」＝關閉視窗即可回去補錄/重錄（無一場結束才下一場的限制）。

function SubmitCheckModal({ open, mode, setMode, caseInfo, subjects, prog, totalQ, method,
                            onClose, onSubmit, onDoneToList }) {
  const isWhole = method === "whole";

  // merging → done（模擬後端合併）
  React.useEffect(() => {
    if (mode === "merging") {
      const t = setTimeout(() => setMode("done"), 2200);
      return () => clearTimeout(t);
    }
  }, [mode, setMode]);

  if (!open) return null;

  const rows = (subjects || []).map(s => {
    if (isWhole) {
      const w = (prog && prog.whole) ? prog.whole[s.key] : "pending";
      const done = !!w && w !== "pending";
      return { ...s, rec: done ? 1 : 0, sk: 0, doneCount: done ? 1 : 0, total: 1,
        wholeKind: w === "uploaded" ? "上傳" : "整段",
        status: done ? "done" : "pending" };
    }
    const c = prog ? window.progSubjectCount(prog, s.key, totalQ) : { rec: 0, sk: 0, done: 0 };
    const complete = c.done >= totalQ;
    return { ...s, rec: c.rec, sk: c.sk, doneCount: c.done, total: totalQ,
      status: complete ? "done" : c.done > 0 ? "active" : "pending" };
  });
  const allDone = prog ? window.progAllDone(prog, totalQ) : false;
  const clips = window.progClipCount(prog, totalQ);
  const remainCount = rows.filter(r => r.status !== "done").length;

  const submit = () => { onSubmit && onSubmit(); setMode("merging"); };

  return ReactDOM.createPortal((
    <div style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(41,47,84,.4)",
      display: "grid", placeItems: "center", animation: "fadeup .2s ease-out", padding: 24 }}>
      <div className="card fadeup" style={{ padding: 0, width: 600, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {mode === "check" && (
          <CheckBody rows={rows} totalQ={totalQ} clips={clips} allDone={allDone} isWhole={isWhole}
            remainCount={remainCount} caseInfo={caseInfo} onClose={onClose} onSubmit={submit} />
        )}
        {mode === "merging" && <MergingBody clips={clips} caseInfo={caseInfo} isWhole={isWhole} />}
        {mode === "done" && (
          <DoneBody rows={rows} totalQ={totalQ} clips={clips} caseInfo={caseInfo} isWhole={isWhole} onDoneToList={onDoneToList} />
        )}
      </div>
    </div>
  ), document.body);
}

// ── check：案件層級重點摘要 + 送出（一案一進度，不再逐對象） ──
function CheckBody({ rows, totalQ, clips, allDone, remainCount, caseInfo, isWhole, onClose, onSubmit }) {
  // 案件層級進度（分題＝已錄+跳過 / 14；整段＝1 個完整音檔）
  const doneCount = isWhole
    ? rows.filter(r => r.status === "done").length          // 整段：每位 1 檔皆完成才算
    : Math.max(0, ...rows.map(r => r.doneCount));            // 分題：本場一起錄，取代表值
  const recMax = isWhole ? 0 : Math.max(0, ...rows.map(r => r.rec));
  const skMax  = isWhole ? 0 : Math.max(0, ...rows.map(r => r.sk));
  const total = isWhole ? 1 : totalQ;
  const done = isWhole ? (allDone ? 1 : 0) : doneCount;
  const pending = total - done;
  const pct = total ? Math.round(done / total * 100) : 0;
  const methodLabel = isWhole ? "整段錄音" : "分題錄音";

  const Line = ({ label, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
      borderBottom: "1px solid var(--line-2)" }}>
      <span style={{ width: 78, flexShrink: 0, font: "500 12.5px/1.4 'Noto Sans TC'", color: "var(--ink-4)", letterSpacing: ".04em" }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </div>
  );

  return (
    <>
      <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--primary-soft)",
            display: "grid", placeItems: "center" }}><I.Upload size={17} stroke="var(--primary)" /></span>
          <h3 style={{ margin: 0, font: "700 19px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>送出前檢核</h3>
        </div>
        <p style={{ margin: "10px 0 0", font: "400 13px/1.5 'Noto Sans TC'", color: "var(--ink-3)", textWrap: "pretty" }}>
          請確認以下重點無誤後送出。送出後由後端整理為一個完整音檔，送內勤審核。
        </p>
      </div>

      <div style={{ padding: "18px 28px 6px", overflowY: "auto" }}>

        {/* 重點摘要 */}
        <div style={{ padding: "2px 16px 8px", borderRadius: 12, background: "var(--primary-bg)", border: "1px solid var(--line-2)" }}>
          <Line label="案件編號">
            <span className="ff-mont tabular" style={{ font: "600 14px/1 Montserrat", color: "var(--primary)", letterSpacing: ".03em" }}>
              {caseInfo.caseNo}
            </span>
          </Line>
          <Line label="投保商品">
            <span style={{ font: "500 13.5px/1.5 'Noto Sans TC'", color: "var(--ink)" }}>{caseInfo.product}</span>
          </Line>
          <Line label="錄音方式">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7,
              padding: "4px 11px", borderRadius: 13, background: "var(--primary-soft)", color: "var(--primary)",
              font: "600 12.5px/1 'Noto Sans TC'" }}>
              {isWhole ? <I.Mic size={13} stroke="var(--primary)" /> : <I.Wave size={13} stroke="var(--primary)" />}
              {methodLabel}
            </span>
          </Line>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0 4px" }}>
            <span style={{ width: 78, flexShrink: 0, font: "500 12.5px/1.4 'Noto Sans TC'", color: "var(--ink-4)", letterSpacing: ".04em" }}>完成進度</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--line-2)", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: (isWhole ? pct : (totalQ ? recMax / totalQ * 100 : 0)) + "%", height: "100%", background: "var(--ok)" }} />
                  {!isWhole && <div style={{ width: (totalQ ? skMax / totalQ * 100 : 0) + "%", height: "100%", background: "rgba(140,142,157,.5)" }} />}
                </div>
                <span className="tabular ff-mont" style={{ font: "700 14px/1 Montserrat", color: allDone ? "var(--ok)" : "var(--ink)" }}>
                  {done}<span style={{ color: "var(--ink-4)" }}>/{total}</span>
                </span>
              </div>
              <div style={{ marginTop: 7, font: "400 12px/1 'Noto Sans TC'", color: "var(--ink-3)" }}>
                {isWhole
                  ? (allDone ? "已完成 1 個完整音檔" : "尚未完成整段錄音 / 上傳")
                  : <>已錄 <b style={{ color: "var(--ok)" }}>{recMax}</b> 題 · 跳過 {skMax} 題{pending > 0 ? <> · 未錄 <b style={{ color: "var(--warn)" }}>{pending}</b> 題</> : ""}</>}
              </div>
            </div>
          </div>
        </div>

        {/* 送出後行為說明 */}
        <div style={{ margin: "14px 0 12px", padding: "11px 14px", borderRadius: 9, background: "var(--primary-soft-2)",
          border: "1px solid rgba(73,99,250,.18)", display: "flex", alignItems: "flex-start", gap: 8,
          font: "400 12.5px/1.6 'Noto Sans TC'", color: "var(--ink-2)" }}>
          <I.Info size={14} stroke="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          {isWhole
            ? <>整段錄音已是 1 個完整音檔，<b>無須合併</b>，送出後直接送內勤審核。</>
            : <>分題小音檔將於送出後由後端<b>合併為 1 個完整音檔</b>送內勤審核。</>}
        </div>
      </div>

      {/* 動作列 */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 12 }}>
        <span className="meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {allDone
            ? <><I.Check size={14} stroke="var(--ok)" sw={2.6} /> 已完成，可送出</>
            : (isWhole ? "尚未完成整段錄音 / 上傳" : `尚有 ${pending} 題未完成`)}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button className="btn btn-quiet" onClick={onClose}>繼續錄音</button>
          <button className="btn btn-primary btn-lg" disabled={!allDone} aria-disabled={!allDone} onClick={onSubmit}>
            <I.Upload size={16} /> 完成送出
          </button>
        </span>
      </div>
    </>
  );
}

// ── merging ──
function MergingBody({ clips, caseInfo, isWhole }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--primary-soft)",
        display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
        <svg className="spin" width={38} height={38} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(73,99,250,.2)" strokeWidth="2.5" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 style={{ margin: "0 0 8px", font: "700 20px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>{isWhole ? "正在處理音檔…" : "正在合併音檔…"}</h3>
      <p style={{ margin: "0 0 24px", font: "400 13.5px/1.6 'Noto Sans TC'", color: "var(--ink-3)" }}>
        {isWhole
          ? "後端正在處理完整音檔並送出審核，請稍候"
          : `後端正將 ${clips} 個分題小音檔合併為單一完整音檔，請稍候`}
      </p>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ height: 8, borderRadius: 4, background: "var(--primary-soft)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--primary)", width: "68%", borderRadius: 4,
            animation: "wf 2.2s ease-in-out infinite", transformOrigin: "left" }} />
        </div>
      </div>
    </div>
  );
}

// ── done ──
function DoneBody({ rows, totalQ, clips, caseInfo, isWhole, onDoneToList }) {
  return (
    <div className="fadeup" style={{ padding: 44, textAlign: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--ok-soft)",
        display: "grid", placeItems: "center", margin: "0 auto 22px", boxShadow: "0 0 0 8px rgba(72,153,61,.08)" }}>
        <I.Check size={42} stroke="var(--ok)" sw={2.6} />
      </div>
      <h3 style={{ margin: "0 0 8px", font: "700 22px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>送出完成！</h3>
      <p style={{ margin: "0 0 26px", font: "400 14px/1.6 'Noto Sans TC'", color: "var(--ink-3)" }}>
        {isWhole
          ? "完整音檔已送內勤審核"
          : "分題音檔已合併為完整音檔，送內勤審核"}
      </p>
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "var(--primary-soft-2)",
        border: "1px dashed rgba(73,99,250,.3)", maxWidth: 440, margin: "0 auto",
        display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
        <I.Doc size={26} stroke="var(--primary)" />
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>完整音檔識別碼</div>
          <div className="ff-mont tabular" style={{ font: "600 13.5px/1 Montserrat", color: "var(--primary)", marginTop: 4 }}>
            {caseInfo.caseNo}_merged.wav
          </div>
        </div>
        <span className="tag tag-ok"><I.Check size={11} stroke="currentColor" /> 已送審核</span>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28 }}>
        <button className="btn btn-primary btn-lg" onClick={onDoneToList}>返回我的案件</button>
      </div>
    </div>
  );
}

function Stat({ n, label, color = "var(--ink)" }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--primary-bg)", border: "1px solid var(--line-2)", textAlign: "center" }}>
      <div className="tabular ff-mont" style={{ font: "700 24px/1 Montserrat", color }}>{n}</div>
      <div style={{ font: "400 11.5px/1 'Noto Sans TC'", color: "var(--ink-3)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

window.SubmitCheckModal = SubmitCheckModal;
