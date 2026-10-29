import { Type } from "@google/genai";
import * as paypal from "./paypal";
import { createPending } from "./db";

// Tools with outside effects: never run directly by the model
export const RISKY = new Set(["send_invoice", "send_reminder"]);

export const functionDeclarations = [
  {
    name: "list_invoices",
    description: "List recent invoices with status, client, amount and due date. Read-only.",
    parameters: {
      type: Type.OBJECT,
      properties: { limit: { type: Type.NUMBER, description: "How many to return (default 10)" } },
    },
  },
  {
    name: "get_invoice_status",
    description: "Get the current status and details of one invoice. Read-only.",
    parameters: {
      type: Type.OBJECT,
      properties: { invoice_id: { type: Type.STRING } },
      required: ["invoice_id"],
    },
  },
  {
    name: "create_invoice_draft",
    description:
      "Create a DRAFT invoice in PayPal. This does not send it to the client. Use send_invoice afterwards.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        client_name: { type: Type.STRING },
        client_email: { type: Type.STRING },
        description: { type: Type.STRING, description: "What the invoice is for" },
        amount: { type: Type.NUMBER },
        currency: { type: Type.STRING, description: "3-letter code, default USD" },
        days_until_due: { type: Type.NUMBER, description: "Default 14" },
      },
      required: ["client_name", "client_email", "description", "amount"],
    },
  },
  {
    name: "send_invoice",
    description:
      "Request sending a draft invoice to the client. It is NOT sent until the user approves it in the UI.",
    parameters: {
      type: Type.OBJECT,
      properties: { invoice_id: { type: Type.STRING } },
      required: ["invoice_id"],
    },
  },
  {
    name: "send_reminder",
    description:
      "Request a payment reminder email for an unpaid invoice. Write a polite, specific note. It is NOT sent until the user approves it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        invoice_id: { type: Type.STRING },
        subject: { type: Type.STRING },
        note: { type: Type.STRING },
      },
      required: ["invoice_id", "subject", "note"],
    },
  },
];

// Safe tools run immediately
export async function runSafeTool(name: string, args: any) {
  switch (name) {
    case "list_invoices":
      return { invoices: await paypal.listInvoices(args.limit ?? 10) };
    case "get_invoice_status": {
      const inv = await paypal.getInvoice(args.invoice_id);
      return {
        id: inv.id,
        status: inv.status,
        amount: inv.amount?.value,
        currency: inv.amount?.currency_code,
        client: inv.primary_recipients?.[0]?.billing_info?.business_name,
        due_date: inv.detail?.payment_term?.due_date,
      };
    }
    case "create_invoice_draft": {
      const draft = await paypal.createDraftInvoice({
        clientName: args.client_name,
        clientEmail: args.client_email,
        description: args.description,
        amount: Number(args.amount),
        currency: args.currency,
        daysUntilDue: args.days_until_due,
      });
      return { invoice_id: draft.id, status: "DRAFT" };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Risky tools are saved for approval, not run
export async function queueRiskyTool(name: string, args: any) {
  let summary = `${name}: ${JSON.stringify(args)}`;
  try {
    const inv = await paypal.getInvoice(args.invoice_id);
    const who = inv.primary_recipients?.[0]?.billing_info?.business_name ?? "client";
    const amt = `${inv.amount?.value ?? "?"} ${inv.amount?.currency_code ?? ""}`;
    summary =
      name === "send_invoice"
        ? `Send invoice ${args.invoice_id} (${amt}) to ${who}`
        : `Send reminder for invoice ${args.invoice_id} (${amt}) to ${who}: "${args.subject}"`;
  } catch {
    /* keep the generic summary */
  }
  return createPending(name, args, summary);
}

// Runs after a human approves
export async function executeApproved(name: string, args: any) {
  switch (name) {
    case "send_invoice":
      await paypal.sendInvoice(args.invoice_id);
      return { sent: true };
    case "send_reminder":
      await paypal.sendReminder(args.invoice_id, args.subject, args.note);
      return { reminded: true };
    default:
      throw new Error(`Cannot execute ${name}`);
  }
}