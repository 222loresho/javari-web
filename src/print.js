const STORE = { name: "JAVARI", address: "Loresho, Nairobi" };
const W     = 42;

const MARK = `<svg viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><g fill="#000" stroke="#000" stroke-linecap="round" stroke-width="0.9"><path d="M7.7 27.1C9.4 22.3 12.3 16.7 16 2.4" fill="none"/><path d="M24.3 27.1C22.6 22.3 19.7 16.7 16 2.4" fill="none"/><path d="M10.8 22.5C7.7 21.5 4.4 18.8 5.75 17.4C7.3 16.7 9.4 19.6 10.8 22.5Z"/><path d="M12.7 18C9.8 16.7 6.9 14.2 8.1 12.8C9.6 12 11.5 14.9 12.7 18Z"/><path d="M14.5 13.2C11.9 11.8 9.4 9.5 10.6 8.4C11.9 7.6 13.7 10.3 14.5 13.2Z"/><path d="M15.6 8.4C13.5 7.4 11.4 5.6 12.3 4.3C13.3 3.5 14.85 5.9 15.6 8.4Z"/><path d="M21.2 22.5C24.3 21.5 27.6 18.8 26.25 17.4C24.7 16.7 22.6 19.6 21.2 22.5Z"/><path d="M19.3 18C22.2 16.7 25.1 14.2 23.9 12.8C22.4 12 20.5 14.9 19.3 18Z"/><path d="M17.5 13.2C20.1 11.8 22.6 9.5 21.4 8.4C20.1 7.6 18.3 10.3 17.5 13.2Z"/><path d="M16.4 8.4C18.5 7.4 20.6 5.6 19.7 4.3C18.7 3.5 17.15 5.9 16.4 8.4Z"/></g><circle cx="16" cy="1.9" r="0.95" fill="#000"/><circle cx="14.6" cy="3" r="0.6" fill="#000"/><circle cx="17.4" cy="3" r="0.6" fill="#000"/><circle cx="13.3" cy="4.6" r="0.45" fill="#000"/><circle cx="18.7" cy="4.6" r="0.45" fill="#000"/><circle cx="16" cy="29.4" r="0.55" fill="#000"/></svg>`;

const pad    = (l, r, w=W) => l + " ".repeat(Math.max(1, w-l.length-r.length)) + r;
const line   = (c="-", w=W) => c.repeat(w);
const center = (s, w=W) => " ".repeat(Math.max(0, Math.floor((w-s.length)/2))) + s;

export function printBill(order) {
  const rows = [
    center(STORE.name),
    center(STORE.address),
    line(),
    pad("Order:", order.order_number||""),
    pad("Table:", order.table_name||""),
    pad("Waiter:", order.waiter_name||""),
    pad("Time:", new Date(order.created_at).toLocaleString("en-KE")),
    line(),
    "ITEMS:",
    ...order.items.flatMap(i => [pad(`  ${i.product_name} x${i.quantity}`, `KSh ${i.subtotal}`), ...(i.note?[`    >> ${i.note}`]:[])]),
    line(),
    pad("TOTAL:", `KSh ${order.total}`),
    line(),
    center("Present this bill to the cashier"),
    "",
  ];
  openPrint(rows.join("\n"));
}

export function printReceipt(receipt) {
  const splits   = receipt.splits||[];
  const payLines = splits.length>0
    ? splits.map(s => {
        const label = s.method==="mpesa"?"Mpesa":s.method==="card"?"Card":s.method==="billout"?"Billout":"Cash";
        return pad(`  ${label}${s.ref?` (${s.ref})`:""}:`, `KSh ${s.amount}`);
      })
    : [pad("  "+(receipt.paymentMethod||"Cash")+":", `KSh ${receipt.amountPaid||receipt.total}`)];

  const rows = [
    center(STORE.name),
    center(STORE.address),
    line(),
    pad("Cashier:", receipt.cashier||""),
    pad("Date:", (receipt.date||new Date().toLocaleString()).split(",")[0]),
    pad("Time:", (receipt.date||"").split(",")[1]?.trim()||""),
    line(),
    "ITEMS:",
    ...receipt.items.flatMap(i => [pad(`  ${i.product_name} x${i.quantity}`, `KSh ${i.subtotal}`), ...(i.note?[`    >> ${i.note}`]:[])]),
    line(),
    pad("TOTAL:", `KSh ${receipt.total}`),
    "PAYMENT:",
    ...payLines,
    line(),
    center("Thank you for visiting Javari!"),
    center("We hope to see you again soon."),
    "",
  ];
  openPrint(rows.join("\n"));
}

function openPrint(content) {
  const w = window.open("","_blank","width=420,height=650");
  if (!w) { alert("Please allow pop-ups to print."); return; }
  const escaped = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Javari Print</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:"Courier New",Courier,monospace;font-size:13px;padding:12px;white-space:pre;color:#000;background:#fff;}
    .mark{display:flex;justify-content:center;white-space:normal;margin-bottom:6px;}
    @media print{@page{margin:4mm;size:80mm auto;}body{font-size:12px;padding:0;}}
  </style>
</head>
<body><div class="mark">${MARK}</div>${escaped}
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body>
</html>`);
  w.document.close();
}