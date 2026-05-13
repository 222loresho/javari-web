import { useState, useEffect } from "react";
import api from "./api";

export default function UserManagement() {
  const [users,    setUsers]    = useState([]);
  const [message,  setMessage]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form,     setForm]     = useState({ name:"", username:"", role:"cashier", pin:"" });

  const fetchUsers = () => api.get("/users/").then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const resetForm = () => { setForm({name:"",username:"",role:"cashier",pin:""}); setEditUser(null); setShowForm(false); };

  const saveUser = async () => {
    if (!form.name.trim()||!form.username.trim()) return setMessage("Name and username required");
    if (!editUser&&!form.pin)                      return setMessage("PIN is required");
    if (form.pin&&(form.pin.length!==4||!/^\d{4}$/.test(form.pin))) return setMessage("PIN must be exactly 4 digits");
    try {
      if (editUser) { await api.put(`/users/${editUser.id}`, form); setMessage("User updated!"); }
      else          { await api.post("/users/", form);              setMessage("User created!"); }
      resetForm(); fetchUsers();
    } catch(e) { setMessage(e.response?.data?.error||"Failed"); }
  };

  const toggleActive = async (u) => {
    try { await api.put(`/users/${u.id}`, { active: !u.active }); fetchUsers(); }
    catch { setMessage("Failed"); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try { await api.delete(`/users/${u.id}`); setMessage("Deleted!"); fetchUsers(); }
    catch(e) { setMessage(e.response?.data?.error||"Failed"); }
  };

  const roleColor = (r) => r==="admin"?"var(--red)":r==="waiter"?"#f0a500":"var(--accent)";

  return (
    <div style={{padding:"14px"}}>
      <div className="flex-between" style={{marginBottom:"16px"}}>
        <div className="section-title" style={{padding:0,margin:0}}>👥 Users</div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm&&!editUser?"✕ Cancel":"+ Add User"}
        </button>
      </div>
      {message && <div className={`toast ${message.includes("created")||message.includes("updated")||message.includes("Deleted")?"toast-success":"toast-error"}`}>{message}</div>}
      {showForm && (
        <div className="card" style={{border:"1px solid var(--accent)",marginBottom:"16px"}}>
          <div className="section-title" style={{padding:0,marginBottom:"12px"}}>{editUser?"✏️ Edit":"➕ New User"}</div>
          <input className="input" placeholder="Full Name"   value={form.name}     onChange={e => setForm({...form,name:e.target.value})} />
          <input className="input" placeholder="Username"    value={form.username} onChange={e => setForm({...form,username:e.target.value.toLowerCase()})} disabled={!!editUser} />
          <input className="input" type="number" placeholder={editUser?"New PIN (blank=keep)":"4-digit PIN"} maxLength={4} value={form.pin} onChange={e => setForm({...form,pin:e.target.value.slice(0,4)})} />
          <select className="input" value={form.role} onChange={e => setForm({...form,role:e.target.value})}>
            <option value="cashier">💰 Cashier</option>
            <option value="waiter">🤵 Waiter</option>
          </select>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={saveUser}>{editUser?"Save":"Create"}</button>
            <button className="btn btn-ghost"   onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
      {users.map(u => (
        <div key={u.id} className="admin-item" style={{opacity:u.active?1:0.55}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"4px"}}>
              <span className="admin-item-name">{u.name}</span>
              <span style={{background:roleColor(u.role),color:"white",fontSize:"10px",padding:"2px 8px",borderRadius:"10px",fontWeight:"bold"}}>{u.role.toUpperCase()}</span>
              {!u.active&&<span style={{background:"#555",color:"white",fontSize:"10px",padding:"2px 6px",borderRadius:"10px"}}>INACTIVE</span>}
            </div>
            <div className="admin-item-sub">@{u.username} · PIN: {u.pin||"----"}</div>
          </div>
          <div className="admin-item-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(u); setForm({name:u.name,username:u.username,role:u.role,pin:""}); setShowForm(true); }}>✏️</button>
            <button className="btn btn-sm" style={{background:u.active?"#555":"var(--accent)",color:"white"}} onClick={() => toggleActive(u)}>{u.active?"Deactivate":"Activate"}</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}