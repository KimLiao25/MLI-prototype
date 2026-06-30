// PreRecordModal — 「進入錄音作業」閘門（v7 重構）
//
// 不再選擇錄音對象：「誰一起錄」已在建立案件時用「場次」決定，
// 本案件的所有對象即為本場一起錄音的對象。本彈窗只負責：
//   ① 顯示本場錄音對象（唯讀）
//   ② 依通路決定錄音方式
//        • 自動帶入（integration）：可選 分題錄音 / 整段錄音
//        • 手動輸入（manual）：只能整段錄音，且需先上傳題目文稿（PDF）
//   ③ 分題錄音時提供語音播放設定（TTS）

function PreRecordModal({ open, subjects, scriptMode,
                          canWholeRecord, tts, setTts, onCancel, onConfirm }) {
  const isManual = scriptMode === "manual";
  const [method, setMethod] = React.useState(isManual ? "whole" : "segmented");
  const [pdf, setPdf] = React.useState(null); // {name,size,uploadedAt}
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setMethod(isManual ? "whole" : "segmented");
      setPdf(null);
    }
  }, [open, isManual]);

  if (!open) return null;

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) setPdf({ name: f.name, size: f.size, uploadedAt: new Date().toLocaleString("zh-TW", {hour12:false}).slice(5) });
    e.target.value = "";
  };

  // 手動輸入：必須先上傳 PDF 才能進入錄音
  const valid = isManual ? !!pdf : true;

  return ReactDOM.createPortal((
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(41,47,84,.4)",
      display: "grid", placeItems: "center", animation: "fadeup .2s ease-out", padding: 24 }}>
      <div className="card fadeup" style={{ padding: 0, width: 560, maxHeight: "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* 標題 */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--primary-soft)",
              display: "grid", placeItems: "center" }}><I.Mic size={18} stroke="var(--primary)" /></span>
            <h3 style={{ margin: 0, font: "700 19px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>
              進入錄音作業
            </h3>
            <span className="tag" style={{ marginLeft: 4 }}>{isManual ? "手動輸入" : "建議書帶入"}</span>
          </div>
          <p style={{ margin: "10px 0 0", font: "400 13px/1.5 'Noto Sans TC'", color: "var(--ink-3)", textWrap: "pretty" }}>
            {isManual
              ? "本案件為手動輸入通路，僅能整段錄音；開始前請先上傳本場題目文稿（PDF）。"
              : "本案件為建議書帶入通路，請選擇本場錄音方式。本場對象將一起錄音。"}
          </p>
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* ① 錄音方式 */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>01</span>
              <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>選擇錄音方式</span>
            </div>

            {isManual ? (
              <MethodCard active onClick={() => {}}
                icon={<I.Mic size={20} stroke="var(--primary)" />}
                title="整段錄音"
                desc={canWholeRecord
                  ? "一次錄完整段，或直接上傳已錄好的完整音檔；無須分題與合併。手動輸入通路僅支援整段錄音。"
                  : "上傳已錄好的完整音檔（桌機不支援現場整段錄音）。" } />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MethodCard active={method === "segmented"} onClick={() => setMethod("segmented")}
                  icon={<I.Wave size={20} stroke={method === "segmented" ? "var(--primary)" : "var(--ink-3)"} />}
                  title="分題錄音"
                  desc="逐題錄音，系統自動播放題目語音、各題即時上傳；送出後由系統合併為完整音檔。" />
                <MethodCard active={method === "whole"} onClick={() => setMethod("whole")}
                  icon={<I.Mic size={20} stroke={method === "whole" ? "var(--primary)" : "var(--ink-3)"} />}
                  title="整段錄音"
                  desc="一次錄完整段，或直接上傳已錄好的完整音檔；無須分題與合併。" />
              </div>
            )}
          </section>

          {/* ③（手動）上傳題目文稿 PDF */}
          {isManual && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>02</span>
                <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>上傳題目文稿</span>
                <span style={{ color: "var(--danger)" }}>*</span>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onPick} />
              {!pdf ? (
                <div onClick={() => fileRef.current?.click()} style={{
                  padding: "24px 18px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                  border: "2px dashed rgba(73,99,250,.4)", background: "var(--primary-soft-2)", transition: "all .15s" }}>
                  <I.Upload size={30} stroke="var(--primary)" sw={1.6} />
                  <div style={{ font: "600 14px/1.3 'Noto Sans TC'", color: "var(--ink)", marginTop: 10 }}>
                    點擊上傳題目文稿（PDF）
                  </div>
                  <div className="meta" style={{ marginTop: 5 }}>未上傳題目文稿前無法開始錄音</div>
                </div>
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--ok-soft)",
                  border: "1px solid rgba(72,153,61,.28)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 7, background: "#fff",
                    display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid rgba(72,153,61,.3)" }}>
                    <I.Doc size={17} stroke="var(--ok)" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13px/1.3 'Noto Sans TC'", color: "rgb(58,124,49)", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdf.name}</div>
                    <div className="meta" style={{ color: "rgb(58,124,49)", marginTop: 2, opacity: .85 }}>
                      {(pdf.size / 1024).toFixed(1)} KB · 上傳時間 {pdf.uploadedAt}
                    </div>
                  </div>
                  <button className="btn btn-quiet btn-sm" onClick={() => fileRef.current?.click()}>
                    <I.Upload size={12} /> 重新上傳
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ④ 語音播放設定 — 僅分題錄音時出現 */}
          {!isManual && method === "segmented" && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>02</span>
                <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>語音播放設定</span>
                <span className="ff-mont" style={{ marginLeft: "auto", font: "600 10px/1 Montserrat", color: "var(--ink-4)", letterSpacing: ".06em" }}>
                  F-202 / F-203
                </span>
              </div>
              <p style={{ margin: "-4px 0 12px", font: "400 12px/1.6 'Noto Sans TC'", color: "var(--ink-3)", textWrap: "pretty" }}>
                選定語言／聲音後，系統會以該音色合成題目語音；分題錄音時即以此語音播放題目。
              </p>
              <TtsSettings tts={tts} setTts={setTts} />
            </section>
          )}
        </div>

        {/* 動作列 */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--line-2)",
          display: "flex", alignItems: "center", gap: 12 }}>
          <span className="meta">
            {isManual ? (pdf ? "題目文稿已就緒" : "請先上傳題目文稿") : `方式：${method === "segmented" ? "分題錄音" : "整段 / 上傳"}`}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button className="btn btn-quiet" onClick={onCancel}>取消</button>
            <button className="btn btn-primary" disabled={!valid}
              onClick={() => onConfirm({ method })}>
              進入錄音 <I.Chevron size={15} />
            </button>
          </span>
        </div>
      </div>
    </div>
  ), document.body);
}

