// frontend/src/components/BowlPicker.jsx
import { useState, useEffect, useRef } from "react";
import { C, S, BOWL_SIZES, BOWL_ELIGIBLE, fmt } from "../constants";

export default function BowlPicker({ item, catId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState("single");
  const ref = useRef();
  const eligible = BOWL_ELIGIBLE.includes(catId);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!eligible) return (
    <button onClick={() => onAdd(item, null)} style={{ ...S.btn("burg"),padding:"8px 14px",fontSize:11 }}>+ Add</button>
  );

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...S.btn("burg"),padding:"8px 14px",fontSize:11,display:"flex",alignItems:"center",gap:5 }}>
        + Add <span style={{ fontSize:9 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:"absolute",right:0,bottom:"108%",background:C.bg2,border:`1px solid ${C.burg}60`,borderRadius:8,padding:10,zIndex:400,width:220,boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>
          <div style={{ ...S.label,marginBottom:8 }}>Portion Size</div>
          {BOWL_SIZES.map(bs => (
            <div key={bs.id} onClick={() => setSel(bs.id)} style={{ padding:"8px 10px",borderRadius:5,cursor:"pointer",marginBottom:3,background:sel===bs.id?C.burg:C.bg3,border:`1px solid ${sel===bs.id?C.goldLight+"40":C.burg+"25"}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ color:C.cream,fontSize:12,fontWeight:600 }}>{bs.label}</div>
                <div style={{ color:C.textDim,fontSize:10 }}>{bs.desc}</div>
              </div>
              <div style={{ color:C.goldLight,fontSize:12,fontWeight:700 }}>{fmt(Math.round(item.price*bs.multiplier))}</div>
            </div>
          ))}
          <button onClick={() => { onAdd(item, BOWL_SIZES.find(s=>s.id===sel)); setOpen(false); }} style={{ ...S.btn("gold"),width:"100%",marginTop:8,padding:"10px" }}>Add to Cart</button>
        </div>
      )}
    </div>
  );
}
