// RecordingScreen — main recording workspace
//
// Layout: header info bar | left = question list w/ progress | center = active question + recording surface | right = case sidebar
// State machine per question: pending | recording | recorded | skipped
//
// F-015-2 分題依序顯示 + F-015-3 業務員自錄 + F-015-4 自動播稿
// F-015-5/6 重錄確認 + 回放 + F-015-7 跳過/還原
// F-015-8 即時上傳

const STATUS_META = {
  pending:   { label: "未錄音", color: "var(--ink-4)",  bg: "var(--line-2)", chipBg:"#fff", chipBorder:"var(--line)" },
  recording: { label: "錄音中", color: "#fff",          bg: "var(--danger)", chipBg:"var(--danger)", chipBorder:"var(--danger)" },
  recorded:  { label: "已錄音", color: "var(--ok)",     bg: "var(--ok-soft)", chipBg:"var(--ok-soft)", chipBorder:"rgba(72,153,61,.3)" },
  skipped:   { label: "已跳過", color: "var(--ink-3)",  bg: "rgba(140,142,157,.15)", chipBg:"rgba(140,142,157,.15)", chipBorder:"rgba(140,142,157,.35)" },
  uploading: { label: "上傳中", color: "var(--primary)", bg: "var(--primary-soft)", chipBg:"var(--primary-soft)", chipBorder:"rgba(73,99,250,.3)" },
};

function StatusDot({ status, size = 22 }) {
  // Pending = hollow circle; recording = red pulsing; recorded = check; skipped = dash; uploading = spinner
  if (status === "pending") {
    return <div style={{
      width:size,height:size,borderRadius:"50%",
      border:"1.5px solid var(--line-3)",background:"#fff",
      display:"grid",placeItems:"center",
      font:"500 11px/1 Montserrat",color:"var(--ink-4)",
    }}/>
  }
  if (status === "recording") {
    return <div className="pulse" style={{
      width:size,height:size,borderRadius:"50%",
      background:"var(--danger)",display:"grid",placeItems:"center",
    }}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>
    </div>;
  }
  if (status === "recorded") {
    return <div style={{
      width:size,height:size,borderRadius:"50%",
      background:"var(--ok)",display:"grid",placeItems:"center",
    }}>
      <I.Check size={14} stroke="#fff" sw={3}/>
    </div>;
  }
  if (status === "skipped") {
    return <div style={{
      width:size,height:size,borderRadius:"50%",
      background:"rgba(140,142,157,.2)",border:"1.5px solid var(--ink-4)",
      display:"grid",placeItems:"center",
    }}>
      <span style={{width:10,height:2,background:"var(--ink-4)",borderRadius:1}}/>
    </div>;
  }
  if (status === "uploading") {
    return <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--primary-soft)" strokeWidth="2.5"/>
      <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>;
  }
  return null;
}

function fmtTime(s) {
  const m = Math.floor(s/60), r = Math.floor(s%60);
  return `${m.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`;
}

