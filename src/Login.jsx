import { useState } from "react";
import api from "./api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pin,      setPin]      = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const doLogin = async (pinValue) => {
    if (!username.trim()) { setError("Enter your username first"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/pin-login", {
        username: username.trim().toLowerCase(),
        pin: pinValue
      });
      localStorage.setItem("token",   res.data.token);
      localStorage.setItem("user",    JSON.stringify(res.data.user));
      localStorage.setItem("userpin", pinValue);
      onLogin(res.data.user);
    } catch (e) {
      setError(e.response?.data?.error || "Login failed");
      setPin("");
    } finally { setLoading(false); }
  };

  const handleKey = (k) => {
    if (loading) return;
    if (k === "C")    { setPin(""); setError(""); return; }
    if (k === "back") { setPin(p => p.slice(0,-1)); setError(""); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) doLogin(next);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="/javari-web/logo.svg" alt="Vendaura" className="login-logo" />
        </div>
        <div className="login-form">
          <input className="input" placeholder="Username" value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            autoCapitalize="none" autoComplete="off" autoCorrect="off" />
          <div className="pin-label">Enter Your PIN</div>
          <div className="pin-dots">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? "filled" : ""}`}>
                {pin[i] ? "●" : ""}
              </div>
            ))}
          </div>
          <div className="keypad">
            {[1,2,3,4,5,6,7,8,9,"C",0,"⌫"].map((k, i) => (
              <button key={i}
                className={`keypad-btn ${k==="C"?"keypad-clear":""} ${k==="⌫"?"keypad-back":""}`}
                onClick={() => handleKey(k === "⌫" ? "back" : String(k))}
                disabled={loading}>{k}</button>
            ))}
          </div>
          {error   && <div className="message message-error">{error}</div>}
          {loading && <div className="message message-info">Logging in...</div>}
        </div>
      </div>
    </div>
  );
}