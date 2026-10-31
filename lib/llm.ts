import { GoogleGenAI } from "@google/genai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let client: GoogleGenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generate(params: { contents: any[]; config?: any }) {
    const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const models = [process.env.GEMINI_MODEL ?? "gemini-3.8-flash", ...fallbacks];
  const delays = [1000, 3000, 8000];
  let lastErr: any;

  for (const model of models) {
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await getClient().models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastErr = err;
        console.log(`[llm] ${model} attempt ${attempt + 1} failed: ${err?.status ?? err}`);
        if (err?.status !== 503 && err?.status !== 429) throw err;
        if (attempt < delays.length) await sleep(delays[attempt]);
      }
    }
  }
  throw lastErr;
}