// CaseInfoSummary — 跨步驟共用的案件資訊摘要卡片
//
// STEP 02「確認題目文稿」與 STEP 03「錄音作業」右側皆使用此卡片，
// 確保使用者在錄音流程中看到的案件資訊一致延續。
//
// Props：
//   caseInfo  必填，包含 caseNo / createdAt / agent / agentId / branch / roles / product
//   product   可選，覆寫 caseInfo.product（STEP 02 使用業務員 STEP 01 選定的商品）
//   customers 可選，覆寫由 caseInfo.roles 推導出來的錄音對象（STEP 02 使用編輯後的客戶清單）
//   title     可選，卡片標題，預設「案件資訊摘要」

const CASE_ROLE_MAP = {
  proposer: { abbr: "要", full: "要保人" },
  insured:  { abbr: "被", full: "被保險人" },
  payer:    { abbr: "繳", full: "繳款人" },
};

// 由姓名 / 年齡產生擬真身分證號（mock 用，與 EntryScreen 邏輯一致）
function maskIdSeed(name, age) {
  const letters = "ABCDEFGHJKLMNPQRSTUVXYWZ";
  const yy = 2026 - age;
  const seed = (name.charCodeAt(0) + name.charCodeAt(name.length - 1) + age) % 24;
  return letters[seed] + String(yy).slice(-2) + String((seed * 7919) % 1000000).padStart(6, "0").slice(0, 7);
}

// 將案件 roles 攤平成 customers 陣列（同名同年齡合併角色）
function customersFromRoles(roles) {
  const map = new Map();
  Object.entries(roles || {}).forEach(([k, r]) => {
    if (!r) return;
    const key = `${r.name}__${r.age}`;
    if (map.has(key)) {
      map.get(key).roles.push(k);
    } else {
      map.set(key, {
        name: r.name,
        idNo: r.idNo || maskIdSeed(r.name, r.age),
        age: r.age,
        roles: [k],
      });
    }
  });
  return [...map.values()];
}

function SummaryLine({ label, value, mono }) {
  return (
    <div style={{display:"flex", alignItems:"baseline", gap:14}}>
      <span className="meta" style={{minWidth:64, flexShrink:0}}>{label}</span>
      <span className={mono ? "tabular ff-mont" : ""} style={{
        font: mono
          ? "500 13px/1.4 Montserrat,sans-serif"
          : "400 13.5px/1.4 'Noto Sans TC'",
        color: "var(--ink)",
        flex: 1,
        letterSpacing: mono ? ".04em" : 0,
        wordBreak: "break-all",
      }}>{value || "—"}</span>
    </div>
  );
}

function CaseInfoSummary({ caseInfo, product, customers, title = "案件資訊摘要" }) {
  const prod = product != null ? product : caseInfo.product;
  const list = customers || customersFromRoles(caseInfo.roles);

  return (
    <section className="card" style={{padding: 20}}>
      <div style={{
        font:"700 14px/1 'Noto Sans TC'", color:"var(--ink)",
        marginBottom: 14, paddingBottom: 12,
        borderBottom:"1px solid var(--line-2)",
      }}>
        {title}
      </div>

      <div style={{display:"flex", flexDirection:"column", gap: 12}}>
        <SummaryLine label="錄音編號" value={caseInfo.caseNo} mono/>
        <SummaryLine label="建立時間" value={caseInfo.createdAt} mono/>
        <SummaryLine label="商品"     value={prod}/>
        <SummaryLine label="業務員"   value={`${caseInfo.agent}　${caseInfo.agentId}`}/>
        <SummaryLine label="通訊處"   value={caseInfo.branch}/>
      </div>

      <div style={{marginTop:14, paddingTop:14, borderTop:"1px solid var(--line-2)"}}>
        <div className="meta" style={{marginBottom:8}}>錄音對象（{list.length} 位）</div>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {list.map((c, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"8px 10px", borderRadius:6, background:"var(--primary-bg)",
            }}>
              <span style={{font:"500 13px/1 'Noto Sans TC'", color:"var(--ink)"}}>{c.name}</span>
              <span className="meta tabular ff-mont" style={{font:"500 11.5px/1 Montserrat"}}>
                {c.idNo ? c.idNo.slice(0, 1) + "***" + c.idNo.slice(-3) : ""}
              </span>
              <span style={{marginLeft:"auto", display:"flex", gap:4}}>
                {c.roles.map(r => (
                  <span key={r} className="tag" style={{padding:"2px 6px", fontSize:10.5}}>
                    {CASE_ROLE_MAP[r] ? CASE_ROLE_MAP[r].abbr : r}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { CaseInfoSummary, CASE_ROLE_MAP, customersFromRoles, SummaryLine });
