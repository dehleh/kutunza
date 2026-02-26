// frontend/src/components/EditItemModal.jsx
// Extracted from AdminDashboard to fix Rules of Hooks violation
// (original code used useState inside an IIFE in JSX)
import { useState } from "react";
import { C, S } from "../constants";

export default function EditItemModal({ editItem, onSave, onClose }) {
  const [f, setF] = useState({
    id: editItem.id,
    name: editItem.name,
    price: editItem.price,
    desc: editItem.desc,
  });
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));

  return (
    <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",padding:16 }}>
      <div style={{ background:C.bg2,borderRadius:12,width:"100%",maxWidth:420,border:`1px solid ${C.burg}50` }}>
        <div style={{ padding:"20px 22px 14px",borderBottom:`1px solid ${C.burg}30`,display:"flex",justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:20,color:C.cream,fontStyle:"italic" }}>
            {editItem.isNew ? "Add New Item" : "Edit Item"}
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:18,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"18px 22px 22px",display:"flex",flexDirection:"column",gap:12 }}>
          <div><label style={S.label}>Item Name *</label><input style={S.input} value={f.name} onChange={e=>u("name",e.target.value)} placeholder="e.g. Kutunza Jollof"/></div>
          <div><label style={S.label}>Price (₦) *</label><input style={S.input} type="number" value={f.price} onChange={e=>u("price",e.target.value)} placeholder="e.g. 2000"/></div>
          <div><label style={S.label}>Description</label><textarea style={{...S.input,minHeight:70,resize:"vertical"}} value={f.desc} onChange={e=>u("desc",e.target.value)} placeholder="Brief description..."/></div>
          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            <button onClick={onClose} style={{...S.btn("ghost"),flex:1}}>Cancel</button>
            <button onClick={() => { if (f.name && f.price) onSave(editItem.catId, f); }} style={{...S.btn("gold"),flex:1}}>
              {editItem.isNew ? "Add Item" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
