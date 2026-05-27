// Product Combobox — 可搜尋下拉選單
//
// 使用：<ProductCombobox value={productName} onChange={setProduct}/>
//   value 為商品名稱（string），與 PRODUCTS[].name 對應

function ProductCombobox({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef(null);
  const searchRef = React.useRef(null);

  // 點擊外部關閉
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 30); }, [open]);

  const products = window.__MLI_PRODUCTS;
  const selected = products.find(p => p.name === value);
  const filtered = products.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
           p.code.toLowerCase().includes(q) ||
           p.category.includes(query);
  });

  // 依類別分組
  const grouped = {};
  filtered.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const CATEGORY_COLORS = {
    "健康險": "rgb(72,153,61)",
    "壽險":   "rgb(73,99,250)",
    "傷害險": "rgb(241,160,40)",
    "年金險": "rgb(167,141,250)",
    "投資型": "rgb(91,167,233)",
  };

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} style={{
        minHeight: 44, padding:"6px 14px", borderRadius:8,
        border: `1.5px solid ${open ? "var(--primary)" : "var(--line)"}`,
        background:"#fff", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
        boxShadow: open ? "0 0 0 3px rgba(73,99,250,.12)" : "none",
        transition:"all .15s ease",
      }}>
        {selected ? (
          <>
            <span className="ff-mont tabular" style={{
              font:"600 11px/1 Montserrat,sans-serif", color:"#fff",
              padding:"5px 8px", borderRadius:4, letterSpacing:".04em",
              background: CATEGORY_COLORS[selected.category] || "var(--primary)",
            }}>{selected.code}</span>
            <span style={{flex:1, font:"500 14px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>
              {selected.name}
            </span>
            <span className="tag tag-gray">{selected.category}</span>
            <button className="btn btn-quiet btn-sm"
              style={{height:26, padding:"0 8px", borderRadius:4}}
              onClick={(e)=>{e.stopPropagation(); onChange(""); setOpen(true);}}
              title="清除商品">
              <I.X size={12} sw={2}/>
            </button>
          </>
        ) : (
          <span style={{flex:1, color:"var(--ink-4)", font:"400 14px/1 'Noto Sans TC'"}}>
            請選擇或搜尋投保商品…
          </span>
        )}
        <I.ChevronD size={16} stroke="var(--ink-3)"
          style={{transform: open?"rotate(180deg)":"none", transition:"transform .15s"}}/>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:30,
          background:"#fff", borderRadius:10, border:"1px solid var(--line)",
          boxShadow:"var(--shadow-lg)", overflow:"hidden",
        }}>
          {/* 搜尋欄 */}
          <div style={{padding:"10px 12px", borderBottom:"1px solid var(--line-2)",
            background:"var(--primary-soft-2)"}}>
            <div style={{position:"relative"}}>
              <I.Search size={14} stroke="var(--ink-3)"
                style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)"}}/>
              <input ref={searchRef} className="input"
                style={{height:36, paddingLeft:34, fontSize:13, width:"100%"}}
                placeholder="輸入商品名稱、代碼或類別。如：H001 / 醫療險 / 終身壽險…"
                value={query} onChange={(e)=>setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setQuery(""); }
                  if (e.key === "Enter" && filtered.length === 1) {
                    onChange(filtered[0].name); setQuery(""); setOpen(false);
                  }
                }}/>
            </div>
          </div>

          <div style={{maxHeight: 320, overflowY:"auto", padding:6}}>
            {filtered.length === 0 ? (
              <div style={{padding:"24px 12px", textAlign:"center",
                color:"var(--ink-4)", font:"400 13px/1.4 'Noto Sans TC'"}}>
                找不到符合「{query}」的商品
              </div>
            ) : Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{marginBottom:4}}>
                <div style={{padding:"6px 10px 4px", display:"flex", alignItems:"center", gap:8}}>
                  <span style={{width:6, height:6, borderRadius:3, background:CATEGORY_COLORS[cat]}}/>
                  <span style={{font:"600 11px/1 'Noto Sans TC'", color:"var(--ink-3)", letterSpacing:".08em"}}>
                    {cat}
                  </span>
                  <span className="meta" style={{fontSize:11}}>{items.length} 個商品</span>
                </div>
                {items.map(p => {
                  const isSelected = p.name === value;
                  return (
                    <button key={p.code}
                      onClick={()=>{onChange(p.name); setQuery(""); setOpen(false);}}
                      style={{
                        width:"100%", padding:"9px 10px", borderRadius:6, textAlign:"left",
                        background: isSelected ? "var(--primary-soft)" : "transparent",
                        display:"flex", alignItems:"center", gap:10, cursor:"pointer",
                        transition:"background .12s",
                      }}
                      onMouseEnter={(e)=>{ if(!isSelected) e.currentTarget.style.background="var(--primary-soft-2)";}}
                      onMouseLeave={(e)=>{ if(!isSelected) e.currentTarget.style.background="transparent";}}>
                      <span className="ff-mont tabular" style={{
                        font:"600 11px/1 Montserrat,sans-serif",
                        color: isSelected ? "#fff" : "var(--ink-3)",
                        background: isSelected ? CATEGORY_COLORS[cat] : "var(--line-2)",
                        minWidth: 40, padding:"5px 7px", borderRadius:4,
                        textAlign:"center", letterSpacing:".04em",
                      }}>{p.code}</span>
                      <span style={{flex:1, font:"500 13.5px/1.3 'Noto Sans TC'", color:"var(--ink)"}}>
                        {p.name}
                      </span>
                      {isSelected && <I.Check size={14} stroke="var(--primary)" sw={2.4}/>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.ProductCombobox = ProductCombobox;
