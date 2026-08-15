# Atlas Business System

**Live at https://atlas-business-system.vercel.app** (auto-deploys from `main` on push).

A U.S. business formation platform covering **all 50 states** and three entity types — **LLC**, **For-Profit Corporation**, and **Non-Profit Corporation** — with a client portal for post-formation tasks.

## What it does

**Formation flow** (`/formation`)
1. Pick a formation type (LLC / For-Profit / Non-Profit)
2. Pick a state — every state's Secretary of State links and business-name search are included
3. See exact pricing: state filing fee, our flat service fee, optional value-added services, and a retail comparison showing your savings
4. Name check — link out to the state's official SOS business database to confirm no duplicate or confusingly similar names
5. Build the incorporation document (Articles of Organization / Incorporation) — fill the fields, preview and download a generated PDF
6. Review and sign the client contract (typed signature)
7. Pay securely via **Stripe** (checkout + optional recurring subscriptions), or demo mode when Stripe isn't configured
8. Create your client portal account — the external **analyst review (24h)** runs in the background and never holds up signup

**Client portal** (`/portal`)
- Business name + established date in the header
- **Credentials** — business name, EIN, state filing date, officers, address, phone, email, website (editable)
- **Business checklist** — obtain EIN (IRS link + box to record your EIN), D-U-N-S with Dun & Bradstreet, business bank account (in-app application reviewed by our team and set up by our backend office), state tax/permits, insurance
- **Business credit** — Net-30 vendors that approve new businesses, with a starter checklist (Uline, Grainger, Quill, and more)

