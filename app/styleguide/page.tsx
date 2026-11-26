import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Demo } from "./Demo";

export const metadata: Metadata = { title: "Styleguide · Aegis Hub" };

/** Internal preview of the design system. Hidden on the production deployment. */
export default function StyleguidePage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <Demo />;
}
