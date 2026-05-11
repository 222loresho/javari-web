import { useState, useEffect } from "react";
import api from "./api";

const PLANS   = ["trial","basic","pro","enterprise"];
const STATUS  = ["trial","active","suspended"];
const PLAN_COLOR  = { trial:"#5c5870", basic:"var(--accent)", pro:"#7c3aed", enterprise:"#c9a84c" };
const STATUS_COLOR= { trial:"#5c5870", active:"var(--green)", suspended:"var(--red)" };
const CURRENCIES  = ["KES","USD","GBP","EUR","UGX","TZS"];

export default function SuperAdmin({ user, onLogout }) {
  const [tab,      setTab]      = useState("dashboard");
  const [markets,  setMarkets]  = useState([]);
  const [dashboard,setDashboard]= useState(null);
  const [users,    setUsers]    = useState([]);
  const [message,  setMessage]  = useState({ text:"", type:"" });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form,     setForm]     = useState(defaultMarketForm());
  const [userForm, setUserForm] = useState({ name:"",username:"",pin:"",role:"admin" });
  const [showUserForm,setShowUserForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

  function defaultMarketForm() {
    return { name:"",location:"",contact_name:"",contact_email:"",contact_phone:"",
             plan:"trial",monthly_fee:"",currency:"KES",status:"trial",api_url:"",notes:"" };
  }

  const toast = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 4000);
  };

  const fetchMarkets   = () => api.get("/superadmin/markets").then(r => setMarkets(r.data)).catch(()=>{});
  const fetchDashboard = () => api.get("/superadmin/dashboard").then(r => setDashboard(r.data)).catch(()=>{});
  const fetchUsers     = () => api.get("/superadmin/users").then(r => setUsers(r.data)).catch(()=>{});

  useEffect(() => {
    fetchDashboard(); fetchMarkets(); fetchUsers();
  }, []);

  useEffect(() => { if(tab==="dashboard") fetchDashboard(); }, [tab]);

  // ── Market CRUD ────────────────────────────────────────────────────────────
  const saveMarket = async () => {
    if (!form.name.trim()) return toast("Market name required","error");
    try {
      if (editItem) { await api.put(`/superadmin/markets/${editItem.id}`, form); toast("✅ Market updated!"); }
      else          { await api.post("/superadmin/markets", form); toast("✅ Market added!"); }
      setShowForm(false); setEditItem(null); setForm(defaultMarketForm());
      fetchMarkets(); fetchDashboard();
    } catch(e) { toast(e.response?.data?.error || "Failed","error"); }
  };

  const deleteMarket = async (id) => {
    if (!window.confirm("Delete this market?")) return;
    try { await api.delete(`/superadmin/markets/${id}`); toast("✅ Deleted!"); fetchMarkets(); fetchDashboard(); }
    catch(e) { toast(e.response?.data?.error || "Failed","error"); }
  };

  const startEdit = (m) => {
    setEditItem(m);
    setForm({ ...m, monthly_fee: m.monthly_fee || "" });
    setShowForm(true);
    setTab("markets");
  };

  const recordPayment = async (m) => {
    const today     = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth()+1, today.getDate());
    try {
      await api.put(`/superadmin/markets/${m.id}`, {
        last_payment: today.toISOString().split("T")[0],
        next_payment: nextMonth.toISOString().split("T")[0],
        status: "active",
      });
      toast(`✅ Payment recorded for ${m.name}`);
      fetchMarkets(); fetchDashboard();
    } catch { toast("Failed","error"); }
  };

  // ── User CRUD ──────────────────────────────────────────────────────────────
  const saveUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.pin) return toast("All fields required","error");
    if (userForm.pin.length !== 4 || !/^\d{4}$/.test(userForm.pin)) return toast("PIN must be 4 digits","error");
    try {
      await api.post("/superadmin/users", userForm);
      toast("✅ User created!"); setShowUserForm(false);
      setUserForm({ name:"",username:"",pin:"",role:"admin" });
      fetchUsers();
    } catch(e) { toast(e.response?.data?.error || "Failed","error"); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtDate  = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"});
  const fmtMoney = (n,cur="KES") => `${cur} ${Number(n||0).toLocaleString()}`;
  const maxRev   = dashboard?.trend ? Math.max(...dashboard.trend.map(d=>d.revenue),1) : 1;

  const tabs = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"markets",   label:`🏪 Markets (${markets.length})` },
    { id:"users",     label:`👥 Users (${users.length})` },
  ];

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header" style={{background:"linear-gradient(135deg,#0a0e0b 0%,#0f1a12 100%)",borderBottom:"1px solid rgba(201,168,76,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#a8873e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>
            👑
          </div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",fontWeight:"600",color:"#c9a84c",letterSpacing:"0.5px"}}>
              VENDAURA
            </div>
            <div style={{fontSize:"10px",color:"#5c5870",letterSpacing:"2px",textTransform:"uppercase"}}>
              Super Admin
            </div>
          </div>
        </div>
        <div className="header-right">
          <span style={{fontSize:"12px",color:"#c9a84c",padding:"5px 12px",background:"rgba(201,168,76,0.1)",borderRadius:"99px",border:"1px solid rgba(201,168,76,0.2)"}}>
            👤 {user.name}
          </span>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs" style={{background:"#0a0e0b",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
        {tabs.map(t => (
          <button key={t.id}
            className={`tab-btn ${tab===t.id?"active":"inactive"}`}
            style={tab===t.id ? {background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)"} : {}}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* TOAST */}
      {message.text && (
        <div className={`toast ${message.type==="error"?"toast-error":"toast-success"}`}>{message.text}</div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab === "dashboard" && dashboard && (
        <div style={{padding:"16px"}}>

          {/* KPI Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"12px",marginBottom:"20px"}}>
            {[
              { label:"Total Markets",     value: dashboard.markets.total,          icon:"🏪", color:"#c9a84c" },
              { label:"Active Markets",    value: dashboard.markets.active,          icon:"✅", color:"var(--green)" },
              { label:"Trial Markets",     value: dashboard.markets.trial,           icon:"🔄", color:"#7c3aed" },
              { label:"Monthly Sub Rev",   value: fmtMoney(dashboard.subscription_revenue), icon:"💰", color:"#c9a84c" },
              { label:"Today Sales",       value: fmtMoney(dashboard.sales.today_revenue),  icon:"📈", color:"var(--green)" },
              { label:"Month Sales",       value: fmtMoney(dashboard.sales.month_revenue),  icon:"📊", color:"var(--accent)" },
            ].map((kpi,i) => (
              <div key={i} style={{background:"#0f1a12",border:"1px solid rgba(201,168,76,0.15)",borderRadius:"var(--r-md)",padding:"16px",textAlign:"center"}}>
                <div style={{fontSize:"24px",marginBottom:"8px"}}>{kpi.icon}</div>
                <div style={{fontSize:"10px",color:"#5c5870",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px"}}>{kpi.label}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:"700",color:kpi.color}}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue Trend Chart */}
          <div style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.15)",borderRadius:"var(--r-md)",padding:"16px",marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#c9a84c",marginBottom:"14px"}}>
              📈 7-Day Sales Trend
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"100px"}}>
              {dashboard.trend.map((d,i) => (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                  <div style={{fontSize:"9px",color:"#5c5870"}}>{d.revenue>=1000?`${(d.revenue/1000).toFixed(1)}k`:Math.round(d.revenue)||""}</div>
                  <div style={{
                    width:"100%",
                    height: `${Math.max((d.revenue/maxRev)*80,d.revenue>0?4:2)}px`,
                    background: d.revenue > 0 ? "linear-gradient(180deg,#c9a84c,#a8873e)" : "rgba(201,168,76,0.08)",
                    borderRadius:"3px 3px 0 0",
                    transition:"height 0.3s ease"
                  }}/>
                  <div style={{fontSize:"9px",color:"#5c5870",whiteSpace:"nowrap"}}>
                    {new Date(d.date).toLocaleDateString("en-KE",{weekday:"short"})}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan distribution + Upcoming payments */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>

            <div style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.15)",borderRadius:"var(--r-md)",padding:"16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#c9a84c",marginBottom:"12px"}}>📦 Plans</div>
              {Object.entries(dashboard.plans).map(([plan,count]) => (
                <div key={plan} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <span style={{fontSize:"12px",background:PLAN_COLOR[plan]||"#555",color:plan==="enterprise"?"#0a0e0b":"white",padding:"2px 10px",borderRadius:"99px",fontWeight:"700",textTransform:"uppercase",fontSize:"10px"}}>{plan}</span>
                  <span style={{fontWeight:"700",color:"#c9a84c"}}>{count}</span>
                </div>
              ))}
              {Object.keys(dashboard.plans).length === 0 && <div style={{fontSize:"12px",color:"#5c5870"}}>No markets yet</div>}
            </div>

            <div style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.15)",borderRadius:"var(--r-md)",padding:"16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#c9a84c",marginBottom:"12px"}}>⏰ Due Soon</div>
              {dashboard.upcoming.length === 0 && <div style={{fontSize:"12px",color:"#5c5870"}}>No payments due</div>}
              {dashboard.upcoming.map((p,i) => (
                <div key={i} style={{marginBottom:"10px"}}>
                  <div style={{fontSize:"13px",fontWeight:"600"}}>{p.market}</div>
                  <div style={{fontSize:"11px",color:p.days_left<=2?"var(--red)":"#c9a84c"}}>
                    {p.days_left === 0 ? "Due today!" : `Due in ${p.days_left} day${p.days_left>1?"s":""}`} · KES {p.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MARKETS TAB ── */}
      {tab === "markets" && (
        <div style={{padding:"16px"}}>
          <div className="flex-between" style={{marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#c9a84c"}}>🏪 Markets</div>
            <button
              style={{background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)",padding:"8px 16px",borderRadius:"var(--r-sm)",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:"600",fontSize:"13px"}}
              onClick={() => { setEditItem(null); setForm(defaultMarketForm()); setShowForm(!showForm); }}>
              {showForm && !editItem ? "✕ Cancel" : "+ Add Market"}
            </button>
          </div>

          {/* Market Form */}
          {showForm && (
            <div style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.3)",borderRadius:"var(--r-md)",padding:"16px",marginBottom:"16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#c9a84c",marginBottom:"14px"}}>
                {editItem ? "✏️ Edit Market" : "➕ New Market"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <input className="input" placeholder="Market / Restaurant name *" style={{gridColumn:"1/-1"}} value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
                <input className="input" placeholder="Location / City" value={form.location} onChange={e => setForm({...form,location:e.target.value})} />
                <input className="input" placeholder="Contact person" value={form.contact_name} onChange={e => setForm({...form,contact_name:e.target.value})} />
                <input className="input" placeholder="Email" value={form.contact_email} onChange={e => setForm({...form,contact_email:e.target.value})} />
                <input className="input" placeholder="Phone" value={form.contact_phone} onChange={e => setForm({...form,contact_phone:e.target.value})} />
                <select className="input" value={form.plan} onChange={e => setForm({...form,plan:e.target.value})}>
                  {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
                <select className="input" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                  {STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <input className="input" placeholder="Monthly fee" type="number" value={form.monthly_fee} onChange={e => setForm({...form,monthly_fee:e.target.value})} />
                <select className="input" value={form.currency} onChange={e => setForm({...form,currency:e.target.value})}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="input" placeholder="Backend API URL (optional)" style={{gridColumn:"1/-1"}} value={form.api_url} onChange={e => setForm({...form,api_url:e.target.value})} />
                <textarea className="input" placeholder="Notes" rows="2" style={{gridColumn:"1/-1",resize:"vertical"}} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} />
              </div>
              <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
                <button className="btn btn-primary" style={{background:"rgba(201,168,76,0.2)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.4)",flex:1}} onClick={saveMarket}>
                  {editItem ? "Save Changes" : "Create Market"}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditItem(null); setForm(defaultMarketForm()); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Market List */}
          {markets.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <div className="empty-text">No markets yet</div>
              <div className="empty-sub">Add your first client market above</div>
            </div>
          )}

          {markets.map(m => (
            <div key={m.id} style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.15)",borderRadius:"var(--r-md)",padding:"14px",marginBottom:"10px",transition:"border-color 0.2s"}}
              onMouseEnter={e => e.currentTarget.style.borderColor="rgba(201,168,76,0.35)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="rgba(201,168,76,0.15)"}>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                <div>
                  <div style={{fontWeight:"700",fontSize:"15px",marginBottom:"4px"}}>{m.name}</div>
                  <div style={{fontSize:"12px",color:"#5c5870"}}>{m.location || "No location set"}</div>
                </div>
                <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                  <span style={{background:PLAN_COLOR[m.plan]||"#555",color:m.plan==="enterprise"?"#0a0e0b":"white",fontSize:"9px",padding:"2px 8px",borderRadius:"99px",fontWeight:"700",textTransform:"uppercase"}}>{m.plan}</span>
                  <span style={{background:STATUS_COLOR[m.status]||"#555",color:"white",fontSize:"9px",padding:"2px 8px",borderRadius:"99px",fontWeight:"700",textTransform:"uppercase",
                    background: m.status==="active"?"rgba(74,222,128,0.15)":m.status==="suspended"?"rgba(224,49,49,0.15)":"rgba(92,88,112,0.3)",
                    color: m.status==="active"?"var(--green)":m.status==="suspended"?"var(--red)":"#5c5870",
                    border: `1px solid ${m.status==="active"?"rgba(74,222,128,0.3)":m.status==="suspended"?"rgba(224,49,49,0.3)":"rgba(92,88,112,0.3)"}`
                  }}>{m.status}</span>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                <div style={{fontSize:"12px",color:"#5c5870"}}>
                  💰 Fee: <span style={{color:"#c9a84c",fontWeight:"700"}}>{fmtMoney(m.monthly_fee, m.currency)}/mo</span>
                </div>
                <div style={{fontSize:"12px",color:"#5c5870"}}>
                  👤 {m.contact_name || "No contact"}
                </div>
                <div style={{fontSize:"12px",color:"#5c5870"}}>
                  📅 Last: <span style={{color:"var(--text-dim)"}}>{fmtDate(m.last_payment)}</span>
                </div>
                <div style={{fontSize:"12px",color:"#5c5870"}}>
                  ⏰ Next: <span style={{color:m.next_payment && new Date(m.next_payment) < new Date(Date.now()+7*86400000)?"var(--red)":"var(--text-dim)"}}>{fmtDate(m.next_payment)}</span>
                </div>
              </div>

              {expanded === m.id && m.notes && (
                <div style={{fontSize:"12px",color:"#5c5870",background:"rgba(201,168,76,0.05)",padding:"8px",borderRadius:"var(--r-sm)",marginBottom:"10px"}}>
                  📝 {m.notes}
                </div>
              )}

              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(m)}>✏️ Edit</button>
                <button
                  style={{padding:"6px 12px",background:"rgba(201,168,76,0.1)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.25)",borderRadius:"var(--r-sm)",cursor:"pointer",fontSize:"12px",fontWeight:"600",fontFamily:"'Outfit',sans-serif"}}
                  onClick={() => recordPayment(m)}>💳 Record Payment</button>
                {m.notes && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded===m.id?null:m.id)}>
                    {expanded===m.id?"▲ Less":"▼ Notes"}
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => deleteMarket(m.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div style={{padding:"16px"}}>
          <div className="flex-between" style={{marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#c9a84c"}}>👥 All Users</div>
            <button
              style={{background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)",padding:"8px 16px",borderRadius:"var(--r-sm)",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:"600",fontSize:"13px"}}
              onClick={() => setShowUserForm(!showUserForm)}>
              {showUserForm ? "✕ Cancel" : "+ Add User"}
            </button>
          </div>

          {showUserForm && (
            <div style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.3)",borderRadius:"var(--r-md)",padding:"16px",marginBottom:"16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#c9a84c",marginBottom:"14px"}}>➕ New User</div>
              <input className="input" placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({...userForm,name:e.target.value})} />
              <input className="input" placeholder="Username" value={userForm.username} onChange={e => setUserForm({...userForm,username:e.target.value.toLowerCase()})} />
              <input className="input" type="number" placeholder="4-digit PIN" maxLength={4} value={userForm.pin} onChange={e => setUserForm({...userForm,pin:e.target.value.slice(0,4)})} />
              <select className="input" value={userForm.role} onChange={e => setUserForm({...userForm,role:e.target.value})}>
                <option value="admin">👑 Admin</option>
                <option value="cashier">💰 Cashier</option>
                <option value="waiter">🤵 Waiter</option>
                <option value="super_admin">🌟 Super Admin</option>
              </select>
              <div style={{display:"flex",gap:"10px"}}>
                <button className="btn btn-primary" style={{background:"rgba(201,168,76,0.2)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.4)",flex:1}} onClick={saveUser}>Create</button>
                <button className="btn btn-ghost" onClick={() => setShowUserForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {users.map(u => {
            const roleColors = { super_admin:"#c9a84c", admin:"var(--red)", cashier:"var(--accent)", waiter:"#f59f00" };
            return (
              <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.12)",borderRadius:"var(--r-md)",marginBottom:"8px",opacity:u.active?1:0.5}}>
                <div>
                  <div style={{fontWeight:"600",marginBottom:"4px",display:"flex",alignItems:"center",gap:"8px"}}>
                    {u.name}
                    <span style={{fontSize:"10px",background:`${roleColors[u.role]||"#555"}22`,color:roleColors[u.role]||"#555",border:`1px solid ${roleColors[u.role]||"#555"}44`,padding:"1px 8px",borderRadius:"99px",fontWeight:"700",textTransform:"uppercase"}}>
                      {u.role.replace("_"," ")}
                    </span>
                    {!u.active && <span style={{fontSize:"10px",color:"#5c5870",background:"rgba(92,88,112,0.2)",padding:"1px 6px",borderRadius:"99px"}}>INACTIVE</span>}
                  </div>
                  <div style={{fontSize:"12px",color:"#5c5870"}}>@{u.username}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}