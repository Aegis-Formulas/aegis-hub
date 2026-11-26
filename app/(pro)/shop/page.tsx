import type { Metadata } from "next";
import { Label } from "@/components/Label";
import { getShopContext } from "@/lib/shop/context";
import { wholesalePrices } from "@/lib/shopify/wholesale";
import { createClient } from "@/lib/supabase/server";
import { OrderForm, type ShopRow } from "./OrderForm";
import styles from "./shop.module.css";

export const metadata: Metadata = { title: "Shop · Aegis Hub" };

const NOT_READY: Record<string, string> = {
  "no-practice": "Wholesale ordering is for practice accounts. Your Aegis contact can link yours.",
  "no-wholesale": "Wholesale pricing isn't on for your practice yet. Your Aegis contact can turn it on.",
  "not-linked": "Your practice isn't connected to the wholesale store yet. Your Aegis contact can finish setup.",
  "not-contact": "Your email isn't on your practice's wholesale account yet. Your Aegis contact can add it.",
};

export default async function ShopPage() {
  const ctx = await getShopContext();

  if (!ctx.ok) {
    return (
      <>
        <h1>Shop</h1>
        <p className={styles.lead}>{NOT_READY[ctx.reason]}</p>
      </>
    );
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("shopify_variant_id, name, retail_price")
    .eq("status", "active")
    .order("name");

  const list = products ?? [];
  // Prices are buyer-specific: fetched live per request and never cached across users.
  const prices = await wholesalePrices(
    ctx.buyer.locationId,
    list.map((p) => p.shopify_variant_id),
  );

  const rows: ShopRow[] = list.map((p) => ({
    variantId: p.shopify_variant_id,
    name: p.name,
    retail: Number(p.retail_price),
    wholesale: prices.get(p.shopify_variant_id) ?? null,
  }));

  return (
    <>
      <Label as="p">{ctx.practiceName}</Label>
      <h1 className={styles.title}>Shop</h1>
      <p className={styles.lead}>Wholesale prices for your practice. You&apos;ll review and pay on the next screen.</p>
      <section className={styles.section}>
        {rows.length ? <OrderForm rows={rows} /> : <p className={styles.lead}>No products are available yet.</p>}
      </section>
    </>
  );
}
