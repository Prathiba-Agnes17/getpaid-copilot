import { runAgent, ChatMessage } from "../lib/agent";
import { decide } from "../lib/approvals";
import { getInvoice } from "../lib/paypal";

async function main() {
  const email = process.env.PAYPAL_TEST_CLIENT_EMAIL!;
  const history: ChatMessage[] = [
    {
      role: "user",
      text: `Invoice Acme Corp (${email}) $450 for website maintenance, due in 7 days, and send it.`,
    },
  ];

  const out = await runAgent(history);
  console.log("AGENT:", out.reply);
  console.log("PENDING:", out.pending.map((p) => `${p.id} -> ${p.summary}`));

  if (out.pending.length === 0) return;
  const p = out.pending[0];
  const before = await getInvoice(p.args.invoice_id);
  console.log("Status before approval:", before.status); // expect DRAFT

  console.log("Approving...");
  const result = await decide(p.id, "approve");
  console.log("Approval result:", result?.status);

  const after = await getInvoice(p.args.invoice_id);
  console.log("Status after approval:", after.status); // expect SENT
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});