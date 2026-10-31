"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

const KEY = "cc_welcome_seen_v1";

export default function Welcome() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
    const reopen = () => setOpen(true);
    window.addEventListener("open-welcome", reopen);
    return () => window.removeEventListener("open-welcome", reopen);
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
  }

  const steps = [
    { t: "Ask the AI to draft an invoice", d: "In Copilot, use a suggested prompt. Gemini creates a real draft through the PayPal Invoicing API." },
    { t: "Approve the send", d: "The AI can only request a send. You approve it in the Approval inbox, and only then does PayPal send it." },
    { t: "Pay it and watch it update", d: "Pay as the sandbox buyer. The Dashboard flips to PAID by itself and a popup confirms it." },
  ];

  return (
    <Modal
      open={open}
      onClose={close}
      title="Welcome to GetPaid Copilot"
      badge="30-second tour"
      footer={
        <>
          <button
            onClick={close}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
          >
            Explore on my own
          </button>
          <Link
            href="/copilot"
            onClick={close}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start with Copilot →
          </Link>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        An AI agent that helps freelancers and small businesses get paid. It drafts invoices and chases
        late payments through <b>PayPal</b>, and it can never send anything without your approval.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{s.t}</p>
              <p className="text-xs leading-relaxed text-slate-600">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
        Everything runs in the PayPal sandbox. All money is test money.
      </p>
    </Modal>
  );
}