import { GoogleGenAI } from "@google/genai";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(Object.assign(new Error("Model call timed out"), { status: 504 })),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

let client: GoogleGenAI | null = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generate(params: { contents: any[]; config?: any; models?: string[] }) {
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const models = params.models ?? [process.env.GEMINI_MODEL ?? "gemini-3.8-flash", ...fallbacks];

  let lastErr: any;
  for (const model of models) {
    const t0 = Date.now();
    try {
      return await withTimeout(
        getClient().models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        }),
        20000
      );
    } catch (err: any) {
      lastErr = err;
      console.log(
        `[llm] ${model} failed after ${Date.now() - t0}ms: ${
          err?.status ?? String(err?.message ?? err).slice(0, 100)
        }`
      );
    }
  }
  throw lastErr;
}