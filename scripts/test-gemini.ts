import { GoogleGenAI } from "@google/genai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generate(ai: GoogleGenAI, model: string, prompt: string) {
  const delays = [1000, 3000, 8000]; // wait between retries
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai.models.generateContent({ model, contents: prompt });
      return res.text;
    } catch (err: any) {
      const retryable = err?.status === 503 || err?.status === 429;
      if (!retryable || attempt >= delays.length) throw err;
      console.log(`${model} busy (${err.status}), retrying in ${delays[attempt] / 1000}s...`);
      await sleep(delays[attempt]);
    }
  }
}

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env.local");
  const ai = new GoogleGenAI({ apiKey: key });

  const models = [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(
    Boolean
  ) as string[];

  for (const model of models) {
    try {
      console.log(`Trying ${model}...`);
      console.log(await generate(ai, model, "Reply with exactly five words about invoices."));
      return;
    } catch (err: any) {
      console.log(`${model} failed: ${err?.status ?? err}`);
    }
  }
  throw new Error("All models failed. Try again in a few minutes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});