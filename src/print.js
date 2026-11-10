const STORE = { name: "JAVARI", address: "Loresho, Nairobi" };

const PAPERS = {
  "58": { mm: 58, chars: 32, fs: 9 },
  "80": { mm: 80, chars: 42, fs: 10 },
};

const MARK = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="#000" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.9"><path d="M7.7 27.1C9.4 22.3 12.3 16.7 16 2.4" fill="none"/><path d="M24.3 27.1C22.6 22.3 19.7 16.7 16 2.4" fill="none"/><path d="M10.8 22.5C7.7 21.5 4.4 18.8 5.75 17.4C7.3 16.7 9.4 19.6 10.8 22.5Z"/><path d="M12.7 18C9.8 16.7 6.9 14.2 8.1 12.8C9.6 12 11.5 14.9 12.7 18Z"/><path d="M14.5 13.2C11.9 11.8 9.4 9.5 10.6 8.4C11.9 7.6 13.7 10.3 14.5 13.2Z"/><path d="M15.6 8.4C13.5 7.4 11.4 5.6 12.3 4.3C13.3 3.5 14.85 5.9 15.6 8.4Z"/><path d="M21.2 22.5C24.3 21.5 27.6 18.8 26.25 17.4C24.7 16.7 22.6 19.6 21.2 22.5Z"/><path d="M19.3 18C22.2 16.7 25.1 14.2 23.9 12.8C22.4 12 20.5 14.9 19.3 18Z"/><path d="M17.5 13.2C20.1 11.8 22.6 9.5 21.4 8.4C20.1 7.6 18.3 10.3 17.5 13.2Z"/><path d="M16.4 8.4C18.5 7.4 20.6 5.6 19.7 4.3C18.7 3.5 17.15 5.9 16.4 8.4Z"/></g><circle cx="16" cy="1.9" r="0.95" fill="#000"/><circle cx="14.6" cy="3" r="0.6" fill="#000"/><circle cx="17.4" cy="3" r="0.6" fill="#000"/><circle cx="13.3" cy="4.6" r="0.45" fill="#000"/><circle cx="18.7" cy="4.6" r="0.45" fill="#000"/><circle cx="16" cy="29.4" r="0.55" fill="#000"/></svg>`;

export function getPaper() {
  try { return localStorage.getItem("vendaura_paper") === "58" ? "58" : "80"; }
  catch { return "80"; }
}

export function setPaper(size) {
  try { localStorage.setItem("vendaura_paper", size === "58" ? "58" : "80"); }
  catch {}
}

const line   = (w, c="-") => c.repeat(w);
const center = (s, w) => " ".repeat(Math.max(0, Math.floor((w - s.length) / 2))) + s;
const pad    = (l, r, w) => { l = String(l); r = String(r); return l + " ".repeat(Math.max(1, w - l.length - r.length)) + r; };

export function printBill(order) {
  const p = PAPERS[getPaper()];
  const w = p.chars;
  const rows = [
    center(STORE.name, w),
    center(STORE.address, w),
    line(w),
    pad("Order:", order.order_number || "", w),
    pad("Table:", order.table_name || "", w),
    pad("Waiter:", order.waiter_name || "", w),
    pad("Time:", new Date(order.created_at).toLocaleString("en-KE"), w),
    line(w),
    "ITEMS:",
    ...order.items.flatMap(i => [pad(`  ${i.product_name} x${i.quantity}`, `KSh ${i.subtotal}`, w), ...(i.note ? [`    >> ${i.note}`] : [])]),
    line(w),
    pad("TOTAL:", `KSh ${order.total}`, w),
    line(w),
    center("Present this bill to the cashier", w),
    "",
  ];
  openPrint(rows, p);
}

export function printOrder(order) {
  const p = PAPERS[getPaper()];
  const w = p.chars;
  const rows = [
    center(STORE.name, w),
    center(STORE.address, w),
    line(w),
    pad("ORDER:", order.order_number || "", w),
    pad("Table:", order.table_name || "", w),
    pad("Waiter:", order.waiter_name || "", w),
    pad("Time:", new Date(order.created_at || Date.now()).toLocaleString("en-KE"), w),
    line(w),
    "ITEMS:",
    ...order.items.flatMap(i => [
      `${i.quantity} x ${i.product_name}`,
      ...(i.note ? [`    >> ${i.note}`] : []),
    ]),
    line(w),
    pad("TOTAL:", `KSh ${order.total}`, w),
    line(w),
    center("Show this slip at the counter", w),
    center("to collect the items.", w),
    "",
  ];
  openPrint(rows, p);
}

