// frontend/src/components/OrderHistory.jsx
import { useState, useEffect } from "react";
import { orderAPI } from "../api";
import { C, S, fmt } from "../constants";

export default function OrderHistory({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    orderAPI.getMyOrders().then(r => { setOrders(r.orders); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const STATUS_COLORS = { pending:"#b8860b",confirmed:C.goldLight,preparing:"#4a9eff",out_for_delivery:"#52b788",delivered:C.greenLight,cancelled:C.redLight };
  const STATUS_ICONS = { pending:"⏳",confirmed:"✅",preparing:"👨‍🍳",out_for_delivery:"🚗",delivered:"🎉",cancelled:"❌" };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:600,display:"flex",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",padding:16,overflowY:"auto",alignItems:"flex-start",justifyContent:"center",paddingTop:40 }}>
      <div style={{ background:C.bg2,borderRadius:12,width:"100%",maxWidth:680,border:`1px solid ${C.burg}40`,maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ padding:"22px 26px 16px",borderBottom:`1px solid ${C.burg}30`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.bg2,zIndex:10 }}>
          <div>
            <div style={S.label}>My Account</div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:22,color:C.cream,fontStyle:"italic" }}>Order History</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:18,cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"16px 26px 26px" }}>
          {loading ? (
            <div style={{ textAlign:"center",padding:"60px 0",color:C.textDim }}>Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign:"center",padding:"60px 0" }}>
              <div style={{ fontSize:44,marginBottom:12 }}>🍽️</div>
              <div style={{ color:C.goldLight,fontFamily:"'Cormorant Garamond', serif",fontSize:18 }}>No orders yet</div>
              <div style={{ color:C.textDim,fontSize:13,marginTop:6 }}>Your order history will appear here</div>
            </div>
          ) : orders.map(order => (
            <div key={order.orderId} onClick={() => setSelected(selected?.orderId === order.orderId ? null : order)}
              style={{ background:C.bg3,border:`1px solid ${selected?.orderId===order.orderId?C.goldLight+"40":C.burg+"30"}`,borderRadius:8,padding:"16px",marginBottom:10,cursor:"pointer",transition:"border-color 0.2s" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div>
                  <div style={{ color:C.cream,fontSize:14,fontWeight:600,fontFamily:"'Cormorant Garamond', serif" }}>{order.orderId}</div>
                  <div style={{ color:C.textDim,fontSize:12,marginTop:2 }}>{new Date(order.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ background:`${STATUS_COLORS[order.status]}20`,color:STATUS_COLORS[order.status],fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,marginBottom:4 }}>
                    {STATUS_ICONS[order.status]} {order.status?.replace(/_/g," ").toUpperCase()}
                  </div>
                  <div style={{ color:C.goldLight,fontWeight:700,fontFamily:"'Cormorant Garamond', serif",fontSize:16 }}>{fmt(order.total)}</div>
                </div>
              </div>

              {selected?.orderId === order.orderId && (
                <div style={{ marginTop:14,borderTop:`1px solid ${C.burg}20`,paddingTop:14 }}>
                  <div style={{ ...S.label,marginBottom:8 }}>Items Ordered</div>
                  {order.cart?.map((item,i) => (
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",color:C.text,fontSize:13,padding:"4px 0" }}>
                      <span>{item.name} {item.bowlSize !== "Single Portion" ? `(${item.bowlSize})` : ""} ×{item.qty}</span>
                      <span>{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:`1px solid ${C.burg}20`,marginTop:10,paddingTop:10,display:"flex",flexDirection:"column",gap:4 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12 }}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                    {order.deliveryFee > 0 && <div style={{ display:"flex",justifyContent:"space-between",color:C.textDim,fontSize:12 }}><span>Delivery</span><span>{fmt(order.deliveryFee)}</span></div>}
                    <div style={{ display:"flex",justifyContent:"space-between",color:C.goldLight,fontSize:15,fontWeight:700,marginTop:4 }}><span>Total</span><span>{fmt(order.total)}</span></div>
                  </div>
                  {order.address && <div style={{ color:C.textDim,fontSize:12,marginTop:8 }}>📍 {order.address}</div>}
                  {order.status === "pending" && (
                    <button onClick={(e) => { e.stopPropagation(); orderAPI.cancelOrder(order.orderId,"Customer request").then(() => setOrders(o => o.map(x => x.orderId===order.orderId?{...x,status:"cancelled"}:x))).catch(()=>{}); }}
                      style={{ ...S.btn("red"),padding:"8px 16px",fontSize:11,marginTop:12 }}>Cancel Order</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
