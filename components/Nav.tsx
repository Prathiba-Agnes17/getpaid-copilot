"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import Modal from "@/components/Modal";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/copilot", label: "Copilot" },
  { href: "/about", label: "How it works" },
];

export default function Nav() {
  const path = usePathname();
  const { waiting } = useApp();
  const [sandbox, setSandbox] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow">
            G
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">GetPaid Copilot</p>
            <p className="text-[11px] text-slate-500">PayPal + AI</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
                {l.href === "/copilot" && waiting.length > 0 && (
                  <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950">
                    {waiting.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("open-welcome"))}
            aria-label="Show the tour"
            title="Show the tour"
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            ?
          </button>
          <button
            onClick={() => setSandbox(true)}
            className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 md:inline"
          >
            PayPal Sandbox
          </button>
        </div>
      </div>

      <Modal
        open={sandbox}
        onClose={() => setSandbox(false)}
        title="You're in the PayPal Sandbox"
        badge="Test mode"
        footer={
          <button
            onClick={() => setSandbox(false)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Got it
          </button>
        }
      >
        <p className="text-sm text-slate-600">
          Every invoice and payment in this app is PayPal <b>test</b> data. No real money moves and no real
          customers are contacted.
        </p>
        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          How to pay an invoice as the customer
        </h4>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">1.</span>
            Open sandbox.paypal.com in a private window.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">2.</span>
            Sign in with a sandbox <b>Personal</b> (buyer) account. Use the one in the submission&apos;s
            testing instructions, or create your own in the PayPal developer dashboard under Testing Tools
            &gt; Sandbox Accounts.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">3.</span>
            Open the invoice and pay it. The Dashboard flips to PAID within a few seconds.
          </li>
        </ol>
      </Modal>
    </header>
  );
}