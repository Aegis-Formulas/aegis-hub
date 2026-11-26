import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { syncProducts } from "@/lib/shopify/products";

/**
 * Syncs the Shopify catalog into the products cache.
 * Called by Vercel Cron (nightly) with `Authorization: Bearer $CRON_SECRET`.
 * Product webhooks will call the same sync later.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok =
    Boolean(secret) &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Log the message only; Shopify errors don't carry customer data.
    console.error("product sync failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "sync failed" }, { status: 500 });
  }
}
