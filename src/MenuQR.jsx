import { useState } from "react";

const MENU_URL  = "https://222loresho.github.io/QR-MENU/";
const QR_URL    = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(MENU_URL)}`;
const PAGES     = [
  { label: "🍽 Food",          url: "https://222loresho.github.io/QR-MENU/menu.html" },
  { label: "🥂 Drinks",        url: "https://222loresho.github.io/QR-MENU/drinks.html" },
  { label: "🏨 Accommodation", url: "https://222loresho.github.io/QR-MENU/accommodation.html" },
  { label: "ℹ️ Info",          url: "https://222loresho.github.io/QR-MENU/info.html" },
];

export default function MenuQR() {
  const [page, setPage] = useState(PAGES[0].url);
  const [showQR, setShowQR] = useState(false);

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(MENU_URL)}&format=png`;
    a.download = "vendaura-menu-qr.png";
    a.target = "_blank";
    a.click();
  };

  return (
    <div style={{padding:"14px"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"var(--green)"}}>📋 Digital Menu</div>
          <div style={{fontSize:"12px",color:"var(--muted)",marginTop:"2px"}}>QR code · menu preview · customer link</div>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(!showQR)}>
            {showQR ? "▲ Hide QR" : "📱 Show QR Code"}
          </button>
          <a href={MENU_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            🔗 Open Menu
          </a>
        </div>
      </div>

      {/* QR Code panel */}
      {showQR && (
        <div style={{
          background:"var(--card)",
          border:"1px solid var(--border-mid)",
          borderRadius:"var(--r-lg)",
          padding:"24px",
          marginBottom:"16px",
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          gap:"16px",
          animation:"fadeIn 0.3s ease",
        }}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"var(--green)"}}>
            Scan to View Menu
          </div>

          {/* QR Code */}
          <div style={{
            background:"white",
            padding:"16px",
            borderRadius:"12px",
            boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <img
              src={QR_URL}
              alt="Menu QR Code"
              style={{width:"220px",height:"220px",display:"block"}}
            />
          </div>

          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"13px",color:"var(--text-dim)",marginBottom:"4px"}}>
              Place this on tables for customers to scan
            </div>
            <div style={{fontSize:"11px",color:"var(--muted)",fontFamily:"monospace",background:"var(--card-hover)",padding:"4px 10px",borderRadius:"6px"}}>
              {MENU_URL}
            </div>
          </div>

          <div style={{display:"flex",gap:"10px"}}>
            <button className="btn btn-primary" onClick={downloadQR}>
              ⬇️ Download QR (600px)
            </button>
            
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(MENU_URL)}&format=svg`}
              target="_blank" rel="noreferrer"
              className="btn btn-ghost"
            >
              🖨️ Print Size (SVG)
            </a>
          </div>

          <div style={{
            background:"rgba(29,107,56,0.08)",
            border:"1px solid var(--border)",
            borderRadius:"var(--r-sm)",
            padding:"12px 16px",
            fontSize:"12px",
            color:"var(--muted)",
            textAlign:"center",
            maxWidth:"320px",
          }}>
            💡 Tip: Print and laminate one QR code per table. Customers scan it to view the full menu on their phone without needing to download anything.
          </div>
        </div>
      )}

      {/* Menu page tabs */}
      <div style={{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}}>
        {PAGES.map(p => (
          <button
            key={p.url}
            className={`tab-btn ${page===p.url?"active":"inactive"}`}
            onClick={() => setPage(p.url)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Menu iframe */}
      <div style={{
        border:"1px solid var(--border)",
        borderRadius:"var(--r-lg)",
        overflow:"hidden",
        background:"white",
        boxShadow:"var(--shadow-md)",
      }}>
        <div style={{
          background:"var(--card)",
          borderBottom:"1px solid var(--border)",
          padding:"8px 14px",
          display:"flex",
          alignItems:"center",
          gap:"8px",
          fontSize:"12px",
          color:"var(--muted)",
        }}>
          <span style={{color:"var(--green)"}}>●</span>
          <span style={{fontFamily:"monospace"}}>{page}</span>
          <a href={page} target="_blank" rel="noreferrer" style={{marginLeft:"auto",color:"var(--green)",textDecoration:"none",fontSize:"11px"}}>
            Open in new tab ↗
          </a>
        </div>
        <iframe
          src={page}
          title="Menu Preview"
          style={{
            width:"100%",
            height:"600px",
            border:"none",
            display:"block",
          }}
        />
      </div>
    </div>
  );
}