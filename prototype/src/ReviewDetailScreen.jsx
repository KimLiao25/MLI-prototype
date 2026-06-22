// ReviewDetailScreen — 內勤後台核心審核頁（V3 — 左右對調）
// 對應功能：F-103 檢視/編輯錄音案件 + F-104 審核錄音案件
//
// V3 版面：主區左、案件側欄右（sticky）
//   ┌─ AdminSubHeader（編號 / 狀態 / 風險 / 上方功能列）───────────────────────┐
//   ├─────────────────────────────────────────────────┬──────────────────┤
//   │ Tab：[AI 審核比對(預設)] [逐字稿]                 │ 案件資訊           │
//   │ ────────────────────────────────────────────── │ ──────────────── │
//   │ AI 摘要｜分數｜通過題數                           │ 完整音檔（播放器） │
//   │ ────────────────────────────────────────────── │ ──────────────── │
//   │ 逐題比對表格：[題號][題目文稿][逐字稿][AI 判斷]   │ 退回補正 / 通過    │
//   └─────────────────────────────────────────────────┴──────────────────┘

// ════════════════════════════════════════════════════════════════════════════
// Speaker 顯示工具
// STT 僅能做語者分群（A / B / C 為不同人），不知道角色身分。
// 把 robot / agent / proposer / insured / payer 依「實際聲學群」歸併再依出現順序給 A、B、C…
// （要保人、被保險人、繳款人若在 mock data 中是同一人，視為同一聲學群）
// ════════════════════════════════════════════════════════════════════════════
const SPEAKER_PALETTE = [
  { letter:"A", color:"rgb(73,99,250)",  bg:"rgba(73,99,250,.10)",  border:"rgba(73,99,250,.30)"  },
  { letter:"B", color:"rgb(58,124,49)",  bg:"rgba(72,153,61,.12)",  border:"rgba(72,153,61,.30)"  },
  { letter:"C", color:"rgb(178,104,12)", bg:"rgba(241,160,40,.14)", border:"rgba(241,160,40,.30)" },
  { letter:"D", color:"rgb(123,109,235)",bg:"rgba(123,109,235,.12)",border:"rgba(123,109,235,.30)"},
  { letter:"E", color:"rgb(15,142,140)", bg:"rgba(20,166,164,.14)", border:"rgba(20,166,164,.30)" },
];
const UNKNOWN_SPEAKER = { letter:"?", color:"var(--ink-4)", bg:"var(--line-2)", border:"var(--line)" };

function makeSpeakerMap(detail) {
  // 同一聲學群歸併 — 客戶端三種角色視為同一人聲
  const cluster = (sp) => (sp === "proposer" || sp === "insured" || sp === "payer") ? "customer" : sp;
  const seen = new Map();
  detail.questions.forEach(q => (q.segments || []).forEach(s => {
    const c = cluster(s.speaker);
    if (!seen.has(c)) seen.set(c, SPEAKER_PALETTE[seen.size] || UNKNOWN_SPEAKER);
  }));
  return (speaker) => seen.get(cluster(speaker)) || UNKNOWN_SPEAKER;
}

function SpeakerChip({ speakerMeta, size = "sm" }) {
  const big = size === "md";
  return (
    <span className="ff-mont" style={{
      flexShrink:0,
      width: big ? 22 : 18, height: big ? 22 : 18, borderRadius:"50%",
      display:"inline-grid", placeItems:"center",
      background: speakerMeta.bg, color: speakerMeta.color,
      border: `1px solid ${speakerMeta.border}`,
      font: big ? "700 11.5px/1 Montserrat" : "700 10.5px/1 Montserrat",
      letterSpacing:".02em",
    }}>{speakerMeta.letter}</span>
  );
}

