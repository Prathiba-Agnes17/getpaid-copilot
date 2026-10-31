"use client";
import { useState } from "react";
import Link from "next/link";
import InvoiceGrid, { type Row } from "@/components/InvoiceGrid";
import Modal from "@/components/Modal";
import { money, useApp } from "@/components/AppProvider";

type StatKey = "paid" | "outstanding" | "rate" | "drafts";

const OUTSTANDING = ["SENT", "UNPAID", "PARTIALLY_PAID"];

export default function Dashboard() {
  const { rows, gridError, updated, stats, waiting, done, openInvoice } = useApp();
  const [stat, setStat] = useState<StatKey | null>(null);

  const cards: { key: StatKey; label: string; value: string; sub: string; tone: string; bar: string }[] = [
    { key: "paid", label: "Collected", value: money(stats.paid), sub: `${stats.paidCount} paid invoice${stats.paidCount === 1 ? "" : "s"}`, tone: "text-emerald-600", bar: "bg-emerald-500" },
    { key: "outstanding", label: "Outstanding", value: money(stats.outstanding), sub: `${stats.sentCount} waiting on clients`, tone: "text-blue-600", bar: "bg-blue-500" },
    { key: "rate", label: "Collection rate", value: `${stats.rate}%`, sub: "paid vs. outstanding", tone: "text-indigo-600", bar: "bg-indigo-500" },
    { key: "drafts", label: "Drafts", value: String(stats.draftCount), sub: "not sent yet", tone: "text-slate-700", bar: "bg-slate-400" },
  ];

  const meta: Record<StatKey, { title: string; blurb: string; filter: (r: Row) => boolean }> = {
    paid: { title: "Collected", blurb: "Invoices your clients have paid.", filter: (r) => r.status === "PAID" },
    outstanding: { title: "Outstanding", blurb: "Invoices sent and waiting for payment.", filter: (r) => OUTSTANDING.includes(r.status) },
    rate: {
      title: "Collection rate",
      blurb: `Paid divided by paid plus outstanding: ${money(stats.paid)} of ${money(stats.paid + stats.outstanding)} (${stats.rate}%). Drafts are not counted.`,
      filter: (r) => r.status === "PAID" || OUTSTANDING.includes(r.status),
    },
    drafts: { title: "Drafts", blurb: "Created in PayPal but not sent to the client yet.", filter: (r) => r.status === "DRAFT" },
  };

  const list = stat ? rows.filter(meta[stat].filter) : [];

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 pb-24 pt-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5">
          <div>
            <h1 className="text-2xl font-semibold">Get paid faster, with an AI you control</h1>
            <p className="mt-1 max-w-xl text-sm text-blue-100">
              Copilot drafts invoices and chases late payments through PayPal. Anything that contacts a
              client waits for your approval.
            </p>
          </div>
          <Link
            href="/copilot"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50"
          >
            Open Copilot →
          </Link>
        </div>
      </div>

      <div className="mx-auto -mt-16 max-w-6xl space-y-5 px-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((s) => (
            <button
              key={s.key}
              onClick={() => setStat(s.key)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`mb-3 h-1 w-10 rounded-full ${s.bar}`} />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
            </button>
          ))}
        </div>

        {waiting.length > 0 && (
          <Link
            href="/copilot"
            className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900 shadow-sm"
          >
            <span>
              <b>{waiting.length}</b> AI action{waiting.length === 1 ? " is" : "s are"} waiting for your
              approval.
            </span>
            <span className="font-semibold">Review →</span>
          </Link>
        )}

        <InvoiceGrid rows={rows} updated={updated} error={gridError} onRowClick={openInvoice} />
        <p className="-mt-3 text-xs text-slate-400">
          Tip: click a stat card or any invoice row for details.
        </p>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Recent approvals</h2>
          {done.length === 0 ? (
            <p className="text-sm text-slate-500">
              No decisions yet. Ask Copilot to send an invoice, then approve it.
            </p>
          ) : (
            <ul className="space-y-2">
              {done.map((p) => (
                <li key={p.id} className="flex items-start gap-2 text-sm text-slate-700">
                  <span
                    className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={!!stat}
        onClose={() => setStat(null)}
        title={stat ? meta[stat].title : ""}
        badge="Breakdown"
        footer={
          <button
            onClick={() => setStat(null)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
          >
            Close
          </button>
        }
      >
        {stat && (
          <>
            <p className="text-sm text-slate-600">{meta[stat].blurb}</p>
            {list.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No invoices here yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {list.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        setStat(null);
                        openInvoice(r);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{r.client ?? "Client"}</span>
                        <span className="block font-mono text-[11px] text-slate-400">{r.id}</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {r.amount ? money(Number(r.amount)) : "-"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}