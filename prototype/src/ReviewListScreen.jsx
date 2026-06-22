// ReviewListScreen — 內勤後台案件審核清單
// 對應功能：F-101 錄音案件追蹤 + F-102 案件搜尋 + F-108 案件清單匯出
//
// 與業務員前台清單的差異：
//   - 多欄位：業務員 / 通訊處 / 地區 / AI 風險分數 / SLA 倒數 / 指派審核員
//   - 多狀態維度：審核子階段（未指派/待審/審核中/已退回/已通過/逾期）
//   - 批次操作（checkbox + 全選）
//   - 進階篩選側欄（日期區間、地區、通訊處、業務員、商品、風險）
//   - 匯出按鈕（F-108）
//   - 預設依風險分數高 + SLA 短優先排序（給內勤快速找出該優先處理的案件）

function ReviewListScreen({ cases, onOpen, onCreate }) {
  const STATUS = window.__MLI_STATUS;
  const RISK   = window.__MLI_RISK;

  const [keyword, setKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("reviewing");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [regionFilter, setRegionFilter] = React.useState("all");
  const [branchFilter, setBranchFilter] = React.useState("all");
  const [agentFilter, setAgentFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState("risk");
  const [selected, setSelected] = React.useState(new Set());
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [showExportPanel, setShowExportPanel] = React.useState(false);

  // 篩選邏輯
  const filtered = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let list = cases.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false;
      if (regionFilter !== "all" && c.region !== regionFilter) return false;
      if (branchFilter !== "all" && c.branch !== branchFilter) return false;
      if (agentFilter !== "all" && c.agent !== agentFilter) return false;
      if (!kw) return true;
      const roleNames = c.roles ? Object.values(c.roles).map(r => r.name) : [];
      return [c.recordingNo, c.policyNo || "", c.product, c.agent, c.branch, ...roleNames]
        .some(v => v.toLowerCase().includes(kw));
    });
    if (sort === "risk") {
      list = [...list].sort((a,b) => (b.riskScore||0) - (a.riskScore||0));
    } else if (sort === "created_desc") {
      list = [...list].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "updated_desc") {
      list = [...list].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [cases, keyword, statusFilter, riskFilter, regionFilter, branchFilter, agentFilter, sort]);

  // KPI 概況（以 5 狀態為主）
  const kpis = React.useMemo(() => {
    const by = (k) => cases.filter(c => c.status === k).length;
    return {
      reviewing: by("reviewing"),
      returned:  by("returned"),
      resubmit:  by("resubmit"),
      highRisk:  cases.filter(c => c.riskLevel === "high" && ["reviewing","resubmit"].includes(c.status)).length,
    };
  }, [cases]);

  // 業務員選項（取 case 內已有的去重）
  const agentOptions = React.useMemo(() => {
    return ["all", ...Array.from(new Set(cases.map(c => c.agent)))];
  }, [cases]);

  const toggleSelect = (no) => {
    setSelected(s => {
      const ns = new Set(s);
      if (ns.has(no)) ns.delete(no); else ns.add(no);
      return ns;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c=>c.recordingNo)));
  };

  return (
    <div data-screen-label="01 案件審核清單" className="fadeup" style={{padding:"18px 28px 60px"}}>

      <AdminSubHeader title="案件審核"
        right={
          <>
            <button className="btn btn-quiet btn-sm" onClick={()=>setShowExportPanel(true)}>
              <I.Doc size={13}/> 匯出清單
            </button>
            <button className="btn btn-primary btn-sm" onClick={onCreate}>
              <I.Plus size={14}/> 建立錄音案件
            </button>
          </>
        }
      />

      {/* ─── KPI strip (compact) ─── */}
      <section className="card" style={{display:"flex", margin:"14px 0 14px", padding:"10px 6px"}}>
        <KpiInline label="審核中"   value={kpis.reviewing} color="var(--primary)"   accent/>
        <KpiInline label="退回補正" value={kpis.returned}  color="rgb(196,55,55)"/>
        <KpiInline label="補件審核" value={kpis.resubmit}  color="rgb(15,128,126)"/>
        <KpiInline label="高風險"   value={kpis.highRisk}  color="rgb(196,55,55)"/>
      </section>

      {/* ─── Filter row 1: search + tabs + sort + toggle ─── */}
      <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:10}}>
        <div style={{position:"relative", flex:"0 1 300px"}}>
          <I.Search size={14} stroke="var(--ink-4)" style={{position:"absolute", left:12, top:10}}/>
          <input className="input" style={{width:"100%", paddingLeft:34, height:34, fontSize:13}}
            value={keyword} onChange={e=>setKeyword(e.target.value)}
            placeholder="錄音編號 / 保單號 / 業務員 / 客戶"/>
        </div>
        <StageTabs value={statusFilter} onChange={setStatusFilter} cases={cases}/>
        <span style={{flex:1}}/>
        <select className="input" style={{height:34, fontSize:13, paddingRight:28, width:"auto"}}
          value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="risk">風險高優先</option>
          <option value="created_desc">建立日期新到舊</option>
          <option value="updated_desc">最近更新優先</option>
        </select>
        <button className="btn btn-quiet btn-sm" onClick={()=>setShowAdvanced(s=>!s)}>
          <I.Settings size={12}/> {showAdvanced ? "收合篩選" : "進階篩選"}
        </button>
      </div>

      {/* ─── Filter row 2: advanced filters (collapsible inline) ─── */}
      {showAdvanced && (
        <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap",
          padding:"10px 12px", borderRadius:8, background:"var(--primary-soft-2)", border:"1px solid var(--line-2)"}}>
          <InlineFilter label="風險">
            <div style={{display:"flex", gap:4}}>
              {[
                {v:"all",label:"全部",c:"var(--ink-3)"},
                {v:"high",label:"高",c:RISK.high.dot},
                {v:"mid", label:"中",c:RISK.mid.dot},
                {v:"low", label:"低",c:RISK.low.dot},
              ].map(o => {
                const a = riskFilter===o.v;
                return (
                  <button key={o.v} onClick={()=>setRiskFilter(o.v)} style={{
                    padding:"4px 10px", borderRadius:6,
                    font:"500 12px/1 'Noto Sans TC'",
                    background: a ? "var(--primary)" : "#fff",
                    color: a ? "#fff" : "var(--ink-2)",
                    border:`1px solid ${a?"var(--primary)":"var(--line)"}`,
                    cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4,
                  }}>
                    {o.v!=="all" && <Dot color={o.c} size={6}/>} {o.label}
                  </button>
                );
              })}
            </div>
          </InlineFilter>

          <InlineFilter label="地區">
            <select className="input" style={{height:30, fontSize:12, padding:"0 8px", width:110}}
              value={regionFilter} onChange={e=>{setRegionFilter(e.target.value); setBranchFilter("all");}}>
              <option value="all">全部地區</option>
              {window.__MLI_BRANCHES.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
            </select>
          </InlineFilter>

          <InlineFilter label="通訊處">
            <select className="input" style={{height:30, fontSize:12, padding:"0 8px", width:150}}
              value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
              <option value="all">全部通訊處</option>
              {window.__MLI_BRANCHES.filter(r => regionFilter==="all" || r.region===regionFilter).flatMap(r => r.branches).map(b => <option key={b}>{b}</option>)}
            </select>
          </InlineFilter>

          <InlineFilter label="業務員">
            <select className="input" style={{height:30, fontSize:12, padding:"0 8px", width:120}}
              value={agentFilter} onChange={e=>setAgentFilter(e.target.value)}>
              {agentOptions.map(a => <option key={a} value={a}>{a==="all"?"全部業務員":a}</option>)}
            </select>
          </InlineFilter>

          <InlineFilter label="商品">
            <select className="input" style={{height:30, fontSize:12, padding:"0 8px", width:110}}>
              <option>全部商品</option>
              <option>健康險</option>
              <option>壽險</option>
              <option>傷害險</option>
              <option>年金險</option>
              <option>投資型</option>
            </select>
          </InlineFilter>

          <InlineFilter label="送審日期">
            <input type="date" className="input" style={{height:30, fontSize:12, padding:"0 6px", width:130}}
              value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
            <span style={{color:"var(--ink-4)", margin:"0 4px"}}>—</span>
            <input type="date" className="input" style={{height:30, fontSize:12, padding:"0 6px", width:130}}
              value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
          </InlineFilter>

          <span style={{flex:1}}/>
          <button className="btn btn-quiet btn-sm" style={{padding:"4px 10px"}}
            onClick={()=>{ setRegionFilter("all"); setBranchFilter("all"); setAgentFilter("all"); setRiskFilter("all"); setDateFrom(""); setDateTo(""); }}>
            重設
          </button>
        </div>
      )}

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="card" style={{padding:"8px 14px", marginBottom:10,
          display:"flex", alignItems:"center", gap:12,
          background:"var(--primary-soft)", border:"1px solid rgba(73,99,250,.25)"}}>
          <span style={{font:"500 13px/1 'Noto Sans TC'", color:"var(--primary)"}}>
            已選取 <span className="ff-mont tabular" style={{fontWeight:700}}>{selected.size}</span> 筆案件
          </span>
          <span style={{flex:1}}/>
          <button className="btn btn-ghost btn-sm"><I.User size={12}/> 批次指派審核員</button>
          <button className="btn btn-ghost btn-sm"><I.Doc size={12}/> 批次匯出</button>
          <button className="btn btn-quiet btn-sm" onClick={()=>setSelected(new Set())}>取消選取</button>
        </div>
      )}

      {/* Permission notice */}
      <div style={{font:"400 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)", marginBottom:10, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap"}}>
        <I.Info size={11} stroke="var(--ink-4)"/>
        依您的權限設定僅顯示「{window.__MLI_REVIEWER_SELF.region}」案件
      </div>

      {/* Table */}
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"var(--primary-bg)", borderBottom:"1px solid var(--line-2)"}}>
                <th style={{...rTh, width:38, paddingLeft:16}}>
                  <Checkbox checked={selected.size>0 && selected.size===filtered.length}
                    indeterminate={selected.size>0 && selected.size<filtered.length}
                    onChange={toggleSelectAll}/>
                </th>
                <th style={{...rTh, width:170}}>錄音編號</th>
                <th style={{...rTh}}>商品</th>
                <th style={{...rTh, width:190}}>錄音對象</th>
                <th style={{...rTh, width:130}}>業務員</th>
                <th style={{...rTh, width:160}}>通訊處</th>
                <th style={{...rTh, width:100}}>建立日期</th>
                <th style={{...rTh, width:92}}>AI 通過率</th>
                <th style={{...rTh, width:120, paddingRight:16}}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <ReviewRow key={c.recordingNo} c={c}
                  selected={selected.has(c.recordingNo)}
                  onToggle={()=>toggleSelect(c.recordingNo)}
                  onOpen={()=>onOpen(c.recordingNo)}/>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{padding:"60px 0", textAlign:"center"}}>

                  <I.Search size={28} stroke="var(--ink-4)" style={{marginBottom:8}}/>
                  <div style={{font:"500 14px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>找不到符合條件的案件</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / paging */}
        <div style={{display:"flex", alignItems:"center", padding:"10px 16px", borderTop:"1px solid var(--line-2)",
          font:"400 12px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>
          <span>共 <span className="ff-mont tabular" style={{color:"var(--ink)", fontWeight:600}}>{filtered.length}</span> 筆案件{selected.size>0 && <>，已選 {selected.size}</>}</span>
          <span style={{marginLeft:"auto", display:"flex", gap:6, alignItems:"center"}}>
            <button className="btn btn-quiet btn-sm" disabled aria-disabled="true"><I.ChevronL size={12}/></button>
            <span className="ff-mont tabular" style={{padding:"5px 9px", borderRadius:12, background:"var(--primary-soft)", color:"var(--primary)", font:"600 12px/1 Montserrat"}}>1</span>
            <span style={{padding:"5px 9px", color:"var(--ink-4)", font:"500 12px/1 Montserrat"}}>2</span>
            <span style={{padding:"5px 9px", color:"var(--ink-4)", font:"500 12px/1 Montserrat"}}>3</span>
            <button className="btn btn-quiet btn-sm"><I.Chevron size={12}/></button>
            <select className="input" style={{height:28, marginLeft:6, fontSize:12, padding:"0 8px", width:"auto"}}>
              <option>20 筆/頁</option>
              <option>50 筆/頁</option>
              <option>100 筆/頁</option>
            </select>
          </span>
        </div>
      </div>

      {/* F-code legend (compact, single line) */}
      <section className="fcode-legend" style={{marginTop:12, font:"400 11.5px/1.5 'Noto Sans TC'", color:"var(--ink-4)",
        display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
        <span style={{font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".06em"}}>本畫面對應功能</span>
        <FCode code="F-101" label="案件追蹤"/>
        <FCode code="F-102" label="案件搜尋"/>
        <FCode code="F-108" label="清單匯出"/>
      </section>

      {/* Export modal */}
      {showExportPanel && <ExportModal onClose={()=>setShowExportPanel(false)}/>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function KpiInline({ label, value, color, accent, alert }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column", gap:4,
      padding:"6px 18px",
      borderLeft: accent ? "none" : "1px solid var(--line-2)",
      position:"relative",
    }}>
      {accent && <span style={{position:"absolute", left:18, top:6, bottom:6, width:2, borderRadius:1, background:color}}/>}
      <span style={{font:"500 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em", paddingLeft: accent ? 8 : 0}}>{label}</span>
      <div className="ff-mont tabular" style={{font:"700 22px/1 Montserrat", color: alert ? color : "var(--ink)", letterSpacing:".01em", paddingLeft: accent ? 8 : 0}}>
        {value}<span style={{font:"400 11px/1 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:4}}>件</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, emphasis, alert }) {
  return (
    <div className="card" style={{
      padding:"14px 16px",
      borderTop: emphasis ? `2px solid ${color}` : undefined,
      background: emphasis ? "#fff" : (alert ? "rgba(234,82,82,.04)" : "#fff"),
    }}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
        <span style={{width:24, height:24, borderRadius:6, background: emphasis ? "var(--primary-soft)" : "var(--primary-bg)",
          color, display:"grid", placeItems:"center"}}>{icon}</span>
        <span style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em"}}>{label}</span>
      </div>
      <div className="ff-mont tabular" style={{font:"700 28px/1 Montserrat", color, letterSpacing:".01em"}}>
        {value}<span style={{font:"400 12px/1 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:4}}>件</span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function StageTabs({ value, onChange, cases }) {
  const STATUS = window.__MLI_STATUS;
  const count = (k) => k === "all" ? cases.length : cases.filter(c => c.status === k).length;
  const tabs = [
    {v:"reviewing", label:STATUS.reviewing.label},
    {v:"returned",  label:STATUS.returned.label},
    {v:"resubmit",  label:STATUS.resubmit.label},
    {v:"approved",  label:STATUS.approved.label},
    {v:"draft",     label:STATUS.draft.label},
    {v:"all",       label:"全部"},
  ];
  return (
    <div style={{display:"flex", gap:0, background:"#fff", border:"1px solid var(--line)", borderRadius:8, padding:3}}>
      {tabs.map(t => {
        const a = value === t.v;
        return (
          <button key={t.v} onClick={()=>onChange(t.v)} style={{
            padding:"5px 12px", borderRadius:6, whiteSpace:"nowrap",
            font:"500 12.5px/1 'Noto Sans TC'",
            background: a ? "var(--primary)" : "transparent",
            color: a ? "#fff" : "var(--ink-2)", cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {t.label}
            <span className="ff-mont tabular" style={{
              padding:"2px 6px", borderRadius:8, fontSize:10.5, fontWeight:600,
              background: a ? "rgba(255,255,255,.22)" : "var(--line-2)",
              color: a ? "#fff" : "var(--ink-4)",
            }}>{count(t.v)}</span>
          </button>
        );
      })}
    </div>
  );
}

function InlineFilter({ label, children }) {
  return (
    <div style={{display:"inline-flex", alignItems:"center", gap:6}}>
      <span style={{font:"500 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em", whiteSpace:"nowrap"}}>{label}</span>
      {children}
    </div>
  );
}

function Checkbox({ checked, indeterminate, onChange }) {
  const ref = React.useRef();
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={!!checked} onChange={onChange}
    onClick={e=>e.stopPropagation()}
    style={{width:14, height:14, accentColor:"var(--primary)", cursor:"pointer"}}/>;
}

// ───────────────────────────────────────────────────────────────────────────
function ReviewRow({ c, selected, onToggle, onOpen }) {
  const STATUS = window.__MLI_STATUS;
  const status = STATUS[c.status] || STATUS.draft;
  const subjects = window.__MLI_uniqueSubjects(c);

  // 建立日期：僅顯示 YYYY-MM-DD
  const createdDate = (c.createdAt || "").split(" ")[0].replace(/\//g, "-");

  // AI 通過率：從詳情資料取得 — 僅 reviewing / 補件審核 顯示
  const showAiPass = c.status === "reviewing" || c.status === "returned" || c.status === "resubmit";
  const detail = (window.__MLI_REVIEW_DETAIL || {})[c.recordingNo];
  let aiPass = null;
  if (showAiPass && detail) {
    const total = detail.questions.length;
    const pass  = detail.questions.filter(q => q.status === "ok").length;
    aiPass = { pass, total, pct: Math.round(pass / total * 100) };
  }

  return (
    <tr onClick={onOpen} style={{
      borderBottom:"1px solid var(--line-2)", cursor:"pointer",
      transition:"background .12s",
      background: selected ? "rgba(73,99,250,.04)" : "#fff",
    }}
    onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background = "var(--primary-soft-2)"; }}
    onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background = "#fff"; }}>
      <td style={{...rTd, paddingLeft:16}} onClick={e=>e.stopPropagation()}>
        <Checkbox checked={selected} onChange={onToggle}/>
      </td>
      <td style={rTd}>
        <div className="ff-mont tabular" style={{font:"600 13px/1.2 Montserrat", color:"var(--primary)", letterSpacing:".02em"}}>
          {c.recordingNo}
        </div>
        {c.policyNo ? (
          <div className="ff-mont tabular" style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)", marginTop:4}}>
            {c.policyNo}
          </div>
        ) : (
          <div className="meta" style={{marginTop:4, fontSize:10.5, color:"var(--ink-4)"}}>未核發保單號</div>
        )}
      </td>
      <td style={rTd}>
        <div style={{font:"500 13px/1.35 'Noto Sans TC'", color:"var(--ink)"}}>{c.product}</div>
      </td>
      <td style={rTd}>
        <SubjectsCell subjects={subjects}/>
      </td>
      <td style={rTd}>
        <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{c.agent}</div>
        <div className="ff-mont" style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)", marginTop:3}}>{c.agentId}</div>
      </td>
      <td style={rTd}>
        <div style={{font:"500 12.5px/1.3 'Noto Sans TC'", color:"var(--ink-2)"}}>{c.branch}</div>
        <div style={{marginTop:3}}>
          <span style={{padding:"1px 6px", borderRadius:8, background:"var(--line-2)",
            font:"500 10.5px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>{c.region}</span>
        </div>
      </td>
      <td style={rTd}>
        <div className="ff-mont tabular" style={{font:"500 12px/1.3 Montserrat", color:"var(--ink-2)"}}>
          {createdDate}
        </div>
      </td>
      <td style={rTd}>
        {aiPass ? <AiPassRate pass={aiPass.pass} total={aiPass.total} pct={aiPass.pct}/>
                : <span className="meta" style={{color:"var(--ink-4)"}}>—</span>}
      </td>
      <td style={{...rTd, paddingRight:16}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6}}>
          <span style={{display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
            padding:"3px 9px", borderRadius:11, background:status.bg, color:status.color,
            font:"500 11.5px/1.4 'Noto Sans TC'"}}>
            <Dot color={status.dot} size={6}/> {status.label}
          </span>
          <I.Chevron size={12} stroke="var(--ink-4)"/>
        </div>
      </td>
    </tr>
  );
}

// AI 通過率：圓形進度條 + 百分比 + 通過題數
function AiPassRate({ pass, total, pct }) {
  const color = pct >= 90 ? "var(--ok)" : pct >= 70 ? "rgb(178,104,12)" : "var(--danger)";
  const bgColor = pct >= 90 ? "rgb(72,153,61)" : pct >= 70 ? "rgb(241,160,40)" : "rgb(234,82,82)";
  const r = 11, c = 2 * Math.PI * r;
  const offset = c * (1 - pct/100);
  return (
    <div style={{display:"inline-flex", alignItems:"center", gap:7}}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{flexShrink:0, transform:"rotate(-90deg)"}}>
        <circle cx="14" cy="14" r={r} fill="none" stroke="var(--line-2)" strokeWidth="3"/>
        <circle cx="14" cy="14" r={r} fill="none" stroke={bgColor} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div style={{display:"flex", flexDirection:"column", gap:2, lineHeight:1}}>
        <span className="ff-mont tabular" style={{font:"700 13px/1 Montserrat", color}}>{pct}<span style={{fontSize:10, fontWeight:500}}>%</span></span>
        <span className="ff-mont tabular" style={{font:"500 10.5px/1 Montserrat", color:"var(--ink-4)"}}>{pass}/{total}</span>
      </div>
    </div>
  );
}

// 錄音對象儲存格：與前台一致（去重合併 + 角色 chip）
function SubjectsCell({ subjects }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:5}}>
      {subjects.map((s, i) => (
        <div key={i} style={{display:"flex", alignItems:"center", gap:6}}>
          <span style={{font:"500 13px/1 'Noto Sans TC'", color:"var(--ink)"}}>{s.name}</span>
          <div style={{display:"flex", gap:3}}>
            {s.roles.map(r => (
              <span key={r} style={{
                display:"inline-grid", placeItems:"center",
                width:17, height:17, borderRadius:4,
                background:"var(--primary-soft)", color:"var(--primary)",
                font:"600 10.5px/1 'Noto Sans TC'",
              }}>{r}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function RiskBubble({ level, score }) {
  const RISK = window.__MLI_RISK;
  const r = RISK[level] || RISK.low;
  return (
    <div style={{display:"inline-flex", alignItems:"center", gap:6}}>
      <span style={{
        width:24, height:24, borderRadius:"50%", background:r.bg,
        border:`1.5px solid ${r.dot}`,
        display:"grid", placeItems:"center",
        font:"700 11px/1 'Noto Sans TC'", color:r.color, flexShrink:0,
      }}>{r.label}</span>
      <span className="ff-mont tabular" style={{font:"500 11px/1 Montserrat", color:"var(--ink-3)"}}>{score}</span>
    </div>
  );
}

function SttFlags({ flags }) {
  if (!flags) return <span className="meta">—</span>;
  return (
    <div style={{display:"flex", gap:6}}>
      <FlagPill icon="差" count={flags.diff}     color="rgb(196,55,55)"  bg="rgba(234,82,82,.10)"/>
      <FlagPill icon="否" count={flags.negation} color="rgb(178,104,12)" bg="rgba(241,160,40,.14)"/>
      <FlagPill icon="低" count={flags.lowConf}  color="rgb(98,100,118)" bg="rgba(140,142,157,.14)"/>
    </div>
  );
}

function FlagPill({ icon, count, color, bg }) {
  if (!count) return (
    <span style={{display:"inline-flex", alignItems:"center", gap:3, padding:"2px 5px", borderRadius:6,
      background:"var(--primary-bg)", color:"var(--ink-4)",
      font:"500 11px/1 'Noto Sans TC'", border:"1px solid var(--line-2)"}}>
      {icon}<span className="ff-mont">0</span>
    </span>
  );
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:3, padding:"2px 5px", borderRadius:6,
      background:bg, color,
      font:"500 11px/1 'Noto Sans TC'"}}>
      {icon}<span className="ff-mont">{count}</span>
    </span>
  );
}

function SlaPill({ days }) {
  if (days < 0) return (
    <span style={{display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:11,
      background:"var(--danger-soft)", color:"var(--danger)", whiteSpace:"nowrap",
      font:"600 11.5px/1.4 'Noto Sans TC'"}}>
      <I.Warn size={10} stroke="var(--danger)"/> SLA 超時 {-days} 天
    </span>
  );
  if (days === 0) return (
    <span style={{display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:11,
      background:"var(--danger-soft)", color:"var(--danger)", whiteSpace:"nowrap",
      font:"600 11.5px/1.4 'Noto Sans TC'"}}>
      今天到期
    </span>
  );
  if (days <= 2) return (
    <span style={{display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:11,
      background:"var(--warn-soft)", color:"rgb(178,104,12)", whiteSpace:"nowrap",
      font:"500 11.5px/1.4 'Noto Sans TC'"}}>
      剩 <span className="ff-mont tabular" style={{fontWeight:700}}>{days}</span> 天
    </span>
  );
  return (
    <span className="ff-mont tabular" style={{padding:"3px 8px", borderRadius:11,
      background:"var(--primary-bg)", color:"var(--ink-3)", whiteSpace:"nowrap",
      font:"500 11.5px/1.4 'Noto Sans TC'"}}>
      <span className="ff-mont" style={{fontWeight:700, color:"var(--ink-2)"}}>{days}</span> 天
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function ExportModal({ onClose }) {
  const [fmt, setFmt] = React.useState("xlsx");
  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:28, width:520}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18}}>
          <div style={{width:36, height:36, borderRadius:9, background:"var(--primary-soft)", color:"var(--primary)",
            display:"grid", placeItems:"center"}}><I.Doc size={18}/></div>
          <div>
            <h3 style={{margin:0, font:"700 17px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>匯出案件清單</h3>
            <p style={{margin:"4px 0 0", font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>
              F-108 · 依時間區間匯出含案件各項欄位資訊
            </p>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto", padding:6, color:"var(--ink-4)"}}><I.X size={18}/></button>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          <div>
            <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:6, letterSpacing:".04em"}}>時間區間</div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <input type="date" className="input" defaultValue="2026-05-01" style={{flex:1, height:36}}/>
              <span style={{color:"var(--ink-4)"}}>—</span>
              <input type="date" className="input" defaultValue="2026-05-23" style={{flex:1, height:36}}/>
            </div>
          </div>

          <div>
            <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:6, letterSpacing:".04em"}}>檔案格式</div>
            <div style={{display:"flex", gap:8}}>
              {[{v:"xlsx",l:"Excel (.xlsx)"},{v:"csv",l:"CSV (.csv)"},{v:"pdf",l:"PDF 報表"}].map(o=>(
                <button key={o.v} onClick={()=>setFmt(o.v)} style={{
                  flex:1, padding:"10px", borderRadius:8,
                  background: fmt===o.v ? "var(--primary-soft)" : "#fff",
                  border:`1px solid ${fmt===o.v?"var(--primary)":"var(--line)"}`,
                  color: fmt===o.v?"var(--primary)":"var(--ink-2)",
                  font:"500 12.5px/1 'Noto Sans TC'", cursor:"pointer",
                }}>{o.l}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:8, letterSpacing:".04em"}}>欄位選擇</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:"10px 12px",
              border:"1px solid var(--line)", borderRadius:8, background:"var(--primary-bg)"}}>
              {["錄音編號","保單號碼","商品名稱","要保人","被保險人","業務員","通訊處","地區","審核狀態","風險等級","送審時間","審核時間","STT 旗標數","審核員"].map((f,i)=>(
                <label key={f} style={{display:"flex", alignItems:"center", gap:6, font:"400 12px/1.4 'Noto Sans TC'", color:"var(--ink-2)"}}>
                  <input type="checkbox" defaultChecked={i<10} style={{accentColor:"var(--primary)"}}/> {f}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:22}}>
          <button className="btn btn-quiet" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={onClose}>
            <I.Doc size={14}/> 確認匯出
          </button>
        </div>
      </div>
    </div>
  );
}

const rTh = {
  padding:"10px 12px", textAlign:"left",
  font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".08em", whiteSpace:"nowrap",
};
const rTd = {
  padding:"12px 12px", verticalAlign:"middle", background:"transparent",
};

window.ReviewListScreen = ReviewListScreen;
window.RiskBubble = RiskBubble;
window.SttFlags = SttFlags;
window.SlaPill = SlaPill;
