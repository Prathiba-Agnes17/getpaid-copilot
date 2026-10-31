"use client";
import type { ReactNode } from "react";
import Modal from "@/components/Modal";
import type { Detail } from "@/lib/content";

export default function DetailModal({
  detail,
  onClose,
  badge,
  action,
}: {
  detail: Detail | null;
  onClose: () => void;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <Modal
      open={!!detail}
      onClose={onClose}
      title={detail?.title ?? ""}
      badge={badge}
      footer={
        <>
          {action}
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
          >
            Close
          </button>
        </>
      }
    >
      {detail && (
        <>
          <p className="text-sm text-slate-600">{detail.summary}</p>
          <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            What happens
          </h4>
          <ol className="space-y-2">
            {detail.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {detail.api && (
            <>
              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Behind the scenes
              </h4>
              <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">{detail.api}</div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}