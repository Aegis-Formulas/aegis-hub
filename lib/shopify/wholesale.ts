import "server-only";
import { adminGraphql, assertNoUserErrors } from "./admin";

export type B2BBuyer = { companyId: string; locationId: string; contactId: string };

type CompanyQuery = {
  company: {
    id: string;
    locations: { nodes: { id: string }[] };
    contacts: { nodes: { id: string; customer: { email: string | null } | null }[] };
  } | null;
};

/**
 * The practitioner's B2B identity in Shopify: their practice's company, its location,
 * and the company contact whose email matches the signed-in person.
 * Returns null if the practice isn't linked or the person isn't a contact there.
 */
export async function findBuyer(companyId: string, email: string): Promise<B2BBuyer | null> {
  const data = await adminGraphql<CompanyQuery>(
    `query($id: ID!) {
      company(id: $id) {
        id
        locations(first: 1) { nodes { id } }
        contacts(first: 50) { nodes { id customer { email } } }
      }
    }`,
    { id: companyId },
  );
  const company = data.company;
  const location = company?.locations.nodes[0];
  const contact = company?.contacts.nodes.find((c) => c.customer?.email?.toLowerCase() === email.toLowerCase());
  if (!company || !location || !contact) return null;
  return { companyId: company.id, locationId: location.id, contactId: contact.id };
}

type PricingQuery = {
  nodes: ({ id: string; contextualPricing: { price: { amount: string; currencyCode: string } } } | null)[];
};

/**
 * Wholesale prices for one company location, as Shopify computes them from the
 * location's catalogs and price lists. Keyed by variant id.
 */
export async function wholesalePrices(locationId: string, variantIds: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  for (let i = 0; i < variantIds.length; i += 100) {
    const data = await adminGraphql<PricingQuery>(
      `query($ids: [ID!]!, $loc: ID!) {
        nodes(ids: $ids) {
          ... on ProductVariant { id contextualPricing(context: { companyLocationId: $loc }) { price { amount currencyCode } } }
        }
      }`,
      { ids: variantIds.slice(i, i + 100), loc: locationId },
    );
    for (const n of data.nodes) if (n?.contextualPricing) prices.set(n.id, Number(n.contextualPricing.price.amount));
  }
  return prices;
}

type DraftOrderCreate = {
  draftOrderCreate: {
    draftOrder: { id: string; invoiceUrl: string; totalPriceSet: { shopMoney: { amount: string } } } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

/**
 * A B2B draft order for the practice, priced by its catalog. Attribution goes on the
 * order as custom attributes (ARCHITECTURE.md > Attribution). Returns Shopify's checkout link.
 */
export async function createWholesaleDraftOrder(input: {
  buyer: B2BBuyer;
  lines: { variantId: string; quantity: number }[];
  practiceId: string;
  practitionerId: string;
}) {
  const data = await adminGraphql<DraftOrderCreate>(
    `mutation($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id invoiceUrl totalPriceSet { shopMoney { amount } } }
        userErrors { field message }
      }
    }`,
    {
      input: {
        purchasingEntity: {
          purchasingCompany: {
            companyId: input.buyer.companyId,
            companyLocationId: input.buyer.locationId,
            companyContactId: input.buyer.contactId,
          },
        },
        lineItems: input.lines,
        tags: ["aegis-hub", "wholesale"],
        customAttributes: [
          { key: "practice_id", value: input.practiceId },
          { key: "practitioner_id", value: input.practitionerId },
          { key: "order_type", value: "wholesale" },
        ],
      },
    },
  );
  assertNoUserErrors("draft order", data.draftOrderCreate.userErrors);
  const draft = data.draftOrderCreate.draftOrder!;
  return { id: draft.id, checkoutUrl: draft.invoiceUrl, total: Number(draft.totalPriceSet.shopMoney.amount) };
}
