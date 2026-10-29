import { runAgent } from "@/lib/agent";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    return Response.json(await runAgent(messages));
  } catch (err: any) {
    return Response.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}