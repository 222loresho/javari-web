import { useState, useEffect, useRef } from "react";
import api from "./api";

/* ── Constants ──────────────────────────────────────────────────────────── */
const PLANS    = ["trial","basic","pro","enterprise"];
const STATUSES = ["trial","active","suspended"];
const CURRENCIES = ["KES","USD","GBP","EUR","UGX","TZS","ZAR"];
const PLAN_META = {
  trial:      { color:"#5c5870", bg:"rgba(92,88,112,0.15)",   label:"Trial" },
  basic:      { color:"#4ade80", bg:"rgba(74,222,128,0.12)",  label:"Basic" },
  pro:        { color:"#818cf8", bg:"rgba(129,140,248,0.12)", label:"Pro" },
  enterprise: { color:"#c9a84c", bg:"rgba(201,168,76,0.15)",  label:"Enterprise" },
};
const STATUS_META = {
  trial:     { color:"#94a3b8", bg:"rgba(148,163,184,0.1)",  icon:"🔄" },
  active:    { color:"#4ade80", bg:"rgba(74,222,128,0.1)",   icon:"✅" },
  suspended: { color:"#f87171", bg:"rgba(248,113,113,0.1)",  icon:"⏸️" },
};

/* ── Health Score ───────────────────────────────────────────────────────── */
function healthScore(m) {
  let score = 0;
  if (m.status === "active")      score += 40;
  if (m.status === "trial")       score += 20;
  if (m.next_payment) {
    const days = (new Date(m.next_payment) - new Date()) / 86400000;
    if (days > 7) score += 30;
    else if (days > 0) score += 15;
  }
  if (m.contact_name)  score += 10;
  if (m.contact_email) score += 10;
  if (m.api_url)       score += 10;
  return Math.min(score, 100);
}
function healthColor(s) {
  if (s >= 75) return "#4ade80";
  if (s >= 45) return "#c9a84c";
  return "#f87171";
}

