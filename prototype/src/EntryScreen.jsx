// EntryScreen — 建立錄音案件（v7 重構：單頁「建殼」）
//
// 設計理念（斷開流程）：
//   建立案件 ≠ 錄音。本頁只負責「建好錄音案件的殼」並取得錄音編號。
//   一個錄音案件 = 一個錄音場次。同一張保單若分多次錄音（不同人不同天），
//   就用每位客戶的「場次」欄位拆成多筆案件（多個錄音編號）。
//
//   流程：
//     ① 起案通路（自動帶入 / 手動輸入）
//     ② 投保商品
//     ③ 客戶資料（姓名 / 身分證 / 本案關係多選 + 場次）
//     ④ 自動帶入：頁面最下方一併顯示題目文稿（無 STEP 2）
//        手動輸入：不顯示文稿，改於「進入錄音作業」前自行上傳 PDF
//     ⑤「確認建立」→ 依場次拆案、產生錄音編號 → 成功視窗 →「回到錄音清單」

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
    else map.set(key, { name: r.name, idNo: r.idNo || maskId(r.name, r.age), age: r.age, roles: [k], sessionNo: 1 });
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

function EntryScreen({ caseInfo, entrySource, setEntrySource, onCreate, onCancel }) {

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
      customers: [{ name: "", idNo: "", roles: ["proposer"], sessionNo: 1 }],
    };
  }, [entrySource, caseInfo]);

  const [product, setProduct] = React.useState(initial.product);
  const [customers, setCustomers] = React.useState(initial.customers);

  // 切換資料來源時重設內容
  React.useEffect(() => {
    setProduct(initial.product);
    setCustomers(initial.customers);
  }, [initial]);

  const updateCustomer = (idx, patch) =>
    setCustomers(cs => cs.map((c,i) => i===idx ? {...c, ...patch} : c));
  const removeCustomer = (idx) =>
    setCustomers(cs => cs.filter((_,i) => i!==idx).map(c => ({...c, sessionNo: Math.min(c.sessionNo || 1, Math.max(1, cs.length-1))})));
  const addCustomer = () =>
    setCustomers(cs => [...cs, { name:"", idNo:"", roles:["proposer"], sessionNo: 1 }]);
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

  // 依場次分組（供「將建立 N 筆」預覽與送出）
  const groups = React.useMemo(() => {
    const m = new Map();
    customers.forEach(c => {
      const n = c.sessionNo || 1;
      if (!m.has(n)) m.set(n, []);
      m.get(n).push(c);
    });
    return [...m.entries()].sort((a,b)=>a[0]-b[0]).map(([sessionNo, cs]) => ({ sessionNo, customers: cs }));
  }, [customers]);

  const isValid = product && customers.length > 0 &&
    customers.every(c => c.name.trim() && c.idNo.trim().length >= 8 && c.roles.length > 0) &&
    conflicts.length === 0;

  const submit = () => {
    if (!isValid) return;
    // 場次編號重新壓縮成連續（1,2,3…），避免出現「只有場次1與場次3」
    const renum = groups.map((g, i) => ({ sessionNo: i + 1, customers: g.customers }));
    onCreate({ product, source: entrySource, groups: renum });
  };

  return (
    <>
      <SubHeader title="建立錄音案件"
        crumbs={["我的案件", "新建錄音案件"]}
        right={
          <button className="btn btn-quiet" onClick={onCancel}>
            <I.ChevronL size={14}/> 返回案件清單
          </button>
        }/>

      <div data-screen-label="04 建立錄音案件" className="fadeup" style={{padding: "0 40px 60px"}}>
        <div style={{maxWidth: 1080, margin:"0 auto", padding:"24px 0"}}>

          {/* 提醒文字 */}
          <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 20px", borderRadius:12,
            background:"var(--primary-soft-2)", border:"1px solid rgba(73,99,250,.18)", marginBottom: 20}}>
            <I.Info size={20} stroke="var(--primary)"/>
            <div style={{flex:1, font:"500 13.5px/1.6 'Noto Sans TC'", color:"var(--ink-2)", textWrap:"pretty"}}>
              本步驟僅<b style={{color:"var(--ink)"}}>建立錄音案件並取得錄音編號</b>，尚不會開始錄音。
              一個案件代表一個<b style={{color:"var(--ink)"}}>錄音場次</b>；若同一保單需分多次（不同人 / 不同天）錄音，
              請於各客戶設定不同<b style={{color:"var(--ink)"}}>場次</b>，系統將拆成多筆案件。建立後請回清單，分別點入案件進行錄音。
            </div>
          </div>

          {/* 起案通路平台 */}
          <section className="card" style={{padding: 22, marginBottom: 20}}>
            <div style={{display:"flex", alignItems:"center", marginBottom: 14}}>
              <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>起案通路平台</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12}}>
              <SourceCard active={entrySource==="integration"} onClick={()=>setEntrySource("integration")}
                icon={<I.Tablet size={22} stroke={entrySource==="integration"?"var(--primary)":"var(--ink-3)"}/>}
                title="iPad · 建議書 APP" desc="已介接通路，自動帶入客戶資料與題目文稿"
                badge="自動帶入"/>
              <SourceCard active={entrySource==="manual"} onClick={()=>setEntrySource("manual")}
                icon={<I.Globe size={22} stroke={entrySource==="manual"?"var(--primary)":"var(--ink-3)"}/>}
                title="Web · 桌機瀏覽器" desc="未介接通路，手動輸入；題目文稿於錄音前上傳"
                badge="手動輸入"/>
            </div>
          </section>

          {/* 投保商品 */}
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
            <div style={{display:"flex", alignItems:"center", marginBottom: 16, flexWrap:"wrap", gap:6}}>
              <I.User size={18} stroke="var(--primary)"/>
              <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)", marginLeft: 8}}>
                客戶資料
              </div>
              <span style={{color:"var(--danger)", marginLeft:6}}>*</span>
              <span className="meta" style={{marginLeft:10}}>
                同一人兼多角色請於一張卡片複選；不同人請新增客戶。以「場次」決定誰一起錄音。
              </span>
            </div>

            <div style={{display:"flex", flexDirection:"column", gap: 14}}>
              {customers.map((c, i) => (
                <CustomerCard key={i} index={i} customer={c}
                  sessionCount={customers.length}
                  multiCustomer={customers.length > 1}
                  onChange={(patch)=>updateCustomer(i, patch)}
                  onToggleRole={(r)=>toggleRole(i, r)}
                  onRemove={customers.length > 1 ? ()=>removeCustomer(i) : null}
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

          {/* 題目文稿 — 僅「自動帶入」顯示（手動輸入於錄音前上傳） */}
          <ScriptBlock source={entrySource}/>

          {/* 將建立的案件預覽 */}
          <CreatePreview groups={groups} multiSession={groups.length > 1}/>

          {/* 動作列 */}
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
            marginTop: 20, padding:"16px 20px", background:"#fff", borderRadius: 12,
            boxShadow:"var(--shadow-sm)", border:"1px solid var(--line-2)"}}>
            <div className="meta" style={{display:"flex", alignItems:"center", gap:8}}>
              <I.Info size={14} stroke="var(--ink-4)"/>
              確認建立後，系統將給整組一個<b style={{color:"var(--ink)"}}>錄音編號</b>，並依場次拆出各自的<b style={{color:"var(--ink)"}}>案件編號</b>
            </div>
            <div style={{display:"flex", gap:10}}>
              <button className="btn btn-quiet" onClick={onCancel}>取消</button>
              <button className="btn btn-primary btn-lg" disabled={!isValid} onClick={submit}>
                <I.Check size={16}/> 確認建立{groups.length > 1 ? `（${groups.length} 筆）` : ""}
              </button>
            </div>
          </div>
        </div>

        <div className="fcode-legend" style={{margin: "8px auto 0", maxWidth:1080, padding:"12px 16px", borderRadius:10,
          background:"var(--primary-soft-2)", border:"1px dashed rgba(73,99,250,.25)",
          font:"400 12px/1.5 'Noto Sans TC'", color:"var(--ink-3)",
          display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap"}}>
          <span style={{font:"600 12px/1 'Noto Sans TC'", color:"var(--primary)", letterSpacing:".06em"}}>本畫面對應功能</span>
          <FCode code="F-101" label="建立錄音案件（建殼）"/>
          <FCode code="F-402" label="錄音編號取得（確認建立時）"/>
          <FCode code="F-201" label="題本帶入（自動帶入）"/>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
 * 起案通路卡
 * ───────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────
 * 客戶卡（含場次下拉）
 * ───────────────────────────────────────────────────── */
const SESSION_TINT = ["", "rgb(73,99,250)", "rgb(72,153,61)", "rgb(178,104,12)"];

function CustomerCard({ index, customer, sessionCount, multiCustomer, onChange, onToggleRole, onRemove, conflictRoles }) {
  const tint = SESSION_TINT[customer.sessionNo] || "var(--primary)";
  return (
    <div style={{padding:"16px 18px 18px", borderRadius:10,
      background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom: 14}}>
        <div style={{
          width:24, height:24, borderRadius:6, background:"var(--primary)", color:"#fff",
          font:"600 12px/1 Montserrat,sans-serif", display:"grid", placeItems:"center"}}>
          {String(index+1).padStart(2,"0")}
        </div>
        <span style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>
          客戶 {index+1}
        </span>

        {/* 場次下拉 */}
        <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:8}}>
          <span style={{font:"500 12.5px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>場次</span>
          <div style={{position:"relative", display:"flex", alignItems:"center"}}>
            <span style={{position:"absolute", left:10, width:8, height:8, borderRadius:"50%",
              background: tint, pointerEvents:"none"}}/>
            <select className="input" value={customer.sessionNo || 1}
              onChange={(e)=>onChange({sessionNo: parseInt(e.target.value,10)})}
              style={{height:34, padding:"0 30px 0 24px", borderRadius:8, font:"600 13px/1 Montserrat",
                border:`1.5px solid ${tint}`, color: tint, minWidth: 86, appearance:"none",
                background:"#fff"}}>
              {Array.from({length: Math.max(1, sessionCount)}, (_,i)=>i+1).map(n => (
                <option key={n} value={n}>場次 {n}</option>
              ))}
            </select>
            <I.Chevron size={13} stroke={tint} style={{position:"absolute", right:10, pointerEvents:"none", transform:"rotate(90deg)"}}/>
          </div>
        </div>

        {onRemove && (
          <button className="btn btn-quiet btn-sm" onClick={onRemove}>
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
 * 題目文稿區塊 — 自動帶入顯示 14 題；手動輸入顯示「錄音前上傳」說明
 * ───────────────────────────────────────────────────── */
function ScriptBlock({ source }) {
  const questions = window.__MLI_QUESTIONS;
  const [open, setOpen] = React.useState(true);

  if (source === "manual") {
    return (
      <section className="card" style={{padding:0, marginBottom:20, overflow:"hidden"}}>
        <div style={{padding:"16px 22px", display:"flex", alignItems:"center", gap:10}}>
          <I.Script size={18} stroke="var(--ink-4)"/>
          <div style={{font:"600 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>題目文稿</div>
          <span className="tag tag-gray">手動輸入 · 錄音前上傳</span>
        </div>
        <div style={{padding:"0 22px 20px"}}>
          <div style={{padding:"16px 18px", borderRadius:10, background:"var(--primary-bg)",
            border:"1px dashed var(--line)", display:"flex", alignItems:"flex-start", gap:12}}>
            <I.Info size={18} stroke="var(--ink-4)" style={{flexShrink:0, marginTop:1}}/>
            <div style={{font:"400 13px/1.7 'Noto Sans TC'", color:"var(--ink-2)", textWrap:"pretty"}}>
              手動輸入通路未介接題本，<b style={{color:"var(--ink)"}}>此處不顯示文稿</b>。
              題目文稿（PDF）將於日後從清單點入案件、選擇「進入錄音作業」時再行上傳，且僅能使用<b style={{color:"var(--ink)"}}>整段錄音</b>。
            </div>
          </div>
        </div>
      </section>
    );
  }

  const ttsN = questions.filter(q=>q.type==="tts").length;
  const selfN = questions.filter(q=>q.type==="self").length;

  return (
    <section className="card" style={{padding:0, marginBottom:20, overflow:"hidden"}}>
      <div style={{padding:"16px 22px", borderBottom: open ? "1px solid var(--line-2)" : "none",
        display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
        <I.Script size={18} stroke="var(--primary)"/>
        <div style={{font:"700 15px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>題目文稿</div>
        <span className="tag">建議書帶入 · 分題題本</span>
        <span style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:10}}>
          <span className="meta">共 {questions.length} 題</span>
          <span className="meta">·</span>
          <span className="meta">自動播稿 {ttsN}</span>
          <span className="meta">·</span>
          <span className="meta">業務員自錄 {selfN}</span>
          <button className="btn btn-quiet btn-sm" onClick={()=>setOpen(o=>!o)} style={{marginLeft:6}}>
            {open ? "收合" : "展開"} <I.Chevron size={12} style={{transform: open?"rotate(-90deg)":"rotate(90deg)"}}/>
          </button>
        </span>
      </div>
      {open && (
        <div style={{maxHeight: 460, overflowY:"auto", padding:"8px 0"}}>
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
                  <span style={{font:"600 14px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>{q.title}</span>
                  <span className="tag" style={q.type==="self" ? {background:"rgb(238,246,255)", color:"rgb(53,150,253)"} : undefined}>
                    {q.tag}
                  </span>
                  {q.skippable && <span className="tag tag-gray">可跳過</span>}
                </div>
                <div style={{font:"400 13.5px/1.65 'Noto Sans TC'", color:"var(--ink-2)", textWrap:"pretty"}}>
                  {q.script}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────
 * 將建立的案件預覽（依場次）
 * ───────────────────────────────────────────────────── */
function CreatePreview({ groups, multiSession }) {
  return (
    <section className="card" style={{padding:0, marginBottom:0, overflow:"hidden",
      border:"1px solid rgba(73,99,250,.22)"}}>
      <div style={{padding:"14px 22px", borderBottom:"1px solid var(--line-2)", background:"var(--primary-soft-2)",
        display:"flex", alignItems:"center", gap:10}}>
        <I.Doc size={16} stroke="var(--primary)"/>
        <span style={{font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)"}}>將建立的錄音案件</span>
        <span className="tag" style={{marginLeft:4}}>{groups.length} 筆</span>
        {multiSession && <span className="meta" style={{marginLeft:"auto"}}>同一錄音編號 · 不同場次 = 不同案件編號</span>}
      </div>
      <div style={{padding:"6px 22px 14px"}}>
        {groups.map((g, i) => {
          const tint = SESSION_TINT[g.sessionNo] || "var(--primary)";
          const named = g.customers.filter(c => c.name.trim());
          return (
            <div key={g.sessionNo} style={{padding:"12px 0",
              borderBottom: i < groups.length-1 ? "1px dashed var(--line-2)" : "none",
              display:"flex", alignItems:"center", gap:14}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:7, flexShrink:0,
                padding:"6px 12px", borderRadius:14, background:"#fff", border:`1.5px solid ${tint}`,
                color: tint, font:"700 12px/1 Montserrat"}}>
                <span style={{width:8, height:8, borderRadius:"50%", background:tint}}/> 場次 {g.sessionNo}
              </span>
              <div style={{flex:1, minWidth:0, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center"}}>
                {named.length === 0 ? (
                  <span className="meta">（尚未輸入客戶姓名）</span>
                ) : named.map((c, j) => (
                  <span key={j} style={{display:"inline-flex", alignItems:"center", gap:6,
                    padding:"5px 10px", borderRadius:8, background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
                    <span style={{font:"600 13px/1 'Noto Sans TC'", color:"var(--ink)"}}>{c.name}</span>
                    <span style={{display:"flex", gap:3}}>
                      {c.roles.map(r => (
                        <span key={r} style={{display:"inline-grid", placeItems:"center", width:17, height:17,
                          borderRadius:4, background:"var(--primary-soft)", color:"var(--primary)",
                          font:"600 10.5px/1 'Noto Sans TC'"}}>{ROLE_MAP[r].abbr}</span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
              <span className="meta" style={{flexShrink:0}}>{named.length} 位對象</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────
 * 建立成功視窗 — 列出本次建立的錄音編號，僅「回到錄音清單」
 * ───────────────────────────────────────────────────── */
function CreatedCasesModal({ created, onBackToList }) {
  if (!created || !created.cases || !created.cases.length) return null;
  const list = created.cases;
  const groupNo = created.groupNo;
  return ReactDOM.createPortal((
    <div style={{position:"fixed", inset:0, zIndex:220, background:"rgba(41,47,84,.42)",
      display:"grid", placeItems:"center", padding:24, animation:"fadeup .2s ease-out"}}>
      <div className="card fadeup" style={{padding:0, width:520, maxHeight:"86vh",
        display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <div style={{padding:"28px 30px 18px", textAlign:"center"}}>
          <div style={{width:60, height:60, borderRadius:"50%", background:"var(--ok-soft)",
            display:"grid", placeItems:"center", margin:"0 auto 14px"}}>
            <I.Check size={30} stroke="var(--ok)" sw={2.6}/>
          </div>
          <h3 style={{margin:"0 0 6px", font:"700 20px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>
            已建立 {list.length} 筆錄音案件
          </h3>
          <p style={{margin:0, font:"400 13.5px/1.6 'Noto Sans TC'", color:"var(--ink-3)", textWrap:"pretty"}}>
            本次建立共用一個<b style={{color:"var(--ink)"}}>錄音編號</b>，依場次拆成多個<b style={{color:"var(--ink)"}}>案件編號</b>，狀態為「草稿」。請回清單分別點入各案件進行錄音。
          </p>
        </div>

        {/* 錄音編號（群組母號）—— 一對多的「一」 */}
        <div style={{margin:"0 30px 14px", padding:"12px 16px", borderRadius:10,
          background:"var(--primary)", color:"#fff", display:"flex", alignItems:"center", gap:12}}>
          <span style={{font:"500 12px/1 'Noto Sans TC'", letterSpacing:".06em", opacity:.85}}>錄音編號</span>
          <span className="ff-mont tabular" style={{font:"700 20px/1 Montserrat", letterSpacing:".04em"}}>{groupNo}</span>
          <span style={{marginLeft:"auto", font:"400 12px/1 'Noto Sans TC'", opacity:.85}}>勾稽 {list.length} 個案件編號</span>
        </div>

        <div style={{padding:"0 30px", overflowY:"auto"}}>
          {list.map((c) => {
            const subs = window.__MLI_uniqueSubjects(c);
            return (
              <div key={c.caseNo} style={{padding:"14px 16px", marginBottom:10, borderRadius:10,
                background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
                  <span style={{display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px",
                    borderRadius:12, background:"var(--primary)", color:"#fff",
                    font:"600 12px/1 Montserrat", letterSpacing:".02em"}} className="tabular">
                    {c.caseNo}
                  </span>
                  <span className="tag" style={{background:"var(--primary-soft)", color:"var(--primary)"}}>場次 {c.sessionNo}</span>
                  <span className="meta" style={{marginLeft:"auto"}}>{subs.length} 位對象</span>
                </div>
                <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {subs.map((s, i) => (
                    <span key={i} style={{display:"inline-flex", alignItems:"center", gap:6,
                      padding:"4px 9px", borderRadius:8, background:"#fff", border:"1px solid var(--line-2)"}}>
                      <span style={{font:"600 12.5px/1 'Noto Sans TC'", color:"var(--ink)"}}>{s.name}</span>
                      <span style={{display:"flex", gap:3}}>
                        {s.roles.map(r => (
                          <span key={r} style={{display:"inline-grid", placeItems:"center", width:16, height:16,
                            borderRadius:4, background:"var(--primary-soft)", color:"var(--primary)",
                            font:"600 10px/1 'Noto Sans TC'"}}>{r}</span>
                        ))}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{padding:"16px 30px 22px", borderTop:"1px solid var(--line-2)", marginTop:8,
          display:"flex", justifyContent:"center"}}>
          <button className="btn btn-primary btn-lg" onClick={onBackToList}>
            回到錄音清單 <I.Chevron size={16}/>
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

window.EntryScreen = EntryScreen;
window.CreatedCasesModal = CreatedCasesModal;