export function printReceipt(receipt) {  const p = PAPERS[getPaper()];
  const w = p.chars;
  const splits   = receipt.splits || [];
  const payLines = splits.length > 0
    ? splits.map(s => {
        const label = s.method === "mpesa" ? "Mpesa" : s.method === "card" ? "Card" : s.method === "billout" ? "Billout" : "Cash";
        return pad(`  ${label}${s.ref ? ` (${s.ref})` : ""}:`, `KSh ${s.amount}`, w);
      })
    : [pad(`  ${receipt.paymentMethod || "Cash"}:`, `KSh ${receipt.amountPaid || receipt.total}`, w)];

  const rows = [
    center(STORE.name, w),
    center(STORE.address, w),
    line(w),
    pad("Cashier:", receipt.cashier || "", w),
    pad("Date:", (receipt.date || new Date().toLocaleString()).split(",")[0], w),
    pad("Time:", (receipt.date || "").split(",")[1]?.trim() || "", w),
    line(w),
    "ITEMS:",
    ...receipt.items.flatMap(i => [pad(`  ${i.product_name} x${i.quantity}`, `KSh ${i.subtotal}`, w), ...(i.note ? [`    >> ${i.note}`] : [])]),
    line(w),
    pad("TOTAL:", `KSh ${receipt.total}`, w),
    "PAYMENT:",
    ...payLines,
    line(w),
    center("Thank you for visiting Javari!", w),
    center("We hope to see you again soon.", w),
    "",
  ];
  openPrint(rows, p);
}

export function printTest() {
  const p = PAPERS[getPaper()];
  const w = p.chars;
  const ruler = "1234567890".repeat(Math.ceil(w / 10)).slice(0, w);
  const rows = [
    center(STORE.name, w),
    center("RECEIPT TEST", w),
    line(w),
    pad("Paper:", `${p.mm}mm / ${w} cols`, w),
    pad("Paper width:", `${p.mm} mm`, w),
    pad("Date:", new Date().toLocaleString("en-KE"), w),
    line(w),
    ruler,
    pad("LEFT", "RIGHT", w),
    pad("Burger x2", "KSh 1,700", w),
    pad("Wings x1", "KSh 650", w),
    line(w),
    pad("TOTAL:", "KSh 2,350", w),
    line(w),
    center("If both edges print cleanly", w),
    center("and nothing is clipped,", w),
    center("the printer is ready.", w),
    line(w, "-"),
    center("cut here", w),
    "",
  ];
  openPrint(rows, p);
}

function openPrint(rows, p) {
  // Courier New advances 0.6em; centre the fixed-width block inside the roll so
  // no column lands in the print head's non-printable edge.
  const textMm = (p.chars * p.fs * 0.6 / 96) * 25.4;
  const sideMm = Math.max(0, Math.round(((p.mm - textMm) / 2) * 100) / 100);
  const content = rows.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vendaura receipt</title>
  <style>
    @page{size:${p.mm}mm auto;margin:0;}
    html,body{margin:0;padding:0;background:#fff;color:#000;}
    body{width:${p.mm}mm;box-sizing:border-box;padding:2mm 0 6mm;font-family:"Courier New",Courier,monospace;font-size:${p.fs}px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .t{margin-left:${sideMm}mm;}
    .mark{display:flex;justify-content:center;white-space:normal;margin:0 0 1.5mm;}
    .mark svg{width:9mm;height:9mm;}
    @media print{body{padding:2mm 0 6mm;}}
  </style>
</head>
<body><div class="mark">${MARK}</div><div class="t">${content}</div></body>
</html>`);
  win.document.close();
  win.onafterprint = () => setTimeout(() => frame.remove(), 1500);
  setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 350);
  setTimeout(() => { if (frame.isConnected) frame.remove(); }, 90000);
}