// ─────────────────────────────────────────────────────────────
// Question list (left rail)
// ─────────────────────────────────────────────────────────────
function QuestionList({ questions, active, onJump, tweaks }) {
  const total = questions.length;
  const recorded = questions.filter(q => q.status === "recorded").length;
  const skipped = questions.filter(q => q.status === "skipped").length;
  const pending = total - recorded - skipped;

  return (
    <aside className="card" style={{
      padding: "20px 0 12px",
      display:"flex", flexDirection:"column",
      width: 280, flexShrink: 0, alignSelf:"flex-start",
      position:"sticky", top: 20,
      maxHeight: "calc(100vh - 130px)",
    }}>
      {/* progress header */}
      <div style={{padding:"0 20px 18px", borderBottom:"1px solid var(--line-2)"}}>
        <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:10}}>
          <span style={{font:"700 14px/1 'Noto Sans TC'",color:"var(--ink)",letterSpacing:".04em"}}>題目進度</span>
          <span className="tabular ff-mont" style={{font:"600 14px/1 Montserrat",color:"var(--primary)"}}>
            {recorded + skipped} <span style={{color:"var(--ink-4)"}}>/ {total}</span>
          </span>
        </div>
        {/* progress bar */}
        <div style={{height:8,borderRadius:4,background:"var(--line-2)",overflow:"hidden",display:"flex"}}>
          <div style={{width:`${recorded/total*100}%`,background:"var(--ok)",transition:"width .3s"}}/>
          <div style={{width:`${skipped/total*100}%`,background:"rgba(140,142,157,.5)",transition:"width .3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,font:"400 11px/1 'Noto Sans TC'",color:"var(--ink-3)"}}>
          <span><span style={{color:"var(--ok)"}}>●</span> 已錄 {recorded}</span>
          <span><span style={{color:"var(--ink-4)"}}>●</span> 跳過 {skipped}</span>
          <span><span style={{color:"var(--line-3)"}}>●</span> 未錄 {pending}</span>
        </div>
      </div>

      {/* list */}
      <div style={{flex:1, overflowY:"auto", padding:"8px 8px 4px"}}>
        {questions.map((q) => {
          const isActive = q.no === active;
          return (
            <button key={q.no} onClick={()=>onJump(q.no)} style={{
              display:"flex", alignItems:"center", gap:12, width:"100%",
              padding: "10px 12px", borderRadius: 10,
              background: isActive ? "var(--primary-soft)" : "transparent",
              border: isActive ? "1px solid rgba(73,99,250,.25)" : "1px solid transparent",
              textAlign:"left", marginBottom: 2, cursor:"pointer", transition:"all .12s",
            }}
            onMouseEnter={(e)=>{if(!isActive) e.currentTarget.style.background="var(--primary-soft-2)"}}
            onMouseLeave={(e)=>{if(!isActive) e.currentTarget.style.background="transparent"}}>
              <StatusDot status={q.status}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <span className="tabular ff-mont" style={{font:"600 12px/1 Montserrat",color: isActive ? "var(--primary)":"var(--ink-3)"}}>
                    Q{q.no.toString().padStart(2,"0")}
                  </span>
                  <span style={{font:"400 10px/1 'Noto Sans TC'",color:"var(--ink-4)",letterSpacing:".06em"}}>
                    {q.type === "self" ? "自錄" : "播稿"}
                  </span>
                </div>
                <div style={{
                  font:"500 13px/1.35 'Noto Sans TC'",
                  color: isActive ? "var(--ink)" : "var(--ink-2)",
                  marginTop:3, overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap",
                  textDecoration: q.status === "skipped" ? "line-through" : "none",
                  textDecorationColor: "var(--ink-4)",
                }}>{q.title}</div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Active question card (center)
// ─────────────────────────────────────────────────────────────
function ActiveQuestionCard({ q, onUpdate, onPrev, onNext, hasNext, hasPrev, onConfirmRetake, onConfirmSkip, onUnskip, tts }) {
  // local play/elapsed simulation
  const [elapsed, setElapsed] = React.useState(q.duration || 0);
  const [playing, setPlaying] = React.useState(false);
  const [playPos, setPlayPos] = React.useState(0);

  // reset on q change
  React.useEffect(()=>{
    setElapsed(q.duration || 0);
    setPlaying(false);
    setPlayPos(0);
  }, [q.no]);

  // recording timer
  React.useEffect(() => {
    if (q.status !== "recording") return;
    const id = setInterval(()=>setElapsed(e => e + 1), 1000);
    return ()=>clearInterval(id);
  }, [q.status]);

  // playback simulation
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPlayPos(p => {
        const next = p + 0.04;
        if (next >= 1) { setPlaying(false); return 0; }
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [playing]);

  const meta = STATUS_META[q.status] || STATUS_META.pending;
  const isAuto = q.type === "tts";

  const handleMainAction = () => {
    if (q.status === "pending") {
      onUpdate(q.no, { status: "recording" });
      setElapsed(0);
    } else if (q.status === "recording") {
      // Stop -> immediately uploaded -> recorded (simulate uploading flash via timeout)
      onUpdate(q.no, { status: "uploading", duration: elapsed });
      setTimeout(()=> onUpdate(q.no, { status: "recorded", duration: elapsed, uploadedAt: Date.now() }), 800);
    } else if (q.status === "recorded") {
      onConfirmRetake(q.no);
    } else if (q.status === "skipped") {
      onUnskip(q.no);
    }
  };

  const handleSkipToggle = () => {
    if (q.status === "skipped") onUnskip(q.no);
    else if (q.status === "recorded") {
      // 已錄音題卡不可再選跳過
      return;
    } else if (q.status === "pending") {
      onConfirmSkip(q.no);
    }
  };

  // Big mic visual
  const micState = q.status === "recording" ? "recording" : (q.status === "recorded" ? "done" : "idle");

  return (
    <div className="card" style={{padding: "30px 36px 28px", display:"flex", flexDirection:"column", minHeight: 540}}>

      {/* Title row */}
      <div style={{display:"flex", alignItems:"center", gap: 14, marginBottom: 6}}>
        <span className="tabular ff-mont" style={{
          font: "700 28px/1 Montserrat", color: "var(--primary)",
        }}>Q{q.no.toString().padStart(2,"0")}</span>
        <span style={{font:"500 13px/1 'Noto Sans TC'", color: "var(--ink-4)", letterSpacing:".06em"}}>
          / {window.__MLI_DATA.questions.length}
        </span>
        <span className="tag" style={{
          background: isAuto ? "var(--primary-soft)" : "rgb(238,246,255)",
          color: isAuto ? "var(--primary)" : "rgb(53,150,253)",
          marginLeft:6,
        }}>
          {isAuto ? <I.Volume size={12} stroke="currentColor"/> : <I.Mic size={12} stroke="currentColor"/>}
          {q.tag}
        </span>
        {q.skippable && q.status !== "recorded" && q.status !== "recording" && (
          <span className="tag tag-gray">可跳過</span>
        )}

        {/* status pill on right */}
        <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:8,
          padding:"6px 14px", borderRadius:14,
          background: meta.chipBg, border: `1px solid ${meta.chipBorder}`,
          font:"500 13px/1 'Noto Sans TC'", color: meta.color,
        }}>
          <StatusDot status={q.status} size={14}/>
          {meta.label}
        </div>
      </div>

      {/* Question title */}
      <h2 style={{margin:"4px 0 16px", font:"700 24px/1.3 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
        {q.title}
      </h2>

      {/* Script box */}
      <div style={{
        padding:"20px 22px", borderRadius: 12,
        background: q.status === "skipped" ? "rgba(245,246,255,.6)" : "var(--primary-bg)",
        border: "1px solid var(--line-2)",
        position:"relative",
        opacity: q.status === "skipped" ? 0.55 : 1,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8, marginBottom: 12}}>
          <span style={{font:"500 12px/1 'Noto Sans TC'",color:"var(--ink-3)",letterSpacing:".08em"}}>
            {isAuto ? "系統播稿內容" : "業務員需唸題稿"}
          </span>
          <span style={{flex:1, height:1, background:"var(--line-2)"}}/>
          <span className="meta" style={{display:"flex",alignItems:"center",gap:4}}>
            <I.Doc size={12} stroke="var(--ink-4)"/> 第 {q.no} 題稿
          </span>
        </div>
        <p style={{margin:0, font:"400 17px/1.85 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em", textWrap:"pretty"}}>
          {q.script}
        </p>
      </div>

      {/* Recording surface */}
      <div style={{
        marginTop: 22, padding: "22px 24px",
        borderRadius: 14,
        background: q.status === "recording" ? "linear-gradient(180deg, rgb(255,247,247), #fff)" :
                    q.status === "recorded"  ? "linear-gradient(180deg, rgb(245,251,243), #fff)" :
                    q.status === "skipped"   ? "rgba(245,246,250,.6)" : "#fff",
        border: `1.5px solid ${
          q.status === "recording" ? "rgba(234,82,82,.3)" :
          q.status === "recorded"  ? "rgba(72,153,61,.25)" :
          q.status === "skipped"   ? "var(--line-2)" : "var(--line)"
        }`,
        display:"flex", alignItems:"center", gap: 24,
        flex: 1, minHeight: 160,
      }}>
        {/* Mic + status */}
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap: 10, width: 130, flexShrink:0}}>
          <MicButton state={micState} onClick={handleMainAction} size={96}/>
          <div className="tabular ff-mont" style={{
            font:"600 22px/1 Montserrat",
            color: q.status === "recording" ? "var(--danger)" : "var(--ink-2)",
          }}>
            {fmtTime(playing ? elapsed * playPos : elapsed)}
          </div>
          <div className="meta">
            {q.status === "pending" && "點擊開始錄音"}
            {q.status === "recording" && (isAuto ? "播稿錄音中…" : "錄音中…")}
            {q.status === "recorded" && "錄音完成"}
            {q.status === "skipped"  && "已跳過此題"}
            {q.status === "uploading" && "上傳中…"}
          </div>
        </div>

        {/* Waveform */}
        <div style={{flex:1, minWidth:0, display:"flex", flexDirection:"column", gap: 14}}>
          {q.status === "recording" && (
            <Waveform active={true} color={isAuto ? "var(--primary)" : "var(--danger)"} height={72} bars={64}/>
          )}
          {q.status === "recorded" && (
            <div>
              <StaticWaveform progress={playing ? playPos : 1} height={64} bars={72}
                color={playing ? "var(--primary)" : "var(--ok)"} muted="var(--line-3)"/>
              <div style={{display:"flex", alignItems:"center", gap: 14, marginTop:8}}>
                <span className="meta tabular">
                  {fmtTime(elapsed * (playing ? playPos : 0))} / {fmtTime(elapsed)}
                </span>
                <span style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:6, font:"400 12px/1 'Noto Sans TC'",color:"var(--ok)"}}>
                  <I.Check size={14} stroke="var(--ok)" sw={2.4}/>
                  分段音檔已即時上傳
                </span>
              </div>
            </div>
          )}
          {q.status === "pending" && (
            <div style={{display:"flex", flexDirection:"column", gap: 10, color:"var(--ink-4)"}}>
              <Waveform active={false} color="var(--line-3)" height={64} bars={60}/>
              <div className="meta" style={{display:"flex", alignItems:"center", gap:6}}>
                <I.Info size={14} stroke="var(--ink-4)"/>
                {isAuto
                  ? `將以 ${tts.voice.includes("tai") ? "台語" : "國語"}・${tts.voice.startsWith("f") ? "女聲" : "男聲"}・${tts.speed.toFixed(2)}× 播稿，同時啟動錄音`
                  : "業務員照稿唸題，系統將同步錄音"}
              </div>
            </div>
          )}
          {q.status === "skipped" && (
            <div style={{display:"flex", alignItems:"center", gap:12, color:"var(--ink-3)"}}>
              <Waveform active={false} color="var(--line-3)" height={48} bars={50}/>
            </div>
          )}
          {q.status === "uploading" && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <div style={{height:6,borderRadius:3,background:"var(--primary-soft)",overflow:"hidden"}}>
                <div style={{height:"100%",width:"60%",background:"var(--primary)",
                  animation:"wf 1.4s ease-in-out infinite", transformOrigin:"left"}}/>
              </div>
              <div className="meta">分段音檔上傳中，請勿關閉視窗…</div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        display:"flex", alignItems:"center", gap: 12, marginTop: 20, paddingTop: 18,
        borderTop:"1px solid var(--line-2)",
      }}>
        <button className="btn btn-quiet" disabled={!hasPrev} onClick={onPrev}>
          <I.ChevronL size={14}/> 上一題
        </button>

        {/* Skip / Restore */}
        {q.status === "skipped" ? (
          <button className="btn btn-ghost" onClick={()=>onUnskip(q.no)}>
            <I.Replay size={14}/> 還原為錄音
          </button>
        ) : (
          <button className="btn btn-quiet"
            disabled={!q.skippable || q.status === "recorded" || q.status === "recording"}
            onClick={handleSkipToggle}>
            <I.Skip size={14}/> 此題跳過
          </button>
        )}

        {/* Replay (already done) */}
        <button className="btn btn-quiet" disabled={q.status !== "recorded"} onClick={()=>setPlaying(p=>!p)}>
          {playing ? <I.Pause size={14}/> : <I.Play size={14}/>} {playing ? "暫停" : "播放回放"}
        </button>

        <span style={{marginLeft:"auto"}}/>

        {/* Re-record */}
        {q.status === "recorded" && (
          <button className="btn btn-danger" onClick={()=>onConfirmRetake(q.no)}>
            <I.Replay size={14}/> 重新錄音
          </button>
        )}

        {/* Main action varies by state */}
        {(q.status === "pending" || q.status === "recording") && (
          <button className={"btn " + (q.status==="recording" ? "btn-warn" : "btn-primary")} onClick={handleMainAction}>
            {q.status === "recording"
              ? <><I.Stop size={14} stroke="#fff"/> 停止並儲存</>
              : (isAuto ? <><I.Volume size={14}/> 播稿並錄音</> : <><I.Mic size={14}/> 開始錄音</>)}
          </button>
        )}

        <button className="btn btn-primary" disabled={!hasNext} onClick={onNext}>
          下一題 <I.Chevron size={14}/>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Right-side case info sidebar (compact)
// ─────────────────────────────────────────────────────────────
function CaseSidebar({ caseInfo, subjects, subjectDone, totalQ, onOpenCheck }) {
  const total = subjects.length;
  const done = subjects.filter(s => subjectDone && subjectDone[s.key]).length;

  return (
    <aside style={{width: 300, flexShrink: 0, display:"flex", flexDirection:"column", gap:16,
      alignSelf:"flex-start", position:"sticky", top: 20, maxHeight:"calc(100vh - 130px)", overflowY:"auto"}}>

      {/* Case info card — 與 STEP 02 共用同一摘要組件 */}
      <CaseInfoSummary caseInfo={caseInfo}
        customers={subjects && subjects.length ? subjects.map(s => ({ name: s.name, idNo: s.idNo, roles: s.roleKeys })) : undefined}/>

      {/* 送出入口 */}
      <section className="card" style={{padding: 20}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12}}>
          <span style={{font:"700 14px/1 'Noto Sans TC'",color:"var(--ink)",letterSpacing:".04em"}}>整體進度</span>
          <span className="tabular ff-mont" style={{font:"600 13px/1 Montserrat",color: done===total ? "var(--ok)" : "var(--ink-3)"}}>
            {done} <span style={{color:"var(--ink-4)"}}>/ {total}</span> 位
          </span>
        </div>

        <button className="btn btn-primary" style={{width:"100%"}} onClick={onOpenCheck}>
          <I.Upload size={16}/> 送出前檢核
        </button>
        <div className="meta" style={{marginTop:10, lineHeight:1.5}}>
          每題小音檔錄完即時上傳，無須一次錄完。可隨時打開檢核視窗確認進度，全數完成即可送出合併。
        </div>
      </section>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirm modal — for re-record & skip prompts
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ kind, onConfirm, onCancel }) {
  if (!kind) return null;
  const configs = {
    retake: {
      icon: <I.Warn size={32} stroke="var(--warn)" sw={1.8}/>,
      iconBg: "var(--warn-soft)",
      title: "確認重新錄音？",
      desc: "重新錄音後，原音檔將被覆蓋且無法復原。請確認是否繼續。",
      confirmLabel: "確認重錄",
      confirmClass: "btn btn-warn",
    },
    skip: {
      icon: <I.Skip size={28} stroke="var(--ink-3)" sw={1.8}/>,
      iconBg: "rgba(140,142,157,.18)",
      title: "確認跳過此題？",
      desc: "此題將標記為已跳過。若需重新錄音，請點擊「還原為錄音」。",
      confirmLabel: "確認跳過",
      confirmClass: "btn btn-primary",
    },
  };
  const c = configs[kind];
  return ReactDOM.createPortal((
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(41,47,84,.35)",
      display:"grid",placeItems:"center",animation:"fadeup .2s ease-out"}}>
      <div className="card fadeup" style={{padding: 32, width: 420, textAlign:"center"}}>
        <div style={{
          width: 64, height: 64, borderRadius:"50%", background: c.iconBg,
          display:"grid", placeItems:"center", margin:"0 auto 16px",
        }}>{c.icon}</div>
        <h3 style={{margin:"0 0 10px",font:"700 19px/1.3 'Noto Sans TC'",color:"var(--ink)"}}>{c.title}</h3>
        <p style={{margin:"0 0 24px",font:"400 14px/1.6 'Noto Sans TC'",color:"var(--ink-3)"}}>{c.desc}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className={c.confirmClass} onClick={onConfirm}>{c.confirmLabel}</button>
        </div>
      </div>
    </div>
  ), document.body);
}

// ─────────────────────────────────────────────────────────────
// Main recording screen
// ─────────────────────────────────────────────────────────────
function RecordingScreen({ caseInfo, tts, setTts, questions, setQuestions, tweaks, onBackToList,
                          subjects = [], sessionKeys = [], subjectDone = {}, onOpenCheck }) {
  const [active, setActive] = React.useState(1);
  const [modal, setModal] = React.useState(null); // {kind, qNo}

  const sessionSubjects = subjects.filter(s => sessionKeys.includes(s.key));

  const activeQ = questions.find(q => q.no === active);

  const updateQ = (no, patch) => setQuestions(qs => qs.map(q => q.no === no ? {...q, ...patch} : q));

  const goPrev = () => setActive(n => Math.max(1, n - 1));
  const goNext = () => setActive(n => Math.min(questions.length, n + 1));

  const confirmRetake = (no) => setModal({ kind: "retake", qNo: no });
  const confirmSkip   = (no) => setModal({ kind: "skip",   qNo: no });
  const unskip = (no) => updateQ(no, { status: "pending", duration: 0 });

  const handleModalConfirm = () => {
    if (!modal) return;
    if (modal.kind === "retake") {
      updateQ(modal.qNo, { status: "recording", duration: 0 });
    } else if (modal.kind === "skip") {
      updateQ(modal.qNo, { status: "skipped", duration: 0 });
    }
    setModal(null);
  };

  return (
    <>
      <SubHeader title="錄音作業"
        right={
          <div style={{display:"flex", gap:10}}>
            <button className="btn btn-quiet" onClick={onBackToList}>
              <I.ChevronL size={14}/> 返回案件清單
            </button>
          </div>
        }/>

      <div data-screen-label="03 錄音作業" style={{padding: "20px 40px 40px"}}>
        <div style={{display:"flex", gap: 20, alignItems:"flex-start"}}>
          <QuestionList questions={questions} active={active} onJump={setActive} tweaks={tweaks}/>

          <main style={{flex: 1, minWidth: 0}}>
            <ActiveQuestionCard
              key={activeQ.no /* re-mount to reset local timer state */}
              q={activeQ}
              onUpdate={updateQ}
              onPrev={goPrev} onNext={goNext}
              hasPrev={active > 1} hasNext={active < questions.length}
              onConfirmRetake={confirmRetake}
              onConfirmSkip={confirmSkip}
              onUnskip={unskip}
              tts={tts}
            />
          </main>

          <CaseSidebar caseInfo={caseInfo} subjects={subjects} subjectDone={subjectDone}
            totalQ={questions.length} onOpenCheck={onOpenCheck}/>
        </div>
      </div>

      {/* F-code legend */}
      <div style={{margin: "0 40px 28px", padding:"12px 16px", borderRadius:10,
        background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
        font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
        display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap"}}
        className="fcode-legend">
        <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>本畫面對應功能</span>
        <FCode code="F-102" label="題目文稿"/>
        <FCode code="F-103" label="業務員自錄"/>
        <FCode code="F-104" label="自動播稿錄音"/>
        <FCode code="F-105" label="播放/重錄確認"/>
        <FCode code="F-106" label="跳過與還原"/>
        <FCode code="F-107" label="即時儲存"/>
        <FCode code="F-108" label="送出檢核與合併"/>
        <FCode code="F-201" label="TTS 文字轉音檔"/>
        <FCode code="F-202" label="多語言 TTS"/>
        <FCode code="F-203" label="語速調整"/>
      </div>

      <ConfirmModal kind={modal?.kind} onCancel={()=>setModal(null)} onConfirm={handleModalConfirm}/>
    </>
  );
}

window.RecordingScreen = RecordingScreen;
window.STATUS_META = STATUS_META;
