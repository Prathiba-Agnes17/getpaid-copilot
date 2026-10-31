"use client";
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export type Row = {
  id: string;
  status: string;
  client: string | null;
  email: string | null;
  amount: string | null;
  currency: string | null;
  due_date: string | null;
};

const PILLS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  SENT: "bg-blue-100 text-blue-800",
  DRAFT: "bg-slate-200 text-slate-700",
  UNPAID: "bg-amber-100 text-amber-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-violet-100 text-violet-800",
};

function StatusCell(p: ICellRendererParams<Row, string>) {
  const s = p.value ?? "";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        PILLS[s] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {s.replace("_", " ")}
    </span>
  );
}

const theme = themeQuartz.withParams({
  accentColor: "#2563eb",
  headerBackgroundColor: "#f8fafc",
  headerTextColor: "#475569",
  borderColor: "#e2e8f0",
  rowHoverColor: "#f1f5f9",
  fontFamily: "inherit",
  wrapperBorderRadius: 12,
});

export default function InvoiceGrid({
  rows,
  updated,
  error,
  onRowClick,
}: {
  rows: Row[];
  updated: string;
  error: string | null;
  onRowClick?: (row: Row) => void;
}) {
  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      { field: "id", headerName: "Invoice", minWidth: 230 },
      { field: "client", headerName: "Client" },
      { field: "email", headerName: "Email", minWidth: 240 },
      {
        headerName: "Amount",
        valueGetter: (p) => (p.data?.amount ? Number(p.data.amount) : null),
        valueFormatter: (p) =>
          p.value == null
            ? ""
            : Number(p.value).toLocaleString("en-US", {
                style: "currency",
                currency: p.data?.currency || "USD",
              }),
        type: "numericColumn",
      },
      { field: "status", headerName: "Status", cellRenderer: StatusCell },
      { field: "due_date", headerName: "Due" },
    ],
    []
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Invoices</h2>
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              error ? "bg-red-500" : "animate-pulse bg-emerald-500"
            }`}
          />
          {error ? `Error: ${error}` : updated ? `Live · updated ${updated}` : "Loading..."}
        </span>
      </div>
      <div style={{ height: 340 }}>
        <AgGridReact<Row>
          theme={theme}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1 }}
          getRowId={(p) => p.data.id}
          animateRows
          onRowClicked={(e) => e.data && onRowClick?.(e.data)}
          rowStyle={{ cursor: onRowClick ? "pointer" : "default" }}
        />
      </div>
    </section>
  );
}