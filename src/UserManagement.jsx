import { useState, useEffect } from "react";
import api from "./api";
import { Users, X, UserPlus, Pencil, Trash2, Search, ShieldCheck, Power, PowerOff, KeyRound } from "lucide-react";

const ROLE_META = {
  manager: { label: "Manager", color: "#38bdf8" },
  cashier: { label: "Cashier", color: "#2fbf71" },
  waiter:  { label: "Waiter",  color: "#818cf8" },
};

const initials = (name) =>
  (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export default function UserManagement({ user }) {
  const isAdmin = user?.role === "admin";
  const [users,      setUsers]      = useState([]);
  const [message,    setMessage]    = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [form,       setForm]       = useState({ name:"", username:"", role:"", pin:"", manager_id:"" });
  const [busy,       setBusy]       = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinForm,     setPinForm]     = useState({ current:"", next:"", confirm:"" });
  const [pinBusy,     setPinBusy]     = useState(false);

  const requiredPin = 4;

  const fetchUsers = () => api.get("/users/").then(r => setUsers(r.data)).catch(() => {});

  const blankForm = () => ({
    name:"", username:"", role: isAdmin ? "manager" : "cashier", pin:"", manager_id:""
  });

  useEffect(() => {
    fetchUsers();
    setForm(blankForm());
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const resetForm = () => {
    setForm(blankForm());
    setEditUser(null);
    setShowForm(false);
  };

  const startEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, username: u.username, role: u.role, pin: "", manager_id: u.manager_id ? String(u.manager_id) : "" });
    setShowForm(true);
  };

  const saveUser = async () => {
    if (!form.name.trim())     return setMessage("Name is required");
    if (!form.username.trim()) return setMessage("Username is required");
    if (!editUser && !form.pin) return setMessage("PIN is required");
    if (form.pin && !/^\d{4}$/.test(form.pin)) return setMessage("PIN must be exactly 4 digits");
    if (isAdmin && form.role !== "manager" && !form.manager_id) return setMessage("Assign this staff member to a manager");
    setBusy(true);
    try {
      if (editUser) {
        const payload = { name: form.name };
        if (form.pin) payload.pin = form.pin;
        if (isAdmin) {
          payload.role = form.role;
          payload.manager_id = form.role === "manager" ? null : (form.manager_id || null);
        }
        await api.put(`/users/${editUser.id}`, payload);
        setMessage("User updated!");
      } else {
        const payload = { name: form.name, username: form.username, role: form.role, pin: form.pin };
        if (isAdmin && form.role !== "manager") payload.manager_id = form.manager_id || null;
        await api.post("/users/", payload);
        setMessage("User created!");
      }
      resetForm();
      fetchUsers();
    } catch (e) {
      setMessage(e.response?.data?.error || "Failed");
    } finally { setBusy(false); }
  };

  const toggleActive = async (u) => {
    const next = !u.active;
    if (!next && !window.confirm(`Deactivate ${u.name}? They will not be able to log in.`)) return;
    try {
      await api.put(`/users/${u.id}`, { active: next });
      setMessage(next ? "User activated" : "User deactivated");
      fetchUsers();
    } catch (e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const deleteUser = async (u) => {
    const extra = u.role === "manager" ? " Their staff must be moved first." : "";
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.${extra}`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setMessage("User deleted!");
      fetchUsers();
    } catch (e) { setMessage(e.response?.data?.error || "Failed"); }
  };

  const changePin = async () => {
    if (!pinForm.current)            return setMessage("Enter your current PIN");
    if (!/^\d{4}$/.test(pinForm.next)) return setMessage("New PIN must be exactly 4 digits");
    if (pinForm.next !== pinForm.confirm) return setMessage("New PINs do not match");
    setPinBusy(true);
    try {
      const res = await api.post("/auth/change-pin", { current_pin: pinForm.current, new_pin: pinForm.next });
      localStorage.setItem("pinlen", String(res.data.pin_length || requiredPin));
      setPinForm({ current:"", next:"", confirm:"" });
      setShowPinForm(false);
      setMessage("PIN updated!");
    } catch (e) {
      setMessage(e.response?.data?.error || "Failed");
    } finally { setPinBusy(false); }
  };

  const filtered = users.filter(u => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const managers = filtered.filter(u => u.role === "manager");
  const staff    = filtered.filter(u => u.role !== "manager");
  const groups   = isAdmin
    ? [{ title:"Managers", rows: managers }, { title:"Staff", rows: staff }]
    : [{ title:"My Staff", rows: staff }];

  const renderRow = (u) => {
    const meta = ROLE_META[u.role] || { label: u.role, color: "var(--muted)" };
    return (
      <div key={u.id} className="admin-item" style={{ opacity:u.active?1:0.55 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", minWidth:0 }}>
          <div className="um-avatar" style={{ background:`${meta.color}1f`, borderColor:`${meta.color}55`, color:meta.color }}>
            {initials(u.name)}
          </div>
          <div style={{ minWidth:0 }}>
            <div className="um-name-row">
              <span className="admin-item-name">{u.name}</span>
              <span className="um-badge" style={{ background:`${meta.color}1f`, color:meta.color, borderColor:`${meta.color}44` }}>{meta.label}</span>
              {!u.active && <span className="um-badge" style={{ background:"rgba(120,120,120,0.18)", color:"var(--muted)", borderColor:"var(--border)" }}>Inactive</span>}
            </div>
            <div className="admin-item-sub">
              @{u.username}
              {u.role === "manager" && ` · ${users.filter(s => s.manager_id === u.id).length} staff`}
              {u.manager_name && ` · Manager: ${u.manager_name}`}
            </div>
          </div>
        </div>
        <div className="admin-item-actions">
          <button className="btn btn-ghost btn-sm" aria-label={`Edit ${u.name}`} onClick={() => startEdit(u)}><Pencil size={14}/></button>
          <button
            className="btn btn-ghost btn-sm"
            aria-label={u.active ? `Deactivate ${u.name}` : `Activate ${u.name}`}
            title={u.active ? "Deactivate" : "Activate"}
            onClick={() => toggleActive(u)}
          >
            {u.active ? <PowerOff size={14}/> : <Power size={14}/>}
          </button>
          <button className="btn btn-danger btn-sm" aria-label={`Delete ${u.name}`} onClick={() => deleteUser(u)}><Trash2 size={14}/></button>
        </div>
      </div>
    );
  };

  const formRoles = isAdmin
    ? (editUser
        ? [{ value:"manager", label:"Manager" }, { value:"cashier", label:"Cashier" }, { value:"waiter", label:"Waiter" }]
        : [{ value:"manager", label:"Manager" }])
    : [{ value:"cashier", label:"Cashier" }, { value:"waiter", label:"Waiter" }];

  const managerOptions = users.filter(u => u.role === "manager");

  return (
    <div style={{ padding:"14px" }}>
      <div className="flex-between" style={{ marginBottom:"14px" }}>
        <div className="section-title" style={{ padding:0, margin:0 }}>
          {isAdmin ? <ShieldCheck size={16}/> : <Users size={16}/>} {isAdmin ? "Team" : "My Staff"}
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowPinForm(v => !v); setPinForm({ current:"", next:"", confirm:"" }); }}>
            <KeyRound size={13}/> Change my PIN
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm && !editUser ? <><X size={13}/> Cancel</> : <><UserPlus size={13}/> {isAdmin ? "Add Manager" : "Add Staff"}</>}
          </button>
        </div>
      </div>

      {showPinForm && (
        <div className="card" style={{ border:"1px solid var(--border-mid)", marginBottom:"16px" }}>
          <div className="section-title" style={{ padding:0, marginBottom:"12px" }}><KeyRound size={14}/> Change my PIN</div>
          <input
            className="input" type="password" inputMode="numeric" autoComplete="current-password"
            placeholder="Current PIN"
            value={pinForm.current}
            onChange={e => setPinForm({ ...pinForm, current:e.target.value.replace(/\D/g,"").slice(0,requiredPin) })}
          />
          <input
            className="input" type="password" inputMode="numeric" autoComplete="new-password"
            placeholder={`New ${requiredPin}-digit PIN`}
            value={pinForm.next}
            onChange={e => setPinForm({ ...pinForm, next:e.target.value.replace(/\D/g,"").slice(0,requiredPin) })}
          />
          <input
            className="input" type="password" inputMode="numeric" autoComplete="new-password"
            placeholder="Confirm new PIN"
            value={pinForm.confirm}
            onChange={e => setPinForm({ ...pinForm, confirm:e.target.value.replace(/\D/g,"").slice(0,requiredPin) })}
          />
          <div className="text-muted" style={{ fontSize:"11px", marginBottom:"10px" }}>
            Your PIN has 4 digits.
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" disabled={pinBusy} onClick={changePin}>{pinBusy ? "Saving…" : "Update PIN"}</button>
            <button className="btn btn-ghost" onClick={() => setShowPinForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="um-toolbar">
        <div className="um-search">
          <Search size={15}/>
          <input
            className="um-search-input"
            placeholder="Search name or username"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="um-clear" aria-label="Clear search" onClick={() => setSearch("")}><X size={13}/></button>}
        </div>
        {isAdmin && (
          <select className="input um-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="manager">Managers</option>
            <option value="cashier">Cashiers</option>
            <option value="waiter">Waiters</option>
          </select>
        )}
      </div>

      {message && <div className={`toast ${/created|updated|activated|deleted/i.test(message) ? "toast-success" : "toast-error"}`}>{message}</div>}

      {showForm && (
        <div className="card" style={{ border:"1px solid var(--accent)", marginBottom:"16px" }}>
          <div className="section-title" style={{ padding:0, marginBottom:"12px" }}>
            {editUser ? <><Pencil size={14}/> Edit {editUser.name}</> : <><UserPlus size={14}/> {isAdmin ? "New Manager" : "New Staff"}</>}
          </div>
          <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} />
          <input
            className="input"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username:e.target.value.toLowerCase().replace(/\s+/g,"") })}
            disabled={!!editUser}
          />
          <select
            className="input"
            value={form.role}
            onChange={e => setForm({ ...form, role:e.target.value, manager_id:"" })}
            disabled={!!editUser && !isAdmin}
          >
            {formRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {isAdmin && form.role !== "manager" && (
            <select className="input" value={form.manager_id} onChange={e => setForm({ ...form, manager_id:e.target.value })}>
              <option value="">Select manager…</option>
              {managerOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder={editUser ? "New 4-digit PIN (leave blank to keep)" : "4-digit PIN"}
            value={form.pin}
            onChange={e => setForm({ ...form, pin:e.target.value.replace(/\D/g,"").slice(0,4) })}
          />
          {!editUser && (
            <div className="text-muted" style={{ fontSize:"11px", marginBottom:"10px" }}>
              {isAdmin ? "Managers sign in with this PIN and add their own cashiers and waiters." : "Staff sign in with this PIN under your team."}
            </div>
          )}
          <div className="modal-actions">
            <button className="btn btn-primary" disabled={busy} onClick={saveUser}>{busy ? "Saving…" : editUser ? "Save" : "Create"}</button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign:"center", color:"var(--muted)", padding:"26px 16px" }}>
          <Users size={22} style={{ marginBottom:"8px" }}/>
          <div style={{ fontSize:"13px" }}>
            {users.length === 0 ? (isAdmin ? "No users yet — add one to get started." : "No staff assigned to you yet.") : "No users match this search."}
          </div>
        </div>
      )}

      {groups.map(g => g.rows.length > 0 && (
        <div key={g.title} style={{ marginBottom:"14px" }}>
          <div className="um-group-title">{g.title} <span>{g.rows.length}</span></div>
          {g.rows.map(renderRow)}
        </div>
      ))}
    </div>
  );
}