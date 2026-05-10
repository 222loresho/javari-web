import { useState, useEffect } from "react";
import api from "./api";

export default function DailyReport() {
  const [report,   setReport]   = useState(null);
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [loading,  setLoading]  = useState(false);
  const [view,     setView]     = useState("summary");
  const [expanded, setExpanded] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try { const r = await api.get(`/reports/daily?date=${date}`); setReport(r.data); }
    catch { setReport(null); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [date]);

  const mLabel  = (m) => m==="mpesa"?"📱 Mpesa":m==="card"?"💳 Card":"💵 Cash";
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit",hour12:true});

  return (
    <div style={{padding:"14px"}}>
      <div className="flex-between" style={{marginBottom:"16px"}}>
        <div className="section-title" style={{padding:0,margin:0}}>📊 Daily Report</div>
        <input type="date" className="input" style={{margin:0,width:"auto"}} value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div className="tabs" style={{marginBottom:"12px",padding:0}}>
        {["summary","items","transactions"].map(v => (
          <button key={v} className={`tab-btn ${view===v?"active":"inactive"}`} onClick={() => setView(v)}>
            {v==="summary"?"📋 Summary":v==="items"?"📦 Items":"🧾 Transactions"}
          </button>
        ))}
      </div>
      {loading && <div className="loading-bar" />}

      {report && view==="summary" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value text-green">KSh {report.total_revenue}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{report.total_transactions}</div>
            </div>
            {Object.entries(report.by_payment_method||{}).map(([m,v]) => (
              <div key={m} className="stat-card">
                <div className="stat-label">{mLabel(m)}</div>
                <div className="stat-value">KSh {v.total}</div>
                <div className="stat-sub">{v.count} sales</div>
              </div>
            ))}
          </div>
          {report.top_products?.length>0 && (
            <div className="card" style={{marginTop:"16px"}}>
              <div className="section-title" style={{padding:0,marginBottom:"12px"}}>🏆 Top Products</div>
              {report.top_products.map((p,i) => (
                <div key={i} className="flex-between" style={{marginBottom:"10px",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <span style={{background:i===0?"var(--green)":i===1?"#888":"#444",color:i===0?"#0a0a0f":"white",borderRadius:"50%",width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"bold"}}>{i+1}</span>
                    <span style={{fontSize:"13px"}}>{p.product_name}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div className="text-green text-bold text-sm">KSh {p.revenue}</div>
                    <div className="text-muted text-sm">{p.quantity} sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {report && view==="items" && (
        <div className="card">
          <div className="section-title" style={{padding:0,marginBottom:"12px"}}>📦 All Items Sold</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--card)"}}>
                {["#","Product","Qty","Revenue"].map(h => (
                  <th key={h} style={{textAlign:h==="Revenue"?"right":h==="Qty"?"center":"left",padding:"6px 4px",fontSize:"11px",color:"var(--muted)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.all_items?.map((p,i) => (
                <tr key={i} style={{borderBottom:"1px solid var(--card)"}}>
                  <td style={{padding:"8px 4px",fontSize:"12px",color:"var(--muted)"}}>{i+1}</td>
                  <td style={{padding:"8px 4px",fontSize:"13px"}}>{p.product_name}</td>
                  <td style={{padding:"8px 4px",fontSize:"13px",textAlign:"center",fontWeight:"bold"}}>{p.quantity}</td>
                  <td style={{padding:"8px 4px",fontSize:"13px",textAlign:"right",color:"var(--green)"}}>KSh {p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report && view==="transactions" && (
        <div>
          {report.sales?.map(s => (
            <div key={s.id} className="bill-card">
              <div className="bill-header">
                <div className="bill-id">
                  <span className="bill-num">#{s.id}</span>
                  <span className="text-sm">{s.cashier_name}</span>
                  <span className="text-sm text-muted">{mLabel(s.payment_method)}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="text-green text-bold">KSh {s.total}</div>
                  <div className="text-muted text-sm">{fmtTime(s.created_at)}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded===s.id?null:s.id)}>
                {expanded===s.id?"▲ Hide Items":"▼ Show Items"}
              </button>
              {expanded===s.id && (
                <div style={{marginTop:"10px",borderTop:"1px solid var(--card)",paddingTop:"10px"}}>
                  {s.items?.map((i,idx) => (
                    <div key={idx} className="flex-between text-sm" style={{marginBottom:"4px"}}>
                      <span>{i.product_name} ×{i.quantity}</span><span>KSh {i.subtotal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading&&!report && <p className="text-muted">No data for this date.</p>}
    </div>
  );
}