function MethodCard({ active, onClick, icon, title, tag, desc }) {
  return (
    <button onClick={onClick} style={{
      padding: "16px 16px 14px", borderRadius: 12, textAlign: "left", cursor: "pointer",
      border: `1.5px solid ${active ? "var(--primary)" : "var(--line)"}`,
      background: active ? "var(--primary-soft-2)" : "#fff",
      display: "flex", flexDirection: "column", gap: 10, transition: "all .15s",
      boxShadow: active ? "0 2px 8px rgba(73,99,250,.1)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: active ? "rgba(73,99,250,.12)" : "var(--line-2)",
          display: "grid", placeItems: "center" }}>{icon}</span>
        {tag ? (
          <span className="ff-mont" style={{ font: "600 12px/1 Montserrat", color: active ? "var(--primary)" : "var(--ink-4)",
            letterSpacing: ".08em" }}>{tag}</span>
        ) : null}
        <span style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%",
          border: `2px solid ${active ? "var(--primary)" : "var(--line-3)"}`, display: "grid", placeItems: "center" }}>
          {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />}
        </span>
      </div>
      <div style={{ font: "600 14px/1.3 'Noto Sans TC'", color: "var(--ink)" }}>{title}</div>
      <div style={{ font: "400 12px/1.55 'Noto Sans TC'", color: "var(--ink-3)", textWrap: "pretty" }}>{desc}</div>
    </button>
  );
}

/* ── 語音播放設定（語言/聲音 + 語速），於分題錄音區塊使用 ── */
function TtsSettings({ tts, setTts }) {
  const VoiceOption = ({ id, lang, gender, sample, color }) => {
    const active = tts.voice === id;
    return (
      <button onClick={() => setTts(t => ({ ...t, voice: id }))}
        style={{
          padding: "11px 12px", borderRadius: 10,
          border: `1.5px solid ${active ? "var(--primary)" : "var(--line)"}`,
          background: active ? "var(--primary-soft)" : "#fff",
          textAlign: "left", display: "flex", alignItems: "center", gap: 10,
          transition: "all .15s ease", cursor: "pointer",
          boxShadow: active ? "0 2px 6px rgba(73,99,250,.08)" : "none",
        }}>
        <div style={{
          width: 30, height: 30, borderRadius: 15,
          background: color, color: "#fff",
          display: "grid", placeItems: "center", flexShrink: 0,
          font: "600 12px/1 Montserrat,sans-serif",
        }}>{sample}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "500 13px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>{lang}</div>
          <div className="meta" style={{ fontSize: 11 }}>{gender}</div>
        </div>
        {active && <I.Check size={16} stroke="var(--primary)" sw={2.4} />}
      </button>
    );
  };
  return (
    <div>
      <div style={{ font: "500 12px/1 'Noto Sans TC'", color: "var(--ink-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <I.Lang size={13} stroke="var(--ink-3)" /> 語言 / 聲音
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        <VoiceOption id="f-tw" lang="國語" gender="女聲" sample="女" color="rgb(167,141,250)" />
        <VoiceOption id="m-tw" lang="國語" gender="男聲" sample="男" color="rgb(73,99,250)" />
        <VoiceOption id="f-tai" lang="台語" gender="女聲" sample="女" color="rgb(126,200,180)" />
        <VoiceOption id="m-tai" lang="台語" gender="男聲" sample="男" color="rgb(91,167,233)" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ font: "500 12px/1 'Noto Sans TC'", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
          <I.Speed size={13} stroke="var(--ink-3)" /> 播放語速
        </span>
        <span className="tabular ff-mont" style={{ font: "600 13px/1 Montserrat", color: "var(--primary)" }}>
          {tts.speed.toFixed(2)}×
        </span>
      </div>
      <input type="range" className="rng" min="0.5" max="1.5" step="0.05" value={tts.speed}
        onChange={e => setTts(t => ({ ...t, speed: parseFloat(e.target.value) }))} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span className="meta">0.5×</span>
        <span className="meta">1.0×</span>
        <span className="meta">1.5×</span>
      </div>
      <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 6, background: "var(--warn-soft)",
        color: "rgb(151,89,15)", font: "400 11.5px/1.4 'Noto Sans TC'", display: "flex", gap: 6 }}>
        <I.Info size={13} stroke="rgb(151,89,15)" style={{ flexShrink: 0, marginTop: 1 }} />
        建議高齡客戶使用 0.75× 以下語速以提升聆聽舒適度
      </div>
    </div>
  );
}

window.PreRecordModal = PreRecordModal;
