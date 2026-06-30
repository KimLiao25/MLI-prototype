// WholeRecordingScreen — 方式二：整段錄音 (c) / 自行上傳整段音檔 (b)
//
// 左：文稿（API 同步 → 連續題稿文件；自行上傳 → PDF 圖檔預覽）—— 業務員照著念
// 右：二擇一  • 整段錄音（僅 iPad，現場錄一次，停止＝即時上傳）
//             • 上傳音檔（裝置上已錄好的整段檔，送出時上傳）
// 每位對象（或同場多人）= 1 個完整音檔，後端無須合併。
// 本場完成 → 由 app 決定「錄製下一位」或「送出」。

function fmtWholeTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function WholeRecordingScreen({ caseInfo, subjects, sessionKeys, subjectDone, scriptSource,
                                uploadedFileName, device, questions,
                                flowMode = "normal", returnInfo, onSubmitCorrection,
                                onWholeStatus, onOpenCheck, onPickSubjects, onBackToList }) {
  const isCorrection = flowMode === "correction";
  const canRecord = device === "ipad";
  const [mode, setMode] = React.useState(canRecord ? "record" : "upload");

  // 整段錄音狀態
  const [recState, setRecState] = React.useState("idle"); // idle | recording | uploading | done
  const [elapsed, setElapsed] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [playPos, setPlayPos] = React.useState(0);

  // 上傳狀態
  const [uploaded, setUploaded] = React.useState(null); // {name, size, dur}
  const fileRef = React.useRef(null);

  // 錄音計時
  React.useEffect(() => {
    if (recState !== "recording") return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [recState]);

  // 回放模擬
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPlayPos(p => {
      const n = p + 0.04; if (n >= 1) { setPlaying(false); return 0; } return n;
    }), 200);
    return () => clearInterval(id);
  }, [playing]);

  const sessionSubjects = subjects.filter(s => sessionKeys.includes(s.key));

  const startRec = () => { setRecState("recording"); setElapsed(0); };
  const stopRec = () => {
    setRecState("uploading");
    setTimeout(() => setRecState("done"), 900);
  };
  const resetRec = () => { setRecState("idle"); setElapsed(0); setPlaying(false); setPlayPos(0); };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setUploaded({ name: f.name, size: f.size });
    e.target.value = "";
  };

  const sessionDone = (mode === "record" && recState === "done") || (mode === "upload" && !!uploaded);

  // 補正送出時，依目前錄製 / 上傳狀態組出補正音檔 meta（獨立保存）
  const corrNowStr = () => {
    const d = new Date(); const p = (n)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const buildCorrectionAudio = () => {
    if (uploaded) return { name: uploaded.name, sizeMB: +(uploaded.size/1024/1024).toFixed(2), durationSec: 90, uploadedAt: corrNowStr(), method: "upload" };
    return { name: `${caseInfo.caseNo}_correction.wav`, sizeMB: 1.5, durationSec: elapsed || 90, uploadedAt: corrNowStr(), method: "record" };
  };

  // 本場錄完 / 選好檔 → 即時把該對象寫入進度（可自由切換對象補錄，進度不掉）
  React.useEffect(() => {
    if (isCorrection) return; // 補正模式不寫一般進度（補正音檔獨立保存）
    const status = uploaded ? "uploaded" : (recState === "done" ? "recorded" : "pending");
    onWholeStatus && onWholeStatus(sessionKeys, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, uploaded, sessionKeys.join("|")]);

  const doneCount = subjects.filter(s => subjectDone && subjectDone[s.key]).length;
  const totalCount = subjects.length;

  return (
    <>
      <SubHeader title={isCorrection ? "補正錄音" : "錄音作業"}
        right={<div style={{ display: "flex", gap: 10 }}>
          {onPickSubjects && !isCorrection && (
            <button className="btn btn-quiet" onClick={onPickSubjects}><I.User size={14} /> 切換錄音對象</button>
          )}
          <button className="btn btn-quiet" onClick={onBackToList}><I.ChevronL size={14} /> {isCorrection ? "返回案件" : "返回案件清單"}</button>
        </div>} />

      <div data-screen-label={isCorrection ? "03 補正錄音（整段/上傳）" : "03 錄音作業（整段/上傳）"} style={{ padding: "20px 40px 40px" }}>
        {isCorrection && <ReturnReasonBanner info={returnInfo} caseInfo={caseInfo}/>}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: 20, alignItems: "start" }}>

          {/* LEFT — 文稿 */}
          <section className="card" style={{ padding: 0, overflow: "hidden", alignSelf: "stretch" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line-2)",
              display: "flex", alignItems: "center", gap: 10 }}>
              <I.Script size={18} stroke="var(--primary)" />
              <div style={{ font: "700 15px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>完整題目文稿</div>
              <span className="tag" style={{ marginLeft: 4 }}>
                {scriptSource === "manual" ? "上傳 PDF 圖檔" : "API 同步題稿"}
              </span>
              <span className="meta" style={{ marginLeft: "auto" }}>業務員照此文稿與客戶逐項唸讀並錄音</span>
            </div>
            {scriptSource === "manual"
              ? <PdfPreview fileName={uploadedFileName || "錄音題目文稿.pdf"} pages={3} maxHeight={760} />
              : <ScriptDocument questions={questions} maxHeight={760} />}
          </section>

          {/* RIGHT — 錄音 / 上傳 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <section className="card" style={{ padding: 22 }}>
              {/* 二擇一切換 */}
              <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "var(--primary-bg)",
                border: "1px solid var(--line-2)", marginBottom: 20 }}>
                {canRecord && (
                  <ModeTab active={mode === "record"} onClick={() => setMode("record")}
                    icon={<I.Mic size={15} />} label="整段錄音" sub="(c)" />
                )}
                <ModeTab active={mode === "upload"} onClick={() => setMode("upload")}
                  icon={<I.Upload size={15} />} label="上傳音檔" sub="(b)" />
              </div>

              {/* 整段錄音面 */}
              {mode === "record" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  padding: "10px 0 6px" }}>
                  <MicButton size={104}
                    state={recState === "recording" ? "recording" : recState === "done" ? "done" : "idle"}
                    onClick={recState === "idle" ? startRec : recState === "recording" ? stopRec : resetRec} />
                  <div className="tabular ff-mont" style={{ font: "600 30px/1 Montserrat",
                    color: recState === "recording" ? "var(--danger)" : "var(--ink-2)" }}>
                    {fmtWholeTime(playing ? Math.round(elapsed * playPos) : elapsed)}
                  </div>
                  <div style={{ width: "100%", minHeight: 72, display: "grid", placeItems: "center" }}>
                    {recState === "recording" && <Waveform active color="var(--danger)" height={64} bars={56} />}
                    {recState === "uploading" && (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--primary-soft)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "60%", background: "var(--primary)",
                            animation: "wf 1.4s ease-in-out infinite", transformOrigin: "left" }} />
                        </div>
                        <div className="meta" style={{ textAlign: "center" }}>整段音檔上傳中…</div>
                      </div>
                    )}
                    {recState === "done" && (
                      <div style={{ width: "100%" }}>
                        <StaticWaveform progress={playing ? playPos : 1} height={60} bars={64}
                          color={playing ? "var(--primary)" : "var(--ok)"} muted="var(--line-3)" />
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                          <button className="btn btn-quiet btn-sm" onClick={() => setPlaying(p => !p)}>
                            {playing ? <I.Pause size={13} /> : <I.Play size={13} />} {playing ? "暫停" : "回放"}
                          </button>
                          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                            font: "400 12px/1 'Noto Sans TC'", color: "var(--ok)" }}>
                            <I.Check size={14} stroke="var(--ok)" sw={2.4} /> 完整音檔已即時上傳
                          </span>
                        </div>
                      </div>
                    )}
                    {recState === "idle" && (
                      <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <I.Info size={14} stroke="var(--ink-4)" /> 點擊麥克風開始整段錄音，全程一次錄完
                      </div>
                    )}
                  </div>
                  {recState === "idle" && (
                    <button className="btn btn-primary btn-lg" onClick={startRec}><I.Mic size={16} /> 開始錄音</button>
                  )}
                  {recState === "recording" && (
                    <button className="btn btn-warn btn-lg" onClick={stopRec}><I.Stop size={16} stroke="#fff" /> 停止並儲存</button>
                  )}
                  {recState === "done" && (
                    <button className="btn btn-danger btn-sm" onClick={resetRec}><I.Replay size={13} /> 重新錄音</button>
                  )}
                </div>
              )}

              {/* 上傳音檔面 */}
              {mode === "upload" && (
                <div style={{ padding: "4px 0" }}>
                  {!uploaded ? (
                    <button onClick={() => fileRef.current?.click()} style={{
                      width: "100%", padding: "40px 20px", borderRadius: 12, cursor: "pointer",
                      border: "1.5px dashed rgba(73,99,250,.4)", background: "var(--primary-soft-2)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 60, height: 60, borderRadius: 14, background: "var(--primary-soft)",
                        display: "grid", placeItems: "center" }}><I.Upload size={26} stroke="var(--primary)" sw={1.8} /></span>
                      <span style={{ font: "600 14.5px/1.4 'Noto Sans TC'", color: "var(--ink)" }}>
                        選擇裝置上已錄好的整段音檔
                      </span>
                      <span className="meta">支援格式：MP3 / WAV / M4A · 點擊或拖放上傳</span>
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                        borderRadius: 10, background: "var(--ok-soft)", border: "1px solid rgba(72,153,61,.3)" }}>
                        <span style={{ width: 38, height: 38, borderRadius: 8, background: "#fff",
                          display: "grid", placeItems: "center", flexShrink: 0,
                          border: "1px solid rgba(72,153,61,.3)" }}><I.Headset size={18} stroke="var(--ok)" /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ font: "600 13.5px/1.3 'Noto Sans TC'", color: "var(--ink)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploaded.name}</div>
                          <div className="meta" style={{ marginTop: 2 }}>{(uploaded.size / 1024 / 1024).toFixed(2)} MB · 待送出時上傳</div>
                        </div>
                        <button className="btn btn-quiet btn-sm" onClick={() => setUploaded(null)}><I.X size={12} sw={2} /> 移除</button>
                      </div>
                      <button className="btn btn-soft btn-sm" style={{ alignSelf: "flex-start" }}
                        onClick={() => fileRef.current?.click()}><I.Upload size={13} /> 重新選擇</button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,audio/*" style={{ display: "none" }} onChange={pickFile} />
                </div>
              )}
            </section>

            {/* 案件摘要 */}
            <CaseInfoSummary caseInfo={caseInfo}
              customers={subjects.map(s => ({ name: s.name, idNo: s.idNo, roles: s.roleKeys }))} />

            {/* 送出區：補正模式直接送出（不跳檢核視窗）；一般模式走送出前檢核 */}
            {isCorrection ? (
              <section className="card" style={{ padding: 20 }}>
                <div style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)", letterSpacing: ".04em", marginBottom: 12 }}>送出補正</div>
                <button className="btn btn-primary" style={{ width: "100%", opacity: sessionDone ? 1 : .5, cursor: sessionDone ? "pointer" : "not-allowed" }}
                  disabled={!sessionDone}
                  onClick={() => sessionDone && onSubmitCorrection && onSubmitCorrection(buildCorrectionAudio())}>
                  <I.Upload size={16} /> 送出補正音檔
                </button>
                <div className="meta" style={{ marginTop: 10, lineHeight: 1.6 }}>
                  送出後補正音檔將<b style={{color:"var(--ink-2)"}}>獨立保存</b>，不與原始完整音檔合併、不覆蓋；案件進入「補件審核」，由內勤就補正內容複審。
                </div>
                {!sessionDone && (
                  <div className="meta" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--warn)" }}>
                    <I.Info size={13} stroke="var(--warn)" /> 請先完成整段錄音或上傳音檔，才能送出補正。
                  </div>
                )}
                {sessionDone && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                    font: "400 12px/1.4 'Noto Sans TC'", color: "var(--ok)" }}>
                    <I.Check size={14} stroke="var(--ok)" sw={2.4} /> 補正音檔已就緒，可送出
                  </div>
                )}
              </section>
            ) : (
            <section className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)", letterSpacing: ".04em" }}>整體進度</span>
                <span className="tabular ff-mont" style={{ font: "600 13px/1 Montserrat", color: doneCount === totalCount ? "var(--ok)" : "var(--ink-3)" }}>
                  {doneCount} <span style={{ color: "var(--ink-4)" }}>/ {totalCount}</span> 位
                </span>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={onOpenCheck}>
                <I.Upload size={16} /> 送出前檢核
              </button>
              <div className="meta" style={{ marginTop: 10, lineHeight: 1.5 }}>
                每位對象錄完 / 上傳即時保存（每位 1 個完整音檔），可隨時切換對象補錄。可打開檢核視窗確認進度，全數完成即可送出合併。
              </div>
              {sessionDone && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                  font: "400 12px/1.4 'Noto Sans TC'", color: "var(--ok)" }}>
                  <I.Check size={14} stroke="var(--ok)" sw={2.4} /> 本場（{sessionSubjects.map(s => s.name).join("、")}）已保存
                </div>
              )}
            </section>
            )}
          </div>
        </div>
      </div>

      {/* F-code legend */}
      <div className="fcode-legend" style={{ margin: "0 40px 28px", padding: "12px 16px", borderRadius: 10,
        background: "var(--primary-soft-2)", border: "1px dashed rgba(73,99,250,.25)",
        font: "400 12px/1.5 'Noto Sans TC'", color: "var(--ink-3)",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ font: "600 12px/1 'Noto Sans TC'", color: "var(--primary)", letterSpacing: ".06em" }}>本畫面對應功能</span>
        <FCode code="F-109" label="整段錄音 (c)" />
        <FCode code="F-110" label="自行上傳整段音檔 (b)" />
        <FCode code="F-107" label="即時儲存" />
        <FCode code="F-111" label="多對象分次錄音" />
      </div>
    </>
  );
}

