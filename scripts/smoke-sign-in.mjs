// End-to-end check of a signed-in session against a running app (default http://localhost:3000).
// Usage: pnpm dev (in another terminal), then pnpm smoke:sign-in
// Signs in as the staging test practitioner (from .env.local), then loads protected pages
// with that session cookie. The password is never printed.

import { createServerClient } from "@supabase/ssr";

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key } = process.env;
const email = process.env.TEST_PRACTITIONER_EMAIL;
const password = process.env.TEST_PRACTITIONER_PASSWORD;
if (!url || !key || !email || !password) throw new Error("Missing env. Run pnpm seed:test-practitioner first.");

const jar = new Map();
const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (toSet) => {
      for (const { name, value } of toSet) {
        if (value) jar.set(name, value);
        else jar.delete(name);
      }
    },
  },
});

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const { error } = await supabase.auth.signInWithPassword({ email, password });
check("password sign-in accepted", !error, error?.message);

const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
const get = (path, withCookie = true) =>
  fetch(base + path, { redirect: "manual", headers: withCookie ? { cookie } : {} });

const anon = await get("/home", false);
check("signed out: /home redirects to sign-in", anon.status === 307 && anon.headers.get("location")?.includes("/sign-in"));

const home = await get("/home");
const html = await home.text();
check("signed in: /home loads", home.status === 200, `status ${home.status}`);
check("shows the test practice", html.includes("Staging Test Practice"));
check("shows wholesale access", html.includes("Wholesale pricing on"));
check("shows sign out", html.includes("Sign out"));

const signIn = await get("/sign-in");
check("signed in: /sign-in sends you home", signIn.status === 307 && signIn.headers.get("location")?.endsWith("/home"));

const account = await get("/account");
check("signed in: /account loads", account.status === 200, `status ${account.status}`);

// Wholesale prices from the Shopify dev store (placeholder price list: 50% off retail).
const shop = await get("/shop");
const shopHtml = await shop.text();
check("signed in: /shop loads", shop.status === 200, `status ${shop.status}`);
for (const [name, price] of [
  ["Test formula A", "$30.00"],
  ["Test formula B", "$36.00"],
  ["Test formula C", "$42.00"],
]) {
  check(`shop shows ${name} at wholesale ${price}`, shopHtml.includes(name) && shopHtml.includes(price));
}

const out = await fetch(base + "/auth/sign-out", { method: "POST", redirect: "manual", headers: { cookie } });
const cleared = (out.headers.getSetCookie?.() ?? []).some((c) => /auth-token/.test(c) && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c));
check("sign out redirects and clears the session cookie", out.status === 303 && cleared);

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${!r.ok && r.detail ? ` (${r.detail})` : ""}`);
}
process.exit(failed ? 1 : 0);
