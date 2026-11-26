# DECISIONS.md · Aegis Hub

Claude Code: treat every **Open** item as a blocker for the features listed under "Blocks". Build around it, don't guess.

| # | Decision | Owner | Status | Default until decided | Blocks |
|---|---|---|---|---|---|
| 1 | One method name: Regulate · Recalibrate · Release, CARE, CLEAR, or a defined mapping | Jaban, Jess, Chandra | **Open** | Use Regulate · Recalibrate · Release; store phase as `P1`/`P2`/`P3` so labels can change | Lesson titles, patient portal labels |
| 2 | Does the hub store identifiable patient health data? | Healthcare attorney, Emma | **Open** | No. Assessments store scores only; no lab results; community anonymous by default | Patient portal Phase 2, hosting plans |
| 3 | Commission and attribution rules, including practitioner credit for patient orders and the MyCareMD referral arrangement | Attorney, Jaban, Chandra | **Open** | Record attribution on every order; pay nothing new until approved | Phase 3, partner pages |
| 4 | Version 1 scope | Emma, Jaban | **Proposed** | Practitioner side first (ROADMAP Phase 1) | Planning |
| 5 | Member discount for patients | Jaban, Chandra | **Open** | 10% as a config value, not hard-coded | Patient pricing |
| 6 | Eating-style names in the Aegis-branded meal planner (MCAS, SIBO, Candida) | Compliance review | **Proposed** | Hidden in Aegis branding; available in RWC branding | Meal planner |
| 7 | Retire Wholesale Gorilla in favor of Shopify B2B | Emma | **Proposed** | Keep both until B2B is verified in Phase 0 | Shop |
| 8 | Where the WellnessPlus content and Dr. Jaban's RWC hub fit (integrate, license, or link) | Jess, Jaban | **Open** | Link out; don't migrate content | Patient content library |
| 9 | Product color dots (from the reference chart) vs. navy-only | Emma | **Open** | Keep product colors as small markers only | UI polish |

## Decided
_Move items here with the date and who decided._
- Shopify Plus confirmed (Nov 2026).
- Build platform: custom app (Next.js, Vercel, Supabase) with Shopify as the commerce engine, not Webflow (Nov 2026).
- Builder: Emma with Claude Code (Nov 2026).
- DESIGN.md approved as built in the design system components, including Carlito-only headlines (Emma, Nov 25, 2026).
