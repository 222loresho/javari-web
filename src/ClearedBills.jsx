import { useState, useEffect } from "react";
import api from "./api";

export default function ClearedBills() {
  const [orders,   setOrders]   = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { api.get("/orders/completed").then(r => setOrders(r.data)).catch(()=>{}); }, []);

  const printBill = (o) => import("./print").then(m => m.printBill(o));

  return (
    <div style={{padding:"14px"}}>
      <div className="section-title" style={{padding:0,marginBottom:"16px"}}>✅ Cleared Bills</div>
      {orders.length===0 && <p className="text-muted">No cleared bills yet</p>}
      {orders.map(o => (
        <div key={o.id} className="bill-card">
          <div className="bill-header">
            <div className="bill-id">
              <span className="bill-num">{o.order_number}</span>
              <span className="bill-table">{o.table_name}</span>
              <span className="text-muted text-sm">👤 {o.waiter_name}</span>
            </div>
            <span className="text-green text-bold">KSh {o.total}</span>
          </div>
          <div className="text-muted text-sm" style={{marginBottom:"10px"}}>{new Date(o.created_at).toLocaleString()}</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded===o.id?null:o.id)}>{expanded===o.id?"▲ Hide":"▼ Items"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => printBill(o)}>🖨️ Reprint</button>
          </div>
          {expanded===o.id && (
            <div style={{marginTop:"10px",borderTop:"1px solid var(--card)",paddingTop:"10px"}}>
              {o.items.map((i,idx) => (
                <div key={idx} className="flex-between text-sm" style={{marginBottom:"4px"}}>
                  <span>{i.product_name} ×{i.quantity}</span><span>KSh {i.subtotal}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}