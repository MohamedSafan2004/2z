# 2Z Store

A production e-commerce platform for **2Z**, a minimal Egyptian streetwear brand — built and shipped solo, end to end: storefront, checkout, payments, admin operations, shipping automation, and marketing infrastructure.

**Live:** [2zstore.com](https://2zstore.com)

---

## Overview

2Z sells oversized T-shirts in 4 colorways across 3 sizes. Rather than bolting an e-commerce SaaS onto the brand, this project is a fully custom Next.js application — the storefront, the checkout logic, the promotions engine, the admin dashboard, and the courier integration are all hand-built and owned end to end.

The focus of this repo isn't "another Next.js store template." It's the operational plumbing that a real, currently-selling store actually needs: idempotent payment confirmation, atomic stock decrements under concurrent checkouts, a webhook-driven shipping pipeline, and a manual-payment flow (InstaPay) built because Egypt's card-payment gateways don't reliably support small independent merchants yet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | PostgreSQL on [Supabase](https://supabase.com) (transaction pooler for serverless) |
| **ORM** | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-pg` (direct `pg` driver, no Data Proxy) |
| **Hosting / Deployment** | [Vercel](https://vercel.com) (Edge + Serverless Functions, Cron Jobs) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) (persisted cart & auth stores) |
| **Media** | [Cloudinary](https://cloudinary.com) (product imagery, on-the-fly optimization) |
| **Email** | [Resend](https://resend.com) (transactional email — order confirmations, admin alerts, password reset, abandoned cart) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com) (sliding-window rate limiting on auth & write endpoints) |
| **Shipping / Fulfillment** | [Bosta](https://bosta.co) API (courier booking, tracking webhooks, automated WhatsApp delivery notifications) |
| **Spreadsheet Sync** | Google Sheets API (`googleapis`) — live sales & inventory ledger for non-technical stakeholders |
| **Analytics** | Meta Pixel + Conversions API (server-side, deduplicated), Microsoft Clarity |
| **Styling** | Tailwind CSS v4 + inline styles (no CSS-in-JS runtime) |
| **Export** | ExcelJS (admin order export) |

**Deliberately not used:** `next/image` (Cloudinary already serves `f_auto,q_auto` optimized assets — stacking `next/image` on top double-compresses and visibly degrades quality) and `framer-motion` (all motion is plain CSS keyframes, kept out of the JS bundle).

---

## Architecture Highlights

A few decisions worth calling out, since they're the parts of an e-commerce backend that are easy to get wrong:

- **Payments are manual-first by design.** Egyptian card gateways (Paymob) proved unreliable for a small independent merchant at launch, so the primary payment method is **InstaPay with manual admin confirmation**: the order is persisted as `PENDING_PAYMENT` *before* the customer even sees payment details (so a closed tab never loses the order), the customer submits their transfer reference, and an admin confirms against their own banking app. Cash on Delivery auto-confirms on fulfillment. The full flow — payment page, guest order recovery via a signed token, idempotent status transitions — is production-tested, not a stub.
- **Stock is decremented inside a database transaction at order time**, with a re-check against current stock *inside* the transaction to close the race-condition window between two customers checking out the same low-stock variant simultaneously. Failed payments roll the reservation back; manual admin cancellation restocks it.
- **Shipping is event-driven, not fire-and-forget.** Order confirmation triggers courier booking via the Bosta API; a signed webhook (shared-secret query param, since Bosta doesn't offer a signature header) updates order status automatically as the shipment moves through pickup → in-transit → delivered. A manual "Send to Bosta" fallback in the admin dashboard exists for retrying a sync that failed silently.
- **Every third-party client script is treated as a CSP problem, not just an integration problem.** Meta Pixel, Clarity, and Cloudinary images all route through a Content-Security-Policy allowlist — a script can be wired correctly and still get silently dropped by the browser if the CSP isn't updated alongside it.
- **Promotions are computed server-side, never trusted from the client.** The "Buy 2, Get 1 Free" gift a customer selects in the UI is re-validated against live stock and an active `Promotion` row in the database at order-creation time — the client's cart state is a suggestion, not a source of truth.
- **Two Vercel Cron jobs run the operational side of the business:** a nightly inventory sync to Google Sheets for stakeholders who live in spreadsheets, and a 24-hour abandoned-InstaPay-cart email reminder — both authenticated with a timing-safe secret comparison, not a plain string check.
- **Secrets stay out of git on principle, not by accident** — the Google service-account key and any database backup (which contains customer PII and password hashes) are explicitly `.gitignore`'d, not just "usually fine."

---

## Core Features

**Storefront**
- Product catalog with color/size variants, live stock display, and low-stock indicators
- Cart with quantity limits and a server-side revalidation pass before checkout
- Guest checkout — no account required
- "Buy 2, Get 1 Free" promotion with an in-page gift picker (color + size), fully stock-aware
- Percentage promo codes with per-email 48-hour expiry windows
- Order tracking for guests via a signed recovery token (no login needed)

**Payments & Orders**
- InstaPay manual-confirmation flow with a dedicated payment page and copy-to-clipboard reference fields
- Cash on Delivery with auto-confirmation on fulfillment
- Atomic, transaction-safe stock reservation
- Sequential, human-readable invoice numbers (`INV-0001`)

**Admin Dashboard**
- Paginated order management with filtering, search, and Excel export
- Manual InstaPay payment confirmation
- One-click Bosta courier booking with delivery tracking display
- Printable packing slips

**Fulfillment & Ops Automation**
- Bosta courier integration: booking, live tracking sync via webhook, automated customer WhatsApp notifications
- Google Sheets sync for sales and inventory — auto-updates on confirmed payment
- Cron-driven abandoned-cart email recovery and nightly inventory reconciliation

**Security**
- JWT auth with server-side token versioning (instant invalidation on password reset)
- bcrypt password hashing, rate-limited auth endpoints (Upstash)
- Timing-safe secret comparison on all webhook/cron endpoints
- Strict CSP, HSTS, and standard security headers
- Server-side input validation and sanitization on every mutating route

---

## Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (this project targets Supabase's connection pooler)
- Accounts/API keys for: Supabase, Cloudinary, Resend, Upstash Redis, Bosta, Google Cloud (service account for Sheets), Meta Business (optional — Pixel/CAPI), Microsoft Clarity (optional)

### Installation

```bash
git clone https://github.com/MohamedSafan2004/2z.git
cd 2z
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database (Supabase — use the transaction pooler URL, port 6543, for the app;
# the direct/session URL is fine for one-off scripts in prisma/*.ts)
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Resend
RESEND_API_KEY="..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Bosta (shipping)
BOSTA_API_KEY="..."
BOSTA_BASE_URL="..."
BOSTA_WEBHOOK_SECRET="..."

# Google Sheets sync
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
GOOGLE_SHEET_ID="..."

# Vercel Cron authentication
CRON_SECRET="..."

# Site URL (used in transactional emails / payment links)
NEXT_PUBLIC_SITE_URL="https://2zstore.com"

# Analytics (optional)
NEXT_PUBLIC_META_PIXEL_ID="..."
META_CAPI_ACCESS_TOKEN="..."
NEXT_PUBLIC_CLARITY_PROJECT_ID="..."
```

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
npm run seed        # optional — seeds categories/products/variants
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # production build
npm run lint     # ESLint
npm run seed     # seed the database (ts-node)
```

---

## Project Structure

```
app/
  (store)/            # customer-facing routes (route group — shares layout, no admin chrome)
    products/[id]/    # product detail
    cart/, checkout/  # cart + multi-step checkout
    orders/           # order history (auth + guest token)
  admin/               # admin dashboard (separate layout)
  instapay-payment/    # standalone InstaPay payment page (outside the (store) group)
  api/
    auth/              # register, login, email verify, password reset
    orders/            # order creation, admin status updates, InstaPay ref submission
    products/          # catalog, gift-variant lookup, cart validation
    admin/              # admin-only order/product management, Excel export
    bosta/webhook/      # courier status webhook (shared-secret authenticated)
    cron/               # abandoned-cart + inventory-sync scheduled jobs
    promo/validate/     # promo code validation
lib/
  db.ts                # Prisma client (pg adapter + pooled connection)
  auth.ts, validation.ts, ratelimit.ts
  bosta.ts, bosta-sync.ts     # courier API client + sync orchestration
  promotions.ts               # server-side gift/promo calculation
  sheets-sync.ts               # Google Sheets writer
  store/                       # Zustand stores (cart, auth)
components/
  admin/                       # admin dashboard UI
  home/                        # homepage sections
prisma/
  schema.prisma
  seed.ts, backup.ts, and operational one-off scripts
```

---

## Deployment

Deployed on Vercel with two scheduled Cron Jobs (configured in `vercel.json`):

| Job | Schedule | Purpose |
|---|---|---|
| `sync-inventory` | Daily, 02:00 UTC | Reconciles stock levels to Google Sheets |
| `abandoned-cart` | Daily, 03:00 UTC | Emails customers with an unpaid InstaPay order older than 24h |

All environment variables must be duplicated in the Vercel project settings — they are **not** read from `.env.local` in production.

---

## Author

Built and maintained by **Mohamed Safan** ([@MohamedSafan2004](https://github.com/MohamedSafan2004)) — sole developer and founder of 2Z Store.
