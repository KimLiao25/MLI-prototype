// AdminHeader — 內勤審核後台 Header（與業務員前台 Header 同調，但子標題改為「內勤審核後台」）
// + 左側 RailNav（後台特有，業務員前台無此元件）

function AdminHeader({ self, page, onNav }) {
  return (
    <header className="hdr">
      <div className="hdr-brand">
        <I.Logo size={22}/>
        <div className="name">
          <div>
            <div className="sub">SYSTALK.</div>
            <div className="audio-label">AUDIO</div>
          </div>
        </div>
        <div className="hdr-divider"/>
        <div style={{font:"500 13px/1 'Noto Sans TC'",color:"rgba(255,255,255,.92)",letterSpacing:".06em",whiteSpace:"nowrap"}}>
          內勤審核後台
        </div>
      </div>

      <div className="hdr-right" style={{marginLeft:"auto"}}>
        <span className="help" title="通知" style={{position:"relative"}}>
          <I.Bell size={18}/>
          <span style={{position:"absolute",top:-2,right:-2,width:7,height:7,borderRadius:"50%",
            background:"rgb(255,193,77)",border:"1.5px solid var(--primary)"}}/>
        </span>
        <div className="hdr-user">
          <div className="avatar" style={{background:"rgba(255,255,255,.22)", font:"700 11px/1 'Noto Sans TC'"}}>{self.avatar}</div>
          <span style={{font:"500 13px/1 'Noto Sans TC'"}}>{self.name}</span>
          <I.ChevronD size={14}/>
        </div>
      </div>
    </header>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 左側 RailNav — 內勤後台主要導覽（窄條 + icon + 文字）
// 為了較密的資訊密度，採 200px 寬，分群顯示

// 局部 icon — bar chart（質檢報告用）
function ChartIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20V13M22 20H2"/>
    </svg>
  );
}

function RailNav({ page, onNav, counts = {} }) {
  const groups = [
    { title: "案件管理", items: [
      { id:"review_list",     label:"案件審核",   icon:<I.Headset size={18}/>, badge: counts.pending },
      { id:"quality_report",  label:"質檢報告",   icon:<ChartIcon/>             },
    ]},
    { title: "錄音作業", items: [
      { id:"create",          label:"建立錄音案件", icon:<I.Plus size={18}/>     },
    ]},
    { title: "系統管理", items: [
      { id:"logs",            label:"操作紀錄",   icon:<I.Clock size={18}/>      },
    ]},
  ];

  return (
    <aside className="rail">
      <div className="rail-self">
        <div className="rail-self-avatar">{window.__MLI_REVIEWER_SELF.avatar}</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{font:"600 12.5px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>
            {window.__MLI_REVIEWER_SELF.name}
          </div>
          <div className="meta" style={{marginTop:3, fontSize:11}}>
            {window.__MLI_REVIEWER_SELF.title} · {window.__MLI_REVIEWER_SELF.region}
          </div>
        </div>
      </div>

      {groups.map(g => (
        <div key={g.title} style={{marginTop: 18}}>
          <div className="rail-group">{g.title}</div>
          {g.items.map(it => {
            const active = page === it.id;
            return (
              <button key={it.id} className={"rail-item" + (active ? " active" : "")}
                onClick={() => onNav && onNav(it.id)}>
                <span className="rail-icon">{it.icon}</span>
                <span className="rail-label">{it.label}</span>
                {it.badge != null && it.badge > 0 && (
                  <span className="rail-badge">{it.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="rail-footer">
        <button className="btn btn-quiet btn-sm" style={{width:"100%", justifyContent:"flex-start", paddingLeft:10}}>
          <I.Settings size={14}/> 個人設定
        </button>
      </div>
    </aside>
  );
}

// SubHeader：與前台版本相容（直接複用 SubHeader-like 結構），但這裡為了 admin 樣式微調
function AdminSubHeader({ title, crumbs = [], right = null, badge = null, desc = null }) {
  return (
    <div className="subhdr admin-subhdr">
      <div style={{display:"flex", flexDirection:"column", gap:4}}>
        {crumbs.length > 0 && (
          <div className="crumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span>{c}</span>
                {i < crumbs.length - 1 && <I.Chevron size={10} stroke="var(--ink-4)"/>}
              </React.Fragment>
            ))}
          </div>
        )}
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <h1 style={{margin:0, font:"700 19px/1.2 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".03em", whiteSpace:"nowrap"}}>{title}</h1>
          {badge}
        </div>
        {desc && <div className="meta" style={{marginTop:2}}>{desc}</div>}
      </div>
      {right && (
        <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>{right}</div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Shared util components (Dot / FCode / fmtDur)
// 前台 CaseListScreen.jsx 中也有定義；後台未載入該檔，這裡定義並掛 window
function Dot({ color, size = 7 }) {
  return <span style={{width:size, height:size, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0}}/>;
}

function FCode({ code, label }) {
  return (
    <span className="fcode-legend" style={{display:"inline-flex", alignItems:"center", gap:6,
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
  const m = Math.floor(s/60), r = Math.floor(s%60);
  return `${m.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`;
}

window.Dot = Dot;
window.FCode = FCode;
window.fmtDur = fmtDur;
window.AdminHeader = AdminHeader;
window.RailNav = RailNav;
window.AdminSubHeader = AdminSubHeader;
