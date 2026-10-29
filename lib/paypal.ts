const BASE = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

let cached: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env.local");
  }

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cached.token;
}

async function paypalFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PayPal ${res.status} on ${path}: ${text}`);
  return text ? JSON.parse(text) : {};
}

export interface DraftInvoiceInput {
  clientName: string;
  clientEmail: string;
  description: string;
  amount: number;
  currency?: string;
  daysUntilDue?: number;
}

export async function createDraftInvoice(input: DraftInvoiceInput) {
  const today = new Date();
  const due = new Date(today.getTime() + (input.daysUntilDue ?? 14) * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const currency = input.currency ?? "USD";

  const body = {
    detail: {
      invoice_date: fmt(today),
      currency_code: currency,
      payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: fmt(due) },
    },
    primary_recipients: [
      {
        billing_info: {
          business_name: input.clientName,
          email_address: input.clientEmail,
        },
      },
    ],
    items: [
      {
        name: input.description,
        quantity: "1",
        unit_amount: { currency_code: currency, value: input.amount.toFixed(2) },
      },
    ],
  };

  const data = await paypalFetch("/v2/invoicing/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  // The response contains a link ending in the invoice id
  const id: string = data.id ?? String(data.href).split("/").pop();
  return { id, href: data.href as string | undefined };
}

export async function sendInvoice(id: string) {
  return paypalFetch(`/v2/invoicing/invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ send_to_recipient: true }),
  });
}

export async function getInvoice(id: string) {
  return paypalFetch(`/v2/invoicing/invoices/${id}`);
}

export async function listInvoices(limit = 10) {
  const data = await paypalFetch(`/v2/invoicing/invoices?page=1&page_size=${limit}`);
  return (data.items ?? []).map((i: any) => ({
    id: i.id,
    status: i.status,
    client: i.primary_recipients?.[0]?.billing_info?.business_name ?? null,
    email: i.primary_recipients?.[0]?.billing_info?.email_address ?? null,
    amount: i.amount?.value ?? null,
    currency: i.amount?.currency_code ?? i.detail?.currency_code ?? null,
    due_date: i.detail?.payment_term?.due_date ?? null,
  }));
}

export async function sendReminder(id: string, subject: string, note: string) {
  return paypalFetch(`/v2/invoicing/invoices/${id}/remind`, {
    method: "POST",
    body: JSON.stringify({ subject, note, send_to_invoicer: false }),
  });
}