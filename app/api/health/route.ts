import { Type } from "@google/genai";
import { generate } from "@/lib/llm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const models = [process.env.GEMINI_MODEL ?? "gemini-3.8-flash", ...fallbacks];

  const env = {
    paypal_id: !!process.env.PAYPAL_CLIENT_ID,
    paypal_secret: !!process.env.PAYPAL_CLIENT_SECRET,
    gemini_key: !!process.env.GEMINI_API_KEY,
    models,
  };
  if (url.searchParams.get("llm") !== "1") return Response.json({ env });

  const tools = [
    {
      functionDeclarations: [
        { name: "get_time", description: "Returns the current time." },
      ],
    },
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      const started = Date.now();
      try {
        const res = await generate({
          models: [model],
          contents: [{ role: "user", parts: [{ text: "What time is it? Use the get_time tool." }] }],
          config: { tools },
        });
        return {
          model,
          ok: true,
          ms: Date.now() - started,
          calledTool: (res.functionCalls?.length ?? 0) > 0,
        };
      } catch (e: any) {
        return {
          model,
          ok: false,
          ms: Date.now() - started,
          status: e?.status ?? null,
          error: String(e?.message ?? e).slice(0, 160),
        };
      }
    })
  );
  return Response.json({ env, results });
}