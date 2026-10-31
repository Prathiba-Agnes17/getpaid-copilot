import { runAgent } from "@/lib/agent";
import { rateLimit } from "@/lib/ratelimit";

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(req: Request) {
  const started = Date.now();

  // 30 requests per visitor per 10 minutes, 300 in total per hour
  const perIp = rateLimit(`ip:${clientIp(req)}`, 30, 10 * 60_000);
  const global = perIp.ok ? rateLimit("global", 300, 60 * 60_000) : perIp;
  if (!perIp.ok || !global.ok) {
    const wait = Math.max(perIp.retryAfterSec, global.retryAfterSec);
    console.log(`[agent] rate limited, retry in ${wait}s`);
    return Response.json(
      {
        reply: `You're sending requests very quickly. Please wait about ${wait} seconds and try again.`,
        pending: [],
        steps: [],
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-20)
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: String(m.text ?? "").slice(0, 2000),
      }));
    if (messages.length === 0) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    console.log("[agent] request received, messages:", messages.length);
    const result = await runAgent(messages);
    console.log(`[agent] done in ${Date.now() - started}ms, pending: ${result.pending.length}`);
    return Response.json(result);
  } catch (err: any) {
    console.error("[agent] failed:", err?.status ?? err);
    if ([503, 429, 504].includes(err?.status)) {
      return Response.json({
        reply: "The AI model is busy right now. Please try again in a moment.",
        pending: [],
        steps: [],
      });
    }
    return Response.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}