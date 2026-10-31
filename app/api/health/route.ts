import { generate } from "@/lib/llm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const env = {
    paypal_id: !!process.env.PAYPAL_CLIENT_ID,
    paypal_secret: !!process.env.PAYPAL_CLIENT_SECRET,
    gemini_key: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? null,
    fallbacks: process.env.GEMINI_FALLBACK_MODELS ?? null,
  };
  if (url.searchParams.get("llm") !== "1") return Response.json({ env });

  const started = Date.now();
  try {
    const res = await generate({
      contents: [{ role: "user", parts: [{ text: "Reply with the single word: ok" }] }],
    });
    return Response.json({ env, llm: "ok", ms: Date.now() - started, text: res.text });
  } catch (e: any) {
    return Response.json(
      {
        env,
        llm: "failed",
        ms: Date.now() - started,
        status: e?.status ?? null,
        error: String(e?.message ?? e).slice(0, 200),
      },
      { status: 500 }
    );
  }
}