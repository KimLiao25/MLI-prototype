// UploadScreen — three sub-states:
// 1. "validate"  — pre-upload check; if any pending questions, list them and block upload
// 2. "merging"   — back-end merging分段音檔 into one master file
// 3. "done"      — success summary

function UploadScreen({ caseInfo, questions, onBack, onRestart, mode, onModeChange }) {
  // mode controlled from parent so we can replay states via Tweaks
  const total = questions.length;
  const recorded = questions.filter(q => q.status === "recorded").length;
  const skipped = questions.filter(q => q.status === "skipped").length;
  const pending = questions.filter(q => q.status === "pending");
  const recording = questions.filter(q => q.status === "recording");
  const incomplete = [...pending, ...recording];
  const totalElapsed = questions.reduce((s, q) => s + (q.duration || 0), 0);

  // Auto-progress: if validate clean, advance to merging then done (with delays)
  React.useEffect(() => {
    if (mode === "merging") {
      const t = setTimeout(() => onModeChange("done"), 2400);
      return () => clearTimeout(t);
    }
  }, [mode, onModeChange]);

  return (
    <>
      <SubHeader title={mode === "done" ? "送出完成" : "完成送出檢核"}
        crumbs={["錄音作業", "完成送出"]}
        recordingNo={caseInfo.recordingNo}
        time={caseInfo.createdAt}/>

      <div className="fadeup" style={{padding:"32px 40px 60px", display:"grid", placeItems:"start center"}}>
        <div style={{width:"100%", maxWidth: 880}}>

          {/* ─── Validate state ─── */}
          {mode === "validate" && (
            <ValidateView caseInfo={caseInfo}
              incomplete={incomplete} questions={questions}
              totalElapsed={totalElapsed} recorded={recorded} skipped={skipped}
              onBack={onBack}
              onProceed={() => onModeChange("merging")}/>
          )}

          {/* ─── Merging state ─── */}
          {mode === "merging" && (
            <MergingView caseInfo={caseInfo} questions={questions}/>
          )}

          {/* ─── Done state ─── */}
          {mode === "done" && (
            <DoneView caseInfo={caseInfo} recorded={recorded} skipped={skipped}
              totalElapsed={totalElapsed} onRestart={onRestart}/>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
function ValidateView({ caseInfo, incomplete, questions, totalElapsed, recorded, skipped, onBack, onProceed }) {
  const blocked = incomplete.length > 0;

  return (
    <div className="card" style={{padding: 36}}>
      {blocked ? (
        <>
          <div style={{display:"flex", gap:14, alignItems:"center", marginBottom:6}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"var(--warn-soft)",
              display:"grid",placeItems:"center"}}>
              <I.Warn size={22} stroke="var(--warn)" sw={2}/>
            </div>
            <div>
              <h2 style={{margin:0,font:"700 20px/1.2 'Noto Sans TC'",color:"var(--ink)"}}>尚有未完成題目</h2>
              <p style={{margin:"4px 0 0",font:"400 13px/1.4 'Noto Sans TC'",color:"var(--ink-3)"}}>
                請先完成以下 {incomplete.length} 題，或將可跳過題目標記為「跳過」後再送出
              </p>
            </div>
          </div>

          <div style={{marginTop: 22, padding: 0, borderRadius:12, overflow:"hidden", border:"1px solid var(--line)"}}>
            <div style={{padding:"10px 16px", background:"var(--primary-bg)",
              font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)",letterSpacing:".06em",
              display:"flex",alignItems:"center",gap:8,
            }}>
              <I.Info size={12} stroke="var(--ink-3)"/> 未完成題目清單
            </div>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#fff",borderBottom:"1px solid var(--line-2)"}}>
                  <th style={{...thStyle, width: 70}}>題號</th>
                  <th style={{...thStyle, width: 90}}>類型</th>
                  <th style={{...thStyle}}>題目</th>
                  <th style={{...thStyle, width: 110}}>狀態</th>
                  <th style={{...thStyle, width: 110, textAlign:"right"}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map((q) => (
                  <tr key={q.no} style={{borderBottom:"1px solid var(--line-2)"}}>
                    <td style={{...tdStyle, font:"600 13px/1 Montserrat", color:"var(--primary)"}} className="tabular">
                      Q{q.no.toString().padStart(2,"0")}
                    </td>
                    <td style={tdStyle}>
                      <span className="tag" style={{background:q.type==="tts"?"var(--primary-soft)":"rgb(238,246,255)",
                        color:q.type==="tts"?"var(--primary)":"rgb(53,150,253)"}}>
                        {q.type==="tts"?"自動播稿":"業務員自錄"}
                      </span>
                    </td>
                    <td style={tdStyle}>{q.title}</td>
                    <td style={tdStyle}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:6, color:"var(--warn)",font:"500 13px/1 'Noto Sans TC'"}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:"var(--warn)"}}/>
                        未完成
                      </span>
                    </td>
                    <td style={{...tdStyle, textAlign:"right"}}>
                      <button className="btn btn-soft btn-sm" onClick={onBack}>前往錄音</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
            <button className="btn btn-quiet" onClick={onBack}>返回錄音作業</button>
            <button className="btn btn-primary" disabled aria-disabled="true">
              <I.Upload size={14}/> 完成送出
            </button>
          </div>
        </>
      ) : (
        // All complete — confirm before upload
        <>
          <div style={{display:"flex", gap:14, alignItems:"center", marginBottom:6}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"var(--ok-soft)",
              display:"grid",placeItems:"center"}}>
              <I.Check size={22} stroke="var(--ok)" sw={2.4}/>
            </div>
            <div>
              <h2 style={{margin:0,font:"700 20px/1.2 'Noto Sans TC'",color:"var(--ink)"}}>所有題目皆已完成</h2>
              <p style={{margin:"4px 0 0",font:"400 13px/1.4 'Noto Sans TC'",color:"var(--ink-3)"}}>
                點擊「完成送出」後，後端將自動合併分題音檔為完整音檔
              </p>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:22}}>
            <SummaryStat n={questions.length} label="總題數"/>
            <SummaryStat n={recorded} label="已錄音" color="var(--ok)"/>
            <SummaryStat n={skipped}  label="已跳過" color="var(--ink-3)"/>
            <SummaryStat n={fmtTime(totalElapsed)} label="總時長" mono/>
          </div>

          <div style={{marginTop:20, padding:"14px 18px", borderRadius:10,
            background:"var(--primary-bg)", border:"1px solid var(--line-2)"}}>
            <div style={{font:"500 13px/1.5 'Noto Sans TC'",color:"var(--ink-2)"}}>
              <span style={{color:"var(--primary)"}}>•</span> 錄音編號 <span className="ff-mont tabular" style={{color:"var(--primary)"}}>{caseInfo.recordingNo}</span>　·　{caseInfo.product}
            </div>
            <div className="meta" style={{marginTop:4}}>
              要保人 {caseInfo.proposer} ／ 被保險人 {caseInfo.insured} ／ 業務員 {caseInfo.agent}
            </div>
          </div>

          <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
            <button className="btn btn-quiet" onClick={onBack}>返回錄音作業</button>
            <button className="btn btn-primary btn-lg" onClick={onProceed}>
              <I.Upload size={16}/> 完成送出
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function MergingView({ caseInfo, questions }) {
  return (
    <div className="card" style={{padding: 48, textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:"50%", background:"var(--primary-soft)",
        display:"grid",placeItems:"center",margin:"0 auto 22px"}}>
        <svg className="spin" width={40} height={40} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(73,99,250,.2)" strokeWidth="2.5"/>
          <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 style={{margin:"0 0 8px",font:"700 22px/1.2 'Noto Sans TC'",color:"var(--ink)"}}>正在合併音檔…</h2>
      <p style={{margin:"0 0 28px",font:"400 14px/1.6 'Noto Sans TC'",color:"var(--ink-3)"}}>
        後端正將 {questions.filter(q=>q.status==="recorded").length} 段分題音檔合併為單一完整音檔，請稍候
      </p>

      <div style={{maxWidth:480, margin:"0 auto"}}>
        <div style={{height:8, borderRadius:4, background:"var(--primary-soft)", overflow:"hidden"}}>
          <div style={{
            height:"100%", background:"var(--primary)",
            width:"68%", borderRadius:4,
            transition:"width .4s ease",
            animation:"wf 2.2s ease-in-out infinite",
            transformOrigin:"left",
          }}/>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:10}}>
          <span className="meta">分段檔合併中</span>
          <span className="meta tabular ff-mont">68%</span>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"center",gap:18,marginTop:32,padding:18,
        background:"var(--primary-bg)", borderRadius:10, maxWidth:480, marginInline:"auto"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <span className="meta">錄音編號</span>
          <span className="ff-mont tabular" style={{font:"500 13px/1 Montserrat",color:"var(--ink-2)"}}>{caseInfo.recordingNo}</span>
        </div>
        <div style={{width:1, background:"var(--line-2)"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <span className="meta">案件</span>
          <span style={{font:"500 13px/1 'Noto Sans TC'",color:"var(--ink-2)"}}>{caseInfo.product}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function DoneView({ caseInfo, recorded, skipped, totalElapsed, onRestart }) {
  return (
    <div className="card fadeup" style={{padding: 48, textAlign:"center"}}>
      <div style={{
        width:96,height:96,borderRadius:"50%", background:"var(--ok-soft)",
        display:"grid",placeItems:"center", margin:"0 auto 24px",
        boxShadow:"0 0 0 8px rgba(72,153,61,.08)"}}>
        <I.Check size={48} stroke="var(--ok)" sw={2.6}/>
      </div>
      <h2 style={{margin:"0 0 8px",font:"700 24px/1.2 'Noto Sans TC'",color:"var(--ink)"}}>送出完成！</h2>
      <p style={{margin:"0 0 32px",font:"400 15px/1.6 'Noto Sans TC'",color:"var(--ink-3)"}}>
        完整音檔已送出，後端將進行 STT 比對與審核
      </p>

      <div style={{
        display:"grid",gridTemplateColumns:"repeat(3, 1fr)", gap:14,
        padding:"24px 28px", borderRadius:12,
        background:"linear-gradient(180deg, var(--primary-bg), #fff)",
        border:"1px solid var(--line-2)", maxWidth: 580, margin:"0 auto",
      }}>
        <BigStat n={recorded} l="已錄題數" color="var(--ok)"/>
        <BigStat n={skipped}  l="跳過題數" color="var(--ink-3)"/>
        <BigStat n={fmtTime(totalElapsed)} l="總時長" color="var(--primary)" mono/>
      </div>

      <div style={{marginTop:28, padding:"16px 20px", borderRadius:10, background:"var(--primary-soft-2)",
        border:"1px dashed rgba(73,99,250,.3)", maxWidth:580, margin:"28px auto 0",
        display:"flex", alignItems:"center", gap:12, textAlign:"left",
      }}>
        <I.Doc size={28} stroke="var(--primary)"/>
        <div style={{flex:1}}>
          <div style={{font:"500 14px/1.2 'Noto Sans TC'", color:"var(--ink)"}}>完整音檔識別碼</div>
          <div className="ff-mont tabular" style={{font:"600 14px/1 Montserrat",color:"var(--primary)",marginTop:4}}>
            {caseInfo.recordingNo}_merged.wav
          </div>
        </div>
        <span className="tag tag-ok"><I.Check size={11} stroke="currentColor"/> 已送內勤審核</span>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:32}}>
        <button className="btn btn-quiet">
          返回我的案件
        </button>
        <button className="btn btn-primary" onClick={onRestart}>
          <I.Mic size={16}/> 建立下一份錄音
        </button>
      </div>
    </div>
  );
}

// helpers
const thStyle = {
  padding: "12px 16px", textAlign:"left",
  font:"500 12px/1 'Noto Sans TC'", color:"var(--ink-3)",
  letterSpacing:".06em", background:"#fff",
};
const tdStyle = {
  padding: "14px 16px", font:"400 14px/1.4 'Noto Sans TC'", color:"var(--ink)",
  verticalAlign:"middle", background:"#fff",
};

function SummaryStat({ n, label, color = "var(--ink)", mono }) {
  return (
    <div style={{padding:"14px 16px", borderRadius:10, background:"var(--primary-bg)",
      border:"1px solid var(--line-2)"}}>
      <div className={mono?"tabular ff-mont":""} style={{font: mono ? "700 22px/1 Montserrat" : "700 24px/1 'Noto Sans TC'", color}}>{n}</div>
      <div style={{font:"400 12px/1 'Noto Sans TC'",color:"var(--ink-3)",marginTop:6}}>{label}</div>
    </div>
  );
}
function BigStat({ n, l, color, mono }) {
  return (
    <div>
      <div className={mono?"tabular ff-mont":""} style={{font: mono ? "700 28px/1 Montserrat" : "700 30px/1 'Noto Sans TC'", color}}>{n}</div>
      <div style={{font:"400 12px/1 'Noto Sans TC'",color:"var(--ink-3)",marginTop:6,letterSpacing:".06em"}}>{l}</div>
    </div>
  );
}

function fmtTime(s) {
  const m = Math.floor(s/60), r = Math.floor(s%60);
  return `${m.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`;
}

window.UploadScreen = UploadScreen;
