import { connection } from "next/server";
import { listInvoices } from "@/lib/paypal";

export async function GET() {
  await connection();
  try {
    return Response.json({ invoices: await listInvoices(50) });
  } catch (err: any) {
    return Response.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}