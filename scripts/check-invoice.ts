import { getInvoice } from "../lib/paypal";

const id = process.argv[2];
if (!id) throw new Error("Usage: tsx scripts/check-invoice.ts INVOICE_ID");

getInvoice(id).then((inv) => {
  console.log("Status:", inv.status);
  console.log("Payer link:", inv.detail?.metadata?.recipient_view_url);
});