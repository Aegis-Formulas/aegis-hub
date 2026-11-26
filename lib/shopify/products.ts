import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminGraphql } from "./admin";

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED" | "UNLISTED";
  featuredMedia: { preview: { image: { url: string } | null } | null } | null;
  variants: { nodes: { id: string; price: string }[] };
};

type ProductsPage = {
  products: { nodes: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
  shop: { currencyCode: string };
};

const QUERY = `query Products($after: String) {
  shop { currencyCode }
  products(first: 100, after: $after, sortKey: ID) {
    nodes {
      id handle title status
      featuredMedia { preview { image { url } } }
      variants(first: 1) { nodes { id price } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export type SyncResult = { upserted: number; archived: number };

/** Copy every Shopify product into the products cache. Products gone from Shopify are archived. */
export async function syncProducts(): Promise<SyncResult> {
  const rows: Record<string, unknown>[] = [];
  let after: string | null = null;
  const syncedAt = new Date().toISOString();

  do {
    const page: ProductsPage = await adminGraphql<ProductsPage>(QUERY, { after });
    for (const p of page.products.nodes) {
      const variant = p.variants.nodes[0];
      if (!variant) continue;
      rows.push({
        shopify_product_id: p.id,
        shopify_variant_id: variant.id,
        handle: p.handle,
        name: p.title,
        status: p.status === "ACTIVE" ? "active" : p.status === "ARCHIVED" ? "archived" : "draft",
        retail_price: Number(variant.price),
        currency: page.shop.currencyCode,
        image_url: p.featuredMedia?.preview?.image?.url ?? null,
        synced_at: syncedAt,
      });
    }
    after = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
  } while (after);

  const db = createAdminClient();
  if (rows.length) {
    // phase is hub-owned and deliberately not in rows, so a sync never overwrites it.
    const { error } = await db.from("products").upsert(rows, { onConflict: "shopify_product_id" });
    if (error) throw new Error(`products upsert: ${error.message}`);
  }

  const seen = rows.map((r) => r.shopify_product_id as string);
  let archive = db.from("products").update({ status: "archived", synced_at: syncedAt }).neq("status", "archived");
  if (seen.length) archive = archive.not("shopify_product_id", "in", `(${seen.map((id) => `"${id}"`).join(",")})`);
  const { data: archived, error: archiveError } = await archive.select("id");
  if (archiveError) throw new Error(`products archive: ${archiveError.message}`);

  return { upserted: rows.length, archived: archived?.length ?? 0 };
}
