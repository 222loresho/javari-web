const STORE = { name: "JAVARI", address: "Loresho, Nairobi" };
const W     = 42;

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
    @media print{@page{margin:4mm;size:80mm auto;}body{font-size:12px;padding:0;}}
  </style>
</head>
<body>${escaped}
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body>
</html>`);
  w.document.close();
}