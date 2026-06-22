// CaseDetailScreen — 案件內容檢視（F-302）+ 完整音檔播放（F-303）
// + 修改案件（F-305）+ 刪除音檔（F-306）+ 上傳音檔（F-307）
//
// 本畫面是 P-3 模組的核心，依案件狀態動態調整可用動作：
//   draft       → 可進入錄音、可上傳音檔（Web 通路）、可編輯
//   recording   → 可進入錄音繼續、可上傳音檔（Web 通路）
//   pending     → 唯讀，可播放完整音檔
//   reviewing   → 唯讀，可播放完整音檔
//   approved    → 唯讀，可播放完整音檔
//   returned    → 可重新錄音、可刪除音檔、可上傳新音檔、可修改部分欄位

function CaseDetailScreen({ caseInfo, questions, caseProgress, onBack, onStartRecord, onUpload }) {
  const STATUS = window.__MLI_STATUS;
  const status = caseProgress ? caseProgress.status : caseInfo.status;
  const s = STATUS[status];

  const isWeb = caseInfo.channel.startsWith("Web");
  const canRecord  = ["draft", "recording", "returned"].includes(status);
  const canUpload  = (isWeb && ["draft", "recording"].includes(status)) || status === "returned";
  const canDelete  = ["returned", "draft"].includes(status) || (status === "recording" && caseInfo.duration > 0);
  const hasAudio   = (caseProgress && caseProgress.status !== "reviewing") ? false : caseInfo.duration > 0;

  const [confirm, setConfirm] = React.useState(null); // 'delete' | 'upload'
  const [uploadStage, setUploadStage] = React.useState(null); // null | 'picking' | 'uploading' | 'done'

  // Compose the action list — appears in the "..." menu in the header.
  // Order: primary actions first, then edits, then destructive.
  const actions = React.useMemo(() => {
    const list = [];
    if (canRecord) {
      list.push({
        key: "record",
        icon: <I.Mic size={16} stroke="var(--primary)"/>,
        title: status === "returned" ? "重新錄音" : "進入錄音作業",
        desc: status === "returned" ? "退回補正重錄" : "分題 / 整段 / 上傳，多對象分次錄音",
        fcode: "F-103/F-104",
        primary: true,
        onClick: onStartRecord,
      });
    }
    if (canDelete && hasAudio) {
      list.push({
        key: "delete",
        icon: <I.Delete size={16} stroke="var(--danger)"/>,
        title: "刪除目前音檔",
        desc: "僅退回 / 草稿狀態可用",
        fcode: "F-306",
        danger: true,
        onClick: () => setConfirm("delete"),
      });
    }
    return list;
  }, [canRecord, canUpload, canDelete, hasAudio, isWeb, status, onStartRecord]);

  return (
    <div data-screen-label={`02 案件內容 / ${s.label}`} className="fadeup">
      <SubHeader title="案件內容"
        crumbs={["錄音前台", "我的案件", caseInfo.recordingNo]}
        right={
          <>
            <ActionsMenu actions={actions}/>
            <button className="btn btn-quiet" onClick={onBack}>
              <I.ChevronL size={14}/> 返回清單
            </button>
          </>
        }/>

      <div style={{padding: "20px 40px 60px", display:"grid", gridTemplateColumns:"minmax(0,1fr) 340px", gap: 20}}>

        {/* ─── LEFT MAIN ─── */}
        <div style={{display:"flex", flexDirection:"column", gap: 20, minWidth:0}}>

          {/* 案件重點 + 案件基本資訊 + 退回原因（單一整合卡） */}
          <CaseDetailCard caseInfo={caseInfo} statusMeta={s}/>

          {/* F-code legend */}
          <section style={{padding: "12px 16px", borderRadius: 10,
            background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
            font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
            display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap"}}>
            <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>本畫面對應功能</span>
            <FCode code="F-302" label="案件內容"/>
            <FCode code="F-303" label="播放音檔"/>
            {canDelete && <FCode code="F-306" label="刪除音檔"/>}
            {canUpload && <FCode code="F-307" label="上傳音檔"/>}
          </section>
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside style={{display:"flex", flexDirection:"column", gap: 16,
          alignSelf:"flex-start", position:"sticky", top:20}}>

          {/* Audio player */}
          <AudioPlayer caseInfo={caseInfo} hasAudio={hasAudio}
            canDelete={canDelete} onDelete={()=>setConfirm("delete")}/>

          {/* 案件歷程（時間軸：狀態里程碑 + 內嵌錄音進度） */}
          <CaseHistoryCard caseInfo={caseInfo}
            disp={buildDisplayProgress(caseInfo, caseProgress, questions.length)}/>
        </aside>
      </div>

      {/* Modals */}
      {confirm === "delete" && (
        <ConfirmDeleteModal caseInfo={caseInfo}
          onCancel={()=>setConfirm(null)}
          onConfirm={()=>setConfirm(null)}/>
      )}
      {uploadStage && (
        <UploadAudioModal caseInfo={caseInfo} stage={uploadStage}
          onStageChange={setUploadStage}
          onClose={()=>setUploadStage(null)}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CaseDetailCard — 案件基本資訊卡
//   標題列：icon +「案件基本資訊」+ 錄音編號 + 狀態徽章（比照側欄卡片標題）
//   錄音對象 → 欄位資訊 → 退回原因（退回補正 / 補件審核 時顯示）
function CaseDetailCard({ caseInfo, statusMeta: s }) {
  const subjects = window.__MLI_uniqueSubjects(caseInfo);
  const recordDate = (caseInfo.createdAt || "").split(" ")[0].replace(/\//g, "-");
  const showReturnReason = ["returned", "resubmit"].includes(caseInfo.status) && !!caseInfo.note;
  const reasonLabel = caseInfo.status === "resubmit" ? "退回補正原因（業務員已補件）" : "退回原因";

  return (
    <section className="card" style={{padding: 0, overflow:"hidden"}}>

      {/* ── 標題列 ── */}
      <div style={{padding:"15px 22px 15px 26px", borderBottom:"1px solid var(--line-2)",
        display:"flex", alignItems:"center", gap:10}}>
        <I.Doc size={17} stroke="var(--primary)"/>
        <span style={{font:"700 15px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>案件基本資訊</span>
        <span className="ff-mont tabular" style={{marginLeft:4, font:"600 13px/1 Montserrat", color:"var(--ink-4)", letterSpacing:".04em"}}>
          {caseInfo.recordingNo}
        </span>
        <span style={{marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:7,
          padding:"6px 14px", borderRadius:14, background:s.bg, color:s.color,
          font:"600 13px/1 'Noto Sans TC'"}}>
          <Dot color={s.dot} size={7}/> {s.label}
        </span>
      </div>

      {/* ── 錄音對象 ── */}
      <div style={{padding:"8px 28px 20px"}}>
        {subjects.map((subj, i) => (
          <SubjectHero key={i} subject={subj} divider={i < subjects.length - 1}/>
        ))}
      </div>

      {/* ── 欄位資訊 ── */}
      <div style={{padding:"22px 28px 24px", borderTop:"1px solid var(--line-2)"}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"22px 32px"}}>
          <Detail label="商品名稱" value={caseInfo.product} bold/>
          <Detail label="保單號碼" value={caseInfo.policyNo || "待核發"} mono={!!caseInfo.policyNo} muted={!caseInfo.policyNo}/>
          <Detail label="案件來源" value={caseInfo.source}/>
          <Detail label="業務員" value={<>
            <span>{caseInfo.agent}</span>
            <span className="ff-mont tabular" style={{marginLeft:6, color:"var(--ink-4)", font:"500 12.5px/1.3 Montserrat"}}>{caseInfo.agentId}</span>
          </>}/>
          <Detail label="所屬通訊處" value={caseInfo.branch}/>
          <Detail label="使用通路" value={caseInfo.channel}/>
          <Detail label="錄音日期" value={recordDate || "—"} mono/>
          <Detail label="建立時間" value={caseInfo.createdAt} mono/>
          <Detail label="更新時間" value={caseInfo.updatedAt} mono/>
        </div>
      </div>

      {/* ── 退回原因 ── */}
      {showReturnReason && (
        <div style={{padding: "20px 28px 22px", borderTop:"1px solid var(--line-2)"}}>
          <SectionLabel>
            <I.Warn size={12} stroke="var(--danger)" sw={2.2} style={{verticalAlign:-1, marginRight:4}}/>
            {reasonLabel}
          </SectionLabel>
          <div style={{padding:"12px 14px", borderRadius:8,
            background:"var(--danger-soft)", border:"1px solid rgba(234,82,82,.22)",
            font:"400 13px/1.65 'Noto Sans TC'", color:"var(--ink-2)"}}>
            {caseInfo.note}
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 案件歷程（時間軸）— 整併「案件狀態流轉」+「錄音進度」
// 僅呈現重點里程碑；錄音進度內嵌於「建立案件」節點下方
// ─────────────────────────────────────────────────────────────
function tlFmt(dt) {
  return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
}
function tlParse(s) {
  const p = (s || "").split(" ")[0].split("/").map(Number);
  return new Date(p[0] || 2026, (p[1] || 1) - 1, p[2] || 1);
}
function tlLerp(a, b, t) {
  return tlFmt(new Date(a.getTime() + (b.getTime() - a.getTime()) * t));
}

// 依案件狀態組出里程碑序列
function buildCaseTimeline(caseInfo) {
  const a = tlParse(caseInfo.createdAt), b = tlParse(caseInfo.updatedAt);
  const created = tlFmt(a), updated = tlFmt(b);
  const st = caseInfo.status;
  const nodes = [{ key:"create", icon:"doc", label:"建立案件", date:created, state: st === "draft" ? "current" : "done", progress:true }];

  if (st === "draft") {
    nodes.push({ key:"submit", icon:"send", label:"送出審核", date:"尚未送出", state:"pending" });
  } else if (st === "reviewing") {
    nodes.push({ key:"submit", icon:"send", label:"送出審核", date:updated, state:"current" });
  } else if (st === "returned") {
    nodes.push({ key:"submit", icon:"send", label:"送出審核", date:tlLerp(a,b,0.4), state:"done" });
    nodes.push({ key:"return", icon:"warn", label:"退回補正", date:updated, state:"current" });
  } else if (st === "resubmit") {
    nodes.push({ key:"submit",   icon:"send",  label:"送出審核", date:tlLerp(a,b,0.3),  state:"done" });
    nodes.push({ key:"return",   icon:"warn",  label:"退回補正", date:tlLerp(a,b,0.55), state:"done" });
    nodes.push({ key:"resubmit", icon:"send",  label:"重新送出", date:updated,          state:"done" });
    nodes.push({ key:"review",   icon:"clock", label:"補件審核中", date:"審核中",        state:"current" });
  } else if (st === "approved") {
    nodes.push({ key:"submit",  icon:"send",  label:"送出審核", date:tlLerp(a,b,0.5), state:"done" });
    nodes.push({ key:"approve", icon:"check", label:"審核通過", date:updated,         state:"done" });
  }
  return nodes;
}

function TimelineNodeIcon({ icon, size = 13 }) {
  const c = "#fff";
  if (icon === "doc")   return <I.Doc size={size} stroke={c} sw={2}/>;
  if (icon === "send")  return <I.Upload size={size} stroke={c} sw={2.2}/>;
  if (icon === "warn")  return <I.Warn size={size} stroke={c} sw={2.2}/>;
  if (icon === "clock") return <I.Clock size={size} stroke={c} sw={2.2}/>;
  if (icon === "check") return <I.Check size={size} stroke={c} sw={3}/>;
  return <I.Doc size={size} stroke={c}/>;
}

function CaseHistoryCard({ caseInfo, disp }) {
  const nodes = buildCaseTimeline(caseInfo);
  const sMeta = window.__MLI_STATUS[caseInfo.status];
  return (
    <section className="card" style={{padding:0, overflow:"hidden"}}>
      <div style={{padding:"13px 16px", borderBottom:"1px solid var(--line-2)", display:"flex", alignItems:"center", gap:8}}>
        <I.Clock size={15} stroke="var(--primary)"/>
        <span style={{font:"700 13px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>案件歷程</span>
        <span className="meta" style={{marginLeft:"auto"}}>重點時間點</span>
      </div>

      <div style={{padding:"16px 16px 8px"}}>
        {nodes.map((n, i) => {
          const last = i === nodes.length - 1;
          const isPending = n.state === "pending";
          const isCurrent = n.state === "current";
          // 節點圈：done=品牌色實心、current=狀態色實心（脈動）、pending=灰空心
          const dotBg = isPending ? "#fff" : isCurrent ? sMeta.dot : "var(--primary)";
          const lineColor = (n.state === "done") ? "rgba(73,99,250,.30)" : "var(--line-2)";
          return (
            <div key={n.key} style={{display:"flex", gap:13}}>
              {/* rail */}
              <div style={{display:"flex", flexDirection:"column", alignItems:"center", width:26, flexShrink:0}}>
                <span className={isCurrent ? "pulse" : ""} style={{
                  width:26, height:26, borderRadius:"50%", flexShrink:0,
                  background: dotBg,
                  border: isPending ? "1.5px solid var(--line-3)" : "none",
                  display:"grid", placeItems:"center",
                }}>
                  {isPending
                    ? <span style={{width:6, height:6, borderRadius:"50%", background:"var(--line-3)"}}/>
                    : <TimelineNodeIcon icon={n.icon}/>}
                </span>
                {!last && <span style={{flex:1, width:2, minHeight:18, background:lineColor, marginTop:3, marginBottom:3}}/>}
              </div>
              {/* content */}
              <div style={{flex:1, minWidth:0, paddingBottom: last ? 4 : 16}}>
                <div style={{display:"flex", alignItems:"baseline", gap:8}}>
                  <span style={{font:`${isPending ? 500 : 600} 13.5px/1.3 'Noto Sans TC'`,
                    color: isPending ? "var(--ink-4)" : "var(--ink)"}}>{n.label}</span>
                  {isCurrent && (
                    <span style={{padding:"1px 7px", borderRadius:9, background:sMeta.bg, color:sMeta.color,
                      font:"600 10px/1.5 'Noto Sans TC'"}}>目前狀態</span>
                  )}
                </div>
                <div className="ff-mont tabular" style={{marginTop:3,
                  font:"500 11.5px/1.4 Montserrat", color: isPending ? "var(--ink-4)" : "var(--ink-3)"}}>
                  {n.date}
                </div>
                {n.progress && <TimelineProgress disp={disp}/>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// 內嵌於「建立案件」節點下方的精簡錄音進度
function TimelineProgress({ disp }) {
  const methodLabel = disp.method === "whole" ? "整段 / 上傳" : "分題錄音";
  const doneCount = disp.subjects.filter(s => s.complete).length;
  return (
    <div style={{marginTop:10, borderRadius:9, background:"var(--primary-bg)", border:"1px solid var(--line-2)", overflow:"hidden"}}>
      <div style={{padding:"8px 11px", borderBottom:"1px solid var(--line-2)", display:"flex", alignItems:"center", gap:6}}>
        {disp.method === "whole" ? <I.Headset size={13} stroke="var(--primary)"/> : <I.Wave size={13} stroke="var(--primary)"/>}
        <span style={{font:"700 11.5px/1 'Noto Sans TC'", color:"var(--ink-2)"}}>錄音進度</span>
        <span className="tag" style={{marginLeft:2, padding:"1px 6px", fontSize:9.5}}>{methodLabel}</span>
        <span className="tabular ff-mont" style={{marginLeft:"auto", font:"600 11px/1 Montserrat", color:"var(--primary)"}}>
          {doneCount}<span style={{color:"var(--ink-4)"}}>/{disp.subjects.length}</span>
        </span>
      </div>
      <div style={{padding:"4px 11px 8px"}}>
        {disp.subjects.map(s => {
          const color = s.status === "done" ? "var(--ok)" : s.status === "active" ? "var(--primary)" : "var(--ink-4)";
          return (
            <div key={s.key} style={{padding:"7px 0", borderBottom:"1px solid var(--line-2)"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:5}}>
                <span style={{width:7, height:7, borderRadius:"50%", background:color, flexShrink:0}}/>
                <span style={{font:"600 12px/1.2 'Noto Sans TC'", color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.name}</span>
                <span style={{display:"flex", gap:3}}>
                  {s.roleAbbrs.map(r => <span key={r} className="tag" style={{padding:"0 4px", fontSize:9}}>{r}</span>)}
                </span>
                <span className="tabular ff-mont" style={{marginLeft:"auto", font:"600 12px/1 Montserrat", color:"var(--ink-2)"}}>
                  {s.done}<span style={{color:"var(--ink-4)"}}>/{s.total}</span>
                </span>
              </div>
              <div style={{height:5, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
                <div style={{width:`${s.total ? s.done / s.total * 100 : 0}%`, height:"100%", background:color, transition:"width .3s"}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 小標：欄位區塊標題
function SectionLabel({ children, noBottom }) {
  return (
    <div style={{
      font:"600 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)",
      letterSpacing:".1em", marginBottom: noBottom ? 0 : 12,
    }}>{children}</div>
  );
}

// 錄音對象 row — hero style: 左側人頭 icon + 姓名/角色標籤/身分證字號層次堆疊
function SubjectHero({ subject, divider }) {
  const tagColors = {
    "要保人":   { bg:"rgba(73,99,250,.10)",  color:"var(--primary)" },
    "被保險人": { bg:"rgba(72,153,61,.12)",  color:"rgb(58,124,49)" },
    "繳款人":   { bg:"rgba(241,160,40,.16)", color:"rgb(178,104,12)" },
  };
  // Use the primary role to tint the avatar so multi-role people read consistently
  const primary = subject.rolesFull[0] || "要保人";
  const avatarTone = tagColors[primary];

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:16,
      padding: "14px 0",
      borderBottom: divider ? "1px dashed var(--line-2)" : "none",
    }}>
      {/* Avatar — generic person icon, tinted by primary role */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: avatarTone.bg, color: avatarTone.color,
        display:"grid", placeItems:"center",
        flexShrink: 0,
      }}>
        <I.User size={24} stroke={avatarTone.color} sw={1.8}/>
      </div>

      {/* Body */}
      <div style={{flex:1, minWidth:0}}>
        {/* Row 1: name + role tags */}
        <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom: 5}}>
          <span style={{font:"700 22px/1.1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".02em"}}>
            {subject.name}
          </span>
          <span style={{display:"flex", gap:6, marginLeft: 4}}>
            {subject.rolesFull.map((r) => {
              const c = tagColors[r] || tagColors["要保人"];
              return (
                <span key={r} style={{
                  padding:"3px 10px", borderRadius:11,
                  background: c.bg, color: c.color,
                  font:"500 11.5px/1.4 'Noto Sans TC'", letterSpacing:".04em",
                }}>{r}</span>
              );
            })}
          </span>
        </div>
        {/* Row 2: ID number — small, gray, mono */}
        <div className="ff-mont tabular" style={{
          font:"500 12.5px/1 Montserrat",
          color:"var(--ink-4)",
          letterSpacing:".08em",
        }}>
          {subject.idNo || "—"}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ActionsMenu — "..." dropdown in the sub-header.
// Consolidates all status-dependent actions (record / upload / edit / delete)
// into a single overflow menu so the header stays minimal.
function ActionsMenu({ actions }) {
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
        className="btn btn-ghost"
        onClick={()=>setOpen(o=>!o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          padding:"6px 10px",
          background: open ? "var(--primary-soft-2)" : undefined,
          color: open ? "var(--primary)" : undefined,
        }}>
        <I.More size={18}/>
      </button>

      {open && (
        <div role="menu" className="card fadeup" style={{
          position:"absolute", top:"calc(100% + 8px)", right: 0,
          width: 300, padding: 6, zIndex: 50,
          boxShadow:"0 12px 32px rgba(41,47,84,.16), 0 2px 8px rgba(41,47,84,.06)",
          border: "1px solid var(--line-2)",
          animation: "none",
        }}>
          {empty ? (
            <div className="meta" style={{padding:"14px 12px", textAlign:"center"}}>
              此案件目前已送審 / 已通過，無可變更動作
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
                    background: a.danger ? "var(--danger-soft)" : "var(--primary-soft)",
                    display:"grid", placeItems:"center", flexShrink:0,
                  }}>{a.icon}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{
                      font:"500 13.5px/1.3 'Noto Sans TC'",
                      color: a.danger ? "var(--danger)" : "var(--ink)",
                    }}>{a.title}</div>
                    <div className="meta" style={{marginTop:2}}>{a.desc}</div>
                  </div>
                  <span className="ff-mont" style={{
                    font:"600 10px/1 Montserrat",
                    color: a.danger ? "var(--danger)" : "var(--primary)",
                    letterSpacing:".04em", flexShrink: 0, opacity: .7,
                  }}>{a.fcode}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding:"12px 18px", font:"500 14px/1 'Noto Sans TC'",
      color: active ? "var(--primary)" : "var(--ink-3)",
      borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
      marginBottom: -1,
      cursor:"pointer", letterSpacing:".04em",
    }}>{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────
function OverviewTab({ caseInfo, questions, editing, draft, setDraft, onSaveEdit, onCancelEdit,
  hasAudio, canDelete, canUpload, canRecord, onAskDelete, onAskUpload, onStartRecord }) {
  return (
    <>
      {/* Case meta */}
      <section className="card" style={{padding: 24}}>
        <div style={{display:"flex", alignItems:"baseline", marginBottom: 18}}>
          <h3 style={{margin:0, font:"700 16px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>案件資訊</h3>
          <span className="meta" style={{marginLeft:"auto"}}>
            {editing ? "F-305 修改中" : "由建議書 / 行動投保系統帶入"}
          </span>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"22px 32px"}}>
          <Detail label="商品名稱" value={caseInfo.product} bold/>
          <Detail label="保單號碼" value={caseInfo.policyNo || "待核發（需審核通過 + 核保成功）"} mono={!!caseInfo.policyNo}/>
          <Detail label="案件來源" value={caseInfo.source}/>
          <Detail label="要保人" value={caseInfo.proposer}/>
          <Detail label="被保險人" value={`${caseInfo.insured}（${caseInfo.insuredAge} 歲）`}/>
          <Detail label="業務員" value={`${caseInfo.agent}　${caseInfo.agentId}`}/>
          <Detail label="所屬通訊處" value={caseInfo.branch}/>
          <Detail label="使用通路" value={caseInfo.channel}/>
          <Detail label="建立時間" value={caseInfo.createdAt} mono/>
        </div>

        {/* Note (editable) */}
        <div style={{marginTop:22}}>
          <div style={{display:"flex", alignItems:"baseline", marginBottom:8}}>
            <span style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em"}}>
              業務員備註
            </span>
            <span className="meta" style={{marginLeft:"auto"}}>
              {editing ? "可修改" : "如需修改其他欄位需聯繫內勤"}
            </span>
          </div>
          {editing ? (
            <textarea value={draft.note} onChange={e=>setDraft({...draft, note: e.target.value})}
              placeholder="輸入備註，例如客戶聽力狀況、客戶要求語言、補錄原因等"
              style={{
                width:"100%", minHeight: 80, resize:"vertical",
                padding:"10px 14px", borderRadius: 8, border:"1px solid var(--line)",
                font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)",
                outline:"none",
              }}/>
          ) : (
            <div style={{padding:"12px 14px", borderRadius:8, background:"var(--primary-bg)",
              border:"1px dashed var(--line)",
              font:"400 13px/1.6 'Noto Sans TC'", color: caseInfo.note ? "var(--ink-2)" : "var(--ink-4)"}}>
              {caseInfo.note || "—（無備註）"}
            </div>
          )}
        </div>

        {editing && (
          <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:18,
            paddingTop:16, borderTop:"1px solid var(--line-2)"}}>
            <button className="btn btn-quiet" onClick={onCancelEdit}>取消</button>
            <button className="btn btn-primary" onClick={onSaveEdit}>
              <I.Check size={14}/> 儲存變更
            </button>
          </div>
        )}
      </section>

      {/* Progress summary */}
      <section className="card" style={{padding: 24, marginTop: 20}}>
        <div style={{display:"flex", alignItems:"baseline", marginBottom: 18}}>
          <h3 style={{margin:0, font:"700 16px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>錄音進度</h3>
          <span className="meta" style={{marginLeft:"auto"}}>共 {caseInfo.progress.total} 題</span>
        </div>

        <ProgressSummary caseInfo={caseInfo}/>
      </section>
    </>
  );
}

function ProgressSummary({ caseInfo }) {
  const p = caseInfo.progress;
  const pending = p.total - p.recorded - p.skipped;
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 12, marginBottom: 18}}>
        <StatBlock label="總題數"   value={p.total}/>
        <StatBlock label="已錄音"   value={p.recorded} color="var(--ok)"/>
        <StatBlock label="已跳過"   value={p.skipped}  color="var(--ink-3)"/>
        <StatBlock label="未錄音"   value={pending}    color="var(--warn)"/>
      </div>
      <div style={{height:8, borderRadius:4, background:"var(--line-2)", overflow:"hidden", display:"flex"}}>
        <div style={{width:`${p.recorded/p.total*100}%`, background:"var(--ok)"}}/>
        <div style={{width:`${p.skipped/p.total*100}%`, background:"rgba(140,142,157,.5)"}}/>
      </div>
      <div style={{display:"flex", justifyContent:"space-between", marginTop:10, font:"400 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>
        <span><Dot color="var(--ok)" size={6}/> 已錄 {p.recorded}</span>
        <span><Dot color="rgba(140,142,157,.7)" size={6}/> 跳過 {p.skipped}</span>
        <span><Dot color="var(--warn)" size={6}/> 未錄 {pending}</span>
        {caseInfo.duration > 0 && (
          <span className="tabular ff-mont" style={{color:"var(--primary)"}}>音檔長度 {fmtDur(caseInfo.duration)}</span>
        )}
      </div>
    </>
  );
}

function StatBlock({ label, value, color = "var(--ink)" }) {
  return (
    <div style={{padding:"14px 16px", borderRadius:10, background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
      <div className="tabular ff-mont" style={{font:"700 24px/1 Montserrat", color}}>{value}</div>
      <div style={{font:"400 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginTop:6}}>{label}</div>
    </div>
  );
}

function Detail({ label, value, bold, mono, muted }) {
  return (
    <div>
      <div style={{font:"500 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".08em", marginBottom:8}}>
        {label}
      </div>
      <div className={mono ? "tabular ff-mont" : ""} style={{
        font: bold ? "600 15px/1.4 'Noto Sans TC'" : (mono ? "500 13.5px/1.3 Montserrat" : "500 14px/1.4 'Noto Sans TC'"),
        color: muted ? "var(--ink-3)" : "var(--ink)",
      }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function QuestionsTab({ questions, caseInfo }) {
  // Render fake status based on case progress
  const STATUS = window.__MLI_STATUS;
  const generated = React.useMemo(() => {
    const p = caseInfo.progress;
    if (caseInfo.status === "draft") {
      return questions.map(q => ({...q, status: "pending", duration: 0}));
    }
    if (caseInfo.status === "recording") {
      return questions.map((q, i) => {
        if (i < p.recorded) return {...q, status: "recorded", duration: 30 + (i%5)*8};
        if (i === p.recorded + 1) return {...q, status: "skipped", duration: 0};
        return {...q, status: "pending", duration: 0};
      });
    }
    // pending / reviewing / approved / returned — assume all complete-ish per case progress
    return questions.map((q, i) => {
      if (i < p.recorded) return {...q, status: "recorded", duration: 25 + (i%7)*6};
      if (i < p.recorded + p.skipped) return {...q, status: "skipped", duration: 0};
      return {...q, status: "pending", duration: 0};
    });
  }, [questions, caseInfo]);

  const canPlayPerQuestion = ["pending","reviewing","approved","returned","recording"].includes(caseInfo.status);

  return (
    <section className="card" style={{padding:0, overflow:"hidden"}}>
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"var(--primary-bg)", borderBottom:"1px solid var(--line-2)"}}>
            <th style={{...listTh2, width:60}}>題號</th>
            <th style={{...listTh2, width:100}}>類型</th>
            <th style={{...listTh2}}>題目</th>
            <th style={{...listTh2, width:100}}>狀態</th>
            <th style={{...listTh2, width:90, textAlign:"right"}}>時長</th>
            <th style={{...listTh2, width:120, textAlign:"right"}}>操作</th>
          </tr>
        </thead>
        <tbody>
          {generated.map((q) => {
            const isRec = q.status === "recorded";
            const isSkip = q.status === "skipped";
            return (
              <tr key={q.no} style={{borderBottom:"1px solid var(--line-2)"}}>
                <td style={{...listTd2, font:"600 13px/1 Montserrat", color:"var(--primary)"}} className="tabular">
                  Q{q.no.toString().padStart(2,"0")}
                </td>
                <td style={listTd2}>
                  <span className="tag" style={{
                    background: q.type === "tts" ? "var(--primary-soft)" : "rgb(238,246,255)",
                    color: q.type === "tts" ? "var(--primary)" : "rgb(53,150,253)",
                  }}>
                    {q.type === "tts" ? "自動播稿" : "業務員自錄"}
                  </span>
                </td>
                <td style={listTd2}>
                  <div style={{font:"500 13.5px/1.3 'Noto Sans TC'", color:"var(--ink)",
                    textDecoration: isSkip ? "line-through" : "none",
                    textDecorationColor: "var(--ink-4)"}}>{q.title}</div>
                </td>
                <td style={listTd2}>
                  <QuestionStatusBadge status={q.status}/>
                </td>
                <td style={{...listTd2, textAlign:"right", font:"500 13px/1 Montserrat", color: isRec ? "var(--ink-2)" : "var(--ink-4)"}} className="tabular ff-mont">
                  {isRec ? fmtDur(q.duration) : "—"}
                </td>
                <td style={{...listTd2, textAlign:"right"}}>
                  {isRec && canPlayPerQuestion ? (
                    <button className="btn btn-quiet btn-sm">
                      <I.Play size={12}/> 播放
                    </button>
                  ) : (
                    <span className="meta">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function QuestionStatusBadge({ status }) {
  const map = {
    recorded: { l: "已錄音", c: "var(--ok)",   bg: "var(--ok-soft)" },
    skipped:  { l: "已跳過", c: "var(--ink-3)", bg: "rgba(140,142,157,.15)" },
    pending:  { l: "未錄音", c: "var(--warn)", bg: "var(--warn-soft)" },
  };
  const m = map[status] || map.pending;
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 10px", borderRadius:12, background:m.bg, color: m.c,
      font:"500 12px/1 'Noto Sans TC'"}}>
      <Dot color={m.c}/> {m.l}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
function TimelineTab({ caseInfo }) {
  // Synthesize a plausible timeline
  const events = React.useMemo(() => {
    const e = [];
    e.push({ time: caseInfo.createdAt, who: caseInfo.agent, icon: <I.Doc size={14} stroke="#fff"/>, color: "var(--primary)",
      title: "建立錄音案件", desc: `由 ${caseInfo.source} 帶入案件資訊，取得錄音編號 ${caseInfo.recordingNo}` });
    if (caseInfo.progress.recorded > 0) {
      e.push({ time: caseInfo.createdAt, who: caseInfo.agent, icon: <I.Mic size={14} stroke="#fff"/>, color: "var(--primary-2)",
        title: "開始錄音作業", desc: `共 ${caseInfo.progress.total} 題，逐題即時上傳分段音檔` });
    }
    if (caseInfo.duration > 0) {
      e.push({ time: caseInfo.updatedAt, who: caseInfo.agent, icon: <I.Upload size={14} stroke="#fff"/>, color: "var(--ok)",
        title: "完成上傳", desc: `已合併為完整音檔 ${caseInfo.recordingNo}_merged.wav · ${fmtDur(caseInfo.duration)}` });
    }
    if (caseInfo.status === "reviewing") {
      e.push({ time: caseInfo.updatedAt, who: "內勤審核員 王小姐", icon: <I.Headset size={14} stroke="#fff"/>, color: "rgb(53,113,200)",
        title: "內勤指派審核", desc: "案件已分派至內勤審核佇列" });
    }
    if (caseInfo.status === "approved") {
      e.push({ time: caseInfo.updatedAt, who: "內勤審核員 王小姐", icon: <I.Check size={14} stroke="#fff"/>, color: "var(--ok)",
        title: "審核通過", desc: "STT 比對與聽稿結果通過，案件已歸檔" });
    }
    if (caseInfo.status === "returned") {
      e.push({ time: caseInfo.updatedAt, who: "內勤審核員 王小姐", icon: <I.Warn size={14} stroke="#fff"/>, color: "var(--danger)",
        title: "退回補正", desc: caseInfo.note });
    }
    return e.reverse();
  }, [caseInfo]);

  return (
    <section className="card" style={{padding: "24px 28px"}}>
      <div style={{display:"flex", alignItems:"baseline", marginBottom: 18}}>
        <h3 style={{margin:0, font:"700 16px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>操作紀錄</h3>
        <span className="meta" style={{marginLeft:"auto"}}>由系統自動產生</span>
      </div>

      <div style={{position:"relative", paddingLeft: 28}}>
        <div style={{position:"absolute", left: 11, top: 6, bottom: 6, width: 2, background:"var(--line-2)"}}/>
        {events.map((ev, i) => (
          <div key={i} style={{position:"relative", paddingBottom: i === events.length-1 ? 0 : 22}}>
            <div style={{position:"absolute", left: -22, top: 0, width: 24, height: 24, borderRadius:"50%",
              background: ev.color, display:"grid", placeItems:"center",
              boxShadow:"0 0 0 4px #fff"}}>
              {ev.icon}
            </div>
            <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom: 4}}>
              <span style={{font:"600 14px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>{ev.title}</span>
              <span className="meta tabular">{ev.time}</span>
              <span className="meta">·</span>
              <span className="meta">{ev.who}</span>
            </div>
            <div style={{font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink-3)"}}>{ev.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Audio player (F-303 播放音檔 — 完整音檔)
function AudioPlayer({ caseInfo, hasAudio, canDelete, onDelete }) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0.32);
  const [speed, setSpeed] = React.useState(1.0);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress(p => {
        const next = p + 0.005 * speed;
        if (next >= 1) { setPlaying(false); return 1; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, speed]);

  const elapsed = Math.floor(caseInfo.duration * progress);

  return (
    <section className="card" style={{padding: 20}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:14}}>
        <I.Headset size={16} stroke="var(--primary)"/>
        <span style={{font:"700 13px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>完整音檔</span>
      </div>

      {hasAudio ? (
        <>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10,
            font:"400 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)", wordBreak:"break-all"}}>
            <I.Doc size={12} stroke="var(--ink-4)"/>
            <span className="ff-mont tabular">{caseInfo.recordingNo}_merged.wav</span>
          </div>

          <div style={{padding:"14px 12px", borderRadius:10, background:"var(--primary-bg)",
            border:"1px solid var(--line-2)", marginBottom:12}}>
            <StaticWaveform progress={progress} bars={48} height={40}
              color={playing ? "var(--primary)" : "var(--ok)"} muted="var(--line-3)"/>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8, font:"500 11.5px/1 Montserrat", color:"var(--ink-3)"}} className="tabular ff-mont">
              <span>{fmtDur(elapsed)}</span>
              <span>{fmtDur(caseInfo.duration)}</span>
            </div>
          </div>

          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <button onClick={()=>setPlaying(p=>!p)} style={{
              width:42, height:42, borderRadius:"50%", background:"var(--primary)", color:"#fff",
              display:"grid", placeItems:"center", cursor:"pointer",
              boxShadow:"0 2px 8px rgba(73,99,250,.3)",
            }}>
              {playing ? <I.Pause size={18} stroke="#fff"/> : <I.Play size={18} stroke="#fff"/>}
            </button>
            <button className="btn btn-quiet btn-sm" onClick={()=>setProgress(p=>Math.max(0, p-0.1))}>
              <span className="ff-mont" style={{font:"600 11px/1 Montserrat"}}>-10s</span>
            </button>
            <button className="btn btn-quiet btn-sm" onClick={()=>setProgress(p=>Math.min(1, p+0.1))}>
              <span className="ff-mont" style={{font:"600 11px/1 Montserrat"}}>+10s</span>
            </button>
            <span style={{flex:1}}/>
            <select value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))}
              className="input" style={{height:32, padding:"0 8px", font:"500 12px/1 Montserrat", width:64}}>
              <option value="0.75">0.75×</option>
              <option value="1">1.0×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
            </select>
          </div>

          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={onDelete}
              style={{width:"100%", marginTop:14}}>
              <I.Delete size={13}/> 刪除此音檔（F-306）
            </button>
          )}
        </>
      ) : (
        <div style={{padding:"22px 12px", textAlign:"center", borderRadius:10,
          background:"var(--primary-bg)", border:"1px dashed var(--line)"}}>
          <I.Wave size={24} stroke="var(--ink-4)"/>
          <div style={{font:"500 13px/1.4 'Noto Sans TC'", color:"var(--ink-3)", marginTop:8}}>
            此案件尚無完整音檔
          </div>
          <div className="meta" style={{marginTop:4}}>
            {caseInfo.status === "draft" ? "請進入錄音或自行上傳" : "錄音作業進行中"}
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
function ActionRow({ icon, title, desc, fcode, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:12, width:"100%",
      padding:"12px 12px", borderRadius:10,
      border:`1px solid ${danger ? "rgba(234,82,82,.25)" : "var(--line-2)"}`,
      background:"#fff", textAlign:"left", cursor:"pointer", transition:"all .12s",
    }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? "var(--danger-soft)" : "var(--primary-soft-2)"}
    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
      <div style={{width:34, height:34, borderRadius:8,
        background: danger ? "var(--danger-soft)" : "var(--primary-soft)",
        display:"grid", placeItems:"center", flexShrink:0}}>{icon}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{font:"500 13.5px/1.3 'Noto Sans TC'", color: danger ? "var(--danger)" : "var(--ink)"}}>{title}</div>
        <div className="meta" style={{marginTop:3}}>{desc}</div>
      </div>
      <span className="ff-mont" style={{font:"600 10.5px/1 Montserrat",
        color: danger ? "var(--danger)" : "var(--primary)", letterSpacing:".04em",
        flexShrink: 0}}>{fcode}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// BasicInfoBlock — 案件基本資訊（側欄）
// Style mirrors MetaBlock so the right column reads as a uniform info stack.
function BasicInfoBlock({ caseInfo }) {
  const recordDate = (caseInfo.createdAt || "").split(" ")[0].replace(/\//g, "-");
  return (
    <section className="card" style={{padding: 18}}>
      <div style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", marginBottom:12}}>
        案件基本資訊
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:10, font:"400 12px/1.4 'Noto Sans TC'"}}>
        <MetaLine label="錄音日期" value={recordDate || "—"} mono/>
        <MetaLine label="保險商品" value={caseInfo.product}/>
        <MetaLine label="保單號碼" value={caseInfo.policyNo || "待核發"} mono={!!caseInfo.policyNo}/>
        <MetaLine label="業務員"
          value={<>
            <span>{caseInfo.agent}</span>
            <span className="ff-mont tabular" style={{marginLeft:6, color:"var(--ink-4)", font:"500 11.5px/1.4 Montserrat"}}>
              {caseInfo.agentId}
            </span>
          </>}/>
        <MetaLine label="所屬通訊處" value={caseInfo.branch}/>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
function MetaBlock({ caseInfo }) {
  return (
    <section className="card" style={{padding: 18}}>
      <div style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", marginBottom:12}}>
        系統資訊
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:10, font:"400 12px/1.4 'Noto Sans TC'"}}>
        <MetaLine label="建立時間" value={caseInfo.createdAt}/>
        <MetaLine label="更新時間" value={caseInfo.updatedAt}/>
        <MetaLine label="使用通路" value={caseInfo.channel}/>
        <MetaLine label="來源系統" value={caseInfo.source}/>
      </div>
    </section>
  );
}
function MetaLine({ label, value, mono }) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
      <span style={{color:"var(--ink-4)"}}>{label}</span>
      <span className={mono?"tabular ff-mont":""} style={{color:"var(--ink-2)", textAlign:"right",
        font: mono ? "500 12px/1.4 Montserrat" : undefined}}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ caseInfo, onCancel, onConfirm }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(41,47,84,.4)",
      display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:32, width:440}}>
        <div style={{width:60, height:60, borderRadius:"50%", background:"var(--danger-soft)",
          display:"grid", placeItems:"center", margin:"0 auto 14px"}}>
          <I.Delete size={26} stroke="var(--danger)"/>
        </div>
        <h3 style={{margin:"0 0 8px", font:"700 19px/1.3 'Noto Sans TC'", color:"var(--ink)", textAlign:"center"}}>
          確認刪除音檔？
        </h3>
        <p style={{margin:"0 0 18px", font:"400 13.5px/1.6 'Noto Sans TC'", color:"var(--ink-3)", textAlign:"center"}}>
          將刪除完整音檔與所有分段音檔，刪除後案件回到「草稿」狀態，需重新進行錄音或上傳。此操作無法復原。
        </p>
        <div style={{padding:"10px 14px", borderRadius:8, background:"var(--primary-bg)",
          border:"1px solid var(--line-2)", marginBottom:18, font:"400 12px/1.6 'Noto Sans TC'", color:"var(--ink-2)"}}>
          <span className="ff-mont tabular" style={{color:"var(--primary)"}}>{caseInfo.recordingNo}_merged.wav</span>
          <span style={{margin:"0 8px", color:"var(--ink-4)"}}>·</span>
          <span className="tabular ff-mont">{fmtDur(caseInfo.duration)}</span>
        </div>
        <div style={{display:"flex", gap:10, justifyContent:"center"}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn" style={{background:"var(--danger)", color:"#fff"}} onClick={onConfirm}>
            <I.Delete size={14}/> 確認刪除
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function UploadAudioModal({ caseInfo, stage, onStageChange, onClose }) {
  const [filename] = React.useState(`${caseInfo.recordingNo}_recall.wav`);
  const [size] = React.useState("4.8 MB");

  React.useEffect(() => {
    if (stage === "uploading") {
      const t = setTimeout(() => onStageChange("done"), 2200);
      return () => clearTimeout(t);
    }
  }, [stage, onStageChange]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(41,47,84,.4)",
      display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:32, width:520}}>
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18}}>
          <I.Upload size={22} stroke="var(--primary)"/>
          <div>
            <h3 style={{margin:0, font:"700 18px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>上傳完整音檔</h3>
            <p style={{margin:"4px 0 0", font:"400 12.5px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              F-307 · 限 WAV / MP3 格式，檔案大小不超過 100 MB
            </p>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}>
            <I.X size={18}/>
          </button>
        </div>

        {stage === "picking" && (
          <>
            <div style={{padding: "30px 20px", borderRadius: 12,
              border: "2px dashed rgba(73,99,250,.4)", background:"var(--primary-soft-2)",
              textAlign:"center", cursor:"pointer", transition:"all .15s"}}
              onClick={()=>onStageChange("uploading")}>
              <I.Upload size={36} stroke="var(--primary)" sw={1.6}/>
              <div style={{font:"600 14.5px/1.3 'Noto Sans TC'", color:"var(--ink)", marginTop:12}}>
                點擊選擇音檔，或拖曳檔案至此
              </div>
              <div className="meta" style={{marginTop:6}}>
                建議使用本系統 iPad 端錄製後匯出之 WAV 檔，以確保品質
              </div>
            </div>

            <div style={{marginTop:18, padding:"12px 14px", borderRadius:8, background:"var(--warn-soft)",
              display:"flex", gap:10, alignItems:"flex-start"}}>
              <I.Info size={14} stroke="rgb(151,89,15)" style={{flexShrink:0, marginTop:1}}/>
              <div style={{font:"400 12px/1.6 'Noto Sans TC'", color:"rgb(151,89,15)"}}>
                上傳成功後，本案件將直接進入「待審核」狀態，後端將進行 STT 比對。
                若為退回補正，將覆蓋原音檔。
              </div>
            </div>

            <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:22}}>
              <button className="btn btn-quiet" onClick={onClose}>取消</button>
            </div>
          </>
        )}

        {stage === "uploading" && (
          <>
            <div style={{padding:"18px 16px", borderRadius:10, background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
                <I.Doc size={20} stroke="var(--primary)"/>
                <div style={{flex:1, minWidth:0}}>
                  <div className="ff-mont tabular" style={{font:"500 13.5px/1.3 Montserrat", color:"var(--ink)"}}>{filename}</div>
                  <div className="meta" style={{marginTop:3}}>{size} · WAV</div>
                </div>
                <svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="var(--primary-soft)" strokeWidth="2.5"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{height:6, borderRadius:3, background:"var(--primary-soft)", overflow:"hidden"}}>
                <div style={{height:"100%", background:"var(--primary)", width:"62%",
                  animation:"wf 1.6s ease-in-out infinite", transformOrigin:"left"}}/>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
                <span className="meta">上傳中…</span>
                <span className="meta tabular ff-mont">62%</span>
              </div>
            </div>
          </>
        )}

        {stage === "done" && (
          <>
            <div style={{padding:"24px 16px", textAlign:"center"}}>
              <div style={{width:64, height:64, borderRadius:"50%", background:"var(--ok-soft)",
                display:"grid", placeItems:"center", margin:"0 auto 14px"}}>
                <I.Check size={32} stroke="var(--ok)" sw={2.6}/>
              </div>
              <h3 style={{margin:"0 0 6px", font:"700 17px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>上傳完成</h3>
              <p style={{margin:"0 0 18px", font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink-3)"}}>
                音檔已上傳並送出審核，後端將進行 STT 比對
              </p>
              <div style={{padding:"10px 14px", borderRadius:8, background:"var(--primary-bg)",
                display:"inline-block", font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-2)"}}>
                <span className="ff-mont tabular">{filename}</span> · {size}
              </div>
            </div>
            <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:6}}>
              <button className="btn btn-primary" onClick={onClose}>完成</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── styles ───
const listTh2 = {
  padding:"12px 16px", textAlign:"left",
  font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".06em", whiteSpace:"nowrap",
};
const listTd2 = {
  padding:"14px 16px", verticalAlign:"middle", background:"#fff",
};

window.CaseDetailScreen = CaseDetailScreen;
