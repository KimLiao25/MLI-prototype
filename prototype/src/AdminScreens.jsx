// ManualUploadScreen — 手動上傳音檔（F-106）
// 內勤補件/特殊案件用：填寫案件欄位 + 上傳音檔，系統觸發 STT 處理
//
// 與業務員前台 EntryScreen 的差異：
//   - 內勤可手動指定 / 編輯所有欄位（含業務員、通訊處）
//   - 一次完成：案件欄位 + 上傳音檔 一步到位
//   - 上傳後直接進入待審核佇列

function ManualUploadScreen({ onBack, onSubmitted }) {
  const [step, setStep] = React.useState(1); // 1: 填欄位 + 選檔 | 2: 處理中 | 3: 完成
  const [form, setForm] = React.useState({
    product: "",
    proposer: "", proposerId: "", proposerAge: "",
    insured: "", insuredId: "", insuredAge: "",
    payerSame: true,
    agent: "林佩君", agentId: "A0427",
    branch: "台北中山通訊處",
    note: "",
  });
  const [file, setFile] = React.useState(null);

  const handleSubmit = () => {
    setStep(2);
    setTimeout(() => setStep(3), 2200);
  };

  return (
    <div data-screen-label="03 手動上傳音檔" className="fadeup" style={{padding:"18px 28px 60px"}}>

      <AdminSubHeader title="手動上傳音檔"
        crumbs={["內勤審核後台", "錄音作業", "手動上傳"]}
        desc="補件或特殊案件用：填寫案件資訊並上傳音檔，系統將自動觸發 STT 處理"
        right={
          <button className="btn btn-quiet btn-sm" onClick={onBack}>
            <I.ChevronL size={11}/> 返回
          </button>
        }
      />

      {/* Stepper */}
      <div style={{display:"flex", alignItems:"center", gap:8, margin:"18px 0 20px"}}>
        <Step n={1} label="填寫案件資訊" active={step>=1} done={step>1}/>
        <Line done={step>1}/>
        <Step n={2} label="上傳處理"     active={step>=2} done={step>2}/>
        <Line done={step>2}/>
        <Step n={3} label="送入審核佇列" active={step>=3}/>
      </div>

      {step === 1 && (
        <div style={{display:"grid", gridTemplateColumns:"minmax(0,1fr) 360px", gap:20}}>
          {/* Form */}
          <section className="card" style={{padding:24}}>
            <h3 style={{margin:"0 0 16px", font:"700 15px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>
              案件資訊
            </h3>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
              <Field label="保險商品" required>
                <select className="input" value={form.product}
                  onChange={e=>setForm({...form, product:e.target.value})}>
                  <option value="">請選擇商品</option>
                  {window.__MLI_PRODUCTS.map(p => (
                    <option key={p.code} value={p.name}>{p.code} · {p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="案件來源" hint="補件案件請選擇對應來源系統">
                <select className="input">
                  <option>建議書系統</option>
                  <option>行動投保系統</option>
                  <option>內勤補件</option>
                </select>
              </Field>
            </div>

            <SectionDivider label="要保人資訊"/>
            <div style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:14}}>
              <Field label="姓名" required>
                <input className="input" value={form.proposer} onChange={e=>setForm({...form, proposer:e.target.value})} placeholder="請輸入要保人姓名"/>
              </Field>
              <Field label="身分證字號" required>
                <input className="input ff-mont" value={form.proposerId} onChange={e=>setForm({...form, proposerId:e.target.value})} placeholder="A123456789" style={{letterSpacing:".08em"}}/>
              </Field>
              <Field label="年齡" required>
                <input className="input ff-mont" type="number" value={form.proposerAge} onChange={e=>setForm({...form, proposerAge:e.target.value})} placeholder="65"/>
              </Field>
            </div>

            <SectionDivider label="被保險人資訊"/>
            <div style={{marginBottom:12}}>
              <label style={{display:"flex", alignItems:"center", gap:6, font:"500 12.5px/1 'Noto Sans TC'", color:"var(--ink-2)", cursor:"pointer"}}>
                <input type="checkbox" defaultChecked={false} style={{accentColor:"var(--primary)"}}/>
                被保險人同要保人
              </label>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:14}}>
              <Field label="姓名" required>
                <input className="input" placeholder="請輸入被保險人姓名"/>
              </Field>
              <Field label="身分證字號" required>
                <input className="input ff-mont" placeholder="A223456789" style={{letterSpacing:".08em"}}/>
              </Field>
              <Field label="年齡" required>
                <input className="input ff-mont" type="number" placeholder="65"/>
              </Field>
            </div>

            <SectionDivider label="繳款人資訊"/>
            <div style={{marginBottom:12}}>
              <label style={{display:"flex", alignItems:"center", gap:6, font:"500 12.5px/1 'Noto Sans TC'", color:"var(--ink-2)", cursor:"pointer"}}>
                <input type="checkbox" checked={form.payerSame} onChange={e=>setForm({...form, payerSame:e.target.checked})} style={{accentColor:"var(--primary)"}}/>
                繳款人同要保人
              </label>
            </div>
            {!form.payerSame && (
              <div style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr", gap:14}}>
                <Field label="姓名"><input className="input"/></Field>
                <Field label="身分證字號"><input className="input ff-mont"/></Field>
                <Field label="年齡"><input className="input ff-mont" type="number"/></Field>
              </div>
            )}

            <SectionDivider label="業務員資訊"/>
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 2fr", gap:14}}>
              <Field label="業務員姓名">
                <input className="input" value={form.agent} onChange={e=>setForm({...form, agent:e.target.value})}/>
              </Field>
              <Field label="業務員代號">
                <input className="input ff-mont" value={form.agentId} onChange={e=>setForm({...form, agentId:e.target.value})} style={{letterSpacing:".08em"}}/>
              </Field>
              <Field label="所屬通訊處">
                <select className="input" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}>
                  {window.__MLI_BRANCHES.flatMap(r=>r.branches).map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <SectionDivider label="補件原因"/>
            <textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})}
              placeholder="請說明本次補件原因，例如：原始錄音遺失、業務員端網路中斷未上傳完成、原始案件特殊處理等"
              style={{
                width:"100%", minHeight:80, resize:"vertical",
                padding:"10px 14px", borderRadius:8, border:"1px solid var(--line)",
                font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink)", outline:"none",
              }}/>
          </section>

          {/* Upload + Submit */}
          <aside style={{display:"flex", flexDirection:"column", gap:14}}>
            <section className="card" style={{padding:20}}>
              <h3 style={{margin:"0 0 12px", font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".04em"}}>
                <I.Upload size={14} stroke="var(--primary)" style={{verticalAlign:-2, marginRight:6}}/>
                音檔上傳
              </h3>

              {!file ? (
                <div onClick={()=>setFile({name:"manual_upload_20260523.wav", size:"4.2 MB"})}
                  style={{
                    padding:"30px 16px", borderRadius:10,
                    border:"2px dashed rgba(73,99,250,.4)",
                    background:"var(--primary-soft-2)",
                    textAlign:"center", cursor:"pointer",
                  }}>
                  <I.Upload size={28} stroke="var(--primary)" sw={1.6}/>
                  <div style={{font:"500 13px/1.4 'Noto Sans TC'", color:"var(--ink-2)", marginTop:8}}>
                    點擊或拖曳音檔至此
                  </div>
                  <div className="meta" style={{marginTop:6, fontSize:11}}>
                    支援 mp3 / mp4 / m4a / wav<br/>
                    單檔上限 100 MB
                  </div>
                </div>
              ) : (
                <div style={{padding:"14px 12px", borderRadius:10, background:"var(--primary-bg)",
                  border:"1px solid var(--line-2)"}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                    <I.Doc size={18} stroke="var(--primary)"/>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="ff-mont tabular" style={{font:"500 12px/1.3 Montserrat", color:"var(--ink)"}}>{file.name}</div>
                      <div className="meta" style={{marginTop:3, fontSize:11}}>{file.size} · WAV · 09:24</div>
                    </div>
                    <button onClick={()=>setFile(null)} style={{padding:4, color:"var(--ink-4)"}}><I.X size={14}/></button>
                  </div>
                  <StaticWaveform progress={0} bars={32} height={28}
                    color="var(--primary-2)" muted="var(--line-3)"/>
                </div>
              )}
            </section>

            <section className="card" style={{padding:"14px 16px", background:"var(--warn-soft)", border:"1px solid rgba(241,160,40,.3)"}}>
              <div style={{display:"flex", gap:8}}>
                <I.Info size={14} stroke="rgb(151,89,15)" style={{flexShrink:0, marginTop:2}}/>
                <div style={{font:"400 12px/1.55 'Noto Sans TC'", color:"rgb(151,89,15)"}}>
                  <b style={{display:"block", marginBottom:4}}>提醒</b>
                  上傳後系統會自動取得新的錄音編號，並觸發 STT 比對處理。
                  處理完成後案件將出現在「待我審核」清單中。
                </div>
              </div>
            </section>

            <button className="btn btn-primary btn-lg" disabled={!file}
              onClick={handleSubmit}
              style={{width:"100%"}}>
              <I.Upload size={15}/> 送出並開始處理
            </button>

            <section style={{padding:"10px 14px", borderRadius:10,
              background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
              font:"400 11.5px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
              display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
              <span style={{font:"600 11px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>對應功能</span>
              <FCode code="F-106" label="手動上傳音檔"/>
              <FCode code="F-201" label="音檔上傳處理"/>
              <FCode code="F-203" label="STT 觸發"/>
            </section>
          </aside>
        </div>
      )}

      {step === 2 && (
        <section className="card" style={{padding:"40px 28px", maxWidth:560, margin:"40px auto", textAlign:"center"}}>
          <div style={{width:64, height:64, borderRadius:"50%", background:"var(--primary-soft)",
            display:"grid", placeItems:"center", margin:"0 auto 16px"}}>
            <svg className="spin" width={32} height={32} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--primary-soft)" strokeWidth="2.5"/>
              <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 style={{margin:"0 0 8px", font:"700 17px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>處理中…</h3>
          <p style={{margin:"0 0 20px", font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink-3)"}}>
            正在上傳音檔並建立案件，預計 30 秒內完成
          </p>
          <div style={{display:"flex", flexDirection:"column", gap:10, textAlign:"left", maxWidth:380, margin:"0 auto"}}>
            <StepLine label="建立案件編號" done/>
            <StepLine label="上傳音檔至 Object Storage" done/>
            <StepLine label="觸發 STT 比對引擎" loading/>
            <StepLine label="送入待審核佇列"/>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card" style={{padding:"40px 28px", maxWidth:560, margin:"40px auto", textAlign:"center"}}>
          <div style={{width:72, height:72, borderRadius:"50%", background:"var(--ok-soft)",
            display:"grid", placeItems:"center", margin:"0 auto 16px"}}>
            <I.Check size={36} stroke="var(--ok)" sw={2.6}/>
          </div>
          <h3 style={{margin:"0 0 6px", font:"700 18px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>上傳完成</h3>
          <p style={{margin:"0 0 20px", font:"400 13px/1.6 'Noto Sans TC'", color:"var(--ink-3)"}}>
            案件已取得新錄音編號並送入待審核佇列
          </p>
          <div style={{padding:"14px 18px", borderRadius:10, background:"var(--primary-bg)",
            border:"1px solid var(--line-2)", display:"inline-flex", flexDirection:"column", gap:6, textAlign:"left",
            font:"400 12.5px/1.5 'Noto Sans TC'", color:"var(--ink-2)", minWidth:300}}>
            <KV label="錄音編號" value="A202605230099" mono/>
            <KV label="商品" value={form.product || "（未填）"}/>
            <KV label="STT 處理" value="3 分鐘後完成"/>
          </div>
          <div style={{display:"flex", gap:10, justifyContent:"center", marginTop:24}}>
            <button className="btn btn-quiet" onClick={onSubmitted}>返回清單</button>
            <button className="btn btn-primary" onClick={() => setStep(1)}>再上傳一筆</button>
          </div>
        </section>
      )}
    </div>
  );
}

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
                    A20260523<span style={{color:"var(--ink-4)"}}>XXXX</span>
                  </div>
                  <div className="meta" style={{marginTop:8, fontSize:11}}>
                    確認後系統將自動配發 4 碼流水號
                  </div>
                </div>
              </section>
              <button className="btn btn-primary btn-lg" style={{width:"100%"}}
                onClick={()=>setRecordingNo("A202605230100")}>
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
                <p style={{margin:"14px 0 0", font:"400 12px/1.55 'Noto Sans TC'", color:"var(--ink-3)"}}>
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
    {time:"2026/05/23 14:32:18", user:"王怡萱 (E102934)", action:"審核通過", target:"A202605200005", detail:"送 BPM、產生 PDF"},
    {time:"2026/05/23 14:18:45", user:"王怡萱 (E102934)", action:"退回補正", target:"A202605200007", detail:"原因：音檔不清晰"},
    {time:"2026/05/23 13:55:09", user:"王怡萱 (E102934)", action:"下載音檔", target:"A202605200005", detail:"_merged.wav (5.2 MB)"},
    {time:"2026/05/23 13:42:11", user:"陳俊宏 (E121095)", action:"重新觸發 STT", target:"A202605210008", detail:""},
    {time:"2026/05/23 11:20:33", user:"王怡萱 (E102934)", action:"檢視案件", target:"A202605210002", detail:""},
    {time:"2026/05/23 11:08:22", user:"張嘉玲 (E133247)", action:"建立案件", target:"A202605230098", detail:"手動建立"},
    {time:"2026/05/23 10:55:14", user:"王怡萱 (E102934)", action:"手動上傳音檔", target:"A202605230097", detail:"補件案件"},
    {time:"2026/05/23 09:48:02", user:"王怡萱 (E102934)", action:"重新合併音檔", target:"A202605200008", detail:"分段音檔重組"},
    {time:"2026/05/23 09:12:50", user:"王怡萱 (E102934)", action:"登入系統", target:"—", detail:"AD 認證成功"},
    {time:"2026/05/22 18:25:33", user:"王怡萱 (E102934)", action:"審核通過", target:"A202605190005", detail:"送 BPM"},
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
function Step({ n, label, active, done }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:8}}>
      <div style={{
        width:26, height:26, borderRadius:"50%",
        background: done ? "var(--ok)" : (active ? "var(--primary)" : "var(--line-2)"),
        color: (done || active) ? "#fff" : "var(--ink-4)",
        display:"grid", placeItems:"center",
        font:"700 12.5px/1 Montserrat",
      }}>
        {done ? <I.Check size={14} stroke="#fff" sw={2.6}/> : n}
      </div>
      <span style={{font:"500 13px/1 'Noto Sans TC'",
        color: active ? "var(--ink)" : "var(--ink-3)",
        letterSpacing:".04em"}}>{label}</span>
    </div>
  );
}
function Line({ done }) {
  return <div style={{flex: "0 0 36px", height:2, background: done ? "var(--ok)" : "var(--line-2)", borderRadius:1}}/>;
}
function StepLine({ label, loading, done }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:10, padding:"6px 10px",
      background: done?"var(--ok-soft)" : (loading?"var(--primary-soft)":"transparent"),
      borderRadius:6, font:"400 13px/1.4 'Noto Sans TC'", color:"var(--ink-2)"}}>
      {done ? <I.Check size={14} stroke="var(--ok)" sw={2.6}/> :
       loading ? <svg className="spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
         <circle cx="12" cy="12" r="9" stroke="var(--primary-soft)" strokeWidth="2.5"/>
         <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
       </svg> :
       <span style={{width:14, height:14, borderRadius:"50%", border:"2px solid var(--line-3)"}}/>}
      <span style={{color: done?"rgb(58,124,49)" : (loading?"var(--primary)":"var(--ink-3)")}}>{label}</span>
    </div>
  );
}
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

window.ManualUploadScreen = ManualUploadScreen;
window.CreateCaseAdminScreen = CreateCaseAdminScreen;
window.LogsScreen = LogsScreen;
