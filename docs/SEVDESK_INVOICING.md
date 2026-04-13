# sevDesk Invoicing Integration — Implementation Plan

## Overview

Automatic invoice generation via **sevDesk API** after every successful
Stripe payment. The flow:

```
Stripe payment success → webhook → create sevDesk invoice → save in DB → email PDF to customer
```

---

## sevDesk Account

| Item | Value |
|---|---|
| API Base URL | `https://my.sevdesk.de/api/v1` |
| API Token | `85c87c346c5aa9abc6fb224445f7b0c0` |
| User ID | `1158159` |
| Client ID (SevClient) | `966324` |
| Contact Person ID | `1235337` |
| Login Email | `rechnung@dpro.at` |
| Login Password | stored locally (not committed) |
| Role | admin |
| OpenAPI Spec | `C:\xampp\htdocs\praxta_lock\sevdesk_openapi.yaml` |
| Reference Implementation | `C:\xampp\htdocs\praxta_lock\app\helpers.php` |

---

## Tasks

### Phase 1: Database + Model

- [ ] Create migration `20260413100000-create-invoices.js`
  - Table: `invoices`
  - Fields: `id`, `user_id`, `workspace_id`, `stripe_invoice_id`, `stripe_payment_intent_id`, `sevdesk_invoice_id`, `sevdesk_invoice_number`, `sevdesk_pdf_url`, `amount`, `currency`, `tax_rate`, `tax_amount`, `plan`, `status` (created/sent/paid/cancelled), `invoice_date`, `due_date`, `customer_name`, `customer_email`, `customer_address`, `customer_vat_id`, `sent_at`, `createdAt`, `updatedAt`
- [ ] Create model `database/models/invoice.ts`
- [ ] Register model in `database/database.ts`

### Phase 2: sevDesk Service

- [ ] Create `services/sevdesk.ts` with:
  - `createContact(user)` — create or find sevDesk contact for the customer
  - `createInvoice(contact, items, invoiceDetails)` — create invoice via API
  - `finalizeInvoice(invoiceId)` — change status from draft to open
  - `getInvoicePdf(invoiceId)` — download PDF
  - `sendInvoiceEmail(invoiceId, email)` — send via sevDesk email
  - `getLatestInvoiceNumber()` — for sequential numbering
- [ ] Add env vars to `.env.local` and `.env.production`:
  ```
  SEVDESK_API_TOKEN=85c87c346c5aa9abc6fb224445f7b0c0
  SEVDESK_CONTACT_PERSON_ID=1235337
  ```

### Phase 3: Stripe Webhook Integration

- [ ] Update `pages/api/billing/webhook.ts`:
  - On `checkout.session.completed` → after updating user plan:
    1. Read customer billing info from `invoice_details` table
    2. Create/find sevDesk contact
    3. Create sevDesk invoice with line items (plan name + price)
    4. Finalize invoice
    5. Save invoice record in `invoices` table
    6. Send PDF to customer email via SMTP (or sevDesk email API)

### Phase 4: Admin Invoice Page

- [ ] Create `pages/admin/invoices.tsx`:
  - List all invoices (date, customer, amount, status, PDF link)
  - Search by customer name/email
  - Filter by status, date range
  - Download PDF button
  - Resend email button
  - Manual invoice creation form
- [ ] Create `pages/api/admin/invoices.ts`:
  - GET: list all invoices with pagination
  - POST: create manual invoice
  - PATCH: update status
- [ ] Add "Invoices" link to `components/admin/AdminLayout.tsx` sidebar

### Phase 5: User Invoice Page

- [ ] Update `pages/profile/billing.tsx` → Invoices tab:
  - List user's own invoices
  - Download PDF button
  - Show: date, invoice number, amount, status
- [ ] Create `pages/api/user/invoices.ts`:
  - GET: list invoices for authenticated user

### Phase 6: Email Template

- [ ] Create `utils/emails/invoiceEmail.ts`:
  - Uses existing `email/email.html` template
  - Attaches PDF or links to download
  - Subject: "Invoice #XX-XXXXX — SEO AI Agent"

---

## sevDesk API Reference (key endpoints)

### Create Contact
```
POST /api/v1/Contact
Authorization: {TOKEN}
{
  "category": { "id": 3, "objectName": "Category" },
  "surename": "Company Name",
  "customerNumber": "auto",
  "name2": "Contact Name"
}
```

### Create Invoice
```
POST /api/v1/Invoice/Factory/saveInvoice
Authorization: {TOKEN}
{
  "invoice": {
    "objectName": "Invoice",
    "contact": { "id": CONTACT_ID, "objectName": "Contact" },
    "contactPerson": { "id": 1235337, "objectName": "SevUser" },
    "invoiceNumber": "25-00001",
    "invoiceDate": "09-04-2026",
    "header": "Invoice",
    "headText": "",
    "footText": "Thank you for your business.",
    "timeToPay": 0,
    "discount": 0,
    "address": "Customer Address",
    "payDate": "09-04-2026",
    "deliveryDate": "09-04-2026",
    "status": 100,
    "taxRate": 20,
    "taxText": "USt. 20%",
    "taxType": "default",
    "invoiceType": "RE",
    "currency": "EUR",
    "mapAll": true
  },
  "invoicePosSave": [
    {
      "objectName": "InvoicePos",
      "quantity": 1,
      "price": 29.00,
      "name": "SEO AI Agent — Pro Plan (Yearly)",
      "unity": { "id": 1, "objectName": "Unity" },
      "taxRate": 20,
      "mapAll": true
    }
  ]
}
```

### Get Invoice PDF
```
GET /api/v1/Invoice/{invoiceId}/getPdf
Authorization: {TOKEN}
```

### Send Invoice via Email
```
POST /api/v1/Invoice/{invoiceId}/sendViaEmail
Authorization: {TOKEN}
{
  "toEmail": "customer@example.com",
  "subject": "Invoice #25-00001",
  "text": "Please find your invoice attached."
}
```

### Get Latest Invoice Number
```
GET /api/v1/Invoice?limit=1&orderBy=invoiceNumber&orderDirection=desc
Authorization: {TOKEN}
```

---

## Invoice Numbering

Format: `YY-NNNNN` (e.g., `26-00001`, `26-00002`)
- Year prefix from current year
- Sequential number auto-incremented from last sevDesk invoice
- Same format as the existing praxta_lock implementation

---

## Tax Configuration

| Region | Tax Rate | Tax Text |
|---|---|---|
| Austria (default) | 20% | USt. 20% |
| EU with VAT ID (reverse charge) | 0% | Reverse Charge §13b UStG |
| Non-EU | 0% | Tax-free export |

The tax type is determined from the customer's `invoice_details`:
- If `country` is AT → 20% USt.
- If EU country + valid `vat_id` → 0% reverse charge
- If non-EU → 0% tax-free

---

## Files to Create

```
database/migrations/20260413100000-create-invoices.js
database/models/invoice.ts
services/sevdesk.ts
pages/admin/invoices.tsx
pages/api/admin/invoices.ts
pages/api/user/invoices.ts
utils/emails/invoiceEmail.ts
```

## Files to Modify

```
database/database.ts — register Invoice model
pages/api/billing/webhook.ts — trigger sevDesk invoice on payment
components/admin/AdminLayout.tsx — add Invoices link
pages/profile/billing.tsx — add user invoices tab
.env.local — add SEVDESK_API_TOKEN + SEVDESK_CONTACT_PERSON_ID
.env.production — same
```

---

**Start next session with:** "نكمل الفواتير sevDesk"

**© 2026 Dpro GmbH — Flowxtra**
