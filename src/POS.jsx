import { useState, useEffect, useRef } from "react";
import api from "./api";

export default function POS({ user, onLogout, showBills = false, onSwitchToBills }) {
  const [products,        setProducts]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("vendaura_cart") || "[]"); }
    catch { return []; }
  });
  const [splits, setSplits] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("vendaura_splits") || JSON.stringify([{ method: "cash", amount: "", ref: "" }])); }
    catch { return [{ method: "cash", amount: "", ref: "" }]; }
  });
  const [showPinModal,    setShowPinModal]    = useState(false);
  const [pinInput,        setPinInput]        = useState("");
  const [pinError,        setPinError]        = useState("");
  const [pendingAction,   setPendingAction]   = useState("save");
  const [message,         setMessage]         = useState("");
  const [search,          setSearch]          = useState("");
  const [selectedCat,     setSelectedCat]     = useState("");
  const [pendingOrders,   setPendingOrders]   = useState([]);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [activeOrder,     setActiveOrder]     = useState(null);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [receipt,         setReceipt]         = useState(null);
  const [view,            setView]            = useState("sales");
  const [showTableEdit,        setShowTableEdit]        = useState(false);
  const [showSubmittedPin,     setShowSubmittedPin]     = useState(false);
  const [submittedPinInput,    setSubmittedPinInput]    = useState("");
  const [submittedPinError,    setSubmittedPinError]    = useState("");
  const [pendingSubmittedOrder,setPendingSubmittedOrder] = useState(null);
  const [selectedWaiter,  setSelectedWaiter]  = useState("all");
  const receiptRef = useRef();

  useEffect(() => {
    sessionStorage.setItem("vendaura_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    sessionStorage.setItem("vendaura_splits", JSON.stringify(splits));
  }, [splits]);

  const fetchProducts   = () => api.get("/products/").then(r => setProducts(r.data));
  const fetchCategories = () => api.get("/categories/").then(r => setCategories(r.data));

  const fetchOrders = async () => {
    try {
      const [pend, sub, conf] = await Promise.all([
        api.get("/orders/"),
        api.get("/orders/submitted").catch(() => ({ data: [] })),
        api.get("/orders/confirmed").catch(() => ({ data: [] }))
      ]);
      const submitted_in_tables = sub.data.filter(o => o.status === "submitted");
      setPendingOrders([
        ...pend.data.filter(o => o.status === "pending"),
        ...submitted_in_tables
      ]);
      const seen = new Set();
      const all  = [];
      [...sub.data, ...conf.data].forEach(o => {
        if (!seen.has(o.id)) { seen.add(o.id); all.push(o); }
      });
      all.sort((a, b) =>
        new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)
      );
      setSubmittedOrders(all);
    } catch {}
  };

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchOrders();
    const iv = setInterval(fetchOrders, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const filteredProducts = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = !selectedCat || p.category_id === parseInt(selectedCat);
    return ms && mc;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === product.id);
      if (ex) return prev.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i);
      return [...prev, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1, subtotal: product.price }];
    });
  };

  const removeFromCart = (id) => setCart(c => c.filter(i => i.product_id !== id));
  const updateQty = (id, delta) => setCart(c => c.map(i => {
    if (i.product_id !== id) return i;
    const q = i.quantity + delta;
    return q <= 0 ? null : { ...i, quantity: q, subtotal: q * i.price };
  }).filter(Boolean));

  const total        = cart.reduce((s, i) => s + i.subtotal, 0);
  const resetPayment = () => setSplits([{ method: "cash", amount: "", ref: "" }]);

  const getNextTableNumber = () => {
    if (!pendingOrders.length) return 1;
    const nums = pendingOrders.map(o => {
      const m = o.table_name.match(/Table (\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    return Math.max(...nums) + 1;
  };

  const loadOrder = (o) => {
    if (o.status === "submitted") {
      setPendingSubmittedOrder(o);
      setSubmittedPinInput("");
      setSubmittedPinError("");
      setShowSubmittedPin(true);
      return;
    }
    setActiveOrder(o);
    setShowTableEdit(true);
    setCart(o.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })));
    setMessage(`Editing ${o.table_name}`);
  };

  const handleSubmittedPinKey = (k) => {
    if (k === "back") { setSubmittedPinInput(p => p.slice(0,-1)); return; }
    if (k === "C")    { setSubmittedPinInput(""); return; }
    if (submittedPinInput.length >= 4) return;
    const next = submittedPinInput + k;
    setSubmittedPinInput(next);
    if (next.length === 4) {
      const saved = localStorage.getItem("userpin");
      if (next === saved) {
        setShowSubmittedPin(false);
        setSubmittedPinError("");
        const o = pendingSubmittedOrder;
        setActiveOrder(o);
        setShowTableEdit(true);
        setCart(o.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })));
        setMessage(`Editing ${o.table_name}`);
        setPendingSubmittedOrder(null);
      } else {
        setSubmittedPinError("Wrong PIN — try again");
        setSubmittedPinInput("");
      }
    }
  };

  const clearActiveOrder = () => {
    setActiveOrder(null); setCart([]); resetPayment(); setMessage(""); setShowTableEdit(false);
  };

  const saveTable = () => {
    if (!cart.length) return setMessage("Cart is empty!");
    setPendingAction("save"); setPinInput(""); setPinError(""); setShowPinModal(true);
  };

  const confirmSaveTable = async () => {
    const name = `Table ${getNextTableNumber()}`;
    try {
      await api.post("/orders/", {
        table_name:  name,
        waiter_name: user.name,
        items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        total
      });
      setMessage(`Saved as ${name}!`);
      setCart([]); setActiveOrder(null); setShowPinModal(false); fetchOrders();
    } catch { setMessage("Failed to save table"); }
  };

  const updateTable = async () => {
    if (!cart.length) return setMessage("Cart is empty!");
    const wasSubmitted = activeOrder.status === "submitted";
    try {
      await api.put(`/orders/${activeOrder.id}`, {
        items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        total
      });
      if (wasSubmitted) {
        setCart([]); setActiveOrder(null); setShowTableEdit(false);
        setMessage(`${activeOrder.table_name} updated — logging out`);
        setTimeout(() => onLogout(), 1500);
      } else {
        setMessage(`${activeOrder.table_name} updated!`);
        setCart([]); setActiveOrder(null); setShowTableEdit(false); fetchOrders();
      }
    } catch { setMessage("Failed to update"); }
  };

  const validatePayment = (orderTotal) => {
    const paid = splits.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
    if (paid < orderTotal) return `Paid KSh ${paid} is less than KSh ${orderTotal}`;
    for (const s of splits) {
      if (!s.amount || parseFloat(s.amount) <= 0) return "Enter amount for all methods";
      if (s.method === "mpesa" && !s.ref.trim()) return "Enter Mpesa code";
      if (s.method === "card"  && !s.ref.trim()) return "Enter card auth number";
    }
    return null;
  };

  const submitPayment = () => {
    const err = validatePayment(activeOrder.total);
    if (err) return setMessage(err);
    setPendingAction("submit"); setPinInput(""); setPinError(""); setShowPinModal(true);
  };

  const confirmSubmitPayment = async () => {
    try {
      const method = splits.length === 1 ? splits[0].method : "split";
      await api.post(`/orders/${activeOrder.id}/submit`, { payment_method: method, splits });
      setMessage("Payment submitted! Awaiting cashier confirmation.");
      const sid = activeOrder.id;
      setPendingOrders(prev => prev.filter(o => o.id !== sid));
      resetPayment(); setActiveOrder(null); setShowPayModal(false); setCart([]); setShowTableEdit(false);
      fetchProducts();
      setTimeout(() => fetchOrders(), 1500);
    } catch { setMessage("Submission failed!"); }
  };

  const handleCheckout = async () => {
    if (!cart.length) return setMessage("Cart is empty!");
    const err = validatePayment(total);
    if (err) return setMessage(err);
    try {
      const paid   = splits.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
      const method = splits.length === 1 ? splits[0].method : "split";
      const res    = await api.post("/sales/", { items: cart, amount_paid: paid, payment_method: method, splits });
      setReceipt({ items: cart, total, amountPaid: paid, change: res.data.change_due, cashier: user.name, paymentMethod: method, splits, date: new Date().toLocaleString() });
      setCart([]); resetPayment(); fetchProducts();
    } catch { setMessage("Sale failed!"); }
  };

  const handlePinEntry = (k) => {
    if (k === "back") { setPinInput(p => p.slice(0,-1)); return; }
    if (k === "C")    { setPinInput(""); return; }
    if (pinInput.length >= 4) return;
    const next = pinInput + k;
    setPinInput(next);
    if (next.length === 4) {
      const saved = localStorage.getItem("userpin");
      if (next === saved) {
        setPinError(""); setShowPinModal(false);
        if (pendingAction === "submit") confirmSubmitPayment();
        else confirmSaveTable();
      } else {
        setPinError("Wrong PIN — try again"); setPinInput("");
      }
    }
  };

  const printBill    = (o) => import("./print").then(m => m.printBill(o));
  const printReceipt = ()  => import("./print").then(m => m.printReceipt(receipt));

  const SplitFields = ({ orderTotal }) => (
    <div className="split-wrap">
      <div className="split-label">Payment Method(s)</div>
      {splits.map((split, idx) => (
        <div key={idx} className="split-row">
          <div className="split-top">
            <select className="input" style={{ margin: 0, flex: 1 }} value={split.method}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s, method: e.target.value, ref: ""} : s))}>
              <option value="cash">💵 Cash</option>
              <option value="mpesa">📱 Mpesa</option>
              <option value="card">💳 Card</option>
              <option value="billout">📋 Billout</option>
            </select>
            <input className="input" type="number" placeholder="Amount" style={{ margin: 0, flex: 1 }}
              value={split.amount}
              onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s, amount: e.target.value} : s))} />
            {splits.length > 1 && (
              <button className="btn-icon-sm" onClick={() => setSplits(splits.filter((_,i) => i!==idx))}>✕</button>
            )}
          </div>
          {split.method === "mpesa"   && <input className="input" style={{margin:0,marginTop:"6px"}} placeholder="📱 Mpesa code"       value={split.ref} onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s, ref: e.target.value.toUpperCase()} : s))} />}
          {split.method === "card"    && <input className="input" style={{margin:0,marginTop:"6px"}} placeholder="💳 Card auth number" value={split.ref} onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s, ref: e.target.value.toUpperCase()} : s))} />}
          {split.method === "billout" && <input className="input" style={{margin:0,marginTop:"6px"}} placeholder="📋 Billout ref"      value={split.ref} onChange={e => setSplits(splits.map((s,i) => i===idx ? {...s, ref: e.target.value.toUpperCase()} : s))} />}
        </div>
      ))}
      <button className="btn-add-split" onClick={() => setSplits([...splits, { method: "cash", amount: "", ref: "" }])}>+ Add Payment Method</button>
      <div className="split-total">Paid: <strong>KSh {splits.reduce((a,s) => a+(parseFloat(s.amount)||0), 0)}</strong> / KSh {orderTotal}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <h2>🛒 POS — <span style={{fontFamily:"Cormorant Garamond,serif",color:"var(--green)"}}>Vendaura</span></h2>
        <div className="header-right">
          <span className="header-user">👤 {user.name}</span>
          {onSwitchToBills && <button className="btn btn-ghost btn-sm" onClick={onSwitchToBills}>💰 Bills</button>}
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="nav-tabs">
        <button className={`nav-tab ${view==="sales"?"active":""}`} onClick={() => setView("sales")}>🛒 Sales</button>
        <button className={`nav-tab ${view==="tables"?"active":""}`} onClick={() => { setView("tables"); fetchOrders(); }}>
          🪑 Tables {pendingOrders.length > 0 && <span className="nav-badge">{pendingOrders.length}</span>}
        </button>
        <button className={`nav-tab ${view==="bills"?"active":""}`} onClick={() => { setView("bills"); fetchOrders(); }}>
          💰 Bills {submittedOrders.length > 0 && <span className="nav-badge">{submittedOrders.length}</span>}
        </button>
      </div>

      {message && (
        <div className={`toast ${message.includes("saved")||message.includes("updated")||message.includes("submitted")||message.includes("Editing") ? "toast-success" : "toast-error"}`}>
          {message}
        </div>
      )}

      {view === "tables" && (
        <div className="tables-view">
          {pendingOrders.length === 0 && !showTableEdit ? (
            <div className="empty-state">
              <div className="empty-icon">🪑</div>
              <div className="empty-text">No active tables</div>
              <div className="empty-sub">Go to Sales to start a new order</div>
            </div>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <>
                  <div className="section-header">
                    <span className="section-title">Awaiting Payment</span>
                    <span className="section-count">{pendingOrders.length} tables</span>
                  </div>
                  <div className="filter-bubbles">
                    <button className={`bubble ${selectedWaiter==="all"?"bubble-active":""}`} onClick={() => setSelectedWaiter("all")}>
                      👥 All ({pendingOrders.length})
                    </button>
                    {[...new Set(pendingOrders.map(o => o.waiter_name))].map(w => (
                      <button key={w} className={`bubble ${selectedWaiter===w?"bubble-active":""}`} onClick={() => setSelectedWaiter(w)}>
                        👤 {w} ({pendingOrders.filter(o => o.waiter_name===w).length})
                      </button>
                    ))}
                  </div>
                  <div className="table-grid">
                    {pendingOrders.filter(o => selectedWaiter==="all" || o.waiter_name===selectedWaiter).map(o => (
                      <div key={o.id} className={`table-card ${activeOrder?.id===o.id?"table-card-active":""}`}>
                        <div className="table-card-body" onClick={() => loadOrder(o)}>
                          <div className="table-card-header">
                            <span className="table-number">{o.table_name}</span>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"3px"}}>
                              <span className="table-order">{o.order_number}</span>
                              {o.status==="submitted" && <span style={{fontSize:"9px",background:"rgba(245,159,0,0.2)",color:"#f59f00",padding:"1px 6px",borderRadius:"99px",fontWeight:"700"}}>SUBMITTED</span>}
                            </div>
                          </div>
                          <div className="table-meta">
                            <span>👤 {o.waiter_name}</span>
                            <span>🕐 {new Date(o.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                          </div>
                          <div className="table-meta">
                            <span>{o.items?.length||0} items</span>
                            <span className="table-total">KSh {o.total}</span>
                          </div>
                        </div>
                        <div className="table-actions">
                          <button className="tbl-btn tbl-btn-bill"   onClick={e => { e.stopPropagation(); printBill(o); }}>🧾 Bill</button>
                          <button className="tbl-btn tbl-btn-submit" onClick={e => { e.stopPropagation(); loadOrder(o); setShowPayModal(true); }}>💳 Submit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {showTableEdit && activeOrder && (
                <div className="edit-panel">
                  <div className="edit-panel-header">
                    <span>✏️ {activeOrder.table_name} — {activeOrder.order_number}</span>
                    <button className="btn-icon" onClick={clearActiveOrder}>✕</button>
                  </div>
                  {cart.map(item => (
                    <div key={item.product_id} className="cart-item">
                      <div className="cart-item-row">
                        <span className="cart-item-name">{item.product_name}</span>
                        <span className="cart-item-price">KSh {item.subtotal}</span>
                      </div>
                      <div className="cart-qty-row">
                        <button className="qty-btn" onClick={() => updateQty(item.product_id,-1)}>−</button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.product_id,+1)}>+</button>
                        <button className="btn-icon text-sm" style={{marginLeft:"auto"}} onClick={() => removeFromCart(item.product_id)}>remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="total-row"><span>Total</span><span className="total-amount">KSh {total}</span></div>
                  <div className="edit-actions">
                    <button className="btn btn-success" style={{flex:1}} onClick={updateTable}>🔄 Update</button>
                    <button className="btn btn-primary" style={{flex:1}} onClick={() => setShowPayModal(true)}>💳 Submit</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === "bills" && (
        <div className="bills-view">
          <div className="section-header">
            <span className="section-title">💰 My Submitted Bills</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
          </div>
          {submittedOrders.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No submitted bills yet</div>
            </div>
          )}
          {submittedOrders.filter(o => {
            if (o.status === "confirmed") {
              return new Date(o.confirmed_at) > new Date(Date.now() - 10*60*1000);
            }
            return true;
          }).map(o => (
            <div key={o.id} className={`bill-card ${o.status==="confirmed"?"bill-confirmed":"bill-pending"}`}>
              <div className="bill-header">
                <div className="bill-id">
                  <span className="bill-num">{o.order_number}</span>
                  <span className="bill-table">{o.table_name}</span>
                </div>
                <span className={`bill-badge ${o.status==="confirmed"?"badge-green":"badge-amber"}`}>
                  {o.status === "confirmed" ? "✅ Confirmed" : "⏳ Awaiting"}
                </span>
              </div>
              <div className="bill-amount">KSh {o.total}</div>
              {o.status==="confirmed" && o.confirmed_by && <div className="bill-confirmed-by">✅ Confirmed by {o.confirmed_by}</div>}
              {o.rejection_note && <div className="bill-rejected">❌ Rejected: {o.rejection_note}</div>}
            </div>
          ))}
        </div>
      )}

      {view === "sales" && (
        <div className="pos-layout">
          <div className="products-panel">
            <div className="search-bar">
              <input className="input" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{marginBottom:0}} />
              <select className="input" style={{marginBottom:0,width:"auto",minWidth:"110px"}} value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="product-grid">
              {filteredProducts.length === 0 && (
                <div className="empty-state" style={{gridColumn:"1/-1"}}>
                  <div className="empty-icon">🔍</div>
                  <div className="empty-text">No products found</div>
                </div>
              )}
              {filteredProducts.map(p => (
                <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">KSh {p.price}</div>
                  <div className="product-stock">Stock: {p.stock}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-panel">
            {activeOrder && (
              <div className="active-order-banner">
                <span>📋 {activeOrder.table_name} — {activeOrder.order_number}</span>
                <button className="btn-icon" onClick={clearActiveOrder}>✕</button>
              </div>
            )}
            <div className="cart-body">
              <div className="section-title" style={{padding:"14px 14px 0"}}>Cart</div>
              {cart.length === 0 && (
                <div className="empty-state" style={{padding:"24px"}}>
                  <div className="empty-icon" style={{fontSize:"32px"}}>🛒</div>
                  <div className="empty-text" style={{fontSize:"13px"}}>Tap a product to add</div>
                </div>
              )}
              {cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-row">
                    <span className="cart-item-name">{item.product_name}</span>
                    <span className="cart-item-price">KSh {item.subtotal}</span>
                  </div>
                  <div className="cart-qty-row">
                    <button className="qty-btn" onClick={() => updateQty(item.product_id,-1)}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.product_id,+1)}>+</button>
                    <button className="btn-icon text-sm" style={{marginLeft:"auto"}} onClick={() => removeFromCart(item.product_id)}>remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">KSh {total}</span>
              </div>
              {!activeOrder ? (
                <button className="btn btn-secondary full-btn mb" onClick={saveTable}>💾 Save Table</button>
              ) : (
                <button className="btn btn-outline-green full-btn mb" onClick={updateTable}>🔄 Update Table</button>
              )}
              {activeOrder ? (
                <button className="btn btn-primary full-btn" onClick={() => setShowPayModal(true)}>💳 Submit Payment</button>
              ) : (
                <>
                  <SplitFields orderTotal={total} />
                  <button className="btn btn-primary full-btn" onClick={handleCheckout}>✅ Complete Sale</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayModal && activeOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>💳 Submit Payment</h3>
              <button className="btn-icon" onClick={() => { setShowPayModal(false); resetPayment(); setMessage(""); }}>✕</button>
            </div>
            <div className="modal-order-info">
              <span className="pill">{activeOrder.order_number}</span>
              <span className="pill">{activeOrder.table_name}</span>
              <span className="pill">👤 {activeOrder.waiter_name}</span>
            </div>
            <div className="modal-divider" />
            {activeOrder.items?.map(i => (
              <div key={i.product_id} className="modal-row">
                <span>{i.product_name} ×{i.quantity}</span>
                <span>KSh {i.subtotal}</span>
              </div>
            ))}
            <div className="modal-divider" />
            <div className="modal-total">
              <span>Total</span>
              <span className="modal-total-amount">KSh {activeOrder.total}</span>
            </div>
            <SplitFields orderTotal={activeOrder.total} />
            {message && <div className="message message-error">{message}</div>}
            <div className="modal-actions">
              <button className="btn btn-primary" style={{flex:1}} onClick={submitPayment}>💳 Submit</button>
              <button className="btn btn-ghost"   style={{flex:1}} onClick={() => { setShowPayModal(false); resetPayment(); setMessage(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="modal-overlay">
          <div className="modal modal-receipt">
            <div ref={receiptRef}>
              <div className="receipt-header">
                <div className="receipt-logo">VENDAURA</div>
                <div className="receipt-sub">Loresho, Nairobi</div>
              </div>
              <div className="receipt-divider" />
              <div className="receipt-row"><span>Cashier</span><span>{receipt.cashier}</span></div>
              <div className="receipt-row"><span>Date</span><span>{receipt.date.split(",")[0]}</span></div>
              <div className="receipt-divider" />
              {receipt.items.map((i,idx) => (
                <div key={idx} className="receipt-row"><span>{i.product_name} ×{i.quantity}</span><span>KSh {i.subtotal}</span></div>
              ))}
              <div className="receipt-divider" />
              <div className="receipt-row receipt-total-row"><span>TOTAL</span><span>KSh {receipt.total}</span></div>
              {receipt.splits?.map((s,i) => (
                <div key={i} className="receipt-row">
                  <span>{s.method==="mpesa"?"📱 Mpesa":s.method==="card"?"💳 Card":s.method==="billout"?"📋 Billout":"💵 Cash"}{s.ref?` (${s.ref})`:""}</span>
                  <span>KSh {s.amount}</span>
                </div>
              ))}
              <div className="receipt-divider" />
              <div className="receipt-thanks">Thank you for visiting Vendaura 🙏</div>
            </div>
            <div className="modal-actions" style={{marginTop:"16px"}}>
              <button className="btn btn-dark" style={{flex:1}} onClick={printReceipt}>🖨️ Print</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={() => setReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showSubmittedPin && (
        <div className="modal-overlay">
          <div className="modal pin-modal">
            <div className="pin-modal-title">🔒 Verify Identity</div>
            <div className="pin-modal-sub">
              Enter your PIN to edit {pendingSubmittedOrder?.table_name}
            </div>
            <div style={{background:"rgba(245,159,0,0.1)",border:"1px solid rgba(245,159,0,0.3)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"#f59f00",textAlign:"center"}}>
              ⚠️ This order was submitted for payment. Editing will reset the submission and log you out.
            </div>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${submittedPinInput.length>i?"filled":""}`}>
                  {submittedPinInput[i] ? "●" : ""}
                </div>
              ))}
            </div>
            {submittedPinError && <div className="message message-error" style={{margin:"0 0 8px"}}>{submittedPinError}</div>}
            <div className="keypad">
              {[1,2,3,4,5,6,7,8,9,"C",0,"⌫"].map((k,i) => (
                <button key={i}
                  className={`keypad-btn ${k==="C"?"keypad-clear":""} ${k==="⌫"?"keypad-back":""}`}
                  onClick={() => handleSubmittedPinKey(k==="⌫"?"back":String(k))}>{k}</button>
              ))}
            </div>
            <button className="btn btn-ghost full-btn" onClick={() => { setShowSubmittedPin(false); setPendingSubmittedOrder(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal pin-modal">
            <div className="pin-modal-title">
              🔒 {pendingAction==="submit" ? "Confirm Payment" : "Save Table"}
            </div>
            <div className="pin-modal-sub">
              Enter your PIN to {pendingAction==="submit" ? "submit this payment" : "save this table"}
            </div>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${pinInput.length>i?"filled":""}`}>
                  {pinInput[i] ? "●" : ""}
                </div>
              ))}
            </div>
            {pinError && <div className="message message-error" style={{margin:"0 0 8px"}}>{pinError}</div>}
            <div className="keypad">
              {[1,2,3,4,5,6,7,8,9,"C",0,"⌫"].map((k,i) => (
                <button key={i}
                  className={`keypad-btn ${k==="C"?"keypad-clear":""} ${k==="⌫"?"keypad-back":""}`}
                  onClick={() => handlePinEntry(k==="⌫"?"back":String(k))}>{k}</button>
              ))}
            </div>
            <button className="btn btn-ghost full-btn" onClick={() => setShowPinModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}