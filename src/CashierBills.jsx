import { useState, useEffect } from "react";
import api from "./api";
import { ReceiptText, User, ShoppingCart, LogOut, RefreshCw, Inbox, CreditCard, CheckCircle2, XCircle, X, Banknote, Smartphone, Receipt, Clock } from "lucide-react";

export default function CashierBills({ user, onLogout, onSwitchToPOS }) {
  const [submitted,   setSubmitted]   = useState([]);
  const [confirmed,   setConfirmed]   = useState([]);
  const [tab,         setTab]         = useState("submitted");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote,  setRejectNote]  = useState("");
  const [message,     setMessage]     = useState("");
  const [loading,     setLoading]     = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get("/orders/submitted"), api.get("/orders/confirmed")]);
      setSubmitted(s.data); setConfirmed(c.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const confirm = async (o) => {
    try { await api.post(`/orders/${o.id}/confirm`); setMessage(`${o.table_name} confirmed!`); fetchAll(); }
    catch { setMessage("Failed to confirm"); }
  };

  const reject = async () => {
    try {
      await api.post(`/orders/${rejectModal.id}/reject`, { note: rejectNote || "Payment rejected" });
      setMessage(`${rejectModal.table_name} sent back to waiter`);
      setRejectModal(null); setRejectNote(""); fetchAll();
    } catch { setMessage("Failed to reject"); }
  };

  const methodIcon  = (m) => m==="mpesa"?<Smartphone size={13}/>:m==="card"?<CreditCard size={13}/>:m==="billout"?<Receipt size={13}/>:<Banknote size={13}/>;
  const methodLabel = (m) => m==="mpesa"?"Mpesa":m==="card"?"Card":m==="billout"?"Billout":"Cash";
  const fmtTime     = (iso) => !iso?"":new Date(iso).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit",hour12:true});

  return (
    <div className="page">
      <div className="header">
        <h2><ReceiptText size={19}/> Cashier Bills</h2>
        <div className="header-right">
          {user && <span className="header-user" style={{display:"inline-flex",alignItems:"center",gap:"5px"}}><User size={12}/> {user.name}</span>}
          {onSwitchToPOS && <button className="btn btn-success btn-sm" onClick={onSwitchToPOS}><ShoppingCart size={13}/> POS</button>}
          <button className="btn btn-ghost btn-sm" onClick={fetchAll}><RefreshCw size={13}/></button>
          {onLogout && <button className="btn btn-danger btn-sm" onClick={onLogout}><LogOut size={13}/> Logout</button>}
        </div>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab==="submitted"?"active":"inactive"}`} onClick={() => setTab("submitted")}>
          <Inbox size={14}/> Submitted {submitted.length>0&&<span className="tab-badge">{submitted.length}</span>}
        </button>
        <button className={`tab-btn ${tab==="confirmed"?"active":"inactive"}`} onClick={() => setTab("confirmed")}>
          <CheckCircle2 size={14}/> Confirmed {confirmed.length>0&&<span className="tab-badge">{confirmed.length}</span>}
        </button>
      </div>
      {message && <div className={`toast ${message.includes("confirmed")||message.includes("sent")?"toast-success":"toast-error"}`}>{message}</div>}
      {loading  && <div className="loading-bar" />}

      {tab === "submitted" && (
        <div style={{padding:"14px"}}>
          {submitted.length===0 && <div className="empty-state"><div className="empty-icon"><Inbox size={40} strokeWidth={1.4}/></div><div className="empty-text">No submitted bills</div></div>}
          {submitted.map(o => (
            <div key={o.id} className="bill-card bill-pending" style={{border:"1px solid var(--accent)"}}>
              <div className="bill-header">
                <div className="bill-id">
                  <span className="bill-num">{o.order_number}</span>
                  <span className="bill-table">{o.table_name}</span>
                  <span className="text-muted text-sm" style={{display:"inline-flex",alignItems:"center",gap:"4px"}}><User size={12}/> {o.waiter_name}</span>
                </div>
                <span className="bill-amount-lg">KSh {o.total}</span>
              </div>
              <div className="text-muted text-sm" style={{marginBottom:"10px",display:"flex",alignItems:"center",gap:"4px"}}><Clock size={12}/> {fmtTime(o.submitted_at)}</div>
              <div style={{marginBottom:"10px"}}>
                {o.items.map((item,i) => (
                  <div key={i} className="flex-between text-sm" style={{marginBottom:"4px"}}>
                    <span>{item.product_name} ×{item.quantity}</span>
                    <span>KSh {item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="payment-box">
                <div className="payment-box-title" style={{display:"flex",alignItems:"center",gap:"5px"}}><CreditCard size={13}/> Payment Details</div>
                {o.payment_details?.length>0 ? (
                  o.payment_details.map((s,i) => (
                    <div key={i} className="flex-between text-sm" style={{marginBottom:"4px"}}>
                      <span>{methodIcon(s.method)} {methodLabel(s.method)}{s.ref?` (${s.ref})`:""}</span>
                      <strong>KSh {s.amount}</strong>
                    </div>
                  ))
                ) : <div className="text-sm text-muted">{methodIcon(o.payment_method)} {methodLabel(o.payment_method)}</div>}
              </div>
              <div className="flex-between" style={{gap:"10px"}}>
                <button className="btn btn-success" style={{flex:1}} onClick={() => confirm(o)}><CheckCircle2 size={14}/> Confirm</button>
                <button className="btn btn-danger"  style={{flex:1}} onClick={() => { setRejectModal(o); setRejectNote(""); }}><XCircle size={14}/> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "confirmed" && (
        <div style={{padding:"14px"}}>
          {confirmed.length===0 && <div className="empty-state"><div className="empty-icon"><CheckCircle2 size={40} strokeWidth={1.4}/></div><div className="empty-text">No confirmed bills</div></div>}
          {confirmed.map(o => (
            <div key={o.id} className="bill-card bill-confirmed">
              <div className="bill-header">
                <div className="bill-id">
                  <span className="bill-num">{o.order_number}</span>
                  <span className="bill-table">{o.table_name}</span>
                  <span className="text-muted text-sm" style={{display:"inline-flex",alignItems:"center",gap:"4px"}}><User size={12}/> {o.waiter_name}</span>
                </div>
                <span className="bill-amount-lg">KSh {o.total}</span>
              </div>
              <div className="text-sm text-green" style={{display:"flex",alignItems:"center",gap:"4px"}}><CheckCircle2 size={12}/> Confirmed by {o.confirmed_by} at {fmtTime(o.confirmed_at)}</div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3><XCircle size={18}/> Reject Payment</h3>
              <button className="btn-icon" onClick={() => setRejectModal(null)}><X size={15}/></button>
            </div>
            <p className="text-muted text-sm" style={{marginBottom:"12px"}}>{rejectModal.table_name} — {rejectModal.order_number} will be sent back to the waiter.</p>
            <input className="input" placeholder="Reason (optional)" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-danger" style={{flex:1}} onClick={reject}><XCircle size={14}/> Reject</button>
              <button className="btn btn-ghost"  style={{flex:1}} onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}