function ModeTab({ active, onClick, icon, label, sub }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 44, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
      background: active ? "#fff" : "transparent", color: active ? "var(--primary)" : "var(--ink-3)",
      border: active ? "1px solid var(--line)" : "1px solid transparent",
      boxShadow: active ? "var(--shadow-sm)" : "none",
      font: "600 14px/1 'Noto Sans TC'", transition: "all .15s", cursor: "pointer" }}>
      {icon} {label}
      <span className="ff-mont" style={{ font: "600 10px/1 Montserrat", opacity: .7, letterSpacing: ".06em" }}>{sub}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// ReturnReasonBanner — 補正錄音頁頂部「退回原因說明」
// 結構化呈現內勤的退回說明（類別 / 題目 / 對象 / 文字），高齡業務情境下比一段文字好讀。
function ReturnReasonBanner({ info, caseInfo }) {
  if (!info) {
    return (
      <div className="card" style={{ padding: "14px 18px", marginBottom: 20,
        background: "var(--warn-soft)", border: "1px solid rgba(241,160,40,.3)",
        font: "400 13px/1.6 'Noto Sans TC'", color: "rgb(151,89,15)" }}>
        本案件為退回補正案，請依內勤退回說明重新錄製後送出。
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 0, marginBottom: 20, overflow: "hidden",
      border: "1px solid rgba(234,82,82,.3)" }}>
      <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--line-2)",
        background: "var(--danger-soft)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "#fff",
          display: "grid", placeItems: "center", flexShrink: 0,
          border: "1px solid rgba(234,82,82,.25)" }}><I.Warn size={15} stroke="var(--danger)" /></span>
        <span style={{ font: "700 15px/1.2 'Noto Sans TC'", color: "var(--ink)" }}>退回原因說明</span>
        {info.round > 1 && (
          <span className="tag" style={{ background: "#fff", color: "var(--danger)", border: "1px solid rgba(234,82,82,.3)" }}>
            第 {info.round} 次退回
          </span>
        )}
        <span style={{ flex: 1 }} />
        {info.returnedAt && (
          <span className="meta tabular ff-mont">退回 {info.returnedAt}{info.reviewer ? ` · ${info.reviewer}` : ""}</span>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ font: "400 13.5px/1.75 'Noto Sans TC'", color: "var(--ink-2)" }}>
          {info.reasonText}
        </div>
      </div>
    </div>
  );
}

function BannerPill({ label, value }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7,
      padding: "6px 12px", borderRadius: 9, background: "var(--primary-soft)" }}>
      <span style={{ font: "500 11px/1 'Noto Sans TC'", color: "rgba(73,99,250,.7)", letterSpacing: ".04em" }}>{label}</span>
      <span style={{ font: "600 13px/1 'Noto Sans TC'", color: "var(--primary)" }}>{value}</span>
    </span>
  );
}

window.WholeRecordingScreen = WholeRecordingScreen;
