// Main app — screen router + global state
// Screens flow:
//   list (P-3 案件清單)
//   ├─ entry (F-101 建立錄音案件) → recording (P-1) → upload → list
//   └─ detail (F-302 案件內容) → recording (P-1 重錄/續錄) → upload → detail
//                              → upload audio (F-307) → detail

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "demoState": "mixed",
  "primaryHue": "indigo",
  "showFCodes": true
}/*EDITMODE-END*/;

const PRIMARY_PALETTES = {
  indigo: { primary: "rgb(73,99,250)",  p2: "rgb(131,143,249)", soft: "rgb(238,242,255)", bg: "rgb(249,250,255)" },
  violet: { primary: "rgb(123,109,235)", p2: "rgb(159,148,242)", soft: "rgb(241,239,253)", bg: "rgb(250,249,255)" },
  tech:   { primary: "rgb(91,134,242)",  p2: "rgb(141,170,247)", soft: "rgb(232,239,254)", bg: "rgb(247,251,255)" },
  trust:  { primary: "rgb(53,113,200)",  p2: "rgb(116,159,219)", soft: "rgb(226,238,251)", bg: "rgb(246,251,255)" },
};

function applyPalette(hue) {
  const p = PRIMARY_PALETTES[hue] || PRIMARY_PALETTES.indigo;
  const r = document.documentElement;
  r.style.setProperty("--primary", p.primary);
  r.style.setProperty("--primary-2", p.p2);
  r.style.setProperty("--primary-soft", p.soft);
  r.style.setProperty("--primary-bg", p.bg);
}

// 案件 roles → 標準化錄音對象（同人合併多角色，key 以身分證/姓名為主）
function subjectsFromCase(c) {
  const map = new Map();
  ["proposer", "insured", "payer"].forEach(k => {
    const r = c.roles && c.roles[k];
    if (!r) return;
    const key = (r.idNo && r.idNo.trim()) ? r.idNo.trim().toUpperCase() : r.name;
    if (map.has(key)) map.get(key).roleKeys.push(k);
    else map.set(key, { key, name: r.name, idNo: r.idNo || "", roleKeys: [k], age: r.age });
  });
  return [...map.values()];
}

