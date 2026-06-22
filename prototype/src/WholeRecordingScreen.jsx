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
                                uploadedFileName, device, questions, completedSessions,
                                isLastSession, onSessionComplete, onBackToList }) {
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

  return (
    <>
      <SubHeader title="錄音作業 · 整段 / 上傳"
        crumbs={["我的案件", caseInfo.product]}
        right={<button className="btn btn-quiet" onClick={onBackToList}><I.ChevronL size={14} /> 返回案件清單</button>} />

      <div data-screen-label="03 錄音作業（整段/上傳）" style={{ padding: "20px 40px 40px" }}>
        <SubjectProgressBar subjects={subjects} sessionKeys={sessionKeys} subjectDone={subjectDone}
          note={`本次錄音對象：${sessionSubjects.map(s => s.name).join("、")}　·　整段／上傳方式每位對象產生 1 個完整音檔`} />

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

            {/* 本場完成 */}
            <section className="card" style={{ padding: 20 }}>
              <div style={{ font: "700 14px/1 'Noto Sans TC'", color: "var(--ink)", marginBottom: 12 }}>音檔彙整</div>
              <FileCountSummary completedSessions={completedSessions} subjects={subjects} />
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }}
                disabled={!sessionDone} onClick={() => onSessionComplete(mode)}>
                {isLastSession
                  ? <><I.Check size={16} stroke="#fff" sw={2.4} /> 完成本場並送出</>
                  : <><I.User size={16} /> 完成本場，錄製下一位</>}
              </button>
              {!sessionDone && (
                <div className="meta" style={{ textAlign: "center", marginTop: 8 }}>
                  {mode === "record" ? "請先完成整段錄音" : "請先上傳整段音檔"}
                </div>
              )}
            </section>
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

window.WholeRecordingScreen = WholeRecordingScreen;
