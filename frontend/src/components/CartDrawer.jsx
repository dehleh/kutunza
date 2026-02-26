// frontend/src/components/CartDrawer.jsx
import { C, S, fmt } from "../constants";

export default function CartDrawer({ cart, deliveryFee, onClose, onRemove, onQty, onCheckout }) {
  const subtotal = cart.reduce((s,i) => s+i.finalPrice*i.qty, 0);
  const total = subtotal + (cart.length > 0 ? deliveryFee : 0);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,display:"flex" }}>
      <div onClick={onClose} style={{ flex:1,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)" }}/>
      <div style={{ width:400,maxWidth:"96vw",background:C.bg2,display:"flex",flexDirection:"column",borderLeft:`1px solid ${C.burg}40` }}>
        <div style={{ padding:"22px 22px 14px",borderBottom:`1px solid ${C.burg}30`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:20,color:C.cream,fontWeight:600 }}>Your Cart</div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"0 22px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:"center",padding:"60px 0" }}>
              <div style={{ fontSize:32 }}>🛒</div>
              <div style={{ color:C.textDim,fontSize:14,marginTop:12 }}>Your cart is empty</div>
            </div>
          ) : cart.map(item => (
            <div key={item.cartId} style={{ padding:"12px 0",borderBottom:`1px solid ${C.burg}20`,display:"flex",gap:10,alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ color:C.cream,fontSize:13,fontWeight:600 }}>{item.name}</div>
                {item.bowlSize && <div style={{ color:C.goldLight,fontSize:11,marginTop:2 }}>📦 {item.bowlSize.label}</div>}
                <div style={{ color:C.goldLight,fontSize:12,marginTop:3 }}>{fmt(item.finalPrice)}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <button onClick={() => onQty(item.cartId,-1)} style={{ width:24,height:24,borderRadius:"50%",border:`1px solid ${C.burg}`,background:"none",color:C.goldLight,cursor:"pointer",fontSize:14 }}>−</button>
                <span style={{ color:C.cream,width:16,textAlign:"center",fontSize:13 }}>{item.qty}</span>
                <button onClick={() => onQty(item.cartId,1)} style={{ width:24,height:24,borderRadius:"50%",border:`1px solid ${C.goldLight}`,background:C.goldLight,color:C.bg,cursor:"pointer",fontSize:14 }}>+</button>
              </div>
              <button onClick={() => onRemove(item.cartId)} style={{ background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding:22,borderTop:`1px solid ${C.burg}30` }}>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12,marginBottom:6 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12,marginBottom:14 }}><span>Delivery</span><span style={{color:C.goldLight}}>{fmt(deliveryFee)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.cream,fontSize:18,fontFamily:"'Cormorant Garamond', serif",fontWeight:700,marginBottom:16 }}><span>Total</span><span style={{color:C.goldLight}}>{fmt(total)}</span></div>
            <button onClick={onCheckout} style={{ ...S.btn("gold"),width:"100%",padding:"13px" }}>Checkout →</button>
          </div>
        )}
      </div>
    </div>
  );
}
