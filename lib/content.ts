export type Detail = {
  title: string;
  summary: string;
  steps: string[];
  api?: string;
};

export const GUIDE: Detail[] = [
  {
    title: "Ask the AI to draft an invoice",
    summary: "Describe the invoice in plain language. The AI turns it into a real draft in PayPal.",
    steps: [
      "Gemini reads your message and decides to call the create_invoice_draft tool.",
      "The server calls the PayPal Invoicing API and creates a DRAFT invoice.",
      "Nothing is visible to the client yet. You can still change your mind.",
    ],
    api: "POST /v2/invoicing/invoices",
  },
  {
    title: "Tell it to send the invoice",
    summary: "The AI is allowed to ask for a send, but it is never allowed to do one on its own.",
    steps: [
      "Gemini calls the send_invoice tool.",
      "The server does not call PayPal. It saves the request as a pending action instead.",
      "The request appears in the Approval inbox and waits for you.",
    ],
    api: "No PayPal call yet. The action is queued.",
  },
  {
    title: "Approve it in the approval inbox",
    summary: "This is the human-in-the-loop moment. Only your click makes the send happen.",
    steps: [
      "You click Approve and confirm.",
      "The server runs the queued action and calls PayPal to send the invoice.",
      "The invoice status changes from DRAFT to SENT on the Dashboard.",
    ],
    api: "POST /v2/invoicing/invoices/{id}/send",
  },
  {
    title: "Pay it as the client",
    summary: "Play the customer. Pay the invoice with the PayPal sandbox buyer account.",
    steps: [
      "Open sandbox.paypal.com in a private window and sign in as the sandbox buyer.",
      "Open the invoice and pay it with sandbox money.",
      "The Dashboard checks PayPal every 8 seconds, so the row flips to PAID and a popup appears.",
    ],
    api: "GET /v2/invoicing/invoices",
  },
  {
    title: "Chase late payments",
    summary: "Ask for a reminder on an unpaid invoice. The AI writes it, and you approve it.",
    steps: [
      "Gemini looks up unpaid invoices and drafts a polite, specific reminder note.",
      "The reminder is queued in the Approval inbox, like a send.",
      "After you approve, PayPal emails the reminder to the client.",
    ],
    api: "POST /v2/invoicing/invoices/{id}/remind",
  },
];

export const FLOW: Detail[] = [
  {
    title: "You ask",
    summary: "Type what you want in plain language.",
    steps: [
      "Example: invoice Acme $450 for website maintenance, due in 7 days.",
      "The chat sends the conversation to the server, never your PayPal keys.",
    ],
  },
  {
    title: "Gemini plans",
    summary: "The model chooses which tools to use and in what order.",
    steps: [
      "Gemini function calling returns the tools it wants to run, with arguments.",
      "The server can retry and fall back to another Gemini model if one is busy.",
    ],
    api: "Gemini generateContent with function declarations",
  },
  {
    title: "PayPal does the work",
    summary: "Safe actions run straight away against the PayPal sandbox.",
    steps: [
      "Reads (list, status) and drafts run immediately.",
      "PayPal credentials stay on the server and are exchanged for OAuth tokens.",
    ],
    api: "PayPal Invoicing API v2 + OAuth 2.0",
  },
  {
    title: "You approve",
    summary: "Anything that contacts a client is held until a human approves it.",
    steps: [
      "The model can only queue send_invoice and send_reminder.",
      "The code that actually sends runs only after you click Approve.",
    ],
  },
  {
    title: "Status goes live",
    summary: "The Dashboard follows the invoice as it moves through PayPal.",
    steps: [
      "The invoice table refreshes every few seconds.",
      "When a client pays, the row turns PAID and a success popup appears.",
    ],
    api: "AG Grid + polling",
  },
];

export type ToolDetail = Detail & { name: string; kind: "Read" | "Draft" | "Needs approval"; note: string };

export const TOOLS: ToolDetail[] = [
  {
    name: "list_invoices / get_invoice_status",
    kind: "Read",
    note: "Runs instantly",
    title: "Reading invoices",
    summary: "Lets the AI answer questions like which invoices are unpaid.",
    steps: ["Read-only. It cannot change anything.", "Results are returned to Gemini so it can answer accurately instead of guessing."],
    api: "GET /v2/invoicing/invoices",
  },
  {
    name: "create_invoice_draft",
    kind: "Draft",
    note: "Creates a draft in PayPal, not visible to the client",
    title: "Creating a draft",
    summary: "Builds a real PayPal invoice in DRAFT state.",
    steps: ["Safe to run automatically because the client cannot see a draft.", "You can review it before anything is sent."],
    api: "POST /v2/invoicing/invoices",
  },
  {
    name: "send_invoice",
    kind: "Needs approval",
    note: "Queued until a human approves",
    title: "Sending an invoice",
    summary: "Emails the invoice to the client. Held for human approval.",
    steps: ["The AI can only queue this action.", "After you approve, the server calls PayPal to send it."],
    api: "POST /v2/invoicing/invoices/{id}/send",
  },
  {
    name: "send_reminder",
    kind: "Needs approval",
    note: "Queued until a human approves",
    title: "Sending a reminder",
    summary: "Emails a payment reminder for an unpaid invoice. Held for human approval.",
    steps: ["The AI writes the subject and note.", "Nothing is sent until you approve it."],
    api: "POST /v2/invoicing/invoices/{id}/remind",
  },
];