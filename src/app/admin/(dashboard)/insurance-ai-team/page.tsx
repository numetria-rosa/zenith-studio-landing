import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import InsuranceAiTeamClient from "./InsuranceAiTeamClient";

/* Test harness for the 3 new Insurance Account Manager Bundle agents
   (Document Audit, CRM Logging, Renewal Reminders) - see the header
   comment on the InsurancePolicy/InsuranceCrmLogEntry models in
   schema.prisma. Intentionally standalone, not wired into a real
   ServiceProject yet; this is for trying the agents before pitching them
   to a signed client. */
export default async function InsuranceAiTeamPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Insurance AI team</h1>
      <p className="mt-1 text-sm text-white/50">
        Front-office agents for the Insurance Account Manager Bundle. Intake (texting new leads) already runs on the
        existing AI Lead Capture service - these three are the rest of the bundle: Document Audit, CRM Logging, and
        Renewal Reminders.
      </p>
      <InsuranceAiTeamClient />
    </div>
  );
}
