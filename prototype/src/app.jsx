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

function App() {
  const data = window.__MLI_DATA;
  const cases = window.__MLI_CASES;
  const questions = window.__MLI_QUESTIONS;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyPalette(t.primaryHue); }, [t.primaryHue]);

  // Routing
  const [screen, setScreen] = React.useState("list"); // list | detail | entry | recording | upload
  const [activeCaseNo, setActiveCaseNo] = React.useState(cases[0].recordingNo);

  const activeCase = cases.find(c => c.recordingNo === activeCaseNo) || cases[0];

  // Recording flow state
  const [uploadMode, setUploadMode] = React.useState("validate");
  const [tts, setTts] = React.useState(data.tts);

  // Entry screen state
  const [entryStep, setEntryStep] = React.useState(1);          // 1: 案件資訊 / 2: 確認題稿
  const [entrySource, setEntrySource] = React.useState("integration"); // integration | manual

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
    setScreen("entry");
    setEntryStep(1);
    setRecQuestions(buildQuestions("fresh"));
  };
  const goToRecording = () => { setScreen("recording"); setUploadMode("validate"); };
  const goToUpload = () => { setScreen("upload"); setUploadMode("validate"); };

  const tweaksDomNode = document.getElementById("tweaks-root");

  // Toggle F-code legend visibility via CSS class on root
  React.useEffect(() => {
    document.documentElement.classList.toggle("hide-fcodes", !t.showFCodes);
  }, [t.showFCodes]);

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
              onOpen={goToDetail}
              onNew={goToEntry}/>
          )}

          {screen === "detail" && (
            <CaseDetailScreen caseInfo={activeCase} questions={questions}
              onBack={goToList}
              onStartRecord={goToRecording}/>
          )}

          {screen === "entry" && (
            <EntryScreen caseInfo={activeCase} tts={tts} setTts={setTts}
              entryStep={entryStep} setEntryStep={setEntryStep}
              entrySource={entrySource} setEntrySource={setEntrySource}
              onStart={goToRecording}
              onCancel={goToList}/>
          )}

          {screen === "recording" && (
            <RecordingScreen caseInfo={activeCase} tts={tts} setTts={setTts}
              questions={recQuestions} setQuestions={setRecQuestions}
              onFinish={goToUpload} tweaks={t}
              onBackToList={goToList}
              onBackToCase={() => goToDetail(activeCaseNo)}/>
          )}

          {screen === "upload" && (
            <UploadScreen caseInfo={activeCase} questions={recQuestions}
              mode={uploadMode} onModeChange={setUploadMode}
              onBack={goToRecording}
              onRestart={goToList}/>
          )}

          <div className="ftr">Copyright © 2026 TPIsoftware · MLI 高齡保險錄音前台 v1.0</div>
        </div>
      </div>

      {tweaksDomNode && ReactDOM.createPortal(
        <TweaksPanel title="Tweaks">

          <TweakSection label="畫面切換"/>
          <TweakSelect label="目前畫面" value={screen}
            options={[
              {value:"list",      label:"P-3 · 案件清單"},
              {value:"detail",    label:"P-3 · 案件內容"},
              {value:"entry",     label:"P-1 · 建立錄音案件"},
              {value:"recording", label:"P-1 · 錄音作業"},
              {value:"upload",    label:"P-1 · 完成送出"},
            ]}
            onChange={(v) => {
              if (v === "upload") setUploadMode("validate");
              if (v === "entry") setEntryStep(1);
              setScreen(v);
            }}/>

          {screen === "entry" && (
            <>
              <TweakRadio label="STEP 切換" value={entryStep}
                options={[
                  {value:1, label:"01 案件資訊"},
                  {value:2, label:"02 確認題稿"},
                ]}
                onChange={setEntryStep}/>
              <TweakRadio label="起案通路" value={entrySource}
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
                value: c.recordingNo,
                label: `${window.__MLI_STATUS[c.status].label}　·　${c.proposer}　·　${c.product.slice(0,12)}`,
              }))}
              onChange={setActiveCaseNo}/>
          )}

          {screen === "upload" && (
            <TweakRadio label="上傳子狀態" value={uploadMode}
              options={[
                {value:"validate", label:"檢核"},
                {value:"merging",  label:"合併中"},
                {value:"done",     label:"完成"},
              ]}
              onChange={setUploadMode}/>
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
            <b>v3 重點更新</b><br/>
            • 「建立錄音案件」重構為 3 步驟流程<br/>
              　STEP 01 輸入案件資訊（姓名/身分證/關係/商品）<br/>
              　STEP 02 取號 + 確認題目文稿<br/>
              　STEP 03 錄音作業<br/>
            • 依起案通路判斷是否由建議書 APP 帶入<br/>
            • 客戶資料支援多客戶 / 多重角色裝顯<br/>
            • v2 新增 P-3 案件查詢介面（F-301~F-307）
          </div>
        </TweaksPanel>,
        tweaksDomNode
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
