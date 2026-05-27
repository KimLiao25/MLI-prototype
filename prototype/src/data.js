// 案件範例資料 + 題目腳本
//
// 編碼邏輯：
//   錄音編號 = A + YYYYMMDD + XXXX(4 碼流水號)，例：A202605210001
//
// 審核狀態（v2 — 對齊 v1 待確認 #4 結論，5 種）：
//   draft        草稿     — 業務員建立但尚未送出審核
//   reviewing    審核中   — 已送出，等待後台審核
//   returned     退回補正 — 後台點選退回，需補錄 / 重錄 / 補上傳
//   approved     審核通過 — 後台點選通過
//   overdue      逾期     — 超過時間未審核的案件
//
// 錄音對象（3 種角色）：
//   proposer   要保人
//   insured    被保險人
//   payer      繳款人
//   * 達到高齡條件（≥ 65 歲）才需錄音
//   * 三角色可能皆為同一人，也可能皆不同人；UI 顯示時去重合併
//
// 保單號：僅當「審核通過」且「核保成功」時才會由後端核發，其它狀態為 null。

window.__MLI_STATUS = {
  draft:     { label: "草稿",     dot: "rgb(140,142,157)", bg: "rgba(140,142,157,.12)", color: "rgb(98,100,118)" },
  reviewing: { label: "審核中",   dot: "rgb(241,160,40)",  bg: "rgb(255,245,222)",      color: "rgb(178,104,12)" },
  returned:  { label: "退回補正", dot: "rgb(234,82,82)",   bg: "rgb(255,236,236)",      color: "rgb(196,55,55)" },
  approved:  { label: "審核通過", dot: "rgb(72,153,61)",   bg: "rgb(231,247,229)",      color: "rgb(58,124,49)" },
  overdue:   { label: "逾期",     dot: "rgb(91,82,77)",    bg: "rgb(236,232,228)",      color: "rgb(86,68,58)" },
};

// 高齡錄音門檻
window.__MLI_AGE_THRESHOLD = 65;

// Helper：把 3 角色去重合併，回傳 [{ roles:[縮寫], name, age, needsRecording }]
window.__MLI_uniqueSubjects = function (caseInfo) {
  const order = [
    ["proposer", "要", "要保人"],
    ["insured",  "被", "被保險人"],
    ["payer",    "繳", "繳款人"],
  ];
  const map = new Map();
  order.forEach(([k, abbr, full]) => {
    const r = caseInfo.roles && caseInfo.roles[k];
    if (!r) return;
    const key = `${r.name}__${r.age}`;
    if (map.has(key)) {
      const item = map.get(key);
      item.roles.push(abbr);
      item.rolesFull.push(full);
    } else {
      map.set(key, {
        roles: [abbr], rolesFull: [full],
        name: r.name, age: r.age, idNo: r.idNo,
        needsRecording: r.age >= window.__MLI_AGE_THRESHOLD,
      });
    }
  });
  return [...map.values()];
};

// 共用：標準錄音題目腳本
const QUESTIONS = [
  { no: 1,  type: "self", tag: "業務員自錄", title: "業務員身分確認",
    script: "本人為國泰人壽保險業務員林佩君，登錄字號 A-0042713，今日為您說明「新康健終身醫療健康保險」之契約內容。本通話將全程錄音存證。", skippable: false },
  { no: 2,  type: "tts",  tag: "自動播稿",   title: "投保人意願確認",
    script: "請問您是否確認自願投保本商品？本商品為終身型醫療險，主約保障期間至被保險人年滿一百歲之保單週年日止。", skippable: false },
  { no: 3,  type: "tts",  tag: "自動播稿",   title: "保險費繳費期間說明",
    script: "本商品繳費年期為二十年期，保費將自您指定之金融帳戶按年扣款。請確認是否瞭解並同意上述繳費方式。", skippable: false },
  { no: 4,  type: "self", tag: "業務員自錄", title: "受益人指定說明",
    script: "請說明您所指定的身故受益人姓名、與被保險人之關係、以及受益順位與比例。", skippable: false },
  { no: 5,  type: "tts",  tag: "自動播稿",   title: "保障內容摘要",
    script: "本商品提供住院日額、加護病房日額、手術費用、出院療養金等六項基本保障，詳細給付項目及金額請參閱保單條款第五條。", skippable: false },
  { no: 6,  type: "tts",  tag: "自動播稿",   title: "等待期說明",
    script: "本商品疾病等待期為三十日，意外事故無等待期。請確認您已瞭解此項條件。", skippable: false },
  { no: 7,  type: "self", tag: "業務員自錄", title: "既往症告知事項",
    script: "請依被保險人實際情況，逐項詢問並複誦要保書第十一頁之健康告知事項，被保人需明確回應「有」或「沒有」。", skippable: false },
  { no: 8,  type: "tts",  tag: "自動播稿",   title: "契約撤銷權利",
    script: "您於收到保單翌日起算十日內，得以書面檢同保險單向本公司撤銷契約，本公司將於受理後無息退還已繳保費。", skippable: false },
  { no: 9,  type: "tts",  tag: "自動播稿",   title: "保單借款說明",
    script: "本契約有保單價值準備金後，您可申請保單借款，借款金額及利率依本公司公告為準。", skippable: true },
  { no: 10, type: "self", tag: "業務員自錄", title: "保費自動墊繳選項",
    script: "請詢問要保人是否選擇保費自動墊繳，並請其明確回應「同意」或「不同意」。", skippable: false },
  { no: 11, type: "tts",  tag: "自動播稿",   title: "個人資料蒐集同意",
    script: "本公司將依個人資料保護法蒐集、處理及利用您所提供之個人資料，使用範圍以保險業務相關用途為限。", skippable: false },
  { no: 12, type: "self", tag: "業務員自錄", title: "親屬通報指定",
    script: "請詢問要保人是否願意提供緊急聯絡人資料，若願意請告知姓名、關係及聯絡電話。", skippable: true },
  { no: 13, type: "tts",  tag: "自動播稿",   title: "適合度評估結果",
    script: "依您於需求分析表所填寫之資料，本商品之保險金額、繳費期間與您之經濟負擔相符，符合您之保障需求。", skippable: false },
  { no: 14, type: "self", tag: "業務員自錄", title: "完成投保確認",
    script: "本人已就本商品之保障內容、除外責任及應注意事項向要保人完整說明，要保人並已充分理解，特此錄音存證。", skippable: false },
];

