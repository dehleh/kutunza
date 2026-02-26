// frontend/src/components/EventBooking.jsx
// Wired to eventAPI backend for submission
import { useState } from "react";
import { eventAPI } from "../api";
import { C, S, EVENT_TYPES, MENU_SUGGESTIONS } from "../constants";

export default function EventBooking({ onClose, toast }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"",email:"",phone:"",eventType:"",date:"",time:"",location:"",guests:"",theme:"",budget:"",menu:"",notes:"",suggestMenu:false });
  const [suggestion, setSuggestion] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const up = (k,v) => setForm(f => ({...f,[k]:v}));
  const getSuggestion = () => {
    const num = parseInt(form.budget.replace(/[^0-9]/g,""))||0;
    setSuggestion(MENU_SUGGESTIONS[num<1500000?"low":num<5000000?"mid":"high"]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await eventAPI.submit({
        name: form.name,
        email: form.email,
        phone: form.phone,
        eventType: form.eventType,
        date: form.date,
        time: form.time,
        location: form.location,
        guests: parseInt(form.guests) || 0,
        theme: form.theme,
        budget: form.budget,
        menuPreferences: form.menu,
        notes: form.notes,
        suggestedMenu: suggestion?.label || null,
      });
      setDone(true);
    } catch (e) {
      toast?.show(e.message || "Failed to submit event request", "error");
    }
    setSubmitting(false);
  };

  if (done) return (
    <div style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)",padding:20 }}>
      <div style={{ background:C.bg2,borderRadius:12,padding:52,maxWidth:400,textAlign:"center",border:`1px solid ${C.goldLight}20` }}>
        <div style={{ fontSize:40,marginBottom:12 }}>✓</div>
        <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:24,color:C.goldLight,fontWeight:600,marginBottom:10 }}>Request Received</div>
        <div style={{ color:C.text,fontSize:13,lineHeight:1.7,marginBottom:24 }}>Thanks, <strong style={{color:C.cream}}>{form.name}</strong>. We'll contact you within 2 hours about your <strong style={{color:C.goldLight}}>{form.eventType}</strong>.</div>
        <button onClick={onClose} style={{ ...S.btn("burg"),padding:"12px 32px" }}>Close</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",padding:16,overflowY:"auto" }}>
      <div style={{ background:C.bg2,borderRadius:12,width:"100%",maxWidth:600,border:`1px solid ${C.burg}40`,maxHeight:"95vh",overflowY:"auto" }}>
        <div style={{ padding:"26px 30px 18px",borderBottom:`1px solid ${C.burg}30`,position:"sticky",top:0,background:C.bg2,zIndex:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:20,color:C.cream,fontWeight:600 }}>Book an Event</div>
            <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:20,cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"flex",gap:6,marginTop:16,alignItems:"center" }}>
            {["Details","Event Info","Menu & Budget"].map((s,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:6,flex:1 }}>
                <div style={{ width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:step>i+1?C.goldLight:step===i+1?C.burg:"transparent",border:`2px solid ${step>=i+1?C.goldLight:C.burg+"40"}`,color:step>i+1?C.bg:step===i+1?C.goldLight:C.textDim }}>{step>i+1?"✓":i+1}</div>
                <span style={{ fontSize:10,color:step===i+1?C.goldLight:C.textDim,whiteSpace:"nowrap" }}>{s}</span>
                {i<2&&<div style={{ flex:1,height:1,background:step>i+1?C.goldLight+"50":C.burg+"20" }}/>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"22px 30px 30px" }}>
          {step===1&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={S.label}>Full Name *</label><input style={S.input} placeholder="Your name" value={form.name} onChange={e=>up("name",e.target.value)}/></div>
            <div><label style={S.label}>Email *</label><input style={S.input} type="email" value={form.email} onChange={e=>up("email",e.target.value)} placeholder="your@email.com"/></div>
            <div><label style={S.label}>Phone *</label><input style={S.input} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="+234 800 000 0000"/></div>
          </div>}
          {step===2&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={S.label}>Type of Event *</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {EVENT_TYPES.map(t=><button key={t} onClick={()=>up("eventType",t)} style={{padding:"10px",borderRadius:5,cursor:"pointer",fontSize:12,textAlign:"left",background:form.eventType===t?C.burg:C.bg3,border:`1px solid ${form.eventType===t?C.goldLight+"50":C.burg+"30"}`,color:form.eventType===t?C.goldLight:C.textDim}}>{t}</button>)}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={S.label}>Date *</label><input style={S.input} type="date" value={form.date} onChange={e=>up("date",e.target.value)}/></div>
              <div><label style={S.label}>Time</label><input style={S.input} type="time" value={form.time} onChange={e=>up("time",e.target.value)}/></div>
            </div>
            <div><label style={S.label}>Venue / Location *</label><input style={S.input} placeholder="Venue name & address" value={form.location} onChange={e=>up("location",e.target.value)}/></div>
            <div><label style={S.label}>Number of Guests *</label><input style={S.input} type="number" placeholder="e.g. 150" value={form.guests} onChange={e=>up("guests",e.target.value)}/></div>
            <div><label style={S.label}>Theme / Dress Code</label><input style={S.input} placeholder="e.g. Black Tie, Yoruba Traditional..." value={form.theme} onChange={e=>up("theme",e.target.value)}/></div>
          </div>}
          {step===3&&<div style={{display:"flex",flexDirection:"column",gap:18}}>
            <div><label style={S.label}>Approximate Budget *</label><input style={S.input} placeholder="e.g. ₦2,000,000" value={form.budget} onChange={e=>up("budget",e.target.value)}/></div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <label style={{...S.label,marginBottom:0}}>Want us to suggest a menu?</label>
                <div onClick={()=>up("suggestMenu",!form.suggestMenu)} style={{width:42,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:form.suggestMenu?C.goldLight:C.burg+"60",transition:"background 0.3s"}}>
                  <div style={{position:"absolute",top:3,left:form.suggestMenu?23:3,width:16,height:16,borderRadius:"50%",background:form.suggestMenu?C.bg:C.cream,transition:"left 0.3s"}}/>
                </div>
              </div>
              {form.suggestMenu&&<div>
                <button onClick={getSuggestion} style={{...S.btn("burg"),marginBottom:10}}>✨ Generate Suggestion</button>
                {suggestion&&<div style={{background:C.bg3,border:`1px solid ${C.goldLight}20`,borderRadius:8,padding:14}}>
                  <div style={{color:C.goldLight,fontFamily:"'Cormorant Garamond', serif",fontSize:16,fontStyle:"italic",marginBottom:8}}>{suggestion.label}</div>
                  {suggestion.items.map(it=><div key={it} style={{color:C.cream,fontSize:12,padding:"4px 0",borderBottom:`1px solid ${C.burg}15`,display:"flex",gap:6}}><span style={{color:C.goldLight}}>◆</span>{it}</div>)}
                </div>}
              </div>}
            </div>
            <div><label style={S.label}>Preferred Menu Items</label><textarea style={{...S.input,minHeight:80,resize:"vertical"}} placeholder="Any specific dishes..." value={form.menu} onChange={e=>up("menu",e.target.value)}/></div>
            <div><label style={S.label}>Special Requests / Dietary Notes</label><textarea style={{...S.input,minHeight:70,resize:"vertical"}} placeholder="Allergies, dietary restrictions..." value={form.notes} onChange={e=>up("notes",e.target.value)}/></div>
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
            {step>1?<button onClick={()=>setStep(s=>s-1)} style={{...S.btn("ghost"),padding:"11px 18px"}}>← Back</button>:<div/>}
            <button onClick={()=>step<3?setStep(s=>s+1):handleSubmit()} disabled={submitting} style={{...S.btn("gold"),padding:"11px 26px",opacity:submitting?0.7:1}}>
              {step<3?"Continue →":(submitting?"Submitting…":"Submit Request")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
