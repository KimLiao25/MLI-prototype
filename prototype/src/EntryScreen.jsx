// Entry screen — 建立錄音案件
//
// 流程重構（依保險業務邏輯）：
//   STEP 01 輸入案件資訊
//     ─ 依「起案通路」判斷是否由建議書 APP 帶入：
//        • iPad（建議書 APP）→ 整合帶入，可確認 / 微調
//        • Web（桌機瀏覽器）→ 業務員手動輸入
//     ─ 欄位：商品 / 客戶（姓名、身分證、關係多選）
//     ─ 通過驗證 → 點「下一步：確認題目文稿」進 STEP 02
//
//   STEP 02 確認題目文稿
//     ─ 此步驟才會將 STEP 01 資料送後端，取得「錄音編號」（F-402）
//     ─ 同時依商品呼叫「題目文稿」（F-201）供業務員確認
//     ─ 右側可調 TTS 語音設定（F-202 / F-203）
//     ─ 點「下一步：開始錄音」進 STEP 03
//
//   STEP 03 錄音作業
//     ─ 由 RecordingScreen 承接

const ROLE_MAP = {
  proposer: { abbr: "要", full: "要保人" },
  insured:  { abbr: "被", full: "被保險人" },
  payer:    { abbr: "繳", full: "繳款人" },
};

const PRODUCTS = window.__MLI_PRODUCTS;

// 將案件 roles 攤平成 customers 陣列（同名同身分證合併角色）
function rolesToCustomers(roles) {
  const map = new Map();
  Object.entries(roles || {}).forEach(([k, r]) => {
    if (!r) return;
    const key = `${r.name}__${r.age}`;
    if (map.has(key)) map.get(key).roles.push(k);
    else map.set(key, { name: r.name, idNo: r.idNo || maskId(r.name, r.age), age: r.age, roles: [k] });
  });
  return [...map.values()];
}
// 由姓名/年齡產生擬真身分證號（mock）
function maskId(name, age) {
  const letters = "ABCDEFGHJKLMNPQRSTUVXYWZ";
  const yy = 2026 - age;
  const seed = (name.charCodeAt(0) + name.charCodeAt(name.length-1) + age) % 24;
  return letters[seed] + String(yy).slice(-2) + String((seed*7919) % 1000000).padStart(6,"0").slice(0,7);
}