function App() {
  const data = window.__MLI_DATA;
  const [cases, setCases] = React.useState(window.__MLI_CASES);
  const questions = window.__MLI_QUESTIONS;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyPalette(t.primaryHue); }, [t.primaryHue]);

  // Routing
  const [screen, setScreen] = React.useState("list"); // list | detail | entry | recording | upload
  const [activeCaseNo, setActiveCaseNo] = React.useState(cases[0].caseNo);

  const activeCase = cases.find(c => c.caseNo === activeCaseNo) || cases[0];

  // Recording flow state
  const [tts, setTts] = React.useState(data.tts);

  // ── 多對象 / 多場次錄音流程（進度以 caseNo 為 key 持久化於 app 狀態）──
  const [progressMap, setProgressMap] = React.useState(() => {
    // 示範：一筆草稿（A0002-1，iPad/建議書）已選「分題」並錄到一半（7/14），
    // 讓清單/詳情展示「進行中草稿」；另一筆 Web 草稿（A0007-1）維持「尚未選擇錄音方式」。
    const seedNo = "A0002-1";
    const sc = window.__MLI_CASES.find(c => c.caseNo === seedNo);
    if (!sc) return {};
    const subs = subjectsFromCase(sc);
    const prog = progInit(subs);
    prog.method = "segmented";
    subs.forEach(s => { for (let n = 1; n <= 7; n++) prog.q[s.key][n] = "recorded"; });
    return { [seedNo]: prog };
  });
  const [recSubjects, setRecSubjects] = React.useState(() => subjectsFromCase(cases[0]));
  const [sessionKeys, setSessionKeys] = React.useState(() => subjectsFromCase(cases[0]).map(s => s.key));
  const [recMethod, setRecMethod] = React.useState("segmented"); // segmented | whole
  const [recFlowMode, setRecFlowMode] = React.useState("normal"); // normal | correction（補正錄音）
  const [correctionDone, setCorrectionDone] = React.useState(null); // 補正送出成功視窗
  const [preRecOpen, setPreRecOpen] = React.useState(false);
  // 送出前檢核視窗（取代原「完成送出頁」）
  const [checkOpen, setCheckOpen] = React.useState(false);
  const [checkMode, setCheckMode] = React.useState("check"); // check | merging | done

  // Entry screen state
  const [entrySource, setEntrySource] = React.useState("integration"); // integration | manual

  // 建立案件成功視窗（列出本次產生的錄音編號）
  const [createdCases, setCreatedCases] = React.useState(null);
  const serialRef = React.useRef(19);   // 既有示範群組已用到 A0019，新建從 A0020 起
  // 取得「錄音編號」（整組建立母體的群組號，例：A0020）
  const genGroupNo = () => {
    serialRef.current += 1;
    return `A${String(serialRef.current).padStart(4,"0")}`;
  };
  const nowStr = () => {
    const d = new Date(); const p = (n)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  // 依「場次」拆成多筆案件：整組共用一個「錄音編號」(群組)，各場次給「案件編號」recordingNo-場次
  const createCases = ({ product, source, groups }) => {
    const now = nowStr();
    const groupNo = genGroupNo();           // 本次建立母體 → 一個錄音編號（一對多的「一」）
    const newCases = groups.map(g => {
      const roles = {};
      g.customers.forEach(c => (c.roles||[]).forEach(rk => { roles[rk] = { name: c.name, idNo: c.idNo, age: c.age || 70 }; }));
      const first = g.customers[0] || {};
      const insuredRole = roles.insured || roles.proposer || { name: first.name, age: first.age || 70 };
      return {
        recordingNo: groupNo,
        caseNo: `${groupNo}-${g.sessionNo}`,
        sessionNo: g.sessionNo,
        createdAt: now, updatedAt: now, policyNo: null,
        product, roles,
        agent: activeCase.agent, agentId: activeCase.agentId, branch: activeCase.branch,
        channel: source === "integration" ? "iPad（行銷系統）" : "Web（桌機瀏覽器）",
        duration: 0, status: "draft",
        source: source === "integration" ? "建議書系統" : "行動投保系統",
        scriptMode: source,            // integration | manual → 決定錄音方式閘門
        note: "",
        progress: { total: questions.length, recorded: 0, skipped: 0 },
        proposer: roles.proposer ? roles.proposer.name : first.name,
        insured: insuredRole.name,
        insuredAge: insuredRole.age || 70,
      };
    });
    setCases(cs => [...newCases, ...cs]);
    setCreatedCases({ groupNo, cases: newCases });
  };

  // 案件通路 → 錄音方式模式（建議書帶入可分題；手動輸入只能整段）
  const caseScriptMode = (c) => (c && c.scriptMode) ? c.scriptMode
    : (c && c.source === "建議書系統" ? "integration" : "manual");

  const buildQuestions = React.useCallback((demoState) => {
    return questions.map((q, i) => {
      let status = "pending";
      let duration = 0;
      if (demoState === "mixed") {
        if (i === 0) { status = "recorded"; duration = 38; }
        else if (i === 1) { status = "recorded"; duration = 22; }
        else if (i === 2) { status = "recorded"; duration = 31; }
        else if (i === 3) { status = "recording"; }
        else if (i === 8) { status = "skipped"; }
        else if (i === 11) { status = "skipped"; }
      } else if (demoState === "all_recorded") {
        status = "recorded"; duration = 20 + (i % 7) * 6;
      } else if (demoState === "near_done") {
        if (i < questions.length - 2) { status = "recorded"; duration = 25 + (i%5)*5; }
      }
      return { ...q, status, duration };
    });
  }, [questions]);

  const [recQuestions, setRecQuestions] = React.useState(() => buildQuestions(t.demoState));

  React.useEffect(() => {
    setRecQuestions(buildQuestions(t.demoState));
  }, [t.demoState, buildQuestions]);

  // Navigation handlers
  const goToList = () => setScreen("list");
  const goToDetail = (no) => { setActiveCaseNo(no); setScreen("detail"); };
  const goToEntry = () => {
    // demo：以雙對象案作為「建議書帶入」的預帶資料來源（建立的是全新案件，不影響此案）
    const twoSub = cases.find(c => subjectsFromCase(c).length >= 2) || activeCase;
    setActiveCaseNo(twoSub.caseNo);
    setScreen("entry");
  };

  // ── 補正錄音（退回補正案專用）：獨立入口，只走整段 / 上傳，不分題、不跳檢核視窗 ──
  const startCorrectionFlow = () => {
    const subs = subjectsFromCase(activeCase);
    setRecSubjects(subs);
    setSessionKeys(subs.map(s => s.key));
    setRecMethod("whole");
    setRecFlowMode("correction");
    setScreen("whole");
  };

  // 送出補正：補正音檔 append 到最新一輪（不動原始音檔、不合併、不覆蓋）；案件 → 補件審核
  const submitCorrection = (audioMeta) => {
    const no = activeCaseNo;
    if (window.__MLI_CORRECTION) {
      const rounds = window.mliCorrectionRounds(no);
      const latest = rounds.length ? rounds[rounds.length - 1] : null;
      if (latest && latest.status === "awaiting") {
        latest.status = "submitted";
        latest.audio = audioMeta;
      } else {
        const r = window.mliPushReturn(no, { reasonType: "other", reasonText: "業務員補正上傳。", qNos: [], subjectNames: [] });
        r.status = "submitted"; r.audio = audioMeta;
      }
    }
    setCases(cs => cs.map(c => c.caseNo === no ? { ...c, status: "resubmit" } : c));
    setRecFlowMode("normal");
    setCorrectionDone({ caseNo: no, audio: audioMeta });
  };

  // 開始錄音：彈出「開始錄音前設定」（對象 + 方式）；若案件已有進度則續錄
  // 進入錄音模組（依鎖定方式直接開對應頁；分題載入已存題目狀態）
  const enterModule = (method, list, prog) => {
    setRecMethod(method);
    const keys = (list || []).map(s => s.key);
    setSessionKeys(keys);
    if (method === "segmented") {
      const saved = (prog && prog.q && prog.q[keys[0]]) || {};
      setRecQuestions(questions.map(q => {
        const st = saved[q.no] || "pending";
        return { ...q, status: st, duration: st === "recorded" ? 30 : 0 };
      }));
      setScreen("recording");
    } else {
      setScreen("whole");
    }
  };

  // 進入錄音作業：方式未鎖定 → 開設定彈窗；已鎖定 → 直接進入對應錄音模組
  const startRecordingFlow = (subs) => {
    const no = activeCaseNo;
    let prog = progressMap[no];
    const list = (prog && prog.subjects && prog.subjects.length)
      ? prog.subjects
      : ((subs && subs.length) ? subs : subjectsFromCase(activeCase));
    if (!prog) {
      prog = progInit(list);
      setProgressMap(pm => ({ ...pm, [no]: prog }));
    }
    setRecSubjects(list);
    if (prog.method) {
      // 已選定並鎖定錄音方式 → 跳過設定彈窗，直接進入對應錄音頁
      enterModule(prog.method, list, prog);
    } else {
      // 首次：開「進入錄音作業」設定彈窗（選方式 / 設定 TTS / 手動上傳 PDF）
      setRecMethod("segmented");
      setSessionKeys(list.map(s => s.key));
      setPreRecOpen(true);
    }
  };

  const confirmPreRec = ({ method }) => {
    const no = activeCaseNo;
    // 本案件所有對象即為本場一起錄音的對象（場次已在建立時決定）
    const keys = recSubjects.map(s => s.key);
    setPreRecOpen(false);
    // 鎖定案件錄音方式（首次選定後不可異動）
    setProgressMap(pm => {
      const prog = pm[no] || progInit(recSubjects);
      const groupOf = { ...(prog.groupOf || {}) };
      const gid = [...keys].sort().join("|");
      keys.forEach(k => { groupOf[k] = gid; });
      return { ...pm, [no]: { ...prog, method: prog.method || method, groupOf } };
    });
    enterModule(method, recSubjects, progressMap[no]);
  };

  // 錄音中（分題）：每次題目變動即時寫回進度，離開也不會掉
  React.useEffect(() => {
    if (screen !== "recording") return;
    setProgressMap(pm => {
      const prog = pm[activeCaseNo];
      if (!prog) return pm;
      const np = progWriteSegmented(prog, sessionKeys, recQuestions);
      np.method = prog.method || "segmented";
      np.status = progAllDone(np, questions.length) ? np.status : "draft";
      return { ...pm, [activeCaseNo]: np };
    });
  }, [recQuestions, screen, sessionKeys, activeCaseNo]);

  // 整段/上傳：本場錄完或選好檔即時把該對象寫入 whole[k]（題級續錄的整段版）
  const markWholeStatus = (keys, status) => {
    const no = activeCaseNo;
    setProgressMap(pm => {
      const prog = pm[no] || progInit(recSubjects);
      const whole = { ...prog.whole };
      keys.forEach(k => { whole[k] = status; });
      let np = { ...prog, whole, method: prog.method || "whole" };
      np.status = progAllDone(np, questions.length) ? np.status : "draft";
      return { ...pm, [no]: np };
    });
  };

  // 送出前檢核：開視窗
  const openCheck = () => { setCheckMode("check"); setCheckOpen(true); };

  // 完成送出：寫回最新進度並置「審核中」（分題寫題級，整段已即時寫入）
  const submitCase = () => {
    const no = activeCaseNo;
    setProgressMap(pm => {
      let np = { ...(pm[no] || progInit(recSubjects)) };
      if ((np.method || recMethod) === "segmented") {
        np = progWriteSegmented(np, sessionKeys, recQuestions);
        np.method = np.method || "segmented";
      } else {
        np.method = np.method || "whole";
      }
      np.status = "reviewing";
      return { ...pm, [no]: np };
    });
  };

  const tweaksDomNode = document.getElementById("tweaks-root");

  // Toggle F-code legend visibility via CSS class on root
  React.useEffect(() => {
    document.documentElement.classList.toggle("hide-fcodes", !t.showFCodes);
  }, [t.showFCodes]);

  // 計算衍生狀態
  const activeProg = progressMap[activeCaseNo] || null;
  const subjectDone = progDoneMap(activeProg, questions.length);
  const completedSessions = activeProg ? activeProg.sessions : [];
  const activeScriptMode = caseScriptMode(activeCase);         // 依案件通路決定錄音方式閘門
  const isWebCase = (activeCase.channel || "").startsWith("Web"); // Web/桌機通路：整段錄音不可用，只能上傳
  const canWholeRecord = !isWebCase;                           // 整段錄音僅 iPad 通路（依案件通路，不再用全域裝置 Tweak）
  const preRecDefaultKeys = recSubjects.filter(s => !subjectDone[s.key]).map(s => s.key);
  const isLastSession = recSubjects.filter(s => !subjectDone[s.key] && !sessionKeys.includes(s.key)).length === 0;

  return (
    <>
      <div className="scaler">
        <div className="app">
          <Header caseInfo={activeCase} screen={screen} onNav={(s)=>{
            if (s === "list") goToList();
          }}/>

          {screen === "list" && (
            <CaseListScreen cases={cases}
              currentAgent={{agent: activeCase.agent, agentId: activeCase.agentId}}
              progressMap={progressMap}
              onOpen={goToDetail}
              onNew={goToEntry}/>
          )}

          {screen === "detail" && (
            <CaseDetailScreen caseInfo={activeCase} questions={questions}
              caseProgress={activeProg}
              onBack={goToList}
              onStartRecord={() => startRecordingFlow(subjectsFromCase(activeCase))}
              onStartCorrection={startCorrectionFlow}/>
          )}

          {screen === "entry" && (
            <EntryScreen caseInfo={activeCase}
              entrySource={entrySource} setEntrySource={setEntrySource}
              onCreate={createCases}
              onCancel={goToList}/>
          )}

          {screen === "recording" && (
            <RecordingScreen caseInfo={activeCase} tts={tts} setTts={setTts}
              questions={recQuestions} setQuestions={setRecQuestions}
              tweaks={t}
              onBackToList={goToList}
              subjects={recSubjects} sessionKeys={sessionKeys} subjectDone={subjectDone}
              onOpenCheck={openCheck}/>
          )}

          {screen === "whole" && (
            <WholeRecordingScreen caseInfo={activeCase}
              subjects={recSubjects} sessionKeys={sessionKeys} subjectDone={subjectDone}
              scriptSource={caseScriptMode(activeCase)}
              device={canWholeRecord ? "ipad" : "desktop"} questions={questions}
              flowMode={recFlowMode}
              returnInfo={recFlowMode === "correction" ? window.mliLatestRound(activeCaseNo) : null}
              onSubmitCorrection={submitCorrection}
              onWholeStatus={markWholeStatus} onOpenCheck={openCheck}
              onBackToList={recFlowMode === "correction" ? () => goToDetail(activeCaseNo) : goToList}/>
          )}

          <div className="ftr">Copyright © 2026 TPIsoftware · MLI 高齡保險錄音前台 v1.0</div>
        </div>
      </div>

      <PreRecordModal open={preRecOpen}
        subjects={recSubjects} scriptMode={activeScriptMode}
        canWholeRecord={canWholeRecord} tts={tts} setTts={setTts}
        onCancel={() => setPreRecOpen(false)} onConfirm={confirmPreRec}/>

      <CreatedCasesModal created={createdCases}
        onBackToList={() => { setCreatedCases(null); goToList(); }}/>

      <CorrectionDoneModal info={correctionDone}
        onBackToList={() => { setCorrectionDone(null); goToList(); }}
        onBackToCase={() => { const no = correctionDone.caseNo; setCorrectionDone(null); goToDetail(no); }}/>

      <SubmitCheckModal open={checkOpen} mode={checkMode} setMode={setCheckMode}
        caseInfo={activeCase} subjects={recSubjects} prog={activeProg} totalQ={questions.length}
        method={(activeProg && activeProg.method) || recMethod}
        onClose={() => setCheckOpen(false)}
        onSubmit={submitCase}
        onDoneToList={() => { setCheckOpen(false); goToList(); }}/>

      {tweaksDomNode && ReactDOM.createPortal(
        <TweaksPanel title="Tweaks">

          <TweakSection label="畫面切換"/>
          <TweakSelect label="目前畫面" value={screen}
            options={[
              {value:"list",      label:"P-3 · 案件清單"},
              {value:"detail",    label:"P-3 · 案件內容"},
              {value:"entry",     label:"P-1 · 建立錄音案件"},
              {value:"recording", label:"P-1 · 錄音作業（分題）"},
              {value:"whole",     label:"P-1 · 錄音作業（整段/上傳）"},
            ]}
            onChange={(v) => {
              if ((v === "recording" || v === "whole") && recSubjects.length === 0) {
                const s = subjectsFromCase(activeCase);
                setRecSubjects(s); setSessionKeys(s.map(x => x.key));
              }
              setScreen(v);
            }}/>

          {screen === "entry" && (
            <>
              <TweakSection label="通路"/>
              <TweakRadio label="起案通路（預帶資料）" value={entrySource}
                options={[
                  {value:"integration", label:"建議書帶入"},
                  {value:"manual",      label:"手動輸入"},
                ]}
                onChange={setEntrySource}/>
            </>
          )}

          {screen === "detail" && (
            <TweakSelect label="檢視案件" value={activeCaseNo}
              options={cases.map(c => ({
                value: c.caseNo,
                label: `${window.__MLI_STATUS[c.status].label}　·　${c.proposer}　·　${c.product.slice(0,12)}`,
              }))}
              onChange={setActiveCaseNo}/>
          )}

          {screen === "whole" && (
            <>
              <TweakSection label="整段錄音模式"/>
              <TweakRadio label="流程模式" value={recFlowMode}
                options={[
                  {value:"normal",     label:"一般錄音"},
                  {value:"correction", label:"補正錄音"},
                ]}
                onChange={(v) => {
                  if (v === "correction") {
                    const ret = cases.find(c => c.status === "returned") || activeCase;
                    setActiveCaseNo(ret.caseNo);
                    const subs = subjectsFromCase(ret);
                    setRecSubjects(subs); setSessionKeys(subs.map(s => s.key));
                  }
                  setRecFlowMode(v);
                }}/>
            </>
          )}

          {screen === "recording" && (
            <>
              <TweakSection label="題卡狀態演示"/>
              <TweakSelect label="題卡資料" value={t.demoState}
                options={[
                  {value:"mixed",        label:"混合狀態（已錄/錄音中/跳過/未錄）"},
                  {value:"fresh",        label:"全部未錄音（流程起點）"},
                  {value:"near_done",    label:"接近完成（最後 2 題未錄）"},
                  {value:"all_recorded", label:"全部已錄（可進入上傳檢核）"},
                ]}
                onChange={(v) => setTweak('demoState', v)}/>
            </>
          )}

          <TweakSection label="顯示選項"/>
          <TweakToggle label="顯示 F-code 對應標籤"
            value={t.showFCodes}
            onChange={(v) => setTweak('showFCodes', v)}/>

          <TweakSection label="視覺主題"/>
          <TweakSelect label="主色系" value={t.primaryHue}
            options={[
              {value:"indigo", label:"A. 專業靛 (預設)"},
              {value:"violet", label:"B. 沈穩紫"},
              {value:"tech",   label:"C. 科技藍"},
              {value:"trust",  label:"D. 信賴藍"},
            ]}
            onChange={(v) => setTweak('primaryHue', v)}/>

          <TweakSection label="說明"/>
          <div style={{font:"11.5px/1.55 'Noto Sans TC'",color:"rgba(41,38,27,.55)"}}>
            <b>v7 重點更新 · 斷開流程</b><br/>
            • 「建立錄音案件」改為單頁「建殼」，不再串錄音<br/>
            • 每位客戶新增「場次」欄位，依場次拆多筆案件（各自編號）<br/>
            • 確認建立 → 成功視窗列出編號 → 回到錄音清單<br/>
            • 自動帶入：題目文稿顯示於頁面下方（無 STEP 2）<br/>
            • 錄音改由 清單 → 詳情 →「進入錄音作業」觸發<br/>
            • 建議書帶入＝分題/整段；手動輸入＝只能整段且須先上傳 PDF<br/>
            • 已移除「選擇本場錄音對象」（改由場次決定）
          </div>
        </TweaksPanel>,
        tweaksDomNode
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CorrectionDoneModal — 補正音檔送出成功
// 直接送出（不經檢核視窗），確認補正音檔已獨立上傳、案件進入補件審核
function CorrectionDoneModal({ info, onBackToList, onBackToCase }) {
  if (!info) return null;
  return (
    <div style={{position:"fixed", inset:0, zIndex:200, background:"rgba(41,47,84,.4)", display:"grid", placeItems:"center"}}>
      <div className="card fadeup" style={{padding:32, width:500, textAlign:"center"}}>
        <div style={{width:64, height:64, borderRadius:"50%", background:"var(--ok-soft)",
          display:"grid", placeItems:"center", margin:"0 auto 14px"}}>
          <I.Check size={32} stroke="var(--ok)" sw={2.6}/>
        </div>
        <h3 style={{margin:"0 0 8px", font:"700 19px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>補正音檔已送出</h3>
        <p style={{margin:"0 0 18px", font:"400 13.5px/1.7 'Noto Sans TC'", color:"var(--ink-3)"}}>
          補正音檔已<b style={{color:"var(--ink-2)"}}>獨立上傳</b>，不覆蓋原始完整音檔。案件
          <span className="ff-mont tabular" style={{margin:"0 4px", color:"var(--primary)"}}>{info.caseNo}</span>
          進入「補件審核」，內勤將就補正內容重新進行 STT 轉文字與 AI 質檢後複審。
        </p>
        <div style={{padding:"12px 16px", borderRadius:10, background:"var(--primary-bg)",
          border:"1px solid var(--line-2)", marginBottom:20, textAlign:"left",
          display:"flex", flexDirection:"column", gap:7, font:"400 12.5px/1.5 'Noto Sans TC'"}}>
          <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
            <span style={{color:"var(--ink-4)"}}>錄音編號</span>
            <span className="ff-mont tabular" style={{color:"var(--primary)"}}>{info.caseNo}</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
            <span style={{color:"var(--ink-4)"}}>補正音檔</span>
            <span className="ff-mont tabular" style={{color:"var(--ink-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:260}}>{info.audio.name}</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
            <span style={{color:"var(--ink-4)"}}>補正方式</span>
            <span style={{color:"var(--ink-2)"}}>{info.audio.method === "upload" ? "上傳整段音檔" : "整段錄音"} · 1 完整音檔</span>
          </div>
        </div>
        <div style={{display:"flex", gap:10, justifyContent:"center"}}>
          <button className="btn btn-quiet" onClick={onBackToList}>回到案件清單</button>
          <button className="btn btn-primary" onClick={onBackToCase}><I.Doc size={14}/> 檢視案件</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