**Admin console** (`/admin`)
- Formations queue with filters; analyst approve/reject with notes (24h review step)
- **Filing queue** (`/admin/filings`) — every paid formation is automatically queued for submission once its document is built. Each filing ships as a single PDF package: an operator cover sheet (state, fees, submission checklist, portal links) merged with the signed Articles. Operations submits via the state's official online filing system and records the result — submitted, filed (with confirmation number), needs attention, or rejected — all workflow-enforced with a full status history. When a filing is marked filed, the formation is marked FILED, the established date is recorded, and the client gets a “you're officially registered” email.
- Bank applications queue with an analyst-review flow (received → in review → approved → account set up)
- States & fees editor — update SOS links, per-type filing fees, form PDF URLs, and mark fees verified
- Services and checklist item management
- Email log — every client notification, delivered or logged

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Stripe](https://stripe.com) Checkout + subscriptions (graceful demo mode without keys)
- [jose](https://github.com/panva/jose) JWT session cookies, [bcryptjs](https://github.com/dcodeIO/bcrypt.js) passwords
- [pdf-lib](https://pdf-lib.js.org) — generated incorporation documents
- [Zod](https://zod.dev) validation

## Getting started

Prerequisites: Node 20+, a PostgreSQL database (local, Docker, or hosted).

```bash
pnpm install

# 1. Configure environment
cp .env.example .env
#    - DATABASE_URL      → your Postgres connection string
#    - SESSION_SECRET    → long random string
#    - ADMIN_EMAIL / ADMIN_PASSWORD → admin bootstrap credentials
#    - Stripe keys (optional) — leave blank to run in demo mode

# 2. Create the schema
pnpm db:migrate

# 3. Seed: 50 states + filing fees, services, checklist items, admin & demo users
pnpm db:seed

# 4. Run
pnpm dev   # → http://localhost:3000
```

### Demo accounts (seeded)

| Role   | Email                  | Password     |
| ------ | ---------------------- | ------------ |
| Admin  | `admin@atlasbusiness.co` | `Admin1234!` |
| Client | `demo@atlasbusiness.co`  | `Demo1234!`  |

Change both in `.env` / the seed before any production use.

### Stripe

Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`, then point a webhook at `POST /api/webhooks/stripe` for `checkout.session.completed`. Without keys, the checkout step runs in **demo mode** (simulated payment) so the whole flow is testable end to end.

### Automated filing (ops-assisted)

Paid formations are automatically queued as a `Filing` record (status `READY`). The admin filing queue shows everything ready to submit; each filing includes a generated **submission package PDF** (operator cover sheet + signed Articles) and direct links to the state's SOS portal and name search. Status transitions are enforced (`READY → SUBMITTED → FILED`, with `NEEDS_ATTENTION` / `REJECTED` for exceptions and refiling), recorded in a history trail, and drive formation status, the client's established date, and the “officially registered” email.

There is no single API covering all 50 Secretaries of State, so the submission step is performed by operations through each state's official online portal — the same model the major formation services use. The `State.filingProvider` field (default `ops`) is the per-state hook where a state API or white-label provider can be plugged in later without rework.

### Email notifications (Resend)

Client notifications are sent via [Resend](https://resend.com) (free tier: 3,000 emails/month):

| Trigger | Email |
| ------- | ----- |
| Payment received | Sent on Stripe `checkout.session.completed` (or demo payment). If the client hasn't created an account yet, it's sent automatically when they claim their formation. |
| Analyst approved | Sent when an admin approves the formation review (or on claim, if approval happened before signup). |
| Filed with state | Sent when a filing is marked FILED in the admin filing queue (confirmation number included). |
| EIN reminders | Weekly reminder to obtain an EIN. Run the job daily: `pnpm cron:ein-reminders` — schedule it with Vercel Cron, GitHub Actions, cron, etc. Sends at most once every 7 days per formation. |

Set `RESEND_API_KEY` and optionally `EMAIL_FROM`. **Without a key, emails are logged to the console and to the admin Email log (`/admin/emails`) with status `logged` instead of being delivered.**

## Project layout

```
prisma/
  schema.prisma          # data model
  seed.ts                # seed script (never clobbers verified fee rows)
  seed-data/states.ts    # 50-state SOS links + unverified starting fees
  seed-data/verified-states.ts  # verified fees for all 50 states × 3 entity types
scripts/
  verify-fees.ts         # applies verified fee data (verified = true, source notes)
src/
  app/
    page.tsx             # landing page
    formation/           # formation wizard
    login/ register/     # auth pages
    portal/              # client portal (dashboard, credentials, checklist, credit, bank)
    admin/               # admin console (formations, bank apps, states, services, checklist)
    api/                 # route handlers (formation, auth, portal, admin, stripe webhook)
  components/
    formation/           # wizard + document builder
    portal/              # credentials form, checklist, bank application
    admin/               # review actions, state/service/checklist editors
  lib/                   # prisma, auth, stripe, pdf, pricing, format
  proxy.ts               # route protection (/portal, /admin)
```

## Important notes

- **Filing fees are verified for all 50 states (verified 2026-08-15).** Every `StateFee` row was checked against the official Secretary of State (or equivalent agency) fee schedule or regulation; each row carries a source note with the citation, and `verified = true`. Apply (or re-apply after state fee changes) with `pnpm db:verify-fees`, then review in `/admin/states`. Notable 2026 changes baked in: Delaware raised fees Aug 1 2026 (LLC $110, corp $109), Kansas cut fees Feb 2026 (LLC $85, corp $75, nonprofit $20), New Jersey reduced fees (LLC/corp $100, nonprofit $50), Vermont LLC/corp/nonprofit now $155.
- **Name checks link out to each state's official SOS business-name search** — no public API covers all 50 states. An analyst re-verifies availability during the 24h review step.
- The bank application form collects personal data (DOB, SSN last 4). In production, encrypt at rest and review retention/handling with legal counsel before launch.
- The 24h analyst review is a background status (`analystReview`) — it never blocks the client's formation or portal access.

## Scripts

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Run the dev server                       |
| `pnpm build`      | Production build + type check            |
| `pnpm db:migrate` | Apply Prisma migrations                  |
| `pnpm db:seed`    | Seed states, services, checklist, users  |
| `pnpm db:verify-fees` | Apply verified 50-state fee data (sets `verified = true`) |
| `pnpm db:studio`  | Browse the database with Prisma Studio   |
| `pnpm cron:ein-reminders` | Send weekly EIN reminders (run daily via a scheduler) |