function EntryScreen({ caseInfo, tts, setTts, entryStep, setEntryStep,
                       entrySource, setEntrySource, onStart, onCancel }) {

  // ─── 由「資料來源」決定初始狀態 ───────────────────────
  const initial = React.useMemo(() => {
    if (entrySource === "integration") {
      return {
        product: caseInfo.product,
        customers: rolesToCustomers(caseInfo.roles),
      };
    }
    return {
      product: "",
      customers: [{ name: "", idNo: "", roles: ["proposer"] }],
    };
  }, [entrySource, caseInfo]);

  const [product, setProduct] = React.useState(initial.product);
  const [customers, setCustomers] = React.useState(initial.customers);

  // 切換資料來源時重設 STEP 01 內容
  React.useEffect(() => {
    setProduct(initial.product);
    setCustomers(initial.customers);
  }, [initial]);

  // STEP 02 取得錄音編號 + 題本（模擬非同步）
  const [retrieving, setRetrieving] = React.useState(false);
  const [retrieved, setRetrieved] = React.useState(false);

  const goStep2 = () => {
    setEntryStep(2);
    setRetrieving(true);
    setRetrieved(false);
    setTimeout(() => { setRetrieving(false); setRetrieved(true); }, 900);
  };
  const backStep1 = () => { setEntryStep(1); setRetrieved(false); };

  // STEP 01 驗證
  const isStep1Valid = product && customers.length > 0 &&
    customers.every(c => c.name.trim() && c.idNo.trim().length >= 8 && c.roles.length > 0);

  return (
    <>
      <SubHeader title="建立錄音案件"
        crumbs={["我的案件", "新建錄音"]}
        right={
          <button className="btn btn-quiet" onClick={onCancel}>
            <I.ChevronL size={14}/> 返回案件清單
          </button>
        }/>

      {/* 步驟指示器 */}
      <StepIndicator current={entryStep}/>

      <div data-screen-label="04 建立錄音案件" className="fadeup" style={{padding: "8px 40px 60px"}}>
        {entryStep === 1 && (
          <Step1Form
            source={entrySource} setSource={setEntrySource}
            product={product} setProduct={setProduct}
            customers={customers} setCustomers={setCustomers}
            valid={isStep1Valid}
            onCancel={onCancel} onNext={goStep2}/>
        )}
        {entryStep === 2 && (
          <Step2Confirm
            source={entrySource}
            caseInfo={caseInfo} product={product} customers={customers}
            retrieving={retrieving} retrieved={retrieved}
            tts={tts} setTts={setTts}
            onBack={backStep1} onNext={onStart}/>
        )}
      </div>

      <div className="fcode-legend" style={{margin: "0 40px 28px", padding:"12px 16px", borderRadius:10,
        background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
        font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
        display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap"}}>
        <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>本畫面對應功能</span>
        <FCode code="F-101" label="建立錄音案件"/>
        <FCode code="F-402" label="錄音編號取得（STEP 02 觸發）"/>
        <FCode code="F-201" label="題本取得（STEP 02 觸發）"/>
        <FCode code="F-202" label="多語言 TTS"/>
        <FCode code="F-203" label="語速調整"/>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
 * 步驟指示器
 * ───────────────────────────────────────────────────── */
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: "輸入案件資訊", icon: <I.User size={16}/> },
    { n: 2, label: "確認題目文稿", icon: <I.Script size={16}/> },
    { n: 3, label: "錄音作業",     icon: <I.Mic size={16}/> },
  ];
  return (
    <div style={{padding: "20px 40px 4px", display:"flex", alignItems:"center", gap: 0,
                 background:"#fff", borderBottom:"1px solid var(--line-2)"}}>
      <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap: 0, padding:"4px 0 18px"}}>
        {steps.map((s, i) => {
          const state = s.n < current ? "done" : s.n === current ? "active" : "todo";
          const dotBg = state === "active" ? "var(--primary)" :
                        state === "done"   ? "var(--primary-2)" : "#fff";
          const dotColor = state === "todo" ? "var(--ink-4)" : "#fff";
          const dotBorder = state === "todo" ? "1.5px solid var(--line-3)" : "0";
          return (
            <React.Fragment key={s.n}>
              <div style={{display:"flex", alignItems:"center", gap: 10}}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18, background: dotBg, color: dotColor,
                  border: dotBorder, display:"grid", placeItems:"center",
                  font:"700 13px/1 Montserrat,sans-serif", letterSpacing:".02em",
                  boxShadow: state==="active" ? "0 0 0 4px rgba(73,99,250,.16)" : "none",
                  transition:"all .2s ease",
                }}>
                  {state === "done" ? <I.Check size={18} stroke="#fff" sw={2.5}/> : `0${s.n}`}
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:3}}>
                  <span className="ff-mont" style={{font:`${state==="active"?700:500} 10.5px/1 Montserrat`,
                    color: state==="todo" ? "var(--ink-4)" : "var(--primary)", letterSpacing:".14em"}}>
                    STEP 0{s.n}
                  </span>
                  <span style={{font:`${state==="active"?700:500} 14px/1 'Noto Sans TC'`,
                    color: state==="todo" ? "var(--ink-3)" : "var(--ink)", letterSpacing:".04em"}}>
                    {s.label}
                  </span>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{flexShrink:0, width: 90, height: 2, margin: "0 26px",
                  background: s.n < current ? "var(--primary-2)" : "var(--line)"}}/>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * STEP 01 — 輸入案件資訊
 * ───────────────────────────────────────────────────── */
