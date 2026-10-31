# GetPaid Copilot

**An AI agent that gets freelancers and small businesses paid, with a human on the money button.**

Live demo: https://getpaid-copilot.onrender.com
Built for the *Build What's Next with PayPal and AI* hackathon. Everything runs in the **PayPal sandbox** (test money only).

## What it does

Chasing invoices is slow, awkward work. GetPaid Copilot lets you do it in plain language:

- "Invoice Acme $450 for website maintenance, due in 7 days" creates a real draft invoice in PayPal.
- "Send it" asks to send the invoice. The request waits in an **Approval inbox** until a person clicks Approve.
- "Send a reminder for my oldest unpaid invoice" makes the AI write a polite, specific reminder, which also waits for approval.
- A live dashboard (AG Grid) tracks every invoice, and its status flips to **PAID** when the client pays.

## How PayPal is used

- **PayPal Invoicing API v2 (sandbox):** create draft invoices, send invoices, send payment reminders, list invoices, read invoice status.
- **PayPal OAuth 2.0 (client credentials):** server-side access tokens. Credentials never reach the browser.

## How AI is used

- **Google Gemini function calling** drives an agent that decides which PayPal tools to call and in what order.
- Tools: `list_invoices`, `get_invoice_status`, `create_invoice_draft`, `send_invoice`, `send_reminder`.
- The AI writes the reminder subject and note, and chooses the arguments for each tool call. Click any action chip in the chat to see the exact tool call.
- Model fallback and timeouts keep the app responsive when a model is busy (primary `gemini-3.5-flash-lite`, with other Gemini models as fallbacks).

## The safety model (human in the loop)

The model can read and draft freely, but it can only **queue** actions that contact a client (`send_invoice`, `send_reminder`). The server code that actually calls PayPal for those runs **only after a person approves** in the UI. A wrong or manipulated AI answer cannot send anything on its own.

## Try it (about 2 minutes)

1. Open the live demo, go to **Copilot**, and use the first suggested prompt to draft an invoice.
2. Type `send the invoice`, then approve the request in the **Approval inbox**.
3. On the **Dashboard**, the invoice turns **SENT**.
4. Pay it as the sandbox buyer: open the invoice's payer link (or sandbox.paypal.com) in a private window and sign in with a sandbox **Personal** account. Test buyer credentials are in the submission's testing instructions.
5. Within about 10 seconds the Dashboard flips to **PAID** and a success popup appears.

The free hosting instance sleeps when idle, so the first load can take up to a minute.

## Run it yourself

Requirements: Node.js 22+, a PayPal developer account, a Google AI Studio key.

```bash
git clone https://github.com/Prathiba-Agnes17/getpaid-copilot.git
cd getpaid-copilot
npm install
cp .env.example .env.local   # on Windows: copy .env.example .env.local
```

Fill in `.env.local`:

- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`: from developer.paypal.com > Apps & Credentials > **Sandbox**. Create an app of type Merchant and, under its features, enable **Invoicing**.
- `PAYPAL_BASE_URL`: `https://api-m.sandbox.paypal.com`
- `GEMINI_API_KEY`: from https://aistudio.google.com
- `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`: see `.env.example`
- `NEXT_PUBLIC_DEMO_EMAIL`: your sandbox **Personal** (buyer) email, used to prefill the demo prompts

Then:

```bash
npm run dev
```

and open http://localhost:3000. For a production build: `npm run build && npm start`.

**Sandbox accounts:** create one Business and one Personal sandbox account in the PayPal developer dashboard (Testing Tools > Sandbox Accounts). Use **United States** as the country. PayPal blocks sending invoices to customers inside India, so accounts created with India as the country will fail on send.

Useful scripts:

```bash
npx tsx --env-file=.env.local scripts/test-invoice.ts          # create and send a test invoice
npx tsx --env-file=.env.local scripts/check-invoice.ts INV2-...  # status and payer link
```

## Tech stack

PayPal Invoicing API (sandbox) · Google Gemini function calling · AG Grid · Next.js · React · Tailwind CSS · Render

## Known limitations

- Sandbox only. No real money moves.
- Invoice status updates use polling (about every 10 seconds). PayPal webhooks are a planned improvement.
- The approval queue is stored on the server's local disk, so it is shared between visitors and resets when the free hosting instance sleeps or redeploys.
- The AI endpoint is rate limited to protect the free model quota.

## License

MIT, see [LICENSE](LICENSE).