/* ── Donut Chart ────────────────────────────────────────────────────────── */
function DonutChart({ data, size=120 }) {
  const total = data.reduce((a,d) => a+d.value, 0) || 1;
  let offset  = 0;
  const r = 42, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14"/>
      {data.map((d,i) => {
        const pct  = d.value / total;
        const dash = pct * circ;
        const gap  = circ - dash;
        const rot  = offset * 360;
        offset    += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rot - 90} ${cx} ${cy})`}
            style={{transition:"stroke-dasharray 0.8s ease"}}
          />
        );
      })}
      <text x={cx} y={cy-6} textAnchor="middle" fill="#f2ebe0"
        fontFamily="Cormorant Garamond, serif" fontSize="22" fontWeight="600">{total}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="#5c5870" fontSize="9"
        fontFamily="Outfit, sans-serif" letterSpacing="1">MARKETS</text>
    </svg>
  );
}

/* ── Area Chart ─────────────────────────────────────────────────────────── */
function AreaChart({ data, color="#c9a84c", height=80 }) {
  if (!data || !data.length) return null;
  const max   = Math.max(...data.map(d=>d.revenue), 1);
  const W     = 300, H = height, pad = 8;
  const pts   = data.map((d,i) => {
    const x = pad + (i/(data.length-1)) * (W - 2*pad);
    const y = H - pad - (d.revenue/max) * (H - 2*pad);
    return `${x},${y}`;
  });
  const line  = pts.join(" ");
  const area  = `${pad},${H-pad} ${line} ${W-pad},${H-pad}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i) => {
        const x = pad + (i/(data.length-1)) * (W - 2*pad);
        const y = H - pad - (d.revenue/max) * (H - 2*pad);
        return d.revenue > 0 ? (
          <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="#0a0e0b" strokeWidth="1.5"/>
        ) : null;
      })}
    </svg>
  );
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
function KPICard({ icon, label, value, sub, color="#c9a84c", delay=0 }) {
  return (
    <div style={{
      background:"linear-gradient(135deg,#0d1117 0%,#0a0e0b 100%)",
      border:`1px solid rgba(201,168,76,0.12)`,
      borderRadius:"14px", padding:"18px 16px",
      animation:`kpiIn 0.5s ease ${delay}s both`,
      position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:"-20px",right:"-10px",fontSize:"52px",opacity:"0.06"}}>{icon}</div>
      <div style={{fontSize:"22px",marginBottom:"8px"}}>{icon}</div>
      <div style={{fontSize:"10px",color:"#5c5870",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:"6px"}}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:"700",color,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:"11px",color:"#5c5870",marginTop:"6px"}}>{sub}</div>}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function SuperAdmin({ user, onLogout }) {
  const [tab,         setTab]         = useState("dashboard");
  const [markets,     setMarkets]     = useState([]);
  const [dashboard,   setDashboard]   = useState(null);
  const [users,       setUsers]       = useState([]);
  const [message,     setMessage]     = useState({ text:"", type:"" });
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [form,        setForm]        = useState(blankMarket());
  const [userForm,    setUserForm]    = useState({ name:"",username:"",pin:"",role:"admin" });
  const [showUForm,   setShowUForm]   = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState("all");
  const [filterPlan,  setFilterPlan]  = useState("all");
  const [expanded,    setExpanded]    = useState(null);
  const [sortBy,      setSortBy]      = useState("created");

  function blankMarket() {
    return { name:"",location:"",contact_name:"",contact_email:"",
             contact_phone:"",plan:"trial",monthly_fee:"",currency:"KES",
             status:"trial",api_url:"",notes:"" };
  }

  const toast = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 4000);
  };

  const fetchAll = () => {
    api.get("/superadmin/markets").then(r => setMarkets(r.data)).catch(()=>{});
    api.get("/superadmin/dashboard").then(r => setDashboard(r.data)).catch(()=>{});
    api.get("/superadmin/users").then(r => setUsers(r.data.filter(u => ['admin','super_admin'].includes(u.role)))).catch(()=>{});
  };
  useEffect(() => { fetchAll(); }, []);

  /* ── Market actions ─────────────────────────────────────────────────── */
  const saveMarket = async () => {
    if (!form.name.trim()) return toast("Market name required","error");
    try {
      if (editItem) await api.put(`/superadmin/markets/${editItem.id}`, form);
      else          await api.post("/superadmin/markets", form);
      toast(`✅ Market ${editItem?"updated":"created"}!`);
      setShowForm(false); setEditItem(null); setForm(blankMarket()); fetchAll();
    } catch(e) { toast(e.response?.data?.error||"Failed","error"); }
  };

  const deleteMarket = async (id) => {
    if (!window.confirm("Delete this market? This cannot be undone.")) return;
    try { await api.delete(`/superadmin/markets/${id}`); toast("✅ Deleted!"); fetchAll(); }
    catch(e) { toast(e.response?.data?.error||"Failed","error"); }
  };

  const quickStatus = async (m, status) => {
    try { await api.put(`/superadmin/markets/${m.id}`, { status }); toast(`✅ ${m.name} → ${status}`); fetchAll(); }
    catch { toast("Failed","error"); }
  };

  const recordPayment = async (m) => {
    const today    = new Date();
    const nextDate = new Date(today.getFullYear(), today.getMonth()+1, today.getDate());
    try {
      await api.put(`/superadmin/markets/${m.id}`, {
        last_payment: today.toISOString().split("T")[0],
        next_payment: nextDate.toISOString().split("T")[0],
        status: "active",
      });
      toast(`✅ Payment recorded — ${m.name} active until ${nextDate.toLocaleDateString("en-KE",{day:"numeric",month:"short"})}`);
      fetchAll();
    } catch { toast("Failed","error"); }
  };

  const startEdit = (m) => {
    setEditItem(m); setForm({...m, monthly_fee: m.monthly_fee||""}); setShowForm(true); setTab("markets");
  };

  /* ── User actions ───────────────────────────────────────────────────── */
  const saveUser = async () => {
    if (!userForm.name||!userForm.username||!userForm.pin) return toast("All fields required","error");
    if (userForm.pin.length!==4||!/^\d{4}$/.test(userForm.pin)) return toast("PIN must be 4 digits","error");
    try {
      await api.post("/superadmin/users", userForm);
      toast("✅ User created!"); setShowUForm(false);
      setUserForm({ name:"",username:"",pin:"",role:"admin" }); fetchAll();
    } catch(e) { toast(e.response?.data?.error||"Failed","error"); }
  };

  /* ── Derived data ───────────────────────────────────────────────────── */
  const filteredMarkets = markets
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || (m.location||"").toLowerCase().includes(q) || (m.contact_name||"").toLowerCase().includes(q);
      const matchStatus = filterStatus==="all" || m.status===filterStatus;
      const matchPlan   = filterPlan==="all"   || m.plan===filterPlan;
      return matchSearch && matchStatus && matchPlan;
    })
    .sort((a,b) => {
      if (sortBy==="name")    return a.name.localeCompare(b.name);
      if (sortBy==="fee")     return (b.monthly_fee||0) - (a.monthly_fee||0);
      if (sortBy==="health")  return healthScore(b) - healthScore(a);
      return new Date(b.created_at||0) - new Date(a.created_at||0);
    });

  const totalSubRev  = markets.filter(m=>m.status==="active").reduce((a,m)=>a+(parseFloat(m.monthly_fee)||0),0);
  const fmtDate      = (iso) => !iso?"—":new Date(iso).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"});
  const fmtMoney     = (n, cur="KES") => `${cur} ${Number(n||0).toLocaleString()}`;

  const ROLE_META = {
    super_admin:{ color:"#c9a84c", label:"Super Admin", icon:"👑" },
    admin:      { color:"#f87171", label:"Admin",       icon:"⚙️" },
    cashier:    { color:"#4ade80", label:"Cashier",     icon:"💰" },
    waiter:     { color:"#818cf8", label:"Waiter",      icon:"🤵" },
  };

  /* ── Sidebar tabs ───────────────────────────────────────────────────── */
  const NAV = [
    { id:"dashboard", icon:"📊", label:"Dashboard" },
    { id:"markets",   icon:"🏪", label:"Markets",   badge: markets.length },
    { id:"analytics", icon:"📈", label:"Analytics" },
    { id:"users",     icon:"👥", label:"Users",     badge: users.length },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{minHeight:"100vh",background:"#050709",fontFamily:"'Outfit',sans-serif",color:"#e2e8f0"}}>
      <style>{`
        @keyframes kpiIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .sa-nav-btn { transition: all 0.2s; }
        .sa-nav-btn:hover { background: rgba(201,168,76,0.08) !important; }
        .sa-nav-btn.active { background: rgba(201,168,76,0.12) !important; border-color: rgba(201,168,76,0.3) !important; }
        .mkt-card { transition: all 0.2s; }
        .mkt-card:hover { border-color: rgba(201,168,76,0.3) !important; }
        .sa-input { display:block;width:100%;padding:10px 14px;background:#0d1117;border:1px solid rgba(201,168,76,0.15);border-radius:8px;color:#e2e8f0;font-size:13px;font-family:Outfit,sans-serif;margin-bottom:10px;outline:none;box-sizing:border-box;transition:border-color 0.2s; }
        .sa-input:focus { border-color:rgba(201,168,76,0.5); }
        .sa-input option { background:#0d1117; }
        .sa-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;font-family:Outfit,sans-serif;transition:all 0.18s;white-space:nowrap; }
        .sa-btn:active { transform:scale(0.96); }
        .qbtn { padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:Outfit,sans-serif;border:1px solid;transition:all 0.15s; }
        .qbtn:hover { opacity:0.8; }

        /* ── Responsive ── */
        .sa-layout { display:flex; min-height:100vh; }
        .sa-sidebar { width:220px; flex-shrink:0; }
        .sa-main   { flex:1; min-width:0; padding-bottom:20px; }
        .sa-bottom-nav { display:none; }

        @media (max-width: 768px) {
          .sa-layout  { flex-direction:column; }
          .sa-sidebar { display:none; }
          .sa-main    { padding-bottom:80px; }
          .sa-bottom-nav {
            display:flex;
            position:fixed; bottom:0; left:0; right:0; z-index:500;
            background:#0a0e0b;
            border-top:1px solid rgba(201,168,76,0.15);
            padding:8px 4px;
            gap:2px;
          }
          .sa-bottom-btn {
            flex:1; display:flex; flex-direction:column; align-items:center;
            gap:3px; padding:6px 2px;
            background:none; border:none; cursor:pointer;
            font-family:Outfit,sans-serif; font-size:9px;
            color:#5c5870; transition:color 0.2s;
            border-radius:8px;
          }
          .sa-bottom-btn.active { color:#c9a84c; background:rgba(201,168,76,0.08); }
          .sa-bottom-btn span.icon { font-size:18px; }
          .sa-charts-row { grid-template-columns:1fr !important; }
          .sa-form-grid  { grid-template-columns:1fr !important; }
          .sa-filters    { flex-direction:column !important; }
          .sa-kpi-grid   { grid-template-columns:repeat(2,1fr) !important; }
          .sa-actions    { flex-wrap:wrap !important; }
          .sa-mkt-stats  { grid-template-columns:repeat(2,1fr) !important; }
          .sa-header-row { flex-direction:column !important; align-items:flex-start !important; gap:10px !important; }
          .sa-page-pad   { padding:14px !important; }
        }
      `}</style>

      <div className="sa-layout">

        {/* ── SIDEBAR ── */}
        <div className="sa-sidebar" style={{
          width:"220px", minHeight:"100vh", flexShrink:0,
          background:"linear-gradient(180deg,#0a0e0b 0%,#050709 100%)",
          borderRight:"1px solid rgba(201,168,76,0.1)",
          display:"flex", flexDirection:"column",
          position:"sticky", top:0, maxHeight:"100vh", overflowY:"auto",
        }}>
          {/* Logo */}
          <div style={{padding:"24px 20px 20px",borderBottom:"1px solid rgba(201,168,76,0.08)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#8a6a28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0}}>
                👑
              </div>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",fontWeight:"700",color:"#c9a84c",letterSpacing:"1px",lineHeight:1}}>VENDAURA</div>
                <div style={{fontSize:"9px",color:"#5c5870",letterSpacing:"2px",textTransform:"uppercase",marginTop:"2px"}}>Super Admin</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{padding:"12px 12px",flex:1}}>
            {NAV.map(n => (
              <button key={n.id}
                className={`sa-nav-btn ${tab===n.id?"active":""}`}
                onClick={() => setTab(n.id)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:"10px",
                  padding:"11px 12px", marginBottom:"4px",
                  background: tab===n.id?"rgba(201,168,76,0.12)":"transparent",
                  border:`1px solid ${tab===n.id?"rgba(201,168,76,0.3)":"transparent"}`,
                  borderRadius:"10px", cursor:"pointer", color: tab===n.id?"#c9a84c":"#94a3b8",
                  fontSize:"13px", fontWeight:tab===n.id?"600":"400", fontFamily:"Outfit,sans-serif",
                  textAlign:"left",
                }}>
                <span style={{fontSize:"16px"}}>{n.icon}</span>
                <span style={{flex:1}}>{n.label}</span>
                {n.badge !== undefined && (
                  <span style={{background:tab===n.id?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.06)",color:tab===n.id?"#c9a84c":"#5c5870",fontSize:"10px",padding:"1px 7px",borderRadius:"99px",fontWeight:"700"}}>{n.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User info */}
          <div style={{padding:"16px",borderTop:"1px solid rgba(201,168,76,0.08)"}}>
            <div style={{fontSize:"12px",color:"#5c5870",marginBottom:"4px"}}>Logged in as</div>
            <div style={{fontSize:"13px",fontWeight:"600",color:"#e2e8f0",marginBottom:"12px"}}>{user.name}</div>
            <button className="sa-btn" onClick={onLogout}
              style={{width:"100%",justifyContent:"center",background:"rgba(248,113,113,0.1)",color:"#f87171",border:"1px solid rgba(248,113,113,0.2)"}}>
              Logout
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
<div className="sa-main" style={{overflowX:"hidden"}}>

          {/* Toast */}
          {message.text && (
            <div style={{
              position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",
              zIndex:9999, padding:"10px 20px", borderRadius:"10px",
              fontSize:"13px", fontWeight:"600", whiteSpace:"nowrap",
              background: message.type==="error"?"rgba(248,113,113,0.15)":"rgba(74,222,128,0.12)",
              color:       message.type==="error"?"#f87171":"#4ade80",
              border:      `1px solid ${message.type==="error"?"rgba(248,113,113,0.3)":"rgba(74,222,128,0.3)"}`,
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
              animation:"kpiIn 0.3s ease",
            }}>{message.text}</div>
          )}

          {/* ── DASHBOARD ── */}
          {tab==="dashboard" && (
            <div className="sa-page-pad" style={{padding:"24px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",fontWeight:"600",color:"#c9a84c",marginBottom:"6px"}}>Command Center</div>
              <div style={{fontSize:"13px",color:"#5c5870",marginBottom:"24px"}}>Real-time overview of your Vendaura markets</div>

              {/* KPI Grid */}
              <div className="sa-kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"12px",marginBottom:"24px"}}>
                <KPICard icon="🏪" label="Total Markets"  value={dashboard?.markets.total||0}        color="#c9a84c" delay={0}/>
                <KPICard icon="✅" label="Active"         value={dashboard?.markets.active||0}        color="#4ade80" delay={0.05}/>
                <KPICard icon="🔄" label="Trial"          value={dashboard?.markets.trial||0}         color="#818cf8" delay={0.1}/>
                <KPICard icon="⏸️" label="Suspended"      value={dashboard?.markets.suspended||0}     color="#f87171" delay={0.15}/>
                <KPICard icon="💰" label="Monthly Sub Rev" value={`KES ${(totalSubRev||0).toLocaleString()}`} color="#c9a84c" delay={0.2}/>
                <KPICard icon="📈" label="Today Sales"    value={`KES ${(dashboard?.sales.today_revenue||0).toLocaleString()}`} color="#4ade80" delay={0.25} sub={`${dashboard?.sales.today_count||0} transactions`}/>
              </div>

              {/* Charts row */}
              <div className="sa-charts-row" style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:"16px",marginBottom:"16px"}}>

                {/* Revenue trend */}
                <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"14px",padding:"20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#c9a84c"}}>Sales Revenue</div>
                      <div style={{fontSize:"11px",color:"#5c5870"}}>Last 7 days</div>
                    </div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#4ade80",fontWeight:"700"}}>
                      KES {(dashboard?.sales.month_revenue||0).toLocaleString()}
                      <div style={{fontSize:"10px",color:"#5c5870",fontFamily:"Outfit,sans-serif",fontWeight:"400"}}>this month</div>
                    </div>
                  </div>
                  {dashboard?.trend && <AreaChart data={dashboard.trend} color="#c9a84c" height={90}/>}
                  {dashboard?.trend && (
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
                      {dashboard.trend.map((d,i) => (
                        <div key={i} style={{textAlign:"center",fontSize:"9px",color:"#5c5870"}}>
                          {new Date(d.date).toLocaleDateString("en-KE",{weekday:"short"})}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Market status donut */}
                <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"14px",padding:"20px",display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#c9a84c",marginBottom:"14px",alignSelf:"flex-start"}}>Market Status</div>
                  <DonutChart data={[
                    { value: dashboard?.markets.active||0,    color:"#4ade80" },
                    { value: dashboard?.markets.trial||0,     color:"#818cf8" },
                    { value: dashboard?.markets.suspended||0, color:"#f87171" },
                  ]}/>
                  <div style={{marginTop:"12px",width:"100%"}}>
                    {[["✅ Active","#4ade80",dashboard?.markets.active],["🔄 Trial","#818cf8",dashboard?.markets.trial],["⏸️ Suspended","#f87171",dashboard?.markets.suspended]].map(([l,c,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"4px"}}>
                        <span style={{color:c}}>{l}</span>
                        <span style={{fontWeight:"700",color:"#e2e8f0"}}>{v||0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming renewals */}
              {dashboard?.upcoming?.length > 0 && (
                <div style={{background:"rgba(201,168,76,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"14px",padding:"18px"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#c9a84c",marginBottom:"14px"}}>⏰ Payment Renewals Due</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px"}}>
                    {dashboard.upcoming.map((p,i) => (
                      <div key={i} style={{background:"#0a0e0b",border:`1px solid ${p.days_left<=2?"rgba(248,113,113,0.3)":"rgba(201,168,76,0.15)"}`,borderRadius:"10px",padding:"12px"}}>
                        <div style={{fontWeight:"600",fontSize:"13px",marginBottom:"4px"}}>{p.market}</div>
                        <div style={{fontSize:"12px",color:"#c9a84c",fontWeight:"700",marginBottom:"2px"}}>KES {(p.amount||0).toLocaleString()}</div>
                        <div style={{fontSize:"11px",color:p.days_left<=2?"#f87171":p.days_left<=5?"#c9a84c":"#5c5870",animation:p.days_left===0?"pulse 1.5s infinite":"none"}}>
                          {p.days_left===0?"🔴 Due TODAY":p.days_left===1?"🟡 Due TOMORROW":`🟢 Due in ${p.days_left} days`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MARKETS ── */}
          {tab==="markets" && (
            <div style={{padding:"24px"}}>
              <div className="sa-header-row" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#c9a84c"}}>Markets</div>
                  <div style={{fontSize:"13px",color:"#5c5870"}}>{markets.length} clients · KES {totalSubRev.toLocaleString()}/mo subscription revenue</div>
                </div>
                <button className="sa-btn" onClick={() => { setEditItem(null); setForm(blankMarket()); setShowForm(!showForm); }}
                  style={{background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)"}}>
                  {showForm&&!editItem?"✕ Cancel":"+ Add Market"}
                </button>
              </div>

              {/* Market Form */}
              {showForm && (
                <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.25)",borderRadius:"14px",padding:"20px",marginBottom:"20px",animation:"fadeSlide 0.3s ease"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#c9a84c",marginBottom:"16px"}}>{editItem?"✏️ Edit Market":"➕ New Market"}</div>
                  <div className="sa-form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                    <input className="sa-input" style={{gridColumn:"1/-1"}} placeholder="Restaurant / Business name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
                    <input className="sa-input" placeholder="City / Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
                    <input className="sa-input" placeholder="Contact person" value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})}/>
                    <input className="sa-input" placeholder="Email address" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})}/>
                    <input className="sa-input" placeholder="Phone number" value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})}/>
                    <select className="sa-input" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}>
                      {PLANS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                    <select className="sa-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                      {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                    <input className="sa-input" placeholder="Monthly fee amount" type="number" value={form.monthly_fee} onChange={e=>setForm({...form,monthly_fee:e.target.value})}/>
                    <select className="sa-input" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                      {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="sa-input" style={{gridColumn:"1/-1"}} placeholder="Backend API URL (optional)" value={form.api_url} onChange={e=>setForm({...form,api_url:e.target.value})}/>
                    <textarea className="sa-input" style={{gridColumn:"1/-1",resize:"vertical",minHeight:"70px"}} placeholder="Notes about this client..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
                  </div>
                  <div style={{display:"flex",gap:"10px"}}>
                    <button className="sa-btn" onClick={saveMarket} style={{flex:1,justifyContent:"center",background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.35)"}}>{editItem?"Save Changes":"Create Market"}</button>
                    <button className="sa-btn" onClick={()=>{setShowForm(false);setEditItem(null);setForm(blankMarket());}} style={{background:"rgba(255,255,255,0.04)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.08)"}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Search + filters */}
              <div className="sa-filters" style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
                <input className="sa-input" style={{flex:1,minWidth:"180px",marginBottom:0}} placeholder="🔍 Search markets..." value={search} onChange={e=>setSearch(e.target.value)}/>
                <select className="sa-input" style={{marginBottom:0,width:"auto"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <select className="sa-input" style={{marginBottom:0,width:"auto"}} value={filterPlan} onChange={e=>setFilterPlan(e.target.value)}>
                  <option value="all">All Plans</option>
                  {PLANS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
                <select className="sa-input" style={{marginBottom:0,width:"auto"}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="created">Newest</option>
                  <option value="name">Name</option>
                  <option value="fee">Highest Fee</option>
                  <option value="health">Health Score</option>
                </select>
              </div>

              {filteredMarkets.length===0 && (
                <div style={{textAlign:"center",padding:"48px",color:"#5c5870"}}>
                  <div style={{fontSize:"40px",marginBottom:"12px"}}>🏪</div>
                  <div style={{fontSize:"15px",fontWeight:"600",color:"#94a3b8"}}>No markets found</div>
                  <div style={{fontSize:"12px",marginTop:"4px"}}>{search?"Try a different search":"Add your first market above"}</div>
                </div>
              )}

              {filteredMarkets.map(m => {
                const hs = healthScore(m);
                const pm = PLAN_META[m.plan]   || PLAN_META.trial;
                const sm = STATUS_META[m.status]|| STATUS_META.trial;
                const daysDue = m.next_payment ? Math.ceil((new Date(m.next_payment)-new Date())/86400000) : null;
                return (
                  <div key={m.id} className="mkt-card" style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"14px",padding:"16px",marginBottom:"12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px",gap:"10px"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"4px"}}>
                          <span style={{fontWeight:"700",fontSize:"16px"}}>{m.name}</span>
                          <span style={{fontSize:"10px",fontWeight:"700",padding:"2px 10px",borderRadius:"99px",background:pm.bg,color:pm.color,textTransform:"uppercase",letterSpacing:"0.5px"}}>{pm.label}</span>
                          <span style={{fontSize:"10px",fontWeight:"700",padding:"2px 10px",borderRadius:"99px",background:sm.bg,color:sm.color}}>{sm.icon} {m.status}</span>
                        </div>
                        <div style={{fontSize:"12px",color:"#5c5870"}}>{m.location||"No location"}{m.contact_name?` · ${m.contact_name}`:""}</div>
                      </div>

                      {/* Health score */}
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <svg width="50" height="50" viewBox="0 0 50 50">
                          <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                          <circle cx="25" cy="25" r="20" fill="none" stroke={healthColor(hs)} strokeWidth="5"
                            strokeDasharray={`${(hs/100)*125.7} 125.7`} strokeLinecap="round"
                            transform="rotate(-90 25 25)" style={{transition:"stroke-dasharray 1s ease"}}/>
                          <text x="25" y="29" textAnchor="middle" fill={healthColor(hs)} fontSize="12" fontWeight="700" fontFamily="Outfit,sans-serif">{hs}</text>
                        </svg>
                        <div style={{fontSize:"9px",color:"#5c5870",textTransform:"uppercase",letterSpacing:"0.5px"}}>Health</div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="sa-mkt-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"8px",marginBottom:"12px",background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"10px"}}>
                      <div>
                        <div style={{fontSize:"10px",color:"#5c5870",marginBottom:"2px"}}>Monthly Fee</div>
                        <div style={{fontWeight:"700",color:"#c9a84c",fontSize:"13px"}}>{fmtMoney(m.monthly_fee,m.currency)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:"10px",color:"#5c5870",marginBottom:"2px"}}>Last Payment</div>
                        <div style={{fontWeight:"600",fontSize:"13px",color:"#94a3b8"}}>{fmtDate(m.last_payment)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:"10px",color:"#5c5870",marginBottom:"2px"}}>Next Due</div>
                        <div style={{fontWeight:"600",fontSize:"13px",color: daysDue!==null&&daysDue<=3?"#f87171":daysDue!==null&&daysDue<=7?"#c9a84c":"#94a3b8"}}>
                          {daysDue===null?"Not set":daysDue<0?"Overdue!":daysDue===0?"Today":daysDue===1?"Tomorrow":`${daysDue} days`}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:"10px",color:"#5c5870",marginBottom:"2px"}}>Contact</div>
                        <div style={{fontSize:"12px",color:"#94a3b8"}}>{m.contact_phone||m.contact_email||"—"}</div>
                      </div>
                    </div>

                    {/* Notes */}
                    {expanded===m.id && m.notes && (
                      <div style={{background:"rgba(201,168,76,0.04)",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"8px",padding:"10px",marginBottom:"12px",fontSize:"12px",color:"#94a3b8"}}>
                        📝 {m.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="sa-actions" style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
                      <button className="sa-btn" onClick={()=>startEdit(m)} style={{background:"rgba(255,255,255,0.04)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.08)"}}>✏️ Edit</button>
                      <button className="sa-btn" onClick={()=>recordPayment(m)} style={{background:"rgba(201,168,76,0.1)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.25)"}}>💳 Record Payment</button>
                      {m.status!=="active"    && <button className="qbtn" onClick={()=>quickStatus(m,"active")}    style={{background:"rgba(74,222,128,0.1)",color:"#4ade80",borderColor:"rgba(74,222,128,0.2)"}}>✅ Activate</button>}
                      {m.status!=="suspended" && <button className="qbtn" onClick={()=>quickStatus(m,"suspended")} style={{background:"rgba(248,113,113,0.1)",color:"#f87171",borderColor:"rgba(248,113,113,0.2)"}}>⏸ Suspend</button>}
                      {m.notes && <button className="qbtn" onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:"rgba(255,255,255,0.04)",color:"#5c5870",borderColor:"rgba(255,255,255,0.08)"}}>{expanded===m.id?"▲":"▼"} Notes</button>}
                      <button className="qbtn" onClick={()=>deleteMarket(m.id)} style={{marginLeft:"auto",background:"rgba(248,113,113,0.08)",color:"#f87171",borderColor:"rgba(248,113,113,0.15)"}}>🗑️ Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab==="analytics" && (
            <div style={{padding:"24px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#c9a84c",marginBottom:"6px"}}>Analytics</div>
              <div style={{fontSize:"13px",color:"#5c5870",marginBottom:"24px"}}>Subscription and sales performance</div>

              {/* Subscription Revenue Summary */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"12px",marginBottom:"24px"}}>
                {[
                  { label:"Annual Sub Revenue (projected)", value:`KES ${(totalSubRev*12).toLocaleString()}`, icon:"📅", color:"#c9a84c" },
                  { label:"Avg Fee Per Market",  value: markets.filter(m=>m.status==="active").length ? `KES ${Math.round(totalSubRev/markets.filter(m=>m.status==="active").length).toLocaleString()}` : "—", icon:"💰", color:"#4ade80" },
                  { label:"Month Sales Revenue", value:`KES ${(dashboard?.sales.month_revenue||0).toLocaleString()}`, icon:"📊", color:"#818cf8" },
                  { label:"Today Transactions",  value: dashboard?.sales.today_count||0, icon:"🧾", color:"#c9a84c" },
                ].map((k,i) => <KPICard key={i} {...k} delay={i*0.05}/>)}
              </div>

              {/* Plan breakdown */}
              <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#c9a84c",marginBottom:"16px"}}>Plan Distribution</div>
                {PLANS.map(plan => {
                  const count = markets.filter(m=>m.plan===plan).length;
                  const pct   = markets.length ? (count/markets.length)*100 : 0;
                  const pm    = PLAN_META[plan];
                  const rev   = markets.filter(m=>m.plan===plan&&m.status==="active").reduce((a,m)=>a+(parseFloat(m.monthly_fee)||0),0);
                  return (
                    <div key={plan} style={{marginBottom:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <span style={{fontSize:"11px",fontWeight:"700",padding:"2px 10px",borderRadius:"99px",background:pm.bg,color:pm.color,textTransform:"uppercase"}}>{pm.label}</span>
                          <span style={{fontSize:"12px",color:"#5c5870"}}>{count} markets</span>
                        </div>
                        <div style={{fontSize:"12px",color:"#c9a84c",fontWeight:"700"}}>KES {rev.toLocaleString()}/mo</div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"99px",height:"6px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:pm.color,borderRadius:"99px",transition:"width 1s ease"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revenue trend */}
              {dashboard?.trend && (
                <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"14px",padding:"20px"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#c9a84c",marginBottom:"16px"}}>7-Day Sales Trend</div>
                  <AreaChart data={dashboard.trend} color="#818cf8" height={100}/>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginTop:"8px"}}>
                    {dashboard.trend.map((d,i) => (
                      <div key={i} style={{textAlign:"center"}}>
                        <div style={{fontSize:"10px",color:"#c9a84c",fontWeight:"600"}}>{d.revenue>=1000?`${(d.revenue/1000).toFixed(1)}k`:d.revenue||""}</div>
                        <div style={{fontSize:"9px",color:"#5c5870"}}>{new Date(d.date).toLocaleDateString("en-KE",{weekday:"short"})}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {tab==="users" && (
            <div style={{padding:"24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#c9a84c"}}>Admins</div>
                  <div style={{fontSize:"13px",color:"#5c5870"}}>{users.length} admin accounts · Each admin manages their own staff</div>
                </div>
                <button className="sa-btn" onClick={()=>setShowUForm(!showUForm)} style={{background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)"}}>
                  {showUForm?"✕ Cancel":"+ Add User"}
                </button>
              </div>

              {showUForm && (
                <div style={{background:"#0d1117",border:"1px solid rgba(201,168,76,0.25)",borderRadius:"14px",padding:"20px",marginBottom:"20px",animation:"fadeSlide 0.3s ease"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#c9a84c",marginBottom:"6px"}}>➕ New Admin</div>
                  <div style={{fontSize:"12px",color:"#5c5870",marginBottom:"16px"}}>Admins manage their own cashiers and waiters</div>
                  <input className="sa-input" placeholder="Full Name" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})}/>
                  <input className="sa-input" placeholder="Username (lowercase)" value={userForm.username} onChange={e=>setUserForm({...userForm,username:e.target.value.toLowerCase()})}/>
                  <input className="sa-input" type="number" placeholder="4-digit PIN" maxLength={4} value={userForm.pin} onChange={e=>setUserForm({...userForm,pin:e.target.value.slice(0,4)})}/>
                  <select className="sa-input" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
                    <option value="admin">⚙️ Admin</option>
                    <option value="super_admin">👑 Super Admin</option>
                  </select>
                  <div style={{display:"flex",gap:"10px"}}>
                    <button className="sa-btn" onClick={saveUser} style={{flex:1,justifyContent:"center",background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.35)"}}>Create User</button>
                    <button className="sa-btn" onClick={()=>setShowUForm(false)} style={{background:"rgba(255,255,255,0.04)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.08)"}}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{display:"grid",gap:"10px"}}>
                {users.map(u => {
                  const rm = ROLE_META[u.role]||{ color:"#5c5870",label:u.role,icon:"👤" };
                  return (
                    <div key={u.id} style={{background:"#0a0e0b",border:"1px solid rgba(201,168,76,0.1)",borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px",opacity:u.active?1:0.5}}>
                      <div style={{width:"40px",height:"40px",borderRadius:"50%",background:`${rm.color}18`,border:`1px solid ${rm.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
                        {rm.icon}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                          <span style={{fontWeight:"600",fontSize:"14px"}}>{u.name}</span>
                          <span style={{fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"99px",background:`${rm.color}18`,color:rm.color,border:`1px solid ${rm.color}33`,textTransform:"uppercase"}}>{rm.label}</span>
                          {!u.active&&<span style={{fontSize:"10px",color:"#5c5870",background:"rgba(92,88,112,0.15)",padding:"2px 6px",borderRadius:"99px"}}>INACTIVE</span>}
                        </div>
                        <div style={{fontSize:"12px",color:"#5c5870",marginTop:"3px"}}>@{u.username}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="sa-bottom-nav">
        {NAV.map(n => (
          <button key={n.id} className={`sa-bottom-btn ${tab===n.id?"active":""}`} onClick={() => setTab(n.id)}>
            <span className="icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
        <button className="sa-bottom-btn" onClick={onLogout}>
          <span className="icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}