import type { Metadata } from "next";
import InsuranceHero from "./InsuranceHero";
import InsuranceDemoClient from "./InsuranceDemoClient";

/* Dedicated demo/pitch page for the Insurance Account Manager Bundle
   (Intake, Document Audit, CRM Logging, Renewal Reminders), built to the
   halo/demo_page_design_system Obsidian design system per the user's own
   files. Deliberately self-contained: no changes to src/app/globals.css,
   so nothing else on the site is affected by adopting this design
   language. The underlying checkout still routes through the existing
   ai-lead-capture-follow-up service (no new Whop SKU) - this page is the
   pitch, not a new priced product. */

export const metadata: Metadata = {
  title: "Insurance Account Manager Bundle Demo",
  description:
    "Four agents for independent insurance agencies: instant intake, document audit, CRM logging, and renewal reminders. No AMS access required.",
};

export default function InsuranceAiTeamDemoPage() {
  return (
    <main style={{ background: "#05060A" }}>
      <InsuranceHero />
      <InsuranceDemoClient />
    </main>
  );
}
