import { useState, useEffect } from "react";
import api from "./api";
import ClearedBills   from "./ClearedBills";
import UserManagement from "./UserManagement";
import DailyReport    from "./DailyReport";
import LowStock       from "./LowStock";
import RevenueChart   from "./RevenueChart";

export default function Admin({ user, onLogout, onSwitchToPOS }) {
  const [tab,         setTab]         = useState("products");
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [sales,       setSales]       = useState([]);
  const [message,     setMessage]     = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [lowCount,    setLowCount]    = useState(0);
  const [newProduct,  setNewProduct]  = useState({ name:"", price:"", stock:"", category_id:"" });
  const [newCat,      setNewCat]      = useState("");

  const fetchProducts   = () => api.get("/products/").then(r => setProducts(r.data));
  const fetchCategories = () => api.get("/categories/").then(r => setCategories(r.data));
  const fetchSales      = () => api.get("/sales/").then(r => setSales(r.data));
  useEffect(() => { fetchProducts(); fetchCategories(); fetchSales(); }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return setMessage("Name and price required");
    try {
      await api.post("/products/", { ...newProduct, category_id: newProduct.category_id || null });
      setNewProduct({ name:"",price:"",stock:"",category_id:"" }); fetchProducts(); setMessage("Product added!");
    } catch(e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/products/${editProduct.id}`, editProduct);
      setEditProduct(null); fetchProducts(); setMessage("Updated!");
    } catch(e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); setMessage("Deleted!"); }
    catch(e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const addCategory = async () => {
    if (!newCat) return setMessage("Category name required");
    try { await api.post("/categories/", { name: newCat }); setNewCat(""); fetchCategories(); setMessage("Category added!"); }
    catch(e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const tabs = [
    { id:"products",   label:"📦 Products" },
    { id:"categories", label:"🏷️ Categories" },
    { id:"sales",      label:"📊 Sales" },
    { id:"cleared",    label:"✅ Cleared" },
    { id:"users",      label:"👥 Users" },
    { id:"report",     label:"📊 Daily" },
    { id:"chart",      label:"📈 Revenue" },
    { id:"lowstock",   label: lowCount > 0 ? `⚠️ Stock (${lowCount})` : "⚠️ Stock" },
  ];

  return (
    <div className="page">
      <div className="header">
        <h2>⚙️ Admin — <span style={{fontFamily:"Cormorant Garamond,serif",color:"var(--green)"}}>Javari</span></h2>
        <div className="header-right">
          <span className="header-user">👤 {user.name}</span>
          {onSwitchToPOS && <button className="btn btn-success btn-sm" onClick={onSwitchToPOS}>🛒 POS</button>}
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":"inactive"}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {message && <div className={`toast ${message.includes("added")||message.includes("Updated")||message.includes("Deleted")?"toast-success":"toast-error"}`}>{message}</div>}

      {tab === "products" && (
        <div style={{padding:"14px"}}>
          <div className="card">
            <div className="section-title" style={{padding:0,marginBottom:"12px"}}>Add Product</div>
            <input className="input" placeholder="Product name"    value={newProduct.name}        onChange={e => setNewProduct({...newProduct,name:e.target.value})} />
            <input className="input" placeholder="Price (KSh)"    type="number" value={newProduct.price}  onChange={e => setNewProduct({...newProduct,price:e.target.value})} />
            <input className="input" placeholder="Stock quantity"  type="number" value={newProduct.stock}  onChange={e => setNewProduct({...newProduct,stock:e.target.value})} />
            <select className="input" value={newProduct.category_id} onChange={e => setNewProduct({...newProduct,category_id:e.target.value})}>
              <option value="">No Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn btn-primary full-btn" onClick={addProduct}>Add Product</button>
          </div>
          {editProduct && (
            <div className="card" style={{border:"1px solid var(--accent)"}}>
              <div className="section-title" style={{padding:0,marginBottom:"12px"}}>✏️ Edit Product</div>
              <input className="input" value={editProduct.name}  onChange={e => setEditProduct({...editProduct,name:e.target.value})} />
              <input className="input" type="number" value={editProduct.price} onChange={e => setEditProduct({...editProduct,price:e.target.value})} />
              <input className="input" type="number" value={editProduct.stock} onChange={e => setEditProduct({...editProduct,stock:e.target.value})} />
              <select className="input" value={editProduct.category_id||""} onChange={e => setEditProduct({...editProduct,category_id:e.target.value})}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="modal-actions">
                <button className="btn btn-success" onClick={saveEdit}>Save</button>
                <button className="btn btn-ghost"   onClick={() => setEditProduct(null)}>Cancel</button>
              </div>
            </div>
          )}
          {products.map(p => (
            <div key={p.id} className="admin-item">
              <div>
                <div className="admin-item-name">{p.name}</div>
                <div className="admin-item-sub">KSh {p.price} | Stock: {p.stock} | {categories.find(c=>c.id===p.category_id)?.name||"No category"}</div>
              </div>
              <div className="admin-item-actions">
                <button className="btn btn-ghost btn-sm"  onClick={() => setEditProduct(p)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "categories" && (
        <div style={{padding:"14px"}}>
          <div className="card">
            <div className="section-title" style={{padding:0,marginBottom:"12px"}}>Add Category</div>
            <input className="input" placeholder="Category name" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button className="btn btn-primary full-btn" onClick={addCategory}>Add</button>
          </div>
          {categories.map(c => <div key={c.id} className="card" style={{padding:"12px 16px"}}>{c.name}</div>)}
        </div>
      )}

      {tab === "sales" && (
        <div style={{padding:"14px"}}>
          {sales.length===0 && <p className="text-muted">No sales recorded yet</p>}
          {sales.map(s => (
            <div key={s.id} className="admin-item">
              <div>
                <div className="admin-item-name">#{s.id} — {s.cashier_name}</div>
                <div className="admin-item-sub">{s.payment_method} | {new Date(s.created_at).toLocaleString()}</div>
              </div>
              <div className="text-green text-bold">KSh {s.total}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "cleared"  && <ClearedBills />}
      {tab === "users"    && <UserManagement />}
      {tab === "report"   && <DailyReport />}
      {tab === "chart"    && <RevenueChart />}
      {tab === "lowstock" && <LowStock onCount={setLowCount} />}
    </div>
  );
}