function Step1Form({ source, setSource, product, setProduct,
                     customers, setCustomers, valid, onCancel, onNext }) {

  const updateCustomer = (idx, patch) =>
    setCustomers(cs => cs.map((c,i) => i===idx ? {...c, ...patch} : c));
  const removeCustomer = (idx) =>
    setCustomers(cs => cs.filter((_,i) => i!==idx));
  const addCustomer = () =>
    setCustomers(cs => [...cs, { name:"", idNo:"", roles:["proposer"] }]);
  const toggleRole = (idx, role) => {
    const cur = customers[idx].roles;
    const next = cur.includes(role) ? cur.filter(r => r!==role) : [...cur, role];
    updateCustomer(idx, { roles: next });
  };

  // 檢查角色衝突：每個角色只能屬於一位客戶
  const roleOwners = {};
  customers.forEach((c, i) => c.roles.forEach(r => {
    if (!roleOwners[r]) roleOwners[r] = [];
    roleOwners[r].push(i);
  }));
  const conflicts = Object.entries(roleOwners).filter(([_, owners]) => owners.length > 1);

  return (
    <div style={{maxWidth: 980, margin:"0 auto", padding:"24px 0"}}>

      {/* 提醒文字 */}
      <div style={{display:"flex", alignItems:"center", gap:10, padding:"14px 20px", borderRadius:12,
        background:"var(--primary-soft-2)", border:"1px solid rgba(73,99,250,.18)", marginBottom: 20}}>
        <I.Info size={20} stroke="var(--primary)"/>
        <div style={{flex:1, font:"600 14px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>
          請確認客戶身分並選擇本次投保商品
        </div>
      </div>

      {/* 資料來源 / 通路平台 */}
      <section className="card" style={{padding: 22, marginBottom: 20}}>
        <div style={{display:"flex", alignItems:"center", marginBottom: 14}}>
          <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>起案通路平台</div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12}}>
          <SourceCard active={source==="integration"} onClick={()=>setSource("integration")}
            icon={<I.Tablet size={22} stroke={source==="integration"?"var(--primary)":"var(--ink-3)"}/>}
            title="iPad · 建議書 APP" desc="已介接通路，將自動帶入客戶資料"
            badge="自動帶入"/>
          <SourceCard active={source==="manual"} onClick={()=>setSource("manual")}
            icon={<I.Globe size={22} stroke={source==="manual"?"var(--primary)":"var(--ink-3)"}/>}
            title="Web · 桌機瀏覽器" desc="未介接通路，請業務員手動輸入"
            badge="手動輸入"/>
        </div>
      </section>

      {/* 商品名稱 — Combobox */}
      <section className="card" style={{padding: 22, marginBottom: 20, overflow:"visible"}}>
        <div style={{display:"flex", alignItems:"baseline", gap: 8, marginBottom: 14}}>
          <I.Doc size={18} stroke="var(--primary)"/>
          <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>投保商品</div>
          <span style={{color:"var(--danger)"}}>*</span>
          <span className="meta" style={{marginLeft:"auto"}}>
            共 {PRODUCTS.length} 個商品，可輸入商品名稱或代碼搜尋
          </span>
        </div>
        <ProductCombobox value={product} onChange={setProduct}/>
      </section>

      {/* 客戶資料 */}
      <section className="card" style={{padding: 22, marginBottom: 20}}>
        <div style={{display:"flex", alignItems:"center", marginBottom: 16}}>
          <I.User size={18} stroke="var(--primary)"/>
          <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)", marginLeft: 8}}>
            客戶資料
          </div>
          <span style={{color:"var(--danger)", marginLeft:6}}>*</span>
          <span className="meta" style={{marginLeft:10}}>
            同一人若兼任多個角色，請於一張卡片中複選；不同角色為不同人時請新增客戶
          </span>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap: 14}}>
          {customers.map((c, i) => (
            <CustomerCard key={i} index={i} customer={c}
              onChange={(patch)=>updateCustomer(i, patch)}
              onToggleRole={(r)=>toggleRole(i, r)}
              onRemove={customers.length > 1 ? ()=>removeCustomer(i) : null}
              source={source}
              conflictRoles={Object.fromEntries(conflicts)}/>
          ))}
        </div>

        <button className="btn btn-soft" onClick={addCustomer}
          style={{marginTop: 14, width:"100%", height: 44, borderRadius: 8,
            border:"1.5px dashed rgba(73,99,250,.4)", background:"var(--primary-soft-2)"}}>
          <I.Plus size={16}/> 新增客戶
        </button>

        {conflicts.length > 0 && (
          <div style={{marginTop:12, padding:"10px 14px", borderRadius:8,
            background:"var(--danger-soft)", color:"var(--danger)",
            font:"500 13px/1.4 'Noto Sans TC'", display:"flex", alignItems:"center", gap:8}}>
            <I.Warn size={16} stroke="var(--danger)"/>
            角色重複指定：{conflicts.map(([r])=>ROLE_MAP[r].full).join("、")}　·　每個角色僅能由一位客戶擔任
          </div>
        )}
      </section>

      {/* 動作列 */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
        marginTop: 24, padding:"16px 20px", background:"#fff", borderRadius: 12,
        boxShadow:"var(--shadow-sm)", border:"1px solid var(--line-2)"}}>
        <div className="meta" style={{display:"flex", alignItems:"center", gap:8}}>
          <I.Info size={14} stroke="var(--ink-4)"/>
          欄位完成後即可進入下一步，由系統正式建立案件並取得錄音編號
        </div>
        <div style={{display:"flex", gap:10}}>
          <button className="btn btn-quiet" onClick={onCancel}>取消</button>
          <button className="btn btn-primary btn-lg" disabled={!valid || conflicts.length>0}
            onClick={onNext}>
            下一步：確認題目文稿 <I.Chevron size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ active, onClick, icon, title, desc, badge }) {
  return (
    <button onClick={onClick} style={{
      padding:"16px 18px", borderRadius:10, textAlign:"left", cursor:"pointer",
      border:`1.5px solid ${active?"var(--primary)":"var(--line)"}`,
      background: active ? "var(--primary-soft-2)" : "#fff",
      display:"flex", alignItems:"center", gap:14, transition:"all .15s",
      boxShadow: active ? "0 2px 8px rgba(73,99,250,.1)" : "none",
    }}>
      <div style={{width:44, height:44, borderRadius:10,
        background: active ? "rgba(73,99,250,.12)" : "var(--line-2)",
        display:"grid", placeItems:"center", flexShrink:0}}>{icon}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{font:"600 14px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>{title}</span>
          <span className="tag" style={{
            background: active ? "var(--primary)" : "var(--line-2)",
            color: active ? "#fff" : "var(--ink-3)"}}>{badge}</span>
        </div>
        <div className="meta" style={{marginTop:4}}>{desc}</div>
      </div>
      <span style={{width:18, height:18, borderRadius:"50%",
        border:`2px solid ${active?"var(--primary)":"var(--line-3)"}`,
        display:"grid", placeItems:"center", flexShrink:0}}>
        {active && <span style={{width:8, height:8, borderRadius:"50%", background:"var(--primary)"}}/>}
      </span>
    </button>
  );
}

function CustomerCard({ index, customer, onChange, onToggleRole, onRemove, source, conflictRoles }) {
  const fromIntegration = source === "integration";
  return (
    <div style={{padding:"16px 18px 18px", borderRadius:10,
      background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
      <div style={{display:"flex", alignItems:"center", marginBottom: 14}}>
        <div style={{
          width:24, height:24, borderRadius:6, background:"var(--primary)", color:"#fff",
          font:"600 12px/1 Montserrat,sans-serif", display:"grid", placeItems:"center"}}>
          {String(index+1).padStart(2,"0")}
        </div>
        <span style={{marginLeft:10, font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>
          客戶 {index+1}
        </span>
        {onRemove && (
          <button className="btn btn-quiet btn-sm" onClick={onRemove} style={{marginLeft:"auto"}}>
            <I.Delete size={14}/> 刪除
          </button>
        )}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14, marginBottom: 14}}>
        <div className="field">
          <label>姓名 <span style={{color:"var(--danger)"}}>*</span></label>
          <input className="input" value={customer.name}
            onChange={(e)=>onChange({name: e.target.value})}
            placeholder="請輸入客戶姓名"/>
        </div>
        <div className="field">
          <label>身分證字號 <span style={{color:"var(--danger)"}}>*</span></label>
          <input className="input tabular" value={customer.idNo}
            onChange={(e)=>onChange({idNo: e.target.value.toUpperCase()})}
            placeholder="A123456789" maxLength={10}/>
        </div>
      </div>

      <div className="field">
        <label>本案關係 <span style={{color:"var(--danger)"}}>*</span>
          <span className="meta" style={{marginLeft:8, fontWeight:400}}>可複選</span>
        </label>
        <div style={{display:"flex", gap: 10}}>
          {Object.entries(ROLE_MAP).map(([key, info]) => {
            const checked = customer.roles.includes(key);
            const conflict = checked && (conflictRoles?.[key]?.length || 0) > 1;
            return (
              <label key={key} onClick={()=>onToggleRole(key)} style={{
                flex:1, padding:"12px 14px", borderRadius:8, cursor:"pointer",
                background: checked ? (conflict ? "var(--danger-soft)" : "#fff") : "rgba(255,255,255,.5)",
                border: `1.5px solid ${conflict ? "var(--danger)" :
                                       checked ? "var(--primary)" : "var(--line)"}`,
                display:"flex", alignItems:"center", gap:10, transition:"all .15s",
                boxShadow: checked && !conflict ? "0 2px 6px rgba(73,99,250,.08)" : "none",
              }}>
                <span style={{
                  width:18, height:18, borderRadius:4, flexShrink:0,
                  background: checked ? (conflict ? "var(--danger)" : "var(--primary)") : "#fff",
                  border: `1.5px solid ${conflict ? "var(--danger)" :
                                         checked ? "var(--primary)" : "var(--line-3)"}`,
                  display:"grid", placeItems:"center",
                }}>
                  {checked && <I.Check size={12} stroke="#fff" sw={3}/>}
                </span>
                <span style={{font:"500 14px/1 'Noto Sans TC'",
                  color: conflict ? "var(--danger)" : (checked ? "var(--ink)" : "var(--ink-2)")}}>
                  {info.full}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * STEP 02 — 確認題目文稿
 * ───────────────────────────────────────────────────── */
function Step2Confirm({ source, caseInfo, product, customers,
                        retrieving, retrieved, tts, setTts, onBack, onNext }) {
  const questions = window.__MLI_QUESTIONS;
  const [uploadedScript, setUploadedScript] = React.useState(null); // {name, size, uploadedAt}
  const fileInputRef = React.useRef(null);

  // WEB 起案需自行上傳題目文稿；上傳前不予預覽、也不能進下一步
  const hasScript = source === "integration" || !!uploadedScript;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedScript({
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleString("zh-TW", {hour12:false}).slice(5),
      });
    }
    e.target.value = ""; // 重設以便重複上傳同一檔案
  };

  return (
    <div style={{maxWidth: 1280, margin:"0 auto", padding:"24px 0"}}>

      {/* 案件建立結果 — 一行文字提示 */}
      <div className="card" style={{
        marginBottom: 20, padding:"14px 20px",
        background: retrieving ? "var(--primary-soft-2)" : "linear-gradient(to right, rgba(73,99,250,.05), rgba(73,99,250,.02))",
        border: "1px solid rgba(73,99,250,.18)",
        display:"flex", alignItems:"center", gap: 12}}>
        {retrieving ? (
          <>
            <svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="var(--primary)" strokeWidth="2.5" style={{flexShrink:0}}>
              <path d="M12 3a9 9 0 1 1-6.4 2.6" strokeLinecap="round"/>
            </svg>
            <span style={{font:"500 14px/1.5 'Noto Sans TC'", color:"var(--ink-2)"}}>
              正在建立案件並取得錄音編號{source === "integration" ? " / 題目文稿" : ""}…
            </span>
          </>
        ) : (
          <>
            <div style={{width:24, height:24, borderRadius:12, background:"var(--primary)",
              color:"#fff", display:"grid", placeItems:"center", flexShrink:0}}>
              <I.Check size={14} stroke="#fff" sw={3}/>
            </div>
            <div style={{flex:1, font:"500 14.5px/1.5 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".01em"}}>
              案件已建立，錄音編號
              <span className="tabular ff-mont" style={{
                font:"700 15px/1 Montserrat,sans-serif", color:"var(--primary)",
                letterSpacing:".04em", margin:"0 8px",
              }}>{caseInfo.recordingNo}</span>
              {source === "integration" ? (
                <>，題本已就緒，確認下一步開始錄音。</>
              ) : uploadedScript ? (
                <>，題本已上傳，確認下一步開始錄音。</>
              ) : (
                <>，請自行上傳錄音題目文稿，上傳後下一步開始錄音。</>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"minmax(0, 1fr) 400px", gap: 20}}>

        {/* LEFT — 題目文稿 */}
        <section className="card" style={{padding:0, overflow:"hidden"}}>
          <div style={{padding:"18px 24px", borderBottom:"1px solid var(--line-2)",
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
            <I.Script size={18} stroke="var(--primary)"/>
            <div style={{font:"700 15px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>題目文稿</div>
            {uploadedScript && <span className="tag tag-warn">使用上傳題本</span>}
            <span style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:10}}>
              {hasScript && (
                <>
                  <span className="meta">共 {questions.length} 題</span>
                  <span className="meta">·</span>
                  <span className="meta">自動播稿 {questions.filter(q=>q.type==="tts").length}</span>
                  <span className="meta">·</span>
                  <span className="meta">業務員自錄 {questions.filter(q=>q.type==="self").length}</span>
                </>
              )}
              {(source === "manual" || uploadedScript) && (
                <button className="btn btn-soft btn-sm" onClick={()=>fileInputRef.current?.click()}
                  style={{marginLeft:6}}>
                  <I.Upload size={13}/> {uploadedScript ? "重新上傳題本" : "上傳題目文稿"}
                </button>
              )}
              {source === "integration" && (
                <button className="btn btn-soft btn-sm" onClick={()=>fileInputRef.current?.click()}
                  style={{marginLeft:6}}>
                  <I.Upload size={13}/> 自行上傳題本
                </button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
                style={{display:"none"}} onChange={handleFileSelect}/>
            </span>
          </div>

          {/* 上傳狀態橫幅 */}
          {uploadedScript && (
            <div style={{padding:"12px 24px", background:"var(--warn-soft)",
              borderBottom:"1px solid rgb(244,220,168)",
              display:"flex", alignItems:"center", gap:12}}>
              <div style={{width:32, height:32, borderRadius:6, background:"#fff",
                display:"grid", placeItems:"center", flexShrink:0,
                border:"1px solid rgb(244,220,168)"}}>
                <I.Doc size={16} stroke="rgb(178,104,12)"/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{font:"600 13px/1.3 'Noto Sans TC'", color:"rgb(151,89,15)"}}>
                  {source === "manual" ? "已上傳題目文稿：" : "已上傳自訂題本："}{uploadedScript.name}
                </div>
                <div className="meta" style={{color:"rgb(151,89,15)", marginTop:2, opacity:.85}}>
                  {(uploadedScript.size/1024).toFixed(1)} KB · 上傳時間 {uploadedScript.uploadedAt}
                  {source === "manual"
                    ? " · 下方為您上傳之題目文稿預覽"
                    : " · 下方預覽為原系統標準題本，錄音時將使用您上傳之題本"}
                </div>
              </div>
              {source === "integration" && (
                <button className="btn btn-quiet btn-sm" onClick={()=>setUploadedScript(null)}>
                  <I.X size={12} sw={2}/> 還原系統題本
                </button>
              )}
            </div>
          )}

          {hasScript ? (
            <div style={{maxHeight: 680, overflowY:"auto", padding:"8px 0"}}>
              {questions.map((q) => (
                <div key={q.no} style={{
                  padding:"14px 24px", borderBottom:"1px solid var(--line-2)",
                  display:"flex", gap: 14}}>
                  <div style={{
                    width:32, height:32, borderRadius:6, flexShrink:0,
                    background: q.type==="self" ? "rgb(53,150,253)" : "var(--primary)",
                    color:"#fff", display:"grid", placeItems:"center",
                    font:"700 12px/1 Montserrat,sans-serif"}}>
                    {String(q.no).padStart(2,"0")}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                      <span style={{font:"600 14px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>
                        {q.title}
                      </span>
                      <span className="tag" style={q.type==="self" ? {background:"rgb(238,246,255)", color:"rgb(53,150,253)"} : undefined}>
                        {q.tag}
                      </span>
                      {q.skippable && <span className="tag tag-gray">可跳過</span>}
                    </div>
                    <div style={{
                      font:"400 13.5px/1.65 'Noto Sans TC'",
                      color:"var(--ink-2)", textWrap:"pretty"}}>
                      {q.script}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScriptEmptyState onUpload={()=>fileInputRef.current?.click()}/>
          )}
        </section>

        {/* RIGHT — 案件摘要 + TTS */}
        <div style={{display:"flex", flexDirection:"column", gap:16}}>
          <CaseInfoSummary caseInfo={caseInfo} product={product} customers={customers}/>
          <TtsPanel tts={tts} setTts={setTts}/>
        </div>
      </div>

      {/* 動作列 */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
        marginTop: 24, padding:"16px 20px", background:"#fff", borderRadius: 12,
        boxShadow:"var(--shadow-sm)", border:"1px solid var(--line-2)"}}>
        <button className="btn btn-quiet" onClick={onBack}>
          <I.ChevronL size={14}/> 上一步：修改案件資訊
        </button>
        <div className="meta" style={{display:"flex", alignItems:"center", gap:8}}>
          <I.Info size={14} stroke="var(--ink-4)"/>
          {hasScript ? "確認題目文稿無誤後，即可進入錄音作業" : "請先上傳題目文稿才能進入錄音作業"}
        </div>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={retrieving || !hasScript}>
          <I.Mic size={18} stroke="#fff"/> 下一步：開始錄音
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * 題目文稿空狀態 — WEB 起案、尚未上傳時顯示
 * ───────────────────────────────────────────────────── */
function ScriptEmptyState({ onUpload }) {
  return (
    <div style={{
      padding:"56px 40px", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center", gap: 18,
      minHeight: 420,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: "var(--primary-soft)",
        display:"grid", placeItems:"center",
      }}>
        <I.Upload size={28} stroke="var(--primary)" sw={1.8}/>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap: 6, maxWidth: 420}}>
        <div style={{font:"600 16px/1.4 'Noto Sans TC'", color:"var(--ink)"}}>
          請先上傳錄音題目文稿
        </div>
        <div style={{font:"400 13.5px/1.7 'Noto Sans TC'", color:"var(--ink-3)", textWrap:"pretty"}}>
          Web 起案需由業務員自行上傳題目文稿，上傳後將於此處預覽題目順序，確認無誤後即可進入錄音。
        </div>
      </div>
      <button className="btn btn-primary" onClick={onUpload} style={{marginTop:4}}>
        <I.Upload size={14}/> 上傳題目文稿
      </button>
      <div className="meta" style={{display:"flex", alignItems:"center", gap:6, color:"var(--ink-4)"}}>
        <I.Info size={12} stroke="var(--ink-4)"/>
        支援格式：PDF / DOCX / TXT
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 * TTS 設定面板
 * ───────────────────────────────────────────────────── */
function TtsPanel({ tts, setTts }) {
  const VoiceOption = ({ id, lang, gender, sample, color }) => {
    const active = tts.voice === id;
    return (
      <button onClick={() => setTts(t => ({...t, voice: id}))}
        style={{
          padding: "11px 12px", borderRadius: 10,
          border: `1.5px solid ${active ? "var(--primary)" : "var(--line)"}`,
          background: active ? "var(--primary-soft)" : "#fff",
          textAlign: "left", display: "flex", alignItems: "center", gap: 10,
          transition: "all .15s ease", cursor:"pointer",
          boxShadow: active ? "0 2px 6px rgba(73,99,250,.08)" : "none",
        }}>
        <div style={{
          width: 30, height: 30, borderRadius: 15,
          background: color, color: "#fff",
          display: "grid", placeItems: "center", flexShrink: 0,
          font: "600 12px/1 Montserrat,sans-serif",
        }}>{sample}</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{font: "500 13px/1.2 'Noto Sans TC'", color: "var(--ink)"}}>{lang}</div>
          <div className="meta" style={{fontSize:11}}>{gender}</div>
        </div>
        {active && <I.Check size={16} stroke="var(--primary)" sw={2.4}/>}
      </button>
    );
  };
  return (
    <section className="card" style={{padding: 20}}>
      <div style={{display:"flex", alignItems:"baseline", gap: 8, marginBottom: 14}}>
        <I.Volume size={16} stroke="var(--primary)"/>
        <div style={{font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>語音播放設定</div>
        <span className="ff-mont" style={{marginLeft:"auto", font:"600 10px/1 Montserrat", color:"var(--ink-4)", letterSpacing:".06em"}}>
          F-202 / F-203
        </span>
      </div>

      <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", marginBottom:8, display:"flex", alignItems:"center", gap:6}}>
        <I.Lang size={13} stroke="var(--ink-3)"/> 語言 / 聲音
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 6, marginBottom: 16}}>
        <VoiceOption id="f-tw" lang="國語" gender="女聲" sample="女" color="rgb(167,141,250)"/>
        <VoiceOption id="m-tw" lang="國語" gender="男聲" sample="男" color="rgb(73,99,250)"/>
        <VoiceOption id="f-tai" lang="台語" gender="女聲" sample="女" color="rgb(126,200,180)"/>
        <VoiceOption id="m-tai" lang="台語" gender="男聲" sample="男" color="rgb(91,167,233)"/>
      </div>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
        <span style={{font:"500 12px/1 'Noto Sans TC'",color:"var(--ink-3)",display:"flex",alignItems:"center",gap:6}}>
          <I.Speed size={13} stroke="var(--ink-3)"/> 播放語速
        </span>
        <span className="tabular ff-mont" style={{font:"600 13px/1 Montserrat",color:"var(--primary)"}}>
          {tts.speed.toFixed(2)}×
        </span>
      </div>
      <input type="range" className="rng" min="0.5" max="1.5" step="0.05" value={tts.speed}
        onChange={e=>setTts(t=>({...t, speed: parseFloat(e.target.value)}))}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span className="meta">0.5×</span>
        <span className="meta">1.0×</span>
        <span className="meta">1.5×</span>
      </div>
      <div style={{marginTop:10, padding:"8px 10px", borderRadius:6, background:"var(--warn-soft)",
        color:"rgb(151,89,15)", font:"400 11.5px/1.4 'Noto Sans TC'", display:"flex", gap:6}}>
        <I.Info size={13} stroke="rgb(151,89,15)" style={{flexShrink:0, marginTop:1}}/>
        建議高齡客戶使用 0.75× 以下語速以提升聆聽舒適度
      </div>
    </section>
  );
}

window.EntryScreen = EntryScreen;
