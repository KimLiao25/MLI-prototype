// 內勤審核後台 — 額外資料層
//
// 在 __MLI_CASES 之上擴充：
//   - region        所屬地區（人員角色設定的權限範圍 — 北一/北二/中區/南區）
//   - branch        通訊處（從原本帶過來）
//   - submittedAt   業務員送審時間
//   - reviewer      指派審核員（可為空）
//   - sla           SLA 倒數天數（負值代表已逾期）
//   - riskLevel     low | mid | high   STT 比對風險等級（給內勤決定優先順序）
//   - riskScore     0–100（low<30 / mid 30–70 / high>70）
//   - sttFlags      { diff, negation, lowConf } 三類旗標總數
//   - duration      ← 已有
//   - status        ← 已有
//
// 並建立 hero 詳情頁所需的「逐題 STT 比對」資料：window.__MLI_REVIEW_DETAIL

(function(){
  const STATUS = window.__MLI_STATUS;
  const cases = window.__MLI_CASES;

  // 後台額外狀態（內勤視角）：
  //   reviewing → 子狀態 pending（待審）/ in_review（審核中）/ verified（已通過）/ returned
  //   為精簡，prototype 保留與前台一致的 5 種主狀態，但新增 reviewer 與 reviewStage 細節
  // 風險：用一個確定性映射，依案件編號最後一碼 + 進度 + STT 旗標
  const REGIONS = ["北一區","北二區","中區","南區"];
  const REVIEWERS = [
    {name:"王怡萱", id:"E102934", region:"北一區"},
    {name:"李冠廷", id:"E118472", region:"北一區"},
    {name:"陳俊宏", id:"E121095", region:"北二區"},
    {name:"張嘉玲", id:"E133247", region:"中區"},
    {name:"林佩珊", id:"E145518", region:"南區"},
  ];

  // 既有 8 筆案件擴充
  const ENRICH = [
    {region:"北一區", reviewer:null,         sla: 6,  riskScore: 10, riskLevel:"low",  sttFlags:{diff:0,  negation:0, lowConf:0 }, reviewStage:"unassigned"},
    {region:"北一區", reviewer:null,         sla: 6,  riskScore: 10, riskLevel:"low",  sttFlags:{diff:0,  negation:0, lowConf:0 }, reviewStage:"unassigned"},
    {region:"北一區", reviewer:REVIEWERS[0], sla: 4,  riskScore: 22, riskLevel:"low",  sttFlags:{diff:1,  negation:0, lowConf:2 }, reviewStage:"waiting"},
    {region:"北一區", reviewer:REVIEWERS[1], sla: 2,  riskScore: 58, riskLevel:"mid",  sttFlags:{diff:6,  negation:1, lowConf:4 }, reviewStage:"in_review"},
    {region:"北一區", reviewer:REVIEWERS[0], sla: 1,  riskScore: 84, riskLevel:"high", sttFlags:{diff:12, negation:3, lowConf:8 }, reviewStage:"returned"},
    {region:"北一區", reviewer:REVIEWERS[0], sla: 7,  riskScore: 18, riskLevel:"low",  sttFlags:{diff:0,  negation:0, lowConf:1 }, reviewStage:"verified"},
    {region:"北二區", reviewer:REVIEWERS[2], sla: 2,  riskScore: 71, riskLevel:"high", sttFlags:{diff:9,  negation:2, lowConf:6 }, reviewStage:"resubmit"},
    {region:"北一區", reviewer:null,         sla: 5,  riskScore: 12, riskLevel:"low",  sttFlags:{diff:0,  negation:0, lowConf:0 }, reviewStage:"unassigned"},
    {region:"北二區", reviewer:REVIEWERS[2], sla: 3,  riskScore: 44, riskLevel:"mid",  sttFlags:{diff:4,  negation:1, lowConf:2 }, reviewStage:"waiting"},
    {region:"中區",   reviewer:REVIEWERS[3], sla: 0,  riskScore: 67, riskLevel:"mid",  sttFlags:{diff:7,  negation:0, lowConf:5 }, reviewStage:"returned"},
  ];
  cases.forEach((c, i) => Object.assign(c, ENRICH[i % ENRICH.length]));

  // 補幾筆案件，讓清單看起來像真的後台（多業務員、多通訊處、多地區）
  // 每筆自成一個錄音編號（群組）；A0012 刻意拆 2 場次 → 同一錄音編號下 2 個案件編號（示範一對多）
  const EXTRA = [
    {recordingNo:"A0010", caseNo:"A0010-1", sessionNo:1, date:"2026/05/22", agent:"周永禎", agentId:"A0612", branch:"台北信義通訊處", region:"北一區", product:"安心伴你行利率變動型終身壽險",   proposer:"羅美玉",  age:70, status:"reviewing", risk:"high", score:79, sla:1, stage:"in_review",  reviewer:REVIEWERS[1]},
    {recordingNo:"A0011", caseNo:"A0011-1", sessionNo:1, date:"2026/05/22", agent:"高雅婷", agentId:"A0518", branch:"新北板橋通訊處", region:"北一區", product:"新康健終身醫療健康保險",         proposer:"葉文清",  age:73, status:"reviewing", risk:"low",  score:20, sla:5, stage:"waiting",    reviewer:REVIEWERS[0]},
    {recordingNo:"A0012", caseNo:"A0012-1", sessionNo:1, date:"2026/05/22", agent:"鄭子涵", agentId:"A0742", branch:"桃園中壢通訊處", region:"北二區", product:"鑫美鑫多元利率變動型終身壽險",   proposer:"許雅芳",  age:81, status:"reviewing", risk:"mid",  score:51, sla:3, stage:"in_review",  reviewer:REVIEWERS[2]},
    {recordingNo:"A0012", caseNo:"A0012-2", sessionNo:2, date:"2026/05/22", agent:"鄭子涵", agentId:"A0742", branch:"桃園中壢通訊處", region:"北二區", product:"鑫美鑫多元利率變動型終身壽險",   proposer:"許志成",  age:78, status:"reviewing", risk:"low",  score:23, sla:3, stage:"waiting",    reviewer:REVIEWERS[2]},
    {recordingNo:"A0013", caseNo:"A0013-1", sessionNo:1, date:"2026/05/21", agent:"楊志豪", agentId:"A0331", branch:"新竹竹科通訊處", region:"北二區", product:"長長久久終身健康保險",             proposer:"何宗翰",  age:68, status:"reviewing", risk:"high", score:88, sla:0, stage:"in_review",  reviewer:REVIEWERS[2]},
    {recordingNo:"A0014", caseNo:"A0014-1", sessionNo:1, date:"2026/05/21", agent:"蔡明宏", agentId:"A0247", branch:"台中西屯通訊處", region:"中區",   product:"新美滿人生終身保險",                proposer:"呂淑芬",  age:76, status:"reviewing", risk:"mid",  score:62, sla:2, stage:"waiting",    reviewer:REVIEWERS[3]},
    {recordingNo:"A0015", caseNo:"A0015-1", sessionNo:1, date:"2026/05/20", agent:"莊雅雯", agentId:"A0805", branch:"台中北屯通訊處", region:"中區",   product:"新住院好幫手健康保險附約",         proposer:"林文德",  age:71, status:"approved",  risk:"low",  score:15, sla:9, stage:"verified",   reviewer:REVIEWERS[3]},
    {recordingNo:"A0016", caseNo:"A0016-1", sessionNo:1, date:"2026/05/20", agent:"潘宇翔", agentId:"A0913", branch:"台南東區通訊處", region:"南區",   product:"論重病讓你安心重大傷病終身險",     proposer:"洪美鳳",  age:69, status:"returned",  risk:"high", score:76, sla:1, stage:"returned",   reviewer:REVIEWERS[4]},
    {recordingNo:"A0017", caseNo:"A0017-1", sessionNo:1, date:"2026/05/20", agent:"鄧家瑋", agentId:"A1024", branch:"高雄左營通訊處", region:"南區",   product:"高齡躍雨康復醫療健康保險附約",     proposer:"古天賜",  age:74, status:"reviewing", risk:"mid",  score:48, sla:4, stage:"waiting",    reviewer:null},
    {recordingNo:"A0018", caseNo:"A0018-1", sessionNo:1, date:"2026/05/19", agent:"林佩君", agentId:"A0427", branch:"台北中山通訊處", region:"北一區", product:"新康健終身醫療健康保險",           proposer:"曾文聰",  age:70, status:"approved",  risk:"low",  score:9,  sla:12,stage:"verified",   reviewer:REVIEWERS[0]},
    {recordingNo:"A0019", caseNo:"A0019-1", sessionNo:1, date:"2026/05/19", agent:"林佩君", agentId:"A0427", branch:"台北中山通訊處", region:"北一區", product:"鑫美鑫多元利率變動型終身壽險",     proposer:"邱永福",  age:77, status:"reviewing", risk:"high", score:73, sla:-1,stage:"in_review",    reviewer:REVIEWERS[1]},
  ];

  EXTRA.forEach(x => {
    const gd = x.recordingNo.slice(1);
    cases.push({
      recordingNo: x.recordingNo,
      caseNo:      x.caseNo,
      sessionNo:   x.sessionNo || 1,
      createdAt:   x.date + " 10:24",
      updatedAt:   x.date + " 16:48",
      policyNo:    x.status==="approved" ? "P-2026-"+gd : null,
      product:     x.product,
      roles: {
        proposer: { name:x.proposer, age:x.age, idNo:"X"+gd+"01" },
        insured:  { name:x.proposer, age:x.age, idNo:"X"+gd+"01" },
        payer:    { name:x.proposer, age:x.age, idNo:"X"+gd+"01" },
      },
      proposer: x.proposer, insured: x.proposer, insuredAge: x.age,
      agent: x.agent, agentId: x.agentId, branch: x.branch, region: x.region,
      channel: "iPad（行銷系統）", duration: 480 + Math.floor(Math.random()*180),
      status: x.status, source:"建議書系統", note:"", progress:{ total:14, recorded:14, skipped:0 },
      reviewer: x.reviewer, sla: x.sla, riskLevel: x.risk, riskScore: x.score,
      sttFlags: { diff: Math.round(x.score/8), negation: x.risk==="high"?2:(x.risk==="mid"?1:0), lowConf: Math.round(x.score/14) },
      reviewStage: x.stage,
    });
  });

  // 風險顯示中文 & 顏色
  window.__MLI_RISK = {
    high: { label:"高",   color:"rgb(196,55,55)",  bg:"rgb(255,236,236)", dot:"rgb(234,82,82)"  },
    mid:  { label:"中",   color:"rgb(178,104,12)", bg:"rgb(255,245,222)", dot:"rgb(241,160,40)" },
    low:  { label:"低",   color:"rgb(58,124,49)",  bg:"rgb(231,247,229)", dot:"rgb(72,153,61)"  },
  };

  // 審核子階段（後台特有）顏色
  window.__MLI_REVIEW_STAGE = {
    unassigned: { label:"未指派",  color:"rgb(98,100,118)", bg:"rgba(140,142,157,.14)" },
    waiting:    { label:"待審核",  color:"rgb(74,78,103)",  bg:"rgb(238,240,250)"     },
    in_review:  { label:"審核中",  color:"rgb(73,99,250)",  bg:"rgb(238,242,255)"     },
    returned:   { label:"已退回",  color:"rgb(196,55,55)",  bg:"rgb(255,236,236)"     },
    verified:   { label:"已通過",  color:"rgb(58,124,49)",  bg:"rgb(231,247,229)"     },
    resubmit:   { label:"補件審核",  color:"rgb(15,128,126)", bg:"rgb(224,246,245)"     },
  };

  // 五種說話人角色（後台核心 — F-204）
  window.__MLI_SPEAKERS = {
    robot:    { label:"機器人",   abbr:"機", emoji:"🤖", color:"rgb(123,109,235)", bg:"rgba(123,109,235,.12)", borderColor:"rgba(123,109,235,.25)" },
    agent:    { label:"業務員",   abbr:"業", emoji:"👤", color:"rgb(73,99,250)",   bg:"rgba(73,99,250,.12)",   borderColor:"rgba(73,99,250,.25)"   },
    proposer: { label:"要保人",   abbr:"要", emoji:"🧑", color:"rgb(58,124,49)",   bg:"rgba(72,153,61,.12)",   borderColor:"rgba(72,153,61,.25)"   },
    insured:  { label:"被保險人", abbr:"被", emoji:"👴", color:"rgb(178,104,12)",  bg:"rgba(241,160,40,.16)",  borderColor:"rgba(241,160,40,.30)"  },
    payer:    { label:"繳款人",   abbr:"繳", emoji:"💳", color:"rgb(15,142,140)",  bg:"rgba(20,166,164,.14)",  borderColor:"rgba(20,166,164,.28)"  },
    unknown:  { label:"未辨識",   abbr:"?",  emoji:"❓", color:"rgb(140,142,157)", bg:"rgba(140,142,157,.14)", borderColor:"rgba(140,142,157,.30)" },
  };

  // 後台所屬地區/通訊處選項（用於篩選）
  window.__MLI_BRANCHES = [
    {region:"北一區", branches:["台北中山通訊處","台北信義通訊處","新北板橋通訊處"]},
    {region:"北二區", branches:["桃園中壢通訊處","新竹竹科通訊處"]},
    {region:"中區",   branches:["台中西屯通訊處","台中北屯通訊處"]},
    {region:"南區",   branches:["台南東區通訊處","高雄左營通訊處"]},
  ];

  // 後台登入身分（demo）
  window.__MLI_REVIEWER_SELF = {
    name:"王怡萱", id:"E102934", title:"一般審核員",
    region:"北一區", branches:["台北中山通訊處","台北信義通訊處","新北板橋通訊處"],
    avatar:"王",
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// 詳情頁逐題 STT 比對範例資料
// 對應 cases[2] = A0004-1（退回補正、Q07/Q10 有問題）
// 結構：detail[caseNo] = { questions: [{ no, title, type, originalScript, segments }] }
//
// segment.diffTokens：{ t, type } where type ∈ {same|del|add|low|negation}
//   same    — 原稿與 ASR 相同
//   del     — 原稿有但 ASR 沒有（漏念）
//   add     — ASR 有但原稿沒有（多念）
//   low     — ASR 信心度過低
//   negation — 偵測到否定語意
// ─────────────────────────────────────────────────────────────────────────────
window.__MLI_REVIEW_DETAIL = {};

(function buildDetail(){
  // 為簡潔，先做退回補正案件的詳細資料
  const D = window.__MLI_REVIEW_DETAIL;

  // 通用：把原稿切成單一 segment
  function plain(text, speaker, sec, dur, confidence) {
    return { speaker, startSec: sec, endSec: sec+dur, confidence,
      tokensOriginal:[{t:text, type:"same"}],
      tokensAsr:[{t:text, type:"same"}],
      original: text, asr: text, flags: [] };
  }

  // A0004-1 — 重點異常題目
  D["A0004-1"] = {
    caseNo: "A0004-1",
    totalDuration: 612,
    audioFile: "A0004-1_merged.wav",
    summary: {
      diff: 12, negation: 3, lowConf: 8,
      coverage: 0.94,
      riskLevel: "high", riskScore: 84,
      note: "Q07 健康告知音檔不清晰，Q10 自動墊繳客戶回應未明確",
    },
    questions: [
      // Q01 - 業務員身分確認（正常）
      { no:1, title:"業務員身分確認", type:"self",
        originalScript:"本人為國泰人壽保險業務員林佩君，登錄字號A0042713，今日為您說明新康健終身醫療健康保險之契約內容。本通話將全程錄音存證。",
        startSec:0, endSec:38, status:"ok",
        segments:[
          { speaker:"agent", startSec:0, endSec:14, confidence:0.96,
            original:"本人為國泰人壽保險業務員林佩君，登錄字號A0042713，",
            asr:     "本人為國泰人壽保險業務員林佩君，登錄字號A0042713，",
            tokensOriginal:[{t:"本人為國泰人壽保險業務員林佩君，登錄字號",type:"same"},{t:"A0042713",type:"same"},{t:"，",type:"same"}],
            tokensAsr:     [{t:"本人為國泰人壽保險業務員林佩君，登錄字號",type:"same"},{t:"A0042713",type:"same"},{t:"，",type:"same"}],
            flags:[] },
          { speaker:"agent", startSec:14, endSec:38, confidence:0.92,
            original:"今日為您說明新康健終身醫療健康保險之契約內容。本通話將全程錄音存證。",
            asr:     "今日為您說明新康健終身醫療健康保險之契約內容，本通話將全程錄音存證。",
            tokensOriginal:[{t:"今日為您說明",type:"same"},{t:"新康健終身醫療健康保險",type:"same"},{t:"之契約內容",type:"same"},{t:"。",type:"del"},{t:"本通話將全程錄音存證。",type:"same"}],
            tokensAsr:     [{t:"今日為您說明",type:"same"},{t:"新康健終身醫療健康保險",type:"same"},{t:"之契約內容",type:"same"},{t:"，",type:"add"},{t:"本通話將全程錄音存證。",type:"same"}],
            flags:[] },
        ],
      },
      // Q02 - 投保意願確認（正常）
      { no:2, title:"投保人意願確認", type:"tts",
        originalScript:"請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。",
        startSec:38, endSec:78, status:"ok",
        segments:[
          { speaker:"robot", startSec:38, endSec:62, confidence:1.0,
            original:"請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。",
            asr:     "請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。",
            tokensOriginal:[{t:"請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。",type:"same"}],
            tokensAsr:     [{t:"請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。",type:"same"}],
            flags:[] },
          { speaker:"insured", startSec:62, endSec:70, confidence:0.91,
            original:"（要保人/被保險人回應）",
            asr:     "好的我同意。",
            tokensOriginal:[{t:"（要保人/被保險人回應）",type:"same"}],
            tokensAsr:     [{t:"好的我同意。",type:"same"}],
            flags:[] },
        ],
      },
      // Q03 - 商品名稱與型態確認（正常）
      { no:3, title:"商品名稱與型態確認", type:"tts",
        originalScript:"本商品為「新康健終身醫療健康保險」，為終身型醫療險主約，保障期間至被保險人年滿一百歲之保單週年日止。",
        startSec:78, endSec:118, status:"ok",
        segments:[
          { speaker:"robot", startSec:78, endSec:108, confidence:1.0,
            original:"本商品為「新康健終身醫療健康保險」，為終身型醫療險主約，保障期間至被保險人年滿一百歲之保單週年日止。",
            asr:     "本商品為「新康健終身醫療健康保險」，為終身型醫療險主約,保障期間至被保險人年滿一百歲之保單週年日止。",
            tokensOriginal:[{t:"本商品為「新康健終身醫療健康保險」，為終身型醫療險主約，保障期間至被保險人年滿一百歲之保單週年日止。",type:"same"}],
            tokensAsr:[{t:"本商品為「新康健終身醫療健康保險」，為終身型醫療險主約，保障期間至被保險人年滿一百歲之保單週年日止。",type:"same"}],
            flags:[] },
          { speaker:"insured", startSec:108, endSec:118, confidence:0.93,
            original:"（被保險人回應）",
            asr:     "好,我了解。",
            tokensOriginal:[{t:"（被保險人回應）",type:"same"}],
            tokensAsr:[{t:"好,我了解。",type:"same"}],
            flags:[] },
        ],
      },
      // Q04 - 保險金額與年繳保費確認（正常）
      { no:4, title:"保險金額與年繳保費確認", type:"self",
        originalScript:"本契約之保險金額為新台幣參佰萬元整,年繳保費為新台幣肆萬捌仟陸佰元整,並請要保人確認金額無誤。",
        startSec:118, endSec:158, status:"ok",
        segments:[
          { speaker:"agent", startSec:118, endSec:144, confidence:0.95,
            original:"本契約之保險金額為新台幣參佰萬元整,年繳保費為新台幣肆萬捌仟陸佰元整,請您確認金額是否正確。",
            asr:     "本契約之保險金額為新台幣參佰萬元整,年繳保費為新台幣肆萬捌仟陸佰元整,請您確認金額是否正確。",
            tokensOriginal:[{t:"本契約之保險金額為新台幣參佰萬元整,年繳保費為新台幣肆萬捌仟陸佰元整,請您確認金額是否正確。",type:"same"}],
            tokensAsr:[{t:"本契約之保險金額為新台幣參佰萬元整,年繳保費為新台幣肆萬捌仟陸佰元整,請您確認金額是否正確。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:144, endSec:158, confidence:0.91,
            original:"（要保人回應）",
            asr:     "金額正確,沒問題。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"金額正確,沒問題。",type:"same"}],
            flags:[] },
        ],
      },
      // Q05 - 繳費年期與繳別確認（正常）
      { no:5, title:"繳費年期與繳別確認", type:"tts",
        originalScript:"本契約繳費年期為二十年期,繳別為年繳,並由要保人於每年保單週年日繳交保費。",
        startSec:158, endSec:198, status:"ok",
        segments:[
          { speaker:"robot", startSec:158, endSec:184, confidence:1.0,
            original:"本契約繳費年期為二十年期,繳別為年繳,並由要保人於每年保單週年日繳交保費。",
            asr:     "本契約繳費年期為二十年期,繳別為年繳,並由要保人於每年保單週年日繳交保費。",
            tokensOriginal:[{t:"本契約繳費年期為二十年期,繳別為年繳,並由要保人於每年保單週年日繳交保費。",type:"same"}],
            tokensAsr:[{t:"本契約繳費年期為二十年期,繳別為年繳,並由要保人於每年保單週年日繳交保費。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:184, endSec:198, confidence:0.92,
            original:"（要保人回應）",
            asr:     "二十年年繳,我知道了。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"二十年年繳,我知道了。",type:"same"}],
            flags:[] },
        ],
      },
      // Q06 - 主要保障項目說明（正常）
      { no:6, title:"主要保障項目說明", type:"self",
        originalScript:"本商品主要保障包含住院日額給付、手術費用給付、加護病房暨燒燙傷病房保險金、出院療養保險金等項目,詳細條款請參閱保單條款。",
        startSec:198, endSec:240, status:"ok",
        segments:[
          { speaker:"agent", startSec:198, endSec:230, confidence:0.93,
            original:"本商品主要保障包含住院日額給付、手術費用給付、加護病房暨燒燙傷病房保險金、出院療養保險金等項目,詳細條款請參閱保單條款。",
            asr:     "本商品主要保障包含住院日額給付、手術費用給付、加護病房暨燒燙傷病房保險金、出院療養保險金等項目,詳細條款請參閱保單條款。",
            tokensOriginal:[{t:"本商品主要保障包含住院日額給付、手術費用給付、加護病房暨燒燙傷病房保險金、出院療養保險金等項目,詳細條款請參閱保單條款。",type:"same"}],
            tokensAsr:[{t:"本商品主要保障包含住院日額給付、手術費用給付、加護病房暨燒燙傷病房保險金、出院療養保險金等項目,詳細條款請參閱保單條款。",type:"same"}],
            flags:[] },
          { speaker:"insured", startSec:230, endSec:240, confidence:0.89,
            original:"（被保險人回應）",
            asr:     "了解。",
            tokensOriginal:[{t:"（被保險人回應）",type:"same"}],
            tokensAsr:[{t:"了解。",type:"same"}],
            flags:[] },
        ],
      },
      // Q07 - 健康告知（重大異常 - 多差異 + 否定 + 低信心）
      { no:7, title:"既往症告知事項", type:"self",
        originalScript:"請依被保險人實際情況，逐項詢問並複誦要保書第十一頁之健康告知事項，被保人需明確回應「有」或「沒有」。",
        startSec:240, endSec:340, status:"high",
        segments:[
          { speaker:"agent", startSec:240, endSec:268, confidence:0.88,
            original:"接下來我會逐項詢問健康告知事項，請您聽完每一項後明確回答「有」或「沒有」。",
            asr:     "接下來我會逐項詢問健康告知事項，請您聽完每一項後回答「有」或「沒有」。",
            tokensOriginal:[
              {t:"接下來我會逐項詢問健康告知事項，請您聽完每一項後",type:"same"},
              {t:"明確",type:"del"},
              {t:"回答「有」或「沒有」。",type:"same"},
            ],
            tokensAsr:[
              {t:"接下來我會逐項詢問健康告知事項，請您聽完每一項後",type:"same"},
              {t:"回答「有」或「沒有」。",type:"same"},
            ],
            flags:["diff"] },
          { speaker:"agent", startSec:268, endSec:286, confidence:0.74,
            original:"第一項，最近兩個月內，是否曾因接受醫師治療、診療或用藥？",
            asr:     "第一項，最近兩個月內，是否曾接受醫師治療、診療或用藥？",
            tokensOriginal:[
              {t:"第一項，最近兩個月內，是否曾",type:"same"},
              {t:"因",type:"del"},
              {t:"接受醫師治療、診療或用藥？",type:"same"},
            ],
            tokensAsr:[
              {t:"第一項，最近兩個月內，是否曾",type:"same"},
              {t:"接受醫師治療、診療或用藥？",type:"low"},
            ],
            flags:["diff","low"] },
          { speaker:"insured", startSec:286, endSec:294, confidence:0.42,
            original:"（被保險人回應）",
            asr:     "嗯…應該…沒有吧。",
            tokensOriginal:[{t:"（被保險人回應）",type:"same"}],
            tokensAsr:[
              {t:"嗯…",type:"low"},
              {t:"應該",type:"low"},
              {t:"…沒有吧",type:"negation"},
              {t:"。",type:"low"},
            ],
            flags:["negation","low"] },
          { speaker:"agent", startSec:294, endSec:316, confidence:0.69,
            original:"第二項，過去五年內是否曾因受傷或生病接受手術、住院七日以上或健康檢查發現異常？",
            asr:     "第二項，過去五年是否曾受傷或生病接受手術、住院七天以上或檢查發現異常？",
            tokensOriginal:[
              {t:"第二項，過去五年",type:"same"},
              {t:"內",type:"del"},
              {t:"是否曾",type:"same"},
              {t:"因",type:"del"},
              {t:"受傷或生病接受手術、住院",type:"same"},
              {t:"七日",type:"del"},
              {t:"以上或",type:"same"},
              {t:"健康",type:"del"},
              {t:"檢查發現異常？",type:"same"},
            ],
            tokensAsr:[
              {t:"第二項，過去五年",type:"same"},
              {t:"是否曾",type:"same"},
              {t:"受傷或生病接受手術、住院",type:"same"},
              {t:"七天",type:"add"},
              {t:"以上或",type:"same"},
              {t:"檢查發現異常？",type:"low"},
            ],
            flags:["diff","low"] },
          { speaker:"insured", startSec:316, endSec:324, confidence:0.51,
            original:"（被保險人回應）",
            asr:     "我不太確定欸…",
            tokensOriginal:[{t:"（被保險人回應）",type:"same"}],
            tokensAsr:[
              {t:"我",type:"low"},
              {t:"不太確定",type:"negation"},
              {t:"欸…",type:"low"},
            ],
            flags:["negation","low"] },
          { speaker:"agent", startSec:324, endSec:340, confidence:0.81,
            original:"第三項，目前是否懷孕中？（女性被保險人適用）",
            asr:     "第三項目前是否懷孕中？女性被保險人適用",
            tokensOriginal:[
              {t:"第三項，",type:"del"},
              {t:"目前是否懷孕中？",type:"same"},
              {t:"（女性被保險人適用）",type:"del"},
            ],
            tokensAsr:[
              {t:"第三項",type:"same"},
              {t:"目前是否懷孕中？",type:"same"},
              {t:"女性被保險人適用",type:"same"},
            ],
            flags:["diff"] },
        ],
      },
      // Q08 - 契約撤銷權利（正常）
      { no:8, title:"契約撤銷權利", type:"tts",
        originalScript:"您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。",
        startSec:340, endSec:380, status:"ok",
        segments:[
          { speaker:"robot", startSec:340, endSec:374, confidence:1.0,
            original:"您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。",
            asr:     "您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。",
            tokensOriginal:[{t:"您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。",type:"same"}],
            tokensAsr:[{t:"您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。",type:"same"}],
            flags:[] },
        ],
      },
      // Q09 - 除外責任與不保事項說明（正常）
      { no:9, title:"除外責任與不保事項說明", type:"tts",
        originalScript:"被保險人因下列事由致其住院診療者，本公司不負給付保險金之責任：一、要保人故意之行為。二、被保險人之犯罪行為。三、被保險人服用麻醉藥品。",
        startSec:380, endSec:420, status:"ok",
        segments:[
          { speaker:"robot", startSec:380, endSec:410, confidence:1.0,
            original:"被保險人因下列事由致其住院診療者，本公司不負給付保險金之責任：一、要保人故意之行為。二、被保險人之犯罪行為。三、被保險人服用麻醉藥品。",
            asr:     "被保險人因下列事由致其住院診療者，本公司不負給付保險金之責任：一、要保人故意之行為。二、被保險人之犯罪行為。三、被保險人服用麻醉藥品。",
            tokensOriginal:[{t:"被保險人因下列事由致其住院診療者，本公司不負給付保險金之責任：一、要保人故意之行為。二、被保險人之犯罪行為。三、被保險人服用麻醉藥品。",type:"same"}],
            tokensAsr:[{t:"被保險人因下列事由致其住院診療者，本公司不負給付保險金之責任：一、要保人故意之行為。二、被保險人之犯罪行為。三、被保險人服用麻醉藥品。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:410, endSec:420, confidence:0.90,
            original:"（要保人回應）",
            asr:     "我了解。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"我了解。",type:"same"}],
            flags:[] },
        ],
      },
      // Q10 - 自動墊繳（中度異常 - 否定 + 模糊回應）
      { no:10, title:"保費自動墊繳選項", type:"self",
        originalScript:"請詢問要保人是否選擇保費自動墊繳，並請其明確回應「同意」或「不同意」。",
        startSec:420, endSec:478, status:"high",
        segments:[
          { speaker:"agent", startSec:420, endSec:448, confidence:0.93,
            original:"陳先生，這邊有一個保費自動墊繳的選項，意思是如果有遇到您忘記繳款，公司會用您的保單價值去幫您先把保費繳掉，讓保單繼續有效。請問您是否同意自動墊繳？",
            asr:     "陳先生這邊有一個保費自動墊繳的選項，意思是如果有遇到您忘記繳款，公司會用您的保單價值去幫您先把保費繳掉，讓保單繼續有效。請問您是否同意自動墊繳？",
            tokensOriginal:[
              {t:"陳先生",type:"same"},
              {t:"，",type:"del"},
              {t:"這邊有一個保費自動墊繳的選項，意思是如果有遇到您忘記繳款，公司會用您的保單價值去幫您先把保費繳掉，讓保單繼續有效。請問您是否同意自動墊繳？",type:"same"},
            ],
            tokensAsr:[
              {t:"陳先生這邊有一個保費自動墊繳的選項，意思是如果有遇到您忘記繳款，公司會用您的保單價值去幫您先把保費繳掉，讓保單繼續有效。請問您是否同意自動墊繳？",type:"same"},
            ],
            flags:[] },
          { speaker:"insured", startSec:448, endSec:462, confidence:0.38,
            original:"（要保人明確回應「同意」或「不同意」）",
            asr:     "嗯…這個…那就…應該可以吧。",
            tokensOriginal:[{t:"（要保人明確回應「同意」或「不同意」）",type:"same"}],
            tokensAsr:[
              {t:"嗯…",type:"low"},
              {t:"這個…",type:"low"},
              {t:"那就…",type:"low"},
              {t:"應該",type:"negation"},
              {t:"可以吧",type:"low"},
              {t:"。",type:"low"},
            ],
            flags:["negation","low"] },
          { speaker:"agent", startSec:462, endSec:478, confidence:0.86,
            original:"所以是同意囉？",
            asr:     "所以是同意了喔？",
            tokensOriginal:[
              {t:"所以是同意",type:"same"},
              {t:"囉",type:"del"},
              {t:"？",type:"same"},
            ],
            tokensAsr:[
              {t:"所以是同意",type:"same"},
              {t:"了喔",type:"add"},
              {t:"？",type:"same"},
            ],
            flags:["diff"] },
        ],
      },
      // Q11 - 受益人指定確認（正常）
      { no:11, title:"受益人指定確認", type:"self",
        originalScript:"請要保人確認本保單身故保險金受益人之姓名、與被保險人關係及受益順位、受益比例。",
        startSec:478, endSec:510, status:"ok",
        segments:[
          { speaker:"agent", startSec:478, endSec:498, confidence:0.94,
            original:"本保單身故保險金受益人為陳志中先生，與被保險人關係為配偶，受益比例為百分之一百。請要保人確認。",
            asr:     "本保單身故保險金受益人為陳志中先生，與被保險人關係為配偶，受益比例為百分之一百。請要保人確認。",
            tokensOriginal:[{t:"本保單身故保險金受益人為陳志中先生，與被保險人關係為配偶，受益比例為百分之一百。請要保人確認。",type:"same"}],
            tokensAsr:[{t:"本保單身故保險金受益人為陳志中先生，與被保險人關係為配偶，受益比例為百分之一百。請要保人確認。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:498, endSec:510, confidence:0.92,
            original:"（要保人回應）",
            asr:     "確認正確。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"確認正確。",type:"same"}],
            flags:[] },
        ],
      },
      // Q12 - 招揽人與要保人關係確認（正常）
      { no:12, title:"招揽人與要保人關係確認", type:"tts",
        originalScript:"請確認本案件招揽人與要保人、被保險人之關係，並確認未受任何人代為填寫要保書。",
        startSec:510, endSec:540, status:"ok",
        segments:[
          { speaker:"robot", startSec:510, endSec:528, confidence:1.0,
            original:"請確認本案件招揽人與要保人、被保險人之關係，並確認未受任何人代為填寫要保書。",
            asr:     "請確認本案件招揽人與要保人、被保險人之關係，並確認未受任何人代為填寫要保書。",
            tokensOriginal:[{t:"請確認本案件招揽人與要保人、被保險人之關係，並確認未受任何人代為填寫要保書。",type:"same"}],
            tokensAsr:[{t:"請確認本案件招揽人與要保人、被保險人之關係，並確認未受任何人代為填寫要保書。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:528, endSec:540, confidence:0.91,
            original:"（要保人回應）",
            asr:     "是的，都是本人填寫的。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"是的，都是本人填寫的。",type:"same"}],
            flags:[] },
        ],
      },
      // Q13 - 客戶聯絡資訊與保單寄送方式（正常）
      { no:13, title:"客戶聯絡資訊與保單寄送方式", type:"self",
        originalScript:"請確認要保人之聯絡電話、通訊地址，並確認保單寄送方式為郵寄或電子保單。",
        startSec:540, endSec:570, status:"ok",
        segments:[
          { speaker:"agent", startSec:540, endSec:560, confidence:0.93,
            original:"請確認要保人聯絡電話 0912-345-678，通訊地址為註冊住址，保單以電子保單方式寄送。",
            asr:     "請確認要保人聯絡電話 0912-345-678，通訊地址為註冊住址，保單以電子保單方式寄送。",
            tokensOriginal:[{t:"請確認要保人聯絡電話 0912-345-678，通訊地址為註冊住址，保單以電子保單方式寄送。",type:"same"}],
            tokensAsr:[{t:"請確認要保人聯絡電話 0912-345-678，通訊地址為註冊住址，保單以電子保單方式寄送。",type:"same"}],
            flags:[] },
          { speaker:"proposer", startSec:560, endSec:570, confidence:0.92,
            original:"（要保人回應）",
            asr:     "資訊正確。",
            tokensOriginal:[{t:"（要保人回應）",type:"same"}],
            tokensAsr:[{t:"資訊正確。",type:"same"}],
            flags:[] },
        ],
      },
      // Q14 - 完成投保確認（正常）
      { no:14, title:"完成投保確認", type:"self",
        originalScript:"本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。",
        startSec:570, endSec:612, status:"ok",
        segments:[
          { speaker:"agent", startSec:570, endSec:612, confidence:0.94,
            original:"本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。",
            asr:     "本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。",
            tokensOriginal:[{t:"本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。",type:"same"}],
            tokensAsr:[{t:"本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。",type:"same"}],
            flags:[] },
        ],
      },
    ],
  };

  // 為其他 reviewing 案件補一個 default（內容會被縮減顯示）— 用 Q1, Q2 的較單純資料
  window.__MLI_CASES.forEach(c => {
    if (D[c.caseNo]) return;
    if (c.status === "draft") return;
    D[c.caseNo] = {
      caseNo: c.caseNo,
      totalDuration: c.duration || 540,
      audioFile: c.caseNo + "_merged.wav",
      summary: {
        diff: c.sttFlags?.diff ?? 2,
        negation: c.sttFlags?.negation ?? 0,
        lowConf: c.sttFlags?.lowConf ?? 1,
        coverage: 0.95 + Math.random()*0.04,
        riskLevel: c.riskLevel || "low",
        riskScore: c.riskScore || 20,
        note: "",
      },
      // 依風險等級挑代表題，讓「風險 ↔ AI 通過率 ↔ 詳情比對」一致：
      //   高風險＝含 Q07+Q10 異常（2/4 通過）；中風險＝含 Q10 異常（3/4）；低風險＝全通過（4/4）
      questions: (() => {
        const Q = D["A0004-1"].questions;
        const lvl = c.riskLevel || "low";
        const idx = lvl === "high" ? [0, 6, 9, 13]
                  : lvl === "mid"  ? [0, 1, 9, 13]
                  :                  [0, 1, 7, 13];
        return idx.map(i => Q[i]);
      })(),
    };
  });
})();
