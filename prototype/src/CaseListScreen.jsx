// CaseListScreen — 案件清單（F-301）+ 案件搜尋（F-304）
//
// 業務員日常入口。以表格列出案件，標示審核狀態、進度、案件來源、通路。
// 點擊列開啟 CaseDetailScreen；新增按鈕導向 EntryScreen 取號。

function CaseListScreen({ cases, onOpen, onNew, currentAgent, progressMap = {} }) {
  const STATUS = window.__MLI_STATUS;
  const totalQ = window.__MLI_QUESTIONS.length;
  const effStatus = (c) => (progressMap[c.caseNo] ? progressMap[c.caseNo].status : c.status);

  const [keyword, setKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [channelFilter, setChannelFilter] = React.useState("all");
  const [sort, setSort] = React.useState("updated_desc");

  // F-304 簡易快速查詢：錄音編號 / 保單號 / 商品 / 三角色姓名
  const filtered = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let list = cases.filter(c => {
      if (statusFilter !== "all" && effStatus(c) !== statusFilter) return false;
      if (channelFilter !== "all" && !c.channel.startsWith(channelFilter)) return false;
      if (!kw) return true;
      const roleNames = c.roles ? Object.values(c.roles).map(r => r.name) : [];
      return [c.recordingNo, c.caseNo, c.policyNo || "", c.product, ...roleNames]
        .some(v => v.toLowerCase().includes(kw));
    });
    if (sort === "updated_desc") list = [...list].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
    if (sort === "updated_asc")  list = [...list].sort((a,b) => a.updatedAt.localeCompare(b.updatedAt));
    return list;
  }, [cases, keyword, statusFilter, channelFilter, sort]);

  // 統計每個狀態的件數（顯示在 chip 上）
  const statusCounts = React.useMemo(() => {
    const o = {all: cases.length};
    Object.keys(STATUS).forEach(k => { o[k] = cases.filter(c => effStatus(c) === k).length; });
    return o;
  }, [cases, progressMap]);

  return (
    <div data-screen-label="01 案件清單" className="fadeup" style={{padding: "20px 40px 60px"}}>

      <SubHeader title="我的案件"
        right={
          <button className="btn btn-primary" onClick={onNew}>
            <I.Mic size={14}/> 建立錄音案件
          </button>
        }
      />

      {/* ─── Top filter bar ─── */}
      <section style={{margin:"20px 0 16px", display:"flex", gap: 12, alignItems:"center", flexWrap:"wrap"}}>
        {/* Search */}
        <div style={{position:"relative", flex:"1 1 360px", maxWidth: 420}}>
          <I.Search size={16} stroke="var(--ink-4)" style={{position:"absolute", left:14, top:12}}/>
          <input className="input" style={{width:"100%", paddingLeft: 38}} value={keyword}
            onChange={e=>setKeyword(e.target.value)}
            placeholder="搜尋錄音編號 / 案件編號 / 保單號 / 商品 / 要保人 / 被保人 / 繳款人"/>
          {keyword && (
            <button onClick={()=>setKeyword("")}
              style={{position:"absolute", right:10, top:10, padding:6, borderRadius:6, color:"var(--ink-4)"}}>
              <I.X size={14}/>
            </button>
          )}
        </div>

        {/* Channel filter */}
        <ChipGroup
          label="通路"
          value={channelFilter}
          onChange={setChannelFilter}
          options={[
            {value:"all",  label:"全部"},
            {value:"iPad", label:"iPad"},
            {value:"Web",  label:"Web"},
          ]}/>

        {/* Sort */}
        <select className="input" style={{height:40, paddingRight:30, marginLeft:"auto"}}
          value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="updated_desc">最近更新優先</option>
          <option value="updated_asc">最早更新優先</option>
        </select>
      </section>

      {/* Status pill row */}
      <section style={{display:"flex", gap: 8, flexWrap:"wrap", marginBottom: 16}}>
        <StatusPill active={statusFilter==="all"} onClick={()=>setStatusFilter("all")}
          label="全部" count={statusCounts.all}
          dot="var(--ink-3)" bg="rgba(140,142,157,.12)" color="var(--ink-2)"/>
        {Object.entries(STATUS).map(([k, s]) => (
          <StatusPill key={k} active={statusFilter===k} onClick={()=>setStatusFilter(k)}
            label={s.label} count={statusCounts[k]||0}
            dot={s.dot} bg={s.bg} color={s.color}/>
        ))}
      </section>

      {/* ─── Cases table ─── */}
      <section className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", minWidth: 1260}}>
            <thead>
              <tr style={{background:"var(--primary-bg)", borderBottom:"1px solid var(--line-2)"}}>
                <th style={{...listTh, width: 110}}>錄音編號</th>
                <th style={{...listTh, width: 130}}>案件編號</th>
                <th style={{...listTh, width: 260}}>商品 / 保單號</th>
                <th style={{...listTh, width: 230}}>錄音對象</th>
                <th style={{...listTh, width: 150}}>進度</th>
                <th style={{...listTh, width: 110}}>審核狀態</th>
                <th style={{...listTh, width: 150}}>更新時間</th>
                <th style={{...listTh, width: 100, textAlign:"right"}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CaseRow key={c.caseNo} c={c} STATUS={STATUS} prog={progressMap[c.caseNo]} totalQ={totalQ} onOpen={() => onOpen(c.caseNo)}/>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{padding:"60px 0", textAlign:"center"}}>
                    <I.Search size={28} stroke="var(--ink-4)" style={{marginBottom:8}}/>
                    <div style={{font:"500 14px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
                      找不到符合條件的案件
                    </div>
                    <div className="meta" style={{marginTop:6}}>請調整搜尋關鍵字或篩選條件</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* footer / paging */}
        <div style={{display:"flex", alignItems:"center", padding:"12px 20px", borderTop:"1px solid var(--line-2)",
          font:"400 12px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>
          <span>共 <span className="ff-mont tabular" style={{color:"var(--ink)",fontWeight:600}}>{filtered.length}</span> 筆，顯示 1–{filtered.length}</span>
          <span style={{marginLeft:"auto", display:"flex", gap:6, alignItems:"center"}}>
            <button className="btn btn-quiet btn-sm" disabled aria-disabled="true"><I.ChevronL size={12}/></button>
            <span className="ff-mont tabular" style={{padding:"6px 10px", borderRadius:14, background:"var(--primary-soft)", color:"var(--primary)", font:"600 12px/1 Montserrat"}}>1</span>
            <button className="btn btn-quiet btn-sm" disabled aria-disabled="true"><I.Chevron size={12}/></button>
          </span>
        </div>
      </section>

      {/* ─── F-code legend ─── */}
      <section style={{marginTop:20, padding: "12px 16px", borderRadius: 10,
        background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
        font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
        display:"flex", alignItems:"center", gap: 12, flexWrap:"wrap"}}>
        <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>
          本畫面對應功能
        </span>
        <FCode code="F-301" label="錄音案件清單"/>
        <FCode code="F-304" label="案件搜尋"/>
      </section>
    </div>
  );
}

function CaseRow({ c, STATUS, prog, totalQ, onOpen }) {
  const dispStatus = prog ? prog.status : c.status;
  const s = STATUS[dispStatus];
  const disp = buildDisplayProgress(c, prog, totalQ);

  return (
    <tr onClick={onOpen} style={{
      borderBottom:"1px solid var(--line-2)", cursor:"pointer",
      transition:"background .12s",
    }}
    onMouseEnter={e=>e.currentTarget.style.background="var(--primary-soft-2)"}
    onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
      <td style={listTd}>
        <div className="ff-mont tabular" style={{font:"600 13.5px/1.2 Montserrat", color:"var(--ink-2)", letterSpacing:".02em"}}>
          {c.recordingNo}
        </div>
      </td>
      <td style={listTd}>
        <div className="ff-mont tabular" style={{font:"600 13.5px/1.2 Montserrat", color:"var(--primary)", letterSpacing:".02em"}}>
          {c.caseNo}
        </div>
      </td>
      <td style={listTd}>
        <div style={{font:"500 14px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{c.product}</div>
        {c.policyNo && (
          <div className="tabular ff-mont" style={{font:"500 12px/1 Montserrat", color:"var(--ink-3)", marginTop:5}}>
            {c.policyNo}
          </div>
        )}
      </td>
      <td style={listTd}>
        <SubjectsWithProgress disp={disp} showProgress={false}/>
      </td>
      <td style={listTd}>
        {dispStatus === "draft"
          ? (prog && prog.method
              ? <CaseProgressCell cp={window.buildCaseProgress(c, prog, totalQ)}/>
              : <span style={{display:"inline-flex", alignItems:"center", gap:6,
                  font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-4)"}}>
                  <I.Info size={12} stroke="var(--ink-4)"/> 尚未選擇錄音方式
                </span>)
          : <span className="meta">—</span>}
      </td>
      <td style={listTd}>
        <span style={{display:"inline-flex", alignItems:"center", gap:6,
          padding:"4px 10px", borderRadius:12,
          background: s.bg, color: s.color,
          font:"500 12px/1 'Noto Sans TC'"}}>
          <Dot color={s.dot}/> {s.label}
        </span>
      </td>
      <td style={{...listTd, color:"var(--ink-3)", font:"400 12px/1.5 'Noto Sans TC'"}} className="tabular">
        {c.updatedAt}
      </td>
      <td style={{...listTd, textAlign:"right"}}>
        <button className="btn btn-ghost btn-sm" onClick={(e)=>{e.stopPropagation(); onOpen();}}>
          開啟 <I.Chevron size={12}/>
        </button>
      </td>
    </tr>
  );
}

// 案件層級進度（一案一進度，僅草稿顯示）：單一 X/Y + 進度條（v1 風格）
function CaseProgressCell({ cp }) {
  const pct = cp.total ? cp.done / cp.total * 100 : 0;
  return (
    <>
      <div style={{display:"flex", alignItems:"baseline", gap:6, marginBottom:5}}>
        <span className="ff-mont tabular" style={{font:"600 13.5px/1 Montserrat", color: cp.complete ? "var(--ok)" : "var(--ink)"}}>
          {cp.done}/{cp.total}
        </span>
        <span className="meta">{cp.method === "whole" ? "整段" : "分題"}</span>
      </div>
      <div style={{height:5, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
        <div style={{width:`${pct}%`, height:"100%", background: cp.complete ? "var(--ok)" : "var(--primary)", transition:"width .3s"}}/>
      </div>
    </>
  );
}

// 錄音對象儲存格：姓名 + 角色 + （僅草稿）進度 X/Y
function SubjectsWithProgress({ disp, showProgress }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:7}}>
      {disp.subjects.map((s) => (
        <div key={s.key} style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{font:"500 13.5px/1 'Noto Sans TC'", color:"var(--ink)"}}>{s.name}</span>
          <div style={{display:"flex", gap:3}}>
            {s.roleAbbrs.map(r => (
              <span key={r} style={{
                display:"inline-grid", placeItems:"center",
                width:18, height:18, borderRadius:4,
                background:"var(--primary-soft)", color:"var(--primary)",
                font:"600 11px/1 'Noto Sans TC'",
              }}>{r}</span>
            ))}
          </div>
          {showProgress && (
            <span className="ff-mont" style={{marginLeft:"auto", paddingLeft:10,
              font:"500 12px/1 'Noto Sans TC'", color: s.complete ? "var(--ok)" : "var(--ink-3)",
              whiteSpace:"nowrap"}}>
              進度 <span className="tabular" style={{font:"600 12.5px/1 Montserrat", color: s.complete ? "var(--ok)" : "var(--ink-2)"}}>{s.done}/{s.total}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── helpers ───
function ChipGroup({ label, value, onChange, options }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:6}}>
      <span className="meta" style={{marginRight:4}}>{label}</span>
      {options.map(o => {
        const a = value === o.value;
        return (
          <button key={o.value} onClick={()=>onChange(o.value)} style={{
            padding:"7px 14px", borderRadius:14,
            font:"500 12px/1 'Noto Sans TC'",
            background: a ? "var(--primary)" : "#fff",
            color: a ? "#fff" : "var(--ink-2)",
            border: `1px solid ${a ? "var(--primary)" : "var(--line)"}`,
            cursor:"pointer", transition:"all .12s",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function StatusPill({ active, onClick, label, count, dot, bg, color }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"7px 14px", borderRadius: 16,
      background: active ? bg : "#fff",
      color: active ? color : "var(--ink-2)",
      border: `1px solid ${active ? "transparent" : "var(--line)"}`,
      font: "500 13px/1 'Noto Sans TC'", letterSpacing:".02em",
      cursor:"pointer", transition:"all .12s",
      boxShadow: active ? "0 1px 3px rgba(41,47,84,.06)" : "none",
    }}>
      <Dot color={dot}/> {label}
      <span className="tabular ff-mont" style={{
        font:"600 11px/1 Montserrat",
        color: active ? color : "var(--ink-4)",
        background: active ? "rgba(255,255,255,.55)" : "var(--line-2)",
        padding:"2px 6px", borderRadius:8,
      }}>{count}</span>
    </button>
  );
}

function Dot({ color, size = 7 }) {
  return <span style={{width:size, height:size, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0}}/>;
}

function FCode({ code, label }) {
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 10px", borderRadius:10, background:"#fff",
      border:"1px solid rgba(73,99,250,.25)",
      font:"500 11px/1.4 'Noto Sans TC'", color:"var(--ink-2)"}}>
      <span className="ff-mont" style={{font:"600 11px/1 Montserrat", color:"var(--primary)", letterSpacing:".04em"}}>{code}</span>
      <span style={{color:"var(--ink-3)"}}>·</span>
      {label}
    </span>
  );
}

function fmtDur(s) {
  const m = Math.floor(s/60), r = s%60;
  return `${m.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`;
}

const listTh = {
  padding:"14px 16px", textAlign:"left",
  font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".06em", whiteSpace:"nowrap",
};
const listTd = {
  padding:"16px 16px", verticalAlign:"middle", background:"#fff",
};

window.CaseListScreen = CaseListScreen;
window.FCode = FCode;
window.Dot = Dot;
window.fmtDur = fmtDur;
