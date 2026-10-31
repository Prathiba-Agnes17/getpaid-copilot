import { generate } from "./llm";
import { functionDeclarations, RISKY, runSafeTool, queueRiskyTool } from "./tools";
import type { PendingAction } from "./db";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AgentStep {
  tool: string;
  label: string;
  risky: boolean;
  args: Record<string, any>;
}

const LABELS: Record<string, string> = {
  list_invoices: "Looked up invoices in PayPal",
  get_invoice_status: "Checked invoice status",
  create_invoice_draft: "Created draft invoice",
  send_invoice: "Queued invoice send, needs your approval",
  send_reminder: "Queued payment reminder, needs your approval",
};

const SYSTEM = `You are GetPaid Copilot, an assistant that helps freelancers and small businesses
get paid using PayPal invoices.
- Use the tools to look up, draft, send and chase invoices. Never invent invoice IDs or data.
- If the user hasn't given a client email, amount or description for a new invoice, ask for it.
- Only call send_invoice or send_reminder when the user explicitly asks to send an invoice or a reminder.
  If they only ask to create or draft an invoice, create the draft, then ask whether they want it sent.
- Sending an invoice or a reminder requires the user's approval. After you call send_invoice or
  send_reminder, tell the user it is waiting for their approval. Never say it has been sent.
- Reminders should be polite, short and mention the amount and due date.
- Be concise.`;

export async function runAgent(history: ChatMessage[]) {
  const contents: any[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const newPending: PendingAction[] = [];
  const steps: AgentStep[] = [];
  const deadline = Date.now() + 70_000;

  for (let round = 0; round < 6; round++) {
    if (Date.now() > deadline) {
      console.log("[agent] time budget exceeded");
      return {
        reply: "That is taking longer than expected. The AI service may be busy, so please try again in a moment.",
        pending: newPending,
        steps,
      };
    }

    console.log(`[agent] round ${round + 1}: calling model`);
    const res = await generate({
      contents,
      config: { systemInstruction: SYSTEM, tools: [{ functionDeclarations }] },
    });

    const calls = res.functionCalls ?? [];
    console.log(`[agent] round ${round + 1}: model returned ${calls.length} tool call(s)`);
    if (calls.length === 0) return { reply: res.text ?? "", pending: newPending, steps };

    const modelContent = res.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const responseParts: any[] = [];
    for (const call of calls) {
      const name = call.name as string;
      const args = (call.args ?? {}) as Record<string, any>;
      steps.push({ tool: name, label: LABELS[name] ?? name, risky: RISKY.has(name), args });
      console.log(`[agent] tool ${name}: start`);
      const t0 = Date.now();
      let output: any;
      try {
        if (RISKY.has(name)) {
          const p = await queueRiskyTool(name, args);
          newPending.push(p);
          output = {
            status: "pending_approval",
            action_id: p.id,
            note: "NOT executed yet. Waiting for the user to approve it in the UI.",
          };
        } else {
          output = await runSafeTool(name, args);
        }
        console.log(`[agent] tool ${name}: ok in ${Date.now() - t0}ms`);
      } catch (err: any) {
        console.log(`[agent] tool ${name}: failed in ${Date.now() - t0}ms: ${String(err.message ?? err).slice(0, 160)}`);
        output = { error: String(err.message ?? err) };
      }
      responseParts.push({ functionResponse: { name, response: { output } } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "I reached my step limit. Please try a simpler request.",
    pending: newPending,
    steps,
  };
}