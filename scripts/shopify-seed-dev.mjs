// Fills the Shopify DEV store with B2B test data and links it to the staging hub practice.
// Usage: pnpm shopify:seed-dev   (safe to re-run; finds existing records first)
//
// Refuses to run unless Shopify reports the store as a development store.
// Creates: 3 fake products, a company for "Staging Test Practice" with the test practitioner
// as its contact, and a B2B catalog with a placeholder wholesale price list (50% off retail).
// Then writes the company id to orgs.shopify_company_id on the staging hub.

import { createClient } from "@supabase/supabase-js";

const env = process.env;
const shop = env.SHOPIFY_STORE_DOMAIN;
const version = env.SHOPIFY_API_VERSION ?? "2026-10";
const PRACTICE_NAME = "Staging Test Practice";
const CONTACT_EMAIL = env.TEST_PRACTITIONER_EMAIL ?? "test-practitioner@example.com";
const CATALOG_TITLE = "Wholesale (staging test)";
const PLACEHOLDER_DISCOUNT = 50; // placeholder only; real wholesale prices come from the price sheet
const TEST_PRODUCTS = [
  { title: "Test formula A", price: "60.00" },
  { title: "Test formula B", price: "72.00" },
  { title: "Test formula C", price: "84.00" },
];

// --- Shopify Admin API -------------------------------------------------------
const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.SHOPIFY_CLIENT_ID ?? "",
    client_secret: env.SHOPIFY_CLIENT_SECRET ?? "",
  }),
});
const { access_token: token } = await tokenRes.json();
if (!token) throw new Error(`Could not get a Shopify token (status ${tokenRes.status})`);

async function gql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

function userErrors(label, payload) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${errs.map((e) => e.message).join("; ")}`);
  return payload;
}

const { shop: info } = await gql(`{ shop { myshopifyDomain plan { partnerDevelopment shopifyPlus } } }`);
if (!info.plan.partnerDevelopment) throw new Error(`Refusing: ${info.myshopifyDomain} is not a development store.`);
if (!info.plan.shopifyPlus) throw new Error("B2B needs a Plus dev store.");

// --- Products ----------------------------------------------------------------
for (const p of TEST_PRODUCTS) {
  const found = await gql(`query($q: String!) { products(first: 1, query: $q) { nodes { id } } }`, {
    q: `title:'${p.title}'`,
  });
  if (found.products.nodes.length) continue;
  const created = userErrors(
    `create ${p.title}`,
    (
      await gql(
        `mutation($product: ProductCreateInput!) {
          productCreate(product: $product) {
            product { id variants(first: 1) { nodes { id } } }
            userErrors { field message }
          }
        }`,
        { product: { title: p.title, status: "ACTIVE", vendor: "Aegis Hub test data", tags: ["hub-test-data"] } },
      )
    ).productCreate,
  );
  userErrors(
    `price ${p.title}`,
    (
      await gql(
        `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
        }`,
        { productId: created.product.id, variants: [{ id: created.product.variants.nodes[0].id, price: p.price }] },
      )
    ).productVariantsBulkUpdate,
  );
  console.log(`Product created: ${p.title} at $${p.price}`);
}

// --- Hub practice ------------------------------------------------------------
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data: org, error: orgErr } = await db
  .from("orgs")
  .select("id, shopify_company_id")
  .eq("type", "practice")
  .eq("name", PRACTICE_NAME)
  .maybeSingle();
if (orgErr || !org) throw new Error(`Hub practice "${PRACTICE_NAME}" not found. Run pnpm seed:test-practitioner first.`);

// --- Company, location, contact ----------------------------------------------
const COMPANY_FIELDS = `
  id
  externalId
  locations(first: 1) { nodes { id } }
  contacts(first: 5) { nodes { id customer { email } } }
  contactRoles(first: 5) { nodes { id name } }
