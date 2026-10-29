import { decide } from "@/lib/approvals";

export async function POST(req: Request) {
  try {
    const { id, decision } = await req.json();
    return Response.json({ item: await decide(id, decision) });
  } catch (err: any) {
    return Response.json({ error: String(err.message ?? err) }, { status: 400 });
  }
}