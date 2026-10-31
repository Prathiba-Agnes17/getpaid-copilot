"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Row } from "@/components/InvoiceGrid";
import Modal from "@/components/Modal";

export type Step = { tool: string; label: string; risky: boolean; args?: Record<string, any> };
export type Msg = { role: "user" | "assistant"; text: string; steps?: Step[] };
export type Pending = {
  id: string;
  tool: string;
  summary: string;
  status: "pending" | "approved" | "rejected" | "failed";
};
type Toast = { id: number; kind: "success" | "error" | "info"; text: string; invoiceId?: string };

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const PILLS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  SENT: "bg-blue-100 text-blue-800",
  DRAFT: "bg-slate-200 text-slate-700",
  UNPAID: "bg-amber-100 text-amber-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-violet-100 text-violet-800",
};

type Ctx = {
  rows: Row[];
  gridError: string | null;
  updated: string;
  items: Pending[];
  waiting: Pending[];
  done: Pending[];
  messages: Msg[];
  busy: boolean;
  input: string;
  setInput: (v: string) => void;
  send: (text?: string) => Promise<void>;
  decide: (id: string, decision: "approve" | "reject") => Promise<void>;
  notify: (kind: Toast["kind"], text: string, invoiceId?: string) => void;
  openInvoice: (r: Row | string) => void;
  progress: { drafted: boolean; requested: boolean; approved: boolean; paid: boolean; reminded: boolean };
  stats: {
    paid: number;
    outstanding: number;
    rate: number;
    paidCount: number;
    sentCount: number;
    draftCount: number;
  };
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Pending[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [gridError, setGridError] = useState<string | null>(null);
  const [updated, setUpdated] = useState("");
  const [sawPending, setSawPending] = useState(false);
  const [approvedNow, setApprovedNow] = useState(false);
  const [baselinePaid, setBaselinePaid] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const prevStatus = useRef<Record<string, string>>({});
  const rowsRef = useRef<Row[]>([]);

  const notify = useCallback((kind: Toast["kind"], text: string, invoiceId?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text, invoiceId }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
  }, []);

  const openInvoice = useCallback((r: Row | string) => {
    const row = typeof r === "string" ? rowsRef.current.find((x) => x.id === r) : r;
    if (row) setSelected(row);
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      const r = await fetch("/api/pending");
      setItems((await r.json()).items ?? []);
    } catch {}
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const data = await (await fetch("/api/invoices")).json();
      if (data.error) throw new Error(data.error);
      const list: Row[] = data.invoices ?? [];

      const prev = prevStatus.current;
      const first = Object.keys(prev).length === 0;
      for (const r of list) {
        const before = prev[r.id];
        if (!first && before && before !== r.status) {
          if (r.status === "PAID") {
            notify(
              "success",
              `Payment received: ${r.client ?? r.id} paid ${money(Number(r.amount ?? 0))}`,
              r.id
            );
          } else if (r.status === "SENT") {
            notify("info", `Invoice sent to ${r.client ?? "client"}`, r.id);
          }
        }
        prev[r.id] = r.status;
      }

      rowsRef.current = list;
      setRows(list);
      setBaselinePaid((b) => (b === null ? list.filter((r) => r.status === "PAID").length : b));
      setGridError(null);
      setUpdated(new Date().toLocaleTimeString());
    } catch (e: any) {
      setGridError(e.message);
    }
  }, [notify]);

  useEffect(() => {
    refreshPending();
    refreshInvoices();
    const tick = (fn: () => void) => () => {
      if (!document.hidden) fn();
    };
    const a = setInterval(tick(refreshPending), 5000);
    const b = setInterval(tick(refreshInvoices), 10000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [refreshPending, refreshInvoices]);

  const waiting = items.filter((i) => i.status === "pending");
  const done = items.filter((i) => i.status !== "pending").slice(0, 8);

  useEffect(() => {
    if (waiting.length > 0) setSawPending(true);
  }, [waiting.length]);

  const send = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || busy) return;
      const next: Msg[] = [...messages, { role: "user", text }];
      setMessages(next);
      setInput("");
      setBusy(true);
      try {
        const r = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })) }),
        });
        const data = await r.json();
        if (data.error) notify("error", `AI request failed: ${String(data.error).slice(0, 140)}`);
        else if (data.pending?.length) notify("info", "An action is waiting for your approval");
        setMessages([
          ...next,
          { role: "assistant", text: data.reply ?? `Error: ${data.error}`, steps: data.steps ?? [] },
        ]);
      } catch (e: any) {
        notify("error", `Could not reach the server: ${e.message}`);
        setMessages([...next, { role: "assistant", text: `Error: ${e.message}` }]);
      }
      setBusy(false);
      refreshPending();
      refreshInvoices();
    },
    [input, busy, messages, notify, refreshPending, refreshInvoices]
  );

  const decide = useCallback(
    async (id: string, decision: "approve" | "reject") => {
      try {
        const r = await fetch("/api/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, decision }),
        });
        const data = await r.json();
        if (data.error) {
          notify("error", String(data.error).slice(0, 140));
        } else if (data.item?.status === "failed") {
          notify(
            "error",
            `PayPal rejected it: ${String(data.item.result?.error ?? "unknown error").slice(0, 140)}`
          );
        } else if (decision === "approve") {
          setApprovedNow(true);
          notify("success", "Approved. Sent through PayPal.");
        } else {
          notify("info", "Rejected. Nothing was sent.");
        }
      } catch (e: any) {
        notify("error", `Approval failed: ${e.message}`);
      }
      refreshPending();
      refreshInvoices();
    },
    [notify, refreshPending, refreshInvoices]
  );

  const sum = (f: (r: Row) => boolean) =>
    rows.filter(f).reduce((t, r) => t + Number(r.amount ?? 0), 0);
  const paid = sum((r) => r.status === "PAID");
  const outstanding = sum((r) => ["SENT", "UNPAID", "PARTIALLY_PAID"].includes(r.status));
  const paidCount = rows.filter((r) => r.status === "PAID").length;
  const stats = {
    paid,
    outstanding,
    rate: paid + outstanding > 0 ? Math.round((paid / (paid + outstanding)) * 100) : 0,
    paidCount,
    sentCount: rows.filter((r) => ["SENT", "UNPAID", "PARTIALLY_PAID"].includes(r.status)).length,
    draftCount: rows.filter((r) => r.status === "DRAFT").length,
  };

  const progress = {
    drafted: messages.some((m) => m.steps?.some((s) => s.tool === "create_invoice_draft")),
    requested: sawPending,
    approved: approvedNow,
    paid: baselinePaid !== null && paidCount > baselinePaid,
    reminded: items.some((i) => i.tool === "send_reminder" && i.status === "approved"),
  };

  // Keep the open invoice popup live, so its status flips when the client pays
  const live = selected ? rows.find((r) => r.id === selected.id) ?? selected : null;
  const unpaid = live ? ["SENT", "UNPAID", "PARTIALLY_PAID"].includes(live.status) : false;

  function ask(text: string) {
    setInput(text);
    setSelected(null);
    router.push("/copilot");
  }

  return (
    <AppCtx.Provider
      value={{
        rows,
        gridError,
        updated,
        items,
        waiting,
        done,
        messages,
        busy,
        input,
        setInput,
        send,
        decide,
        notify,
        openInvoice,
        progress,
        stats,
      }}
    >
      <div className="fixed right-4 top-20 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setToasts((x) => x.filter((y) => y.id !== t.id));
              if (t.invoiceId) openInvoice(t.invoiceId);
            }}
            className={`pop flex items-start gap-2 rounded-xl border px-4 py-3 text-left text-sm shadow-lg ${
              t.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : t.kind === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            <span className="mt-0.5 font-bold">
              {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
            </span>
            <span>
              {t.text}
              {t.invoiceId && <span className="mt-0.5 block text-xs font-semibold opacity-70">View invoice →</span>}
            </span>
          </button>
        ))}
      </div>

      {children}

      <Modal
        open={!!live}
        onClose={() => setSelected(null)}
        title={live?.client ?? "Invoice"}
        badge="Invoice details"
        footer={
          live && (
            <>
              {unpaid && (
                <button
                  onClick={() => ask(`Send a reminder for invoice ${live.id}`)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Draft a reminder
                </button>
              )}
              <button
                onClick={() => ask(`What is the status of invoice ${live.id}?`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Ask Copilot
              </button>
            </>
          )
        }
      >
        {live && (
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  PILLS[live.status] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {live.status.replace("_", " ")}
              </span>
            </dd>
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-semibold text-slate-900">
              {live.amount
                ? Number(live.amount).toLocaleString("en-US", {
                    style: "currency",
                    currency: live.currency || "USD",
                  })
                : "-"}
            </dd>
            <dt className="text-slate-500">Client email</dt>
            <dd className="break-all text-slate-900">{live.email ?? "-"}</dd>
            <dt className="text-slate-500">Due date</dt>
            <dd className="text-slate-900">{live.due_date ?? "-"}</dd>
            <dt className="text-slate-500">Invoice ID</dt>
            <dd className="break-all font-mono text-xs text-slate-700">{live.id}</dd>
          </dl>
        )}
      </Modal>
    </AppCtx.Provider>
  );
}