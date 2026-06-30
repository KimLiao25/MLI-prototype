// ════════════════════════════════════════════════════════════════════════════
// CreateCaseAdmin — 內勤代建立錄音案件（F-105）
// 與業務員前台流程幾乎相同，但內勤可指定業務員與通訊處
// 為簡潔，本 prototype 採用一頁式表單（不分 step）
// ════════════════════════════════════════════════════════════════════════════
function CreateCaseAdminScreen({ onBack, onCreated }) {
  const [recordingNo, setRecordingNo] = React.useState(null);

  return (
    <div data-screen-label="04 建立錄音案件" className="fadeup" style={{padding:"18px 28px 60px"}}>
      <AdminSubHeader title="建立錄音案件"
        crumbs={["內勤審核後台", "錄音作業", "建立案件"]}
        desc="內勤代業務員建立錄音案件並取得錄音編號，後續可由業務員端登入接續錄音"
        right={
          <button className="btn btn-quiet btn-sm" onClick={onBack}><I.ChevronL size={11}/> 返回</button>
        }/>

      <div style={{display:"grid", gridTemplateColumns:"minmax(0,1fr) 360px", gap:20, marginTop:16}}>
        <section className="card" style={{padding:24}}>
          <h3 style={{margin:"0 0 14px", font:"700 15px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>
            案件資訊
          </h3>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <Field label="保險商品" required>
              <select className="input">
                <option value="">請選擇商品</option>
                {window.__MLI_PRODUCTS.map(p => <option key={p.code}>{p.code} · {p.name}</option>)}
              </select>
            </Field>
            <Field label="案件來源">
              <select className="input">
                <option>建議書系統</option>
                <option>行動投保系統</option>
                <option>內勤直建</option>
              </select>
            </Field>
          </div>

          <SectionDivider label="客戶資訊"/>
          <div style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:14}}>
            <Field label="要保人姓名" required><input className="input" placeholder="王志明"/></Field>
            <Field label="身分證字號" required><input className="input ff-mont" placeholder="A123456789" style={{letterSpacing:".08em"}}/></Field>
            <Field label="年齡" required><input className="input ff-mont" type="number" placeholder="68"/></Field>
          </div>
          <div style={{marginTop:8}}>
            <label style={{display:"flex", alignItems:"center", gap:6, font:"500 12.5px/1 'Noto Sans TC'", color:"var(--ink-2)", cursor:"pointer"}}>
              <input type="checkbox" defaultChecked style={{accentColor:"var(--primary)"}}/>
              被保險人、繳款人均同要保人
            </label>
          </div>

          <SectionDivider label="業務員指派"/>
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 2fr", gap:14}}>
            <Field label="業務員姓名"><input className="input" defaultValue="林佩君"/></Field>
            <Field label="業務員代號"><input className="input ff-mont" defaultValue="A0427" style={{letterSpacing:".08em"}}/></Field>
            <Field label="所屬通訊處">
              <select className="input">
                {window.__MLI_BRANCHES.flatMap(r=>r.branches).map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>

          <SectionDivider label="備註"/>
          <textarea placeholder="輸入備註（可選）"
            style={{
              width:"100%", minHeight:60, resize:"vertical",
              padding:"10px 14px", borderRadius:8, border:"1px solid var(--line)",
              font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)", outline:"none",
            }}/>
        </section>

        <aside style={{display:"flex", flexDirection:"column", gap:14}}>
          {!recordingNo ? (
            <>
              <section className="card" style={{padding:20}}>
                <div style={{font:"700 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", marginBottom:10}}>
                  取號預覽
                </div>
                <div style={{padding:"18px 14px", borderRadius:10, background:"var(--primary-bg)",
                  border:"1px dashed var(--line)", textAlign:"center"}}>
                  <div className="ff-mont" style={{font:"500 11px/1.4 Montserrat", color:"var(--ink-4)", letterSpacing:".06em", marginBottom:6}}>
                    RECORDING NO.
                  </div>
                  <div className="ff-mont tabular" style={{font:"700 22px/1 Montserrat", color:"var(--ink-3)", letterSpacing:".04em"}}>
                    A00<span style={{color:"var(--ink-4)"}}>XX</span>
                  </div>
                  <div className="meta" style={{marginTop:8, fontSize:11}}>
                    確認後系統自動配發錄音編號，並依場次拆出案件編號
                  </div>
                </div>
              </section>
              <button className="btn btn-primary btn-lg" style={{width:"100%"}}
                onClick={()=>setRecordingNo("A0023")}>
                <I.Plus size={15}/> 取得錄音編號
              </button>
              <section style={{padding:"10px 14px", borderRadius:10,
                background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
                font:"400 11.5px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
                display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                <span style={{font:"600 11px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>對應功能</span>
                <FCode code="F-105" label="建立錄音案件"/>
              </section>
            </>
          ) : (
            <>
              <section className="card" style={{padding:20, borderColor:"var(--ok)", borderWidth:1, borderStyle:"solid"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                  <I.Check size={16} stroke="var(--ok)" sw={2.6}/>
                  <span style={{font:"700 13px/1 'Noto Sans TC'", color:"var(--ok)", letterSpacing:".04em"}}>取號成功</span>
                </div>
                <div style={{padding:"16px 14px", borderRadius:10, background:"var(--ok-soft)", textAlign:"center"}}>
                  <div className="ff-mont" style={{font:"500 11px/1.4 Montserrat", color:"rgb(58,124,49)", letterSpacing:".06em", marginBottom:6}}>
                    RECORDING NO.
                  </div>
                  <div className="ff-mont tabular" style={{font:"700 22px/1 Montserrat", color:"rgb(45,108,38)", letterSpacing:".04em"}}>
                    {recordingNo}
                  </div>
                </div>
                <p style={{margin:"10px 0 0", font:"400 11.5px/1.5 'Noto Sans TC'", color:"var(--ink-3)"}}>
                  個別案件編號將為 <span className="ff-mont">{recordingNo}-1</span>（依場次遞增）。
                  業務員可使用建議書 APP 或 Web 端登入後接續錄音作業。
                </p>
              </section>
              <button className="btn btn-primary btn-lg" onClick={onCreated} style={{width:"100%"}}>
                返回案件清單
              </button>
              <button className="btn btn-quiet" style={{width:"100%"}} onClick={()=>setRecordingNo(null)}>
                再建立一筆
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Logs Screen — 操作 Log（F-503）簡易呈現
// ════════════════════════════════════════════════════════════════════════════
function LogsScreen({ onBack }) {
  const LOGS = [
    {time:"2026/05/23 14:32:18", user:"王怡萱 (E102934)", action:"審核通過", target:"A0015-1", detail:"送 BPM、產生 PDF"},
    {time:"2026/05/23 14:18:45", user:"王怡萱 (E102934)", action:"退回補正", target:"A0016-1", detail:"原因：音檔不清晰"},
    {time:"2026/05/23 13:55:09", user:"王怡萱 (E102934)", action:"下載音檔", target:"A0015-1", detail:"_merged.wav (5.2 MB)"},
    {time:"2026/05/23 13:42:11", user:"陳俊宏 (E121095)", action:"重新觸發 STT", target:"A0013-1", detail:""},
    {time:"2026/05/23 11:20:33", user:"王怡萱 (E102934)", action:"檢視案件", target:"A0003-1", detail:""},
    {time:"2026/05/23 11:08:22", user:"張嘉玲 (E133247)", action:"建立案件", target:"A0021-1", detail:"手動建立"},
    {time:"2026/05/23 10:55:14", user:"王怡萱 (E102934)", action:"手動上傳音檔", target:"A0020-1", detail:"補件案件"},
    {time:"2026/05/23 09:48:02", user:"王怡萱 (E102934)", action:"重新合併音檔", target:"A0017-1", detail:"分段音檔重組"},
    {time:"2026/05/23 09:12:50", user:"王怡萱 (E102934)", action:"登入系統", target:"—", detail:"AD 認證成功"},
    {time:"2026/05/22 18:25:33", user:"王怡萱 (E102934)", action:"審核通過", target:"A0018-1", detail:"送 BPM"},
  ];

  const actionColor = (a) => {
    if (a.includes("通過")) return "var(--ok)";
    if (a.includes("退回") || a.includes("刪除")) return "var(--danger)";
    if (a.includes("登入") || a.includes("登出")) return "var(--ink-3)";
    return "var(--primary)";
  };

  return (
    <div data-screen-label="05 操作紀錄" className="fadeup" style={{padding:"18px 28px 60px"}}>
      <AdminSubHeader title="操作紀錄"
        crumbs={["內勤審核後台", "行政", "操作紀錄"]}
        desc="所有操作（查詢、異動、下載、備註）均自動記錄，含人員、動作、時間"
        right={
          <>
            <button className="btn btn-quiet btn-sm"><I.Doc size={12}/> 匯出日誌</button>
            <button className="btn btn-quiet btn-sm" onClick={onBack}><I.ChevronL size={11}/> 返回</button>
          </>
        }/>

      <div style={{display:"flex", gap:10, alignItems:"center", margin:"16px 0 12px", flexWrap:"wrap"}}>
        <div style={{position:"relative", flex:"0 1 280px"}}>
          <I.Search size={14} stroke="var(--ink-4)" style={{position:"absolute", left:12, top:10}}/>
          <input className="input" style={{paddingLeft:34, height:34, fontSize:13, width:"100%"}}
            placeholder="搜尋操作人員、目標案件"/>
        </div>
        <select className="input" style={{height:34, fontSize:13}}>
          <option>所有動作類型</option>
          <option>審核通過</option>
          <option>退回補正</option>
          <option>下載音檔</option>
          <option>重新觸發 STT</option>
          <option>登入登出</option>
        </select>
        <input type="date" className="input" defaultValue="2026-05-01" style={{height:34, fontSize:13}}/>
        <span style={{color:"var(--ink-4)"}}>—</span>
        <input type="date" className="input" defaultValue="2026-05-23" style={{height:34, fontSize:13}}/>
        <span style={{flex:1}}/>
        <span className="meta">共 1,247 筆紀錄</span>
      </div>

      <section className="card" style={{overflow:"hidden"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"var(--primary-bg)", borderBottom:"1px solid var(--line-2)"}}>
              <th style={{padding:"10px 14px", textAlign:"left", font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", width:170}}>時間</th>
              <th style={{padding:"10px 14px", textAlign:"left", font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", width:200}}>操作人員</th>
              <th style={{padding:"10px 14px", textAlign:"left", font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", width:130}}>動作</th>
              <th style={{padding:"10px 14px", textAlign:"left", font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em", width:150}}>目標</th>
              <th style={{padding:"10px 14px", textAlign:"left", font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em"}}>內容</th>
            </tr>
          </thead>
          <tbody>
            {LOGS.map((l,i) => (
              <tr key={i} style={{borderBottom:"1px solid var(--line-2)"}}>
                <td className="tabular ff-mont" style={{padding:"10px 14px", font:"500 12px/1.4 Montserrat", color:"var(--ink-2)"}}>{l.time}</td>
                <td style={{padding:"10px 14px", font:"400 12.5px/1.4 'Noto Sans TC'", color:"var(--ink)"}}>{l.user}</td>
                <td style={{padding:"10px 14px"}}>
                  <span style={{display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:11,
                    background:"transparent", border:`1px solid ${actionColor(l.action)}`,
                    color:actionColor(l.action), font:"500 11.5px/1.4 'Noto Sans TC'"}}>
                    {l.action}
                  </span>
                </td>
                <td className="ff-mont tabular" style={{padding:"10px 14px", font:"500 12px/1.4 Montserrat", color:"var(--primary)"}}>{l.target}</td>
                <td style={{padding:"10px 14px", font:"400 12.5px/1.4 'Noto Sans TC'", color:"var(--ink-3)"}}>{l.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{marginTop:16, padding:"10px 14px", borderRadius:10,
        background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
        font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
        display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
        <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>本畫面對應功能</span>
        <FCode code="F-503" label="操作 Log 紀錄"/>
      </section>
    </div>
  );
}

// ────────── helpers ──────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:6}}>
      <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
        <span style={{font:"500 12.5px/1 'Noto Sans TC'", color:"var(--ink-2)", letterSpacing:".04em"}}>
          {label}{required && <span style={{color:"var(--danger)", marginLeft:3}}>*</span>}
        </span>
        {hint && <span className="meta" style={{fontSize:11}}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function SectionDivider({ label }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:10, margin:"18px 0 12px"}}>
      <span style={{font:"600 11.5px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".08em"}}>
        {label}
      </span>
      <div style={{flex:1, height:1, background:"var(--line-2)"}}/>
    </div>
  );
}

window.CreateCaseAdminScreen = CreateCaseAdminScreen;
window.LogsScreen = LogsScreen;
