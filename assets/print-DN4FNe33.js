var e={name:`JAVARI`,address:`Loresho, Nairobi`},t=42,n=(e,n,r=t)=>e+` `.repeat(Math.max(1,r-e.length-n.length))+n,r=(e=`-`,n=t)=>e.repeat(n),i=(e,n=t)=>` `.repeat(Math.max(0,Math.floor((n-e.length)/2)))+e;function a(t){s([i(e.name),i(e.address),r(),n(`Order:`,t.order_number||``),n(`Table:`,t.table_name||``),n(`Waiter:`,t.waiter_name||``),n(`Time:`,new Date(t.created_at).toLocaleString(`en-KE`)),r(),`ITEMS:`,...t.items.flatMap(e=>[n(`  ${e.product_name} x${e.quantity}`,`KSh ${e.subtotal}`),...e.note?[`    >> ${e.note}`]:[]]),r(),n(`TOTAL:`,`KSh ${t.total}`),r(),i(`Present this bill to the cashier`),``].join(`
`))}function o(t){let a=t.splits||[],o=a.length>0?a.map(e=>n(`  ${e.method===`mpesa`?`Mpesa`:e.method===`card`?`Card`:e.method===`billout`?`Billout`:`Cash`}${e.ref?` (${e.ref})`:``}:`,`KSh ${e.amount}`)):[n(`  `+(t.paymentMethod||`Cash`)+`:`,`KSh ${t.amountPaid||t.total}`)];s([i(e.name),i(e.address),r(),n(`Cashier:`,t.cashier||``),n(`Date:`,(t.date||new Date().toLocaleString()).split(`,`)[0]),n(`Time:`,(t.date||``).split(`,`)[1]?.trim()||``),r(),`ITEMS:`,...t.items.flatMap(e=>[n(`  ${e.product_name} x${e.quantity}`,`KSh ${e.subtotal}`),...e.note?[`    >> ${e.note}`]:[]]),r(),n(`TOTAL:`,`KSh ${t.total}`),`PAYMENT:`,...o,r(),i(`Thank you for visiting Javari!`),i(`We hope to see you again soon.`),``].join(`
`))}function s(e){let t=window.open(``,`_blank`,`width=420,height=650`);if(!t){alert(`Please allow pop-ups to print.`);return}let n=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);t.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Javari Print</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:"Courier New",Courier,monospace;font-size:13px;padding:12px;white-space:pre;color:#000;background:#fff;}
    @media print{@page{margin:4mm;size:80mm auto;}body{font-size:12px;padding:0;}}
  </style>
</head>
<body>${n}
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body>
</html>`),t.document.close()}export{a as printBill,o as printReceipt};