# ARCHITECTURE.md · Aegis Hub

Items marked **[VERIFY]** must be confirmed against current vendor docs before building.

## The shape
```
             ┌──────────────── Aegis Hub (Next.js on Vercel) ────────────────┐
 Browser ──▶ │  Practitioner area · Patient portal · Admin · API routes      │
             └──────┬───────────┬──────────────┬──────────────┬──────────────┘
                    │           │              │              │
              Supabase      Shopify Plus    GoHighLevel     Mux / Anthropic
         (auth, Postgres,  (catalog, B2B,   (email, SMS,   (video, Ask Aegis)
          storage, RLS)    checkout, draft    CRM tags)
                            orders, webhooks)
```
The hub owns **who people are and what they can see**. Shopify owns **products, prices, carts, checkout and orders**. GHL owns **messages**. Nothing is duplicated except cached copies for speed.

## Identity and access
- **Auth:** Supabase Auth (email magic link + password). One account per person.
- **Organizations:** every person belongs to one or more orgs (`aegis`, a practice, later an employer). A practitioner's practice is an org; their patients are members of that org with the `patient` role.
- **Roles:** `aegis_admin`, `aegis_staff`, `rep`, `practice_owner`, `practice_staff`, `practitioner`, `patient`, `affiliate`.
- **Entitlements:** what someone has access to (`wholesale`, `education_only`, `af_certified`, `live`, `patient_portal`). Content and features check entitlements, not roles.
- **Row-level security** enforces org boundaries in the database, so a bug in the UI can't leak another practice's patients.

## Shopify Plus
- **Catalog:** products and variants synced into a `products` cache nightly and on `products/update` webhooks. Clinical content (thesis, ingredients, dosing, screens) lives in the hub, keyed by Shopify product id, because it needs review status and versioning.
- **Wholesale pricing:** Shopify B2B. Each approved practice is a Shopify **Company** with a location on the wholesale **catalog/price list**. The hub stores `shopify_company_id` on the practice org. Retire Wholesale Gorilla once B2B is verified. **[VERIFY]** the Storefront API cart flow with B2B buyer identity, which requires a customer access token from the Customer Account API.
- **One login:** the hub signs the practitioner into Shopify checkout as their B2B customer, so there's no second wholesale sign-in. Options: Customer Account API, or Multipass, which is available on Plus. **[VERIFY]** which is current and recommended.
- **Patient plans:** the practitioner builds a plan in the hub, then the hub creates a Shopify **draft order** (Admin API) with member pricing and attributes `practice_id`, `plan_id`, `practitioner_id`. The patient gets the checkout link by email from GHL in the practice's name. **[VERIFY]** whether draft order invoice URLs or cart permalinks give the better checkout.
- **Attribution:** every order the hub creates or links carries `practice_id` in note attributes or metafields. `orders/create` and `orders/paid` webhooks write to `orders` and, from Phase 3, to the commission ledger.
- **Subscriptions:** stay in Recharge at first. Show status read-only in the hub.

## GoHighLevel
- The hub sends events; GHL sends messages. Events: `account_created`, `certified`, `plan_sent`, `plan_paid`, `refill_due`, `guide_sent`, `live_reminder`.
- Patient-facing messages go out under the practice's name with Aegis as the sender domain. **[VERIFY]** per-practice sender display names in GHL.
- No health details in GHL. Ids and first names only.

## Video and live
- **Mux** for courses, replays and live (a Mux live stream with a playback id embedded in the hub).
- **Live chat:** Supabase Realtime on a `live_messages` table, moderated (a message isn't shown until approved, or shown with team moderation tools). Phase 4.

## Ask Aegis
- **Corpus:** only `approved` content (formula pages, guides, lesson transcripts, webinar notes). Chunked and embedded into `pgvector`.
- **Flow:** question → access-filtered retrieval → Claude answer with the system rules from CLAUDE.md → answer plus source links.
- **Guardrails:** refuse outside scope, no patient-specific dosing, no diagnosis, banned-term check on output, every question and answer logged to `ask_logs`. The log becomes the content backlog.

## Meal planner
- Port the existing RWC generator (rules engine, food and protocol data, PDF) from the Jaban project into `lib/mealplanner/`. Branding comes from the org (Aegis by default, practice brand for patients).
- Aegis-branded eating styles exclude condition-named styles (see DECISIONS.md #6).

## Content
- MDX files in `content/` for long-form material (lessons, guides, formula pages), with frontmatter: `phase`, `access`, `review_status`, `reviewed_by`, `reviewed_at`.
- A simple admin screen lists content by review status. Only Dr. Jess, Dr. Jaban or a delegated reviewer can approve.

## Environments
`local` → `staging` (preview Shopify store or a dev store) → `production`. Separate Supabase projects and env vars for each. Never point staging at the live Shopify store's orders.

## Hosting and compliance
If DECISIONS.md #2 says the hub stores identifiable patient health data: use plans that sign business associate agreements, turn on audit logging, and restrict staff access. **[VERIFY]** Supabase and Vercel BAA availability on your plans.