// 多筆案件清單
//
// 角色設計刻意涵蓋多種組合：
//   #1 三人皆同：要 = 被 = 繳（夫繳自己保險）— 草稿
//   #2 要保 = 繳款，被保不同：父為母投保自繳   — 審核中
//   #3 三人皆不同：子女繳款給父母                — 退回補正
//   #4 要保 = 繳款，被保人未達高齡（不需錄音）  — 審核通過（已核發保單）
//   #5 三人皆同（單一被保人案件）                — 逾期
//   #6 要保 = 被保，繳款人為配偶                  — 草稿
//   #7 要保 = 被保 = 繳款                          — 審核中
//   #8 三人皆不同                                    — 退回補正
window.__MLI_CASES = [
  {
    recordingNo: "A202605210001",
    createdAt:   "2026/05/21 14:08",
    updatedAt:   "2026/05/21 14:46",
    policyNo:    null,
    product:     "新康健終身醫療健康保險",
    roles: {
      proposer: { name: "王志明", age: 72, idNo: "A123456789" },
      insured:  { name: "王志明", age: 72, idNo: "A123456789" },
      payer:    { name: "王志明", age: 72, idNo: "A123456789" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 0,
    status:   "draft",
    source:   "建議書系統",
    note:     "",
    progress: { total: 14, recorded: 3, skipped: 0 },
  },
  {
    recordingNo: "A202605210002",
    createdAt:   "2026/05/21 11:23",
    updatedAt:   "2026/05/21 13:08",
    policyNo:    null,
    product:     "鑫美鑫多元利率變動型終身壽險",
    roles: {
      proposer: { name: "陳建宏", age: 68, idNo: "B112233445" },
      insured:  { name: "陳秀雲", age: 66, idNo: "B223344556" },
      payer:    { name: "陳建宏", age: 68, idNo: "B112233445" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 540,
    status:   "reviewing",
    source:   "建議書系統",
    note:     "",
    progress: { total: 14, recorded: 14, skipped: 0 },
  },
  {
    recordingNo: "A202605200003",
    createdAt:   "2026/05/20 16:42",
    updatedAt:   "2026/05/21 09:18",
    policyNo:    null,
    product:     "新住院好幫手健康保險附約",
    roles: {
      proposer: { name: "李俊賢", age: 48, idNo: "F134567890" },
      insured:  { name: "李美玲", age: 75, idNo: "F245678901" },
      payer:    { name: "李俊賢", age: 48, idNo: "F134567890" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 612,
    status:   "returned",
    source:   "建議書系統",
    note:     "Q07 健康告知音檔不清晰，請重新錄製；Q10 自動墊繳客戶回應未明確，需補錄。",
    progress: { total: 14, recorded: 14, skipped: 0 },
  },
  {
    recordingNo: "A202605190001",
    createdAt:   "2026/05/19 10:11",
    updatedAt:   "2026/05/19 15:33",
    policyNo:    "P-2026-0048120",     // 已通過 + 核保成功，後端已核發保單號
    product:     "新美滿人生終身保險",
    roles: {
      proposer: { name: "張雅婷", age: 69, idNo: "H201020203" },
      insured:  { name: "張雅婷", age: 69, idNo: "H201020203" },
      payer:    { name: "張雅婷", age: 69, idNo: "H201020203" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "Web（桌機瀏覽器）",
    duration: 495,
    status:   "approved",
    source:   "行動投保系統",
    note:     "",
    progress: { total: 14, recorded: 14, skipped: 0 },
  },
  {
    recordingNo: "A202605180001",
    createdAt:   "2026/05/18 14:55",
    updatedAt:   "2026/05/19 11:02",
    policyNo:    null,
    product:     "鑫美鑫多元利率變動型終身壽險",
    roles: {
      proposer: { name: "吳秀英", age: 78, idNo: "J215566778" },
      insured:  { name: "吳秀英", age: 78, idNo: "J215566778" },
      payer:    { name: "吳秀英", age: 78, idNo: "J215566778" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 582,
    status:   "overdue",
    source:   "建議書系統",
    note:     "送審後超過 7 個工作天未審核，列入逾期清單，請聯繫內勤確認。",
    progress: { total: 14, recorded: 13, skipped: 1 },
  },
  {
    recordingNo: "A202605210003",
    createdAt:   "2026/05/21 09:02",
    updatedAt:   "2026/05/21 09:02",
    policyNo:    null,
    product:     "新康健終身醫療健康保險",
    roles: {
      proposer: { name: "黃國治", age: 71, idNo: "K188776655" },
      insured:  { name: "黃國治", age: 71, idNo: "K188776655" },
      payer:    { name: "黃淑芬", age: 67, idNo: "K299887766" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "Web（桌機瀏覽器）",
    duration: 0,
    status:   "draft",
    source:   "行動投保系統",
    note:     "Web 通路案件，可由業務員自行上傳完整音檔。",
    progress: { total: 14, recorded: 0, skipped: 0 },
  },
  {
    recordingNo: "A202605170002",
    createdAt:   "2026/05/17 13:20",
    updatedAt:   "2026/05/18 10:44",
    policyNo:    null,
    product:     "新住院好幫手健康保險附約",
    roles: {
      proposer: { name: "周文豪", age: 74, idNo: "L156473829" },
      insured:  { name: "周文豪", age: 74, idNo: "L156473829" },
      payer:    { name: "周文豪", age: 74, idNo: "L156473829" },
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 540,
    status:   "reviewing",
    source:   "建議書系統",
    note:     "",
    progress: { total: 14, recorded: 14, skipped: 0 },
  },
  {
    recordingNo: "A202605150001",
    createdAt:   "2026/05/15 15:48",
    updatedAt:   "2026/05/16 14:21",
    policyNo:    null,
    product:     "新美滿人生終身保險",
    roles: {
      proposer: { name: "蘇麗華", age: 70, idNo: "M210987654" },
      insured:  { name: "蘇承翰", age: 72, idNo: "M198765432" },
      payer:    { name: "蘇文杰", age: 45, idNo: "M124680135" }, // 子女繳款，未達高齡
    },
    agent:    "林佩君",  agentId: "A0427",
    branch:   "台北中山通訊處",
    channel:  "iPad（行銷系統）",
    duration: 505,
    status:   "returned",
    source:   "建議書系統",
    note:     "Q04 受益人說明未明確錄入受益比例，請補錄。",
    progress: { total: 14, recorded: 14, skipped: 0 },
  },
];

// 向後相容：把 roles 攤平成舊欄位（proposer / insured / insuredAge）給其他畫面使用
window.__MLI_CASES.forEach(c => {
  c.proposer   = c.roles.proposer.name;
  c.insured    = c.roles.insured.name;
  c.insuredAge = c.roles.insured.age;
});

window.__MLI_QUESTIONS = QUESTIONS;

// 商品清單（mock）
window.__MLI_PRODUCTS = [
  { code: "H001", name: "新康健終身醫療健康保險",          category: "健康險" },
  { code: "H002", name: "新住院好幫手健康保險附約",        category: "健康險" },
  { code: "H003", name: "長長久久終身健康保險",            category: "健康險" },
  { code: "H004", name: "論重病讓你安心重大傷病終身險",    category: "健康險" },
  { code: "H005", name: "高齡躍雨康復醫療健康保險附約",    category: "健康險" },
  { code: "L001", name: "鑫美鑫多元利率變動型終身壽險",    category: "壽險"   },
  { code: "L002", name: "新美滿人生終身保險",              category: "壽險"   },
  { code: "L003", name: "安心伴你行利率變動型終身壽險",    category: "壽險"   },
  { code: "L004", name: "達人達意利率變動型增額終身壽險",  category: "壽險"   },
  { code: "A001", name: "安心雙保障傷害保險",              category: "傷害險" },
  { code: "A002", name: "閃電日額型傷害保險附約",          category: "傷害險" },
  { code: "I001", name: "鑫太陽利率變動型利息型年金保險",  category: "年金險" },
  { code: "I002", name: "長青樹利率變動型年金保險",        category: "年金險" },
  { code: "V001", name: "鑫越來越安心變額萬能壽險",        category: "投資型" },
  { code: "V002", name: "鑫豐收變額金變額萬能壽險",        category: "投資型" },
];

// 對應原本 prototype 的「目前操作中」案件預設
window.__MLI_DATA = {
  case: window.__MLI_CASES[0],
  tts: { voice: "f-tw", speed: 1.0 },
  questions: QUESTIONS,
};
