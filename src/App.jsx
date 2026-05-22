import { useState } from "react";
import Login from "./Login";
import POS from "./POS";
import Admin from "./Admin";
import CashierBills from "./CashierBills";
import useSessionTimeout from "./useSessionTimeout";
import SuperAdmin from "./SuperAdmin";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });
  const [view, setView] = useState("default");

  const handleLogin  = (u) => { setUser(u); setView("default"); };
  const TIMEOUT_MINUTES = 30;
  useSessionTimeout(() => {
    if (user) {
      handleLogout();
      alert("You have been logged out due to inactivity.");
    }
  }, TIMEOUT_MINUTES);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userpin");
    setUser(null); setView("default");
  };

  if (!user) return <Login onLogin={handleLogin} />;

  if (user.role === "super_admin")
    return <SuperAdmin user={user} onLogout={handleLogout} />;

  if (user.role === "admin" && view === "pos")
    return <POS user={user} onLogout={handleLogout} onSwitchToBills={() => setView("default")} />;
  if (user.role === "admin")
    return <Admin user={user} onLogout={handleLogout} onSwitchToPOS={() => setView("pos")} />;

  if (user.role === "cashier") {
    if (view === "bills")
      return <CashierBills user={user} onLogout={handleLogout} onSwitchToPOS={() => setView("default")} />;
    return <POS user={user} onLogout={handleLogout} showBills onSwitchToBills={() => setView("bills")} />;
  }

  return <POS user={user} onLogout={handleLogout} />;
}