`;
const byId = async (id) => (await gql(`query($id: ID!) { company(id: $id) { ${COMPANY_FIELDS} } }`, { id })).company;

// Search can lag behind writes, so prefer the id already stored on the hub practice.
let company = org.shopify_company_id ? await byId(org.shopify_company_id) : null;
if (!company) {
  const named = await gql(`query($q: String!) { companies(first: 10, query: $q) { nodes { ${COMPANY_FIELDS} } } }`, {
    q: `name:'${PRACTICE_NAME}'`,
  });
  company = named.companies.nodes.find((c) => c.externalId === org.id) ?? null;
}
if (!company) {
  const createdId = userErrors(
    "create company",
    (
      await gql(
        `mutation($input: CompanyCreateInput!) { companyCreate(input: $input) { company { id } userErrors { field message } } }`,
        {
          input: {
            company: { name: PRACTICE_NAME, externalId: org.id, note: "Hub staging test data" },
            companyLocation: {
              name: "Main office",
              shippingAddress: { address1: "1 Test Street", city: "Salt Lake City", zip: "84101", countryCode: "US", zoneCode: "UT" },
              billingSameAsShipping: true,
            },
            companyContact: { email: CONTACT_EMAIL, firstName: "Test", lastName: "Practitioner" },
          },
        },
      )
    ).companyCreate,
  ).company.id;
  company = await byId(createdId);
  console.log(`Company created: ${PRACTICE_NAME}`);
}
const locationId = company.locations.nodes[0].id;
const contact = company.contacts.nodes.find((c) => c.customer?.email === CONTACT_EMAIL) ?? company.contacts.nodes[0];

// Let the contact order for the location (role assignment is idempotent enough to retry).
const role = company.contactRoles.nodes.find((r) => /admin/i.test(r.name)) ?? company.contactRoles.nodes[0];
if (contact && role) {
  const assigned = (
    await gql(
      `mutation($c: ID!, $r: ID!, $l: ID!) {
        companyContactAssignRole(companyContactId: $c, companyContactRoleId: $r, companyLocationId: $l) {
          userErrors { field message code }
        }
      }`,
      { c: contact.id, r: role.id, l: locationId },
    )
  ).companyContactAssignRole;
  const realErrors = assigned.userErrors.filter((e) => !/already|taken|exists/i.test(e.message));
  if (realErrors.length) throw new Error(`assign role: ${realErrors.map((e) => e.message).join("; ")}`);
}

// --- Catalog and price list --------------------------------------------------
const catalogs = await gql(`query($q: String!) { catalogs(first: 5, type: COMPANY_LOCATION, query: $q) { nodes { id title priceList { id } } } }`, {
  q: `title:'${CATALOG_TITLE}'`,
});
let catalog = catalogs.catalogs.nodes.find((c) => c.title === CATALOG_TITLE);
if (!catalog) {
  catalog = userErrors(
    "create catalog",
    (
      await gql(
        `mutation($input: CatalogCreateInput!) { catalogCreate(input: $input) { catalog { id title priceList { id } } userErrors { field message } } }`,
        { input: { title: CATALOG_TITLE, status: "ACTIVE", context: { companyLocationIds: [locationId] } } },
      )
    ).catalogCreate,
  ).catalog;
  console.log(`Catalog created: ${CATALOG_TITLE}`);
}
if (!catalog.priceList) {
  userErrors(
    "create price list",
    (
      await gql(
        `mutation($input: PriceListCreateInput!) { priceListCreate(input: $input) { priceList { id } userErrors { field message } } }`,
        {
          input: {
            name: `${CATALOG_TITLE} prices`,
            currency: "USD",
            catalogId: catalog.id,
            parent: { adjustment: { type: "PERCENTAGE_DECREASE", value: PLACEHOLDER_DISCOUNT }, settings: { compareAtMode: "NULLIFY" } },
          },
        },
      )
    ).priceListCreate,
  );
  console.log(`Price list created: ${PLACEHOLDER_DISCOUNT}% off retail (placeholder)`);
}

// --- Link the hub practice to the Shopify company ------------------------------
if (org.shopify_company_id !== company.id) {
  const { error } = await db.from("orgs").update({ shopify_company_id: company.id }).eq("id", org.id);
  if (error) throw new Error(`link hub practice: ${error.message}`);
}

console.log(`Hub practice ${org.id} linked to ${company.id} (location ${locationId})`);
