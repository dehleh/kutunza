// frontend/src/components/Toast.jsx
import { useState, useEffect } from "react";
import { C } from "../constants";

export function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: C.greenLight, error: C.redLight, info: C.goldLight };
  return (
    <div style={{ position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.bg2,border:`1px solid ${colors[type]||C.goldLight}60`,borderRadius:8,padding:"12px 20px",color:colors[type]||C.goldLight,fontSize:13,fontWeight:600,zIndex:2000,boxShadow:"0 4px 20px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8,maxWidth:"90vw" }}>
      <span>{type==="success"?"✅":type==="error"?"❌":"ℹ️"}</span> {msg}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="info") => setToast({ msg, type, id: Date.now() });
  const ToastEl = toast ? <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} /> : null;
  return { show, ToastEl };
}
