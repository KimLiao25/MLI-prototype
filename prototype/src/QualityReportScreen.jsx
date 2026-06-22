// QualityReportScreen — 質檢報告儀表板
// 對「案件審核後台」既有欄位進行視覺化資料分析：
//   - KPI 區（總案件、各審核階段、通過率、平均風險）
//   - 審核狀態分佈（donut）/ 風險等級分佈（donut）
//   - 各地區案件分佈（bar）/ STT 異常旗標統計（bar）
//   - SLA 倒數熱力 / TOP 商品
//   - 審核員工作量表

function QualityReportScreen({ cases, detailMap }) {
  const STAGE = window.__MLI_REVIEW_STAGE;
  const RISK  = window.__MLI_RISK;
  const [range, setRange] = React.useState("30d");

  // ───── 計算各種統計 ─────
  const stats = React.useMemo(() => computeStats(cases, detailMap), [cases, detailMap]);

  const today = new Date().toLocaleDateString("zh-TW", { year:"numeric", month:"2-digit", day:"2-digit" });

  return (
    <div data-screen-label="03 質檢報告" className="fadeup" style={{padding:"18px 28px 60px"}}>
      <AdminSubHeader
        title="質檢報告"
        crumbs={["內勤審核後台", "案件管理", "質檢報告"]}
        desc="案件審核質量數據分析 · 協助主管掌握審核效率、風險分佈與異常熱點"
        right={
          <>
            <div style={{display:"flex", gap:0, background:"#fff", border:"1px solid var(--line)", borderRadius:8, padding:2}}>
              {[
                {v:"7d",  l:"近 7 日"},
                {v:"30d", l:"近 30 日"},
                {v:"90d", l:"近 90 日"},
                {v:"all", l:"全部"},
              ].map(o => (
                <button key={o.v} onClick={()=>setRange(o.v)} className="btn btn-quiet btn-sm" style={{
                  padding:"4px 12px", border:"none", borderRadius:6,
                  background: range === o.v ? "var(--primary)" : "transparent",
                  color: range === o.v ? "#fff" : "var(--ink-2)",
                  font:"500 12px/1 'Noto Sans TC'",
                }}>{o.l}</button>
              ))}
            </div>
            <button className="btn btn-quiet btn-sm"><I.Doc size={13}/> 匯出報告</button>
          </>
        }/>

      <div className="meta" style={{padding:"0 4px 14px", display:"flex", gap:14, alignItems:"center"}}>
        <span>資料更新：{today} 08:00</span>
        <span style={{color:"var(--line-3)"}}>·</span>
        <span>覆蓋範圍：{stats.total} 件案件</span>
        <span style={{color:"var(--line-3)"}}>·</span>
        <span>權限範圍：{window.__MLI_REVIEWER_SELF.region}（{window.__MLI_REVIEWER_SELF.title}）</span>
      </div>

      {/* ───── KPI Strip ───── */}
      <KPIStrip stats={stats}/>

      {/* ───── Row 1: 審核狀態 + 風險分佈 ───── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginTop:18}}>
        <DonutCard
          title="審核狀態分佈"
          subtitle="依當前審核階段"
          total={stats.total}
          centerLabel="總案件"
          slices={[
            { key:"unassigned", label: STAGE.unassigned.label, value: stats.byStage.unassigned, color: STAGE.unassigned.color, bg: STAGE.unassigned.bg },
            { key:"waiting",    label: STAGE.waiting.label,    value: stats.byStage.waiting,    color: STAGE.waiting.color,    bg: STAGE.waiting.bg },
            { key:"in_review",  label: STAGE.in_review.label,  value: stats.byStage.in_review,  color: STAGE.in_review.color,  bg: STAGE.in_review.bg },
            { key:"returned",   label: STAGE.returned.label,   value: stats.byStage.returned,   color: STAGE.returned.color,   bg: STAGE.returned.bg },
            { key:"verified",   label: STAGE.verified.label,   value: stats.byStage.verified,   color: STAGE.verified.color,   bg: STAGE.verified.bg },
            { key:"resubmit",   label: STAGE.resubmit.label,   value: stats.byStage.resubmit,   color: STAGE.resubmit.color,   bg: STAGE.resubmit.bg },
          ].filter(s => s.value > 0)}
        />
        <DonutCard
          title="風險等級分佈"
          subtitle="STT 比對風險分數（high>70, mid 30–70, low<30）"
          total={stats.total}
          centerLabel="平均分數"
          centerValue={stats.avgRiskScore}
          centerSuffix=" / 100"
          slices={[
            { key:"high", label:"高風險", value: stats.byRisk.high, color: RISK.high.color, bg: RISK.high.bg },
            { key:"mid",  label:"中風險", value: stats.byRisk.mid,  color: RISK.mid.color,  bg: RISK.mid.bg },
            { key:"low",  label:"低風險", value: stats.byRisk.low,  color: RISK.low.color,  bg: RISK.low.bg },
          ].filter(s => s.value > 0)}
        />
      </div>

      {/* ───── Row 2: 地區分佈 + STT 異常旗標 ───── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginTop:18}}>
        <RegionBarCard stats={stats}/>
        <SttFlagsCard stats={stats}/>
      </div>

      {/* ───── Row 3: SLA 熱力 + TOP 商品 ───── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginTop:18}}>
        <SlaHeatCard stats={stats}/>
        <TopProductsCard stats={stats}/>
      </div>

      {/* ───── Row 4: 審核員工作量 ───── */}
      <div style={{marginTop:18}}>
        <ReviewerWorkloadCard stats={stats}/>
      </div>

      <div className="meta" style={{padding:"22px 4px 0", textAlign:"center"}}>
        所有質檢統計依當前權限範圍計算 · 匯出檔案會記錄於系統操作日誌
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 計算統計
// ════════════════════════════════════════════════════════════════════════════
function computeStats(cases, detailMap) {
  const stages = ["unassigned","waiting","in_review","returned","verified","resubmit"];
  const byStage = Object.fromEntries(stages.map(s => [s, 0]));
  const byRisk = { high:0, mid:0, low:0 };
  const byRegion = {};
  const byProduct = {};
  const byReviewer = {};
  const sttFlags = { diff:0, negation:0, lowConf:0 };
  const slaBuckets = {
    overdue:  0,   // sla < 0
    today:    0,   // sla === 0
    urgent:   0,   // 1-2
    soon:     0,   // 3-5
    safe:     0,   // > 5
  };
  let riskScoreSum = 0;
  let approvedPassQ = 0;
  let approvedTotalQ = 0;

  cases.forEach(c => {
    if (c.reviewStage && byStage[c.reviewStage] !== undefined) byStage[c.reviewStage] += 1;
    if (c.riskLevel && byRisk[c.riskLevel] !== undefined) byRisk[c.riskLevel] += 1;
    if (c.region) byRegion[c.region] = (byRegion[c.region] || 0) + 1;
    if (c.product) byProduct[c.product] = (byProduct[c.product] || 0) + 1;

    if (c.reviewer) {
      const key = c.reviewer.id;
      if (!byReviewer[key]) {
        byReviewer[key] = { ...c.reviewer, total:0, verified:0, pending:0, returned:0, riskSum:0, overdue:0 };
      }
      const r = byReviewer[key];
      r.total += 1;
      if (c.reviewStage === "verified") r.verified += 1;
      else if (c.reviewStage === "returned") r.returned += 1;
      else r.pending += 1;
      if (c.sla != null && c.sla < 0) r.overdue += 1;
      r.riskSum += c.riskScore || 0;
    }

    if (c.sttFlags) {
      sttFlags.diff     += c.sttFlags.diff     || 0;
      sttFlags.negation += c.sttFlags.negation || 0;
      sttFlags.lowConf  += c.sttFlags.lowConf  || 0;
    }

    if (c.sla != null) {
      if (c.sla < 0) slaBuckets.overdue += 1;
      else if (c.sla === 0) slaBuckets.today += 1;
      else if (c.sla <= 2) slaBuckets.urgent += 1;
      else if (c.sla <= 5) slaBuckets.soon += 1;
      else slaBuckets.safe += 1;
    }

    riskScoreSum += c.riskScore || 0;
  });

  // 通過率：對所有有詳細資料的案件，計算 STT 比對通過題數 / 總題數
  Object.values(detailMap || {}).forEach(d => {
    if (!d?.questions) return;
    approvedTotalQ += d.questions.length;
    approvedPassQ  += d.questions.filter(q => q.status === "ok").length;
  });

  // TOP 商品（依案件數降序，取前 6）
  const topProducts = Object.entries(byProduct)
    .map(([name, count]) => ({ name, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 6);

  // Reviewer 列表（依 total 降序）+ 未指派
  const reviewerList = Object.values(byReviewer)
    .map(r => ({ ...r, avgRisk: r.total > 0 ? Math.round(r.riskSum / r.total) : 0 }))
    .sort((a, b) => b.total - a.total);
  // 加一個「未指派」假行
  const unassigned = cases.filter(c => !c.reviewer);
  if (unassigned.length) {
    reviewerList.push({
      id: "—", name: "未指派", region: "—",
      total: unassigned.length,
      verified: 0,
      returned: 0,
      pending: unassigned.length,
      overdue: unassigned.filter(c => c.sla != null && c.sla < 0).length,
      avgRisk: Math.round(unassigned.reduce((s,c) => s + (c.riskScore||0), 0) / unassigned.length),
      _unassigned: true,
    });
  }

  return {
    total: cases.length,
    byStage,
    byRisk,
    byRegion,
    topProducts,
    reviewerList,
    sttFlags,
    slaBuckets,
    avgRiskScore: cases.length ? Math.round(riskScoreSum / cases.length) : 0,
    approvalRate: approvedTotalQ ? Math.round(approvedPassQ / approvedTotalQ * 100) : 0,
    approvedPassQ, approvedTotalQ,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// KPI Strip — 6 張統計卡片
// ════════════════════════════════════════════════════════════════════════════
function KPIStrip({ stats }) {
  const STAGE = window.__MLI_REVIEW_STAGE;
  const pending = stats.byStage.unassigned + stats.byStage.waiting + stats.byStage.in_review + stats.byStage.resubmit;

  const kpis = [
    { label:"總案件數",   value: stats.total,                    sub:"全部範圍內案件",            color:"var(--ink)",       trend:"+8.3%", trendUp:true,  bg:"#fff" },
    { label:"待處理",     value: pending,                        sub:`含 ${stats.byStage.resubmit} 件補件審核`, color:"var(--primary)",  trend:"-12%",  trendUp:true,  bg:"var(--primary-soft-2)" },
    { label:"已通過",     value: stats.byStage.verified,         sub:`通過率 ${stats.approvalRate}%`, color: STAGE.verified.color,  trend:"+5.1%", trendUp:true,  bg:"rgba(72,153,61,.08)" },
    { label:"已退回",     value: stats.byStage.returned,         sub:"近 30 日累計",              color: STAGE.returned.color,  trend:"-3.8%", trendUp:true,  bg:"rgba(234,82,82,.06)" },
    { label:"平均風險分數", value: stats.avgRiskScore,             sub:"100 分制",                  color:"rgb(178,104,12)",      trend:"+1.4",  trendUp:false, bg:"rgba(241,160,40,.08)", suffix:" / 100" },
    { label:"通過題數",   value: `${stats.approvedPassQ}/${stats.approvedTotalQ}`, sub:"STT 比對結果", color:"rgb(73,99,250)",   trend:"+24",  trendUp:true,  bg:"rgba(73,99,250,.06)", isText:true },
  ];

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:12}}>
      {kpis.map((k,i) => (
        <div key={i} className="card" style={{
          padding:"14px 16px",
          background: k.bg,
          border:"1px solid var(--line-2)",
          display:"flex", flexDirection:"column", gap:6,
        }}>
          <div style={{font:"500 11.5px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".06em"}}>
            {k.label}
          </div>
          <div style={{display:"flex", alignItems:"baseline", gap:4}}>
            <span className={k.isText ? "ff-mont tabular" : "ff-mont tabular"} style={{
              font: k.isText ? "700 22px/1 Montserrat" : "700 28px/1 Montserrat",
              color: k.color,
            }}>{k.value}</span>
            {k.suffix && <span style={{font:"500 12px/1 Montserrat", color: k.color, opacity:.7}}>{k.suffix}</span>}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:2,
              padding:"1.5px 6px", borderRadius:8,
              background: k.trendUp ? "rgba(72,153,61,.12)" : "rgba(241,160,40,.14)",
              color: k.trendUp ? "rgb(58,124,49)" : "rgb(178,104,12)",
              font:"600 10px/1.2 Montserrat", letterSpacing:".02em",
            }}>
              <span style={{fontSize:9, transform: k.trendUp ? "rotate(-45deg)" : "rotate(45deg)"}}>▲</span>
              {k.trend}
            </span>
            <span style={{font:"400 11px/1.2 'Noto Sans TC'", color:"var(--ink-4)"}}>
              {k.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Donut Card — 通用環形圖卡
// ════════════════════════════════════════════════════════════════════════════
function DonutCard({ title, subtitle, total, slices, centerLabel, centerValue, centerSuffix }) {
  const sum = slices.reduce((s,x) => s+x.value, 0) || 1;
  const cx = 90, cy = 90, r = 64, stroke = 18;
  const circ = 2 * Math.PI * r;

  let acc = 0;
  const arcs = slices.map(s => {
    const len = (s.value / sum) * circ;
    const offset = -acc;
    acc += len;
    return { ...s, len, offset };
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div style={{display:"flex", gap:24, alignItems:"center"}}>
        <div style={{position:"relative", width:180, height:180, flexShrink:0}}>
          <svg width={180} height={180}>
            <circle cx={cx} cy={cy} r={r} stroke="var(--line-2)" strokeWidth={stroke} fill="none"/>
            {arcs.map((a,i) => (
              <circle key={i} cx={cx} cy={cy} r={r} stroke={a.color} strokeWidth={stroke} fill="none"
                strokeDasharray={`${a.len} ${circ - a.len}`}
                strokeDashoffset={a.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition:"stroke-dashoffset .4s ease" }}/>
            ))}
          </svg>
          <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2}}>
            <div className="ff-mont tabular" style={{font:"700 30px/1 Montserrat", color:"var(--ink)"}}>
              {centerValue != null ? centerValue : total}
            </div>
            {centerSuffix && (
              <div style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)"}}>{centerSuffix}</div>
            )}
            <div style={{font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-4)", letterSpacing:".06em"}}>
              {centerLabel}
            </div>
          </div>
        </div>

        <div style={{flex:1, display:"flex", flexDirection:"column", gap:8, minWidth:0}}>
          {slices.map(s => {
            const pct = Math.round((s.value / sum) * 100);
            return (
              <div key={s.key} style={{display:"flex", alignItems:"center", gap:10}}>
                <span style={{width:10, height:10, borderRadius:3, background:s.color, flexShrink:0}}/>
                <span style={{font:"500 12.5px/1.3 'Noto Sans TC'", color:"var(--ink-2)", flex:1}}>
                  {s.label}
                </span>
                <span className="ff-mont tabular" style={{font:"600 13px/1 Montserrat", color:"var(--ink)"}}>
                  {s.value}
                </span>
                <span className="ff-mont tabular" style={{font:"500 11px/1 Montserrat", color:"var(--ink-4)", width:32, textAlign:"right"}}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Region Bar Card — 各地區案件分佈（垂直 bar）
// ════════════════════════════════════════════════════════════════════════════
function RegionBarCard({ stats }) {
  const regions = ["北一區","北二區","中區","南區"];
  const palette = ["rgb(73,99,250)","rgb(123,109,235)","rgb(20,166,164)","rgb(241,160,40)"];
  const data = regions.map((r,i) => ({ name: r, value: stats.byRegion[r] || 0, color: palette[i] }));
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <ChartCard title="各地區案件分佈" subtitle="依承辦業務所屬地區">
      <div style={{display:"grid", gridTemplateColumns:`repeat(${data.length}, 1fr)`, gap:18,
        height:200, padding:"0 8px"}}>
        {data.map((d,i) => {
          const h = (d.value / max) * 150;
          return (
            <div key={d.name} style={{display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"flex-end", gap:8}}>
              <span className="ff-mont tabular" style={{font:"700 16px/1 Montserrat", color:d.color}}>
                {d.value}
              </span>
              <div style={{
                width:"100%", maxWidth:64, height: Math.max(h, 4),
                borderRadius:"6px 6px 0 0",
                background: d.color,
                transition:"height .3s ease",
              }}/>
              <div style={{font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".04em"}}>
                {d.name}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STT Flags Card — 異常旗標統計（水平 bar）
// ════════════════════════════════════════════════════════════════════════════
function SttFlagsCard({ stats }) {
  const flags = [
    { key:"diff",     label:"字詞比對差異", value: stats.sttFlags.diff,     color:"rgb(73,99,250)",   desc:"原稿與 STT 結果不一致" },
    { key:"negation", label:"否定/不確定語意", value: stats.sttFlags.negation, color:"rgb(234,82,82)",   desc:"客戶回應未明確" },
    { key:"lowConf",  label:"低信心段落",   value: stats.sttFlags.lowConf,  color:"rgb(241,160,40)",  desc:"STT 信心 < 60%" },
  ];
  const max = Math.max(1, ...flags.map(f => f.value));
  const total = flags.reduce((s,f) => s + f.value, 0);

  return (
    <ChartCard title="STT 異常旗標統計" subtitle={`全部案件累計 ${total} 個異常段落`}>
      <div style={{display:"flex", flexDirection:"column", gap:18, padding:"6px 0"}}>
        {flags.map(f => (
          <div key={f.key}>
            <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:6}}>
              <span style={{width:9, height:9, borderRadius:2, background:f.color, flexShrink:0,
                position:"relative", top:1}}/>
              <span style={{font:"500 13px/1 'Noto Sans TC'", color:"var(--ink-2)"}}>{f.label}</span>
              <span style={{font:"400 11px/1.3 'Noto Sans TC'", color:"var(--ink-4)", marginLeft:4}}>
                {f.desc}
              </span>
              <span style={{flex:1}}/>
              <span className="ff-mont tabular" style={{font:"700 18px/1 Montserrat", color:f.color}}>
                {f.value}
              </span>
            </div>
            <div style={{height:8, borderRadius:4, background:"var(--line-2)", overflow:"hidden"}}>
              <div style={{
                height:"100%", width: `${(f.value/max)*100}%`,
                background: f.color,
                borderRadius:4,
                transition:"width .35s ease",
              }}/>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLA Heat Card — 倒數狀況分桶
// ════════════════════════════════════════════════════════════════════════════
function SlaHeatCard({ stats }) {
  const buckets = [
    { key:"overdue", label:"已逾期",   value: stats.slaBuckets.overdue, color:"rgb(196,55,55)",  desc:"SLA < 0 天" },
    { key:"today",   label:"今日到期", value: stats.slaBuckets.today,   color:"rgb(234,82,82)",  desc:"SLA = 0 天" },
    { key:"urgent",  label:"緊急",     value: stats.slaBuckets.urgent,  color:"rgb(241,160,40)", desc:"1–2 天內" },
    { key:"soon",    label:"近期",     value: stats.slaBuckets.soon,    color:"rgb(73,99,250)",  desc:"3–5 天內" },
    { key:"safe",    label:"充裕",     value: stats.slaBuckets.safe,    color:"rgb(72,153,61)",  desc:"> 5 天" },
  ];
  const total = buckets.reduce((s,b) => s+b.value, 0) || 1;

  return (
    <ChartCard title="SLA 倒數狀況"
      subtitle={`${stats.slaBuckets.overdue + stats.slaBuckets.today} 件需立即處理`}>
      {/* 堆疊條 */}
      <div style={{height:32, borderRadius:6, overflow:"hidden", display:"flex",
        border:"1px solid var(--line-2)", marginBottom:14}}>
        {buckets.map(b => b.value > 0 && (
          <div key={b.key} title={`${b.label}：${b.value} 件`}
            style={{
              flex: b.value,
              background: b.color,
              display:"grid", placeItems:"center",
              color:"#fff", font:"600 11px/1 Montserrat",
              borderRight:"1px solid rgba(255,255,255,.4)",
            }}>
            {(b.value/total) > 0.08 ? b.value : ""}
          </div>
        ))}
      </div>

      {/* 圖例 + 數值 */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8}}>
        {buckets.map(b => (
          <div key={b.key} style={{
            padding:"8px 10px", borderRadius:6, border:"1px solid var(--line-2)",
            background:"#fff", display:"flex", flexDirection:"column", gap:3,
          }}>
            <span style={{display:"flex", alignItems:"center", gap:5}}>
              <span style={{width:8, height:8, borderRadius:2, background:b.color}}/>
              <span style={{font:"500 11px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>{b.label}</span>
            </span>
            <span className="ff-mont tabular" style={{font:"700 18px/1 Montserrat", color:b.color}}>
              {b.value}
            </span>
            <span style={{font:"400 10.5px/1.3 'Noto Sans TC'", color:"var(--ink-4)"}}>{b.desc}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TOP Products Card — 商品案件數 TOP N
// ════════════════════════════════════════════════════════════════════════════
function TopProductsCard({ stats }) {
  const list = stats.topProducts;
  const max = Math.max(1, ...list.map(p => p.count));

  return (
    <ChartCard title="商品案件分佈 TOP 6" subtitle="依目前範圍內案件數">
      <div style={{display:"flex", flexDirection:"column", gap:12, padding:"4px 0"}}>
        {list.map((p, i) => {
          const pct = (p.count / max) * 100;
          return (
            <div key={p.name} style={{display:"flex", alignItems:"center", gap:10}}>
              <span className="ff-mont tabular" style={{
                width:18, font:"600 11px/1 Montserrat", color:"var(--ink-4)", textAlign:"right",
              }}>{i+1}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{font:"500 12.5px/1.3 'Noto Sans TC'", color:"var(--ink-2)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4}}>
                  {p.name}
                </div>
                <div style={{height:6, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
                  <div style={{
                    height:"100%", width:`${pct}%`,
                    background:"linear-gradient(90deg, var(--primary), rgb(123,109,235))",
                    borderRadius:3,
                    transition:"width .35s ease",
                  }}/>
                </div>
              </div>
              <span className="ff-mont tabular" style={{font:"700 14px/1 Montserrat", color:"var(--primary)",
                width:40, textAlign:"right"}}>
                {p.count}
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Reviewer Workload Card — 審核員工作量
// ════════════════════════════════════════════════════════════════════════════
function ReviewerWorkloadCard({ stats }) {
  return (
    <ChartCard title="審核員工作量" subtitle={`共 ${stats.reviewerList.length} 位審核員 / 受指派群`}>
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"1px solid var(--line-2)"}}>
            <th style={tableTh}>審核員</th>
            <th style={tableTh}>所屬地區</th>
            <th style={{...tableTh, textAlign:"right"}}>指派總數</th>
            <th style={{...tableTh, textAlign:"right"}}>已通過</th>
            <th style={{...tableTh, textAlign:"right"}}>已退回</th>
            <th style={{...tableTh, textAlign:"right"}}>待處理</th>
            <th style={{...tableTh, textAlign:"right"}}>SLA超時</th>
            <th style={tableTh}>平均風險</th>
            <th style={tableTh}>完成度</th>
          </tr>
        </thead>
        <tbody>
          {stats.reviewerList.map((r, i) => {
            const done = r.verified + r.returned;
            const pct = r.total > 0 ? Math.round(done / r.total * 100) : 0;
            const riskColor = r.avgRisk >= 70 ? "rgb(196,55,55)"
                            : r.avgRisk >= 30 ? "rgb(178,104,12)" : "rgb(58,124,49)";
            return (
              <tr key={r.id} style={{
                borderBottom:"1px solid var(--line-2)",
                background: i % 2 === 1 ? "var(--primary-bg)" : "#fff",
                opacity: r._unassigned ? 0.7 : 1,
              }}>
                <td style={tableTd}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <div style={{
                      width:30, height:30, borderRadius:"50%",
                      background: r._unassigned ? "var(--line-2)" : "var(--primary-soft)",
                      color: r._unassigned ? "var(--ink-4)" : "var(--primary)",
                      display:"grid", placeItems:"center",
                      font:"600 11px/1 'Noto Sans TC'",
                    }}>{r.name?.slice(0,1) || "?"}</div>
                    <div>
                      <div style={{font:"500 13px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>{r.name}</div>
                      <div className="ff-mont" style={{font:"500 10.5px/1.3 Montserrat", color:"var(--ink-4)"}}>
                        {r.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{...tableTd, font:"400 12px/1 'Noto Sans TC'", color:"var(--ink-3)"}}>{r.region}</td>
                <td style={{...tableTd, textAlign:"right", font:"600 13px/1 Montserrat", color:"var(--ink)"}} className="tabular ff-mont">
                  {r.total}
                </td>
                <td style={{...tableTd, textAlign:"right", font:"500 13px/1 Montserrat", color:"rgb(58,124,49)"}} className="tabular ff-mont">
                  {r.verified}
                </td>
                <td style={{...tableTd, textAlign:"right", font:"500 13px/1 Montserrat", color:"rgb(196,55,55)"}} className="tabular ff-mont">
                  {r.returned}
                </td>
                <td style={{...tableTd, textAlign:"right", font:"500 13px/1 Montserrat", color:"var(--ink-2)"}} className="tabular ff-mont">
                  {r.pending}
                </td>
                <td style={{...tableTd, textAlign:"right"}}>
                  {r.overdue > 0 ? (
                    <span style={{
                      padding:"2px 8px", borderRadius:10,
                      background:"var(--danger-soft)", color:"var(--danger)",
                      font:"600 11.5px/1 Montserrat", letterSpacing:".02em",
                    }} className="tabular ff-mont">
                      {r.overdue}
                    </span>
                  ) : (
                    <span style={{color:"var(--ink-4)"}} className="tabular ff-mont">—</span>
                  )}
                </td>
                <td style={tableTd}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <div style={{flex:1, height:6, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${r.avgRisk}%`, background:riskColor,
                        borderRadius:3, transition:"width .3s"}}/>
                    </div>
                    <span className="ff-mont tabular" style={{font:"600 12px/1 Montserrat", color:riskColor,
                      width:24, textAlign:"right"}}>
                      {r.avgRisk}
                    </span>
                  </div>
                </td>
                <td style={tableTd}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <div style={{flex:1, height:6, borderRadius:3, background:"var(--line-2)", overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${pct}%`, background:"var(--primary)",
                        borderRadius:3, transition:"width .3s"}}/>
                    </div>
                    <span className="ff-mont tabular" style={{font:"600 12px/1 Montserrat", color:"var(--primary)",
                      width:32, textAlign:"right"}}>
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ChartCard>
  );
}

const tableTh = {
  padding:"10px 12px", textAlign:"left",
  font:"600 11.5px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".06em", whiteSpace:"nowrap",
};
const tableTd = {
  padding:"12px 12px", verticalAlign:"middle",
  font:"400 12.5px/1.3 'Noto Sans TC'", color:"var(--ink-2)",
};

// ════════════════════════════════════════════════════════════════════════════
// ChartCard — 通用圖表卡容器
// ════════════════════════════════════════════════════════════════════════════
function ChartCard({ title, subtitle, children }) {
  return (
    <section className="card" style={{padding:"16px 20px 18px"}}>
      <div style={{marginBottom:14}}>
        <h3 style={{margin:0, font:"700 14px/1.2 'Noto Sans TC'", color:"var(--ink)", letterSpacing:".03em"}}>
          {title}
        </h3>
        {subtitle && (
          <div className="meta" style={{marginTop:4}}>{subtitle}</div>
        )}
      </div>
      {children}
    </section>
  );
}

window.QualityReportScreen = QualityReportScreen;
