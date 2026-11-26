# ROADMAP.md · Aegis Hub

Each phase ships to staging, then production, only when its "done when" checks pass. Don't start the next phase early.

## Phase 0 · Foundation (about 2–3 weeks)
- Repo under the Aegis GitHub org, Vercel staging and production, Supabase projects, env vars.
- Design system components from DESIGN.md: capsule nav, sequence rail, buttons, cards, tables, drawer, toast.
- Auth, orgs, memberships, roles, entitlements, row-level security.
- Shopify: product sync, B2B company link for a practice, wholesale prices showing for a signed-in practitioner.
- **Done when:** a test practitioner signs in once, sees wholesale prices, and places a test order on the staging store. A second practice can't see the first one's data (tested).

## Phase 1 · Practitioner v1 (about 4–6 weeks)
- Home: setup checklist, next live, rep card, continue learning.
- Learn: the method, formula pages (from approved content), patient guides, academy tracks, resources, templates.
- Shop: wholesale cart and checkout through Shopify.
- Practice: patients list, **send a plan** (draft order + GHL email), orders list, My protocols, brand settings.
- Live: Mux replays and an embedded live stream for the phase webinars.
- Ask Aegis v1 with sources and logging.
- **Done when:** 10 pilot practitioners each send a real plan, at least one patient pays through it, and the order is attributed to the right practice.

## Phase 2 · Patient portal (about 4 weeks)
- Practice-branded portal: My plan with checkout, guides, meal planner output, lessons by phase, labs request workflow.
- Meal planner ported from the RWC generator, Aegis-branded for practitioners.
- Refill-due signals and nudges through GHL.
- **Done when:** a pilot practice's patients log in, check out from their plan, and receive a meal plan and guides. First-fill and 90-day refill rates are measured.

## Phase 3 · Commissions and payouts (about 3–4 weeks)
- Port the commission logic from the Vercel dashboard into `lib/commissions`, tested against all 25 cases in the R1–R23 spec.
- Ledger, statements, payout accounts, tax form status.
- Run alongside the old dashboard for one full pay cycle, compare to the cent, then retire the old one.
- **Done when:** one pay cycle matches the old system exactly and the attorney has signed off on attribution rules.

## Phase 4 · Community and live chat (about 4 weeks)
- Practitioner groups, case rounds with de-identification prompts, directory.
- Patient groups per practice, anonymous by default, moderated.
- Moderated live Q&A chat.
- **Done when:** moderation tools are in use and no condition group shows products.

## Phase 5 · Certification, finder, and new org types
- AF Certified: knowledge checks, case submission and review, badge.
- Public practitioner finder fed by certified practitioners.
- Clinic-in-a-box and employer orgs on the same model.

## Metrics to track from Phase 1
Practitioner first order within 30 days · plans sent per practitioner · plan conversion rate · patient first-fill and 90-day refill · practitioners ordering 3+ formulas · Ask Aegis questions (backlog) · certification progress.
