"use client";
import { useState } from "react";
import Link from "next/link";
import DetailModal from "@/components/DetailModal";
import { FLOW, TOOLS, type Detail } from "@/lib/content";

const STACK = [
  ["PayPal Invoicing API (sandbox)", "Create drafts, send invoices, send reminders, list and check status"],
  ["PayPal OAuth 2.0", "Server-side access tokens, secrets never reach the browser"],
  ["Gemini function calling", "The agent that chooses and sequences the tools"],
  ["AG Grid", "Live, sortable and filterable invoice table"],
  ["Next.js + Tailwind", "App, API routes and UI"],
];

export default function About() {
  const [open, setOpen] = useState<{ detail: Detail; badge: string } | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-500">
          An AI agent that handles the boring parts of getting paid, with a human on the money button.
          Click any card for details.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">The flow</h2>
        <ol className="grid gap-3 md:grid-cols-5">
          {FLOW.map((s, i) => (
            <li key={s.title}>
              <button
                onClick={() => setOpen({ detail: s, badge: `Flow step ${i + 1}` })}
                className="h-full w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.summary}</p>
                <span className="mt-2 inline-block text-xs font-medium text-blue-700">Details →</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">The safety model</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          The model can only <b>queue</b> risky actions. The code that actually sends runs only after a
          person approves it, so a wrong or manipulated AI answer cannot contact a client by itself.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {TOOLS.map((t) => (
            <button
              key={t.name}
              onClick={() => setOpen({ detail: t, badge: t.kind })}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:shadow-md"
            >
              <div>
                <p className="font-mono text-xs text-slate-900">{t.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.note}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  t.kind === "Needs approval"
                    ? "bg-amber-100 text-amber-800"
                    : t.kind === "Draft"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {t.kind}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Built with</h2>
        <ul className="divide-y divide-slate-100">
          {STACK.map(([n, d]) => (
            <li key={n} className="flex flex-col gap-0.5 py-2 md:flex-row md:justify-between">
              <span className="text-sm font-medium text-slate-900">{n}</span>
              <span className="text-sm text-slate-500">{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-base font-semibold text-slate-900">Try it in 2 minutes</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Open <Link href="/copilot" className="font-semibold text-blue-700 underline">Copilot</Link> and use a suggested prompt to draft an invoice.</li>
          <li>Ask it to send the invoice, then approve the request in the Approval inbox.</li>
          <li>Open the <Link href="/" className="font-semibold text-blue-700 underline">Dashboard</Link> and watch the status turn SENT.</li>
          <li>Pay it with the sandbox buyer account at sandbox.paypal.com. The row flips to PAID by itself.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">All money here is PayPal sandbox test money.</p>
      </section>

      <DetailModal detail={open?.detail ?? null} badge={open?.badge} onClose={() => setOpen(null)} />
    </div>
  );
}