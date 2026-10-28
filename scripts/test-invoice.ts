import { createDraftInvoice, sendInvoice, getInvoice } from "../lib/paypal";

async function main() {
  const email = process.env.PAYPAL_TEST_CLIENT_EMAIL;
  if (!email) throw new Error("Set PAYPAL_TEST_CLIENT_EMAIL in .env.local");

  const { id } = await createDraftInvoice({
    clientName: "Acme Test Client",
    clientEmail: email,
    description: "Logo design",
    amount: 1200,
  });
  console.log("Draft created:", id);

  await sendInvoice(id);
  console.log("Invoice sent");

  const invoice = await getInvoice(id);
  console.log("Status:", invoice.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});