function ReviewDetailScreen({ caseInfo, detail, onBack, onApprove, onReturn }) {
  const STAGE  = window.__MLI_REVIEW_STAGE;
  const RISK   = window.__MLI_RISK;
  const stage  = STAGE[caseInfo.reviewStage] || STAGE.waiting;
  const risk   = RISK[caseInfo.riskLevel] || RISK.low;

  // 播放狀態
  const [playing, setPlaying]   = React.useState(false);
  const [currentSec, setCurrentSec] = React.useState(0);
  const [speed, setSpeed]       = React.useState(1.0);

  // Tab 切換（預設 ai）
  const [tab, setTab] = React.useState("ai"); // 'ai' | 'transcript'

  // 動作 modal
  const [modal, setModal] = React.useState(null);

  // 案件資訊在本頁的覆寫值（修改案件資訊 modal 編輯後存放於此，
  // 即時反映於右側案件資訊卡。實際送出至後端的部分由 prototype 模擬。）
  const [caseOverrides, setCaseOverrides] = React.useState({});
  const mergedCase = React.useMemo(() => ({ ...caseInfo, ...caseOverrides }), [caseInfo, caseOverrides]);

  // 額外上傳的音檔（內勤後台補件用）
  const [uploadedAudio, setUploadedAudio] = React.useState(null); // { name, sizeKB, durationSec, uploadedAt } | null

  // ─── 功能列「...」選單動作 — 依審核階段動態組合 ───
  // 與 CaseDetailScreen 一致的模式：所有非「返回清單」操作整併到 overflow menu，
  // 主要決策（退回補正 / 審核通過）保留在右側 action bar
  const headerActions = React.useMemo(() => {
    const stage = caseInfo.reviewStage;
    const isVerified = stage === "verified";
    const isReturned = stage === "returned";
    // 「草稿」（尚未開始）= waiting / unassigned；「審核中 / 補件審核」= in_review / resubmit
    const isEditable = ["waiting", "unassigned", "in_review", "resubmit"].includes(stage);

    const list = [];

    // 1. 修改案件資訊 — 僅草稿 / 審核中
    list.push({
      key: "edit",
      icon: <I.Settings size={16} stroke={isEditable ? "var(--primary)" : "var(--ink-4)"}/>,
      title: "修改案件資訊",
      desc: isEditable
        ? "編輯商品、保單號、備註等可修改欄位"
        : "案件已結案，無法修改",
      disabled: !isEditable,
      onClick: () => setModal("edit"),
    });

    // 2. 上傳音檔 — 僅草稿 / 審核中
    list.push({
      key: "upload",
      icon: <I.Upload size={16} stroke={isEditable ? "var(--primary)" : "var(--ink-4)"}/>,
      title: "上傳音檔",
      desc: isEditable
        ? "補上傳完整音檔或補充音檔，於完整音檔下方獨立播放"
        : "案件已結案，無法上傳音檔",
      disabled: !isEditable,
      onClick: () => setModal("upload"),
    });

    // 3. 重新合併音檔
    list.push({
      key: "remerge",
      icon: <I.Wave size={16} stroke={(isVerified || isReturned) ? "var(--ink-4)" : "var(--primary)"}/>,
      title: "重新合併音檔",
      desc: (isVerified || isReturned)
        ? "音檔已定版，無法重新合併"
        : "重新合併分題上傳的分段音檔，產生新版完整音檔",
      disabled: isVerified || isReturned,
      onClick: () => setModal("remerge"),
    });

    // 4. 重新觸發 STT
    list.push({
      key: "retriggerStt",
      icon: <I.Replay size={16} stroke={isVerified ? "var(--ink-4)" : "var(--primary)"}/>,
      title: "重新觸發 STT",
      desc: isVerified
        ? "案件已通過，無法重新比對"
        : "重新將完整音檔送至 STT 引擎產生比對報告",
      disabled: isVerified,
      onClick: () => setModal("retriggerStt"),
    });

    // 5. 下載檔案
    list.push({
      key: "download",
      icon: <I.Doc size={16} stroke="var(--primary)"/>,
      title: "下載檔案",
      desc: "下載完整音檔與 STT 比對報告 PDF",
      onClick: () => setModal("download"),
    });

    // 6. 刪除案件 — 已通過案件不可刪
    list.push({
      key: "delete",
      icon: <I.Delete size={16} stroke={isVerified ? "var(--ink-4)" : "var(--danger)"}/>,
      title: "刪除案件",
      desc: isVerified
        ? "案件已通過並歸檔，無法刪除"
        : "刪除整筆案件與相關錄音資料（不可復原）",
      disabled: isVerified,
      danger: true,
      onClick: () => setModal("delete"),
    });

    return list;
  }, [caseInfo.reviewStage]);

  // 播放模擬
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentSec(s => {
        const next = s + 0.5 * speed;
        if (next >= (detail?.totalDuration || 600)) { setPlaying(false); return detail?.totalDuration || 600; }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, speed, detail]);

  const seek = (sec) => setCurrentSec(Math.max(0, Math.min(detail?.totalDuration || 600, sec)));

  if (!detail) {
    return (
      <div style={{padding:"60px 40px", textAlign:"center", color:"var(--ink-3)"}}>
        此案件尚無 STT 比對資料
      </div>
    );
  }

  // AI 評估摘要計算
  const totalQ   = detail.questions.length;
  const passQ    = detail.questions.filter(q => q.status === "ok").length;
  const passRate = Math.round(passQ / totalQ * 100);

  return (
    <div data-screen-label="02 案件審核詳情" className="fadeup admin-detail">

      <AdminSubHeader
        title={
          <>
            <span className="ff-mont tabular" style={{font:"600 18px/1 Montserrat", color:"var(--primary)", letterSpacing:".02em"}}>
              {caseInfo.recordingNo}
            </span>
            <span style={{font:"500 13px/1 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:10}}>· {caseInfo.product}</span>
          </>
        }
        crumbs={[]}
        badge={
          <div style={{display:"flex", gap:6, marginLeft:6}}>
            <span style={{display:"inline-flex", alignItems:"center", gap:5,
              padding:"3px 10px", borderRadius:11, background:stage.bg, color:stage.color,
              font:"500 12px/1.4 'Noto Sans TC'"}}>
              <Dot color={stage.color} size={6}/> {stage.label}
            </span>
          </div>
        }
        right={
          <>
            <ReviewActionsMenu actions={headerActions}/>
            <button className="btn btn-quiet btn-sm" onClick={onBack}>
              <I.ChevronL size={11}/> 返回清單
            </button>
          </>
        }
      />

      <div className="rev-grid">

        {/* ─── MAIN (LEFT) — Tabs ─── */}
        <main className="rev-main" id="review-detail-main">

          <TabBar tab={tab} setTab={setTab}
            aiBadge={totalQ - passQ}
            />

          {tab === "ai" ? (
            <AIReviewView detail={detail} passQ={passQ} totalQ={totalQ} passRate={passRate}
              onSeek={seek} currentSec={currentSec}/>
          ) : tab === "transcript" ? (
            <TranscriptView detail={detail}/>
          ) : (
            <RecordingView detail={detail}
              currentSec={currentSec} setCurrentSec={setCurrentSec}
              playing={playing} setPlaying={setPlaying}/>
          )}
        </main>

        {/* ─── SIDE (RIGHT) — 案件資訊 / 完整音檔 / 操作 ─── */}
        <aside className="rev-side">
          <CaseInfoCompact caseInfo={mergedCase} overrideKeys={Object.keys(caseOverrides)}/>

          <AudioPlayerAdmin caseInfo={mergedCase} detail={detail}
            currentSec={currentSec} setCurrentSec={setCurrentSec}
            playing={playing} setPlaying={setPlaying}
            speed={speed} setSpeed={setSpeed}/>

          {/* 內勤補上傳的音檔 — 上傳後才顯示 */}
          {uploadedAudio && (
            <UploadedAudioPlayer audio={uploadedAudio} onRemove={()=>setUploadedAudio(null)}/>
          )}

          {/* Action bar — 主要操作 */}
          <div className="rev-actions">
            <button className="btn btn-danger" style={{flex:1}} onClick={()=>setModal("return")}>
              <I.Replay size={14}/> 退回補正
            </button>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>setModal("approve")}>
              <I.Check size={14}/> 審核通過
            </button>
          </div>
        </aside>

      </div>

      {/* Modals */}
      {modal === "return"       && <ReturnModal caseInfo={mergedCase} detail={detail} onCancel={()=>setModal(null)} onConfirm={()=>{ setModal(null); onReturn && onReturn(); }}/>}
      {modal === "approve"      && <ApproveModal caseInfo={mergedCase} detail={detail} onCancel={()=>setModal(null)} onConfirm={()=>{ setModal(null); onApprove && onApprove(); }}/>}
      {modal === "retriggerStt" && <RetriggerSttModal onCancel={()=>setModal(null)}/>}
      {modal === "remerge"      && <RemergeModal caseInfo={mergedCase} onCancel={()=>setModal(null)}/>}
      {modal === "download"     && <DownloadModal caseInfo={mergedCase} onCancel={()=>setModal(null)}/>}
      {modal === "edit"         && <EditCaseModal caseInfo={mergedCase} overrides={caseOverrides}
                                      onCancel={()=>setModal(null)}
                                      onConfirm={(patch)=>{ setCaseOverrides(o => ({...o, ...patch})); setModal(null); }}/>}
      {modal === "upload"       && <UploadAudioModal caseInfo={mergedCase}
                                      onCancel={()=>setModal(null)}
                                      onConfirm={(audio)=>{ setUploadedAudio(audio); setModal(null); }}/>}
      {modal === "delete"       && <DeleteCaseModal caseInfo={mergedCase}
                                      onCancel={()=>setModal(null)}
                                      onConfirm={()=>{ setModal(null); onBack && onBack(); }}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ReviewActionsMenu — 功能列「...」overflow 選單
// 將下載 / 重新觸發 STT / 重新合併 等動作整併到單一按鈕，
// 並依當前審核階段 disable 不可用的選項。
// （模式對齊前台 CaseDetailScreen 的 ActionsMenu）
// ════════════════════════════════════════════════════════════════════════════
function ReviewActionsMenu({ actions }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const empty = actions.length === 0;

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <button
        className="btn btn-quiet btn-sm"
        onClick={()=>setOpen(o=>!o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="更多功能"
        title="更多功能"
        style={{
          padding:"0 9px",
          background: open ? "var(--primary-soft-2)" : undefined,
          color: open ? "var(--primary)" : undefined,
          borderColor: open ? "var(--primary)" : undefined,
        }}>
        <I.More size={16}/>
      </button>

      {open && (
        <div role="menu" className="card fadeup" style={{
          position:"absolute", top:"calc(100% + 8px)", right: 0,
          width: 320, padding: 6, zIndex: 50,
          boxShadow:"0 12px 32px rgba(41,47,84,.16), 0 2px 8px rgba(41,47,84,.06)",
          border:"1px solid var(--line-2)",
          animation:"none",
        }}>
          {empty ? (
            <div className="meta" style={{padding:"14px 12px", textAlign:"center"}}>
              此案件目前無可用操作
            </div>
          ) : (
            <>
              <div style={{
                padding:"8px 10px 6px",
                font:"600 11px/1 'Noto Sans TC'",
                color:"var(--ink-4)", letterSpacing:".1em",
              }}>
                可操作功能
              </div>
              {actions.map((a) => (
                <button
                  key={a.key}
                  role="menuitem"
                  disabled={a.disabled}
                  onClick={()=>{ setOpen(false); a.onClick && a.onClick(); }}
                  style={{
                    display:"flex", alignItems:"center", gap:12, width:"100%",
                    padding:"10px 10px", borderRadius:8,
                    background:"transparent", border:"none",
                    textAlign:"left",
                    cursor: a.disabled ? "not-allowed" : "pointer",
                    opacity: a.disabled ? 0.5 : 1,
                    transition:"background .12s",
                  }}
                  onMouseEnter={e => {
                    if (a.disabled) return;
                    e.currentTarget.style.background = a.danger ? "var(--danger-soft)" : "var(--primary-soft-2)";
                  }}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{
                    width:32, height:32, borderRadius:8,
                    background: a.disabled ? "var(--line-2)"
                      : (a.danger ? "var(--danger-soft)" : "var(--primary-soft)"),
                    display:"grid", placeItems:"center", flexShrink:0,
                  }}>{a.icon}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{
                      font:"500 13.5px/1.3 'Noto Sans TC'",
                      color: a.danger ? "var(--danger)" : "var(--ink)",
                    }}>{a.title}</div>
                    <div className="meta" style={{marginTop:2, whiteSpace:"normal"}}>{a.desc}</div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Tab Bar
// ════════════════════════════════════════════════════════════════════════════
function TabBar({ tab, setTab, aiBadge = 0 }) {
  const tabs = [
    { v: "ai",         l: "AI 審核比對", icon: <I.Check size={13}/>,  badge: aiBadge > 0 ? aiBadge : null },
    { v: "transcript", l: "逐字稿",       icon: <I.Script size={13}/>, badge: null },
    { v: "recording",  l: "錄音檔",       icon: <I.Wave size={13}/>,   badge: null },
  ];
  return (
    <div style={{
      display:"flex", borderBottom:"1px solid var(--line)", marginBottom:18, gap:4,
    }}>
      {tabs.map(t => {
        const a = tab === t.v;
        return (
          <button key={t.v} onClick={()=>setTab(t.v)} style={{
            display:"inline-flex", alignItems:"center", gap:7,
            padding:"10px 18px", border:"none", background:"none", cursor:"pointer",
            color: a ? "var(--primary)" : "var(--ink-3)",
            font: a ? "600 14px/1 'Noto Sans TC'" : "500 14px/1 'Noto Sans TC'",
            letterSpacing:".02em",
            position:"relative",
            transition:"color .12s",
          }}>
            {t.icon}
            {t.l}
            {t.badge && (
              <span style={{
                padding:"1px 6px", borderRadius:8,
                background: a ? "var(--danger)" : "var(--line)",
                color: a ? "#fff" : "var(--ink-3)",
                font:"600 10.5px/1.4 Montserrat",
              }}>{t.badge}</span>
            )}
            {a && (
              <span style={{
                position:"absolute", left:0, right:0, bottom:-1,
                height:2, background:"var(--primary)", borderRadius:"2px 2px 0 0",
              }}/>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AI 審核比對 View（預設 Tab）
// ════════════════════════════════════════════════════════════════════════════
function AIReviewView({ detail, passQ, totalQ, passRate }) {
  const getSpeaker = React.useMemo(() => makeSpeakerMap(detail), [detail]);
  return (
    <>
      {/* AI 摘要區塊 */}
      <AISummaryPanel detail={detail} passQ={passQ} totalQ={totalQ} passRate={passRate}/>

      {/* 逐題比對表格 */}
      <ComparisonTable detail={detail} getSpeaker={getSpeaker}/>
    </>
  );
}

// ─── AI 摘要面板 ───
function AISummaryPanel({ detail, passQ, totalQ, passRate }) {
  // ✨ 即時從 segments 計算「比對差異 / 否定 / 低信心」項數——
  //   跟表格實際顯示的內容一致，不再依賴寫死的 summary 數字
  const allSegments = detail.questions.flatMap(q => q.segments || []);
  const diff     = allSegments.filter(s => (s.flags||[]).includes("diff")).length;
  const negation = allSegments.filter(s => (s.flags||[]).includes("negation")).length;
  const lowConf  = allSegments.filter(s => (s.flags||[]).includes("low") || (s.confidence !== undefined && s.confidence < 0.6)).length;
  const failQ = totalQ - passQ;
  const hasIssue = failQ > 0;

  // 自動生成 AI 審核摘要文字
  const failTitles = detail.questions.filter(q => q.status !== "ok").map(q => `Q${q.no.toString().padStart(2,"0")} ${q.title}`);
  const aiSummary = !hasIssue
    ? "本案件 AI 比對結果一致，所有題目均通過 STT 辨識比對與語意檢核，建議直接審核通過。"
    : `本案件偵測到 ${diff} 項字詞比對差異、${negation} 項否定/不確定語意、${lowConf} 項低信心段落，建議重點檢視「${failTitles.join("、")}」。`;

  const scoreColor = passRate >= 90 ? "var(--ok)" : passRate >= 70 ? "var(--warn)" : "var(--danger)";

  return (
    <section className="card" style={{
      padding:0, marginBottom:18, overflow:"hidden",
      borderColor: hasIssue ? "rgba(241,160,40,.4)" : "rgba(72,153,61,.4)",
    }}>
      <div style={{
        padding:"14px 20px 12px", display:"flex", alignItems:"center", gap:10,
        borderBottom:"1px solid var(--line-2)",
        background: hasIssue ? "rgba(241,160,40,.06)" : "rgba(72,153,61,.06)",
      }}>
        <div style={{
          width:28, height:28, borderRadius:8, display:"grid", placeItems:"center",
          background: hasIssue ? "var(--warn-soft)" : "var(--ok-soft)",
          color: hasIssue ? "var(--warn)" : "var(--ok)",
        }}>
          {hasIssue ? <I.Warn size={14}/> : <I.Check size={15} sw={2.4}/>}
        </div>
        <h2 style={{margin:0, font:"700 15px/1.2 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
          AI 審核摘要
        </h2>
        <span style={{flex:1}}/>
        <span style={{font:"400 11.5px/1.4 'Noto Sans TC'", color:"var(--ink-4)"}}>
          模型 v2.1 · {new Date().toLocaleDateString("zh-TW", {month:"2-digit", day:"2-digit"})} 產生
        </span>
      </div>

      <div style={{padding:"18px 20px 20px", display:"flex", gap:24, alignItems:"stretch"}}>
        {/* 分數 */}
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"0 18px 0 0", borderRight:"1px solid var(--line-2)", minWidth:120}}>
          <ScoreCircle pct={passRate} color={scoreColor}/>
          <div style={{marginTop:10, font:"500 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".06em"}}>
            AI 通過率
          </div>
        </div>

        {/* 統計 */}
        <div style={{display:"flex", flexDirection:"column", gap:14, paddingRight:16, minWidth:160}}>
          <StatBlock label="通過題數" value={`${passQ}/${totalQ}`} sub={`不通過 ${failQ} 題`}
            color={hasIssue?"var(--ink)":"var(--ok)"}/>
          <StatBlock label="比對差異" value={diff} unit="項" sub={`否定 ${negation} 項・低信心 ${lowConf} 項`}
            color={diff>0?"var(--danger)":"var(--ink-3)"}/>
        </div>

        {/* 摘要文字 */}
        <div style={{flex:1, padding:"10px 14px", borderRadius:8,
          background:"var(--primary-soft-2)", border:"1px solid var(--line-2)",
          font:"400 13.5px/1.7 'Noto Sans TC'", color:"var(--ink-2)", letterSpacing:".02em"}}>
          <div style={{
            font:"600 11px/1 'Noto Sans TC'", color:"var(--primary)",
            letterSpacing:".08em", marginBottom:8,
            display:"flex", alignItems:"center", gap:5,
          }}>
            <I.Info size={11} stroke="var(--primary)"/>
            AI 分析結論
          </div>
          {aiSummary}
        </div>
      </div>
    </section>
  );
}

function ScoreCircle({ pct, color }) {
  const r = 38, c = 2*Math.PI*r;
  const offset = c * (1 - pct/100);
  return (
    <div style={{position:"relative", width:96, height:96}}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{transform:"rotate(-90deg)"}}>
        <circle cx={48} cy={48} r={r} stroke="var(--line-2)" strokeWidth={6} fill="none"/>
        <circle cx={48} cy={48} r={r} stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .6s ease"}}/>
      </svg>
      <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
        <div style={{display:"flex", alignItems:"baseline", gap:1}}>
          <span className="ff-mont tabular" style={{font:"700 26px/1 Montserrat", color}}>{pct}</span>
          <span style={{font:"500 13px/1 Montserrat", color}}>%</span>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, unit, sub, color }) {
  return (
    <div>
      <div style={{font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".08em", marginBottom:6}}>
        {label}
      </div>
      <div style={{display:"flex", alignItems:"baseline", gap:3, marginBottom:4}}>
        <span className="ff-mont tabular" style={{font:"700 22px/1 Montserrat", color}}>
          {value}
        </span>
        {unit && (
          <span style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".04em"}}>
            {unit}
          </span>
        )}
      </div>
      <div style={{font:"400 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)"}}>{sub}</div>
    </div>
  );
}

// ─── 比對表格 ───
function ComparisonTable({ detail, getSpeaker }) {
  return (
    <section className="card" style={{padding:0, overflow:"hidden"}}>
      <div style={{
        padding:"12px 20px",
        borderBottom:"1px solid var(--line-2)",
        display:"flex", alignItems:"center", gap:8,
        background:"var(--primary-soft-2)",
      }}>
        <I.Hash size={14} stroke="var(--primary)"/>
        <h3 style={{margin:0, font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
          題目逐項比對
        </h3>
        <span style={{font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:6}}>
          共 {detail.questions.length} 題
        </span>
      </div>

      {/* 表頭 */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"56px minmax(0, 1.05fr) minmax(0, 1.4fr) minmax(0, 1.05fr)",
        background:"#fff",
        borderBottom:"1px solid var(--line)",
        font:"600 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em",
      }}>
        <div style={{padding:"10px 12px", textAlign:"center"}}>題號</div>
        <div style={{padding:"10px 16px", borderLeft:"1px solid var(--line-2)"}}>題目文稿</div>
        <div style={{padding:"10px 16px", borderLeft:"1px solid var(--line-2)"}}>逐字稿內容</div>
        <div style={{padding:"10px 16px", borderLeft:"1px solid var(--line-2)"}}>AI 判斷</div>
      </div>

      {/* 表身 */}
      {detail.questions.map((q, i) => (
        <ComparisonRow key={q.no} q={q} odd={i%2===1} getSpeaker={getSpeaker}/>
      ))}
    </section>
  );
}

function ComparisonRow({ q, odd, getSpeaker }) {
  const pass = q.status === "ok";
  const ai = getAiJudgement(q);

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"56px minmax(0, 1.05fr) minmax(0, 1.4fr) minmax(0, 1.05fr)",
      borderBottom:"1px solid var(--line-2)",
      background: odd ? "var(--primary-bg)" : "#fff",
    }}>
      {/* 題號 — 僅顯示編號 */}
      <div style={{padding:"16px 8px", textAlign:"center", borderRight:"1px solid var(--line-2)",
        display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div className="ff-mont tabular" style={{
          font:"700 14px/1 Montserrat",
          color: pass ? "var(--ink-2)" : "var(--danger)",
        }}>
          Q{q.no.toString().padStart(2,"0")}
        </div>
      </div>

      {/* 題目文稿 */}
      <div style={{padding:"16px 18px", borderRight:"1px solid var(--line-2)"}}>
        <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
          <span style={{font:"600 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{q.title}</span>
          <span style={{
            padding:"1px 6px", borderRadius:4,
            background: q.type==="tts" ? "rgba(123,109,235,.12)" : "var(--primary-soft)",
            color: q.type==="tts" ? "rgb(123,109,235)" : "var(--primary)",
            font:"500 10.5px/1.4 'Noto Sans TC'",
          }}>{q.type==="tts" ? "自動播稿" : "業務員自錄"}</span>
        </div>
        <div style={{
          font:"400 12.5px/1.7 'Noto Sans TC'", color:"var(--ink-2)",
          textWrap:"pretty",
        }}>
          {q.originalScript}
        </div>
      </div>

      {/* 逐字稿 */}
      <div style={{padding:"14px 16px", borderRight:"1px solid var(--line-2)",
        display:"flex", flexDirection:"column", gap:8}}>
        {q.segments.map((seg, i) => (
          <TranscriptSegment key={i} seg={seg} getSpeaker={getSpeaker}/>
        ))}
      </div>

      {/* AI 判斷 — 去框版，讓 LLM 分析註解以文本為主 */}
      <div style={{padding:"16px 18px"}}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          padding:"3px 10px 3px 6px", borderRadius:11,
          background: pass ? "var(--ok-soft)" : "var(--danger-soft)",
          color: pass ? "var(--ok)" : "var(--danger)",
          font:"600 12px/1 'Noto Sans TC'", letterSpacing:".04em",
          marginBottom:8,
        }}>
          <span style={{
            width:14, height:14, borderRadius:"50%",
            background: pass ? "var(--ok)" : "var(--danger)",
            color:"#fff", display:"inline-grid", placeItems:"center",
          }}>
            {pass ? <I.Check size={9} sw={3} stroke="#fff"/> : <I.X size={8} sw={3} stroke="#fff"/>}
          </span>
          {pass ? "通過" : "不通過"}
        </div>

        <div style={{
          font:"400 12.5px/1.7 'Noto Sans TC'", color:"var(--ink-2)",
          textWrap:"pretty",
        }}>
          {ai.note}
        </div>
      </div>
    </div>
  );
}

// 逐字稿單一片段（表格內使用 — 不含播放/時長，語者以 A/B/C 顯示）
function TranscriptSegment({ seg, getSpeaker }) {
  const sp = getSpeaker(seg.speaker);
  const lowConf = seg.confidence < 0.6;

  return (
    <div style={{display:"flex", gap:8, alignItems:"flex-start"}}>
      <SpeakerChip speakerMeta={sp}/>
      <div style={{flex:1, minWidth:0,
        font:"400 12.5px/1.7 'Noto Sans TC'", color:"var(--ink)", textWrap:"pretty"}}>
        {seg.asr}
        {lowConf && (
          <span title={`STT 信心 ${Math.round(seg.confidence*100)}%`}
            style={{
              marginLeft:5, padding:"0 5px", borderRadius:3,
              background:"rgba(241,160,40,.16)", color:"rgb(151,89,15)",
              font:"600 10px/1.4 'Noto Sans TC'", letterSpacing:".04em",
              display:"inline-block",
            }}>低信心</span>
        )}
      </div>
    </div>
  );
}

// 從 question 推導 AI 判斷與註解
function getAiJudgement(q) {
  if (q.status === "ok") {
    return { pass: true, note: "原稿與 STT 結果一致，未偵測到差異或語意問題，可直接通過。" };
  }
  const flags = new Set(q.segments.flatMap(s => s.flags || []));
  const parts = [];
  if (flags.has("negation")) {
    parts.push("客戶回應出現「應該」、「沒有吧」等不明確或否定語意，建議重新詢問取得明確答覆");
  }
  if (flags.has("diff")) {
    parts.push("業務員宣讀內容與原文稿有多處出入，請確認是否影響告知效力");
  }
  if (flags.has("low")) {
    parts.push("部分段落 STT 辨識信心偏低，建議複聽原始音檔確認");
  }
  if (parts.length === 0) {
    parts.push("此題依風險規則被標記，建議人工複核");
  }
  return { pass: false, note: parts.join("；") + "。" };
}

// ════════════════════════════════════════════════════════════════════════════
// 逐字稿 Tab
// ════════════════════════════════════════════════════════════════════════════
// 連續對話原稿：所有 segment 攤平、依時間排序，時間戳記前置，語者以 A/B/C 呈現
function TranscriptView({ detail }) {
  const getSpeaker = React.useMemo(() => makeSpeakerMap(detail), [detail]);

  const lines = React.useMemo(() => {
    const arr = [];
    detail.questions.forEach(q => (q.segments || []).forEach(s => arr.push(s)));
    arr.sort((a, b) => a.startSec - b.startSec);
    return arr;
  }, [detail]);

  // 出現的語者（給 legend 用）
  const speakers = React.useMemo(() => {
    const set = new Set();
    const out = [];
    lines.forEach(s => {
      const sp = getSpeaker(s.speaker);
      if (!set.has(sp.letter)) { set.add(sp.letter); out.push(sp); }
    });
    return out;
  }, [lines, getSpeaker]);

  return (
    <section className="card" style={{padding:0, overflow:"hidden"}}>
      <div style={{
        padding:"12px 20px",
        borderBottom:"1px solid var(--line-2)",
        display:"flex", alignItems:"center", gap:8,
        background:"var(--primary-soft-2)",
      }}>
        <I.Script size={14} stroke="var(--primary)"/>
        <h3 style={{margin:0, font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
          STT 逐字稿
        </h3>
        <span style={{font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:6}}>
          語者分群辨識
        </span>
        <span style={{flex:1}}/>
        <span style={{display:"inline-flex", alignItems:"center", gap:8,
          font:"400 11.5px/1.4 'Noto Sans TC'", color:"var(--ink-4)"}}>
          <span style={{letterSpacing:".06em"}}>語者</span>
          {speakers.map(sp => <SpeakerChip key={sp.letter} speakerMeta={sp}/>)}
        </span>
      </div>

      <div style={{padding:"18px 24px 22px", display:"flex", flexDirection:"column", gap:10}}>
        {lines.map((seg, i) => (
          <TranscriptLine key={i} seg={seg} getSpeaker={getSpeaker}/>
        ))}
      </div>
    </section>
  );
}

function TranscriptLine({ seg, getSpeaker }) {
  const sp = getSpeaker(seg.speaker);
  const lowConf = seg.confidence !== undefined && seg.confidence < 0.6;

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"56px 22px 1fr", gap:12, alignItems:"flex-start",
    }}>
      {/* 時間戳記（最前） */}
      <span className="ff-mont tabular" style={{
        font:"500 12px/1.7 Montserrat", color:"var(--ink-4)", paddingTop:2,
      }}>
        {fmtDur(seg.startSec)}
      </span>

      {/* 語者 chip */}
      <span style={{paddingTop:1}}>
        <SpeakerChip speakerMeta={sp}/>
      </span>

      {/* 逐字稿內容 */}
      <div style={{font:"400 13.5px/1.75 'Noto Sans TC'", color:"var(--ink)", textWrap:"pretty"}}>
        {seg.asr}
        {lowConf && (
          <span title={`STT 信心 ${Math.round(seg.confidence*100)}%`}
            style={{
              marginLeft:6, padding:"0 6px", borderRadius:3,
              background:"rgba(241,160,40,.16)", color:"rgb(151,89,15)",
              font:"600 10.5px/1.4 'Noto Sans TC'", letterSpacing:".04em",
              display:"inline-block", verticalAlign:1,
            }}>低信心</span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 左：案件資訊摘要
// ════════════════════════════════════════════════════════════════════════════
// ─── 分題錄音檔列表（錄音檔 Tab）─────────────────────────────
function RecordingView({ detail, currentSec, setCurrentSec, playing, setPlaying }) {
  const playSegment = (startSec) => {
    setCurrentSec(startSec);
    setPlaying(true);
  };

  return (
    <section className="card" style={{padding:0, overflow:"hidden"}}>
      <div style={{
        padding:"12px 20px",
        borderBottom:"1px solid var(--line-2)",
        display:"flex", alignItems:"center", gap:8,
        background:"var(--primary-soft-2)",
      }}>
        <I.Wave size={14} stroke="var(--primary)"/>
        <h3 style={{margin:0, font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
          分題錄音檔
        </h3>
        <span style={{font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:6, whiteSpace:"nowrap"}}>
          共 {detail.questions.length} 題・完整音檔總長 {fmtDur(detail.totalDuration)}
        </span>
      </div>

      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"#fff", borderBottom:"1px solid var(--line)"}}>
            <th style={{...recTh, width:60}}>題號</th>
            <th style={{...recTh, width:100}}>類型</th>
            <th style={recTh}>題目</th>
            <th style={{...recTh, width:100}}>狀態</th>
            <th style={{...recTh, width:90, textAlign:"right"}}>時長</th>
            <th style={{...recTh, width:110, textAlign:"right"}}>操作</th>
          </tr>
        </thead>
        <tbody>
          {detail.questions.map((q, i) => {
            const dur = (q.endSec || 0) - (q.startSec || 0);
            const isPlaying = playing && currentSec >= q.startSec && currentSec < q.endSec;
            return (
              <tr key={q.no} style={{
                borderBottom:"1px solid var(--line-2)",
                background: isPlaying ? "rgba(73,99,250,.05)" : (i%2===1 ? "var(--primary-bg)" : "#fff"),
                transition:"background .15s",
              }}>
                <td style={{...recTd, font:"600 13px/1 Montserrat", color:"var(--primary)"}} className="tabular">
                  Q{q.no.toString().padStart(2,"0")}
                </td>
                <td style={recTd}>
                  <span className="tag" style={{
                    background: q.type === "tts" ? "rgba(123,109,235,.12)" : "var(--primary-soft)",
                    color: q.type === "tts" ? "rgb(123,109,235)" : "var(--primary)",
                  }}>
                    {q.type === "tts" ? "自動播稿" : "業務員自錄"}
                  </span>
                </td>
                <td style={recTd}>
                  <div style={{font:"500 13.5px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{q.title}</div>
                </td>
                <td style={recTd}>
                  <span style={{display:"inline-flex", alignItems:"center", gap:6,
                    padding:"4px 10px", borderRadius:12, whiteSpace:"nowrap",
                    background:"var(--ok-soft)", color:"var(--ok)",
                    font:"500 12px/1 'Noto Sans TC'"}}>
                    <Dot color="var(--ok)"/> 已錄音
                  </span>
                </td>
                <td style={{...recTd, textAlign:"right",
                  font:"500 13px/1 Montserrat", color:"var(--ink-2)"}} className="tabular ff-mont">
                  {fmtDur(dur)}
                </td>
                <td style={{...recTd, textAlign:"right"}}>
                  <button onClick={()=>playSegment(q.startSec)}
                    className="btn btn-quiet btn-sm"
                    style={{padding:"0 10px", gap:5}}>
                    {isPlaying ? <I.Pause size={11}/> : <I.Play size={11}/>}
                    {isPlaying ? "播放中" : "播放"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const recTh = {
  padding:"12px 16px", textAlign:"left",
  font:"600 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".08em", whiteSpace:"nowrap",
};
const recTd = {
  padding:"14px 16px", verticalAlign:"middle",
};

function CaseInfoCompact({ caseInfo, overrideKeys = [] }) {
  const subjects = window.__MLI_uniqueSubjects(caseInfo);
  const isOverridden = (k) => overrideKeys.includes(k);
  return (
    <section className="card" style={{padding:"14px 16px"}}>
      <div style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", marginBottom:12,
        display:"flex", alignItems:"center", gap:6}}>
        <I.Folder size={12} stroke="var(--ink-3)"/>
        案件資訊
      </div>

      {/* Subjects compact */}
      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:14,
        paddingBottom:12, borderBottom:"1px dashed var(--line-2)"}}>
        {subjects.map((s, i) => (
          <div key={i} style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:24, height:24, borderRadius:"50%", background:"var(--primary-soft)",
              display:"grid", placeItems:"center", flexShrink:0}}>
              <I.User size={13} stroke="var(--primary)"/>
            </div>
            <span style={{font:"600 13.5px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>{s.name}</span>
            <span style={{font:"400 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)"}}>{s.age} 歲</span>
            <span style={{display:"flex", gap:3, marginLeft:"auto"}}>
              {s.roles.map(r => (
                <span key={r} style={{
                  width:18, height:18, borderRadius:4, display:"inline-grid", placeItems:"center",
                  background:"var(--primary-soft)", color:"var(--primary)",
                  font:"600 11px/1 'Noto Sans TC'",
                }}>{r}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {/* Compact key-value */}
      <div style={{display:"flex", flexDirection:"column", gap:7, font:"400 12px/1.4 'Noto Sans TC'"}}>
        <KV label="商品" value={caseInfo.product} edited={isOverridden("product")}/>
        <KV label="保單號" value={caseInfo.policyNo || "待核發"} mono={!!caseInfo.policyNo} edited={isOverridden("policyNo")}/>
        <KV label="業務員" value={`${caseInfo.agent} ${caseInfo.agentId}`}/>
        <KV label="通訊處" value={caseInfo.branch}/>
        <KV label="送審時間" value={caseInfo.updatedAt} mono/>
        {caseInfo.note && (
          <KV label="備註" value={caseInfo.note} edited={isOverridden("note")}/>
        )}
      </div>

      {/* 退回原因（如果有） */}
      {caseInfo.status === "returned" && caseInfo.note && (
        <div style={{marginTop:12, padding:"10px 12px", borderRadius:8,
          background:"var(--danger-soft)", border:"1px solid rgba(234,82,82,.2)",
          font:"400 12px/1.55 'Noto Sans TC'", color:"var(--ink-2)"}}>
          <div style={{font:"600 11px/1 'Noto Sans TC'", color:"var(--danger)", letterSpacing:".06em", marginBottom:5}}>
            <I.Warn size={11} stroke="var(--danger)" style={{verticalAlign:-1, marginRight:4}}/>
            退回原因
          </div>
          {caseInfo.note}
        </div>
      )}
    </section>
  );
}

function KV({ label, value, mono, edited }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
      <span style={{color:"var(--ink-4)", flexShrink:0,
        display:"inline-flex", alignItems:"center", gap:4}}>
        {label}
        {edited && (
          <span title="內勤已修改" style={{
            display:"inline-flex", alignItems:"center", gap:3,
            padding:"1px 5px", borderRadius:8,
            background:"rgba(241,160,40,.16)", color:"rgb(151,89,15)",
            font:"600 9.5px/1.2 'Noto Sans TC'", letterSpacing:".04em",
          }}>已改</span>
        )}
      </span>
      <span className={mono?"tabular ff-mont":""} style={{color:"var(--ink-2)", textAlign:"right",
        font: mono?"500 12px/1.4 Montserrat":undefined, wordBreak:"break-all"}}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 左：音檔播放器（簡化版 — 移除章節色塊，章節已併入比對表）
// ════════════════════════════════════════════════════════════════════════════
function AudioPlayerAdmin({ caseInfo, detail, currentSec, setCurrentSec, playing, setPlaying, speed, setSpeed }) {
  const total = detail.totalDuration;
  const progress = currentSec / total;

  return (
    <section className="card" style={{padding:"14px 16px"}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
        <I.Headset size={14} stroke="var(--primary)"/>
        <span style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em"}}>完整音檔</span>
        <span style={{flex:1}}/>
        <span className="ff-mont tabular" style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)"}}>
          {fmtDur(currentSec)} / {fmtDur(total)}
        </span>
      </div>

      {/* Waveform */}
      <div style={{
        position:"relative", padding:"10px 8px 4px",
        borderRadius:8, background:"var(--primary-bg)", border:"1px solid var(--line-2)",
        marginBottom:10,
      }}>
        <StaticWaveform progress={progress} bars={60} height={42}
          color="var(--primary)" muted="var(--line-3)"/>

        {/* Scrubber */}
        <input type="range" className="rng" min={0} max={total} step={1}
          value={currentSec} onChange={e=>setCurrentSec(parseInt(e.target.value))}
          style={{marginTop:6}}/>
      </div>

      {/* Playback controls */}
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <button onClick={()=>setCurrentSec(s=>Math.max(0,s-5))}
          className="btn btn-quiet btn-sm" style={{padding:"0 8px", height:32}}>
          <span className="ff-mont" style={{font:"600 10.5px/1 Montserrat"}}>-5s</span>
        </button>
        <button onClick={()=>setPlaying(p=>!p)} style={{
          width:42, height:42, borderRadius:"50%", background:"var(--primary)", color:"#fff",
          display:"grid", placeItems:"center", cursor:"pointer",
          boxShadow:"0 2px 8px rgba(73,99,250,.3)", border:"none",
        }}>
          {playing ? <I.Pause size={18} stroke="#fff"/> : <I.Play size={18} stroke="#fff"/>}
        </button>
        <button onClick={()=>setCurrentSec(s=>Math.min(total,s+5))}
          className="btn btn-quiet btn-sm" style={{padding:"0 8px", height:32}}>
          <span className="ff-mont" style={{font:"600 10.5px/1 Montserrat"}}>+5s</span>
        </button>
        <span style={{flex:1}}/>
        <span style={{font:"400 11px/1 'Noto Sans TC'", color:"var(--ink-4)"}}>速度</span>
        <select value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))}
          className="input" style={{height:30, padding:"0 6px", font:"500 11px/1 Montserrat", width:64, fontSize:11}}>
          <option value="0.5">0.5×</option>
          <option value="0.75">0.75×</option>
          <option value="1">1.0×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2.0×</option>
        </select>
      </div>

      <div style={{marginTop:8, display:"flex", alignItems:"center", gap:6,
        font:"400 11px/1.3 'Noto Sans TC'", color:"var(--ink-4)"}}>
        <I.Doc size={11} stroke="var(--ink-4)"/>
        <span className="ff-mont tabular" style={{fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
          {detail.audioFile}
        </span>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Modals（保留原有完整功能）
// ════════════════════════════════════════════════════════════════════════════
function ReturnModal({ caseInfo, detail, onCancel, onConfirm }) {
  const [reasonType, setReasonType] = React.useState("audio_quality");
  const [text, setText] = React.useState("");
  const failedQ = detail.questions.filter(q => q.status !== "ok").map(q => q.no);
  const [selectedQs, setSelectedQs] = React.useState(new Set(failedQ.length ? failedQ : [detail.questions[0]?.no]));
  const [notify, setNotify] = React.useState(true);

  const presets = {
    audio_quality:  "音檔不清晰或有雜訊干擾，請重新錄製",
    incomplete:     "錄音內容缺漏，請補錄缺失題目",
    negation:       "客戶回應未明確（出現否定語意或模糊回應），請重新詢問並錄製明確答覆",
    script_mismatch:"宣讀內容與原稿差異過大，請依原稿重新宣讀",
    other:          "",
  };

  React.useEffect(() => { setText(presets[reasonType]); }, [reasonType]);

  const toggleQ = (no) => setSelectedQs(s => { const ns = new Set(s); if (ns.has(no)) ns.delete(no); else ns.add(no); return ns; });

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:0, width:620, maxHeight:"85vh", display:"flex", flexDirection:"column"}}>
        <div style={{padding:"22px 28px 16px", borderBottom:"1px solid var(--line-2)",
          display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--danger-soft)", color:"var(--danger)",
            display:"grid", placeItems:"center"}}><I.Replay size={18}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>退回補正</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              退回後系統將自動通知業務員 {caseInfo.agent}（{caseInfo.agentId}）
            </p>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{padding:"18px 28px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:16}}>
          <div>
            <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:8, letterSpacing:".04em"}}>退回原因類別</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:6}}>
              {[
                {v:"audio_quality", l:"音檔不清晰"},
                {v:"incomplete",    l:"錄音缺漏"},
                {v:"negation",      l:"客戶回應未明確"},
                {v:"script_mismatch",l:"與原稿差異過大"},
                {v:"other",         l:"其他"},
              ].map(o => {
                const a = reasonType === o.v;
                return (
                  <button key={o.v} onClick={()=>setReasonType(o.v)} style={{
                    padding:"8px 10px", borderRadius:7,
                    background: a ? "var(--primary-soft)" : "#fff",
                    border:`1px solid ${a?"var(--primary)":"var(--line)"}`,
                    color: a ? "var(--primary)" : "var(--ink-2)",
                    font:"500 12.5px/1 'Noto Sans TC'", cursor:"pointer", textAlign:"left",
                  }}>{o.l}</button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:8, letterSpacing:".04em"}}>需重錄的題目（可複選）</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap", padding:"8px 10px", borderRadius:7,
              background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
              {detail.questions.map(q => {
                const a = selectedQs.has(q.no);
                const high = q.status === "high";
                return (
                  <button key={q.no} onClick={()=>toggleQ(q.no)} style={{
                    padding:"4px 9px", borderRadius:12,
                    background: a ? (high?"var(--danger-soft)":"var(--primary-soft)") : "#fff",
                    border:`1px solid ${a ? (high?"var(--danger)":"var(--primary)") : "var(--line)"}`,
                    color: a ? (high?"var(--danger)":"var(--primary)") : "var(--ink-2)",
                    font:"500 12px/1 'Noto Sans TC'", cursor:"pointer",
                    display:"inline-flex", alignItems:"center", gap:4,
                  }}>
                    Q{q.no.toString().padStart(2,"0")}
                    {high && <Dot color="var(--danger)" size={5}/>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{display:"flex", alignItems:"baseline", marginBottom:8}}>
              <span style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em"}}>退回說明（將通知業務員）</span>
              <span className="meta" style={{marginLeft:"auto"}}>{text.length}/300</span>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)} maxLength={300}
              placeholder="請說明退回原因，業務員會看到此訊息"
              style={{
                width:"100%", minHeight:90, resize:"vertical",
                padding:"10px 14px", borderRadius:8, border:"1px solid var(--line)",
                font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)",
                outline:"none",
              }}/>
          </div>

          <label style={{display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px",
            borderRadius:8, background:"var(--primary-bg)", cursor:"pointer"}}>
            <input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)}
              style={{accentColor:"var(--primary)", marginTop:2}}/>
            <div>
              <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink-2)"}}>
                同步以 Email 通知業務員
              </div>
              <div className="meta" style={{marginTop:3}}>
                寄送至 {caseInfo.agent} 的 AD 帳號信箱，並於建議書 APP 推播提醒
              </div>
            </div>
          </label>
        </div>

        <div style={{padding:"16px 28px", borderTop:"1px solid var(--line-2)",
          display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <I.Replay size={14}/> 確認退回
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ caseInfo, detail, onCancel, onConfirm }) {
  const [generatePdf, setGeneratePdf] = React.useState(true);
  const [sendBpm, setSendBpm] = React.useState(true);
  const totalQ = detail.questions.length;
  const passQ  = detail.questions.filter(q => q.status === "ok").length;
  const hasIssue = passQ < totalQ;

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:0, width:520}}>
        <div style={{padding:"22px 28px 16px", borderBottom:"1px solid var(--line-2)",
          display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--ok-soft)", color:"var(--ok)",
            display:"grid", placeItems:"center"}}><I.Check size={20} sw={2.6}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>審核通過</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              通過後將自動送往 BPM 系統供核保流程使用
            </p>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{padding:"18px 28px", display:"flex", flexDirection:"column", gap:14}}>
          {hasIssue && (
            <div style={{padding:"10px 12px", borderRadius:8,
              background:"var(--warn-soft)", border:"1px solid rgba(241,160,40,.3)",
              display:"flex", gap:10, alignItems:"flex-start"}}>
              <I.Warn size={14} stroke="rgb(151,89,15)" style={{flexShrink:0, marginTop:2}}/>
              <div style={{font:"400 12px/1.55 'Noto Sans TC'", color:"rgb(151,89,15)"}}>
                AI 比對 {totalQ - passQ} 題不通過，請確認您已完整聽取相關段落並判定無實質問題。
              </div>
            </div>
          )}

          <div className="card" style={{padding:"10px 14px", background:"var(--primary-bg)", border:"1px solid var(--line-2)",
            display:"flex", flexDirection:"column", gap:6, font:"400 12.5px/1.5 'Noto Sans TC'"}}>
            <KV label="錄音編號" value={caseInfo.recordingNo} mono/>
            <KV label="商品" value={caseInfo.product}/>
            <KV label="要保人/被保險人" value={`${caseInfo.proposer} / ${caseInfo.insured}`}/>
            <KV label="AI 通過率" value={`${Math.round(passQ/totalQ*100)}% (${passQ}/${totalQ})`}/>
          </div>

          <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}>
            <input type="checkbox" checked={generatePdf} onChange={e=>setGeneratePdf(e.target.checked)}
              style={{accentColor:"var(--primary)"}}/>
            <div style={{flex:1}}>
              <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>產生 STT 比對報告 PDF</div>
              <div className="meta" style={{marginTop:2}}>含逐字稿與原稿並排對照</div>
            </div>
          </label>
          <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}>
            <input type="checkbox" checked={sendBpm} onChange={e=>setSendBpm(e.target.checked)}
              style={{accentColor:"var(--primary)"}}/>
            <div style={{flex:1}}>
              <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>送出至 BPM 影像系統</div>
              <div className="meta" style={{marginTop:2}}>觸發後續核保流程</div>
            </div>
          </label>
        </div>

        <div style={{padding:"16px 28px", borderTop:"1px solid var(--line-2)",
          display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            <I.Check size={14}/> 確認通過
          </button>
        </div>
      </div>
    </div>
  );
}

function RetriggerSttModal({ onCancel }) {
  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:28, width:440}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
          <I.Replay size={22} stroke="var(--primary)"/>
          <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>重新觸發 STT 比對</h3>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>
        <p style={{margin:0, font:"400 13px/1.65 'Noto Sans TC'", color:"var(--ink-2)"}}>
          將重新將完整音檔送至 STT 引擎，產生新的比對報告。<br/>
          原比對報告將被覆寫，舊版本可在「版本歷程」中查看。
        </p>
        <div style={{padding:"10px 14px", borderRadius:8, background:"var(--primary-bg)",
          margin:"14px 0", font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)"}}>
          <I.Clock size={12} stroke="var(--ink-4)" style={{verticalAlign:-1, marginRight:4}}/>
          預估處理時間：3–5 分鐘
        </div>
        <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={onCancel}><I.Replay size={13}/> 確認重跑</button>
        </div>
      </div>
    </div>
  );
}

function RemergeModal({ caseInfo, onCancel }) {
  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:28, width:480}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
          <I.Wave size={22} stroke="var(--primary)"/>
          <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>重新合併分段音檔</h3>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>
        <p style={{margin:0, font:"400 13px/1.65 'Noto Sans TC'", color:"var(--ink-2)"}}>
          將重新合併本案件分題上傳的分段音檔，產生新版完整音檔。
        </p>
        <div style={{padding:"10px 14px", borderRadius:8, background:"var(--warn-soft)",
          margin:"14px 0", font:"400 12px/1.55 'Noto Sans TC'", color:"rgb(151,89,15)"}}>
          <I.Warn size={12} stroke="rgb(151,89,15)" style={{verticalAlign:-1, marginRight:4}}/>
          此功能僅限「重新合併音檔」權限使用，操作將記錄於系統日誌
        </div>
        <div style={{padding:"10px 14px", borderRadius:8, background:"var(--primary-bg)",
          marginBottom:18, display:"flex", flexDirection:"column", gap:5, font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)"}}>
          <KV label="原合併音檔" value={`${caseInfo.recordingNo}_merged.wav`} mono/>
          <KV label="分段音檔數" value="14 段"/>
          <KV label="預估時間" value="約 30 秒"/>
        </div>
        <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={onCancel}><I.Wave size={13}/> 開始重新合併</button>
        </div>
      </div>
    </div>
  );
}

function DownloadModal({ caseInfo, onCancel }) {
  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:28, width:440}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
          <I.Doc size={22} stroke="var(--primary)"/>
          <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>下載檔案</h3>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>
        <p style={{margin:0, font:"400 12.5px/1.6 'Noto Sans TC'", color:"var(--ink-3)"}}>
          請選擇要下載的內容類型。所有下載操作將記錄於系統日誌。
        </p>
        <div style={{display:"flex", flexDirection:"column", gap:8, margin:"14px 0 18px"}}>
          {[
            {l:"完整音檔（WAV）",  d:`${caseInfo.recordingNo}_merged.wav · ${fmtDur(caseInfo.duration)}`},
            {l:"分段音檔（ZIP）",  d:"14 段分題音檔打包"},
            {l:"逐字稿（PDF）",    d:"STT 結果 + 原稿並排報告"},
            {l:"逐字稿（DOCX）",   d:"可編輯版本"},
          ].map((o,i) => (
            <button key={i} className="card" onClick={onCancel} style={{
              padding:"10px 14px", textAlign:"left", cursor:"pointer", border:"1px solid var(--line)",
              display:"flex", alignItems:"center", gap:10,
            }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--primary-soft-2)"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <I.Doc size={16} stroke="var(--primary)"/>
              <div style={{flex:1}}>
                <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{o.l}</div>
                <div className="meta" style={{marginTop:3}}>{o.d}</div>
              </div>
              <I.Upload size={13} stroke="var(--ink-4)" style={{transform:"rotate(180deg)"}}/>
            </button>
          ))}
        </div>
        <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UploadedAudioPlayer — 內勤補上傳的音檔，位於完整音檔下方
// 獨立播放器，與完整音檔互不干擾
// ════════════════════════════════════════════════════════════════════════════
function UploadedAudioPlayer({ audio, onRemove }) {
  const [playing, setPlaying] = React.useState(false);
  const [currentSec, setCurrentSec] = React.useState(0);
  const [speed, setSpeed] = React.useState(1.0);
  const total = audio.durationSec || 0;
  const progress = total > 0 ? currentSec / total : 0;

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentSec(s => {
        const next = s + 0.5 * speed;
        if (next >= total) { setPlaying(false); return total; }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  return (
    <section className="card" style={{
      padding:"14px 16px",
      borderColor:"rgba(123,109,235,.35)",
      background:"linear-gradient(180deg, rgba(123,109,235,.04), #fff 30%)",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
        <I.Upload size={14} stroke="rgb(123,109,235)"/>
        <span style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em"}}>
          上傳音檔
        </span>
        <span style={{
          padding:"1px 6px", borderRadius:8,
          background:"rgba(123,109,235,.14)", color:"rgb(123,109,235)",
          font:"600 9.5px/1.3 'Noto Sans TC'", letterSpacing:".04em",
        }}>內勤補件</span>
        <span style={{flex:1}}/>
        <button onClick={onRemove} title="移除已上傳音檔"
          className="btn btn-quiet btn-sm" style={{padding:"0 7px", height:24, color:"var(--ink-4)"}}>
          <I.X size={12}/>
        </button>
      </div>

      {/* Waveform + scrubber */}
      <div style={{
        position:"relative", padding:"10px 8px 4px",
        borderRadius:8, background:"rgba(123,109,235,.06)", border:"1px solid var(--line-2)",
        marginBottom:10,
      }}>
        <StaticWaveform progress={progress} bars={60} height={42}
          color="rgb(123,109,235)" muted="var(--line-3)"/>
        <input type="range" className="rng" min={0} max={total} step={1}
          value={currentSec} onChange={e=>setCurrentSec(parseInt(e.target.value))}
          style={{marginTop:6, accentColor:"rgb(123,109,235)"}}/>
      </div>

      {/* Controls */}
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <button onClick={()=>setCurrentSec(s=>Math.max(0,s-5))}
          className="btn btn-quiet btn-sm" style={{padding:"0 8px", height:32}}>
          <span className="ff-mont" style={{font:"600 10.5px/1 Montserrat"}}>-5s</span>
        </button>
        <button onClick={()=>setPlaying(p=>!p)} style={{
          width:42, height:42, borderRadius:"50%", background:"rgb(123,109,235)", color:"#fff",
          display:"grid", placeItems:"center", cursor:"pointer",
          boxShadow:"0 2px 8px rgba(123,109,235,.3)", border:"none",
        }}>
          {playing ? <I.Pause size={18} stroke="#fff"/> : <I.Play size={18} stroke="#fff"/>}
        </button>
        <button onClick={()=>setCurrentSec(s=>Math.min(total,s+5))}
          className="btn btn-quiet btn-sm" style={{padding:"0 8px", height:32}}>
          <span className="ff-mont" style={{font:"600 10.5px/1 Montserrat"}}>+5s</span>
        </button>
        <span style={{flex:1}}/>
        <span className="ff-mont tabular" style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)"}}>
          {fmtDur(currentSec)} / {fmtDur(total)}
        </span>
        <select value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))}
          className="input" style={{height:30, padding:"0 6px", font:"500 11px/1 Montserrat", width:64, fontSize:11}}>
          <option value="0.5">0.5×</option>
          <option value="0.75">0.75×</option>
          <option value="1">1.0×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2.0×</option>
        </select>
      </div>

      {/* File info */}
      <div style={{marginTop:8, display:"flex", alignItems:"center", gap:6,
        font:"400 11px/1.3 'Noto Sans TC'", color:"var(--ink-4)"}}>
        <I.Doc size={11} stroke="var(--ink-4)"/>
        <span className="ff-mont tabular" style={{fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>
          {audio.name}
        </span>
        <span style={{whiteSpace:"nowrap"}}>{audio.sizeKB ? `${(audio.sizeKB/1024).toFixed(1)} MB` : ""}</span>
        <span>·</span>
        <span style={{whiteSpace:"nowrap"}}>{audio.uploadedAt}</span>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EditCaseModal — 修改案件資訊（草稿 / 審核中 才可使用）
// 允許修改：商品、保單號、案件備註（內勤註記）
// ════════════════════════════════════════════════════════════════════════════
function EditCaseModal({ caseInfo, overrides, onCancel, onConfirm }) {
  const [product,  setProduct]  = React.useState(caseInfo.product || "");
  const [policyNo, setPolicyNo] = React.useState(caseInfo.policyNo || "");
  const [note,     setNote]     = React.useState(caseInfo.note || "");

  const changed = (
    product  !== (caseInfo.product  || "") ||
    policyNo !== (caseInfo.policyNo || "") ||
    note     !== (caseInfo.note     || "")
  );

  const handleSubmit = () => {
    const patch = {};
    if (product  !== caseInfo.product)  patch.product  = product;
    if (policyNo !== caseInfo.policyNo) patch.policyNo = policyNo;
    if (note     !== (caseInfo.note || "")) patch.note  = note;
    onConfirm(patch);
  };

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:0, width:560, maxHeight:"85vh", display:"flex", flexDirection:"column"}}>
        <div style={{padding:"22px 28px 16px", borderBottom:"1px solid var(--line-2)",
          display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--primary-soft)", color:"var(--primary)",
            display:"grid", placeItems:"center"}}><I.Settings size={18}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>修改案件資訊</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              修改紀錄將同步至業務員端，並於系統日誌留存
            </p>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{padding:"20px 28px", display:"flex", flexDirection:"column", gap:16, overflowY:"auto"}}>
          {/* 唯讀資訊 */}
          <div className="card" style={{padding:"10px 14px", background:"var(--primary-bg)", border:"1px solid var(--line-2)",
            display:"flex", flexDirection:"column", gap:5, font:"400 12px/1.5 'Noto Sans TC'"}}>
            <KV label="錄音編號" value={caseInfo.recordingNo} mono/>
            <KV label="業務員"   value={`${caseInfo.agent} ${caseInfo.agentId}`}/>
            <KV label="通訊處"   value={caseInfo.branch}/>
          </div>

          {/* 可修改欄位 */}
          <Field label="商品名稱">
            <input type="text" value={product} onChange={e=>setProduct(e.target.value)}
              placeholder="輸入商品名稱" className="input"
              style={{width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid var(--line)",
                font:"500 13.5px/1.3 'Noto Sans TC'", color:"var(--ink)", outline:"none"}}/>
          </Field>

          <Field label="保單號碼" hint="保單核發後填入；可留空表示「待核發」">
            <input type="text" value={policyNo} onChange={e=>setPolicyNo(e.target.value.toUpperCase())}
              placeholder="例：MLI-2025-000123" className="input ff-mont"
              style={{width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid var(--line)",
                font:"500 13.5px/1.3 Montserrat", color:"var(--ink)", outline:"none", letterSpacing:".04em"}}/>
          </Field>

          <Field label="案件備註">
            <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={200}
              placeholder="內勤註記，例如：與業務確認補件方式、客戶聯絡情況等"
              style={{
                width:"100%", minHeight:80, resize:"vertical",
                padding:"10px 12px", borderRadius:8, border:"1px solid var(--line)",
                font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)", outline:"none",
              }}/>
            <div className="meta" style={{textAlign:"right", marginTop:4}}>{note.length}/200</div>
          </Field>
        </div>

        <div style={{padding:"16px 28px", borderTop:"1px solid var(--line-2)",
          display:"flex", gap:10, justifyContent:"flex-end", alignItems:"center"}}>
          <span className="meta" style={{marginRight:"auto"}}>
            {changed ? "有未儲存的變更" : "尚未修改任何欄位"}
          </span>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" disabled={!changed} onClick={handleSubmit}
            style={{opacity: changed ? 1 : .5, cursor: changed ? "pointer" : "not-allowed"}}>
            <I.Check size={14}/> 儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{display:"flex", alignItems:"baseline", marginBottom:6}}>
        <span style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em"}}>{label}</span>
        {hint && <span className="meta" style={{marginLeft:8}}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UploadAudioModal — 上傳音檔（草稿 / 審核中 才可使用）
// 內勤補件用，上傳完成後音檔顯示於右側「完整音檔」下方獨立區塊
// ════════════════════════════════════════════════════════════════════════════
function UploadAudioModal({ caseInfo, onCancel, onConfirm }) {
  const [stage, setStage] = React.useState("picking"); // picking | uploading | done
  const [file, setFile]   = React.useState(null);
  const [progress, setProgress] = React.useState(0);
  const [note, setNote]   = React.useState("");
  const fileRef = React.useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    setFile({
      name: f.name,
      sizeKB: Math.round(f.size / 1024),
      // 模擬：用檔案大小推估時長（實際應由後端解析）
      durationSec: Math.max(60, Math.min(900, Math.round(f.size / 16000))),
    });
  };

  const onPickClick = () => fileRef.current && fileRef.current.click();
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const doUpload = () => {
    if (!file) return;
    setStage("uploading");
    setProgress(0);
    const id = setInterval(() => {
      setProgress(p => {
        const next = p + 8 + Math.random() * 6;
        if (next >= 100) {
          clearInterval(id);
          setStage("done");
          return 100;
        }
        return next;
      });
    }, 180);
  };

  const finalize = () => {
    onConfirm({
      ...file,
      uploadedAt: new Date().toLocaleString("zh-TW", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }),
      note,
    });
  };

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:0, width:540}}>
        <div style={{padding:"22px 28px 16px", borderBottom:"1px solid var(--line-2)",
          display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--primary-soft)", color:"var(--primary)",
            display:"grid", placeItems:"center"}}><I.Upload size={18}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>上傳音檔</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              {stage === "done"
                ? "上傳完成，音檔已加入此案件"
                : "音檔將存於完整音檔下方獨立區塊，可單獨播放與下載"}
            </p>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{padding:"20px 28px", display:"flex", flexDirection:"column", gap:14}}>
          {stage === "picking" && !file && (
            <div onClick={onPickClick} onDragOver={e=>e.preventDefault()} onDrop={onDrop}
              style={{
                padding:"32px 20px", borderRadius:10, cursor:"pointer",
                border:"2px dashed var(--line)", background:"var(--primary-bg)",
                display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                transition:"all .15s",
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "var(--primary-soft-2)";
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.background = "var(--primary-bg)";
              }}>
              <div style={{width:46, height:46, borderRadius:"50%",
                background:"var(--primary-soft)", color:"var(--primary)",
                display:"grid", placeItems:"center"}}>
                <I.Upload size={22}/>
              </div>
              <div style={{font:"600 14px/1.4 'Noto Sans TC'", color:"var(--ink)"}}>
                點此選擇音檔，或拖曳到此區域
              </div>
              <div className="meta">支援 WAV / MP3 / M4A · 單檔上限 100 MB</div>
              <input ref={fileRef} type="file" accept="audio/*" hidden
                onChange={e=>pickFile(e.target.files[0])}/>
            </div>
          )}

          {stage === "picking" && file && (
            <>
              <div className="card" style={{
                padding:"12px 14px", background:"var(--primary-bg)", border:"1px solid var(--line-2)",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <div style={{width:38, height:38, borderRadius:8, background:"var(--primary-soft)",
                  display:"grid", placeItems:"center", color:"var(--primary)", flexShrink:0}}>
                  <I.Headset size={18}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="ff-mont" style={{font:"600 13px/1.3 Montserrat", color:"var(--ink)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{file.name}</div>
                  <div className="meta" style={{marginTop:3}}>
                    {(file.sizeKB/1024).toFixed(1)} MB · 預估 {fmtDur(file.durationSec)}
                  </div>
                </div>
                <button onClick={()=>setFile(null)} className="btn btn-quiet btn-sm"
                  style={{padding:"0 8px"}}><I.X size={12}/></button>
              </div>

              <Field label="上傳備註（選填）">
                <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={120}
                  placeholder="例：補錄客戶確認版本、補件音檔"
                  style={{
                    width:"100%", minHeight:64, resize:"vertical",
                    padding:"10px 12px", borderRadius:8, border:"1px solid var(--line)",
                    font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)", outline:"none",
                  }}/>
              </Field>
            </>
          )}

          {stage === "uploading" && (
            <div style={{padding:"20px 4px", display:"flex", flexDirection:"column", gap:14}}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <I.Upload size={16} stroke="var(--primary)"/>
                <div className="ff-mont" style={{font:"500 13px/1.3 Montserrat", color:"var(--ink)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>
                  {file.name}
                </div>
                <span className="ff-mont tabular" style={{font:"600 13px/1 Montserrat", color:"var(--primary)"}}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{height:6, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
                <div style={{height:"100%", width:`${progress}%`, background:"var(--primary)",
                  transition:"width .18s"}}/>
              </div>
              <div className="meta" style={{textAlign:"center"}}>上傳中，請勿關閉視窗…</div>
            </div>
          )}

          {stage === "done" && (
            <div style={{padding:"20px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
              <div style={{width:54, height:54, borderRadius:"50%", background:"var(--ok-soft)",
                display:"grid", placeItems:"center", color:"var(--ok)"}}>
                <I.Check size={26} sw={2.6}/>
              </div>
              <div style={{font:"700 15px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>上傳成功</div>
              <div className="meta" style={{textAlign:"center", maxWidth:340}}>
                音檔將顯示於右側「完整音檔」下方獨立的「上傳音檔」區塊，可單獨播放。
              </div>
            </div>
          )}
        </div>

        <div style={{padding:"16px 28px", borderTop:"1px solid var(--line-2)",
          display:"flex", gap:10, justifyContent:"flex-end"}}>
          {stage === "picking" && (
            <>
              <button className="btn btn-quiet" onClick={onCancel}>取消</button>
              <button className="btn btn-primary" disabled={!file} onClick={doUpload}
                style={{opacity: file ? 1 : .5, cursor: file ? "pointer" : "not-allowed"}}>
                <I.Upload size={13}/> 開始上傳
              </button>
            </>
          )}
          {stage === "uploading" && (
            <button className="btn btn-quiet" disabled style={{opacity:.5}}>上傳中…</button>
          )}
          {stage === "done" && (
            <button className="btn btn-primary" onClick={finalize}>
              <I.Check size={14}/> 完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DeleteCaseModal — 刪除案件（已通過案件不可用，由 ReviewActionsMenu 控制 disabled）
// 二段式確認：必須輸入錄音編號以避免誤操作
// ════════════════════════════════════════════════════════════════════════════
function DeleteCaseModal({ caseInfo, onCancel, onConfirm }) {
  const [confirmText, setConfirmText] = React.useState("");
  const canDelete = confirmText.trim() === caseInfo.recordingNo;

  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:0, width:480}}>
        <div style={{padding:"22px 28px 16px", borderBottom:"1px solid var(--line-2)",
          display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--danger-soft)", color:"var(--danger)",
            display:"grid", placeItems:"center"}}><I.Delete size={18}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>刪除案件</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              此操作不可復原，請審慎確認
            </p>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{padding:"20px 28px", display:"flex", flexDirection:"column", gap:14}}>
          <div style={{padding:"12px 14px", borderRadius:8,
            background:"var(--danger-soft)", border:"1px solid rgba(234,82,82,.2)",
            display:"flex", gap:10, alignItems:"flex-start"}}>
            <I.Warn size={16} stroke="var(--danger)" style={{flexShrink:0, marginTop:1}}/>
            <div style={{font:"400 12.5px/1.65 'Noto Sans TC'", color:"var(--ink-2)"}}>
              將永久刪除此案件、所有錄音與 STT 比對資料。<br/>
              業務員將同步收到刪除通知，相關紀錄保留於系統稽核日誌。
            </div>
          </div>

          <div className="card" style={{padding:"10px 14px", background:"var(--primary-bg)", border:"1px solid var(--line-2)",
            display:"flex", flexDirection:"column", gap:5, font:"400 12px/1.5 'Noto Sans TC'"}}>
            <KV label="錄音編號" value={caseInfo.recordingNo} mono/>
            <KV label="商品" value={caseInfo.product}/>
            <KV label="業務員" value={`${caseInfo.agent} ${caseInfo.agentId}`}/>
          </div>

          <Field label="請輸入錄音編號以確認刪除" hint={`需與 ${caseInfo.recordingNo} 完全一致`}>
            <input type="text" value={confirmText} onChange={e=>setConfirmText(e.target.value)}
              placeholder={caseInfo.recordingNo} className="input ff-mont"
              style={{width:"100%", padding:"10px 12px", borderRadius:8,
                border:`1px solid ${confirmText && !canDelete ? "var(--danger)" : "var(--line)"}`,
                font:"500 13.5px/1.3 Montserrat", color:"var(--ink)", outline:"none", letterSpacing:".04em"}}/>
          </Field>
        </div>

        <div style={{padding:"16px 28px", borderTop:"1px solid var(--line-2)",
          display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-danger" disabled={!canDelete} onClick={onConfirm}
            style={{opacity: canDelete ? 1 : .5, cursor: canDelete ? "pointer" : "not-allowed"}}>
            <I.Delete size={14}/> 確認刪除
          </button>
        </div>
      </div>
    </div>
  );
}

window.ReviewDetailScreen = ReviewDetailScreen;
