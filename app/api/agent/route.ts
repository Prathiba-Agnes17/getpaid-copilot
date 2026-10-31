import { runAgent } from "@/lib/agent";

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const { messages } = await req.json();
    console.log("[agent] request received, messages:", messages.length);
    const result = await runAgent(messages);
    console.log(`[agent] done in ${Date.now() - started}ms, pending: ${result.pending.length}`);
    return Response.json(result);
  } catch (err: any) {
    console.error("[agent] failed:", err);
    return Response.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}