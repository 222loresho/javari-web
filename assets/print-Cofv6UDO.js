const l={name:"JAVARI",address:"Loresho, Nairobi"},r=42,n=(t,e,o=r)=>t+" ".repeat(Math.max(1,o-t.length-e.length))+e,i=(t="-",e=r)=>t.repeat(e),s=(t,e=r)=>" ".repeat(Math.max(0,Math.floor((e-t.length)/2)))+t;function c(t){const e=[s(l.name),s(l.address),i(),n("Order:",t.order_number||""),n("Table:",t.table_name||""),n("Waiter:",t.waiter_name||""),n("Time:",new Date(t.created_at).toLocaleString("en-KE")),i(),"ITEMS:",...t.items.flatMap(o=>[n(`  ${o.product_name} x${o.quantity}`,`KSh ${o.subtotal}`),...o.note?[`    >> ${o.note}`]:[]]),i(),n("TOTAL:",`KSh ${t.total}`),i(),s("Present this bill to the cashier"),""];p(e.join(`
`))}function u(t){var d;const e=t.splits||[],o=e.length>0?e.map(a=>{const h=a.method==="mpesa"?"Mpesa":a.method==="card"?"Card":a.method==="billout"?"Billout":"Cash";return n(`  ${h}${a.ref?` (${a.ref})`:""}:`,`KSh ${a.amount}`)}):[n("  "+(t.paymentMethod||"Cash")+":",`KSh ${t.amountPaid||t.total}`)],m=[s(l.name),s(l.address),i(),n("Cashier:",t.cashier||""),n("Date:",(t.date||new Date().toLocaleString()).split(",")[0]),n("Time:",((d=(t.date||"").split(",")[1])==null?void 0:d.trim())||""),i(),"ITEMS:",...t.items.flatMap(a=>[n(`  ${a.product_name} x${a.quantity}`,`KSh ${a.subtotal}`),...a.note?[`    >> ${a.note}`]:[]]),i(),n("TOTAL:",`KSh ${t.total}`),"PAYMENT:",...o,i(),s("Thank you for visiting Javari!"),s("We hope to see you again soon."),""];p(m.join(`
`))}function p(t){const e=window.open("","_blank","width=420,height=650");if(!e){alert("Please allow pop-ups to print.");return}const o=t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");e.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Javari Print</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:"Courier New",Courier,monospace;font-size:13px;padding:12px;white-space:pre;color:#000;background:#fff;}
    @media print{@page{margin:4mm;size:80mm auto;}body{font-size:12px;padding:0;}}
  </style>
</head>
<body>${o}
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body>
</html>`),e.document.close()}export{c as printBill,u as printReceipt};
