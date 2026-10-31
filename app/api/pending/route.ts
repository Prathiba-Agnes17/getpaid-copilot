import { listPending } from "@/lib/db";

export async function GET() {
  return Response.json({ items: listPending() });
}