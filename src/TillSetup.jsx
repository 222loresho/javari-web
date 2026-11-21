import { useEffect, useState } from "react";
import { Printer, X, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import {
  getPaper, setPaper, getTillName, setTillName,
  getPrinterName, setPrinterName,
  isPrinterSetUp, markPrinterSetUp,
  isPrinterSetupSkipped, skipPrinterSetup, clearPrinterSetupSkip,
  printTest,
} from "./print";

function openTillSetup() {
  window.dispatchEvent(new Event("vendaura:till-setup"));
}

export default function TillSetup({ user }) {
  const venue = user?.market_name || user?.market_code || "";
  const [open, setOpen] = useState(() => {
    if (!user) return false;
    if (isPrinterSetUp()) return false;
    return !isPrinterSetupSkipped();
  });
  const [step, setStep] = useState(0);
  const [paper, setPaperChoice] = useState(getPaper);
  const [name, setName] = useState(getTillName);
  const [printer, setPrinter] = useState(getPrinterName);
  const [printed, setPrinted] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);

  useEffect(() => {
    const reopen = () => {
      clearPrinterSetupSkip();
      setPaperChoice(getPaper());
      setName(getTillName());
      setPrinter(getPrinterName());
      setStep(0);
      setPrinted(false);
      setPrintFailed(false);
      setOpen(true);
    };
    window.addEventListener("vendaura:till-setup", reopen);
    return () => window.removeEventListener("vendaura:till-setup", reopen);
  }, []);

  const close = () => {
    skipPrinterSetup();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const alreadySetUp = isPrinterSetUp();
  const choosePaper = (size) => { setPaper(size); setPaperChoice(size); setPrinted(false); };

  const testPrint = () => {
    setPaper(paper);
    printTest();
    setPrinted(true);
    setPrintFailed(false);
  };

  const finish = () => {
    setPaper(paper);
    setTillName(name.trim());
    setPrinterName(printer.trim());
    markPrinterSetUp();
    clearPrinterSetupSkip();
    setOpen(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="till-setup-title">
      <div className="modal" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h3 id="till-setup-title">{alreadySetUp ? "Printer settings" : "Set up this till"}</h3>
          <button className="btn btn-ghost btn-sm" aria-label="Close" onClick={close}><X size={15} /></button>
        </div>

        <div className="till-steps" aria-hidden="true">
          <span className={`till-step-dot ${step >= 0 ? "on" : ""}`} />
          <span className={`till-step-dot ${step >= 1 ? "on" : ""}`} />
        </div>

        {step === 0 && (
          <>
            <p className="text-muted" style={{ fontSize: "12.5px", lineHeight: 1.6, marginBottom: "14px" }}>
              {alreadySetUp
                ? `Settings for ${venue || "this venue"} on this device.`
                : `First time in ${venue || "this venue"} on this device. This runs once per venue and is remembered.`}
            </p>

            <div className="section-title" style={{ padding: 0, marginBottom: "8px" }}>Till name</div>
            <input
              className="input"
              placeholder="e.g. Counter 1, Bar 2"
              value={name}
              maxLength={24}
              onChange={e => setName(e.target.value)}
              style={{ marginBottom: "14px" }}
            />

            <div className="section-title" style={{ padding: 0, marginBottom: "8px" }}>Receipt paper</div>
            <div className="till-choice">
              <button
                type="button"
                className={`till-choice-btn ${paper === "58" ? "on" : ""}`}
                onClick={() => choosePaper("58")}
              >
                <strong>58 mm</strong>
                <span>32 cols · handheld</span>
              </button>
              <button
                type="button"
                className={`till-choice-btn ${paper === "80" ? "on" : ""}`}
                onClick={() => choosePaper("80")}
              >
                <strong>80 mm</strong>
                <span>42 cols · counter</span>
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={close}>{alreadySetUp ? "Close" : "Skip for now"}</button>
              <button className="btn btn-primary" onClick={() => setStep(1)}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="till-print-icon"><Printer size={26} /></div>
            <p className="text-muted" style={{ fontSize: "12.5px", lineHeight: 1.65, textAlign: "center", marginBottom: "12px" }}>
              Choose the printer in the dialog the test opens. Browsers do not expose a printer list,
              but Chrome remembers the one you pick for this till. Set paper to <strong>{paper} mm</strong>,
              margins to <strong>None</strong> and scale to <strong>100%</strong>.
            </p>

            <div className="section-title" style={{ padding: 0, marginBottom: "8px" }}>Receipt printer</div>
            <input
              className="input"
              placeholder="Printer name, e.g. EPSON TM-T20"
              value={printer}
              maxLength={40}
              onChange={e => setPrinter(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            <p className="text-muted" style={{ fontSize: "11.5px", lineHeight: 1.55, marginBottom: "12px" }}>
              Remembered here so whoever uses this till knows which printer to pick.
              With the Vendaura Till shortcut, receipts go straight to the default printer without a dialog.
            </p>

            <button className="btn btn-primary full-btn" onClick={testPrint}>
              <Printer size={14} /> Print test receipt
            </button>

            {printed && (
              <div className={`till-confirm ${printFailed ? "bad" : ""}`} style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "12.5px", marginBottom: "8px", color: "var(--text-dim)" }}>
                  Did the test print cleanly with no text clipped?
                </div>
                {printFailed ? (
                  <div className="till-hint">
                    Check the roll width above matches the paper actually loaded, then print again.
                    You can also try 58 mm if the 80 mm roll is narrower.
                  </div>
                ) : (
                  <div className="modal-actions" style={{ marginTop: 0 }}>
                    <button className="btn btn-ghost" onClick={() => setPrintFailed(true)}>Not quite</button>
                    <button className="btn btn-primary" onClick={finish}><CheckCircle2 size={14} /> Looks good</button>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setStep(0); setPrinted(false); setPrintFailed(false); }}>
                <ArrowLeft size={14} /> Back
              </button>
              {!isPrinterSetUp() && <button className="btn btn-ghost" onClick={close}>Skip for now</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { openTillSetup };
