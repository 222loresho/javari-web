import { useState, useEffect } from "react";
import api from "./api";

export default function LowStock({ onCount }) {
  const [items,     setItems]     = useState([]);
  const [threshold, setThreshold] = useState(10);

  const fetchLow = async () => {
    try {
      const r = await api.get(`/products/low-stock?threshold=${threshold}`);
      setItems(r.data);
      if (onCount) onCount(r.data.length);
    } catch { setItems([]); }
  };

  useEffect(() => { fetchLow(); }, [threshold]);

  const stockColor = (s) => s===0?"var(--red)":s<=5?"#f0a500":"var(--accent)";

  return (
    <div style={{padding:"14px"}}>
      <div className="flex-between" style={{marginBottom:"16px"}}>
        <div className="section-title" style={{padding:0,margin:0}}>⚠️ Low Stock Alert</div>
        <select className="input" style={{margin:0,width:"auto"}} value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
          {[5,10,15,20].map(n => <option key={n} value={n}>Below {n}</option>)}
        </select>
      </div>
      {items.length===0 && <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">All products well stocked</div></div>}
      {items.length>0 && <div className="card" style={{background:"rgba(220,38,38,0.08)",border:"1px solid var(--red)",marginBottom:"16px"}}><span style={{color:"var(--red)",fontWeight:"bold"}}>⚠️ {items.length} product(s) running low!</span></div>}
      {items.map(p => (
        <div key={p.id} className="admin-item">
          <div>
            <div className="admin-item-name">{p.name}</div>
            <div className="admin-item-sub">KSh {p.price}</div>
          </div>
          <div style={{background:stockColor(p.stock),color:"white",padding:"4px 14px",borderRadius:"20px",fontWeight:"bold",fontSize:"14px"}}>
            {p.stock===0?"OUT OF STOCK":`${p.stock} left`}
          </div>
        </div>
      ))}
    </div>
  );
}