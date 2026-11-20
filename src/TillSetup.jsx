import { useEffect, useState } from "react";
import { Printer, X, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import {
  getPaper, setPaper, getTillName, setTillName,
  isPrinterSetUp, markPrinterSetUp, printTest,
} from "./print";

const SKIP_KEY = "vendaura_till_skip_session";

function openTillSetup() {
  window.dispatchEvent(new Event("vendaura:till-setup"));
}

export default function TillSetup() {
  const [open, setOpen] = useState(() => {
    if (isPrinterSetUp()) return false;
    try { return !sessionStorage.getItem(SKIP_KEY); } catch { return true; }
  });
  const [step, setStep] = useState(0);
  const [paper, setPaperChoice] = useState(getPaper);
  const [name, setName] = useState(getTillName);
  const [printed, setPrinted] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);

  useEffect(() => {
    const reopen = () => {
      setPaperChoice(getPaper());
      setName(getTillName());
      setStep(0);
      setPrinted(false);
      setPrintFailed(false);
      setOpen(true);
    };
    window.addEventListener("vendaura:till-setup", reopen);
    return () => window.removeEventListener("vendaura:till-setup", reopen);
  }, []);

  const close = () => {
    try { sessionStorage.setItem(SKIP_KEY, "1"); } catch {}
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
    markPrinterSetUp();
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
                ? "Applies to this device only. Settings are remembered here."
                : "One-time setup for this device. It is remembered here, so you only do it once."}
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
            <p className="text-muted" style={{ fontSize: "12.5px", lineHeight: 1.65, textAlign: "center", marginBottom: "14px" }}>
              In the print dialog pick your receipt printer, set paper to <strong>{paper} mm</strong>,
              margins to <strong>None</strong> and scale to <strong>100%</strong>.
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
