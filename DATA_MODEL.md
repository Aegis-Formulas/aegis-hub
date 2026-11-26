# DATA_MODEL.md · Aegis Hub

Postgres (Supabase). Every table with customer or patient data has `org_id` and row-level security. Timestamps: `created_at`, `updated_at` on everything. Ids are UUIDs.

## Identity
| Table | Key fields | Notes |
|---|---|---|
| `profiles` | `user_id` (auth), `first_name`, `last_name`, `email`, `phone`, `avatar_url` | One per person |
| `orgs` | `type` (`aegis`, `practice`, `employer`), `name`, `brand` (jsonb: logo, primary, accent, font, mode), `shopify_company_id`, `status` | A practice is an org |
| `memberships` | `user_id`, `org_id`, `role` | A person can be a practitioner in one org and an admin in another |
| `entitlements` | `org_id` or `user_id`, `key` (`wholesale`, `education_only`, `af_certified`, `live`, `patient_portal`), `starts_at`, `ends_at` | Access checks read this |
| `seats` | `org_id`, `user_id`, `role`, `assigned_at` | Team seats belong to the practice |
| `practice_profiles` | `org_id`, `credentials`, `city`, `state`, `listed_in_directory`, `completeness` | Directory and finder |

## Catalog and content
| Table | Key fields | Notes |
|---|---|---|
| `products` | `shopify_product_id`, `handle`, `name`, `phase` (`P1`/`P2`/`P3`), `retail_price`, `wholesale_price`, `image_url`, `synced_at` | Cache of Shopify |
| `product_content` | `product_id`, `thesis`, `ingredients` (jsonb with dose, role, evidence tier), `dosing`, `screens`, `pairs`, `review_status` | Clinical content, versioned |
| `content_items` | `type` (`lesson`, `course`, `guide`, `resource`, `template`, `article`), `slug`, `title`, `phase`, `access`, `review_status`, `body_ref` | Points at MDX or storage |
| `courses` / `lessons` | ordering, `mux_playback_id`, duration | |
| `progress` | `user_id`, `item_id`, `status`, `percent` | |
| `quiz_attempts` | `user_id`, `item_id`, `answers`, `score` | Counts toward certification |
| `certifications` | `user_id`, `program` (`af_certified`), `status`, `case_submission_ref`, `approved_by` | |

## Patients and plans
| Table | Key fields | Notes |
|---|---|---|
| `patients` | `org_id`, `user_id` (nullable until they log in), `first_name`, `email`, `current_phase`, `status` | No health history here |
| `assessments` | `org_id`, `patient_id`, `scores` (jsonb by phase), `suggested_phase`, `taken_at` | Scores only until DECISIONS.md #2 |
| `plans` | `org_id`, `patient_id`, `practitioner_id`, `title`, `stages` (jsonb), `note`, `status` (`draft`, `sent`, `opened`, `paid`), `shopify_draft_order_id`, `checkout_url` | The send-a-plan loop |
| `guide_sends` | `org_id`, `patient_id`, `content_item_id`, `sections`, `note`, `sent_at` | |
| `meal_plans` | `org_id`, `patient_id`, `inputs` (jsonb), `plan` (jsonb), `pdf_ref`, `sent_at` | |
| `lab_requests` | `org_id`, `patient_id`, `panel`, `status` | Workflow only, no results stored until decided |

## Commerce and money
| Table | Key fields | Notes |
|---|---|---|
| `orders` | `shopify_order_id`, `org_id` (attributed practice), `patient_id`, `plan_id`, `type` (`wholesale`, `patient_direct`, `plan`), `subtotal`, `commissionable_total`, `status` | Written by webhooks |
| `commission_rules` | `id`, `version`, `rule` (jsonb), `effective_from` | Ported from the R1–R23 spec (Phase 3) |
| `commission_lines` | `order_id`, `beneficiary` (org or user), `rule_id`, `amount`, `status` | Ledger, never edited, only reversed |
| `payouts` | `beneficiary`, `period`, `amount`, `status`, `paid_at` | |
| `payout_accounts` | `beneficiary`, `provider_ref`, `last4` | Never store full account numbers |

## Live, community, AI
| Table | Key fields | Notes |
|---|---|---|
| `live_events` | `title`, `audience` (`pro`, `patient`, org-specific), `starts_at`, `mux_live_id`, `replay_item_id` | |
| `live_messages` | `event_id`, `user_id`, `body`, `status` (`pending`, `shown`, `answered`) | Moderated |
| `groups` / `posts` / `replies` | `org_id` scope, `anonymous`, `status` | Phase 4. Patient groups are per practice |
| `ask_logs` | `user_id`, `question`, `answer`, `sources`, `refused`, `flagged` | Content backlog and safety review |
| `audit_log` | `actor_id`, `action`, `target`, `org_id` | Every admin and money action |

## Row-level security, in plain terms
- A practitioner sees their own org's patients, plans, orders and commissions. Nobody else's.
- A patient sees only their own plan, guides, meal plans and their practice's content and groups.
- Aegis staff see across orgs through admin screens, and every view of patient data is written to `audit_log`.
