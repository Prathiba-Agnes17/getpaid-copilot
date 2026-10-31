"use client";
import { useEffect, useRef, useState } from "react";
import { useApp, type Pending, type Step } from "@/components/AppProvider";
import Modal from "@/components/Modal";
import DetailModal from "@/components/DetailModal";
import { GUIDE } from "@/lib/content";

const EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "client@example.com";

const SUGGESTIONS = [
  `Draft a $450 invoice for Acme (${EMAIL}) for website maintenance, due in 7 days`,
  "Which invoices are unpaid?",
  "Send a reminder for my oldest unpaid invoice",
];

const PROMPTS: (string | undefined)[] = [SUGGESTIONS[0], "Yes, send that invoice.", undefined, undefined, SUGGESTIONS[2]];

function Check({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
      }`}
    >
      {done ? "✓" : ""}
    </span>
  );
}

export default function CopilotPage() {
  const { messages, busy, input, setInput, send, waiting, done, decide, progress } = useApp();
  const [showGuide, setShowGuide] = useState(true);
  const [stepIdx, setStepIdx] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [chip, setChip] = useState<Step | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const flags = [progress.drafted, progress.requested, progress.approved, progress.paid, progress.reminded];
  const doneCount = flags.filter(Boolean).length;
  const stepPrompt = stepIdx !== null ? PROMPTS[stepIdx] : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Copilot</h1>
        <p className="text-sm text-slate-500">Talk to the agent. Review what it wants to send.</p>
      </div>

      {showGuide ? (
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quick start</h2>
              <p className="text-xs text-slate-500">
                {doneCount} of {GUIDE.length} steps done. Click any card for details.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="rounded-lg px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Hide
            </button>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
              style={{ width: `${(doneCount / GUIDE.length) * 100}%` }}
            />
          </div>
          <ol className="grid gap-3 md:grid-cols-5">
            {GUIDE.map((g, i) => (
              <li key={g.title}>
                <button
                  onClick={() => setStepIdx(i)}
                  className={`h-full w-full rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    flags[i] ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Check done={flags[i]} />
                    <span className="text-xs font-semibold text-slate-500">STEP {i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{g.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{g.summary}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-blue-700">See details →</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm ring-1 ring-blue-200"
        >
          Show quick start guide
        </button>
      )}

      <main className="grid gap-5 md:grid-cols-[1fr_380px]">
        <section className="flex h-[600px] min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-base font-semibold text-slate-900">Chat</h2>
            </div>
            <span className="text-xs text-slate-400">Powered by Gemini + PayPal tools</span>
          </div>
          <div ref={chatRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Hi! I can draft invoices, check who has paid, and chase late payments. Anything that
                  contacts a client waits for your approval.
                </p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%] space-y-2">
                  {m.role === "assistant" && m.steps && m.steps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.steps.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => setChip(s)}
                          title="Click to see the exact tool call"
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition hover:shadow ${
                            s.risky
                              ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200"
                              : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100"
                          }`}
                        >
                          {s.risky ? "⏸ " : "⚙ "}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Working with PayPal...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-4">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Copilot to invoice, check, or chase..."
            />
            <button
              onClick={() => send()}
              disabled={busy}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </section>

        <aside className="h-[600px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Approval inbox</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {waiting.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Human in the loop: the AI can read and draft, but cannot send anything until you approve.
          </p>
          {waiting.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Nothing waiting. Ask Copilot to send an invoice or a reminder and it will show up here.
            </p>
          )}
          {waiting.map((p) => (
            <div key={p.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {p.tool === "send_invoice" ? "Send invoice" : "Send reminder"}
              </p>
              <p className="mt-1 text-sm text-slate-900">{p.summary}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setConfirm(p)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(p.id, "reject")}
                  className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {done.length > 0 && (
            <>
              <h3 className="pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent decisions
              </h3>
              {done.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-start gap-2 text-xs text-slate-600">
                  <span
                    className={`mt-0.5 rounded px-1.5 py-0.5 font-semibold ${
                      p.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "rejected"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {p.status}
                  </span>
                  <span>{p.summary}</span>
                </div>
              ))}
            </>
          )}
        </aside>
      </main>

      <DetailModal
        detail={stepIdx !== null ? GUIDE[stepIdx] : null}
        onClose={() => setStepIdx(null)}
        badge={stepIdx !== null ? `Step ${stepIdx + 1} of ${GUIDE.length}` : undefined}
        action={
          stepPrompt ? (
            <button
              onClick={() => {
                setInput(stepPrompt);
                setStepIdx(null);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Use this prompt
            </button>
          ) : undefined
        }
      />

      <Modal
        open={!!chip}
        onClose={() => setChip(null)}
        title={chip?.label ?? ""}
        badge={chip?.risky ? "Queued, needs approval" : "Ran automatically"}
        footer={
          <button
            onClick={() => setChip(null)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
          >
            Close
          </button>
        }
      >
        {chip && (
          <>
            <p className="text-sm text-slate-600">
              {chip.risky
                ? "The AI asked for this action. The server did not call PayPal. It saved the request in the Approval inbox, and it only runs if you approve it."
                : "The AI chose this tool by itself, and the server ran it against the PayPal sandbox."}
            </p>
            <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tool the AI called
            </h4>
            <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">{chip.tool}</div>
            <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Arguments the AI chose
            </h4>
            <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
              {JSON.stringify(chip.args ?? {}, null, 2)}
            </pre>
          </>
        )}
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.tool === "send_invoice" ? "Send this invoice?" : "Send this reminder?"}
        badge="Human approval"
        footer={
          <>
            <button
              onClick={() => setConfirm(null)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirm) decide(confirm.id, "approve");
                setConfirm(null);
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Yes, send it
            </button>
          </>
        }
      >
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-slate-900 ring-1 ring-amber-200">
          {confirm?.summary}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          This will call the PayPal Invoicing API (sandbox) and the client will receive it. Nothing was
          sent before this click.
        </p>
      </Modal>
    </div>
  );
}