import { lazy, Suspense } from "react";
import { Users, LogOut, User, ShoppingCart } from "lucide-react";

const UserManagement = lazy(() => import("./UserManagement"));

export default function Manager({ user, onLogout, onSwitchToPOS }) {
  return (
    <div className="page">
      <div className="header">
        <h2><Users size={19} className="header-lead-icon"/> <span className="header-prefix">Manager —</span> <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"/> <span className="brand-name">Vendaura</span></span></h2>
        <div className="header-right">
          <span className="header-user"><User size={12}/> {user.name}</span>
          {onSwitchToPOS && <button className="btn btn-success btn-sm" onClick={onSwitchToPOS}><ShoppingCart size={13}/> POS</button>}
          <button className="btn btn-danger btn-sm" onClick={onLogout}><LogOut size={13}/> Logout</button>
        </div>
      </div>
      <Suspense fallback={<div className="loading-bar" />}>
        <UserManagement user={user} />
      </Suspense>
    </div>
  );
}
