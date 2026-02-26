// frontend/src/components/CheckoutModal.jsx
import { useState } from "react";
import { orderAPI, paymentAPI } from "../api";
import { C, S, fmt } from "../constants";

export default function CheckoutModal({ cart, user, deliveryFee, onClose, onSuccess, toast }) {
  const [form, setForm] = useState({ name: user?.displayName||"", phone:"", address:"", note:"", type:"delivery" });
  const [step, setStep] = useState("form"); // form | processing | done
  const [orderId, setOrderId] = useState("");
  const up = (k,v) => setForm(f => ({...f,[k]:v}));

  const subtotal = cart.reduce((s,i) => s+i.finalPrice*i.qty, 0);
  const deliveryCharge = form.type === "delivery" ? deliveryFee : 0;
  const total = subtotal + deliveryCharge;

  const handlePaystack = async () => {
    if (!form.name || !form.phone) { toast.show("Name and phone are required", "error"); return; }
    setStep("processing");

    try {
      const orderData = {
        cart: cart.map(i => ({ id:i.id,name:i.name,qty:i.qty,finalPrice:i.finalPrice,bowlSize:i.bowlSize||null })),
        deliveryType: form.type,
        address: form.address,
        phone: form.phone,
        name: form.name,
        note: form.note,
      };
      const { order } = await orderAPI.place(orderData);
      const oid = order.orderId;
      setOrderId(oid);

      const email = user?.email || `${form.phone.replace(/\D/g,"")}@guest.kutunzafoods.com`;
      const { authorizationUrl, reference } = await paymentAPI.initialize({
        orderId: oid, email,
        metadata: { customerName: form.name, customerPhone: form.phone }
      });

      const popup = window.open(authorizationUrl, "Paystack", "width=500,height=700,left=200,top=50");

      const poll = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(poll);
            const verify = await paymentAPI.verify(reference);
            if (verify.paid) {
              setStep("done");
              onSuccess(oid);
            } else {
              setStep("form");
              toast.show("Payment was not completed", "error");
            }
          }
        } catch(e) {
          clearInterval(poll);
          setStep("form");
        }
      }, 1500);

      setTimeout(() => clearInterval(poll), 600000);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.show(err.message || "Order failed. Please try again.", "error");
      setStep("form");
    }
  };

  if (step === "done") return (
    <div style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)",padding:20 }}>
      <div style={{ background:C.bg2,borderRadius:12,padding:52,maxWidth:400,textAlign:"center",border:`1px solid ${C.goldLight}20` }}>
        <div style={{ fontSize:36,marginBottom:12 }}>✓</div>
        <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:24,color:C.goldLight,fontWeight:600,marginBottom:10 }}>Order Confirmed</div>
        <div style={{ color:C.text,fontSize:13,lineHeight:1.7,marginBottom:8 }}>
          Thanks, <strong style={{color:C.cream}}>{form.name}</strong>! Order <strong style={{color:C.goldLight}}>{orderId}</strong> is being prepared.
        </div>
        <div style={{ color:C.goldLight,fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', serif",margin:"16px 0" }}>{fmt(total)}</div>
        <div style={{ color:C.textDim,fontSize:12,marginBottom:24 }}>Updates will be sent to {form.phone}</div>
        <button onClick={onClose} style={{ ...S.btn("burg"),padding:"12px 32px" }}>Done</button>
      </div>
    </div>
  );

  if (step === "processing") return (
    <div style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)" }}>
      <div style={{ textAlign:"center",color:C.cream }}>
        <div style={{ fontSize:36,marginBottom:12 }}>⏳</div>
        <div style={{ fontSize:18,color:C.goldLight,fontWeight:600 }}>Processing Payment…</div>
        <div style={{ color:C.textDim,fontSize:13,marginTop:8 }}>Complete payment in the popup window</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",padding:16,overflowY:"auto" }}>
      <div style={{ background:C.bg2,borderRadius:12,width:"100%",maxWidth:480,border:`1px solid ${C.burg}40`,maxHeight:"95vh",overflowY:"auto" }}>
        <div style={{ padding:"22px 26px 16px",borderBottom:`1px solid ${C.burg}30`,display:"flex",justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:20,color:C.cream,fontWeight:600 }}>Checkout</div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"18px 26px 26px",display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",gap:8 }}>
            {["delivery","pickup"].map(t => (
              <button key={t} onClick={() => up("type",t)} style={{ flex:1,padding:"10px",border:`1px solid ${form.type===t?C.goldLight:C.burg+"40"}`,background:form.type===t?C.burg:"transparent",borderRadius:5,color:form.type===t?C.goldLight:C.textDim,cursor:"pointer",fontSize:12,fontWeight:600 }}>
                {t==="delivery"?"🚗 Delivery":"🏪 Pickup"}
              </button>
            ))}
          </div>
          <div><label style={S.label}>Full Name *</label><input style={S.input} value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Your name"/></div>
          <div><label style={S.label}>Phone *</label><input style={S.input} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="+234 800 000 0000"/></div>
          {form.type==="delivery" && <div><label style={S.label}>Delivery Address *</label><textarea style={{ ...S.input,minHeight:70,resize:"vertical" }} value={form.address} onChange={e=>up("address",e.target.value)} placeholder="Full address with landmark..."/></div>}
          <div><label style={S.label}>Notes</label><textarea style={{ ...S.input,minHeight:55,resize:"vertical" }} value={form.note} onChange={e=>up("note",e.target.value)} placeholder="Spice level, special instructions..."/></div>
          {/* Summary */}
          <div style={{ background:C.bg3,borderRadius:8,padding:14,border:`1px solid ${C.burg}25` }}>
            {cart.map(i => <div key={i.cartId} style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12,padding:"3px 0" }}><span>{i.name} {i.bowlSize?`(${i.bowlSize.label})`:""} ×{i.qty}</span><span>{fmt(i.finalPrice*i.qty)}</span></div>)}
            <div style={{ borderTop:`1px solid ${C.burg}25`,marginTop:8,paddingTop:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12,marginBottom:4 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {form.type==="delivery" && <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12,marginBottom:4 }}><span>Delivery</span><span>{fmt(deliveryCharge)}</span></div>}
              <div style={{ display:"flex",justifyContent:"space-between",color:C.goldLight,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond', serif",marginTop:4 }}><span>Total</span><span>{fmt(total)}</span></div>
            </div>
          </div>
          <button onClick={handlePaystack} style={{ ...S.btn("gold"),width:"100%",padding:"14px",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            🔒 Pay {fmt(total)} with Paystack
          </button>
          <div style={{ background:"#1a1400",border:`1px solid ${C.goldLight}12`,borderRadius:6,padding:"10px 12px",fontSize:11,color:C.textDim,lineHeight:1.6,textAlign:"center" }}>
            Secured by Paystack · Card, Bank Transfer, USSD & Mobile Money accepted
          </div>
        </div>
      </div>
    </div>
  );
}
