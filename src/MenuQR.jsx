import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BookOpen, UtensilsCrossed, Wine, BedDouble, Info, ExternalLink,
  Download, Printer, Copy, Check, RefreshCw, WifiOff, Lightbulb, FileCode2,
  Smartphone, Monitor, Link2,
} from "lucide-react";

const MENU_URL = "https://222loresho.github.io/QR-MENU/";
const QR_COLORS = { dark: "#0e1016", light: "#ffffff" };
const PAGES = [
  { label: <><UtensilsCrossed size={13}/> Food</>,            url: "https://222loresho.github.io/QR-MENU/menu.html" },
  { label: <><Wine size={13}/> Drinks</>,                     url: "https://222loresho.github.io/QR-MENU/drinks.html" },
  { label: <><BedDouble size={13}/> Accommodation</>,         url: "https://222loresho.github.io/QR-MENU/accommodation.html" },
  { label: <><Info size={13}/> Info</>,                       url: "https://222loresho.github.io/QR-MENU/info.html" },
];

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default function MenuQR() {
  const [page,       setPage]       = useState(PAGES[0].url);
  const [qrPng,      setQrPng]      = useState("");
  const [copied,     setCopied]     = useState(false);
  const [online,     setOnline]     = useState(() => navigator.onLine);
  const [loading,    setLoading]    = useState(true);
  const [frameKey,   setFrameKey]   = useState(0);
  const [tableLabel, setTableLabel] = useState("");
  const [device,     setDevice]     = useState("phone");

  useEffect(() => {
    QRCode.toDataURL(MENU_URL, { width: 640, margin: 2, color: QR_COLORS })
      .then(setQrPng)
      .catch(() => setQrPng(""));
  }, []);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const downloadPng = () => {
    if (!qrPng) return;
    const a = document.createElement("a");
    a.href = qrPng;
    a.download = "vendaura-menu-qr.png";
    a.click();
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(MENU_URL, { type: "svg", margin: 2, color: QR_COLORS });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendaura-menu-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(MENU_URL);
      setCopied(true);
    } catch {
      window.prompt("Copy this menu link", MENU_URL);
    }
  };

  const printCard = () => {
    if (!qrPng) return;
    const label = tableLabel.trim();
    const win = window.open("", "_blank", "width=520,height=760");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Vendaura menu card</title>
      <style>
        @page { size: A6 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #0e1016; }
        .card { height: calc(100vh - 20mm); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; border: 1px solid #d7d9de; border-radius: 14px; padding: 24px; text-align: center; }
        .brand { font-size: 26px; letter-spacing: .18em; text-transform: uppercase; }
        .rule { width: 46px; height: 2px; background: #2fbf71; }
        .title { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: #4a4f59; }
        img { width: 210px; height: 210px; }
        .table { font-size: 20px; font-weight: 700; }
        .note { font-size: 12px; color: #6b7280; letter-spacing: .06em; text-transform: uppercase; }
        @media print { .card { height: auto; min-height: 100vh; border: none; } }
      </style></head><body>
      <div class="card">
        <div class="brand">Vendaura</div>
        <div class="rule"></div>
        <div class="title">Scan for our menu</div>
        <img src="${qrPng}" alt="Menu QR code" />
        ${label ? `<div class="table">${escapeHtml(label)}</div>` : ""}
        <div class="note">Food · Drinks · Accommodation</div>
      </div>
      <script>window.onload = () => setTimeout(() => window.print(), 150);</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="menu-view">
      <div className="menu-head">
        <div>
          <div className="menu-title"><BookOpen size={18}/> Digital Menu</div>
          <div className="menu-sub">QR code · menu preview · customer link</div>
        </div>
        <a href={MENU_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
          <ExternalLink size={13}/> Open Menu
        </a>
      </div>

      <div className="menu-workspace">
        <div className="menu-qr-tile">
          <div className="menu-qr-brand">Vendaura</div>
          <div className="menu-qr-rule" />
          {qrPng
            ? <img src={qrPng} alt="Menu QR code" />
            : <div className="menu-qr-placeholder" />}
          <div className="menu-qr-cap">Scan to view menu</div>
        </div>

        <div className="menu-workspace-body">
          <div className="menu-label">Customer menu link</div>
          <div className="menu-link-row">
            <Link2 size={14} className="menu-link-icon"/>
            <span className="menu-link">{MENU_URL}</span>
            <button className="btn btn-ghost btn-sm" onClick={copyLink} aria-label="Copy menu link">
              {copied ? <><Check size={13}/> Copied</> : <><Copy size={13}/> Copy</>}
            </button>
          </div>

          <div className="menu-label">Print & share</div>
          <div className="menu-actions">
            <button className="btn btn-primary btn-sm" onClick={downloadPng} disabled={!qrPng}>
              <Download size={13}/> QR PNG
            </button>
            <button className="btn btn-ghost btn-sm" onClick={downloadSvg}>
              <FileCode2 size={13}/> QR SVG
            </button>
            <input
              className="input menu-table-label"
              placeholder="Table label (optional)"
              value={tableLabel}
              onChange={e => setTableLabel(e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" onClick={printCard} disabled={!qrPng}>
              <Printer size={13}/> Print card
            </button>
          </div>

          <div className="menu-hint">
            <Lightbulb size={14}/>
            <span>Print one card per table and laminate it. Customers scan with their phone camera — no app needed.</span>
          </div>
        </div>
      </div>

      <div className="menu-preview-tabs">
        {PAGES.map(p => (
          <button
            key={p.url}
            className={`tab-btn ${page === p.url ? "active" : "inactive"}`}
            onClick={() => { setPage(p.url); setLoading(true); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="menu-preview">
        <div className="menu-preview-bar">
          <span className={`menu-dot ${online ? "" : "off"}`} />
          <span className="menu-preview-url">{page}</span>
          <div className="menu-preview-tools">
            <div className="menu-device-toggle">
              <button
                className={device === "phone" ? "active" : ""}
                aria-label="Phone preview"
                aria-pressed={device === "phone"}
                onClick={() => setDevice("phone")}
              >
                <Smartphone size={12}/>
              </button>
              <button
                className={device === "wide" ? "active" : ""}
                aria-label="Full-width preview"
                aria-pressed={device === "wide"}
                onClick={() => setDevice("wide")}
              >
                <Monitor size={12}/>
              </button>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              aria-label="Reload preview"
              onClick={() => { setLoading(true); setFrameKey(k => k + 1); }}
            >
              <RefreshCw size={12}/>
            </button>
            <a href={page} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink size={12}/> New tab
            </a>
          </div>
        </div>

        <div className={`menu-preview-frame ${device}`}>
          {!online ? (
            <div className="menu-preview-overlay">
              <WifiOff size={26}/>
              <span>You're offline — the menu preview needs a connection.</span>
            </div>
          ) : (
            <>
              {loading && (
                <div className="menu-preview-overlay">
                  <span className="loading-bar menu-loading-bar" />
                  <span>Loading menu…</span>
                </div>
              )}
              <iframe
                key={`${page}-${frameKey}`}
                src={page}
                title="Menu preview"
                onLoad={() => setLoading(false)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
