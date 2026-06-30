/**
 * build-admin.js — pre-compiles JSX → plain JS, assembles 內勤審核後台.html
 * Run: node build-admin.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

// ── paths ────────────────────────────────────────────────────────────────
const SRC  = path.join(__dirname, 'src');
const LIBS = path.join(__dirname, 'libs');
const OUT  = path.join(__dirname, '內勤審核後台.html');

// ── Load Babel standalone ─────────────────────────────────────────────────
console.log('Loading Babel…');
const Babel = require(path.join(LIBS, 'babel.min.js'));
console.log('Babel loaded, version:', Babel.version || '(unknown)');

// ── Source files in dependency order (admin backend) ─────────────────────
// Note: data.js must come first (admin-data.js extends window.__MLI_CASES from data.js)
const SOURCES = [
  { file: 'data.js',                jsx: false },
  { file: 'correction.js',          jsx: false },
  { file: 'admin-data.js',          jsx: false },
  { file: 'tweaks-panel.jsx',       jsx: true  },
  { file: 'icons.jsx',              jsx: true  },
  { file: 'Waveform.jsx',           jsx: true  },
  { file: 'AdminHeader.jsx',        jsx: true  },
  { file: 'ReviewListScreen.jsx',   jsx: true  },
  { file: 'ReviewDetailScreen.jsx', jsx: true  },
  { file: 'QualityReportScreen.jsx',jsx: true  },
  { file: 'AdminScreens.jsx',       jsx: true  },
  { file: 'admin-app.jsx',          jsx: true  },
];

// ── Compile each source file ──────────────────────────────────────────────
let compiledParts = [];
for (const { file, jsx } of SOURCES) {
  const fp   = path.join(SRC, file);
  const code = fs.readFileSync(fp, 'utf8');
  console.log(`  [${jsx ? 'JSX' : ' JS'}] ${file} (${code.length} chars)`);

  if (!jsx) {
    compiledParts.push(`// ── ${file} ──\n` + code);
    continue;
  }

  try {
    const result = Babel.transform(code, {
      presets: ['react'],
      filename: file,
      sourceType: 'script',
    });
    compiledParts.push(`// ── ${file} ──\n` + result.code);
  } catch (e) {
    console.error(`ERROR compiling ${file}:`, e.message);
    process.exit(1);
  }
}

const compiledJS = compiledParts.join('\n\n');
console.log(`Compiled JS total: ${compiledJS.length} chars`);

// ── Read React / ReactDOM ─────────────────────────────────────────────────
const reactCode    = fs.readFileSync(path.join(LIBS, 'react.min.js'),    'utf8');
const reactDomCode = fs.readFileSync(path.join(LIBS, 'react-dom.min.js'),'utf8');

// ── CSS (from 內勤審核後台.html in v2 bundle) ─────────────────────────────
const ADMIN_CSS = `  :root{
    --primary:rgb(73,99,250);
    --primary-2:rgb(131,143,249);
    --primary-3:rgb(164,176,255);
    --primary-soft:rgb(238,242,255);
    --primary-soft-2:rgb(245,246,255);
    --primary-bg:rgb(249,250,255);
    --ink:rgb(41,47,84);
    --ink-2:rgb(74,78,103);
    --ink-3:rgb(103,106,127);
    --ink-4:rgb(140,142,157);
    --line:rgb(229,230,235);
    --line-2:rgb(239,239,242);
    --line-3:rgb(209,210,220);
    --danger:rgb(234,82,82);
    --danger-soft:rgb(255,236,236);
    --warn:rgb(241,160,40);
    --warn-soft:rgb(255,245,222);
    --ok:rgb(72,153,61);
    --ok-soft:rgb(231,247,229);
    --header-h:50px;
    --rail-w:200px;
    --shadow-sm:0 1px 2px rgba(65,96,97,.10);
    --shadow:0 4px 14px rgba(65,96,97,.10);
    --shadow-lg:0 12px 32px rgba(41,47,84,.14);
    font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#e6e8ef;color:var(--ink);font-family:inherit;font-size:13px}
  body{min-height:100vh;overflow-x:hidden}
  .scaler{transform-origin:top left;width:1440px;position:relative}
  .app{width:1440px;background:#f5f6fa;display:flex;flex-direction:column;min-height:100vh}
  button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit;padding:0}
  input,select,textarea{font-family:inherit;color:var(--ink)}
  ::selection{background:var(--primary-soft);color:var(--ink)}

  .ff-mont{font-family:"Montserrat",sans-serif}
  .tabular{font-variant-numeric:tabular-nums}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;
    height:36px;padding:0 18px;border-radius:18px;
    font:500 14px/1 "Noto Sans TC",sans-serif;letter-spacing:.04em;
    box-shadow:1px 1px 4px rgba(0,0,0,.08);transition:all .15s ease;
    border:1px solid transparent;white-space:nowrap}
  .btn:hover{transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .btn-primary{background:var(--primary);color:#fff}
  .btn-primary:hover{background:rgb(60,86,237)}
  .btn-ghost{background:#fff;color:var(--primary);border:1px solid var(--primary)}
  .btn-ghost:hover{background:var(--primary-soft)}
  .btn-soft{background:var(--primary-soft);color:var(--primary);box-shadow:none}
  .btn-soft:hover{background:rgb(227,234,255)}
  .btn-quiet{background:transparent;color:var(--ink-3);box-shadow:none;border:1px solid var(--line)}
  .btn-quiet:hover{background:var(--primary-soft-2);color:var(--ink)}
  .btn-danger{background:#fff;color:var(--danger);border:1px solid var(--danger)}
  .btn-danger:hover{background:var(--danger-soft)}
  .btn-warn{background:rgb(255,159,53);color:#fff}
  .btn-sm{height:28px;padding:0 12px;font-size:12px;border-radius:14px}
  .btn-lg{height:44px;padding:0 24px;font-size:15px;border-radius:22px}
  .btn:disabled,.btn[aria-disabled="true"]{background:var(--line-2);color:var(--ink-4);
    border-color:transparent;box-shadow:none;cursor:not-allowed;transform:none}
  .btn:disabled:hover{transform:none;background:var(--line-2)}

  /* Tags / chips */
  .tag{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;
    font:500 11.5px/1.4 "Noto Sans TC",sans-serif;border-radius:11px;
    background:var(--primary-soft);color:var(--primary);white-space:nowrap}

  /* Form controls */
  .input{height:36px;padding:0 12px;border-radius:7px;border:1px solid var(--line);
    background:#fff;font:400 13px/1 "Noto Sans TC",sans-serif;color:var(--ink);outline:none;
    transition:border-color .15s ease,box-shadow .15s ease;width:100%}
  .input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(73,99,250,.12)}
  .input::placeholder{color:var(--ink-4)}

  /* Header */
  .hdr{height:50px;background:var(--primary);display:flex;align-items:center;
    padding:0 30px 0 24px;color:#fff;gap:18px;position:sticky;top:0;z-index:50;
    box-shadow:0 1px 0 rgba(0,0,0,.05)}
  .hdr-brand{display:flex;align-items:center;gap:12px}
  .hdr-brand .sub{font-family:Montserrat,sans-serif;font-size:11px;letter-spacing:.18em;
    color:rgba(255,255,255,.7);font-weight:500;line-height:1}
  .hdr-brand .name{display:flex;align-items:baseline;gap:8px}
  .hdr-brand .audio-label{font-family:Montserrat,sans-serif;font-size:19px;font-weight:700;
    letter-spacing:.05em;line-height:1}
  .hdr-divider{width:1px;height:18px;background:rgba(255,255,255,.32)}
  .hdr-right{display:flex;align-items:center;gap:14px;
    font:500 13px/1 "Noto Sans TC",sans-serif;color:#fff}
  .hdr-right .help{opacity:.7;cursor:pointer}
  .hdr-right .help:hover{opacity:1}
  .hdr-user{display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 6px;border-radius:6px}
  .hdr-user:hover{background:rgba(255,255,255,.08)}
  .hdr-user .avatar{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.22);
    display:grid;place-items:center;font-size:11px;flex-shrink:0}

  /* Rail Nav */
  .main-shell{display:flex;min-height:calc(100vh - 50px - 50px)}
  .rail{width:var(--rail-w);min-width:var(--rail-w);background:#fff;border-right:1px solid var(--line);
    padding:14px 12px 18px;display:flex;flex-direction:column;
    position:sticky;top:50px;align-self:flex-start;
    max-height:calc(100vh - 50px);overflow-y:auto}
  .rail-self{display:flex;align-items:center;gap:10px;padding:10px 8px;
    background:var(--primary-soft-2);border-radius:8px}
  .rail-self-avatar{width:32px;height:32px;border-radius:50%;
    background:var(--primary);color:#fff;display:grid;place-items:center;
    font:700 13px/1 "Noto Sans TC";flex-shrink:0}
  .rail-group{font:600 10.5px/1 "Noto Sans TC",sans-serif;color:var(--ink-4);
    letter-spacing:.1em;padding:0 8px 6px;margin-top:4px}
  .rail-item{display:flex;align-items:center;gap:9px;width:100%;
    padding:8px 10px;margin-bottom:1px;border-radius:6px;
    color:var(--ink-2);font:500 13px/1 "Noto Sans TC",sans-serif;letter-spacing:.02em;
    cursor:pointer;transition:all .12s;border:none;background:transparent;
    text-align:left}
  .rail-item:hover{background:var(--primary-soft-2);color:var(--ink)}
  .rail-item.active{background:var(--primary);color:#fff}
  .rail-item.active .rail-icon{color:#fff}
  .rail-icon{color:var(--ink-3);display:inline-grid;place-items:center;flex-shrink:0}
  .rail-label{flex:1}
  .rail-badge{padding:1px 7px;border-radius:8px;font:600 10.5px/1.4 Montserrat;
    background:var(--danger);color:#fff;flex-shrink:0}
  .rail-item.active .rail-badge{background:rgba(255,255,255,.25);color:#fff}
  .rail-footer{margin-top:auto;padding:12px 8px 4px;border-top:1px solid var(--line-2)}

  /* Main content region */
  .main-content{flex:1;min-width:0}

  /* SubHeader */
  .subhdr{background:#fff;border-bottom:1px solid var(--line);padding:14px 28px;
    display:flex;align-items:flex-start;gap:14px;position:sticky;top:50px;z-index:30}
  .admin-subhdr{padding:14px 28px}
  .subhdr h1{margin:0;font:700 19px/1.2 "Noto Sans TC",sans-serif;color:var(--ink);letter-spacing:.03em}
  .crumb{display:flex;align-items:center;gap:6px;font:400 11.5px/1 "Noto Sans TC";color:var(--ink-3)}
  .crumb svg{flex-shrink:0}

  /* Card */
  .card{background:#fff;border-radius:11px;box-shadow:var(--shadow-sm);
    border:1px solid var(--line-2)}

  /* Footer */
  .ftr{padding:16px 0 22px;text-align:center;font:400 11.5px/1 "Noto Sans TC";color:var(--ink-4);
    letter-spacing:.04em}

  /* Waveform */
  @keyframes wf{0%,100%{transform:scaleY(.30)} 50%{transform:scaleY(1)}}
  .wf{display:flex;align-items:center;gap:3px;height:48px}
  .wf span{display:block;width:3px;height:100%;border-radius:2px;background:var(--primary);
    transform-origin:center;animation:wf 1.2s ease-in-out infinite}

  /* Spinner */
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .9s linear infinite}

  .meta{font:400 11.5px/1.4 "Noto Sans TC";color:var(--ink-4)}

  /* Range slider */
  input[type=range].rng{appearance:none;width:100%;height:4px;background:var(--line);
    border-radius:2px;outline:none;cursor:pointer}
  input[type=range].rng::-webkit-slider-thumb{appearance:none;width:14px;height:14px;
    border-radius:50%;background:var(--primary);cursor:pointer;border:2px solid #fff;
    box-shadow:0 1px 4px rgba(73,99,250,.4)}
  input[type=range].rng::-moz-range-thumb{width:14px;height:14px;
    border-radius:50%;background:var(--primary);cursor:pointer;border:2px solid #fff;
    box-shadow:0 1px 4px rgba(73,99,250,.4)}

  .fadeup{opacity:1}

  /* F-code legend toggle */
  html.hide-fcodes .fcode-legend,html.hide-fcodes [class*="fcode"]{display:none !important}

  /* Review detail page */
  .rev-grid{
    display:grid;
    grid-template-columns:minmax(0,1fr) 340px;
    gap:20px;
    padding:18px 28px 28px;
    min-height:calc(100vh - 50px - 50px - 70px);
  }
  .rev-main{min-width:0;overflow:visible}
  .rev-side{display:flex;flex-direction:column;gap:14px;
    position:sticky;top:124px;align-self:flex-start}
  .rev-actions{display:flex;gap:8px;margin-top:4px}

  /* Tweaks panel fix */
  .twk-panel{--dc-inv-zoom:1}

  /* Tweaks root position */
  #tweaks-root{position:fixed;bottom:20px;right:20px;z-index:9999}`;

// ── Auto-scaler script ────────────────────────────────────────────────────
const SCALER_SCRIPT = `
(function(){
  var lastH=0;
  function fit(){
    var s=document.querySelector('.scaler');
    if(!s)return;
    if(s.hasAttribute('noscale')){if(s.style.transform)s.style.transform='';return;}
    var vw=document.documentElement.clientWidth;
    var sc=Math.min(1,vw/1440);
    var tr='scale('+sc+')';
    if(s.style.transform!==tr)s.style.transform=tr;
    var inner=s.firstElementChild;
    if(inner){
      var h=Math.round(inner.getBoundingClientRect().height);
      if(h&&Math.abs(h-lastH)>1){lastH=h;document.body.style.height=h+'px';}
    }
  }
  var ro=new ResizeObserver(fit);
  function attach(){var sc=document.querySelector('.scaler');if(sc){ro.observe(sc);fit();}else requestAnimationFrame(attach);}
  attach();
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);
})();`;

// ── Assemble HTML ─────────────────────────────────────────────────────────
console.log('\nAssembling HTML…');

const parts = [];
parts.push('<!doctype html>\n<html lang="zh-TW">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=1440" />\n<title>內勤審核後台 — MLI 高齡錄音系統</title>');
parts.push('\n<link rel="preconnect" href="https://fonts.googleapis.com">');
parts.push('\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
parts.push('\n<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">');
parts.push('\n<style>\n' + ADMIN_CSS + '\n</style>');
parts.push('\n<script>\n' + reactCode + '\n<\/script>');
parts.push('\n<script>\n' + reactDomCode + '\n<\/script>');
parts.push('\n<\/head>\n<body>');
parts.push('\n<div id="root"><\/div>');
parts.push('\n<div id="tweaks-root"><\/div>');
parts.push('\n<script>' + SCALER_SCRIPT + '\n<\/script>');
parts.push('\n<script>\n' + compiledJS + '\n<\/script>');
parts.push('\n<\/body>\n<\/html>');

const html = parts.join('');
console.log(`Final HTML size: ${html.length} chars (${(html.length/1024/1024).toFixed(2)} MB)`);

// ── Structure checks ──────────────────────────────────────────────────────
const checks = [
  ['ReactDOM.createRoot', 1],
  ['function AdminApp',   1],
  ['</body>',             1],
  ['</head>',             1],
];
let allOk = true;
for (const [needle, expected] of checks) {
  let count = 0, pos = 0;
  while ((pos = html.indexOf(needle, pos)) !== -1) { count++; pos++; }
  const ok = (expected === 1) ? (count === 1) : (count >= 1);
  if (!ok) allOk = false;
  console.log(`  ${ok ? '✓' : '✗'} "${needle}" appears ${count}× (expected ${expected})`);
}

if (!allOk) {
  console.error('Structure check FAILED — aborting.');
  process.exit(1);
}

// ── Write output ──────────────────────────────────────────────────────────
fs.writeFileSync(OUT, html, 'utf8');
console.log(`\nWrote: ${OUT}`);
console.log('Done!');
