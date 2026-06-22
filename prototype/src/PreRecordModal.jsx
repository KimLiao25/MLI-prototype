// PreRecordModal — STEP 2 → STEP 3 之間的「開始錄音前設定」彈窗
//
// 兩段合一：
//   ① 本次錄音對象（勾選，可單勾＝分開錄音 / 複勾＝同場一起錄）
//   ② 錄音方式（僅「API 同步分題題稿」通路出現；自行上傳 PDF 通路只走方式二）
//
// 規則：
//   • 方式一 分題：需有分題題稿（integration）才出現
//   • 方式二 整段/上傳：恆可選；其中「整段錄音」需 iPad 裝置，桌機僅能上傳（於方式二頁面內判斷）
//   • 已完成的對象顯示「已完成」、預設不勾、不可重複選

function PreRecordModal({ open, subjects, subjectDone, defaultKeys,
                          methodAvailable, methodLocked, lockedMethod,
                          canWholeRecord, tts, setTts, onCancel, onConfirm }) {
  const [selKeys, setSelKeys] = React.useState(defaultKeys || []);
  const [method, setMethod] = React.useState(methodLocked ? lockedMethod : (methodAvailable ? "segmented" : "whole"));

  React.useEffect(() => {
    if (open) {
      setSelKeys(defaultKeys || []);
      setMethod(methodLocked ? lockedMethod : (methodAvailable ? "segmented" : "whole"));
    }
  }, [open]);

  if (!open) return null;

  const toggle = (key) => setSelKeys(ks => ks.includes(key) ? ks.filter(k => k !== key) : [...ks, key]);
  const valid = selKeys.length > 0;
  const remaining = subjects.filter(s => !(subjectDone && subjectDone[s.key]));
  const showMethod = methodAvailable && !methodLocked;

  // 透過 portal 渲染到 body，避免被 .scaler 的 transform 影響 fixed 定位
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
              開始錄音前設定
            </h3>
          </div>
          <p style={{ margin: "10px 0 0", font: "400 13px/1.5 'Noto Sans TC'", color: "var(--ink-3)" }}>
            請選擇本次要錄音的對象{showMethod ? "與錄音方式" : ""}。同一案件的多位對象可分次錄音，全部完成後才能送出。
          </p>
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* ① 錄音對象 */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>01</span>
              <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>本次錄音對象</span>
              <span className="meta" style={{ marginLeft: "auto" }}>單勾＝分開錄音 · 複勾＝同場一起錄</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjects.map((s) => {
                const done = subjectDone && subjectDone[s.key];
                const checked = selKeys.includes(s.key);
                return (
                  <label key={s.key} onClick={() => !done && toggle(s.key)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                    cursor: done ? "default" : "pointer",
                    background: done ? "var(--ok-soft)" : checked ? "var(--primary-soft)" : "#fff",
                    border: `1.5px solid ${done ? "rgba(72,153,61,.3)" : checked ? "var(--primary)" : "var(--line)"}`,
                    opacity: done ? .85 : 1, transition: "all .15s",
                  }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: done ? "var(--ok)" : checked ? "var(--primary)" : "#fff",
                      border: `1.5px solid ${done ? "var(--ok)" : checked ? "var(--primary)" : "var(--line-3)"}`,
                      display: "grid", placeItems: "center" }}>
                      {(checked || done) && <I.Check size={13} stroke="#fff" sw={3} />}
                    </span>
                    <span style={{ font: "600 14.5px/1 'Noto Sans TC'", color: "var(--ink)" }}>{s.name}</span>
                    <span className="meta tabular ff-mont" style={{ font: "500 11.5px/1 Montserrat" }}>
                      {maskIdNo(s.idNo)}
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      {s.roleKeys.map(r => (
                        <span key={r} className="tag" style={{ padding: "2px 7px", fontSize: 11 }}>
                          {CASE_ROLE_MAP[r] ? CASE_ROLE_MAP[r].abbr : r}
                        </span>
                      ))}
                      {done && <span className="tag tag-ok" style={{ padding: "2px 8px" }}>已完成</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {remaining.length === 0 && (
              <div style={{ marginTop: 10, font: "400 12px/1.5 'Noto Sans TC'", color: "var(--ok)" }}>
                所有對象皆已完成錄音，可直接送出。
              </div>
            )}
          </section>

          {/* ② 錄音方式 */}
          {showMethod && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>02</span>
                <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>錄音方式</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MethodCard active={method === "segmented"} onClick={() => setMethod("segmented")}
                  icon={<I.Wave size={20} stroke={method === "segmented" ? "var(--primary)" : "var(--ink-3)"} />}
                  title="方式一 · 分題錄音" tag="(a)"
                  desc="依題目逐題錄音，各題即時上傳，送出後由後端合併。" />
                <MethodCard active={method === "whole"} onClick={() => setMethod("whole")}
                  icon={<I.Mic size={20} stroke={method === "whole" ? "var(--primary)" : "var(--ink-3)"} />}
                  title="方式二 · 整段 / 上傳" tag="(b)(c)"
                  desc={canWholeRecord ? "整段錄音或上傳整段音檔，作為完整音檔。" : "上傳整段音檔（桌機不支援現場整段錄音）。"} />
              </div>
            </section>
          )}

          {/* ③ 語音播放設定 — 僅「方式一 · 分題錄音」時出現 */}
          {method === "segmented" && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ font: "700 13px/1 Montserrat", color: "var(--primary)", letterSpacing: ".1em" }}>03</span>
                <span style={{ font: "600 14px/1 'Noto Sans TC'", color: "var(--ink)" }}>語音播放設定</span>
                <span className="ff-mont" style={{ marginLeft: "auto", font: "600 10px/1 Montserrat", color: "var(--ink-4)", letterSpacing: ".06em" }}>
                  F-202 / F-203
                </span>
              </div>
              <TtsSettings tts={tts} setTts={setTts} />
            </section>
          )}

          {methodLocked && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--primary-soft-2)",
              border: "1px solid rgba(73,99,250,.18)", font: "400 12.5px/1.5 'Noto Sans TC'", color: "var(--ink-2)",
              display: "flex", alignItems: "center", gap: 8 }}>
              <I.Info size={14} stroke="var(--primary)" />
              延續本案錄音方式：{lockedMethod === "segmented" ? "分題錄音" : "整段 / 上傳"}
            </div>
          )}
        </div>

        {/* 動作列 */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--line-2)",
          display: "flex", alignItems: "center", gap: 12 }}>
          <span className="meta">{valid ? `已選 ${selKeys.length} 位` : "請至少選擇 1 位錄音對象"}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button className="btn btn-quiet" onClick={onCancel}>取消</button>
            <button className="btn btn-primary" disabled={!valid}
              onClick={() => onConfirm({ keys: selKeys, method })}>
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
        <span className="ff-mont" style={{ font: "600 12px/1 Montserrat", color: active ? "var(--primary)" : "var(--ink-4)",
          letterSpacing: ".08em" }}>{tag}</span>
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

/* ── 語音播放設定（語言/聲音 + 語速），於彈窗 03 區塊使用 ── */
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
