"use server";

import { redirect } from "next/navigation";
import { getShopContext } from "@/lib/shop/context";
import { createWholesaleDraftOrder } from "@/lib/shopify/wholesale";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type OrderState = { status: "idle" | "error"; message?: string };

const MAX_QTY = 99;

export async function startWholesaleOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const ctx = await getShopContext();
  if (!ctx.ok) return { status: "error", message: "Wholesale ordering isn't set up for your account yet." };

  // Only variants of active products in the cache can be ordered. Prices are never taken from the form.
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("shopify_variant_id").eq("status", "active");
  const allowed = new Set((products ?? []).map((p) => p.shopify_variant_id));

  const lines: { variantId: string; quantity: number }[] = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("qty:")) continue;
    const variantId = key.slice(4);
    const quantity = Number(raw);
    if (!allowed.has(variantId) || !Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QTY) {
      return { status: "error", message: `Quantities must be whole numbers from 0 to ${MAX_QTY}.` };
    }
    if (quantity > 0) lines.push({ variantId, quantity });
  }
  if (!lines.length) return { status: "error", message: "Add at least one product." };

  let checkoutUrl: string;
  try {
    const draft = await createWholesaleDraftOrder({
      buyer: ctx.buyer,
      lines,
      practiceId: ctx.practiceId,
      practitionerId: ctx.session.userId,
    });
    checkoutUrl = draft.checkoutUrl;

    // Money action: record ids only.
    await createAdminClient()
      .from("audit_log")
      .insert({
        actor_id: ctx.session.userId,
        action: "wholesale.draft_order_created",
        target: `shopify:${draft.id}`,
        org_id: ctx.practiceId,
      });
  } catch (err) {
    console.error("wholesale draft order failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: "The order couldn't be started. Try again, or contact your Aegis rep." };
  }

  redirect(checkoutUrl);
}
