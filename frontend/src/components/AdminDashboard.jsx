// frontend/src/components/AdminDashboard.jsx
// Wired to settingsAPI for settings persistence
// Admin check via authAPI.getProfile (role field)
import { useState, useEffect } from "react";
import { orderAPI, menuAPI, settingsAPI, eventAPI } from "../api";
import { C, S, LOGO, DELIVERY_FEE, fmt, newId } from "../constants";
import EditItemModal from "./EditItemModal";

export default function AdminDashboard({ menu, setMenu, onExit, toast }) {
  const [tab, setTab] = useState("menu");
  const [editItem, setEditItem] = useState(null);
  const [newCat, setNewCat] = useState({ label:"", icon:"🍽️" });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Settings state (persisted to backend)
  const [settings, setSettings] = useState({
    businessName:"Kutunza Gourmet",
    phone1:"",phone2:"",website:"kutunzafoods.com",address:"Lagos, Nigeria",
    deliveryAreas:"",deliveryFee:DELIVERY_FEE,minOrderAmount:0,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    settingsAPI.get().then(r => {
      if (r.settings) setSettings(s => ({...s,...r.settings}));
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  // Load orders
  useEffect(() => {
    if (tab === "orders" && orders.length === 0) {
      setLoadingOrders(true);
      orderAPI.getAllOrders({ limit: 100 })
        .then(r => { setOrders(r.orders); setStats(r.stats); })
        .catch(e => toast.show(e.message, "error"))
        .finally(() => setLoadingOrders(false));
    }
  }, [tab]);

  // Load events
  useEffect(() => {
    if (tab === "events" && events.length === 0) {
      setLoadingEvents(true);
      eventAPI.getAllEvents()
        .then(r => { setEvents(r.events || []); })
        .catch(e => toast.show(e.message, "error"))
        .finally(() => setLoadingEvents(false));
    }
  }, [tab]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await settingsAPI.update(settings);
      toast.show("Settings saved!", "success");
    } catch (e) {
      toast.show(e.message || "Failed to save settings", "error");
    }
    setSavingSettings(false);
  };

  const toggleItem = async (catId, itemId) => {
    setMenu(m => m.map(c => c.id!==catId?c:{...c,items:c.items.map(i=>i.id!==itemId?i:{...i,active:!i.active})}));
    try { await menuAPI.toggleItem(catId, itemId); } catch(e) { toast.show("Sync failed: "+e.message,"error"); }
  };

  const saveItem = async (catId, item) => {
    setMenu(m => m.map(c => c.id!==catId?c:{...c,items:editItem.isNew?[...c.items,{...item,id:newId(),active:true}]:c.items.map(i=>i.id!==item.id?i:item)}));
    try {
      if (editItem.isNew) await menuAPI.addItem(catId, item);
      else await menuAPI.editItem(catId, item.id, item);
      toast.show("Saved!", "success");
    } catch(e) { toast.show("Sync failed: "+e.message,"error"); }
    setEditItem(null);
  };

  const deleteItem = async (catId, itemId) => {
    if (!confirm("Delete this item?")) return;
    setMenu(m => m.map(c=>c.id!==catId?c:{...c,items:c.items.filter(i=>i.id!==itemId)}));
    try { await menuAPI.deleteItem(catId, itemId); } catch(e) {}
  };

  const addCategory = async () => {
    if (!newCat.label.trim()) return;
    const id = newId();
    setMenu(m => [...m, { id, label: newCat.label, icon: newCat.icon, items: [] }]);
    try { await menuAPI.addCategory({ id, ...newCat }); toast.show("Category added!","success"); } catch(e) {}
    setNewCat({ label:"", icon:"🍽️" });
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders(o => o.map(x => x.orderId===orderId ? {...x,status} : x));
      toast.show("Status updated","success");
    } catch(e) { toast.show(e.message,"error"); }
  };

  const updateEventStatus = async (eventId, status) => {
    try {
      await eventAPI.updateStatus(eventId, status);
      setEvents(ev => ev.map(e => e.eventId===eventId ? {...e,status} : e));
      toast.show("Event status updated","success");
    } catch(e) { toast.show(e.message,"error"); }
  };

  const STATUS_COLORS = { pending:"#b8860b",confirmed:C.goldLight,preparing:"#4a9eff",out_for_delivery:"#52b788",delivered:C.greenLight,cancelled:C.redLight,reviewed:"#4a9eff",completed:"#52b788" };
  const NEXT_STATUS = { pending:"confirmed",confirmed:"preparing",preparing:"out_for_delivery",out_for_delivery:"delivered" };
  const EVENT_NEXT = { pending:"reviewed",reviewed:"confirmed",confirmed:"completed" };

  const upS = (k,v) => setSettings(s => ({...s,[k]:v}));

  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:C.cream,fontFamily:"'Lora', serif" }}>
      <div style={{ borderBottom:`1px solid ${C.burg}40`,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg2,position:"sticky",top:0,zIndex:200 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <img src={LOGO} alt="Kutunza" style={{ height:44,width:44,objectFit:"contain",borderRadius:4 }}/>
          <div><div style={{...S.label,marginBottom:2}}>Admin Dashboard</div><div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:18,color:C.cream,fontStyle:"italic"}}>Kutunza Control Centre</div></div>
        </div>
        <button onClick={onExit} style={{ ...S.btn("ghost"),padding:"8px 14px",fontSize:11 }}>← Back to App</button>
      </div>
      <div style={{ borderBottom:`1px solid ${C.burg}25`,display:"flex",background:C.bg2,overflowX:"auto" }}>
        {[["menu","🍽️","Menu Editor"],["orders","📋","Orders"],["events","🎪","Events"],["settings","⚙️","Settings"]].map(([id,icon,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"13px 22px",background:"none",border:"none",cursor:"pointer",color:tab===id?C.goldLight:C.textDim,fontSize:13,fontWeight:600,borderBottom:`2px solid ${tab===id?C.goldLight:"transparent"}`,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap" }}>{icon} {label}</button>
        ))}
      </div>
      <div style={{ padding:"24px",maxWidth:1100,margin:"0 auto" }}>
        {/* MENU TAB */}
        {tab==="menu"&&(
          <div>
            <div style={{ background:C.bg3,border:`1px solid ${C.burg}30`,borderRadius:10,padding:18,marginBottom:24 }}>
              <div style={{...S.label,marginBottom:10}}>Add New Category</div>
              <div style={{ display:"flex",gap:10 }}>
                <input style={{...S.input,width:60}} placeholder="🍽️" value={newCat.icon} onChange={e=>setNewCat(n=>({...n,icon:e.target.value}))}/>
                <input style={S.input} placeholder="Category name" value={newCat.label} onChange={e=>setNewCat(n=>({...n,label:e.target.value}))}/>
                <button onClick={addCategory} style={{...S.btn("gold"),whiteSpace:"nowrap",padding:"10px 18px"}}>+ Add</button>
              </div>
            </div>
            {menu.map(cat => (
              <div key={cat.id} style={{ background:C.bg2,border:`1px solid ${C.burg}30`,borderRadius:10,marginBottom:16,overflow:"hidden" }}>
                <div style={{ padding:"14px 18px",background:C.bg3,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{fontSize:20}}>{cat.icon}</span>
                    <div>
                      <div style={{color:C.cream,fontFamily:"'Cormorant Garamond', serif",fontSize:17}}>{cat.label}</div>
                      <div style={{color:C.textDim,fontSize:11}}>{cat.items.filter(i=>i.active).length}/{cat.items.length} active</div>
                    </div>
                  </div>
                  <button onClick={()=>setEditItem({catId:cat.id,isNew:true,id:"",name:"",price:"",desc:""})} style={{...S.btn("burg"),padding:"7px 12px",fontSize:11}}>+ Add Item</button>
                </div>
                <div style={{padding:"6px 10px"}}>
                  {cat.items.map(item => (
                    <div key={item.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 8px",borderRadius:5,marginBottom:3,opacity:item.active?1:0.5 }}>
                      <div onClick={()=>toggleItem(cat.id,item.id)} style={{ width:38,height:20,borderRadius:10,cursor:"pointer",position:"relative",flexShrink:0,background:item.active?C.goldLight:C.burg+"60",transition:"background 0.2s" }}>
                        <div style={{position:"absolute",top:2,left:item.active?20:2,width:16,height:16,borderRadius:"50%",background:item.active?C.bg:C.cream,transition:"left 0.2s"}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:C.cream,fontSize:13,fontWeight:600}}>{item.name}</div>
                        <div style={{color:C.textDim,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.desc}</div>
                      </div>
                      <div style={{color:C.goldLight,fontSize:13,fontWeight:700,flexShrink:0}}>{fmt(item.price)}</div>
                      <button onClick={()=>setEditItem({...item,catId:cat.id,isNew:false})} style={{background:C.bg3,border:`1px solid ${C.burg}50`,borderRadius:4,padding:"4px 8px",color:C.text,cursor:"pointer",fontSize:11}}>✏️</button>
                      <button onClick={()=>deleteItem(cat.id,item.id)} style={{background:C.bg3,border:`1px solid ${C.burg}50`,borderRadius:4,padding:"4px 8px",color:C.redLight,cursor:"pointer",fontSize:11}}>🗑</button>
                    </div>
                  ))}
                  {cat.items.length===0&&<div style={{padding:"18px",textAlign:"center",color:C.textDim,fontSize:13}}>No items. Add one above.</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab==="orders"&&(
          <div>
            {stats&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
              {[["Total Orders",stats.total,"📋"],["Pending",stats.pending,"⏳"],["Preparing",stats.preparing,"👨‍🍳"],["Delivering",stats.out_for_delivery,"🚗"],["Delivered",stats.delivered,"🎉"],["Revenue",fmt(stats.totalRevenue||0),"💰"]].map(([label,val,icon])=>(
                <div key={label} style={{background:C.bg3,border:`1px solid ${C.burg}30`,borderRadius:8,padding:"16px"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                  <div style={{color:C.goldLight,fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', serif"}}>{val}</div>
                  <div style={{color:C.textDim,fontSize:11}}>{label}</div>
                </div>
              ))}
            </div>}
            {loadingOrders?<div style={{textAlign:"center",padding:"60px 0",color:C.textDim}}>Loading orders...</div>
            :orders.length===0?<div style={{textAlign:"center",padding:"60px 0",color:C.textDim}}>No orders yet</div>
            :orders.map(order=>(
              <div key={order.orderId} style={{background:C.bg3,border:`1px solid ${C.burg}30`,borderRadius:8,padding:"16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{color:C.cream,fontWeight:700,fontSize:14,fontFamily:"'Cormorant Garamond', serif"}}>{order.orderId}</div>
                    <div style={{color:C.textDim,fontSize:12,marginTop:2}}>👤 {order.customer?.name} · 📱 {order.customer?.phone}</div>
                    <div style={{color:C.textDim,fontSize:11,marginTop:2}}>{new Date(order.createdAt).toLocaleString("en-NG")}</div>
                    {order.address&&<div style={{color:C.textDim,fontSize:11,marginTop:2}}>📍 {order.address}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                    <div style={{background:`${STATUS_COLORS[order.status]}20`,color:STATUS_COLORS[order.status],fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>{order.status?.replace(/_/g," ").toUpperCase()}</div>
                    <div style={{color:C.goldLight,fontWeight:700,fontSize:16,fontFamily:"'Cormorant Garamond', serif"}}>{fmt(order.total)}</div>
                    {NEXT_STATUS[order.status]&&(
                      <button onClick={()=>updateOrderStatus(order.orderId,NEXT_STATUS[order.status])} style={{...S.btn("burg"),padding:"7px 14px",fontSize:11}}>
                        → Mark {NEXT_STATUS[order.status]?.replace(/_/g," ")}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{borderTop:`1px solid ${C.burg}20`,marginTop:10,paddingTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
                  {order.cart?.map((it,i)=>(
                    <span key={i} style={{background:C.bg2,border:`1px solid ${C.burg}30`,borderRadius:4,padding:"3px 8px",fontSize:11,color:C.text}}>
                      {it.name} {it.bowlSize!=="Single Portion"?`(${it.bowlSize})`:""} ×{it.qty}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENTS TAB */}
        {tab==="events"&&(
          <div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,color:C.cream,fontStyle:"italic",marginBottom:22}}>Event Booking Requests</div>
            {loadingEvents?<div style={{textAlign:"center",padding:"60px 0",color:C.textDim}}>Loading events...</div>
            :events.length===0?<div style={{textAlign:"center",padding:"60px 0",color:C.textDim}}>No event bookings yet</div>
            :events.map(ev=>(
              <div key={ev.eventId} style={{background:C.bg3,border:`1px solid ${C.burg}30`,borderRadius:8,padding:"16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{color:C.cream,fontWeight:700,fontSize:15,fontFamily:"'Cormorant Garamond', serif"}}>{ev.eventType}</div>
                    <div style={{color:C.textDim,fontSize:12,marginTop:4}}>👤 {ev.name} · 📧 {ev.email} · 📱 {ev.phone}</div>
                    <div style={{color:C.textDim,fontSize:12,marginTop:2}}>📅 {ev.date} {ev.time ? `at ${ev.time}` : ""} · 👥 {ev.guests} guests</div>
                    <div style={{color:C.textDim,fontSize:12,marginTop:2}}>📍 {ev.location}</div>
                    {ev.budget && <div style={{color:C.goldLight,fontSize:12,marginTop:2}}>💰 Budget: {ev.budget}</div>}
                    {ev.notes && <div style={{color:C.textDim,fontSize:11,marginTop:4,fontStyle:"italic"}}>Notes: {ev.notes}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                    <div style={{background:`${STATUS_COLORS[ev.status]||STATUS_COLORS.pending}20`,color:STATUS_COLORS[ev.status]||STATUS_COLORS.pending,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
                      {ev.status?.toUpperCase()}
                    </div>
                    {EVENT_NEXT[ev.status]&&(
                      <button onClick={()=>updateEventStatus(ev.eventId,EVENT_NEXT[ev.status])} style={{...S.btn("burg"),padding:"7px 14px",fontSize:11}}>
                        → Mark {EVENT_NEXT[ev.status]}
                      </button>
                    )}
                    {ev.status!=="cancelled"&&ev.status!=="completed"&&(
                      <button onClick={()=>updateEventStatus(ev.eventId,"cancelled")} style={{...S.btn("red"),padding:"5px 10px",fontSize:10}}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab==="settings"&&(
          <div style={{maxWidth:560}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,color:C.cream,fontStyle:"italic",marginBottom:22}}>App Settings</div>
            {!settingsLoaded ? (
              <div style={{textAlign:"center",padding:"40px 0",color:C.textDim}}>Loading settings...</div>
            ) : (
              <>
                <div style={{marginBottom:14}}><label style={S.label}>Business Name</label><input style={S.input} value={settings.businessName} onChange={e=>upS("businessName",e.target.value)}/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Phone 1</label><input style={S.input} value={settings.phone1} onChange={e=>upS("phone1",e.target.value)} placeholder="+234 800 000 0000"/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Phone 2</label><input style={S.input} value={settings.phone2} onChange={e=>upS("phone2",e.target.value)} placeholder="+234 800 000 0001"/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Website</label><input style={S.input} value={settings.website} onChange={e=>upS("website",e.target.value)}/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Address</label><input style={S.input} value={settings.address} onChange={e=>upS("address",e.target.value)}/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Delivery Areas</label><textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={settings.deliveryAreas} onChange={e=>upS("deliveryAreas",e.target.value)} placeholder="e.g. Victoria Island, Lekki, Ikoyi..."/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Delivery Fee (₦)</label><input style={S.input} type="number" value={settings.deliveryFee} onChange={e=>upS("deliveryFee",Number(e.target.value))}/></div>
                <div style={{marginBottom:14}}><label style={S.label}>Min Order Amount (₦)</label><input style={S.input} type="number" value={settings.minOrderAmount} onChange={e=>upS("minOrderAmount",Number(e.target.value))}/></div>
                <button onClick={saveSettings} disabled={savingSettings} style={{...S.btn("gold"),marginTop:8,opacity:savingSettings?0.7:1}}>
                  {savingSettings?"⏳ Saving...":"Save Settings"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editItem && (
        <EditItemModal
          editItem={editItem}
          onSave={saveItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
