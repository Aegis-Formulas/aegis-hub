import "server-only";
import { requireSession, type Session } from "@/lib/auth/session";
import { findBuyer, type B2BBuyer } from "@/lib/shopify/wholesale";
import { createClient } from "@/lib/supabase/server";

const BUYING_ROLES = new Set(["practice_owner", "practice_staff", "practitioner"]);

export type ShopContext =
  | { ok: true; session: Session; practiceId: string; practiceName: string; buyer: B2BBuyer }
  | { ok: false; session: Session; reason: "no-practice" | "no-wholesale" | "not-linked" | "not-contact" };

/**
 * Everything needed to show wholesale prices and order: the signed-in person's practice,
 * the wholesale entitlement, and their Shopify B2B identity. Always derived on the server.
 */
export async function getShopContext(): Promise<ShopContext> {
  const session = await requireSession();
  const membership = session.memberships.find((m) => m.orgType === "practice" && BUYING_ROLES.has(m.role));
  if (!membership) return { ok: false, session, reason: "no-practice" };
  if (!session.entitlements.includes("wholesale")) return { ok: false, session, reason: "no-wholesale" };

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, shopify_company_id")
    .eq("id", membership.orgId)
    .maybeSingle();
  if (!org?.shopify_company_id) return { ok: false, session, reason: "not-linked" };

  const buyer = await findBuyer(org.shopify_company_id, session.email);
  if (!buyer) return { ok: false, session, reason: "not-contact" };

  return { ok: true, session, practiceId: org.id, practiceName: org.name, buyer };
}
