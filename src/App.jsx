import { useState, lazy, Suspense } from "react";
import Login from "./Login";
import POS from "./POS";
import Admin from "./Admin";
import CashierBills from "./CashierBills";
import TillSetup from "./TillSetup";
import { setPrintVenue } from "./print";
import useSessionTimeout from "./useSessionTimeout";

const SuperAdmin = lazy(() => import("./SuperAdmin"));
const Manager    = lazy(() => import("./Manager"));

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  });
  const [view, setView] = useState("default");

  const handleLogin  = (u) => {
    setUser(u);
    setView(u.role === "super_admin" ? "default" : "pos");
  };
  const TIMEOUT_MINUTES = 2.5;
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
    localStorage.removeItem("pinlen");
    setUser(null); setView("default");
  };

  if (!user) return <Login onLogin={handleLogin} />;

  setPrintVenue(user.market_id ?? user.market_code ?? "");

  if (user.role === "super_admin")
    return <Suspense fallback={<div className="loading-bar" />}><SuperAdmin user={user} onLogout={handleLogout} /></Suspense>;

  let screen;
  if (user.role === "admin" && view === "pos")
    screen = <POS user={user} onLogout={handleLogout} onExit={() => setView("default")} exitLabel="Admin" />;
  else if (user.role === "admin")
    screen = <Admin user={user} onLogout={handleLogout} onSwitchToPOS={() => setView("pos")} />;
  else if (user.role === "manager" && view === "pos")
    screen = <POS user={user} onLogout={handleLogout} onExit={() => setView("default")} exitLabel="Manager" />;
  else if (user.role === "manager")
    screen = <Suspense fallback={<div className="loading-bar" />}><Manager user={user} onLogout={handleLogout} onSwitchToPOS={() => setView("pos")} /></Suspense>;
  else if (user.role === "cashier" && view === "bills")
    screen = <CashierBills user={user} onLogout={handleLogout} onSwitchToPOS={() => setView("default")} />;
  else if (user.role === "cashier")
    screen = <POS user={user} onLogout={handleLogout} showBills onSwitchToBills={() => setView("bills")} />;
  else
    screen = <POS user={user} onLogout={handleLogout} />;

  return (
    <>
      {screen}
      <TillSetup user={user} />
    </>
  );
}