// admin-app.jsx — 內勤審核後台路由 + Tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showFCodes": true,
  "viewMode": "compare",
  "highlightMode": "both",
  "demoCase": "A0004-1"
}/*EDITMODE-END*/;

function AdminApp() {
  const [cases, setCases] = React.useState(window.__MLI_CASES);
  const detailMap = window.__MLI_REVIEW_DETAIL;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Routing
  const [page, setPage] = React.useState("review_list");
  const [activeCaseNo, setActiveCaseNo] = React.useState(t.demoCase);

  const activeCase = cases.find(c => c.caseNo === activeCaseNo) || cases[2];
  const activeDetail = detailMap[activeCaseNo] || detailMap[activeCase.caseNo] || detailMap["A0004-1"];

  // F-code legend toggle
  React.useEffect(() => {
    document.documentElement.classList.toggle("hide-fcodes", !t.showFCodes);
  }, [t.showFCodes]);

  // KPI counts (for rail nav badge)
  const pendingCount = cases.filter(c => ["waiting","unassigned","in_review","resubmit"].includes(c.reviewStage)).length;

  const goOpen = (no) => { setActiveCaseNo(no); setPage("review_detail"); };
  const goBack = () => setPage("review_list");

  // 審核通過：回寫案件狀態（清單即時反映）並返回清單
  const goApprove = (no) => {
    setCases(cs => cs.map(c => c.caseNo === no ? { ...c, status: "approved", reviewStage: "verified" } : c));
    setPage("review_list");
  };
  // 退回補正：回寫案件狀態（清單即時反映）；停留詳情以便檢視「退回補正」分頁
  const goReturn = (no) => {
    setCases(cs => cs.map(c => c.caseNo === no ? { ...c, status: "returned", reviewStage: "returned" } : c));
  };

  // Expose nav globally (for PPTX export and external automation)
  React.useEffect(() => {
    window.__adminGoTo = (p, caseNo) => {
      if (caseNo) setActiveCaseNo(caseNo);
      setPage(p);
    };
  }, []);

  const tweaksDomNode = document.getElementById("tweaks-root");

  return (
    <>
      <div className="scaler">
        <div className="app">
          <AdminHeader self={window.__MLI_REVIEWER_SELF} page={page} onNav={setPage}/>

          <div className="main-shell">
            <RailNav page={page} onNav={setPage} counts={{pending: pendingCount}}/>

            <div className="main-content">
              {page === "review_list" && (
                <ReviewListScreen cases={cases}
                  onOpen={goOpen}
                  onCreate={()=>setPage("create")}/>
              )}

              {page === "review_detail" && (
                <ReviewDetailScreen caseInfo={activeCase} detail={activeDetail}
                  onBack={goBack}
                  onApprove={goApprove}
                  onReturn={goReturn}/>
              )}

              {page === "quality_report" && (
                <QualityReportScreen cases={cases} detailMap={detailMap}/>
              )}

              {page === "create" && (
                <CreateCaseAdminScreen onBack={goBack} onCreated={goBack}/>
              )}

              {page === "logs" && (
                <LogsScreen onBack={goBack}/>
              )}
            </div>
          </div>

          <div className="ftr">Copyright © 2026 TPIsoftware · MLI 高齡保險錄音審核後台 v1.0 · 內勤審核員：{window.__MLI_REVIEWER_SELF.name}</div>
        </div>
      </div>

      {tweaksDomNode && ReactDOM.createPortal(
        <TweaksPanel title="Tweaks">
          <TweakSection label="畫面切換"/>
          <TweakSelect label="目前畫面" value={page}
            options={[
              {value:"review_list",    label:"P-1 · 案件審核清單"},
              {value:"review_detail",  label:"P-2 · 案件審核詳情（核心）"},
              {value:"quality_report", label:"P-3 · 質檢報告"},
              {value:"create",         label:"P-4 · 建立錄音案件"},
              {value:"logs",           label:"P-5 · 操作紀錄"},
            ]}
            onChange={setPage}/>

          {page === "review_detail" && (
            <>
              <TweakSection label="切換審核案件"/>
              <TweakSelect label="案件編號" value={activeCaseNo}
                options={cases
                  .filter(c => detailMap[c.caseNo])
                  .map(c => ({
                    value: c.caseNo,
                    label: `${c.caseNo} · ${window.__MLI_RISK[c.riskLevel]?.label || "?"}風險 · ${c.proposer} · ${c.product.slice(0,12)}`,
                  }))}
                onChange={setActiveCaseNo}/>
            </>
          )}

          <TweakSection label="顯示選項"/>
          <TweakToggle label="顯示 F-code 對應標籤"
            value={t.showFCodes} onChange={(v) => setTweak('showFCodes', v)}/>

          <TweakSection label="說明"/>
          <div style={{font:"11.5px/1.55 'Noto Sans TC'",color:"rgba(41,38,27,.55)"}}>
            <b>後台特色</b><br/>
            • 左側 rail nav + 較密的資訊密度<br/>
            • 案件清單支援：風險分數、SLA 倒數、批次操作、進階篩選<br/>
            • 審核詳情頁：左播放器 / 章節 + 右逐題 STT vs 原稿並排<br/>
            • 整合 5 種角色色塊（機/業/要/被/繳）<br/>
            • 差異標示：紅刪除 / 綠新增 / 黃低信心 / 紅粗體否定<br/>
            • 推薦切換到「A0004-1」查看高風險案件（Q07/Q10 有完整異常範例）
          </div>
        </TweaksPanel>,
        tweaksDomNode
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp/>);
