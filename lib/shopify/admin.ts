import "server-only";

/**
 * Shopify Admin API client (server only).
 * Uses the Dev Dashboard app's client credentials to get a 24-hour access token,
 * cached in memory and refreshed a few minutes before it expires.
 */

type Token = { value: string; expiresAt: number };
let cached: Token | null = null;

function config() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const version = process.env.SHOPIFY_API_VERSION ?? "2026-10";
  if (!domain || !clientId || !clientSecret) {
    throw new Error("Shopify is not configured. See SHOPIFY_* in .env.example.");
  }
  return { domain, clientId, clientSecret, version };
}

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt - Date.now() > 5 * 60_000) return cached.value;
  const { domain, clientId, clientSecret } = config();
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify token request failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in?: number };
  cached = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 86_400) * 1000 };
  return cached.value;
}

export class ShopifyUserError extends Error {}

/** Run an Admin GraphQL query. Throws on transport or GraphQL errors. Never cached. */
export async function adminGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { domain, version } = config();
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await accessToken() },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify Admin API error (${res.status})`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(`Shopify Admin API: ${body.errors.map((e) => e.message).join("; ")}`);
  return body.data as T;
}

/** Throw if a mutation returned userErrors. */
export function assertNoUserErrors(label: string, errors: { message: string }[] | undefined) {
  if (errors?.length) throw new ShopifyUserError(`${label}: ${errors.map((e) => e.message).join("; ")}`);
}
