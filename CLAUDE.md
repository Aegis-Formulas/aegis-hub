# CLAUDE.md · Aegis Hub

Read this file, DESIGN.md, ARCHITECTURE.md, DATA_MODEL.md, ROADMAP.md and DECISIONS.md at the start of every session.

## What we're building
One platform, one login, for everyone who works with Aegis Formulas:
- **Practitioners** learn the method, order wholesale, send plans to patients, and see orders and commissions.
- **Patients** of those practitioners get a portal in their practice's brand: their plan, checkout at member pricing, guides, meal plans, lessons and live Q&A.
- Later: affiliates, sales reps, employers and clinic-in-a-box practices.

The visual reference is the prototype (`reference/prototype.html`). Match its structure and feel, not its sample data.

## Who works here
Emma (CTO) builds with Claude Code. Dr. Jaban Moore, DC, Dr. Jessica Peatross, MD, and Chandra sign off on clinical content, claims and business rules. Kylee Archibald is the account manager practitioners see.

## How to work in this repo
- Read the relevant spec before writing code. If a spec and a request conflict, stop and ask.
- Work on a branch, in small steps. One feature per pull request.
- Before any database change, write the migration, explain it in plain English, and wait for a yes.
- Run `pnpm lint`, `pnpm typecheck` and `pnpm test` before saying anything is done.
- Deploy to **staging** first. Production only after Emma confirms on staging.
- When something is unclear, ask one question rather than guessing.
- Explain what you changed in plain language at the end of each task.

## Stack (details in ARCHITECTURE.md)
Next.js (App Router) + TypeScript (strict) on Vercel · Supabase (Postgres, Auth, Storage, row-level security) · Shopify Plus (catalog, B2B pricing, checkout, draft orders) · GoHighLevel (email, SMS, CRM) · Mux (video) · Anthropic API (Ask Aegis) · pnpm.

## Non-negotiables
### Security and privacy
- Never commit secrets. Use environment variables; list new ones in `.env.example`.
- Every table holding customer or patient data has an `org_id` and row-level security. No exceptions.
- Never log patient names, emails, health answers or messages. Log ids only.
- Patient health data rules depend on DECISIONS.md #2. Until it is decided, store **no** identifiable health answers: assessments store scores only, linked by patient id.
- Webhooks are verified (Shopify HMAC, GHL signature) before anything is processed.

### Supplement compliance (applies to every string the app shows)
- Structure/function language only: "supports", "helps maintain". Never treat, cure, prevent, heal, or a condition name as a product benefit.
- No product shown in the same frame as a condition topic (community groups, guides, search results).
- The FDA disclaimer appears wherever a product claim appears: "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
- Ask Aegis answers only from the approved corpus, cites its sources, refuses outside scope, never gives patient-specific doses, and logs every question.
- Clinical content (dosing, screens, evidence tiers, guides) is stored as content with a `review_status`. Only `approved` content is shown to members.

### Copy
- Never change approved copy without being asked.
- Sentence case. No em dashes. No exclamation points in long-form copy.
- Product names exactly: CalmAF, ClearAF, NanoGlut+B, TUDCA Max, Elemental Edge, ReBalance♀, Total Tox Binder.

### Design
Follow DESIGN.md. Brand colors only: Yankees Blue #1C3140, Bronze #A7895F, Deep Bronze #7A6243, white, Mist #EEF1F4. Carlito/Calibri. No green, orange or red in the interface.

## Folder layout
```
app/                 Next.js routes
  (pro)/             practitioner area
  (patient)/         patient portal (practice-branded)
  (admin)/           Aegis staff tools
  api/               route handlers, webhooks
components/          shared UI (built from DESIGN.md tokens)
lib/
  shopify/           Storefront + Admin API clients
  ghl/               GoHighLevel client
  ai/                Ask Aegis retrieval + prompts
  auth/              session, roles, org context
  commissions/       rules engine (Phase 3)
content/             approved clinical and education content (MDX + JSON)
supabase/migrations/ SQL migrations
reference/           prototype.html, briefs, price sheet
tests/
```

## Definition of done
Works on staging, passes lint/typecheck/tests, checked at phone width (390px) and desktop, no off-brand colors, no unapproved copy, no secrets, and Emma has seen it.
