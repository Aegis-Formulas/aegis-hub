// Creates (or refreshes) a test practice and test practitioner on STAGING.
// Usage: pnpm seed:test-practitioner
//
// - Practice "Staging Test Practice", active, with the wholesale entitlement
// - User test-practitioner@example.com, owner + practitioner of that practice
// - A new random password each run, written ONLY to .env.local (never printed, never committed)
// Refuses to run unless .env.local points at the project linked in supabase/.temp/project-ref.
// Never link this folder to production.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const PRACTICE_NAME = "Staging Test Practice";
const EMAIL = "test-practitioner@example.com";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Run with: node --env-file=.env.local (needs URL and SUPABASE_SECRET_KEY)");

const linkedRef = existsSync("supabase/.temp/project-ref") ? readFileSync("supabase/.temp/project-ref", "utf8").trim() : "";
const urlRef = new URL(url).hostname.split(".")[0];
if (!linkedRef || urlRef !== linkedRef) {
  throw new Error(`Refusing: .env.local points at "${urlRef}" but the linked staging project is "${linkedRef || "none"}".`);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

function check(label, { error, data }) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

// 1. Practice
let practice = check(
  "find practice",
  await db.from("orgs").select("id").eq("type", "practice").eq("name", PRACTICE_NAME).maybeSingle(),
);
if (!practice) {
  practice = check(
    "create practice",
    await db.from("orgs").insert({ type: "practice", name: PRACTICE_NAME, status: "active" }).select("id").single(),
  );
}

// 2. Wholesale entitlement for the practice
const hasWholesale = check(
  "find entitlement",
  await db.from("entitlements").select("id").eq("org_id", practice.id).eq("key", "wholesale").maybeSingle(),
);
if (!hasWholesale) {
  check("create entitlement", await db.from("entitlements").insert({ org_id: practice.id, key: "wholesale" }));
}

// 3. User with a fresh password
const password = randomBytes(24).toString("base64url");
const existing = check("find profile", await db.from("profiles").select("user_id").eq("email", EMAIL).maybeSingle());
let userId = existing?.user_id;
if (userId) {
  check("reset password", await db.auth.admin.updateUserById(userId, { password }));
} else {
  const created = check(
    "create user",
    await db.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
      user_metadata: { first_name: "Test", last_name: "Practitioner" },
    }),
  );
  userId = created.user.id;
}

// 4. Memberships
for (const role of ["practice_owner", "practitioner"]) {
  check(
    `membership ${role}`,
    await db
      .from("memberships")
      .upsert({ user_id: userId, org_id: practice.id, role }, { onConflict: "user_id,org_id,role", ignoreDuplicates: true }),
  );
}

// 5. Audit (ids only)
check(
  "audit",
  await db.from("audit_log").insert({ action: "seed.test_practitioner", target: `users:${userId}`, org_id: practice.id }),
);

// 6. Save credentials to .env.local only
let envText = readFileSync(ENV_FILE, "utf8");
for (const [key, value] of [
  ["TEST_PRACTITIONER_EMAIL", EMAIL],
  ["TEST_PRACTITIONER_PASSWORD", password],
]) {
  const line = `${key}=${value}`;
  envText = new RegExp(`^${key}=.*$`, "m").test(envText)
    ? envText.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : `${envText.replace(/\n?$/, "\n")}${line}\n`;
}
writeFileSync(ENV_FILE, envText);

console.log(`Practice ${practice.id} (${PRACTICE_NAME}), wholesale on`);
console.log(`User ${userId} (${EMAIL}), owner + practitioner`);
console.log(`Password saved to ${ENV_FILE} as TEST_PRACTITIONER_PASSWORD`);
