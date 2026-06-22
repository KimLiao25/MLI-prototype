/**
 * build.js  — pre-compiles JSX → plain JS, assembles 業務員錄音前台.html
 * Run: node build.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

// ── paths ────────────────────────────────────────────────────────────────
const SRC   = path.join(__dirname, 'src');
const LIBS  = path.join(__dirname, 'libs');
const OUT   = path.join(__dirname, '業務員錄音前台.html');

// ── Load Babel standalone into Node (UMD module, sets module.exports) ───
console.log('Loading Babel…');
const Babel = require(path.join(LIBS, 'babel.min.js'));
console.log('Babel loaded, version:', Babel.version || '(unknown)');

// ── Source files in dependency order (frontend only) ─────────────────────
const SOURCES = [
  { file: 'data.js',                jsx: false },
  { file: 'recProgress.js',         jsx: false },
  { file: 'tweaks-panel.jsx',       jsx: true  },
  { file: 'icons.jsx',              jsx: true  },
  { file: 'Header.jsx',             jsx: true  },
  { file: 'Waveform.jsx',           jsx: true  },
  { file: 'ProductCombobox.jsx',    jsx: true  },
  { file: 'CaseInfoSummary.jsx',    jsx: true  },
  { file: 'ScriptViews.jsx',        jsx: true  },
  { file: 'PreRecordModal.jsx',     jsx: true  },
  { file: 'CaseListScreen.jsx',     jsx: true  },
  { file: 'CaseDetailScreen.jsx',   jsx: true  },
  { file: 'EntryScreen.jsx',        jsx: true  },
  { file: 'RecordingScreen.jsx',    jsx: true  },
  { file: 'WholeRecordingScreen.jsx',jsx: true },
  { file: 'UploadScreen.jsx',       jsx: true  },
  { file: 'app.jsx',                jsx: true  },
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

// ── CSS (extracted from previous template) ───────────────────────────────
const CSS = `  :root{
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
    --shadow-sm:0 1px 2px rgba(65,96,97,.10);
    --shadow:0 4px 14px rgba(65,96,97,.10);
    --shadow-lg:0 12px 32px rgba(41,47,84,.14);
    font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#e6e8ef;color:var(--ink);font-family:inherit;font-size:14px}
  body{min-height:100vh;overflow-x:hidden}
  .scaler{transform-origin:top left;width:1440px;position:relative}
  .app{width:1440px;background:#f5f6fa;display:flex;flex-direction:column;min-height:100vh}
  button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit;padding:0}
  input,select,textarea{font-family:inherit;color:var(--ink)}
  ::selection{background:var(--primary-soft);color:var(--ink)}

  .ff-mont{font-family:"Montserrat",sans-serif}
  .tabular{font-variant-numeric:tabular-nums}

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;
    height:40px;padding:0 22px;border-radius:20px;
    font:500 16px/1 "Noto Sans TC",sans-serif;letter-spacing:.04em;
    box-shadow:1px 1px 5px rgba(0,0,0,.12);transition:all .15s ease;
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
  .btn-warn:hover{background:rgb(238,141,33)}
  .btn-sm{height:32px;padding:0 14px;font-size:14px;border-radius:16px}
  .btn-lg{height:48px;padding:0 28px;font-size:17px;border-radius:24px}
  .btn:disabled,.btn[aria-disabled="true"]{background:var(--line-2);color:var(--ink-4);
    border-color:transparent;box-shadow:none;cursor:not-allowed;transform:none}
  .btn:disabled:hover,.btn[aria-disabled="true"]:hover{transform:none;background:var(--line-2)}

  .tag{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;
    font:500 12px/1.4 "Noto Sans TC",sans-serif;border-radius:12px;
    background:var(--primary-soft);color:var(--primary);white-space:nowrap}
  .tag-ok{background:var(--ok-soft);color:var(--ok)}
  .tag-warn{background:var(--warn-soft);color:rgb(178,104,12)}
  .tag-danger{background:var(--danger-soft);color:var(--danger)}
  .tag-gray{background:var(--line-2);color:var(--ink-3)}
  .tag-ink{background:rgb(238,240,250);color:var(--ink-2)}

  .field{display:flex;flex-direction:column;gap:6px}
  .field label{font:500 13px/1 "Noto Sans TC",sans-serif;color:var(--ink-2);letter-spacing:.04em}
  .input{height:40px;padding:0 14px;border-radius:8px;border:1px solid var(--line);
    background:#fff;font:400 14px/1 "Noto Sans TC",sans-serif;color:var(--ink);outline:none;
    transition:border-color .15s ease,box-shadow .15s ease}
  .input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(73,99,250,.12)}
  .input::placeholder{color:var(--ink-4)}

  .page{max-width:1440px;margin:0 auto;width:100%}

  .hdr{height:50px;background:var(--primary);display:flex;align-items:center;
    padding:0 40px 0 30px;color:#fff;gap:24px;position:relative;z-index:10}
  .hdr-brand{display:flex;align-items:center;gap:14px}
  .hdr-brand .sub{font-family:Montserrat,sans-serif;font-size:11px;letter-spacing:.18em;
    color:rgba(255,255,255,.7);font-weight:500;line-height:1}
  .hdr-brand .name{display:flex;align-items:baseline;gap:8px}
  .hdr-brand .audio-label{font-family:Montserrat,sans-serif;font-size:19px;font-weight:700;
    letter-spacing:.05em;line-height:1}
  .hdr-divider{width:1px;height:18px;background:rgba(255,255,255,.32)}
  .hdr-nav{display:flex;align-items:center;gap:0;margin-left:8px}
  .hdr-nav button{padding:0 18px;height:50px;font:500 14px/1 "Noto Sans TC",sans-serif;
    color:rgba(255,255,255,.86);letter-spacing:.04em;position:relative}
  .hdr-nav button:hover{color:#fff;background:rgba(255,255,255,.06)}
  .hdr-nav button.active{color:#fff}
  .hdr-nav button.active::after{content:"";position:absolute;left:18px;right:18px;bottom:0;
    height:3px;background:#fff;border-radius:2px}
  .hdr-right{margin-left:auto;display:flex;align-items:center;gap:18px;
    font:500 14px/1 "Noto Sans TC",sans-serif;color:#fff}
  .hdr-right .help{opacity:.7;cursor:pointer}
  .hdr-right .help:hover{opacity:1}
  .hdr-user{display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 4px;border-radius:6px}
  .hdr-user:hover{background:rgba(255,255,255,.08)}
  .hdr-user .avatar{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.18);
    display:grid;place-items:center;font-size:11px}

  .subhdr{background:#fff;border-bottom:1px solid var(--line);padding:18px 40px;
    display:flex;align-items:center;gap:14px}
  .subhdr h1{margin:0;font:700 22px/1.2 "Noto Sans TC",sans-serif;color:var(--ink);letter-spacing:.03em}
  .crumb{display:flex;align-items:center;gap:8px;font:400 13px/1 "Noto Sans TC";color:var(--ink-3)}

  /* hide-fcodes */
  .html.hide-fcodes .fcode,.hide-fcodes .fcode{display:none!important}

  /* tweaks panel */
  #tweaks-root{position:fixed;bottom:20px;right:20px;z-index:9999}

  /* footer */
  .ftr{padding:18px 40px;font:400 12px/1 "Noto Sans TC",sans-serif;color:var(--ink-4);
    border-top:1px solid var(--line);text-align:center}`;

// ── Auto-scaler script ────────────────────────────────────────────────────
const SCALER_SCRIPT = `
(function(){
  function fit(){
    var s=document.querySelector('.scaler');
    if(!s)return;
    var vw=window.innerWidth||document.documentElement.clientWidth;
    var scale=vw/1440;
    s.style.transform='scale('+scale+')';
    s.style.transformOrigin='top left';
    document.body.style.height=(s.offsetHeight*scale)+'px';
  }
  fit();
  window.addEventListener('resize',fit);
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(fit).observe(document.querySelector('.scaler')||document.body);
  }
})();`;

// ── Assemble HTML ─────────────────────────────────────────────────────────
console.log('\nAssembling HTML…');

// We need to get the full CSS from the original file to not miss anything
// Read the original file CSS section
const origPath = OUT;
const origContent = fs.readFileSync(origPath, 'utf8');

// Extract CSS from original template (everything between <style> and </style>)
const styleStart = origContent.indexOf('<style>') + '<style>'.length;
const styleEnd   = origContent.indexOf('</style>');
const fullCSS = origContent.substring(styleStart, styleEnd);
console.log(`CSS extracted: ${fullCSS.length} chars`);

// Build the final HTML using string concatenation (NO regex replace)
const parts = [];
parts.push('<!doctype html>\n<html lang="zh-TW">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=1440" />\n<title>業務員錄音前台 — MLI 高齡錄音系統</title>');
parts.push('\n<!-- Google Fonts (load async to not block rendering) -->');
parts.push('\n<link rel="preconnect" href="https://fonts.googleapis.com">');
parts.push('\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
parts.push('\n<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">');
parts.push('\n<style>\n' + fullCSS + '\n</style>');
parts.push('\n<script>\n' + reactCode + '\n</script>');
parts.push('\n<script>\n' + reactDomCode + '\n</script>');
parts.push('\n</head>\n<body>');
parts.push('\n<div id="root"></div>');
parts.push('\n<div id="tweaks-root"></div>');
parts.push('\n<script>' + SCALER_SCRIPT + '\n</script>');
parts.push('\n<script>\n' + compiledJS + '\n</script>');
parts.push('\n</body>\n</html>');

const html = parts.join('');
console.log(`Final HTML size: ${html.length} chars (${(html.length/1024/1024).toFixed(2)} MB)`);

// Verify structure
const checks = [
  ['ReactDOM.createRoot', 1],
  ['</body>',             1],
  ['</head>',             1],
];
let allOk = true;
for (const [needle, expected] of checks) {
  let count = 0, pos = 0;
  while ((pos = html.indexOf(needle, pos)) !== -1) { count++; pos++; }
  const ok = count === expected;
  if (!ok) allOk = false;
  console.log(`  ${ok ? '✓' : '✗'} "${needle}" appears ${count}× (expected ${expected})`);
}

if (!allOk) {
  console.error('Structure check FAILED — aborting.');
  process.exit(1);
}

// Write output
fs.writeFileSync(OUT, html, 'utf8');
console.log(`\nWrote: ${OUT}`);
console.log('Done!');
