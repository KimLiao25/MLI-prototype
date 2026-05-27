// Header — matches the design system /external-shared/Head6 pattern
// (indigo bar, brand on left, nav tabs, user on right)

function Header({ caseInfo, screen, onNav }) {
  const tabs = [
    { id: "list",  label: "我的案件" },
    { id: "guide", label: "操作指引" },
    { id: "help",  label: "說明文件" },
  ];
  // 預設 "我的案件" tab；錄音 / 上傳 / 案件內容皆屬此分頁的延伸
  const activeId = "list";

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
        <div style={{font:"500 13px/1 'Noto Sans TC'",color:"rgba(255,255,255,.92)",letterSpacing:".06em"}}>
          高齡保險錄音前台
        </div>
      </div>

      <nav className="hdr-nav">
        {tabs.map(t => (
          <button key={t.id} className={t.id===activeId?"active":""}
            onClick={() => onNav && onNav(t.id)}>{t.label}</button>
        ))}
      </nav>

      <div className="hdr-right">
        <span className="help" title="說明">
          <I.Info size={18}/>
        </span>
        <span className="help" title="通知" style={{position:"relative"}}>
          <I.Bell size={18}/>
          <span style={{position:"absolute",top:-2,right:-2,width:7,height:7,borderRadius:"50%",
            background:"rgb(255,193,77)",border:"1.5px solid var(--primary)"}}/>
        </span>
        <div className="hdr-user">
          <div className="avatar"><I.User size={14}/></div>
          <span>{caseInfo?.agent || "User"}</span>
          <I.ChevronD size={14}/>
        </div>
      </div>
    </header>
  );
}

// Sub header — title + breadcrumb + actions (right slot)
function SubHeader({ title, crumbs = [], right = null, recordingNo, time }) {
  return (
    <div className="subhdr">
      <h1>{title}</h1>
      {crumbs.length > 0 && (
        <div className="crumb">
          <I.ChevronD size={14} style={{transform:"rotate(-90deg)"}}/>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <span>{c}</span>
              {i < crumbs.length - 1 && <span style={{color:"var(--ink-4)"}}>/</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      {recordingNo && (
        <div className="meta tabular" style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:14}}>
          <span style={{display:"flex",alignItems:"center",gap:6}}>
            <I.Hash size={14} stroke="var(--ink-4)"/> {recordingNo}
          </span>
          <span style={{width:1,height:14,background:"var(--line-3)"}}/>
          <span style={{display:"flex",alignItems:"center",gap:6}}>
            <I.Clock size={14} stroke="var(--ink-4)"/> {time}
          </span>
        </div>
      )}
      {right && (
        <div style={{marginLeft:recordingNo?16:"auto",display:"flex",gap:10,alignItems:"center"}}>{right}</div>
      )}
    </div>
  );
}

window.Header = Header;
window.SubHeader = SubHeader;
